# Phase 96: Boundary Baseline and Go Ownership Contract - Research

**Researched:** 2026-05-24 [VERIFIED: system current date]
**Domain:** v1.15 backend ownership baseline, lifecycle ownership manifest, boundary monitor integration, Go/TypeScript ownership split [VERIFIED: .planning/ROADMAP.md]
**Confidence:** HIGH for repo-local ownership, code references, existing monitor behavior, and validation approach; MEDIUM for exact future manifest field names until implementation locks the schema [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md`. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Locked Decisions

## Implementation Decisions

### Ownership Manifest Shape

- **D-01:** Create a new v1.15 lifecycle ownership manifest rather than merely extending the v1.14 route manifest.
- **D-02:** The manifest should cover routes plus job claim/lease, runtime execution handoff, Chronicle persistence, Match completion, MatchSet scoring, public evidence, topology, monitors, fallback policy, and rollback owners.
- **D-03:** The v1.14 route ownership manifest remains canonical prior art, but v1.15 needs a broader lifecycle model because normal backend ownership now crosses non-route surfaces.

### TypeScript Role Labels

- **D-04:** Use strict labels for remaining TypeScript surfaces: `parity_only`, `rollback_only`, `test_only`, `runtime_only`, `deferred`, and `frontend`.
- **D-05:** Reserve `runtime_only` for the isolated JS/TS Strategy execution service or worker.
- **D-06:** A `runtime_only` surface must not own normal DB job claiming, Match completion, Chronicle persistence, MatchSet scoring, or product API fallback behavior.

### No-Fallback And Rollback Semantics

- **D-07:** Every selected Go surface must declare fallback policy, rollback owner, stopped-Go behavior, and stopped-runtime behavior when applicable.
- **D-08:** The default policy is no silent TypeScript backend fallback when Go is selected.
- **D-09:** The manifest must explicitly forbid mixed DB-completing owners for normal product queues. Go and TypeScript workers must not claim or complete the same normal jobs concurrently.
- **D-10:** Rollback is an explicit operator action: stop Go orchestration, switch ownership back to the documented TypeScript rollback owner, and start the legacy TypeScript DB-owning worker only in that rollback mode.

### Baseline Evidence Package

- **D-11:** Phase 96 should produce both a human-readable baseline artifact and a machine-readable v1.15 lifecycle ownership manifest.
- **D-12:** The baseline artifact should record report-only offense count, route ownership, TypeScript job/completion/scoring/replay code references, topology gaps, current monitor gaps, v1.14 artifact links, and exact deferred scopes.
- **D-13:** All baseline and manifest outputs must be public-safe by default: no Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals.

### the agent's Discretion

The agent may choose the exact JSON schema names and Markdown artifact layout, provided the manifest is machine-readable, the baseline is human-auditable, and all fields preserve the labels and no-fallback semantics above.

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
| --- | --- | --- |
| BASE-01 | Developer can inspect a v1.15 baseline covering v1.14 Go-owned routes, TypeScript-owned job/runtime surfaces, public/private replay ownership, broad web report-only offenses, topology evidence, and monitor gaps. | Use `v1.14-route-ownership-manifest.json`, `v1.14-boundary-baseline.*`, current worker/persistence/replay code references, `pnpm boundary:imports`, and monitor gap findings below. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; VERIFIED: pnpm boundary:imports] |
| BASE-02 | Developer can inspect explicit v1.15 non-goals for Go/web/API Strategy execution, Node `vm` security-boundary use, production sandbox replacement, final TypeScript runtime retirement, Go migration/schema ownership, counted non-JS play, owner-debug replay migration, and broad ladder/governance expansion. | Preserve AGENTS non-negotiables, v1.15 out-of-scope items, v1.14 promotion deferrals, and Phase 96 D-13 privacy constraints in the baseline artifact. [VERIFIED: AGENTS.md; VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/artifacts/v1.14-promotion-decision.md] |
| BASE-03 | Developer can inspect a v1.15 route/lifecycle ownership manifest separating Go primary routes, Go orchestration surfaces, TypeScript parity-oracle surfaces, TypeScript runtime execution surfaces, test-only surfaces, rollback owners, and deferred surfaces. | Add a new machine-readable lifecycle manifest rather than only extending the v1.14 route manifest. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| BASE-04 | Developer can verify TypeScript service and persistence behavior is documented as parity oracle or rollback reference rather than the future normal backend path. | Label current TypeScript service/persistence owners explicitly as `parity_only`, `rollback_only`, `runtime_only`, `test_only`, `deferred`, or `frontend`; prevent `runtime_only` from claiming/completing DB jobs. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| BASE-05 | Developer can verify `strict_offenses=0` and the 29 broad web report-only direct persistence offenses are rebaselined before any web cutover work. | `pnpm boundary:imports` currently reports `strict_offenses=0 report_only_offenses=29`; the known baseline is encoded in `scripts/check-boundary-monitors.ts`. [VERIFIED: pnpm boundary:imports; VERIFIED: scripts/check-boundary-monitors.ts:165-195] |
| BASE-06 | Developer can verify the v1.15 plan preserves deterministic engine purity, Strategy Revision immutability, schema validation, replay/public-output privacy, and hostile Strategy isolation. | Carry AGENTS constraints, runtime ABI v1.14 schemas, public-output deny list, and runtime worker ownership into the manifest and monitor checks. [VERIFIED: AGENTS.md; VERIFIED: packages/spec/src/schemas.ts:477-560; VERIFIED: packages/spec/src/public-output-privacy.ts:1-100; VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json] |
</phase_requirements>

## Summary

Phase 96 is a contract and baseline phase, not a Go job-lifecycle implementation phase. It should produce a human-readable v1.15 boundary baseline and a machine-readable v1.15 lifecycle ownership manifest that supersedes route-only ownership for this milestone while preserving v1.14 route ownership as prior art. [VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

Current code already has selected Go-owned product routes and Go-owned exhibition creation. The live Go backend registers public reads, auth/session routes, account revision routes, Starter/Advanced forks, and `POST /matchsets`; `POST /matchsets` inserts `match_sets`, `matches`, `match_jobs`, and `match_set_matches`, but it does not claim jobs, execute Matches, persist Chronicles, or complete MatchSet scoring. [VERIFIED: apps/go-backend/live_backend.go:62-80; VERIFIED: apps/go-backend/live_backend.go:1345-1462]

The main ownership gap is lifecycle ownership after MatchSet creation: TypeScript currently owns job claiming/leasing/failure handling, worker-driven runtime execution, Chronicle persistence, Match completion, and MatchSet scoring refresh. Phase 96 should freeze these references for parity and rollback while making Go the planned normal owner for later phases. [VERIFIED: apps/worker/src/runner.ts:188-231; VERIFIED: packages/persistence/src/jobs.ts:42-227; VERIFIED: packages/persistence/src/complete-match.ts:66-156; VERIFIED: packages/persistence/src/matchset-status.ts:105-183]

**Primary recommendation:** Implement Phase 96 as three artifacts plus monitor integration: `.planning/artifacts/v1.15-boundary-baseline.md`, `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json`, and `scripts/check-boundary-monitors.ts` validation for that manifest. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: scripts/check-boundary-monitors.ts:421-620]

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
- Engine rules require focused unit tests and invariant/property-style tests; replay changes require deterministic reconstruction, integrity tests, board realism checks, and local browser validation for plausible Match starts. [VERIFIED: AGENTS.md]
- Runtime changes require tests for invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, schema validation, and worker classification of strategy failure versus system failure. [VERIFIED: AGENTS.md]
- Planning docs should be committed when updated, but the user explicitly requested no commit for this research turn. [VERIFIED: AGENTS.md; VERIFIED: user request]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
| --- | --- | --- | --- |
| v1.15 lifecycle ownership manifest | Planning artifacts / CI monitor | Go backend, TypeScript service | The manifest is a source-of-truth contract consumed by planners and monitors; it must describe both Go and TypeScript surfaces without changing runtime behavior. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Current Go route ownership baseline | Go backend | Web adapters | Live Go routes exist in `apps/go-backend/live_backend.go`; web adapters select Go via environment switches and fail closed when Go is selected without a backend URL. [VERIFIED: apps/go-backend/live_backend.go:62-80; VERIFIED: apps/web/lib/public-service-adapter.ts:66-96; VERIFIED: apps/web/lib/account-service-adapter.ts:34-87] |
| Current job claim/lease/failure baseline | TypeScript persistence/worker | PostgreSQL | `packages/persistence/src/jobs.ts` owns claim, heartbeat, retry, and failure SQL; `apps/worker/src/runner.ts` invokes it as part of the worker loop. [VERIFIED: packages/persistence/src/jobs.ts:23-227; VERIFIED: apps/worker/src/runner.ts:188-231] |
| Current runtime execution baseline | TypeScript runtime worker/service | Engine/replay packages | Worker code builds runtime-backed Match input from persisted revisions and invokes runtime-js through the ABI bridge; Go must not execute Strategy source. [VERIFIED: apps/worker/src/runner.ts:75-120; VERIFIED: packages/runtime-js/src/abi-bridge.ts:24-80; VERIFIED: AGENTS.md] |
| Current Chronicle persistence baseline | TypeScript persistence | Replay package | `createPostgresChronicleStore` validates Chronicles, derives metadata, stores by Match id, and returns existing rows on conflict. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-190] |
| Current Match completion baseline | TypeScript persistence/worker | PostgreSQL | `completeMatch` requires a running lease, stores a Chronicle, updates Match fields, marks the job complete, and marks the attempt complete inside one transaction. [VERIFIED: packages/persistence/src/complete-match.ts:66-156] |
| Current MatchSet scoring baseline | TypeScript persistence/public DTO | Go public reads | TypeScript `buildPublicMatchSetResultDto` lazily calls `refreshMatchSetStatus`, while Go currently reads stored scoring instead of owning scoring refresh. [VERIFIED: packages/persistence/src/competition.ts:457-640; VERIFIED: apps/go-backend/live_backend.go:974-1036] |
| Public replay projection baseline | Web server / TypeScript replay | Persistence Chronicle store | The web replay server loads persisted Chronicles, projects public or authorized owner replay data, and validates board realism before rendering. [VERIFIED: apps/web/app/matches/server.ts:91-164; VERIFIED: apps/web/app/matches/replay-ready.ts:395-504] |
| Boundary monitor integration | Scripts / CI | Planning artifacts | `pnpm boundary:monitors` composes contract, lint, import, Go parity, sandbox, topology, and boundary monitor checks. [VERIFIED: package.json:13-24] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
| --- | --- | --- | --- |
| TypeScript | 6.0.3 | Existing monorepo language for web, spec, service, persistence, worker, runtime, and monitors. | Already pinned in `package.json`; Phase 96 should extend existing TS monitor/test patterns rather than add tooling. [VERIFIED: package.json:40-52] |
| Vitest | 4.1.6 | Existing unit test framework for scripts, persistence, worker, web adapters, and runtime tests. | Existing tests cover boundary monitors, service-boundary imports, worker ownership, scoring, Chronicle storage, and replay privacy. [VERIFIED: package.json:40-52; VERIFIED: rg test inventory] |
| Go | go1.26.3 local | Existing Go backend implementation and test runner. | Go backend routes and tests already exist; later phases should extend this backend for lifecycle ownership. [VERIFIED: local `go version`; VERIFIED: apps/go-backend/live_backend.go:62-80] |
| PostgreSQL | postgres:18 in compose | Local persistence backing for Matches, jobs, Chronicles, MatchSets, users, and revisions. | Existing compose topology uses PostgreSQL and persistence migrations define lifecycle tables. [VERIFIED: compose.yaml:1-17; VERIFIED: packages/persistence/migrations/0001_initial.sql:64-157] |
| pnpm | 11.1.2 local / package manager pinned as pnpm@11.1.2 | Script runner for contract, import, Go parity, topology, and boundary checks. | Existing root scripts use pnpm for all validation gates. [VERIFIED: local `pnpm --version`; VERIFIED: package.json:6-24] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
| --- | --- | --- | --- |
| Redocly CLI | 2.31.4 | OpenAPI lint for service API artifact. | Run through `pnpm contract:lint` and `pnpm boundary:monitors`; Phase 96 should not bypass it. [VERIFIED: package.json:13-24; VERIFIED: package.json:40-52] |
| Playwright | 1.60.0 | Browser smoke and visual tests. | Phase 96 does not require browser implementation, but later replay/public evidence cutover phases use it for board realism. [VERIFIED: package.json:29-32; VERIFIED: AGENTS.md] |
| Docker | 29.4.3 local | Compose services and optional sandbox evidence. | Required for `pnpm services:up`; container sandbox checks remain evidence-only unless explicitly requested. [VERIFIED: local `docker --version`; VERIFIED: compose.yaml:1-31; VERIFIED: package.json:20-24] |
| jq | system `/usr/bin/jq` | Inspect JSON manifests during research and manual verification. | Useful for manifest audits, but implementation should use TypeScript JSON parsing in monitors. [VERIFIED: local `command -v jq`; VERIFIED: scripts/check-boundary-monitors.ts:225-226] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
| --- | --- | --- |
| Existing JSON planning artifact | YAML/TOML manifest | JSON is already used for route ownership manifests and is parsed directly by TypeScript monitors, so changing formats would add parser work without Phase 96 value. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; VERIFIED: scripts/check-boundary-monitors.ts:225-226] |
| Existing boundary monitor script | New standalone monitor script | The current monitor already validates route manifests, privacy, runtime, topology, and web boundary counts; extending it keeps one CI entry point. [VERIFIED: scripts/check-boundary-monitors.ts:281-620; VERIFIED: package.json:23-24] |
| Existing `pnpm boundary:imports` offense accounting | Manual grep snapshot only | The import guard already parses TS import/export syntax and reports strict/report-only offenses; manual grep would be less precise. [VERIFIED: scripts/check-service-boundary-imports.ts:254-320] |

**Installation:**

```bash
# No new packages for Phase 96.
pnpm install
```

No new dependency is recommended for Phase 96; use existing repo tooling. [VERIFIED: package.json:7-38; VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Version verification:** Local versions were verified with `node --version`, `pnpm --version`, `go version`, `docker --version`, and `command -v jq`; no `npm view` check is needed because Phase 96 should not add or upgrade npm packages. [VERIFIED: local tool probe; VERIFIED: package.json:40-52]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 96 planner input
  |
  v
Read v1.14 baseline artifacts + current code references
  |
  v
Create v1.15 human baseline artifact
  |
  v
Create v1.15 lifecycle ownership manifest
  |
  +--> routes: Go primary / TypeScript rollback / deferred
  +--> lifecycle: job claim, lease, runtime handoff, Chronicle persistence, Match completion, scoring
  +--> TypeScript labels: parity_only, rollback_only, test_only, runtime_only, deferred, frontend
  +--> no-fallback fields: stopped-Go behavior, stopped-runtime behavior, rollback owner
  |
  v
Extend boundary monitor
  |
  +--> validate manifest schema and required lifecycle surfaces
  +--> validate TypeScript runtime_only never owns DB completion surfaces
  +--> validate strict_offenses=0 and report_only_offenses=29 baseline
  +--> validate privacy-safe artifact strings
  |
  v
Phase 97-102 planning consumes locked ownership vocabulary
```

This pattern follows the Phase 96 decision to create a broader lifecycle model because normal backend ownership crosses non-route surfaces. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Recommended Project Structure

```text
.planning/
  artifacts/
    v1.15-boundary-baseline.md              # human-readable baseline and code reference inventory
    v1.15-lifecycle-ownership-manifest.json # machine-readable ownership contract
scripts/
  check-boundary-monitors.ts                # extend to validate the v1.15 lifecycle manifest
  check-boundary-monitors.test.ts           # extend with manifest drift and unsafe owner tests
```

This location matches existing planning artifact and monitor patterns. [VERIFIED: find .planning/artifacts; VERIFIED: scripts/check-boundary-monitors.ts:153-163; VERIFIED: scripts/check-boundary-monitors.test.ts]

### Pattern 1: Lifecycle Manifest Entries

**What:** Use machine-readable entries for each owned capability, not just HTTP routes. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**When to use:** Every route, job lifecycle surface, runtime boundary handoff, Chronicle persistence surface, scoring surface, public evidence surface, monitor, topology check, fallback policy, and rollback owner needs an entry. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Example:**

```json
{
  "surfaceId": "matchJobClaim",
  "surfaceKind": "lifecycle",
  "capability": "job_claim_lease",
  "currentOwner": "typescript_persistence",
  "selectedOwner": "go_backend",
  "typescriptRole": "rollback_only",
  "fallbackPolicy": "no_silent_typescript_backend_fallback",
  "rollbackOwner": "typescript_worker",
  "stoppedGoBehavior": "fail_closed_for_go_selected_normal_jobs",
  "stoppedRuntimeBehavior": "not_applicable_until_runtime_handoff",
  "disallowedScopes": [
    "strategy_execution",
    "mixed_db_completing_owners",
    "public_private_data_leak"
  ],
  "codeReferences": [
    "packages/persistence/src/jobs.ts",
    "apps/worker/src/runner.ts"
  ],
  "evidenceRequired": [
    "parity_reference",
    "no_duplicate_claims",
    "monitor_manifest_validation"
  ]
}
```

The exact field names are discretionary, but the semantics above are locked by Phase 96 context. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Pattern 2: Monitor-Validated Artifact Loading

**What:** Add a `readJson<T>()` path and a `checkV115LifecycleOwnershipManifest()` check to `scripts/check-boundary-monitors.ts`. [VERIFIED: scripts/check-boundary-monitors.ts:225-226; VERIFIED: scripts/check-boundary-monitors.ts:421-620]

**When to use:** Use this for schemaVersion, milestone, required surface ids, allowed TypeScript roles, no-fallback policy, rollback owners, disallowed scopes, evidence lists, and privacy-safe serialized output. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: scripts/check-boundary-monitors.ts:421-620]

