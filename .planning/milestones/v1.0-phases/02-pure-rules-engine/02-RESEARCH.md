---
phase: 2
slug: pure-rules-engine
status: complete
created: 2026-05-16
---

# Phase 2 Research: Pure Rules Engine

## Research Complete

Phase 2 should build the deterministic rules engine as a pure TypeScript package that depends on `@cowards/spec`, with `@cowards/test-utils` holding fake runtime and richer scenario helpers. The existing contracts in `packages/spec` are strong enough to anchor the engine, but Phase 2 must add engine-specific state, transition results, runtime interface types, selectors, and tests.

## Key Findings

### Engine Package Shape

- `packages/engine` currently exports only `enginePackage`; it can be replaced with a focused API surface.
- The engine should expose both step-level functions and `runMatch`:
  - `createInitialGameState`
  - `createStrategyInput`
  - `createSoldierBrainInput`
  - `resolveActivationSelection`
  - `resolveActivation`
  - `resolveAction`
  - `resolveContraction`
  - `checkMatchEnd`
  - `runMatch`
- Keep helpers pure and synchronous. Do not import DB, network, filesystem, clock, worker, React, or runtime-js code.
- Boundary validation can reuse `@cowards/spec` Zod schemas for arena variants, runtime inputs, strategy results, SoldierBrain results, and actions.

### State Model

Use a single canonical `GameState` aggregate with minimal persisted state:

- match identity, seed, versions, arena variant id
- players with explicit `PlayerId` plus side role (`bottom` / `top`)
- current phase/round metadata and initiative state
- current bounds and terrain stones
- Soldier roster including ACTIVE, STONE, and FALLEN Soldiers
- per-player StrategyMemory
- outcome when complete

Do not persist occupancy maps, active counts, behind-square indexes, or awareness grids. Build them through selectors so transitions avoid stale derived data.

### Runtime Boundary

Define the engine-facing runtime interface in `packages/engine`, but keep fake implementations out of the main export surface:

```ts
interface StrategyRuntime {
  selectActivations(input: StrategyInput): RuntimeResult<StrategyResult>
  runSoldierBrain(input: SoldierBrainInput): RuntimeResult<SoldierBrainResult>
}
```

`RuntimeResult<T>` should be an explicit success/violation discriminated union. Timing, thrown exception, timeout, forbidden capability, and invalid output are represented as `RuntimeViolation` results in Phase 2; enforcement belongs to Phase 4.

### Rule Ordering

Plan the rules in this order:

1. Initial state and deterministic round/activation loop.
2. Runtime input builders and activation order filtering.
3. TURN, TURN_TO_STONE, MOVE, reversal, off-board fall, blocked movement, head-to-head collision, side push, and no-advance stoning.
4. Backstab boundary clarification and movement-triggered Backstab checks.
5. Contraction, final 2x2 resolution, and match end checks.
6. Full `runMatch` determinism and invariants.

This order keeps the first executable loop small, then layers complex movement semantics.

### Backstab Clarification

The user clarified the canonical Backstab rule during Phase 2 discussion. Phase 2 execution must update `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` before implementing Backstab tests.

Planner/executor should treat the clarified rule as authoritative:

- Backstab is position-triggered, not only voluntary-advance-triggered.
- At the beginning and end of every Soldier activation, check all ACTIVE Soldiers on the board.
- If any ACTIVE Soldier is directly behind an enemy ACTIVE Soldier, that enemy becomes STONE.
- Resolve all Backstabs at a boundary from a simultaneous snapshot.
- Mutual Backstabs stone both Soldiers.
- Pushed Soldiers can cause Backstab by ending behind an enemy.
- Pushes do not update `lastSuccessfulMoveDirection`.
- After Backstab boundary resolution, immediately check match-end conditions.

### Testing Strategy

Use a layered test suite:

- Unit tests for pure selectors and transition helpers.
- Scenario tests for every canonical rule cluster.
- Deterministic fixture matrix tests for invariants: occupancy uniqueness, bounds validity, status semantics, deterministic ordering.
- Golden full-match tests that prove same seed plus same fake strategies produce identical final outcomes/event summaries.

Avoid full `GameState` snapshots as the primary golden assertion; they are brittle. Assert targeted state facts, outcomes, event summary types, and deterministic equality across repeated runs.

### Purity Enforcement

Engine purity should be enforced by:

