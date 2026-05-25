# Phase 138: Signed-In Reliability Proof and JS/TS Regression Gate - Research

**Status:** Complete
**Date:** 2026-05-25

## Sources Read

- `apps/web/e2e/v1-19-exhibition-proof.spec.ts`
- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`
- `apps/web/app/api/exhibitions/route.ts`
- `apps/go-backend/orchestrator.go`
- `apps/go-backend/job_lifecycle.go`
- `apps/go-backend/runtime_service_client.go`
- `apps/runtime-service/src/execute-match.ts`
- `.planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.container.json`
- `.planning/artifacts/v1.20-runtime-reliability-budgets.json`

## Findings

- The v1.19 proof shape was the right base: signed-in account, one JS/TS revision, two Python revisions, non-counted exhibitions, result/replay evidence, and private marker scans.
- v1.20 needs repeated proof cycles, candidate evidence assertions, observed terminal MatchSet status capture, and explicit timing evidence.
- The product blocks duplicate active exhibitions for the same revision tuple, so the repeated proof creates a fresh local account and fresh immutable revision set for each bounded cycle.
- Result pages can become replay-visible while a sibling Match is still running. The proof therefore records observed public MatchSet DTO status after bounded settling, rather than accepting creation-time `queued` metadata.
- Live proof exposed a real reliability issue: Go Match jobs used a 30s lease while the runtime-service HTTP budget was 90s. Long Python-vs-Python Matches could outlive the lease, then fail completion despite runtime execution finishing. Phase 138 fixes this by aligning the job lease with the runtime-service timeout plus grace.

## Implementation Direction

- Add a gated `RUN_V1_20_PROOF=1` Playwright proof so normal e2e runs stay bounded.
- Write `.planning/artifacts/v1.20-signed-in-reliability-proof.json` and `.md` only after the proof completes.
- Require three bounded cycles, six MatchSets, complete observed statuses, private marker scans, container candidate evidence, and JS/TS regression checks.
- Extend boundary monitors so the proof artifact and the Go lease fix are required v1.20 gates.
