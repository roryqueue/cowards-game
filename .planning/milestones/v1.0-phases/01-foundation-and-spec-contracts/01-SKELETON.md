# Phase 1 Walking Skeleton

**Phase:** 1 - Foundation and Spec Contracts  
**Created:** 2026-05-16  
**Status:** Planned

## Purpose

Phase 1 creates the thinnest runnable project skeleton for Coward's Game. It does not implement gameplay, persistence behavior, strategy execution, or replay. It proves that the repository can install, verify, start skeletal processes, and expose canonical spec contracts for later phases.

## Skeleton Shape

```txt
pnpm workspace
  |
  +-- apps/web       minimal Next app boots
  +-- apps/worker    minimal Node worker boots and logs readiness
  +-- packages/spec  canonical contracts, schemas, versions, fixtures
  +-- docker compose PostgreSQL + Redis for full local topology
```

## End-to-End Proof

At the end of Phase 1:

1. `pnpm install` succeeds.
2. `pnpm verify` runs local scaffold checks.
3. `pnpm dev` starts the lightweight development loop.
4. `pnpm dev:full` starts Docker Compose plus skeletal web and worker processes.
5. `packages/spec` exports canonical Coward's Game constants, types, Zod schemas, versions, and fixtures.
6. Boundary checks prevent later packages from importing in the wrong direction.

## Explicit Non-Goals

- No engine transition implementation.
- No runtime sandbox execution.
- No database schema beyond local service availability.
- No Chronicle generation.
- No user-facing gameplay UI.
- No hosted CI.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm verify`
- Manual check: `pnpm dev` and `pnpm dev:full` boot and can be stopped cleanly.

