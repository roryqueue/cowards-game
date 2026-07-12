# Phase 249: Competition Surface Inventory and Policy Lock - Research

**Researched:** 2026-06-15 [VERIFIED: system date]
**Domain:** v1.36 public beta trial competition posture, surface inventory, policy vocabulary, privacy exclusions, and copy/privacy monitors [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; .planning/ROADMAP.md]
**Confidence:** HIGH for local architecture and implementation patterns; MEDIUM for exact final filenames and row taxonomy left to planner discretion [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; codebase grep]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Public Posture Copy
- **D-01:** Public posture copy should be prominent and plain, not hidden in help text and not styled like a scary warning. It should appear near standings, entry, result, replay, player, Strategy, and other competition trust surfaces where counted or trial evidence appears.
- **D-02:** The default phrase is **public beta trial competition**. Nearby copy must explain resettable Season-scoped standings and no durable permanent rating promise.
- **D-03:** The no-durable-rating/reset language belongs on every competition trust surface, not only entry or standings.
- **D-04:** Completed and archived Seasons must still carry the trial/resettable/no durable rating label so historical evidence never reads like permanent official rating truth.

### Inventory Granularity
- **D-05:** Phase 249 should produce a route/code/artifact inventory modeled after v1.35 Phase 243, not only a broad owner/risk matrix.
- **D-06:** Inventory surfaces include everything that can affect public trust: routes, DTOs, pages, persistence modules, Go paths, UI copy, docs, monitors, proof scripts, proof artifacts, tests, fixtures, and relevant snapshots.
- **D-07:** Every inventory row should have one downstream disposition: `lock-now`, `fix-in-250`, `fix-in-251`, `fix-in-252`, `fix-in-253`, `fix-in-254`, `prove-in-255`, or `future/defer`.
- **D-08:** Phase 249 should write both a Markdown inventory for humans and a JSON inventory for monitors/proof tooling.

### Policy Contract Shape
- **D-09:** `competition-policy-v1.36` should be a spec-owned schema/constants contract in `@cowards/spec` that downstream monitors and UI can consume.
- **D-10:** Phase 249 should lock policy vocabulary and public labels: posture, resettable Season semantics, no durable rating promise, counted-state public projection vocabulary, privacy exclusions, and forbidden-claim categories/examples.
- **D-11:** Counted-state work in Phase 249 is public projection vocabulary only. Exact persistence enum names and storage/internal mappings belong to Phase 252 unless a later plan proves they must be introduced earlier.
- **D-12:** Forbidden claims should be represented as both categories and examples so monitors can reason by category while humans have concrete examples to avoid.

### Forbidden Claims Monitor
- **D-13:** Phase 249 should add a broad copy/privacy scan, not only a narrow keyword guard or a contract-existence test.
- **D-14:** The monitor should fail loud for clear violations in Phase 249, with explicit handling for documented false positives.
- **D-15:** The default scan scope should include `.planning`, `packages`, `apps`, `scripts`, and relevant fixtures/snapshots where text appears.
- **D-16:** The monitor should check both presence and absence: required public beta trial/no durable rating/resettable posture labels where the inventory says they must appear, and forbidden claims/private markers absent.

### the agent's Discretion
The planner may choose exact filenames, table columns, JSON schema details, monitor helper names, and test grouping. Preserve the decisions above, prefer existing v1.35 inventory/proof/monitor patterns, and avoid adding broad public DTO or persistence enum designs before later phases own those behaviors.

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

