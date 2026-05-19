# Phase 11: Doctrine Debugging UX - Research

**Researched:** 2026-05-18  
**Domain:** Strategy Workshop validation UX, replay owner debug projection, runtime violation messaging, sample Strategy corpus  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Explanation Style
- **D-01:** "Why did this Soldier do nothing?" explanations should expose structured cause codes for tests and concise labels/copy for users.
- **D-02:** Required cause coverage includes: not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, and Match ended.

### Debug Overlay Visibility
- **D-03:** Owner debug overlays are owner-only and opt-in.
- **D-04:** Owner debug overlays must never appear in public projection. Public replay should stay clean while owner/debug mode can show richer explanations.

### Sample Strategies
- **D-05:** Sample Strategies should teach both mechanics and failure modes.
- **D-06:** Include samples for basic advance/turn, push setup, Backstab setup, stoning/blocking, runtime violation examples, and a minimal do-nothing or invalid-output example.
- **D-07:** Samples should also be useful as test inputs where practical.

### Workshop Replay Links
- **D-08:** Workshop should show direct replay links only when a completed Match has replay data.
- **D-09:** Pending, running, and failed states should explain why replay is unavailable rather than showing dead links.

### Validation Messaging
- **D-10:** Validation and runtime messages should be actionable but not verbose.
- **D-11:** Messages should name the violated Strategy API constraint and one remediation step.
- **D-12:** Avoid long docs dumps in the UI; link or reference docs/samples where useful.

### the agent's Discretion
- The planner may choose exact copy, DTO names, component placement, and sample source text as long as explanations remain data-driven and privacy-safe.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEBUG-01 | User sees validation and runtime violation messages that name the relevant Strategy API constraint and remediation path. | Use `packages/runtime-js/src/validation.ts`, `packages/runtime-js/src/guards.ts`, `packages/spec/src/types.ts`, and Workshop helper rendering as the message contract; current issue codes and runtime violation types are already typed. [VERIFIED: .planning/REQUIREMENTS.md + packages/runtime-js/src/validation.ts + packages/runtime-js/src/guards.ts + packages/spec/src/types.ts + apps/web/app/workshop/workshop-client-state.ts] |
| DEBUG-02 | User can start from sample Strategies that demonstrate common doctrine patterns and common failure modes. | Extend `packages/persistence/src/workshop.ts` templates and seed/sample sources; existing templates are `Cautious`, `Reckless`, and `Sentinel`, and canonical replay scenarios already cover push, fall, contraction, legal Backstab, runtime failure, endgame, and compound tour. [VERIFIED: .planning/REQUIREMENTS.md + packages/persistence/src/workshop.ts + packages/persistence/src/seed.ts + packages/test-utils/src/replay-scenarios.ts] |
| DEBUG-03 | User can open replay links directly from Workshop Match results when a replay exists. | Keep the existing `canOpenReplay(match)` predicate as the gate and enrich the unavailable copy for pending/running/failed/no-Chronicle states; `hasReplay` is computed only for complete Matches with stored Chronicles. [VERIFIED: .planning/REQUIREMENTS.md + apps/web/app/workshop/workshop-client-state.ts + packages/persistence/src/matchset-status.ts] |
| DEBUG-04 | Owner can inspect replay explanations for why a Soldier did nothing, including not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, or Match ended. | Add a typed owner-only explanation DTO generated from Chronicle events, snapshots, and runtime violation payloads before React rendering; current replay state helpers already consume DTOs and owner private payloads without executing rules. [VERIFIED: .planning/REQUIREMENTS.md + apps/web/app/matches/[matchId]/replay/replay-state.ts + packages/replay/src/project.ts + packages/replay/src/reconstruct.ts] |
| DEBUG-05 | Owner-only debug overlays are generated from replay/engine-derived DTOs rather than React rule inference. | Generate explanations in `packages/replay` or replay DTO shaping (`apps/web/app/matches/replay-ready.ts`) from validated Chronicle/projection data; React should only render `ReplayReadyDto` fields. [VERIFIED: .planning/REQUIREMENTS.md + .planning/research/ARCHITECTURE.md + apps/web/app/matches/replay-ready.ts + apps/web/app/matches/[matchId]/replay/replay-client.tsx] |
| DEBUG-06 | Public replay views remain privacy-safe when owner-only debugging features are enabled. | Extend `packages/replay/src/project.test.ts`, `apps/web/app/matches/server.test.ts`, and Playwright fixture privacy tests for every new debug field; existing tests already reject private Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness Grid data, raw runtime details, and owner debug in public view. [VERIFIED: .planning/REQUIREMENTS.md + packages/replay/src/project.test.ts + apps/web/app/matches/server.test.ts + apps/web/e2e/replay.fixture.spec.ts] |
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
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or raw Awareness Grid details by default. [VERIFIED: AGENTS.md]
- Engine rules need focused unit tests and invariant/property-style tests; replay needs deterministic reconstruction and integrity tests; runtime needs invalid output, timeout, forbidden capability, memory/source limit, and schema validation tests; worker tests must distinguish strategy failure from system failure; E2E should cover edit -> submit revision -> create MatchSet -> execute -> replay. [VERIFIED: AGENTS.md]

## Summary

Phase 11 should be implemented as a DTO/projection and copy-quality phase, not as a React rules phase. [VERIFIED: .planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md + .planning/research/PITFALLS.md] The strongest implementation path is to define stable cause codes and short display copy near replay/runtime data contracts, generate owner-only Soldier inactivity explanations from validated Chronicle events/snapshots, and keep React components as renderers of already-derived data. [VERIFIED: packages/replay/src/project.ts + packages/replay/src/reconstruct.ts + apps/web/app/matches/replay-ready.ts + apps/web/app/matches/[matchId]/replay/replay-state.ts]

