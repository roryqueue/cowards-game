---
phase: 55
slug: cross-process-local-deployment-harness
status: research
created: 2026-05-22
---

# Phase 55 Research — Local Topology

## Existing Inputs

- `pnpm services:up` starts required Docker Compose services.
- `pnpm preflight` already validates Postgres, migrations, seed data, worker execution, Chronicle replay, public projection, and optional web replay rendering.
- `pnpm go:parity` validates Go read-only fixture parity and Go tests.
- `apps/go-backend` runs on `127.0.0.1:8087` by default and exposes health, public MatchSet summary, public replay metadata, and owner-scoped analytics summary.
- `apps/web/app/api/service/health/route.ts` exposes TypeScript service health without requiring persistence.
- `apps/worker/src/runtime-config.ts` exposes selected runtime adapter metadata without executing user Strategy code in web/API.

## Gap

There is no single local diagnostic that names the v1.8 topology, records ports/URLs, checks committed fixtures, smokes web/Go health endpoints when running, and reports privacy-safe failure messages.

## Decision

Implement `pnpm topology:check` as a repeatable diagnostic harness. It verifies static topology inputs by default and performs live smoke requests only for explicitly provided URLs, keeping process boundaries loud instead of silently falling back.
