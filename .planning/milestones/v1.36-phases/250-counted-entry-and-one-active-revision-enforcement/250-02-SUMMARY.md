---
phase: 250-counted-entry-and-one-active-revision-enforcement
plan: 02
subsystem: persistence
tags: [counted-entry, provider-proof, season-entry, privacy, vitest]

requires:
  - phase: 250-01
    provides: spec-owned counted entry eligibility categories and public remediation copy
provides:
  - Persistence-owned counted trial entry eligibility evaluator
  - Category-bearing public-safe LadderInputError
  - Full owner-per-Season preflight and PostgreSQL race fallback
  - Immutable revision, provider proof, runtime, engine, package, and capability enforcement
affects: [phase-250-03, phase-251, phase-255]

key-files:
  modified:
    - packages/persistence/src/ladder.ts
    - packages/persistence/src/ladder.test.ts

requirements-completed: [ELIG-01, ELIG-02, ELIG-03, ELIG-04, ELIG-05]

completed: 2026-07-11
---

# Phase 250 Plan 02 Summary

Counted trial Season entry now consumes the Phase 250 spec contract and fails closed with stable public-safe categories before persistence mutation.

## Accomplishments

- Added `evaluateCountedEntryEligibility` for Season state, owner, validation, immutability, supported lane, runtime registry/ABI, engine compatibility, package/capability policy, and provider-proof checks.
- Reworked `LadderInputError` to carry category, public message, and remediation without low-level provider or database details.
- Preserved the full `unique(season_id, owner_user_id)` policy and added preflight handling that blocks active duplicates plus withdrawn/invalidated replacement attempts.
- Added PostgreSQL `23505` race fallback that re-reads public entry state and emits `already_entered_season` or `replacement_blocked`.
- Stored the already-locked revision timestamp and public runtime semantics in the Season entrant snapshot.

## Commits

1. `1bfff0a` - RED tests for the counted entry eligibility matrix and replacement/race behavior.
2. `a7d8178` - GREEN persistence implementation and local type fixes.

## Verification

- `pnpm exec vitest run packages/persistence/src/ladder.test.ts packages/spec/src/competition-entry-eligibility.test.ts` - passed, 32 tests.
- `git diff --check` - passed before commit.
- `pnpm --filter @cowards/persistence typecheck` - the Phase 250-02 errors were fixed; command remains red on pre-existing errors in `packages/spec/src/match-execution-contract.ts`, `packages/spec/src/runtime.ts`, `packages/persistence/src/competition.ts`, `packages/persistence/src/competition.test.ts`, and `packages/persistence/src/profiles.ts` concerning runtime semantics typing.

## Deviations from Plan

- A stalled subagent left a complete uncommitted GREEN implementation. The main agent reviewed it, fixed two local typing issues plus the required snapshot runtime semantics field, reran tests, and committed the result.
- No schema migration was added because migration `0004_competition_trust_beta.sql` already contains the required full owner/Season uniqueness invariant.

## Privacy and Runtime Boundaries

- Entry consumes stored validation/provider evidence only; it does not build or execute Strategy code.
- Public failures use spec-owned category/remediation copy and do not expose constraint names, proof material, artifact bytes, paths, environment values, tokens, or private runtime details.

## Self-Check: PASSED

- Required files exist and are committed.
- Focused tests pass.
- Full owner/Season uniqueness remains intact.
- Plan 250-03 can consume the category-bearing persistence errors.
