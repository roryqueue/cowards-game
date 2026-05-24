---
phase: 106-typescript-worker-and-persistence-quarantine
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/worker/src/index.ts
  - apps/worker/src/runner.ts
  - apps/worker/src/runner.test.ts
  - apps/worker/package.json
  - packages/persistence/src/index.ts
  - packages/persistence/package.json
  - packages/persistence/src/quarantine-lifecycle.ts
  - packages/persistence/src/jobs.ts
  - packages/persistence/src/complete-match.ts
  - packages/persistence/src/matchset-status.ts
  - packages/persistence/src/matchset-service.ts
  - packages/persistence/src/competition.ts
  - packages/persistence/src/competition.test.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - apps/web/lib/account-service-adapter.test.ts
  - apps/web/lib/public-service-adapter.test.ts
  - apps/web/app/matches/server.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/generate-typescript-backend-inventory.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.md
  - .planning/artifacts/v1.16-typescript-worker-quarantine.json
  - .planning/artifacts/v1.16-typescript-worker-quarantine.md
  - .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md
autonomous: true
requirements: [QUAR-01, QUAR-02, QUAR-03, QUAR-04, QUAR-05, QUAR-06, QUAR-07]
user_setup: []
must_haves:
  truths:
    - "Developer can verify apps/worker refuses normal backend startup unless the purpose is explicitly rollback, parity, or test."
    - "Developer can verify COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript no longer grants normal TypeScript job claim, completion, Chronicle persistence, retry, or scoring ownership."
    - "Developer can verify TypeScript lifecycle persistence modules are absent from the normal @cowards/persistence root export and reachable only through explicit quarantine imports."
    - "Developer can verify selected normal exhibition creation and selected public DTO/replay evidence paths cannot lazily use TypeScript MatchSet creation, scoring refresh, or @cowards/service fallback."
    - "Developer can inspect machine-readable and human-readable rollback/quarantine artifacts covering queued jobs, running jobs, expired leases, retries, incomplete MatchSets, scoring/public evidence, and no mixed Go plus TypeScript owners."
    - "Developer can run focused worker, export-boundary, service-role, no-mixed-owner, inventory, and monitor tests for QUAR-01 through QUAR-07."
  artifacts:
    - path: "apps/worker/src/runner.ts"
      provides: "Worker ownership guard that rejects normal TypeScript lifecycle ownership and permits only rollback/test/parity purposes"
      exports: ["createTypeScriptWorkerJobOwnershipConfig", "assertTypeScriptWorkerJobOwnershipAllowed", "TypeScriptWorkerOwnershipError", "runWorkerOnce", "runWorkerLoop"]
    - path: "apps/worker/src/index.ts"
      provides: "Executable worker entrypoint guard before database pool creation"
      contains: "COWARDS_TYPESCRIPT_WORKER_PURPOSE"
    - path: "packages/persistence/src/quarantine-lifecycle.ts"
      provides: "Explicit quarantine export boundary for TypeScript job lifecycle, Match completion, Chronicle handoff, MatchSet scoring, and MatchSet creation support"
      exports: ["claimNextMatchJob", "completeMatch", "recordAttemptFailure", "refreshMatchSetStatus", "createMatchSetService", "createManualExhibitionMatchSet"]
    - path: "packages/persistence/src/index.ts"
      provides: "Normal-safe persistence root without lifecycle owner exports"
      contains: "export * from"
    - path: "packages/service/src/index.ts"
      provides: "@cowards/service role metadata labeling the local DB-backed service as parity/fixture/rollback/deferred support, not selected normal backend"
      exports: ["createCowardsLocalService"]
    - path: "scripts/check-boundary-monitors.ts"
      provides: "Monitor checks for worker purpose guard, quarantine import boundary, service non-normal labels, no selected-normal lazy refresh, rollback artifact validity, and no mixed owners"
      contains: "v1.16-typescript-worker-quarantine"
    - path: ".planning/artifacts/v1.16-typescript-worker-quarantine.json"
      provides: "Machine-readable quarantine and rollback contract"
      contains: "mixedGoAndTypeScriptOwnersAllowed"
    - path: ".planning/artifacts/v1.16-typescript-worker-quarantine.md"
      provides: "Human-readable rollback and deviation notes for TypeScript worker/persistence quarantine"
      contains: "single owner"
  key_links:
    - from: "apps/worker/src/index.ts"
      to: "apps/worker/src/runner.ts"
      via: "entrypoint calls ownership guard before createDatabasePool"
      pattern: "assertTypeScriptWorkerJobOwnershipAllowed"
    - from: "apps/worker/src/runner.ts"
      to: "packages/persistence/src/quarantine-lifecycle.ts"
      via: "worker imports lifecycle functions from explicit quarantine subpath"
      pattern: "@cowards/persistence/quarantine-lifecycle"
    - from: "packages/persistence/src/index.ts"
      to: "packages/persistence/src/quarantine-lifecycle.ts"
      via: "root export intentionally omits quarantine lifecycle module"
      pattern: "quarantine-lifecycle"
    - from: "packages/service/src/index.ts"
      to: "packages/persistence/src/competition.ts"
      via: "local service public MatchSet DTO remains non-normal and is labeled parity/fixture/rollback/deferred"
      pattern: "buildPublicMatchSetResultDto"
    - from: "scripts/check-boundary-monitors.ts"
      to: ".planning/artifacts/v1.16-typescript-worker-quarantine.json"
      via: "artifact validation in boundary monitors"
      pattern: "v1\\.16-typescript-worker-quarantine"
