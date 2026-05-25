# Phase 138: Signed-In Reliability Proof and JS/TS Regression Gate - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Run a realistic signed-in v1.20 reliability proof that creates account-owned JS/TS and Python Strategy Revisions, executes mixed and Python-vs-Python non-counted exhibitions through Go and the runtime service, verifies result/replay evidence, records timing/candidate evidence, and proves JS/TS support remains intact.

## Tasks

1. Add a gated v1.20 Playwright proof derived from the v1.19 proof.
2. Create one local account and one JS/TS plus two Python revisions per bounded cycle to avoid active duplicate exhibition guardrails.
3. Create mixed JS/TS-vs-Python and Python-vs-Python non-counted exhibitions for three cycles.
4. Run Go worker iterations through the live Go backend and runtime service, then settle MatchSets within the documented MatchSet/browser budgets.
5. Open result and replay pages and assert evidence panels, non-counted labels, timeout/candidate evidence, replay board plausibility, and private marker safety.
6. Emit v1.20 proof JSON/Markdown artifacts with observed statuses, page timings, candidate evidence, and conservative promotion decision.
7. Fix any reliability issue surfaced by the proof without weakening per-Strategy execution caps or ownership boundaries.
8. Extend boundary monitors and focused tests to require the proof artifact and Go runtime-service lease alignment.

## Verification

- `pnpm --filter @cowards/web typecheck`
- `PATH=/usr/local/go/bin:$PATH go test ./...` from `apps/go-backend`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matchsets/evidence-copy.test.ts`
- `RUN_V1_20_PROOF=1 ... pnpm e2e --project=desktop --workers=1 v1-20-reliability-proof.spec.ts`
