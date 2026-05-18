---
phase: 11-doctrine-debugging-ux
plan: 04
subsystem: replay
tags: [typescript, zod, replay, debug-ux]
requires:
  - phase: 11-doctrine-debugging-ux
    plan: 01
    provides: Runtime violation guidance and privacy-safe mapping patterns
provides:
  - Shared Soldier inactivity explanation cause DTOs and schemas
  - Pure replay-derived Soldier inactivity explanation generator
  - Cause coverage tests for owner debug explanations
affects: [11-doctrine-debugging-ux, replay, spec]
tech-stack:
  added: []
  patterns: [stable cause codes, replay-derived debug DTOs, privacy-safe labels]
key-files:
  created:
    - packages/replay/src/debug-explanations.ts
    - packages/replay/src/debug-explanations.test.ts
    - .planning/phases/11-doctrine-debugging-ux/11-04-SUMMARY.md
  modified:
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts
    - packages/replay/src/index.ts
key-decisions:
  - "Define eight stable Soldier inactivity cause codes in @cowards/spec."
  - "Derive not_selected from active round snapshots plus ACTIVATION_STARTED facts instead of exposing raw activation orders."
  - "Map runtime explanations from RuntimeViolation.type only and omit raw messages, stacks, Strategy source, memory, objectives, and Awareness Grid payloads."
patterns-established:
  - "Owner debug explanation DTOs carry soldierId, optional playerId, cause, label, remediation, sequence, and optional public-safe details."
  - "Replay debug derivation uses Chronicle events and boundary snapshots without React, persistence, clocks, randomness, filesystem, or network access."
requirements-completed: [DEBUG-04, DEBUG-05]
duration: 36min
completed: 2026-05-18
---

# Phase 11: Plan 11-04 Summary

**Owner-only Soldier inactivity explanation DTOs and replay derivation are ready for UI consumption.**

## Accomplishments

- Added `SoldierInactivityExplanationCause` and `SoldierInactivityExplanationDto` shared contracts with the required D-02 cause codes: `not_selected`, `invalid_action`, `blocked_movement`, `timeout`, `thrown_exception`, `stone`, `fallen`, and `match_ended`.
- Added Zod schemas and spec tests for required fields, non-empty labels/remediations, all cause codes, and JSON-safe optional details.
- Added `buildSoldierInactivityExplanations` in replay to derive concise owner debug explanations from Chronicle events and boundary snapshots.
- Covered not-selected Soldiers, invalid output/immediate reversal, blocked move/push, runtime timeout/exception, STONE, FALLEN, Match end, sequence linkage, determinism, and privacy boundaries.
- Exported the replay helper from `@cowards/replay`.

## Decisions Made

`not_selected` is reconstructed from the active Soldiers visible in the replay snapshot at `STRATEGY_EVALUATED` and the matching Round's `ACTIVATION_STARTED` events. This keeps raw activation order objectives private while still deriving the explanation from replay facts.

Runtime causes are keyed from `RuntimeViolation.type`; DTO details include only stable public-safe codes such as `runtimeViolationType`, movement `reason`, and `targetSoldierId`.

## Deviations from Plan

None. The implementation stayed within spec/replay/planning files and did not touch web or workshop code.

## Verification

- `pnpm --filter @cowards/spec test -- spec.test.ts` - passed
- `pnpm --filter @cowards/replay test -- debug-explanations.test.ts` - passed; package script also ran the replay suite
- `pnpm --filter @cowards/spec typecheck` - passed
- `pnpm --filter @cowards/replay typecheck` - passed

## User Setup Required

None.

## Next Phase Readiness

Replay/UI consumers can now render owner debug explanations from stable DTOs without inferring game rules in React or exposing private Strategy/runtime payloads.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
