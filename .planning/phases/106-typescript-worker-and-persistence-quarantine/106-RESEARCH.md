# Phase 106: TypeScript Worker and Persistence Quarantine - Research

**Researched:** 2026-05-24 [VERIFIED: environment current_date]
**Domain:** TypeScript DB-owning worker, job lifecycle, Match completion, Chronicle persistence, MatchSet scoring/status refresh, MatchSet creation, service fallback quarantine [VERIFIED: .planning/REQUIREMENTS.md]
**Confidence:** HIGH for repo-local inventory and likely files; MEDIUM for final deletion versus quarantine names until planner chooses exact module layout. [VERIFIED: code inspection]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Worker Entrypoint
- **D-01:** `apps/worker` must be non-normal by default after v1.16.
- **D-02:** The worker may remain only as `rollback-only`, `parity-only`, or `test-only` infrastructure.
- **D-03:** The executable worker entrypoint should refuse to run unless an explicit non-normal purpose flag is set.

### Lifecycle Ownership
- **D-04:** Remove or quarantine the idea that `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` makes the TypeScript worker a normal lifecycle owner.
- **D-05:** If a TypeScript lifecycle-owner path is retained, it must mean explicit rollback mode with rollback documentation and no concurrent Go owner.
- **D-06:** Normal local/product topology must not allow mixed Go and TypeScript DB job claim/completion owners.

### Persistence Lifecycle Exports
- **D-07:** TypeScript job claim, lease, retry, Match completion, Chronicle persistence, MatchSet scoring refresh, and MatchSet creation functions must be removed from normal package exports or explicitly quarantined.
- **D-08:** Selected normal runtime paths must not import quarantined lifecycle modules.
- **D-09:** Tests, parity fixtures, rollback scripts, or deferred paths may import quarantined modules only through explicit gates and labels.

### `@cowards/service`
- **D-10:** Treat `@cowards/service` only as parity oracle, fixture generator, rollback reference, or deferred support.
- **D-11:** `@cowards/service` must not be the selected normal backend for the Phase 105 route set.

### Rollback Clarity
- **D-12:** Preserve rollback clarity if rollback remains possible.
- **D-13:** Rollback documentation must describe single-owner procedure for queued jobs, running jobs, expired leases, retries, incomplete MatchSets, scoring/public evidence, and avoiding mixed Go+TypeScript completion owners.

### Test Policy
- **D-14:** Keep focused tests for quarantined paths where useful.
- **D-15:** Tests must assert guards block normal TypeScript job ownership and allow only explicit rollback, test, or parity purposes.

### the agent's Discretion
The agent may choose exact quarantine folder/module names, export boundaries, guard env vars, and rollback artifact format, provided normal runtime cannot reach TypeScript worker/persistence lifecycle ownership after this phase.

### Deferred Ideas (OUT OF SCOPE)

- Removing all TypeScript persistence code.
- Go-owned migrations/schema ownership.
- Migrating deferred Workshop/ladders/governance paths that still use persistence modules.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAR-01 | Developer can verify `apps/worker` is no longer a normal backend worker entrypoint and can run only as explicit rollback, parity, or test infrastructure. [VERIFIED: .planning/REQUIREMENTS.md] | Worker entrypoint currently starts `runWorkerLoop` directly and must be guarded before pool creation or loop start. [VERIFIED: apps/worker/src/index.ts] |
| QUAR-02 | Developer can verify TypeScript job claim, lease, retry, failure, Match completion, Chronicle persistence, and MatchSet scoring modules are no longer exported or reachable as normal runtime backend paths. [VERIFIED: .planning/REQUIREMENTS.md] | Broad `packages/persistence/src/index.ts` re-exports `jobs`, `complete-match`, `scoring`, and `matchset-status`; `apps/worker/src/runner.ts` imports claim/completion/failure from the broad package root. [VERIFIED: packages/persistence/src/index.ts; apps/worker/src/runner.ts] |
| QUAR-03 | Developer can verify TypeScript MatchSet creation services for selected normal exhibition flows are deleted, quarantined, or relabeled as rollback/deferred/test-only. [VERIFIED: .planning/REQUIREMENTS.md] | `createManualExhibitionMatchSet` still creates MatchSets, Matches, and queued jobs through TypeScript persistence, while Phase 105 selected `/api/exhibitions` routes call Go. [VERIFIED: packages/persistence/src/competition.ts; .planning/artifacts/v1.16-selected-go-route-manifest.json] |
| QUAR-04 | Developer can verify TypeScript public DTO reads no longer lazily refresh Go-owned MatchSet scoring/status in selected normal public evidence paths. [VERIFIED: .planning/REQUIREMENTS.md] | `buildPublicMatchSetResultDto` calls `refreshMatchSetStatus` before reading public DTO data; this is the exact lazy refresh path to quarantine away from selected normal reads. [VERIFIED: packages/persistence/src/competition.ts] |
| QUAR-05 | Developer can verify `@cowards/service` is treated as parity oracle, fixture generator, rollback reference, or deferred support rather than the normal backend for selected routes. [VERIFIED: .planning/REQUIREMENTS.md] | `@cowards/service` constructs a local DB-backed service from persistence modules; Phase 105 selected public/account adapters now require Go when selected. [VERIFIED: packages/service/src/index.ts; apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts] |
| QUAR-06 | Developer can run tests proving normal TypeScript job ownership remains blocked unless the worker purpose is explicitly rollback, test, or parity. [VERIFIED: .planning/REQUIREMENTS.md] | Existing worker tests currently allow normal TypeScript ownership when `lifecycleOwner === "typescript"`, which Phase 106 must invert or relabel to rollback-only. [VERIFIED: apps/worker/src/runner.test.ts; apps/worker/src/runner.ts] |
| QUAR-07 | Developer can inspect rollback documentation that prevents mixed Go and TypeScript DB claim/completion owners and describes queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior. [VERIFIED: .planning/REQUIREMENTS.md] | v1.15 failure-drill and promotion artifacts already define stop-Go, switch-owner, start-TypeScript-rollback-worker ordering and the covered job states. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json; .planning/artifacts/v1.15-promotion-decision.md] |
</phase_requirements>

## Summary

