# Phase 64 Research: Boundary Debt Triage and Scope Lock

**Researched:** 2026-05-23  
**Status:** Complete

## Evidence Reviewed

- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `pnpm topology:check -- --json`
- `scripts/check-service-boundary-imports.ts`
- `packages/spec/src/service.ts`
- `packages/service/src/index.ts`
- `scripts/generate-go-parity-fixtures.ts`
- `apps/go-backend/main.go`
- Remaining web files reported by the import boundary checker

## Findings

### Report-Only Debt Shape

The 34 report-only offenses are not one kind of problem. They split across mixed read/write account routes, auth and competition mutations, legacy web facade imports, replay internals, and Workshop analytics/runtime/source boundaries. Treating all 34 as equivalent would invite unsafe migration.

### Safest Service Slices

The account revision-list GET path is already conceptually service-backed but co-located with POST save. It is a good Phase 65 target only if the read dependency closure can stop importing the mixed write facade.

The Workshop analytics/Evidence Explorer read path is the best new read/user surface. It has product value and existing analytics privacy semantics, but must be separated from Workshop source/save/test/runtime flows.

### Go Read-Model Readiness

The safest single Go route is `GET /public/strategies/{strategyId}`. It is already public, spec-registered, implemented in `@cowards/service`, and small enough for fixture-backed parity. Public player and ladder reads are viable later but aggregate more data and ordering/state concerns.

## Risks

- Hiding direct persistence behind `competitive/server` and calling it service migration.
- Pulling Strategy source retrieval into an owner read migration.
- Pulling Workshop validation/test execution into an analytics read migration.
- Adding a Go route without generated TypeScript-service-backed fixtures or without exact public error semantics.

## Recommendation

Proceed with the v1.10 roadmap as written:

1. Phase 65: account revision-list GET boundary.
2. Phase 66: Workshop analytics/Evidence Explorer read boundary.
3. Phase 67: one Go public Strategy read-model route.
4. Phase 68/69: strict enforcement, monitors, privacy, and regression gates.

