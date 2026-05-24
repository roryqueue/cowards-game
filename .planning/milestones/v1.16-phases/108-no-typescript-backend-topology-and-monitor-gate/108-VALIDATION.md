# Phase 108 Validation

**Validated:** 2026-05-24

## Commands

```bash
pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts
pnpm boundary:monitors
pnpm topology:check -- --require-v1-16-no-typescript-backend --json
COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm exec tsx scripts/check-boundary-monitors.ts
COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm exec vitest run scripts/check-boundary-monitors.test.ts -t "passes the live repository monitor checks"
```

## Results

- Focused topology and boundary monitor tests: **passed**, 2 files and 24 tests.
- `pnpm boundary:monitors`: **passed**, including `[topology] v1.16 no-TypeScript-backend topology artifact`; current broad web report-only baseline is 17/22 known offenses.
- Strict live topology: **passed**, `ok=true`.
- Live-required boundary monitor: **passed**, 27 required live v1.16 no-TypeScript-backend topology diagnostics.
- Review warning regression command: **passed**, 1 live repository monitor test passed and 11 tests skipped by filter.

## Live Strict Topology Evidence

The strict live run was saved to:

`.planning/artifacts/v1.16-no-typescript-backend-topology-live.json`

That run verified:

- runtime-service health at `http://127.0.0.1:3107`
- web health at `http://localhost:3000`
- 11 representative page types loaded
- 7 selected Go pages loaded
- web-through-Go public Strategy read rendered Go Parity Sentinel
- Go public player, ladder, MatchSet, replay metadata, replay evidence, Strategy, health, and owner analytics auth-gate checks passed
- v1.15 lifecycle, failure drill, rollback, and promotion evidence still passed
- v1.16 no-TypeScript-backend contract checks passed
- diagnostic output contained no private markers

## Review Fix Validation

After code review found blockers in live monitor defaults, frontend-only web health acceptance, and artifact drift coverage:

- `checkTopologyDiagnostics()` now builds live mode from `parseTopologyOptions(["--require-v1-16-no-typescript-backend"])`, preserving strict defaults.
- Strict mode rejects a web `/api/service/health` response with `service="cowards-web"` or `backendAuthority="frontend-only"`.
- `validateV116NoTypeScriptBackendTopologyArtifact()` now validates the markdown artifact plus `monitorMode` and `pageSmoke` fields.
- Focused tests now include negative coverage for frontend-only health, broadened TypeScript process roles, missing page smoke requirements, stale live monitor topology, and markdown privacy leaks.
- The former WR-01 regression gap is closed by `scripts/check-boundary-monitors.test.ts`, which now sets `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`, mocks the strict representative and selected Go page smoke responses, and asserts `required live v1.16 no-TypeScript-backend topology diagnostics checked`.

## Requirement Coverage

- **GATE-01/GATE-02:** `--require-v1-16-no-typescript-backend` now exists and requires web, Go, runtime service, selected Go pages, representative page smoke, web-through-Go reads, v1.15 lifecycle evidence, and v1.16 no-TypeScript-backend artifacts.
- **GATE-03/GATE-08:** Representative page smoke and selected replay realism are required by strict mode and passed in the live run.
- **GATE-04/GATE-06:** Boundary monitors consume route, runtime, worker quarantine, final surface label, and v1.16 topology artifacts.
- **GATE-05:** The v1.16 topology artifact and strict diagnostics use public-output privacy checks.
- **GATE-07:** Stopped-Go and stopped-runtime-service behavior remains represented through fail-closed/classified failure-drill artifact checks, with no TypeScript backend fallback.
- **GATE-09:** The topology artifact records TypeScript's remaining production-ish role as only frontend plus isolated JS/TS Strategy runtime service.

## Residual Risks

- Default `pnpm boundary:monitors` keeps live topology optional for routine local use. `COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm boundary:monitors` upgrades that lane to the v1.16 strict topology path.
- Runtime isolation still records container subprocess evidence as skipped/evidence-only, which is consistent with v1.16 scope: JS/TS Strategy support remains in the isolated runtime service, not a final sandbox replacement.

## Status

**PASS.** Phase 108 has an executable no-TypeScript-backend topology mode, artifact-backed monitor gate, live page-smoke evidence, and no-fallback contract checks.
