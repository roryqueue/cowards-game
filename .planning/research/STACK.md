# Research: Stack

**Project:** Coward's Game  
**Date:** 2026-05-16  
**Milestone context:** Greenfield

## Recommendation

Use the stack from the architecture spec, with current-version guardrails:

| Layer | Recommendation | Current version signal | Confidence |
|-------|----------------|------------------------|------------|
| Runtime | Node.js 24 LTS | Node.js download page lists v24.15.0 LTS | High |
| Language | TypeScript | npm latest: 6.0.3 | High |
| Package manager | pnpm | npm latest: 11.1.2 | High |
| Monorepo | Turborepo + pnpm workspaces | npm latest `turbo`: 2.9.14; Turborepo docs support pnpm workspaces | High |
| Web app | Next.js App Router + React | npm latest `next`: 16.2.6; `react`: 19.2.6 | High |
| Shared validation | Zod 4 | Zod docs say Zod 4 is stable; npm latest: 4.4.3 | High |
| Effect system | Effect | npm latest: 3.21.2 | Medium |
| DB | PostgreSQL | Official docs list PostgreSQL 18 as current | High |
| Queue | BullMQ + Redis | npm latest `bullmq`: 5.76.8 | Medium |
| Engine tests | Vitest | npm latest: 4.1.6 | High |
| E2E tests | Playwright | npm latest: 1.60.0; official docs support TypeScript and parallel E2E testing | High |
| Renderer | PixiJS v8 | PixiJS docs list 8.18.1 stable; npm latest: 8.18.1 | High |
| React renderer bridge | `@pixi/react` | npm latest: 8.0.5 | Medium |
| Code editor | Monaco editor | npm latest: 0.55.1 | High |
| Local infra | Docker Compose | Docker docs recommend `compose.yaml` and `docker compose` | High |
| Persistence/query layer | Drizzle ORM or Kysely | npm latest: Drizzle 0.45.2, Kysely 0.29.1 | Medium |

## Stack Shape

```txt
apps/
  web/       Next.js App Router, editor, replay viewer, API/server actions
  worker/    queued match execution and sandbox orchestration

packages/
  spec/       canonical shared game contracts and Zod schemas
  engine/     pure deterministic transition logic
  runtime-js/ sandboxed JS/TS strategy runtime
  replay/     Chronicle generation, validation, replay utilities
  map-configs/ hand-authored Arena Variants
  test-utils/ fixtures, deterministic strategies, replay assertions
```

The architecture spec names `packages/shared`; for implementation, split `packages/spec` from broader shared utilities if it keeps game contracts crisp. Avoid a dumping-ground `shared` package.

## Sandbox Direction

Do not use Node's built-in `node:vm` for hostile strategy execution. Node's own documentation says it is not a security mechanism and should not be used for untrusted code.

Avoid `vm2` for production strategy execution. Recent security reporting and security databases continue to flag sandbox escapes and maintainability concerns.

Short-term prototype path:

- Run strategy code only in `apps/worker`, never in `apps/web` or API request handlers.
- Use process isolation around each match or small match batch.
- Consider `isolated-vm` for prototype JS isolates, but treat it as defense-in-depth, not a complete sandbox. Its package docs warn that using it does not automatically make untrusted code safe.
- Validate all strategy/runtime outputs with Zod.
- Enforce timeouts, memory limits where available, output size caps, source size caps, and no host object leakage.

Long-term competitive path:

- Move toward stronger isolation such as containers/microVMs, WASM/WASI, or a restricted DSL/fuel-metered VM.
- Keep the engine runtime-agnostic so the runtime can be replaced without rewriting rules.

## What Not To Use

- Do not put game rules in React components.
- Do not run user code in Next.js route handlers or server actions.
- Do not rely on `Math.random`, `Date.now`, system time, object iteration nondeterminism, or host environment state in the engine.
- Do not use `node:vm` as the security boundary.
- Do not pick `vm2` as the production sandbox.
- Do not introduce custom maps, ladders, tournaments, or cosmetics before the simulation/replay loop works.

## Sources

- Coward's Game canonical spec: `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- Coward's Game technical architecture spec: `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`
- Next.js App Router docs: https://nextjs.org/docs/app
- Turborepo docs: https://turborepo.com/repo/docs
- PixiJS versions: https://pixijs.com/versions
- Zod docs: https://zod.dev/
- Playwright docs: https://playwright.dev/docs/intro
- PostgreSQL docs: https://www.postgresql.org/docs/
- Docker Compose docs: https://docs.docker.com/compose/
- Node `vm` docs: https://nodejs.org/api/vm.html
- isolated-vm npm docs: https://www.npmjs.com/package/isolated-vm
