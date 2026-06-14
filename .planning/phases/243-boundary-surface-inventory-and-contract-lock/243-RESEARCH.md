# Phase 243: Boundary Surface Inventory and Contract Lock - Research

**Researched:** 2026-06-14 [VERIFIED: system date]
**Domain:** v1.35 trust-boundary surface inventory, decision register, characterization tests, and monitor contract [VERIFIED: .planning/ROADMAP.md; .planning/REQUIREMENTS.md]
**Confidence:** HIGH [VERIFIED: codebase grep; .planning/research/SUMMARY.md; .planning/artifacts/v1.34-workshop-checker-inventory.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

The following constraints are copied from `.planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md`. [VERIFIED: .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md]

### Locked Decisions

### Inventory Scope
- **D-01:** Inventory must cover every requirement named in `INV-01`: account save, account-owned revision/source reads, owner-debug/private replay, Workshop compatibility aliases, competition entry, Go-owned read/write surfaces, provider-proof surfaces, sandbox-claim surfaces, package/dependency surfaces, TinyGo visibility, and privacy monitors.
- **D-02:** Inventory must include both TypeScript/web/persistence surfaces and Go-owned surfaces. The main known drift is Go TypeScript account save versus runtime-service provider proof, but Phase 243 should not assume that is the only drift.
- **D-03:** Inventory must include current evidence/proof artifacts and boundary monitors, not only product routes. The goal is a route/code/artifact/test matrix that Phase 244-248 can execute against without rediscovering scope.

### Decision Register Shape
- **D-04:** Each surface should be classified as exactly one of: `fix-now`, `quarantine`, `deprecate-remove`, `document-only`, or `future`.
- **D-05:** Each row should record current owner, intended owner, trust boundary, public/private data class, affected requirement IDs, current behavior, desired v1.35 disposition, required tests/proof, privacy risks, and downstream phase.
- **D-06:** Behavior changes are out of scope except safe characterization and inventory checks. If the inventory finds a serious leak or execution-boundary violation, record it as a blocking finding for Phase 244/245/248 rather than silently fixing it inside Phase 243.

### Compatibility and Alias Handling
- **D-07:** Legacy Workshop source/submit/save aliases should be inventoried by route path and caller. Phase 243 should recommend remove, hidden/local-only, migrate, or deprecated-with-tests, but implementation belongs to Phase 245 unless a route is already unused and a characterization test is needed.
- **D-08:** Retained aliases must be treated as potential bypasses until proven otherwise. The inventory should explicitly ask whether each alias bypasses provider proof, account authorization, package policy, TinyGo hiding, or public/default privacy rules.

### Privacy and Claim Calibration
- **D-09:** Every public/default output surface should be scanned against the v1.35 forbidden-marker set: raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, owner-debug payloads, raw Awareness Grids, quarantine details, operator action details, and recovery payloads.
- **D-10:** Sandbox-readiness claims must stay claim-calibrated in the inventory: TypeScript/Python are provenance-only, Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed, TinyGo is spike-only/hidden, and no current lane is production sandbox certified by default.
- **D-11:** Package/dependency policy must be inventoried as an enforced boundary, not just documentation. Current production policy is package mode `none` with no rich packages or host imports.

### Auto-Selected Discussion Areas
- **D-12:** Auto mode selected all meaningful Phase 243 gray areas: inventory scope, row taxonomy, compatibility alias disposition, privacy/claim calibration, and handoff boundaries. Recommended defaults were selected because they match v1.35 research and the approved roadmap.

### the agent's Discretion
The planner may choose the exact artifact filenames, table format, and inventory script structure, as long as downstream phases get a single authoritative inventory plus a decision register that maps all Phase 243 requirements and v1.35 affected surfaces.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within Phase 243 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
| --- | --- | --- |
| INV-01 | Developer can inventory every v1.35-affected account save, account-owned revision/source read, owner-debug/private replay, Workshop compatibility alias, competition entry, Go-owned read/write, provider-proof, sandbox-claim, package/dependency, TinyGo, and privacy monitor surface. [VERIFIED: .planning/REQUIREMENTS.md] | Use the affected surface matrix, artifact baseline list, and code discovery commands in this research. [VERIFIED: codebase grep; .planning/artifacts/v1.34-workshop-checker-inventory.md] |
| INV-02 | Developer can classify every inventoried surface as fix-now, quarantine, deprecate/remove, document-only, or future, with current owner, trust boundary, public/private data class, required tests, and follow-up evidence. [VERIFIED: .planning/REQUIREMENTS.md] | Use the recommended row contract and decision taxonomy in this research. [VERIFIED: .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md] |
| INV-03 | Developer can lock the v1.35 decision register before behavioral changes so later phases know which surfaces must preserve, migrate, hide, or fail loudly. [VERIFIED: .planning/REQUIREMENTS.md] | Write a locked artifact plus a monitor-friendly companion and characterize current behavior without fixing Phase 244-248 behavior. [VERIFIED: .planning/ROADMAP.md; .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md] |
</phase_requirements>

## Summary

Phase 243 should produce a planning and proof artifact, not a behavior fix. [VERIFIED: .planning/ROADMAP.md; .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md] The planner should scope work to a single authoritative v1.35 surface inventory plus decision register, optional machine-readable JSON, and characterization/monitor checks that freeze what later phases must preserve, migrate, quarantine, remove, or fail loudly. [VERIFIED: .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md]

The most important planning fact is that the account/provider-proof risk is real and route-specific: Workshop validate/submit paths now use runtime-service semantics for the four production source formats, but Go account save still has a TypeScript local-validation path and the Go runtime-service validation client rejects TypeScript. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; apps/web/app/api/workshop/revisions/route.ts; apps/go-backend/live_backend.go; apps/go-backend/runtime_service_client.go; .planning/artifacts/v1.34-workshop-checker-inventory.md] Phase 243 should inventory and characterize that drift, while leaving the actual TypeScript provider-proof cleanup to Phase 244. [VERIFIED: .planning/ROADMAP.md]

**Primary recommendation:** Build `.planning/artifacts/v1.35-boundary-surface-inventory.md` plus `.planning/artifacts/v1.35-boundary-surface-inventory.json`, add a check script that verifies required rows and forbidden omissions, and wire only the check form into planning/monitor commands if it is stable. [VERIFIED: existing artifact pattern in .planning/artifacts; package.json `boundary:monitors`; scripts/check-boundary-monitors.ts]

## Project Constraints (from AGENTS.md)

