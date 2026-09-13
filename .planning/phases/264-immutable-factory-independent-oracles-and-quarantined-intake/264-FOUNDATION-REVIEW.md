---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-13T22:52:33Z
depth: deep
files_reviewed: 12
files_reviewed_list:
  - packages/strategy-lab/src/factory/contracts.ts
  - packages/strategy-lab/src/factory/identity.ts
  - packages/strategy-lab/src/factory/ledger.ts
  - packages/strategy-lab/src/factory/repository.ts
  - packages/strategy-lab/src/factory/admission.ts
  - packages/strategy-lab/src/factory/index.ts
  - packages/strategy-lab/src/factory/contracts.test.ts
  - packages/strategy-lab/src/factory/identity.test.ts
  - packages/strategy-lab/src/factory/ledger.test.ts
  - packages/strategy-lab/src/factory/repository.test.ts
  - packages/strategy-lab/src/factory/admission.test.ts
  - packages/strategy-lab/package.json
findings:
  critical: 4
  warning: 2
  info: 0
  total: 6
status: issues_found
---

# Phase 264: Foundation Code Review Report

**Reviewed:** 2026-09-13T22:52:33Z
**Depth:** deep
**Files Reviewed:** 12
**Status:** issues_found

## Summary

The factory’s direct schema, identity, repository, ledger, admission, and package-export closure were reviewed against FACT-05 through FACT-07 and Plan 264-01. The focused factory suite passes (5 files, 9 tests), as does `tsc -b packages/strategy-lab`, but the passing tests leave core authorization, durability, and source-to-provider binding unproved. The current implementation can accept a candidate whose source and provenance conflict with its packet, and it does not make the supervised provider execute that accepted candidate.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Admission accepts a proposal/candidate that contradicts its authoritative packet

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/contracts.ts:94-104`, `packages/strategy-lab/src/factory/admission.ts:15-17`

**Issue:** `FactoryProposalSchema` treats `packetRoot` as an unverified reference and permits every copied provenance field to differ from the packet. `admitFactory` only checks the proposal’s packet root plus lane language/provider ID; it does not compare source identity, build/toolchain/tuple, versions, oracle/doctrine family, split, full lane, or lineage with the parsed packet. It also permits `candidate.lineage` to differ from `proposal.lineage`. The existing passing admission test demonstrates the flaw: it passes the original packet at line 11, creates a proposal from a modified packet-shaped value with a different source at line 12, and admission succeeds at line 15. This produces an immutable root chain with mutually contradictory provenance, violating FACT-05/D-07/D-08 rather than rejecting hostile metadata.

**Fix:** Build a proposal only from a parsed packet (or validate a complete projection before deriving/accepting its root), and require `candidate.lineage` to equal the proposal lineage. In `admitFactory`, compare every packet-bound field before source-byte publication, for example:

```ts
if (!sameFactoryProjection(candidate.proposal, packet) ||
    !sameFactoryLineage(candidate.lineage, candidate.proposal.lineage)) {
  throw new TypeError("FACTORY_ADMISSION")
}
```

Add negative tests for source, build, tuple, versions, doctrine/oracle, split, full lane, and each lineage edge; the current success fixture must be changed to use a packet whose root is recomputed from the same source identity.

### CR-02: The supervision seam does not bind the provider to the admitted candidate or source

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/admission.ts:14-25`, `packages/strategy-lab/src/runtime-bridge.ts:40-42`

**Issue:** `admitFactory` only validates and optionally stores bytes; it neither invokes nor returns an authorization for supervision. `superviseFactory` takes only the generic `runCanonicalLabMatch` input, which has no candidate, admitted source root, native lane, or factory packet/validation root. The runtime bridge accepts a provider when revision ID and shared tuple/image/limit pins match, but never compares `LabRuntimeIdentity.sourceRoot` to the factory candidate. A caller can therefore admit candidate A and run a provider for unrelated source B while reporting the resulting execution as A’s factory evidence. This breaks the required exact hostile-source path and the “same authorized candidate reaches the selected supervision” guarantee in FACT-07/D-03/D-10.

**Fix:** Make supervision accept a validated `FactoryAdmission`/candidate authorization and bind it to provider issuance. Require the provider identity’s `sourceRoot`, exact native lane/runtime profile, and immutable validation/candidate roots to equal that authorization before every invocation; reject rather than map any mismatch. Have the orchestration API return one root-bound execution receipt that `mapFactorySupervision` consumes. Add an integration test that attempts to supervise a different source root or provider/lane after a successful admission and expects a pre-execution rejection.

