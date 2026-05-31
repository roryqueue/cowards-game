# Phase 206 Plan: Public Intelligence State Coverage

## Research

- Frozen fixtures cover queued, running, degraded/failure categories, unavailable runtime, malformed result, stale artifact, missing Chronicle, and no-result states.
- Replay unavailable pages should not render tactical panels.

## Plan

1. Map lifecycle/failure categories to state-specific intelligence copy.
2. Ensure pending and unavailable states expose limits instead of tactical claims.
3. Ensure unavailable replay intelligence is empty and confidence `none`.
4. Add browser and machine-proof coverage across all fixture states.

## Verification

- `pnpm match-execution:intelligence:check`
- v1.30 desktop/mobile Playwright proof.
