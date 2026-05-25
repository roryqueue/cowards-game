---
phase: 130
status: executed
requirements: [PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06, PROOF-07, PROOF-08]
---

# Phase 130 Plan

## Objective
Add a realistic signed-in proof covering one JS/TS revision, two Python revisions, mixed Python-vs-JS/TS exhibition, Python-vs-Python exhibition, result evidence, replay evidence, and private leak scans.

## Tasks
1. Create a gated Playwright proof spec for v1.19.
2. Save one JS/TS and two Python Strategy Revisions through signed-in APIs.
3. Create non-counted exhibitions for mixed and Python-only revision sets.
4. Run Go match jobs through the runtime service path.
5. Open result and replay evidence panels and scan for private markers.

## Verification
- `pnpm --filter @cowards/web test -- matchset replay workshop-client.test.tsx`
- Live proof: `RUN_V1_19_PROOF=1 PLAYWRIGHT_TEST=1 COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_GO_BACKEND_INTERNAL_TOKEN=v119-proof-token pnpm e2e v1-19-exhibition-proof.spec.ts --project=desktop --workers=1`
