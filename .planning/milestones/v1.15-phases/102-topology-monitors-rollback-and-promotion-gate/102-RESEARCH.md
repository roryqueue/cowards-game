# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Research

**Researched:** 2026-05-24  
**Domain:** v1.15 local topology, boundary monitors, rollback drills, replay realism, privacy, and promotion/defer evidence  
**Confidence:** HIGH for repo-local scripts, artifacts, constraints, and validation surfaces; MEDIUM for exact post-Phase-101 artifact names until earlier v1.15 phases create them.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Promotion Gate Role

- **D-01:** Phase 102 is a promotion gate for v1.15, not another broad implementation phase.
- **D-02:** Final artifacts should record explicit promotion/defer decisions for Go orchestration, runtime boundary, Chronicle persistence, MatchSet scoring, public evidence, rollback, no-fallback, privacy, and remaining TypeScript ownership.
- **D-03:** The promotion decision must state that production sandbox replacement and final TypeScript runtime retirement remain out of scope.

### Required Topology Evidence

- **D-04:** Required local topology evidence must prove web frontend -> Go backend -> TypeScript runtime execution service -> Go completion/Chronicle persistence -> Go MatchSet scoring -> Go public evidence.
- **D-05:** The repeatable topology command should create a Go-owned exhibition, execute Matches through the TypeScript runtime boundary, persist Chronicles through Go, finalize scoring through Go, and fetch public evidence through Go.
- **D-06:** Topology must fail if normal product workflows silently fall back to TypeScript backend/service persistence paths.

### Failure Drills

- **D-07:** Stopped-Go drills are required. Selected Go-owned web/API workflows must fail closed without TypeScript backend fallback.
- **D-08:** Stopped-runtime-service drills are required. Go must classify stopped runtime service behavior as retryable or terminal system failure without TypeScript persistence fallback.
- **D-09:** Failure drill diagnostics must be public-safe and redacted by default.

### Rollback

- **D-10:** Rollback must be explicit and documented: stop Go orchestration, switch ownership, then start the TypeScript rollback worker.
- **D-11:** Rollback must not mix DB claim/completion owners.
- **D-12:** Rollback evidence should cover queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior where practical.

### Boundary Monitors

- **D-13:** Boundary monitors should fail on unexpected TypeScript backend ownership creep, unsafe fallback, schema drift, runtime ABI drift, lifecycle/route manifest drift, privacy drift, report-only offense increases, and public-output leaks.
- **D-14:** Monitors should make remaining TypeScript production-ish ownership visible and limited to the isolated JS/TS Strategy runtime service plus explicitly documented parity/test/rollback/deferred surfaces.
- **D-15:** Report-only offense increases should be treated as promotion blockers unless explicitly rebaselined with evidence.

### Browser Replay Gate

- **D-16:** Browser replay validation remains part of the promotion gate for Go-created or Go-completed evidence.
- **D-17:** Replay validation should prove plausible full Match starts with in-bounds visible Soldiers and terrain, no clipped/off-board pieces, and no canonical-start regression for canonical arenas.

### Privacy And Public Safety

- **D-18:** Public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- **D-19:** The final promotion/defer artifacts must be source-safe and suitable as public evidence.

### the agent's Discretion

The agent may choose exact topology command names, artifact filenames, monitor helper structure, and drill harness details, provided the gate proves the complete v1.15 ownership story and does not widen the milestone into v1.16 runtime retirement or production sandbox replacement.

### Deferred Ideas (OUT OF SCOPE)

- Production hostile-code sandbox replacement.
- Final TypeScript runtime retirement.
- Counted non-JS MatchSets/ladders/gauntlets by default.
- Full workshop/admin/governance migration.
- Cloud deployment, service mesh, Kubernetes, or production observability stack.
</user_constraints>

## Summary

Phase 102 should promote only if it can prove the complete normal-product chain: web frontend selects Go, Go creates/claims/completes Match work, the TypeScript runtime service executes Strategy code behind `strategy-runtime-abi-v1.14`, Go persists Chronicles and refreshes MatchSet scoring, and public evidence is fetched through Go without TypeScript DB fallback. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md] [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/REQUIREMENTS.md]

The existing `pnpm topology:check` is useful but currently fixture/read-oriented: it validates command guidance, committed Go read fixtures, service health, runtime metadata, sandbox readiness, optional live web/Go smoke, and diagnostic privacy. It does not yet create a Go-owned exhibition, drive execution through a runtime service, assert Go completion/Chronicle/scoring ownership, or test stopped-runtime classification. [VERIFIED: scripts/check-local-topology.ts] [VERIFIED: command `pnpm topology:check -- --json`]