### CR-03: “Durable” attempt charges are not durable across a crash

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/repository.ts:20-22`, `packages/strategy-lab/src/factory/repository.ts:30`

**Issue:** `recordFactoryAttemptStart` considers a charge complete once `atomic` returns. `atomic` fsyncs the temporary file before `linkSync`, but never fsyncs the containing directory after adding the hard-link name. A power loss after `linkSync` can lose the directory entry even though the caller has proceeded to validation/supervision. That violates the charge-before-work durability guarantee: the work may have occurred with no persisted start to which a terminal can be attached.

**Fix:** After successfully linking the immutable target (and after unlinking the temporary name), open the already-validated repository directory and `fsyncSync` it before returning. Handle directory-sync failure as a failed publication and do not permit work to start. Add a fault-injection seam/test that proves supervision cannot proceed until both file content and directory-entry durability steps have completed.

### CR-04: Hostile packet schemas accept unpinned runtime and inherited-authority identities

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/contracts.ts:44-57`, `packages/strategy-lab/src/factory/contracts.ts:67-70`

**Issue:** The schema merely checks that `compatibilityTupleRoot` and `runtimeProfileRoot` look like hashes and that ABI/algorithm are bounded strings. It never binds them to the inherited admitted authority (`LAB_ADMITTED_ROOTS`/`LAB_VERSIONS`) or to an explicitly supplied, trusted immutable successor record. Consequently a packet with an arbitrary tuple/runtime-profile hash and arbitrary algorithm is accepted once its self-derived root is recomputed. This was reproduced with `compatibilityTupleRoot` and `runtimeProfileRoot` set to `sha256:` plus 64 nines and `algorithm: "unapproved-algorithm"`; `FactoryOraclePacketSchema.parse` accepted it. The fixture’s use of admitted roots does not enforce the production path. FACT-05/D-01 require the actual predecessor/runtime contract to be mandatory, not self-attested metadata.

**Fix:** Add an explicit immutable inherited-authority object (or exact fields) to the packet and require equality with the approved tuple/runtime/version pins for this phase. If future profile/version changes are legitimate, validate their roots against a supplied trusted registry/authorization record before parsing a candidate; do not accept arbitrary root-shaped strings. Add tests that recompute a packet root after replacing each pin and verify rejection.

## Warnings

### WR-01: Root-only artifact reads construct paths from an unvalidated runtime value

**Classification:** WARNING

**File:** `packages/strategy-lab/src/factory/repository.ts:12`, `packages/strategy-lab/src/factory/repository.ts:29`

**Issue:** `readFactoryArtifact` accepts `LabRoot`, but that type disappears at runtime, and `artifactName` slices it without validating its 64-hex digest. A caller can pass `sha256:../../../../escaped`; `join` then resolves the supposed repository artifact path to `/escaped.bin`. The later digest comparison rejects the result, so this is not currently an artifact-content disclosure, but it does perform an out-of-repository read and defeats the stated root-only/no-escape filesystem boundary.

**Fix:** Validate `id` with the strict `^sha256:[0-9a-f]{64}$` predicate before deriving any filename, and construct the name only from the validated 64-character digest. Add traversal and symlink-race regression tests.

### WR-02: A crash can leave a predictable temporary name that prevents conservative recovery

**Classification:** WARNING

**File:** `packages/strategy-lab/src/factory/repository.ts:20-22`, `packages/strategy-lab/src/factory/repository.ts:35`

**Issue:** Every publication uses the fixed `${target}.tmp` name. If the process crashes after creating it, later `openSync(...O_EXCL)` fails with `EEXIST`; meanwhile resume silently skips all `.tmp` files. A charged attempt with a terminal temporary file can thus remain permanently start-only/uncertain and cannot publish its required system-failure terminal without manual filesystem intervention. The resume test covers malformed terminal bytes, not interrupted temporary publication.

**Fix:** Use a unique temporary filename for each publication and clean only validated, repository-owned stale files under a documented recovery rule (or surface them as explicit uncertain evidence and permit a fresh terminal publication). Add a crash-recovery test with a pre-existing target `.tmp` file and verify that the attempt reaches exactly one terminal disposition without overwriting content.

---

_Reviewed: 2026-09-13T22:52:33Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
