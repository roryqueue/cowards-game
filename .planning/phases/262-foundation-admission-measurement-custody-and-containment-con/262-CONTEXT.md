# Phase 262: Foundation Admission, Measurement, Custody, and Containment Contract - Context

**Gathered:** 2026-07-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase admits the exact released v1.37 authority, reproduces the old current-rules matrix as a regression fixture through the current canonical execution path, and freezes the scientific, budget, claims, holdout-custody, classifier, and containment contract before any candidate output is inspected. It may create profile-agnostic contracts and synthetic classifier fixtures, but it must not materialize an executable formation namespace, alternate initial state, profile manifest, candidate, prompt, cache, trace, replay, or result. It does not repair v1.37, build the planner or factory, run the league, open the holdout, certify a finalist, or change production behavior.

</domain>

<decisions>
## Implementation Decisions

### Milestone-wide integrity charter
- **D-01:** Evidence is immutable and content-addressed. There is no mutable `latest`; a changed input, policy, implementation, or result creates a new branch with a new root.
- **D-02:** Missing, stale, incompatible, contaminated, incomplete, mismatched, or non-reproducible evidence fails closed. Process/integrity failure is distinct from a process-valid empirical failure and blocks authoritative progress.
- **D-03:** The exact selected canonical `MATCH_KERNEL` remains the only transition authority, and hostile Strategy source remains behind the supervised runtime-service / Runtime Broker boundary. No copied rules, alternate scheduler, or Strategy execution in the coordinator, web, API, or Go is permitted.
- **D-04:** Lab evidence remains private and unreachable from production registration, persistence, scheduling, Chronicle, replay, standings, and public/default surfaces. Only exact eligible pre-formation current-league source hashes may later enter ordinary certification.
- **D-05:** Every attempt, retry, rejection, invalid output, duplicate, failure, system failure, and unused allocation remains charged and visible in its proper evidence ledger; accepted evidence cannot omit inconvenient work.
- **D-06:** Cycle-cap, MOVE/reversal, Backstab geometry/timing, scan timing, arena, runtime, product/public, and combined-rule changes remain unavailable in v1.38.

### Exact predecessor admission
- **D-07:** Authoritative v1.38 work begins only after a machine-checked join resolves the v1.37 audit, exact archive commit, annotated `v1.37` tag, independent post-tag result, and exact selected semantic/runtime authority tuple. Copied labels are not authority.
- **D-08:** The immutable v1.37 archive commit remains the release authority. Later non-semantic corrections are recorded as separate lineage and may inform current correctness checks, but they do not move, recreate, or silently reinterpret the tag or archived evidence.
- **D-09:** Any failed join, stale certificate, incompatible identity, semantic drift, or unexplained reproduction mismatch emits an explicit stop disposition back to the integrity foundation. Phase 262 must not normalize or repair the predecessor inside v1.38.
- **D-10:** Reproduce the persisted current-rules matrix's declared shape and expected results through the selected canonical kernel and supervised execution path. The audit script's `new Function` loader is historical reproduction material, not an execution mechanism to reuse. Starter and Advanced Strategies remain smoke, regression, and throughput fixtures only.

### Frozen measurement and budget contract
- **D-11:** Before inspecting candidate output, freeze one immutable contract for the primary estimand—separately adapted formation-specific metagames under the fixed factory—and the bracket/current, inward/current, and bracket/inward contrasts. Fixed-policy transfer is explicitly secondary screening.
- **D-12:** The contract fixes complete cells, scoring, draw value, both sides, both entrant-level initiative states, semantically distinct design arenas, all splits and opponent fields, matched root-seed blocks, stopping and response admission, finalist eligibility/cardinality, portfolio selection, robust-pure selection, and permitted claims.
- **D-13:** Freeze a multi-resource opportunity vector rather than a single fungible compute scalar: attempted candidates, accepted response slots and unfilled-slot disposition, response rounds, search/teacher/distillation work, Matches, model attempts/tokens, human effort/submissions, replay review, cache policy, retries, hardware class, runtime, source, objective, memory, and output limits.
- **D-14:** Contained profile-neutral calibration spikes may refine structural work units, denominators, retry/burn rules, and starting numeric gates before search. Direct Strategy work must be distinguished from provider, orchestration, and infrastructure overhead. Candidate outcomes may not influence calibration.
- **D-15:** The activation prompt's 64 KB hard source cap, preferred under-48 KB target, below-5 ms p99 starting target, population/core/finalist counts, response thresholds, probe threshold, red-team threshold, and Advanced-library regression threshold are calibration inputs. Any replacement value and its exact denominator must be justified and frozen before candidate output is inspected.
- **D-16:** Zero accepted runtime violations, system failures, legal-information violations, private-data leaks, missing cells, duplicate/conflicting results, or unproved identity joins is a hard evidence condition. System-failed work remains charged but can never be converted into gameplay or an accepted cell.
- **D-17:** Metric code, canonicalization, normalization, denominators, replication treatment, materiality thresholds, hard versus compensating gates, classifier fixtures, response/finalist rules, and report language are hashed with the contract. A composite result cannot override a mandatory integrity or rejection gate.
- **D-18:** Reports maintain separate fields for `process_status`, current-rules outcome, formation rejection/pass, and holdout contamination. A valid empirical failure is publishable evidence; threshold softening, selective failure omission, or stronger-than-oracle-relative claims are not.

