---
phase: 51-service-contract-generation-and-route-migration
plan: 03
subsystem: api
tags: [service-boundary, import-guard, openapi, privacy, nextjs]
requires:
  - phase: 51-service-contract-generation-and-route-migration
    provides: "v1.8 service contract artifact and migrated public read slice from Plans 51-01 and 51-02"
provides:
  - "Strict named-slice import guard for migrated route/page files"
  - "Report-only apps/web/app import debt scan with deterministic diagnostics"
  - "Root boundary:imports command composed with Phase 51 verification"
  - "Public-only OpenAPI artifact output with private runtime limit keys excluded"
affects: [phase-51, phase-52, boundary-monitors, public-contracts]
tech-stack:
  added: []
  patterns:
    - "Use TypeScript AST import/export declarations for static boundary scans."
    - "Keep broad apps/web/app direct-import debt report-only until a later strict monitor phase."
    - "Public OpenAPI output includes public route contracts only; owner/internal schemas remain source metadata, not public artifact payload."
key-files:
  created:
    - scripts/check-service-boundary-imports.ts
    - scripts/check-service-boundary-imports.test.ts
  modified:
    - package.json
    - eslint.config.mjs
    - packages/spec/scripts/generate-service-openapi.ts
    - packages/spec/artifacts/service-api-v1.8.openapi.json
    - packages/spec/src/competition.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/service.ts
    - packages/spec/src/service-contract.test.ts
    - packages/service/src/service.test.ts
key-decisions:
  - "Implemented the boundary check with the TypeScript compiler API to avoid comment/string false positives."
  - "Kept broad apps/web/app findings visible but non-blocking; only named migrated files determine the exit code."
  - "Restricted the committed OpenAPI artifact to public routes and public runtime metadata to satisfy the public privacy gate."
patterns-established:
  - "Boundary guard output uses deterministic `STRICT`/`REPORT` file:line diagnostics plus strict/report counts."
  - "Public Strategy and MatchSet DTO schemas expose runtime identity/package metadata without runtime limits."
requirements-completed: [GEN-03, GEN-07]
duration: 13min
completed: 2026-05-22
---

# Phase 51 Plan 03: Boundary Import Guard Summary

**Strict migrated-route import enforcement with report-only legacy app debt scanning and privacy-safe public OpenAPI output**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-22T19:57:13Z
- **Completed:** 2026-05-22T20:09:44Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added `scripts/check-service-boundary-imports.ts`, which fails on forbidden direct imports in the five named migrated route/page files and reports broader `apps/web/app` debt without failing.
- Added root `pnpm boundary:imports` wiring while keeping broad enforcement out of `test:fast`.
- Added focused Vitest coverage for strict failures, report-only findings, and comment/string false-positive avoidance.
- Tightened public contract generation so the committed OpenAPI artifact contains public route operations and excludes forbidden private/runtime key strings.

## Task Commits

1. **Task 1 RED:** `a8a0762` test strict/report-only service boundary import behavior.
2. **Task 1 GREEN:** `c8d04b5` implement strict named-slice import guard and root-script ESLint allowance.
3. **Task 2:** `e8ae07c` wire root `boundary:imports` command.
4. **Task 3:** `ac81e49` fix public contract artifact privacy and rerun integrated verification.

## Files Created/Modified

- `scripts/check-service-boundary-imports.ts` - AST-based strict named-slice import guard plus report-only app scan.
- `scripts/check-service-boundary-imports.test.ts` - Guard behavior tests using synthetic temp repos.
- `package.json` - Added `boundary:imports`; existing `contract:check` and `contract:lint` retained.
- `eslint.config.mjs` - Allowed root scripts in the parser project service.
- `packages/spec/scripts/generate-service-openapi.ts` - Emits public route contracts only.
- `packages/spec/artifacts/service-api-v1.8.openapi.json` - Regenerated public OpenAPI artifact.
- `packages/spec/src/competition.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/service.ts` - Public runtime DTO shape now omits runtime limits.
- `packages/spec/src/service-contract.test.ts`, `packages/service/src/service.test.ts` - Regression coverage updated for public artifact privacy.

## Decisions Made

