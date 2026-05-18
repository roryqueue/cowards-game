# Phase 1: Foundation and Spec Contracts - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the repository foundation and canonical contract layer for Coward's Game. It should deliver a runnable pnpm/Turborepo workspace, strict local verification, skeletal web and worker apps, real local Postgres/Redis services for full dev mode, and a `packages/spec` package containing canonical types, constants, Zod schemas, version metadata, and fixtures.

This phase does not implement game engine rules, Chronicle behavior, runtime sandbox execution, persistence models, or user-facing gameplay flows. It prepares the project shape those later phases will use.

</domain>

<decisions>
## Implementation Decisions

### Package Names and Boundaries

- **D-01:** Use `packages/spec` as the only shared contract package in Phase 1.
- **D-02:** Do not create `packages/shared` in Phase 1. Add it later only if there is a real non-game shared utility need.
- **D-03:** `packages/spec` owns canonical TypeScript types, constants, Zod schemas, event/action/status unions, version IDs, and canonical fixtures.
- **D-04:** `packages/spec` must not depend on any internal workspace package. It may depend on external libraries such as Zod.
- **D-05:** Other workspace packages should depend on `packages/spec`; dependency direction should not point back from `spec` to engine, runtime, replay, worker, web, or test-utils.

### Strictness of the Scaffold

- **D-06:** Enforce strict scaffold rules immediately in Phase 1.
- **D-07:** Use TypeScript project references for the build graph.
- **D-08:** Use ESLint/import boundary rules for explicit architecture constraints, including preventing web from importing runtime internals and preventing engine/spec from depending on app/runtime/db concerns.
- **D-09:** Provide local verification only in Phase 1. Do not create GitHub Actions or hosted CI yet.
- **D-10:** `pnpm verify` should be the primary local quality gate and should run formatting/check, lint, typecheck, tests, and any boundary checks available at this stage.

### Local Dev Shape

- **D-11:** Provide two local development commands: lightweight `pnpm dev` and full `pnpm dev:full`.
- **D-12:** `pnpm dev` should support a fast loop over meaningful workspace apps/packages without forcing all infrastructure every time.
- **D-13:** `pnpm dev:full` should start the planned full local topology, including skeletal web app, skeletal worker app, PostgreSQL, Redis, and local sandbox placeholders if needed.
- **D-14:** Docker Compose should start real PostgreSQL and Redis in Phase 1.
- **D-15:** Create minimal runnable `apps/web` and `apps/worker` in Phase 1. `apps/web` should boot a basic Next app; `apps/worker` should boot and log readiness. Neither should contain game behavior yet.

### Fixture Philosophy

- **D-16:** `packages/spec` should provide both named canonical fixtures and validated builder functions.
- **D-17:** Fixture builders should separate valid and invalid namespaces, such as `fixtures.valid.*` and `fixtures.invalid.*`, so negative tests are intentional and readable.
- **D-18:** Valid fixture builders should default to legal states.
- **D-19:** Invalid fixtures should be explicit and reserved for negative tests.
- **D-20:** Phase 1 fixtures should include starting board, Soldiers, constants, Arena Variants, runtime input/output examples, seed values, and named board setups for blocked movement, push, Backstab, off-board fall, contraction, and no-advance stoning.

### Versioning Scheme

- **D-21:** Represent compatibility versions as a structured `CompatibilityVersions` object.
- **D-22:** Initial version values should use spec `1.0.0` and implementation artifacts `0.1.0`.
- **D-23:** Include the core six fields in the compatibility object: `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`.
- **D-24:** Do not include `webApp`, `worker`, `databaseSchema`, or `apiContract` versions in Phase 1. Add these only when those surfaces become meaningful.

### the agent's Discretion

No areas were delegated to the agent without a user choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning

- `.planning/PROJECT.md` — Core value, active scope, constraints, and key project decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements FOUND-01 through FOUND-05, SPEC-01 through SPEC-05, and TEST-07.
- `.planning/ROADMAP.md` — Phase 1 boundary, success criteria, and requirement mapping.
- `.planning/STATE.md` — Current project status and workflow settings.
- `.planning/config.json` — GSD mode, granularity, parallel execution, and workflow preferences.

### Research

- `.planning/research/SUMMARY.md` — Prescriptive research direction and roadmap implications.
- `.planning/research/STACK.md` — Current stack recommendations and sandbox cautions.
- `.planning/research/ARCHITECTURE.md` — Proposed package/app boundaries and build order.
- `.planning/research/PITFALLS.md` — Risks to avoid, especially sandbox complacency, UI-before-engine, Chronicle underdesign, nondeterminism, and package boundary decay.

### Source Specs

- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay rules, terminology, entities, runtime constraints, determinism, Chronicle expectations, and product principles.
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md` — Technical architecture, stack, monorepo shape, engine/runtime/replay responsibilities, local development, testing, and security constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- None. This is a greenfield repository with planning artifacts only.

### Established Patterns

- No application code exists yet.
- Planning decisions establish the initial patterns: pnpm/Turborepo, TypeScript project references, ESLint/import boundaries, `packages/spec` as root contract package, skeletal `apps/web` and `apps/worker`, Docker Compose with PostgreSQL and Redis.

### Integration Points

- New code will connect through the initial workspace scaffold created in this phase.
- `packages/spec` should be the root import target for canonical contracts used by later `engine`, `runtime-js`, `replay`, `map-configs`, `test-utils`, `web`, and `worker` packages.

</code_context>

<specifics>
## Specific Ideas

- Use `packages/spec`, not `packages/shared`, as the initial canonical contract package.
- Include canonical named fixtures plus validated builders in Phase 1 so Phase 2 engine tests can start from stable examples.
- Provide both fast and full development modes: `pnpm dev` and `pnpm dev:full`.
- Make `pnpm verify` the local quality gate instead of adding hosted CI in Phase 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation and Spec Contracts*
*Context gathered: 2026-05-16*