---

<objective>
Create the executable Phase 106 implementation prompt for quarantining TypeScript worker and persistence lifecycle ownership.

Purpose: Phase 106 makes TypeScript DB-owning worker and persistence lifecycle code non-normal by construction after the v1.15 Go ownership baseline and Phase 105 selected Go-only route cutover. TypeScript lifecycle code may remain only as explicit rollback, parity, fixture, deferred, or test infrastructure. It must not claim jobs, complete Matches, persist Chronicles, refresh MatchSet scoring, create selected normal exhibition MatchSets, serve selected public evidence, or back selected routes as the normal backend.

Output: worker purpose guards, quarantine import/export boundaries, selected-normal lazy refresh blocking, `@cowards/service` non-normal role labels, focused worker/export/no-mixed-owner tests, boundary monitor updates, regenerated TypeScript backend inventory artifacts, worker quarantine rollback artifacts, and Phase 106 validation notes covering QUAR-01 through QUAR-07.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/get-shit-done/workflows/execute-plan.md
@/Users/roryquinlan/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/research/v1.16-SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VERIFICATION.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-VERIFICATION.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-SUMMARY.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md
@.planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md
@.planning/phases/106-typescript-worker-and-persistence-quarantine/106-RESEARCH.md
@.planning/artifacts/v1.15-lifecycle-ownership-manifest.json
@.planning/artifacts/v1.15-failure-drills.json
@.planning/artifacts/v1.15-promotion-decision.md
@.planning/artifacts/v1.16-selected-go-route-manifest.json
@.planning/artifacts/v1.16-typescript-backend-inventory.json
@.planning/artifacts/v1.16-runtime-service-boundary.json
@apps/worker/src/index.ts
@apps/worker/src/runner.ts
@apps/worker/src/runner.test.ts
@packages/persistence/src/index.ts
@packages/persistence/package.json
@packages/persistence/src/jobs.ts
@packages/persistence/src/complete-match.ts
@packages/persistence/src/matchset-status.ts
@packages/persistence/src/matchset-service.ts
@packages/persistence/src/competition.ts
@packages/service/src/index.ts
@apps/web/lib/account-service-adapter.ts
@apps/web/lib/public-service-adapter.ts
@apps/web/app/matches/server.ts
@scripts/check-boundary-monitors.ts
@scripts/check-service-boundary-imports.ts
@scripts/generate-typescript-backend-inventory.ts

<interfaces>
Use these existing contracts directly.

From `apps/worker/src/runner.ts`:
```typescript
export interface TypeScriptWorkerJobOwnershipConfig {
  lifecycleOwner: "typescript" | "go" | "unspecified"
  workerPurpose: "normal" | "rollback" | "test" | "parity"
}
export class TypeScriptWorkerOwnershipError extends Error
export const createTypeScriptWorkerJobOwnershipConfig: (
  env?: Record<string, string | undefined>,
) => TypeScriptWorkerJobOwnershipConfig
export const assertTypeScriptWorkerJobOwnershipAllowed: (
  config: TypeScriptWorkerJobOwnershipConfig,
) => void
export const runWorkerOnce: (
  pool: Pool,
  options: WorkerRunnerOptions,
  dependencies?: WorkerRunnerDependencies,
) => Promise<"completed" | "failed_system" | "idle">
export const runWorkerLoop: (
  pool: Pool,
  options: WorkerRunnerOptions,
  dependencies?: WorkerRunnerDependencies,
) => Promise<void>
```

