# Phase 38 Plan: Analytics Evidence Model

## Goal
Define stable, privacy-safe summary DTOs for saved gauntlet profiles, profile runs, matchup records, evidence bands, archetype tags, replay moment references, compatibility keys, and export summaries.

## Decisions Locked
- Contracts live in `packages/spec/src/analytics.ts`, with Zod schemas exported from `packages/spec/src/schemas.ts`.
- Evidence reliability order is `system_failed` > `degraded_non_counted` > `thin` > `strong`.
- Compatibility is strict deterministic identity and produces structured mismatch codes plus a canonical hash.
- Replay references contain public projection coordinates only: Match id, moment type, sequence, label, side, and fallback state.

## Tasks
- Add analytics constants, DTO types, and schemas.
- Export the contracts from `@cowards/spec`.
- Add focused tests that reject raw private runtime fields and validate evidence-band precedence.

## Verification
- `pnpm --filter @cowards/spec test`
- Typecheck dependent packages after Phase 39 introduces persistence usage.
