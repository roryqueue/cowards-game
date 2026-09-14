# Phase 264 Fresh Route Research Addendum

**Date:** 2026-09-14  
**Scope:** implementation-ready design only; no model request, source generation, probe, guest, Match, or empirical workload was run.

## Decision and hard limits

The adopted Plan 07 decision authorizes a prospective route, not a readiness pass: at most four model-authoring attempts (corrections included) in 30 minutes, at most 48 fresh supervised development workloads in 90 minutes, all three automated mechanisms retained, and human/external intake unused with zero submissions and effort. Old-ruleset local Strategies remain excluded. Failures, duplicates, retries, invalid packets, and system failures remain charged; no favorable-cell selection or forced pass is allowed. These ceilings are from `264-READINESS-DECISION.md`, not a promise that all attempts or workloads will succeed.

The existing runner is suitable for bounded evidence collection but not for a readiness claim. `run-v1-38-factory-calibration.ts` persists starts and terminals before pairing, derives six fingerprint roots from retained supervised receipts, and always writes `not_ready` with `calibration_thresholds_not_frozen`. `createFactoryCalibrationReport()` remains threshold-free (`thresholds: null`), and the current six-case corpus is explicitly `mechanics_only` with `independence: unresolved`. A source-backed run therefore needs a small assessment/freeze seam before it can produce a defensible development threshold artifact.

## Recommended finite workload

Use six source-pair control cases, each with two source artifacts (left/right). Run every source artifact under two development condition blocks, and in each block run both candidate and opponent initial initiative:

| Unit | Count | Workloads |
|---|---:|---:|
| Source-pair cases | 6 | — |
| Source artifacts per case | 2 | — |
| Condition blocks per artifact | 2 | — |
| Initiative cells per block | 2 | — |
| Total | 12 source artifacts × 4 cells | **48 workloads** |

Each pair must use the same arena, seed, side, fixed-mechanics opponent, budget, and graph roots within a condition block; only initial initiative changes. The current schema supports this shape (`pairAxis: initialInitiative`, `maxPhases: 1`) and the runner requires exactly two opposite-initiative entries per pair group. A missing or failed cell remains an explicit terminal/unfilled outcome and prevents threshold freeze.

The six controls should retain the existing categories, but with actual source bytes and supervised receipts rather than projection-only strings:

1. semantic rewrite — expected correlated;
2. shared-selector variant — expected correlated;
3. symmetry/opaque-ID variant — expected correlated;
4. near-identical behavior — expected borderline/unresolved;
5. latent behavioral divergence — expected distinct;
6. expected false positive — expected borderline/unresolved.

Do not manufacture these labels from hashes or cosmetic metadata. Emit each control through a declared producer or a dedicated private calibration-control artifact, validate it with the same hostile source path, and mark control evidence `mechanics_only` so it cannot become a candidate, finalist, or independence proof. Preserve at least one tactical, one teacher/distiller, and one model-produced packet in the retained set. Four model attempts are the outer cap; a correction consumes one of the four. If enough source-backed controls cannot be assembled without reusing a source or inventing provenance, stop with unresolved calibration rather than filling cells.

The fixed opponent and one-phase workload are development observation instruments only. They can produce legal-input, Chronicle-behavior, and paired matchup-response traces; they are not competitive evidence, current-league strength, response admission, or balance evidence. No later league, holdout, formation, public, counted, or production artifact is authorized here.

### Balanced execution window

Freeze the manifest/disclosure before either empirical clock starts. Authoring has30minutes from its first charged attempt; supervised collection has90minutes from its first workload. Implementation and review time are separate, not model/run allocation. Twelve source artifacts × two condition blocks × two initiatives is48workloads. The two condition blocks must be concrete before output, including an honest statement that they are not a full arena×side factorial design; do not claim separately identified arena/side effects. This pilot can support development control calibration only, not statistical independence or competitive strength. Require each of the three mechanisms to appear in the source set and cross-mechanism observations; package coverage alone does not satisfy D-19. The plan must bind exact controlled source-generation/transformation rules, ground-truth rationale, tactical/teacher/model slot mapping, actual observation comparisons and an affirmative evidence route for D-19, not defer those choices until outputs are visible.

## Smallest source changes

1. Add a private source-backed calibration-case artifact that binds case kind/expected relation to exact left/right packet/source roots, producer identities, condition-block roots, and the retained receipt roots. Do not embed source text in the assessment report and do not mutate candidate artifacts.
2. Add an assessment function/script that consumes only retained private artifacts and emits bounded aggregate signals for all six dimensions: source structure, lineage, dependency, legal-input decisions, Chronicle behavior, and matchup response. Keep raw source, memory, objectives, host data, and private diagnostics out of the report. The current roots-only `FactoryFingerprintRoots` are identities, not sufficient numeric calibration signals; add privacy-safe per-dimension agreement/count summaries rooted to the exact receipts.
3. Add a versioned threshold artifact and report state. Freeze thresholds only when all non-borderline positive/negative controls meet the declared rule, every borderline control remains `unresolved`, every required workload is accounted for, and the independent source review passes. Any missing cell, misclassification, system failure, or ambiguous control leaves readiness unresolved. Threshold roots must bind the six-case corpus, source/receipt roots, assessment implementation, and measurement/study policy roots.
4. Keep the existing runner’s charge-first and terminal-retention ordering. Add no fallback that converts a failed receipt into gameplay evidence. The runner’s final readiness must consume the assessment result rather than unconditionally writing `not_ready`; absent a valid threshold artifact it must retain the current fail-closed state.