From `packages/persistence/src/index.ts`, the current root exports include lifecycle modules that Phase 106 must remove from normal reachability:
```typescript
export * from "./matchset-service.js"
export * from "./chronicle-store.js"
export * from "./jobs.js"
export * from "./complete-match.js"
export * from "./scoring.js"
export * from "./matchset-status.js"
export * from "./competition.js"
```

From `packages/persistence/package.json`, explicit package subpaths already exist and should be extended rather than broadening the root:
```json
"exports": {
  ".": "./src/index.ts",
  "./competition": "./src/competition.ts",
  "./db": "./src/db.ts",
  "./repositories": "./src/repositories.ts"
}
```

From `packages/persistence/src/competition.ts`, selected-normal hazards to quarantine are:
```typescript
export const createManualExhibitionMatchSet = async (...) => { ... }
export const buildPublicMatchSetResultDto = async (pool, matchSetId) => {
  await refreshMatchSetStatus(pool, matchSetId)
  ...
}
```

From `packages/service/src/index.ts`, the local service currently composes DB-backed TypeScript persistence:
```typescript
export const createCowardsLocalService = (options: CreateCowardsLocalServiceOptions): CowardsService => { ... }
```
</interfaces>
</context>

<source_audit>
## Multi-Source Coverage Audit

