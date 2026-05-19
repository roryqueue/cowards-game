# Phase 09 UAT

**Phase:** Strict Chronicle Grammar and Compatibility  
**Verified:** 2026-05-18  
**Result:** PASS

## User-Acceptance Scenarios

| Scenario | Result | Evidence |
| --- | --- | --- |
| A developer/player loading an invalid Chronicle sees a clear failure instead of vague rendering. | Pass | `09-VERIFICATION.md`; web server invalid Chronicle diagnostics |
| Strict event ordering, required payloads, privacy constraints, and snapshot boundaries are enforced. | Pass | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts project.test.ts` |
| Version-incompatible Chronicles fail explicitly. | Pass | Server tests and `09-VALIDATION.md` |

## Notes

No UAT gaps remain for Phase 09.
