# Phase 103: TypeScript Backend Inventory and Retirement Contract - Research

**Researched:** 2026-05-24 [VERIFIED: environment current_date]
**Domain:** TypeScript backend retirement inventory, ownership contract artifacts, scanner design, Go-baseline boundary enforcement [VERIFIED: .planning/ROADMAP.md]
**Confidence:** HIGH for repo-local code surfaces and v1.15 artifacts; MEDIUM for final deletion/quarantine order because Phase 103 creates the contract before later phases execute removals. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Inventory Artifacts
- **D-01:** Produce both a machine-readable JSON manifest and a human-readable markdown matrix for the v1.16 TypeScript backend retirement inventory.
- **D-02:** Treat the JSON manifest as the future monitor/topology input surface; treat the markdown matrix as the human audit and planning review surface.
- **D-03:** Inventory coverage must include Next.js API routes, TypeScript server modules, direct persistence imports, `@cowards/service` normal runtime uses, worker/job lifecycle code, replay/public evidence code, test-support/parity-only paths, rollback-only paths, runtime-service paths, and frontend-only paths.

### Allowed TypeScript Roles
- **D-04:** Use a strict role taxonomy only: `frontend-only`, `runtime-service`, `runtime-adapter`, `parity-only`, `fixture-only`, `test-only`, `rollback-only`, `deferred`, `quarantined`, or `deleted`.
- **D-05:** Do not permit `typescript-backend`, vague `legacy`, or normal backend owner labels after v1.15.
- **D-06:** Every `deferred` and `rollback-only` entry must include an owner, reason, gate, risk, and future migration note.

### Retirement Action Policy
- **D-07:** Default to deleting unused TypeScript backend-like code when nothing in the milestone needs it.
- **D-08:** Quarantine code when it is still needed for rollback, parity, fixtures, or tests, and make the gate explicit.
- **D-09:** Relabel product surfaces only when they are intentionally deferred; avoid a generic keep-for-maybe category.

### Monitor Coupling
- **D-10:** Shape Phase 103 manifest fields so Phase 108 can consume them directly for `pnpm boundary:monitors` and `pnpm topology:check` no-TypeScript-backend enforcement.
- **D-11:** Phase 103 does not need to make every monitor strict yet, but it must design fields for ownership, allowed role, fallback policy, privacy risk, route/runtime linkage, and enforcement status.

### the agent's Discretion
The agent may choose the exact JSON schema field names, markdown grouping, scanner implementation, and artifact filenames, provided the artifacts are deterministic, reviewable, and easy for later monitor scripts to consume.

### Deferred Ideas (OUT OF SCOPE)
Implementing the future language-neutral Strategy Execution Service / Runtime Broker is out of scope for Phase 103 and v1.16, but the inventory should use names and fields that keep that future abstraction clear.
</user_constraints>

## Summary

Phase 103 should create the source of truth for TypeScript backend retirement, not retire the backend surfaces itself. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] The implementation should add a deterministic scanner plus two generated/reviewable artifacts: `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md`. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] The scanner should combine AST-discovered surfaces with an explicit classification overlay so every discovered backend-like TypeScript surface has exactly one allowed role and no normal TypeScript backend label. [VERIFIED: scripts/check-service-boundary-imports.ts]

The v1.15 baseline already records Go as owner for selected normal orchestration, Match job lifecycle, Match completion, Chronicle persistence, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] The v1.16 inventory should treat TypeScript service/backend code as parity, fixture, rollback, test, frontend support, runtime service, runtime adapter, deferred, quarantined, or deleted only. [VERIFIED: .planning/REQUIREMENTS.md]

