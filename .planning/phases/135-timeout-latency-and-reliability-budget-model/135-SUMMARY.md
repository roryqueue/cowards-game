---
phase: 135
status: complete
requirements:
  - BUDGET-01
  - BUDGET-02
  - BUDGET-03
  - BUDGET-04
  - BUDGET-05
  - BUDGET-06
  - BUDGET-07
files_modified:
  - scripts/evaluate-runtime-sandbox.ts
  - scripts/check-boundary-monitors.ts
  - .planning/artifacts/v1.20-runtime-reliability-budgets.json
  - .planning/artifacts/v1.20-runtime-reliability-budgets.md
---

# Phase 135 Summary

## Completed

- Extended the v1.20 runtime reliability budget artifact with a concrete measurement plan.
- Recorded separate budgets for Strategy call, whole Match execution, MatchSet/job orchestration, runtime-service HTTP, and browser proof.
- Locked the deterministic per-Strategy call budget at 1000 ms and marked it non-adjustable for v1.20.
- Added bounded proof expectations for three cycles, JS/TS-vs-Python and Python-vs-Python matchups, and timing segments for cold-start, per-call runtime, whole-Match, job orchestration, result page, and replay page.
- Added boundary monitor assertions so budget ids, the 1000 ms Strategy cap, bounded repeat count, non-stress-test status, and timing segments cannot drift silently.

## Evidence

- `pnpm sandbox:evaluate` passed.
- `pnpm sandbox:evaluate:container` passed.
- `pnpm sandbox:evaluate:check` passed.
- `COWARDS_RUN_CONTAINER_SANDBOX=1 pnpm exec tsx scripts/evaluate-runtime-sandbox.ts --check` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts scripts/check-boundary-monitors.test.ts` passed.

## Notes

Phase 135 defines the evidence shape and monitor gates for latency proof. The actual signed-in repeated timing measurements are intentionally deferred to Phase 138, where the browser proof can record local result and replay timing from real signed-in exhibition flows.
