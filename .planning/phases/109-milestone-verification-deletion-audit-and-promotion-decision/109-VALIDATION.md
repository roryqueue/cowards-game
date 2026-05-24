# Phase 109 Validation

**Validated:** 2026-05-24

## Commands

```bash
pnpm --filter @cowards/runtime-service test
pnpm --filter @cowards/runtime-service typecheck
pnpm --filter @cowards/service test
pnpm --filter @cowards/web typecheck
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts
pnpm topology:check -- --require-v1-16-no-typescript-backend --json --web-url http://localhost:3000 --go-url http://127.0.0.1:8087 --runtime-service-url http://127.0.0.1:3107
pnpm boundary:monitors
COWARDS_REQUIRE_LIVE_TOPOLOGY=1 COWARDS_WEB_URL=http://localhost:3000 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 pnpm exec tsx scripts/check-boundary-monitors.ts
PLAYWRIGHT_TEST=1 COWARDS_ENABLE_REPLAY_FIXTURES=1 pnpm exec playwright test --project=desktop replay.visual.spec.ts
git diff --check
```

## Results

- Runtime service tests: **passed**, 3 files / 18 tests.
- Runtime service typecheck: **passed**.
- Service tests: **passed**, 1 file / 23 tests.
- Web typecheck: **passed**.
- Go backend tests: **passed**.
- Topology/monitor unit tests: **passed**, 2 files / 24 tests.
- Strict v1.16 topology: **passed**, `ok=true`, 27 required checks.
- Boundary monitors: **passed**.
- Live-required boundary monitor: **passed**, 27 required live v1.16 diagnostics.
- Replay visual realism: **passed**, 7 desktop tests after enabling the explicit fixture gate.
- `git diff --check`: **passed**.

## Replay Visual Note

The first visual replay attempt failed because the running web process did not have `COWARDS_ENABLE_REPLAY_FIXTURES=1`, and `/api/test-support/replay-fixture` returned 404. That failure is consistent with Phase 107's fixture quarantine. The web process was restarted with `COWARDS_NO_TYPESCRIPT_BACKEND=1`, `COWARDS_GO_PUBLIC_STRATEGY_READS=1`, `COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087`, `COWARDS_ENABLE_REPLAY_FIXTURES=1`, and `PLAYWRIGHT_TEST=1`; the replay visual suite then passed.

## Exit Criteria

- **EXIT-01:** PASS. Final verification suite passed.
- **EXIT-02:** PASS. Deletion/quarantine audit created at `.planning/artifacts/v1.16-deletion-quarantine-audit.md`.
- **EXIT-03:** PASS. Promotion decision created at `.planning/artifacts/v1.16-promotion-decision.md`.
- **EXIT-04:** Pending archive/tag step.
- **EXIT-05:** PASS. v1.16 artifacts and diagnostics are checked by boundary monitors, topology privacy checks, public-output guards, and `git diff --check`.

## Status

**PASS pending archive/tag.**
