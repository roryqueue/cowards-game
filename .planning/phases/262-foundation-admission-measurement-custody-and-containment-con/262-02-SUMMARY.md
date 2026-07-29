---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "02"
subsystem: integrity
tags: [matrix-reproduction, runtime-service, resource-policy, fail-closed, charged-attempts]

requires:
  - phase: 262-01
    provides: exact v1.37 foundation admission root and selected semantic/runtime authority
provides:
  - exact immutable 540-attempt historical inventory and supervised v1.18/v1.19 request construction
  - three-way charged-attempt and accepted-cell reducer with conflict and completeness rejection
  - bounded subprocess calibration, terminal shard progress, and fail-closed resource policy
  - immutable stopped-process-failure receipt with zero accepted cells
affects: [262-03, ADMIT-03, v1.38-foundation-contract]

tech-stack:
  added: []
  patterns:
    - bounded node --import tsx subprocess shards for supervised Strategy execution
    - resource calibration before full authoritative execution
    - partial runtime work is charged but never reusable accepted evidence

key-files:
  created:
    - scripts/lib/v1-38-current-matrix-reproduction.ts
    - .planning/artifacts/v1.38-current-matrix-reproduction.json
  modified:
    - scripts/evaluate-v1-38-foundation-contract.test.ts

key-decisions:
  - "Use the selected v1.18 prepared runtime service, supervised worker-thread runtime, and v1.19 MATCH_KERNEL for every attempted Match; never reuse the historical loader or direct-engine shortcut."
  - "Cap one process to four attempts, calibrate one supervised attempt before a full run, and refuse the 540-attempt run when its projected duration exceeds the frozen 90-minute total-run budget."
  - "Treat the terminated four-hour run as system_failure_resource_pressure, discard all unknown partial outcomes, and publish zero accepted cells."

patterns-established:
  - "A terminal shard may report charged progress, but acceptedCellsPublished remains zero until the complete 540-attempt inventory passes canonical reduction."
  - "Resource-policy failure is a process failure, not an empirical result and not permission to normalize, retry without charge, or use partial cells."

requirements-completed: []

coverage:
  - id: D1
    description: "Exact 10-definition, 45-pair, three-label, two-seed, mirrored-side 540-attempt inventory with semantic geometry reconciliation"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#matrix freezes the exact historical inventory without collapsing duplicate geometry"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exact historical aggregate reproduced through the selected supervised runtime and canonical kernel"
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: ".planning/artifacts/v1.38-current-matrix-reproduction.json#status"
        status: fail
    human_judgment: false
  - id: D3
    description: "Bounded-memory resource calibration and charged process-failure receipt with no partial accepted evidence"
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#matrix calibrates supervised execution and fails closed when the total resource budget is unsafe"
        status: pass
    human_judgment: false

duration: 260min
completed: 2026-07-29
status: complete
outcome: stopped_process_failure
---

# Phase 262 Plan 02: Supervised Historical Matrix Reproduction Summary

**The exact 540-attempt inventory and canonical supervised execution path are sealed, but ADMIT-03 stopped fail-closed after resource pressure and a 5.4-hour calibrated projection; zero cells were accepted**

## Performance

- **Duration:** 4h 20m
- **Started:** 2026-07-29T00:37:17Z
- **Completed:** 2026-07-29T04:57:46Z
- **Tasks:** 2 executed; reproduction outcome stopped
- **Files modified:** 3
- **Focused verification:** 26/26 tests passed
- **Workspace typecheck:** 27/27 tasks passed

## Accomplishments

- Froze exactly 10 Advanced definitions, 45 unordered pairs, three historical arena labels, two seed labels, mirrored sides, explicit entrant-level initiative, and 540 unique attempts.
- Built every request as an immutable `regression_throughput_only` fixture through `runtime-execution-service-v1.18`, supervised TypeScript worker execution, and `strategy-runtime-abi-v1.19` / `engine-kernel-v1.37-candidate-1`.
- Reconciled Smoke and Open Field to their shared empty semantic geometry while retaining both historical labels.
- Added strict three-way outcome accounting, canonical accepted-cell reduction, missing/duplicate/conflict rejection, and public-safe ledger/source roots.
- Added bounded `node --import tsx` subprocess shards, terminal progress with `acceptedCellsPublished: 0`, and a pre-run resource policy that prevents another unsafe full run.
- Sealed stopped receipt `sha256:bd64a793603ee444f8671e8391d5bd9bd4a2b494d32a2d09fce1864aed675a33` with `acceptedCellCount: 0`.

## Reproduction Result

- **Status:** `stopped_process_failure`
- **Reason:** `system_failure_resource_pressure`
- **Declared attempts:** 540
- **Accepted cells:** 0
- **Prior full run:** terminated after 14,390 seconds when host free memory reached 9%; completed-attempt count was not observable, so every partial result was discarded.
- **Bounded calibration:** 1/1 supervised attempt succeeded in 35,812 ms with 721,088 KB maximum RSS.
- **Projected full runtime:** 19,338,480 ms (about 5h 22m), exceeding the frozen 5,400,000 ms (90-minute) total-run budget.
- **ADMIT-03:** not satisfied; authoritative Phase 262 progress remains blocked.

