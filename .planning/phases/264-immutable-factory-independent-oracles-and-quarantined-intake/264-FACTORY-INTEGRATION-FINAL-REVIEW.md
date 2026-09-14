---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-current-integration-final-review
checked: 2026-09-14
status: gaps_found
focused_tests: 39/39 passed
open_gaps: 3
---

# Phase 264 Factory Integration Final Review

Bounded source review only. The focused tests use injected runtimes and data-only fixtures; no guest, Match, provider, network, installation, or generated-source execution was used. This review does not certify Plan 05 completion.

## Evidence checked

- `packages/strategy-lab/src/factory/fingerprint.ts`, `admission.ts`, `intake.ts`
- `scripts/ingest-v1-38-factory-packet.ts`
- `scripts/run-v1-38-factory-calibration.ts`
- `scripts/lib/v1-38-factory-supervised-runtime.ts`
- `packages/strategy-lab/src/factory/calibration.ts`
- Focused fingerprint, admission, intake, ingestion, adapter, and runner tests

Focused command result: **6 files, 39 tests passed**.

## Positive/negative path checks

| Check | Result | Evidence |
|---|---|---|
| Genuine named-producer evidence | PASS (source mechanics) | The real CLI path is detected when no test hooks are supplied and calls `createAuthorizedFactoryFingerprintEvidence` with the retained ingestion artifact and manifest root. That constructor reopens the authorized manifest and producer record, binds producer identity/origin/packet/source/proposal roots, and rejects caller-only `real_producer` records. Hooked tests remain `mechanics_only`. |
| Paired receipt binding | PASS (API mechanics) | `deriveFactoryFingerprints` accepts only issued supervision receipts, rejects duplicate receipt roots, and derives matchup commitments from each receipt’s snapshotted matchup and execution. |
| Lineage/dependency parsing | PASS (API mechanics) | Optional lineage manifests are re-rooted, candidate/proposal descriptors are parsed, graph closure is checked, and locked dependency source/package manifests are recursively parsed with exact edge/content roots. |
| Human intake reopen | PASS (mechanics) | `reopenAcceptedQuarantinedIntakePacket` validates source/provenance/reviewer/review disposition and matches exactly one prior accepted external ledger record plus accounting; it calls common admission without charging or creating another ledger record. Invalid protocol input produces an immutable non-authorizing blocked artifact with `attemptRoot: null`. |
| Prior adapter gap | RESOLVED | `FactorySupervisedRuntimeOptions` now omits benchmark lifetime, observer harness, transport, and stream factory fields, and the adapter rejects those properties at runtime before creating the selected runtime (`scripts/lib/v1-38-factory-supervised-runtime.ts:13-30`). |

## Concrete integration gaps

1. **The real runner does not provide verified lineage/dependency manifests.** `scripts/run-v1-38-factory-calibration.ts:163-180` creates only one proposal-root lineage graph node and one source-root dependency graph node, then calls `deriveFactoryFingerprints` without `lineageManifestArtifactRoot` or `dependencyManifestArtifactRoot`. Every real CLI candidate therefore receives `lineage_parent_artifacts_unverified` and `recursive_dependency_manifest_unverified`; the newly implemented authentic parsers are not reachable from the supported run path.

2. **The real runner does not produce paired counterfactual receipts.** The same call site passes only the current receipt; `pairedSupervisionReceipts` defaults to `[receipt]`, so the receipt necessarily includes `paired_counterfactual_unavailable`. The API can verify pairs, but no CLI workload/setup creates or forwards a second issued supervision receipt.

3. **Calibration corpus/workload is descriptive rather than executable.** `FACTORY_CALIBRATION_CORPUS` in `packages/strategy-lab/src/factory/calibration.ts:16-32` contains case labels, expected relations, and no source variants, legal workload inputs, pair definitions, or retained observation roots. The runner’s `defaultPlan` uses one canonical smoke arena and one fixed inert opponent (`scripts/run-v1-38-factory-calibration.ts:92-96`), so the supported run cannot materialize the declared semantic rewrites, selector variants, symmetry/opaque-ID cases, near-identical behavior, latent divergence, or false-positive calibration cells.

## Disposition

Producer authorization, receipt identity, human-intake reopen, and the selected-runtime hardening are present and focused tests pass. The three integration gaps above remain actionable: they prevent the real calibration path from supplying complete lineage/dependency evidence, paired counterfactual evidence, or the declared corpus workloads. No new external authority or certification gate is inferred; the report is limited to missing code wiring.

_Independent bounded source review; no source edits or commit performed._
