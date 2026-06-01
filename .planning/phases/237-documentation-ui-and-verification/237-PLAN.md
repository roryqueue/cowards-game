# Phase 237 Plan: Documentation, UI, and Verification

## Tasks

1. Update supported language registry labels, provider evidence, and contract version.
2. Update runtime cues, Learn copy, and MatchSet evidence copy.
3. Redact artifact bytes from public Workshop summaries.
4. Update boundary monitor expectations for v1.33 artifact provenance.
5. Run typecheck, targeted tests, Go tests, spike check, and browser review.

## Verification

- `pnpm typecheck`
- `pnpm --filter @cowards/web test -- runtime-labels.test.ts learn/page.test.ts matchsets/evidence-copy.test.ts matchsets/result-view-model.test.ts workshop/server.test.ts --runInBand`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- Browser review of `/learn#supported-languages` and `/workshop`
