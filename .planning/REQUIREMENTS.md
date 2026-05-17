# Requirements: Coward's Game

**Defined:** 2026-05-16  
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Developer can install dependencies and run the monorepo with pnpm.
- [x] **FOUND-02**: Developer can run a single command that starts the web app, worker, database, queue dependency, and local sandbox dependencies.
- [x] **FOUND-03**: Developer can run unit, integration, and E2E test commands from the repo root.
- [x] **FOUND-04**: The repository enforces package boundaries so UI, worker, engine, runtime, replay, map configs, and shared contracts remain separate.
- [x] **FOUND-05**: The project records engine, runtime, spec, Chronicle, Strategy Revision, and Arena Variant versions wherever Match reproducibility depends on them.

### Spec Contracts

- [x] **SPEC-01**: Developer can import canonical TypeScript types for Player, Strategy, StrategyRevision, Soldier, Match, MatchSet, ArenaVariant, Chronicle, and runtime inputs/outputs.
- [x] **SPEC-02**: Developer can validate all runtime inputs and outputs with Zod schemas.
- [x] **SPEC-03**: Developer can rely on canonical constants for 12x12 initial board bounds, initial Soldier positions, Round activation counts, 12-cycle Activation budget, memory limits, and source size limits.
- [x] **SPEC-04**: Developer can use canonical discriminated unions for Soldier statuses, Directions, Actions, AwarenessCell contents, event types, and runtime violation types.
- [x] **SPEC-05**: Developer can generate valid test fixtures for starting boards, Soldiers, Arena Variants, seeds, Strategies, and Match inputs.

### Engine Rules

- [x] **ENG-01**: Developer can create the canonical initial 12x12 Match state with 8 Soldiers per Player at the specified starting positions and facings.
- [x] **ENG-02**: Engine advances Matches through repeating Phases of Round 1, Round 2, Round 3, Round 4, then Contraction.
- [x] **ENG-03**: Engine applies the correct per-player activation counts of 1, 2, 3, and 4 for Rounds 1 through 4.
- [x] **ENG-04**: Engine applies the interleaved snake activation pattern and alternates initiative every Round after deterministic seed-based initial initiative.
- [x] **ENG-05**: Engine rejects duplicate, excess, malformed, STONE, or FALLEN Soldier activation selections according to the canonical rules.
- [x] **ENG-06**: Engine invokes SoldierBrain for up to 12 Cycles per Activation and provides only the Soldier snapshot, 5x5 Awareness Grid, cycle metadata, objective payload, and SoldierMemory.
- [x] **ENG-07**: Engine resolves TURN actions by updating facing, consuming one Cycle, and not counting as an Advance.
- [x] **ENG-08**: Engine resolves TURN_TO_STONE as Coward's Way Out by immediately changing the Soldier to STONE and ending the Activation.
- [x] **ENG-09**: Engine resolves successful MOVE actions by Advancing one square, updating facing, and updating lastSuccessfulMoveDirection.
- [x] **ENG-10**: Engine enforces the immediate reversal rule based on lastSuccessfulMoveDirection.
- [x] **ENG-11**: Engine resolves off-board movement by making the moving Soldier FALLEN with reason MOVED_OFF_BOARD.
- [x] **ENG-12**: Engine blocks movement into TerrainStones or Stone Soldiers and interrupts the Activation.
- [x] **ENG-13**: Engine resolves head-to-head collisions as blocked movement without push or Backstab.
- [x] **ENG-14**: Engine resolves side pushes for friendly or enemy ACTIVE Soldiers, including blocked pushes and pushes off-board.
- [x] **ENG-15**: Engine resolves Backstabs after each successful Advance and supports one Advance Backstabbing multiple enemy ACTIVE Soldiers.
- [x] **ENG-16**: Engine turns any Soldier that ends an Activation without Advancing into STONE unless that Soldier became FALLEN.
- [x] **ENG-17**: Engine contracts board bounds inward by one square after Round 4 and makes out-of-bounds ACTIVE or STONE Soldiers FALLEN.
- [x] **ENG-18**: Engine removes TerrainStones outside bounds after Contraction.
- [x] **ENG-19**: Engine ends Matches immediately when one Player has zero ACTIVE Soldiers, with DRAW if both Players have zero ACTIVE Soldiers.
- [x] **ENG-20**: Engine applies final 2x2 resolution by comparing ACTIVE Soldier counts and producing a win or DRAW.
- [x] **ENG-21**: Engine remains pure and never accesses database, network, filesystem, wall-clock time, or `Math.random`.