**Primary recommendation:** extend the existing topology/monitor pattern into a v1.15 lifecycle gate with three source-safe artifacts: `v1.15-live-topology.json`, `v1.15-failure-drills.json`, and `v1.15-promotion-decision.md`; then make `pnpm boundary:monitors` fail unless the v1.15 lifecycle manifest, topology evidence, rollback drills, privacy checks, and replay realism checks all pass. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: .planning/artifacts/v1.14-live-web-go-topology.json] [VERIFIED: .planning/artifacts/v1.14-promotion-decision.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Go-owned exhibition and public evidence workflow | API / Backend | Browser / Client | The web should call selected Go contracts; no normal selected workflow should fall through to TypeScript service/persistence when Go is selected. [VERIFIED: apps/web/lib/account-service-adapter.ts] [VERIFIED: apps/web/lib/public-service-adapter.ts] |
| Match job claim, lease, retry, completion owner checks | API / Backend | Database / Storage | Job ownership is a persistence-facing lifecycle concern; TypeScript worker must be rollback/test only after Go selection. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] [VERIFIED: packages/persistence/src/jobs.ts] |
| Strategy execution | Isolated Runtime Service | API / Backend | Strategy code remains in the TypeScript runtime boundary; Go may coordinate requests but must not execute source. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md] [VERIFIED: packages/runtime-js/src/abi-bridge.ts] |
| Chronicle persistence and MatchSet scoring | API / Backend | Database / Storage | Go is the normal completion/scoring owner after Phases 99-100; public reads must not mask missing Go scoring with TypeScript lazy refresh. [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md] [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |
| Replay board realism | Browser / Client | API / Backend | The replay renderer and Playwright visual checks prove visible board plausibility, while Go/public evidence must provide compatible Chronicle metadata and public data. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| Promotion/defer documentation | Project artifacts | Boundary monitors | The final decision belongs in `.planning/artifacts/` and monitors should fail on drift or unsafe evidence. [VERIFIED: .planning/artifacts/v1.14-promotion-decision.md] [VERIFIED: scripts/check-boundary-monitors.ts] |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GATE-01 | Repeatable local topology command proves Go-owned exhibition -> runtime boundary -> Go Chronicle/scoring -> Go public evidence. | Extend `scripts/check-local-topology.ts` beyond current fixture/read smoke into lifecycle checks. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: scripts/check-local-topology.ts] |
| GATE-02 | Browser replay validation shows plausible full Match starts with in-bounds visible Soldiers and terrain. | Reuse `replayBoardRealismError`, canonical-start validation, and Playwright canvas pixel/snapshot checks. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| GATE-03 | Stopped-Go behavior fails closed without TypeScript backend fallback. | Existing selected Go clients throw when Go is selected but unavailable or unconfigured; topology must make this live and route-specific. [VERIFIED: apps/web/lib/public-go-read-client.ts] [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| GATE-04 | Stopped-runtime-service behavior is Go-classified as retryable or terminal system failure without TypeScript persistence fallback. | Phase 98 context requires execution-only TypeScript runtime service and Go lifecycle failure classification; Phase 102 must drill it. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md] [VERIFIED: packages/persistence/src/jobs.ts] |
| GATE-05 | Rollback from Go orchestration to TypeScript worker ownership is explicit and avoids mixed DB-completing owners. | Context locks rollback order and no mixed owners; TypeScript `apps/worker/src/runner.ts` is the rollback implementation, not concurrent normal owner. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md] [VERIFIED: apps/worker/src/runner.ts] |
| GATE-06 | Boundary monitors fail on TypeScript ownership creep, unsafe fallback, schema/runtime ABI drift, route/lifecycle drift, privacy drift, report-only increases, and leaks. | Extend `scripts/check-boundary-monitors.ts`, which already gates OpenAPI, privacy, report-only offense baseline, runtime adapter drift, Go manifests, and topology. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: command `pnpm boundary:imports`] |
| GATE-07 | Final promotion/defer artifacts cover Go orchestration, runtime boundary, Chronicle persistence, scoring, public evidence, rollback, no-fallback, privacy, and remaining TypeScript runtime ownership. | Follow v1.14 promotion artifact structure and add v1.15 lifecycle sections. [VERIFIED: .planning/artifacts/v1.14-promotion-decision.md] |
| GATE-08 | Remaining TypeScript production-ish process is only isolated JS/TS runtime service plus documented parity/test/rollback surfaces. | Use Phase 96 labels and monitor checks to enumerate `runtime_only`, `parity_only`, `rollback_only`, `test_only`, and `deferred` surfaces. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or SoldierMemory by default. [VERIFIED: AGENTS.md]
- Replay or Match creation changes must include board realism checks for in-bounds visible Soldiers/terrain, canonical arena starts, and browser validation for plausible full Match starts. [VERIFIED: AGENTS.md]

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Go backend | `go 1.25.0` module; local `go1.26.3` | Go-owned backend routes and v1.15 lifecycle owner | Existing `apps/go-backend` owner surface uses Go plus `pgx` and already has Go tests. [VERIFIED: apps/go-backend/go.mod] [VERIFIED: command `go version`] |
| `github.com/jackc/pgx/v5` | `v5.9.2` | Go PostgreSQL access | Existing Go backend uses `pgxpool` for live DB access. [VERIFIED: apps/go-backend/go.mod] [VERIFIED: apps/go-backend/live_backend.go] |
| PostgreSQL | Compose image `postgres:18`; local CLI `16.14` | Match jobs, Chronicles, MatchSets, sessions, Strategy Revisions | The schema stores `matches`, `match_sets`, `chronicles`, `match_jobs`, and `match_job_attempts`. [VERIFIED: compose.yaml] [VERIFIED: packages/persistence/migrations/0001_initial.sql] |
| TypeScript runtime boundary | `strategy-runtime-abi-v1.14` | Hostile Strategy execution ABI | Runtime ABI constant and JS bridge are already v1.14. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: packages/runtime-js/src/abi-bridge.ts] |
| Next.js / React web | Next `^16.2.6`, React `^19.2.6` | Frontend and replay rendering | Existing web app is Next/React and must remain frontend/rendering tier, not rules/runtime owner. [VERIFIED: apps/web/package.json] [VERIFIED: AGENTS.md] |
| PixiJS replay canvas | `pixi.js ^8.18.1`, `@pixi/react ^8.0.5` | Browser replay board rendering | Existing replay visual tests inspect canvas pixels and screenshots. [VERIFIED: apps/web/package.json] [VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| Vitest | `4.1.6` installed | Unit and script tests | Existing script/web/package tests use Vitest. [VERIFIED: package.json] [VERIFIED: command `pnpm exec vitest --version`] |
| Playwright | `1.60.0` installed | Browser replay validation | Existing replay fixture and visual suites use Playwright. [VERIFIED: package.json] [VERIFIED: command `pnpm exec playwright --version`] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `tsx` | `4.22.0` installed; worker package asks `^4.21.0` | Run TypeScript scripts and runtime service harnesses | Use for topology/monitor scripts and a local TypeScript runtime service harness. [VERIFIED: apps/worker/package.json] [VERIFIED: command `pnpm exec tsx --version`] |
| Zod | `^4.4.3` | Schema validation | Use for public DTOs and runtime envelopes crossing trust boundaries. [VERIFIED: packages/spec/package.json] [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md] |
| Docker Compose | Docker `29.4.3`, Compose `v5.1.3` installed | Local Postgres/Redis and optional sandbox checks | Use `pnpm services:up`; Redis is present in Compose but not central to Phase 102 topology proof. [VERIFIED: compose.yaml] [VERIFIED: command `docker --version && docker compose version`] |
| `@cowards/spec` privacy helpers | workspace package | Public-output leak detection | Reuse `assertPublicServiceDtoLeakSafe` / forbidden field contract instead of duplicating leak rules. [VERIFIED: packages/spec/src/public-output-privacy.ts] [VERIFIED: scripts/check-boundary-monitors.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending `scripts/check-local-topology.ts` | New standalone gate script | A new script would duplicate redaction, public payload, runtime metadata, and command-output conventions already implemented. Use extension. [VERIFIED: scripts/check-local-topology.ts] |
| Extending `scripts/check-boundary-monitors.ts` | Separate v1.15 monitor runner | Existing `pnpm boundary:monitors` already composes contract, privacy, import, Go parity, sandbox, topology, and ownership checks. Use extension. [VERIFIED: package.json] [VERIFIED: scripts/check-boundary-monitors.ts] |
| Using TypeScript worker as automatic fallback | Auto-start `apps/worker` if Go/runtime fails | This violates no silent fallback and mixed DB-owner constraints. Use explicit rollback only. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md] |
| New queue/broker | Redis queue or external scheduler | Phase 97 locks DB job lifecycle parity and forbids a new queue model. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |

**Installation:**
```bash
# No new packages recommended for Phase 102.
pnpm install
pnpm services:up
```

**Version verification:** recommended versions are repo-local, not upgrade recommendations. Verified with `package.json`, `apps/*/package.json`, `apps/go-backend/go.mod`, and local command probes on 2026-05-24. [VERIFIED: package.json] [VERIFIED: apps/go-backend/go.mod] [VERIFIED: command output]

## Architecture Patterns

### System Architecture Diagram

```text
Developer runs v1.15 topology gate
        |
        v
Web frontend selected with COWARDS_GO_BACKEND_OWNER=go
        |
        v
Go backend creates exhibition + owns job lifecycle
        |
        v
TypeScript runtime execution service
  - strategy-runtime-abi-v1.14
  - execution only, no DB completion ownership
        |
        v
Go completion transaction
  - validate lease
  - validate Chronicle
  - persist Chronicle
  - complete Match/job/attempt
        |
        v
Go MatchSet scoring refresh
        |
        v
Go public evidence endpoints
        |
        v
Replay browser validation + privacy/monitor gate

Failure branches:
  stopped Go -> selected web/API workflows fail closed, no TypeScript fallback
  stopped runtime service -> Go records retryable/terminal system failure, no TypeScript DB fallback
  rollback -> operator stops Go orchestration, changes owner switch, starts TypeScript rollback worker
```

### Recommended Project Structure

```text
scripts/
├── check-local-topology.ts        # extend with v1.15 lifecycle and failure drill options
├── check-boundary-monitors.ts     # extend with v1.15 lifecycle manifest/evidence gates
└── check-service-boundary-imports.ts

.planning/artifacts/
├── v1.15-lifecycle-ownership-manifest.json    # expected from Phase 96
├── v1.15-live-topology.json                   # Phase 102 generated evidence
├── v1.15-failure-drills.json                  # stopped-Go/stopped-runtime/rollback evidence
└── v1.15-promotion-decision.md                # final promote/defer decision

apps/web/e2e/
├── replay.fixture.spec.ts         # public/owner replay privacy browser checks
└── replay.visual.spec.ts          # replay board screenshot and pixel checks
```

### Pattern 1: Extend Topology Checks as Layered Evidence

**What:** Keep `TopologyCheck { layer, name, required, ok, detail }` and add v1.15 layers such as `go_lifecycle`, `runtime_service`, `go_completion`, `go_scoring`, `go_public_evidence`, `failure_drill`, and `rollback`. [VERIFIED: scripts/check-local-topology.ts]

**When to use:** Use for both static and live gate modes; live v1.15 mode should require the complete lifecycle and write source-safe JSON evidence. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]