Phase 106 should make the existing TypeScript worker and persistence lifecycle code non-normal by construction, not just by label. [VERIFIED: .planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md] The current worker guard blocks Go or unspecified normal ownership, but still allows `workerPurpose: "normal"` when `lifecycleOwner: "typescript"`, and the executable worker entrypoint starts `runWorkerLoop` without an entrypoint-level non-normal purpose check. [VERIFIED: apps/worker/src/runner.ts; apps/worker/src/index.ts]

The highest-risk code is concentrated in a small set of files: `apps/worker/src/index.ts`, `apps/worker/src/runner.ts`, `packages/persistence/src/index.ts`, `packages/persistence/src/jobs.ts`, `packages/persistence/src/complete-match.ts`, `packages/persistence/src/matchset-status.ts`, `packages/persistence/src/matchset-service.ts`, `packages/persistence/src/competition.ts`, `packages/service/src/index.ts`, `apps/web/lib/account-service-adapter.ts`, `apps/web/lib/public-service-adapter.ts`, and `apps/web/app/matches/server.ts`. [VERIFIED: code inspection via rg and file reads] These files cover DB job claiming, lease/retry/failure, Match completion, Chronicle persistence, MatchSet scoring refresh, selected exhibition creation, lazy public DTO scoring refresh, local service fallback, and public/private replay branching. [VERIFIED: code inspection]