## Threshold and independence rule

Use a deterministic, development-only rule: the three positive controls must classify as correlated; the latent-divergence control must classify as distinct; the near-identical and expected-false-positive controls must remain borderline/unresolved. Select any numeric cutoffs only from these labeled controls, freeze them before interpreting unlabeled cross-mechanism observations, and retain the complete control/error table. Six cases cannot support a general statistical claim; the resulting artifact is a versioned Phase 264 development calibration, not a claim of universal clone detection or strategic independence.

Independence remains unresolved until the source, dependency, lineage, legal-input, Chronicle, matchup, authorship, and failure-mode evidence agree. A separate package name, provider label, model label, or duplicate tactical emission is not sufficient. Repeated identical outputs should be retained as duplicate/correlated evidence, not counted as additional independent mechanisms.

## Model authoring isolation and provenance

Run authoring outside Match/search execution in four isolated, non-interactive authoring contexts at most. Each context receives only the disclosed current-rules/Strategy ABI packet and task instructions. It must not read repository source, old-rules submissions, other oracle cores, private results, holdout material, secrets, or evaluator state. Use the installed authenticated Codex CLI’s non-interactive JSON mode with isolated/no-user-config/ephemeral context controls as documented at [official non-interactive mode documentation](https://learn.chatgpt.com/docs/non-interactive-mode); this research performed no authoring request or availability probe.

Retain, privately and content-addressably, the exact submitted prompt/context, requested and reported model identifiers, client version and settings, request/response records, emitted source bytes/hash, and actual returned token/time usage from the completion event. Record an explicit `servingSnapshot: unavailable` state when the internal serving snapshot is not disclosed. Never invent an exact snapshot, equate client version with model snapshot, silently substitute a model, or claim regeneration of identical model output/weights.

The current `FrozenModelBundle` and `FactoryOraclePacket` schemas require one non-empty `modelVersion` string and exact provider fields. The smallest safe provenance change is a versioned bundle/packet successor that carries requested-model ID, reported-model ID, generation-client version/settings, usage, and an explicit serving-snapshot availability state, with reload/root checks updated together. Existing v1 bundles and historical evidence must remain unchanged and must not be reinterpreted. Missing source, usage, request/response, or identity records still produce a charged block.

## Risks and stop rules

- The existing six fixtures are not empirical evidence; promoting them directly would be a false pass.
- The one-phase fixed-opponent runner cannot establish competitive performance; use it only for development fingerprints.
- Four model attempts may yield fewer than four valid bundles. Do not replace missing attempts with old-rules sources, synthetic fixtures, or unapproved retries.
- A source-backed control that cannot be admitted, supervised, paired, or privacy-projected is a retained failure, not a dropped cell.
- Stop authoring at the 30-minute ceiling and supervised collection at the 90-minute ceiling. Stop earlier on the first system-failure condition if the declared policy makes continuation unsafe; preserve all already charged terminals.
- Human/external intake remains explicitly unused: zero submissions, effort, and participant allocation.

## Exact implementation surfaces

| Concern | Existing surface | Required bounded change |
|---|---|---|
| Workload admission/charge | `packages/strategy-lab/src/factory/calibration.ts`, `scripts/run-v1-38-factory-calibration.ts` | Bind 48 predeclared workload roots and feed assessment roots; preserve charge-first terminals. |
| Six fingerprints | `packages/strategy-lab/src/factory/fingerprint.ts` | Publish privacy-safe aggregate signals alongside existing six roots; keep unresolved/quarantine semantics. |
| Control corpus | `packages/strategy-lab/src/factory/calibration-corpus.ts` | Replace projection-only assessment input with source/packet/receipt-rooted controls; retain mechanics-only labeling. |
| Threshold report | `packages/strategy-lab/src/factory/calibration.ts` | Add versioned threshold artifact/report and fail-closed readiness transition. |
| Model provenance | `packages/strategy-oracle-model/src/bundle.ts`, `src/emit.ts`, `packages/strategy-lab/src/factory/contracts.ts`, `scripts/ingest-v1-38-factory-packet.ts` | Add requested/reported/client/usage/snapshot-unavailable fields in a new version; preserve exact reload/root linkage. |
| Isolation | External Codex CLI invocation and frozen packet construction | Isolated disclosed-rules-only contexts; no generation inside deterministic execution; retain JSON usage/request/response events. |

No empirical command, model request, test, runtime, network, package install, or source generation was performed for this addendum.
