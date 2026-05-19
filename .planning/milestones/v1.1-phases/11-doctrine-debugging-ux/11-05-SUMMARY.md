---
phase: 11-doctrine-debugging-ux
plan: 05
subsystem: replay
tags: [typescript, replay, debug-ux, owner-debug]
requires:
  - phase: 11-doctrine-debugging-ux
    plan: 04
    provides: Shared Soldier inactivity explanation DTOs and replay generator
provides:
  - Owner-only replay-ready Soldier inactivity explanation DTO wiring
  - Pure replay-state selectors for selected Soldier inactivity explanations
  - Owner debug replay UI rendering behind the existing opt-in checkbox
affects: [11-doctrine-debugging-ux, web, replay]
tech-stack:
  added: []
  patterns: [owner-only DTO fields, selector-driven replay UI, opt-in debug rendering]
key-files:
  created:
    - .planning/phases/11-doctrine-debugging-ux/11-05-SUMMARY.md
  modified:
    - apps/web/app/matches/types.ts
    - apps/web/app/matches/replay-ready.ts
    - apps/web/app/matches/[matchId]/replay/replay-state.ts
    - apps/web/app/matches/[matchId]/replay/replay-state.test.ts
    - apps/web/app/matches/[matchId]/replay/replay-client.tsx
    - apps/web/app/matches/[matchId]/replay/replay-client.test.tsx
key-decisions:
  - "ReplayReadyDto now carries optional ownerDebug.soldierInactivityExplanations only for trusted owner debug mode."
  - "Replay-state helpers select the nearest explanation at or before the current sequence and expose only DTO fields."
  - "The owner replay client starts with owner debug hidden; explanations render only after the owner checkbox is enabled."
requirements-completed: [DEBUG-04, DEBUG-05]
completed: 2026-05-18
---

# Phase 11: Plan 11-05 Summary

**Owner-only Soldier inactivity explanations now flow from replay-ready DTOs into the replay inspector.**

## Accomplishments

- Added `ReplayReadyDto.ownerDebug.soldierInactivityExplanations` as an optional owner-only field.
- Wired `buildReadyReplayFromChronicle` to call `buildSoldierInactivityExplanations` only after owner mode is trusted with `allowOwnerDebug` and `ownerPlayerId`.
- Added pure replay-state helpers for formatting cause codes and selecting the selected Soldier's nearest inactivity explanation at or before the current sequence.
- Rendered `Why this Soldier did nothing` in the owner replay inspector behind the existing owner debug checkbox, before raw owner debug JSON.
- Added tests covering public DTO omission, owner DTO inclusion, Chronicle-helper parity, selector behavior, and source-level UI gating.

## Decisions Made

Owner debug now defaults to hidden in the replay client. This keeps explanation copy opt-in even when the server provides owner replay data.

The selector returns DTO-derived label, cause code, remediation, source event sequence, and public-safe details. It does not inspect board geometry, facings, bounds, legal moves, or Action schemas.

## Deviations from Plan

The client test file continues the existing source-level testing style because the current web Vitest setup preserves TSX and cannot import `replay-client.tsx` directly. DTO assembly and selector behavior are tested with executable assertions.

## Verification

- `pnpm --filter @cowards/web test -- replay-client.test.tsx replay-state.test.ts` - passed
- `pnpm --filter @cowards/web typecheck` - passed

## User Setup Required

None.

## Next Phase Readiness

Replay owner debug can now show concise, DTO-derived Soldier inactivity explanations without exposing them in public replay data or inferring game rules in React.

---
*Phase: 11-doctrine-debugging-ux*
*Completed: 2026-05-18*