**Primary recommendation:** Build `scripts/generate-typescript-backend-inventory.ts` as a deterministic AST scanner, seed classifications from `.planning/artifacts/v1.15-typescript-surface-labels.json`, fail if any discovered route/import/root is unclassified, and emit the two v1.16 artifacts above. [VERIFIED: scripts/check-service-boundary-imports.ts] [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json]

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not live in React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Strategy code must be treated as hostile and runtime boundaries must be schema-validated. [VERIFIED: AGENTS.md]
- Canonical terminology must be preserved: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or SoldierMemory by default. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board realism checks for in-bounds visible Soldiers and terrain, canonical starts, and plausible browser replay starts. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BASE-01 | Inspect a v1.16 inventory of every remaining TypeScript backend-like surface. [VERIFIED: .planning/REQUIREMENTS.md] | Use scanner roots and manifest schema in this research. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| BASE-02 | Inspect a v1.16 ownership manifest with allowed TypeScript roles and no normal TypeScript backend role. [VERIFIED: .planning/REQUIREMENTS.md] | Use strict role taxonomy from Phase 103 context. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] |
| BASE-03 | Treat v1.15 Go ownership as backend baseline. [VERIFIED: .planning/REQUIREMENTS.md] | Seed from v1.15 lifecycle/topology/promotion artifacts. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |
| BASE-04 | Document TypeScript service/backend as parity, fixture, rollback, frontend support, or isolated runtime only. [VERIFIED: .planning/REQUIREMENTS.md] | Classify `@cowards/service`, `apps/worker`, and persistence lifecycle modules with allowed roles only. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] |
| BASE-05 | Preserve explicit v1.16 non-goals. [VERIFIED: .planning/REQUIREMENTS.md] | Copy non-goals into manifest `globalPolicies` and markdown matrix. [VERIFIED: .planning/REQUIREMENTS.md] |
| BASE-06 | Preserve determinism, immutability, schema validation, privacy, isolation, rollback clarity, and no silent fallback. [VERIFIED: .planning/REQUIREMENTS.md] | Include privacy/fallback/runtime fields and validation tests. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| TypeScript surface discovery | Planning / Scripts | Source tree | Scanner reads repo files and emits planning artifacts; it must not change runtime behavior. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] |
| Normal backend ownership baseline | API / Backend (Go) | Database / Storage | v1.15 promoted Go for orchestration, completion, Chronicle persistence, scoring, selected exhibition, and public evidence. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md] |
| Web frontend adapters | Browser / Client plus Frontend Server | API / Backend (Go) | Next.js routes/pages can remain frontend adapters when they call Go contracts and fail closed. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] |
| JS/TS Strategy execution | Isolated Runtime Service | Runtime Adapter | `apps/runtime-service` exposes `/health` and `/execute-match`, validates runtime requests, and uses `@cowards/runtime-js` adapters. [VERIFIED: apps/runtime-service/src/server.ts] |
| TypeScript rollback/parity/test paths | Planning / Scripts | API / Backend (TypeScript, non-normal) | v1.15 allows TypeScript worker/service only as explicit rollback, parity, test, fixture, deferred, or runtime-only surfaces. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |
| Public replay/evidence rendering | Frontend Server / Browser | API / Backend (Go) | Web replay code can render public Go evidence and still has private owner-debug TypeScript Chronicle paths that must be labeled. [VERIFIED: apps/web/app/matches/server.ts] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| TypeScript | `^6.0.3` | AST parsing and type-aware source scanning. [VERIFIED: package.json] | Existing checker already imports `typescript` and parses imports with `ts.createSourceFile`. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| tsx | `^4.21.0` | Run repository TypeScript scripts. [VERIFIED: apps/runtime-service/package.json] | Existing scripts use `#!/usr/bin/env -S pnpm exec tsx`. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| Vitest | `^4.1.6` | Unit tests for scanner/monitor behavior. [VERIFIED: package.json] | Existing monitor tests are Vitest tests under `scripts/*.test.ts`. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| pnpm | `11.1.2` | Workspace script runner. [VERIFIED: package.json] [VERIFIED: local command `pnpm --version`] | Existing commands use `pnpm boundary:imports`, `pnpm topology:check`, and `pnpm boundary:monitors`. [VERIFIED: package.json] |
| Go backend | `go1.26.3` local | Baseline backend owner to reference, not modify in Phase 103. [VERIFIED: local command `go version`] | v1.15 artifacts identify Go as selected owner for normal lifecycle/evidence surfaces. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Next.js | `^16.2.6` | Source roots for App Router API routes and pages. [VERIFIED: apps/web/package.json] | Scanner should discover `apps/web/app/api/**/route.ts` and server/page imports. [VERIFIED: local command `find apps/web/app/api -name route.ts`] |
| `@cowards/spec` | workspace | Schemas, service routes, runtime ABI constants. [VERIFIED: packages/spec/package.json] | Manifest validation should cite `strategy-runtime-abi-v1.14` and runtime service schemas. [VERIFIED: packages/spec/src/runtime.ts] |
| `@cowards/service` | workspace | TypeScript service facade backed by persistence. [VERIFIED: packages/service/package.json] | Inventory must classify uses as parity/fixture/rollback/deferred, not normal backend. [VERIFIED: packages/service/src/index.ts] |
| `@cowards/persistence` | workspace | TypeScript DB lifecycle/read/write modules. [VERIFIED: packages/persistence/package.json] | Inventory must classify exports and direct imports by retirement action. [VERIFIED: packages/persistence/src/index.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AST scanner with explicit overlay | `rg`-only text scan | Existing checker uses AST import extraction, which avoids missing local import chains and keeps output deterministic. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| Generated JSON plus markdown | Markdown-only inventory | Phase 103 decisions require JSON for future monitors and markdown for human audit. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] |

