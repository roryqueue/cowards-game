# Phase 137: Degraded-State UX and Public-Safe Reliability Evidence - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Improve existing MatchSet and replay evidence panels so repeated Python exhibition states, retry/no-retry semantics, budget cues, candidate evidence limits, and privacy guarantees are understandable without exposing private runtime details.

## Tasks

1. Add a pure reliability evidence helper for MatchSet and replay copy.
2. Wire MatchSet evidence rows into the existing `matchset-evidence-panel`.
3. Wire replay evidence rows into the existing `replay-evidence-panel`.
4. Add focused tests for queued/running/degraded/failed/state copy, retry semantics, candidate lane limits, and privacy exclusions.
5. Run web-focused tests, typecheck where practical, and boundary monitors.

## Verification

- `pnpm exec vitest run apps/web/app/matchsets/evidence-copy.test.ts`
- `pnpm --filter @cowards/web typecheck`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
