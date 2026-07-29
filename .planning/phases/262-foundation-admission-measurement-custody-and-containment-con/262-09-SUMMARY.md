---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "09"
subsystem: integrity
tags: [parallel-calibration, deterministic-scheduler, resource-supervision, charged-accounting, process-cleanup]

requires:
  - phase: 262-08
    provides: independently rooted historical expectation and exact canonical predicate
  - phase: 262-02
    provides: immutable 540-attempt inventory, v1.18/v1.19 runtime path, and stopped charged lineage
provides:
  - exact rooted eight-attempt four-shard parallel calibration policy and integer projector
  - stable four-wide 540-attempt sharding with byte-identical request preservation
  - order-independent charged, progress, cleanup, and publication accounting
  - asynchronous process-group supervision with RSS, headroom, timeout, cancellation, and no-orphan enforcement
affects: [262-10, ADMIT-03, v1.38-current-matrix-reproduction]

tech-stack:
  added: []
  patterns:
    - immutable calibration identity is frozen before any executable calibration
    - injected asynchronous shard runner separates deterministic scheduling from process supervision
    - partial successful work remains charged and unpublished until complete canonical reduction

key-files:
  created: []
  modified:
    - scripts/lib/v1-38-current-matrix-reproduction.ts
    - scripts/evaluate-v1-38-foundation-contract.test.ts

key-decisions:
  - "Freeze calibration to the first eight canonical request templates under distinct calibration:v1 identities, four concurrent two-attempt shards, and an inclusive 90-minute integer projection."
  - "Require an admitted calibration receipt before authoritative execution can launch; there is no caller override for inventory, formula, margin, overhead, denominator, rounding, comparator, or resource ceilings."
  - "Canonicalize terminals and outcomes by predeclared shard and attempt identity so valid completion order cannot alter evidence roots."
  - "Retain the prior unbounded failure and serial calibration as immutable charged lineage while keeping the accepted ledger empty until all 540 exact cells pass."

patterns-established:
  - "Resource samples are observed through an explicit adapter and reduce to per-child maximum RSS, maximum active-child aggregate RSS, and minimum host headroom."
  - "First hard failure aborts active shards, prevents later launches, awaits cleanup, and records successful-but-unaccepted, failed, cancelled, and unlaunched attempts separately."

requirements-completed: []

coverage:
  - id: D1
    description: "Rooted exact parallel calibration inventory, projection function, denominator, rounding, margin, overhead, and inclusive threshold"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#v1.38 matrix calibration policy"
        status: pass
    human_judgment: false
  - id: D2
    description: "Stable four-attempt authoritative sharding and completion-order-independent charged reduction"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#v1.38 matrix scheduler and accounting"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bounded asynchronous resource supervision, cancellation, process-group cleanup, and zero partial publication"
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#v1.38 matrix resources cleanup and cancellation"
        status: pass
    human_judgment: false

duration: 26min
completed: 2026-07-29
status: complete
---

# Phase 262 Plan 09: Bounded Parallel Matrix Supervision Summary

**Precommitted four-wide calibration and authoritative schedulers now preserve exact v1.18/v1.19 requests while enforcing deterministic charged accounting, memory headroom, cancellation, and process cleanup**

## Performance

- **Duration:** 26 min
- **Started:** 2026-07-29T05:37:34Z
- **Completed:** 2026-07-29T06:03:45Z
- **Tasks:** 2
- **Files modified:** 2
- **Focused verification:** 41/41 selected tests passed
- **Phase 262 test file:** 91/91 tests passed
- **Workspace typecheck:** 27/27 tasks passed

## Accomplishments

- Froze the exact first eight canonical attempt templates under non-cell `calibration:v1:{0..7}:{templateAttemptId}` identities, four stable two-attempt shards, and four simultaneous lanes.
- Rooted the inventory, projection source, aggregation rules, denominator, integer rounding, 7.5% margin, 60-second overhead, and inclusive 5,400,000 ms comparator before calibration execution is exposed.
- Preallocated all 540 unchanged requests into 135 stable four-attempt shards across a four-lane ceiling without mutating request bytes.
- Added canonical order-independent allocation, launch, attempt, terminal, progress, cleanup, charged-ledger, and empty accepted-ledger reduction.
- Replaced serial shard spawning with asynchronous detached process groups, portable host-memory observation, child RSS sampling, per-child/aggregate/headroom enforcement, bounded graceful/forced termination, awaited close, and orphan probing.
- Required an exact admitted calibration receipt before authoritative launch; first failure or parent abort cancels active work, records every unlaunched ID, and publishes zero accepted cells.

## Rooted Policy Identity

