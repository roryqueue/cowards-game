# Phase 107: Deferred Surface Relabeling and Privacy Preservation - Research

**Researched:** 2026-05-24
**Domain:** TypeScript backend-retirement surface labeling, deferred product paths, owner-debug replay privacy, test/fixture/parity gating
**Confidence:** HIGH for repo-local inventory, current monitor behavior, and Phase 107 planning inputs; MEDIUM for exact implementation split until the planner chooses task boundaries. [VERIFIED: AGENTS.md; VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

The following locked decisions, discretion area, and deferred ideas are copied from the Phase 107 context artifact. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]

### Locked Decisions
## Implementation Decisions

### Final Surface Label Artifact
- **D-01:** Produce or update a final TypeScript surface label artifact covering every remaining backend-like TypeScript path.
- **D-02:** Every entry must use the strict Phase 103 taxonomy and include owner, reason, risk, privacy class, gate, future migration note, and monitor status.
- **D-03:** The label artifact should be suitable for Phase 108 monitor enforcement.

### Deferred Product Surfaces
- **D-04:** Workshop validation, submission, save/source/test, analytics rerun/profile/export/runtime flows may remain only as explicit `deferred` surfaces unless migrated earlier.
- **D-05:** Broader ladder/admin/governance mutations may remain only as explicit `deferred` surfaces unless migrated earlier.
- **D-06:** Account source/private-source endpoints may remain only with explicit private/deferred labeling and authorization gates.

### Owner-Debug Replay
- **D-07:** Owner-debug replay may remain only as explicit private/deferred behavior with enablement and authorization gates.
- **D-08:** Owner-debug replay must not act as public evidence fallback.
- **D-09:** Public replay metadata/evidence must remain Go-owned when selected.

### Test-Support And Fixtures
- **D-10:** Test-support routes and fixture generators may remain only under `test-only` or `fixture-only` gates.
- **D-11:** Tests or monitors should assert these paths cannot serve normal product traffic.

### Privacy Guard Floor
- **D-12:** All remaining deferred, rollback, parity, test, and fixture surfaces must preserve public-output privacy by default.
- **D-13:** Public/default output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.

### Scope Control
- **D-14:** Phase 107 should label and harden what remains.
- **D-15:** It should not migrate Workshop, governance, broader ladder mutation, or owner-debug replay by accident unless those paths were already selected by Phase 105.

### the agent's Discretion
The agent may choose exact artifact filename, label grouping, scanner source, and whether route/file comments are useful, provided every remaining backend-like TypeScript surface is covered and public-output privacy is enforceable.

### Deferred Ideas (OUT OF SCOPE)
- Migrating Workshop to Go.
- Migrating broader ladder/admin/governance mutation paths to Go.
- Migrating full owner-debug replay/private Chronicle projection to Go.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEF-01 | Developer can inspect remaining Workshop validation, source, test launch, analytics rerun, profile save, export, and runtime flows labeled as deferred unless migrated to Go in this milestone. | The current inventory has 14 Workshop API routes, 1 Workshop server module, 10 Workshop frontend modules, 4 Workshop web-lib modules, and 2 Workshop persistence modules needing final deferred labels. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| DEF-02 | Developer can inspect remaining admin/governance and ladder mutation surfaces labeled as deferred unless migrated to Go in this milestone. | The current inventory has 1 governance API route, 1 governance persistence module, 3 ladder API routes, 1 ladder page, and 1 ladder persistence module needing final deferred labels. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| DEF-03 | Developer can inspect owner-debug replay behavior as an explicit private/deferred path with authorization gates, not a public evidence fallback. | Owner-debug replay is gated by `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1`, plus `ownerDebug` or `debug` query parameters and `ownerPlayerId`; selected public replay evidence bypasses Chronicle persistence when owner-debug is not allowed. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/matches/server.ts] |
| DEF-04 | Developer can verify test-support routes, fixture generators, and parity harnesses are gated and labeled so they cannot serve normal product runtime traffic. | `apps/web/app/api/test-support/replay-fixture/route.ts` uses `isReplayFixtureEnabled`, and `apps/web/app/api/test-support/run-worker-once/route.ts` is enabled only for `PLAYWRIGHT_TEST=1` or `NODE_ENV=test`; the inventory labels 2 API test-support routes and 3 fixture-only surfaces. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts; VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| DEF-05 | Developer can verify all deferred or rollback TypeScript paths preserve public-output privacy and owner-source privacy when exercised by tests or explicit local workflows. | Public-output denylist helpers exist in `packages/spec/src/public-output-privacy.ts`; public Chronicle projection removes private payload keys and asserts leak safety; boundary monitors already scan public examples and Go fixtures for forbidden fields/markers. [VERIFIED: packages/spec/src/public-output-privacy.ts; VERIFIED: packages/replay/src/project.ts; VERIFIED: scripts/check-boundary-monitors.ts] |
| DEF-06 | Developer can inspect a final TypeScript surface label artifact that covers every remaining TypeScript backend-like path and explains why it is allowed to remain. | Phase 103 produced a 184-surface v1.16 inventory; Phase 107 should derive a final labels artifact from that inventory and should make Phase 108 fail on drift. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VERIFICATION.md] |
</phase_requirements>

## Summary

Phase 107 should not migrate product ownership; it should convert the current v1.16 inventory into a final, monitor-consumable label artifact for all remaining non-normal TypeScript surfaces. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]

The current source of truth is `.planning/artifacts/v1.16-typescript-backend-inventory.json`, which contains 184 surfaces: 44 `deferred`, 48 `test-only`, 16 `parity-only`, 5 `rollback-only`, 3 `fixture-only`, 1 `quarantined`, 44 `frontend-only`, 5 `runtime-service`, and 18 `runtime-adapter`. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

