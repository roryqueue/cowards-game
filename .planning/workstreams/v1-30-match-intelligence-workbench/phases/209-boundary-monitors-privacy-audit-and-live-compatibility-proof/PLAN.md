# Phase 209 Plan: Boundary Monitors, Privacy Audit, and Live Compatibility Proof

## Research

- v1.29 already had a proof artifact and monitor pattern.
- v1.30 needs equivalent checks for intelligence derivation, fixture coverage, privacy, board realism, DTO shapes, and non-claims.

## Plan

1. Add `scripts/evaluate-v1-30-match-intelligence-workbench.ts`.
2. Add package scripts for write/check modes.
3. Extend `scripts/check-boundary-monitors.ts` with v1.30 proof checks.
4. Generate JSON/Markdown proof artifacts.
5. Record local page links for fixture-backed and live-compatible inspection.

## Verification

- `pnpm match-execution:intelligence`
- `pnpm match-execution:intelligence:check`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