## Recommended Artifacts

| Artifact | Role | Required Contents |
|----------|------|-------------------|
| `.planning/artifacts/v1.16-typescript-backend-inventory.json` | Machine-readable monitor/topology input. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] | Schema/version, allowed roles, global policies, baseline refs, scanner roots, all discovered surfaces, classifications, gates, risks, source evidence, and enforcement status. [VERIFIED: scripts/check-boundary-monitors.ts] |
| `.planning/artifacts/v1.16-typescript-backend-inventory.md` | Human-readable matrix for planning/audit. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] | Grouped rows by route family/root with owner, role, action, gate, risk, future migration note, and source refs. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] |
| `scripts/generate-typescript-backend-inventory.ts` | Deterministic generator/checker. [VERIFIED: scripts/check-service-boundary-imports.ts] | Reuse AST walking/import extraction style from `check-service-boundary-imports.ts`; support `--check`; fail on unclassified discovered surfaces. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| `scripts/generate-typescript-backend-inventory.test.ts` | Scanner contract tests. [VERIFIED: scripts/check-boundary-monitors.test.ts] | Assert route discovery, import classification, allowed role set, no `typescript-backend` label, and stale artifact detection. [VERIFIED: vitest.config.ts] |

## Manifest Schema

Use this top-level shape for the JSON manifest. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]

```json
{
  "schemaVersion": "v1.16-typescript-backend-inventory",
  "milestone": "v1.16",
  "generatedAt": "2026-05-24",
  "allowedRoles": [
    "frontend-only",
    "runtime-service",
    "runtime-adapter",
    "parity-only",
    "fixture-only",
    "test-only",
    "rollback-only",
    "deferred",
    "quarantined",
    "deleted"
  ],
  "globalPolicies": {
    "normalTypeScriptBackendAllowed": false,
    "fallbackPolicy": "no_silent_typescript_backend_fallback",
    "goBaselineArtifact": ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json",
    "strategyRuntimeAbi": "strategy-runtime-abi-v1.14",
    "runtimeExecutionService": "runtime-execution-service-v1.15",
    "goExecutesStrategyCode": false,
    "webExecutesStrategyCode": false,
    "nodeVmSecurityBoundaryAllowed": false,
    "nodeWasiUntrustedSandboxAllowed": false,
    "publicOutputForbiddenByDefault": []
  },
  "scanner": {
    "roots": [],
    "generatedBy": "scripts/generate-typescript-backend-inventory.ts",
    "strictBoundaryOffenses": 0,
    "reportOnlyBoundaryOffenses": 29
  },
  "surfaces": []
}
```

Each `surfaces[]` item should include: `id`, `path`, `kind`, `role`, `retirementAction`, `owner`, `reason`, `gate`, `risk`, `futureMigration`, `currentOwner`, `normalBackendOwner`, `fallbackPolicy`, `privacyClass`, `enforcementStatus`, `routeMethods`, `routePath`, `routeFamily`, `goRouteIds`, `imports`, `persistenceImports`, `serviceImports`, `runtimeImports`, `localBackendImports`, `usesDatabase`, `claimsJobs`, `completesMatches`, `persistsChronicles`, `refreshesScoring`, `servesPublicEvidence`, `executesStrategy`, `ownerDebugAccess`, `testOnlyGate`, `rollbackGate`, `deferredGate`, `sourceRefs`, and `scannerFindings`. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: apps/web/app/matches/server.ts]

For `deferred` and `rollback-only`, require non-empty `owner`, `reason`, `gate`, `risk`, and `futureMigration`. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]

## Scanner Approach

