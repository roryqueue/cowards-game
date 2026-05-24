# Phase 103 Validation

## Scope

Phase 103 establishes the v1.16 TypeScript backend inventory and retirement contract. It does not delete backend-like TypeScript code, migrate runtime execution, build the future Strategy Execution Service / Runtime Broker, or make every Phase 108 no-TypeScript-backend monitor strict.

JS/TS Strategy support remains in scope only through the isolated `runtime-service` and `runtime-adapter` roles. Go remains the normal backend baseline for orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.

## Validation Commands

| Command | Purpose |
| --- | --- |
| `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | Verifies scanner discovery, AST import evidence, role taxonomy, metadata requirements, stale artifact detection, and monitor-ready schema fields. |
| `pnpm typescript-backend:inventory` | Regenerates `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md` from one source of truth. |
| `pnpm typescript-backend:inventory:check` | Fails when generated JSON or markdown differs from the committed artifacts. |
| `node -e "const m=require('node:fs').readFileSync('.planning/artifacts/v1.16-typescript-backend-inventory.json','utf8'); const j=JSON.parse(m); if(j.schemaVersion!=='v1.16-typescript-backend-inventory') throw new Error('bad schema'); if(j.globalPolicies.normalTypeScriptBackendAllowed!==false) throw new Error('normal TS backend allowed'); if(!Array.isArray(j.surfaces)||j.surfaces.length===0) throw new Error('missing surfaces');"` | Smoke-checks the machine-readable manifest schema, normal-backend prohibition, and non-empty inventory. |
| `pnpm boundary:imports` | Confirms existing web boundary import baseline still has zero strict offenses. |
| `pnpm boundary:monitors` | Validates existing v1.15 contract, privacy, topology, parity, sandbox, and monitor baseline while Phase 103 prepares v1.16 monitor-ready fields. |

## Requirement Coverage

| Requirement | Artifact Coverage | Automated Coverage |
| --- | --- | --- |
| BASE-01 | JSON and markdown inventory list Next.js API routes, web/server modules, persistence imports, service uses, worker lifecycle paths, runtime-service paths, runtime-js adapter paths, test paths, fixtures, rollback, and deferred surfaces. | Scanner tests plus `pnpm typescript-backend:inventory:check`. |
| BASE-02 | Manifest `allowedRoles` is restricted to `frontend-only`, `runtime-service`, `runtime-adapter`, `parity-only`, `fixture-only`, `test-only`, `rollback-only`, `deferred`, `quarantined`, and `deleted`; normal TypeScript backend labels are invalid. | Role taxonomy and deferred/rollback metadata tests. |
| BASE-03 | Manifest baseline references cite v1.15 lifecycle ownership, surface labels, topology, failure drills, promotion decision, and boundary baseline artifacts. | Schema smoke check plus tests for Go backend baseline capabilities. |
| BASE-04 | TypeScript service/backend surfaces are classified only as frontend support, runtime boundary, parity, fixture, test, rollback, deferred, quarantined, or deleted. | Manifest validation rejects disallowed roles and runtime rows with backend capabilities. |
| BASE-05 | Manifest and markdown list non-goals: no Strategy execution in Go/web/API, no Node `vm`, no Node `node:wasi` untrusted sandbox, no production sandbox replacement, no Runtime Broker implementation, no counted non-JS play, no Go migration/schema ownership, and no cloud deployment work. | Contract field tests. |
| BASE-06 | Manifest records no silent fallback, schema/runtime ABI references, privacy denylist marker names only, hostile-code isolation, rollback gates, deferred gates, and monitor-ready ownership fields. | Scanner tests, artifact check, `pnpm boundary:imports`, and `pnpm boundary:monitors`. |

## Source Audit Result

The generator scans these roots deterministically:

- `apps/web/app/api/**/route.ts`
- `apps/web/app/**/*.ts(x)`
- `apps/web/lib/**/*.ts`
- `apps/worker/src/**/*.ts`
- `apps/runtime-service/src/**/*.ts`
- `packages/persistence/src/**/*.ts`
- `packages/service/src/**/*.ts`
- `packages/runtime-js/src/**/*.ts`

The Phase 103 inventory currently contains 180 surfaces and records monitor-ready fields for each row: `id`, `path`, `kind`, `role`, `retirementAction`, `owner`, `reason`, `gate`, `risk`, `futureMigration`, `currentOwner`, `normalBackendOwner`, `fallbackPolicy`, `privacyClass`, `enforcementStatus`, route/runtime linkage, import evidence, backend capability booleans, and `sourceRefs`.

## Downstream Monitor Contract

Phases 104-108 should consume `.planning/artifacts/v1.16-typescript-backend-inventory.json` as the machine-readable source of truth. Phase 103 makes the fields available for strict enforcement, but strict no-TypeScript-backend topology is intentionally deferred to Phase 108.

Expected downstream use:

- Phase 104 keeps `runtime-service` and `runtime-adapter` rows DB-free, job-free, scoring-free, public-API-free, and schema-validated.
- Phase 105 removes or fails closed any frontend adapter fallback that could reach TypeScript backend behavior for selected Go-owned workflows.
- Phase 106 quarantines worker, job lifecycle, Match completion, Chronicle persistence, scoring, and TypeScript service paths as rollback, parity, fixture, or test only.
- Phase 107 finalizes deferred Workshop, ladder, governance, owner-debug, and test-support labels with privacy gates.
- Phase 108 makes topology and boundary monitors strict for no normal TypeScript backend behavior.

## Out of Scope Confirmation

The future language-neutral Strategy Execution Service / Runtime Broker remains out of scope. Phase 103 names broker-ready fields only. JS/TS Strategy support remains only through the isolated runtime service and runtime adapter roles, not through Go, web/API, or a normal TypeScript backend.

## Final Nyquist Validation

**Audited:** 2026-05-24

### Result

PARTIAL - BASE-01, BASE-02, BASE-03, BASE-05, and BASE-06 have executable validation coverage, but BASE-04 has a blocker.

### Additional Behavioral Coverage Added

| Requirement | Test | Result |
| --- | --- | --- |
| BASE-01 | Committed v1.16 artifact surface paths match regenerated scanner output and include route, worker, runtime-service, persistence, and service module kinds. | green |
| BASE-03, BASE-05, BASE-06 | Committed v1.16 artifact records v1.15 Go baseline artifacts/capabilities, non-goals, no-normal-TypeScript-backend policy, no Go/web Strategy execution, no Node `vm`/`node:wasi` sandbox promotion, and forbidden public-output markers. | green |
| BASE-04 | Committed v1.16 artifact must not label runtime persistence-backed surfaces as `frontend-only`. | BLOCKER: `apps/web/app/matches/replay-fixture.ts` is labeled `frontend-only` while importing runtime `@cowards/persistence/chronicle-store`. |

### Commands Run

| Command | Result |
| --- | --- |
| `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | failed: 9 passed, 1 failed. The failing BASE-04 test reports `apps/web/app/matches/replay-fixture.ts`. |
| `pnpm typescript-backend:inventory:check` | passed: artifacts are current. |
| `pnpm boundary:imports` | passed with `strict_offenses=0 report_only_offenses=29`; report-only output includes `apps/web/app/matches/replay-fixture.ts:6 forbidden @cowards/persistence`. |

### Escalation

BASE-04 remains unfilled. The artifact currently documents a replay fixture path with a runtime persistence import as `frontend-only`, which weakens the retirement contract because fixture/persistence behavior is not distinguishable from frontend-only support in the machine-readable manifest. Implementation/artifact classification should be corrected in a follow-up by relabeling `apps/web/app/matches/replay-fixture.ts` to an explicit non-normal role such as `fixture-only` or another justified allowed role, then regenerating the v1.16 inventory artifacts and rerunning the Phase 103 tests.
