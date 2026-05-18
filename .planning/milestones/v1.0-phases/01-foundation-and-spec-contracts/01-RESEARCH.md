# Phase 1 Research: Foundation and Spec Contracts

**Phase:** 1 - Foundation and Spec Contracts  
**Date:** 2026-05-16  
**Status:** Complete

## Research Question

What does Phase 1 need to know to plan the Coward's Game repository scaffold and canonical spec package well?

## Relevant Requirements

- FOUND-01 through FOUND-05
- SPEC-01 through SPEC-05
- TEST-07

## Key Findings

### Workspace and Tooling

Use pnpm workspaces plus Turborepo as the monorepo foundation. Keep the scaffold conventional so later phases do not spend time fighting tooling:

- `apps/web` for a minimal Next.js App Router app.
- `apps/worker` for a minimal Node worker process.
- `packages/spec` as the root canonical contract package.
- `packages/engine`, `packages/runtime-js`, `packages/replay`, `packages/map-configs`, and `packages/test-utils` can be created as package shells only if needed to enforce boundaries and future dependency graph. Phase 1 should avoid implementing behavior in them.

Recommended root commands:

- `pnpm dev` — fast local loop for meaningful app/package dev tasks.
- `pnpm dev:full` — starts Docker Compose services and skeletal app/worker topology.
- `pnpm build` — Turborepo build.
- `pnpm typecheck` — TypeScript project references/build checks.
- `pnpm lint` — ESLint rules including import boundaries.
- `pnpm test` — Vitest.
- `pnpm verify` — formatting/check, lint, typecheck, tests, and boundary checks.

### TypeScript Project References

Use TypeScript project references to make dependency direction explicit. `packages/spec` should be referenced by downstream packages, but should not reference workspace packages.

Phase 1 should make these rules visible through:

- root `tsconfig.base.json`
- root `tsconfig.json` with references
- package-level `tsconfig.json`
- package `exports` fields
- workspace dependency declarations

### ESLint Boundary Rules

Use ESLint/import restrictions to express architectural constraints that TypeScript alone does not capture. The first boundary set should enforce:

- `packages/spec` cannot import from any workspace package.
- `packages/engine` cannot import from apps, runtime, replay, database, worker, or UI packages.
- `apps/web` cannot import from `packages/runtime-js` internals or execute strategy code.
- `apps/worker` may eventually import runtime/engine/replay, but Phase 1 should keep it skeletal.

These rules should be strict immediately but can start with file/path restrictions that match the Phase 1 package shells.

### `packages/spec` Contents

Phase 1 should create `packages/spec` with:

- canonical domain types
- direction/status/action/event discriminated unions
- constants for board size, starting positions, Round activation counts, max Cycles, memory limits, source size limits
- Zod schemas for runtime inputs and outputs
- `CompatibilityVersions` structured object
- named canonical fixtures
- validated builder functions
- separate valid and invalid fixture namespaces
- named movement/collision scenario fixtures for Phase 2

Avoid generated docs helpers in Phase 1. Strategy API docs can come later when the editor/runtime surface is closer.

### Fixture Strategy

Fixtures should be boring, named, and safe:

- `fixtures.valid.*` defaults to legal states.
- `fixtures.invalid.*` contains intentionally malformed or illegal examples for negative tests.
- Builder outputs should validate or be paired with validation helpers so invalid states are not accidental.

Include scenarios that Phase 2 will immediately need:

- standard starting board
- empty 12x12 arena
- hand-authored Arena Variant examples
- sample seeds
- runtime input/output examples
- blocked movement
- side push
- Backstab
- off-board fall
- Contraction
- no-advance stoning

### Versioning

Use a serializable structured object:

```ts
export const COMPATIBILITY_VERSIONS = {
  spec: "1.0.0",
  engine: "0.1.0",
  runtimeJs: "0.1.0",
  chronicle: "0.1.0",
  strategyRevision: "0.1.0",
  arenaVariant: "0.1.0",
} as const
```

Phase 1 does not need branded version types. It also does not need `webApp`, `worker`, `databaseSchema`, or `apiContract` version fields yet.

### Local Development

Docker Compose should start real PostgreSQL and Redis in Phase 1, even before persistence and queue behavior are implemented. This makes `pnpm dev:full` honest while preserving `pnpm dev` as the lightweight loop.

Minimal apps:

- `apps/web`: Next app boots and displays a minimal project shell/status page.
- `apps/worker`: Node process boots and logs readiness. No game/runtime behavior.

### Security and Threat Modeling

Phase 1 does not execute user code, but it creates the structure that will later contain hostile runtime execution. Plans must explicitly avoid normalizing insecure patterns:

- Do not use Node `vm` as the future sandbox boundary.
- Do not let `apps/web` depend on or import runtime execution code.
- Do not create examples that execute strategy source in a route handler.
- Keep runtime-related placeholders clearly inert.
- Boundary rules are a security control, not just tidiness.

## Validation Architecture

Phase 1 validation should be command-driven and local:

- Quick feedback: `pnpm lint`, `pnpm typecheck`, targeted `pnpm test`.
- Full feedback: `pnpm verify`.
- Fixture/schema validation should be covered by Vitest tests in `packages/spec`.
- Boundary enforcement should be covered by lint and a negative fixture/import test if practical.
- Docker Compose validation should confirm Postgres and Redis services are declared with healthchecks or stable ports.
- App/worker validation should confirm both skeletal processes can be started by scripts, or at minimum that scripts are present and typecheck/build succeeds if long-running dev servers are not suitable for automated verification.

## Planning Implications

Recommended plan split:

1. Root workspace/tooling and local quality gate.
2. Package/app skeleton and dependency boundaries.
3. `packages/spec` contracts, versions, schemas, and fixtures.
4. Local full-dev topology with Docker Compose, web/worker scripts, and walking-skeleton notes.

These plans can mostly run in sequence because each depends on root workspace scaffolding. Some spec fixture work can run in parallel with app/Compose polish after root tooling exists.

## Risks

- Overbuilding behavior in Phase 1 instead of scaffolding.
- Letting `packages/spec` become a general shared package.
- Creating placeholder imports that violate the intended architecture.
- Adding CI despite the user decision to keep Phase 1 local-only.
- Creating fixtures that silently allow invalid states.
- Making `pnpm dev` slow by forcing full infrastructure for every loop.

## Sources

- `.planning/phases/01-foundation-and-spec-contracts/01-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/STACK.md`
- `.planning/research/ARCHITECTURE.md`
- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`

## RESEARCH COMPLETE
