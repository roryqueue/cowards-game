---
phase: 103-typescript-backend-inventory-and-retirement-contract
plan: 1
subsystem: planning
tags: [typescript, backend-retirement, inventory, monitors, vitest]
requires:
  - phase: 102-topology-monitors-rollback-and-promotion-gate
    provides: v1.15 Go backend ownership, topology, rollback, and monitor baseline
provides:
  - Deterministic TypeScript backend-like surface inventory scanner and stale-output checker
  - Machine-readable v1.16 TypeScript backend retirement manifest
  - Human-readable v1.16 TypeScript backend retirement matrix
  - Phase 103 validation and downstream monitor contract
affects: [phase-104, phase-105, phase-106, phase-107, phase-108]
tech-stack:
  added: []
  patterns:
    - TypeScript AST source scanning with explicit retirement classification overlay
    - Generated JSON plus markdown artifacts from one manifest source
key-files:
  created:
    - scripts/generate-typescript-backend-inventory.ts
    - scripts/generate-typescript-backend-inventory.test.ts
    - .planning/artifacts/v1.16-typescript-backend-inventory.json
    - .planning/artifacts/v1.16-typescript-backend-inventory.md
    - .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md
    - .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
  modified:
    - package.json
key-decisions:
  - "Phase 103 emits monitor-ready fields now but defers strict no-TypeScript-backend enforcement to Phase 108."
  - "The v1.16 manifest allows TypeScript only as frontend, runtime boundary, parity, fixture, test, rollback, deferred, quarantined, or deleted."
patterns-established:
  - "Generated inventory artifacts are checked with `pnpm typescript-backend:inventory:check`."
  - "Deferred and rollback-only entries require owner, reason, gate, risk, and future migration metadata."
requirements-completed: [BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06]
duration: 35min
completed: 2026-05-24
---

# Phase 103: TypeScript Backend Inventory and Retirement Contract Summary

**Deterministic v1.16 TypeScript backend retirement inventory with strict role taxonomy, stale-artifact checks, and monitor-ready ownership fields**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-24T17:02:00Z
- **Completed:** 2026-05-24T17:20:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added `scripts/generate-typescript-backend-inventory.ts`, a deterministic TypeScript AST scanner with `--write` and `--check` modes.
- Added Vitest coverage for route discovery, local backend import chains, strict role taxonomy, deferred/rollback metadata requirements, stale artifact detection, and monitor-ready contract fields.
- Generated `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md` from the same manifest data.
- Recorded Phase 103 validation commands, BASE-01 through BASE-06 coverage, and downstream expectations for Phases 104-108.

## Task Commits

The user requested one atomic Phase 103 commit. All implementation, generated artifacts, tests, and validation notes are committed together in the final Phase 103 commit.

## Files Created/Modified

- `scripts/generate-typescript-backend-inventory.ts` - Scanner, manifest validator, markdown/JSON renderer, writer, and stale-output checker.
- `scripts/generate-typescript-backend-inventory.test.ts` - Contract tests for scanner behavior and manifest validation.
- `package.json` - Adds `typescript-backend:inventory` and `typescript-backend:inventory:check`.
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` - Machine-readable inventory with 180 discovered surfaces.
- `.planning/artifacts/v1.16-typescript-backend-inventory.md` - Human-readable matrix rendered from the JSON manifest data.
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md` - Validation commands, requirement mapping, and downstream monitor contract.
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md` - Completion summary.

## Requirement Coverage

| Requirement | Status |
| --- | --- |
| BASE-01 | Covered by scanner roots, route/method discovery, import evidence, and 180-surface manifest. |
| BASE-02 | Covered by strict allowed role validation and rejection of normal TypeScript backend labels. |
| BASE-03 | Covered by v1.15 baseline artifact references and Go baseline capability list. |
| BASE-04 | Covered by role classification for frontend, runtime, parity, fixture, test, rollback, deferred, quarantined, and deleted surfaces only. |
| BASE-05 | Covered by manifest and markdown non-goals. |
| BASE-06 | Covered by no-fallback, privacy marker, runtime isolation, rollback, deferred, and monitor-ready fields. |

## Commands Run

- `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts`
- `pnpm typescript-backend:inventory`
- `pnpm typescript-backend:inventory:check`
- `node -e "const m=require('node:fs').readFileSync('.planning/artifacts/v1.16-typescript-backend-inventory.json','utf8'); const j=JSON.parse(m); if(j.schemaVersion!=='v1.16-typescript-backend-inventory') throw new Error('bad schema'); if(j.globalPolicies.normalTypeScriptBackendAllowed!==false) throw new Error('normal TS backend allowed'); if(!Array.isArray(j.surfaces)||j.surfaces.length===0) throw new Error('missing surfaces');"`
- `pnpm boundary:imports`
- `pnpm boundary:monitors`
- `COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD=1 pnpm --filter @cowards/runtime-service start`
- `cd apps/go-backend && COWARDS_GO_BACKEND_OWNER_TOKENS=<redacted> go run .`
- `COWARDS_GO_PUBLIC_STRATEGY_READS=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 pnpm --filter @cowards/web dev`
- `COWARDS_WEB_URL=http://localhost:3000 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 pnpm boundary:monitors`

## Decisions Made

- Used one source of truth for JSON and markdown so the human matrix cannot drift from the monitor-ready manifest.
- Classified runtime service and runtime adapter rows as execution-boundary roles only, with validation preventing backend capabilities on those roles.
- Kept Phase 103 as inventory/contract work only; strict no-TypeScript-backend topology enforcement remains Phase 108 scope.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- Fixed a route path rendering bug during scanner test development: API paths initially rendered with a double slash. The test caught it before artifact generation.
- Initial `pnpm boundary:monitors` failed because live web, Go, and runtime-service endpoints were not running. After starting the local fixture Go backend, runtime service, and web dev server, the same monitor suite passed with 25 topology diagnostics checked.

## Known Stubs

None.

## Threat Flags

None. Phase 103 adds scanner and planning artifacts only; it does not add network endpoints, auth paths, schema changes, or runtime execution behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 104 can consume the v1.16 inventory to harden the isolated runtime service boundary. Phases 105-108 can use the manifest fields for fallback removal, quarantine, deferred relabeling, and strict no-TypeScript-backend monitor enforcement.

---
*Phase: 103-typescript-backend-inventory-and-retirement-contract*
*Completed: 2026-05-24*
