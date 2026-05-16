# Requirements: Coward's Game

**Defined:** 2026-05-16  
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Developer can install dependencies and run the monorepo with pnpm.
- [ ] **FOUND-02**: Developer can run a single command that starts the web app, worker, database, queue dependency, and local sandbox dependencies.
- [ ] **FOUND-03**: Developer can run unit, integration, and E2E test commands from the repo root.
- [ ] **FOUND-04**: The repository enforces package boundaries so UI, worker, engine, runtime, replay, map configs, and shared contracts remain separate.
- [ ] **FOUND-05**: The project records engine, runtime, spec, Chronicle, Strategy Revision, and Arena Variant versions wherever Match reproducibility depends on them.

### Spec Contracts

- [ ] **SPEC-01**: Developer can import canonical TypeScript types for Player, Strategy, StrategyRevision, Soldier, Match, MatchSet, ArenaVariant, Chronicle, and runtime inputs/outputs.
- [ ] **SPEC-02**: Developer can validate all runtime inputs and outputs with Zod schemas.
- [ ] **SPEC-03**: Developer can rely on canonical constants for 12x12 initial board bounds, initial Soldier positions, Round activation counts, 12-cycle Activation budget, memory limits, and source size limits.
- [ ] **SPEC-04**: Developer can use canonical discriminated unions for Soldier statuses, Directions, Actions, AwarenessCell contents, event types, and runtime violation types.
- [ ] **SPEC-05**: Developer can generate valid test fixtures for starting boards, Soldiers, Arena Variants, seeds, Strategies, and Match inputs.

### Engine Rules

- [ ] **ENG-01**: Developer can create the canonical initial 12x12 Match state with 8 Soldiers per Player at the specified starting positions and facings.
- [ ] **ENG-02**: Engine advances Matches through repeating Phases of Round 1, Round 2, Round 3, Round 4, then Contraction.
- [ ] **ENG-03**: Engine applies the correct per-player activation counts of 1, 2, 3, and 4 for Rounds 1 through 4.
- [ ] **ENG-04**: Engine applies the interleaved snake activation pattern and alternates initiative every Round after deterministic seed-based initial initiative.
- [ ] **ENG-05**: Engine rejects duplicate, excess, malformed, STONE, or FALLEN Soldier activation selections according to the canonical rules.
- [ ] **ENG-06**: Engine invokes SoldierBrain for up to 12 Cycles per Activation and provides only the Soldier snapshot, 5x5 Awareness Grid, cycle metadata, objective payload, and SoldierMemory.
- [ ] **ENG-07**: Engine resolves TURN actions by updating facing, consuming one Cycle, and not counting as an Advance.
- [ ] **ENG-08**: Engine resolves TURN_TO_STONE as Coward's Way Out by immediately changing the Soldier to STONE and ending the Activation.
- [ ] **ENG-09**: Engine resolves successful MOVE actions by Advancing one square, updating facing, and updating lastSuccessfulMoveDirection.
- [ ] **ENG-10**: Engine enforces the immediate reversal rule based on lastSuccessfulMoveDirection.
- [ ] **ENG-11**: Engine resolves off-board movement by making the moving Soldier FALLEN with reason MOVED_OFF_BOARD.
- [ ] **ENG-12**: Engine blocks movement into TerrainStones or Stone Soldiers and interrupts the Activation.
- [ ] **ENG-13**: Engine resolves head-to-head collisions as blocked movement without push or Backstab.
- [ ] **ENG-14**: Engine resolves side pushes for friendly or enemy ACTIVE Soldiers, including blocked pushes and pushes off-board.
- [ ] **ENG-15**: Engine resolves Backstabs after each successful Advance and supports one Advance Backstabbing multiple enemy ACTIVE Soldiers.
- [ ] **ENG-16**: Engine turns any Soldier that ends an Activation without Advancing into STONE unless that Soldier became FALLEN.
- [ ] **ENG-17**: Engine contracts board bounds inward by one square after Round 4 and makes out-of-bounds ACTIVE or STONE Soldiers FALLEN.
- [ ] **ENG-18**: Engine removes TerrainStones outside bounds after Contraction.
- [ ] **ENG-19**: Engine ends Matches immediately when one Player has zero ACTIVE Soldiers, with DRAW if both Players have zero ACTIVE Soldiers.
- [ ] **ENG-20**: Engine applies final 2x2 resolution by comparing ACTIVE Soldier counts and producing a win or DRAW.
- [ ] **ENG-21**: Engine remains pure and never accesses database, network, filesystem, wall-clock time, or `Math.random`.

