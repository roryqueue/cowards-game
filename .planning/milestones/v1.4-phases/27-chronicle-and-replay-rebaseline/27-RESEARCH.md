# Phase 27 Research: Chronicle and Replay Rebaseline

## Findings

- `packages/replay/src/build.ts` duplicated the old full-Activation scheduler,
  so Chronicle generation could diverge from the corrected engine unless it
  consumed engine Round transition summaries directly.
- `packages/replay/src/grammar.ts` assumed a single active Activation and needed
  to accept multiple selected slots with explicit Cycle/skip lifecycle events.
- Active fixtures and web replay tests still used `chronicle-v1`, which should
  be rejected by current validators under the v1.4 compatibility policy.
- Replay reconstruction treats lifecycle events as no-op visual transitions,
  while movement, push, fall, stone, and contraction events still carry board
  state changes.

## Implementation Risks

- Public replay output must expose safe slot/Cycle metadata without leaking
  Strategy source, StrategyMemory, SoldierMemory, Awareness Grids, or objective
  payloads.
- v1.4 validators must reject old Chronicle versions by default.
- Existing visual replay controls must continue to render labels and timeline
  entries for the new lifecycle event types.