None - discussion stayed within Phase 249 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POST-01 | Public competition surfaces describe Coward's Game competition as public beta trial competition with resettable season-scoped standings. [VERIFIED: .planning/REQUIREMENTS.md] | Use a spec-owned `competition-policy-v1.36` posture label and inventory-enforced required-copy rows for competition trust surfaces. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; packages/spec/src/competition.ts] |
| POST-02 | Public competition surfaces clearly state that v1.36 does not promise durable permanent ratings, all-time rankings, rating refunds, or mature staffed moderation. [VERIFIED: .planning/REQUIREMENTS.md] | Add forbidden-claim categories and required reset/no-durable-rating copy checks to the v1.36 monitor. [VERIFIED: .planning/REQUIREMENTS.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| POST-03 | A versioned competition policy contract defines public beta posture, reset policy, counted-state vocabulary, privacy exclusions, forbidden claims, and authoritative owners for competition decisions. [VERIFIED: .planning/REQUIREMENTS.md] | Extend `@cowards/spec` with constants/schemas rather than creating a new package, because `packages/spec/src/index.ts` exports competition, public-discovery, and privacy contracts today. [VERIFIED: packages/spec/src/index.ts; packages/spec/src/competition.ts; packages/spec/src/public-discovery.ts; packages/spec/src/public-output-privacy.ts] |
| POST-04 | Competition surfaces are inventoried with owner, public/private data class, counted behavior, replay evidence requirement, and privacy risk. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse the v1.35 paired Markdown/JSON inventory pattern, changing row fields to competition-surface owner, data class, counted behavior, replay evidence, privacy risk, and one downstream disposition. [VERIFIED: .planning/artifacts/v1.35-boundary-surface-inventory.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| POST-05 | Public copy monitors reject durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, or private-runtime overclaims. [VERIFIED: .planning/REQUIREMENTS.md] | Add a fail-loud Phase 249 copy/privacy monitor to `scripts/check-boundary-monitors.ts` and package scripts, modeled on the v1.35 monitor functions and tests. [VERIFIED: scripts/check-boundary-monitors.ts; scripts/check-boundary-monitors.test.ts] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Coward's Game is a deterministic two-player programmable strategy game where autonomous Strategy Revisions control Soldiers after Match start without human input or live model inference. [VERIFIED: AGENTS.md]
- Engine code must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not be placed in React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be treated as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Strategy code is hostile and every runtime boundary must be schema-validated. [VERIFIED: AGENTS.md]
- Canonical terminology must preserve Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, and Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Planning work must read `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and `.planning/research/SUMMARY.md`. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board realism checks, but Phase 249 should only inventory/proof-label these because it does not change Match creation or replay rendering. [VERIFIED: AGENTS.md; .planning/ROADMAP.md]

## Summary

Phase 249 should be planned as a contract, inventory, and monitor-lock phase, not as a behavior implementation phase. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; .planning/ROADMAP.md] The plan should create `competition-policy-v1.36` in `@cowards/spec`, generate synchronized Markdown and JSON inventory artifacts, and wire a deterministic fail-loud copy/privacy monitor into the existing boundary monitor chain. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts; scripts/check-boundary-monitors.ts]

The closest implementation precedent is v1.35 Phase 243: it created a typed evaluator script, a Markdown artifact, a JSON artifact, validation for required row groups and dispositions, forbidden overclaim checks, public/default leakage marker checks, `--write`/`--check` commands, package scripts, monitor wiring, and Vitest coverage. [VERIFIED: .planning/artifacts/v1.35-boundary-surface-inventory.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts; scripts/evaluate-v1-35-boundary-surface-inventory.test.ts; scripts/check-boundary-monitors.test.ts] Phase 249 should reuse that shape with competition-specific row groups, dispositions, policy vocabulary, required posture-label presence checks, and forbidden/private-marker absence checks. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; codebase grep]

The main planning risk is scope creep into Phase 250-255 behavior. [VERIFIED: .planning/ROADMAP.md; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] Phase 249 may define public projection vocabulary for counted states, but exact persistence enum names, entry enforcement, Season lifecycle transitions, standings recomputation, governance workflows, public UX redesigns, service-backed proof, and replay board proof belong to later phases. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; .planning/ROADMAP.md]

**Primary recommendation:** Implement Phase 249 as `@cowards/spec` policy constants/schemas plus `.planning/artifacts/v1.36-competition-surface-inventory.{md,json}` and a deterministic `v1.36:competition-policy:check` monitor modeled on `scripts/evaluate-v1-35-boundary-surface-inventory.ts`. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Competition policy vocabulary and public labels | API / Backend contract tier via `@cowards/spec` | Web UI, proof scripts | `@cowards/spec` already exports competition, public discovery, and privacy contracts consumed by downstream code. [VERIFIED: packages/spec/src/index.ts; packages/spec/src/competition.ts; packages/spec/src/public-discovery.ts] |
| Route/code/artifact inventory | Static tooling / planning artifacts | Boundary monitors | v1.35 inventory generation is a local-file-only evaluator that writes Markdown/JSON and checks drift. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts; .planning/artifacts/v1.35-boundary-surface-inventory.md] |
| Required posture-copy presence | Static tooling / boundary monitors | Web UI snapshots later | Phase 249 must detect required public beta trial/resettable/no-durable labels where inventory rows mark them required; later UI phases render final copy. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| Forbidden claim/private marker absence | Static tooling / boundary monitors | Public DTO leak guards | Existing privacy guards and monitors reject private fields/markers and v1.35 overclaims; Phase 249 should broaden those checks for v1.36 competition copy. [VERIFIED: packages/spec/src/public-output-privacy.ts; scripts/evaluate-v1-35-boundary-surface-inventory.ts; scripts/check-boundary-monitors.ts] |
| Counted-state public projection vocabulary | `@cowards/spec` | Persistence and UI in later phases | `packages/spec/src/competition.ts` already defines `LadderMatchSetCountedStatus`; Phase 249 locks labels/projection vocabulary only. [VERIFIED: packages/spec/src/competition.ts; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| Entry, Season, standings, governance behavior | Later API / Backend phases | Web UI projections later | Roadmap assigns entry to 250, Season lifecycle to 251, standings to 252, governance to 253, UX to 254, and proof to 255. [VERIFIED: .planning/ROADMAP.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm workspace | `pnpm@11.1.2` in repo | Package scripts and monitor command orchestration | Existing root scripts run all milestone evaluators and boundary monitors through pnpm. [VERIFIED: package.json; command `pnpm --version`] |
| TypeScript | repo `^6.0.3`; npm current `6.0.3`, modified 2026-04-16 | Typed spec contracts, evaluator scripts, and tests | Existing spec contracts, public DTOs, and evaluator scripts are TypeScript. [VERIFIED: package.json; npm registry; packages/spec/src/*.ts; scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| `tsx` | repo `^4.22.0`; npm current `4.22.4`, modified 2026-05-31 | Execute TypeScript evaluator scripts | Existing milestone scripts use `pnpm exec tsx`. [VERIFIED: package.json; npm registry; scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| Vitest | repo `^4.1.6`; npm current `4.1.9`, modified 2026-06-15 | Unit tests for spec, evaluator, and monitor helpers | Existing evaluator and monitor tests use Vitest. [VERIFIED: package.json; npm registry; vitest.config.ts; scripts/evaluate-v1-35-boundary-surface-inventory.test.ts] |
| Zod | repo `^4.4.3`; npm current `4.4.3`, modified 2026-05-04 | Public DTO schemas in `@cowards/spec` | `public-discovery.ts` defines DTO schemas with Zod. [VERIFIED: packages/spec/package.json; npm registry; packages/spec/src/public-discovery.ts] |
| `@cowards/spec` | workspace `0.1.0` | Versioned policy constants, public DTO vocabulary, privacy exclusions | Phase decisions require `competition-policy-v1.36` to be spec-owned, and `@cowards/spec` already exports competition/public/privacy modules. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; packages/spec/package.json; packages/spec/src/index.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js / React | repo Next `^16.2.6`, npm current `16.2.9`; repo React `^19.2.6`, npm current `19.2.7` | Public competition trust surfaces | Inventory routes/pages now; defer broad page rewrites to Phase 254. [VERIFIED: apps/web/package.json; npm registry; .planning/ROADMAP.md] |
| Playwright | repo `^1.60.0`; npm current `1.61.0`, modified 2026-06-15 | Later browser proof and replay realism | Phase 249 should inventory proof requirements, not run service-backed UX proof; Phase 255 owns service-backed proof. [VERIFIED: package.json; npm registry; playwright.config.ts; .planning/ROADMAP.md] |
| Go backend | repo `go 1.25.0`; local tool `go1.26.3`; `pgx/v5 v5.9.2` | Backend competition surfaces and later behavior owners | Include Go paths in the inventory because context explicitly names Go paths and v1.35 artifacts inventoried Go owners. [VERIFIED: apps/go-backend/go.mod; command `go version`; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| `scripts/check-boundary-monitors.ts` | local script | Monitor hub | Add a named v1.36 monitor helper and register it in `runBoundaryMonitorChecks`. [VERIFIED: scripts/check-boundary-monitors.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend `@cowards/spec` | New `@cowards/competition-policy` package | New package would contradict the locked spec-owned contract decision and add dependency churn. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| Static evaluator plus artifacts | Manual Markdown-only inventory | Manual-only inventory would not satisfy the locked JSON artifact and monitor/proof tooling decision. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| Deterministic local monitor | Browser/E2E proof in Phase 249 | Browser/service proof belongs to Phase 255; Phase 249 should fail-loud on static copy/privacy violations without depending on services. [VERIFIED: .planning/ROADMAP.md; scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| Policy vocabulary only | Final persistence enum design | Final storage/internal mappings are explicitly deferred to Phase 252 unless a later plan proves otherwise. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |

**Installation:**

```bash
# No dependency installation is recommended for Phase 249.
pnpm install --frozen-lockfile
```

**Version verification:** Current npm registry versions were checked on 2026-06-15 with `npm view <package> version time.modified`; repo versions are close enough for this static contract phase and dependency upgrades should be avoided unless tests force them. [VERIFIED: npm registry; package.json]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 249 input:
  CONTEXT.md decisions + ROADMAP/REQUIREMENTS + codebase route/spec/artifact scan
        |
        v
@cowards/spec: competition-policy-v1.36
  - posture labels
  - reset/no-durable labels
  - counted-state public projection vocabulary
  - privacy exclusions
  - forbidden claim categories/examples
        |
        v
Inventory evaluator script
  - discovers/defines competition trust surfaces
  - validates required groups, owners, data classes, counted behavior, replay proof, privacy risk
  - writes Markdown + JSON artifacts
        |
        v
Boundary monitor integration
  - checks artifacts are current
  - fails on forbidden claims/private markers
  - checks required posture labels where inventory says required
        |
        v
Downstream phases 250-255
  - consume locked policy vocabulary and row dispositions
  - implement entry, Season, standings, governance, UX, and final proof
```

### Recommended Project Structure

```text
packages/spec/src/
├── competition.ts                         # existing competition vocabulary and likely home for policy exports
├── competition-policy-v1-36.ts            # optional focused module if planner wants separation
├── public-output-privacy.ts               # existing private marker guard to reuse/extend
└── index.ts                               # export new policy contract

scripts/
├── evaluate-v1-36-competition-policy.ts   # write/check inventory artifacts and validate row contract
├── evaluate-v1-36-competition-policy.test.ts
├── check-boundary-monitors.ts             # register v1.36 monitor
└── check-boundary-monitors.test.ts

.planning/artifacts/
├── v1.36-competition-surface-inventory.md
└── v1.36-competition-surface-inventory.json
```

This structure mirrors v1.35 evaluator/artifact/monitor placement while keeping policy ownership in `@cowards/spec`. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts; .planning/artifacts/v1.35-boundary-surface-inventory.md; packages/spec/src/index.ts]

### Pattern 1: Spec-Owned Versioned Policy Contract

**What:** Define exact constants and schemas for posture labels, reset policy labels, no-durable-rating labels, counted-state public projection labels, privacy exclusions, forbidden claim categories/examples, and authoritative owners. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

**When to use:** Use this before any UI, persistence, Go, or proof phase needs public competition vocabulary. [VERIFIED: .planning/ROADMAP.md]

**Example:**

```typescript
// Source: packages/spec/src/competition.ts and Phase 249 CONTEXT decisions.
export const COMPETITION_POLICY_V1_36_ID = "competition-policy-v1.36" as const

export const COMPETITION_POLICY_V1_36_POSTURE = {
  publicLabel: "public beta trial competition",
  standingsScope: "resettable-season-scoped",
  durableRatingPromise: "none",
} as const
```

### Pattern 2: Paired Markdown/JSON Inventory Artifacts

**What:** Generate a human-readable Markdown inventory and a machine-readable JSON inventory from the same typed row source. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts]

