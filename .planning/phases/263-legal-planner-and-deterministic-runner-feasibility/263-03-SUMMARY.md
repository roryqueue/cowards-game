---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "03"
subsystem: strategy-lab-planner
tags: [local-controller, static-source, canonical-fixtures, supervised-gate-pending]
requires:
  - {phase: 263-01, provides: Frozen observation corpus and structural budgets}
  - {phase: 263-02, provides: Mission-v1 objectives and ordered assignment}
provides: [Nine-Action bounded local controller, Deterministic self-contained source builder, Explicit fixture-to-mission corpus mapping]
affects: [263-06, 263-07]
tech-stack:
  added: []
  patterns: [Static trusted TypeScript assembly, Lexical closure check, Canonical offline Action adjudication]
key-files:
  created: [packages/strategy-lab/src/planner/brain.ts, packages/strategy-lab/src/planner/brain.test.ts, packages/strategy-lab/src/planner/emit.ts, packages/strategy-lab/src/planner/emission.test.ts]
  modified: []
key-decisions:
  - Brain observes no phase/round; planner owns objective expiry, brain invalidates only locally observable target and goal drift.
  - Fixture mapping changes corpus identity and must be frozen before measurement, never substituted afterward.
  - Static source validation is not empirical feasibility or a hostile-code sandbox proof.
requirements-covered: [PLAN-03, PLAN-04, PLAN-05]
requirements-completed: []
duration: 15min
completed: 2026-09-09
status: complete
---

# Phase 263 Plan 03: Local Controller and Static Candidate Summary

A nine-Action local controller and static TypeScript builder emit the full mission/assignment/controller policy as a24,294-byte synchronous package-free Strategy, without executing emitted source.

## Accomplishments

- Fixed four MOVE/four TURN/TURN_TO_STONE enumeration. Nine mandatory evaluations reserve a complete fallback; optional visible-goal/mobility scoring consumes at most nine of the permitted64 evaluations. Every result reports actual reservation/optional counters.
- Lexicographic survival, impossible Action, immediate no-Advance obligation and mission consistency precede soft mission preferences. Immediate reversal cannot exploit a favorable intended destination to override canonical terminal consequences. No projected GameState, transition event or alternate resolution loop exists in controller code.
- Authoritative `hasAdvancedThisActivation` governs final-Cycle Advance urgency and reserve behavior. SoldierMemory cannot spoof it. Local mission-v1 admission rejects surplus/unknown keys and malformed packets; visible target disappearance and out-of-bounds observed goals invalidate objectives. Graph-cut STONE at the goal intentionally selects conversion.
- Trusted canonical single-Activation fixtures adjudicate four-direction edge pushes, rear-entry Backstab, blocked movement, defensive facing and no-Advance cleanup. Static test positions remain in declared board bounds. Tests also cover edge/corner movement restrictions, reversal direction variants, stale packets, zero optional budget, all100 original canonical brain corpus inputs and cell-array order invariance.
- Static builder reads the three reviewed policy modules, validates permitted imports, removes builder/module syntax, transpiles without evaluation, checks lexical dependencies and capabilities, and calls existing source-validation/revision-build APIs. Candidate binds exact UTF-8 bytes/hash, source module hashes, algorithm, selected ABI/tuple/budget, source caps and immutable revision. No production Advanced registration.
- Source measured at this commit:24,294 bytes, below49,152 preferred and65,536 hard caps. Raw source root: `sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b`. This is a build identity, not a timing result; integration fixes to underlying modules require a fresh identity before measurement.

## Task Commits

