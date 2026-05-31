# Phase 205 Plan: Soldier Status, Board-Control, Terrain/STONE, and Action-Mix Panels

## Research

- Replay snapshots include public board states with Soldier status, position, bounds, terrain stones, and outcomes.
- FALLEN Soldiers must not count as board occupants.

## Plan

1. Derive Soldier progression from final public board state and public event involvement.
2. Derive board control from visible ACTIVE and STONE Soldiers only.
3. Derive terrain/STONE and action-mix summaries from public snapshots/events.
4. Render tactical panels in the replay inspector rail.
5. Prove board realism with existing and v1.30 browser checks.

## Verification

- `pnpm --filter @cowards/web test`
- `PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile --workers=1 replay.visual.spec.ts`
