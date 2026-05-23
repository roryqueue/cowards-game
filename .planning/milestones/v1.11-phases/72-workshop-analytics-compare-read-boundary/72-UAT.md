# Phase 72 UAT

**Verified:** 2026-05-23

## Scenario

User loads `GET /api/workshop/analytics/profiles/{profileId}/compare` and receives the legacy comparison payload while the route reads through `@cowards/service`.

## Evidence

- `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts`
- `packages/service/src/service.test.ts`
- `packages/spec/src/spec.test.ts`

## Result

Pass. Success, local gate 403, missing profile 404, and storage-unavailable 503 behavior are covered.