- The engine must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not be placed in React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Strategy code must be treated as hostile, and every runtime boundary must be schema-validated. [VERIFIED: AGENTS.md]
- Canonical terminology must be preserved: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md; CowardsGameSpec_Full_Consolidated_v1.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md; CowardsGameSpec_Full_Consolidated_v1.md]
- Engine rules need focused unit tests and invariant/property-style tests. [VERIFIED: AGENTS.md]
- Replay or Match creation changes need board realism checks, including in-bounds visible Soldier/terrain positions and plausible full Match starts. [VERIFIED: AGENTS.md]
- Runtime tests must distinguish strategy failure from system failure and cover invalid outputs, timeouts, forbidden capabilities, memory/source limits, and schema validation. [VERIFIED: AGENTS.md]
- Planning docs should be committed when updated. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
| --- | --- | --- | --- |
| v1.35 inventory artifact and decision register | Planning/docs | Scripts | The phase output is a contract artifact before behavior changes. [VERIFIED: .planning/ROADMAP.md; .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md] |
| Surface discovery over Next routes | Frontend Server/API | Scripts | Next API route files own web/API transport surfaces and can be enumerated by scripts. [VERIFIED: apps/web/app/api] |
| Go-owned account/save/read/entry surfaces | API / Backend | Database / Storage | `apps/go-backend/live_backend.go` registers selected account, public, replay, and matchset routes. [VERIFIED: apps/go-backend/live_backend.go] |
| Provider validation/proof surfaces | Runtime-service / provider boundary | API / Backend | Runtime-service `/validate-strategy` accepts TypeScript, Python, Rust, and Zig and attaches provider metadata/proof. [VERIFIED: apps/runtime-service/src/server.ts] |
| Public/default privacy classification | API / Backend | Frontend Server/API | Public DTO builders and `PUBLIC_OUTPUT_FORBIDDEN_FIELDS` define what must not appear by default. [VERIFIED: packages/spec/src/public-output-privacy.ts; apps/go-backend/live_backend.go] |
| Owner-debug/private replay classification | Frontend Server/API | API / Backend | Owner-debug options are currently resolved in the replay page route helper and server replay reads enforce projection behavior. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; apps/web/app/matches/server.test.ts] |
| Package/dependency policy classification | Spec/contracts | Runtime providers | Runtime metadata policy rejects `package.mode = "declared"` and non-empty required capabilities. [VERIFIED: packages/spec/src/runtime.ts] |
| Sandbox/readiness claim classification | Spec/contracts | Docs/UI/monitors | Runtime records and readiness artifacts distinguish provenance, WASM/WASI artifact backing, and no production sandbox certification. [VERIFIED: packages/spec/src/runtime.ts; .planning/artifacts/v1.24-production-sandbox-readiness-matrix.md] |
| TinyGo visibility classification | Spec/contracts | Scripts/docs | TinyGo is absent from production checker source formats and has spike-only evidence. [VERIFIED: packages/spec/src/workshop-checker.ts; .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
| --- | --- | --- | --- |
| pnpm workspace | repo pins `pnpm@11.1.2`; local `pnpm --version` is `11.1.2` [VERIFIED: package.json; local command] | Run monorepo scripts and proof commands. [VERIFIED: package.json] | Existing scripts already drive tests, monitors, and evidence checks. [VERIFIED: package.json] |
| TypeScript | repo range `^6.0.3`; npm latest `6.0.3`, published 2026-04-16 [VERIFIED: package.json; npm registry] | Inventory scripts, contract helpers, Vitest tests. [VERIFIED: scripts; packages/spec] | Existing monitor/evaluator scripts are TypeScript executed by `tsx`. [VERIFIED: scripts/check-boundary-monitors.ts; package.json] |
| tsx | repo range `^4.22.0`; npm latest `4.22.4`, published 2026-05-31 [VERIFIED: package.json; npm registry] | Execute TypeScript scripts without new build plumbing. [VERIFIED: package.json] | Existing evaluators and monitors use `pnpm exec tsx`. [VERIFIED: package.json] |
| Vitest | repo range `^4.1.6`; npm latest `4.1.8`, published 2026-06-01 [VERIFIED: package.json; npm registry] | Characterization tests for TS/web/spec/script surfaces. [VERIFIED: vitest.config.ts; test file scan] | Existing test files use Vitest across apps, packages, and scripts. [VERIFIED: test file scan] |
| Go test | module `go 1.25.0`; local Go is `go1.26.3` [VERIFIED: apps/go-backend/go.mod; local command] | Characterize Go route inventory and provider-proof helper behavior. [VERIFIED: apps/go-backend/main_test.go; apps/go-backend/runtime_service_client_test.go] | Go backend has focused `_test.go` coverage and is included in `pnpm go:parity`. [VERIFIED: package.json; apps/go-backend/*_test.go] |
| `@cowards/spec` | workspace `0.1.0` [VERIFIED: package manifests] | Canonical runtime/provider/package/privacy/checker contracts. [VERIFIED: packages/spec/src/runtime.ts; packages/spec/src/workshop-checker.ts] | The existing code already centralizes supported language records, provider IDs, package mode, ABI, privacy markers, and checker response contracts here. [VERIFIED: packages/spec/src/runtime.ts; packages/spec/src/public-output-privacy.ts] |
| `apps/runtime-service` | workspace `0.1.0` [VERIFIED: package manifests] | Provider validation/proof and Strategy execution HTTP boundary. [VERIFIED: apps/runtime-service/src/server.ts] | Runtime-service already owns `/validate-strategy` and `/execute-match`. [VERIFIED: apps/runtime-service/src/server.ts] |
| Go backend | module `github.com/cowards-game/go-backend`; `pgx/v5 v5.9.2` [VERIFIED: apps/go-backend/go.mod] | Selected account, public read, replay evidence, and matchset surfaces. [VERIFIED: apps/go-backend/live_backend.go] | Phase 243 must inventory Go-owned surfaces because v1.35 drift is partly in Go. [VERIFIED: .planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md; apps/go-backend/live_backend.go] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
| --- | --- | --- | --- |
| Playwright | repo range `^1.60.0`; npm latest `1.60.0`, published 2026-05-11 [VERIFIED: package.json; npm registry] | Browser proof if inventory changes touch replay/Workshop visible surfaces. [VERIFIED: playwright.config.ts; apps/web/e2e] | Phase 243 should usually avoid broad E2E unless characterization needs route/browser proof. [VERIFIED: .planning/ROADMAP.md] |
| Redocly CLI | repo pins `2.31.4`; npm latest `2.32.2`, published 2026-06-11 [VERIFIED: package.json; npm registry] | Existing OpenAPI lint in boundary monitors. [VERIFIED: package.json] | Do not introduce OpenAPI work unless the inventory finds route contract drift. [VERIFIED: package.json; .planning/ROADMAP.md] |
| Turbo | repo range `^2.9.14`; npm latest `2.9.18`, published 2026-06-10 [VERIFIED: package.json; npm registry] | Existing task orchestration for build/lint/typecheck/test. [VERIFIED: turbo.json; package.json] | Use existing `pnpm test:fast` and filtered tests. [VERIFIED: package.json] |
| Docker | local `29.4.0` [VERIFIED: local command] | Existing local services and optional sandbox checks. [VERIFIED: package.json] | Phase 243 does not require Docker unless running full monitor/service proof. [VERIFIED: .planning/ROADMAP.md] |
| Wasmtime | local `45.0.0` [VERIFIED: local command] | Existing Rust/Zig WASM/WASI evidence. [VERIFIED: package.json; packages/runtime-wasm-wasi] | Inventory should document WASM/WASI surfaces but not modify ABI behavior. [VERIFIED: .planning/REQUIREMENTS.md] |
| Python | local `3.9.6` [VERIFIED: local command] | Existing Python provider/toolchain checks. [VERIFIED: packages/runtime-python] | Needed only for service-backed validation/proof, not for static inventory. [VERIFIED: packages/runtime-python] |
| Rust | local `rustc 1.95.0` [VERIFIED: local command] | Existing Rust WASI proof/toolchain checks. [VERIFIED: packages/runtime-wasm-wasi; .planning/research/STACK.md] | Needed only for service-backed Rust proof, not for static inventory. [VERIFIED: package.json] |
| Zig | local `0.16.0` [VERIFIED: local command] | Existing Zig WASI proof/toolchain checks. [VERIFIED: packages/runtime-wasm-wasi; .planning/research/STACK.md] | Needed only for service-backed Zig proof, not for static inventory. [VERIFIED: package.json] |
| TinyGo | local `0.41.1` [VERIFIED: local command; .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] | Hidden spike evidence. [VERIFIED: scripts/evaluate-v1-33-tinygo-wasi-spike.ts] | Inventory TinyGo as hidden/spike-only; do not add production support. [VERIFIED: .planning/REQUIREMENTS.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
| --- | --- | --- |
| Existing TypeScript inventory/check script | New external inventory generator | Existing scripts already read repo files and produce planning artifacts, so a new tool would add planning risk without solving a missing capability. [VERIFIED: scripts/generate-typescript-backend-inventory.ts; scripts/generate-typescript-surface-labels.ts] |
| Existing Vitest/Go tests | New test framework | Current infrastructure already covers scripts, web route helpers, spec contracts, and Go backend behavior. [VERIFIED: vitest.config.ts; apps/go-backend/*_test.go] |
| Existing `.planning/artifacts` markdown/JSON pattern | Database-backed inventory | Phase 243 output is planning/proof input, and existing milestone artifacts are markdown/JSON under `.planning/artifacts`. [VERIFIED: .planning/artifacts list] |

**Installation:**

```bash
# No new dependencies are required for Phase 243. [VERIFIED: package.json; .planning/research/STACK.md]
```

**Version verification:** Current registry checks were run with `npm view` on 2026-06-14 for TypeScript, Vitest, Playwright, tsx, Redocly CLI, Turbo, ESLint JS, and Prettier. [VERIFIED: npm registry] Existing repo versions should be used unless a later plan explicitly scopes dependency upgrades. [VERIFIED: package.json; .planning/ROADMAP.md]

## Affected Surface Inventory Inputs

| Surface Group | Current Evidence | Phase 243 Planning Implication |
| --- | --- | --- |
| Account save transport | `apps/web/app/api/account/revisions/save/route.ts` delegates to `saveAccountRevisionFromRequest`; `apps/web/lib/account-revision-write-boundary.ts` forwards source and sourceFormat to selected Go backend. [VERIFIED: codebase] | Inventory as web transport boundary, not proof owner. [VERIFIED: codebase; AGENTS.md] |
| Go account save | `createStrategyRevision` accepts TypeScript/Python/Rust/Zig; Python/Rust/Zig call `runtime.validateStrategy`; TypeScript falls through to local metadata/default insertion. [VERIFIED: apps/go-backend/live_backend.go] | Classify TypeScript account-save proof drift as `fix-now` for Phase 244, with current behavior frozen by characterization. [VERIFIED: .planning/ROADMAP.md; .planning/artifacts/v1.34-workshop-checker-inventory.md] |
| Go runtime-service validation client | `validateStrategy` rejects non-Python/Rust/Zig before transport. [VERIFIED: apps/go-backend/runtime_service_client.go] | Inventory as Phase 244 prerequisite and characterize current TypeScript rejection without changing it. [VERIFIED: apps/go-backend/runtime_service_client.go; .planning/ROADMAP.md] |
| Account source read | Go source read requires authenticated user ownership and returns private JSON; Next account source route returns private no-store text. [VERIFIED: apps/go-backend/live_backend.go; apps/web/app/api/account/revisions/[revisionId]/source/route.ts] | Inventory as owner-private source surface with privacy tests. [VERIFIED: codebase; AGENTS.md] |
| Workshop source aliases | `/api/workshop/source` and `/api/workshop/revisions/[revisionId]/source` return source from Workshop server without account route semantics. [VERIFIED: apps/web/app/api/workshop/source/route.ts; apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts] | Classify aliases route-by-route for Phase 245 decision: deprecate/remove, hidden/local-only, migrate, or deprecated-with-tests. [VERIFIED: 243-CONTEXT.md] |
| Workshop submit | `/api/workshop/revisions` calls runtime-service validation for TypeScript, Python, Rust, and Zig before `workshopServer.submitSource`. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts] | Inventory as current provider-proof reference path for Workshop, not account save. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md] |
| Workshop validate | `/api/workshop/validate` accepts only checker source formats and normalizes runtime-service responses to `workshop-checker-v1.34`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts; packages/spec/src/workshop-checker.ts] | Inventory as public-safe preflight contract, explicitly not a submit/save/entry gate. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Go exhibition/entry | Go `createExhibition` flows into owned entrant loading and `runtimeAllowsCountedPlay`; TypeScript branch currently accepts JS/TS adapters without TypeScript provider proof. [VERIFIED: apps/go-backend/live_backend.go] | Inventory as Phase 244 entry-gate drift and add characterization expectations for TypeScript/Python/Rust/Zig. [VERIFIED: apps/go-backend/live_backend.go; .planning/ROADMAP.md] |
| Persistence entry parity | Persistence competition/ladder gates check TypeScript/Python source artifact provider proof and Rust/Zig compiled artifact proof. [VERIFIED: packages/persistence/src/competition.ts; packages/persistence/src/ladder.ts] | Inventory as stricter semantic reference for Go parity. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md] |
| Owner-debug replay | Current resolver requires enabled test/debug env, ownerDebug/debug query, ownerPlayerId, and matching `COWARDS_OWNER_DEBUG_REQUESTER_PLAYER_ID`. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] | Inventory as Phase 245 owner-debug/private replay boundary, with query param treated as request only. [VERIFIED: .planning/REQUIREMENTS.md] |
| Local Workshop identity | `LOCAL_WORKSHOP_PLAYER_ID` is `player:workshop-local` and is used to construct owner replay links. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] | Inventory as quarantine candidate and test any retained use as ephemeral/local-only. [VERIFIED: .planning/REQUIREMENTS.md; apps/web/app/workshop/workshop-client-state.ts] |
| Runtime provider validation | Runtime-service `/validate-strategy` accepts TypeScript/Python/Rust/Zig and builds provider metadata/proof on success. [VERIFIED: apps/runtime-service/src/server.ts] | Inventory as hostile-code/provider-proof owner; web/Go should call it rather than implement validation locally. [VERIFIED: AGENTS.md; apps/runtime-service/src/server.ts] |
| Runtime/package contracts | `packages/spec/src/runtime.ts` owns provider records, ABI version, package mode checks, runtime compatibility, and counted eligibility helpers. [VERIFIED: packages/spec/src/runtime.ts] | Inventory contract rows should point to spec-owned labels/policy for Phase 246/247. [VERIFIED: .planning/ROADMAP.md] |
| Public privacy monitor inputs | `PUBLIC_OUTPUT_FORBIDDEN_FIELDS` and markers include source, bytesBase64, ownerDebug, StrategyMemory/SoldierMemory/objective, stack/stderr, tokens, host/package/DB fields. [VERIFIED: packages/spec/src/public-output-privacy.ts] | Use this as the minimum forbidden-marker baseline and extend with v1.35 context markers. [VERIFIED: packages/spec/src/public-output-privacy.ts; 243-CONTEXT.md] |
| Boundary monitors | `pnpm boundary:monitors` chains contract lint, import checks, TS backend inventory, Go parity, sandbox/wasm/runtime abuse proofs, topology, and `scripts/check-boundary-monitors.ts`. [VERIFIED: package.json] | Prefer extending existing monitor/evaluator patterns over inventing a new verification framework. [VERIFIED: package.json; scripts/check-boundary-monitors.ts] |

## Architecture Patterns

### System Architecture Diagram

```text
--------------------+       +------------------------+
| Phase 243 Inputs   |       | Source/Artifact Scan   |
| ROADMAP/REQ/CTX    +------>+ rg + static inventory  |
| prior artifacts    |       | route/code/test matrix |
+---------+----------+       +-----------+------------+
          |                              |
          v                              v
+---------+----------+       +-----------+------------+
| Surface Classifier |<------+ Existing Contracts     |
| owner/boundary/    |       | spec/runtime/checker/  |
| privacy/disposition|       | privacy/monitors       |
+---------+----------+       +-----------+------------+
          |
          v
+---------+------------------------------------------------+
| v1.35 Boundary Surface Inventory + Decision Register      |
| row taxonomy: fix-now/quarantine/deprecate-remove/        |
| document-only/future                                      |
+---------+------------------------------------------------+
          |
          v
+---------+------------------------------------------------+
| Characterization Tests / Inventory Check                  |
| fail on missing required surfaces or forbidden omissions   |
+---------+------------------------------------------------+
          |
          v
+---------+------------------------------------------------+
| Downstream Phase Handoff                                  |
| 244 account/provider/entry; 245 auth/aliases;             |
| 246 labels; 247 packages; 248 proof/monitors              |
+----------------------------------------------------------+
```

This flow is planning-owned and script-assisted; it does not move Strategy validation/build/execution into web/API/Go. [VERIFIED: AGENTS.md; .planning/ROADMAP.md]

### Recommended Project Structure

```text
.planning/artifacts/
├── v1.35-boundary-surface-inventory.md      # human-readable authoritative inventory [RECOMMENDED: existing artifact pattern]
└── v1.35-boundary-surface-inventory.json    # monitor-friendly row data [RECOMMENDED: existing artifact pattern]

scripts/
├── evaluate-v1-35-boundary-surface-inventory.ts  # optional generator/check script [RECOMMENDED: existing evaluator pattern]
└── check-boundary-monitors.ts                    # may import/check v1.35 artifact if stable [VERIFIED: existing monitor entry point]

scripts/*.test.ts or packages/spec/src/*.test.ts
└── focused characterization tests for row schema, required surface groups, forbidden omissions [RECOMMENDED: existing Vitest pattern]
```

### Pattern 1: Inventory Row Contract

**What:** Every row should capture the fields locked in CONTEXT D-05 plus code references and downstream phase. [VERIFIED: 243-CONTEXT.md]

**When to use:** Use for every route, code helper, artifact, monitor, test, and public claim surface affected by INV-01. [VERIFIED: .planning/REQUIREMENTS.md]

**Example:**

```typescript
// Source: 243-CONTEXT.md D-04/D-05 and existing artifact JSON patterns.
type SurfaceDisposition =
  | "fix-now"
  | "quarantine"
  | "deprecate-remove"
  | "document-only"
  | "future"

interface V135BoundarySurfaceRow {
  id: string
  surfaceGroup:
    | "account-save"
    | "account-source-read"
    | "owner-debug-replay"
    | "workshop-alias"
    | "entry-gate"
    | "go-read-write"
    | "provider-proof"
    | "sandbox-claim"
    | "package-policy"
    | "tinygo-visibility"
    | "privacy-monitor"
    | "evidence-artifact"
  codeReferences: string[]
  currentOwner: string
  intendedOwner: string
  trustBoundary: string
  dataClass: "public" | "session" | "owner-private" | "internal-private"
  affectedRequirements: string[]
  currentBehavior: string
  disposition: SurfaceDisposition
  requiredTestsOrProof: string[]
  privacyRisks: string[]
  downstreamPhase: 244 | 245 | 246 | 247 | 248 | "none"
}
```

### Pattern 2: Characterization Before Behavior Change

**What:** Add tests/checks that prove the current surface inventory is complete and freezes known behavior without fixing it. [VERIFIED: 243-CONTEXT.md; .planning/ROADMAP.md]

**When to use:** Use for TypeScript Go account-save drift, Workshop aliases, owner-debug request semantics, public privacy markers, and package/TinyGo claim surfaces. [VERIFIED: .planning/REQUIREMENTS.md; codebase grep]

**Example:**

```typescript
// Source: existing Vitest script tests such as scripts/check-boundary-monitors.test.ts.
import { describe, expect, it } from "vitest"

describe("v1.35 boundary surface inventory", () => {
  it("contains every required INV-01 surface group", () => {
    const groups = new Set(inventory.surfaces.map((row) => row.surfaceGroup))
    expect(groups).toEqual(
      expect.arrayContaining([
        "account-save",
        "account-source-read",
        "owner-debug-replay",
        "workshop-alias",
        "entry-gate",
        "provider-proof",
        "sandbox-claim",
        "package-policy",
        "tinygo-visibility",
        "privacy-monitor",
      ]),
    )
  })
})
```

### Pattern 3: Privacy Marker Reuse

**What:** Reuse `assertPublicOutputLeakSafe` and the Workshop checker privacy exclusions as the base privacy vocabulary. [VERIFIED: packages/spec/src/public-output-privacy.ts; packages/spec/src/workshop-checker.ts]

**When to use:** Use for public/default rows and proof artifacts; extend the inventory row with explicit v1.35 forbidden marker notes for raw diagnostics, artifact bytes, package paths, owner-debug payloads, raw Awareness Grids, quarantine, operator, and recovery payloads. [VERIFIED: 243-CONTEXT.md]

### Anti-Patterns to Avoid

- **Fixing Phase 244-248 behavior inside Phase 243:** Behavior changes are out of scope except safe characterization and inventory checks. [VERIFIED: 243-CONTEXT.md]
- **Inventorying only product routes:** Evidence artifacts and monitors are explicitly in scope. [VERIFIED: 243-CONTEXT.md]
- **Treating Workshop checker readiness as account save or entry eligibility:** The checker contract is a preflight diagnostic and does not replace submit/save/entry gates. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
- **Letting alias routes remain unclassified:** Retained aliases are possible bypasses until proven otherwise. [VERIFIED: 243-CONTEXT.md]
- **Using UI state as privacy authorization:** Owner-debug/private replay requires server-side authorization in later phases; query params are request shape only. [VERIFIED: .planning/REQUIREMENTS.md; apps/web/app/matches/[matchId]/replay/owner-debug.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| Source discovery | Manual route list only | `rg --files`, targeted `rg`, and a typed inventory JSON/check script. [VERIFIED: repo tooling] | Manual-only inventories miss compatibility aliases and monitor/artifact surfaces. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md] |
| Privacy denylist | New ad hoc string set | `PUBLIC_OUTPUT_FORBIDDEN_FIELDS`, `PUBLIC_OUTPUT_FORBIDDEN_MARKERS`, and Workshop checker excluded fields. [VERIFIED: packages/spec/src/public-output-privacy.ts; packages/spec/src/workshop-checker.ts] | Existing contracts already encode private fields and markers. [VERIFIED: codebase] |
| Provider proof semantics | New Phase 243 proof validator | Existing runtime-service/provider metadata, Go helper functions, and persistence proof helpers. [VERIFIED: apps/runtime-service/src/server.ts; apps/go-backend/live_backend.go; packages/persistence/src/competition.ts] | Phase 243 should inventory and characterize, not reimplement proof. [VERIFIED: .planning/ROADMAP.md] |
| Boundary monitor framework | Separate monitor runner | `scripts/check-boundary-monitors.ts` and root `pnpm boundary:monitors`. [VERIFIED: package.json; scripts/check-boundary-monitors.ts] | Existing monitor stack already checks contract, topology, sandbox, WASM/WASI, runtime abuse, public discovery, and Go parity. [VERIFIED: package.json] |
| Test harness | New test framework | Vitest, Go test, and existing Playwright commands. [VERIFIED: vitest.config.ts; apps/go-backend/go.mod; playwright.config.ts] | Existing tests already cover route helpers, scripts, contracts, Go behavior, and browser proof. [VERIFIED: test file scan] |

**Key insight:** Phase 243 should hand downstream phases an authoritative map and locked decisions, not a parallel implementation of provider proof, authorization, package policy, sandbox labels, or privacy scanning. [VERIFIED: .planning/ROADMAP.md; 243-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Inventory Confuses Current Owner With Intended Owner

**What goes wrong:** A row says a surface is "provider-proofed" because the intended owner is runtime-service, while the current route still uses local or weaker semantics. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md]

**Why it happens:** Go TypeScript account save and selected Go counted eligibility are known drifts from runtime-service/provider proof semantics. [VERIFIED: apps/go-backend/live_backend.go; apps/go-backend/runtime_service_client.go]

**How to avoid:** Record both current owner and intended owner on every row, and keep the disposition separate from current behavior. [VERIFIED: 243-CONTEXT.md]

**Warning signs:** Row has no code reference, no current behavior, or no downstream phase. [VERIFIED: 243-CONTEXT.md]

### Pitfall 2: Characterization Test Accidentally Implements The Fix

**What goes wrong:** A "test" is coupled to a code change that makes TypeScript account save provider-proofed in Phase 243. [VERIFIED: .planning/ROADMAP.md]

**Why it happens:** The drift is obvious and tempting to fix while inventorying. [VERIFIED: .planning/research/PITFALLS.md]

**How to avoid:** Characterize current behavior and mark Phase 244 as the owner for behavior corrections. [VERIFIED: .planning/ROADMAP.md]

**Warning signs:** Phase 243 modifies `apps/go-backend/runtime_service_client.go`, `apps/go-backend/live_backend.go`, or runtime-service provider behavior beyond inventory/test-only changes. [VERIFIED: 243-CONTEXT.md]

### Pitfall 3: Aliases Are Listed But Not Classified As Bypass Risks

**What goes wrong:** Legacy Workshop source/submit/save aliases are recorded, but the row does not ask whether they bypass provider proof, authorization, package policy, TinyGo hiding, or public/default privacy. [VERIFIED: 243-CONTEXT.md]

**Why it happens:** Alias routes are often preserved for tests and local UX. [VERIFIED: .planning/research/PITFALLS.md]

**How to avoid:** Add one row per alias path and caller, with explicit bypass questions and a Phase 245 disposition. [VERIFIED: 243-CONTEXT.md]

**Warning signs:** `/api/workshop/source`, `/api/workshop/revisions/[revisionId]/source`, `/api/workshop/submit`, and `/api/workshop/revisions` are grouped as one generic "Workshop" row. [VERIFIED: codebase grep]

### Pitfall 4: Privacy Inventory Scans Rendered UI Only

**What goes wrong:** Public pages look safe, but API responses, generated artifacts, fixtures, or logs contain private fields or markers. [VERIFIED: .planning/research/PITFALLS.md]

**Why it happens:** Existing public-safe contracts apply to DTOs and artifacts, not only React output. [VERIFIED: packages/spec/src/public-output-privacy.ts; .planning/artifacts/v1.34-workshop-checker-contract.md]

**How to avoid:** Inventory API JSON, public pages, fixtures, generated evidence, and monitor outputs as separate surfaces. [VERIFIED: 243-CONTEXT.md]

**Warning signs:** A public/default row lacks `dataClass`, `privacyRisks`, or `requiredTestsOrProof`. [VERIFIED: 243-CONTEXT.md]

### Pitfall 5: Sandbox And Package Claims Are Treated As Documentation Only

**What goes wrong:** The inventory records label/docs surfaces but misses registry, validation, compatibility key, and monitor surfaces that enforce the same claims. [VERIFIED: .planning/REQUIREMENTS.md]

**Why it happens:** Labels look like copy, while package/sandbox posture is actually contract and eligibility data. [VERIFIED: packages/spec/src/runtime.ts]

**How to avoid:** Inventory spec runtime records, public labels, docs/Learn surfaces, runtime metadata policy, package mode checks, and monitor checks together. [VERIFIED: packages/spec/src/runtime.ts; package.json]

**Warning signs:** Rows mention "No packages" or "not certified" with no test/monitor reference. [VERIFIED: .planning/REQUIREMENTS.md]

## Code Examples

### Surface Discovery Commands

```bash
# Source: repo-local discovery pattern; use before updating inventory.
rg -n "account/revisions|workshop/source|workshop/revisions|ownerDebug|player:workshop-local|validateStrategy|runtimeAllowsCountedPlay|package\\.mode|TinyGo|sandbox|boundary:monitors" apps packages scripts .planning/artifacts
```

### Required Surface Group Check

```typescript
// Source: 243-CONTEXT.md D-01 plus existing Vitest script-test pattern.
const requiredGroups = [
  "account-save",
  "account-source-read",
  "owner-debug-replay",
  "workshop-alias",
  "competition-entry",
  "go-read-write",
  "provider-proof",
  "sandbox-claim",
  "package-policy",
  "tinygo-visibility",
  "privacy-monitor",
] as const
```

### Privacy Baseline Reuse

```typescript
// Source: packages/spec/src/public-output-privacy.ts.
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.ts"

for (const row of publicArtifactRows) {
  assertPublicOutputLeakSafe(row.publicExample, row.id)
}
```

### Go Characterization Target

```go
// Source: apps/go-backend/live_backend.go and runtime_service_client.go.
// Phase 243 should characterize current TypeScript validation-client rejection
// and account-save local-validation drift; Phase 244 should change behavior.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
| --- | --- | --- | --- |
| JS/TS local baseline with non-JS beta claims | Four production source formats are supported by provider/runtime-service evidence, with TypeScript/Python provenance and Rust/Zig WASM/WASI artifact backing. [VERIFIED: .planning/PROJECT.md; packages/spec/src/runtime.ts] | v1.32-v1.34 [VERIFIED: .planning/PROJECT.md] | Inventory must not preserve stale beta/non-promotion claims as active truth. [VERIFIED: .planning/artifacts/v1.32-language-surface-inventory.md] |
| Workshop checker returned validation-centric reports | Workshop checker contract now has `workshop-checker-v1.34` status, provider, artifact, provenance, cache identity, and privacy fields. [VERIFIED: packages/spec/src/workshop-checker.ts; .planning/artifacts/v1.34-workshop-checker-contract.md] | v1.34 [VERIFIED: .planning/PROJECT.md] | Phase 243 should use the checker contract as a public-safe reference, not as an account/entry gate. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Runtime readiness evidence could be read as promotion | Current v1.35 scope requires claim-calibrated labels: provenance-only for TypeScript/Python, immutable WASM/WASI artifact-backed for Rust/Zig, TinyGo hidden, and no default production sandbox certification. [VERIFIED: .planning/REQUIREMENTS.md] | v1.35 scope [VERIFIED: .planning/REQUIREMENTS.md] | Inventory must classify sandbox-claim surfaces and monitor requirements before label changes. [VERIFIED: .planning/ROADMAP.md] |
| Package policy described as unsupported | Current v1.35 scope treats `package.mode = "none"` as an enforced boundary. [VERIFIED: .planning/REQUIREMENTS.md; packages/spec/src/runtime.ts] | v1.35 scope [VERIFIED: .planning/REQUIREMENTS.md] | Inventory must include validation, account save, entry, registry, compatibility keys, diagnostics, and public evidence. [VERIFIED: .planning/REQUIREMENTS.md] |

**Deprecated/outdated:**
- Treating TypeScript account save local heuristics as enough for execution-ready/counted provider proof is outdated for v1.35 planning. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md; .planning/REQUIREMENTS.md]
- Treating TinyGo as production-visible is out of scope and contradicts current requirements. [VERIFIED: .planning/REQUIREMENTS.md; .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md]
- Treating production sandbox certification as current/default is out of scope and contradicted by v1.35 requirements. [VERIFIED: .planning/REQUIREMENTS.md; .planning/artifacts/v1.24-production-sandbox-readiness-matrix.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
| --- | --- | --- | --- |
| A1 | No `[ASSUMED]` claims are used in this research; all project claims are tied to repo files, artifacts, local commands, or npm registry checks. [VERIFIED: this research process] | All sections | None from assumed factual claims; planner should still confirm product decisions if it changes dispositions. [VERIFIED: 243-CONTEXT.md] |

## Open Questions

1. **Should the inventory JSON be committed as generated output or hand-maintained source?** [VERIFIED: existing artifacts include both generated and hand-authored patterns]
   - What we know: Prior artifacts include markdown and JSON evidence files, and scripts often support `--check`. [VERIFIED: .planning/artifacts list; scripts]
   - What's unclear: Phase 243 context leaves exact filenames/table/script structure to planner discretion. [VERIFIED: 243-CONTEXT.md]
   - Recommendation: Make markdown authoritative and JSON monitor-friendly; add `--check` only if generation is deterministic. [RECOMMENDED: existing script/artifact pattern]
2. **Should Phase 243 wire the inventory check into `pnpm boundary:monitors` immediately?** [VERIFIED: package.json]
   - What we know: Existing boundary monitors are comprehensive and can be slow. [VERIFIED: package.json]
   - What's unclear: The planner must decide whether inventory completeness is stable enough for every monitor run. [VERIFIED: 243-CONTEXT.md]
   - Recommendation: Add a focused script command first; wire to `boundary:monitors` only if it is deterministic and not environment-sensitive. [RECOMMENDED: package.json pattern]
3. **How many characterization tests are enough before Phase 244?** [VERIFIED: .planning/ROADMAP.md]
   - What we know: Behavior changes are out of scope, but safe characterization and inventory checks are allowed. [VERIFIED: 243-CONTEXT.md]
   - What's unclear: The exact test count depends on planner task slicing. [VERIFIED: 243-CONTEXT.md]
   - Recommendation: Minimum tests should cover required surface groups, known TypeScript account-save/provider-proof drift, alias classification, owner-debug request semantics, TinyGo absence, package mode `none`, and privacy marker inventory. [RECOMMENDED: requirements and codebase scan]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| --- | --- | --- | --- | --- |
| Node.js | TypeScript scripts/tests | yes [VERIFIED: local command] | `v24.15.0` [VERIFIED: local command] | None needed. [VERIFIED: package.json] |
| pnpm | Monorepo scripts | yes [VERIFIED: local command] | `11.1.2` [VERIFIED: local command] | None needed. [VERIFIED: package.json] |
| Go | Go characterization tests | yes [VERIFIED: local command] | `go1.26.3` local; module declares `go 1.25.0` [VERIFIED: local command; apps/go-backend/go.mod] | None needed. [VERIFIED: apps/go-backend/go.mod] |
| Docker | Optional service/topology checks | yes [VERIFIED: local command] | `29.4.0` [VERIFIED: local command] | Static inventory can run without Docker. [VERIFIED: package.json] |
| Wasmtime | Optional WASM/WASI proof checks | yes [VERIFIED: local command] | `45.0.0` [VERIFIED: local command] | Static inventory can run without Wasmtime. [VERIFIED: package.json] |
| Python | Optional Python provider proof checks | yes [VERIFIED: local command] | `3.9.6` [VERIFIED: local command] | Static inventory can run without Python. [VERIFIED: package.json] |
| Rust | Optional Rust provider proof checks | yes [VERIFIED: local command] | `rustc 1.95.0` [VERIFIED: local command] | Static inventory can run without Rust. [VERIFIED: package.json] |
| Zig | Optional Zig provider proof checks | yes [VERIFIED: local command] | `0.16.0` [VERIFIED: local command] | Static inventory can run without Zig. [VERIFIED: package.json] |
| TinyGo | Spike evidence check only | yes [VERIFIED: local command] | `0.41.1` [VERIFIED: local command] | TinyGo production support remains out of scope. [VERIFIED: .planning/REQUIREMENTS.md] |

**Missing dependencies with no fallback:** None found for Phase 243 research/planning. [VERIFIED: local command audit]

**Missing dependencies with fallback:** None found; service-backed downstream proof can still be planned as optional where runtime services are unavailable. [VERIFIED: package.json; .planning/ROADMAP.md]

## Validation Architecture

### Test Framework

| Property | Value |
| --- | --- |
| Framework | Vitest `^4.1.6` in repo, npm latest `4.1.8`; Go test with module `go 1.25.0`; Playwright `^1.60.0`. [VERIFIED: package.json; npm registry; apps/go-backend/go.mod] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts`, `apps/go-backend/go.mod`. [VERIFIED: file scan] |
| Quick run command | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matches/[matchId]/replay/owner-debug.test.ts packages/spec/src/workshop-checker.test.ts` [VERIFIED: file scan; vitest.config.ts] |
| Go quick command | `cd apps/go-backend && go test ./...` [VERIFIED: package.json] |
| Full suite command | `pnpm test:fast` then `pnpm boundary:monitors` for the phase gate if changed files touch monitors/proof. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
| --- | --- | --- | --- | --- |
| INV-01 | Inventory includes every required surface group and code/artifact/test references. [VERIFIED: .planning/REQUIREMENTS.md] | unit/script | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` [RECOMMENDED: existing script-test pattern] | No; Wave 0 should create if a script is planned. [VERIFIED: file scan] |
| INV-02 | Every row has disposition, current owner, intended owner, trust boundary, data class, tests/proof, privacy risks, and downstream phase. [VERIFIED: 243-CONTEXT.md] | unit/script | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` [RECOMMENDED: existing script-test pattern] | No; Wave 0 should create if a script is planned. [VERIFIED: file scan] |
| INV-03 | Locked decision register exists before behavior changes and can be consumed by downstream phases. [VERIFIED: .planning/REQUIREMENTS.md] | static/check | `pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --check` [RECOMMENDED: existing evaluator pattern] | No; Wave 0 should create if scripted. [VERIFIED: file scan] |
| INV-01/02 | Known TypeScript account-save/provider-proof drift is represented as inventory row and not silently fixed. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md] | Go characterization/static inventory | `cd apps/go-backend && go test ./...` plus inventory check. [VERIFIED: package.json] | Existing Go tests cover Python/Rust/Zig proof helpers; TypeScript drift-specific test likely absent. [VERIFIED: apps/go-backend/main_test.go; rg output] |
| INV-01/02 | Owner-debug/local Workshop identity is inventoried and characterized. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts; apps/web/app/workshop/workshop-client-state.ts] | unit | `pnpm exec vitest run apps/web/app/matches/[matchId]/replay/owner-debug.test.ts apps/web/app/workshop/workshop-client.test.tsx` [VERIFIED: file scan] | Yes. [VERIFIED: file scan] |
| INV-01/02 | Workshop aliases are inventoried by path/caller and classified. [VERIFIED: codebase grep] | unit/static inventory | `pnpm exec vitest run apps/web/app/api/workshop/revisions/route.test.ts apps/web/app/api/workshop/validate/route.test.ts` plus inventory check. [VERIFIED: file scan] | Partial; alias classification test likely absent. [VERIFIED: file scan] |
| INV-01/02 | Privacy markers and public/default forbidden data classes are represented. [VERIFIED: 243-CONTEXT.md; packages/spec/src/public-output-privacy.ts] | unit/script | `pnpm exec vitest run packages/spec/src/spec.test.ts packages/spec/src/workshop-checker.test.ts scripts/check-boundary-monitors.test.ts` [VERIFIED: file scan] | Yes for existing contracts; v1.35 row test absent. [VERIFIED: file scan] |

### Sampling Rate

- **Per task commit:** Run the focused Vitest/Go command that touches the edited artifact/script. [VERIFIED: package.json; test scan]
- **Per wave merge:** Run `pnpm test:fast` if scripts/contracts/tests changed; run `cd apps/go-backend && go test ./...` if Go-related inventory/test files changed. [VERIFIED: package.json]
- **Phase gate:** Run `pnpm test:fast`; run `pnpm boundary:monitors` if Phase 243 wires any new inventory check into monitors or changes monitor inputs. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `scripts/evaluate-v1-35-boundary-surface-inventory.ts` if planner wants deterministic JSON generation/checking. [RECOMMENDED: existing evaluator pattern]
- [ ] `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` if planner wants automated row coverage. [RECOMMENDED: existing Vitest pattern]
- [ ] `.planning/artifacts/v1.35-boundary-surface-inventory.md` and optional `.json` authoritative outputs. [RECOMMENDED: existing artifact pattern]
- [ ] TypeScript drift characterization for Go account save/entry, if planner wants a direct failing/freeze test before Phase 244. [RECOMMENDED: .planning/artifacts/v1.34-workshop-checker-inventory.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
| --- | --- | --- |
| V2 Authentication | yes [VERIFIED: account and owner-private requirements] | Inventory account/session ownership surfaces and mark `player:workshop-local` as local/test-only quarantine candidate. [VERIFIED: .planning/REQUIREMENTS.md; apps/web/app/workshop/workshop-client-state.ts] |
| V3 Session Management | yes [VERIFIED: Go `cowards_session` session handling] | Inventory session-required account source/write routes and private/no-store responses. [VERIFIED: apps/go-backend/live_backend.go; apps/web/app/api/account/revisions/[revisionId]/source/route.ts] |
| V4 Access Control | yes [VERIFIED: AUTH/PRIV/API requirements] | Record server-side owner/participant boundary and alias bypass questions on every private/replay/source row. [VERIFIED: .planning/REQUIREMENTS.md] |
| V5 Input Validation | yes [VERIFIED: runtime/service boundaries] | Use Zod/spec contracts in TS and explicit Go validation/client schema checks; do not accept unknown provider/runtime/package metadata silently. [VERIFIED: packages/spec/src/schemas.ts; apps/go-backend/runtime_service_client.go] |
| V6 Cryptography | yes [VERIFIED: provider proof uses HMAC] | Reuse existing HMAC SHA-256 provider proof; do not hand-roll new Phase 243 crypto. [VERIFIED: apps/runtime-service/src/server.ts; apps/go-backend/live_backend.go] |
| V7 Error Handling and Logging | yes [VERIFIED: privacy requirements] | Inventory public-safe diagnostic/error surfaces and forbid raw diagnostics, paths, tokens, DB details, private runtime internals, and provider signing proof in default outputs. [VERIFIED: .planning/REQUIREMENTS.md; packages/spec/src/public-output-privacy.ts] |
| V8 Data Protection | yes [VERIFIED: public/private replay and source requirements] | Classify every row as public/session/owner-private/internal-private and require privacy proof for public/default outputs. [VERIFIED: 243-CONTEXT.md] |
| V10 Malicious Code | yes [VERIFIED: hostile Strategy boundary] | Keep Strategy validation/build/execution behind runtime-service/provider boundary; inventory any web/API/Go path that could imply execution. [VERIFIED: AGENTS.md; apps/runtime-service/src/server.ts] |

### Known Threat Patterns for Coward's Game v1.35

| Pattern | STRIDE | Standard Mitigation |
| --- | --- | --- |
| Legacy alias bypasses account auth/provider proof/package policy | Elevation of privilege / Tampering [VERIFIED: 243-CONTEXT.md] | Route-by-route alias disposition plus tests proving retained aliases cannot bypass current contracts. [VERIFIED: 243-CONTEXT.md] |
| Public/default output leaks source, memory, objectives, diagnostics, artifacts, host paths, or tokens | Information disclosure [VERIFIED: .planning/REQUIREMENTS.md] | Use existing privacy marker contracts and add v1.35 artifact/API/page scan rows. [VERIFIED: packages/spec/src/public-output-privacy.ts] |
| Local Workshop identity authorizes persisted private behavior | Spoofing / Elevation of privilege [VERIFIED: .planning/REQUIREMENTS.md] | Quarantine `player:workshop-local` to ephemeral Workshop/test-only flows. [VERIFIED: .planning/REQUIREMENTS.md] |
| Provider proof unavailable causes local fallback | Tampering / Elevation of privilege [VERIFIED: .planning/research/PITFALLS.md] | Inventory fail-closed or non-execution-draft decision for Phase 244; no behavior fix in Phase 243. [VERIFIED: .planning/ROADMAP.md] |
| Sandbox certification or package support overclaim | Repudiation / Information disclosure [VERIFIED: .planning/REQUIREMENTS.md] | Inventory labels, docs, registry, compatibility keys, and monitors as claim-boundary surfaces. [VERIFIED: packages/spec/src/runtime.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables, build order, testing expectations. [VERIFIED: local file]
- `.planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md` - locked user decisions and phase boundary. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - INV-01, INV-02, INV-03 and v1.35 hard boundaries. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 243 goal, success criteria, and downstream phase split. [VERIFIED: local file]
- `.planning/STATE.md` - active Phase 243 position and blockers. [VERIFIED: local file]
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md`, `FEATURES.md`, `PITFALLS.md`, `STACK.md` - v1.35 research synthesis. [VERIFIED: local files]
- `apps/go-backend/live_backend.go`, `runtime_service_client.go`, `main_test.go`, `runtime_service_client_test.go` - Go surfaces and current proof/eligibility behavior. [VERIFIED: codebase]
- `apps/web/app/api/...`, `apps/web/lib/...`, `apps/web/app/matches/...`, `apps/web/app/workshop/...` - Next routes, account boundary, owner-debug, Workshop aliases. [VERIFIED: codebase]
- `apps/runtime-service/src/server.ts`, `redaction.ts` - runtime-service validation/proof and redaction behavior. [VERIFIED: codebase]
- `packages/spec/src/runtime.ts`, `workshop-checker.ts`, `public-output-privacy.ts` - canonical runtime/provider/package/privacy/checker contracts. [VERIFIED: codebase]
- `package.json`, `vitest.config.ts`, `playwright.config.ts`, `apps/go-backend/go.mod` - test/tool stack and commands. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - recent inventory baseline for Workshop checker/account/entry/provider-proof drift. [VERIFIED: local artifact]
- `.planning/artifacts/v1.34-workshop-checker-contract.md` and `v1.34-workshop-checker-proof.md` - checker contract/proof baseline. [VERIFIED: local artifacts]
- `.planning/artifacts/v1.32-language-surface-inventory.md` and `v1.32-four-language-parity-matrix.md` - four-language surface/parity baseline. [VERIFIED: local artifacts]
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - no-certification posture baseline. [VERIFIED: local artifact]
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only evidence. [VERIFIED: local artifact]
- npm registry checks for current package versions and publish dates. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None used for factual recommendations. [VERIFIED: research process]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package and tool versions were verified from repo manifests, local commands, and npm registry. [VERIFIED: package.json; local commands; npm registry]
- Architecture: HIGH - ownership boundaries are explicit in AGENTS, roadmap, code, and prior artifacts. [VERIFIED: AGENTS.md; .planning/ROADMAP.md; codebase]
- Pitfalls: HIGH - each listed pitfall maps to current code or locked context decisions. [VERIFIED: codebase; 243-CONTEXT.md]
- Exact future dispositions: MEDIUM - Phase 243 must lock row-by-row decisions, and context leaves filenames/table/script shape to planner discretion. [VERIFIED: 243-CONTEXT.md]

**Research date:** 2026-06-14 [VERIFIED: system date]
**Valid until:** 2026-07-14 for repo-local Phase 243 planning, unless upstream code/routes change first. [RECOMMENDED: current phase planning horizon]