**Primary recommendation:** Add an explicit `quarantined` lifecycle boundary with failing tests first: worker entrypoint must require `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback|test|parity`, `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` must no longer grant normal ownership, lifecycle functions must leave the broad persistence export surface, and monitors must fail if selected normal code imports quarantined job/completion/scoring/MatchSet creation paths. [VERIFIED: .planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md; code inspection]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Worker tests must distinguish strategy failure from system failure. [VERIFIED: AGENTS.md]
- Replay or Match creation changes must include board realism checks when they affect replay or Match creation behavior. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Normal Match job claim, lease, retry, and failure | Go backend | PostgreSQL | v1.15 promoted Go job lifecycle ownership, and Go has `job_lifecycle.go` with claim/retry/failure SQL. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json; apps/go-backend/job_lifecycle.go] |
| Normal Match completion and Chronicle persistence | Go backend | PostgreSQL | v1.15 promoted Go completion and Chronicle persistence, and Go `completion.go` persists Chronicle plus Match/job updates transactionally. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md; apps/go-backend/completion.go] |
| Normal MatchSet scoring/status refresh | Go backend | PostgreSQL | v1.15 promoted Go scoring/status refresh, and Go refreshes MatchSet status from terminal completion and exhausted failure paths. [VERIFIED: .planning/milestones/v1.15-phases/100-go-matchset-scoring-and-failure-classification/100-SUMMARY.md; apps/go-backend/matchset_status.go] |
| Selected exhibition MatchSet creation | Go backend | Web frontend adapter | Phase 105 selected `POST /matchsets` and `/api/exhibitions` as Go-owned with no TypeScript fallback. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json] |
| TypeScript Strategy execution | Isolated TypeScript runtime service | Go backend client | Runtime service is explicitly runtime-only and disallowed from claiming jobs, completing Matches, persisting Chronicles, refreshing scoring, or serving product APIs. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.json] |
| Rollback/parity/test lifecycle reference | Quarantined TypeScript worker/persistence | PostgreSQL | Phase 106 context allows TypeScript worker/persistence only as rollback, parity, fixture, or test infrastructure. [VERIFIED: 106-CONTEXT.md] |
| Public replay and public DTO reads for selected routes | Go backend | Web frontend renderer | Phase 105 selected public MatchSet summary, replay metadata, and public replay evidence route families for Go-only reads. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Node.js | v24.15.0 installed | Runs TypeScript tooling, web app, worker tests, and scripts. [VERIFIED: `node --version`] | Use the project runtime already installed locally. [VERIFIED: environment audit] |
| pnpm | 11.1.2 installed and declared | Workspace package manager and script runner. [VERIFIED: `pnpm --version`; package.json] | Existing scripts use pnpm for tests, topology, monitors, and package filters. [VERIFIED: package.json] |
| TypeScript | 6.0.3 repo dependency | Type-checks TS packages and AST-based boundary tooling. [VERIFIED: package.json] | Existing inventory and boundary scripts are TypeScript/tsx based. [VERIFIED: scripts/generate-typescript-backend-inventory.ts; package.json] |
| Vitest | 4.1.6 repo dependency | Unit tests for worker, service, monitors, and inventory scripts. [VERIFIED: package.json] | Existing Phase 105 and worker tests use Vitest commands. [VERIFIED: 105-SUMMARY.md; apps/worker/src/runner.test.ts] |
| PostgreSQL client `pg` | 8.20.0 repo dependency | TypeScript persistence and worker DB access. [VERIFIED: packages/persistence/package.json; apps/worker/package.json] | Existing TS persistence modules use `Pool` from `pg`. [VERIFIED: packages/persistence/src/jobs.ts; apps/worker/src/runner.ts] |
| Go | go.mod target 1.25.0; installed go1.26.3 | Normal backend owner for lifecycle/completion/scoring and selected routes. [VERIFIED: apps/go-backend/go.mod; `go version`] | v1.15 and v1.16 decisions make Go the normal backend baseline. [VERIFIED: .planning/PROJECT.md; .planning/artifacts/v1.15-promotion-decision.md] |
| pgx | v5.9.2 | Go PostgreSQL access. [VERIFIED: apps/go-backend/go.mod] | Go lifecycle/completion/scoring files use `pgx`/`pgxpool`. [VERIFIED: apps/go-backend/job_lifecycle.go; apps/go-backend/completion.go] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `tsx` | workspace dependency via worker/dev tooling | Run TypeScript scripts and worker test-support process. [VERIFIED: apps/worker/package.json; apps/web/app/api/test-support/run-worker-once/route.ts] | Keep for test/parity scripts only; do not introduce normal worker ownership. [VERIFIED: 106-CONTEXT.md] |
| Redocly CLI | 2.31.4 | Service contract lint in boundary monitors. [VERIFIED: package.json] | Keep in `pnpm boundary:monitors`; Phase 106 should add monitor checks rather than a new framework. [VERIFIED: package.json; scripts/check-boundary-monitors.ts] |
| Playwright | 1.60.0 | Browser/e2e verification. [VERIFIED: package.json] | Use later if Phase 106 touches Match/replay creation behavior; quarantine-only work may rely on focused unit/monitor tests. [VERIFIED: AGENTS.md; package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Quarantining existing TS lifecycle modules | Delete all TS persistence lifecycle code immediately | Full deletion would break parity, rollback, demo, preflight, and deferred Workshop/ladder paths that still intentionally use TypeScript persistence. [VERIFIED: 106-CONTEXT.md; rg call graph] |
| Reusing inventory/monitor scripts | Add a new static analyzer | Existing scripts already scan TypeScript backend-like surfaces and boundary offenses; extending them avoids duplicated ownership logic. [VERIFIED: scripts/generate-typescript-backend-inventory.ts; scripts/check-boundary-monitors.ts] |
| Keeping `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` as normal | Rename it to explicit rollback semantics | Phase 106 decisions require removing or quarantining normal TypeScript lifecycle ownership, so any retained TypeScript owner path must mean rollback only. [VERIFIED: 106-CONTEXT.md] |

**Installation:** No new package installation is recommended. [VERIFIED: package.json; code inspection]

## Concrete Inventory

| Surface | Current Role / Risk | Recommended Phase 106 Action |
|---------|---------------------|------------------------------|
| `apps/worker/src/index.ts` | Process entrypoint logs worker readiness, creates a DB pool, and starts `runWorkerLoop` with no entrypoint-level purpose refusal. [VERIFIED: apps/worker/src/index.ts] | Add entrypoint guard before pool creation; require `rollback`, `test`, or `parity` purpose; update startup log to report non-normal purpose. [VERIFIED: 106-CONTEXT.md] |
| `apps/worker/src/runner.ts` | `assertTypeScriptWorkerJobOwnershipAllowed` currently allows normal TS ownership if `lifecycleOwner === "typescript"`. [VERIFIED: apps/worker/src/runner.ts] | Change normal TS owner to rejected; allow only explicit non-normal purposes; treat TS lifecycle owner as rollback-compatible metadata, not a normal grant. [VERIFIED: 106-CONTEXT.md] |
| `apps/worker/src/runner.test.ts` | Tests currently assert normal TS ownership is allowed when explicitly selected. [VERIFIED: apps/worker/src/runner.test.ts] | Flip this test to expect rejection and add explicit rollback/test/parity entrypoint coverage. [VERIFIED: 106-CONTEXT.md] |
| `packages/persistence/src/index.ts` | Broad root export re-exports `match-service`, `matchset-service`, `chronicle-store`, `jobs`, `complete-match`, `scoring`, `matchset-status`, and `competition`. [VERIFIED: packages/persistence/src/index.ts] | Remove lifecycle exports from root or route them through a quarantine-only subpath with import comments/tests; normal code should import narrow non-lifecycle modules only. [VERIFIED: 106-CONTEXT.md] |
| `packages/persistence/src/jobs.ts` | Implements TS claim, heartbeat, retry queueing, and exhausted system failure updates against `match_jobs` and `matches`. [VERIFIED: packages/persistence/src/jobs.ts] | Keep as rollback/parity/test-only; block broad-root re-export; add monitor forbidden import for selected normal paths. [VERIFIED: code inspection] |
| `packages/persistence/src/complete-match.ts` | Implements TS completion and Chronicle persistence handoff. [VERIFIED: packages/persistence/src/complete-match.ts] | Keep as rollback/parity/test-only; prevent selected normal imports; keep oracle tests if needed. [VERIFIED: v1.15 Phase 99 summary] |
| `packages/persistence/src/matchset-status.ts` | Implements TS scoring/status refresh and writes `match_sets.status`, `scoring`, `degraded`, and `completed_at`. [VERIFIED: packages/persistence/src/matchset-status.ts] | Keep as parity/test-only; do not let public DTO reads call it for selected normal routes. [VERIFIED: 106-CONTEXT.md] |
| `packages/persistence/src/matchset-service.ts` | Creates MatchSets, Matches, queued jobs, and MatchSet matrix rows. [VERIFIED: packages/persistence/src/matchset-service.ts] | Quarantine as rollback/deferred/test/fixture; selected exhibition creation must stay Go-only. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json] |
| `packages/persistence/src/competition.ts` | `createManualExhibitionMatchSet` creates selected exhibition-style MatchSets, and `buildPublicMatchSetResultDto` lazily refreshes scoring. [VERIFIED: packages/persistence/src/competition.ts] | Split or gate selected-normal-dangerous exports; keep DTO/reference code only as parity/deferred/rollback; add tests proving selected public reads do not call TS refresh. [VERIFIED: 106-CONTEXT.md] |
| `packages/service/src/index.ts` | `createCowardsLocalService` builds DB-backed DTO service from TypeScript persistence modules. [VERIFIED: packages/service/src/index.ts] | Label and test as parity/fixture/rollback/deferred; prevent selected normal adapters from constructing it under Go/no-TS topology. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts] |
| `apps/web/lib/account-service-adapter.ts` | Constructs local `@cowards/service` only when Go account/auth routes are not selected. [VERIFIED: apps/web/lib/account-service-adapter.ts] | Keep tests proving `COWARDS_GO_BACKEND_OWNER=go` and `COWARDS_NO_TYPESCRIPT_BACKEND=1` never construct local service. [VERIFIED: apps/web/lib/account-service-adapter.test.ts] |
| `apps/web/lib/public-service-adapter.ts` | Selected public reads require Go client and have no local `@cowards/service` fallback in this file. [VERIFIED: apps/web/lib/public-service-adapter.ts] | Add monitor coverage that this stays true for selected public route IDs. [VERIFIED: scripts/check-boundary-monitors.ts] |
| `apps/web/app/matches/server.ts` | Selected public replay metadata/evidence call Go; owner-debug/private Chronicle path can still use TS persistence. [VERIFIED: apps/web/app/matches/server.ts] | Preserve explicit owner-debug branch; add tests/labels so public selected path cannot fall through to TS Chronicle reads. [VERIFIED: 105-SUMMARY.md; apps/web/app/matches/server.ts] |
| `apps/web/app/api/test-support/run-worker-once/route.ts` | Test-support route spawns worker once only when Playwright or test env is enabled, with `workerPurpose: "test"`. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts] | Keep as test-only; monitor should fail if exposed to normal runtime or if purpose defaults to normal. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| `scripts/preflight.ts` and demo scripts | They call `runWorkerOnce` with `workerPurpose: "test"` or `parity`. [VERIFIED: scripts/preflight.ts; scripts/run-v1-5-advanced-demo.ts; scripts/run-v1-4-demo-tournament.ts] | Keep but classify as test/parity; avoid using these as normal topology evidence. [VERIFIED: 106-CONTEXT.md] |