### Determinism and Replay

- [x] **REPLAY-01**: Developer can run a deterministic replay test proving same seed, Strategy Revisions, Arena Variant, engine version, and runtime version produce the same Chronicle.
- [x] **REPLAY-02**: Every Match produces a Chronicle containing Match start, Round start, Strategy evaluation, Activation start, Awareness Grid observation, Action emitted, movement, push, Backstab, stoning, fall, contraction, runtime violation, and Match end events.
- [x] **REPLAY-03**: Chronicle records enough information to reconstruct board states and final Match outcome without re-executing strategy source code.
- [x] **REPLAY-04**: Chronicle supports checkpoints for partial replay and debugging.
- [x] **REPLAY-05**: Replay utilities can validate Chronicle integrity and fail clearly on corrupted or version-incompatible replay data.
- [x] **REPLAY-06**: Public replay projection excludes Strategy source code, StrategyMemory, SoldierMemory, and objective payloads by default.
- [x] **REPLAY-07**: Owner-only replay projection can expose private debug data for the owning Player when available.

### Strategy Runtime

- [x] **RUN-01**: User can validate a JavaScript or TypeScript Strategy Revision before submitting it.
- [x] **RUN-02**: User can submit an immutable Strategy Revision that stores source, runtime version, engine compatibility, validation result, and metadata.
- [x] **RUN-03**: Runtime can evaluate `selectActivations` against full-board StrategyInput and return activation orders plus StrategyMemory.
- [x] **RUN-04**: Runtime can evaluate `soldierBrain` against SoldierBrainInput and return exactly one Action plus SoldierMemory.
- [x] **RUN-05**: Runtime enforces source size, StrategyMemory size, SoldierMemory size, objective payload size, and output schema limits.
- [x] **RUN-06**: Runtime handles invalid output as an interrupted Activation and logs a Chronicle violation.
- [x] **RUN-07**: Runtime handles timeout or thrown exception as a no-op/invalid evaluation according to the strategy failure policy.
- [x] **RUN-08**: Runtime prevents strategy code from accessing network, filesystem, environment variables, secrets, database, process APIs, wall-clock time, nondeterministic randomness, `eval`, `Function`, dynamic imports, worker spawning, native modules, or package installation.
- [x] **RUN-09**: Runtime executes only in worker/local sandbox contexts and never in the main web/API process.
- [x] **RUN-10**: Runtime boundary is replaceable so future non-JS runtimes can implement the same StrategyRuntime interface.

### Match Orchestration

- [ ] **MATCH-01**: User can create a Match between two Strategy Revisions with a selected Arena Variant and deterministic seed.
- [ ] **MATCH-02**: User can create a MatchSet between two Strategy Revisions across configured hand-authored Arena Variants and side assignments.
- [ ] **MATCH-03**: System locks Strategy Revisions before seed, Arena Variant, and initiative reveal.
- [ ] **MATCH-04**: Worker can claim queued Match jobs, execute simulations, persist outcomes, and attach Chronicle references.
- [ ] **MATCH-05**: Worker retries transient system failures up to a fixed limit and marks exhausted system failures as Match failed rather than strategy loss.
- [ ] **MATCH-06**: MatchSet scoring orders results by Match wins, cumulative surviving Soldiers, then cumulative survival time with deterministic tie-breakers.
- [ ] **MATCH-07**: User can see Match and MatchSet status: pending, running, complete, failed, or blocked.

### Persistence

- [ ] **DATA-01**: System persists Users, Strategies, StrategyRevisions, ArenaVariants, Matches, MatchSets, Chronicle metadata, and job/run metadata in PostgreSQL.
- [ ] **DATA-02**: System preserves immutable StrategyRevision records after they are used in any Match or MatchSet.
- [ ] **DATA-03**: System stores or references Chronicle artifacts so they can be replayed after Match completion.
- [ ] **DATA-04**: System can seed local users, sample Strategies, Arena Variants, MatchSets, Matches, and Chronicles for development.
- [ ] **DATA-05**: System can migrate database schema repeatably in local and deployed environments.