**Primary recommendation:** Create `.planning/artifacts/v1.16-final-typescript-surface-labels.json` plus `.md`, generated or checked from the Phase 103 inventory, and add Phase 107 monitor/tests proving deferred, private, test, fixture, parity, rollback, runtime, and frontend-only labels remain explicit and public-output safe. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: scripts/check-boundary-monitors.ts]

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not move into React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be treated as a security boundary for hostile code. [VERIFIED: AGENTS.md]
- Strategy code must be treated as hostile and runtime boundaries must be schema validated. [VERIFIED: AGENTS.md]
- Canonical terminology must be preserved: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board realism checks for in-bounds visible Soldiers/terrain and plausible full Match starts. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Final TypeScript surface label artifact | Planning / repo artifacts | Monitor scripts | The artifact is planning evidence consumed by `scripts/check-boundary-monitors.ts`; it should not change runtime ownership. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md; VERIFIED: scripts/check-boundary-monitors.ts] |
| Workshop validation/source/test/analytics/export labels | Frontend Server / Next API | Future Go backend | Current Workshop routes call TypeScript Workshop server/persistence and are explicitly deferred until future migration. [VERIFIED: apps/web/app/workshop/server.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Ladder/admin/governance mutation labels | Frontend Server / Next API | Future Go backend | Current ladder/admin routes call `competitiveServer` and persistence-backed ladder/governance modules and are deferred. [VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Owner-debug replay privacy | Frontend Server / Replay assembly | Persistence quarantine | Owner-debug replay reads stored Chronicles only when explicit private gates pass; selected public replay evidence remains Go-owned. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/matches/server.ts] |
| Test-support and fixtures | Test infrastructure | Frontend Server route gates | Test-support routes and replay fixtures must be unreachable in normal product runtime. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts] |
| Public-output privacy scanning | Spec/contracts | Replay projection and monitors | `assertPublicOutputLeakSafe`, replay projection, and monitor scans provide the reusable privacy guard floor. [VERIFIED: packages/spec/src/public-output-privacy.ts; VERIFIED: packages/replay/src/project.ts; VERIFIED: scripts/check-boundary-monitors.ts] |

## Current Inventory Snapshot

All rows in this subsection are derived from the generated v1.16 inventory artifact. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

| Role | Count | Phase 107 Meaning |
|------|------:|-------------------|
| `deferred` | 44 | Remaining product/private TypeScript surfaces that must be explicitly allowed, gated, and migration-noted. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `test-only` | 48 | Test routes, tests, and harnesses that must not serve normal product runtime. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `fixture-only` | 3 | Fixture data and replay fixture helpers that must stay local/test scoped. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `parity-only` | 16 | TypeScript persistence/service reference paths that must not become normal backend behavior. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `rollback-only` | 5 | Worker/lifecycle rollback paths that must require explicit operator rollback gates and single-owner policy. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `quarantined` | 1 | Explicit lifecycle quarantine subpath. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `frontend-only` | 44 | Normal TypeScript frontend/Go adapter code, not backend ownership. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `runtime-service` | 5 | Current isolated JS/TS runtime service files, not backend authority. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `runtime-adapter` | 18 | JS/TS Strategy runtime adapter implementation under ABI boundary. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |

## Exact Remaining Surfaces

### Deferred Workshop Surfaces

Source for every row in this table is the current v1.16 inventory artifact. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

