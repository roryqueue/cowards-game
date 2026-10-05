---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: supervisor-continuation-task-2
status: complete
scope: source_only_task_2
phase_complete: false
requirements-completed: []
subsystem: private-offline-experiment
tags: [supervisor, custody, cumulative-accounting, frozen-reuse]
requires:
  - phase: 265-16-supervisor-task-1
    provides: opt-in finite parent reason contract
provides:
  - Disjoint v2 correction request/allocation/command identities
  - Closed eleven-charge predecessor and recursive survivor accounting
  - Reviewed canonical request and witnessed setup-clock allocation bindings
affects: [265-16-supervisor-task-3, private-diagnostic-admission]
tech-stack:
  added: []
  patterns: [explicit-prospective-version, immutable-reuse, owner-only-canonical-custody]
key-files:
  created: []
  modified:
    - packages/strategy-lab/src/league/lean-experiment.ts
    - packages/strategy-lab/src/league/lean-experiment.test.ts
    - scripts/run-v1-38-lean-correction.ts
    - scripts/run-v1-38-lean-correction.test.ts
key-decisions:
  - Preserve every v1 schema/default and original reuse amendment; new authority is separate.
  - Debit new setup from the independently witnessed active turn, excluding prior human-approval idle.
duration: approximately 30min
completed: 2026-10-04
---

# Phase 265 Plan 16: Supervisor Task 2 Source Summary

Disjoint v2 routes carry the consumed eleven charges and closed 5,282,046 ms, preserve frozen-source reuse, and bind reviewed request bytes to cumulative accounting.

## Scope and commits

This closes Task 2 source implementation only. Plan 16, Phase 265, LEAG requirements, baseline/freeze/formation/holdout and public/counted/production authority are not completed or admitted.

- RED: `952d4bd7` — missing v2 parser/constants/allocation tests failed as required.
- GREEN: `bcdf1761` — disjoint v2 route admission and cumulative carry.
- Follow-up integration custody fix: `b4d9914e` — `fix(265-16): bind complete v2 request and reader custody`.

## Contracts

- `LEAN_SUPERVISOR_CORRECTION_ROUTES` fixes diagnostic/baseline stores, requests, allocations, TMP, check, owner, result and reason identities. Existing `LEAN_CORRECTION_ROUTES` is unchanged.
- Explicit commands: `prepare-supervisor-diagnostic-v2`, `run-supervisor-diagnostic-v2`, `verify-supervisor-diagnostic-v2`, and corresponding baseline commands. The exact `child-supervisor-*-v2` modes are parent-only IPC entry points.
- `deriveLeanSupervisorCorrectionRequestRoots`, `leanCorrectionRequestDataRoot`, `leanCorrectionSourceManifest(true)` and `createLeanSupervisorCorrectionAllocation` provide inert metadata derivation. Imports do not prepare or execute anything.
- New request schema is `lean-correction-supervisor-request-v2`, retaining the original fields with `diagnosis: null` and adding `supervisorDecisionRoot`, `acceptedCheckRoot`, `setupAccountingPath`, `setupAccountingRoot`. The original `amendmentRoot` remains `LEAN_COLD_REUSE_HISTORY.amendmentRoot`, not the new supervisor decision.
- Allocation binds canonical `requestBytesRoot`, `dataReviewRoot`, `setupAccountingRoot`, source review, decision, reuse and accepted-check roots. Actual baseline admission calls Task 3's immutable full-check authenticator; fixture booleans or reports grant no authority.
- Distinct actual `/root` and child author/reviewer roles are accepted only in v2. V1's existing review predicate is unchanged. This accommodates the real agent-thread dispatch limit without fabricated identities.

## Accounting and safety

Consumed diagnostic allocation `7ce7ea81`, raw result `574e8df0`, and final raw time `5224cd85` are accounting-only. The exact closed terminal-verifier interval contributes 435,878 ms; old ordinary acceptance is neither required nor invented. Neither consumed reader is invoked.

Recursive allocated-block inventory includes nested files/directories and empty `tsx-501`, rejects links, duplicate aliases, unsafe/changing metadata and excessive traversal, and avoids ancestor/subtree double counting. Old evidence is never deleted. Historical peak disk/RSS remains unknown.

The owner-only canonical setup witness binds the independently observed active turn beginning 1791155677000, its app-clock custody document and approved decision. Preparation carries a conservative wall upper bound for all new source/research/review/data/admin work from that start. It does not fabricate a past monotonic clock or debit earlier human-approval idle. Actual preparation and run clocks remain monotonic/wall bounded; the run starts from the actual preparation closure so commit/push/admin gaps are not dropped. The witness's allocated blocks are included once in new writable-path accounting.

Same 15GB/28,800,000ms/300Matches and every subceiling remain. V2 checks the 768MiB coordinator old-space flag, scope/alias protections, cleanup/check/replay reserves, fixed source/HEAD and same-process precharge capacity. Original seed, first condition/Smoke geometry, tactical-0/cold-opponent pair, seven frozen source roles, 192 spent and 128 future opportunities remain unchanged. Baseline uses the original reuse/pipeline APIs, never cold regeneration.

## Verification

- Full route/accounting suites: 51/51 pass (`lean-experiment.test.ts` and `run-v1-38-lean-correction.test.ts`).
- `pnpm exec tsc -p packages/strategy-lab/tsconfig.json --noEmit`: pass.
- Explicit-file strict script/test check: zero diagnostics in owned files; inherited optional-property/planner diagnostics prevent a clean whole-transitive-closure claim.
- `git diff --check`: pass. Scoped forbidden/stub-pattern scan: no added placeholders, engine randomness, Node vm boundary, or product endpoint.

## Deviations and remaining gates

[Rule 2 - Correctness] Added explicit canonical request/data-review/setup-root allocation joins during final source integration. No new runtime semantics or authority were introduced.

The root orchestrator owns independent exact source review/verification, request authoring and data review, preparation, one MAIN entry, source/HEAD hold, and one appropriate independent actual check. No actual allocation, preparation, provider, Match, old/new empirical reader, baseline, formation or holdout was run by this source task. Do not mark phase requirements complete.

## Known Stubs

None. Unknown historical peaks/initiating causes are explicit honest disclosures, not implementation placeholders.

## Self-Check: PASSED

Owned source/test files exist; RED/GREEN commits exist. No tracked deletions occurred. Unrelated pre-existing untracked files were preserved.
