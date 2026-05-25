# Phase 113 Research: Python Runtime Execution Behind Broker ABI

**Date:** 2026-05-25
**Status:** Complete

## Findings

- Engine `StrategyRuntime` is synchronous, so the existing async Python subprocess helper cannot be plugged into full Match execution as-is.
- `apps/runtime-service/src/execute-match.ts` is the correct place to construct per-side runtimes and already dispatches by player side.
- A synchronous subprocess helper in `packages/runtime-python` can fit the current engine without moving Strategy execution into Go/web/API.
- Python runtime responses must be parsed through `StrategyRuntimeResponseEnvelopeSchema` and then normalized through `StrategyResultSchema` / `SoldierBrainResultSchema`.

## Risks

- Spawn-per-method is slow but acceptable for an experimental non-counted pilot.
- System failures from Python subprocesses need to surface as runtime-service system failures, not public stack/stderr leaks.
- Mixed JS/TS and Python matches require side-specific runtime selection.

## Recommended Tests

- Runtime-python sync execution tests for success, invalid output, timeout, import failure, malformed IPC, crash, and stderr redaction.
- Runtime-service full Match test with Python vs JS/TS.
- Runtime-service failure taxonomy tests for unsupported runtime and no fallback.

