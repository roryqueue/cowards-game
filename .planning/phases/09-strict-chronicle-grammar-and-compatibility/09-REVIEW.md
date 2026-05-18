---
phase: 09-strict-chronicle-grammar-and-compatibility
reviewed: 2026-05-18T16:36:45Z
depth: deep
files_reviewed: 20
files_reviewed_list:
  - apps/web/app/matches/replay-fixture.test.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - packages/replay/src/build.ts
  - packages/replay/src/grammar.ts
  - packages/replay/src/grammar.test.ts
  - packages/replay/src/index.ts
  - packages/replay/src/project.ts
  - packages/replay/src/project.test.ts
  - packages/replay/src/reconstruct.ts
  - packages/replay/src/reconstruct.test.ts
  - packages/replay/src/replay-transition.ts
  - packages/replay/src/replay-transition.test.ts
  - packages/replay/src/snapshot-boundaries.ts
  - packages/replay/src/snapshot-boundaries.test.ts
  - packages/replay/src/validate.ts
  - packages/replay/src/validate.test.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/types.ts
  - packages/test-utils/src/replay-scenarios.legality.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: fixed
fixed: 2026-05-18T16:41:20Z
---

# Phase 9: Code Review Report

**Reviewed:** 2026-05-18T16:36:45Z
**Depth:** deep
**Files Reviewed:** 20
**Status:** fixed

## Summary

Reviewed the strict Chronicle grammar, compatibility, projection privacy, snapshot boundary, replay transition, reconstruction, and web replay-unavailable paths. The public projection and web unavailable message paths did not show a private-data leak in the reviewed code, and the stable error-code schema/type additions are in parity.

The blocking issues are all validator false negatives: missing per-Round/per-Activation snapshots are accepted, out-of-range Activation/Cycle windows are accepted, and the transition comparison silently ignores several impossible Soldier-referencing events.

Verification run during review:

```bash
pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts
```

Result: 10 files / 109 tests passed. The pass does not cover the false negatives below.

## Critical Issues

### CR-01: Snapshot Validation Only Checks Kind Presence, Not Every Required Boundary

**File:** `packages/replay/src/validate.ts:226`
**Issue:** `validateSnapshots` collapses snapshots to a `Set` of kinds, so a Chronicle with four `ROUND_STARTED` events only needs one `ROUND_END` snapshot to pass the integrated gate. `validateSnapshotBoundaries` then only validates snapshots that exist and never enumerates missing Round or Activation boundaries. I confirmed this with the canonical `contraction` scenario: it has 4 `ROUND_END` snapshots, but after deleting 3 of them, `validateChronicle(mutated)` returned `{ ok: true }`. This violates GRAM-04/GRAM-05 and allows incomplete replay boundary data through strict validation.
**Fix:** Derive the expected boundary instances from the event stream and require exactly one matching snapshot for each boundary context/sequence.

```ts
const expectedRoundEnds = computeExpectedRoundEndBoundaries(chronicle.events)
for (const expected of expectedRoundEnds) {
  const matches = chronicle.snapshots.filter(
    (snapshot) =>
      snapshot.kind === "ROUND_END" &&
      snapshot.sequence === expected.sequence &&
      contextMatches(snapshot.context, expected.context, ROUND_CONTEXT_KEYS),
  )
  if (matches.length !== 1) {
    errors.push(error("SNAPSHOT_MISSING", "Chronicle is missing a ROUND_END snapshot.", expected))
  }
}
```

Add the same per-instance check for `ROUND_START`, `ACTIVATION_START`, `ACTIVATION_END`, `CONTRACTION`, `MATCH_END`, and `TERMINAL`.

### CR-02: Activation and Cycle Windows Accept Impossible Indices

**File:** `packages/replay/src/grammar.ts:294`
**Issue:** The grammar only requires nonnegative `activationIndex` and `cycleIndex` values and internal context consistency. It does not enforce Cycle bounds (`0..11`), sequential Awareness -> Action pairs, or Activation bounds for the Round's activation pattern. I confirmed that changing a valid Chronicle's first Awareness/Action pair to `cycleIndex: 99` still returns `{ ok: true }`, and changing an Activation window to `activationIndex: 99` also returns `{ ok: true }`. These are impossible under the spec's 12-Cycle limit and Round activation counts, so invalid Chronicles can reach replay rendering.
**Fix:** Enforce the canonical numeric windows in `validateChronicleGrammar`.

```ts
if (cycleIndex < 0 || cycleIndex >= MAX_ACTIVATION_CYCLES) {
  errors.push(error("EVENT_WINDOW_INVALID", "Cycle index is outside the Activation Cycle window.", event))
}

const maxActivationIndex = ROUND_ACTIVATION_COUNTS[roundNumber] * 2 - 1
if (activationIndex < 0 || activationIndex > maxActivationIndex) {
  errors.push(error("EVENT_WINDOW_INVALID", "Activation index is outside the Round Activation window.", event))
}
```

Also track the next expected Cycle index inside the active Activation so `AWARENESS_GRID_OBSERVED` and `ACTION_EMITTED` cannot skip, repeat, or reorder Cycles.

### CR-03: Transition Replay Silently No-Ops Unknown Soldiers

**File:** `packages/replay/src/replay-transition.ts:149`
**Issue:** `updateSoldier` silently leaves the board unchanged when the Soldier ID is absent. Several event handlers depend on it without first proving the Soldier exists: `TURN_RESOLVED`, `SOLDIER_STONED`, `SOLDIER_FELL`, and `BACKSTAB_RESOLVED`. A direct `validateChronicleTransitions` probe with `TURN_RESOLVED` for `soldierId: "ghost"` and unchanged boundary snapshots returned `[]`. That is a provably impossible event given the boundary snapshot's Soldier list, but the transition gate accepts it.
**Fix:** Make all mutating Soldier event handlers fail closed when referenced Soldiers are missing.

```ts
const soldier = soldierId === undefined ? undefined : findSoldier(state, soldierId)
if (!soldierId || soldier === undefined) {
  return {
    ok: false,
    errors: [
      error("SNAPSHOT_MISMATCH", "TURN_RESOLVED references an unknown Soldier.", {
        sequence: event.sequence,
      }),
    ],
  }
}
```

Apply equivalent checks for `SOLDIER_STONED`, `SOLDIER_FELL`, and every `attackerId`/`victimId` in `BACKSTAB_RESOLVED` before mutating state.

---

_Reviewed: 2026-05-18T16:36:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## Fix Verification

**Fixed:** 2026-05-18T16:41:20Z

All three Critical findings were fixed:

- CR-01: Snapshot boundary validation now requires per-instance Round, Activation, Contraction, Match end, and terminal snapshots instead of checking kind presence only.
- CR-02: Chronicle grammar now rejects Activation indices outside the Round activation window, Cycle indices outside `0..11`, and skipped/reordered Cycle starts.
- CR-03: Replay transition validation now fails closed when mutating Soldier events reference unknown Soldiers.

Verification run after fixes:

```bash
pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts
pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts
pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts
pnpm --filter @cowards/replay typecheck
pnpm --filter @cowards/test-utils typecheck
pnpm --filter @cowards/web typecheck
```

Result: pass.
