---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "35"
subsystem: strategy-observation-fixtures
tags: [strategy-input, initiative, advance-state, compatibility]
requires:
  - phase: 260-34
    provides: Exact v3 corpus admission and isolated activation gate
provides:
  - Closed-version-complete shared Strategy and SoldierBrain fixture sources
  - Exact released-v1.17 stripping and candidate-v1.19 retention proof
affects: [260-36, 260-33, 260-14]
requirements-completed: [STRAT-01, STRAT-02]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 35: Versioned Observation Fixture Summary

**The shared observation fixtures now carry truthful successor facts while exact v1.17 parsing preserves the released field set.**

## Accomplishments

- Added initial initiative `bottom`, Round initiative `bottom`, and the matching bottom-observer relative flags `true`/`true` to the standard round-one Strategy source literal.
- Added authoritative pre-Action `hasAdvancedThisActivation: false` to the standard SoldierBrain source literal.
- Proved exact v1.17 schemas strip all five successor-only fields.
- Proved exact v1.19 schemas retain the complete values and reject partial inputs.
- Advanced the exact five-selector simulation past the shared-fixture import seam.

## Commit

- `66c5c65` — `fix(260-35): complete versioned observation fixtures`

## Verification

- Spec contract: 49/49 tests passed.
- Spec build and focused ESLint passed.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Independent code review: PASS.

## Boundary disposition

No schema was relaxed, no default or inference was added, and no Match state, Action legality, event order, outcome, runtime ownership, public output, or historical evidence changed. The next isolated audit failure is a separate Vitest cache mutation routed to Plan 260-36.
