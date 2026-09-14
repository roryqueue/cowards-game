---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-task-01-fingerprint-readiness
checked: 2026-09-14
source_commit: 9e19278d
status: gaps_found
targeted_test: 17/17 passed
score: 0/2 must-have truths fully verified
open_gaps: 3
---

# Phase 264 Plan 05 Fingerprint Readiness Check

This is a bounded Task 1 source/mechanics review. No generated source, guest, Match, provider, network, historical selector, or empirical candidate evidence was used. Green fixtures prove mechanics only.

## Evidence checked

- `packages/strategy-lab/src/factory/fingerprint.ts`
- `packages/strategy-lab/src/factory/fingerprint.test.ts`
- `packages/strategy-lab/src/factory/admission.ts`
- `packages/strategy-lab/src/factory/admission.test.ts`
- `packages/strategy-lab/src/factory/contracts.ts`
- `packages/strategy-lab/src/factory/ledger.ts`
- Plan 05 and Phase 264 context

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/admission.test.ts packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/ledger.test.ts` — **17 tests passed**.

## Goal-backward truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Every candidate’s six fingerprint dimensions are derived from immutable, complete repository/supervision evidence rather than caller labels or hashes. | **FAILED** | Source structure is rederived from admitted source bytes; legal-input and Chronicle projections are derived from an issued supervision receipt; ordered descriptor chains preserve large record sets without one aggregate canonical envelope. But lineage, dependency, and matchup roots are derived directly from caller-authored `evidenceArtifactRoot` records. Those graphs/responses are only shape/root/graph checked and are not linked to repository candidate/parent/dependency artifacts or issued supervision records. Authorship, counterfactual, clone, and failure evidence is likewise caller-authored metadata. |
| 2 | Borderline, missing, conflicting, or otherwise unsupported independence evidence remains unresolved/quarantined and cannot be promoted by finalization. | **PASS (mechanics, with evidence-origin gaps above)** | The receipt is always `status: "unresolved"` and `quarantined: true`; missing traces, incomplete/cyclic graphs, borderline pairs, mechanics-only evidence, absent accepted failure mode, and claimed-root mismatch add reasons. `finalizeFactoryCandidate` requires the exact issued receipt identity, exact proposal/validation/supervision roots, and exact derived fingerprints; a structural clone is rejected. |

## Passing mechanics

| Check | Result | Evidence |
|---|---|---|
| Source-structure derivation | PASS (mechanics) | TypeScript AST tokenization preserves control flow, operators, literals, and semantic property/API identifiers while normalizing trivia/local bindings; cosmetic rewrite tests pass. |
| Issued supervision linkage | PASS (mechanics) | `isIssuedFactorySupervisionReceipt` requires the weak-set-issued receipt and recomputed root; packet/proposal/validation roots and supervision receipt root are cross-bound before fingerprint derivation. |
| Legal/Chronicle privacy projection | PASS (mechanics) | Receipt traces provide request/decision projections and execution transitions; recursive projection removes strategy/soldier memory, objective, private payload, source, host, evaluator, and diagnostics keys before rooting. |
| Large execution commitments | PASS (mechanics) | `deriveFactoryOrderedRecordDescriptor` hashes each ordered record and links ordinal/previous roots; the focused 4,096-record test demonstrates reordering sensitivity without monolithic canonicalization. |
| Candidate finalizer binding | PASS (mechanics) | Finalization requires exact issued independence receipt, matching proposal/validation/supervision roots, matching fingerprints, valid candidate schema, and persists a private descriptor whose status remains unresolved. |

## Concrete gaps

1. **Lineage/dependency roots are not repository-derived.** `deriveFactoryFingerprints` accepts `evidence.lineageNodes` and `evidence.dependencyNodes` from a caller-published evidence artifact, then only checks node shape, duplicate roots, missing links, and cycles. It never reads or validates the referenced immutable candidate/parent/dependency artifacts, locks, package graph, or source-manifest closure. A complete fabricated graph can therefore produce a plausible `lineageRoot` or `dependencyRoot`.

2. **Matchup/correlation evidence is not tied to issued supervision.** `matchupResponseRoot` and `counterfactualCorrelationRoot` are derived from caller-supplied `matchupResponses`/`counterfactualPairs`; no condition, opponent, response, or pair root is checked against `receipt.execution`, `receipt.traces`, a retained matchup record, or an issued comparison artifact. `evidenceClass: "real_producer"`, `producerIdentity`, `authorshipRoots`, and `failureModes` are also accepted as canonical labels/roots without an issued producer proof. The result remains unresolved, but these fields cannot support a genuine independence claim as written.

3. **Evidence-artifact issuance is not restricted to a producer/receipt-bound seam.** `deriveFactoryFingerprints` accepts any repository artifact root whose contents happen to bind proposal, validation, and supervision roots. There is no weak-set-issued evidence receipt or repository record proving the artifact was produced by the declared producer and from the declared immutable inputs. Add an issued evidence-construction/validation seam, or explicitly classify these dimensions as unverified mechanics rather than evidence.

## Scope boundary

This review covers Plan 05 Task 1 only; it does not certify Task 2 ingestion/calibration or Task 3 static boundary monitoring. A valid private candidate is distinct from affirmative independence, league, or counted status. The current finalizer correctly keeps the candidate unresolved, but the three evidence-origin gaps must close before six-dimensional fingerprints can support an independence gate.

_Independent bounded review; no source edits or commit performed._
