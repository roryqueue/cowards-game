# Phase 1: Foundation and Spec Contracts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 1-Foundation and Spec Contracts
**Areas discussed:** Package Names and Boundaries, Strictness of the Scaffold, Local Dev Shape, Fixture Philosophy, Versioning Scheme

---

## Package Names and Boundaries

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Package shape | `packages/spec` only | Canonical types, constants, Zod schemas, fixtures, and version IDs all live here. Other packages only exist when they own behavior. | yes |
| Package shape | `packages/spec` plus `packages/shared` | `spec` owns game contracts; `shared` owns cross-app non-game utilities later. | |
| Package shape | `packages/shared` only | Matches the original architecture doc naming, but risks becoming a dumping ground. | |
| Spec contents | Contracts only | Types, constants, Zod schemas, event/action/status unions, version IDs. | |
| Spec contents | Contracts plus fixtures | Contracts plus canonical fixture builders for starting boards, Soldiers, Arena Variants, seeds, and sample Strategy inputs. | yes |
| Spec contents | Contracts plus docs helpers | Contracts plus generated/reference docs for the Strategy API. | |
| Internal dependencies | No internal dependencies | `packages/spec` is the root contract package and can depend on external libraries like Zod, but no workspace packages. | yes |
| Internal dependencies | Allow test-utils dependency | `spec` may depend on `packages/test-utils` for fixtures. | |
| Internal dependencies | Allow shared utility dependency later | `spec` may depend on a future shared package if needed. | |

**User's choice:** `packages/spec` only; include contracts plus fixtures; no internal dependencies.
**Notes:** The user selected the recommended lean contract-root shape.

---

## Strictness of the Scaffold

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Scaffold strictness | Strict immediately | Set up ESLint/package boundary rules, TypeScript project references, format/typecheck/test scripts, and make local verification fail on violations. | yes |
| Scaffold strictness | Moderate strictness | Set up scripts and TypeScript references, but defer stronger import-boundary lint rules. | |
| Scaffold strictness | Lightweight scaffold | Create package structure and scripts only. | |
| Boundary enforcement | ESLint boundary rules | Use lint rules to prevent invalid architecture imports. | |
| Boundary enforcement | TypeScript references only | Use TS references and package exports to shape dependencies. | |
| Boundary enforcement | Both ESLint and TypeScript references | TS references for build graph; ESLint/import rules for explicit architecture constraints. | yes |
| CI posture | Local verification only | Provide `pnpm verify`; add hosted CI later. | yes |
| CI posture | GitHub Actions CI now | Add CI workflow from Phase 1. | |
| CI posture | CI placeholder docs only | Document intended CI command but do not create automation. | |

**User's choice:** Strict immediately; use both TypeScript references and ESLint/import boundary rules; local verification only.
**Notes:** Phase 1 should be strict locally but not introduce hosted CI yet.

---

## Local Dev Shape

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Dev command shape | Full planned service shape with placeholders | `pnpm dev` starts web, worker, database, queue, and sandbox placeholders. | |
| Dev command shape | App/package dev only | Start only meaningful packages/apps in Phase 1. | |
| Dev command shape | Two commands | `pnpm dev` is lightweight; `pnpm dev:full` starts Docker Compose and placeholder services. | yes |
| Compose services | Real PostgreSQL and Redis now | Compose starts actual Postgres and Redis in Phase 1. | yes |
| Compose services | PostgreSQL only now | Add Redis/queue dependency when worker orchestration starts. | |
| Compose services | Compose file placeholder | Document Compose shape but do not require containers yet. | |
| Skeletal apps | Minimal runnable web and worker | `apps/web` boots a basic Next app; `apps/worker` boots and logs readiness. | yes |
| Skeletal apps | Package-only foundation | No apps yet; just packages and scripts. | |
| Skeletal apps | Web only | Create minimal Next app; defer worker app. | |

**User's choice:** Two commands; real PostgreSQL and Redis; minimal runnable web and worker.
**Notes:** `pnpm dev:full` should prove topology, while `pnpm dev` keeps the normal loop fast.

---

## Fixture Philosophy

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Fixture style | Canonical named fixtures | Small named fixtures like `standardInitialState`, `emptyArena12x12`, and sample seeds. | |
| Fixture style | Builder functions | Composable helpers like `createSoldier` and `createArenaVariant`. | |
| Fixture style | Both named fixtures and validated builders | Canonical fixtures plus builder functions that validate outputs and default to legal states. | yes |
| Fixture validity | Always valid by default | Builders produce legal states unless explicit unsafe/invalid helpers are used. | |
| Fixture validity | Allow partial/invalid states freely | Builders are lightweight object factories. | |
| Fixture validity | Separate valid and invalid fixture namespaces | `fixtures.valid.*` for legal states and `fixtures.invalid.*` for negative cases. | yes |
| Fixture catalog | Only Phase 1 requirements | Starting board, Soldiers, constants, Arena Variants, runtime examples, and seeds. | |
| Fixture catalog | Include movement/collision scenarios | Add named setups for blocked movement, push, Backstab, off-board fall, contraction, and no-advance stoning. | yes |
| Fixture catalog | Full engine scenario catalog | Create broad catalog for every major rule now. | |

**User's choice:** Both named fixtures and validated builders; separate valid/invalid namespaces; include movement/collision scenarios.
**Notes:** This gives Phase 2 engine work a strong test foundation without overbuilding the full rule catalog.

---

## Versioning Scheme

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Version representation | Simple string constants | Export separate string constants for each version. | |
| Version representation | Structured version object | Export a `CompatibilityVersions` object with named fields. | yes |
| Version representation | Branded version types plus object | Use branded TypeScript types and a structured object. | |
| Initial values | All `0.1.0` | Everything starts pre-release and evolves together. | |
| Initial values | Spec `1.0.0`, implementation artifacts `0.1.0` | Canonical game spec is v1; implementation starts pre-release. | yes |
| Initial values | Date-based versions | Use date-like values for traceability. | |
| Fields included | Core six | `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`. | yes |
| Fields included | Core six plus app | Add `webApp` and `worker`. | |
| Fields included | Core six plus schema | Add `databaseSchema` and `apiContract`. | |

**User's choice:** Structured `CompatibilityVersions`; spec `1.0.0` and implementation artifacts `0.1.0`; core six fields only.
**Notes:** App/schema versions are deferred until those surfaces are meaningful.

---

## the agent's Discretion

None.

## Deferred Ideas

None.
