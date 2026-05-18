# Phase 8: Replay Fixture Fidelity and Visual Regression - Research

**Researched:** 2026-05-18  
**Domain:** Engine-generated replay fixtures, Chronicle projection parity, Playwright visual regression  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Demo Corpus Shape
- **D-01:** Build both mechanic-specific demos and, if useful, one compound tour Match. The mechanic-specific corpus should include push, fall, contraction, legal Backstab, runtime failure, and endgame as separate canonical demos so failures are easy to localize.
- **D-02:** A compound tour Match is allowed only if it remains engine-generated and useful for replay smoke coverage. It must not become a hand-authored visual story that bypasses engine legality.

### Fixture Generation Policy
- **D-03:** Engine-generated fixtures are the default. New canonical replay data should be produced through legal engine/test-utils scenarios and Chronicle/replay projection paths.
- **D-04:** Hand-authored replay states are legacy/test-only exceptions. They may remain only for tiny UI fallbacks, and each exception must be explicit and guarded by legality/projection tests.

### Visual Regression Scope
- **D-05:** Use focused mechanic-specific Playwright screenshots rather than broad full-page visual snapshots.
- **D-06:** Screenshot checks should cover board scale, Soldier positions, contraction bounds, and event callouts at stable desktop and mobile viewports.
- **D-07:** Tests should use deterministic fixture data, stable selectors, and avoid dynamic page regions where possible.

### Failure Diagnostics
- **D-08:** Fixture and visual failures should identify the failing layer: engine legality, Chronicle validation, projection/DTO shaping, or UI rendering.
- **D-09:** Layer classification should appear in test names, helper errors, or assertion messages so failures are actionable during local and CI runs.

### the agent's Discretion
- The planner may choose the exact helper/module names, scenario-builder API shape, and screenshot thresholding as long as the resulting system follows the decisions above.

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FID-01 | Developer can generate canonical replay fixtures from legal engine scenarios instead of relying on hand-authored replay data. | Use `packages/test-utils` scenario builders plus `packages/replay/src/build.ts::buildChronicleFromMatch`; replace direct `ReplayReadyDto` board/timeline authorship in `apps/web/app/matches/replay-fixture.ts`. [VERIFIED: packages/test-utils/src/engine-scenarios.ts] [VERIFIED: packages/replay/src/build.ts] [VERIFIED: apps/web/app/matches/replay-fixture.ts] |
| FID-02 | Developer can run canonical demo Matches covering push, fall, contraction, legal Backstab, runtime failure, and endgame. | Build separate named scenarios for each mechanic and optionally a compound tour generated through the same engine path. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md] [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md] |
| FID-03 | Developer can run fixture legality tests that reject impossible replay beats before they reach the replay viewer. | Keep legality assertions at package level near generated scenario manifests, then keep web fixture tests for DTO/projection parity. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts] [VERIFIED: packages/replay/src/validate.ts] [VERIFIED: packages/replay/src/reconstruct.ts] |
| FID-04 | Replay viewer can render engine-generated fixtures through the same projection path used by persisted Match Chronicles. | Route fixture generation through `createReplay`, `projectPublicChronicle`/`projectOwnerChronicle`, and the existing `buildTimeline` logic instead of returning pre-shaped `timeline` and `states` arrays from hand-authored data. [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: packages/replay/src/project.ts] [VERIFIED: packages/replay/src/reconstruct.ts] |
| FID-05 | CI can run visual regression checks for board scale, Soldier positions, contraction bounds, and event callouts at stable desktop and mobile viewports. | Extend `apps/web/e2e/replay.fixture.spec.ts` with named locator screenshots for specific fixture sequences; current config already defines desktop `1440x900` and mobile `390x844` Chromium projects. [VERIFIED: playwright.config.ts] [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [CITED: Context7 /microsoft/playwright] |
| FID-06 | Developer can inspect expected event sequences and visual checkpoints for each canonical demo Match. | Scenario builders should return a manifest containing `expectedEventTypes`, named sequence checkpoints, and visual assertions alongside the Chronicle. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts] [ASSUMED] |
| FID-07 | Replay fixture failures identify whether the failure is engine legality, Chronicle validation, projection, or UI rendering. | Use layer-prefixed test names and helper error messages: `[engine legality]`, `[chronicle validation]`, `[projection]`, `[ui rendering]`. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md] |
</phase_requirements>

## Summary

Phase 8 should replace the current web-local hand-authored replay fixture with a canonical replay fixture corpus generated by the pure engine and Chronicle builder. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: packages/replay/src/build.ts] The strongest implementation path is to put scenario definitions and expected checkpoints in `packages/test-utils`, build Chronicles with `buildChronicleFromMatch`, validate/reconstruct them in `packages/replay`, and let `apps/web` transform them through the same `buildReadyReplay` style path used for persisted Chronicles. [VERIFIED: packages/test-utils/src/engine-scenarios.ts] [VERIFIED: apps/web/app/matches/server.ts]

The current fixture already has valuable guard tests, but those tests validate a manually constructed `ReplayReadyDto`; they do not prove the data came from legal engine execution. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts] [VERIFIED: apps/web/app/matches/replay-fixture.ts] The planner should preserve those legality ideas while moving the source of truth earlier: scenario -> engine -> Chronicle -> validation -> replay reconstruction -> projection -> web DTO. [VERIFIED: packages/replay/src/build.ts] [VERIFIED: packages/replay/src/validate.ts] [VERIFIED: packages/replay/src/reconstruct.ts] [VERIFIED: packages/replay/src/project.ts]