### Strategy Authoring UX

- [x] **UX-01**: User can create and edit a Strategy in a Monaco-based editor.
- [x] **UX-02**: User can start from sample doctrine templates.
- [x] **UX-03**: User can validate Strategy source and see actionable validation/runtime errors.
- [x] **UX-04**: User can submit a Strategy Revision from the editor.
- [x] **UX-05**: User can run a local or Workshop test Match before competitive use.
- [x] **UX-06**: User can view Strategy Revision history and select revisions for Matches.

### Replay UX

- [x] **VIEW-01**: User can open a completed Match and watch a board replay.
- [x] **VIEW-02**: User can scrub or step through Round, Activation, Cycle, and event timeline positions.
- [x] **VIEW-03**: User can inspect Soldier status, position, facing, and owner during replay.
- [x] **VIEW-04**: User can inspect the active Soldier's Awareness Grid for recorded Cycles.
- [x] **VIEW-05**: Replay visually distinguishes ACTIVE, STONE, FALLEN, TerrainStone, board bounds, and Contraction.
- [x] **VIEW-06**: Replay emphasizes pushes, Backstabs, falls, stoning, blocked movement, and runtime violations.
- [x] **VIEW-07**: User can see final outcome and MatchSet aggregate scoring.

### Testing and Quality

- [x] **TEST-01**: Engine unit tests cover every canonical movement, collision, Backstab, push, stoning, falling, contraction, and end-condition rule.
- [x] **TEST-02**: Engine property/invariant tests cover occupancy uniqueness, bounds validity, status semantics, and deterministic ordering.
- [x] **TEST-03**: Replay tests verify Chronicle reconstruction and integrity validation.
- [x] **TEST-04**: Runtime tests cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and output schema validation.
- [ ] **TEST-05**: Worker tests distinguish strategy failures from system failures.
- [x] **TEST-06**: Playwright tests cover strategy editing, revision submission, MatchSet creation, Match execution status, and replay viewing.
- [x] **TEST-07**: CI or local verification command runs typecheck, lint, unit tests, integration tests, and selected E2E tests.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Competitive

- **COMP-01**: User can participate in ranked ladders.
- **COMP-02**: User can enter public tournaments.
- **COMP-03**: User can publish Strategies or doctrine writeups.
- **COMP-04**: User can share public Chronicle links.

### Authoring

- **AUTHR-01**: User can use AI-assisted Strategy authoring inside the editor.
- **AUTHR-02**: User can compare multiple Strategy Revisions across batch simulations.
- **AUTHR-03**: User can use a visual rule builder.

### Runtime

- **MLANG-01**: User can submit Strategies in additional languages beyond JS/TS.
- **MLANG-02**: Runtime can execute WASM/WASI strategy artifacts.
- **MLANG-03**: Runtime can enforce deterministic fuel metering rather than prototype timeouts.

### Product