### Holdout custody and pre-formation containment
- **D-19:** A separately permissioned custodian and private store control the holdout preimages and commitment material. The iterative experiment coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt after the authorized batch.
- **D-20:** Holdout lineage must prove that source data, training data, prompts, caches, opponent construction, and schedule construction contain no profile-conditioned or current-trained input. Custody records the named role, authorized opening actor, access/query ledger, storage identity, safe projection, contamination response, retention, and retirement.
- **D-21:** Premature access, unauthorized query, commitment mismatch, uncertain evaluator state, or disclosure outside the frozen safe projection is contamination, not a diagnostic opportunity. It follows the precommitted invalidation/reporting path and cannot be repaired with a replacement or second holdout.
- **D-22:** Precommit the literal current-edge, full-inward, and edge-anchored-bracket coordinates, unchanged inward facings, equal-compute dimensions, telemetry, causal classifiers, and hard rejection logic now. Only profile-agnostic schemas, metric code, and synthetic positive/negative/mirrored/obfuscated fixtures may exist before the valid Phase 266 current-league freeze.

### Decision Revision: single-operator local seal (2026-08-12)
- **D-19R:** For future routing, D-19 is superseded by the operator-approved `single_operator_local_seal_v1` assurance class. One named `repository_operator` controls a restricted out-of-repository local holdout store and one closed opening command. The coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt afterward. This is process separation, not independent custody, and it makes no independent/third-party custody, separate-permissioning, non-collusion, comprehensive-host-monitoring, cryptographic-erasure, forensic-deletion, or malicious-owner-resistance claim.
- **D-20R:** For future routing, D-20 retains the profile-neutral lineage, frozen source/training/prompt/cache/opponent/schedule exclusions, tool-mediated access/query ledger, safe projection, terminal contamination, retention, and retirement requirements while naming the role `repository_operator`. Commitment-secret ingress is only `<absolute-local-seal-root>/input/commitment-secret.bin`, under owner-only `0700` ancestors as an effective-UID-owned regular non-symlink `0600` file of 32..4096 bytes. It is opened no-follow, validated, read once during commitment, zero-filled in process, unlinked, and followed by parent fsync before success; uncertainty fails closed and bytes never enter CLI, environment, logs, Git, tests, receipts, artifacts, or output.
- D-19 and D-20 remain visible above as truthful historical requirements and continue to describe the terminal Plan 262-40/42/43 branch. D-19R and D-20R supersede them only for successor Plans 262-44 through 262-48; they grant no ADMIT-03, SEAL-01, candidate-search, Phase 263, formation, holdout-opening, public, activation, or production authority.

### the agent's Discretion
- Exact schema, module, command, storage, and typed-reason names are left to research and planning within the locked evidence and privacy boundaries.
- Exact budget values, materiality thresholds, classifier cutoffs, commitment primitive, encrypted-storage mechanism, and retention sampling are chosen only after the required contained Phase 262 spikes, then frozen before candidate output is inspected.
- A managed signing identity may be used if one already exists; Phase 262 must not create an ad hoc signing trust system to simulate custody.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.38 contract
- `.planning/PROJECT.md` — Milestone goal, current authority posture, hard boundaries, and privacy constraints.
- `.planning/REQUIREMENTS.md` — ADMIT-01 through ADMIT-04, MEAS-01 through MEAS-10, SEAL-01, and DECI-02.
- `.planning/ROADMAP.md` — Phase 262 boundary, success criteria, dependency, and research flag.
- `.planning/STATE.md` — Current milestone position, blockers, and deferred work.
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md` — Binding milestone contract and starting calibration gates.
- `.planning/research/SUMMARY.md` — Resolved architecture, evidence classes, ordering, custody, and pre-search contract guidance.
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md` — Detailed competitive-factory and experiment handoff.
- `.planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md` — Original milestone intent and causal formation boundary.

