# Phase 71 UAT

**Verified:** 2026-05-23

## Scenario

User loads `GET /api/workshop/tests/{matchSetId}` and receives the same source-free Workshop test summary shape while the route reads through `@cowards/service`.

## Evidence

- `apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts`
- `packages/service/src/service.test.ts`
- `packages/spec/src/spec.test.ts`

## Result

Pass. Success and missing-summary behavior are covered, and private fields are rejected at the service DTO boundary.