1. Discover all Next.js API routes with `apps/web/app/api/**/route.ts` and parse exported HTTP functions (`GET`, `POST`, `DELETE`) with TypeScript AST. [VERIFIED: local command `find apps/web/app/api -name route.ts`] [VERIFIED: scripts/check-service-boundary-imports.ts]
2. Walk `apps/web/app/**/*.ts(x)`, `apps/web/lib/**/*.ts`, `apps/worker/src/**/*.ts`, `apps/runtime-service/src/**/*.ts`, `packages/persistence/src/**/*.ts`, `packages/service/src/**/*.ts`, and `packages/runtime-js/src/**/*.ts` while excluding build outputs. [VERIFIED: scripts/check-service-boundary-imports.ts]
3. Extract static `import`/`export ... from` statements and local import chains with the existing `ts.createSourceFile` pattern. [VERIFIED: scripts/check-service-boundary-imports.ts]
4. Mark backend-like indicators when a file imports `@cowards/persistence`, `@cowards/service`, `@cowards/runtime-js`, `apps/worker`, `competitive/server`, `matches/server`, or migration/worker symbols. [VERIFIED: scripts/check-service-boundary-imports.ts]
5. Overlay explicit classifications for known route families and roots, seeded from `.planning/artifacts/v1.15-typescript-surface-labels.json`. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json]
6. Fail `--check` when a discovered API route, direct persistence import, service import, worker root, runtime-service root, runtime-js adapter root, or public replay/evidence path has no manifest row. [VERIFIED: .planning/REQUIREMENTS.md]
7. Fail when any manifest role is outside the strict allowed taxonomy or when the manifest contains `typescript-backend`, `legacy`, or a normal TypeScript backend owner label. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
8. Emit deterministic JSON and markdown sorted by `kind`, `path`, and `id`; make `--check` compare generated output to committed artifacts. [VERIFIED: scripts/generate-go-parity-fixtures.ts]

## Exact Code Roots

