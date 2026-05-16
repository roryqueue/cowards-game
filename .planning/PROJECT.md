# Coward's Game

## What This Is

Coward's Game is a deterministic two-player programmable strategy game for the web. Players author autonomous Strategy Revisions that control Soldiers on a shrinking board; once a Match begins, there is no human input and no live model inference.

The game centers on doctrine design rather than fast tactical clicking. Victory emerges from positional control, orientation, contraction pressure, stone terrain creation, pushing, backstabbing, and robust strategies that can survive seeded arena variation.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Implement the canonical Coward's Game v1 rules in a pure deterministic TypeScript engine.
- [ ] Support Strategy Revisions with activation selection, SoldierBrain execution, StrategyMemory, SoldierMemory, and objective payloads.
- [ ] Enforce 12-cycle Activations where TURN and MOVE share one budget and non-advancing Soldiers become STONE unless they FALL.
- [ ] Resolve movement, immediate reversal restrictions, collision orientation, side pushes, backstabs, Coward's Way Out, contraction, and match end conditions exactly as specified.
- [ ] Produce deterministic Chronicles that can reproduce, replay, inspect, and debug every Match.
- [ ] Keep user strategy code outside the web/API process behind a sandboxed runtime boundary.
- [ ] Provide a web experience for editing strategies, validating revisions, creating MatchSets, viewing match history, and replaying Chronicles.
- [ ] Provide local development with one-command startup, seed data, local database/queue dependencies, and local sandbox execution.
- [ ] Use a monorepo architecture with strict package boundaries between UI, worker, engine, runtime, shared contracts, replay, map configs, and test utilities.
- [ ] Build simulation-first before ranked ladders, cosmetics, tournaments, or monetization.

### Out of Scope

- Ranked ladders - valuable later, but v1 must prove the engine, runtime, and replay loop first.
- Public tournaments - depends on stable MatchSet orchestration, ranking, moderation, and operations.
- Randomized arena generation - v1 uses deterministic hand-authored Arena Variants.
- Custom user-created maps - increases validation and balance complexity before the core game is proven.
- Multiple strategy language runtimes - v1 should support one JavaScript/TypeScript runtime while keeping the engine runtime-agnostic.
- Live model inference during Match execution - violates deterministic autonomous play.
- Live editing during ranked Matches or Sets - Strategy Revisions must be locked before seeds, arenas, and initiative are revealed.
- Spectator tooling and public Chronicle sharing - useful future surface, not required for the initial loop.
- Visual debugger as a full advanced product - v1 needs Chronicle replay and inspection, but the rich debugger can evolve after core replay correctness.
- Monetization, cosmetics, and marketplace features - must not distract from competitive integrity and simulation correctness.
- Reinforcement-learning benchmark harnesses and model-vs-model ladders - future research-oriented extensions.

## Context

The source context for initialization comes from:

- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`

Gameplay summary:

- A Match repeats Phases of Round 1, Round 2, Round 3, Round 4, then Contraction.
- Round activation counts per player are 1, 2, 3, and 4.
- Round activations use an interleaved snake pattern with deterministic initiative from seed and alternating initiative each Round.
- Each Player starts with 8 Soldiers on a 12x12 board.
- Soldiers can be ACTIVE, STONE, or FALLEN.
- ACTIVE and STONE Soldiers occupy squares; FALLEN Soldiers do not.
- TerrainStones are neutral immovable obstacles.
- Each Activation permits up to 12 SoldierBrain Cycles.
- SoldierBrain sees only self, a 5x5 Awareness Grid, objective payload, SoldierMemory, and cycle metadata.
- Strategies see full board state at the start of each Round for activation selection.
- Movement attempts one-square Advances, with facing and lastSuccessfulMoveDirection updates only on successful Advances.
- Immediate reversal of lastSuccessfulMoveDirection is forbidden.
- Head-to-head collisions block movement.
- Side approaches attempt non-recursive pushes.
- Backstab occurs when an Advance places a Soldier into the behind-square of an enemy ACTIVE Soldier.
- Coward's Way Out lets a Soldier voluntarily TURN_TO_STONE.
- A Soldier that ends an Activation without Advancing becomes STONE, unless it became FALLEN.
- After Round 4, the board contracts inward by one square on all sides.
- Match victory is immediate when one player has zero ACTIVE Soldiers, with DRAW if both do.
- At 2x2 final resolution, the player with more ACTIVE Soldiers wins, otherwise DRAW.

Technical architecture summary:

- Language and implementation stack: TypeScript, Next.js, React, Node.js, PostgreSQL, Zod, Effect, Vitest, Playwright, pnpm, Turborepo, Canvas/PixiJS, Monaco, Docker Compose.
- Proposed monorepo shape:
  - `apps/web`
  - `apps/worker`
  - `packages/engine`
  - `packages/runtime-js`
  - `packages/shared`
  - `packages/replay`
  - `packages/map-configs`
  - `packages/test-utils`
- The engine is the canonical pure game engine and must not contain side effects, database access, network access, filesystem access, clock access, or `Math.random`.
- User strategy code never executes in the main web/API process.
- Match execution is asynchronous through a worker.
- Strategy Revisions are immutable executable snapshots once submitted for Match or MatchSet play.
- Chronicles are canonical replay artifacts and must support deterministic re-simulation, debugging, partial replay, versioning, compression, checkpoints, and integrity validation.
- Public Chronicles expose board states, positions, statuses, Activations, Actions, and outcomes by default, but not private strategy source, memory, or internal objectives unless explicitly published.

Product and UX principles:

- The game should feel like "I designed a doctrine," not "I clicked units quickly."
- The experience should emphasize strategy creation, simulation, Chronicles, replay analysis, doctrine identity, and emergent behavior.
- Chronicle-first UX is important because players need to understand intention, not merely observe movement.
- Low barrier to entry should come from starter doctrines, templates, AI-assisted editing, visual debugging, example Strategies, and Chronicle explanations.
- Strategic depth should come from simple local rules rather than many additional mechanics.

## Constraints

- **Determinism**: Same engine version, seed, Strategy Revisions, Arena Variant, and runtime versions must reproduce the same Chronicle.
- **Engine purity**: The engine must be pure, deterministic, serializable, versioned, side-effect free, and testable.
- **Runtime isolation**: Strategy code is hostile and cannot access network, filesystem, environment variables, secrets, database, process APIs, wall-clock time, nondeterministic randomness, `eval`, `Function`, dynamic imports, worker spawning, native modules, or package installation.
- **Strategy immutability**: Strategy Revisions must lock before seed reveal, Arena Variant reveal, and initiative reveal.
- **Memory limits**: StrategyMemory is JSON-serializable with a 32KB max; SoldierMemory is JSON-serializable with a 2KB max per Soldier; objective payload is JSON-serializable with a 1KB max.
- **Source size**: Strategy Revision source size max is 64KB.
- **Prototype timing**: Strategy evaluation target is 50ms, SoldierBrain Cycle target is 10ms, and full Activation target is 100ms.
- **Architecture**: Game rules must not live in React components or API request handlers.
- **Local development**: The app must run locally without cloud dependencies and should support `pnpm dev`.
- **Testing**: Engine behavior, replay determinism, runtime sandbox behavior, and core user flows require focused automated tests.
- **Competitive integrity**: Monetization, when considered later, must not sell gameplay advantages, stronger Soldiers, larger ranked memory, extra runtime privileges, or premium ranked mechanics.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build simulation-first | Deterministic engine, replay correctness, sandboxed execution, and Strategy API clarity are the hardest and most foundational parts. | - Pending |
| Use TypeScript monorepo | The architecture spec calls for TypeScript, pnpm, Turborepo, Next.js, worker app, and shared packages with strict boundaries. | - Pending |
| Keep engine pure and runtime-agnostic | Future runtimes may support JS/TS, Python, WASM, DSLs, or visual builders without changing engine behavior. | - Pending |
| Start with one JS/TS strategy runtime | Multi-language support is important architecturally but out of scope for v1 implementation. | - Pending |
| Make Chronicle the canonical replay artifact | Replay, debugging, deterministic verification, and player understanding all depend on trustworthy Chronicles. | - Pending |
| Use hand-authored Arena Variants in v1 | Prevents overfitting while avoiding randomized generation and custom map complexity before the core loop is stable. | - Pending |
| Prioritize Workshop-style iteration before ranked infrastructure | Players need strategy editing, validation, local/test Matches, and replay analysis before ladders or tournaments matter. | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after initialization*