| Source | ID | Feature / Requirement | Plan | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| GOAL | - | Developers can verify TypeScript DB-owning worker and persistence lifecycle code cannot act as the normal backend after v1.15. | 106-PLAN Task 1, Task 2, Task 3 | COVERED | Worker runtime guard, export quarantine, service labels, monitors, artifacts. |
| REQ | QUAR-01 | `apps/worker` is no longer a normal backend worker entrypoint and can run only as explicit rollback, parity, or test infrastructure. | Task 1 | COVERED | Entrypoint guard before pool creation, tests, startup label. |
| REQ | QUAR-02 | TypeScript job claim, lease, retry, failure, Match completion, Chronicle persistence, and MatchSet scoring modules are no longer exported or reachable as normal runtime backend paths. | Task 2, Task 3 | COVERED | Root export contraction, quarantine subpath, monitor forbidden import checks. |
| REQ | QUAR-03 | TypeScript MatchSet creation services for selected normal exhibition flows are deleted, quarantined, or relabeled rollback/deferred/test-only. | Task 2, Task 3 | COVERED | `createManualExhibitionMatchSet` quarantined; selected exhibition remains Go-only. |
| REQ | QUAR-04 | TypeScript public DTO reads no longer lazily refresh Go-owned MatchSet scoring/status in selected normal public evidence paths. | Task 2, Task 3 | COVERED | Lazy refresh labeled non-normal; selected public adapters/replay tests prove Go path. |
| REQ | QUAR-05 | `@cowards/service` is parity oracle, fixture generator, rollback reference, or deferred support rather than normal backend for selected routes. | Task 2, Task 3 | COVERED | Role metadata, tests, monitors against selected route construction. |
| REQ | QUAR-06 | Tests prove normal TypeScript job ownership remains blocked unless worker purpose is rollback, test, or parity. | Task 1 | COVERED | Existing worker test inverted and expanded. |
| REQ | QUAR-07 | Rollback documentation prevents mixed Go and TypeScript DB claim/completion owners and covers queued/running/expired/retry/incomplete/public evidence states. | Task 3 | COVERED | JSON/markdown rollback artifact and monitor validation. |
| RESEARCH | - | Add `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback|test|parity` guard at executable entrypoint before `createDatabasePool()`. | Task 1 | COVERED | Implements primary research recommendation. |
| RESEARCH | - | Retire `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` as normal ownership; retained TypeScript owner means rollback context only. | Task 1 | COVERED | Guard rejects normal TypeScript lifecycle owner. |
| RESEARCH | - | Remove lifecycle exports from `@cowards/persistence` root or route them through explicit quarantine subpath. | Task 2 | COVERED | Plan chooses explicit `@cowards/persistence/quarantine-lifecycle`. |
| RESEARCH | - | Split or gate `competition.ts` selected-normal hazards: exhibition creation and lazy MatchSet result refresh. | Task 2 | COVERED | Quarantine labels and selected-mode tests. |
| RESEARCH | - | Label `@cowards/service` as parity/fixture/rollback/deferred and block selected adapters from constructing it. | Task 2, Task 3 | COVERED | Role metadata plus monitor and tests. |
| RESEARCH | - | Extend boundary monitors, service-boundary imports, and TypeScript backend inventory after quarantine. | Task 3 | COVERED | Monitor and artifact updates included. |
| RESEARCH | - | Write worker quarantine rollback artifact covering job states and public evidence behavior. | Task 3 | COVERED | `.planning/artifacts/v1.16-typescript-worker-quarantine.{json,md}`. |
| CONTEXT | D-01 | `apps/worker` must be non-normal by default after v1.16. | Task 1 | COVERED | Default normal purpose rejected. |
| CONTEXT | D-02 | Worker may remain only rollback-only, parity-only, or test-only. | Task 1 | COVERED | Allowed purposes are exactly rollback/test/parity. |
| CONTEXT | D-03 | Executable worker entrypoint refuses unless explicit non-normal purpose flag is set. | Task 1 | COVERED | Guard runs before DB pool creation. |
| CONTEXT | D-04 | Remove/quarantine idea that TS lifecycle owner makes worker a normal owner. | Task 1 | COVERED | Normal TypeScript owner test expects throw. |
| CONTEXT | D-05 | Retained TS lifecycle-owner path means explicit rollback mode with docs and no concurrent Go owner. | Task 1, Task 3 | COVERED | Rollback purpose allowed; artifact states single-owner procedure. |
| CONTEXT | D-06 | Normal local/product topology must not allow mixed Go and TS DB job claim/completion owners. | Task 3 | COVERED | No-mixed-owner artifact and monitor checks. |
| CONTEXT | D-07 | Job claim, lease, retry, Match completion, Chronicle persistence, MatchSet scoring refresh, and MatchSet creation removed from normal exports or explicitly quarantined. | Task 2 | COVERED | Root export contraction and quarantine subpath. |
| CONTEXT | D-08 | Selected normal runtime paths must not import quarantined lifecycle modules. | Task 3 | COVERED | Monitor checks selected route files and strict migrated files. |
| CONTEXT | D-09 | Tests, parity fixtures, rollback scripts, deferred paths may import quarantined modules only through explicit gates and labels. | Task 2, Task 3 | COVERED | Quarantine subpath and inventory labels. |
| CONTEXT | D-10 | `@cowards/service` only parity oracle, fixture generator, rollback reference, or deferred support. | Task 2 | COVERED | Service role metadata and tests. |
| CONTEXT | D-11 | `@cowards/service` must not be selected normal backend for Phase 105 routes. | Task 2, Task 3 | COVERED | Selected route monitor prohibits construction/import fallback. |
| CONTEXT | D-12 | Preserve rollback clarity if rollback remains possible. | Task 3 | COVERED | Rollback artifact. |
| CONTEXT | D-13 | Rollback docs describe single-owner procedure for queued jobs, running jobs, expired leases, retries, incomplete MatchSets, scoring/public evidence, and avoiding mixed owners. | Task 3 | COVERED | Required fields in artifact and monitor. |
| CONTEXT | D-14 | Keep focused tests for quarantined paths where useful. | Task 1, Task 2, Task 3 | COVERED | Worker, competition, service, adapter, monitor tests. |
| CONTEXT | D-15 | Tests assert guards block normal TypeScript job ownership and allow only explicit rollback/test/parity. | Task 1 | COVERED | Direct unit tests. |
| CONTEXT | Deferred | Removing all TypeScript persistence code. | NONE | EXCLUDED | Explicit deferred idea; no task deletes all TS persistence. |
| CONTEXT | Deferred | Go-owned migrations/schema ownership. | NONE | EXCLUDED | Explicit deferred idea. |
| CONTEXT | Deferred | Migrating deferred Workshop/ladders/governance paths. | NONE | EXCLUDED | Explicit deferred idea; only labels/monitors may mention them. |
</source_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Guard the TypeScript worker entrypoint and retire normal TypeScript lifecycle ownership</name>
  <files>apps/worker/src/index.ts, apps/worker/src/runner.ts, apps/worker/src/runner.test.ts, apps/worker/package.json</files>
  <behavior>
    - RED first: `assertTypeScriptWorkerJobOwnershipAllowed({ lifecycleOwner: "typescript", workerPurpose: "normal" })` throws `TypeScriptWorkerOwnershipError`, per D-01 and D-04.
    - RED first: unset purpose, unknown purpose, `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript`, and `COWARDS_BACKEND_OWNER=typescript` all resolve or fail in a way that cannot start normal job ownership, per D-03 through D-06.
    - RED first: `rollback`, `test`, and `parity` purposes are the only allowed TypeScript worker purposes, regardless of lifecycle owner metadata, per D-02, D-05, D-14, and D-15.
    - RED first: executable entrypoint guard is testable without opening a DB pool; when purpose is missing/normal, pool creation and `runWorkerLoop` are not called, per D-03.
    - RED first: startup log labels the worker as rollback/test/parity infrastructure and does not print language implying normal backend ownership, per D-01 and D-02.
  </behavior>
  <action>Create a reusable entrypoint guard in `runner.ts`, such as `assertTypeScriptWorkerEntrypointAllowed(env)` or a clearly named equivalent, that calls `createTypeScriptWorkerJobOwnershipConfig` and rejects any `workerPurpose` outside `rollback`, `test`, or `parity`. Change `assertTypeScriptWorkerJobOwnershipAllowed` so `lifecycleOwner: "typescript"` never grants normal ownership; the error message must say TypeScript Match job claiming is disabled for normal backend ownership and requires explicit rollback, test, or parity purpose. Update `apps/worker/src/index.ts` to run the guard before `createDatabasePool()` and before runtime loop startup. Pass the resolved `jobOwnership` into `runWorkerLoop` so loop iterations use the same non-normal purpose. Update package script naming or description only if needed to make the command obviously non-normal; do not add a normal worker command. Keep existing system-failure versus strategy-failure worker behavior intact. This implements QUAR-01 and QUAR-06 per D-01 through D-06, D-14, and D-15.</action>
  <verify>
    <automated>pnpm exec vitest run apps/worker/src/runner.test.ts</automated>
    <automated>pnpm --filter @cowards/worker typecheck</automated>
    <automated>rg -n "allows normal TypeScript job ownership|explicitly selected as lifecycle owner" apps/worker/src/runner.test.ts apps/worker/src/runner.ts | grep -v '^#' | wc -l | tr -d ' ' | grep -q '^0$'</automated>
  </verify>
  <done>`apps/worker` cannot start or claim jobs as a normal backend. Tests prove normal TypeScript lifecycle ownership is blocked, and rollback/test/parity purposes remain explicitly allowed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Quarantine lifecycle persistence exports, selected exhibition creation, public DTO refresh, and service roles</name>
  <files>packages/persistence/src/index.ts, packages/persistence/package.json, packages/persistence/src/quarantine-lifecycle.ts, packages/persistence/src/jobs.ts, packages/persistence/src/complete-match.ts, packages/persistence/src/matchset-status.ts, packages/persistence/src/matchset-service.ts, packages/persistence/src/competition.ts, packages/persistence/src/competition.test.ts, packages/service/src/index.ts, packages/service/src/service.test.ts, apps/worker/src/runner.ts, apps/worker/src/runner.test.ts, apps/web/lib/account-service-adapter.test.ts, apps/web/lib/public-service-adapter.test.ts, apps/web/app/matches/server.test.ts</files>
  <behavior>
    - RED first: importing from `@cowards/persistence` root no longer exposes job claim, lease, retry/failure, `completeMatch`, Chronicle handoff, `refreshMatchSetStatus`, MatchSet scoring, `createMatchSetService`, or selected exhibition creation exports, per D-07.
    - RED first: rollback/test/parity worker code imports job lifecycle functions only through an explicit quarantine subpath such as `@cowards/persistence/quarantine-lifecycle`, per D-07 and D-09.
    - RED first: selected normal exhibition route tests prove `createManualExhibitionMatchSet` is not called when Go selected route mode is active, per QUAR-03 and D-08.
    - RED first: selected public MatchSet/replay tests prove `refreshMatchSetStatus` and `buildPublicMatchSetResultDto` are not called in selected normal public evidence paths, per QUAR-04 and D-08.
    - RED first: `@cowards/service` exposes inspectable role metadata identifying it as parity oracle, fixture generator, rollback reference, or deferred support, and adapter tests prove selected normal Phase 105 routes do not construct it, per D-10 and D-11.
  </behavior>
  <action>Contract the normal persistence root export. Remove lifecycle owner exports from `packages/persistence/src/index.ts`: `jobs`, `complete-match`, `matchset-status`, lifecycle-facing `matchset-service`, selected exhibition creation, and any scoring refresh export that normal code could use to refresh Go-owned state. Add `packages/persistence/src/quarantine-lifecycle.ts` and a package export subpath such as `@cowards/persistence/quarantine-lifecycle` that re-exports the retained rollback/parity/test lifecycle functions with source comments and exported metadata naming allowed purposes. Update `apps/worker/src/runner.ts` to import claim/completion/failure functions from the quarantine subpath, not the root package. In `competition.ts`, keep validation/pure helpers available only where needed, but quarantine or label `createManualExhibitionMatchSet` and `buildPublicMatchSetResultDto` as non-normal; selected normal exhibition/public paths must not call them when Go/no-TypeScript-backend mode is selected. Add targeted tests rather than broad deletion: service role metadata tests, selected adapter no-construction tests, selected replay no-refresh tests, and package export boundary tests. This implements QUAR-02 through QUAR-05 per D-07 through D-11. Do not remove TypeScript persistence needed for deferred Workshop, ladder, governance, owner-debug/private replay, tests, fixtures, or rollback references.</action>
  <verify>
    <automated>pnpm exec vitest run apps/worker/src/runner.test.ts packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts</automated>
    <automated>pnpm --filter @cowards/persistence typecheck</automated>
    <automated>pnpm --filter @cowards/service typecheck</automated>
    <automated>pnpm exec tsx -e "const m = await import('@cowards/persistence'); for (const k of ['claimNextMatchJob','completeMatch','recordAttemptFailure','refreshMatchSetStatus','createMatchSetService','createManualExhibitionMatchSet']) if (k in m) throw new Error('normal persistence root exports quarantined lifecycle symbol '+k)"</automated>
    <automated>rg -n "@cowards/persistence[^/]|@cowards/persistence/(jobs|complete-match|matchset-status|matchset-service)" apps/worker/src/runner.ts | grep -v '^#' | wc -l | tr -d ' ' | grep -q '^0$'</automated>
  </verify>
  <done>Normal package exports no longer expose TypeScript lifecycle ownership functions; retained lifecycle code is imported through explicit quarantine paths only. Selected normal exhibition/public evidence tests prove no TypeScript MatchSet creation, lazy scoring refresh, or local `@cowards/service` backend fallback is used.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add quarantine monitors, rollback artifacts, inventory refresh, and validation evidence</name>
  <files>scripts/check-boundary-monitors.ts, scripts/check-boundary-monitors.test.ts, scripts/check-service-boundary-imports.ts, scripts/generate-typescript-backend-inventory.ts, scripts/generate-typescript-backend-inventory.test.ts, .planning/artifacts/v1.16-typescript-backend-inventory.json, .planning/artifacts/v1.16-typescript-backend-inventory.md, .planning/artifacts/v1.16-typescript-worker-quarantine.json, .planning/artifacts/v1.16-typescript-worker-quarantine.md, .planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md</files>
  <behavior>
    - RED first: boundary monitor fails if `apps/worker/src/index.ts` can start without explicit rollback/test/parity purpose or if `runner.ts` accepts normal TypeScript lifecycle ownership, per QUAR-01 and QUAR-06.
    - RED first: boundary monitor fails if selected normal route/page/adapters import the quarantine lifecycle subpath, `@cowards/service`, direct lifecycle persistence modules, or TypeScript lazy public DTO refresh paths, per QUAR-02 through QUAR-05.
    - RED first: inventory marks worker, lifecycle modules, MatchSet creation, local service, and lazy public DTO refresh as rollback-only, parity-only, test-only, deferred, fixture-only, or quarantined; no normal TypeScript backend role appears, per D-07 through D-11.
    - RED first: `v1.16-typescript-worker-quarantine.json` validates required rollback states: queued jobs, running jobs, expired leases, retries, exhausted failures, incomplete MatchSets, scoring/public evidence, stopped Go, stopped runtime service, and no mixed Go plus TypeScript completion owners, per QUAR-07 and D-12 through D-13.
    - RED first: monitor public payload validation rejects Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, stack, stderr, session, token, DB DSN, host path, and private runtime internals in the new artifacts, per AGENTS.md and Phase 106 rollback clarity.
  </behavior>
  <action>Extend `scripts/check-boundary-monitors.ts` and tests with a Phase 106 worker/persistence quarantine lane. Validate worker guard source tokens, selected-normal forbidden import reachability, normal persistence root export absence, quarantine subpath import allowlist, service non-normal role metadata, selected public DTO no lazy refresh in selected paths, and no mixed DB owners. Extend `scripts/check-service-boundary-imports.ts` so quarantine lifecycle imports are allowed only in worker rollback/test/parity files, tests, fixture generators, parity scripts, rollback scripts, or explicitly deferred files; selected normal web/API and strict migrated files must fail if they import quarantine lifecycle modules. Update `scripts/generate-typescript-backend-inventory.ts` and its tests so Phase 106 labels are reflected in generated artifacts and stale-output checking. Create `.planning/artifacts/v1.16-typescript-worker-quarantine.json` and `.md` with rollback/deviation notes: single-owner rollback procedure, stop Go job claimant/completer first, verify no running Go owner, handle queued jobs, running jobs, expired leases, retries, exhausted failures, incomplete MatchSets, scoring/public evidence behavior, restart order, return-to-Go order, and deviations requiring explicit documentation. Regenerate inventory artifacts after source changes. Record validation commands, results, residual risks, and any deviations in `106-VALIDATION.md`. This implements QUAR-02, QUAR-05, and QUAR-07 and closes monitor coverage for QUAR-01 through QUAR-06.</action>
  <verify>
    <automated>pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts</automated>
    <automated>pnpm boundary:imports</automated>
    <automated>pnpm typescript-backend:inventory</automated>
    <automated>pnpm typescript-backend:inventory:check</automated>
    <automated>pnpm boundary:monitors</automated>
    <automated>node -e "const fs=require('node:fs'); const a=JSON.parse(fs.readFileSync('.planning/artifacts/v1.16-typescript-worker-quarantine.json','utf8')); const req=['queued_jobs','running_jobs','expired_leases','retries','exhausted_failures','incomplete_matchsets','scoring_public_evidence']; for (const k of req) if (!JSON.stringify(a).includes(k)) throw new Error('missing rollback state '+k); if (a.globalPolicies?.mixedGoAndTypeScriptOwnersAllowed !== false) throw new Error('mixed owners must be false')"</automated>
  </verify>
  <done>Boundary monitors and inventory checks enforce Phase 106 quarantine. Rollback artifacts document single-owner TypeScript rollback without mixed Go/TypeScript claim or completion owners, and validation notes show focused tests plus full monitor gates.</done>
