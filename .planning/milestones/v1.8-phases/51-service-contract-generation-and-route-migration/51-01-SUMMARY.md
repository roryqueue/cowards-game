---
phase: 51-service-contract-generation-and-route-migration
plan: 01
subsystem: api
tags: [openapi, zod, redocly, service-contract, privacy]
requires:
  - phase: 50-go-backend-spike
    provides: "v1.7 service boundary and read-only parity baseline"
provides:
  - "Canonical service-api-v1.8 route metadata in @cowards/spec"
  - "Zod service DTO and request schemas for route contract generation"
  - "Public-safe service fixtures and metadata/privacy contract tests"
  - "Deterministic OpenAPI 3.1 generation, stale check, Redocly lint, and committed artifact"
affects: [phase-51, phase-52, go-parity, boundary-monitors]
tech-stack:
  added: ["@redocly/cli@2.31.4"]
  patterns:
    - "SERVICE_API_ROUTES remains the canonical service route registry"
    - "Generated OpenAPI artifacts derive from @cowards/spec Zod schemas"
    - "Public route examples and public schemas are checked with assertPublicServiceDtoLeakSafe"
key-files:
  created:
    - packages/spec/src/service-fixtures.ts
    - packages/spec/src/service-contract.test.ts
    - packages/spec/scripts/generate-service-openapi.ts
    - packages/spec/artifacts/service-api-v1.8.openapi.json
  modified:
    - packages/spec/src/service.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/index.ts
    - packages/spec/src/spec.test.ts
    - packages/spec/package.json
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - eslint.config.mjs
    - .prettierignore
key-decisions:
  - "Kept SERVICE_API_ROUTES as the single route registry and enriched each entry with schema-backed metadata."
  - "Generated OpenAPI 3.1 JSON directly from Zod 4 schemas with deterministic key sorting."
  - "Kept generated JSON out of Prettier formatting so contract:check compares generator output exactly."
patterns-established:
  - "Route fixture refs use exported fixture object keys and are verified by service-contract.test.ts."
  - "OpenAPI stale checks use an exact failure message and compare committed output byte-for-byte."
requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04]
duration: 19min
completed: 2026-05-22
---

# Phase 51 Plan 01: Service Contract Generation Summary

**Canonical service-api-v1.8 metadata, public-safe DTO fixtures, and deterministic OpenAPI generation from @cowards/spec**

## Performance

- **Duration:** 19 min
- **Started:** 2026-05-22T19:24:53Z
- **Completed:** 2026-05-22T19:43:28Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Promoted `SERVICE_API_VERSION` to `service-api-v1.8` and enriched every retained service route with id, operation id, method/path, auth scope, privacy class, request/response/error schemas, examples, and fixture refs.
- Added Zod service request/response schemas and public DTO schemas for MatchSet summary, replay metadata, public player page, and public Strategy page.
- Added service fixtures and contract tests that verify metadata completeness, fixture ref resolution, schema parsing, and public privacy exclusions.
- Added deterministic OpenAPI generation/check scripts, Redocly lint wiring, and committed `packages/spec/artifacts/service-api-v1.8.openapi.json`.

## Task Commits

1. **Task 1 RED:** `59978f9` test route metadata and public DTO schema expectations.
2. **Task 1 GREEN:** `1313000` enrich canonical route metadata and add service schemas.
3. **Task 2 RED:** `e3dc9a1` add failing fixture-resolution contract tests.
4. **Task 2 GREEN:** `ef5ea04` add service fixture exports and fixture privacy tests.
5. **Task 3 RED:** `9413873` add failing committed OpenAPI artifact test.
6. **Task 3 GREEN:** `674b0f6` add generator, artifact, Redocly wiring, and tooling gate fixes.

## Files Created/Modified