### Determinism and Replay

- [ ] **REPLAY-01**: Developer can run a deterministic replay test proving same seed, Strategy Revisions, Arena Variant, engine version, and runtime version produce the same Chronicle.
- [ ] **REPLAY-02**: Every Match produces a Chronicle containing Match start, Round start, Strategy evaluation, Activation start, Awareness Grid observation, Action emitted, movement, push, Backstab, stoning, fall, contraction, runtime violation, and Match end events.
- [ ] **REPLAY-03**: Chronicle records enough information to reconstruct board states and final Match outcome without re-executing strategy source code.
- [ ] **REPLAY-04**: Chronicle supports checkpoints for partial replay and debugging.
- [ ] **REPLAY-05**: Replay utilities can validate Chronicle integrity and fail clearly on corrupted or version-incompatible replay data.
- [ ] **REPLAY-06**: Public replay projection excludes Strategy source code, StrategyMemory, SoldierMemory, and objective payloads by default.
- [ ] **REPLAY-07**: Owner-only replay projection can expose private debug data for the owning Player when available.

### Strategy Runtime

- [ ] **RUN-01**: User can validate a JavaScript or TypeScript Strategy Revision before submitting it.
- [ ] **RUN-02**: User can submit an immutable Strategy Revision that stores source, runtime version, engine compatibility, validation result, and metadata.
- [ ] **RUN-03**: Runtime can evaluate `selectActivations` against full-board StrategyInput and return activation orders plus StrategyMemory.
- [ ] **RUN-04**: Runtime can evaluate `soldierBrain` against SoldierBrainInput and return exactly one Action plus SoldierMemory.
- [ ] **RUN-05**: Runtime enforces source size, StrategyMemory size, SoldierMemory size, objective payload size, and output schema limits.
- [ ] **RUN-06**: Runtime handles invalid output as an interrupted Activation and logs a Chronicle violation.
- [ ] **RUN-07**: Runtime handles timeout or thrown exception as a no-op/invalid evaluation according to the strategy failure policy.
- [ ] **RUN-08**: Runtime prevents strategy code from accessing network, filesystem, environment variables, secrets, database, process APIs, wall-clock time, nondeterministic randomness, `eval`, `Function`, dynamic imports, worker spawning, native modules, or package installation.
- [ ] **RUN-09**: Runtime executes only in worker/local sandbox contexts and never in the main web/API process.
- [ ] **RUN-10**: Runtime boundary is replaceable so future non-JS runtimes can implement the same StrategyRuntime interface.

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

- [ ] **UX-01**: User can create and edit a Strategy in a Monaco-based editor.
- [ ] **UX-02**: User can start from sample doctrine templates.
- [ ] **UX-03**: User can validate Strategy source and see actionable validation/runtime errors.
- [ ] **UX-04**: User can submit a Strategy Revision from the editor.
- [ ] **UX-05**: User can run a local or Workshop test Match before competitive use.
- [ ] **UX-06**: User can view Strategy Revision history and select revisions for Matches.

### Replay UX

- [ ] **VIEW-01**: User can open a completed Match and watch a board replay.
- [ ] **VIEW-02**: User can scrub or step through Round, Activation, Cycle, and event timeline positions.
- [ ] **VIEW-03**: User can inspect Soldier status, position, facing, and owner during replay.
- [ ] **VIEW-04**: User can inspect the active Soldier's Awareness Grid for recorded Cycles.
- [ ] **VIEW-05**: Replay visually distinguishes ACTIVE, STONE, FALLEN, TerrainStone, board bounds, and Contraction.
- [ ] **VIEW-06**: Replay emphasizes pushes, Backstabs, falls, stoning, blocked movement, and runtime violations.
- [ ] **VIEW-07**: User can see final outcome and MatchSet aggregate scoring.

### Testing and Quality