| Surface | Role | Privacy Risk | Relabeling Strategy |
|---------|------|--------------|---------------------|
| `apps/web/app/api/workshop/analytics/export/route.ts` | `deferred` | Owner/private analytics export may leak source-adjacent or diagnostic fields if treated as public output. | Label `deferred-workshop-owner-private`, require local/owner gate, no public output. |
| `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts` | `deferred` | Profile comparison is owner/local analytics data. | Label `deferred-workshop-owner-private`, require local/owner gate. |
| `apps/web/app/api/workshop/analytics/profiles/[profileId]/runs/route.ts` | `deferred` | Analytics rerun can trigger persisted TypeScript-backed workflow. | Label `deferred-workshop-runtime-support`, require no normal backend ownership. |
| `apps/web/app/api/workshop/analytics/profiles/route.ts` | `deferred` | Profile save is owner/local mutation. | Label `deferred-workshop-owner-private`. |
| `apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts` | `deferred` | Returns Strategy source. | Label `deferred-workshop-private-source`, require authorization and `no-store`. |
| `apps/web/app/api/workshop/revisions/route.ts` | `deferred` | Handles revision list/submit and source-bearing writes. | Label `deferred-workshop-private-source`. |
| `apps/web/app/api/workshop/route.ts` | `deferred` | Returns Workshop initial data. | Label `deferred-workshop-owner-scoped`. |
| `apps/web/app/api/workshop/source/route.ts` | `deferred` | Returns Strategy source. | Label `deferred-workshop-private-source`, require authorization and `no-store`. |
| `apps/web/app/api/workshop/submit/route.ts` | `deferred` | Alias for revision submission. | Label same as `apps/web/app/api/workshop/revisions/route.ts`. |
| `apps/web/app/api/workshop/test/[matchSetId]/route.ts` | `deferred` | Returns test MatchSet summary and can expose owner-local diagnostics. | Label `deferred-workshop-test-summary`, owner/local only. |
| `apps/web/app/api/workshop/test/route.ts` | `deferred` | Alias for test launch. | Label same as `apps/web/app/api/workshop/tests/route.ts`. |
| `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` | `deferred` | Test result read path. | Label `deferred-workshop-test-summary`, owner/local only. |
| `apps/web/app/api/workshop/tests/route.ts` | `deferred` | Test launch path. | Label `deferred-workshop-runtime-support`, no normal backend ownership. |
| `apps/web/app/api/workshop/validate/route.ts` | `deferred` | Takes Strategy source as input. | Label `deferred-workshop-private-source-input`, response must be diagnostics-safe. |
| `apps/web/app/workshop/server.ts` | `deferred` | Imports Workshop and analytics persistence and handles source/test/export/rerun/profile workflows. | Label as single Workshop deferred server owner surface with child capability map. |
| `apps/web/lib/workshop-analytics-service-adapter.ts` | `deferred` | Uses local service for analytics reads. | Label `deferred-workshop-service-adapter`, no normal backend. |
| `apps/web/lib/workshop-analytics-service-boundary.ts` | `deferred` | Boundary facade for analytics reads. | Label `deferred-workshop-service-boundary`. |
| `apps/web/lib/workshop-read-service-adapter.ts` | `deferred` | Uses local service for Workshop reads. | Label `deferred-workshop-service-adapter`, no normal backend. |
| `apps/web/lib/workshop-read-service-boundary.ts` | `deferred` | Boundary facade for Workshop reads. | Label `deferred-workshop-service-boundary`. |
| `packages/persistence/src/workshop.ts` | `deferred` | Persistence module can create tests and validate/source workflows. | Label `deferred-workshop-persistence`, future Go migration target. |
| `packages/persistence/src/workshop-analytics.ts` | `deferred` | Persistence module can rerun/save/export analytics. | Label `deferred-workshop-analytics-persistence`, future Go migration target. |
| `apps/web/app/workshop/analytics-test-fixture.ts` | `deferred` | Local analytics demo/test data can be mistaken for production evidence. | Relabel candidate: `fixture-only` if planner confirms it is not product runtime. |
| `apps/web/app/workshop/evidence/evidence-client.tsx` | `deferred` | Owner Workshop analytics UI can display private/local evidence. | Label `deferred-workshop-ui`, not backend owner. |
| `apps/web/app/workshop/evidence/evidence-state.ts` | `deferred` | Client state can carry owner analytics details. | Label `deferred-workshop-ui-state`. |
| `apps/web/app/workshop/evidence/page.tsx` | `deferred` | Page loads deferred Workshop analytics experience. | Label `deferred-workshop-page`. |
| `apps/web/app/workshop/heatmap-client.tsx` | `deferred` | Client can display owner/local analytics and replay links. | Label `deferred-workshop-ui`. |
| `apps/web/app/workshop/heatmap-state.ts` | `deferred` | Client state can carry matchup analytics. | Label `deferred-workshop-ui-state`. |
| `apps/web/app/workshop/monaco-editor.tsx` | `deferred` | Editor handles Strategy source in browser. | Label `frontend-private-source-editor`; still deferred product surface. |
| `apps/web/app/workshop/types.ts` | `deferred` | Types include Workshop source/test/analytics shapes. | Label `deferred-workshop-types`. |
| `apps/web/app/workshop/workshop-client-state.ts` | `deferred` | Client state includes source/test flow state. | Label `deferred-workshop-ui-state`. |
| `apps/web/app/workshop/workshop-client.tsx` | `deferred` | UI handles Strategy source, test launch, and submission. | Label `deferred-workshop-ui-private-source`. |

### Deferred Ladder, Governance, Private Account, Replay, And Service Surfaces

Source for every row in this table is the current inventory plus route/server source where noted. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: apps/web/app/matches/server.ts]

| Surface | Role | Privacy Risk | Relabeling Strategy |
|---------|------|--------------|---------------------|
| `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts` | `deferred` | Admin mutation can change public governance status and includes admin identity input. | Label `deferred-governance-admin-mutation`, require admin authorization and public-safe reason/explanation only. |
| `packages/persistence/src/governance.ts` | `deferred` | Persistence mutation can complete governance status updates. | Label `deferred-governance-persistence`, future Go migration target. |
| `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` | `deferred` | Ladder entry mutation uses account session and entrant ownership. | Label `deferred-ladder-mutation`, no selected normal backend claim. |
| `apps/web/app/api/ladder/seasons/[seasonId]/schedule/route.ts` | `deferred` | Scheduling can enqueue or mutate competition state. | Label `deferred-ladder-scheduling`, future Go target. |
| `apps/web/app/api/ladder/seasons/route.ts` | `deferred` | Season creation mutation uses account/admin state. | Label `deferred-ladder-mutation`. |
| `apps/web/app/ladder/[seasonId]/page.tsx` | `deferred` | Page can rely on deferred ladder data path. | Label `deferred-ladder-page` unless planner proves it is selected Go public read only. |
| `packages/persistence/src/ladder.ts` | `deferred` | Persistence module can schedule, enter, withdraw, and refresh ladder-related state. | Label `deferred-ladder-persistence`. |
| `apps/web/app/competitive/server.ts` | `deferred` | Imports auth, account revisions, competition, ladder, governance, and preset persistence modules. | Label `deferred-competitive-server-aggregate`; child labels should split account private source, ladder, governance, Starter/Advanced refs. |
| `packages/persistence/src/account-revisions.ts` | `deferred` | Stores and retrieves owner Strategy source. | Label `deferred-account-private-source-persistence` for non-selected Workshop/private use only. |
| `packages/persistence/src/auth.ts` | `deferred` | Handles sessions and account authentication. | Label `deferred-auth-persistence` for non-selected or rollback/deferred support only. |
| `apps/web/lib/account-service-adapter.ts` | `deferred` | Still contains local TypeScript service/persistence path for non-selected use. | Label selected behavior as frontend-Go and non-selected behavior as `deferred-local-service-support`; monitor no selected fallback. |
| `apps/web/lib/public-service-adapter.ts` | `deferred` | Still contains local public service support for non-selected use. | Label selected behavior as frontend-Go and non-selected behavior as `deferred-public-service-support`; monitor public privacy. |
| `apps/web/app/matches/server.ts` | `deferred` | Contains selected Go public replay path plus private Chronicle owner-debug/deferred path. | Split label: `frontend-go-public-replay` for selected public path and `deferred-owner-debug-chronicle` for private path. |

