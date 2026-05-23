# Phase 92: Runtime ABI v1.14 Contract - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 92 defines `strategy-runtime-abi-v1.14` as the strict public interface between deterministic server/native orchestration and hostile Strategy runtime code.

This phase should define schemas, taxonomy, fixtures, and migration expectations. It should not move execution into Go/web/API, promote non-JS counted play, or optimize runtime architecture before the boundary is correct.

## Approved Decisions

### D-01 ABI Version

Promote the public ABI string from `strategy-runtime-abi-v1.7` to `strategy-runtime-abi-v1.14`.

The promotion must include compatibility tests and explicit migration expectations so stale runtime metadata, fixtures, and monitors fail loudly.

### D-02 Method Set

Keep the v1.14 ABI method set narrow:

- `selectActivations`
- `soldierBrain`

Each method must use method-specific request envelopes and response schemas.

### D-03 `selectActivations` Context

`selectActivations` receives the existing deterministic `StrategyInput` shape inside the ABI request envelope:

- `phaseNumber`
- `roundNumber`
- `activationCount`
- `board` with bounds, Soldier snapshots, and terrain stones
- `mySoldiers`
- `enemySoldiers`
- `strategyMemory`

It gets the full deterministic board snapshot and convenience projections for friendly/enemy Soldiers. It does not get the 5x5 Awareness Grid, sessions, DB details, source internals beyond the outer ABI envelope, runtime private diagnostics, owner-only fields, host paths, wall-clock time, randomness, or host environment.

`selectActivations` returns activation orders with `soldierId` and optional JSON `objective`. Those objectives become the bounded per-Soldier context passed to `soldierBrain`.

### D-04 `soldierBrain` Context

`soldierBrain` receives the existing local `SoldierBrainInput` shape:

- `self`
- 5x5 `awarenessGrid`
- `cycleIndex`
- `maxCycles`
- optional Strategy-produced `objective`
- `soldierMemory`

The 5x5 Awareness Grid remains `soldierBrain`-only.

### D-05 Request Validation

Request validation must enforce:

- Source text, hash, byte count, byte cap, and entrypoint.
- Runtime metadata.
- Adapter ID and version.
- Language ID and version.
- Package mode and package metadata.
- Required capabilities.
- Effective limits.
- Runtime/source/engine/spec compatibility.

### D-06 Response Validation

Response validation must enforce:

- JSON-only values.
- Output byte caps.
- Method-specific output shape.
- StrategyMemory caps.
- SoldierMemory caps.
- Objective payload caps.

### D-07 Failure Taxonomy

Use one spec-owned taxonomy that separates:

- Preflight/product validation failures.
- Player-caused runtime violations.
- System failures.

Public messages must be separated from private diagnostics. Private diagnostics must not leak by default through public/service/Go/topology/monitor outputs.

### D-08 Experimental Runtime Metadata

Experimental Python/non-JS metadata may remain schema-valid for fixtures and evidence, but it must be non-counted and non-promoted by default.

### D-09 ABI Fixtures

Add ABI fixtures for:

- JS/TS counted runtime.
- Experimental Python/non-JS metadata.
- Invalid language/adapter/package combinations.
- Timeout.
- `SOURCE_TOO_LARGE`.
- Oversized output.
- Malformed IPC.
- Redacted diagnostics.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/090-generic-strategy-artifact-contract/090-CONTEXT.md`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/schemas.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/spec.test.ts`
- `packages/engine/src/runtime-inputs.ts`
- `packages/engine/src/activation.ts`
- `packages/runtime-js/src/adapter.ts`
- `packages/runtime-js/src/executor.ts`
- `packages/runtime-js/src/subprocess-ipc.ts`
- `packages/runtime-js/src/subprocess-harness.ts`
- `packages/runtime-js/src/adapter-contract.test.ts`
- `packages/runtime-js/src/hostile-matrix.test.ts`
- `apps/worker/src/runtime-config.ts`
- `scripts/check-boundary-monitors.ts`

## Codebase Context

Current ABI state:

- `STRATEGY_RUNTIME_ABI_VERSION` is currently `strategy-runtime-abi-v1.7`.
- Runtime request envelopes already discriminate `selectActivations` and `soldierBrain`.
- `StrategyInputSchema` is the full-board activation selection context.
- `SoldierBrainInputSchema` is the local Awareness Grid action context.
- Runtime metadata already includes language, adapter, package, capabilities, limits, and compatibility dimensions.

Current taxonomy state:

- Runtime responses already distinguish success, runtime violation, and system failure envelopes.
- Product validation codes include unsupported language/package/adapter, ABI mismatch, source size, memory limits, timeout, forbidden capability, and non-counted runtime.
- Existing runtime-js adapters already map timeout, malformed IPC, subprocess exit/signal, spawn failure, and oversized stdio/output cases.

Design pressure:

- v1.14 must make the ABI public and strict enough for future Go/native orchestration without letting Go/web/API execute hostile Strategy code.
- Boundary monitors currently check ABI/version and adapter drift; Phase 92 should turn those into deliberate contract tests rather than accidental monitor knowledge.

## Planning Notes

Planning should cover:

- ABI version migration and fixture updates.
- Zod schema changes and TypeScript type exports.
- Method-specific response validation if current success envelope remains generic.
- Preflight versus runtime violation versus system failure mapping.
- Diagnostics redaction tests.
- Limit alignment with runtime-js and worker config.
- Boundary monitor updates for ABI drift.
- Explicit docs/comments for full-board activation selection versus local SoldierBrain context.

## Deferred To Later Phases

- Phase 93 owns JS runtime adapter conformance to the v1.14 ABI or an explicit bridge.
- Phase 94 owns Go artifact/fork consumption, not runtime execution.
- Phase 95 owns final privacy/topology/monitor gate evidence.