**Example:**

```typescript
const checkV115LifecycleOwnershipManifest = (): string => {
  const manifest = readJson<V115LifecycleOwnershipManifest>(
    ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json",
  )
  if (manifest.schemaVersion !== "v1.15-lifecycle-ownership-manifest") {
    throw new Error("v1.15 lifecycle manifest schema version drifted")
  }
  for (const surface of manifest.surfaces) {
    assertMonitorPublicPayload(surface)
    if (surface.selectedOwner === "go_backend") {
      if (surface.fallbackPolicy !== "no_silent_typescript_backend_fallback") {
        throw new Error(`${surface.surfaceId} fallback policy drifted`)
      }
    }
  }
  return `${manifest.surfaces.length} v1.15 lifecycle ownership entries checked`
}
```

Use the existing monitor style rather than a new framework. [VERIFIED: scripts/check-boundary-monitors.ts:281-296; VERIFIED: scripts/check-boundary-monitors.ts:589-620]

### Pattern 3: Baseline Artifact as Human Audit Trail

**What:** Write a Markdown artifact that records the current ownership baseline, exact current code references, report-only offense count, topology evidence limits, monitor gaps, non-goals, and deferred scopes. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**When to use:** Use it as the Phase 97-102 planning reference before any Go lifecycle implementation starts. [VERIFIED: .planning/ROADMAP.md]

