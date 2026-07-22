---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "02"
subsystem: replay-transition-recording
tags: [chronicle, replay, transition-trace, canonical-json, privacy]

requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: Sole engine transition kernel and recorder-only Chronicle construction
provides:
  - Frozen RecordedCanonicalTransitionV137 records projected directly from kernel transitions
  - Domain-separated accumulated transition trace root
  - Hash-only private output, StrategyMemory, SoldierMemory, and objective bindings
affects: [259-03, 259-04, 259-14, chronicle-validation, replay-reconstruction]

tech-stack:
  added: []
  patterns:
    - Canonical JSON field hashing with domain-separated accumulated roots
    - Deep-cloned and frozen trace records with private preimages excluded

key-files:
  created: []
  modified:
    - packages/replay/src/record.ts
    - packages/replay/src/record.test.ts

key-decisions:
  - "The replay recorder projects the existing kernel stream; it does not schedule or reinterpret gameplay."
  - "Private Strategy outputs, memories, objectives, and Awareness material enter trace equality only through canonical hashes."
  - "Each transition stores its accumulated prefix root, while the exported root function independently recomputes the final root from transition material."

patterns-established:
  - "D-14 transition identity: exact kind, coordinates, state/machine hashes, ordered events, terminal data, and accumulated root."
  - "Hash-only private trace: private event payloads are never serialized into the returned canonical transition records."

requirements-completed: [CONF-02, CHRN-05]

coverage:
  - id: D1
    description: "Kernel transitions are recorded as immutable transition-complete D-06/D-14 evidence with deterministic accumulated roots."
    requirement: CONF-02
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts#records a transition-complete immutable D-06/D-14 stream with hash-only private evidence"
        status: pass
      - kind: unit
        ref: "packages/replay/src/record.test.ts#changes the D-14 root for every one-field and ordering mutation"
        status: pass
    human_judgment: false
  - id: D2
    description: "The recorder remains a pure projection without runtime, driver, or scheduling authority."
    requirement: CHRN-05
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts#has no runtime, driver, or scheduling dependency"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages/engine/src/compatibility-fixtures.test.ts packages/engine/src/kernel/kernel-contract.test.ts"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 02: Canonical Transition Recording Summary

**Chronicle recording now exposes an immutable, privacy-safe kernel transition stream whose exact field and order identity accumulates into one deterministic trace root.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-16T10:00:00Z
- **Completed:** 2026-07-16T10:06:59Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added `RecordedCanonicalTransitionV137` with exact ordinal, kind, lifecycle coordinates, result class, state and machine hashes, ordered events, terminal material, and prefix trace root.
- Added canonical hashes for output, StrategyMemory, SoldierMemory, objective, private-event, ordered-event, and terminal material without returning any private preimage.
- Added `computeRecordedTransitionTraceRootV137` and mutation coverage proving field changes, omission, duplication, and reordering change the deterministic root.
- Added `validateRecordedTransitionTraceRootsV137`, which recomputes every exact prefix and rejects the first stored accumulated-root mismatch.
- Deep-cloned and froze each returned record and nested event/coordinate structure.

## Task Commits

1. **RED: Specify transition-complete traces and root mutation behavior** — `d3c84ab` (test)
2. **GREEN: Record canonical transition traces** — `7cf5e90` (feat)
3. **Compatibility fix: Normalize optional private trace fields** — `1097b76` (fix)
4. **Review fix CR-04: Verify every stored prefix root** — `1d35cd3` (fix)

## Files Created/Modified

- `packages/replay/src/record.ts` — Canonical transition projection, private hash bindings, immutability, and accumulated root.
- `packages/replay/src/record.test.ts` — RED/GREEN mutation, privacy, immutability, and no-second-scheduler proof.

## Decisions Made

- Used the Phase-258 canonical JSON encoder for trace field bytes so root identity is independent of host object insertion order.
- Bound private evidence with explicit hashes while keeping the Chronicle's existing owner-private sections unchanged.
- Treat stored prefix roots as claims rather than authority: recorder admission now independently recomputes and checks every first, middle, and final prefix.
- Kept the new trace additive to the current Chronicle result; no historical schema, event, state, legality, order, outcome, or Strategy observation changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Optional internal objective fields were not normalized before canonical hashing**

- **Found during:** Plan 259-05 baseline Chronicle generation.
- **Issue:** A valid current Match with objective-free activation orders retains an optional internal `objectivePayload: undefined` field. The new trace encoder passed that internal representation directly to canonical JSON, which correctly rejected it even though Chronicle recording had historically accepted and omitted the optional field.
- **Fix:** Normalize accepted internal trace material through its existing JSON representation before canonical encoding and add the objective-free full-Match regression.
- **Files modified:** `packages/replay/src/record.ts`, `packages/replay/src/record.test.ts`
- **Verification:** Recorder and grammar tests passed 40/40; replay typecheck and lint passed.
- **Committed in:** `1097b76`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The fix restores the pre-existing valid Chronicle path and changes no gameplay, event, public/private projection, or historical evidence.

## Issues Encountered

- The first transition has one event, so the ordering mutation test was refined to reverse the first multi-event transition. This changed only the test vector and exposed no product or semantic issue.
- The wider grammar fixture exposed the optional internal-field hashing bug above before per-slot grammar implementation began.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-03 can consume `RecordedCanonicalTransitionV137` directly without defining a sibling transition shape.
- Plan 259-14 can compare reconstruction at every recorded ordinal and verify the same accumulated root.
- No valid v1.4 gameplay or historical evidence changed.

## Self-Check: PASSED

- Both modified replay files exist.
- RED commit `d3c84ab`, GREEN commit `7cf5e90`, and compatibility fix `1097b76` exist.
- Focused recorder/grammar/historical tests passed 69/69; the full replay suite passed 194/194 serially.
- Replay typecheck and lint passed.
- Phase-257 compatibility and kernel-contract tests passed 31/31.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
