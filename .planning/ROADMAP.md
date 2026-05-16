# Roadmap: Coward's Game

**Created:** 2026-05-16  
**Granularity:** Standard  
**Execution:** Parallel where phase plans are independent  
**Project structure:** Vertical MVP  

## Overview

This roadmap builds Coward's Game simulation-first. Each phase leaves behind a working, verifiable project layer that moves toward the first complete loop: author a doctrine, submit an immutable Strategy Revision, run deterministic Matches/MatchSets, and understand the result through Chronicles.

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 1 | Foundation and Spec Contracts | Establish the monorepo, local workflow, canonical contracts, and versioning spine. | 11 | Complete |
| 2 | Pure Rules Engine | Implement the canonical deterministic game engine and rule test suite. | 23 | Complete |
| 3 | Chronicle and Replay Core | Make every Match reproducible, inspectable, and safe to project publicly. | 8 | Pending |
| 4 | Strategy Runtime Sandbox | Validate and execute JS/TS Strategy Revisions behind a replaceable worker-only boundary. | 11 | Pending |
| 5 | Match Orchestration and Persistence | Queue, execute, persist, and score Matches and MatchSets with correct failure semantics. | 13 | Pending |
| 6 | Strategy Workshop UX | Let users create, validate, revise, and test doctrines in a Workshop loop. | 6 | Pending |
| 7 | Replay Viewer and End-to-End Verification | Deliver the visible replay experience and full edit-to-replay verification path. | 8 | Pending |

**Coverage:** 80 v1 requirements mapped, 0 unmapped.

## Phases

### Phase 1: Foundation and Spec Contracts

**Goal:** Establish the monorepo, local workflow, canonical contracts, and versioning spine.
**Mode:** mvp
**Status:** Complete

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05, TEST-07

**Success Criteria:**
1. Developer can run install, dev, typecheck, lint, and test commands from the repo root.
2. Monorepo packages exist with enforced boundaries for spec, engine, runtime, replay, map configs, test utilities, web, and worker.
3. Canonical TypeScript types, constants, Zod schemas, and test fixtures are importable by downstream packages.
4. Version metadata fields exist for every artifact required for deterministic Match reproduction.

**Notes:**
- Use the source specs as the authority for names and constraints.
- Avoid broad shared utilities until a package boundary has a real consumer.

**Plans:**

| Plan | Wave | Depends On | Objective | Requirements |
|------|------|------------|-----------|--------------|
| 01-01 | 1 | None | Root workspace and local verification | FOUND-01, FOUND-03, TEST-07 |
| 01-02 | 2 | 01-01 | Package and app skeleton boundaries | FOUND-02, FOUND-04, FOUND-05 |
| 01-03 | 2 | 01-01, 01-02 | Canonical spec contracts and fixtures | FOUND-05, SPEC-01, SPEC-02, SPEC-03, SPEC-04, SPEC-05 |
| 01-04 | 3 | 01-01, 01-02, 01-03 | Full local dev topology and documentation | FOUND-02, TEST-07 |

**Wave dependency notes:**

**Wave 1** — Establish root workspace/tooling before package plans run.

**Wave 2 *(blocked on Wave 1 completion)*** — Create package/app boundaries and `packages/spec` contract layer.

**Wave 3 *(blocked on Waves 1-2 completion)*** — Wire full local dev topology and final documentation/verification.

**Cross-cutting constraints:**

- `packages/spec` is the root contract package and must not depend on internal workspace packages.
- `pnpm verify` is the local quality gate.
- Do not create hosted CI in Phase 1.
- Do not implement engine rules, strategy runtime execution, persistence schema, Chronicle behavior, or gameplay UI in Phase 1.

**Execution:** Completed in commit `2303a50`; summaries are recorded in `01-01-SUMMARY.md` through `01-04-SUMMARY.md`.

### Phase 2: Pure Rules Engine

**Goal:** Implement the canonical deterministic game engine and rule test suite.
**Mode:** mvp
**Status:** Complete

**Requirements:** ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, ENG-08, ENG-09, ENG-10, ENG-11, ENG-12, ENG-13, ENG-14, ENG-15, ENG-16, ENG-17, ENG-18, ENG-19, ENG-20, ENG-21, TEST-01, TEST-02

**Success Criteria:**
1. Engine can run a Match from deterministic inputs using a fake in-process StrategyRuntime.
2. Unit tests cover initialization, activation selection, MOVE, TURN, TURN_TO_STONE, reversal, collision, push, Backstab, Contraction, and end conditions.
3. Invariant/property tests cover occupancy uniqueness, bounds validity, status semantics, and deterministic ordering.
4. Engine package has no database, network, filesystem, clock, UI, or `Math.random` dependency.

**Notes:**
- Keep StrategyRuntime as an interface, not a JS runtime implementation.
- Chronicle hooks may be skeletal here but should not leak UI concerns into the engine.

**Plans:**