## Recommended Quarantine Strategy

1. **Guard the executable first.** Add `assertTypeScriptWorkerEntrypointAllowed` or equivalent in `apps/worker/src/index.ts` before `createDatabasePool()`, and require `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback|test|parity`. [VERIFIED: apps/worker/src/index.ts; 106-CONTEXT.md]
2. **Retire normal TS lifecycle owner semantics.** Change `assertTypeScriptWorkerJobOwnershipAllowed` so `lifecycleOwner: "typescript", workerPurpose: "normal"` throws; retain TypeScript owner only as rollback context metadata. [VERIFIED: apps/worker/src/runner.ts; 106-CONTEXT.md]
3. **Create an explicit quarantine import boundary.** Remove lifecycle exports from `packages/persistence/src/index.ts`, or move them behind a named quarantine subpath such as `@cowards/persistence/quarantine-lifecycle` with tests that normal selected paths cannot import it. [VERIFIED: packages/persistence/src/index.ts; 106-CONTEXT.md]
4. **Split selected-dangerous persistence APIs from deferred APIs.** `competition.ts` mixes selected exhibition creation, public DTO assembly, and lazy scoring refresh; planner should either split into quarantine modules or add explicit guards around `createManualExhibitionMatchSet` and `buildPublicMatchSetResultDto` for selected/no-TS topology. [VERIFIED: packages/persistence/src/competition.ts]
5. **Make `@cowards/service` non-normal by contract.** Add service package tests or monitor checks asserting `createCowardsLocalService` is parity/fixture/rollback/deferred only and selected Go adapters do not construct it. [VERIFIED: packages/service/src/index.ts; apps/web/lib/account-service-adapter.test.ts]
6. **Extend monitors after code changes.** Update `scripts/check-boundary-monitors.ts`, `scripts/check-service-boundary-imports.ts`, and `scripts/generate-typescript-backend-inventory.ts` so the new quarantine path is allowed only for rollback/parity/test/deferred files and forbidden for selected normal routes. [VERIFIED: scripts/check-boundary-monitors.ts; scripts/check-service-boundary-imports.ts; scripts/generate-typescript-backend-inventory.ts]
7. **Write rollback artifact.** Add a source-safe `.planning/artifacts/v1.16-typescript-worker-quarantine.json` or markdown artifact that extends v1.15 rollback sequencing to queued jobs, running jobs, expired leases, retries, incomplete MatchSets, scoring, and public evidence. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json; 106-CONTEXT.md]

## Architecture Patterns

### System Architecture Diagram

```text
Selected normal product flow:

Web frontend route/page
  -> Go backend selected route
     -> PostgreSQL Match/MatchSet/job/Chronicle state
     -> isolated JS/TS runtime service for Strategy execution only
     -> Go completion/scoring/public evidence
  -> Web frontend renders public/source-safe DTOs

Quarantined TypeScript lifecycle flow:

Explicit operator/test/parity command
  -> worker purpose guard
     -> quarantined TS worker/persistence modules
        -> PostgreSQL lifecycle writes
     -> rollback/parity/test evidence only

Decision point:
  if purpose is normal or unspecified -> fail before job claim
  if selected normal web/API path imports quarantine -> monitor/test failure
```

### Recommended Project Structure

```text
apps/worker/src/
├── index.ts                 # entrypoint guard + non-normal startup only
├── runner.ts                # rollback/parity/test runner helper
└── runner.test.ts           # ownership guard and failure taxonomy tests

packages/persistence/src/
├── index.ts                 # normal-safe exports only
├── quarantine-lifecycle.ts  # optional explicit rollback/parity/test exports
├── jobs.ts                  # quarantined job lifecycle implementation
├── complete-match.ts        # quarantined completion/Chronicle implementation
├── matchset-status.ts       # parity/test scoring refresh implementation
├── matchset-service.ts      # deferred/rollback/test MatchSet creation
└── competition.ts           # split or gate selected-normal-dangerous exports

.planning/artifacts/
└── v1.16-typescript-worker-quarantine.{json,md}
```

### Pattern 1: Entrypoint Purpose Guard

**What:** Process startup fails before DB pool creation unless the worker declares a non-normal purpose. [VERIFIED: apps/worker/src/index.ts; 106-CONTEXT.md]

**When to use:** `apps/worker/src/index.ts`, test-support process scripts, and any future executable TS worker wrapper. [VERIFIED: rg runWorkerOnce/runWorkerLoop]

**Example:**

```typescript
// Source: apps/worker/src/runner.ts and Phase 106 context.
const ownership = createTypeScriptWorkerJobOwnershipConfig(process.env)
assertTypeScriptWorkerJobOwnershipAllowed(ownership)
// In Phase 106, lifecycleOwner: "typescript" + workerPurpose: "normal" should throw.
```

### Pattern 2: Quarantine Export Boundary

**What:** Normal package root exports stay free of DB lifecycle owners; rollback/parity/test code imports quarantined modules explicitly. [VERIFIED: packages/persistence/src/index.ts; 106-CONTEXT.md]

**When to use:** `packages/persistence/src/index.ts` and any worker/demo/test-support import. [VERIFIED: rg import results]

**Example:**

```typescript
// Source: packages/persistence/src/index.ts currently re-exports lifecycle modules.
// Phase 106 should remove broad exports such as:
// export * from "./jobs.js"
// export * from "./complete-match.js"
// export * from "./matchset-status.js"
```

### Pattern 3: Selected Route No-Fallback Test

**What:** Selected Go routes throw when Go is selected but not configured rather than constructing TypeScript local services. [VERIFIED: apps/web/lib/account-service-adapter.ts; apps/web/lib/public-service-adapter.ts]

**When to use:** Account, public read, public replay, and exhibition selected-route tests. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json]

**Example:**

```typescript
// Source: apps/web/lib/account-service-adapter.ts.
if (!goClient) {
  throw new Error("account revisions Go ownership requires COWARDS_GO_BACKEND_URL")
}
```

### Anti-Patterns to Avoid

