# Phase 83 Research: Go Persistence and Live DTO Foundation

## Findings

- `apps/go-backend/main.go` currently starts from committed TypeScript-generated service fixtures and validates them before serving.
- TypeScript persistence uses PostgreSQL through `pg` with `DATABASE_URL` in `packages/persistence/src/db.ts`; migrations remain TypeScript-owned.
- Selected DTO contracts live in `packages/spec/src/service.ts`; TypeScript service assembly lives in `packages/service/src/index.ts`.
- The Go backend needs explicit live mode and sanitized diagnostics so fixture mode cannot claim promoted ownership.

## Implementation Notes

- Add live data mode gated by `COWARDS_GO_BACKEND_DATA_MODE=live` plus `DATABASE_URL`.
- Add route-specific Go providers around PostgreSQL queries instead of a broad ORM.
- Preserve fixture mode for existing tests and parity reference.
- Add JSON privacy validation for live DTOs and service errors.
- Add route manifest/evidence fields that distinguish fixture reference from live-backed selected routes.