**Example:**
```typescript
// Source: scripts/check-local-topology.ts
checks.push(
  await check("privacy", "diagnostic output", true, () => {
    checkPublicPayload({
      commands: localCommands,
      checks: checks.map(({ layer, name, ok, required, detail }) => ({
        layer,
        name,
        ok,
        required,
        detail,
      })),
    })
    return "diagnostics contain no private markers"
  }),
)
```

### Pattern 2: Treat Go Selection Errors as Gate Evidence

**What:** Selected Go clients must throw classified errors on unavailable Go, invalid schema, non-JSON, privacy leak, or bad status instead of falling back to local TypeScript service. [VERIFIED: apps/web/lib/public-go-read-client.ts] [VERIFIED: apps/web/lib/public-go-read-client.test.ts]

**When to use:** Stopped-Go drills should exercise selected public reads and selected product mutations through web/API routes, then assert classified failure output and no TypeScript result payload. [VERIFIED: apps/web/lib/account-service-adapter.ts] [VERIFIED: apps/web/app/api/exhibitions/route.ts]

**Example:**
```typescript
// Source: apps/web/lib/public-go-read-client.test.ts
await expect(
  client.getPublicStrategyPage("strategy:demo"),
).rejects.toMatchObject({
  diagnostic: {
    routeId: "getPublicStrategyPage",
    selectedBackend: "go",
    status: null,
    failureClass: "go_unavailable",
  },
})
```

