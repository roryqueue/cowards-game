# Phase 121 Summary

## Completed

- Added `apps/web/e2e/v1-18-exhibition-proof.spec.ts`.
- The proof is gated because it requires live Postgres, Redis, web, Go live backend, runtime-service, and an internal Go token.
- The spec signs up, saves JS/TS and Python account revisions, creates a non-counted exhibition, invokes Go run-once, opens MatchSet result, opens replay, and checks public output privacy markers.

## Evidence

- `pnpm --filter @cowards/web typecheck` passed.
- `RUN_V1_18_PROOF=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_GO_BACKEND_INTERNAL_TOKEN=v118-local-token PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --workers=1 v1-18-exhibition-proof.spec.ts` passed.
- Browser inspection confirmed Python appears in the result, `non_counted` status appears, replay evidence is linked, the replay board is visible, no runtime violation text appears, and no private leak markers appear.
- Final proof MatchSet: `match-set:exhibition:4voBvoakl8fcAs8yMGQeEQ`.