The existing codebase already has the needed seams: Workshop copy/status helpers, typed validation reports, runtime violation types, completed-Match replay gating, public/owner Chronicle projection, owner debug query gating, replay DTO shaping, and deterministic fixture/visual Playwright suites. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts + packages/spec/src/types.ts + packages/persistence/src/matchset-status.ts + packages/replay/src/project.ts + apps/web/app/matches/[matchId]/replay/owner-debug.ts + apps/web/e2e/replay.visual.spec.ts] The main gaps are richer message metadata, a larger sample Strategy catalog, explicit replay-unavailable reasons in Workshop result rows, and owner-only inactivity explanation DTOs tested against privacy regressions. [VERIFIED: .planning/REQUIREMENTS.md + .planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md + apps/web/app/workshop/workshop-client.tsx]

**Primary recommendation:** Add typed debug/messaging helpers in `@cowards/spec`, `@cowards/runtime-js`, and `@cowards/replay`; wire them through existing Workshop/replay DTO helpers; verify with package unit tests, public projection privacy tests, and focused Playwright Workshop/replay checks. [VERIFIED: package.json + packages/spec/src/schemas.ts + packages/runtime-js/src/validation.ts + packages/replay/src/project.ts + apps/web/e2e/replay.fixture.spec.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Strategy validation message contract | Runtime package / shared spec | Workshop UI | Validation issue codes and forbidden capability detection already live in `@cowards/runtime-js` and `@cowards/spec`; Workshop should render concise copy from those contracts. [VERIFIED: packages/runtime-js/src/validation.ts + packages/spec/src/types.ts + apps/web/app/workshop/workshop-client.tsx] |
| Runtime violation copy | Runtime package / shared spec | Replay DTO + Workshop result copy | Runtime violation types are `INVALID_OUTPUT`, `TIMEOUT`, `THROWN_EXCEPTION`, `FORBIDDEN_CAPABILITY`, and `OVERSIZED_OUTPUT`; UI copy should map those types to Strategy API constraints and remediation steps. [VERIFIED: packages/spec/src/types.ts + packages/runtime-js/src/guards.ts] |
| Sample Strategy catalog | Persistence/workshop seed layer | Test-utils scenarios | Workshop templates are currently built in `packages/persistence/src/workshop.ts`, while replay demo scenarios live in `packages/test-utils`; new samples should be available to Workshop and reusable as test inputs when practical. [VERIFIED: packages/persistence/src/workshop.ts + packages/test-utils/src/replay-scenarios.ts] |
| Workshop replay link availability | Persistence/API DTO | Workshop UI helper | `hasReplay` is computed from complete Matches with stored Chronicles, and `canOpenReplay()` already gates links on `status === "complete"` plus `hasReplay === true`. [VERIFIED: packages/persistence/src/matchset-status.ts + apps/web/app/workshop/workshop-client-state.ts] |
| Soldier did-nothing explanation | Replay package / replay DTO shaping | Replay UI renderer | Chronicle validation/reconstruction and public/owner projection happen before replay rendering; explanations must be generated from those data products instead of React rule inference. [VERIFIED: packages/replay/src/validate.ts + packages/replay/src/reconstruct.ts + packages/replay/src/project.ts + apps/web/app/matches/replay-ready.ts] |
| Owner-only debug overlay visibility | Replay projection + replay route gating | Replay UI toggle | Owner debug is query/env gated, owner private projection is explicit, and public projection strips private keys/markers. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts + packages/replay/src/project.ts + packages/replay/src/project.test.ts] |
| UI testing | Playwright E2E | Vitest helper tests | Existing browser suites cover replay fixture rendering, owner debug gating, public privacy, visual screenshots, and service-backed Workshop-to-replay when services are enabled. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts + apps/web/e2e/replay.visual.spec.ts + apps/web/e2e/workshop-to-replay.spec.ts + vitest.config.ts] |

## Standard Stack

### Core

