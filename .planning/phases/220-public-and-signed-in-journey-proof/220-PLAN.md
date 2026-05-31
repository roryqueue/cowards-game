# Phase 220 Plan: Public and Signed-In Journey Proof

## Tasks

1. Add Playwright proof for anonymous discovery, competition, entry gate, learn, workshop, and account journeys.
2. Run on desktop and mobile.
3. Use fixture-backed public evidence only when test fixtures are explicitly enabled.

## Verification

- `PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile -- v1-31-public-site-spine.spec.ts`
- In-app Browser visual QA.