**Primary recommendation:** Build `packages/test-utils` canonical replay scenarios that emit legal Chronicles plus event/visual manifests, then update the web fixture route to consume those Chronicles through the persisted replay projection path. [VERIFIED: .planning/research/ARCHITECTURE.md] [VERIFIED: apps/web/app/matches/server.ts]

## Project Constraints (from AGENTS.md)

- The engine must stay pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not be placed in React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Runtime boundaries must treat Strategy code as hostile and validate with schemas. [VERIFIED: AGENTS.md]
- Canonical terminology must be preserved: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or raw private replay data by default. [VERIFIED: AGENTS.md] [VERIFIED: packages/replay/src/project.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Canonical scenario setup | Test utilities package | Engine package | Scenario data belongs outside the UI, while legality is proven by engine execution. [VERIFIED: packages/test-utils/src/engine-scenarios.ts] [VERIFIED: packages/engine/src/state.ts] |
| Match legality and mechanic behavior | Engine package | Spec package | Push, fall, Backstab, contraction, and runtime violation effects are engine events governed by spec schemas and rules. [VERIFIED: packages/engine/src/movement.ts] [VERIFIED: packages/engine/src/backstab.ts] [VERIFIED: packages/engine/src/contraction.ts] [VERIFIED: packages/spec/src/schemas.ts] |
| Chronicle construction and replay reconstruction | Replay package | Engine package | `buildChronicleFromMatch` creates event/snapshot artifacts from engine transitions, and `createReplay` reconstructs board states from Chronicles. [VERIFIED: packages/replay/src/build.ts] [VERIFIED: packages/replay/src/reconstruct.ts] |
| Public/owner projection and privacy | Replay package | Web server | Projection sanitizes private payloads; the web server chooses public versus owner projection. [VERIFIED: packages/replay/src/project.ts] [VERIFIED: apps/web/app/matches/server.ts] |
| Fixture DTO serving | Frontend server | Replay package | `apps/web/app/matches/server.ts` owns `ReplayReadyDto` assembly for the route, but should source data from replay package outputs. [VERIFIED: apps/web/app/matches/server.ts] |
| Board rendering and visual checks | Browser / Client | Playwright | Pixi renders a canvas in the replay client, and Playwright should screenshot stable locators at deterministic sequences. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board.tsx] [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [CITED: Context7 /microsoft/playwright] |

## Existing Code Leverage

| File | Current Role | Phase 8 Use |
|------|--------------|-------------|
| `packages/test-utils/src/engine-scenarios.ts` | Provides minimal scenario-state helpers and exports from `@cowards/test-utils`. [VERIFIED: packages/test-utils/src/engine-scenarios.ts] | Expand into canonical replay scenario builders and manifests; add `@cowards/engine` and `@cowards/replay` dependencies if scenario generation lives here. [VERIFIED: packages/test-utils/package.json] |
| `packages/replay/src/build.ts` | Builds a Chronicle by stepping through `createInitialGameState`, activation selection, activations, match-end checks, and contraction. [VERIFIED: packages/replay/src/build.ts] | Use as the only source for canonical demo Chronicles. [VERIFIED: packages/replay/src/build.ts] |
| `packages/replay/src/reconstruct.ts` | Reconstructs replay board states from Chronicle events and checks boundary snapshot mismatches. [VERIFIED: packages/replay/src/reconstruct.ts] | Use for fixture legality and projection parity before web rendering. [VERIFIED: packages/replay/src/reconstruct.ts] |
| `packages/replay/src/project.ts` | Parses canonical Chronicle data and sanitizes public projection payloads. [VERIFIED: packages/replay/src/project.ts] | Keep public and owner replay fixture behavior aligned with persisted Matches. [VERIFIED: apps/web/app/matches/server.ts] |
| `apps/web/app/matches/server.ts` | Builds persisted replay DTOs through projection plus `createReplay`; current fixture path bypasses that flow. [VERIFIED: apps/web/app/matches/server.ts] | Extract or reuse a helper that builds `ReplayReadyDto` from an in-memory Chronicle/stored-Chronicle equivalent. [VERIFIED: apps/web/app/matches/server.ts] |
| `apps/web/app/matches/replay-fixture.ts` | Hand-authors boards, timeline, projection metadata, and owner private payloads. [VERIFIED: apps/web/app/matches/replay-fixture.ts] | Replace with a thin selector over generated fixture Chronicles; keep only test-support route gating and any explicit tiny fallback exception. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md] |
| `apps/web/e2e/replay.fixture.spec.ts` | Confirms replay fixture renders and public privacy is preserved. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] | Add focused visual assertions for named mechanic scenarios and stable sequence checkpoints. [CITED: Context7 /microsoft/playwright] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@cowards/engine` | workspace `0.1.0` | Legal Match execution and mechanic events. [VERIFIED: packages/engine/package.json] | Engine is the canonical rules tier and already emits transition event summaries. [VERIFIED: packages/engine/src/types.ts] |
| `@cowards/replay` | workspace `0.1.0` | Chronicle build, validation, reconstruction, projection, and hashing. [VERIFIED: packages/replay/package.json] | Replay package already owns `buildChronicleFromMatch`, `validateChronicle`, `createReplay`, and projection APIs. [VERIFIED: packages/replay/src/index.ts] |
| `@cowards/test-utils` | workspace `0.1.0` | Shared scenario setup for tests and fixture generation. [VERIFIED: packages/test-utils/package.json] | Existing package boundary is the right home for reusable canonical scenario builders. [VERIFIED: .planning/research/ARCHITECTURE.md] |
| `@playwright/test` | `1.60.0`, published latest as of 2026-05-18. [VERIFIED: npm registry] | Browser E2E and visual regression. [CITED: Context7 /microsoft/playwright] | Existing config and tests already use Playwright projects for desktop/mobile Chromium. [VERIFIED: playwright.config.ts] |
| `vitest` | `4.1.6`, published latest as of 2026-05-11. [VERIFIED: npm registry] | Unit and integration tests. [VERIFIED: package.json] | Existing package scripts and focused test filters use Vitest. [VERIFIED: package.json] [CITED: Context7 /vitest-dev/vitest/v4.1.6] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `4.4.3`, published latest as of 2026-05-04. [VERIFIED: npm registry] | Schema validation for Chronicle and runtime boundary data. [VERIFIED: packages/spec/package.json] | Keep using spec schemas for Chronicle shape validation; do not hand-parse event payloads. [VERIFIED: packages/spec/src/schemas.ts] |
| `pixi.js` | `8.18.1`, published latest as of 2026-05-12. [VERIFIED: npm registry] | Canvas board rendering. [VERIFIED: apps/web/package.json] | No Phase 8 rendering-library change is needed; visual tests should target the existing Pixi canvas. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board.tsx] |
| `next` | `16.2.6`, published latest as of 2026-05-17. [VERIFIED: npm registry] | Web app routes and replay server entry points. [VERIFIED: apps/web/package.json] | Use the existing test-support route and replay page instead of adding a second viewer surface. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Engine-generated fixtures | More hand-authored `ReplayReadyDto` objects | Faster to author, but repeats the current fragility and bypasses legal event generation. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: .planning/research/PITFALLS.md] |
| Locator screenshots | Full-page screenshots | Full-page snapshots include more layout noise and are less focused on board scale, Soldier positions, contraction, and callouts. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md] [CITED: Context7 /microsoft/playwright] |
| Existing Playwright + Vitest | Add a new visual-regression service | No new service is required for Phase 8 because Playwright screenshot assertions are built into the current test runner. [CITED: Context7 /microsoft/playwright] |

**Installation:**
```bash
# No new external packages recommended.
# If canonical scenario generation is added to @cowards/test-utils, update workspace package dependencies:
pnpm --filter @cowards/test-utils add @cowards/engine@workspace:* @cowards/replay@workspace:*
```

**Version verification:** `npm view` confirmed `@playwright/test@1.60.0`, `vitest@4.1.6`, `next@16.2.6`, `pixi.js@8.18.1`, `@pixi/react@8.0.5`, `react@19.2.6`, `typescript@6.0.3`, and `zod@4.4.3` as current latest package versions on 2026-05-18. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Canonical demo request
  -> packages/test-utils scenario manifest
    -> deterministic StrategyRuntime for scenario
    -> @cowards/engine legal Match execution
    -> @cowards/replay buildChronicleFromMatch
    -> validateChronicle + createReplay
      -> ok: Chronicle + replay states + expected checkpoints
      -> error: [chronicle validation] / [engine legality] failure
    -> projectPublicChronicle / projectOwnerChronicle
    -> apps/web ReplayReadyDto assembly
    -> replay route /matches/:id/replay
    -> Pixi board render
    -> Playwright locator screenshots and UI assertions
```

