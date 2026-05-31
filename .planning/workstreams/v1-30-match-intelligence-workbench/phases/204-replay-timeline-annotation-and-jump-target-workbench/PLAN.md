# Phase 204 Plan: Replay Timeline Annotation and Jump-Target Workbench

## Research

- Replay focus already accepts public sequence and moment query parameters.
- Timeline entries expose sequence, Round, Activation, Cycle, event type, public context, and public payload.

## Plan

1. Derive public-safe annotations from supported timeline events.
2. Render category filters and annotation rows in the replay workbench.
3. Add sequence-based focus links for each annotation.
4. Ensure unsupported or sparse evidence remains empty/low-signal instead of fake analysis.

## Verification

- `pnpm --filter @cowards/web test`
- v1.30 desktop/mobile Playwright proof.
