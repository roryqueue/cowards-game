# Research: Architecture

**Project:** Coward's Game  
**Date:** 2026-05-16  
**Milestone context:** Greenfield

## Recommended Architecture

```txt
Web UI / API
  -> persistence and MatchSet creation
  -> job queue
  -> worker runtime
  -> strategy runtime sandbox
  -> pure deterministic engine
  -> Chronicle/replay storage
  -> replay viewer
```

The architecture should optimize for deterministic simulation and replay correctness before product polish.

## Component Boundaries

### `packages/spec`

Owns canonical types, constants, Zod schemas, versioned contracts, and rules vocabulary.

Contains:

- Directions, positions, bounds
- Soldier, Player, Strategy, Match, Arena, Chronicle schemas
- Action and runtime input/output schemas
- Error/violation codes
- Version metadata

Does not contain:

- Engine transition implementation
- UI helpers
- Database queries

### `packages/engine`

Owns pure deterministic game rules.

Contains:

- Initial state creation
- Round/Phase progression
- Activation execution against a `StrategyRuntime` interface
- Movement/collision/push/backstab/contraction resolution
- Match end checks
- Event emission hooks for Chronicle
- Deterministic RNG abstraction

Does not contain:

- User code execution
- Database access
- Network/filesystem/clock access
- React/UI code

### `packages/replay`

Owns Chronicle schema, serialization, checkpoints, replay validation, and replay projection.

Contains:

- Event log types
- Checkpoint format
- Chronicle integrity checks
- Replay reconstruction
- Projection helpers for UI

### `packages/runtime-js`

Owns JS/TS Strategy Revision validation and execution.

Contains:

- Strategy API wrapper
- Source validation
- Compilation/transpilation if needed
- Sandbox orchestration
- Timeouts and output validation
- Runtime violation mapping

Must not leak host capabilities into user code.

### `packages/map-configs`

Owns hand-authored Arena Variants and validation.

### `apps/worker`

Owns queued Match execution.

Responsibilities:

- Claim Match jobs
- Load Strategy Revisions and Arena Variant
- Execute via runtime sandbox
- Run engine
- Persist outcome and Chronicle
- Retry system failures
- Record structured logs and metrics

### `apps/web`

Owns product surface.

Responsibilities:

- Auth/account shell
- Strategy editor
- Strategy Revision submission
- Match/MatchSet creation
- Match history
- Replay viewer
- API routes/server actions

Must not execute strategy code or own game rule logic.

## Data Flow

```txt
Player edits Strategy
  -> web validates source shape
  -> StrategyRevision is created immutably
  -> player creates MatchSet
  -> Match jobs enqueued
  -> worker loads revisions + map + seed
  -> runtime-js evaluates strategies through sandbox
  -> engine resolves deterministic state transitions
  -> replay package records Chronicle
  -> worker persists Match outcome + Chronicle reference
  -> web renders replay and timeline
```

## Persistence Model

Use PostgreSQL as canonical relational store.

Core tables/entities:

- User
- Strategy
- StrategyRevision
- ArenaVariant/MapConfig
- MatchSet
- Match
- Chronicle metadata
- Job/run metadata

Chronicle bodies can start in PostgreSQL for simplicity if sizes are manageable. Keep an abstraction so large Chronicle blobs can move to S3/R2/Supabase Storage later.

## Build Order

1. Package and workspace scaffold.
2. `packages/spec` contracts and fixtures.
3. `packages/engine` pure rules with exhaustive tests.
4. Chronicle event model and replay reconstruction.
5. Determinism harness: same inputs produce byte-identical or semantically identical Chronicle.
6. Minimal local strategy runtime with safe fake strategies for engine integration.
7. JS runtime sandbox prototype in worker-only context.
8. MatchSet orchestration and persistence.
9. Minimal replay viewer.
10. Strategy editor and revision flow.
11. Seed data and one-command local dev.
12. E2E tests for edit -> submit -> run -> replay.

This differs slightly from the architecture doc's product-facing order by pulling replay validation earlier, because Chronicles are the trust anchor for both debugging and user comprehension.

## Integration Risks

- The engine/runtime interface must be designed early enough to avoid coupling engine rules to JS-specific strategy execution.
- Chronicle event schema should be stable before UI builds too much on top of it.
- Persistence should store version metadata everywhere: engine, runtime, spec, Strategy Revision, Arena Variant, and Chronicle schema.
- Worker retry logic must distinguish strategy failures from system failures.
- Public replay views must not leak private strategy memory/objective/source.

## Sources

- Coward's Game canonical spec: `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- Coward's Game technical architecture spec: `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`
- Turborepo docs: https://turborepo.com/repo/docs
- Docker Compose docs: https://docs.docker.com/compose/
- PostgreSQL docs: https://www.postgresql.org/docs/
