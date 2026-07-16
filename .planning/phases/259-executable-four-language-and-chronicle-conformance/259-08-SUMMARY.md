---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "08"
subsystem: chronicle-semantic-admission
tags: [chronicle, replay, semantic-validation, historical-v1-4, version-dispatch]

requires:
  - phase: 259-05
    provides: immutable per-Activation-slot current Chronicle grammar
  - phase: 259-06
    provides: frozen historical v1.4 grammar and transition interpretation
provides:
  - exact tuple-first current and historical Chronicle dispatch without parser probing
  - one acyclic non-reconstructing current semantic admission core
  - one pure current transition-postcondition and terminal comparator shared by semantic admission and reconstruction
  - exact trusted-recorder event, snapshot, boundary-anchor, state, and terminal validation
affects: [259-14, runtime-service-admission, persistence-admission, replay-reconstruction]

tech-stack:
  added: []
  patterns:
    - exact compatibility identity resolution before schema or grammar admission
    - internal semantic core behind one public shared Chronicle validator
    - current validation and reconstruction share one acyclic transition-postcondition proof
    - historical replay executes only the byte-pinned v1.4 transition interpreter

key-files:
  created:
    - packages/replay/src/current-transition-postconditions.ts
  modified:
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/reconstruct.test.ts
    - packages/replay/src/record.ts
    - packages/replay/src/replay-transition.ts
    - packages/replay/src/replay-transition.test.ts
    - packages/replay/src/index.ts

key-decisions:
  - "Original historical v1.4 evidence is admitted and replayed only by the frozen historical grammar and transition interpreter; mutable current transition helpers are unreachable from that route."
  - "validateCurrentChronicle remains the sole public semantic admission API, while validateCurrentChronicleSemantics is module-internal to replay validation and reconstruction."
  - "Semantic admission and reconstruction each call the same pure transition-postcondition comparator exactly once."
  - "Candidate snapshots and boundary anchors must equal the trusted recorder's exact ordered output; self-consistency is only defense in depth."
  - "Exact current tuple identity is resolved canonically and never depends on JSON object insertion order."

patterns-established:
  - "Version-first admission: unresolved or unsupported identity fails before Chronicle bytes are read."
  - "Acyclic replay ownership: validate -> record/transition helpers; reconstruct -> validate core; validate never imports reconstruct."

requirements-completed: [CHRN-02, CHRN-03, CHRN-06]

coverage:
  - id: D1
    description: "Exact current and historical identities select one disjoint parser path before Chronicle bytes are parsed or probed."
    requirement: CHRN-02
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#rejects an unknown current tuple before reading or probing Chronicle bytes"
        status: pass
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#routes original historical evidence only through the frozen grammar without requiring current snapshots"
        status: pass
    human_judgment: false
  - id: D2
    description: "Current Chronicle admission validates ordered events against every transition after-state and terminal status through the same pure comparator used by reconstruction."
    requirement: CHRN-03
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#keeps current semantic admission acyclic and single-invocation"
        status: pass
      - kind: unit
        ref: "packages/replay/src/replay-transition.test.ts#current transition postconditions"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/replay exec vitest run --maxWorkers=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Historical v1.4 bytes and replay interpretation remain isolated from mutable current validation and transition application."
    requirement: CHRN-06
    verification:
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts"
        status: pass
      - kind: unit
        ref: "packages/replay/src/reconstruct.test.ts#keeps historical replay calls isolated from mutable current transitions"
        status: pass
    human_judgment: false

duration: 2h 21m
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 08: Version-Strict Semantic Chronicle Admission Summary

**Chronicle admission now resolves exact identity before parsing, keeps original v1.4 interpretation frozen, and validates current evidence through one acyclic semantic core before reconstruction.**

## Performance

