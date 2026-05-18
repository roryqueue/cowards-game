---
phase: 1
plan: 01-03
title: Canonical Spec Contracts and Fixtures
requirements:
  - FOUND-05
  - SPEC-01
  - SPEC-02
  - SPEC-03
  - SPEC-04
  - SPEC-05
implementation_commit: 2303a50
status: completed
---

# Summary: Canonical Spec Contracts and Fixtures

Implemented `@cowards/spec` as the canonical contract package for Phase 1.

## Completed

- Added canonical constants for board size, activation cycles, source and memory limits, and initial soldier positions.
- Added TypeScript types for players, strategies, revisions, soldiers, arena variants, match data, runtime inputs/outputs, actions, violations, events, and compatibility versions.
- Added Zod schemas for runtime-facing inputs, outputs, actions, chronicles, versions, and supporting data structures.
- Added compatibility versions with the core six fields: `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`.
- Added valid fixture builders and canonical scenarios for blocked movement, side push, Backstab, off-board fall, contraction, and no-advance stoning.
- Added invalid fixtures for malformed direction/action/status, duplicate activations, and oversized objective payloads.

## Verification

- `@cowards/spec` test suite passed: 5 tests.
- `pnpm verify` passed.
- Acceptance checks confirmed constants, discriminated unions, schemas, compatibility fields, and fixture exports.

## Deviations

- Gameplay resolution behavior is represented as fixtures only; actual rule execution remains Phase 2 scope.
