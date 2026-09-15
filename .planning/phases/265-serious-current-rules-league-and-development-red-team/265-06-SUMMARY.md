---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "06"
subsystem: private league execution and development red-team
tags: [private-offline, charged-allocation, psro, factory-runtime, read-only-import, bounded-retention]
dependency_graph:
  requires: [265-01-contracts, 265-02-measured-factory-independence, 265-03-connected-runner, 265-04-solver-psro, 265-05-selection-report]
  provides: [all-channel-red-team, nine-probe-coordinator, complete-allocation-validator, charged-response-production, connected-private-cli, data-only-full-graph-verification]
  affects: [265-07-source-proof, 266-current-league-freeze]
tech_stack:
  added: []
  patterns: [pre-work-reservation-to-final-publication, immutable-historical-measurement-import, common-reference-counterfactuals, shared-prepublication-retention-budget]
key_files:
  created:
    - packages/strategy-lab/src/league/red-team.ts
    - packages/strategy-lab/src/league/red-team.test.ts
    - packages/strategy-lab/src/league/allocation.ts
    - packages/strategy-lab/src/league/allocation.test.ts
    - scripts/lib/v1-38-league-authoring.ts
    - scripts/lib/v1-38-league-authoring.test.ts
    - scripts/lib/v1-38-league-response-runtime.ts
    - scripts/lib/v1-38-league-response-runtime.test.ts
    - scripts/run-v1-38-serious-league.ts
    - scripts/run-v1-38-serious-league.test.ts
  modified:
    - packages/strategy-lab/src/factory/fingerprint.ts
    - packages/strategy-lab/src/factory/fingerprint.test.ts
    - packages/strategy-lab/src/factory/repository.ts
    - packages/strategy-lab/src/factory/repository.test.ts
    - packages/strategy-lab/src/league/contracts.ts
    - packages/strategy-lab/src/league/contracts.test.ts
    - packages/strategy-lab/src/league/connected-runner.ts
    - packages/strategy-lab/src/league/connected-runner.test.ts
    - packages/strategy-lab/src/league/matrix.ts
    - packages/strategy-lab/src/league/matrix.test.ts
    - packages/strategy-lab/src/league/selection.ts
    - packages/strategy-lab/src/league/selection.test.ts
    - packages/strategy-lab/src/league/repository.ts
    - packages/strategy-lab/src/league/repository.test.ts
    - scripts/assess-v1-38-factory-independence.ts
    - scripts/assess-v1-38-factory-independence.test.ts
    - scripts/v1-38-factory-execution-evidence.ts
    - scripts/v1-38-factory-execution-evidence.test.ts
    - scripts/v1-38-factory-assessment-correction.ts
    - scripts/v1-38-factory-assessment-correction.test.ts
decisions:
  - "Historical Phase 264 measurements are immutable import evidence, never renewed execution authority."
  - "Fresh response production binds its pre-work charge to final source/publication through its own terminal."
  - "Every producing job prospectively reserves all score and common-reference comparison Matches."
  - "Independent validation/probe authoring receives only the precommitted packet, never current development targets."
  - "Only development responses enter PSRO; successful counters require a fresh complete population matrix."
  - "Current inventory counts require representative-to-representative evidence; distinct-from-reference alone does not establish mutual independence."
  - "Canonical output-directory binding and single-use allocation markers govern dispatch, not read-only inspection."
requirements-covered-source: [LEAG-04, LEAG-09]
requirements-completed: []
source_only_not_empirically_complete: true
coverage:
  - id: D1
    description: Source-only four-channel charged ledger and all nine identity/contrast probes, including mandatory counter re-entry.
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/red-team.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Complete injected 80-cell league and 122-plus-48 positive-response loop with immutable full reread.
    verification:
      - kind: integration
        ref: scripts/run-v1-38-serious-league.test.ts
        status: pass
      - kind: integration
        ref: scripts/lib/v1-38-league-response-runtime.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Source-only immutable historical import, complete prospective allocation, bounded shared retention, and strict inventory/iteration selection.
    verification:
      - kind: integration
        ref: Expanded exact 16-suite gate in this summary; 122 tests passed.
        status: pass
      - kind: other
        ref: Strategy-lab project typecheck and expanded strict NodeNext script typecheck.
        status: pass
    human_judgment: false
duration: 168min
completed: 2026-09-15
status: complete
---

