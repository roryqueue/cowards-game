---
phase: 265
plan: 16
scope: TWO-PAIR supplement Task 1 only
status: complete
subsystem: private-lean-source
tags: [v11, two-pair, source-only, tdd]
requires: [265-16-TWO-PAIR-PLAN-SUPPLEMENT-v1, explicit-pairs-and-time-approval]
provides: [additive-v11-fixed-ordinals, authentic-terminal-carry, single-audit-baseline-join]
affects: [independent-source-review, source-verification, later-approved-MAIN-routes]
tech-stack:
  added: []
  patterns: [finite-byte-custody, same-pair-actual-FINAL, nonauthorizing-closed-carry]
key-decisions:
  - Preserve every non-v11 route and immutable historical v10 envelope/pin.
  - Use exactly one full accepted closure audit per v11 consumer and derive primitive check joins locally.
  - Include the connected baseline-retained authority seam, explicitly authorized by MAIN.
completed: 2026-10-07
source-head: 94164868
---

# Phase 265 Plan 16: Two-pair source Task 1 summary

Additive v11-1/v11-2 diagnostic and conditional 36-cell baseline plumbing, finite authentic historical custody, and nonauthorizing closed-outcome carry are implemented. This completes **only source Task 1**. Independent review/fix/validation/source verification and all actual pairs remain outstanding. Plan 16 and Phase 265 remain incomplete; pairs are 0/2. No LEAG, freeze, formation, holdout, public/counting, or production credit is claimed.

## Commits and scope

- RED `e642b19a`: focused failing tests before production edits, four expected failures across three files.
- GREEN `94164868`: eight scoped source/test files, 460 insertions and 22 deletions, normal commit hooks. No tracked deletion.
- Source ownership: `packages/strategy-lab/src/league/lean-experiment.ts` and its focused test; `scripts/run-v1-38-lean-correction.ts` and focused test; shell wrapper; correction-retained source/test; connected baseline-retained source/test. The lean-experiment test was committed in RED and did not need further GREEN edits.
- No STATE/ROADMAP/REQUIREMENTS modification; no old private payload publication, old replay materialization, new experimental route allocation, MAIN entry, provider, Match, request helper, or live verifier execution. Existing unrelated untracked files were preserved and not staged.

## Exact binding and boundaries

The frozen `LEAN_TWO_PAIR_V11_EXTENSION` uses schema `lean-two-pair-envelope-v11`, start `1791409410738`, old fully consumed debit `93600000ms`, cumulative cap `108000000ms`, zero excluded idle, 32 historical charges, two diagnostics/two conditional baselines, and reserve `1860000ms`. The deadline is `2026-10-08T01:43:30.738Z`; source work and all subsequent work count continuously. The old v10 predecessor extension remains unchanged.

The two separate approval roots are `sha256:e73bde4d3c652d87789d1800614a6890ffb554b90d97a1eb8f70c731bfca8a08` (time) and `sha256:bb66ef99c82fcd9c8bdd9f73c21e8ba02efa4e6cc5d3958d0ab542f8e78449d3` (pairs). Supplement root is `sha256:7a2bcafb3d5448822386c94a061f45e764eaa36fbc9e1f45cc80a59e1f0f6299`.

All existing 15GB/300 Match, 1-second guest, 5-second host, 2.5-second startup, 600-second Match, 2GB scratch, external publication and guard bounds remain inherited unchanged. A fixed route is fresh/one-shot; ordinal 3, cross-pair reuse and cap resets are rejected. Pair 2 consumes authentic closed pair-1 custody after refusal, no-result terminal, failed result or closed result. Each baseline independently requires its **own pair's** accepted diagnostic closure and actual FINAL; prior acceptance grants no later baseline authority. There is no promise that 36 cells fit the remaining time.

## Concrete exported source API

Accounting exports: `LeanTwoPairMode`, `isLeanTwoPairMode`, `isLeanTwoPairExtensionV11`, `LEAN_TWO_PAIR_V11_EXTENSION`, `LEAN_TWO_PAIR_V11_CAPS`, `LEAN_TWO_PAIR_V11_ROUTES`, `LEAN_TWO_PAIR_V11_REPORT_PATHS`, and `createLeanTwoPairAllocationV11`. Existing allocation/mode/source/setup/capacity dispatch admits the additive version without changing old version branches.

Runner exports: `LEAN_TWO_PAIR_V11_APPROVAL`, `LEAN_TWO_PAIR_V11_PAIRS_APPROVAL`, `LEAN_TWO_PAIR_V11_PLAN`, `leanTwoPairDocumentsV11`, `authenticateLeanTwoPairAcceptedJoinV11`, `readLeanTwoPairRequestV11`, `inspectLeanTwoPairPredecessorV11`, `createLeanTwoPairRequestDraftV11`, `createLeanTwoPairContinuationV11`, and `assertLeanPreparedTwoPairPredecessorV11`.

