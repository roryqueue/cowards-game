# Phase 211 Plan

## Goal

Improve public result state explanations using existing public MatchSet summary data only.

## Scope

- Add player-facing result-state copy for complete, queued, running, degraded, failed, unavailable-runtime, malformed-runtime-result, stale-artifact, missing-Chronicle, and no-result states.
- Replace enum-ish Match ledger fallback labels with public-safe labels.
- Preserve canonical terms and avoid private field names, raw diagnostics, recovery/quarantine/operator details, runtime internals, and DTO additions.

## Verification

- Focused unit tests in `apps/web/app/matchsets/evidence-copy.test.ts`.
- Public page proof in Playwright fixture specs.