# Phase 265 Plan 06: Charged private league and development red-team Summary

Complete allocation-gated private league composition now connects retained candidate source to fresh factory runtime issuance, full matrices, solver/PSRO response production, nine probes, conservative pure selection, and data-only reopening.

This is completion of the source implementation plan only. No empirical allocation exists; no model, guest, container, live participant, or empirical Match was executed. No empirical requirement, metagame result, finalist, holdout, formation, public/counted status, or production readiness is claimed. Injected tests never evaluate Strategy source. They construct the canonical 16-Soldier current-edge initial state and supply explicitly synthetic runtime/kernel results.

## Performance and task completion

- Tasks: 2/2 source tasks completed.
- Source/test files: 30; plan and summary: 2 additional planning files.
- First TDD commit: 2026-09-15 03:45:38 UTC; completion: approximately 06:33 UTC (168 minutes from the first TDD commit).
- Execution mode: sequential shared `main`; no worktree, lifecycle mutations, installs, broad Turbo run, or push.
- Unrelated recovery files, research cache and historical lock files were preserved.

## Delivered behavior

1. All automated/model/human/external channels require explicit new allocation rows; only explicitly authorized zero rows mean zero. Starts precede work, all terminal outcomes retain full reserved charge, unknown usage burns the reservation, retries and unused capacity remain visible.
2. All nine probes execute. Semantic arena identity, repeat/restart and worker/shard/completion identity require exact normalized evidence; genuine condition changes use paired contrasts under allocation-supplied material bounds.
3. `prepare`, `run`, and `verify-retained` validate complete prospective policy, participant, resource, retry, source and identity inputs. Dispatch is single-use and exactly destination-bound. The empirical path composes Plan 03 issuance with the existing `createFactorySupervisedRuntime` and `runCanonicalLabMatch`; it never accepts serialized provider authority.
4. Authoring uses the existing tactical/model/teacher/intake producers. Fresh factory starts bind the prospective packet, then their own accepted terminal binds finalized candidate/publication evidence. Source disclosure and raw/teacher evidence use immutable bounded chunks; the 256 KiB artifact limit was not increased.
5. Response evaluation runs three separate arms: new source versus opponent for score, new source versus the common reference, and old opponent versus that same reference for independence. A producing job requires at least `24 * maxPopulation * seedBlocks` reserved Matches. Shared-reference self-play uses distinct actual charge identities for the measured and opposing runtimes.
6. Positive development responses enter the actual PSRO reducer, enlarge the population, and trigger a complete fresh matrix/solver run. Validation and independent-probe packets are prospectively frozen and authored without development target/trace/mixture input. Their evidence never trains the league or enters PSRO.
7. Selection counts actual consecutive declared iterations, not jobs or seed rows. Current v4 also enforces the frozen 12-Strategy, six-behavioral-family, five-independent-core inventory and three distinct finalists. Behavioral/core counts use conservative pair-backed representatives, excluding missing, unresolved, correlated or identical mechanism evidence. Novel labels, fingerprints, or a shared reference alone do not establish extra groups. Legacy v2/v3 selection behavior is preserved.
8. One pre-publication byte/record budget covers both fresh repositories and journals, using constant-time counters rather than rescanning the growing store. Identical idempotent publication is not charged twice; uncertain writes keep their charge. Explicit terminal reserve capacity is checked before charged dispatch and remains available for failure/cleanup records after normal capacity exhaustion.
9. Retained verification recomputes canonical graph/chunk links, journal joins, complete matrices, solver transport, rounds, probe transformations, response numeric comparisons, fingerprints, iteration/selection decisions and report projections. It does not dispatch, mint runtime authority, repair files or renew consumed allocations. Copying retained evidence to another canonical private directory remains inspectable read-only.

## Task commits

Task 1 (red-team TDD and fixture correction):

- `f2938ef0` — RED: charged channels and nine probes.
- `d352d7d3` — all-channel ledger/probe implementation.
- `706bea9b` — normalized positive-counter payoff fixture.

Task 2 (connected implementation and approved dependency repairs):