This data flow preserves the existing engine/replay/web boundaries and avoids placing game rules in React. [VERIFIED: AGENTS.md] [VERIFIED: apps/web/app/matches/server.ts]

### Recommended Project Structure

```text
packages/test-utils/src/
├── engine-scenarios.ts          # existing generic helpers
├── replay-scenarios.ts          # canonical demo scenario builders and manifests
└── replay-scenarios.test.ts     # [engine legality] and [chronicle validation] tests

apps/web/app/matches/
├── replay-fixture.ts            # thin fixture lookup + ReplayReadyDto bridge
├── replay-fixture.test.ts       # [projection] fixture route/DTO parity tests
└── server.ts                    # shared persisted/in-memory Chronicle -> ReplayReadyDto helper

apps/web/e2e/
├── replay.fixture.spec.ts       # smoke + privacy path
└── replay.visual.spec.ts        # focused screenshot checks by demo/checkpoint
```

This structure keeps reusable legal fixture generation in `packages/test-utils` and keeps browser-only visual checks in `apps/web/e2e`. [VERIFIED: packages/test-utils/package.json] [VERIFIED: playwright.config.ts]

### Pattern 1: Scenario Manifest Builder

**What:** Each canonical demo should return a named Chronicle plus expected event sequence and visual checkpoints. [ASSUMED]  
**When to use:** Use for push, fall, contraction, legal Backstab, runtime failure, endgame, and any optional compound tour. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]