- ESLint no-restricted-import rules already preventing engine from importing app/runtime packages.
- Tests/grep checks that `packages/engine/src` does not contain `Math.random`, `Date.now`, `new Date`, `fetch`, `fs`, `node:fs`, `process.env`, or database/Redis imports.
- API design: all randomness comes from deterministic seed helpers, not system entropy.
- No async runtime calls in Phase 2.

## Recommended File Layout

Create small engine modules rather than one large `index.ts`:

- `packages/engine/src/types.ts` — `GameState`, player side, transition result, runtime interface, event summary, terminal/interruption reasons.
- `packages/engine/src/state.ts` — initial state creation and boundary validation.
- `packages/engine/src/selectors.ts` — occupancy, active counts, snapshots, behind-square, awareness grid, winner checks.
- `packages/engine/src/runtime-inputs.ts` — `StrategyInput` and `SoldierBrainInput` builders.
- `packages/engine/src/activation.ts` — activation filtering, activation loop, no-advance cleanup, runtime violation handling.
- `packages/engine/src/movement.ts` — action/movement pipeline, collision, push, Backstab hooks.
- `packages/engine/src/backstab.ts` — boundary Backstab detection and simultaneous resolution.
- `packages/engine/src/contraction.ts` — contraction and final 2x2 resolution.
- `packages/engine/src/match.ts` — round sequencing, initiative, `runMatch`.
- `packages/engine/src/index.ts` — public exports only.
- `packages/engine/src/*.test.ts` — focused Vitest suites near implementation.
- `packages/test-utils/src/fake-runtime.ts` — deterministic fake runtime helpers.
- `packages/test-utils/src/engine-scenarios.ts` — richer scenario builders.

## Validation Architecture

### Automated Commands

- Quick engine test command: `pnpm --filter @cowards/engine test`
- Quick test-utils test command when relevant: `pnpm --filter @cowards/test-utils test`
- Full local gate: `pnpm verify`
- Purity grep: `! rg "Math\\.random|Date\\.now|new Date\\(|fetch\\(|from ['\\\"]fs|from ['\\\"]node:fs|process\\.env|postgres|redis" packages/engine/src --glob '!*.test.ts' --glob '!test/**'`

### Required Test Suites

- `packages/engine/src/state.test.ts`
  - ENG-01, ENG-21
  - initial 12x12 state, 8 Soldiers per player, side roles, FALLEN roster semantics, boundary validation.
- `packages/engine/src/activation.test.ts`
  - ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-16
  - round activation counts, snake order, alternating initiative, filtering invalid selections, runtime violation behavior, no-advance stoning.
- `packages/engine/src/movement.test.ts`
  - ENG-07 through ENG-14, ENG-16
  - TURN, TURN_TO_STONE, MOVE, immediate reversal, off-board fall, TerrainStone/STONE blocking, head-to-head collision, side push.
- `packages/engine/src/backstab.test.ts`
  - ENG-15 plus Phase 2 clarified rule
  - activation-start, activation-end, all-soldiers boundary, pushed Soldier, simultaneous, mutual, match-end after Backstab.
- `packages/engine/src/contraction.test.ts`
  - ENG-17, ENG-18, ENG-19, ENG-20
  - bounds shrink, out-of-bounds falls, TerrainStone removal, immediate win/draw, final 2x2.
- `packages/engine/src/invariants.test.ts`
  - TEST-02
  - deterministic fixture matrix for occupancy uniqueness, bounds validity, status semantics, ordering.
- `packages/engine/src/match.test.ts`
  - ENG-02 through ENG-21, TEST-01, TEST-02
  - full `runMatch`, deterministic repeated runs, no side effects/purity grep.

### Validation Risks

- Backstab semantics changed from the original spec text. The original spec must be updated before implementation or tests will appear to contradict the source.
- Engine test-utils may create circular dependencies if `@cowards/engine` imports `@cowards/test-utils`. Direction must stay: test-utils may import engine; engine must not import test-utils.
- `StrategyMemory` and `SoldierMemory` live in `GameState`; tests must assert memory updates without exposing private memory through future public replay surfaces.
- Synchronous fake runtime is correct for Phase 2; do not accidentally introduce async orchestration.

## Plan Implications

- Start with a spec-amendment task because Backstab is a source-of-truth correction.
- Use one foundation plan for engine state/API/test utility scaffolding.
- Use one activation-loop plan before movement rules.
- Use one movement/Backstab plan with a dedicated Backstab suite.
- Use one contraction/end/invariant/full-match plan to close remaining rules and run the full verification gate.
