# Phase 207 Plan: Owner/Test-Only Gated Deeper Analysis Review

## Research

- Owner debug currently remains gated through `ownerDebug`, owner authorization, and explicit toggle controls.
- The new public intelligence adapter does not consume `ownerPrivate`, Awareness Grid, or Soldier inactivity explanations.

## Plan

1. Keep default public intelligence separate from owner debug surfaces.
2. Add tests and proof marker scans that fail on owner/private/debug markers.
3. Confirm owner/test-only controls remain absent in default public replay output.

## Verification

- `pnpm --filter @cowards/web test`
- `pnpm match-execution:intelligence:check`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