**Required baseline evidence:**

- v1.14 route ownership manifest route ids, selected owners, fallback policies, and rollback owners. [VERIFIED: jq v1.14-route-ownership-manifest.json]
- Current TypeScript lifecycle code references for job claim, heartbeat, failure, worker execution, completion, Chronicle persistence, scoring, and replay projection. [VERIFIED: packages/persistence/src/jobs.ts:23-227; VERIFIED: apps/worker/src/runner.ts:188-231; VERIFIED: packages/persistence/src/complete-match.ts:66-156; VERIFIED: packages/persistence/src/chronicle-store.ts:78-190; VERIFIED: packages/persistence/src/scoring.ts:79-152; VERIFIED: apps/web/app/matches/replay-ready.ts:395-504]
- Current `strict_offenses=0 report_only_offenses=29` output from `pnpm boundary:imports`. [VERIFIED: pnpm boundary:imports]
- Current topology limitation: v1.14 topology evidence has optional live web/Go checks and static fixture-oriented checks, not lifecycle proof of Go job execution through runtime and Go persistence. [VERIFIED: .planning/artifacts/v1.14-live-web-go-topology.json; VERIFIED: .planning/research/SUMMARY.md]

### Anti-Patterns to Avoid

- **Route-only manifest:** A route manifest cannot express job claim, runtime handoff, Chronicle persistence, scoring, stopped-runtime behavior, or mixed DB-completing owner risk. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- **Ambiguous TypeScript labels:** Do not use broad labels like "legacy" or "reference" without the locked role labels `parity_only`, `rollback_only`, `test_only`, `runtime_only`, `deferred`, and `frontend`. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- **Silent fallback fields:** Every selected Go surface needs explicit fallback policy and rollback owner; defaulting to TypeScript when Go is selected contradicts Phase 96 decisions. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- **Runtime_only with DB writes:** `runtime_only` must not own normal DB job claiming, Match completion, Chronicle persistence, MatchSet scoring, or product API fallback behavior. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- **Private diagnostics in planning artifacts:** Baseline and manifest output must omit Strategy source, memories, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: packages/spec/src/public-output-privacy.ts:1-100]