- **Normal TS owner via env flag:** `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` must not mean normal backend ownership after Phase 106. [VERIFIED: 106-CONTEXT.md]
- **Broad root lifecycle exports:** Normal code can accidentally import quarantined lifecycle owners if `@cowards/persistence` exports them at root. [VERIFIED: packages/persistence/src/index.ts]
- **Lazy TS scoring refresh in public DTOs:** `buildPublicMatchSetResultDto` should not refresh selected normal MatchSet status through TypeScript. [VERIFIED: packages/persistence/src/competition.ts]
- **Mixed DB owners:** Go and TS completion workers must not claim or complete the same queue concurrently. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json]
- **Runtime-service backend creep:** Runtime service must not claim jobs, complete Matches, persist Chronicles, refresh scoring, or serve product APIs. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.json]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Source ownership inventory | A separate ad hoc grep script | Extend `scripts/generate-typescript-backend-inventory.ts` | It already emits v1.16 role taxonomy and stale checks for 183 surfaces. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json; scripts/generate-typescript-backend-inventory.ts] |
| Boundary enforcement | One-off CI command | Extend `scripts/check-boundary-monitors.ts` and `scripts/check-service-boundary-imports.ts` | These are already wired into `pnpm boundary:monitors` and `pnpm boundary:imports`. [VERIFIED: package.json] |
| Job lifecycle implementation | New TypeScript lifecycle owner | Use Go `job_lifecycle.go` for normal backend ownership | v1.15 promoted Go job lifecycle and Phase 106 requires TS worker non-normal. [VERIFIED: v1.15 promotion decision; 106-CONTEXT.md] |
| Match completion / Chronicle persistence | New TS completion wrapper | Use Go `completion.go` for normal completion | Go completion validates lease, Chronicle metadata, and writes in one transaction. [VERIFIED: apps/go-backend/completion.go] |
| MatchSet scoring refresh | New TS public read refresh | Use Go `matchset_status.go` for normal scoring/status | Go scoring/status is wired to terminal completion and failure paths. [VERIFIED: apps/go-backend/matchset_status.go; apps/go-backend/completion.go; apps/go-backend/job_lifecycle.go] |

**Key insight:** Phase 106 is a reachability and ownership problem, not a rules problem; the existing Go lifecycle owns normal writes, while TypeScript lifecycle code should survive only behind explicit rollback/parity/test/deferred gates. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md; 106-CONTEXT.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | PostgreSQL tables `match_jobs`, `match_job_attempts`, `matches`, `chronicles`, `match_sets`, `match_set_matches`, and `competition_entrants` are written by TS lifecycle/MatchSet paths and Go lifecycle/completion/scoring paths. [VERIFIED: packages/persistence/src/jobs.ts; packages/persistence/src/complete-match.ts; packages/persistence/src/matchset-service.ts; apps/go-backend/job_lifecycle.go; apps/go-backend/completion.go; apps/go-backend/matchset_status.go] | No schema migration is required for quarantine itself; rollback documentation must define single-owner handling for queued, running, expired, retry, incomplete, and public-evidence states. [VERIFIED: 106-CONTEXT.md; .planning/artifacts/v1.15-failure-drills.json] |
| Live service config | `COWARDS_MATCH_JOB_LIFECYCLE_OWNER`, `COWARDS_BACKEND_OWNER`, and `COWARDS_TYPESCRIPT_WORKER_PURPOSE` control current TS worker ownership parsing; selected Go/no-TS paths use `COWARDS_GO_BACKEND_OWNER`, `COWARDS_NO_TYPESCRIPT_BACKEND`, and route-specific Go flags. [VERIFIED: rg env vars] | Reinterpret or deprecate TS lifecycle owner as rollback-only, and document required `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback|test|parity`. [VERIFIED: 106-CONTEXT.md] |
| OS-registered state | No launchd plists, systemd units, pm2 ecosystem files, or Task Scheduler artifacts were found in the repo. [VERIFIED: `find . -name '*.plist' -o -name '*.service' -o -name 'ecosystem.config.*'`] | No repo-tracked OS registration update; operators should stop any externally registered `pnpm --filter @cowards/worker dev` process before rollback. [VERIFIED: scripts/dev-local-postgres.sh; .planning/artifacts/v1.15-promotion-decision.md] |
| Secrets/env vars | No secret files were inspected; repo references environment variable names but does not include secret values. [VERIFIED: rg env vars; git-tracked file inspection] | Update docs/artifacts only; do not rename secret keys unless planner selects an env var migration. [VERIFIED: 106-CONTEXT.md] |
| Build artifacts | `node_modules` exists locally and package scripts reference `tsx`/pnpm; no committed build artifact needs quarantine. [VERIFIED: filesystem find; package.json] | No build artifact migration; rerun typecheck/tests after export changes because TS references may break. [VERIFIED: package.json] |

## Common Pitfalls

### Pitfall 1: Guarding `runWorkerOnce` but not the executable worker
**What goes wrong:** `apps/worker/src/index.ts` can still create a DB pool and attempt the loop before the intended entrypoint policy is visible. [VERIFIED: apps/worker/src/index.ts]
**Why it happens:** Current guard is inside `runWorkerOnce`, while the entrypoint starts `runWorkerLoop` directly. [VERIFIED: apps/worker/src/runner.ts; apps/worker/src/index.ts]
**How to avoid:** Add an entrypoint-level purpose check and tests before pool creation. [VERIFIED: 106-CONTEXT.md]
**Warning signs:** `pnpm --filter @cowards/worker dev` starts with no purpose variable. [VERIFIED: apps/worker/package.json; scripts/check-local-topology.ts]

### Pitfall 2: Keeping normal TypeScript owner semantics
**What goes wrong:** `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` continues to act like a normal backend mode. [VERIFIED: apps/worker/src/runner.ts]
**Why it happens:** Current guard returns successfully when lifecycle owner is TypeScript and purpose is normal. [VERIFIED: apps/worker/src/runner.ts]
**How to avoid:** Make TypeScript owner require `rollback` purpose, or remove lifecycle owner as an allowance entirely. [VERIFIED: 106-CONTEXT.md]
**Warning signs:** A test named "allows normal TypeScript job ownership only when explicitly selected" still passes. [VERIFIED: apps/worker/src/runner.test.ts]