Retained exports: `LEAN_TWO_PAIR_V11_HISTORY_PINS`, `validateLeanTwoPairHistoricalCustodyV11`, `authenticateLeanTwoPairHistoricalCustodyV11`, `LeanTwoPairTerminalCarryV11`, `validateLeanTwoPairTerminalCarryV11`, `publishLeanTwoPairTerminalCarryV11`, `authenticateLeanTwoPairClosedOutcomeV11`, `verifyLeanTwoPairTerminalOnlyV11`, and `verifyLeanTwoPairRetainedV11`.

CLI/shell accepts `(prepare|run|verify|verify-terminal)-supervisor-(diagnostic|baseline)-v11-(1|2)` with that route's exact `--request` path. Child dispatch accepts the matching two fixed ordinals. Ordinary retained verification is dispatched only for a result; absent-result and pre-entry refusals use the distinct terminal-only path with genuine null entry head/result metadata.

`leanTwoPairDocumentsV11(route, mode)` returns `review`, `dataReview`, `helperReview`, `authorization`, `continuation`, `setup`, `carry`, `pairClosure`. Fixed stores are `.strategy-lab/lean-correction-supervisor-{route}-20261007-{mode}`; request is `.strategy-lab/lean-correction-supervisor-{route}-request-20261007-{mode}.json`; allocation is `.planning/artifacts/v1.38-lean-correction-supervisor-{route}-allocation-{mode}.json`; temp appends `-tmp`; check is `correction-supervisor-{route}-check-{mode}.json`. Setup/continuation are ordinal-specific; authorizations and data/helper reviews are route-and-ordinal-specific. Terminal carry is `terminal-carry-v11.json` in that route's temp. Pair-closed outcome is re-derived from route carry; the reserved `pairClosure` path does not constitute an authority artifact.

Execution authorization schema `lean-two-pair-execution-authorization-v11` has exact fields `schemaVersion`, `timeboxExtension`, `approved`, `executionAuthorized`, `route`, `attemptOrdinal`, `sourceRoot`, `approvalRoot`, `pairsApprovalRoot`, `planRoot`, `policyRoot`, `requestDataRoot`, `helperReviewRoot`, `authorAgent`, `reviewerAgent`, `root`. The real author must be `/root` and the actual reviewer must be distinct. Source, data and helper review readers are wired through request admission; helper review identity is excluded only from the v11 request-data digest to avoid an impossible digest cycle, then bound by authorization.

Continuation schema `lean-two-pair-continuation-v11` has exact fields `schemaVersion`, `timeboxExtension`, `attemptOrdinal` (2), `priorClosureRoot`, `sourceRoot`, `reviewRoot`, `cumulativeCharged`, `cumulativeElapsedMs`, `allocatedDiskBytes`, `root`. It is authenticated against freshly derived closed pair-1 outcome, not a fabricated accepted head/check.

Terminal carry schema `lean-two-pair-terminal-carry-v11` has exact fields: `schemaVersion`, `timeboxExtension`, `authorizing` (false), `accepted` (false), `attemptOrdinal`, `route`, `outcome`, `sourceRoot`, `requestBytesRoot`, `allocationRoot`, `entryHead`, `entryBytesRoot`, `terminalBytesRoot`, `resultBytesRoot`, `verificationRoot`, `verificationBytesRoot`, `closureRoot`, `closedAtMs`, `cumulativeElapsedMs`, `currentCharges`, `cumulativeCharged`, `allocatedDiskBytes`, `survivors`, `root`. Outcomes are `refused_before_entry`, `entered_without_result`, `failed_result`, `closed_result`. Authenticity is re-derived from exact rooted verification/entry/terminal/result/time metadata; shape validation alone grants no authority. Later physical growth is retained without changing closed outcome identity.

Accepted join returns `closure` plus frozen `accepted` primitives `root`, `bytesRoot`, `allocationRoot`, `sourceRoot`, `head`, `attemptOrdinal`, `readerCloseMs`, `cumulativeCharged`. Instrumentation proves one full closure audit per call, no second full check audit and no added global/persistent cache. The baseline source-publication authority uses this join on v11 only and retains all committed lineage/allocation/source checks.

## Exact source inventory

At GREEN source HEAD `94164868`, `leanCorrectionSourceManifest("v11-1", LEAN_TWO_PAIR_V11_EXTENSION)` and ordinal 2 return the same **910 entries** and root `sha256:6d118d7d7833d5b2cb7d137074da547652c09444886621e1f5d0de8047bce7f7`. The concrete inventory is the complete existing `leanCorrectionSourceManifest("v9-1", LEAN_REMAINING_V9_EXTENSION).entries` closure, overlaid with the exact two approvals, supplement, `265-16-TWO-PAIR-RESEARCH-v1.md`, and `packages/strategy-lab/src/league/lean-experiment.test.ts`, sorted by path. Root domain is `lean-two-pair-reviewed-source-v11`, binding entries, exact extension, startup harness root and broker root. This definition includes both connected retained modules, runner, shell, focused tests and all inherited source dependencies; it is not a placeholder inventory.