| Library / Package | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| TypeScript monorepo packages | Local `0.1.0` workspace packages | Shared contracts across `@cowards/spec`, `@cowards/engine`, `@cowards/replay`, `@cowards/runtime-js`, `@cowards/persistence`, `@cowards/web`, and `@cowards/worker`. | Existing package boundaries enforce the project rule that engine/replay/runtime/UI responsibilities stay separated. [VERIFIED: package.json + pnpm-workspace.yaml + rg --files] |
| Next.js | Local `^16.2.6`; npm current `16.2.6`, modified 2026-05-17 | App Router web UI/API routes for Workshop and replay pages. | Current app already uses Next.js Server Component pages passing serializable data to Client Components. [VERIFIED: apps/web/package.json + npm registry + Context7 /vercel/next.js/v16.2.2 + apps/web/app/matches/[matchId]/replay/page.tsx] |
| React / React DOM | Local `^19.2.6`; npm current `19.2.6`, modified 2026-05-08 | Client interactivity for Workshop and replay. | Current UI components are React client components using DTO props and hooks. [VERIFIED: apps/web/package.json + npm registry + apps/web/app/workshop/workshop-client.tsx + apps/web/app/matches/[matchId]/replay/replay-client.tsx] |
| Zod | Local `^4.4.3`; npm current `4.4.3`, modified 2026-05-04 | Strategy, runtime, Chronicle, projection, and DTO shape validation. | The existing spec package uses Zod schemas for Strategy outputs, Chronicle events, validation reports, and projections. [VERIFIED: packages/spec/package.json + npm registry + packages/spec/src/schemas.ts] |
| Vitest | Local `^4.1.6`; npm current `4.1.6`, modified 2026-05-11 | Unit tests for runtime, replay, Workshop helpers, and route/server helpers. | The repo already uses `vitest run` package scripts and includes `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`. [VERIFIED: package.json + vitest.config.ts + npm registry] |
| Playwright Test | Local `^1.60.0`; npm current `1.60.0`, modified 2026-05-18 | Browser E2E, public privacy checks, owner debug gating, and focused visual screenshots. | Existing Playwright config has desktop/mobile projects and replay fixture/visual suites. [VERIFIED: package.json + playwright.config.ts + apps/web/e2e/*.spec.ts + npm registry] |

### Supporting

| Library / Package | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| `@cowards/replay` | Local `0.1.0` | Chronicle validation, reconstruction, projection, and future owner debug explanation derivation. | Use for data-driven replay explanations and privacy-safe projection tests. [VERIFIED: packages/replay/package.json + packages/replay/src/validate.ts + packages/replay/src/reconstruct.ts + packages/replay/src/project.ts] |
| `@cowards/runtime-js` | Local `0.1.0` | Strategy source validation, runtime execution adapter, runtime violation mapping. | Use for validation issue copy and runtime violation remediation mapping; do not execute Strategy source from web/API. [VERIFIED: packages/runtime-js/package.json + packages/runtime-js/src/validation.ts + packages/runtime-js/src/executor.ts + AGENTS.md] |
| `@cowards/persistence` | Local `0.1.0` | Workshop templates, revisions, MatchSet status summaries, replay availability flag. | Use for sample Strategy catalog and replay link availability DTOs. [VERIFIED: packages/persistence/package.json + packages/persistence/src/workshop.ts + packages/persistence/src/matchset-status.ts] |
| `@cowards/test-utils` | Local `0.1.0` | Engine-generated canonical replay scenarios. | Reuse scenario ideas and deterministic runtime inputs for sample Strategy tests and debug explanation fixtures. [VERIFIED: packages/test-utils/package.json + packages/test-utils/src/replay-scenarios.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React-side rules inference | A React helper that inspects board position and guesses legal moves | Reject this; it duplicates engine rules in UI and violates AGENTS.md. Generate explanation DTOs before rendering. [VERIFIED: AGENTS.md + .planning/research/PITFALLS.md] |
| Raw owner private JSON panel as the only debug UX | Keep current `<pre>{JSON.stringify(ownerPrivate)}</pre>` | Keep only as advanced/debug detail; add structured labels/cause codes so owners do not need to inspect raw private payloads. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx + 11-CONTEXT.md] |
| Add a new component testing stack first | Add `@testing-library/react` or Vitest Browser React immediately | Defer unless implementation needs rendered component unit tests; current phase can cover most behavior with helper unit tests and Playwright. [VERIFIED: apps/web/app/workshop/workshop-client-state.test.tsx + apps/web/e2e/replay.fixture.spec.ts + Context7 /vitest-dev/vitest/v4.1.6] |

**Installation:**
```bash
# No new required packages for the recommended Phase 11 path. [VERIFIED: package.json + apps/web/package.json]
pnpm install
```

**Version verification commands run:**
```bash
npm view next version time.modified
npm view react version time.modified
npm view vitest version time.modified
npm view @playwright/test version time.modified
npm view zod version time.modified
```

## Architecture Patterns

### System Architecture Diagram

```text
Strategy source in Workshop
  -> POST /api/workshop/validate
  -> @cowards/runtime-js validateStrategySource
  -> StrategyRevisionValidationReport + message metadata
  -> Workshop helper maps code -> concise constraint + remediation
  -> Workshop renders validation rows

Completed Workshop MatchSet
  -> persistence listMatchStatusesForSet
  -> status + hasReplay
  -> Workshop helper decides Open replay vs unavailable reason
  -> /matches/:matchId/replay

Stored Chronicle
  -> @cowards/replay validateChronicle + createReplay
  -> public or owner projection
  -> owner-only explanation DTO generator
       -> not selected / invalid action / blocked movement / timeout /
          thrown exception / STONE / FALLEN / Match ended
  -> ReplayReadyDto
  -> React replay renders labels, codes, and owner toggle
```

This flow keeps Strategy execution in runtime/worker boundaries and keeps replay explanations derived from Chronicle/replay data, not React rule inference. [VERIFIED: AGENTS.md + packages/runtime-js/src/executor.ts + packages/replay/src/reconstruct.ts + apps/web/app/matches/replay-ready.ts]

### Recommended Project Structure

```text
packages/spec/src/
├── types.ts                 # Add stable debug cause/message DTO types if shared outside replay. [VERIFIED: packages/spec/src/types.ts]
└── schemas.ts               # Add Zod schemas for debug DTOs if they cross package/API boundaries. [VERIFIED: packages/spec/src/schemas.ts]

packages/runtime-js/src/
├── validation.ts            # Keep source validation codes; add remediation metadata/helper here. [VERIFIED: packages/runtime-js/src/validation.ts]
└── guards.ts                # Keep runtime violation type mapping; add public-safe labels/remediation if runtime-owned. [VERIFIED: packages/runtime-js/src/guards.ts]

packages/replay/src/
├── project.ts               # Keep public/owner projection privacy hard gate. [VERIFIED: packages/replay/src/project.ts]
├── debug-explanations.ts    # New recommended home for owner-only Soldier inactivity DTO generation. [VERIFIED: .planning/research/ARCHITECTURE.md]
└── debug-explanations.test.ts # Cause-code and privacy coverage. [VERIFIED: vitest.config.ts]

apps/web/app/workshop/
├── workshop-client-state.ts # Extend copy/status helpers. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
└── workshop-client.tsx      # Render existing/new DTO copy; avoid rule logic. [VERIFIED: apps/web/app/workshop/workshop-client.tsx]

apps/web/app/matches/
├── replay-ready.ts          # Add explanation DTOs to ReplayReadyDto assembly after projection validation. [VERIFIED: apps/web/app/matches/replay-ready.ts]
└── [matchId]/replay/
    ├── replay-state.ts      # Read DTOs for selected Soldier/sequence. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts]
    └── replay-client.tsx    # Render owner-only explanations and existing Awareness Grid. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx]
```

### Pattern 1: Message Metadata Beside Existing Codes

**What:** Keep current validation/runtime codes as stable testable identifiers and add a small mapping from code/type to `constraint`, `message`, and `remediation`. [VERIFIED: packages/spec/src/types.ts + packages/runtime-js/src/validation.ts + 11-CONTEXT.md]  
**When to use:** Use for DEBUG-01 validation rows and runtime violation explanations; never expose raw exception detail as the only user-facing explanation. [VERIFIED: packages/runtime-js/src/guards.ts + CowardsGameSpec_Full_Consolidated_v1.md]

**Example:**
```typescript
// Source: local pattern from packages/runtime-js/src/validation.ts and packages/spec/src/types.ts.
type StrategyMessageDescriptor = {
  code: string
  constraint: string
  userMessage: string
  remediation: string
}

const strategyValidationMessages: Record<string, StrategyMessageDescriptor> = {
  MISSING_SOLDIER_BRAIN: {
    code: "MISSING_SOLDIER_BRAIN",
    constraint: "Strategy API requires soldierBrain(input)",
    userMessage: "Missing SoldierBrain.",
    remediation: "Export a soldierBrain method that returns one Action and SoldierMemory.",
  },
}
```

### Pattern 2: Owner-Only Inactivity Cause DTO

**What:** Generate cause codes from Chronicle events and snapshots, then render them in replay owner mode. [VERIFIED: packages/replay/src/reconstruct.ts + packages/replay/src/project.ts + apps/web/app/matches/replay-ready.ts]  
**When to use:** Use for DEBUG-04 and DEBUG-05; cause codes must include `NOT_SELECTED`, `INVALID_ACTION`, `BLOCKED_MOVEMENT`, `TIMEOUT`, `THROWN_EXCEPTION`, `STONE`, `FALLEN`, and `MATCH_ENDED`. [VERIFIED: 11-CONTEXT.md]

**Example:**
```typescript
// Source: local DTO conventions from apps/web/app/matches/types.ts.
type SoldierInactivityCauseCode =
  | "NOT_SELECTED"
  | "INVALID_ACTION"
  | "BLOCKED_MOVEMENT"
  | "TIMEOUT"
  | "THROWN_EXCEPTION"
  | "STONE"
  | "FALLEN"
  | "MATCH_ENDED"

type SoldierInactivityExplanationDto = {
  soldierId: string
  sequence: number
  code: SoldierInactivityCauseCode
  label: string
  detail: string
  sourceEventSequence?: number
}
```

### Pattern 3: Replay Link Availability as a Helper Contract

**What:** Keep link gating in `workshop-client-state.ts`, using `status` and `hasReplay` rather than checking URLs in JSX. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts + packages/persistence/src/matchset-status.ts]  
**When to use:** Use for DEBUG-03 and D-08/D-09; each non-link state should return a reason such as queued, running, failed system, completed without Chronicle, or replay unavailable. [VERIFIED: 11-CONTEXT.md + apps/web/app/workshop/workshop-client.tsx]

**Example:**
```typescript
// Source: local pattern from apps/web/app/workshop/workshop-client-state.ts.
type ReplayAvailability =
  | { available: true; href: string }
  | { available: false; reason: string }

const getReplayAvailability = (match: WorkshopMatchSummary): ReplayAvailability =>
  canOpenReplay(match)
    ? { available: true, href: getReplayHref(match.matchId) }
    : { available: false, reason: "Replay will appear after the Match completes and its Chronicle is stored." }
```

### Anti-Patterns to Avoid

- **Rule inference in React:** Do not compute blocked moves, Backstab legality, activation eligibility, or Match-end consequences inside `replay-client.tsx` or `replay-state.ts`; generate DTOs from replay/engine data first. [VERIFIED: AGENTS.md + .planning/research/PITFALLS.md]
- **Public DTO growth with private debug fields:** Do not add explanation fields to public projection unless projection tests prove no Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid data, private runtime detail, or owner debug payload leaks. [VERIFIED: AGENTS.md + packages/replay/src/project.test.ts]
- **Dead replay links:** Do not render an anchor for pending, running, failed, blocked, degraded-without-Chronicle, or complete-without-Chronicle rows. [VERIFIED: 11-CONTEXT.md + apps/web/app/workshop/workshop-client-state.ts]
- **Verbose docs dumps in UI:** Do not paste Strategy API documentation into validation rows; use concise constraint + one remediation step and link/reference samples only where helpful. [VERIFIED: 11-CONTEXT.md]
- **Raw exception text as primary UX:** Do not rely on runtime exception messages alone; use stable runtime violation type labels and keep sensitive/private detail behind owner projection. [VERIFIED: packages/runtime-js/src/guards.ts + packages/replay/src/project.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Strategy API validation | A separate Workshop parser or regex-only UI validator | `validateStrategySource()` and `StrategyRevisionValidationReport` | Existing runtime validation owns source size, forbidden patterns, required methods, async methods, export default, and transpile failures. [VERIFIED: packages/runtime-js/src/validation.ts] |
| Runtime output validation | Manual property checks in UI or API routes | `StrategyResultSchema`, `SoldierBrainResultSchema`, and runtime violation mapping | Runtime outputs crossing boundaries are already Zod-validated and invalid outputs become typed violations. [VERIFIED: packages/spec/src/schemas.ts + packages/runtime-js/src/executor.ts + AGENTS.md] |
| Replay legality explanations in React | Board-position rule inference in components | `@cowards/replay` validation/reconstruction/projection plus explanation DTOs | Replay has validated Chroncles and deterministic state iteration before UI receives data. [VERIFIED: packages/replay/src/validate.ts + packages/replay/src/reconstruct.ts] |
| Owner/private projection | Ad hoc key deletion in web components | `projectPublicChronicle()` and `projectOwnerChronicle()` | Projection already canonicalizes the Chronicle and strips private keys/markers from public output. [VERIFIED: packages/replay/src/project.ts + packages/replay/src/project.test.ts] |
| Visual regression harness | Custom screenshot diff tooling | Playwright `toHaveScreenshot` and existing canvas pixel checks | Playwright screenshot assertions wait for stabilization and current tests already include focused board/callout screenshot checks. [CITED: Context7 /microsoft/playwright.dev + VERIFIED: apps/web/e2e/replay.visual.spec.ts] |

**Key insight:** The difficult part of this phase is preserving truth and privacy while making the UI clearer; using existing runtime/replay/spec contracts keeps those concerns testable at package boundaries. [VERIFIED: AGENTS.md + .planning/research/ARCHITECTURE.md + .planning/research/PITFALLS.md]

## Common Pitfalls

### Pitfall 1: React Explains Rules It Does Not Own
**What goes wrong:** Replay UI says a Soldier did nothing for a guessed reason that diverges from engine/Chronicle truth. [VERIFIED: .planning/research/PITFALLS.md]  
**Why it happens:** Board states are visible in React, making rule inference tempting. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts]  
**How to avoid:** Generate cause DTOs from Chronicle events, runtime violations, and replay states before React receives them. [VERIFIED: packages/replay/src/reconstruct.ts + apps/web/app/matches/replay-ready.ts]  
**Warning signs:** `replay-client.tsx` or `replay-state.ts` starts checking movement legality, Backstab geometry, contraction fallout, or activation queue rules. [VERIFIED: AGENTS.md]

### Pitfall 2: Helpful Owner Debug Leaks Public Private Data
**What goes wrong:** Public replay output includes owner-only explanations that expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness Grid data, or raw runtime details. [VERIFIED: AGENTS.md + packages/replay/src/project.test.ts]  
**Why it happens:** New debug fields bypass `projectPublicChronicle()` or are attached to `ReplayReadyDto` after projection without public-mode filtering. [VERIFIED: packages/replay/src/project.ts + apps/web/app/matches/replay-ready.ts]  
**How to avoid:** Add projection-level tests, server facade tests, and browser-level public replay privacy checks for every new debug field. [VERIFIED: packages/replay/src/project.test.ts + apps/web/app/matches/server.test.ts + apps/web/e2e/replay.fixture.spec.ts]  
**Warning signs:** Public serialized replay contains `"ownerPrivate"`, `"private:event:"`, `"violation.message"`, `"objectivePayload"`, `"awarenessGrid"`, or sample Strategy source. [VERIFIED: packages/replay/src/project.test.ts]

### Pitfall 3: Runtime Failures Collapse Into One Message
**What goes wrong:** Timeout, thrown exception, invalid output, forbidden capability, and oversized output are all shown as generic failure text. [VERIFIED: .planning/research/PITFALLS.md + packages/spec/src/types.ts]  
**Why it happens:** UI consumes only a string instead of the typed `RuntimeViolationType`. [VERIFIED: packages/runtime-js/src/guards.ts + packages/spec/src/types.ts]  
**How to avoid:** Map each runtime violation type to a Strategy API constraint and remediation step; keep raw detail owner-only. [VERIFIED: 11-CONTEXT.md + packages/replay/src/project.ts]  
**Warning signs:** UI copy says only "Runtime violation" for `TIMEOUT`, `THROWN_EXCEPTION`, or `INVALID_OUTPUT`. [VERIFIED: apps/web/app/matches/replay-ready.ts]

### Pitfall 4: Samples Teach UI Labels But Not Engine-Reproducible Behavior
**What goes wrong:** Sample Strategies look useful in the editor but cannot be reused in runtime/fixture tests. [VERIFIED: 11-CONTEXT.md]  
**Why it happens:** Samples are stored only as UI text and not validated through `validateStrategySource()` or run through deterministic scenarios. [VERIFIED: packages/persistence/src/workshop.ts + packages/test-utils/src/replay-scenarios.ts]  
**How to avoid:** Put sample source in reusable constants, validate each sample in tests, and reuse samples or sample ideas in replay/debug fixtures where practical. [VERIFIED: packages/persistence/src/workshop.test.ts + packages/test-utils/src/replay-scenarios.manifest.test.ts]  
**Warning signs:** New templates lack validation tests or include forbidden capabilities solely for demonstration without clear invalid-sample handling. [VERIFIED: packages/runtime-js/src/validation.ts]

### Pitfall 5: Workshop Shows Dead Replay Links
**What goes wrong:** User clicks a replay link for a pending, running, failed, or missing-Chronicle Match. [VERIFIED: 11-CONTEXT.md]  
**Why it happens:** JSX checks Match status loosely instead of using the existing helper. [VERIFIED: apps/web/app/workshop/workshop-client.tsx + apps/web/app/workshop/workshop-client-state.ts]  
**How to avoid:** Extend `canOpenReplay()` into a richer availability helper and cover pending/running/failed/complete-no-replay in unit tests. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx]  
**Warning signs:** Anchor tags appear for rows where `hasReplay` is false. [VERIFIED: packages/persistence/src/matchset-status.ts]

## Code Examples

Verified patterns from official/local sources:

### Validation Copy Mapping
```typescript
// Source: packages/runtime-js/src/validation.ts and apps/web/app/workshop/workshop-client-state.ts.
export const formatValidationIssueHeading = (
  issue: StrategyRevisionValidationReport["errors"][number],
): string => `${issue.severity.toUpperCase()} · ${issue.code}`

// Extend with:
export const formatValidationIssueAction = (
  issue: StrategyRevisionValidationReport["errors"][number],
): string => {
  const descriptor = strategyValidationMessages[issue.code]
  return descriptor
    ? `${descriptor.constraint}. ${descriptor.remediation}`
    : issue.message
}
```

### Owner Explanation Lookup
```typescript
// Source: apps/web/app/matches/[matchId]/replay/replay-state.ts DTO helper style.
export const getSoldierInactivityExplanation = (
  data: ReplayReadyDto,
  soldierId: string | null,
  sequence: number,
): SoldierInactivityExplanationDto | null => {
  if (!soldierId || data.mode !== "owner") return null
  return data.ownerDebug?.soldierInactivity.find(
    (item) => item.soldierId === soldierId && item.sequence <= sequence,
  ) ?? null
}
```

### Public Privacy Regression Test
```typescript
// Source: packages/replay/src/project.test.ts pattern.
const projection = projectPublicChronicle(chronicleWithOwnerDebug)
const serialized = JSON.stringify(projection)

expect(serialized).not.toContain("strategyMemory")
expect(serialized).not.toContain("soldierMemory")
expect(serialized).not.toContain("objectivePayload")
expect(serialized).not.toContain("awarenessGrid")
expect(serialized).not.toContain("rawRuntimeDetails")
expect(serialized).not.toContain("private:event:")
```

### Playwright Owner Debug Check
```typescript
// Source: apps/web/e2e/replay.fixture.spec.ts and Context7 /microsoft/playwright.dev.
await page.goto(replayHref)
await expect(page.getByText("Owner debug")).toHaveCount(0)

await page.goto(`${replayHref}?ownerDebug=1&ownerPlayerId=bottom`)
await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
await expect(page.getByText("Why no Action?").first()).toBeVisible()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-authored replay fixtures | Engine-generated canonical replay scenarios with legality/visual checks | Phase 8, 2026-05-18 | Debug samples can reuse legal scenario ideas and avoid teaching impossible behavior. [VERIFIED: .planning/STATE.md + packages/test-utils/src/replay-scenarios.ts] |
| Shape-only Chronicle checks | Strict Chronicle grammar, snapshot boundary checks, transition validation, and compatibility gates before rendering | Phase 9, 2026-05-18 | Replay explanations can trust validated event windows and snapshots. [VERIFIED: .planning/STATE.md + packages/replay/src/validate.ts + packages/replay/src/grammar.ts] |
| Worker-thread runtime hardwired | Explicit execution adapter metadata with worker-thread default and subprocess adapter support | Phase 10, 2026-05-18 | Runtime violation messaging can reference adapter/violation taxonomy without changing engine rules. [VERIFIED: .planning/STATE.md + packages/runtime-js/src/adapter.ts + apps/worker/src/runtime-config.ts] |
| Raw owner debug JSON only | Owner Awareness Grid inspection plus raw private panel behind gated owner mode | v1.0 through Phase 8/9 | Phase 11 should add structured explanation DTOs while preserving the existing advanced panel. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx + apps/web/app/matches/[matchId]/replay/replay-state.ts] |

**Deprecated/outdated:**
- React rule inference for explanations is explicitly out of bounds for this project. [VERIFIED: AGENTS.md + .planning/research/PITFALLS.md]
- Node `vm` is not relevant to Phase 11 UI debugging and remains forbidden as a hostile-code security boundary. [VERIFIED: AGENTS.md + .planning/research/STACK.md]
- Public replay debug payloads with private refs are forbidden by existing projection tests. [VERIFIED: packages/replay/src/project.test.ts]

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

All claims in this research were verified or cited — no user confirmation needed for assumed facts. [VERIFIED: rg "\[ASSUMED\]" .planning/phases/11-doctrine-debugging-ux/11-RESEARCH.md]

## Open Questions

1. **Should invalid/failure-mode samples be selectable as draft templates or grouped separately from valid starter templates?**
   - What we know: Phase context requires runtime violation and invalid-output examples, and current Workshop templates are all valid. [VERIFIED: 11-CONTEXT.md + packages/persistence/src/workshop.ts]
   - What's unclear: A deliberately invalid sample may frustrate submission flow if shown beside valid templates without labeling. [VERIFIED: apps/web/app/workshop/workshop-client.tsx]
   - Recommendation: Keep valid mechanics samples in the main template list and expose invalid/failure samples in a clearly labeled "Failure modes" group with validation expected to fail. [VERIFIED: 11-CONTEXT.md]

2. **Where should the debug explanation DTO schema live?**
   - What we know: Replay projections and DTOs are shared between package/server/UI boundaries. [VERIFIED: packages/replay/src/project.ts + apps/web/app/matches/types.ts]
   - What's unclear: The planner can choose whether these DTOs belong in `@cowards/spec` or stay internal to `apps/web/app/matches/types.ts` plus `@cowards/replay`. [VERIFIED: 11-CONTEXT.md]
   - Recommendation: Put reusable cause-code types and schemas in `@cowards/spec` if they cross package boundaries; keep pure derivation in `@cowards/replay`. [VERIFIED: packages/spec/src/types.ts + packages/spec/src/schemas.ts + packages/replay/src/index.ts]

3. **Should service-backed Workshop-to-replay E2E be required for this phase gate?**
   - What we know: The existing service E2E is skipped unless `RUN_SERVICE_E2E=1`, and local Postgres is currently not responding on `/tmp:5432`. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts + pg_isready]
   - What's unclear: Phase 12 owns local/CI reliability, so requiring service E2E for Phase 11 could block on known environment work. [VERIFIED: .planning/ROADMAP.md]
   - Recommendation: Use unit and fixture Playwright gates for Phase 11; run service E2E opportunistically if services are available. [VERIFIED: .planning/ROADMAP.md + apps/web/e2e/replay.fixture.spec.ts]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm, Vitest, Next.js, Playwright | yes | `v24.15.0` | None needed. [VERIFIED: node --version] |
| pnpm | Workspace commands | yes | `11.1.2` | None needed. [VERIFIED: pnpm --version + package.json] |
| npm/npx | Registry/version checks and Context7 CLI fallback | yes | `11.12.1` | None needed. [VERIFIED: npm --version] |
| Playwright CLI | Browser E2E and visual tests | yes | `1.60.0` | Use Vitest helper tests for non-browser logic. [VERIFIED: npx playwright --version + playwright.config.ts] |
| Docker | Optional service-backed workflows | yes | `29.4.3` | Phase 11 can use fixture tests if services are unavailable. [VERIFIED: docker --version + docker info] |
| PostgreSQL client | Optional service-backed Workshop E2E diagnostics | yes | `psql 16.14` | Fixture replay tests do not require live Postgres. [VERIFIED: psql --version + apps/web/e2e/replay.fixture.spec.ts] |
| Local PostgreSQL service | Service-backed Workshop-to-replay E2E | no | `/tmp:5432 - no response` | Keep `RUN_SERVICE_E2E=1` test optional for Phase 11; Phase 12 owns reliability. [VERIFIED: pg_isready + .planning/ROADMAP.md] |

**Missing dependencies with no fallback:**
- None for package unit tests and replay fixture/visual tests. [VERIFIED: package.json + playwright.config.ts]

**Missing dependencies with fallback:**
- Local PostgreSQL service is not responding; use fixture-based replay tests and helper tests unless running the optional service-backed E2E. [VERIFIED: pg_isready + apps/web/e2e/workshop-to-replay.spec.ts]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.6` and Playwright Test `1.60.0`. [VERIFIED: npm registry + package.json] |
| Config file | `vitest.config.ts` and `playwright.config.ts`. [VERIFIED: vitest.config.ts + playwright.config.ts] |
| Quick run command | `pnpm --filter @cowards/replay test -- debug-explanations.test.ts && pnpm --filter @cowards/web test -- workshop-client.test.tsx replay-state.test.ts server.test.ts` [VERIFIED: package scripts + existing test names] |
| Full suite command | `pnpm verify` includes format, lint, typecheck, unit tests, replay fixture smoke, and visual regression. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DEBUG-01 | Validation/runtime messages name Strategy API constraint and remediation. | unit | `pnpm --filter @cowards/runtime-js test -- validation.test.ts && pnpm --filter @cowards/web test -- workshop-client.test.tsx` | Partial; add message descriptor assertions. [VERIFIED: packages/runtime-js/src/validation.test.ts + apps/web/app/workshop/workshop-client.test.tsx] |
| DEBUG-02 | Samples cover mechanics and failure modes and validate as expected. | unit | `pnpm --filter @cowards/persistence test -- workshop.test.ts && pnpm --filter @cowards/runtime-js test -- validation.test.ts` | Partial; add sample catalog assertions. [VERIFIED: packages/persistence/src/workshop.test.ts + packages/runtime-js/src/validation.test.ts] |
| DEBUG-03 | Workshop shows replay links only when complete replay exists and explanatory unavailable states otherwise. | unit + optional E2E | `pnpm --filter @cowards/web test -- workshop-client.test.tsx && RUN_SERVICE_E2E=1 pnpm e2e -- workshop-to-replay.spec.ts` | Partial; helper tests exist, service E2E exists but optional. [VERIFIED: apps/web/app/workshop/workshop-client.test.tsx + apps/web/e2e/workshop-to-replay.spec.ts] |
| DEBUG-04 | Owner can inspect structured did-nothing explanations for required cause codes. | unit + E2E | `pnpm --filter @cowards/replay test -- debug-explanations.test.ts && pnpm --filter @cowards/web test -- replay-state.test.ts` | No; add replay debug explanation tests. [VERIFIED: no debug-explanations.test.ts in rg --files + apps/web/app/matches/[matchId]/replay/replay-state.test.ts] |
| DEBUG-05 | Owner debug overlays come from replay/engine-derived DTOs, not React rule inference. | unit + review guard | `pnpm --filter @cowards/replay test -- debug-explanations.test.ts && pnpm --filter @cowards/web test -- replay-state.test.ts` | No; add DTO and helper tests; review React for rule logic. [VERIFIED: .planning/research/PITFALLS.md + apps/web/app/matches/[matchId]/replay/replay-client.test.tsx] |
| DEBUG-06 | Public replay remains privacy-safe when owner debug exists. | unit + browser | `pnpm --filter @cowards/replay test -- project.test.ts && pnpm --filter @cowards/web test -- server.test.ts && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` | Yes; extend existing tests for new fields. [VERIFIED: packages/replay/src/project.test.ts + apps/web/app/matches/server.test.ts + apps/web/e2e/replay.fixture.spec.ts] |

### Sampling Rate

- **Per task commit:** Run the narrow package test for touched area, usually one of `pnpm --filter @cowards/runtime-js test -- validation.test.ts`, `pnpm --filter @cowards/replay test -- debug-explanations.test.ts project.test.ts`, or `pnpm --filter @cowards/web test -- workshop-client.test.tsx replay-state.test.ts server.test.ts`. [VERIFIED: package scripts + test file inventory]
- **Per wave merge:** Run `pnpm --filter @cowards/replay test && pnpm --filter @cowards/web test && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`. [VERIFIED: package scripts + playwright.config.ts]
- **Phase gate:** Run `pnpm verify`; run `RUN_SERVICE_E2E=1 pnpm e2e -- workshop-to-replay.spec.ts` only when local services are available. [VERIFIED: package.json + apps/web/e2e/workshop-to-replay.spec.ts + pg_isready]

### Wave 0 Gaps

- [ ] `packages/replay/src/debug-explanations.ts` and `packages/replay/src/debug-explanations.test.ts` — covers DEBUG-04 and DEBUG-05. [VERIFIED: rg --files]
- [ ] Message descriptor tests in `packages/runtime-js/src/validation.test.ts` — covers DEBUG-01 remediation copy. [VERIFIED: packages/runtime-js/src/validation.ts]
- [ ] Sample catalog tests in `packages/persistence/src/workshop.test.ts` or a new `sample-strategies.test.ts` — covers DEBUG-02. [VERIFIED: packages/persistence/src/workshop.ts]
- [ ] Replay availability reason helper tests in `apps/web/app/workshop/workshop-client.test.tsx` — covers DEBUG-03. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts]
- [ ] Public/owner projection regression tests for new debug explanation fields in `packages/replay/src/project.test.ts`, `apps/web/app/matches/server.test.ts`, and `apps/web/e2e/replay.fixture.spec.ts` — covers DEBUG-06. [VERIFIED: existing test files]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no for Phase 11 implementation | Phase 11 does not add auth; owner debug is currently gated by trusted server/test env and explicit owner player id. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] |
| V3 Session Management | no for Phase 11 implementation | No session state changes are in scope. [VERIFIED: .planning/ROADMAP.md + 11-CONTEXT.md] |
| V4 Access Control | yes | Preserve owner-only debug gating and require `allowOwnerDebug` from trusted server code before owner projection. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts + apps/web/app/matches/server.test.ts] |
| V5 Input Validation | yes | Continue using Zod schemas and runtime validation reports for Strategy source, runtime outputs, Chronicle events, projections, and replay DTOs. [VERIFIED: packages/spec/src/schemas.ts + packages/runtime-js/src/validation.ts + packages/replay/src/validate.ts] |
| V6 Cryptography | limited | Do not add cryptography; existing Chronicle integrity uses SHA-256 content hashes. [VERIFIED: packages/replay/src/hash.ts + packages/replay/src/validate.ts] |
| V7 Error Handling and Logging | yes | Show concise user-safe validation/runtime messages; avoid raw private runtime details in public replay. [VERIFIED: packages/runtime-js/src/guards.ts + packages/replay/src/project.ts] |
| V14 Configuration | yes | Keep owner debug opt-in and environment-gated; do not enable owner projection by default. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] |

### Known Threat Patterns for Phase 11 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public replay leaks owner debug data | Information Disclosure | Projection hard gate plus server/browser privacy tests for each new field. [VERIFIED: packages/replay/src/project.ts + packages/replay/src/project.test.ts + apps/web/e2e/replay.fixture.spec.ts] |
| Strategy source executes in web/API while building samples or messages | Elevation of Privilege | Use validation/build APIs only in web/persistence; executable runtime APIs remain worker/runtime boundary. [VERIFIED: AGENTS.md + packages/runtime-js/package.json + packages/runtime-js/src/executor.ts] |
| User-facing runtime message exposes raw exception/private detail | Information Disclosure | Map violation types to safe labels/remediation and keep raw details in owner-only private projection only. [VERIFIED: packages/runtime-js/src/guards.ts + packages/replay/src/project.ts] |
| DTO contract drift makes UI explanations false | Tampering / Repudiation | Cause-code unit tests against generated Chronicles and projection tests that compare public/owner outputs. [VERIFIED: packages/test-utils/src/replay-scenarios.ts + packages/replay/src/project.test.ts] |
| Dead replay link misrepresents Match availability | Repudiation | Use `status` + `hasReplay` helper tests for every Match state. [VERIFIED: packages/persistence/src/matchset-status.ts + apps/web/app/workshop/workshop-client-state.ts] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` — project non-negotiables, terminology, privacy, runtime and testing expectations. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/*.md`, `.planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md` — phase scope, DEBUG-01 through DEBUG-06, prior phase context, pitfalls. [VERIFIED: requested planning files]
- `CowardsGameSpec_Full_Consolidated_v1.md` — Strategy API, runtime constraints, Chronicle/private/public replay requirements. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]
- `CowardsGame_Technical_Architecture_Spec_V1.md` — web/runtime/replay boundaries and testing strategy. [VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md]
- `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts` — validation codes, runtime violation types, Chronicle/projection schemas. [VERIFIED: codebase grep/read]
- `packages/runtime-js/src/validation.ts`, `packages/runtime-js/src/guards.ts`, `packages/runtime-js/src/executor.ts` — validation and runtime violation behavior. [VERIFIED: codebase grep/read]
- `packages/replay/src/project.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/grammar.ts` — projection, validation, replay reconstruction. [VERIFIED: codebase grep/read]
- `apps/web/app/workshop/*`, `apps/web/app/matches/*`, `apps/web/e2e/*.spec.ts` — Workshop/replay UI, DTO shaping, owner debug gating, tests. [VERIFIED: codebase grep/read]

### Secondary (MEDIUM confidence)
- Context7 `/microsoft/playwright.dev` — Playwright screenshot assertions wait for stable screenshots and support animation/discrepancy options. [CITED: https://github.com/microsoft/playwright.dev/blob/main/nodejs/versioned_docs/version-stable/api/class-pageassertions.mdx]
- Context7 `/vitest-dev/vitest/v4.1.6` — Vitest supports jsdom docblock and browser React rendering packages, though this repo does not currently depend on those packages. [CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/config/environment.md + https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/browser/react.md]
- Context7 `/vercel/next.js/v16.2.2` — App Router Server Components can fetch data and pass serializable props to Client Components. [CITED: https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/05-server-and-client-components.mdx]
- Context7 `/colinhacks/zod/v4.0.1` — Zod 4 docs confirm current API evolution; local code already uses Zod schemas successfully. [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/v4/changelog.mdx]
- npm registry — current package versions and publish modification dates for Next.js, React, Vitest, Playwright, and Zod. [VERIFIED: npm view commands]

### Tertiary (LOW confidence)
- None. [VERIFIED: research used project files, current registry data, and official/Context7 docs]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions were verified against `package.json`, package manifests, and npm registry. [VERIFIED: package.json + apps/web/package.json + packages/*/package.json + npm registry]
- Architecture: HIGH — recommendations follow existing package boundaries and source files. [VERIFIED: .planning/research/ARCHITECTURE.md + codebase grep/read]
- Pitfalls: HIGH — pitfalls are documented in milestone research and visible in current source/test seams. [VERIFIED: .planning/research/PITFALLS.md + apps/web/app/matches/[matchId]/replay/replay-client.tsx + packages/replay/src/project.test.ts]
- UI testing: HIGH for fixture/visual tests, MEDIUM for optional service E2E because local PostgreSQL was unavailable during research. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts + apps/web/e2e/replay.visual.spec.ts + apps/web/e2e/workshop-to-replay.spec.ts + pg_isready]

**Research date:** 2026-05-18  
**Valid until:** 2026-06-17 for project architecture; recheck npm/library versions before implementation if package upgrades are planned. [VERIFIED: npm registry dates]