- `packages/spec/src/service.ts` - Canonical v1.8 route registry and public DTO leak scanner updates.
- `packages/spec/src/schemas.ts` - Service request/response/public DTO Zod schemas.
- `packages/spec/src/service-fixtures.ts` - Exported fixture objects for every service route ref.
- `packages/spec/src/service-contract.test.ts` - Metadata, fixture, artifact, and public privacy tests.
- `packages/spec/scripts/generate-service-openapi.ts` - Deterministic OpenAPI generator with `--check`.
- `packages/spec/artifacts/service-api-v1.8.openapi.json` - Committed generated OpenAPI 3.1 artifact.
- `package.json`, `packages/spec/package.json`, `pnpm-lock.yaml` - Contract scripts and Redocly dependency.
- `pnpm-workspace.yaml`, `eslint.config.mjs`, `.prettierignore` - Tooling adjustments required by install/lint/format gates.

## Decisions Made

- Used direct Zod 4 `z.toJSONSchema()` conversion plus a small OpenAPI composer instead of adding a second schema DSL.
- Kept fixture refs as exported object keys so Phase 52 can consume stable fixture names.
- Added exact public-schema and public-example privacy tests instead of broad snapshot tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Approved dependency build scripts required by Redocly transitive deps**
- **Found during:** Task 3
- **Issue:** `pnpm add -D -w @redocly/cli@2.31.4` updated dependencies but exited with ignored build-script errors for `core-js` and `protobufjs`.
- **Fix:** Added those packages to workspace build approvals.
- **Files modified:** `pnpm-workspace.yaml`
- **Verification:** `pnpm install` completed successfully.
- **Committed in:** `674b0f6`

**2. [Rule 3 - Blocking] Included the generator in ESLint project service scope**
- **Found during:** Task 3 final verification
- **Issue:** `pnpm --filter @cowards/spec lint` could not parse `packages/spec/scripts/generate-service-openapi.ts` because it was outside the package tsconfig project.
- **Fix:** Added a targeted `allowDefaultProject` entry for the spec generator and switched the generator import to `@cowards/spec`.
- **Files modified:** `eslint.config.mjs`, `packages/spec/scripts/generate-service-openapi.ts`
- **Verification:** `pnpm --filter @cowards/spec lint` passed.
- **Committed in:** `674b0f6`

**3. [Rule 3 - Blocking] Excluded generated OpenAPI JSON from Prettier**
- **Found during:** Task 3 final verification
- **Issue:** `pnpm format:check` wanted to reformat the generated artifact, which would make `contract:check` fail.
- **Fix:** Added `packages/spec/artifacts/*.json` to `.prettierignore` so generated output remains byte-for-byte owned by the generator.
- **Files modified:** `.prettierignore`
- **Verification:** `pnpm format:check` and `pnpm --filter @cowards/spec contract:check` both passed.
- **Committed in:** `674b0f6`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** Tooling-only adjustments needed for the planned dependency, generator, and committed artifact. No route scope or architecture expansion.

## Issues Encountered

- Redocly required `servers`, license metadata, 4XX responses, and component-local `$defs` ref rewriting. The generator now emits lint-valid OpenAPI without suppressing Redocly recommended rules.

## Verification

- `pnpm contract:check` - passed.
- `pnpm contract:lint` - passed.
- `pnpm --filter @cowards/spec lint` - passed.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/spec test` - passed, 27 tests.
- `pnpm format:check` - passed.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
| --- | --- | --- |
| threat_flag: generated-contract | `packages/spec/artifacts/service-api-v1.8.openapi.json` | New generated service contract surface includes route schemas and examples; public routes are covered by leak-safe tests. |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 51 Plan 02 can consume the v1.8 route metadata and public DTO schemas when migrating the named read slice through `@cowards/service`. Phase 52 can use the committed OpenAPI artifact and fixture refs as the Go parity input.

## Self-Check: PASSED

- Created files verified present.
- Task commits verified present: `59978f9`, `1313000`, `e3dc9a1`, `ef5ea04`, `9413873`, `674b0f6`.

---
*Phase: 51-service-contract-generation-and-route-migration*
*Completed: 2026-05-22*