Historical import is only 16 pinned finite v10 diagnostic/failed-baseline metadata files. It authenticates old accepted diagnostic closure/check/actual FINAL plus baseline entry/terminal-only zero-current-charge, 32-cumulative-charge custody. It reads neither old result nor old private source/replay payload and never dispatches the old ordinary readers. Existing historical v10 byte pins/constants/routes remain immutable.

## Verification evidence

Commands use the checkout's installed Node/Vitest/TypeScript/tsx tooling; no blind package-manager execution or install.

1. RED: `node node_modules/vitest/vitest.mjs run packages/strategy-lab/src/league/lean-experiment.test.ts scripts/run-v1-38-lean-correction.test.ts scripts/lib/v1-38-lean-correction-retained.test.ts -t 'v11'` — four expected failures, 105 filtered, before GREEN.
2. Earlier affected full regression: `node node_modules/vitest/vitest.mjs run packages/strategy-lab/src/league/lean-experiment.test.ts scripts/run-v1-38-lean-correction.test.ts scripts/lib/v1-38-lean-correction-retained.test.ts scripts/lib/v1-38-lean-remaining-budget.test.ts --maxWorkers=1` — 171/171 passed, 204.83s.
3. Final fixed-source focused command: `node node_modules/vitest/vitest.mjs run packages/strategy-lab/src/league/lean-experiment.test.ts scripts/run-v1-38-lean-correction.test.ts scripts/lib/v1-38-lean-correction-retained.test.ts scripts/lib/v1-38-lean-baseline-retained.test.ts -t 'v11' --maxWorkers=1` — 14 passed, 116 filtered, 14.72s. Includes the isolated authentic finite pre-entry carry positive fixture, stable pair closure under later file growth, mutation rejection, one-audit/cross-pair joins, exact route caps/CLI, and prepared report-growth preservation.
4. Expanded six-file regression added `scripts/lib/v1-38-lean-baseline-retained.test.ts` and `scripts/run-v1-38-lean-host-stage-v8.test.ts` to command 2 — 211 passed, 10 host-stage failures, 340.59s. This run overlapped the last source patch, so source-hold evidence from that run is **not** claimed as a final fixed-source pass. The older host-stage suite also includes real consumed-path writes/reads (exclusive setup collisions); it must not be rerun in the live namespace.
5. Bounded fixed-source comparison: reran only `scripts/run-v1-38-lean-host-stage-v8.test.ts --maxWorkers=1` under isolated archived RED HEAD and identical fixed current-source snapshots with no consumed stores. Both give **27 passed / same four failed**, respectively 128.59s and 124.73s. Two v9 request-owner failures reproduce at old HEAD; two isolation limitations are a historical source-count expectation (880 vs >=888 because generated/dist files are not archived) and deliberate absent old v7 private store. The live setup collision/admission/terminal failures do not reproduce in isolation. No old branch changes were made to accommodate these fixtures, and no complete host-stage pass is claimed.
6. `node node_modules/typescript/bin/tsc -b packages/strategy-lab` — passed on final source.
7. Strict transitive script check: `node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --types node --skipLibCheck --strict scripts/run-v1-38-lean-correction.ts scripts/lib/v1-38-lean-correction-retained.ts scripts/lib/v1-38-lean-baseline-retained.ts` — six inherited errors only: feasibility-protocol line 52 JsonValue union, planner/missions lines 52/60/66/68/69 undefined SoldierSnapshot. Exact same six errors reproduce in isolated archived RED HEAD after linking installed workspace dependencies. This strict gate is an inherited limitation, **not a pass**.
8. `sh -n scripts/run-v1-38-lean-correction.sh` and `git diff --check` — passed.
9. `node --import tsx scripts/check-v1-38-factory-boundaries.ts --check` — passed, 1,415 files, zero violations.

## Deviations and deferred limitations

MAIN explicitly authorized the minimal connected `v1-38-lean-baseline-retained.ts`/focused-test expansion after the real source-publication seam was found to invoke separate full check and closure audits. Only its v11 branch changes; old branches remain unchanged. This is required connected plumbing, not an extra feature.

The immutable prepared v11 predecessor permits only listed report growth/new listed reports; shrinkage, disappearance, non-report growth and changed accounting identity are rejected. Ledger capacity charges positive report deltas separately; prepared bytes are never refunded.

The six inherited strict errors and two inherited isolated v9 fixture failures are deferred to the independent reviewer as known non-v11 limitations. No STATE/ROADMAP updates were made because this is a delegated source-only task. No new stubs/TODOs or unplanned production/network/auth trust surface were introduced. The finite private-file custody and authorization surfaces are explicitly within the supplement's threat scope.

## Self-Check: PASSED

All scoped source/test files and this summary exist. RED `e642b19a` and GREEN `94164868` exist in Git; GREEN follows RED and contains no tracked deletion. No unrelated files were staged. The subsequent summary-only commit will bind this record without declaring Plan 16 or Phase 265 complete. Independent source review and source verification remain required before data authoring or MAIN execution.