```typescript
// Source pattern: packages/replay/src/build.ts and packages/replay/src/integration.test.ts
export interface CanonicalReplayScenario {
  id: string
  chronicle: Chronicle
  expectedEventTypes: ChronicleEventType[]
  visualCheckpoints: Array<{
    name: string
    sequence: number
    assertions: string[]
  }>
}

export const createPushScenario = (): CanonicalReplayScenario => {
  const { chronicle } = buildChronicleFromMatch(createPushMatchInput())
  return {
    id: "push",
    chronicle,
    expectedEventTypes: ["PUSH_RESOLVED", "MOVE_ADVANCED"],
    visualCheckpoints: [
      {
        name: "push-after-resolution",
        sequence: sequenceOf(chronicle, "PUSH_RESOLVED"),
        assertions: ["target moved one square", "push callout visible"],
      },
    ],
  }
}
```

The exact API can vary, but the manifest should make expected event sequences and visual checkpoints inspectable without opening the browser. [VERIFIED: FID-06 in .planning/REQUIREMENTS.md] [ASSUMED]

### Pattern 2: Shared Chronicle-to-Replay DTO Bridge

**What:** Extract the persisted replay DTO assembly in `apps/web/app/matches/server.ts` so both stored Chronicles and in-memory fixture Chronicles use the same reconstruction and projection path. [VERIFIED: apps/web/app/matches/server.ts]  
**When to use:** Use for FID-04 before adding screenshot baselines. [VERIFIED: FID-04 in .planning/REQUIREMENTS.md]

```typescript
// Source pattern: apps/web/app/matches/server.ts
const replayResult = createReplay(stored.artifact)
const projection =
  mode === "owner"
    ? projectOwnerChronicle(stored.artifact, options.ownerPlayerId!)
    : projectPublicChronicle(stored.artifact)
const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
  sequence: entry.sequence,
  board: entry.state.board,
  ...(entry.state.outcome === undefined ? {} : { outcome: entry.state.outcome }),
}))
```

The fixture path should stop returning hand-shaped `projection.events: []`, `projection.snapshots: []`, and parallel `timeline`/`states` arrays disconnected from a real Chronicle. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: apps/web/app/matches/server.ts]

### Pattern 3: Focused Locator Screenshots

**What:** Screenshot stable replay board/callout regions at named sequences, not the full page. [CITED: Context7 /microsoft/playwright] [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]  
**When to use:** Use after fixture data is engine-generated and projection parity tests pass. [VERIFIED: FID-05 in .planning/REQUIREMENTS.md]

```typescript
// Source: Context7 /microsoft/playwright, LocatorAssertions.toHaveScreenshot
await page.goto(`/matches/${encodeURIComponent(matchId)}/replay`)
await setReplaySequence(page, checkpoint.sequence)
await expect(page.getByLabel(/Replay board at sequence/)).toHaveScreenshot(
  `${scenario.id}-${checkpoint.name}.png`,
  {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  },
)
```

Playwright waits for stable locator screenshots and supports comparison options such as `animations`, `stylePath`, `maxDiffPixels`, `maxDiffPixelRatio`, and `threshold`. [CITED: Context7 /microsoft/playwright]

### Anti-Patterns to Avoid

- **Hand-authoring mechanic boards in `apps/web`:** This bypasses legal engine execution and repeats the current source of fixture fragility. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: .planning/research/PITFALLS.md]
- **Testing only DTO shape:** A `ReplayReadyDto` can look usable while describing impossible play; Chronicle validation and reconstruction must run before UI assertions. [VERIFIED: packages/replay/src/validate.ts] [VERIFIED: packages/replay/src/reconstruct.ts]
- **Moving rule inference into React:** Replay UI should render engine/replay-derived data; it should not calculate legal push, Backstab, or contraction consequences. [VERIFIED: AGENTS.md] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board-model.ts]
- **Broad full-page screenshots:** Full-page snapshots are less diagnostic than mechanic-specific board/callout screenshots. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Legal mechanic playback | Manual board arrays and event arrays | `buildChronicleFromMatch` with deterministic scenario runtimes | Engine execution covers actual rule sequencing, activation windows, and Match termination. [VERIFIED: packages/replay/src/build.ts] |
| Chronicle shape parsing | Ad hoc payload checks | `ChronicleSchema` and `validateChronicle` | Spec schemas already define event payloads, snapshot kinds, versions, and validation error codes. [VERIFIED: packages/spec/src/schemas.ts] [VERIFIED: packages/replay/src/validate.ts] |
| Replay state reconstruction | Directly authored `states` arrays | `createReplay(...).iterateReplay()` | Reconstruction compares boundary snapshots and surfaces `SNAPSHOT_MISMATCH` errors. [VERIFIED: packages/replay/src/reconstruct.ts] |
| Public privacy filtering | Per-route string omission | `projectPublicChronicle` / `projectOwnerChronicle` | Projection already strips private payload keys and gates owner data by `PlayerId`. [VERIFIED: packages/replay/src/project.ts] |
| Visual diff engine | Custom canvas pixel comparison | Playwright `toHaveScreenshot` | Playwright test runner provides locator screenshot assertions with thresholding and masking/styling options. [CITED: Context7 /microsoft/playwright] |