## Current Code References

| Area | Current Owner | Code References | Planning Meaning |
| --- | --- | --- | --- |
| Go route registration | Go backend | `apps/go-backend/live_backend.go:62-80` | Existing Go routes include public reads, auth/session, account revisions, forks, and exhibition creation. [VERIFIED: apps/go-backend/live_backend.go:62-80] |
| Go exhibition creation | Go backend | `apps/go-backend/live_backend.go:1345-1462` | Go creates `match_sets`, `competition_entrants`, `matches`, `match_jobs`, and `match_set_matches`, then returns queued MatchSet response. [VERIFIED: apps/go-backend/live_backend.go:1345-1462] |
| Go public MatchSet summary | Go backend read | `apps/go-backend/live_backend.go:238-254`, `apps/go-backend/live_backend.go:974-1036` | Go reads stored MatchSet/scoring/evidence; it does not refresh scoring during the read. [VERIFIED: apps/go-backend/live_backend.go:238-254; VERIFIED: apps/go-backend/live_backend.go:974-1036] |
| Go public replay metadata | Go backend read | `apps/go-backend/live_backend.go:257-290` | Go reads Chronicle metadata from `chronicles` for public replay metadata. [VERIFIED: apps/go-backend/live_backend.go:257-290] |
| Public web Go selection | Web adapter | `apps/web/lib/public-service-adapter.ts:66-205` | Existing selected Go public reads fail closed if `COWARDS_GO_BACKEND_URL` is missing. [VERIFIED: apps/web/lib/public-service-adapter.ts:66-205] |
| Account/fork/exhibition Go selection | Web adapter | `apps/web/lib/account-service-adapter.ts:34-123` | Existing selected Go account and exhibition families use env switches and require Go URL when selected. [VERIFIED: apps/web/lib/account-service-adapter.ts:34-123] |
| Job claim and lease | TypeScript persistence | `packages/persistence/src/jobs.ts:23-116` | Current parity source for `FOR UPDATE SKIP LOCKED`, queued/expired-running selection, lease token, attempt rows, and Match running state. [VERIFIED: packages/persistence/src/jobs.ts:23-116] |
| Heartbeat | TypeScript persistence | `packages/persistence/src/jobs.ts:118-135` | Current heartbeat uses `Date.now()` outside engine logic; Go parity must reject mismatched lease tokens. [VERIFIED: packages/persistence/src/jobs.ts:118-135; VERIFIED: AGENTS.md] |
| Failure/retry | TypeScript persistence | `packages/persistence/src/jobs.ts:137-227` | Current retry exhaustion and `failed_system` Match status behavior. [VERIFIED: packages/persistence/src/jobs.ts:137-227] |
| Worker lifecycle coupling | TypeScript worker | `apps/worker/src/runner.ts:188-231` | Current worker claims DB jobs, loads Match input, builds Chronicle, completes Match, and records failures. [VERIFIED: apps/worker/src/runner.ts:188-231] |
| Runtime input loading | TypeScript worker/runtime-js | `apps/worker/src/runner.ts:75-120` | Current worker loads persisted Strategy Revision source and builds runtime dispatch via `createRuntimeFromRevision`. [VERIFIED: apps/worker/src/runner.ts:75-120] |
| Runtime ABI bridge | TypeScript runtime-js | `packages/runtime-js/src/abi-bridge.ts:24-80` | ABI v1.14 validates revision source hash/bytes before adapter execution and schema-validates response envelopes. [VERIFIED: packages/runtime-js/src/abi-bridge.ts:24-80] |
| Runtime ABI schemas | TypeScript spec | `packages/spec/src/schemas.ts:477-560` | Request/response envelopes, runtime metadata, public runtime metadata, runtime violations, and system failures are schema-owned. [VERIFIED: packages/spec/src/schemas.ts:477-560] |
| Chronicle persistence | TypeScript persistence | `packages/persistence/src/chronicle-store.ts:78-190` | Current parity source for Chronicle validation, hash, metadata, insert conflict behavior, and read-by-Match id. [VERIFIED: packages/persistence/src/chronicle-store.ts:78-190] |
| Match completion | TypeScript persistence | `packages/persistence/src/complete-match.ts:66-156` | Current parity source for lease-gated completion, Chronicle persistence, Match fields, job completion, and attempt completion. [VERIFIED: packages/persistence/src/complete-match.ts:66-156] |
| Match completion field derivation | TypeScript persistence | `packages/persistence/src/complete-match.ts:36-64` | Current parity source for outcome, winner, survivor counts, and survival turns. [VERIFIED: packages/persistence/src/complete-match.ts:36-64] |
| MatchSet scoring | TypeScript persistence | `packages/persistence/src/scoring.ts:79-152` | Current parity source for wins, losses, draws, points, strategy-failure penalty, failed system degradation, and stable tie-breakers. [VERIFIED: packages/persistence/src/scoring.ts:79-152] |
| MatchSet status refresh | TypeScript persistence | `packages/persistence/src/matchset-status.ts:105-183` | Current parity source for `match_sets.status`, `scoring`, `degraded`, and `completed_at` updates. [VERIFIED: packages/persistence/src/matchset-status.ts:105-183] |
| TypeScript public MatchSet DTO | TypeScript persistence/service | `packages/persistence/src/competition.ts:457-640` | Current public DTO builder lazily refreshes MatchSet status before reading DTO fields; this must become parity/rollback, not the normal Go path. [VERIFIED: packages/persistence/src/competition.ts:457-640] |
| Web replay facade | Web server / TypeScript | `apps/web/app/matches/server.ts:91-164` | Current replay server reads persisted Chronicles and controls owner debug authorization. [VERIFIED: apps/web/app/matches/server.ts:91-164] |
| Replay projection and board realism | TypeScript replay/web | `apps/web/app/matches/replay-ready.ts:395-504` | Current public/owner projection and replay board realism validation live in TypeScript. [VERIFIED: apps/web/app/matches/replay-ready.ts:395-504] |
| Report-only offense baseline | Scripts | `scripts/check-boundary-monitors.ts:165-195`, `scripts/check-service-boundary-imports.ts:306-320` | Existing baseline and import analyzer produce `strict_offenses=0 report_only_offenses=29`. [VERIFIED: scripts/check-boundary-monitors.ts:165-195; VERIFIED: scripts/check-service-boundary-imports.ts:306-320; VERIFIED: pnpm boundary:imports] |
| Monitor entry point | Scripts | `scripts/check-boundary-monitors.ts:281-620` | Existing checks validate OpenAPI, public DTO examples, Go fixtures, route manifests, runtime, and v1.14 ownership. [VERIFIED: scripts/check-boundary-monitors.ts:281-620] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| TypeScript import offense detection | Regex-only grep scanner | Existing TypeScript AST-based `check-service-boundary-imports.ts` | It already resolves import/export declarations, strict files, local dependencies, and report-only app files. [VERIFIED: scripts/check-service-boundary-imports.ts:254-320] |
| Public-output privacy checking | New deny-list in Phase 96 artifacts | `assertMonitorPublicPayload` / `assertPublicServiceDtoLeakSafe` / spec public-output deny list | Existing monitor and spec privacy functions already reject forbidden fields and markers. [VERIFIED: scripts/check-boundary-monitors.ts:242-244; VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| Route ownership vocabulary | New owner/fallback terms | Existing v1.14 route manifest terms plus locked Phase 96 lifecycle labels | Prior artifacts already use selected owner, fallback policy, rollback owner, evidence, and disallowed scopes. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Runtime ABI schema | Ad hoc request/response JSON | Existing `StrategyRuntimeRequestEnvelopeSchema` and `StrategyRuntimeResponseEnvelopeSchema` | Runtime ABI v1.14 is already schema-owned and bridged in runtime-js. [VERIFIED: packages/spec/src/schemas.ts:497-560; VERIFIED: packages/runtime-js/src/abi-bridge.ts:24-80] |
| JSON manifest validation | Shell `jq` checks in CI | TypeScript monitor parsing via `readJson<T>()` | Existing monitor already loads JSON artifacts and reports structured failures. [VERIFIED: scripts/check-boundary-monitors.ts:225-226; VERIFIED: scripts/check-boundary-monitors.ts:421-620] |

**Key insight:** Phase 96 should make unsafe ownership mixes mechanically visible, not implement the later Go lifecycle. A manifest without monitor validation will drift as soon as Phase 97 starts changing ownership. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: scripts/check-boundary-monitors.ts:421-620]