### Owner-Debug Replay Surfaces

Owner-debug replay currently spans the owner-debug query resolver, replay server, replay ready projection, replay page/client state, and Chronicle projection. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/matches/server.ts; VERIFIED: apps/web/app/matches/replay-ready.ts; VERIFIED: packages/replay/src/project.ts]

| Surface | Current Inventory Role | Current Gate | Planning Action |
|---------|------------------------|--------------|-----------------|
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | `frontend-only` | `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1`, plus query and `ownerPlayerId`. | Label as `private-owner-debug-frontend-gate`; monitor gate tokens. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] |
| `apps/web/app/matches/server.ts` | `deferred` | Uses Go public evidence when selected and not owner-debug; otherwise can read quarantined Chronicle store. | Split public and owner-debug labels; public branch must not fallback to Chronicle. [VERIFIED: apps/web/app/matches/server.ts] |
| `apps/web/app/matches/replay-ready.ts` | `frontend-only` | Owner mode only after trusted owner options; public evidence builder always returns `mode: "public"`. | Label owner-debug builder as private and public builder as public-redacted. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| `packages/replay/src/project.ts` | Outside web inventory but privacy-critical | Public projection removes private keys and asserts leak safety; owner projection adds owner private data. | Keep public projection as privacy floor and test owner projection never feeds public output. [VERIFIED: packages/replay/src/project.ts] |

### Test-Support, Fixtures, Parity, Rollback, Runtime, And Frontend-Only Surfaces

The planner should not relabel these as normal backend paths; the final artifact should cover them exactly and explain why they remain. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

| Group | Exact Surfaces | Role / Need |
|-------|----------------|-------------|
| Test-support API routes | `apps/web/app/api/test-support/replay-fixture/route.ts`; `apps/web/app/api/test-support/run-worker-once/route.ts` | `test-only`; monitor 404 outside test/playwright and ensure diagnostics cannot be public default output. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts; VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts] |
| Fixture-only surfaces | `apps/web/app/matches/replay-fixture.ts`; `packages/persistence/src/presets.ts`; `packages/persistence/src/seed.ts` | `fixture-only`; local/test fixture generation only. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Parity-only persistence/service | `packages/persistence/src/advanced-strategies.ts`; `packages/persistence/src/chronicle-store.ts`; `packages/persistence/src/competition.ts`; `packages/persistence/src/db.ts`; `packages/persistence/src/dev-smoke.ts`; `packages/persistence/src/index.ts`; `packages/persistence/src/match-service.ts`; `packages/persistence/src/matchset-service.ts`; `packages/persistence/src/matchset-status.ts`; `packages/persistence/src/migrations.ts`; `packages/persistence/src/profiles.ts`; `packages/persistence/src/repositories.ts`; `packages/persistence/src/schema.ts`; `packages/persistence/src/scoring.ts`; `packages/persistence/src/starter-strategies.ts`; `packages/service/src/index.ts` | `parity-only`; fixture/parity/reference support, not normal backend. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Rollback-only worker/lifecycle | `apps/worker/src/index.ts`; `apps/worker/src/runner.ts`; `apps/worker/src/runtime-config.ts`; `packages/persistence/src/complete-match.ts`; `packages/persistence/src/jobs.ts` | `rollback-only`; explicit rollback/test/parity purpose and no mixed Go plus TypeScript owners. [VERIFIED: .planning/artifacts/v1.16-typescript-worker-quarantine.json; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Quarantined lifecycle subpath | `packages/persistence/src/quarantine-lifecycle.ts` | `quarantined`; explicit only, never normal root export. [VERIFIED: packages/persistence/src/quarantine-lifecycle.ts; VERIFIED: scripts/check-boundary-monitors.ts] |
| Runtime service | `apps/runtime-service/src/execute-match.ts`; `apps/runtime-service/src/index.ts`; `apps/runtime-service/src/redaction.ts`; `apps/runtime-service/src/runtime-config.ts`; `apps/runtime-service/src/server.ts` | `runtime-service`; DB-free Strategy Execution Service binding only. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.json; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Runtime adapter | `packages/runtime-js/src/abi-bridge.ts`; `packages/runtime-js/src/adapter.ts`; `packages/runtime-js/src/container-subprocess-adapter.ts`; `packages/runtime-js/src/executor.ts`; `packages/runtime-js/src/guards.ts`; `packages/runtime-js/src/hash.ts`; `packages/runtime-js/src/index.ts`; `packages/runtime-js/src/revision.ts`; `packages/runtime-js/src/sandbox-evaluation.ts`; `packages/runtime-js/src/subprocess-adapter.ts`; `packages/runtime-js/src/subprocess-harness.ts`; `packages/runtime-js/src/subprocess-ipc.ts`; `packages/runtime-js/src/transpile.ts`; `packages/runtime-js/src/validation.ts`; `packages/runtime-js/src/worker-bridge.ts`; `packages/runtime-js/src/worker-harness.ts`; `packages/runtime-js/src/worker-thread-adapter.ts`; `packages/runtime-js/src/worker.ts` | `runtime-adapter`; ABI-bound JS/TS execution only. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| Frontend-only selected Go adapters/pages | 44 inventory rows, including selected auth/account/fork/exhibition/public read/replay Next routes and pages. | `frontend-only`; keep selected Go/no-fallback behavior and schema/privacy guards. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| TypeScript | Repo `^6.0.3`; npm current `6.0.3`, modified 2026-04-16 | Type-safe source and scanner/test compilation. | Existing repo stack and scanner implementation use TypeScript. [VERIFIED: package.json; VERIFIED: npm registry] |
| Vitest | Repo `^4.1.6`; npm current `4.1.7`, modified 2026-05-20 | Focused unit/contract tests for scanners, route handlers, and monitors. | Existing Phase 103-106 tests use Vitest; planner should keep focused tests here. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VERIFICATION.md] |
| `tsx` via pnpm scripts | Repo scripts use `pnpm exec tsx` | Runs TypeScript monitor and generator CLIs. | Existing inventory, topology, and monitor scripts use it. [VERIFIED: package.json] |
| `scripts/check-boundary-monitors.ts` | Repo-local | Boundary, privacy, route, runtime, worker, and topology monitor composition. | Phase 107 should extend this rather than adding a parallel monitor framework. [VERIFIED: scripts/check-boundary-monitors.ts] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Playwright | Repo `^1.60.0`; npm current `1.60.0`, modified 2026-05-24 | Replay/page smoke when Phase 108/109 require browser proof. | Phase 107 can rely on existing replay/page tests and reserve live smoke for Phase 108. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: .planning/ROADMAP.md] |
| Redocly CLI | Repo `2.31.4`; npm current `2.31.4`, modified 2026-05-22 | OpenAPI lint inside `boundary:monitors`. | Keep as existing monitor dependency. [VERIFIED: package.json; VERIFIED: npm registry] |
| Turbo | Repo `^2.9.14`; npm current `2.9.14`, modified 2026-05-24 | Workspace build/test orchestration. | Use existing scripts, not new task runners. [VERIFIED: package.json; VERIFIED: npm registry] |
| Go toolchain | Local `go1.26.3 darwin/amd64` | Go backend tests in existing monitors. | Required by `pnpm go:parity` and `boundary:monitors`. [VERIFIED: local command `go version`; VERIFIED: package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Generated final label artifact from inventory | Hand-maintained markdown only | Hand-maintained prose cannot reliably feed Phase 108 drift monitors. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md; VERIFIED: scripts/generate-typescript-backend-inventory.ts] |
| Extending `scripts/check-boundary-monitors.ts` | Separate one-off Phase 107 script | Existing `boundary:monitors` already composes privacy, import, inventory, route, runtime, worker, and topology checks. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: package.json] |
| Adding new libraries | No new dependencies | Phase 107 is labeling/monitor work; existing stack covers it. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md; VERIFIED: package.json] |