**Key insight:** The fixture problem is primarily a provenance problem, not a rendering problem; if replay demos are engine-generated and projected through the same path as persisted Chronicles, visual checks become a guard on UI fidelity instead of a substitute for legality. [VERIFIED: .planning/research/SUMMARY.md] [VERIFIED: apps/web/app/matches/server.ts]

## Recommended Fixture Architecture

1. Add canonical scenario builders in `packages/test-utils/src/replay-scenarios.ts`. [VERIFIED: packages/test-utils/src/index.ts]  
2. Each scenario should provide deterministic `RunMatchInput`, usually with a scripted `StrategyRuntime`, and call `buildChronicleFromMatch`. [VERIFIED: packages/replay/src/build.test.ts] [VERIFIED: packages/engine/src/test/fake-runtime.ts]  
3. Each scenario should assert the resulting Chronicle contains required event types and named checkpoint sequences before exposing it to web tests. [VERIFIED: packages/replay/src/build.test.ts] [ASSUMED]  
4. Add a web bridge that converts a generated Chronicle to `ReplayReadyDto` using `createReplay`, `projectPublicChronicle`/`projectOwnerChronicle`, and `buildTimeline`. [VERIFIED: apps/web/app/matches/server.ts]  
5. Keep the test-support API route as a fixture discovery endpoint, but extend the response to identify available scenario IDs or accept a scenario query param. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts] [ASSUMED]  
6. Preserve owner-debug coverage with generated owner private sections from real `AWARENESS_GRID_OBSERVED` events, not manually inserted `ownerPrivate` data. [VERIFIED: packages/replay/src/build.ts] [VERIFIED: apps/web/app/matches/replay-fixture.ts]

## Visual Regression Approach

| Check | Recommended Target | Stable Driver |
|-------|--------------------|---------------|
| Board scale | `page.getByLabel(/Replay board at sequence/)` or `.replay-board-host` | Existing `ReplayBoard` host has an aria label with sequence and event type. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board.tsx] |
| Soldier positions | Board locator screenshot at mechanic checkpoint | Engine-generated scenario manifest names the sequence. [ASSUMED] |
| Contraction bounds | Contraction scenario board locator screenshot | `CONTRACTION_RESOLVED` payload contains bounds and the board model renders contraction separately. [VERIFIED: packages/spec/src/schemas.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board-model.ts] |
| Event callouts | Board locator screenshot at push/fall/Backstab/runtime sequences | Board model maps major event types to callout descriptors. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-board-model.ts] |
| Public privacy | Text/body assertion plus public projection serialization test | Existing E2E already checks private markers are absent. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |

Screenshot tests should use deterministic fixture data, fixed viewports from `playwright.config.ts`, locator screenshots, disabled animations, and explicit names such as `push-board-desktop.png` and `contraction-board-mobile.png`. [VERIFIED: playwright.config.ts] [CITED: Context7 /microsoft/playwright] Avoid screenshotting the full replay page until layout is intentionally under review. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]

## Suggested Build Order

1. **Wave 0 - Baseline and test naming:** Add layer-prefixed test helpers and identify the current fixture tests as `[projection]` or `[ui rendering]`. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts]  
2. **Scenario corpus:** Implement `packages/test-utils` canonical scenario builders for push, fall, contraction, legal Backstab, runtime failure, and endgame. [VERIFIED: .planning/REQUIREMENTS.md]  
3. **Chronicle legality tests:** Add package tests that call `validateChronicle`, `createReplay`, and manifest event/checkpoint assertions for each scenario. [VERIFIED: packages/replay/src/validate.ts] [VERIFIED: packages/replay/src/reconstruct.ts]  
4. **Projection parity bridge:** Refactor web fixture serving so generated fixture Chronicles use the persisted replay projection path. [VERIFIED: apps/web/app/matches/server.ts]  
5. **E2E fixture discovery:** Update `/api/test-support/replay-fixture` or add a scenario-aware endpoint for Playwright fixture selection. [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts]  
6. **Focused visual regression:** Add locator screenshots for board scale, Soldier positions, contraction bounds, and callouts at desktop/mobile viewports. [VERIFIED: playwright.config.ts] [CITED: Context7 /microsoft/playwright]  
7. **Legacy exception cleanup:** Remove or explicitly isolate any remaining hand-authored fallback data and keep guard tests around every exception. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Scenario Builders That Still Bypass the Engine
**What goes wrong:** A builder creates snapshots directly and labels them "scenario" data. [VERIFIED: apps/web/app/matches/replay-fixture.ts]  
**Why it happens:** It is quicker to arrange visual beats directly than to script a legal `StrategyRuntime`. [ASSUMED]  
**How to avoid:** Require every canonical scenario to expose a Chronicle generated by `buildChronicleFromMatch`. [VERIFIED: packages/replay/src/build.ts]  
**Warning signs:** Tests assert only array contents or canvas pixels and never call `validateChronicle` or `createReplay`. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts]