| Root | Inventory Reason | Current Evidence |
|------|------------------|------------------|
| `apps/web/app/api/**/route.ts` | Next.js API route inventory. [VERIFIED: .planning/REQUIREMENTS.md] | 34 route files were discovered by `find apps/web/app/api -name route.ts`. [VERIFIED: local command output] |
| `apps/web/app/competitive/server.ts` | TypeScript server module with auth/session, account revisions, forks, exhibition, ladder, governance, and service reads. [VERIFIED: apps/web/app/competitive/server.ts] | Imports `@cowards/persistence/*` and `@cowards/service`. [VERIFIED: apps/web/app/competitive/server.ts] |
| `apps/web/app/matches/server.ts` | Replay/public evidence and owner-debug replay server surface. [VERIFIED: apps/web/app/matches/server.ts] | Imports Chronicle store, local service, and Go read client; Go public replay evidence is selected via public read ownership. [VERIFIED: apps/web/app/matches/server.ts] |
| `apps/web/app/matches/replay-ready.ts` | Public/owner replay projection and board realism checks. [VERIFIED: apps/web/app/matches/replay-ready.ts] | Imports replay projection helpers and `StoredChronicle` type. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| `apps/web/app/workshop/server.ts` | Deferred Workshop validation/source/test/analytics/export/rerun/profile surface. [VERIFIED: apps/web/app/workshop/server.ts] | Imports Workshop and analytics persistence modules. [VERIFIED: apps/web/app/workshop/server.ts] |
| `apps/web/lib/account-service-adapter.ts` | Account/session Go selection and TypeScript local service fallback logic. [VERIFIED: apps/web/lib/account-service-adapter.ts] | Uses `COWARDS_GO_BACKEND_OWNER`, route flags, `COWARDS_GO_BACKEND_URL`, and local `createCowardsLocalService`. [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| `apps/web/lib/public-service-adapter.ts` | Public read Go selection and TypeScript local service fallback logic. [VERIFIED: apps/web/lib/public-service-adapter.ts] | Selects public Go route IDs and requires Go client when selected. [VERIFIED: apps/web/lib/public-service-adapter.ts] |
| `apps/web/lib/workshop-analytics-service-adapter.ts` and `apps/web/lib/workshop-read-service-adapter.ts` | Deferred Workshop read/service wrappers. [VERIFIED: rg import scan] | Both import `@cowards/persistence/db` and `@cowards/service`. [VERIFIED: rg import scan] |
| `apps/worker/src/**` | TypeScript DB-owning worker and rollback/parity/test candidate. [VERIFIED: apps/worker/src/runner.ts] | `runWorkerOnce` claims jobs, builds Chronicles, completes Matches, and records failures after guard checks. [VERIFIED: apps/worker/src/runner.ts] |
| `packages/persistence/src/**` | TypeScript persistence lifecycle, public DTO, Workshop, ladder, governance, migrations, and seed modules. [VERIFIED: packages/persistence/src/index.ts] | Package index exports lifecycle modules including jobs, complete-match, chronicle-store, scoring, matchset-status, competition, workshop, ladder, governance. [VERIFIED: packages/persistence/src/index.ts] |
| `packages/service/src/index.ts` | TypeScript service facade over persistence. [VERIFIED: packages/service/src/index.ts] | Imports Chronicle store, competition DTO builder, auth, account revisions, ladder, profiles, Workshop analytics, and Workshop test summary. [VERIFIED: packages/service/src/index.ts] |
| `apps/runtime-service/src/**` | Allowed JS/TS Strategy execution service root. [VERIFIED: apps/runtime-service/src/server.ts] | Exposes `/health` and `/execute-match`; validates request/response schemas. [VERIFIED: apps/runtime-service/src/server.ts] |
| `packages/runtime-js/src/**` | Runtime adapter and ABI bridge root. [VERIFIED: packages/runtime-js/src/abi-bridge.ts] | Implements `executeStrategyRuntimeAbiV114` and runtime adapters. [VERIFIED: packages/runtime-js/src/worker.ts] |
| `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` | Existing monitor/topology consumers to extend in later phases. [VERIFIED: scripts/check-boundary-monitors.ts] | v1.15 checks consume lifecycle manifest, topology, failure drills, surface labels, and promotion decision artifacts. [VERIFIED: scripts/check-local-topology.ts] |

## Surface Classification Guidance

| Surface Group | Required Role | Plan Guidance |
|---------------|---------------|---------------|
| Selected public/account/exhibition frontend adapters | `frontend-only` | Keep only as Go-calling adapters or mark for Phase 105 fallback removal; do not classify as backend. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] |
| `apps/runtime-service/src/**` | `runtime-service` | Allow only DB-free runtime execution service behavior. [VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| `packages/runtime-js/src/**` | `runtime-adapter` | Allow Strategy execution adapters and ABI bridge only; do not permit job/persistence/API ownership. [VERIFIED: packages/runtime-js/src/abi-bridge.ts] |
| `apps/worker/src/**` | `rollback-only` or `test-only` / `parity-only` | Inventory as non-normal because normal job ownership is blocked unless lifecycle owner/purpose is explicit. [VERIFIED: apps/worker/src/runner.ts] |
| `packages/persistence/src/jobs.ts`, `complete-match.ts`, `chronicle-store.ts`, `scoring.ts`, `matchset-status.ts` | `parity-only`, `rollback-only`, or `quarantined` | These are lifecycle modules and must not be normal backend after v1.15. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |
| `packages/persistence/src/competition.ts` | `parity-only`, `rollback-only`, or `deferred` by function | Contains manual exhibition creation and public DTO builder that refreshes MatchSet status; selected normal exhibition/evidence should move to Go-only later. [VERIFIED: packages/persistence/src/competition.ts] |
| Workshop route/server/persistence paths | `deferred` | Label Workshop validation, source, test launch, analytics rerun, profile save, and export as deferred unless later phases migrate them. [VERIFIED: .planning/REQUIREMENTS.md] |
| Ladder/admin/governance mutations | `deferred` | Label broader ladder and governance mutations as deferred unless later phases migrate them. [VERIFIED: .planning/REQUIREMENTS.md] |
| Test-support routes and fixtures | `test-only` or `fixture-only` | Require test-only gates and prevent normal product runtime use. [VERIFIED: apps/web/app/api/test-support/run-worker-once/route.ts] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import graph scanning | Regex-only parser | TypeScript AST extraction from `typescript` | Existing boundary checker already parses import/export statements and resolves local import chains. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| Runtime request validation | Ad hoc JSON checks | `RuntimeExecutionServiceRequestSchema` and response schemas | Runtime service and spec already validate v1.15 envelopes. [VERIFIED: apps/runtime-service/src/execute-match.ts] |
| Public privacy leak detection | Manual string spot checks only | Existing spec privacy guards plus monitor denylist | v1.15 monitors and Go tests already gate forbidden public markers. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: apps/go-backend/main_test.go] |
| Topology proof format | New bespoke evidence format | Extend v1.15 topology and monitor artifact style | Current topology checker consumes v1.15 JSON/markdown artifacts. [VERIFIED: scripts/check-local-topology.ts] |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | No Phase 103 data mutation is required; the scanner should record DB-owning code paths but not migrate database rows. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] | None in Phase 103; later phases handle deletion/quarantine. [VERIFIED: .planning/ROADMAP.md] |
| Live service config | Runtime mode depends on env vars such as `COWARDS_GO_BACKEND_OWNER`, `COWARDS_GO_PUBLIC_READS`, `COWARDS_GO_BACKEND_URL`, `COWARDS_RUNTIME_SERVICE_URL`, and TypeScript worker lifecycle/purpose env vars. [VERIFIED: apps/web/lib/account-service-adapter.ts] [VERIFIED: apps/web/lib/public-service-adapter.ts] [VERIFIED: apps/worker/src/runner.ts] | Manifest should record config gates per surface. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] |
| OS-registered state | None found in repo-local research; no launchd/systemd/pm2 registrations were referenced by Phase 103 context or scanned roots. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] | No Phase 103 action. [VERIFIED: .planning/ROADMAP.md] |
| Secrets/env vars | Go/backend/runtime URLs and owner tokens exist as runtime env contracts; topology scripts redact diagnostic URLs and bearer tokens. [VERIFIED: scripts/check-local-topology.ts] | Inventory artifacts must not include secret values; include env var names only. [VERIFIED: scripts/check-local-topology.ts] |
| Build artifacts | Generated artifacts already exist under `.planning/artifacts`; Phase 103 should add v1.16 generated inventory artifacts and a `--check` stale-output mode. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] | Add generated artifacts and scanner check in the plan. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md] |