| Plan | Wave | Depends On | Objective | Requirements |
|------|------|------------|-----------|--------------|
| 02-01 | 1 | None | Spec amendment and engine foundation | ENG-01, ENG-15, ENG-21, TEST-01, TEST-02 |
| 02-02 | 2 | 02-01 | Round loop, runtime boundary, and activation selection | ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-16, ENG-21, TEST-01 |
| 02-03 | 3 | 02-01, 02-02 | Actions, movement, collision, push, and Backstab | ENG-07, ENG-08, ENG-09, ENG-10, ENG-11, ENG-12, ENG-13, ENG-14, ENG-15, ENG-16, ENG-21, TEST-01 |
| 02-04 | 4 | 02-01, 02-02, 02-03 | Contraction, match end, and invariant matrix | ENG-17, ENG-18, ENG-19, ENG-20, ENG-21, TEST-02 |
| 02-05 | 5 | 02-01, 02-02, 02-03, 02-04 | Full match runner, golden tests, and purity gate | ENG-01 through ENG-21, TEST-01, TEST-02 |

**Wave dependency notes:**

**Wave 1** — Update canonical Backstab rule text and establish state/types/selectors foundation.

**Wave 2 *(blocked on Wave 1 completion)*** — Build runtime input selectors, activation filtering, no-advance cleanup, and round progression shell.

**Wave 3 *(blocked on Waves 1-2 completion)*** — Implement movement, collision, push, and clarified Backstab behavior.

**Wave 4 *(blocked on Waves 1-3 completion)*** — Implement contraction, match-end checks, and invariant matrix coverage.

**Wave 5 *(blocked on Waves 1-4 completion)*** — Expose `runMatch`, add golden deterministic tests, purity gate, and documentation.

**Cross-cutting constraints:**

- Engine remains pure, synchronous, deterministic, and free of filesystem, network, database, clock, and `Math.random` access.
- `packages/engine` may import `@cowards/spec` but must not import `@cowards/test-utils`, `@cowards/runtime-js`, apps, or infrastructure packages.
- Backstab source-spec clarification must happen before Backstab implementation/tests.
- `GameState` remains canonical and minimal; derived lookups are selectors.
- Testing uses Vitest with unit, scenario, invariant-style matrix, and small golden full-match tests.

**Execution:** Completed in commit `7646578`; summaries are recorded in `02-01-SUMMARY.md` through `02-05-SUMMARY.md`.

### Phase 3: Chronicle and Replay Core

**Goal:** Make every Match reproducible, inspectable, and safe to project publicly.
**Mode:** mvp

**Requirements:** REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-04, REPLAY-05, REPLAY-06, REPLAY-07, TEST-03

**Success Criteria:**
1. Every engine-run Match emits a versioned Chronicle with required event types.
2. Replay utilities reconstruct board state and final outcome from Chronicle data.
3. Determinism tests prove identical inputs produce identical or semantically identical Chronicles.
4. Public and owner-only replay projections enforce privacy boundaries for source, memory, and objectives.

**Notes:**
- Treat Chronicle integrity as core infrastructure, not a viewer feature.
- Include Awareness Grid events early, even before the UI can display them richly.

### Phase 4: Strategy Runtime Sandbox

**Goal:** Validate and execute JS/TS Strategy Revisions behind a replaceable worker-only boundary.
**Mode:** mvp

**Requirements:** RUN-01, RUN-02, RUN-03, RUN-04, RUN-05, RUN-06, RUN-07, RUN-08, RUN-09, RUN-10, TEST-04

**Success Criteria:**
1. User-authored JS/TS strategy source can be validated and wrapped into an immutable Strategy Revision artifact.
2. Runtime evaluates `selectActivations` and `soldierBrain` through the canonical StrategyRuntime interface.
3. Runtime enforces schema, source, memory, objective, timeout, and forbidden capability constraints.
4. Runtime tests demonstrate invalid output, timeout, thrown exception, and forbidden access behavior.

**Notes:**
- Do not use Node `vm` as the security boundary.
- Prototype isolation is acceptable only if the boundary remains replaceable for stronger future isolation.

### Phase 5: Match Orchestration and Persistence

**Goal:** Queue, execute, persist, and score Matches and MatchSets with correct failure semantics.
**Mode:** mvp

**Requirements:** MATCH-01, MATCH-02, MATCH-03, MATCH-04, MATCH-05, MATCH-06, MATCH-07, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, TEST-05

**Success Criteria:**
1. Users or seed scripts can create Matches and MatchSets from immutable Strategy Revisions.
2. Worker claims jobs, executes simulations through runtime plus engine, persists outcomes, and stores Chronicle references.
3. System distinguishes strategy failures from system failures and applies retry/failed-match policy correctly.
4. Local PostgreSQL schema, migrations, and seed data support users, strategies, revisions, arenas, Matches, MatchSets, and Chronicles.

**Notes:**
- MatchSet scoring must be deterministic.
- Keep Chronicle blob storage abstract enough to move large artifacts out of PostgreSQL later.

