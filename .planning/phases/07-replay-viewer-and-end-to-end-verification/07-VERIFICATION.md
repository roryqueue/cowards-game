---
phase: 07-replay-viewer-and-end-to-end-verification
status: passed
verified_at: 2026-05-17T23:41:15Z
score: 8/8 requirements verified
requirements:
  VIEW-01: verified
  VIEW-02: verified
  VIEW-03: verified
  VIEW-04: verified
  VIEW-05: verified
  VIEW-06: verified
  VIEW-07: verified
  TEST-06: verified
gaps: []
---

# Phase 7 Verification Report

## Verdict

Status: `passed`.

VIEW-04 is now verified. The replay route keeps public projection as the default, and owner/debug replay is reachable only through a gated test/debug query path that supplies `allowOwnerDebug: true` plus `ownerPlayerId`. The browser fixture proves public replay omits private markers and that gated owner mode exposes the active Soldier Awareness Grid.

TEST-06 is now verified. The static 503 worker helper has been replaced with a service-backed one-shot worker harness, the Workshop Playwright spec fails on any non-200 helper response, and the enabled browser run passed against local PostgreSQL with migrations applied.

## Fixed Gaps

| Gap | Status | Evidence |
| --- | --- | --- |
| VIEW-04 owner/debug Awareness Grid route reachability | PASS | `apps/web/app/matches/[matchId]/replay/page.tsx` resolves gated owner-debug search params; `owner-debug.ts` requires `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1`; `replay-state.ts` extracts `private:event:{sequence}.awarenessGrid`; `replay-client.tsx` renders a 5x5 Awareness Grid. |
| Public replay remains default/private-safe | PASS | Public route calls still pass no owner options by default; `replay.fixture.spec.ts` asserts public mode has no owner debug or private markers. |
| `run-worker-once` static 503 scaffold | PASS | `apps/web/app/api/test-support/run-worker-once/route.ts` now gates production with 404, then spawns `pnpm --filter @cowards/worker exec tsx -e ... runWorkerOnce(...)` for test support. Unit tests cover disabled, success, and service failure paths. |
| Workshop E2E accepting helper 503 | PASS | `apps/web/e2e/workshop-to-replay.spec.ts` now expects HTTP 200 and `{ status: "ok" }` from the worker helper. |
| TEST-06 full edit -> submit revision -> create MatchSet -> execute -> replay browser run | PASS | `RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm e2e -- workshop-to-replay.spec.ts` passed desktop and mobile after applying migrations to local PostgreSQL. |
| Persisted Match replay route | PASS | The replay facade decodes URL-encoded Match ids before Chronicle lookup, so persisted ids containing `:` open from browser links. |
| MatchSet status refresh on PostgreSQL enums | PASS | `packages/persistence/src/matchset-status.ts` casts `$1::match_set_status`, fixing the enum parameter mismatch found by the service-backed E2E. |

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @cowards/web test -- app/matches/server.test.ts 'app/matches/[matchId]/replay/owner-debug.test.ts' 'app/matches/[matchId]/replay/replay-state.test.ts' 'app/matches/[matchId]/replay/replay-client.test.tsx' app/api/test-support/run-worker-once/route.test.ts app/workshop/workshop-client.test.tsx app/workshop/server.test.ts` | PASS | 8 files, 35 tests passed. |
| `pnpm --filter @cowards/web typecheck` | PASS | `tsc --noEmit` passed. |
| `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` | PASS | 4 passed: desktop/mobile public replay and desktop/mobile owner-debug Awareness Grid. |
| `COWARDS_TEST_WORKER_MAX_JOBS=0 pnpm --filter @cowards/worker exec tsx -e '...'` | PASS | Confirmed the helper command shape can import `./src/runner.ts` from the worker package without live storage. |
| `PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts` | PASS/SKIPPED | 2 skipped because `RUN_SERVICE_E2E` was not set. |
| `RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm e2e -- workshop-to-replay.spec.ts` | PASS | 2 passed: desktop and mobile full Workshop edit -> submit revision -> create MatchSet -> worker execution -> replay viewing. |

## Residual Risk

The service-backed Workshop E2E requires local PostgreSQL and applied migrations. This verification installed and started PostgreSQL locally because Docker was unavailable in the environment; Redis is still not exercised by the current app path. The test-support helper remains gated to `PLAYWRIGHT_TEST=1` or `NODE_ENV=test` and returns 404 outside those environments.

_Verified: 2026-05-17T23:41:15Z_
_Verifier: Codex phase-gap worker_
