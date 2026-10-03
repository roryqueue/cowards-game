---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07-task-1-host-receipt-allocation"
subsystem: strategy-lab
tags: [allocation, prospective-v3, host-response-receipt, vitest]
dependency_graph:
  requires: [265-07-HOST-RECEIPT-PLAN-v1.md, 265-07-HOST-RECEIPT-PLAN-CHECK-v2.md, 265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md]
  provides: [prospective-v3-allocation-contract-for-plan-07-task-2]
  affects: [packages/strategy-lab/src/league/allocation.ts, packages/strategy-lab/src/league/allocation.test.ts]
tech_stack:
  added: []
  patterns: [exact-key-admission, separately-rooted-versioned-policy, red-green-tests]
key_files:
  created: [.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-ALLOCATION-SUMMARY-v1.md]
  modified: [packages/strategy-lab/src/league/allocation.ts, packages/strategy-lab/src/league/allocation.test.ts]
decisions:
  - V3 adds exactly hostResponseReceiptMilliseconds=5000 while preserving the V2 600000 ms per-Match lifetime and all other admitted policy values.
  - V3 is explicit in amendment/allocation schemas and version-aware prospective admission; V1/V2 constructors and roots remain unchanged.
metrics:
  duration: "about 15 minutes"
  completed: 2026-10-02
status: complete
---

# Phase 265 Plan 07 Task 1: Prospective Host-Receipt Allocation Summary

Added a separately rooted prospective V3 allocation contract for the approved 5,000 ms private host response-receipt allowance, without changing the 1,000 ms guest ceiling, 600,000 ms Match lifetime, or any V1/V2 allocation meaning.

## Scope and Outcome

Task 1 is complete as an allocation-and-test slice only. The stable exports are `LEAGUE_APPROVED_PROSPECTIVE_POLICY_V3`, `LeagueProspectiveAmendmentV3`, `ProspectiveLeagueExecutionAllocationV3`, `createLeagueProspectiveAmendmentV3`, `admitLeagueProspectiveAmendmentV3`, `createProspectiveLeagueExecutionAllocationV3`, and `admitProspectiveLeagueExecutionAllocationV3`. `admitAnyProspectiveLeagueExecutionAllocation` explicitly selects V1, V2, or V3 by discriminator; `admitAnyLeagueExecutionAllocation` routes known prospective versions through that selector while preserving legacy allocation admission.

V3's only policy delta from V2 is `operations.hostResponseReceiptMilliseconds: 5000`. The V3 amendment has a distinct schema/root and binds both the prior prospective-lifetime approval and the recorded host-receipt approval. V3 allocation creation projects the receipt field away and reuses V2 admission before rooting V3, so the existing V2 invariants continue to validate every other field and allocation-lineage condition.

Runtime authority, runtime clock wiring, and downstream retained/preparation/capacity selectors have not been integrated here; those remain Task 2. No allocation file, capacity receipt, provider, Match, model, container, runtime, or verifier was created or invoked. This summary does not claim full Plan 07 or Phase 265 completion, LEAG evidence, or freeze credit.

## TDD and Verification

- RED: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts -t 'prospective host response receipt'` — 2 tests failed because `createLeagueProspectiveAmendmentV3` did not yet exist. Test-only commit: `d52dbdcc`.
- GREEN focused: same command — 2 passed.
- Full allocation suite: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts` — 17 passed.
- TypeScript: `./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false` — passed.
- `pnpm --filter @cowards/strategy-lab build` was attempted but not executed because the package has no `build` script; the package's configured TypeScript build passed using the explicit checked command above.

## Deviations from Plan

None within the Task 1 source boundary. Task 1 covers only `allocation.ts` and `allocation.test.ts`; runtime and retained-reader changes were deliberately left for Task 2.

## Commits

- `d52dbdcc` — `test(265-07): add prospective host receipt allocation tests`
- `7e841376` — `feat(265-07): add prospective host receipt allocation v3`

## Self-Check: PASSED

- Confirmed the two owned source files were committed and the allocation test suite and checked TypeScript build pass.
- The following public APIs are available from the allocation module: the V3 policy, amendment and allocation types, create/admit functions, and explicit version-aware prospective selector listed above.
- No unowned source, execution state, roadmap, requirements, or unrelated untracked artifact was staged.