### Pitfall 2: Projection Drift Between Fixture and Persisted Match Replays
**What goes wrong:** The fixture route has different metadata, privacy, timeline, or states than persisted replay loading. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: apps/web/app/matches/server.ts]  
**Why it happens:** Fixture DTOs are currently assembled separately from `buildReadyReplay`. [VERIFIED: apps/web/app/matches/server.ts]  
**How to avoid:** Share a Chronicle-to-`ReplayReadyDto` helper and feed fixture Chronicles through it. [VERIFIED: apps/web/app/matches/server.ts]  
**Warning signs:** Fixture projection has empty `events` and `snapshots` while `timeline` and `states` are populated. [VERIFIED: apps/web/app/matches/replay-fixture.ts]

### Pitfall 3: Screenshot Flakiness from Animation and Broad Targets
**What goes wrong:** CI fails because transient animation, responsive text, or unrelated layout changed. [CITED: Context7 /microsoft/playwright]  
**Why it happens:** Screenshots cover too much page or capture dynamic regions. [VERIFIED: .planning/research/PITFALLS.md]  
**How to avoid:** Use locator screenshots, set deterministic sequence before capture, disable animations, and keep thresholds low but nonzero. [CITED: Context7 /microsoft/playwright]  
**Warning signs:** Baselines change when unrelated header/sidebar copy changes. [ASSUMED]

### Pitfall 4: Runtime Failure Scenario Running Hostile Source in Web
**What goes wrong:** A runtime-failure demo accidentally executes Strategy source in the web/API process. [VERIFIED: AGENTS.md]  
**Why it happens:** Fixture generation is convenient to trigger from a web route. [ASSUMED]  
**How to avoid:** Generate runtime-failure Chronicles in test utilities or package tests using existing runtime/engine paths; the web route should only serve generated replay data. [VERIFIED: packages/runtime-js/src/integration.test.ts] [VERIFIED: apps/web/app/api/test-support/replay-fixture/route.ts]

### Pitfall 5: Backstab Checkpoint Is Visually Plausible but Illegal
**What goes wrong:** The UI shows a Backstab callout for attackers not directly behind enemy ACTIVE Soldiers. [VERIFIED: apps/web/app/matches/replay-fixture.test.ts]  
**Why it happens:** Direct-behind constraints are spatial and easy to get wrong when manually placing pieces. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]  
**How to avoid:** Generate legal Backstab through engine activation boundaries and keep direct-behind assertions in scenario tests. [VERIFIED: packages/engine/src/backstab.test.ts]

## Code Examples

### Generate a Chronicle From a Legal Match

```typescript
// Source: packages/replay/src/build.test.ts
const { chronicle, finalState } = buildChronicleFromMatch({
  matchId: "canonical-demo-push",
  seed: "canonical-demo-push-seed",
  arenaVariant,
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
  runtime: deterministicRuntime,
  maxPhases: 1,
})
expect(validateChronicle(chronicle)).toEqual({ ok: true })
```

This pattern should replace direct construction of replay boards and timeline entries for canonical demos. [VERIFIED: packages/replay/src/build.test.ts] [VERIFIED: apps/web/app/matches/replay-fixture.ts]

### Build Replay States Through Reconstruction

```typescript
// Source: apps/web/app/matches/server.ts
const replayResult = createReplay(chronicle)
if (!replayResult.ok) {
  throw new Error(`[chronicle validation] ${replayResult.errors[0]?.message}`)
}

const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
  sequence: entry.sequence,
  board: entry.state.board,
  ...(entry.state.outcome === undefined ? {} : { outcome: entry.state.outcome }),
}))
```

This keeps fixture states aligned with Chronicle event application and boundary snapshot checks. [VERIFIED: packages/replay/src/reconstruct.ts] [VERIFIED: apps/web/app/matches/server.ts]

### Focused Playwright Screenshot Assertion

```typescript
// Source: Context7 /microsoft/playwright
await expect(page.getByLabel(/Replay board at sequence/)).toHaveScreenshot(
  "push-callout.png",
  {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  },
)
```

Playwright locator screenshot assertions are available in the test runner and support screenshot-specific comparison options. [CITED: Context7 /microsoft/playwright]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-authored replay fixture boards/timeline in `apps/web` | Engine-generated legal scenario Chronicles with replay projection parity | Phase 8 target on 2026-05-18 | Reduces fixture legality drift and makes visual demos debuggable by layer. [VERIFIED: .planning/ROADMAP.md] |
| Full-page or broad visual snapshots | Focused mechanic-specific locator screenshots | Phase 8 target on 2026-05-18 | Improves diagnostic value for board scale, Soldier positions, contraction bounds, and callouts. [VERIFIED: .planning/REQUIREMENTS.md] [CITED: Context7 /microsoft/playwright] |
| Fixture route returns a bespoke `ReplayReadyDto` | Fixture route should use same Chronicle -> projection -> replay-state path as stored Matches | Phase 8 target on 2026-05-18 | Satisfies FID-04 and prevents fixture-only behavior. [VERIFIED: apps/web/app/matches/server.ts] |