1. Brain RED `73ddaf91`; GREEN `8922d864`; reversal/defense correction `c9a46cef`.
2. Emission RED `e06e0287`; GREEN `657bd22e`.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/planner/brain.test.ts packages/strategy-lab/src/planner/emission.test.ts`:24/24 passed in5.41seconds.
- Standalone strict typecheck passed: `./node_modules/.bin/tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --skipLibCheck --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --types node --ignoreConfig packages/strategy-lab/src/planner/brain.ts packages/strategy-lab/src/planner/brain.test.ts packages/strategy-lab/src/planner/emit.ts packages/strategy-lab/src/planner/emission.test.ts`.
- Package `tsc -b packages/strategy-lab` passed after Task1. Final package build awaits the parent-owned runtime-js project reference: emitter imports the planned trusted revision/validation APIs. Remaining build errors are TS6059/TS6307 for that absent reference, not controller/emitter type errors. Parent/fixer owns mechanical `references:[...,{"path":"../runtime-js"}]` and `@cowards/runtime-js:"workspace:*"`; no install required.
- Initial emission RED first encountered missing runtime-js workspace symlink. Switched trusted build imports to existing relative source-module conventions; the next RED failed on missing emit module. Source was never evaluated.
- AST negative tests reject private closure variables, clock/random/process/global access, eval/Function, dynamic import and Promise. Source cap boundary tests cover65,536 accepted and65,537 rejected; ABI schemas reject invalid Actions and objective/memory overflows.
- `git diff --check`: passed. No intentional tracked deletion, new dependency installation, lockfile change, emitted-source execution, preflight, container, complete Match, runtime benchmark, formation or holdout access.

## Explicit Corpus Mapping Handoff

`mapPlannerMissionCorpus(buildFeasibilityCorpus())` pairs each brain input with the same-ordinal canonical full-board input, creates the requested real mission-v1 packet, and records explicit fallback if its target geometry cannot support that mission. It returns new input/case/corpus roots plus `sourceCorpusRoot`, `mappingVersion` and `mappings:{ordinal,requested,realized,fallback}[]`. Original corpus is unchanged.

At this commit, mapped root is `sha256:85e1f9b3a67da741439faca64859d99e2f2a583aa3d1b52115f9a0eeee485ea5`; all ten actual mission kinds occur. One unsupported rear-entry geometry (ordinal12) explicitly realizes reserve. This mapping proves packet admission and branch coverage, not family-label tactical success. Parent/fixer owns final protocol/benchmark root integration and must freeze it before measurement. Do not let the original fixtureContext-only packets silently turn the benchmark into fallback-only evaluation.

## Integration API

- `enumerateConcreteActions(): Action[]`.
- `reserveBrainFallback(input)` returns action/evaluations/missionStatus.
- `runPlannerSoldierBrain(input:SoldierBrainInputV119,budget={maxEvaluations:64}):SoldierBrainResult`.
- `observeBrainMission(input)` returns local status and admitted mission or null.
- `emitPlannerSource():string`; `buildPlannerCandidate()` returns private source/root/bytes/revision/module roots and fixed policy binding.
- `assertPlannerSourceClosure(source)` is a static gate, never a runtime security boundary.
- `mapPlannerMissionCorpus(corpus)` is trusted premeasurement mapping, not emitted policy.

## Deviations and Honest Limits

- [Rule1] Added explicit reversal survival penalty after inspecting the lexicographic edge case; legal fallback cannot lose to impossible reversal on intended survival alone.
- [Rule3] Missing runtime project reference caused TypeScript build to emit ten untracked `.js/.d.ts` files beside runtime source. Removed exactly those generated files with apply_patch; no tracked runtime source or user files were removed. The files are reproducible build output. Subsequent standalone verification uses noEmit.
- [Rule2] Added explicit corpus mapping to avoid claiming fixture-context fallback coverage as actual mission-guided behavior. Its final protocol wiring belongs to Plan06 integration.
- No canonical phase/round clock or other Soldier IDs are present in SoldierBrainInput. The local controller cannot independently verify remote target identity or global expiry; it only uses observed occupancy and planner-bound goals. Full-board planner handles expiry and ID checks.
- Heuristic geometric preferences do not prove tactical completeness, global survival, optimality, source p99 or competitive strength. Actual emitted-output/memory information-boundary equality and hostile-runtime feasibility remain separately charged supervised gates.
- No placeholder or unwired implementation stubs were introduced. Planned trusted build file reads do not enter emitted source. Shared state/tracking remains parent-owned.

## Self-Check: PASSED

All four owned files and all five task/correction commits exist.24 unique tests and standalone strict typecheck pass. Final package-reference integration is explicitly delegated and pending rather than claimed passed.
