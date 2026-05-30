# Phase 179 UI Spec

The result page should remain a work-focused result/evidence surface. It must show public lifecycle evidence without exposing private execution internals.

Required visible behaviors:

- Status copy distinguishes queued, running, complete, degraded, failed, and unavailable.
- Evidence rows show lifecycle state, terminality, retry disposition, result availability, and replay availability.
- Replay pages continue rendering public Chronicle projection only.
- Public pages must not display Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