**Installation:**
```bash
# No new packages are recommended for Phase 107.
pnpm install
```

## Architecture Patterns

### System Architecture Diagram

```text
Phase 103 inventory JSON
  -> Phase 107 final surface label generator/check
  -> final JSON + markdown labels
  -> boundary monitor validation
  -> Phase 108 no-TypeScript-backend topology gate

Runtime requests
  -> web frontend / Next route adapter
  -> Go backend selected normal contracts
  -> isolated JS/TS runtime service only for Strategy execution

Explicit non-normal paths
  -> deferred Workshop / ladder / governance
  -> private owner-debug replay
  -> test-support / fixtures / parity / rollback
  -> monitor labels and privacy gates
```

This diagram reflects the current v1.16 ownership target and Phase 107 context. [VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]

### Recommended Project Structure

```text
.planning/artifacts/
  v1.16-final-typescript-surface-labels.json   # final Phase 107 label artifact
  v1.16-final-typescript-surface-labels.md     # human-readable label matrix
scripts/
  check-boundary-monitors.ts                   # add final label validation lane
  generate-typescript-backend-inventory.ts     # optional source for shared taxonomy
tests or script tests/
  check-boundary-monitors.test.ts              # artifact/monitor drift tests
  generate-typescript-backend-inventory.test.ts # update only if taxonomy scanner changes
```

The artifact names are recommended by research under the Phase 107 discretion area; the user did not lock an exact filename. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]

### Pattern 1: Generated Label Artifact From Existing Inventory

**What:** Read `.planning/artifacts/v1.16-typescript-backend-inventory.json`, project each surface into a final label row, and reject any row missing role, owner, reason, risk, privacy class, gate, future migration note, or monitor status. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

**When to use:** Use this for the Phase 107 artifact so the label set remains synchronized with the scanner and inventory. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md]

**Example:**
```typescript
// Source: scripts/check-boundary-monitors.ts and inventory schema
const requiredFields = [
  "path",
  "role",
  "owner",
  "reason",
  "risk",
  "privacyClass",
  "gate",
  "futureMigration",
  "monitorStatus",
] as const
```

### Pattern 2: Split Mixed Surfaces Into Capability Labels

**What:** For aggregate files such as `apps/web/app/competitive/server.ts`, `apps/web/app/matches/server.ts`, and `apps/web/app/workshop/server.ts`, label file-level role plus child capability roles. [VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: apps/web/app/matches/server.ts; VERIFIED: apps/web/app/workshop/server.ts]

**When to use:** Use it when one file contains selected frontend-Go behavior and deferred/private behavior, especially replay and account/public adapters. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md]

### Anti-Patterns to Avoid

