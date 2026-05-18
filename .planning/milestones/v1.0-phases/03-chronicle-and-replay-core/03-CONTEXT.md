# Phase 3: Chronicle and Replay Core - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns the Phase 2 engine's lightweight transition summaries into trustworthy Chronicle and replay infrastructure. It should define canonical versioned Chronicle contracts in `packages/spec`, implement Chronicle construction/reconstruction/validation/projection logic in `packages/replay`, and prove deterministic replay behavior with tests.

This phase does not build the visual replay viewer, persistence schema, worker orchestration, real runtime sandbox, or full exhaustive Chronicle grammar. Phase 3 should produce a replayable and privacy-safe artifact foundation that later phases can persist, display, and harden.

</domain>

<decisions>
## Implementation Decisions

### Chronicle Event Shape

- **D-01:** Chronicle records should combine semantic events with snapshots at meaningful boundaries rather than relying on deltas only or full snapshots on every event.
- **D-02:** Boundary snapshots should exist at Match start/end, Round start/end, Activation start/end, Contraction, and terminal boundaries where replay would otherwise be ambiguous.
- **D-03:** Individual event payloads should be semantic: IDs, reasons, positions, directions, affected Soldiers, causality fields, and privacy classification where relevant. Do not place whole board state inside every event payload.
- **D-04:** `packages/spec` owns canonical Chronicle contracts: envelope, event types/details, snapshots/checkpoints, projections, integrity metadata, and Zod schemas.
- **D-05:** `packages/replay` owns Chronicle construction, reconstruction, validation, normalization, projection, and replay-facing utilities.
- **D-06:** Chronicle identity/version metadata should use a full reproducibility envelope: Match ID, seed, Arena Variant ID/version, Strategy Revision IDs, spec/engine/runtime/chronicle versions, and schema version.
- **D-07:** Nondeterministic storage metadata such as wall-clock timestamps should stay outside the deterministic hash path unless explicitly normalized.
- **D-08:** Chronicle events should use hierarchical sequence identity: global sequence plus phase/round/activation/cycle context where applicable. Do not use a nested event-tree format in Phase 3.
- **D-09:** `AWARENESS_GRID_OBSERVED` remains in the canonical event stream. Public events record that observation occurred and its sequence/context; exact grids live in private owner-only projection data.

### Replay Reconstruction Strategy

- **D-10:** Replay reconstruction should use boundary snapshots plus semantic event replay between them, verifying reconstructed state against the next boundary snapshot.
- **D-11:** The first reconstruction API should optimize for `stateAt(sequence)` lookup so Phase 7 can scrub directly to event positions.
- **D-12:** The same reconstruction core should expose or naturally support a linear replay iterator for tests and playback.
- **D-13:** Phase 3 should use boundary checkpoints only. Do not add fixed-interval or adaptive checkpoints yet.
- **D-14:** Reconstruction and validation failures should return structured typed errors with sequence, reason code, expected/actual summary where safe, and enough context for tests or future UI.
- **D-15:** Replay utilities may use pure shared helpers/selectors where useful, but must not re-run strategies or depend on re-executing engine transitions to know what happened. Chronicle is the recorded truth.
- **D-16:** Phase 3 should enforce a required canonical event set and broad ordering rules, but not a full exhaustive event grammar yet.
- **D-17:** Required validation should cover match start before rounds, activations inside rounds, observations/actions inside activations, movement/push/Backstab/stone/fall/contraction/runtime violation events where applicable, and exactly one terminal match end.

### Privacy Projection Boundary

- **D-18:** The default public Chronicle projection exposes board truth only: visible board state, event types, public semantic payloads, positions/status/facing, outcomes, and runtime violation markers.
- **D-19:** Public projection must not expose strategy source, `StrategyMemory`, `SoldierMemory`, objective payloads, exact Awareness Grids, or raw runtime details by default.
- **D-20:** Owner-only debug projection is per player. Each player can see only their own private StrategyMemory, SoldierMemory, objectives, Awareness Grids, and raw runtime details.
- **D-21:** Phase 3 should use one canonical Chronicle artifact containing public and private sections, with projection utilities controlling access by viewer/player.
- **D-22:** Later persistence may split public/private storage, but the logical Chronicle artifact remains unified in Phase 3.
- **D-23:** Runtime violations should appear publicly as category/marker plus affected activation/Soldier. Raw messages/details belong only in the owning player's private projection.

### Determinism and Integrity Contract

- **D-24:** Phase 3 determinism tests should assert semantically identical normalized Chronicles for identical deterministic inputs, not byte-identical serialized artifacts.
- **D-25:** Normalization should exclude nondeterministic metadata and preserve all replay-relevant content.
- **D-26:** Chronicle integrity metadata should include a deterministic content hash over normalized canonical Chronicle content plus schema/version metadata.
- **D-27:** Version incompatibility should return typed structured errors, not best-effort replay or raw throws.
- **D-28:** Phase 3 should define migration interfaces/extension points for future Chronicle versions, but should not implement real migrations yet.

### Awareness Grid Recording

- **D-29:** Owner-only Awareness Grid payloads should store the exact canonical 5x5 grid, active Soldier ID, cycle index, objective reference/context, and sequence fields.
- **D-30:** Awareness Grid payloads should match the exact `SoldierBrainInput.awarenessGrid` the runtime received. Do not recompute or sanitize them for owner-only debug data.
- **D-31:** Awareness Grid events should reference objective metadata rather than inline objective payloads. Actual objective payloads, if stored, belong in owner-only private data with hash/size/reference links.
- **D-32:** Phase 3 must include privacy tests proving public projection retains awareness observation markers while stripping exact grids, objective payloads, and private debug data.
- **D-33:** Canonical Chronicles should store private Awareness Grid/debug sections for both players, with projection controlling per-player access.

