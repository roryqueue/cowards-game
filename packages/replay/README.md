# @cowards/replay

Replay owns the Chronicle lifecycle outside the pure engine. It builds
canonical Chronicle artifacts from deterministic Match execution, validates and
hashes replay content, reconstructs board state from recorded events, and
projects public or owner-scoped replay views.

## Chronicle Construction

Use `buildChronicleFromMatch(input)` to execute a deterministic Match through
the engine runtime boundary and capture a versioned Chronicle. The builder
records the reproducibility envelope, semantic event stream, boundary snapshots,
and owner-only private sections without storing Chronicle state in `GameState`.

Use `buildChronicleFromResult({ input, result })` only when adapting an existing
engine result. It can preserve terminal replay content, but full intermediate
boundary snapshots require `buildChronicleFromMatch`.

## Validation and Integrity

Use `normalizeChronicle(chronicle)` when comparing deterministic Chronicle
content. Normalization includes replay-relevant Chronicle data and excludes
storage metadata and existing integrity metadata.

Use `createChronicleContentHash(chronicle)` to compute a sha256 hash over the
normalized Chronicle content. Use `validateChronicle(chronicle)` before replay
or projection to check schema compatibility, required completed-Match events,
boundary snapshots, event ordering, supported versions, and optional integrity
metadata.

Validation failures return structured Chronicle errors instead of raw throws.
`assertChronicleCompatible(chronicle)` is available for callers that prefer an
exception after validation fails.

## Reconstruction

Use `createReplay(chronicle)` to reconstruct replay state from Chronicle
snapshots and semantic events. The replay API exposes:

- `stateAt(sequence)` for direct timeline lookup.
- `iterateReplay()` for ordered event/state playback.

Reconstruction treats Chronicle data as the recorded truth. It does not rerun
strategies, call the StrategyRuntime, or depend on strategy source code.

## Projections

Use `projectPublicChronicle(chronicle)` for default public replay output. Public
projection preserves board truth, event markers, snapshots, outcomes, and
integrity metadata while stripping private refs, exact Awareness Grids,
objective payloads, StrategyMemory, SoldierMemory, strategy source, and raw
runtime details.

Use `projectOwnerChronicle(chronicle, playerId)` for owner debug views. Owner
projection includes the public projection plus only that player's private debug
section.

Use `projectChronicle(chronicle, viewer)` when dispatching from a
`ChronicleViewer` descriptor.

## Phase 3 Non-Goals

- No visual replay viewer.
- No persistence schema or Chronicle blob storage.
- No worker orchestration or queue integration.
- No real Strategy runtime sandbox implementation.
- No strict exhaustive Chronicle grammar or migration implementation.