## Common Pitfalls

### Pitfall 1: Treating `@cowards/service` As Harmless Frontend Support
**What goes wrong:** `@cowards/service` imports persistence and can assemble backend DTOs from DB state. [VERIFIED: packages/service/src/index.ts]
**How to avoid:** Classify normal runtime uses as parity, fixture, rollback, or deferred unless they are frontend adapters to Go. [VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 2: Missing Local Import Chains
**What goes wrong:** A route can avoid direct persistence imports while importing `competitive/server` or `matches/server`, which then imports persistence. [VERIFIED: pnpm boundary:imports output]
**How to avoid:** Reuse the existing local import traversal from `check-service-boundary-imports.ts`. [VERIFIED: scripts/check-service-boundary-imports.ts]

### Pitfall 3: Letting Runtime Service Become A Backend
**What goes wrong:** Runtime service scope can drift into job claim/completion/scoring/public API behavior. [VERIFIED: .planning/REQUIREMENTS.md]
**How to avoid:** Require `runtime-service` rows to prove no `@cowards/persistence`, `claimNextMatchJob`, `completeMatch`, or scoring imports. [VERIFIED: apps/runtime-service/src/execute-match.test.ts]

### Pitfall 4: Public Replay Evidence Falling Back To Private Chronicle Reads
**What goes wrong:** `apps/web/app/matches/server.ts` still has a TypeScript Chronicle-store path for non-Go public evidence and owner-debug behavior. [VERIFIED: apps/web/app/matches/server.ts]
**How to avoid:** Separate public Go evidence from owner-debug/deferred replay paths in the manifest. [VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 5: Artifact Drift
**What goes wrong:** Monitors can pass against stale v1.15 artifacts while source routes/imports drift. [VERIFIED: scripts/check-boundary-monitors.ts]
**How to avoid:** Add `--check` to the v1.16 inventory generator and make tests fail on stale JSON/markdown output. [VERIFIED: scripts/generate-go-parity-fixtures.ts]

## Code Examples

### AST Import Extraction Pattern

```ts
// Source: scripts/check-service-boundary-imports.ts
const sourceFile = ts.createSourceFile(
  repoPath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  sourceKindForPath(repoPath),
)
```

Use this pattern in the inventory generator instead of line-oriented parsing. [VERIFIED: scripts/check-service-boundary-imports.ts]

### Existing Worker Guard To Preserve As Rollback/Test/Parity Evidence

```ts
// Source: apps/worker/src/runner.ts
if (
  config.workerPurpose === "rollback" ||
  config.workerPurpose === "test" ||
  config.workerPurpose === "parity"
) {
  return
}
```

Classify `apps/worker` as non-normal and require explicit worker purpose or lifecycle owner gates. [VERIFIED: apps/worker/src/runner.ts]

### Existing Runtime Service Health Contract

```ts
// Source: apps/runtime-service/src/server.ts
writeJson(response, 200, {
  ok: true,
  service: "runtime-execution-service-v1.15",
  runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  adapter: runtimeConfig.metadata.id,
})
```

Use this as the runtime-service classification anchor. [VERIFIED: apps/runtime-service/src/server.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript normal backend for selected workflows | Go owns selected normal orchestration, completion, scoring, exhibition, and public evidence. [VERIFIED: .planning/artifacts/v1.15-promotion-decision.md] | v1.15 shipped 2026-05-24. [VERIFIED: .planning/PROJECT.md] | Phase 103 inventory should not legitimize a normal TypeScript backend role. [VERIFIED: .planning/REQUIREMENTS.md] |
| Runtime execution through TypeScript worker/backend lifecycle | Go invokes TypeScript runtime execution service through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`. [VERIFIED: .planning/artifacts/v1.15-live-web-go-runtime-topology.json] | v1.15 shipped 2026-05-24. [VERIFIED: .planning/PROJECT.md] | Runtime service remains allowed only as isolated Strategy execution infrastructure. [VERIFIED: .planning/REQUIREMENTS.md] |
| Broad web direct persistence report-only debt | `pnpm boundary:imports` reports 0 strict offenses and 29 report-only offenses. [VERIFIED: local command `pnpm exec tsx scripts/check-service-boundary-imports.ts`] | v1.15 baseline. [VERIFIED: .planning/artifacts/v1.15-boundary-baseline.md] | Phase 103 should rebaseline and classify the 29 report-only offenses. [VERIFIED: scripts/check-boundary-monitors.ts] |

**Deprecated/outdated:**
- `typescript-backend` labels are not allowed after v1.15. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
- Silent TypeScript fallback when Go is selected is not allowed. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json]
- Node `vm` and Node `node:wasi` are not accepted as hostile-code security boundaries. [VERIFIED: AGENTS.md] [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

All claims in this research were verified against repo-local files, project planning artifacts, or local command output; no `[ASSUMED]` claims were used. [VERIFIED: this research session]

## Open Questions

1. **Should Phase 103 commit the generated scanner script and both generated artifacts, or only the artifacts?**
   - What we know: Phase 103 decisions require deterministic, monitor-ready JSON and markdown artifacts. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
   - What's unclear: The context does not explicitly say whether the generator itself must land in Phase 103 or can be deferred. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
   - Recommendation: Implement the generator in Phase 103 because Phase 108 depends on monitor-ready fields and stale-output checks. [VERIFIED: scripts/check-boundary-monitors.ts]

2. **Should generated markdown live in `.planning/artifacts` or the phase directory?**
   - What we know: Existing monitor-readable evidence lives in `.planning/artifacts`, while phase planning docs live under `.planning/phases/...`. [VERIFIED: .planning/artifacts/v1.15-typescript-surface-labels.json] [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
   - What's unclear: Phase 103 context does not name exact filenames. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
   - Recommendation: Put both generated inventory artifacts under `.planning/artifacts` and keep this research/plan under the phase directory. [VERIFIED: scripts/check-local-topology.ts]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | `tsx`, TypeScript scanner, Vitest | Yes | `v24.15.0` [VERIFIED: local command `node --version`] | None needed. |
| pnpm | Workspace scripts | Yes | `11.1.2` [VERIFIED: local command `pnpm --version`] | None needed. |
| git | Artifact diff/check workflow | Yes | `2.39.2` [VERIFIED: local command `git --version`] | None needed. |
| Go | Baseline tests referenced by monitors | Yes | `go1.26.3` [VERIFIED: local command `go version`] | Phase 103 scanner tests can run without Go, but full `boundary:monitors` uses Go. [VERIFIED: package.json] |

**Missing dependencies with no fallback:** None found. [VERIFIED: local command outputs]

**Missing dependencies with fallback:** None found. [VERIFIED: local command outputs]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.1.6` for TypeScript scanner tests. [VERIFIED: package.json] |
| Config file | `vitest.config.ts`; web also has `apps/web/vitest.config.ts`. [VERIFIED: local command `find . -maxdepth 3 ...`] |
| Quick run command | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` [VERIFIED: package.json] |
| Full suite command | `pnpm test:fast && pnpm boundary:monitors` [VERIFIED: package.json] |

### Phase Requirements To Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| BASE-01 | Scanner discovers all target roots and route files. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |
| BASE-02 | Manifest rejects invalid roles and normal TypeScript backend labels. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |
| BASE-03 | Manifest references v1.15 Go baseline artifacts. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |
| BASE-04 | TypeScript service/backend surfaces have allowed non-normal roles. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |
| BASE-05 | Non-goals are present in global policies. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |
| BASE-06 | Privacy/fallback/determinism/isolation fields are present and non-empty. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` | No, Wave 0. |

### Sampling Rate

- **Per task commit:** `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts && pnpm exec tsx scripts/generate-typescript-backend-inventory.ts --check` [VERIFIED: existing script/test pattern in package.json]
- **Per wave merge:** `pnpm boundary:imports && pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/check-local-topology.test.ts` [VERIFIED: package.json]
- **Phase gate:** `pnpm test:fast && pnpm boundary:monitors` after artifact generation. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `scripts/generate-typescript-backend-inventory.ts` - deterministic scanner/checker. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
- [ ] `scripts/generate-typescript-backend-inventory.test.ts` - coverage, role, and stale-output tests. [VERIFIED: vitest.config.ts]
- [ ] `.planning/artifacts/v1.16-typescript-backend-inventory.json` - generated machine-readable manifest. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]
- [ ] `.planning/artifacts/v1.16-typescript-backend-inventory.md` - generated human matrix. [VERIFIED: .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Yes | Inventory account/session routes and Go selection gates; do not expose session/token diagnostics. [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| V3 Session Management | Yes | Account/session surfaces include cookies and session IDs; artifacts must list env/route gates but not secret values. [VERIFIED: apps/web/lib/account-service-adapter.ts] |
| V4 Access Control | Yes | Owner-debug replay, account source, admin/governance, and owner analytics routes need explicit role/gate labels. [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts] |
| V5 Input Validation | Yes | Use existing Zod/spec schemas and scanner schema validation; runtime service already validates request/response envelopes. [VERIFIED: packages/spec/src/schemas.ts] |
| V6 Cryptography | Yes | Source hashes and Chronicle hashes are existing integrity controls; do not hand-roll new hashing in the inventory phase. [VERIFIED: packages/runtime-js/src/hash.ts] [VERIFIED: packages/replay/src/hash.ts] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public artifact leaks Strategy source, memory, owner debug, tokens, DB DSNs, host paths, or runtime internals | Information Disclosure | Use denylist fields from v1.15 lifecycle manifest and topology safe-detail redaction. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] [VERIFIED: scripts/check-local-topology.ts] |
| Silent fallback to TypeScript backend when Go is selected | Tampering / Repudiation | Manifest `fallbackPolicy` must be `no_silent_typescript_backend_fallback` for Go-selected surfaces. [VERIFIED: .planning/artifacts/v1.15-failure-drills.json] |
| Mixed Go and TypeScript DB job/completion owners | Tampering / Denial of Service | Manifest must prohibit mixed DB completing owners and record rollback gates. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json] |
| Strategy execution outside runtime service/adapters | Elevation of Privilege | Inventory must flag runtime imports and classify only `apps/runtime-service` / `packages/runtime-js` as runtime roles. [VERIFIED: AGENTS.md] [VERIFIED: apps/runtime-service/src/execute-match.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables and testing expectations.
- `.planning/PROJECT.md` - v1.16 milestone state and v1.15 shipped baseline.
- `.planning/REQUIREMENTS.md` - Phase 103 BASE requirements and non-goals.
- `.planning/ROADMAP.md` - Phase 103 scope and success criteria.
- `.planning/STATE.md` - current workflow state and v1.15 continuity notes.
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - locked Phase 103 decisions.
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - Go lifecycle ownership baseline.
- `.planning/artifacts/v1.15-typescript-surface-labels.json` - TypeScript surface label seed.
- `.planning/artifacts/v1.15-live-web-go-runtime-topology.json` - topology and runtime boundary evidence.
- `.planning/artifacts/v1.15-failure-drills.json` - fail-closed/no-fallback evidence.
- `scripts/check-service-boundary-imports.ts` - current import-boundary scanner pattern.
- `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` - current monitor/topology consumers.
- `apps/web`, `apps/worker`, `apps/runtime-service`, `packages/persistence`, `packages/service`, `packages/runtime-js`, and `apps/go-backend` scanned source roots.

### Secondary (MEDIUM confidence)

- Local command output from `pnpm exec tsx scripts/check-service-boundary-imports.ts`, `find apps/web/app/api -name route.ts`, `node --version`, `pnpm --version`, `go version`, and `git --version`.

### Tertiary (LOW confidence)

- None. No web-only or unverified external sources were used.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and scripts came from local package files and local command output. [VERIFIED: package.json]
- Architecture: HIGH - ownership and topology came from v1.15 artifacts and Phase 103 context. [VERIFIED: .planning/artifacts/v1.15-lifecycle-ownership-manifest.json]
- Pitfalls: HIGH - each pitfall maps to current source or existing monitors. [VERIFIED: scripts/check-boundary-monitors.ts]

**Research date:** 2026-05-24 [VERIFIED: environment current_date]
**Valid until:** 2026-06-23 for repo-local architecture unless source surfaces change sooner. [VERIFIED: .planning/STATE.md]
