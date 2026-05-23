# v1.13 Stack Research: Go Backend Ownership Cutover

**Milestone:** v1.13 Go Backend Ownership Cutover
**Researched:** 2026-05-23

## Recommendation

Keep the existing TypeScript web UI, TypeScript worker/runtime, and canonical `@cowards/spec` service contracts. Add production-equivalent Go backend capabilities only where Go can prove live PostgreSQL access, canonical DTO shape, privacy safety, fail-closed routing, and rollback behavior.

## Required Stack Additions

- Go PostgreSQL access in `apps/go-backend`, likely through `github.com/jackc/pgx/v5/pgxpool`.
- Go route ownership registry that can express multiple public, owner, session, and mutation routes without the v1.12 single-route assumption.
- Go DTO builders for public Strategy, player, ladder, MatchSet summary, replay metadata, auth/session, account Strategy Revision, and exhibition creation responses.
- A generated or hand-maintained parity test lane that compares Go live DTOs against TypeScript service outputs for seeded local data.
- Web client/adapters that route selected product APIs to Go as the primary owner and fail closed when Go-selected paths are unavailable.

## Stack To Preserve

- `@cowards/spec` remains the source of truth for service routes, schemas, DTO privacy rules, and OpenAPI artifacts.
- `@cowards/service` remains the parity oracle and migration reference, not the future production path.
- `@cowards/persistence` remains the TypeScript reference for SQL semantics while Go ports the selected behavior.
- `@cowards/runtime-js`, the worker, Chronicle construction, and Strategy execution stay outside web/API and Go cutover scope unless explicitly promoted later.

## Avoid

- Node `vm` for hostile Strategy isolation.
- ORM adoption, GraphQL, gRPC, Kubernetes, service mesh, or broad observability stack work.
- Moving game rules, runtime execution, worker job claiming/completion, or private replay projection into Go as part of the backend API cutover.