### Phase 6: Strategy Workshop UX

**Goal:** Let users create, validate, revise, and test doctrines in a Workshop loop.
**Mode:** mvp

**Requirements:** UX-01, UX-02, UX-03, UX-04, UX-05, UX-06

**Success Criteria:**
1. User can create/edit a Strategy in Monaco using sample doctrine templates.
2. User can validate source and receive actionable errors.
3. User can submit immutable Strategy Revisions and browse revision history.
4. User can launch Workshop/local test Matches from selected revisions.

**Notes:**
- This is the first strongly user-facing authoring phase.
- Keep copy focused on the doctrine loop, not generic programming education.

### Phase 7: Replay Viewer and End-to-End Verification

**Goal:** Deliver the visible replay experience and full edit-to-replay verification path.
**Mode:** mvp

**Requirements:** VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, VIEW-07, TEST-06

**Success Criteria:**
1. User can open a completed Match and view a board replay with clear Soldier state, facing, TerrainStones, bounds, and Contraction.
2. User can scrub or step through timeline positions at Round, Activation, Cycle, and event granularity.
3. User can inspect Soldier details and Awareness Grids from recorded Cycles.
4. Playwright verifies the full edit -> submit revision -> create MatchSet -> execute -> replay flow.

**Notes:**
- Use PixiJS/canvas for scalable replay rendering.
- Prioritize legibility over spectacle: facing, ACTIVE/STONE/FALLEN, occupancy, and Contraction must be instantly readable.

## Requirement Mapping

| Requirement | Phase |
|-------------|-------|
| FOUND-01 | Phase 1 |
| FOUND-02 | Phase 1 |
| FOUND-03 | Phase 1 |
| FOUND-04 | Phase 1 |
| FOUND-05 | Phase 1 |
| SPEC-01 | Phase 1 |
| SPEC-02 | Phase 1 |
| SPEC-03 | Phase 1 |
| SPEC-04 | Phase 1 |
| SPEC-05 | Phase 1 |
| ENG-01 | Phase 2 |
| ENG-02 | Phase 2 |
| ENG-03 | Phase 2 |
| ENG-04 | Phase 2 |
| ENG-05 | Phase 2 |
| ENG-06 | Phase 2 |
| ENG-07 | Phase 2 |
| ENG-08 | Phase 2 |
| ENG-09 | Phase 2 |
| ENG-10 | Phase 2 |
| ENG-11 | Phase 2 |
| ENG-12 | Phase 2 |
| ENG-13 | Phase 2 |
| ENG-14 | Phase 2 |
| ENG-15 | Phase 2 |
| ENG-16 | Phase 2 |
| ENG-17 | Phase 2 |
| ENG-18 | Phase 2 |
| ENG-19 | Phase 2 |
| ENG-20 | Phase 2 |
| ENG-21 | Phase 2 |
| REPLAY-01 | Phase 3 |
| REPLAY-02 | Phase 3 |
| REPLAY-03 | Phase 3 |
| REPLAY-04 | Phase 3 |
| REPLAY-05 | Phase 3 |
| REPLAY-06 | Phase 3 |
| REPLAY-07 | Phase 3 |
| RUN-01 | Phase 4 |
| RUN-02 | Phase 4 |
| RUN-03 | Phase 4 |
| RUN-04 | Phase 4 |
| RUN-05 | Phase 4 |
| RUN-06 | Phase 4 |
| RUN-07 | Phase 4 |
| RUN-08 | Phase 4 |
| RUN-09 | Phase 4 |
| RUN-10 | Phase 4 |
| MATCH-01 | Phase 5 |
| MATCH-02 | Phase 5 |
| MATCH-03 | Phase 5 |
| MATCH-04 | Phase 5 |
| MATCH-05 | Phase 5 |
| MATCH-06 | Phase 5 |
| MATCH-07 | Phase 5 |
| DATA-01 | Phase 5 |
| DATA-02 | Phase 5 |
| DATA-03 | Phase 5 |
| DATA-04 | Phase 5 |
| DATA-05 | Phase 5 |
| UX-01 | Phase 6 |
| UX-02 | Phase 6 |
| UX-03 | Phase 6 |
| UX-04 | Phase 6 |
| UX-05 | Phase 6 |
| UX-06 | Phase 6 |
| VIEW-01 | Phase 7 |
| VIEW-02 | Phase 7 |
| VIEW-03 | Phase 7 |
| VIEW-04 | Phase 7 |
| VIEW-05 | Phase 7 |
| VIEW-06 | Phase 7 |
| VIEW-07 | Phase 7 |
| TEST-01 | Phase 2 |
| TEST-02 | Phase 2 |
| TEST-03 | Phase 3 |
| TEST-04 | Phase 4 |
| TEST-05 | Phase 5 |
| TEST-06 | Phase 7 |
| TEST-07 | Phase 1 |

---
*Roadmap created: 2026-05-16*