## Task Commits

1. **Task 1 RED: Freeze matrix request contract** - `6a82b9b2` (test)
2. **Task 1 GREEN: Enumerate supervised historical matrix** - `8b480430` (feat)
3. **Task 2 RED: Require sealed reproduction and failure accounting** - `d4fe25bc` (test)
4. **Task 2 GREEN/deviation: Bound resources and seal stopped receipt** - `724388c3` (feat)

## Files Created/Modified

- `scripts/evaluate-v1-38-foundation-contract.test.ts` - Exact inventory, authority, mutation, failure-accounting, resource-policy, cleanup, and stopped-receipt coverage.
- `scripts/lib/v1-38-current-matrix-reproduction.ts` - Enumerator, v1.18 supervised request builder/executor, reducer, shard runner, resource calibration, progress reporting, and receipt renderer.
- `.planning/artifacts/v1.38-current-matrix-reproduction.json` - Immutable public-safe stopped process-failure receipt.

## Decisions Made

- The historical `new Function` loader, Node `vm`, direct Strategy import/execution, direct `runMatch`, and alternate transition loops remain forbidden.
- Historical `meta-even` / `meta-odd` labels are preserved, but every request carries explicit entrant and player initiative through the canonical Set condition.
- A subprocess shard is terminally charged and observable, but its cells are not accepted or reusable before complete-matrix validation.
- The four-hour run cannot establish any result because its completed-attempt count was not safely observable; recording `unknown` and zero accepted cells is the only truthful disposition.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added bounded resource and total-run admission policy**

- **Found during:** Task 2 full supervised reproduction
- **Issue:** The first implementation executed all 540 service-backed Matches in one Vitest process without a total-run budget, progress counter, or bounded-memory process lifecycle.
- **Fix:** Added one-attempt calibration, a 90-minute projected total-run ceiling, four-attempt subprocess shards, ten-minute shard timeout, 2 GiB shard RSS ceiling, and terminal progress that never publishes partial accepted cells.
- **Files modified:** `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-foundation-contract.test.ts`
- **Verification:** Bounded calibration succeeded; 26/26 focused tests and 27/27 typecheck tasks passed.
- **Committed in:** `724388c3`

**2. [Rule 1 - Bug] Prevented partial supervised work from being mistaken for accepted evidence**

- **Found during:** Task 2 resource-pressure termination
- **Issue:** The interrupted in-process run had no safe completed-attempt counter, making any partial outcome set unverifiable.
- **Fix:** Charged the run as `system_failure_resource_pressure`, recorded completed count as `unknown`, discarded all partial results, fixed accepted cells at zero, and bound an empty accepted ledger root.
- **Files modified:** `scripts/lib/v1-38-current-matrix-reproduction.ts`, `.planning/artifacts/v1.38-current-matrix-reproduction.json`
- **Verification:** Missing, identical duplicate, conflicting duplicate, player violation, and system failure mutations all stop with `MATRIX_REPRODUCTION_MISMATCH`.
- **Committed in:** `724388c3`

---

**Total deviations:** 2 auto-fixed (1 missing critical resource policy, 1 evidence-accounting bug)
**Impact on plan:** The canonical execution authority was not weakened. The deviation converts an unsafe, unobservable long run into a bounded and truthful hard stop; it does not satisfy ADMIT-03.

## Issues Encountered

- The initial full run remained active for nearly four hours and drove host free memory to 9%. It was explicitly terminated to protect the host and classified as charged system failure.
- Worker-supervised execution is roughly three orders of magnitude slower than the historical 11.4-second direct-engine fixture. This is evidence that the historical throughput estimate cannot be reused for canonical supervised admission.

## Known Stubs

None.

## Threat Flags

None. No network endpoint, production import, schema trust boundary, formation artifact, candidate artifact, product surface, or public surface was added.

## User Setup Required

None.

## Next Phase Readiness

- **Blocked:** ADMIT-03 remains unmet. Phase 262 must not treat the historical matrix as reproduced or proceed authoritatively into candidate-sensitive work.
- A future authorized resolution needs either a larger explicitly approved offline execution budget or a performance fix within the supervised runtime implementation that preserves v1.18/v1.19 authority and passes the same calibration policy.
- Starter/Advanced evidence remains regression/throughput-only and supports no balance claim.

## Self-Check: PASSED

- Created files exist: reproduction module, stopped receipt, and this Summary.
- Task commits exist: `6a82b9b2`, `8b480430`, `d4fe25bc`, and `724388c3`.
- Focused suite passed 26/26 tests.
- Workspace typecheck passed 27/27 tasks.
- Artifact receipt root recomputed exactly and its reducer source root matches the committed module bytes.
- Forbidden-loader/authority scan found no `new Function`, Node `vm`, or direct `runMatch` call in the reproduction module.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-07-29*
