# Phase 92: Runtime ABI v1.14 Contract - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `092-CONTEXT.md`

## Goal

Promote and validate `strategy-runtime-abi-v1.14` as the strict public ABI between deterministic server/native orchestration and hostile Strategy runtime code.

## Tasks

1. Promote ABI version and schemas.
   - Update runtime constants, schemas, fixtures, and boundary monitor expectations.
   - Add explicit request/response validation helpers if needed.

2. Lock method contexts.
   - `selectActivations` receives full deterministic `StrategyInput`.
   - `soldierBrain` receives local `SoldierBrainInput` with 5x5 Awareness Grid and optional objective.

3. Enforce request and response boundaries.
   - Validate source text/hash/bytes/entrypoint, runtime metadata, adapter/language/package metadata, capabilities, limits, and compatibility.
   - Validate JSON-only values, output caps, method-specific outputs, memory caps, and objective caps.

4. Lock failure taxonomy.
   - Separate preflight/product validation, runtime violations, and system failures.
   - Keep public messages separate from private diagnostics.

5. Add ABI fixtures.
   - JS/TS counted runtime, experimental Python metadata, invalid combinations, timeout, source-too-large, oversized output, malformed IPC, and redacted diagnostics.

## Verification

- Run spec runtime/schema tests.
- Run runtime-js adapter/executor tests affected by ABI schemas.
- Run boundary monitors for ABI drift.

## Exit Criteria

- ABI v1.14 is the only accepted runtime ABI.
- Method context expectations are tested.
- Failure taxonomy and diagnostic redaction are tested.
