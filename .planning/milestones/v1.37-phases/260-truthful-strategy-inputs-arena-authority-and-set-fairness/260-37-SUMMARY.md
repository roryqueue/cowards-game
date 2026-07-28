---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "37"
subsystem: activation-audit
tags: [corpus, historical-runtime, semantic-identity, selector-independence]
requires:
  - phase: 260-36
    provides: Cache-inert isolated activation gate
provides:
  - Immutable v3 regeneration from the exact reviewed v2 baseline
  - Fixture-only historical runtime requests bound to the exact v1.17 tuple
affects: [260-38, 260-33]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 37: Selector-Independent Historical Identity Summary

**Immutable v3 review checks and fixture-only v1.17 runtime requests no longer inherit the selected current identity.**

## Accomplishments

- Bound observation-v3 generation, semantic diff, and committed-byte checks to the exact immutable v2 corpus path, root, and file hash.
- Kept the general future-candidate writer selected-current based while making v3 regeneration idempotent after v3 promotion.
- Replaced the current tuple alias in the fixture-only authenticated historical runtime request with the exact v1.17 tuple and ABI.
- Advanced the exact selector audit past both identity seams without changing either corpus evidence file or any production adapter.
- Routed the newly exposed production observation-schema dispatch seam to separately reviewed Plan 260-38.

## Commit

- `b34aec7` — `fix(260-37): bind historical identity explicitly`

## Verification

- Generator, Golden, fixture-helper, and replay suites passed 51/51.
- Engine and Replay builds, focused lint/format checks, and the protected baseline passed.
- Independent code review: PASS.

## Boundary disposition

No selector, corpus evidence byte, runtime ABI, production adapter, valid Match behavior, Chronicle, Strategy observation, or historical result changed. The exact audit's later runtime-input failure predates and is outside this plan.
