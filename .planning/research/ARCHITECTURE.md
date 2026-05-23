# v1.13 Architecture Research: Go Backend Ownership Cutover

**Milestone:** v1.13 Go Backend Ownership Cutover
**Researched:** 2026-05-23

## Current Shape

The web UI calls route-specific boundary modules. Those modules currently use `@cowards/service` and TypeScript persistence for most product behavior. `apps/go-backend` exposes five GET routes, all served from generated parity fixtures. v1.12 added a route-scoped public Strategy switch that fails closed when Go is selected, but promotion stopped because Go lacked a production-equivalent data provider.

## Target Shape

Go becomes the primary backend API owner for selected normal product workflows:

1. Go owns live DB access for selected public and owner DTOs.
2. Web route/adapters call Go for selected route families by default.
3. TypeScript service remains as a parity oracle and rollback implementation, not silent fallback in Go-selected evidence paths.
4. TypeScript worker/runtime continues to own Strategy execution, Match job claiming/completion, Chronicle construction, and hostile-code handling.

## Build Order

1. Freeze route ownership and define selected Go-owned route families.
2. Add Go DB/persistence foundation and live DTO builders.
3. Cut over public reads.
4. Cut over auth/session and account reads/mutations.
5. Cut over exhibition creation if mutation gates remain green.
6. Extend topology, privacy, parity, rollback, and boundary monitors for multi-route Go ownership.

## Integration Notes

- Go must not import or execute Strategy source to validate or run user code in web/API paths.
- Strategy Revision creation in Go must either port deterministic source hashing/validation safely or call a non-executing validation contract that does not run Strategy code.
- Exhibition creation may create MatchSet and job records, but job claiming, Match execution, Chronicle generation, and runtime failures remain TypeScript worker-owned.
- Session responses and diagnostics must never leak session tokens; cookies remain a web transport concern.