### Pitfall 3: Broad root exports keep quarantined code reachable
**What goes wrong:** Normal code can import lifecycle methods from `@cowards/persistence` root after implementation labels say they are quarantined. [VERIFIED: packages/persistence/src/index.ts]
**Why it happens:** Root export currently re-exports lifecycle and scoring modules. [VERIFIED: packages/persistence/src/index.ts]
**How to avoid:** Remove lifecycle exports from root or create an explicit quarantine subpath and monitor its importers. [VERIFIED: 106-CONTEXT.md]
**Warning signs:** `apps/worker/src/runner.ts` imports `claimNextMatchJob`, `completeMatch`, and `recordAttemptFailure` from `@cowards/persistence`. [VERIFIED: apps/worker/src/runner.ts]

### Pitfall 4: Lazy TypeScript scoring refresh through public DTOs
**What goes wrong:** Public selected reads can silently refresh Go-owned MatchSet status through TypeScript. [VERIFIED: packages/persistence/src/competition.ts]
**Why it happens:** `buildPublicMatchSetResultDto` calls `refreshMatchSetStatus` before reading DTO rows. [VERIFIED: packages/persistence/src/competition.ts]
**How to avoid:** Keep this path parity/fixture/rollback/deferred only and add tests ensuring selected public read paths use Go clients. [VERIFIED: apps/web/lib/public-service-adapter.ts; apps/web/app/matches/server.ts]
**Warning signs:** `@cowards/service` or public web adapters construct `buildPublicMatchSetResultDto` while `COWARDS_NO_TYPESCRIPT_BACKEND=1`. [VERIFIED: packages/service/src/index.ts; apps/web/lib/public-service-adapter.ts]

### Pitfall 5: Treating `@cowards/service` as harmless because it is typed
**What goes wrong:** Typed local service still performs DB reads and lazy TS public DTO work. [VERIFIED: packages/service/src/index.ts]
**Why it happens:** `createCowardsLocalService` is a DB-backed service facade over persistence modules. [VERIFIED: packages/service/src/index.ts]
**How to avoid:** Label it parity/fixture/rollback/deferred and make selected route adapters fail if they instantiate it under Go/no-TS topology. [VERIFIED: 106-CONTEXT.md; apps/web/lib/account-service-adapter.ts]
**Warning signs:** `createCowardsLocalService` appears in selected normal route call chains. [VERIFIED: rg createCowardsLocalService]

## Code Examples

### Current Guard That Must Change

```typescript
// Source: apps/worker/src/runner.ts
if (config.lifecycleOwner === "typescript") {
  return
}
```

This branch currently allows normal TypeScript job ownership and conflicts with D-04/D-05. [VERIFIED: apps/worker/src/runner.ts; 106-CONTEXT.md]

### Current Lazy Refresh That Must Be Quarantined

```typescript
// Source: packages/persistence/src/competition.ts
export const buildPublicMatchSetResultDto = async (...) => {
  await refreshMatchSetStatus(pool, matchSetId)
  ...
}
```

This refresh belongs in parity/fixture/rollback/deferred support, not selected normal Go public evidence. [VERIFIED: packages/persistence/src/competition.ts; .planning/artifacts/v1.16-selected-go-route-manifest.json]

### Existing Test-Support Pattern To Preserve

```typescript
// Source: apps/web/app/api/test-support/run-worker-once/route.ts
jobOwnership: {
  lifecycleOwner: "go",
  workerPurpose: "test",
}
```

This is an acceptable non-normal TS worker use because the route is test-gated and purpose is `test`. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript worker could be selected as normal job lifecycle owner by env. [VERIFIED: apps/worker/src/runner.ts] | Go owns normal lifecycle; TypeScript worker must become rollback/parity/test only. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md; 106-CONTEXT.md] | v1.15 promotion, hardened in Phase 106. [VERIFIED: .planning/PROJECT.md; 106-CONTEXT.md] | Phase 106 must reject normal TS ownership even if `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript`. [VERIFIED: 106-CONTEXT.md] |
| TypeScript public DTO builder lazily refreshed scoring. [VERIFIED: packages/persistence/src/competition.ts] | Go selected public MatchSet summary and replay evidence should use Go reads/scoring. [VERIFIED: .planning/artifacts/v1.16-selected-go-route-manifest.json] | v1.15/v1.16 public evidence cutover. [VERIFIED: v1.15 promotion decision; 105-SUMMARY.md] | Lazy TS refresh is parity/deferred/rollback only. [VERIFIED: 106-CONTEXT.md] |
| Broad `@cowards/persistence` root exported lifecycle modules. [VERIFIED: packages/persistence/src/index.ts] | Phase 106 should make lifecycle exports explicit quarantine-only. [VERIFIED: 106-CONTEXT.md] | Phase 106. [VERIFIED: .planning/ROADMAP.md] | Normal import reachability becomes monitorable. [VERIFIED: scripts/check-boundary-monitors.ts] |