**When to use:** Use for route/code/artifact inventory rows because Phase 249 requires Markdown plus JSON and one downstream disposition per row. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

**Example:**

```typescript
// Source: scripts/evaluate-v1-35-boundary-surface-inventory.ts
export const artifactPaths = {
  json: ".planning/artifacts/v1.36-competition-surface-inventory.json",
  markdown: ".planning/artifacts/v1.36-competition-surface-inventory.md",
} as const
```

### Pattern 3: Fail-Loud Monitor Helper Registered in Existing Hub

**What:** Export a check helper from the evaluator, wrap it in `check-boundary-monitors.ts`, and add package script wiring so full boundary checks catch drift. [VERIFIED: scripts/check-boundary-monitors.ts; scripts/check-boundary-monitors.test.ts; package.json]

**When to use:** Use for artifact staleness, row sync drift, forbidden overclaims, required posture-label presence, and forbidden private-marker absence. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

**Example:**

```typescript
// Source: scripts/check-boundary-monitors.ts v1.35 monitor pattern.
export const checkV136CompetitionPolicyMonitor = (): string => {
  const failures = checkV136CompetitionPolicyArtifacts()
  if (failures.length > 0) {
    throw new Error(failures.join("; "))
  }
  return "v1.36 competition policy artifacts are current"
}
```