- **PROD-01**: User can customize cosmetic Soldier themes and Stone styles without reducing readability.
- **PROD-02**: Spectator can watch public Matches or tournaments.
- **PROD-03**: User can create custom maps after map validation and balance tooling exist.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Live human control during Match | Violates autonomous doctrine design. |
| Live model inference during Match | Breaks deterministic autonomous execution. |
| Ranked ladder in v1 | Requires stable MatchSet correctness, abuse controls, and operational maturity. |
| Public tournaments in v1 | Depends on ranking, scheduling, moderation, and spectator surfaces. |
| Randomized arena generation | v1 uses hand-authored deterministic Arena Variants. |
| User-created custom maps | Adds validation and balance complexity before core loop is proven. |
| Multiple language runtimes | Engine remains runtime-agnostic, but v1 implements one JS/TS runtime. |
| Strategy marketplace | Premature before strategy identity, publishing, moderation, and competitive integrity are proven. |
| Monetized gameplay advantages | Conflicts with competitive integrity. |
| Full visual debugger product | v1 needs replay and inspection; advanced debugger can evolve later. |
| Reinforcement-learning environment | Future research feature, not needed for first product loop. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| SPEC-01 | Phase 1 | Complete |
| SPEC-02 | Phase 1 | Complete |
| SPEC-03 | Phase 1 | Complete |
| SPEC-04 | Phase 1 | Complete |
| SPEC-05 | Phase 1 | Complete |
| ENG-01 | Phase 2 | Complete |
| ENG-02 | Phase 2 | Complete |
| ENG-03 | Phase 2 | Complete |
| ENG-04 | Phase 2 | Complete |
| ENG-05 | Phase 2 | Complete |
| ENG-06 | Phase 2 | Complete |
| ENG-07 | Phase 2 | Complete |
| ENG-08 | Phase 2 | Complete |
| ENG-09 | Phase 2 | Complete |
| ENG-10 | Phase 2 | Complete |
| ENG-11 | Phase 2 | Complete |
| ENG-12 | Phase 2 | Complete |
| ENG-13 | Phase 2 | Complete |
| ENG-14 | Phase 2 | Complete |
| ENG-15 | Phase 2 | Complete |
| ENG-16 | Phase 2 | Complete |
| ENG-17 | Phase 2 | Complete |
| ENG-18 | Phase 2 | Complete |
| ENG-19 | Phase 2 | Complete |
| ENG-20 | Phase 2 | Complete |
| ENG-21 | Phase 2 | Complete |
| REPLAY-01 | Phase 3 | Complete |
| REPLAY-02 | Phase 3 | Complete |
| REPLAY-03 | Phase 3 | Complete |
| REPLAY-04 | Phase 3 | Complete |
| REPLAY-05 | Phase 3 | Complete |
| REPLAY-06 | Phase 3 | Complete |
| REPLAY-07 | Phase 3 | Complete |
| RUN-01 | Phase 4 | Complete |
| RUN-02 | Phase 4 | Complete |
| RUN-03 | Phase 4 | Complete |
| RUN-04 | Phase 4 | Complete |
| RUN-05 | Phase 4 | Complete |
| RUN-06 | Phase 4 | Complete |
| RUN-07 | Phase 4 | Complete |
| RUN-08 | Phase 4 | Complete |
| RUN-09 | Phase 4 | Complete |
| RUN-10 | Phase 4 | Complete |
| MATCH-01 | Phase 5 | Complete |
| MATCH-02 | Phase 5 | Complete |
| MATCH-03 | Phase 5 | Complete |
| MATCH-04 | Phase 5 | Complete |
| MATCH-05 | Phase 5 | Complete |
| MATCH-06 | Phase 5 | Complete |
| MATCH-07 | Phase 5 | Complete |
| DATA-01 | Phase 5 | Complete |
| DATA-02 | Phase 5 | Complete |
| DATA-03 | Phase 5 | Complete |
| DATA-04 | Phase 5 | Complete |
| DATA-05 | Phase 5 | Complete |
| UX-01 | Phase 6 | Complete |
| UX-02 | Phase 6 | Complete |
| UX-03 | Phase 6 | Complete |
| UX-04 | Phase 6 | Complete |
| UX-05 | Phase 6 | Complete |
| UX-06 | Phase 6 | Complete |
| VIEW-01 | Phase 7 | Complete |
| VIEW-02 | Phase 7 | Complete |
| VIEW-03 | Phase 7 | Complete |
| VIEW-04 | Phase 7 | Complete |
| VIEW-05 | Phase 7 | Complete |
| VIEW-06 | Phase 7 | Complete |
| VIEW-07 | Phase 7 | Complete |
| TEST-01 | Phase 2 | Complete |
| TEST-02 | Phase 2 | Complete |
| TEST-03 | Phase 3 | Complete |
| TEST-04 | Phase 4 | Complete |
| TEST-05 | Phase 5 | Complete |
| TEST-06 | Phase 7 | Complete |
| TEST-07 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 80 total
- Mapped to phases: 80
- Unmapped: 0

---
*Requirements defined: 2026-05-16*
*Last updated: 2026-05-16 after Phase 3 Plan 03-04 execution*