**Deprecated/outdated:**
- Normal TypeScript Match job owner mode is deprecated for selected normal topology. [VERIFIED: 106-CONTEXT.md]
- `@cowards/service` as selected normal backend fallback is deprecated for Phase 105 selected routes. [VERIFIED: 105-SUMMARY.md; 106-CONTEXT.md]
- Lazy TypeScript scoring refresh for selected normal public evidence is deprecated. [VERIFIED: QUAR-04 in .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A new quarantine subpath name such as `@cowards/persistence/quarantine-lifecycle` is acceptable if the planner chooses it. [ASSUMED] | Recommended Quarantine Strategy | Import paths and package exports may need a different name to match project style. |

## Open Questions

1. **Should lifecycle modules be moved or just unexported from root?** [VERIFIED: packages/persistence/src/index.ts]
   - What we know: root exports currently expose lifecycle modules broadly. [VERIFIED: packages/persistence/src/index.ts]
   - What's unclear: whether planner prefers physical module moves or package export contraction only. [ASSUMED]
   - Recommendation: use minimal export contraction plus monitor checks unless tests show imports need a named quarantine subpath. [VERIFIED: code inspection]

2. **Should `scripts/dev-local-postgres.sh` continue starting the TS worker?** [VERIFIED: scripts/dev-local-postgres.sh]
   - What we know: the script starts `pnpm --filter @cowards/worker dev`. [VERIFIED: scripts/dev-local-postgres.sh]
   - What's unclear: whether Phase 106 should edit the dev script now or leave strict no-TS topology to Phase 108. [VERIFIED: .planning/ROADMAP.md]
   - Recommendation: update it only if needed to prevent accidental normal worker startup; otherwise document as local dev legacy until Phase 108. [VERIFIED: 106-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TS tests/scripts | Yes | v24.15.0 | None needed. [VERIFIED: `node --version`] |
| pnpm | Workspace commands | Yes | 11.1.2 | None needed. [VERIFIED: `pnpm --version`] |
| Go | Go backend verification | Yes | go1.26.3 installed; go.mod target 1.25.0 | None needed. [VERIFIED: `go version`; apps/go-backend/go.mod] |
| Docker | optional services/topology | Yes | 29.4.0 | Local Postgres path exists in prior v1.15 notes if Docker is unavailable. [VERIFIED: `docker --version`; 102-SUMMARY.md] |
| PostgreSQL service | DB-backed tests/topology | Not probed as running | — | Focused Phase 106 static/unit tests can run without live DB; DB tests require local service setup. [VERIFIED: package.json; prior validation summaries] |

**Missing dependencies with no fallback:** None identified for research or static Phase 106 planning. [VERIFIED: environment audit]

**Missing dependencies with fallback:** Running PostgreSQL was not probed; use focused Vitest/Go unit tests first, and DB-backed tests when services are running. [VERIFIED: package.json; v1.15 validation summaries]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 for TypeScript, Go test for backend, Playwright 1.60.0 for browser smoke when needed. [VERIFIED: package.json; apps/go-backend/go.mod] |
| Config file | No root Vitest config was found in inspected files; package scripts call `vitest run --passWithNoTests`. [VERIFIED: package.json; package package.json files] |
| Quick run command | `pnpm exec vitest run apps/worker/src/runner.test.ts scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts` [VERIFIED: existing test files and package.json] |
| Full suite command | `pnpm boundary:monitors && pnpm --filter @cowards/worker test && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: package.json; apps/worker/package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAR-01 | Worker entrypoint refuses normal startup without explicit non-normal purpose. [VERIFIED: 106-CONTEXT.md] | unit | `pnpm exec vitest run apps/worker/src/runner.test.ts` | Partial: runner test exists; entrypoint test likely needs adding. [VERIFIED: apps/worker/src/runner.test.ts] |
| QUAR-02 | Lifecycle modules are not normal exports/imports. [VERIFIED: 106-CONTEXT.md] | monitor/unit | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts` | Yes, but needs Phase 106 cases. [VERIFIED: scripts tests] |
| QUAR-03 | Selected exhibition MatchSet creation cannot use TS persistence. [VERIFIED: QUAR-03] | unit/monitor | `pnpm exec vitest run apps/web/lib/account-service-adapter.test.ts scripts/check-boundary-monitors.test.ts` | Yes, needs quarantine-specific assertions. [VERIFIED: existing tests] |
| QUAR-04 | Selected public DTO reads do not lazy-refresh via TS scoring. [VERIFIED: QUAR-04] | unit/monitor | `pnpm exec vitest run apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts scripts/check-boundary-monitors.test.ts` | Yes, needs refresh-specific assertion. [VERIFIED: existing tests] |
| QUAR-05 | `@cowards/service` is non-normal for selected routes. [VERIFIED: QUAR-05] | unit/monitor | `pnpm exec vitest run packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts` | Yes. [VERIFIED: existing tests] |
| QUAR-06 | Normal TS job ownership blocked; rollback/test/parity allowed. [VERIFIED: QUAR-06] | unit | `pnpm exec vitest run apps/worker/src/runner.test.ts` | Yes, but one expectation must be inverted. [VERIFIED: apps/worker/src/runner.test.ts] |
| QUAR-07 | Rollback artifact covers job states and no mixed owners. [VERIFIED: QUAR-07] | artifact/monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | Yes, needs v1.16 artifact case. [VERIFIED: scripts/check-boundary-monitors.test.ts] |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run apps/worker/src/runner.test.ts` for worker guard changes. [VERIFIED: existing tests]
- **Per task commit:** `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts` for monitor/inventory changes. [VERIFIED: existing tests]
- **Per wave merge:** `pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm boundary:monitors`. [VERIFIED: package.json]
- **Phase gate:** worker tests, service/adapter tests, inventory check, boundary imports, boundary monitors, and Go tests green before verification. [VERIFIED: package.json; 106-CONTEXT.md]

### Wave 0 Gaps

- [ ] `apps/worker/src/index.test.ts` or runner-level entrypoint config test for QUAR-01. [VERIFIED: apps/worker/src/index.ts has no test found]
- [ ] Phase 106 monitor tests for quarantine import boundary and v1.16 rollback artifact. [VERIFIED: scripts/check-boundary-monitors.test.ts]
- [ ] Public DTO lazy-refresh negative test proving selected public reads do not invoke TS `refreshMatchSetStatus`. [VERIFIED: packages/persistence/src/competition.ts; apps/web/lib/public-service-adapter.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Yes for selected account/session adapters, but Phase 106 should not change auth logic. [VERIFIED: selected route manifest] | Preserve Go-owned auth/session selected routes and no local service fallback. [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| V3 Session Management | Yes indirectly for account adapters. [VERIFIED: apps/web/lib/account-service-adapter.ts] | Do not expose session tokens in diagnostics; public-output denylist includes sessions/tokens. [VERIFIED: .planning/artifacts/v1.16-typescript-backend-inventory.json] |
| V4 Access Control | Yes for owner-debug replay and account source boundaries. [VERIFIED: apps/web/app/matches/server.ts; selected route manifest] | Keep owner-debug replay explicit/private and selected public replay on Go. [VERIFIED: apps/web/app/matches/server.ts] |
| V5 Input Validation | Yes. [VERIFIED: AGENTS.md] | Keep schema validation through spec DTOs and existing service/go clients; Phase 106 should add guards/tests rather than bypass schemas. [VERIFIED: packages/service/src/index.ts; apps/web/lib/go-backend-service-client.ts] |
| V6 Cryptography | Yes for lease tokens and hashes. [VERIFIED: packages/persistence/src/jobs.ts; apps/go-backend/job_lifecycle.go] | Do not hand-roll new crypto; existing Go uses `crypto/rand` for lease tokens, TS uses `randomUUID`. [VERIFIED: apps/go-backend/job_lifecycle.go; packages/persistence/src/jobs.ts] |

### Known Threat Patterns for TypeScript Lifecycle Quarantine

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Mixed Go and TS DB owners claim/complete same queue. [VERIFIED: v1.15 failure drills] | Tampering / Denial of Service | Entrypoint guard, rollback artifact, and monitor checks for no mixed owners. [VERIFIED: 106-CONTEXT.md] |
| Public output leaks private Strategy data from fallback DTO/replay path. [VERIFIED: AGENTS.md; inventory denylist] | Information Disclosure | Keep selected public reads on Go; preserve DTO privacy assertions and public-output denylist monitors. [VERIFIED: packages/spec; scripts/check-boundary-monitors.ts] |
| Test-support worker route exposed in product runtime. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts] | Elevation of Privilege / Tampering | Keep `PLAYWRIGHT_TEST` or `NODE_ENV=test` gate and monitor test-only labels. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts] |
| Runtime service becomes backend fallback. [VERIFIED: runtime boundary artifact] | Tampering / Information Disclosure | Runtime boundary artifact disallows job claim, Match completion, Chronicle persistence, scoring, product APIs, and fallback. [VERIFIED: .planning/artifacts/v1.16-runtime-service-boundary.json] |

## Exact Likely Files

| File | Likely Plan Action |
|------|--------------------|
| `apps/worker/src/index.ts` | Add entrypoint purpose guard and source-safe startup diagnostics. [VERIFIED: code inspection] |
| `apps/worker/src/runner.ts` | Retire normal TS lifecycle owner allowance and expose reusable quarantine guard. [VERIFIED: code inspection] |
| `apps/worker/src/runner.test.ts` | Invert normal TS owner test; add rollback/test/parity allowance and entrypoint config coverage. [VERIFIED: code inspection] |
| `apps/worker/package.json` | Possibly adjust `dev` script or document required env; planner should decide. [VERIFIED: apps/worker/package.json; scripts/dev-local-postgres.sh] |
| `packages/persistence/src/index.ts` | Remove or quarantine lifecycle exports. [VERIFIED: code inspection] |
| `packages/persistence/package.json` | Possibly add explicit quarantine export subpath. [VERIFIED: package exports] |
| `packages/persistence/src/jobs.ts` | Keep implementation but mark/guard as rollback/parity/test only. [VERIFIED: code inspection] |
| `packages/persistence/src/complete-match.ts` | Keep oracle/rollback implementation but block normal reachability. [VERIFIED: code inspection] |
| `packages/persistence/src/matchset-status.ts` | Keep parity/test scoring refresh but block selected normal lazy refresh. [VERIFIED: code inspection] |
| `packages/persistence/src/matchset-service.ts` | Quarantine MatchSet creation for selected normal exhibition scope. [VERIFIED: code inspection] |
| `packages/persistence/src/competition.ts` | Split/gate `createManualExhibitionMatchSet` and `buildPublicMatchSetResultDto` hazards. [VERIFIED: code inspection] |
| `packages/service/src/index.ts` | Add non-normal role metadata/test or preserve as parity/deferred service only. [VERIFIED: code inspection] |
| `apps/web/lib/account-service-adapter.ts` | Ensure selected Go/no-TS mode cannot construct local service. [VERIFIED: code inspection] |
| `apps/web/lib/public-service-adapter.ts` | Keep Go-only selected public reads and monitor selected route IDs. [VERIFIED: code inspection] |
| `apps/web/app/matches/server.ts` | Preserve selected Go public replay branch and explicit owner-debug TS branch. [VERIFIED: code inspection] |
| `apps/web/app/api/test-support/run-worker-once/route.ts` | Keep test-only worker execution gate. [VERIFIED: code inspection] |
| `scripts/check-boundary-monitors.ts` | Add v1.16 worker/persistence quarantine artifact and import checks. [VERIFIED: code inspection] |
| `scripts/check-boundary-monitors.test.ts` | Add failing tests for normal TS owner/import/export drift. [VERIFIED: code inspection] |
| `scripts/check-service-boundary-imports.ts` | Promote quarantine import patterns to strict for selected normal files. [VERIFIED: code inspection] |
| `scripts/generate-typescript-backend-inventory.ts` | Update labels after quarantine and stale artifact checks. [VERIFIED: code inspection] |
| `.planning/artifacts/v1.16-typescript-backend-inventory.{json,md}` | Regenerate after source/test/monitor changes. [VERIFIED: Phase 103 pattern] |
| `.planning/artifacts/v1.16-typescript-worker-quarantine.{json,md}` | New rollback/quarantine evidence artifact. [VERIFIED: 106-CONTEXT.md] |
| `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-VALIDATION.md` | Record focused tests, monitor evidence, and residual live-service status. [VERIFIED: prior phase pattern] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: file read]
- `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` - v1.16 scope and QUAR requirements. [VERIFIED: file reads]
- `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md` - locked Phase 106 decisions. [VERIFIED: file read]
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json`, `.planning/artifacts/v1.15-failure-drills.json`, `.planning/artifacts/v1.15-promotion-decision.md` - v1.15 Go ownership and rollback baseline. [VERIFIED: file reads]
- `.planning/artifacts/v1.16-selected-go-route-manifest.json`, `.planning/artifacts/v1.16-typescript-backend-inventory.json`, `.planning/artifacts/v1.16-runtime-service-boundary.json` - v1.16 selected routes, surface labels, runtime boundary. [VERIFIED: file reads]
- Code files listed in Exact Likely Files. [VERIFIED: code inspection]

### Secondary (MEDIUM confidence)
- v1.15 Phase 97, 99, 100, and 102 summaries - migration history and validation intent. [VERIFIED: file reads]
- Phase 103-105 summaries - existing inventory, runtime boundary, and selected Go route cutover results. [VERIFIED: file reads]

### Tertiary (LOW confidence)
- None. [VERIFIED: this research used repo-local files and local command output only]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions are from package files and local commands. [VERIFIED: package.json; go.mod; version commands]
- Architecture: HIGH - ownership is locked by v1.15/v1.16 artifacts and current code. [VERIFIED: artifacts and code inspection]
- Pitfalls: HIGH - each pitfall maps to a current source path or locked decision. [VERIFIED: code inspection]
- Exact file list: HIGH for likely touched files; MEDIUM for whether planner chooses split/move versus guard-only edits. [VERIFIED: code inspection; ASSUMED planner choice]

**Research date:** 2026-05-24 [VERIFIED: environment current_date]
**Valid until:** 2026-06-23 for repo-local architecture if Phase 106 implementation has not started; re-run inventory after any source changes. [ASSUMED]