### Pattern 3: Replay Realism Before Render

**What:** Replay preparation rejects invalid bounds, canonical start mismatches, out-of-bounds visible Soldiers/terrain, fallen visible Soldiers, missing positions, overlapping Soldiers, and Soldier/terrain overlap. [VERIFIED: apps/web/app/matches/replay-ready.ts]

**When to use:** Phase 102 should run this against Go-created/Go-completed evidence, then run Playwright visual checks for the browser canvas. [VERIFIED: apps/web/e2e/replay.visual.spec.ts]

**Example:**
```typescript
// Source: apps/web/app/matches/replay-ready.ts
const boardRealismError = replayBoardRealismError(
  states,
  metadata.arenaVariantId,
)
if (boardRealismError) {
  return projectionFailure(
    metadata.matchId,
    boardRealismError,
    "validation",
  )
}
```

### Anti-Patterns to Avoid

- **Fixture-only topology:** static DTO fixtures cannot prove web -> Go -> runtime -> Go persistence/public evidence. [VERIFIED: scripts/check-local-topology.ts] [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]
- **Automatic TypeScript fallback:** if Go or runtime is stopped, selected normal paths must fail closed or record Go-classified system failure, not complete through TypeScript. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]
- **Mixed DB-completing owners:** do not run Go orchestration and legacy TypeScript DB-owning worker as concurrent normal claim/completion owners. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] [VERIFIED: apps/worker/src/runner.ts]
- **Raw Chronicle/public evidence exposure:** normal public replay/evidence must use source-safe projections and DTOs, not raw/private Chronicle data. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: packages/spec/src/public-output-privacy.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Public-output leak detection | Custom regex-only scanner | `assertPublicServiceDtoLeakSafe` / `assertPublicOutputLeakSafe` plus Go `validateNoPrivateKeys` | Existing contract already blocks source, memories, objectives, debug, tokens, sessions, DSNs, stack traces, stderr, and runtime internals. [VERIFIED: packages/spec/src/public-output-privacy.ts] [VERIFIED: apps/go-backend/main.go] |
| Web replay visual proof | Manual screenshot inspection only | Existing Playwright replay fixture/visual suites and canvas pixel checks | Existing tests verify canvas visibility, nonblank halves, screenshots, and public/owner debug privacy. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| Runtime ABI validation | Ad hoc Go/TS JSON parsing without schema | `StrategyRuntimeRequestEnvelopeSchema` and `StrategyRuntimeResponseEnvelopeSchema` through the v1.14 bridge | Runtime ABI schemas already enforce request/response shape and source hash/byte checks. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: packages/runtime-js/src/abi-bridge.ts] |
| Import boundary tracking | New grep script | `scripts/check-service-boundary-imports.ts` via `pnpm boundary:imports` and `pnpm boundary:monitors` | Existing baseline reports `strict_offenses=0 report_only_offenses=29`; new offenses should fail promotion. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: command `pnpm boundary:imports`] |
| Job rollback semantics | In-memory handoff state | Existing DB job statuses, leases, attempts, and TypeScript rollback worker | Runtime state already lives in Postgres `match_jobs` and `match_job_attempts`; rollback must respect queued/running/expired/retry state. [VERIFIED: packages/persistence/migrations/0001_initial.sql] [VERIFIED: packages/persistence/src/jobs.ts] |