- Used TypeScript AST parsing for direct import/export-from declarations rather than raw line scanning.
- Kept report-only findings out of the process exit code per D-11.
- Treated runtime limit field names as non-public artifact data, even though they are limits rather than memory payloads, because the Phase 51 privacy gate rejects those strings in committed public contract output.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added ESLint project-service allowance for root guard scripts**
- **Found during:** Task 1
- **Issue:** `eslint` could not parse new root-level `scripts/*.ts` files because only `packages/spec/scripts/*.ts` was in `allowDefaultProject`.
- **Fix:** Added `scripts/*.ts` to the existing targeted parser project-service allowance.
- **Files modified:** `eslint.config.mjs`
- **Verification:** `pnpm exec eslint scripts/check-service-boundary-imports.ts scripts/check-service-boundary-imports.test.ts` passed.
- **Committed in:** `c8d04b5`

**2. [Rule 1 - Bug] Removed forbidden private/runtime key strings from the public artifact**
- **Found during:** Task 3
- **Issue:** The artifact privacy command failed because the generated OpenAPI included owner/internal route schemas and public runtime `limits` field names such as `strategyMemoryBytes`, `soldierMemoryBytes`, `objectivePayloadBytes`, and `stderrBytes`.
- **Fix:** Limited generated OpenAPI output to public routes and introduced public runtime metadata schemas that omit runtime limits.
- **Files modified:** `packages/spec/scripts/generate-service-openapi.ts`, `packages/spec/artifacts/service-api-v1.8.openapi.json`, `packages/spec/src/competition.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/service.ts`, `packages/spec/src/service-contract.test.ts`, `packages/service/src/service.test.ts`
- **Verification:** Contract check, Redocly lint, spec/service/web tests, typechecks, and private-key artifact scan passed.
- **Committed in:** `ac81e49`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required to keep the planned verification gate runnable and privacy-safe. No route migrations, writes, auth, orchestration, runtime execution, GraphQL/gRPC/TypeSpec, docs UX, or generated client work was added.

## Issues Encountered

- `pnpm boundary:imports` reports 22 broad legacy `apps/web/app` findings while exiting 0. These are intentionally report-only for Phase 51:
  - `apps/web/app/competitive/server.ts` - 9
  - `apps/web/app/matches/replay-fixture.ts` - 1
  - `apps/web/app/matches/replay-ready.ts` - 1
  - `apps/web/app/matches/server.test.ts` - 1
  - `apps/web/app/matches/server.ts` - 3
  - `apps/web/app/workshop/evidence/evidence-state.test.ts` - 1
  - `apps/web/app/workshop/heatmap-state.test.ts` - 1
  - `apps/web/app/workshop/server.ts` - 3
  - `apps/web/app/workshop/types.ts` - 2

## Verification

- `pnpm --filter @cowards/spec contract:check` - passed.
- `pnpm contract:lint` - passed.
- `pnpm boundary:imports` - passed with `strict_offenses=0 report_only_offenses=22`.
- `pnpm --filter @cowards/spec test` - passed, 28 tests.
- `pnpm --filter @cowards/service test` - passed, 6 tests.
- `pnpm --filter @cowards/web test` - passed, 94 tests.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/service typecheck` - passed.
- `pnpm --filter @cowards/web typecheck` - passed.
- `node -e 'const a=require("./packages/spec/artifacts/service-api-v1.8.openapi.json"); const ids=JSON.stringify(a); for (const id of ["getPublicMatchSetSummary","getPublicReplayMetadata","getPublicStrategyPage"]) if (!ids.includes(id)) process.exit(1)'` - passed.
- `node -e 'const s=JSON.stringify(require("./packages/spec/artifacts/service-api-v1.8.openapi.json")); for (const k of ["strategyMemory","soldierMemory","objectivePayload","ownerDebug","awarenessGrid","stackTrace","stderr","tokens","hostPath","privateRuntimeInternals"]) if (s.includes(k)) process.exit(1)'` - passed.
- `pnpm exec prettier --check ...` on changed source/script files - passed.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 52 can consume the committed public v1.8 OpenAPI artifact and rely on `boundary:imports` to ratchet named migrated route/page files. Broader app import debt remains visible for a later strict monitor phase.

## Self-Check: PASSED

- Created files verified present.
- Summary file verified present.
- Task commits verified present: `a8a0762`, `c8d04b5`, `e8ae07c`, `ac81e49`.

---
*Phase: 51-service-contract-generation-and-route-migration*
*Completed: 2026-05-22*
