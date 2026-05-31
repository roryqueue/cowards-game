# Phase 202 Plan: Fixture-Backed Intelligence Derivation Adapter

## Research

- Existing result/replay helpers are pure app code and already consume public DTOs/projections.
- A single app-side adapter can derive both result and replay intelligence without putting rules in React components or touching engine/runtime ownership.

## Plan

1. Add a pure `apps/web/app/match-intelligence.ts` adapter.
2. Derive availability and confidence bands for result and replay evidence.
3. Derive result comparison rows, replay jump candidates, annotations, Soldier progression, board-control, terrain/STONE, and action-mix panels.
4. Return explicit unavailable/low-signal states rather than inferred tactics.
5. Add unit tests for frozen result fixtures, canonical replay scenarios, unavailable states, and private marker safety.

## Verification

- `pnpm --filter @cowards/web test`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web lint`