- `1a4f78cc` — RED: direct matrix-to-solver transport.
- `8a167b9e` — canonical matrix/solver transport repair.
- `759dd699` — RED: complete prospective allocation.
- `942d8a05` — shared allocation validator.
- `cad86cac` — actual executable identity versus producer build descriptor.
- `1d90b3a3` — fresh Phase 265 fingerprint issuer.
- `a666d2b9` — immutable assessed candidate import/admission.
- `d4643617` — separate historical data-only assessment/execution/correction readers.
- `2dedf52b` — explicit charged authoring and retained native failures.
- `c4d7130b` — fresh pre-work/final-publication joins and legal probe transport.
- `f5a9abc1` — RED: complete connected league command regression.
- `fd067f76` — independent evaluation roles and genuine iteration evidence.
- `17f55c2e` — shared pre-publication retention, terminal reserve and bounded disclosures.
- `9ef9657a` — pair-backed current inventory gates.
- `8d492e80` — complete response/CLI/reread loop and bounded transcript-fixture typing correction.

All commits used normal local hooks. No tracked files were deleted. The plan/summary are committed separately after self-check.

## Exact verification

Frozen-source combined gate: **16 test files, 122 tests passed**, 412.45 seconds. Exact command:

```sh
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/red-team.test.ts packages/strategy-lab/src/league/allocation.test.ts packages/strategy-lab/src/league/contracts.test.ts packages/strategy-lab/src/league/connected-runner.test.ts packages/strategy-lab/src/league/matrix.test.ts packages/strategy-lab/src/league/solver.test.ts packages/strategy-lab/src/league/selection.test.ts packages/strategy-lab/src/league/repository.test.ts packages/strategy-lab/src/factory/repository.test.ts packages/strategy-lab/src/factory/fingerprint.test.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/run-v1-38-serious-league.test.ts
```

Important connected assertions:

- Complete 80-cell two-round/all-nine-probe run, immutable full reread, copied-repository read-only reread, consumed-allocation replay refusal and alternate-destination refusal before work.
- Complete 48-cell three-arm production/publication/numeric/fingerprint reread with changed-score and missing-cell rejection.
- Positive source-only response: **122 ordinary cells plus 48 response cells**, one real PSRO re-entry, complete matrix growth from 8 to 24 cells, and full read-only graph validation. The standalone regression passed in 168.58 seconds before the combined gate.
- Complete multi-entrant matrix output is fed directly into the actual solver, including reordered layout; no reconstructed snapshot shim.
- Large twelve-candidate/two-round/all-nine-probe ledger, 130-node grouped graph, byte/record exhaustion with reserved failure terminal, raw probe projection tampering, duplicate/broken iteration evidence and inventory novelty laundering.

Also passed:

```sh
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts --help
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.ts scripts/v1-38-factory-assessment-correction.test.ts
```

Post-gate test-only correction: the expanded strict check identified older `Array.map(JSON.stringify)` overloads and optional fixture access in `scripts/v1-38-factory-execution-evidence.test.ts`. After the 122-test gate finished, these were changed to explicit callbacks/non-null fixture accesses. **No production source changed after that gate.** The focused execution-evidence suite then passed **9/9 in 8.61 seconds**, and the entire expanded strict script command above passed. This bounded test-only edit is the only post-gate code change.

An earlier long CLI run correctly rejected its now-stale allocation after a concurrent source edit by this executor. That assertion was not weakened: the final combined run kept all production source frozen. Longer test-only timeouts preserve complete fixture coverage and do not change real Match/runtime limits.

## Approved deviations and integration repairs

- **Rule 1 — transport/identity bugs:** matrix execution ordinal versus solver byte order, and producer build/toolchain descriptor versus actual rebuilt executable identity. Repaired at the owning modules, with direct matrix→solver and real-shaped adapter/mismatch tests.
- **Rule 2 — missing producing closure:** shared allocation plus authoring/response helpers and a separate Phase 265 fingerprint issuer were necessary to connect real producer evidence to new charges, source, validation, supervision and final publication. No old allocation was repurposed.
- **Rule 3 — historical import compatibility:** original packet-reserved Phase 264 starts cannot name a not-yet-built candidate, and current-source guards cannot pretend to have produced historical artifacts. Separate immutable publication/import and historical-reader branches preserve those original identities and recompute all retained measurement/lineage joins. Default legacy readers remain unchanged.
- **Rule 1 — response/selection semantics:** common-reference paired comparisons, reference self-play runtime identities, separate evaluation roles, actual consecutive iterations and pair-backed inventory gates repair real assembled-flow omissions without changing frozen thresholds.
- **Rule 2 — retention/failure capacity:** optional repository callbacks and explicit terminal reserves prevent writes or dispatch beyond allocation, while bounded chunks retain full safe private evidence. No generalized custody service or new external infrastructure was added.
- **Rule 1 — full reread:** canonical grouped dependency ordering, exact raw projection/journal/score/report joins, and portable data-only inspection close the connected proof path. The full positive loop is tested, not replaced by a one-cell fixture or an omitted response stub.

