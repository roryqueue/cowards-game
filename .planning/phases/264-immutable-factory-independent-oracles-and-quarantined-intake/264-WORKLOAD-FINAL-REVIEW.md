---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-workload-integration-final-review
checked: 2026-09-14
source_commit: 931777a2
status: gaps_found
focused_tests: 6/6 passed
open_gaps: 1
---

# Phase 264 Workload Integration Final Review

Bounded source/mechanics review only. The focused tests use injected runtimes and data-only records; no actual workload, Match, guest, provider, network, installation, or historical selector was run.

## Evidence checked

- `packages/strategy-lab/src/factory/calibration.ts`
- `scripts/prepare-v1-38-factory-calibration.ts`
- `scripts/run-v1-38-factory-calibration.ts`
- `scripts/run-v1-38-factory-calibration.test.ts`

Focused command:
`./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-factory-calibration.test.ts packages/strategy-lab/src/factory/calibration.test.ts` — **2 files, 6 tests passed**.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Workload authorization and manifest binding | PASS (mechanics) | Preparation requires canonical workload artifact roots in the authorization, admits each workload, binds it to an authorized ingestion, caps workload budgets against allocation limits, and carries exact workload refs into the manifest. Runner rechecks authorization, protocol, allocation, ingestion, workload root, pair group, and budget bindings before work. |
| Charge and terminal ordering | PASS | Each workload publishes accounting and records its attempt start before retained ingestion/source validation/runtime work. A terminal is persisted for each execution before the pairing/fingerprinting pass begins; pairing cannot rewrite a charged terminal. |
| Default workload setup | PASS (mechanics) | The no-hook default builds the declared canonical arena/seed/side/initial-initiative/max-phase match and the fixed mechanics opponent whose identity root is rederived and checked. Workload budgets are forwarded to the selected adapter. |
| Pairing constraints and duplicate rejection | PASS (mechanics) | Pair groups require exactly two distinct issued receipts, same candidate/proposal/ingestion/arena/seed/side/opponent/budget and opposite initial-initiative values; receipt matchup roots are checked against the actual match. Fingerprint derivation rejects duplicate receipt roots. |
| Graph-root forwarding | PASS (mechanics) | Each pending workload forwards its optional lineage/dependency manifest roots into `deriveFactoryFingerprints`; absent roots remain explicitly unverified rather than fabricated. |
| Candidate finalization and fixture status | PASS (mechanics) | Pairing creates each candidate from the exact receipt fingerprints and calls the issued-receipt finalizer. Real no-hook paths use authorized producer evidence; injected hooks use mechanics-only evidence. All final candidates remain unresolved/quarantined and readiness remains `not_ready`. |

## Concrete gap

1. **Pair-group equality omits the graph manifest roots.** In `scripts/run-v1-38-factory-calibration.ts:225-230`, the pairing predicate compares candidate ingestion, proposal, pair axis, arena, seed, side, max phases, opponent, and budget, but does not compare `lineageManifestArtifactRoot` or `dependencyManifestArtifactRoot`. Two workloads in one pair group can therefore pair opposite-initiative receipts while using different retained lineage/dependency graphs; each candidate then receives a different six-dimensional graph basis despite the pair being accepted. Include both optional graph roots in the exact-pair equality (including null-vs-root distinction) before marking the group paired.

## Disposition

The new workload path correctly binds authorization, charges and terminals before pairing, forwards graph roots, rejects duplicate receipts, and preserves unresolved fixture semantics. The graph-root omission is the one actionable integration defect found in this bounded review.

_Independent bounded workload review; no source edits or commit performed._
