---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-task-01-fingerprint-readiness-recheck
checked: 2026-09-14
status: passed
targeted_test: 18/18 passed
open_gaps: 0
recheck_of: 264-FINGERPRINT-READINESS-CHECK.md
---

# Phase 264 Fingerprint Readiness Recheck

This is a bounded source/mechanics recheck after the fingerprint repair. It verifies fail-closed provenance and quarantine behavior; it does not establish genuine producer evidence, independence, candidate quality, or empirical results. No generated source, guest, Match, provider, network, or historical execution was used.

## Evidence checked

- `packages/strategy-lab/src/factory/fingerprint.ts`
- `packages/strategy-lab/src/factory/fingerprint.test.ts`
- `packages/strategy-lab/src/factory/admission.ts`
- `packages/strategy-lab/src/factory/contracts.ts`
- `packages/strategy-lab/src/factory/ledger.ts`
- Prior `264-FINGERPRINT-READINESS-CHECK.md`

Targeted command:
`./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/admission.test.ts packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/ledger.test.ts`

Result: **4 files and 18 tests passed** in 9.14 seconds.

## Recheck disposition

| Check | Result | Evidence |
|---|---|---|
| Caller labels, cloned evidence, and re-rooted records cannot become genuine evidence | PASS (mechanics) | `createFactoryFingerprintEvidence` accepts only `mechanics_only` evidence with `producerArtifactRoot: null`; the exact frozen object is retained in a `WeakSet`. Derivation requires that exact issued object, the matching canonical evidence artifact root, and the proposal/validation/supervision bindings. A structural clone and `real_producer` record are rejected. |
| Actual producer/supervision receipt binding | PASS (mechanics) | Derivation requires an issued supervision receipt, re-reads the admitted source/packet/proposal/validation artifacts, checks their cross-roots, validates each paired supervision receipt, and derives the matchup commitment from issued receipt execution commitments rather than caller matchup metadata. |
| Lineage/dependency/comparison dimensions are not falsely promoted | PASS (quarantine mechanics) | Lineage and dependency graph-node artifacts are canonical, root/link checked, and cycle/incompleteness checked, but their parent artifacts and recursive manifests remain explicitly `unverified`; matchup metadata remains explicitly `paired_matchup_metadata_unverified`. The receipt always includes these reasons and is `status: "unresolved"`, `quarantined: true`, so these mechanics fixtures cannot masquerade as affirmative independence evidence. |
| Finalizer cannot promote unresolved evidence | PASS (mechanics) | `requireIssuedFactoryIndependenceReceipt` requires exact issued receipt identity/root. `finalizeFactoryCandidate` additionally requires accepted issued supervision, exact stage roots, matching candidate fingerprints and lineage, then returns `independenceStatus: "unresolved"`. |
| Source structure preserves semantic keys | PASS (mechanics) | TypeScript AST normalization still ignores cosmetic trivia/local binding renames while retaining property access, property/method names, shorthand property keys, and object-binding keys. The focused regression covers both shorthand and destructuring renames. |
| Byte/domain identity and privacy | PASS (mechanics) | Source bytes are SHA-256 bound to the admitted source root; source structure, ordered records, graph links, and receipts use explicit `labRoot` domains. Safe projections remove strategy/soldier memory, objective/private payload, source, diagnostics, host, and evaluator keys before fingerprinting; the test asserts those values do not appear in the derived receipt. |
| Large record commitment | PASS (mechanics) | Ordered records are independently hashed and linked by ordinal/previous roots; the existing 4,096-record regression remains green without a monolithic canonical envelope. |

## Historical findings and current limits

The prior three evidence-origin findings are closed as **fail-closed contract mechanics**, not as proof that the corresponding evidence is genuine:

1. Caller-published lineage/dependency graph nodes are now canonical and bound to the issued evidence artifact, while recursive parent/dependency manifests intentionally remain unresolved and are named in the receipt reasons.
2. Caller matchup/counterfactual metadata no longer determines the matchup fingerprint; issued supervision receipt execution commitments do. Caller-authored supporting metadata remains quarantined and cannot produce an independent status.
3. Evidence issuance is now an exact issued-object/artifact seam, and real-producer evidence is rejected at this boundary. A future producer proof may populate the seam; this recheck does not require or fabricate one.

The six dimensions therefore exist as deterministic roots, but lineage, recursive dependency, calibration, and matchup metadata are deliberately **unverified**. This is source-contract progress only; it is not affirmative independence evidence or a certification of any candidate.

_Independent bounded recheck; no source edits or commit performed._
