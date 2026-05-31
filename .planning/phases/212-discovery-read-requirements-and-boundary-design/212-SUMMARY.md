# Phase 212 Summary

Implemented `public-discovery-v1` DTOs and the server-first web discovery service. Discovery reads remain separate from `match-execution-app-v1`; no existing public execution DTO was changed.

## Files

- `packages/spec/src/public-discovery.ts`
- `packages/spec/src/public-discovery.test.ts`
- `packages/spec/src/index.ts`
- `apps/web/lib/public-discovery-service.ts`
- `apps/web/lib/public-discovery-service.test.ts`
