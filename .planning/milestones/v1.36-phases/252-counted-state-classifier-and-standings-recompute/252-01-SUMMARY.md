---
phase: 252-counted-state-classifier-and-standings-recompute
plan: 01
subsystem: spec-persistence-contract
tags: [competition, counted-state, standings, schema, migration, privacy]
requires: [phase-251]
provides:
  - Canonical ten-state counted-result classifier
  - Public state copy, standings effect, and evidence availability projection
  - Typed MatchSet, result, and standing evidence contracts
  - Repeatable expanded counted-state storage constraints
affects: [252-02, 252-03, 253, 254, 255]
requirements-completed: [RESULT-01, RESULT-02, RESULT-04]
completed: 2026-07-11
---

# Phase 252 Plan 01 Summary

## Accomplishments

- Added the pure `competition-counted-state-v1.36` classifier with governance precedence and all ten locked public states.
- Required complete execution, positive expected Match count, complete Chronicle coverage, and scoring evidence before a result can classify as counted.
- Added calm public label, explanation, standings effect, evidence availability, public reason, and privacy guard projections.
- Extended public ladder summaries, MatchSet results, and standings contracts with typed competition evidence while keeping exhibition result metadata optional.
- Added repeatable storage constraints for the complete counted-state and public-reason vocabularies.

## Commit

- `a5b1559` - Define the counted-state contract, schemas, tests, and migration.

## Verification

- Focused counted-state and spec tests passed, 57 tests.
- Spec typecheck passed.
- `pnpm v1.36:competition-policy:check` passed.

## Boundaries

No scoring rules, tie-break order, deterministic game rules, Strategy execution, runtime ownership, durable rating promises, or private governance diagnostics changed.
