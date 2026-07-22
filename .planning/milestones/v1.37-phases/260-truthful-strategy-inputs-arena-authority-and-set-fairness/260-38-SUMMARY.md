---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "38"
subsystem: engine-runtime-inputs
tags: [strategy-input, soldier-brain-input, runtime-abi, historical-compatibility]
requires:
  - phase: 260-37
    provides: Selector-independent historical fixture identity
provides:
  - Exact ABI-addressed Strategy and SoldierBrain observation projection
  - Closed immutable v1.14 compatibility projection to the historical observation shape
affects: [260-39, 260-33]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 38: Exact Runtime-Input Projection Summary

**Explicit kernel entry points now project observations through their addressed runtime ABI instead of the selected current schema alias.**

## Accomplishments

- Resolved explicit v1.17 and v1.19 StrategyInput and SoldierBrainInput schemas from the spec-owned exact ABI resolvers.
- Kept omitted helper calls selector-backed and made effective v1.19 calls derive initiative and Advance fields from canonical state.
- Preserved immutable v1.14 compatibility execution through the unchanged historical observation shape.
- Added fail-closed unsupported-ABI coverage for both runtime-input helpers.
- Advanced the exact selector audit past all prior kernel execution failures to a separate replay-recorder metadata-resolution seam.

## Commits

- `e1b5d73` — `docs(260): preserve v1.14 observation compatibility`
- `2c4180a` — `fix(260-38): address runtime input schemas by ABI`

## Verification

- Observation, v1.4 compatibility, and replay suites passed 34/34 under the live v1.17 selector.
- Engine and Replay builds, focused lint/format, and the protected baseline passed.
- Exact v1.19 simulation completed kernel execution and retained an unchanged dependency tree before stopping at recorder metadata admission.
- Independent code review: PASS.

## Boundary disposition

No valid state, Action legality, event, outcome, terminal behavior, observation value, selector, Chronicle, adapter, or historical evidence changed. The exact audit's remaining recorder failure is routed to Plan 260-39.