**Key insight:** Phase 102 succeeds by composing existing hard gates into lifecycle evidence; custom one-off checks are riskier because they tend to miss privacy redaction, no-fallback semantics, and replay realism edge cases already handled in repo-local helpers. [VERIFIED: scripts/check-local-topology.ts] [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts]

## Common Pitfalls

### Pitfall 1: Topology Proves Only Route Reads

**What goes wrong:** `pnpm topology:check` passes but only proves static fixtures, service health, runtime metadata, optional read smoke, and privacy-safe diagnostics. [VERIFIED: scripts/check-local-topology.ts]  
**Why it happens:** The current script predates Go lifecycle ownership and treats live web/Go as optional unless flags are supplied. [VERIFIED: scripts/check-local-topology.ts]  
**How to avoid:** Add a required v1.15 lifecycle mode that creates an exhibition, executes through runtime, persists through Go, refreshes scoring, and fetches Go evidence. [VERIFIED: .planning/REQUIREMENTS.md]  
**Warning signs:** Topology evidence mentions only `fixture_loading`, `go_readonly`, or `web_go_read` and lacks Match/job/Chronicle/scoring identifiers. [VERIFIED: command `pnpm topology:check -- --json`]

### Pitfall 2: Stopped Runtime Looks Like Worker Rollback

**What goes wrong:** A stopped runtime service accidentally causes the old TypeScript worker to claim/complete jobs. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]  
**Why it happens:** The legacy TypeScript worker combines claim, runtime execution, Chronicle build, completion, and failure recording in one process. [VERIFIED: apps/worker/src/runner.ts]  
**How to avoid:** In normal Go-selected mode, TypeScript runtime service must be execution-only and DB-credential-free where practical; stopped runtime must become Go lifecycle failure classification. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md]  
**Warning signs:** Stopped-runtime drill produces completed Chronicles without Go classification evidence, or logs show `apps/worker/src/runner.ts` claiming jobs in normal mode. [VERIFIED: apps/worker/src/runner.ts]

### Pitfall 3: Rollback Starts Before Ownership Switch

**What goes wrong:** Go and TypeScript both claim/complete normal jobs during rollback. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]  
**Why it happens:** DB locking prevents duplicate simultaneous row claims but does not make mixed owners an acceptable operating mode. [VERIFIED: packages/persistence/src/jobs.ts]  
**How to avoid:** Rollback runbook order must be: stop Go orchestration, switch owner to TypeScript rollback mode, then start legacy TypeScript worker. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]  
**Warning signs:** Evidence contains concurrent Go worker IDs and TypeScript worker IDs for the same normal queue window. [VERIFIED: packages/persistence/migrations/0001_initial.sql]

### Pitfall 4: Public Evidence Leaks via Diagnostics

**What goes wrong:** Topology, monitor, or promotion artifacts include source, memory, owner debug, stderr, stack traces, tokens, host paths, or DB DSNs. [VERIFIED: AGENTS.md] [VERIFIED: packages/spec/src/public-output-privacy.ts]  
**Why it happens:** Failure drills are more likely to expose raw errors than happy-path DTOs. [VERIFIED: apps/web/lib/public-go-read-client.ts]  
**How to avoid:** Run public-output leak guards on all generated artifacts and sanitize diagnostic URLs/bearer values. [VERIFIED: scripts/check-local-topology.ts]  
**Warning signs:** Artifacts contain `postgres://`, `Bearer `, `stack trace`, `source`, `strategyMemory`, or `privateDiagnostics`. [VERIFIED: packages/spec/src/public-output-privacy.ts]

### Pitfall 5: Replay Metadata Passes But Board Is Implausible

**What goes wrong:** Public replay metadata exists, but browser replay is clipped, off-board, missing canonical starts, or blank. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]  
**Why it happens:** DTO/schema checks do not inspect rendered canvas geometry. [VERIFIED: apps/web/e2e/replay.visual.spec.ts]  
**How to avoid:** Require both replay readiness realism checks and Playwright visual/canvas-pixel checks against Go-created or Go-completed Match evidence. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts]  
**Warning signs:** Gate evidence includes replay metadata but no browser replay URL, no canvas pixel stats, and no canonical-start check result. [VERIFIED: apps/web/e2e/replay.visual.spec.ts]

## Code Examples

### Source-Safe Diagnostics