**Deprecated/outdated:**
- Canonical demos based on direct `FullBoardSnapshot` arrays are deprecated for Phase 8 except explicit tiny UI fallback exceptions. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]
- Browser-only smoke checks without screenshot baselines are insufficient for FID-05. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Scenario manifests should include a compact `visualCheckpoints` structure. | Phase Requirements, Architecture Patterns | Planner may choose a different shape; requirement still needs inspectable checkpoints. |
| A2 | The fixture endpoint can be extended with scenario IDs or a scenario query parameter. | Recommended Fixture Architecture | Planner may prefer separate endpoints or encoded Match IDs. |
| A3 | Screenshot flakiness will mainly come from animation and broad targets. | Common Pitfalls | Planner may need additional stabilization for Pixi/font/canvas rendering. |
| A4 | Runtime-failure fixture generation should happen outside the web request path. | Common Pitfalls | If fixtures are generated lazily in web, the plan must prove no Strategy source executes in web/API. |

## Open Questions (RESOLVED)

1. **Should generated fixture Chronicles be computed at import time or precomputed during tests?**  
   - What we know: Test-support fixture data is currently created in process from `createReplayFixtureData`. [VERIFIED: apps/web/app/matches/replay-fixture.ts]  
   - What's unclear: Whether planners prefer import-time generation, lazy memoized generation, or checked-in JSON artifacts. [ASSUMED]  
   - Recommendation: Generate in TypeScript at test/runtime startup and memoize; avoid checked-in Chronicle JSON unless a later compatibility-fixture phase needs frozen artifacts. [ASSUMED]
   - RESOLVED: Phase 8 will generate canonical fixture Chronicles in TypeScript at test/runtime startup and may memoize them in process; it will not check in canonical Chronicle JSON artifacts in this phase.

2. **Should screenshot baselines live in `apps/web/e2e` or a dedicated visual spec directory?**  
   - What we know: Playwright currently uses `testDir: "./apps/web/e2e"`. [VERIFIED: playwright.config.ts]  
   - What's unclear: Whether the team wants to split smoke E2E and visual regression scripts now or in Phase 12. [ASSUMED]  
   - Recommendation: Add `apps/web/e2e/replay.visual.spec.ts` now and add a root script such as `e2e:visual` if CI needs separate gating. [ASSUMED]
   - RESOLVED: Visual screenshot tests and baselines will live under `apps/web/e2e` using `replay.visual.spec.ts` and Playwright's colocated snapshot directory; add a root `e2e:visual` script for dedicated gating.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript workspace and Playwright web server | Yes | `v24.15.0` [VERIFIED: local command] | None needed |
| pnpm | Workspace scripts | Yes | `11.1.2` [VERIFIED: local command] | None needed |
| npm | Package version verification | Yes | `11.12.1` [VERIFIED: local command] | Use pnpm registry commands |
| Docker | Not required for Phase 8 fixture route; useful for broader service E2E | Yes | `29.4.3` [VERIFIED: local command] | Fixture visual checks use Next dev server without DB |
| Playwright browsers | Visual regression | Yes | Existing `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts --project=desktop` run passed both configured projects. [VERIFIED: local command] | Install browsers with Playwright if missing |

**Missing dependencies with no fallback:** None found for Phase 8 research and focused fixture visual testing. [VERIFIED: local command]

**Missing dependencies with fallback:** None found. [VERIFIED: local command]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit/integration framework | Vitest `4.1.6`. [VERIFIED: npm registry] |
| Browser framework | Playwright `@playwright/test` `1.60.0`. [VERIFIED: npm registry] |
| Config files | `apps/web/vitest.config.ts`, `playwright.config.ts`. [VERIFIED: local file scan] |
| Quick run command | `pnpm --filter @cowards/web test -- replay-fixture.test.ts` and `pnpm --filter @cowards/replay test -- build.test.ts reconstruct.test.ts validate.test.ts integration.test.ts`. [VERIFIED: local command] |
| Visual run command | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`. [VERIFIED: package.json] |
| Full suite command | `pnpm verify`. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FID-01 | Generate canonical fixtures from legal engine scenarios | unit/integration | `pnpm --filter @cowards/test-utils test -- replay-scenarios.test.ts` | No - Wave 0 |
| FID-02 | Cover push, fall, contraction, legal Backstab, runtime failure, endgame | unit/integration | `pnpm --filter @cowards/test-utils test -- replay-scenarios.test.ts -t "[engine legality]"` | No - Wave 0 |
| FID-03 | Reject impossible replay beats before rendering | integration | `pnpm --filter @cowards/replay test -- reconstruct.test.ts validate.test.ts` | Yes, but add fixture-specific tests |
| FID-04 | Fixture uses same projection path as persisted Chronicles | unit | `pnpm --filter @cowards/web test -- replay-fixture.test.ts server.test.ts` | Yes, needs expansion |
| FID-05 | Visual checks for board scale, positions, contraction, callouts | e2e visual | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts` | No - Wave 0 |
| FID-06 | Inspect expected event sequences and visual checkpoints | unit | `pnpm --filter @cowards/test-utils test -- replay-scenarios.test.ts -t "manifest"` | No - Wave 0 |
| FID-07 | Failures identify engine legality, Chronicle validation, projection, UI rendering | unit/e2e | Layer-prefixed tests across above commands | Partial - expand |

### Sampling Rate

- **Per task commit:** Run the relevant focused Vitest file plus any touched Playwright spec. [VERIFIED: package.json]  
- **Per wave merge:** Run `pnpm --filter @cowards/test-utils test`, `pnpm --filter @cowards/replay test`, `pnpm --filter @cowards/web test -- replay-fixture.test.ts server.test.ts`, and `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`. [VERIFIED: package.json]  
- **Phase gate:** Run `pnpm verify` plus the new visual-regression command if it is separate from `e2e:smoke`. [VERIFIED: package.json] [ASSUMED]

