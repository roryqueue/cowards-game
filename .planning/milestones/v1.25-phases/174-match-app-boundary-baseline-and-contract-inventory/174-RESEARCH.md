# Phase 174 Research

The baseline inventory found the active boundary spread across `packages/spec/src/service.ts`, `packages/spec/src/schemas.ts`, `apps/web/lib/public-service-adapter.ts`, `apps/web/lib/public-service-boundary.ts`, `apps/web/app/matchsets/[matchSetId]/page.tsx`, `apps/web/app/matches/server.ts`, Go public routes in `apps/go-backend/live_backend.go`, Go fixture routes in `apps/go-backend/main.go`, and aggregate checks in `scripts/check-boundary-monitors.ts`.

Existing public service DTOs were usable as the compatibility substrate, but lifecycle semantics were inferred from status fields and evidence copy. The implementation therefore introduced a separate `match-execution-app-v1` wrapper instead of migrating `service-api-v1.8`.