```typescript
// Source: scripts/check-local-topology.ts
export const safeDetail = (detail: string): string => {
  let next = detail
  for (const marker of privateMarkers) {
    next = next.split(marker).join("[redacted]")
  }
  next = next.replace(/https?:\/\/[^\s|]+/gi, (match) =>
    sanitizeDiagnosticUrl(match),
  )
  return next.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
}
```

### Report-Only Offense Gate

```typescript
// Source: scripts/check-boundary-monitors.ts
const checkWebBoundary = (): string => {
  const analysis = analyzeServiceBoundaryImports({ repoRoot })
  if (analysis.strictOffenses.length > 0) {
    throw new Error(
      `strict web boundary offenses: ${analysis.strictOffenses.map(offenseKey).join(", ")}`,
    )
  }
  const unknown = findUnknownReportOnlyOffenses(analysis.reportOnlyOffenses)
  if (unknown.length > 0) {
    throw new Error(
      `unknown broad web boundary offenses: ${unknown.join(", ")}`,
    )
  }
  return `${analysis.reportOnlyOffenses.length} known broad web offenses baseline-gated`
}
```

### Job Failure Classification Parity Source

```typescript
// Source: packages/persistence/src/jobs.ts
export const shouldExhaustRetries = (input: {
  attempts: number
  maxAttempts: number
  retryable: boolean
}): boolean => !input.retryable || input.attempts >= input.maxAttempts
```

## State of the Art

| Old Approach | Current / Required Approach | When Changed | Impact |
|--------------|-----------------------------|--------------|--------|
| Fixture/read-only Go topology | Full v1.15 lifecycle topology with Go orchestration, runtime service, Go persistence/scoring, and Go public evidence | Required by Phase 102 after Phases 97-101 | Promotion requires live chain evidence, not just route smoke. [VERIFIED: .planning/REQUIREMENTS.md] |
| TypeScript worker owns claim+execution+completion | Go owns claim/completion/scoring; TypeScript service is execution-only runtime boundary | v1.15 target | Prevents TypeScript from remaining normal DB owner while preserving hostile-code isolation. [VERIFIED: .planning/research/SUMMARY.md] |
| Static route ownership manifest | v1.15 lifecycle ownership manifest | Phase 96 decision | Monitors must validate non-route lifecycle surfaces and TypeScript labels. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Public replay metadata as sufficient replay evidence | Metadata plus replay readiness realism plus browser canvas checks | v1.14 introduced realism checks; Phase 102 must apply them to Go-created/completed evidence | Catches clipped/off-board/missing-start bugs. [VERIFIED: .planning/artifacts/v1.14-promotion-decision.md] [VERIFIED: apps/web/app/matches/replay-ready.ts] |

**Deprecated/outdated:**
- Treating `apps/go-backend/README.md` as current ownership truth is outdated; it still describes Go as read-only and TypeScript as owning MatchSet creation/orchestration, while current code includes live Go auth/account/fork/exhibition routes and v1.15 aims to move lifecycle ownership. [VERIFIED: apps/go-backend/README.md] [VERIFIED: apps/go-backend/live_backend.go] [VERIFIED: .planning/PROJECT.md]
- Treating `pnpm topology:check` static output as promotion-grade v1.15 proof is insufficient; it currently reports optional live web/Go checks as skipped when URLs are absent. [VERIFIED: scripts/check-local-topology.ts] [VERIFIED: command `pnpm topology:check -- --json`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Earlier v1.15 phases will create a `v1.15-lifecycle-ownership-manifest.json` or equivalent machine-readable lifecycle artifact. [ASSUMED] | Recommended Project Structure | If the filename differs, Phase 102 monitors should consume the actual Phase 96 artifact path. |
| A2 | A dedicated TypeScript runtime service command will exist after Phase 98 and can be started/stopped independently from the legacy DB-owning worker. [ASSUMED] | Architecture Patterns | If Phase 98 chooses another harness shape, topology drills must target that actual execution-only boundary. |

## Open Questions

1. **What exact v1.15 lifecycle artifact names will Phases 96-101 produce?**
   - What we know: Phase 96 requires a machine-readable lifecycle ownership manifest and Phase 102 requires final topology/failure/promotion artifacts. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]
   - What's unclear: exact filenames and schema fields are left to implementation discretion. [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md]
   - Recommendation: planner should define artifact filenames in Wave 0 and use them consistently in topology and monitor tasks. [ASSUMED]

2. **How will stopped-runtime-service be triggered locally?**
   - What we know: Phase 98 requires a dedicated execution-only TypeScript runtime service and stopped-service behavior. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md]
   - What's unclear: process name, port, and command are not present in the current codebase before Phase 98. [VERIFIED: rg search for runtime service files]
   - Recommendation: Phase 102 should consume the command/URL/env variables created by Phase 98, not invent a second runtime harness. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm scripts, Next, Vitest, Playwright, tsx | yes | `v24.15.0` | None needed. [VERIFIED: command `node --version`] |
