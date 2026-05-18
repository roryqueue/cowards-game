# Phase 13 UAT

**Phase:** Close Gap: Persisted Owner Replay Debug Authorization  
**Verified:** 2026-05-18  
**Result:** PASS

## User-Acceptance Scenarios

| Scenario | Result | Evidence |
| --- | --- | --- |
| A Workshop player can run a failing Strategy sample and open a persisted owner-debug replay. | Pass | `pnpm e2e:service` |
| Owner debug replay shows a Soldier inactivity explanation for thrown exception runtime failure. | Pass | Service E2E asserts `THROWN_EXCEPTION` in `replay-soldier-inactivity-explanation` |
| The same Match remains public/privacy-safe through the public replay URL. | Pass | Service E2E public privacy assertions |
| A caller cannot request arbitrary opponent owner data via `ownerPlayerId`. | Pass | Code-review fix and server tests scope authorization to local Workshop MatchSets and `player:workshop-local` |
| Docker path works end to end after this phase. | Pass | `pnpm preflight:docker -- --skip-web` |

## Notes

No UAT gaps remain for Phase 13.
