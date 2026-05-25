---
phase: 137
status: complete
requirements:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05
  - UX-06
files_modified:
  - apps/web/app/matchsets/evidence-copy.ts
  - apps/web/app/matchsets/evidence-copy.test.ts
  - apps/web/app/matchsets/[matchSetId]/page.tsx
  - apps/web/app/matches/[matchId]/replay/replay-client.tsx
  - scripts/check-boundary-monitors.ts
---

# Phase 137 Summary

## Completed

- Added shared public-safe reliability evidence copy for MatchSet and replay panels.
- Enhanced the existing MatchSet evidence panel with status, match-state, retry policy, timeout budget, runtime evidence, candidate lane, proof limit, entrant, and privacy rows.
- Enhanced the existing replay evidence panel with status, timeout budget, candidate lane, runtime evidence, and privacy rows.
- Preserved v1.19 evidence markers through the shared helper and updated boundary monitors to follow the refactor.
- Added focused tests for running/slow state copy, JS/TS-only running copy, strategy-failed vs system-failed retry wording, blocked/invalid/no-result categories, candidate non-promotion wording, privacy exclusions, and status chip classes.

## Evidence

- `pnpm exec vitest run apps/web/app/matchsets/evidence-copy.test.ts` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run apps/web/app/matchsets/evidence-copy.test.ts scripts/check-boundary-monitors.test.ts` passed.

## Notes

The UI intentionally does not expose raw runtime diagnostics. Candidate wording remains scoped to readiness evidence and avoids production sandbox certification claims.
