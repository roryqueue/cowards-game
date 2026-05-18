# Phase 2: Pure Rules Engine - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase implements the canonical deterministic Coward's Game rules in `packages/engine` and the focused rule/invariant test suite around them. It should produce a pure TypeScript engine that can initialize a Match, run the Round 1-4 plus Contraction loop, call a fake in-process StrategyRuntime, resolve activation selection, SoldierBrain cycles, movement, collision, pushing, Backstab, stoning, falling, contraction, and match end conditions.

This phase does not implement the real JavaScript/TypeScript sandbox, persistence, worker orchestration, full Chronicle/replay utilities, gameplay UI, or hosted CI. Chronicle hooks may be skeletal transition summaries only.

</domain>

<decisions>
## Implementation Decisions

### Engine State Shape

- **D-01:** Use a single immutable `GameState` aggregate as the canonical engine state.
- **D-02:** Recompute derived lookup data through pure selectors/helpers instead of persisting occupancy maps, active counts, behind-square indexes, or awareness grids on `GameState`.
- **D-03:** Use plain immutable returns with normal TypeScript objects and arrays. Do not introduce Immer or a similar dependency in the core engine.
- **D-04:** `GameState` must not contain a Chronicle-style event log. Transitions may return lightweight event summaries separately for tests and future Chronicle integration.
- **D-05:** Represent player identity as explicit `PlayerId` values plus side/starting-role metadata such as `bottom` and `top`; do not hardcode player identity to side.
- **D-06:** Keep FALLEN Soldiers in the Soldier roster with `status: "FALLEN"` and no occupied square.
- **D-07:** Use boundary validation only: validate initial inputs and fake runtime outputs at engine entry points, while internal pure helpers assume valid typed data.
- **D-08:** Store `SoldierMemory` and `StrategyMemory` inside `GameState` during Phase 2 so simulation state captures memory evolution from fake runtime outputs.

### StrategyRuntime Boundary

- **D-09:** Define a minimal engine-facing runtime interface with `selectActivations(input)` and `runSoldierBrain(input)`.
- **D-10:** Runtime methods return typed success or `RuntimeViolation` results. Do not use thrown exceptions as the primary failure channel.
- **D-11:** Represent timing, thrown exception, forbidden capability, timeout, invalid output, and related runtime constraints only as fake runtime violations in Phase 2. The engine must not measure time or enforce sandbox/security behavior.
- **D-12:** Activation selection filters valid orders and forfeits invalid or missing slots. Duplicate, STONE, FALLEN, malformed, and excess selections are skipped or ignored according to the canonical spec.
- **D-13:** A runtime violation during a Soldier activation interrupts the activation, then applies the normal no-advance stoning rule unless the Soldier fell.
- **D-14:** Expose pure input builders/selectors for `StrategyInput` and `SoldierBrainInput` so tests can verify exactly what fake runtime receives.
- **D-15:** Fake runtime builders belong in `packages/test-utils` or engine test files, not in the main `@cowards/engine` export surface.
- **D-16:** Phase 2 runtime calls are synchronous only. Async worker orchestration is later phase scope.
- **D-17:** Expose both step-level APIs and a full `runMatch` API. Tests should be able to target initialization, round/activation/move/contraction transitions and full deterministic simulations.

### Rule Resolution Granularity

- **D-18:** Implement state initialization and activation loop first, then layer movement, collision, push, Backstab, contraction, and end-condition rules onto that loop.
- **D-19:** Decompose movement as an ordered decision pipeline: validate reversal/off-board/occupancy, classify destination, apply collision/push/advance, then apply ordered cleanup and Backstab checks.
- **D-20:** Illegal immediate reversal interrupts the activation and triggers no-advance stoning if the Soldier has not Advanced.
- **D-21:** If a Soldier successfully Advances at least once during an activation, later interruption in that same activation does not trigger no-advance stoning.
- **D-22:** Use a single terminal/interruption reason per activation. Once a terminal condition occurs, activation ends; mandatory cleanup such as no-advance stoning and match-end checks still runs afterward.
- **D-23:** Contraction is a dedicated pure phase transition with direct tests. It shrinks bounds, makes out-of-bounds ACTIVE/STONE Soldiers FALLEN, removes out-of-bounds TerrainStones, then checks match end and final 2x2 resolution.
- **D-24:** Apply match-ending checks after every activation and after contraction/final 2x2 resolution.

### Backstab Rule Clarification

- **D-25:** Backstab is position-triggered, not only voluntary-advance-triggered.
- **D-26:** If any ACTIVE Soldier begins or ends any Soldier's activation directly behind an enemy ACTIVE Soldier, that enemy is Backstabbed, regardless of how the Soldier got there.
- **D-27:** Activation-start Backstab resolves before any SoldierBrain cycle, then match-end conditions are checked immediately.
- **D-28:** Activation-boundary Backstab checks apply to all ACTIVE Soldiers on the board, not only the selected active Soldier.
- **D-29:** Multiple Backstabs at the same activation boundary resolve from a simultaneous snapshot, then all victims become STONE together.
- **D-30:** Mutual Backstab cases stone both Soldiers if both relationships are true in the simultaneous snapshot.
- **D-31:** Pushed Soldiers can trigger Backstab when the push causes them to end directly behind an enemy ACTIVE Soldier.
- **D-32:** Pushed Soldiers do not update `lastSuccessfulMoveDirection`.
- **D-33:** Normal post-advance Backstab checks still apply after successful Advances. The broader activation-boundary rule supersedes the narrower pre-advance escape guard.
- **D-34:** Phase 2 execution must update the canonical gameplay spec to reflect this Backstab clarification before implementing tests against it.

