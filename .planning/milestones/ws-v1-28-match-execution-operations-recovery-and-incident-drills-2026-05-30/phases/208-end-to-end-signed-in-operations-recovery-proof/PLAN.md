---
phase: 208
name: End-to-End Signed-In Operations Recovery Proof
status: complete
milestone: v1.28
created: 2026-05-30
---

# Phase 208 Plan

## Goal

Run a signed-in local proof that covers JS/TS revision creation, an operator recovery path, public result/replay page compatibility, and private-marker scans.

## Steps

1. Add a Playwright proof spec for v1.28 operations recovery.
2. Make Playwright's local base URL configurable so parallel local checkouts do not block proof runs.
3. Add an `e2e:v1.28-proof` script.
4. Run local migrations for the operations tables.
5. Start a live Go backend against local Postgres with the internal token enabled.
6. Run the signed-in proof and write `.planning/artifacts/v1.28-signed-in-operations-recovery-proof.{json,md}`.
7. Mark E2E requirements complete and advance the workstream to Phase 209.

## Verification

- `PLAYWRIGHT_BASE_URL=http://localhost:3001 DATABASE_URL=<redacted> COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_GO_BACKEND_INTERNAL_TOKEN=<redacted> pnpm e2e:v1.28-proof`
- Private-marker scan over the generated v1.28 signed-in proof artifacts
- `gsd-tools state validate`
