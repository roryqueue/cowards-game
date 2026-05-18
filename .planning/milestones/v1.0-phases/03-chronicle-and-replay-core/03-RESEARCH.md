---
phase: 3
slug: chronicle-and-replay-core
status: complete
created: 2026-05-16
---

# Phase 3 Research: Chronicle and Replay Core

## Implementation Findings

Phase 3 should turn Phase 2 `TransitionEventSummary[]` output into a canonical Chronicle artifact without putting a Chronicle log into `GameState`. The existing package boundaries are a good fit:

- `packages/spec` should own Chronicle contracts and Zod schemas because later worker, persistence, UI, and replay packages need the same artifact definition.
- `packages/engine` should keep pure transition logic but may enrich emitted transition summaries with deterministic context and private payload candidates that the Chronicle builder stores in gated sections.
- `packages/replay` should own Chronicle construction, normalization, hashing, validation, reconstruction, projections, and replay-facing APIs.

The highest-risk integration point is Awareness Grid/debug recording. `resolveActivation` currently emits only `{ soldierId, cycleIndex }` for `AWARENESS_GRID_OBSERVED`. To satisfy D-29 through D-33, Phase 3 needs the exact `SoldierBrainInput.awarenessGrid`, active Soldier ID, cycle index, objective reference/context, sequence, and owner-only memory/debug payloads before projection. This can be done by enriching engine summary payloads and assigning privacy during Chronicle construction; the public projection must strip exact grids, objectives, memories, and raw runtime messages.

Replay reconstruction should treat the Chronicle as recorded truth, not as permission to rerun strategies. Boundary snapshots provide the state anchors; semantic events advance board truth between anchors; validation compares reconstructed state to the next boundary snapshot and returns typed errors for corruption, version incompatibility, missing events, ordering breaks, and snapshot mismatches.

## Recommended File Layout

| Area | Files |
|------|-------|
| Chronicle contracts | `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/index.ts`, `packages/spec/src/spec.test.ts` |
| Engine summary enrichment | `packages/engine/src/types.ts`, `packages/engine/src/match.ts`, `packages/engine/src/activation.ts`, `packages/engine/src/movement.ts`, `packages/engine/src/backstab.ts`, `packages/engine/src/contraction.ts`, `packages/engine/src/outcome.ts` |
| Replay implementation | `packages/replay/src/index.ts`, `packages/replay/src/build.ts`, `packages/replay/src/normalize.ts`, `packages/replay/src/hash.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/project.ts` |
| Replay tests | `packages/replay/src/*.test.ts`, `packages/test-utils/src/engine-scenarios.ts` |

## Validation Architecture

Phase 3 tests should cover contracts, construction, reconstruction, integrity, deterministic normalization, and privacy boundaries:

- Spec schema tests prove Chronicle envelope, boundary snapshots, private sections, projection descriptors, integrity metadata, and typed validation errors parse.
- Engine/replay integration tests build Chronicles from deterministic matches and assert required events and boundary snapshots exist.
- Reconstruction tests use `stateAt(sequence)` and a linear iterator to reconstruct board truth and final outcome without strategy runtime calls.
- Integrity tests corrupt events, versions, hashes, and snapshots and assert typed structured errors.
- Projection tests assert public output retains board truth and public markers while removing strategy source, StrategyMemory, SoldierMemory, objective payloads, exact Awareness Grids, and raw runtime details.
- Determinism tests compare normalized Chronicles and content hashes for identical inputs, not byte-for-byte raw artifacts.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Public projection leaks private strategy data | Add explicit public and owner projection tests that stringify output and search for known private marker values. |
| Replay builder drifts from engine behavior | Build Chronicle from actual engine-run summaries and snapshots; parity-test final outcome against `runMatch`. |
| Hashes include nondeterministic storage metadata | Define a normalized deterministic content shape and exclude wall-clock or persistence metadata from the hash path. |
| Version errors become raw throws | Return typed errors from validation/reconstruction APIs and test incompatible schema/chronicle versions. |
| Strict grammar scope expands Phase 3 | Enforce required canonical event set and broad ordering only; defer exhaustive grammar/fuzzing to post-Phase-7 hardening. |

## Non-Goals

- No visual replay viewer.
- No persistence schema or blob storage.
- No worker orchestration.
- No runtime sandbox implementation.
- No strict exhaustive Chronicle grammar, legal/illegal fixture corpus, or real migration implementation.