- **Migrating by relabeling:** A `deferred` label must not imply Go ownership or selected normal behavior. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]
- **Public fallback to owner-debug:** Owner-debug Chronicle reads must not run for selected public replay evidence. [VERIFIED: apps/web/app/matches/server.ts]
- **Test route as product route:** Test-support endpoints must remain 404 outside test/playwright enablement. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts; VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts]
- **Privacy marker in artifacts:** Public/default outputs and planning artifacts should not include real Strategy source, tokens, DB DSNs, host paths, stack traces, stderr, or private runtime internals. [VERIFIED: packages/spec/src/public-output-privacy.ts; VERIFIED: scripts/check-boundary-monitors.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Surface discovery | A new grep-only scanner | Existing TypeScript AST inventory generator | The existing generator already discovers route methods, imports, role taxonomy, capability booleans, privacy class, and stale artifact checks. [VERIFIED: scripts/generate-typescript-backend-inventory.ts] |
| Public-output privacy denylist | New string list in Phase 107 code | `PUBLIC_OUTPUT_FORBIDDEN_FIELDS`, `PUBLIC_OUTPUT_FORBIDDEN_MARKERS`, and `assertPublicOutputLeakSafe` | Existing spec helpers are already used by replay projection and monitor checks. [VERIFIED: packages/spec/src/public-output-privacy.ts; VERIFIED: packages/replay/src/project.ts] |
| Monitor orchestration | New standalone monitor command | Extend `pnpm boundary:monitors` | Existing command already runs contract, lint, import boundary, inventory, Go parity, sandbox, topology, and boundary checks. [VERIFIED: package.json; VERIFIED: scripts/check-boundary-monitors.ts] |
| Owner-debug authorization | Query-only debug flag | Existing env plus owner authorization checks | Current owner-debug requires env/test enablement and authorized owner resolution before owner mode is trusted. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/matches/server.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |

**Key insight:** Phase 107 is a classification and privacy enforcement phase, so the safest path is to derive final labels from existing generated inventory and make monitors fail on drift. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None found for Phase 107 relabeling; the phase targets repo artifacts, monitor labels, route gates, and privacy tests rather than renaming stored DB keys or user records. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md] | No data migration; planner should avoid DB changes. |
| Live service config | None found; Phase 107 does not add cloud/service configuration and existing local gates are env-based. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md; VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] | No service config migration; document env gates only. |
| OS-registered state | None found; no launchd/systemd/pm2/task registration change is part of Phase 107. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md] | None. |
| Secrets/env vars | Existing relevant env gates are `PLAYWRIGHT_TEST`, `NODE_ENV`, `COWARDS_ENABLE_OWNER_DEBUG_REPLAY`, `COWARDS_NO_TYPESCRIPT_BACKEND`, `COWARDS_GO_BACKEND_URL`, `COWARDS_TYPESCRIPT_WORKER_PURPOSE`, and worker test env names. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: apps/web/app/matches/server.ts; VERIFIED: scripts/check-boundary-monitors.ts] | Do not rename secrets; monitor that diagnostics do not leak env values. |
| Build artifacts | Existing generated artifacts include inventory, selected Go route manifest, runtime boundary, and worker quarantine artifacts. [VERIFIED: find .planning/artifacts; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] | Add/check final label artifacts; no package reinstall required. |

## Common Pitfalls

### Pitfall 1: Treating Deferred As Safe By Default
**What goes wrong:** A deferred TypeScript route remains reachable and is mistaken for normal backend behavior. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
**Why it happens:** The current inventory labels many surfaces as `deferred`, but Phase 107 still needs final roles, gates, and monitor status for Phase 108. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]
**How to avoid:** Final labels must include `selectedNormal=false`, owner, privacy class, gate, risk, future migration note, and monitor status. [VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md]
**Warning signs:** `competitiveServer`, `workshopServer`, `@cowards/persistence`, or `@cowards/service` appears in selected normal route files or unknown report-only boundary offenses appear. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: pnpm boundary:imports]

### Pitfall 2: Owner-Debug Becomes Public Replay Fallback
**What goes wrong:** A selected public replay path falls back to persisted Chronicle reads and owner-debug projection. [VERIFIED: apps/web/app/matches/server.ts]
**Why it happens:** `apps/web/app/matches/server.ts` contains both selected public Go evidence and owner-debug/private Chronicle paths. [VERIFIED: apps/web/app/matches/server.ts]
**How to avoid:** Keep selected public branch first and fail closed without `COWARDS_GO_BACKEND_URL`; allow Chronicle store only for fixture, non-selected, or explicit owner-debug/private paths. [VERIFIED: apps/web/app/matches/server.ts; VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md]
**Warning signs:** Public replay tests pass with Go disabled by using Chronicle persistence. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md]

### Pitfall 3: Test-Support Diagnostics Leak Private Material
**What goes wrong:** The test worker route can include capped stdout/stderr diagnostics when enabled, and those fields would violate public-output privacy if exposed as normal product output. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: packages/spec/src/public-output-privacy.ts]
**Why it happens:** Test-support routes intentionally expose diagnostic data under test gates. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts]
**How to avoid:** Monitor 404 outside test/playwright, classify route as `test-only`, and keep diagnostic fields out of public/default outputs and artifacts. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: scripts/check-boundary-monitors.ts]
**Warning signs:** `stderr`, `stack`, token, DB URL, or host path fields appear in non-test response examples or artifacts. [VERIFIED: packages/spec/src/public-output-privacy.ts; VERIFIED: scripts/check-boundary-monitors.ts]

## Code Examples