### Test Confidence Model

- **D-35:** Use a layered test mix: unit tests for helpers/transitions, scenario tests for canonical rules, invariant-style deterministic fixture matrices, and a small number of golden full-match tests.
- **D-36:** Start invariant/property coverage with deterministic fixture matrices. Do not introduce a property-based testing library in Phase 2 unless planning uncovers a clear need.
- **D-37:** Golden full-match tests should prove determinism and completion for same seed plus same fake strategies. Avoid brittle full-state snapshot tests as the main golden path.
- **D-38:** Add a dedicated Backstab boundary suite covering activation-start, activation-end, pushed Soldier Backstabs, all-soldiers boundary checks, simultaneous Backstabs, mutual Backstabs, and immediate match-end after Backstab.
- **D-39:** Keep canonical contract fixtures in `packages/spec`; add richer engine scenario builders in `packages/test-utils` as needed.

### the agent's Discretion

No areas were delegated to the agent without a user choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning

- `.planning/PROJECT.md` — Core value, active scope, determinism/purity constraints, and gameplay summary.
- `.planning/REQUIREMENTS.md` — Phase 2 requirements ENG-01 through ENG-21, TEST-01, and TEST-02.
- `.planning/ROADMAP.md` — Phase 2 boundary, success criteria, and notes.
- `.planning/STATE.md` — Current project status and workflow settings.
- `.planning/config.json` — GSD mode, granularity, parallel execution, and workflow preferences.
- `.planning/phases/01-foundation-and-spec-contracts/01-CONTEXT.md` — Locked Phase 1 package-boundary, spec-contract, fixture, and versioning decisions.

### Phase 1 Implementation Summaries

- `.planning/phases/01-foundation-and-spec-contracts/01-01-SUMMARY.md` — Root workspace and verification setup.
- `.planning/phases/01-foundation-and-spec-contracts/01-02-SUMMARY.md` — Package/app skeleton and boundaries.
- `.planning/phases/01-foundation-and-spec-contracts/01-03-SUMMARY.md` — Canonical spec contracts and fixtures.
- `.planning/phases/01-foundation-and-spec-contracts/01-04-SUMMARY.md` — Local dev topology and documentation.

### Source Specs

- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay rules. Must be updated in Phase 2 execution to include the Backstab position-trigger clarification before implementing tests.
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md` — Engine purity, determinism, runtime separation, RNG, state immutability, and testing requirements.

### Source Code

- `packages/spec/src/types.ts` — Canonical TypeScript contracts for Soldiers, actions, runtime inputs/outputs, events, versions, Match, and MatchSet.
- `packages/spec/src/constants.ts` — Canonical board bounds, activation counts, memory/source limits, and starting positions.
- `packages/spec/src/schemas.ts` — Zod schemas for runtime-facing validation boundaries.
- `packages/spec/src/fixtures/valid.ts` — Existing legal fixtures and named movement/collision/contraction scenarios.
- `packages/spec/src/fixtures/invalid.ts` — Existing invalid fixtures for negative validation tests.
- `packages/engine/src/index.ts` — Current skeletal engine package entrypoint.
- `packages/test-utils/src/index.ts` — Current skeletal test utility package entrypoint.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `@cowards/spec` exports canonical types, constants, schemas, versions, and fixtures that Phase 2 should use rather than redefining contracts in `packages/engine`.
- `packages/spec/src/fixtures/valid.ts` already includes named scenarios for blocked movement, side push, Backstab, off-board fall, contraction, and no-advance stoning.
- `packages/test-utils` exists as an empty package and is the preferred home for richer engine scenario builders and fake runtime helpers that should not ship from `@cowards/engine`.

### Established Patterns

- Workspace uses pnpm, Turborepo, TypeScript project references, ESLint boundary rules, Vitest, and Prettier.
- `packages/spec` must not depend on internal workspace packages; `packages/engine` can depend on `@cowards/spec`.
- Local verification is `pnpm verify`.
- Current package scripts use `vitest run --passWithNoTests`; Phase 2 should replace the engine's no-test placeholder with real tests.

### Integration Points

- `packages/engine` should become the pure rules implementation and should import from `@cowards/spec`.
- `packages/test-utils` can depend on `@cowards/spec` and `@cowards/engine` if needed for fake runtime builders and scenario setup.
- Future Phase 3 replay work should consume lightweight transition summaries or step APIs without forcing a Chronicle log into `GameState`.

</code_context>

<specifics>
## Specific Ideas

- The Backstab rule must be clarified from "after each successful Advance" to a broader activation-boundary rule: any ACTIVE Soldier directly behind an enemy ACTIVE Soldier at the beginning or end of any Soldier activation Backstabs that enemy.
- Backstab resolution at a boundary should use a simultaneous snapshot so ordering artifacts do not change outcomes.
- Pushed Soldiers can trigger Backstab by ending behind an enemy, but pushes do not update reversal history.
- Tests should give special attention to this clarified Backstab behavior because it closes an abuse case where a Soldier could otherwise move away from an exposed behind-square before the Backstab resolves.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope. The Backstab clarification is treated as a canonical rule correction required before implementation, not a new feature.

</deferred>

---

*Phase: 2-Pure Rules Engine*
*Context gathered: 2026-05-16*