- **Calibration policy root:** `sha256:13ca3f9ef5e564f5f8de742534c14ae33562334ab9fda1cec0388521b4fe3a3b`
- **Calibration inventory root:** `sha256:06a3a61a9d200dc0a6f667ecc45e63937eafc69fd9c8e7928e806cd6be3e77dd`
- **Projection source root:** `sha256:3c4c876de6901567bf9aa2ee0348c496c3bb5e0dd99c4f1cbbfe169b0afebf32`
- **Authoritative shard-plan root:** `sha256:55a13c65d93227a3bb03445e95aa71426e110d1c4f83b9a99a45bb2851081e93`
- **Calibration execution:** Not run by this plan. Plan 262-10 owns the real four-way calibration and authoritative reproduction receipts.

## Task Commits

1. **Task 1 RED: Require frozen policy, scheduler, and accounting** - `b591b0be` (test)
2. **Task 1 GREEN: Freeze parallel scheduling contract** - `b53ec2ab` (feat)
3. **Task 2 RED: Require resource, cleanup, and cancellation behavior** - `edc530ef` (test)
4. **Task 2 GREEN: Supervise bounded parallel shards** - `8c8467bb` (feat)

## Files Created/Modified

- `scripts/lib/v1-38-current-matrix-reproduction.ts` - Calibration policy/schema/projector, deterministic shard plan, charged reducer, injected async scheduler, real subprocess runner, resource monitor, cancellation, cleanup, and execution gates.
- `scripts/evaluate-v1-38-foundation-contract.test.ts` - Policy mutation, projection boundary, sharding, accounting, resource, completion-order, timeout, cancellation, cleanup, unavailable-measurement, and no-partial-publication coverage.

## Decisions Made

- The calibration function accepts no policy-shaping overrides. Hardware identity and observations are inputs, but the inventory, formula, aggregation, denominator, rounding, margin, overhead, comparator, and ceiling are fixed and rooted.
- The authoritative scheduler refuses to start without an admitted receipt for the exact current policy and inventory.
- `executePreparedRuntimeServiceRequestV118` remains the only per-attempt service path; the selected worker-thread runtime, v1.19 ABI, and `engine-kernel-v1.37-candidate-1` remain unchanged.
- The legacy stopped receipt is now read and verified as immutable predecessor evidence rather than rerunning the retired serial `spawnSync` calibration path.
- ADMIT-03 remains incomplete until Plan 262-10 records a passing real calibration and complete authoritative 540-cell receipt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Reference] Followed the actual runtime adapter files after two planned read paths were absent**

- **Found during:** Task 2 mandatory read-first gate
- **Issue:** `packages/runtime-js/src/worker-host.ts` and `packages/runtime-js/src/subprocess-host.ts` do not exist in this checkout.
- **Fix:** Read and followed the current `worker-thread-adapter.ts`, `worker-bridge.ts`, `subprocess-adapter.ts`, `supervised-subprocess-adapter.ts`, and `candidate-process-runner.ts` authority and cleanup patterns.
- **Files modified:** None beyond the two planned Plan 262-09 files.
- **Verification:** Source scan confirms the matrix module retains `executePreparedRuntimeServiceRequestV118` and contains no direct engine, `new Function`, Node `vm`, or `spawnSync` path.
- **Committed in:** `8c8467bb`

---

**Total deviations:** 1 auto-fixed blocking reference
**Impact on plan:** No scope expansion or authority change. The replacement reads are the repository's current equivalents of the missing planned paths.

## Issues Encountered

- The plan-level combined selector exceeded the 60-second target once the mutation and full 540-ID accounting coverage was added. It completed successfully in 56.36 seconds for the 41 selected tests on the final run; the broader file completed in 78.33 seconds.
- Git index writes required the existing approval path; all four atomic task commits ran with normal repository hooks.

## Known Stubs

None. The real calibration and authoritative 540-cell run are intentionally owned by Plan 262-10, not stubbed in this implementation.

## Threat Flags

None beyond the plan's registered coordinator/process, resource-report, partial-evidence, and cleanup boundaries. No network endpoint, product import, formation artifact, candidate artifact, game rule, runtime limit, or public data surface was added.

## User Setup Required

None.

## Next Phase Readiness

- Plan 262-10 can run the exact rooted four-way calibration on recorded hardware and, only if admitted, execute the full 540-cell authoritative branch.
- The prior failed run and one-attempt serial calibration remain charged and non-reusable.
- ADMIT-03 and all downstream Phase 262 plans remain blocked until Plan 262-10 produces a complete passing receipt.

## Self-Check: PASSED

- Both planned implementation/test files and this Summary exist.
- Task commits `b591b0be`, `b53ec2ab`, `edc530ef`, and `8c8467bb` exist.
- Rooted policy identities re-derived exactly from the current source and inventory.
- Focused Plan 262-09 tests passed 41/41, the complete Phase 262 test file passed 91/91, and workspace typecheck passed 27/27.
- Stub, forbidden-loader, direct-engine, serial-spawn, formation/candidate, and threat-surface scans found no blocking issue.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-07-29*