### Existing Owner-Debug Gate
```typescript
// Source: apps/web/app/matches/[matchId]/replay/owner-debug.ts
export const isOwnerDebugReplayEnabled = (env = process.env): boolean =>
  env.PLAYWRIGHT_TEST === "1" ||
  env.NODE_ENV === "test" ||
  env.COWARDS_ENABLE_OWNER_DEBUG_REPLAY === "1"
```

### Existing Public Privacy Assertion
```typescript
// Source: packages/spec/src/public-output-privacy.ts
export const assertPublicOutputLeakSafe = (
  value: unknown,
  label = "Public output",
): void => {
  // Recursively rejects forbidden public fields and markers.
}
```

### Existing Monitor Pattern
```typescript
// Source: scripts/check-boundary-monitors.ts
await check("privacy", "public service route examples", () =>
  checkPublicServiceExamples(),
)
await check("web_boundary", "web import drift baseline", () =>
  checkWebBoundary(),
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Broad TypeScript service/backend fallback for selected flows | Selected auth/account/fork/exhibition/public/replay routes use Go or fail closed | Phase 105 on 2026-05-24 | Phase 107 should not re-open selected fallback while labeling deferred paths. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md] |
| TypeScript worker as normal lifecycle owner | TypeScript worker is rollback/test/parity only with single-owner rollback artifact | Phase 106 on 2026-05-24 | Phase 107 labels rollback paths, not normal worker ownership. [VERIFIED: .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VERIFICATION.md] |
| v1.15 surface seed with 13 broad labels | v1.16 inventory with 184 per-file surfaces | Phase 103 and refreshed through Phase 106 | Phase 107 should produce a final artifact from the richer inventory, not from the old v1.15 seed alone. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |

**Deprecated/outdated:**
- Treating `@cowards/service` as selected normal backend is outdated for v1.16 selected routes; it is parity/fixture/rollback/deferred support. [VERIFIED: .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VERIFICATION.md]
- Treating TypeScript Chronicle reads as public replay evidence fallback is outdated for selected public replay. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The recommended artifact name `.planning/artifacts/v1.16-final-typescript-surface-labels.json` is acceptable. [ASSUMED] | Summary / Recommended Project Structure | Low; the Phase 107 context gives filename discretion, but planner can choose another name if monitors are updated. |

## Open Questions

1. **Should Workshop UI-only files remain `deferred` or become `frontend-only-private-source` labels?**
   - What we know: The current inventory labels Workshop UI/client/state files as `deferred`. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
   - What's unclear: Whether Phase 107 should preserve the generated role exactly or use a richer sublabel while keeping taxonomy role `deferred`. [ASSUMED]
   - Recommendation: Keep taxonomy role `deferred` and add a `surfaceSubtype` or `capability` field for UI/private-source specificity. [ASSUMED]
2. **Should `apps/web/app/workshop/analytics-test-fixture.ts` move from `deferred` to `fixture-only`?**
   - What we know: Its filename and inventory capability indicate fixture-like Workshop analytics data, but the current role is `deferred`. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
   - What's unclear: Whether product UI imports it in a way that requires deferred product labeling. [ASSUMED]
   - Recommendation: Planner should inspect imports before changing taxonomy role; if it is local demo/test only, relabel as `fixture-only`. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript scripts/tests | yes | `v24.15.0` | None needed for repo scripts. [VERIFIED: local command `node --version`] |
| pnpm | Workspace scripts | yes | `11.1.2` | npm is present but repo scripts use pnpm. [VERIFIED: local command `pnpm --version`; VERIFIED: package.json] |
| npm | Registry verification | yes | `11.12.1` | Not used for repo execution. [VERIFIED: local command `npm --version`] |
| Go | `pnpm go:parity` and boundary monitors | yes | `go1.26.3 darwin/amd64` | None for full `boundary:monitors`; focused Phase 107 tests can avoid Go if not running parity. [VERIFIED: local command `go version`; VERIFIED: package.json] |
| Local web/Go/runtime services | Phase 108 strict topology, not Phase 107 research | not probed as running | - | Phase 107 can run static/focused tests; Phase 108 owns live strict mode. [VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md] |

**Missing dependencies with no fallback:** None identified for Phase 107 research and planning. [VERIFIED: local command checks]

**Missing dependencies with fallback:** Live services are not required for Phase 107 static artifact/monitor work; Phase 108 owns strict topology. [VERIFIED: .planning/ROADMAP.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest repo `^4.1.6`, npm current `4.1.7`; Playwright repo/current `1.60.0` for later browser smoke. [VERIFIED: package.json; VERIFIED: npm registry] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, and `playwright.config.ts` exist. [VERIFIED: rg --files] |
| Quick run command | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts apps/web/app/matches/server.test.ts apps/web/app/matches/[matchId]/replay/owner-debug.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts` |
| Full suite command | `pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm boundary:monitors` |