| pnpm | repo scripts | yes | `11.1.2` | None needed. [VERIFIED: command `pnpm --version`] |
| Go | Go backend tests/service | yes | `go1.26.3`; module declares `go 1.25.0` | None needed. [VERIFIED: command `go version`] [VERIFIED: apps/go-backend/go.mod] |
| Docker / Compose | Postgres/Redis services and optional container sandbox evidence | yes | Docker `29.4.3`, Compose `v5.1.3` | Local services can run if Docker daemon is available. [VERIFIED: command `docker --version && docker compose version`] |
| PostgreSQL service | v1.15 topology persistence | yes | `localhost:5432 accepting connections` during audit | `pnpm services:up` starts Compose Postgres. [VERIFIED: command `pg_isready`] [VERIFIED: compose.yaml] |
| Redis CLI/service | existing Compose/preflight support | CLI absent from audit; service not required for Phase 102 core topology | n/a | Skip Redis for lifecycle gate unless a prior phase made it required. [VERIFIED: command probe] [VERIFIED: scripts/preflight.ts] |
| Playwright | browser replay gate | yes | `1.60.0` | No fallback for browser realism gate. [VERIFIED: command `pnpm exec playwright --version`] |
| Vitest | unit/script tests | yes | `4.1.6` | No fallback needed. [VERIFIED: command `pnpm exec vitest --version`] |

**Missing dependencies with no fallback:**
- None found for current repo-local Phase 102 research. [VERIFIED: command probes]

