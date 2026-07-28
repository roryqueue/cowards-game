---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "14"
subsystem: replay-reconstruction-equivalence
tags: [chronicle, replay, transition-trace, reconstruction, historical-v1-4]

requires:
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "02"
    provides: immutable RecordedCanonicalTransitionV137 stream and accumulated trace root
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "06"
    provides: frozen historical v1.4 grammar and transition interpretation
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "08"
    provides: one acyclic current semantic admission core and exact trusted recorder equality
provides:
  - exact field-ordered comparison for every recorded current transition
  - reconstruction closure over semantic admission, transition count, every transition field, final state, outcome, terminal anchors, and full trace root
  - stable privacy-safe first-mismatch codes containing only transition index and field coordinates
affects: [259-17, 259-18, runtime-service-success, persistence-admission]

tech-stack:
  added: []
  patterns:
    - sole-recorder reprojection rather than a replay-local transition projector
    - first exact mismatch stop before later event/state proof
    - optional additive evidence fields for backward-compatible downstream wiring

key-files:
  created: []
  modified:
    - packages/replay/src/replay-transition.ts
    - packages/replay/src/replay-transition.test.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/reconstruct.test.ts

key-decisions:
  - "Replay compares caller-recorded canonical transitions with a fresh projection from recordChronicleFromExecution; it does not define another transition projection or Match loop."
  - "Transition equality follows one frozen field order covering kind, tuple, coordinates, outputs, private hashes, events, state/machine hashes, terminal material, and accumulated root."
  - "Mismatch results expose only stable code, transition index, and field name; compared values and private preimages never leave reconstruction."
  - "Existing callers may omit additive reconstruction evidence until Plans 259-17 and 259-18 wire the exact recorder result; omitted evidence is derived from the already authenticated execution."

patterns-established:
  - "D-14 step closure: semantic admission once, exact transition evidence comparison, event/state postconditions, exact final evidence, then trace-root equality."
  - "Historical isolation: current reconstruction additions never enter createHistoricalV14Replay or the frozen transition interpreter."

requirements-completed: [CHRN-05, CHRN-06]

coverage:
  - id: D1
    description: "Every D-14 transition field and ordering mutation rejects at the first exact transition index with a stable safe coordinate."
    requirement: CHRN-05
    verification:
      - kind: unit
        ref: "packages/replay/src/replay-transition.test.ts#rejects the first exact D-14 field mismatch with stable safe coordinates"
        status: pass
      - kind: unit
        ref: "packages/replay/src/reconstruct.test.ts#rejects the first and later recorded transition mismatch before later proof"
        status: pass
    human_judgment: false
  - id: D2
    description: "Accepted current replay evidence has exact transition, final state, outcome, terminal-anchor, and trace-root equivalence after one semantic admission."
    requirement: CHRN-05
    verification:
      - kind: unit
        ref: "packages/replay/src/reconstruct.test.ts#validates semantics exactly once before exact transition and final proof"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/replay exec vitest run --maxWorkers=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Frozen historical replay and immutable archived evidence remain independent of mutable current reconstruction."
    requirement: CHRN-06
    verification:
      - kind: unit
        ref: "packages/replay/src/reconstruct.test.ts#keeps historical replay calls isolated from mutable current transitions"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 14: Transition-Complete Replay Reconstruction Summary

**Current replay reconstruction now proves every canonical recorded transition, exact final evidence, and the full trace root while frozen v1.4 replay remains isolated.**

## Performance