## Runtime State Inventory

| Category | Items Found | Action Required |
| --- | --- | --- |
| Stored data | PostgreSQL stores lifecycle state in `matches`, `match_sets`, `chronicles`, `match_jobs`, `match_job_attempts`, `match_set_matches`, and `competition_entrants`. [VERIFIED: packages/persistence/migrations/0001_initial.sql:64-157; VERIFIED: apps/go-backend/live_backend.go:1398-1443] | Phase 96 documentation only; later phases must separate code edits from any data migration or state-owner transition. [VERIFIED: .planning/ROADMAP.md] |
| Live service config | Repo-visible ownership switches include `COWARDS_GO_BACKEND_OWNER`, `COWARDS_GO_PUBLIC_READS`, `COWARDS_GO_PUBLIC_STRATEGY_READS`, `COWARDS_GO_AUTH_SESSION`, `COWARDS_GO_ACCOUNT_REVISIONS`, `COWARDS_GO_ACCOUNT_FORKS`, `COWARDS_GO_EXHIBITIONS`, `COWARDS_GO_BACKEND_URL`, `COWARDS_GO_BACKEND_DATA_MODE`, and `COWARDS_GO_BACKEND_OWNER_TOKENS`. [VERIFIED: rg env scan; VERIFIED: apps/web/lib/public-service-adapter.ts:42-50; VERIFIED: apps/web/lib/account-service-adapter.ts:22-31; VERIFIED: apps/go-backend/main.go:681-715] | Manifest should record selected-owner and stopped-Go behavior for existing switches; no env rename in Phase 96. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| OS-registered state | No systemd, launchd, plist, pm2, crontab, or Task Scheduler registrations were found in repo files searched. [VERIFIED: rg OS-state scan] | None for Phase 96; do not claim external host state was audited beyond repository files. [VERIFIED: rg OS-state scan] |
| Secrets/env vars | `.env.example` exists; `DATABASE_URL`, `COWARDS_GO_BACKEND_OWNER_TOKENS`, container names, and session cookie names are referenced in repo code. [VERIFIED: find .env*; VERIFIED: rg env scan; VERIFIED: apps/web/lib/competitive-session.ts:1-2] | Baseline artifacts must not print actual tokens, sessions, DB DSNs, or private diagnostics. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| Build artifacts | Repo contains `dist`, `.turbo`, `.next`, and package build artifacts; no Phase 96 rename/reinstall requirement was found. [VERIFIED: find build artifacts] | No action for Phase 96. Later implementation plans should avoid relying on stale generated outputs and should run `pnpm boundary:monitors`. [VERIFIED: package.json:23-24] |

## Common Pitfalls

### Pitfall 1: Treating TypeScript runtime ownership as backend ownership