</task>

</tasks>

<dependency_graph>
## Tasks

| Task | Needs | Creates | Checkpoint |
| --- | --- | --- | --- |
| Task 1 | Existing worker guard/tests from Phase 104 runtime boundary and v1.15 Go ownership baseline | Non-normal worker guard and tests | no |
| Task 2 | Task 1 guard semantics for worker imports; Phase 105 selected route tests | Quarantine export boundary, selected-normal no-refresh/service labels | no |
| Task 3 | Task 1 and Task 2 implementation symbols and labels | Monitor lane, rollback artifacts, regenerated inventory, validation evidence | no |

## Wave

Single wave, single plan. Tasks are sequential because `runner.ts`, monitor labels, and inventory artifacts depend on the final quarantine import/export shape.
</dependency_graph>

<rollback_deviation_notes>
## Required Rollback Documentation Content

The executor must create `.planning/artifacts/v1.16-typescript-worker-quarantine.md` and `.json` with these concrete notes:

1. TypeScript worker rollback is single-owner only: stop Go job claimant/completer and verify no Go owner is running before starting TypeScript rollback worker.
2. `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback` is mandatory for rollback worker startup; `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` alone is not sufficient.
3. Queued jobs: TypeScript rollback worker may claim only after Go owner is stopped.
4. Running jobs: document how to wait for Go completion or let leases expire before rollback claim.
5. Expired leases: rollback may reclaim only after lease expiry and single-owner verification.
6. Retries/exhausted failures: retain existing retry/failure classification and do not convert strategy failure into system failure.
7. Incomplete MatchSets: scoring/public evidence remains Go-owned during normal operation; rollback scoring requires explicit operator decision and artifact note.
8. Public evidence: selected normal public evidence remains Go-owned; TypeScript evidence paths are parity/rollback/deferred and must not silently serve selected public routes.
9. Return-to-Go: stop TypeScript rollback worker, verify no TypeScript claims are running, then start Go owner.
10. Deviations: any mixed-owner exception is disallowed; if an executor finds an unavoidable conflict, stop and record it as a blocker instead of implementing mixed ownership.
</rollback_deviation_notes>