- **Duration:** 11 min
- **Completed:** 2026-07-16
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `compareCurrentReplayTransitionV137` with a frozen 19-field comparison order spanning ordinal, kind, semantic tuple, exact coordinates, result class, output and private hashes, ordered events, state and machine hashes, terminal/failure material, and accumulated root.
- Added exhaustive one-field mutation proof that stops at the first mismatch and returns only `CURRENT_TRANSITION_FIELD_MISMATCH`, transition index, and safe field coordinate.
- Extended current reconstruction with additive recorded transitions, trace root, boundary anchors, recorded final state, and recorded outcome evidence.
- Kept semantic validation at exactly one direct call to `validateCurrentChronicleSemantics`; reconstruction never calls the public wrapper and validation retains no import back to reconstruction.
- Reprojected actual transition evidence only through `recordChronicleFromExecution`, preserving one recorder/transition authority and avoiding a replay-local Match loop or coordinate inference.
- Required exact transition count and every recorded step before applying the existing event-to-after-state postcondition proof.
- Required exact recorded final state, outcome, terminal snapshot/event/state, and complete transition trace root.
- Preserved source/execution bytes on success and every failure path.
- Kept original historical replay on `applyHistoricalV14Transition` only and re-ran immutable archived evidence proof.

## Task Commits

1. **Task 1 RED: Exhaustive transition-field mutation matrix** — `a1eeb28` (test)
2. **Task 1 GREEN: Stable exact transition comparator** — `acbe6c1` (feat)
3. **Task 2 RED: Reconstruction final/root and no-mutation matrix** — `a943e59` (test)
4. **Task 2 GREEN: Complete reconstruction evidence closure** — `23e1395` (feat)

## Files Modified

- `packages/replay/src/replay-transition.ts` — Exact current recorded-transition field order, comparator, and stable safe mismatch result.
- `packages/replay/src/replay-transition.test.ts` — Exhaustive 19-field mutation matrix and exact-equality proof.
- `packages/replay/src/reconstruct.ts` — One-admission transition/final/root reconstruction closure with additive evidence inputs.
- `packages/replay/src/reconstruct.test.ts` — First/later/count/final/outcome/root failures, call-graph ownership, and no-write proof.

## Decisions Made

- Compared recorded evidence with a fresh projection from the existing sole recorder instead of duplicating recorder hashing, private commitments, coordinates, or transition material in reconstruction.
- Retained the existing pure event/state postcondition comparator after exact recorded-transition comparison; it remains a defense that events produce each claimed after-state rather than a scheduling authority.
- Kept new evidence fields optional in the reconstruction input for source compatibility. Plans 259-17 and 259-18 can require and pass the exact runtime-service/persistence recorder result without breaking already compiled callers during this wave.
- Returned bounded safe mismatch coordinates only. No event payload, state, memory, objective, source, artifact, diagnostics, or host data enters public reconstruction failure output.

## Deviations from Plan

None.

## Issues Encountered

- The worktree's first package command installed dependencies and mechanically refreshed the lockfile because the separately executing supervisor workspace had not yet been integrated when the Wave-3 base was created. The lockfile change was immediately removed; Plan 259-14 commits contain no manifest, dependency, or lockfile change.
- Existing reconstruction accepted only Chronicle plus execution. Additive optional evidence fields preserve current callers while providing the exact transition/root contract that later service and persistence plans will make mandatory.

## Verification

- Focused reconstruction and transition suites: 2 files / 27 tests passed serially.
- Full replay package: 14 files / 208 tests passed serially in 140.83 seconds.
- Full engine package: 17 files / 136 tests passed serially.
- Focused engine compatibility, kernel contract, and historical replay: 3 files / 44 tests passed serially.
- Immutable v1.36 historical proof passed with 8 artifacts and 11 sources.
- Replay typecheck and package lint passed.
- Focused Prettier and `git diff --check` passed.
- No gameplay state, Action legality, event order, outcome, Strategy observation, historical source, public/private projection, protected file, or lockfile changed.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-17 can require runtime-service success to pass the exact recorded transitions, boundary anchors, final state/outcome, and trace root into reconstruction.
- Plan 259-18 can persist only the same reconstruction-verified evidence and reject before transaction mutation.
- No compatibility ruling or gameplay approval was required.

## Self-Check: PASSED

- All four declared source/test files exist and contain the planned transition/final/root proof.
- RED commits `a1eeb28` and `a943e59` precede GREEN commits `acbe6c1` and `23e1395`.
- Full replay, full engine, focused historical, immutable historical, typecheck, lint, formatting, and diff gates pass.
- Worktree contains no global planning, protected, manifest, dependency, or lockfile change.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
