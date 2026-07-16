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
  - canonical transition, state, lifecycle, event, boundary, and terminal validation before reconstruction
affects: [259-14, runtime-service-admission, persistence-admission, replay-reconstruction]

tech-stack:
  added: []
  patterns:
    - exact compatibility identity resolution before schema or grammar admission
    - internal semantic core behind one public shared Chronicle validator
    - reconstruction depends on semantic admission without a reverse validation dependency

key-files:
  created: []
  modified:
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/record.ts
    - packages/replay/src/replay-transition.ts
    - packages/replay/src/replay-transition.test.ts
    - packages/replay/src/index.ts

key-decisions:
  - "Original historical v1.4 evidence is admitted only by the frozen historical grammar; current snapshot, grammar, transition, and migration helpers are unreachable from that route."
  - "validateCurrentChronicle remains the sole public semantic admission API, while validateCurrentChronicleSemantics is module-internal to replay validation and reconstruction."
  - "Replay reconstruction calls semantic admission exactly once, then compares transition state hashes, ordered events, terminal data, and final state without creating a validation cycle."

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
    description: "Current Chronicle admission validates the canonical transition, semantic state, lifecycle, event, boundary, outcome, and terminal contracts through one non-reconstructing core."
    requirement: CHRN-03
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#keeps current semantic admission acyclic and single-invocation"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/replay exec vitest run --maxWorkers=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Historical v1.4 bytes and interpretation remain isolated from mutable current validation and reconstruction."
    requirement: CHRN-06
    verification:
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts"
        status: pass
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#routes original historical evidence only through the frozen grammar without requiring current snapshots"
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
- Moved current reconstruction ownership out of the transition helper module so validation has no reverse reconstruction import or call.
- Kept only `validateCurrentChronicle` in the package public admission surface; the semantic core remains an internal replay implementation seam.

## Task Commits

1. **Task 1 RED: Version-first routing and no-probe vectors** — `7237f84` (test)
2. **Task 1 GREEN: Frozen historical admission isolation** — `793bdd7` (feat)
3. **Task 2 RED: Acyclic single-core semantic admission contract** — `b154fb1` (test)
4. **Task 2 GREEN: Canonical semantic admission and reconstruction ownership** — `3a62a49` (feat)

## Files Created/Modified

- `packages/replay/src/validate.ts` — Exact current semantic core, public wrapper, canonical transition validation, and frozen historical routing.
- `packages/replay/src/validate.test.ts` — Version-first no-read vectors and acyclic single-invocation proof.
- `packages/replay/src/reconstruct.ts` — Current transition-by-transition reconstruction after exactly one semantic admission.
- `packages/replay/src/record.ts` — Shared deterministic boundary-anchor derivation from recorder transitions.
- `packages/replay/src/replay-transition.ts` — Pure replay event/transition helpers without semantic validation ownership.
- `packages/replay/src/replay-transition.test.ts` — Reconstruction imports follow the new acyclic owner.
- `packages/replay/src/index.ts` — Public shared validator exports without exposing the internal semantic core.

## Decisions Made

- Historical admission intentionally does not require current snapshot structure. Original v1.4 grammar and vocabulary are the frozen authority for original evidence.
- The semantic core is exported only from its implementation module for reconstruction composition; the package barrel exposes the stable public wrapper instead.
- Boundary anchors are deterministically derived from the same snapshot descriptors used during recording, avoiding a second independently implemented boundary schedule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Kept the extracted semantic core out of the public package surface**

- **Found during:** Task 2 package-boundary review
- **Issue:** The existing wildcard barrel would have made the internal semantic core a new public API despite the plan assigning the shared public seam to `validateCurrentChronicle`.
- **Fix:** Replaced the validation wildcard with explicit public exports while keeping reconstruction's direct internal import.
- **Files modified:** `packages/replay/src/index.ts`
- **Verification:** Replay typecheck and lint pass; runtime-service and persistence continue importing the unchanged public wrapper and reconstruction APIs.
- **Committed in:** `3a62a49`

---

**Total deviations:** 1 auto-fixed (1 missing critical boundary control).
**Impact on plan:** The correction narrows the API surface without changing valid Match state, Action legality, event order, outcome, Strategy observation, historical interpretation, or public output.

## Issues Encountered

- One package command accidentally forwarded an extra `--`, leaving Vitest on its default parallel worker behavior and reproducing five known 5-second contention timeouts. The exact serial package gate passed all 197 tests; no functional failure was present.

## Verification

- Focused current, historical, and reconstruction suites: 71/71 passed.
- Full replay package suite with one worker: 14 files / 197 tests passed.
- `@cowards/replay` typecheck and lint passed.
- Focused Prettier check and `git diff --check` passed.
- No gameplay, event vocabulary, historical bytes, protected files, lockfile, or milestone-level planning files changed.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-14 can add exact ordinal/kind/coordinate/event/root comparison on top of the acyclic semantic admission and frozen historical dispatch.
- Runtime-service and persistence retain one identical public Chronicle semantic admission API.
- No compatibility decision or semantic delta was required.

## Self-Check: PASSED

- All seven declared modified files exist.
- RED commits `7237f84` and `b154fb1` precede GREEN commits `793bdd7` and `3a62a49`.
- Required focused and full replay gates pass.
- Original historical v1.4 interpretation remains disjoint and immutable.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
