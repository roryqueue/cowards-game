# Research: Features

**Project:** Coward's Game  
**Date:** 2026-05-16  
**Milestone context:** Greenfield

## Domain Context

Coward's Game belongs to the programmable strategy game family: players write autonomous programs, submit them to a deterministic environment, and learn by inspecting outcomes. Screeps emphasizes real JavaScript and autonomous unit behavior; CodinGame emphasizes bot programming, leaderboards, visualized simulations, and developer skill growth; Battlecode-style competitions emphasize clear rules, local runs, starter bots, and reproducible matches.

Coward's Game differentiates itself with doctrine design, contraction pressure, orientation, stone terrain, pushing, backstabbing, immutable Strategy Revisions, and Chronicle-first replay analysis.

## Table Stakes for v1

### Simulation Core

- Canonical rules implementation for board setup, Phases, Rounds, Activations, Cycles, movement, collision, push, backstab, stoning, falling, contraction, and match end.
- Deterministic Match execution from seed, Strategy Revisions, Arena Variant, engine version, and runtime version.
- Hand-authored Arena Variants with validation against starting positions.
- Match outcome and deterministic scoring primitives.

### Strategy Authoring

- Strategy source editor with Monaco.
- Starter doctrine templates.
- Strategy validation before submission.
- Immutable Strategy Revisions.
- Local/test Match execution before competitive submission.
- Clear Strategy API docs surfaced in the app.

### Runtime and Safety

- Sandboxed JS/TS runtime for v1.
- Runtime output validation.
- Timeouts and violation handling.
- Runtime violations logged into Chronicle.
- Strategy source and private memory hidden from public replay by default.

### Replay and Debugging

- Chronicle generation for every Match.
- Replay viewer with board state, Soldier status, facing, movement, pushes, backstabs, stones, falls, contraction, and final outcome.
- Event timeline.
- Step-through replay.
- Awareness Grid inspection at each Cycle.
- Owner-only inspection hooks for memory/objective data.

### Product Loop

- Create/edit Strategy.
- Submit immutable revision.
- Create a Match or MatchSet.
- Queue and run simulation.
- View result.
- Replay and inspect Chronicle.
- Iterate in Workshop Mode.

### Local Development

- One-command startup.
- Seed users, strategies, maps, MatchSets, and Chronicles.
- Local database and queue.
- Local sandbox mode with no cloud dependencies.
- Determinism test fixtures.

## Differentiators

- "I designed a doctrine" UX around strategy identity and post-match understanding.
- Chronicle-first product surface rather than treating replay as an afterthought.
- Awareness Grid inspection that explains what each SoldierBrain could see.
- Comparative simulation views between Strategy Revisions.
- Objective visualization to connect high-level Strategy choices with local Soldier behavior.
- Doctrine templates that teach strategy patterns without reducing rule depth.
- AI-assisted authoring later, while preserving deterministic execution.

## Anti-Features

- Live control during Matches.
- Live model inference during Matches.
- Rich cosmetics before board readability is proven.
- Monetized ranked advantages.
- Full tournament infrastructure before deterministic MatchSets are reliable.
- Many added mechanics to create depth; the spec explicitly wants depth from simple local rules.
- Custom maps in v1.
- Randomized terrain generation in v1.
- Strategy marketplace in v1.

## Complexity Notes

| Feature area | Complexity | Dependency |
|--------------|------------|------------|
| Engine rules | High | Must precede replay, runtime, worker, UI |
| Chronicle | High | Needs stable event schema and engine instrumentation |
| Runtime sandbox | High | Needs Strategy API and output schemas |
| Replay viewer | Medium-high | Needs Chronicle format and renderer foundation |
| Monaco editor | Medium | Needs Strategy API, validation endpoint, templates |
| Match queue | Medium | Needs runtime and persistence |
| Auth/accounts | Medium | Needed for online ownership, not for earliest simulation prototype |
| Ranked ladder | High | Defer until MatchSet correctness and abuse surfaces are understood |

## v1 Feature Recommendation

Scope v1 around Workshop Mode and deterministic MatchSets, not public ranked ladders. The first release should prove that a player can write a doctrine, run it against another doctrine across known arenas/seeds, and understand why it won or lost through Chronicles.

## Sources

- Coward's Game canonical spec: `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- Coward's Game technical architecture spec: `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`
- Screeps official site: https://screeps.com/
- Screeps store: https://store.screeps.com/
- CodinGame multiplayer/bot programming: https://www.codingame.com/multiplayer
- Battlecode-style docs example: https://docs.battlecode.cam/
