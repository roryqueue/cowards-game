# Plan 12-01 Summary: Docker Service Readiness and Shared Preflight

## Completed

- Added `scripts/wait-for-compose-services.sh` to start Docker Compose services and wait for Postgres/Redis health.
- Added `scripts/preflight.ts` with layer-labelled checks for Postgres, Redis, migrations, smoke Match execution, Chronicle replay parsing, and public replay projection.
- Added root `services:*` and `preflight:*` scripts.

## Verification

- `pnpm preflight:docker -- --skip-web` passed against local Docker.

