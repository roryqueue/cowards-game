---
phase: 03-chronicle-and-replay-core
verified: 2026-05-16T15:47:18Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 3: Chronicle and Replay Core Verification Report

**Phase Goal:** Make every Match reproducible, inspectable, and safe to project publicly.
**Verified:** 2026-05-16T15:47:18Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every engine-run Match emits a versioned Chronicle with required event types. | VERIFIED | `packages/spec/src/types.ts:248` defines versioned `Chronicle`; `packages/replay/src/build.ts:210` exports `buildChronicleFromMatch`; builder emits `MATCH_STARTED` at `packages/replay/src/build.ts:223`, round events at `packages/replay/src/build.ts:251`, appends engine transition summaries, and terminal `MATCH_ENDED` fallback at `packages/replay/src/build.ts:359`. Engine event producers cover strategy/runtime/activation events in `packages/engine/src/activation.ts:197`, `packages/engine/src/activation.ts:257`, `packages/engine/src/activation.ts:307`, movement/push/fall in `packages/engine/src/movement.ts`, Backstab in `packages/engine/src/backstab.ts:56`, and Contraction in `packages/engine/src/contraction.ts:72`. |
| 2 | Replay utilities reconstruct board state and final outcome from Chronicle data. | VERIFIED | `packages/replay/src/reconstruct.ts:541` exports `createReplay`; replay API exposes `stateAt` and `iterateReplay` at `packages/replay/src/reconstruct.ts:33` and `packages/replay/src/reconstruct.ts:34`. Reconstruction applies event effects for movement, push, Backstab, stoning, falling, contraction, and match end in `packages/replay/src/reconstruct.ts:173-424`. Tests verify final outcome and iterator behavior in `packages/replay/src/reconstruct.test.ts:242-334` and integration coverage in `packages/replay/src/integration.test.ts:83-91`. |
| 3 | Determinism tests prove identical inputs produce identical or semantically identical Chronicles. | VERIFIED | `packages/replay/src/determinism.test.ts:62-63` compares `normalizeChronicle()` output and content hashes; tests assert identical inputs match and seed/revision changes alter hash. `pnpm verify` passed in this turn with replay determinism tests included. |
| 4 | Public and owner-only replay projections enforce privacy boundaries for source, memory, and objectives. | VERIFIED | `packages/replay/src/project.ts:81`, `packages/replay/src/project.ts:91`, and `packages/replay/src/project.ts:112` export public, owner, and viewer-dispatched projection APIs. Public projection strips private keys via `PRIVATE_PAYLOAD_KEYS`; tests assert absence of `privateRef`, exact grids, objective payloads, StrategyMemory, SoldierMemory, strategy source, and raw runtime details at `packages/replay/src/project.test.ts:177-189`. Owner scoping is verified at `packages/replay/src/project.test.ts:228-292`. |
| 5 | Chronicle integrity and version validation fail clearly on corrupted or incompatible replay data. | VERIFIED | `packages/replay/src/hash.ts:27-30` computes sha256 over normalized content; `packages/replay/src/validate.ts:326` exports `validateChronicle`; validation covers schema, version, event ordering, required events, snapshots, hash mismatch, and unsupported migrations. Tests cover typed failures in `packages/replay/src/validate.test.ts:60-211`. |
| 6 | Chronicle supports checkpoints for partial replay and debugging. | VERIFIED | `ChronicleBoundarySnapshot` is defined at `packages/spec/src/types.ts:221`; builder records `MATCH_START`, `ROUND_START`, `ACTIVATION_START`, `ACTIVATION_END`, `ROUND_END`, `CONTRACTION`, `MATCH_END`, and `TERMINAL` snapshots in `packages/replay/src/build.ts:216`, `packages/replay/src/build.ts:245-247`, `packages/replay/src/build.ts:302-319`, `packages/replay/src/build.ts:327-328`, `packages/replay/src/build.ts:339-342`, and `packages/replay/src/build.ts:366-367`. |
| 7 | Replay reconstruction does not rerun strategies or require StrategyRuntime. | VERIFIED | `packages/replay/src/reconstruct.ts` imports only Chronicle/spec types and validation/hash helpers, not `@cowards/engine` or runtime APIs. The `runSoldierBrain` string appears only in engine/replay tests, not reconstruction implementation. `packages/replay/src/reconstruct.test.ts:243-258` verifies replay from a built Chronicle without passing a runtime to reconstruction. |
| 8 | Phase 3 requirements REPLAY-01 through REPLAY-07 and TEST-03 are accounted for. | VERIFIED | Plan frontmatter maps all required IDs across 03-01 through 03-05, and `.planning/REQUIREMENTS.md` lists all eight as Phase 3 complete. Code evidence maps each requirement in the Requirements Coverage table below. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/spec/src/types.ts` | Canonical Chronicle, snapshot, integrity, privacy, projection, validation, and migration contracts | VERIFIED | `Chronicle`, `ChronicleBoundarySnapshot`, `ChronicleReproducibilityEnvelope`, `ChroniclePrivateSections`, `ChronicleProjection`, and `ChronicleValidationErrorCode` present at lines 221-309. |
| `packages/spec/src/schemas.ts` | Zod schemas for Chronicle contracts and event payloads | VERIFIED | `ChronicleEventSchema`, `ChronicleBoundarySnapshotSchema`, `ChronicleSchema`, and validation schemas present at lines 276-454. |
| `packages/engine/src/types.ts` and `packages/engine/src/activation.ts` | Engine transition summaries carry deterministic context/private payload candidates | VERIFIED | `context`, `privacy`, and `privatePayload` fields at `packages/engine/src/types.ts:62-64`; exact awareness grid and objective payload captured at `packages/engine/src/activation.ts:257-263`. |
| `packages/replay/src/build.ts` | Build canonical Chronicles from matches/results with snapshots and owner-private references | VERIFIED | `buildChronicleFromResult` at line 175 and `buildChronicleFromMatch` at line 210; deterministic `private:event:{sequence}` references at line 119. |
| `packages/replay/src/normalize.ts` and `packages/replay/src/hash.ts` | Deterministic normalization and sha256 content hashing | VERIFIED | `normalizeChronicle` at `normalize.ts:3`; `createChronicleContentHash` at `hash.ts:27`. |
| `packages/replay/src/validate.ts` | Typed validation and migration hook | VERIFIED | Required event/snapshot checks and `validateChronicle` at lines 15-26 and 326; `migrateChronicle` at line 44. |
| `packages/replay/src/reconstruct.ts` | `createReplay`, `stateAt`, and `iterateReplay` | VERIFIED | API types at lines 33-34 and implementation at lines 541-557. |
| `packages/replay/src/project.ts` | Public and owner replay projection APIs | VERIFIED | Public, owner, and dispatcher exports at lines 81, 91, and 112. |
| `packages/replay/src/*.test.ts` | Determinism, construction, validation, integrity, reconstruction, projection, and integration tests | VERIFIED | `pnpm verify` ran 7 replay test files / 22 tests successfully in this turn. |
| `packages/replay/README.md` | Replay API documentation and Phase 3 non-goals | VERIFIED | Required sections present: Chronicle Construction, Validation and Integrity, Reconstruction, Projections, and Phase 3 Non-Goals. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Engine transition summaries | Chronicle builder | `TransitionEventSummary[]` consumed by `createEventAppender` | WIRED | `packages/replay/src/build.ts:102-135` maps summaries to Chronicle events, contexts, privacy, and private refs. |
| Chronicle builder | Engine deterministic flow | Engine transition functions imported from `@cowards/engine` | WIRED | `packages/replay/src/build.ts:1-16` imports engine functions; `buildChronicleFromMatch` uses `createInitialGameState`, `resolveActivationSelection`, `resolveActivation`, `resolveContraction`, and `checkAndApplyMatchEnd`. |
| Chronicle builder | Private sections | `privatePayload` to `private.byPlayerId[owner][privateRef]` | WIRED | Owner resolution and recording implemented in `packages/replay/src/build.ts:61-77` and `packages/replay/src/build.ts:117-125`. |
| Chronicle validation | Integrity hashing | `validateHash` calls `createChronicleContentHash` | WIRED | `packages/replay/src/validate.ts:289-309`. |
| Replay reconstruction | Validation | `createReplay` calls `validateChronicle` before replay | WIRED | `packages/replay/src/reconstruct.ts:541-545`. |
| Projection APIs | Public package export | `packages/replay/src/index.ts` wildcard exports | WIRED | `build`, `normalize`, `hash`, `validate`, `reconstruct`, and `project` modules are exported. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `packages/replay/src/build.ts` | `chronicle.events`, `chronicle.snapshots`, `chronicle.private` | Engine transition calls and `getFullBoardSnapshot(state)` during actual match traversal | Yes | FLOWING |
| `packages/engine/src/activation.ts` | owner-private Awareness Grid, objectives, memory, raw violations | Actual `SoldierBrainInput`, parsed runtime outputs, and runtime violations | Yes | FLOWING |
| `packages/replay/src/reconstruct.ts` | `ReplayState` | Chronicle snapshots and semantic event payloads | Yes | FLOWING |
| `packages/replay/src/project.ts` | public and owner projections | Canonical Chronicle plus selected `private.byPlayerId[playerId]` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full project verification | `pnpm verify` | Passed format, lint, typecheck, and tests across 8 packages; replay tests: 7 files / 22 tests | PASS |
| Code review cleanliness | Read `.planning/phases/03-chronicle-and-replay-core/03-REVIEW.md` | Review status is `clean`, findings critical/warning/info all 0 | PASS |
| Anti-pattern scan | `rg` for TODO/FIXME/placeholders, empty visible stubs, console-only handlers, forbidden engine APIs | No blocker patterns in Phase 3 source; matches were test fixtures, typed defaults, or engine purity tests | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| REPLAY-01 | 03-02, 03-05 | Deterministic replay test proves same reproducibility inputs produce same Chronicle | SATISFIED | `packages/replay/src/determinism.test.ts` compares normalized Chronicles and hashes for identical inputs and negative seed/revision changes. |
| REPLAY-02 | 03-01, 03-02, 03-05 | Match Chronicles contain canonical event types | SATISFIED | Spec event union/schema includes full event vocabulary; builder emits match/round events and appends engine events; engine emits movement, push, Backstab, stoning, fall, contraction, runtime violation, and match end events. Strict exhaustive grammar remains explicitly deferred in roadmap/context. |
| REPLAY-03 | 03-02, 03-03, 03-05 | Chronicle records enough to reconstruct board states and final outcome without strategy source execution | SATISFIED | `createReplay` reconstructs from snapshots/events only; integration test verifies final state equals built final outcome. |
| REPLAY-04 | 03-01, 03-02, 03-03, 03-05 | Chronicle supports checkpoints for partial replay/debugging | SATISFIED | Boundary snapshot contracts and builder snapshots support match, round, activation, contraction, match end, and terminal replay anchors. |
| REPLAY-05 | 03-01, 03-03, 03-05 | Replay utilities validate integrity and fail clearly on corrupted/version-incompatible data | SATISFIED | `validateChronicle`, `migrateChronicle`, and integrity tests return typed `ChronicleValidationError` codes for schema, version, order, snapshot, hash, and migration failures. |
| REPLAY-06 | 03-01, 03-04, 03-05 | Public replay projection excludes source, memories, and objective payloads by default | SATISFIED | Public projection strips private sections/refs and private payload keys; tests assert absence of strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness Grids, and raw runtime details. |
| REPLAY-07 | 03-01, 03-02, 03-04, 03-05 | Owner-only replay projection exposes available private debug data for owning Player | SATISFIED | Builder stores owner-private payloads by player; owner projection returns only selected player's private section; tests prove opponent private data is excluded. |
| TEST-03 | 03-03, 03-04, 03-05 | Replay tests verify Chronicle reconstruction and integrity validation | SATISFIED | Replay package has build, determinism, integration, integrity, project, reconstruct, and validate tests; all passed under `pnpm verify`. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| None | - | - | - | No blocker or warning anti-patterns found in Phase 3 implementation files. Empty arrays/objects are internal accumulators/defaults or tests, not user-visible stubs. |

### Human Verification Required

None. This phase produces library/runtime code rather than visual or external-service behavior, and all required checks were verifiable through code, tests, and static inspection.

### Notes

- The installed `gsd-sdk` in this checkout does not expose the `query` subcommands referenced by the verifier workflow, so roadmap, requirement, artifact, and key-link verification was performed directly from project files and code.
- Phase 3 is marked `Mode: mvp` in `ROADMAP.md`, but its goal is not a user-story sentence. This report follows the user's explicit Phase 3 technical verification request and the roadmap success criteria rather than generating MVP user-flow coverage.
- `packages/replay/README.md` says public projection preserves integrity metadata, while current code and review intentionally omit full integrity metadata from public projections to avoid exposing a private-content hash commitment. This is documentation wording drift, not a blocker for the phase goal; the code-review report records the omission as the accepted privacy-safe behavior.

### Gaps Summary

No blocking gaps found. The Phase 3 goal is achieved: Chronicles can be built from deterministic matches, normalized and hashed, validated with typed errors, reconstructed without runtime execution, and projected through public/owner privacy boundaries.

---

_Verified: 2026-05-16T15:47:18Z_
_Verifier: the agent (gsd-verifier)_