### v1.37 admission authority
- `.planning/milestones/v1.37-MILESTONE-AUDIT.md` — Immutable pre-tag audit state and PROOF-08 outer-operation semantics.
- `.planning/milestones/v1.37-ROADMAP.md` — Archived predecessor scope and release sequence.
- `.planning/milestones/v1.37-REQUIREMENTS.md` — Archived 56-requirement predecessor contract.
- `.planning/milestones/v1.37-phases/261-integrated-service-proof-drift-guards-and-release/261-VERIFICATION.md` — Final phase evidence and release-readiness verification.
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.md` — Selected tuple, runtime contract, arenas, Set policy, certificates, and retained limitations.
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.json` — Machine-readable exact predecessor authority.
- `.planning/artifacts/v1.37-prearchive-proof.json` — Pre-tag proof root and outer-operation status.
- `.planning/artifacts/v1.37-release-readiness.json` — Pre-tag readiness identities and non-circular tag contract.
- `.planning/artifacts/v1.37-post-tag-ui-integration-correction.md` — Actual immutable archive commit, independent post-tag result, and separately recorded later corrections.
- `scripts/check-v1-37-release-tag.ts` — Read-only annotated-tag and post-tag verification behavior.

### Regression and semantic sources
- `.planning/artifacts/v2.0-core-rules-audit/README.md` — Persisted current-matrix shape and expected audit results.
- `.planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts` — Historical matrix implementation; its `new Function` execution is explicitly not reusable.
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — Audit findings and metagame limitations.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Consolidated canonical rules source.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Current Cycle-interleaved gameplay semantics.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Engine/runtime ownership boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/integrity-authority.ts` and `packages/spec/src/current-semantic-authority-generated.ts`: Resolve exact semantic authority and identities instead of trusting labels.
- `packages/engine/src/kernel/driver.ts`: Exposes the selected `MATCH_KERNEL` and its machine/effect/step API.
- `packages/spec/src/set-condition-policy-v1-37.ts` and `packages/spec/src/arena-catalog-v1-37.ts`: Own canonical side/initiative conditions and semantic arena geometry identity.
- `apps/runtime-service/src/execute-match.ts`: Existing supervised execution and three-way success/player-violation/system-failure boundary.
- `packages/spec/src/canonical-json.ts` and `packages/spec/src/canonical-identity-domains.ts`: Existing canonical encoding and domain-separated identity primitives.

### Established Patterns
- v1.37 evidence uses strict tuple joins, canonical roots, append-only authority records, and pre-tag versus post-tag separation.
- The current matrix audit demonstrates expected regression data but executes Advanced source with `new Function`; authoritative reproduction must replace only that unsafe execution path, not silently change expected coverage or interpretation.
- Smoke and Open Field were duplicate empty geometries in the historical matrix; v1.38 conditions must use semantic geometry identity rather than display names.

### Integration Points
- Admission joins archived planning/audit artifacts, the annotated Git tag, post-tag checker, current spec authority, kernel identity, runtime evidence authority, arena catalog, and Set policy.
- The contract and custodian artifacts become immutable inputs to Phases 263–270; every later root must bind them.
- Boundary monitors must assert that profile-neutral contract fixtures exist while every executable formation artifact class remains absent before Phase 266.

</code_context>

<specifics>
## Specific Ideas

- Keep the current-edge formation control in the same future private lab evidence class as inward and bracket; matching production coordinates does not make it canonical evidence.
- The three profile coordinates and bracket rationale are protocol text in this phase, never executable state.
- The experiment runner should see a commitment and bounded receipt, not holdout preimages, evaluator internals, or query feedback.

</specifics>

<deferred>
## Deferred Ideas

- Planner and deterministic runner implementation belongs to Phase 263.
- Candidate factory, independent oracles, and quarantined intake belong to Phase 264.
- League execution and current-league freeze belong to Phases 265–266.
- Executable formation materialization, equal retraining, sealed opening, decision, certification, and release closure belong to Phases 267–270.
- Cap, MOVE, Backstab, scan-timing, arena, runtime, product, and combined-rule experiments require separately approved later work.

</deferred>

---

*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Context gathered: 2026-07-27*
