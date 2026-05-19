# Architecture Research: v1.2 Competitive Alpha

**Date:** 2026-05-19

## Integration Points

- `apps/web`: sign-in/sign-out UI, session-aware Workshop ownership, competitive entry screens, public result pages.
- `apps/web/app/workshop`: migrate persisted competitive submission ownership away from `player:workshop-local`.
- `apps/web/app/matches`: extend MatchSet server DTOs and result projection paths.
- `apps/worker`: continue executing Match jobs through existing runtime boundaries and classify strategy/system failures for competition policy.
- `packages/spec`: add shared schemas for User, session-visible owner identity, competitive presets, entries, scoring policy, publication policy, and result DTOs.
- `packages/replay`: reuse strict Chronicle validation, public projection, provenance, and privacy gates for public result evidence.
- `packages/runtime-js`: preserve adapter metadata and failure taxonomy; do not move Strategy execution into web/API processes.

## Data Flow

1. User signs in and receives a session.
2. User submits or selects an owned immutable Strategy Revision.
3. Competitive entry validates session, ownership, revision compatibility, preset, visibility, and duplicate snapshot policy.
4. MatchSet locks entrants as immutable snapshots.
5. Worker executes Matches through existing runtime boundaries.
6. Scoring policy consumes Match outcomes and failure classifications.
7. Public result DTO projects standings, evidence, provenance, and replay links without private Strategy data.
8. Authorized owner views can request private source or owner debug through server-side checks.

## Build Order

1. Ownership/session foundation.
2. MatchSet competition contracts and scoring policy.
3. Exhibition queue and seeding flows.
4. Public result pages and replay evidence.
5. Guardrail enforcement and tests.

## Constraints

- Keep engine logic pure and side-effect free.
- Do not put game rules or scoring rules in React components.
- Do not execute Strategy code in the web/API process.
- Do not use wall-clock time, database row order, worker scheduling, or random values for deterministic scoring or tie-breakers.
- Keep public result projection privacy-safe by default.
