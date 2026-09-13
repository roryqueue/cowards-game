---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-13T23:12:08Z
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
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 264: Foundation Code Review Report

**Reviewed:** 2026-09-13T23:12:08Z
**Depth:** deep
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This re-review covers the repaired foundation at `6aa9d349` and supersedes the prior six findings retained in `6d103482`. The prior packet-projection, inherited-authority, durable-directory-sync, strict-root-path, and temporary-recovery defects are repaired and covered by the focused suite. However, the new staged API does not enforce its final two stages: it can publish a candidate or classify a fabricated receipt without any issued supervised execution, and it cannot attribute a player violation to the authorized candidate rather than the opponent.

Verification run locally: `vitest run --maxWorkers=1` over all five scoped factory test files passed (15 tests, 3.84s); `tsc -b packages/strategy-lab` exited successfully.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Final candidate and accepted supervision evidence can bypass the issued supervision receipt

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/admission.ts:57-67`, `packages/strategy-lab/src/factory/admission.ts:85-91`, `packages/strategy-lab/src/factory/admission.ts:102-117`

**Issue:** `supervisionAdmissions` is populated by `authorizeFactorySupervision` at line 57, before `superviseFactory` runs. `finalizeFactoryCandidate` only checks that authorization set at line 62, so it publishes a fingerprinted candidate without requiring a supervision receipt or any execution. Separately, `mapFactorySupervision` verifies only a recomputable content root; it has no issued-receipt membership check. A caller can therefore create an object-shaped completed execution, calculate `labRoot("factory-supervision-receipt-v1", { authorizationRoot, execution })`, and receive `accepted` without calling a provider. Direct focused reproduction returned both `finalizedWithoutSupervision true` and `fabricatedReceipt accepted`.

This breaks the promised sequence `admitFactory -> authorizeFactorySupervision -> superviseFactory receipt -> finalize`, permits root-shaped evidence to stand in for actual hostile-source supervision, and violates FACT-07/D-03/D-04.

**Fix:** Register the receipt object in a private `WeakSet` only after `superviseFactory` returns from the trusted bridge. Require that registered receipt—not merely the pre-execution authorization—in both `mapFactorySupervision` and `finalizeFactoryCandidate`; finalization should reject non-success receipts and bind its trace/fingerprint evidence to the receipt root. Add regression tests that direct finalization after authorization and a recomputed structural receipt both throw before any candidate is published or classified.

### CR-02: Candidate supervision is not tied to a Match participant, and disposition includes opponent violations

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/factory/admission.ts:87-91`, `packages/strategy-lab/src/factory/admission.ts:97-117`

**Issue:** `candidatePlayerId` is only used as a key into `input.providers`; it is never required to equal `input.match.bottomPlayerId` or `topPlayerId`. Thus `superviseFactory` can return a receipt for a bound provider under a detached key that the Match never invokes. Also, `FactorySupervisionReceipt` does not retain the candidate player/identity, and `mapFactorySupervision` marks the candidate `player_violation` when *any* accounting entry has a violation. An opponent’s invalid output is consequently attributed to the admitted candidate. A focused no-Match reproduction with `candidatePlayerId: "detached"` returned a receipt despite a Match with only `bottom`/`top`; a receipt containing only an opponent violation mapped to `player_violation`.

This violates exact candidate source/lane supervision and the required three-way candidate disposition semantics in FACT-07/D-03/D-04/D-10.

**Fix:** Reject a candidate player ID unless it is one of the Match’s two participant IDs. Record the bound candidate player ID and exact provider identity in the issued receipt, require that the provider was actually invoked, and classify only that provider’s accounting entries. Treat any Match-level system failure as system failure, but do not turn an opponent player violation into the candidate’s disposition. Add tests for a detached provider key and a valid candidate paired with an opponent player violation.

---

_Reviewed: 2026-09-13T23:12:08Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