- [ ] **TEST-01**: Engine unit tests cover every canonical movement, collision, Backstab, push, stoning, falling, contraction, and end-condition rule.
- [ ] **TEST-02**: Engine property/invariant tests cover occupancy uniqueness, bounds validity, status semantics, and deterministic ordering.
- [ ] **TEST-03**: Replay tests verify Chronicle reconstruction and integrity validation.
- [ ] **TEST-04**: Runtime tests cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and output schema validation.
- [ ] **TEST-05**: Worker tests distinguish strategy failures from system failures.
- [ ] **TEST-06**: Playwright tests cover strategy editing, revision submission, MatchSet creation, Match execution status, and replay viewing.
- [ ] **TEST-07**: CI or local verification command runs typecheck, lint, unit tests, integration tests, and selected E2E tests.

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
| FOUND-01 | TBD | Pending |
| FOUND-02 | TBD | Pending |
| FOUND-03 | TBD | Pending |
| FOUND-04 | TBD | Pending |
| FOUND-05 | TBD | Pending |
| SPEC-01 | TBD | Pending |
| SPEC-02 | TBD | Pending |
| SPEC-03 | TBD | Pending |
| SPEC-04 | TBD | Pending |
| SPEC-05 | TBD | Pending |
| ENG-01 | TBD | Pending |
| ENG-02 | TBD | Pending |
| ENG-03 | TBD | Pending |
| ENG-04 | TBD | Pending |
| ENG-05 | TBD | Pending |
| ENG-06 | TBD | Pending |
| ENG-07 | TBD | Pending |
| ENG-08 | TBD | Pending |
| ENG-09 | TBD | Pending |
| ENG-10 | TBD | Pending |
| ENG-11 | TBD | Pending |
| ENG-12 | TBD | Pending |
| ENG-13 | TBD | Pending |
| ENG-14 | TBD | Pending |
| ENG-15 | TBD | Pending |
| ENG-16 | TBD | Pending |
| ENG-17 | TBD | Pending |
| ENG-18 | TBD | Pending |
| ENG-19 | TBD | Pending |
| ENG-20 | TBD | Pending |
| ENG-21 | TBD | Pending |
| REPLAY-01 | TBD | Pending |
| REPLAY-02 | TBD | Pending |
| REPLAY-03 | TBD | Pending |
| REPLAY-04 | TBD | Pending |
| REPLAY-05 | TBD | Pending |
| REPLAY-06 | TBD | Pending |
| REPLAY-07 | TBD | Pending |
| RUN-01 | TBD | Pending |
| RUN-02 | TBD | Pending |
| RUN-03 | TBD | Pending |
| RUN-04 | TBD | Pending |
| RUN-05 | TBD | Pending |
| RUN-06 | TBD | Pending |
| RUN-07 | TBD | Pending |
| RUN-08 | TBD | Pending |
| RUN-09 | TBD | Pending |
| RUN-10 | TBD | Pending |
| MATCH-01 | TBD | Pending |
| MATCH-02 | TBD | Pending |
| MATCH-03 | TBD | Pending |
| MATCH-04 | TBD | Pending |
| MATCH-05 | TBD | Pending |
| MATCH-06 | TBD | Pending |
| MATCH-07 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| DATA-04 | TBD | Pending |
| DATA-05 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| UX-05 | TBD | Pending |
| UX-06 | TBD | Pending |
| VIEW-01 | TBD | Pending |
| VIEW-02 | TBD | Pending |
| VIEW-03 | TBD | Pending |
| VIEW-04 | TBD | Pending |
| VIEW-05 | TBD | Pending |
| VIEW-06 | TBD | Pending |
| VIEW-07 | TBD | Pending |
| TEST-01 | TBD | Pending |
| TEST-02 | TBD | Pending |
| TEST-03 | TBD | Pending |
| TEST-04 | TBD | Pending |
| TEST-05 | TBD | Pending |
| TEST-06 | TBD | Pending |
| TEST-07 | TBD | Pending |

**Coverage:**
- v1 requirements: 79 total
- Mapped to phases: 0
- Unmapped: 79

---
*Requirements defined: 2026-05-16*
*Last updated: 2026-05-16 after initial definition*
