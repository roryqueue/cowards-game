# Phase 216 Verification

Status: Passed.

- `pnpm --filter @cowards/web test`
- `PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile -- v1-31-public-site-spine.spec.ts`
