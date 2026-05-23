# Phase 92: Runtime ABI v1.14 Contract - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 92 - Runtime ABI v1.14 Contract

## Discussion Summary

Phase 92 discussion confirmed the recommended runtime ABI defaults and clarified what `selectActivations` receives as context. The user approved the phase after confirming that `selectActivations` should continue to receive the deterministic full-board `StrategyInput`, while the 5x5 Awareness Grid remains reserved for `soldierBrain`.

## Decisions

### 1. ABI Version

Decision: promote the ABI string from `strategy-runtime-abi-v1.7` to `strategy-runtime-abi-v1.14`.

Rationale: v1.14 is explicitly about freezing the artifact/runtime boundary contract; stale metadata should fail loudly.

### 2. Method Set

Decision: keep the public ABI method set to `selectActivations` and `soldierBrain`.

Rationale: these are the current deterministic Strategy entrypoints and match engine expectations.

### 3. `selectActivations` Context

Decision: pass the existing `StrategyInput` as the Strategy-visible activation-selection context: phase, round, activation count, full board snapshot, friendly/enemy Soldier projections, and bounded StrategyMemory.

Rationale: activation selection is where Strategies make full-board tactical choices and assign bounded objectives to activated Soldiers.

### 4. `soldierBrain` Context

Decision: keep local perception in `soldierBrain`: self snapshot, 5x5 Awareness Grid, cycle index, max cycles, optional objective, and bounded SoldierMemory.

Rationale: the engine already distinguishes strategic selection from local per-cycle action; the ABI should preserve that deterministic boundary.

### 5. Request Validation

Decision: enforce source, runtime metadata, adapter/language/package metadata, capabilities, limits, and compatibility at the request boundary.

Rationale: behavior-significant runtime dimensions must be validated before hostile code runs.

### 6. Response Validation

Decision: enforce JSON-only values, output caps, method-specific output shape, memory caps, and objective payload caps.

Rationale: hostile Strategy output must stay deterministic, bounded, and schema-valid before the deterministic engine consumes it.

### 7. Failure Taxonomy

Decision: use one spec-owned taxonomy separating preflight/product validation, player-caused runtime violations, and system failures, with public messages separated from private diagnostics.

Rationale: replay, Match completion, retry behavior, and public output safety depend on consistent classification.

### 8. Experimental Runtime Metadata

Decision: keep experimental Python/non-JS metadata valid for fixtures where source-safe, but non-counted and non-promoted by default.

Rationale: future language metadata belongs in the ABI, but runtime support and product support are separate decisions.

### 9. ABI Fixtures

Decision: cover counted JS/TS, experimental Python/non-JS metadata, invalid combinations, timeout, source-too-large, oversized output, malformed IPC, and redacted diagnostics.

Rationale: the ABI needs executable evidence for success, validation, hostile-output, and system-failure paths.

## Deferred Ideas

None.