### Wave 0 Gaps

- [ ] `packages/test-utils/src/replay-scenarios.test.ts` - covers FID-01, FID-02, FID-03, FID-06, and engine/Chronicle layer diagnostics. [ASSUMED]
- [ ] `apps/web/e2e/replay.visual.spec.ts` - covers FID-05 focused screenshots. [ASSUMED]
- [ ] Shared `ReplayReadyDto` builder or fixture bridge tests in `apps/web/app/matches/server.test.ts` / `replay-fixture.test.ts` - covers FID-04 and FID-07. [VERIFIED: apps/web/app/matches/server.ts]
- [ ] Optional package script `e2e:visual` - separates screenshot regression from smoke E2E. [ASSUMED]

### Baseline Verification Run

- `pnpm --filter @cowards/web test -- replay-fixture.test.ts` passed: 9 files, 45 tests. [VERIFIED: local command]
- `pnpm --filter @cowards/replay test -- build.test.ts reconstruct.test.ts validate.test.ts integration.test.ts` passed: 7 files, 24 tests. [VERIFIED: local command]
- `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts --project=desktop` passed 4 tests across the configured desktop and mobile projects in this workspace. [VERIFIED: local command]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No direct Phase 8 change | Do not add auth behavior in fixture work. [VERIFIED: .planning/REQUIREMENTS.md] |
| V3 Session Management | No direct Phase 8 change | Do not depend on sessions for public fixture rendering. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |
| V4 Access Control | Yes | Owner debug remains gated by owner mode/options and public projection must omit private sections. [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: packages/replay/src/project.ts] |
| V5 Input Validation | Yes | Use `ChronicleSchema`, `validateChronicle`, and replay reconstruction before web rendering. [VERIFIED: packages/spec/src/schemas.ts] [VERIFIED: packages/replay/src/validate.ts] |
| V6 Cryptography | Limited | Use existing Chronicle hash helpers for integrity when needed; do not hand-roll hashing. [VERIFIED: packages/replay/src/hash.ts] |

### Known Threat Patterns for Replay Fixtures

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public fixture leaks private owner data | Information Disclosure | Use `projectPublicChronicle` and keep browser privacy assertions for private markers. [VERIFIED: packages/replay/src/project.ts] [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |
| Invalid Chronicle rendered as truth | Tampering | Run `validateChronicle` and `createReplay` before DTO assembly. [VERIFIED: packages/replay/src/validate.ts] [VERIFIED: packages/replay/src/reconstruct.ts] |
| Runtime-failure demo executes Strategy source in web/API | Elevation of Privilege | Generate runtime-failure Chronicles through runtime/worker/test package paths, not inside the web route. [VERIFIED: AGENTS.md] [VERIFIED: packages/runtime-js/src/integration.test.ts] |
| Screenshot endpoint enabled outside test/dev | Information Disclosure | Preserve `isReplayFixtureEnabled` gating on `PLAYWRIGHT_TEST`, `test`, or `development`. [VERIFIED: apps/web/app/matches/replay-fixture.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project constraints, non-negotiables, testing expectations.
- `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` - v1.1 scope, FID requirements, current post-shipment fixture correction context.
- `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md` - locked Phase 8 decisions.
- `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md` - milestone research direction.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Chronicle, push, Backstab, contraction, FALLEN, public/private replay rules.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Chronicle/replay architecture and validation principles.
- `apps/web/app/matches/replay-fixture.ts`, `apps/web/app/matches/replay-fixture.test.ts`, `apps/web/e2e/replay.fixture.spec.ts` - current fixture implementation and tests.
- `packages/test-utils/src/engine-scenarios.ts`, `packages/replay/src/build.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/project.ts` - fixture generation and replay pipeline APIs.
- `playwright.config.ts`, `package.json`, `apps/web/package.json`, package manifests - current scripts, versions, and viewport setup.
- Context7 `/microsoft/playwright` - screenshot assertion and Playwright config behavior.
- Context7 `/vitest-dev/vitest/v4.1.6` - focused file/name filtering behavior.
- npm registry - current package versions and publish timestamps.

### Secondary (MEDIUM confidence)

- None needed; Phase 8 is primarily internal codebase architecture plus official test-runner docs. [VERIFIED: local code search]

### Tertiary (LOW confidence)

- None used as authoritative evidence. [VERIFIED: research process]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package manifests, npm registry, and existing config. [VERIFIED: package.json] [VERIFIED: npm registry]
- Architecture: HIGH - verified from existing engine/replay/web boundaries and Phase 8 locked decisions. [VERIFIED: packages/replay/src/build.ts] [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md]
- Pitfalls: HIGH - current hand-authored fixture and existing post-shipment correction demonstrate the main failure mode. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: .planning/STATE.md]
- Visual regression: HIGH - Playwright screenshot assertions and current desktop/mobile project config are verified. [CITED: Context7 /microsoft/playwright] [VERIFIED: playwright.config.ts]

**Research date:** 2026-05-18  
**Valid until:** 2026-06-01 for internal architecture; re-check npm/package versions before dependency edits. [ASSUMED]