### Phase Requirements To Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DEF-01 | Workshop deferred labels cover source, validation, test launch, analytics rerun/profile/export/runtime flows. | unit / artifact | Add or extend `scripts/check-boundary-monitors.test.ts`; run `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | Exists. [VERIFIED: rg --files] |
| DEF-02 | Ladder/admin/governance mutations are deferred and not selected normal Go routes. | unit / import boundary | `pnpm boundary:imports`; add monitor assertions for final label rows | Exists. [VERIFIED: pnpm boundary:imports; VERIFIED: scripts/check-boundary-monitors.ts] |
| DEF-03 | Owner-debug replay is private/authorized and not public evidence fallback. | unit | `pnpm exec vitest run apps/web/app/matches/server.test.ts apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` | Exists. [VERIFIED: rg --files] |
| DEF-04 | Test-support routes and fixture generators are gated from normal product runtime. | unit | `pnpm exec vitest run apps/web/app/api/test-support/run-worker-once/route.test.ts`; add replay fixture route coverage if missing | Partial; run-worker test exists, replay fixture route test not found. [VERIFIED: rg --files] |
| DEF-05 | Deferred/rollback/parity/test/fixture public-default outputs are privacy safe. | unit / monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts packages/replay/src/project.test.ts` plus artifact privacy checks | Exists. [VERIFIED: rg --files] |
| DEF-06 | Final TypeScript surface label artifact covers every backend-like path. | artifact check | Add final-label check to `scripts/check-boundary-monitors.ts`; run `pnpm boundary:monitors` | Monitor file exists; final artifact does not yet exist. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: find .planning/artifacts] |

### Sampling Rate

- **Per task commit:** Run the quick Vitest command plus `pnpm typescript-backend:inventory:check`. [VERIFIED: package.json]
- **Per wave merge:** Run `pnpm boundary:imports && pnpm boundary:monitors`. [VERIFIED: package.json]
- **Phase gate:** Run focused tests, artifact checks, `pnpm boundary:imports`, `pnpm typescript-backend:inventory:check`, and `pnpm boundary:monitors`; live topology can remain Phase 108 scope unless source changes affect selected page smoke. [VERIFIED: .planning/ROADMAP.md; VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `.planning/artifacts/v1.16-final-typescript-surface-labels.json` - final DEF-06 label artifact. [VERIFIED: find .planning/artifacts]
- [ ] `.planning/artifacts/v1.16-final-typescript-surface-labels.md` - human-readable label matrix. [VERIFIED: find .planning/artifacts]
- [ ] `scripts/check-boundary-monitors.ts` - add final-label artifact validation lane. [VERIFIED: scripts/check-boundary-monitors.ts]
- [ ] `apps/web/app/api/test-support/replay-fixture/route.test.ts` - add if planner wants direct route-gate coverage for replay fixture API. [VERIFIED: rg --files]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing account/session and owner/admin gates; no new auth scheme in Phase 107. [VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] |
| V3 Session Management | yes | Selected normal session behavior remains Go-owned; deferred TypeScript auth persistence must be labeled non-normal. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| V4 Access Control | yes | Owner-debug, admin/governance, Workshop source, and ladder mutations require private/admin/owner/test gates. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts; VERIFIED: apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts] |
| V5 Input Validation | yes | Existing route handlers and service clients use schemas/validation; Phase 107 should not weaken them. [VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md] |
| V6 Cryptography | no new cryptography | Do not add custom crypto; preserve existing source hash/private-source behavior. [VERIFIED: AGENTS.md; VERIFIED: .planning/REQUIREMENTS.md] |

### Known Threat Patterns for Phase 107 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Deferred TypeScript route used as normal backend fallback | Elevation of Privilege / Tampering | Final labels plus monitor that selected routes have no TypeScript backend fallback. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json] |
| Owner-debug replay exposed as public evidence | Information Disclosure | Env/query/owner authorization gates plus public replay selected Go branch. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; VERIFIED: apps/web/app/matches/server.ts] |
| Strategy source returned from Workshop/account private endpoints without owner/private handling | Information Disclosure | Label private-source endpoints and require authorization/no-store behavior. [VERIFIED: apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts; VERIFIED: apps/web/app/api/workshop/source/route.ts; VERIFIED: .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md] |
| Test-support worker route leaks stderr/stack/DSN when exposed | Information Disclosure | 404 outside test/playwright and redacted/capped diagnostics only inside test. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: packages/spec/src/public-output-privacy.ts] |
| Parity or rollback persistence becomes active concurrently with Go | Tampering | Single-owner rollback artifact and worker quarantine monitor. [VERIFIED: .planning/artifacts/v1.16-typescript-worker-quarantine.json; VERIFIED: scripts/check-boundary-monitors.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project constraints, non-negotiables, testing expectations. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/v1.16-SUMMARY.md` - milestone context and Phase 107 requirements. [VERIFIED: local file reads]
- `.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md` - locked decisions and scope. [VERIFIED: local file read]
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` - 184-surface inventory and role counts. [VERIFIED: local JSON parse]
- `.planning/artifacts/v1.16-selected-go-route-manifest.json`, `.planning/artifacts/v1.16-runtime-service-boundary.json`, `.planning/artifacts/v1.16-typescript-worker-quarantine.json` - selected Go, runtime, and worker quarantine context. [VERIFIED: local file reads]
- `scripts/check-boundary-monitors.ts`, `scripts/generate-typescript-backend-inventory.ts`, `packages/spec/src/public-output-privacy.ts`, `packages/replay/src/project.ts` - monitor/scanner/privacy implementation patterns. [VERIFIED: local source inspection]
- Phase 103-106 summaries, validation, and verification reports. [VERIFIED: local file reads]

### Secondary (MEDIUM confidence)

- npm registry version checks for TypeScript, Vitest, Playwright, Redocly CLI, and Turbo. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None used for implementation-critical claims. [VERIFIED: source list above]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified from `package.json`, local commands, and npm registry where relevant. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: local command checks]
- Architecture: HIGH - derived from v1.16 roadmap, context, and current source inventory. [VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md; VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json]
- Pitfalls: HIGH - based on inspected source paths and existing monitor/test behavior. [VERIFIED: apps/web/app/matches/server.ts; VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts; VERIFIED: scripts/check-boundary-monitors.ts]

**Research date:** 2026-05-24
**Valid until:** 2026-06-23, or earlier if Phase 108 changes topology/monitor contracts. [ASSUMED]