**What goes wrong:** The manifest labels TypeScript runtime execution as a normal backend owner, which permits it to keep claiming/completing DB jobs after Go is selected. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Why it happens:** Current `apps/worker/src/runner.ts` combines DB job claiming, runtime execution, Chronicle creation, Match completion, and failure handling in one loop. [VERIFIED: apps/worker/src/runner.ts:188-231]

**How to avoid:** Split labels in the manifest: runtime execution can be `runtime_only`, but job claim/completion/Chronicle/scoring surfaces must be separate lifecycle entries with Go selected owner and TypeScript rollback owner. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Warning signs:** A `runtime_only` entry lists `match_jobs`, `completeMatch`, `chronicles`, or `match_sets.scoring` as normal owned writes. [VERIFIED: packages/persistence/src/jobs.ts:23-227; VERIFIED: packages/persistence/src/complete-match.ts:66-156; VERIFIED: packages/persistence/src/matchset-status.ts:171-181]

### Pitfall 2: Hiding missing Go scoring behind TypeScript lazy refresh

**What goes wrong:** Public MatchSet reads appear correct because TypeScript `buildPublicMatchSetResultDto` calls `refreshMatchSetStatus`, while Go later reads stored scoring and exposes stale or missing results. [VERIFIED: packages/persistence/src/competition.ts:457-640; VERIFIED: apps/go-backend/live_backend.go:974-1036]

**Why it happens:** Current TypeScript public DTO construction refreshes scoring on read, but Go public result reads use persisted `match_sets.scoring`. [VERIFIED: packages/persistence/src/competition.ts:461; VERIFIED: apps/go-backend/live_backend.go:977-1017]

**How to avoid:** Phase 96 baseline should label TypeScript refresh as parity/rollback and make later Go scoring completion an explicit lifecycle surface. [VERIFIED: .planning/REQUIREMENTS.md]

**Warning signs:** The v1.15 manifest has public MatchSet evidence but no `matchSetScoringRefresh` or equivalent lifecycle surface. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Pitfall 3: Report-only offense count drift

**What goes wrong:** Web cutover planning starts from an unverified import baseline and misses new persistence/runtime imports. [VERIFIED: .planning/REQUIREMENTS.md]

**Why it happens:** Report-only offenses are allowed to remain visible, so failing to re-run `pnpm boundary:imports` can hide drift. [VERIFIED: scripts/check-service-boundary-imports.ts:306-320]

**How to avoid:** Phase 96 should record `strict_offenses=0 report_only_offenses=29` and add a lifecycle monitor that fails on unknown new report-only offenses. [VERIFIED: pnpm boundary:imports; VERIFIED: scripts/check-boundary-monitors.ts:165-240]

**Warning signs:** New report-only output is not in `knownReportOnlyBoundaryOffenses` or the count changes without an explicit baseline update. [VERIFIED: scripts/check-boundary-monitors.ts:165-240]

### Pitfall 4: Stopped-Go fallback ambiguity

**What goes wrong:** A selected Go route or lifecycle surface silently falls back to TypeScript backend behavior when Go is unavailable. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Why it happens:** Existing web adapters can call local TypeScript services when Go is not selected, so selected-owner logic must fail closed when Go is selected but unavailable. [VERIFIED: apps/web/lib/public-service-adapter.ts:136-205; VERIFIED: apps/web/lib/account-service-adapter.ts:89-123]

**How to avoid:** Every selected Go surface needs `fallbackPolicy`, `rollbackOwner`, `stoppedGoBehavior`, and monitor assertions. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Warning signs:** Manifest entries omit `fallbackPolicy` or use `typescript_service` as an automatic fallback for selected Go surfaces. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Pitfall 5: Public artifacts leaking private markers

**What goes wrong:** Baseline or manifest files contain private field names, tokens, Strategy source, stack traces, DB DSNs, or private runtime internals. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**Why it happens:** Planning artifacts are easy to treat as internal, but Phase 96 explicitly requires public-safe outputs. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

**How to avoid:** Run manifest entries through `assertMonitorPublicPayload` or equivalent public-output guard in the monitor. [VERIFIED: scripts/check-boundary-monitors.ts:242-244; VERIFIED: packages/spec/src/public-output-privacy.ts:65-100]

**Warning signs:** Serialized artifacts include fields such as `source`, `strategyMemory`, `ownerDebug`, `privateDiagnostics`, `sessionId`, `databaseUrl`, or markers such as `postgres://` or `Bearer `. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-52]

## Code Examples

### Manifest Surface Validation

```typescript
const allowedTypeScriptRoles = new Set([
  "parity_only",
  "rollback_only",
  "test_only",
  "runtime_only",
  "deferred",
  "frontend",
])

for (const surface of manifest.surfaces) {
  if (!allowedTypeScriptRoles.has(surface.typescriptRole)) {
    throw new Error(`${surface.surfaceId} has invalid TypeScript role`)
  }
  if (
    surface.typescriptRole === "runtime_only" &&
    surface.disallowedScopes.includes("db_completion") === false
  ) {
    throw new Error(`${surface.surfaceId} runtime_only must forbid DB completion`)
  }
}
```

This validation directly encodes Phase 96 role-label decisions. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

### Baseline Offense Assertion

```typescript
const analysis = analyzeServiceBoundaryImports()
if (analysis.strictOffenses.length !== 0) {
  throw new Error(`strict_offenses=${analysis.strictOffenses.length}`)
}
const unknown = findUnknownReportOnlyOffenses(analysis.reportOnlyOffenses)
if (unknown.length > 0) {
  throw new Error(`unknown report-only offenses: ${unknown.join(", ")}`)
}
```

This should reuse existing analyzer and unknown-offense logic. [VERIFIED: scripts/check-service-boundary-imports.ts:306-320; VERIFIED: scripts/check-boundary-monitors.ts:233-240]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
| --- | --- | --- | --- |
| Route-only Go parity fixtures and route manifest | v1.14 selected Go routes plus runtime ABI and artifact-backed forks | v1.14 shipped 2026-05-23 | Phase 96 must keep v1.14 route manifest as prior art but add lifecycle ownership surfaces. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json] |
| TypeScript service as normal product backend for selected public/account/exhibition routes | Selected Go backend routes with no fallback when Go is selected | v1.13 and v1.14 | v1.15 should document TypeScript service as parity/rollback, not normal future backend path. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/artifacts/v1.14-promotion-decision.md] |
| TypeScript worker owns full Match lifecycle | Target v1.15 flow is web frontend -> Go backend -> TypeScript runtime boundary -> Go persistence/public evidence | v1.15 initialized 2026-05-24 | Phase 96 must define ownership vocabulary before Phase 97 changes job lifecycle. [VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/research/SUMMARY.md] |