### Anti-Patterns to Avoid

- **UI-only posture copy:** React text without a spec-owned policy contract will drift across pages and cannot be reused by monitors. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; AGENTS.md]
- **Markdown-only inventory:** It would miss the locked JSON output needed for monitor/proof tooling. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
- **Implementing entry/Season/standings behavior in Phase 249:** Later roadmap phases own those behaviors. [VERIFIED: .planning/ROADMAP.md]
- **Using broad regexes without documented false positives:** Phase decisions require broad scans that fail loud for clear violations and explicitly handle documented false positives. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
- **Making stronger runtime claims while writing competition copy:** v1.36 hard boundaries forbid production sandbox, package ecosystem, TinyGo production, and durable rating promises. [VERIFIED: .planning/REQUIREMENTS.md; .planning/ROADMAP.md; .planning/STATE.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Public DTO/schema validation | Ad hoc object checks | Zod schemas in `@cowards/spec` | Existing public discovery DTOs already use Zod and leak-safe validation. [VERIFIED: packages/spec/src/public-discovery.ts; packages/spec/src/public-discovery.test.ts] |
| Public/private leak scanning | Custom one-off string walker | `assertPublicOutputLeakSafe` and existing monitor marker sets | Existing guard normalizes forbidden fields and scans forbidden markers. [VERIFIED: packages/spec/src/public-output-privacy.ts; scripts/check-boundary-monitors.ts] |
| Inventory rendering/checking | Separate manual Markdown and JSON editors | Single typed evaluator with render/check/write functions | v1.35 prevents stale artifacts and Markdown/JSON drift this way. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts] |
| Boundary monitor orchestration | New monitor runner | Existing `scripts/check-boundary-monitors.ts` and `pnpm boundary:monitors` | Existing root script already chains contract, parity, proof, and boundary checks. [VERIFIED: package.json; scripts/check-boundary-monitors.ts] |
| Counted-state storage model | Final persistence enum design in Phase 249 | Public projection vocabulary constants only | Phase decisions defer exact persistence enum/internal mappings to Phase 252. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |

**Key insight:** Phase 249's value is lock-step vocabulary and drift prevention; custom behavior systems would weaken the downstream plan by stealing scope from Phases 250-255. [VERIFIED: .planning/ROADMAP.md; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Phase 249 Implements Later Behavior

**What goes wrong:** The inventory script or policy contract adds entry gates, Season lifecycle behavior, standings recomputation, governance workflows, or UI redesigns. [VERIFIED: .planning/ROADMAP.md]
**Why it happens:** Existing files already contain ladder, governance, and result code, so it is easy to fix nearby behavior while inventorying. [VERIFIED: packages/persistence/src/ladder.ts; packages/persistence/src/governance.ts; apps/web/app/matchsets/result-view-model.ts]
**How to avoid:** Each inventory row gets one downstream disposition, and behavior changes are assigned to Phase 250-255. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
**Warning signs:** New database migrations, new entry rejection behavior, standings recompute changes, or governance state transitions appear in a Phase 249 plan. [VERIFIED: .planning/ROADMAP.md]

### Pitfall 2: Copy Says "Public Beta" But Still Implies Durability

**What goes wrong:** Pages mention beta once but still use permanent-rank, all-time, refund, official rating, or mature moderation language elsewhere. [VERIFIED: .planning/REQUIREMENTS.md; .planning/research/PITFALLS.md]
**Why it happens:** Standing/result/player/Strategy pages can each invent local labels. [VERIFIED: apps/web route inventory via `find apps/web/app ...`]
**How to avoid:** The policy contract should include required labels and forbidden categories/examples, and the monitor should check both required presence and forbidden absence. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
**Warning signs:** The inventory marks a trust surface as public/counting-related but no required posture label is associated with it. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

### Pitfall 3: Private Markers Leak Through Artifacts or Fixtures

**What goes wrong:** Public/default output or proof artifacts include raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, dispute internals, account-recovery payloads, or operator-only governance details. [VERIFIED: .planning/REQUIREMENTS.md; packages/spec/src/public-output-privacy.ts]
**Why it happens:** Phase 249 scans `.planning`, fixtures, snapshots, scripts, packages, and apps, not only runtime DTOs. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
**How to avoid:** Extend existing forbidden marker arrays and assert leak safety for policy/inventory JSON, Markdown, public fixtures, and monitor public payloads. [VERIFIED: packages/spec/src/public-output-privacy.ts; scripts/check-boundary-monitors.ts]
**Warning signs:** A public inventory row has `dataClass: public` and current behavior text saying it "returns" or "exposes" a private marker. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts]

### Pitfall 4: Required Copy Checks Are Too Narrow

**What goes wrong:** The monitor only checks a few keywords and misses pages, fixtures, snapshots, or documentation that shape public trust. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
**Why it happens:** Simple keyword guards are easier than row-aware scans. [ASSUMED]
**How to avoid:** Let inventory rows declare whether posture labels are required, then validate required phrases for those rows and forbidden/private markers across default scan scope. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
**Warning signs:** Monitor tests pass with no inventory row coverage for player, Strategy, result, replay, Season, entry, and standings trust surfaces. [VERIFIED: .planning/REQUIREMENTS.md; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

## Code Examples

Verified patterns from local sources:

### Public Leak Guard

```typescript
// Source: packages/spec/src/public-output-privacy.ts
export const assertPublicOutputLeakSafe = (
  value: unknown,
  label = "Public output",
): void => {
  // Existing implementation recursively rejects forbidden fields and markers.
}
```

Use this guard directly or route v1.36 public policy/inventory/proof artifacts through equivalent marker checks. [VERIFIED: packages/spec/src/public-output-privacy.ts]

### Inventory Validation Shape

```typescript
// Source: scripts/evaluate-v1-35-boundary-surface-inventory.ts
export const validateV135BoundarySurfaceInventory = (
  inventory: V135BoundarySurfaceInventory,
): readonly string[] => {
  const errors: string[] = []
  // Existing implementation checks schema version, required groups, allowed
  // dispositions, data classes, downstream phases, requirement IDs, duplicates,
  // overclaims, and public/default leakage markers.
  return errors
}
```

Use the same validator architecture for `validateV136CompetitionSurfaceInventory`. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts]

