# Phase 67 Research: Public Strategy Go Read-Model Route

## Findings

- `SERVICE_API_ROUTES.getPublicStrategyPage` already exists in `@cowards/spec` as public `GET /public/strategies/{strategyId}`.
- `@cowards/service` already exposes `getPublicStrategyPage(strategyId)` and parses the public Strategy page through `PublicStrategyPageServiceDtoSchema`.
- `scripts/generate-go-parity-fixtures.ts` already invokes `@cowards/service` for health, MatchSet, replay, and analytics fixtures; adding the Strategy page fixture there preserves the same source of truth.
- The Go server validates route manifest drift, fixture checksums, private-field markers, and top-level DTO shape before serving fixtures.
- Topology and boundary monitor checks needed their expected Go route inventory and fixture list updated from four to five entries.

## Decision

Add `public-strategy-page.json` as a generated fixture produced by `service.getPublicStrategyPage("strategy:go-parity:sentinel")`, then serve it from Go through a new public GET-only route. Keep the existing fixture manifest and embedded checksum reference as the rollback/drift guard: removing the route requires regenerating fixtures and restoring the four-route manifest.

