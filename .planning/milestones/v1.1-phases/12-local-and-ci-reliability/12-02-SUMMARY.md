# Plan 12-02 Summary: Docker and No-Docker Local Parity

## Completed

- Updated `dev:full` to wait for Docker service health and run preflight before launching host-run web/worker dev processes.
- Updated `dev:local` to run the shared local preflight before launching app processes, while keeping `--setup-only` for database-only setup.
- Fixed the Postgres 18 Compose volume mount from `/var/lib/postgresql/data` to `/var/lib/postgresql`.
- Updated `README.md` with Docker, no-Docker, preflight, service E2E, smoke, visual, and fast-test commands.

## Verification

- `pnpm dev:local -- --setup-only` passed.
- `pnpm preflight:local -- --skip-web` passed.
- `pnpm preflight:docker -- --skip-web` passed.