- **Duration:** 2h 21m including an interrupted execution handoff
- **Started:** 2026-07-16T11:43:34Z
- **Completed:** 2026-07-16T14:05:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Routed unresolved and unsupported identities to bounded version failures before any Chronicle getter, schema, grammar, replay projection, or migration can run.
- Removed current snapshot, boundary, hash, and transition helpers from original historical v1.4 admission; the frozen historical grammar is now the complete admission authority for that profile.
- Extracted one non-reconstructing current semantic core that enforces authenticated recording equality, current vocabulary and per-slot grammar, canonical transition/state semantics, boundary anchors, and terminal outcome agreement.
- Added one pure, acyclic current transition-postcondition comparator used by both semantic admission and reconstruction to prove ordered events produce every exact after-state and terminal status.
- Routed historical replay execution through only the frozen v1.4 transition interpreter.
- Bound current snapshots and boundary anchors to the trusted recorder's exact order, rejecting swapped or renumbered self-consistent pairs.
- Routed exact historical-v1.16 admission through the same frozen v1.4 validator rather than the mutable current schema and grammar.
- Made current compatibility and every recorded transition tuple comparison canonical and key-order independent.
- Kept only `validateCurrentChronicle` in the package public admission surface; the semantic core remains an internal replay implementation seam.

## Task Commits

1. **Task 1 RED: Version-first routing and no-probe vectors** — `7237f84` (test)
2. **Task 1 GREEN: Frozen historical admission isolation** — `793bdd7` (feat)
3. **Task 2 RED: Acyclic single-core semantic admission contract** — `b154fb1` (test)
4. **Task 2 GREEN: Canonical semantic admission and reconstruction ownership** — `3a62a49` (feat)
5. **Review BL-01: Frozen historical replay interpreter isolation** — `a13763a` (fix)
6. **Review BL-02: Shared transition postcondition and terminal proof** — `cc3359a` (fix)
7. **Review BL-03: Exact trusted-recorder snapshot and anchor order** — `09b4cb3` (fix)
8. **Review gate formatting correction** — `d7f21df` (style)
9. **Final review RED: Historical isolation and canonical tuple order** — `6bb0207` (test)
10. **Final review GREEN: Frozen exact-history dispatch and canonical tuple resolution** — `8706d4b` (fix)

## Files Created/Modified

- `packages/replay/src/validate.ts` — Exact current semantic core, public wrapper, canonical transition validation, and frozen historical routing.
- `packages/replay/src/validate.test.ts` — Version-first vectors, acyclic single-invocation proof, and exact recorder-order regression.
- `packages/replay/src/reconstruct.ts` — Current reconstruction after exactly one semantic admission plus frozen historical v1.4 replay.
- `packages/replay/src/reconstruct.test.ts` — Source-level proof that historical replay cannot call mutable current transition helpers.
- `packages/replay/src/current-transition-postconditions.ts` — Pure shared current event-to-after-state and terminal comparator.
- `packages/replay/src/record.ts` — Shared deterministic boundary-anchor derivation from recorder transitions.
- `packages/replay/src/replay-transition.ts` — Pure replay event/transition helpers without semantic validation ownership.
- `packages/replay/src/replay-transition.test.ts` — Reconstruction imports follow the new acyclic owner.
- `packages/replay/src/index.ts` — Public shared validator exports without exposing the internal semantic core.

## Decisions Made

- Historical admission intentionally does not require current snapshot structure. Original v1.4 grammar and vocabulary are the frozen authority for original evidence.
- Historical replay execution intentionally uses only `applyHistoricalV14Transition`; current `applyReplayEvent` and current validated-replay construction are excluded from the historical route.
- Both unresolved original v1.4 and exact historical-v1.16 admission use the frozen historical validator; the exact tuple never selects mutable current parsing.
- Current compatibility and transition tuple equality uses the canonical resolver, so equivalent language-neutral JSON objects are independent of property insertion order.
- The semantic core is exported only from its implementation module for reconstruction composition; the package barrel exposes the stable public wrapper instead.
- Transition reconstruction and terminal-status comparison have one internal implementation called independently by admission and reconstruction without an import cycle.
- Boundary anchors are deterministically derived from the same snapshot descriptors used during recording, avoiding a second independently implemented boundary schedule.
- Exact recorder-output equality is required before boundary self-consistency checks, so reordered evidence cannot redefine its own trusted order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Kept the extracted semantic core out of the public package surface**