The revised 06 plan includes every approved source/test dependency. Main retains ownership of `265-VALIDATION.md`, the combined 07 gate and lifecycle files.

## Read-only historical assessment handoff

The exported API is:

```ts
verifyHistoricalFactoryAssessmentForLeague(repository, assessmentArtifactRoot)
// scripts/assess-v1-38-factory-independence.ts
```

It returns `issued: false`, the unchanged assessment/threshold decision, `historicalProducerImplementationRoot`, `historicalAssessmentImplementationRoot`, and a separate `currentReaderImplementationRoot`. It reads the assessment's exact execution, review, correction, manifest, allocation, candidate, supervision, terminal and numeric evidence roots. For corrected v2 assessments it also validates the immutable failure/prior-correction lineage. No caller-supplied current-root substitution or skip-validation flag exists.

For the orchestrator's one actual **data-only compatibility check**, the required top-level inputs are:

- Repository: `/Users/roryquinlan/runtime/cowards-game/.strategy-lab/factory-264-fresh-20260914-approved-two`.
- Assessment artifact: `sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8`.
- All roots referenced by that immutable assessment must remain present in the same retained repository; they are read and joined from the artifact, not guessed or supplied as renewed authority.

Exact command, **documented but not executed by this plan**:

```sh
./node_modules/.bin/tsx --eval 'import { createFactoryRepository } from "./packages/strategy-lab/src/factory/repository.ts"; import { verifyHistoricalFactoryAssessmentForLeague } from "./scripts/assess-v1-38-factory-independence.ts"; const r = verifyHistoricalFactoryAssessmentForLeague(createFactoryRepository("/Users/roryquinlan/runtime/cowards-game/.strategy-lab/factory-264-fresh-20260914-approved-two"), "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8"); console.log(JSON.stringify({ issued: r.issued, status: r.status, assessmentRoot: r.assessmentRoot, thresholdArtifactRoot: r.thresholdArtifactRoot, historicalProducerImplementationRoot: r.historicalProducerImplementationRoot, historicalAssessmentImplementationRoot: r.historicalAssessmentImplementationRoot, currentReaderImplementationRoot: r.currentReaderImplementationRoot }, null, 2))'
```

Keep source unchanged while checking, since the reader identity is current-source-bound. Do not use the default `verifyRetainedFactoryAssessment` for this historical-import purpose; its normal current-source guard deliberately remains strict. An affirmative overall calibration is not blanket independence for all twelve slots: only the actual qualifying mechanism/pair evidence is imported as distinct; cosmetic controls and unresolved pairs remain excluded.

## Known stubs and remaining scope

No known source stub prevents the Plan 06 execution path. There is no missing response-loop fallback, guessed runtime provider, serialized issuance flag, source evaluation or reconstructed game rules. The source-only injected fixture seam is intentionally nonempirical and denied by the CLI's empirical path.

Empirical performance, real participant/model work and actual retained-history compatibility are not claimed from these fixtures. Main will extend the combined validation gate, perform independent review, run the single data-only historical compatibility check above, and retain the later complete-allocation decision. No live allocation, sealed holdout opening, formation, public registration, rating or production change was performed or authorized here.

## TDD gate compliance

Task 1 and Task 2 both have committed RED coverage followed by implementation commits. The initial Task 1 positive fixture correction is explicitly retained in `706bea9b`; the final exact gate passes. Ordinary dependency repairs were added within the same approved plan rather than creating a new numbered plan or human checkpoint.

## Self-Check: PASSED

- All 30 declared source/test paths and the on-disk summary exist.
- All 18 task/dependency commits listed above exist after the expected base.
- The committed source diff contains exactly the 30 approved source/test paths and no tracked deletion.
- The complete frozen-source 16-suite gate and post-gate focused test/typecheck results are recorded accurately; no empirical requirement is marked complete.
- Lifecycle files, push and combined validation remain with main.