**Deprecated/outdated:**

- Treating `apps/worker/src/runner.ts` as the normal future owner for DB job claiming/completion is outdated for v1.15 planning; it remains the current parity/rollback reference until later phases migrate ownership. [VERIFIED: .planning/research/SUMMARY.md; VERIFIED: apps/worker/src/runner.ts:188-231]
- Treating v1.14 topology evidence as full lifecycle proof is outdated for v1.15; v1.14 topology is useful prior evidence but not proof of Go job execution, Go Chronicle persistence, or Go scoring completion. [VERIFIED: .planning/artifacts/v1.14-live-web-go-topology.json; VERIFIED: .planning/ROADMAP.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
| --- | --- | --- | --- |
| None | All research claims are sourced from repo files, command output, or explicit phase context. | All sections | No user confirmation needed before planning beyond normal plan review. [VERIFIED: repo inspection and command output] |

## Open Questions

1. **What exact JSON schema name should implementation choose for the v1.15 lifecycle manifest?** [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - What we know: The manifest must be machine-readable and broader than route ownership. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - What's unclear: Exact field names are left to the agent's discretion. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - Recommendation: Use `schemaVersion: "v1.15-lifecycle-ownership-manifest"` and `surfaces[]` entries with route/lifecycle/topology/monitor/public-evidence kinds. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

2. **Should Phase 96 create monitor enforcement in the same plan as artifacts?** [VERIFIED: .planning/ROADMAP.md]
   - What we know: Phase 96 has one plan and success criteria include monitor gaps and baseline evidence. [VERIFIED: .planning/ROADMAP.md]
   - What's unclear: The context says Phase 96 should extend or prepare monitor integration; it does not mandate whether monitor enforcement is fully blocking in this phase. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - Recommendation: Make monitor validation blocking now for manifest shape, required surfaces, no-fallback fields, allowed TypeScript roles, privacy-safe serialization, and current offense baseline. [VERIFIED: scripts/check-boundary-monitors.ts:281-620]

3. **How much current code should baseline duplicate versus link?** [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - What we know: The baseline should record exact code references. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - What's unclear: It does not prescribe full excerpts. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - Recommendation: Link file paths and line-level responsibilities; do not copy long code into planning artifacts. [VERIFIED: code reference inventory above]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| --- | --- | --- | --- | --- |
| Node.js | pnpm/tsx monitor and tests | yes | v24.15.0 | Blocking if missing. [VERIFIED: local tool probe] |
| pnpm | project scripts | yes | 11.1.2 | Blocking if missing. [VERIFIED: local tool probe; VERIFIED: package.json:6] |
| Go | Go backend tests through `pnpm go:parity` / `go test ./...` | yes | go1.26.3 darwin/amd64 | Blocking for full boundary monitors; Phase 96 docs can still be edited but not fully verified. [VERIFIED: local tool probe; VERIFIED: package.json:17] |
| Docker | local PostgreSQL/Redis compose and optional sandbox evidence | yes | 29.4.3 | Static tests can run without live services; topology/service verification needs Docker or equivalent running services. [VERIFIED: local tool probe; VERIFIED: compose.yaml:1-31] |
| jq | manual manifest inspection | yes | system `/usr/bin/jq` | Use TypeScript monitor parsing; jq is not required in CI. [VERIFIED: local tool probe; VERIFIED: scripts/check-boundary-monitors.ts:225-226] |
| PostgreSQL | integration topology and future lifecycle state | configured via compose | postgres:18 image | Live DB unavailable blocks topology/e2e, not artifact authoring. [VERIFIED: compose.yaml:1-17] |
| Redis | compose service | configured via compose | redis:8 image | Not directly required for Phase 96 artifacts; included by local services. [VERIFIED: compose.yaml:19-31] |

**Missing dependencies with no fallback:** None found in local probes. [VERIFIED: local tool probe]

**Missing dependencies with fallback:** None found in local probes. [VERIFIED: local tool probe]

## Validation Architecture

### Test Framework

| Property | Value |
| --- | --- |
| Framework | Vitest 4.1.6 for TypeScript tests; Go `go test` for Go backend tests. [VERIFIED: package.json:40-52; VERIFIED: local tool probe] |
| Config file | `vitest.config.ts`; Go uses package-local `go test ./...`. [VERIFIED: repo file list; VERIFIED: package.json:17] |
| Quick run command | `pnpm boundary:imports && pnpm exec tsx scripts/check-boundary-monitors.ts` [VERIFIED: package.json:15; VERIFIED: package.json:24] |
| Full suite command | `pnpm boundary:monitors` [VERIFIED: package.json:24] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
| --- | --- | --- | --- | --- |
| BASE-01 | Baseline artifact includes current Go route, TypeScript lifecycle, replay ownership, topology, and monitor gaps. | artifact + unit | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | yes, extend existing file. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| BASE-02 | Non-goals are present and public-safe. | unit | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | yes, extend existing file. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| BASE-03 | Lifecycle manifest contains required route/lifecycle/runtime/replay/scoring/topology/monitor surfaces and owners. | unit + monitor | `pnpm exec tsx scripts/check-boundary-monitors.ts` | yes, extend existing monitor. [VERIFIED: scripts/check-boundary-monitors.ts] |
| BASE-04 | TypeScript surfaces are labeled with locked roles and not treated as normal future backend. | unit + monitor | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | yes, extend existing file. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| BASE-05 | `strict_offenses=0 report_only_offenses=29` is verified. | script | `pnpm boundary:imports` | yes. [VERIFIED: package.json:15; VERIFIED: pnpm boundary:imports] |
| BASE-06 | Determinism, immutability, schema validation, public privacy, and hostile-code isolation constraints remain explicit. | unit + monitor | `pnpm exec tsx scripts/check-boundary-monitors.ts` | yes, extend existing monitor. [VERIFIED: scripts/check-boundary-monitors.ts; VERIFIED: AGENTS.md] |

### Sampling Rate

- **Per task commit:** `pnpm boundary:imports && pnpm exec vitest run scripts/check-boundary-monitors.test.ts` [VERIFIED: package.json:15; VERIFIED: scripts/check-boundary-monitors.test.ts]
- **Per wave merge:** `pnpm boundary:monitors` [VERIFIED: package.json:24]
- **Phase gate:** `pnpm boundary:monitors` plus inspect `.planning/artifacts/v1.15-boundary-baseline.md` and `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json`. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: package.json:24]

### Wave 0 Gaps

- [ ] `.planning/artifacts/v1.15-boundary-baseline.md` - new human baseline artifact for BASE-01, BASE-02, BASE-04, BASE-05, and BASE-06. [VERIFIED: phase context requires new baseline artifact]
- [ ] `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - new machine-readable manifest for BASE-03 and downstream phases. [VERIFIED: phase context requires new manifest]
- [ ] `scripts/check-boundary-monitors.ts` - extend existing monitor for v1.15 lifecycle manifest shape and safety. [VERIFIED: scripts/check-boundary-monitors.ts]
- [ ] `scripts/check-boundary-monitors.test.ts` - add failing-drift tests for missing surfaces, invalid TypeScript role, fallback drift, mixed DB-completing owners, and private marker leaks. [VERIFIED: scripts/check-boundary-monitors.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
| --- | --- | --- |
| V2 Authentication | yes for selected auth/account surfaces | Keep auth/session route owners and bearer/cookie behavior explicit in the manifest; do not expose session tokens in artifacts. [VERIFIED: apps/go-backend/live_backend.go:70-76; VERIFIED: apps/web/lib/account-service-adapter.ts:34-123; VERIFIED: packages/spec/src/public-output-privacy.ts:21-30] |
| V3 Session Management | yes for session route baseline | Manifest should identify auth/session selected owner and rollback owner, and public artifacts must omit session ids/tokens. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json; VERIFIED: packages/spec/src/public-output-privacy.ts:21-30] |
| V4 Access Control | yes for owner/private source and owner replay surfaces | Keep owner-private Strategy source retrieval and owner debug replay out of public evidence by default. [VERIFIED: AGENTS.md; VERIFIED: apps/web/app/matches/server.ts:135-151] |
| V5 Input Validation | yes | Runtime ABI and public DTOs are schema-owned; manifest should be monitor-validated. [VERIFIED: packages/spec/src/schemas.ts:497-560; VERIFIED: scripts/check-boundary-monitors.ts:281-620] |
| V6 Cryptography | yes, but not changed by Phase 96 | Do not alter password/session/hash behavior in this phase; baseline only. [VERIFIED: .planning/ROADMAP.md; VERIFIED: packages/spec/src/public-output-privacy.ts:21-41] |
| V8 Data Protection | yes | Use existing public-output forbidden-field and marker guards for artifacts and monitor payloads. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| V10 Malicious Code | yes | Do not execute Strategy code in Go or web/API; keep hostile Strategy execution in TypeScript runtime boundary. [VERIFIED: AGENTS.md; VERIFIED: packages/runtime-js/src/abi-bridge.ts:24-80] |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
| --- | --- | --- |
| Silent TypeScript fallback when Go is selected | Tampering / Repudiation | Manifest requires `fallbackPolicy`, stopped-Go behavior, and rollback owner; monitor fails on missing/unsafe fallback fields. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Mixed DB-completing owners | Tampering / Denial of Service | Manifest explicitly forbids Go and TypeScript workers claiming/completing the same normal queue concurrently. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Strategy source or private replay data in public artifacts | Information Disclosure | Use public-output guards and avoid copying source/private diagnostics into baseline files. [VERIFIED: packages/spec/src/public-output-privacy.ts:1-100] |
| Runtime boundary drift | Elevation of Privilege | Keep ABI v1.14 schema and TypeScript runtime-only ownership explicit; do not promote Go/web/API execution. [VERIFIED: packages/spec/src/schemas.ts:497-560; VERIFIED: AGENTS.md] |
| Report-only import creep | Tampering | Keep `strict_offenses=0`, known 29 report-only offenses, and unknown-offense failure logic. [VERIFIED: pnpm boundary:imports; VERIFIED: scripts/check-boundary-monitors.ts:165-240] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - non-negotiables, build order, and testing expectations. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md` - current v1.15 milestone and v1.14 shipped state. [VERIFIED: .planning/PROJECT.md]
- `.planning/REQUIREMENTS.md` - BASE-01 through BASE-06 and v1.15 traceability. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/ROADMAP.md` - Phase 96 goal, success criteria, and phase sequencing. [VERIFIED: .planning/ROADMAP.md]
- `.planning/STATE.md` - current milestone state, workflow settings, and blocker warnings. [VERIFIED: .planning/STATE.md]
- `.planning/research/SUMMARY.md` - v1.15 repo-local synthesis and recommended ownership flow. [VERIFIED: .planning/research/SUMMARY.md]
- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` - locked Phase 96 decisions. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- `.planning/artifacts/v1.14-route-ownership-manifest.json` - prior route ownership and runtime boundary manifest. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json]
- `.planning/artifacts/v1.14-boundary-baseline.md` and `.planning/artifacts/v1.14-boundary-baseline.json` - prior baseline and deferred surfaces. [VERIFIED: .planning/artifacts/v1.14-boundary-baseline.md; VERIFIED: .planning/artifacts/v1.14-boundary-baseline.json]
- `.planning/artifacts/v1.14-promotion-decision.md` and `.planning/milestones/v1.14-MILESTONE-AUDIT.md` - promoted/deferred evidence and audit results. [VERIFIED: .planning/artifacts/v1.14-promotion-decision.md; VERIFIED: .planning/milestones/v1.14-MILESTONE-AUDIT.md]
- Current code files listed in `## Current Code References`. [VERIFIED: repo inspection]
- `pnpm boundary:imports` output - current strict/report-only offense count. [VERIFIED: command output]

### Secondary (MEDIUM confidence)

- Local tool probes for Node, pnpm, Go, Docker, and jq versions. These are accurate for this machine on 2026-05-24 but may differ on another developer machine. [VERIFIED: local tool probe]

### Tertiary (LOW confidence)

- None. [VERIFIED: source review]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - versions and scripts are from local files and local tool probes; no new dependencies recommended. [VERIFIED: package.json; VERIFIED: local tool probe]
- Architecture: HIGH - ownership boundaries are explicit in Phase 96 context, v1.14 artifacts, and current code. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md; VERIFIED: current code references]
- Pitfalls: HIGH - risks are directly tied to current worker/persistence/replay implementation and locked Phase 96 decisions. [VERIFIED: apps/worker/src/runner.ts:188-231; VERIFIED: packages/persistence/src/competition.ts:457-640; VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- Validation: HIGH - existing scripts/tests are present and `pnpm boundary:imports` was run successfully. [VERIFIED: package.json:15-24; VERIFIED: pnpm boundary:imports]

**Research date:** 2026-05-24 [VERIFIED: system current date]
**Valid until:** Revalidate before planning if any ownership, monitor, web adapter, Go backend, worker, persistence, replay, or requirement file changes; re-run `pnpm boundary:imports` before implementation planning starts. [VERIFIED: command output; VERIFIED: current code reference inventory]