<threat_model>
## Trust Boundaries

| Boundary | Description |
| --- | --- |
| operator env -> TypeScript worker process | Environment flags decide whether a DB-owning TypeScript worker may start. |
| TypeScript worker -> PostgreSQL lifecycle tables | Quarantined code can claim jobs, complete Matches, persist Chronicle data, update retries, and affect MatchSet state if allowed. |
| selected web/API -> Go backend | Selected normal routes must not fall back to TypeScript DB/service behavior when Go is selected or stopped. |
| public DTO/replay output -> user | Public output must not leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, sessions, tokens, DB DSNs, host paths, stack, stderr, or private runtime internals. |
| rollback operator -> normal topology | Rollback must not create concurrent Go and TypeScript DB claim/completion owners. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- |
| T-106-01 | Tampering | `apps/worker/src/index.ts` / `runner.ts` | mitigate | Reject normal TypeScript lifecycle ownership and require explicit rollback/test/parity purpose before DB pool creation. |
| T-106-02 | Denial of Service | Go and TypeScript job owners | mitigate | Rollback artifact and monitor enforce `mixedGoAndTypeScriptOwnersAllowed=false`; normal topology cannot run mixed DB claim/completion owners. |
| T-106-03 | Elevation of Privilege | test-support or worker routes | mitigate | Quarantine imports allowed only for test/parity/rollback/deferred files; selected normal files fail monitor checks. |
| T-106-04 | Information Disclosure | public DTO/replay fallback | mitigate | Selected public routes remain Go-only; monitors/tests block TypeScript lazy refresh and local service fallback; public artifact payloads pass denylist checks. |
| T-106-05 | Spoofing | `@cowards/service` role | mitigate | Add inspectable service role metadata and tests labeling service as parity/fixture/rollback/deferred, not normal backend. |
| T-106-06 | Repudiation | rollback procedure | mitigate | JSON/markdown artifact records required rollback states, single-owner procedure, validation commands, and deviations. |
</threat_model>