**Missing dependencies with fallback:**
- Redis CLI was not found in the PATH probe, but Phase 102 core topology should not require Redis unless earlier phases add Redis-backed behavior. [VERIFIED: command probe] [VERIFIED: compose.yaml]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.6`, Playwright `1.60.0`, Go test via `go test ./...` [VERIFIED: command probes] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts` [VERIFIED: rg --files] |
| Quick run command | `pnpm topology:check -- --json && pnpm boundary:imports && cd apps/go-backend && go test ./...` [VERIFIED: command probes] |
| Full suite command | `pnpm boundary:monitors && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts replay.visual.spec.ts` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| GATE-01 | Full v1.15 lifecycle topology | integration/smoke | `pnpm topology:check -- --require-v115-lifecycle --json` | no - Wave 0 extension to `scripts/check-local-topology.ts` [VERIFIED: scripts/check-local-topology.ts] |
| GATE-02 | Replay realism and browser canvas evidence | e2e/visual | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts replay.visual.spec.ts` | yes [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| GATE-03 | Stopped-Go no fallback | integration/unit | `pnpm --filter @cowards/web test -- public-go-read-client.test.ts` plus lifecycle drill | partial - client test exists; live drill missing [VERIFIED: apps/web/lib/public-go-read-client.test.ts] |
| GATE-04 | Stopped runtime service classified by Go | integration | `pnpm topology:check -- --require-v115-stopped-runtime --json` | no - depends on Phase 98 runtime service [ASSUMED] |
| GATE-05 | Explicit rollback without mixed DB owners | integration/manual-runbook check | `pnpm topology:check -- --require-v115-rollback --json` | no - Wave 0 extension [ASSUMED] |
| GATE-06 | Boundary monitor failure coverage | unit/integration | `pnpm boundary:monitors` | partial - v1.14 monitors exist; v1.15 lifecycle checks missing [VERIFIED: scripts/check-boundary-monitors.ts] |
| GATE-07 | Promotion/defer artifacts | artifact validation | `pnpm exec tsx scripts/check-boundary-monitors.ts` | partial - v1.14 artifact checks exist; v1.15 checks missing [VERIFIED: scripts/check-boundary-monitors.ts] |
| GATE-08 | Remaining TypeScript ownership limited/labeled | artifact/import monitor | `pnpm boundary:imports && pnpm exec tsx scripts/check-boundary-monitors.ts` | partial - baseline/import monitor exists; lifecycle labels depend on Phase 96 artifact [VERIFIED: command `pnpm boundary:imports`] |

### Sampling Rate

- **Per task commit:** targeted script/unit tests for edited files plus `pnpm boundary:imports` when ownership labels or web imports change. [VERIFIED: package.json]
- **Per wave merge:** `pnpm topology:check -- --json`, relevant Go tests, and relevant web/script Vitest tests. [VERIFIED: scripts/check-local-topology.ts]
- **Phase gate:** `pnpm boundary:monitors`, v1.15 lifecycle topology with live services, stopped-Go drill, stopped-runtime drill, rollback drill, and Playwright replay fixture/visual checks. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] Extend `scripts/check-local-topology.ts` with v1.15 lifecycle, stopped-Go, stopped-runtime, rollback, artifact-write, and artifact-privacy modes. [VERIFIED: scripts/check-local-topology.ts]
- [ ] Extend `scripts/check-local-topology.test.ts` for new v1.15 options and failure classifications. [VERIFIED: scripts/check-local-topology.test.ts]
- [ ] Extend `scripts/check-boundary-monitors.ts` with v1.15 lifecycle manifest, topology/failure/promotion artifact, public-output, no-fallback, and TypeScript-label gates. [VERIFIED: scripts/check-boundary-monitors.ts]
- [ ] Add monitor tests for new lifecycle manifest drift, report-only offense increases, unsafe fallback, runtime ABI drift, and source-safe artifact validation. [VERIFIED: scripts/check-boundary-monitors.test.ts]
- [ ] Add or adapt browser replay evidence to target a Go-created or Go-completed Match from topology output, not only canonical fixture scenarios. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: apps/web/e2e/replay.visual.spec.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Preserve Go selected auth/session cookie handling and never emit raw tokens in artifacts. [VERIFIED: apps/go-backend/live_backend.go] [VERIFIED: packages/spec/src/public-output-privacy.ts] |
| V3 Session Management | yes | Use existing `cowards_session` cookie flow and source-safe session DTOs; no topology artifacts with session IDs. [VERIFIED: apps/go-backend/live_backend.go] [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| V4 Access Control | yes | Owner/private replay debug remains gated; public evidence must not include owner debug or raw Awareness Grid. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| V5 Input Validation | yes | Use Zod/spec schemas for runtime ABI and service DTOs; Go JSON handlers should continue schema/shape/privacy validation. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: apps/web/lib/go-backend-service-client.ts] |
| V6 Cryptography | yes | Do not alter session token/password hashing in Phase 102; existing Go auth uses crypto random tokens and scrypt password hashing. [VERIFIED: apps/go-backend/live_backend.go] |
| V8 Data Protection | yes | Promotion/topology/monitor artifacts must omit source, memories, objectives, debug, stack, stderr, tokens, paths, and DB DSNs. [VERIFIED: AGENTS.md] [VERIFIED: packages/spec/src/public-output-privacy.ts] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Silent TypeScript fallback after Go selection | Spoofing / Repudiation | Selected Go paths must fail closed and emit classified diagnostics; monitors must detect fallback. [VERIFIED: apps/web/lib/public-go-read-client.ts] [VERIFIED: .planning/phases/102-topology-monitors-rollback-and-promotion-gate/102-CONTEXT.md] |
| Mixed DB completion owners | Tampering | Explicit rollback runbook and monitor evidence that only one owner claims/completes normal jobs. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| Runtime diagnostic leak | Information Disclosure | Redact topology details and run public-output leak guards on all artifacts. [VERIFIED: scripts/check-local-topology.ts] [VERIFIED: packages/spec/src/public-output-privacy.ts] |
| Raw Chronicle/private replay exposure | Information Disclosure | Use public replay projection and DTO privacy checks; owner debug only with explicit owner authorization. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |
| Runtime ABI drift | Tampering / Denial of Service | Boundary monitors should assert `STRATEGY_RUNTIME_ABI_VERSION === "strategy-runtime-abi-v1.14"` and schema validation. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: packages/spec/src/runtime.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables, terminology, privacy, and testing expectations.
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - v1.15 scope, requirements, phase sequencing, and current milestone state.
- `.planning/phases/096-.../096-CONTEXT.md` through `.planning/phases/102-.../102-CONTEXT.md` - locked v1.15 phase decisions.
- `.planning/artifacts/v1.14-live-web-go-topology.json`, `.planning/artifacts/v1.14-promotion-decision.md`, `.planning/artifacts/v1.14-route-ownership-manifest.json` - prior topology, promotion, and ownership artifact shapes.
- `scripts/check-local-topology.ts`, `scripts/check-boundary-monitors.ts`, `scripts/check-service-boundary-imports.ts` - current topology and monitor implementation.
- `apps/go-backend/live_backend.go`, `apps/go-backend/main.go`, `apps/go-backend/main_test.go` - current Go backend routes, privacy guard, and tests.
- `apps/web/app/matches/replay-ready.ts`, `apps/web/e2e/replay.fixture.spec.ts`, `apps/web/e2e/replay.visual.spec.ts` - replay privacy/realism/browser validation.
- `packages/spec/src/runtime.ts`, `packages/runtime-js/src/abi-bridge.ts`, `packages/spec/src/public-output-privacy.ts` - runtime ABI and public-output privacy contracts.
- `packages/persistence/src/jobs.ts`, `packages/persistence/src/complete-match.ts`, `packages/persistence/src/matchset-status.ts`, `packages/persistence/src/scoring.ts`, `apps/worker/src/runner.ts` - TypeScript parity and rollback owner code.

### Secondary (MEDIUM confidence)

- Command probes: `pnpm topology:check -- --json`, `pnpm boundary:imports`, `cd apps/go-backend && go test ./...`, version probes for Node/pnpm/Go/Docker/Playwright/Vitest/tsx/Postgres.

### Tertiary (LOW confidence)

- Assumed future artifact names and runtime service command shape; see Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and scripts verified from repo manifests and local commands.
- Architecture: HIGH - phase contexts and code consistently define Go backend ownership with TypeScript runtime boundary.
- Pitfalls: HIGH - derived from existing scripts, route adapters, replay tests, and locked Phase 102 decisions.
- Future artifact names: MEDIUM - Phase 102 allows implementation discretion, so exact names should be adjusted to Phase 96-101 outputs.

**Research date:** 2026-05-24  
**Valid until:** 2026-06-23 for repo-local patterns; re-check after any Phase 96-101 implementation changes.