- **Found during:** Task 2 package-boundary review
- **Issue:** The existing wildcard barrel would have made the internal semantic core a new public API despite the plan assigning the shared public seam to `validateCurrentChronicle`.
- **Fix:** Replaced the validation wildcard with explicit public exports while keeping reconstruction's direct internal import.
- **Files modified:** `packages/replay/src/index.ts`
- **Verification:** Replay typecheck and lint pass; runtime-service and persistence continue importing the unchanged public wrapper and reconstruction APIs.
- **Committed in:** `3a62a49`

**2. [Code review blocker] Historical replay still used mutable current replay construction**

- **Fix:** Added a historical-only replay constructor that applies only the frozen v1.4 transition interpreter and compares historical snapshots without current helpers.
- **Committed in:** `a13763a`

**3. [Code review blocker] Current admission did not prove ordered events reconstruct transition after-states**

- **Fix:** Extracted a pure acyclic postcondition comparator and invoked it exactly once from both current semantic admission and reconstruction.
- **Committed in:** `cc3359a`

**4. [Code review blocker] Swapped snapshots and anchors could remain self-consistent**

- **Fix:** Required exact ordered equality with trusted recorder snapshots and boundary anchors before defense-in-depth boundary checks.
- **Committed in:** `09b4cb3`

**5. [Final code review blocker] Exact historical-v1.16 evidence used mutable current parsing**

- **Fix:** Added an explicit exact-historical dispatch branch to the frozen v1.4 validator and a historical-only vocabulary regression that current schema rejects.
- **Committed in:** `8706d4b`

**6. [Final code review blocker] Exact current tuple checks depended on JSON key insertion order**

- **Fix:** Replaced raw tuple `JSON.stringify` comparisons in admission and recording with the canonical tuple resolver; added a reordered-key regression.
- **Committed in:** `8706d4b`

---

**Total deviations:** 6 auto-fixed (1 missing critical boundary control, 5 code-review blockers).
**Impact on plan:** The correction narrows the API surface without changing valid Match state, Action legality, event order, outcome, Strategy observation, historical interpretation, or public output.

## Issues Encountered

- One package command accidentally forwarded an extra `--`, leaving Vitest on its default parallel worker behavior and reproducing five known 5-second contention timeouts. The exact serial package gate passed all 197 tests; no functional failure was present.

## Verification

- Focused exact current and historical dispatch suites: 59/59 passed.
- Full replay package suite with one worker: 14 files / 203 tests passed in 171.86 seconds.
- `@cowards/replay` typecheck and lint passed.
- Focused Prettier check and `git diff --check` passed.
- Frozen historical hashes remain `c331055e4aadba3fa01142bf764247c961d1b45483a310a11af5d66ce214d108` for grammar and `ff90b9938b9a6c85cafacf1d9b7856af70b4d87234819a50e60ab8666c37b477` for transition interpretation.
- No gameplay, event vocabulary, historical bytes, Plan 259-09 files, protected files, lockfile, or milestone-level planning files changed.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-14 can add exact ordinal/kind/coordinate/event/root comparison on top of the acyclic semantic admission and frozen historical dispatch.
- Runtime-service and persistence retain one identical public Chronicle semantic admission API.
- No compatibility decision or semantic delta was required.

## Self-Check: PASSED

- All declared created and modified files exist.
- RED commits `7237f84` and `b154fb1` precede GREEN commits `793bdd7` and `3a62a49`.
- Review fixes `a13763a`, `cc3359a`, and `09b4cb3` close all three blocking findings with regression coverage.
- Required focused and full replay gates pass.
- Original historical v1.4 interpretation remains disjoint and immutable.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