### the agent's Discretion

No areas were delegated to the agent without a user choice.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning

- `.planning/PROJECT.md` — Core value, Chronicle-first product principles, privacy boundaries, determinism constraints, and replay expectations.
- `.planning/REQUIREMENTS.md` — Phase 3 requirements REPLAY-01 through REPLAY-07 and TEST-03.
- `.planning/ROADMAP.md` — Phase 3 boundary, success criteria, and notes.
- `.planning/STATE.md` — Current project status and workflow settings.
- `.planning/config.json` — GSD mode, granularity, parallel execution, and workflow preferences.

### Prior Phase Decisions

- `.planning/phases/01-foundation-and-spec-contracts/01-CONTEXT.md` — Locked package-boundary, spec-contract, fixture, and versioning decisions.
- `.planning/phases/02-pure-rules-engine/02-CONTEXT.md` — Locked engine state, transition summary, Backstab, runtime boundary, purity, and test decisions.
- `.planning/phases/02-pure-rules-engine/02-REVIEW.md` — Deep review notes that specifically protect Phase 3 from duplicate terminal events and fragile match-end ordering.

### Source Specs

- `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay rules, terminology, entities, runtime constraints, determinism, Chronicle expectations, and product principles.
- `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md` — Technical architecture, replay package responsibility, Chronicle schema expectations, deterministic simulation requirements, and privacy cautions.

### Source Code

- `packages/spec/src/types.ts` — Current canonical types for runtime inputs/outputs, Chronicle event type names, versions, Match, and MatchSet.
- `packages/spec/src/schemas.ts` — Current Zod schemas; Phase 3 should extend these with Chronicle envelope/snapshot/projection/integrity schemas.
- `packages/spec/src/constants.ts` — Canonical constants and versioned rules inputs that Chronicle metadata may reference.
- `packages/engine/src/types.ts` — `TransitionEventSummary`, transition result, runtime interfaces, and event helper.
- `packages/engine/src/match.ts` — `runMatch` full-match API and event aggregation path.
- `packages/engine/src/activation.ts` — Activation/cycle event emission, awareness observation markers, runtime violations, and action events.
- `packages/engine/src/movement.ts` — Movement, push, fall, block, and advance event payload sources.
- `packages/engine/src/backstab.ts` — Backstab event payload sources.
- `packages/engine/src/contraction.ts` — Contraction and final-resolution event payload sources.
- `packages/engine/src/outcome.ts` — Idempotent match-end helper and terminal event behavior.
- `packages/replay/src/index.ts` — Current skeletal replay package entrypoint; Phase 3 implementation target.
- `packages/test-utils/src/engine-scenarios.ts` — Scenario helpers available for Chronicle/replay tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `@cowards/spec` already owns canonical types, constants, Zod schemas, and compatibility versions. Phase 3 should extend this package rather than defining Chronicle contracts only in `packages/replay`.
- `@cowards/engine` now emits deterministic `TransitionEventSummary[]` from `runMatch` and step-level transitions, with global sequence assigned at match end.
- `packages/engine/src/outcome.ts` makes terminal match-end behavior idempotent, which Phase 3 can rely on for exactly one terminal `MATCH_ENDED` event.
- `packages/test-utils/src/engine-scenarios.ts` and engine fake runtime helpers can support deterministic Chronicle construction tests.

### Established Patterns

- `GameState` remains clean and does not store a Chronicle log. Phase 3 should keep Chronicle artifacts outside engine state.
- Workspace package direction remains `spec` -> consumed by other packages; `engine` can depend on `spec`; `replay` should consume `spec` and likely `engine` outputs/helpers without introducing app/worker/persistence dependencies.
- Local verification remains `pnpm verify`, with package-level Vitest tests.
- Boundary and privacy behavior should be encoded as tests, not left as documentation only.

### Integration Points

- `packages/spec` should add Chronicle schemas/types that downstream `replay`, worker, persistence, and UI packages can share.
- `packages/replay` should become the Chronicle construction, normalization, hashing, validation, reconstruction, and projection package.
- Engine event summaries are the bridge from Phase 2 to Phase 3, but Phase 3 may need to enrich or adapt them into canonical Chronicle events without putting Chronicle state into `GameState`.
- Phase 7 replay UI should consume `stateAt(sequence)` and linear iterator APIs from `packages/replay`.

</code_context>

<specifics>
## Specific Ideas

- Chronicle event shape should be "semantic event plus boundary snapshots", not pure deltas and not full snapshots on every event.
- Public projection should be board-truth-oriented; owner projection should be per-player and private.
- Awareness Grid observations are important enough to store exactly for owner debug, while public replay only sees observation markers.
- Strict exhaustive Chronicle grammar is desirable, but should wait until after Phase 7 when runtime, worker/persistence, and actual replay UI needs are known.

</specifics>

<deferred>
## Deferred Ideas

- Add a post-Phase-7 Chronicle Grammar and Replay Verification Hardening phase with strict exhaustive event grammar, state-machine validation, fuzz/property tests, version migration checks, and legal/illegal event-sequence fixtures.

</deferred>

---

*Phase: 3-Chronicle and Replay Core*
*Context gathered: 2026-05-16*