<verification>
## Required Validation Commands

Run these during execution and record results in `106-VALIDATION.md`:

1. `pnpm exec vitest run apps/worker/src/runner.test.ts`
2. `pnpm exec vitest run packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts`
3. `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts`
4. `pnpm --filter @cowards/worker typecheck`
5. `pnpm --filter @cowards/persistence typecheck`
6. `pnpm --filter @cowards/service typecheck`
7. `pnpm boundary:imports`
8. `pnpm typescript-backend:inventory`
9. `pnpm typescript-backend:inventory:check`
10. `pnpm boundary:monitors`
11. `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`

If `pnpm boundary:monitors` fails only because live local web/Go/runtime services are not running, do not mark Phase 106 complete until the non-live Phase 106 monitor checks pass and the validation notes record the live-service prerequisite. If source changes affect Match/replay creation behavior rather than only quarantine/reachability, also run `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop replay.visual.spec.ts` and record board realism evidence.
</verification>

<success_criteria>
- QUAR-01 through QUAR-07 are implemented and traced in tests, monitors, and artifacts.
- `apps/worker` refuses normal startup and normal TypeScript lifecycle ownership.
- Retained TypeScript lifecycle persistence code is reachable only through an explicit quarantine boundary and allowed non-normal labels.
- Selected normal exhibition, public MatchSet summary, public replay metadata, and public replay evidence paths do not use TypeScript MatchSet creation, lazy scoring refresh, Chronicle public fallback, or `@cowards/service` as backend.
- `@cowards/service` is inspectably non-normal for selected routes.
- Boundary monitors and TypeScript backend inventory artifacts are synchronized with Phase 106 quarantine labels.
- Rollback artifact documents single-owner TypeScript rollback and rejects mixed Go plus TypeScript DB claim/completion owners.
</success_criteria>

<output>
After completion, create `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-SUMMARY.md` and `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md`.
</output>