### Existing Counted Vocabulary Anchor

```typescript
// Source: packages/spec/src/competition.ts
export type LadderMatchSetCountedStatus =
  | "pending"
  | "counted"
  | "retrying"
  | "under_review"
  | "invalid"
  | "non_competitive"
  | "non_counted"
```

Phase 249 should lock public projection labels around this vocabulary without finalizing Phase 252 persistence/internal mappings. [VERIFIED: packages/spec/src/competition.ts; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Alpha/trial surfaces with scattered evidence labels | Public beta trial competition posture with resettable Season-scoped standings and no durable rating promise | v1.36 roadmap on 2026-06-15 | Phase 249 must lock product vocabulary before behavior phases. [VERIFIED: .planning/ROADMAP.md; .planning/REQUIREMENTS.md] |
| v1.35 boundary inventory focused on runtime/account/provider/package/TinyGo trust | v1.36 competition inventory focused on public trust surfaces, counted behavior, replay evidence, privacy risk, and downstream dispositions | Phase 249 after v1.35 shipped 2026-06-15 | Reuse evaluator mechanics but change row taxonomy. [VERIFIED: .planning/ROADMAP.md; .planning/artifacts/v1.35-boundary-surface-inventory.md] |
| Free-form public result metadata for counted/review status | Policy-backed public projection vocabulary first, final storage mappings later | Phase 249/252 split | Avoid premature persistence enum churn in Phase 249. [VERIFIED: packages/spec/src/competition.ts; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |

**Deprecated/outdated:**
- Treating current standings as durable ratings is out of scope for v1.36. [VERIFIED: .planning/REQUIREMENTS.md; .planning/ROADMAP.md]
- Production sandbox certification, package ecosystem support, and TinyGo production support are forbidden current claims. [VERIFIED: .planning/REQUIREMENTS.md; packages/spec/src/runtime.ts; scripts/evaluate-v1-35-boundary-surface-inventory.ts]
- Strategy execution in web/API/Go remains forbidden. [VERIFIED: AGENTS.md; .planning/ROADMAP.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Simple keyword guards are easier than row-aware scans. | Common Pitfalls | Low; recommendation is still independently supported by locked D-13 through D-16. |

## Open Questions (RESOLVED)

1. **Exact artifact and script names**
   - What we know: Phase decisions leave filenames and helper names to planner discretion. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
   - Resolution: Use script `scripts/evaluate-v1-36-competition-policy.ts` and artifacts `.planning/artifacts/v1.36-competition-surface-inventory.md` plus `.planning/artifacts/v1.36-competition-surface-inventory.json`. [RESOLVED: Phase 249 plan revision]

2. **Whether to split a new spec module**
   - What we know: The contract must be in `@cowards/spec`, and `competition.ts` already contains related types. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; packages/spec/src/competition.ts]
   - Resolution: Use focused spec module `packages/spec/src/competition-policy-v1-36.ts` and export it from `packages/spec/src/index.ts`. [RESOLVED: Phase 249 plan revision]

3. **Exact required-copy matching rules**
   - What we know: Required posture-label presence and forbidden/private-marker absence must be checked. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]
   - Resolution: Required-copy matching is inventory-driven. Rows with `postureLabelRequired: true` must include exact `public beta trial competition` and the row/policy reset/no-durable copy in referenced scanned text. Calibrated explanatory wording may pass only through a documented false-positive allowlist/suppression entry with `path`, `category`, `rationale`, `owner`, and `expiry`; clear violations still fail. [RESOLVED: Phase 249 plan revision]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm/tsx/Vitest scripts | Yes | `v24.15.0` | None needed. [VERIFIED: command `node --version`] |
| pnpm | workspace scripts | Yes | `11.1.2` | None needed. [VERIFIED: command `pnpm --version`; package.json] |
| npm/npx | registry checks and optional docs CLI | Yes | `11.12.1` | Use existing lockfile if registry unavailable during implementation. [VERIFIED: command `npm --version`; command `npx --version`] |
| Go | Inventory of backend paths and later parity tests | Yes | local `go1.26.3`; module declares `go 1.25.0` | Phase 249 static checks should not require Go execution. [VERIFIED: command `go version`; apps/go-backend/go.mod] |
| Docker | Later service-backed proof topology | Yes | `Docker version 29.4.0` | Not required for Phase 249 static evaluator. [VERIFIED: command `docker --version`; .planning/ROADMAP.md] |
| git | Optional planning-doc commit | Yes | `git version 2.50.1 (Apple Git-155)` | None needed. [VERIFIED: command `git --version`] |

**Missing dependencies with no fallback:** None found for Phase 249 static contract/inventory/monitor work. [VERIFIED: environment probes]

**Missing dependencies with fallback:** None found for Phase 249. [VERIFIED: environment probes]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest repo `^4.1.6`, npm current `4.1.9`. [VERIFIED: package.json; npm registry] |
| Config file | `vitest.config.ts` includes `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`. [VERIFIED: vitest.config.ts] |
| Quick run command | `pnpm exec vitest run packages/spec/src/spec.test.ts scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` [VERIFIED: package.json; vitest.config.ts] |
| Full suite command | `pnpm test:fast` for repo-level checks; `pnpm boundary:monitors` for boundary monitor chain. [VERIFIED: package.json] |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| POST-01 | Policy contract exposes default phrase `public beta trial competition` and resettable Season-scoped labels. [VERIFIED: .planning/REQUIREMENTS.md] | unit/contract | `pnpm exec vitest run packages/spec/src/spec.test.ts` | Existing file; add tests. [VERIFIED: packages/spec/src/spec.test.ts] |
| POST-02 | Forbidden durable-rating/all-time/rating-refund/mature-moderation claims fail monitor checks. [VERIFIED: .planning/REQUIREMENTS.md] | unit/monitor | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` | New evaluator test file needed; monitor test exists. [VERIFIED: scripts/check-boundary-monitors.test.ts] |
| POST-03 | `competition-policy-v1.36` defines posture, reset policy, counted-state vocabulary, privacy exclusions, forbidden claim categories/examples, and owners. [VERIFIED: .planning/REQUIREMENTS.md] | unit/contract | `pnpm exec vitest run packages/spec/src/spec.test.ts` | Existing file; add tests. [VERIFIED: packages/spec/src/spec.test.ts] |
| POST-04 | Markdown and JSON inventory artifacts are generated, synchronized, and validate required row fields/dispositions. [VERIFIED: .planning/REQUIREMENTS.md] | unit/artifact | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts` | New test file needed. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.test.ts] |
| POST-05 | Monitor scans `.planning`, `packages`, `apps`, `scripts`, fixtures/snapshots for forbidden overclaims/private markers and required posture labels. [VERIFIED: .planning/REQUIREMENTS.md] | unit/monitor/static | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts && pnpm exec tsx scripts/check-boundary-monitors.ts` | Existing monitor test file; add cases. [VERIFIED: scripts/check-boundary-monitors.test.ts; scripts/check-boundary-monitors.ts] |

### Sampling Rate

- **Per task commit:** Run the focused Vitest command for touched spec/evaluator/monitor files. [VERIFIED: package.json; vitest.config.ts]
- **Per wave merge:** Run new `pnpm v1.36:competition-policy:check` plus `pnpm exec tsx scripts/check-boundary-monitors.ts`. [VERIFIED: v1.35 pattern in package.json; scripts/check-boundary-monitors.ts]
- **Phase gate:** Run `pnpm test:fast` and `pnpm boundary:monitors` if time and existing baseline permit; at minimum run focused Phase 249 checks and disclose any unrelated pre-existing failures. [VERIFIED: package.json; .planning/milestones/v1.35-phases/243-boundary-surface-inventory-and-contract-lock/243-03-SUMMARY.md]

### Wave 0 Gaps

- [ ] `packages/spec/src/spec.test.ts` additions for `competition-policy-v1.36` contract and vocabulary. [VERIFIED: packages/spec/src/spec.test.ts]
- [ ] `scripts/evaluate-v1-36-competition-policy.test.ts` for artifact generation, row validation, forbidden claims, required labels, private markers, and Markdown/JSON synchronization. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.test.ts]
- [ ] `scripts/check-boundary-monitors.test.ts` additions for package script wiring and named v1.36 monitor registration. [VERIFIED: scripts/check-boundary-monitors.test.ts]
- [ ] Root `package.json` scripts for write/check commands and boundary monitor chain wiring. [VERIFIED: package.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Indirectly yes for inventory rows involving entry/account/private surfaces; Phase 249 should not implement auth changes. [VERIFIED: .planning/REQUIREMENTS.md; AGENTS.md] | Inventory owner/auth boundary only; later phases implement behavior. [VERIFIED: .planning/ROADMAP.md] |
| V3 Session Management | Indirectly yes for signed-in entry/governance surfaces; Phase 249 should inventory, not change sessions. [VERIFIED: .planning/REQUIREMENTS.md; .planning/ROADMAP.md] | Preserve existing session-owned private/public split. [VERIFIED: packages/spec/src/public-discovery.ts; packages/spec/src/public-output-privacy.ts] |
| V4 Access Control | Yes for public/private data class and owner fields. [VERIFIED: POST-04 in .planning/REQUIREMENTS.md] | Inventory must record owner, public/private class, and privacy risk per surface. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| V5 Input Validation | Yes for policy schemas and DTOs. [VERIFIED: packages/spec/src/public-discovery.ts] | Use Zod schemas in `@cowards/spec`; avoid ad hoc validation. [VERIFIED: packages/spec/src/public-discovery.ts; packages/spec/package.json] |
| V6 Cryptography | No new cryptography in Phase 249. [VERIFIED: .planning/ROADMAP.md] | Do not change provider proof or signing behavior; inventory only. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| V14 Configuration | Yes for monitor scan scope and artifact policy. [ASSUMED] | Static checked script/artifact configuration through package scripts and boundary monitors. [VERIFIED: package.json; scripts/check-boundary-monitors.ts] |

### Known Threat Patterns for Phase 249

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public copy overclaims durable ratings or production maturity | Spoofing / Repudiation | Spec-owned labels plus forbidden claim monitor. [VERIFIED: .planning/REQUIREMENTS.md; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| Public artifact leaks private Strategy/runtime/governance data | Information Disclosure | Use public-output privacy guard and broad scan scope. [VERIFIED: packages/spec/src/public-output-privacy.ts; .planning/REQUIREMENTS.md] |
| Inventory row omits an owner or disposition | Tampering / Repudiation | Typed row validation requiring owner, data class, downstream disposition, and tests/proof. [VERIFIED: scripts/evaluate-v1-35-boundary-surface-inventory.ts; .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md] |
| UI becomes policy authority | Elevation of Privilege / Tampering | Keep rules/policy in spec/backend contracts and prevent game rules in React. [VERIFIED: AGENTS.md; .planning/ROADMAP.md] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md` - locked user decisions, scope, canonical refs, and code context. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - POST-01 through POST-05 requirements and out-of-scope boundaries. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 249 goal, success criteria, and downstream phase ownership. [VERIFIED: local file]
- `.planning/STATE.md` - active milestone decisions and `gsd-sdk query` caveat. [VERIFIED: local file]
- `.planning/research/SUMMARY.md`, `STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` - milestone research synthesis and local architecture guidance. [VERIFIED: local files]
- `AGENTS.md` - non-negotiable project constraints. [VERIFIED: local file]
- `packages/spec/src/competition.ts`, `public-discovery.ts`, `public-output-privacy.ts`, `index.ts` - existing spec contracts and privacy guards. [VERIFIED: codebase grep/read]
- `scripts/evaluate-v1-35-boundary-surface-inventory.ts`, `.test.ts`, `.planning/artifacts/v1.35-boundary-surface-inventory.md/json` - implementation precedent for inventory artifacts. [VERIFIED: codebase grep/read]
- `scripts/check-boundary-monitors.ts`, `.test.ts`, `package.json` - monitor hub and package script precedent. [VERIFIED: codebase grep/read]
- `CowardsGameSpec_Full_Consolidated_v1.md`, `CowardsGame_Technical_Architecture_Spec_V1.md` - replay privacy and architecture constraints. [VERIFIED: local files]
- npm registry checks for TypeScript, Vitest, tsx, Zod, Playwright, Next.js, React, and Turbo package versions. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- `.planning/research/FEATURES.md` external-comparison conclusions are treated as local synthesis, not as direct product requirements. [VERIFIED: local file]

### Tertiary (LOW confidence)

- None used as an authority for implementation decisions. [VERIFIED: sources review]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and tools were verified from package files, local commands, and npm registry. [VERIFIED: package.json; npm registry; environment probes]
- Architecture: HIGH - ownership boundaries are repeated in AGENTS.md, roadmap, research summary, specs, and current code. [VERIFIED: AGENTS.md; .planning/ROADMAP.md; .planning/research/SUMMARY.md; codebase grep]
- Pitfalls: HIGH - main risks are directly stated in Phase 249 decisions and v1.36 requirements. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md; .planning/REQUIREMENTS.md]
- Exact filenames/helper names: MEDIUM - planner discretion explicitly allows choice. [VERIFIED: .planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md]

**Research date:** 2026-06-15 [VERIFIED: system date]
**Valid until:** 2026-07-15 for local stack/policy research; re-check npm/package versions before dependency changes. [ASSUMED]
