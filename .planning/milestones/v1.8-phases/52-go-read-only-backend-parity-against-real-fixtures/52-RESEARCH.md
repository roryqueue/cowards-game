# Phase 52: Go Read-Only Backend Parity Against Real Fixtures - Research

**Researched:** 2026-05-22
**Confidence:** HIGH for current code shape; MEDIUM for future DB-backed Go choices, which are intentionally deferred.

## Summary

The Go backend is still the v1.7 static spike. It serves three read endpoints from hardcoded Go literals and uses `service-api-v1.7`. Phase 52 should update it to v1.8 by loading committed parity fixture JSON generated from TypeScript canonical DTO schemas and examples.

The best analytics candidate is a selected analytics run summary envelope built from `AnalyticsGauntletRunSummarySchema` and the deterministic workshop analytics demo snapshot. This gives real summary data, degraded and system-failed evidence, and existing leak checks without moving analytics mutations or public product semantics.

## Recommended Approach

1. Add a TypeScript fixture generator that invokes `@cowards/service` and emits deterministic JSON fixtures:
   - health
   - public MatchSet summary
   - degraded/system-failed MatchSet summary
   - public replay metadata
   - selected analytics run summary
2. Add schema and service support for an `analyticsRunSummary` service DTO.
3. Update Go to load validated fixtures from `testdata`, serve only the approved read routes, enforce owner identity for analytics, and return v1.8 public error envelopes.
4. Add Go tests comparing HTTP output to fixture JSON and failing on mutation/unsupported route expansion.
5. Add TypeScript tests that generated parity fixtures parse through canonical schemas and pass privacy leak checks.

## Key Findings

- `apps/go-backend/main.go` uses static v1.7 shapes; replay metadata is incompatible with Phase 51 v1.8.
- `packages/spec/src/service.ts` has route metadata for analytics list/create/export, but no analytics summary route yet.
- `packages/spec/src/schemas.ts` already exports `AnalyticsGauntletRunSummarySchema`, which is the right inner summary schema.
- `packages/persistence/src/workshop-analytics.ts` has `createWorkshopAnalyticsDemoSnapshot()` with real deterministic analytics summary data and system-failed evidence.
- `packages/spec/scripts/generate-service-openapi.ts` emits public routes only, so the owner/diagnostic analytics summary route does not need to appear in the public OpenAPI artifact.

## Risks

- Treating generated JSON examples as the source of truth would invert ownership. Mitigation: fixtures are generated from TypeScript canonical schemas and checked stale.
- A broad Go allowlist exception could silently permit future writes. Mitigation: route inventory tests and mutation verb tests.
- Analytics summary includes owner ids and owner-safe metadata. Mitigation: keep route owner/diagnostic, not public, and run analytics leak checks for private Strategy/runtime fields.
