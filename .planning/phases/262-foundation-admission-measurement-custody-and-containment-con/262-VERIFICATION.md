---
phase: 262-foundation-admission-measurement-custody-and-containment-con
verified: 2026-07-29T05:03:26Z
status: gaps_found
score: 1/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Researchers can reproduce the persisted current-rules matrix under the resolved tuple, while Starter and Advanced Strategies remain fixture-only."
    status: failed
    reason: "The authoritative reproduction stopped on resource pressure. The receipt records 540 declared attempts, zero accepted cells, and no reusable partial evidence; ADMIT-03 remains pending. The current executor is serial, and its expected aggregate root is still an all-zero placeholder that no real aggregate can satisfy."
    artifacts:
      - path: ".planning/artifacts/v1.38-current-matrix-reproduction.json"
        issue: "status is stopped_process_failure with acceptedCellCount 0"
      - path: "scripts/lib/v1-38-current-matrix-reproduction.ts"
        issue: "Serial shard execution cannot meet the frozen 90-minute gate on current calibration, and HISTORICAL_EXPECTED_AGGREGATE_ROOT is sha256:000...000."
    missing:
      - "A bounded parallel supervised scheduler that retains runtime-execution-service-v1.18 and strategy-runtime-abi-v1.19 / engine-kernel-v1.37-candidate-1 unchanged"
      - "A frozen parallel calibration proving projected total wall time is at most 5,400,000 ms under explicit concurrency, aggregate-memory, per-shard, and host-headroom bounds"
      - "An independently rooted expected historical fixture/predicate derived from persisted audit evidence rather than the new observed run"
      - "A complete 540-cell successful reduction with zero player violations, zero system failures, exact IDs, exact aggregate match, and no reuse of prior or calibration cells"
  - truth: "Before candidate output is inspected, one immutable scientific, structural-budget, failure-accounting, selection, and bounded-claims contract is frozen."
    status: failed
    reason: "Plans 262-03 and 262-04 have not executed; their study, calibration-policy, measurement, and pre-search contract artifacts do not exist."
    artifacts:
      - path: "scripts/lib/v1-38-study-contract.ts"
        issue: "missing"
      - path: "scripts/lib/v1-38-measurement.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-calibration-freeze-policy.json"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-pre-search-contract.json"
        issue: "missing"
    missing:
      - "Complete Plans 262-03 and 262-04 only after ADMIT-03 closes"
  - truth: "A separately permissioned custodian can demonstrate the frozen commitment, storage, access, one-open, safe-receipt, contamination, retirement, and orthogonal reporting workflow."
    status: failed
    reason: "Plans 262-06 and 262-07 have not executed and their prerequisites are correctly blocked by ADMIT-03."
    artifacts:
      - path: "scripts/lib/v1-38-custody.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-custody-public-reference.json"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-foundation-contract-root.json"
        issue: "missing"
    missing:
      - "Synthetic custody mechanics plus genuine separately permissioned operational authorization"
      - "A bounded public custody reference and final aggregate root, or the planned terminal no-authority stop"
  - truth: "The literal profiles, equal-compute dimensions, telemetry, classifiers, and rejection thresholds are precommitted while executable formation material remains absent."
    status: failed
    reason: "The required Plan 262-05 protocol, classifier, and containment implementation is absent. Absence of forbidden formation artifacts is necessary but does not supply the positive precommitment and classifier evidence."
    artifacts:
      - path: "scripts/lib/v1-38-containment.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-pre-formation-containment.json"
        issue: "missing"
    missing:
      - "Protocol-only profile records, validated profile-neutral classifier fixtures, and a sealed negative containment proof"
---

# Phase 262: Foundation Admission, Measurement, Custody, and Containment Contract Verification Report

**Phase Goal:** Maintainers can begin v1.38 research only under the exact released v1.37 authority and an immutable pre-search scientific, budget, custody, claim, and containment contract.
**Verified:** 2026-07-29T05:03:26Z
**Status:** gaps_found
**Re-verification:** No — initial verification of a partial, stopped phase

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Exact v1.37 audit/archive/tag/post-tag/semantic/runtime admission passes, and drift stops explicitly. | ✓ VERIFIED | `node --import tsx scripts/lib/v1-38-foundation-admission.ts --check` returned `passed_exact` and admission root `sha256:eb8819...491c`; Plan 01 artifacts and both declared key links pass. |
| 2 | The persisted current-rules matrix is reproduced through the resolved supervised runtime/kernel tuple, with Starter/Advanced evidence fixture-only. | ✗ FAILED | Inventory/request construction and fixture labeling exist, but the immutable receipt is `stopped_process_failure`, `acceptedCellCount: 0`, and `partialAcceptedEvidenceReusable: false`. |
| 3 | One immutable pre-search scientific, budget, accounting, gate, selection, and claims contract exists before candidate inspection. | ✗ FAILED | Plans 262-03/04 are unexecuted and their source/artifact outputs are absent. |
| 4 | Separately permissioned custody and orthogonal report-state controls are demonstrable. | ✗ FAILED | Plans 262-06/07 are unexecuted; no custody implementation, authorized handoff, public reference, or aggregate root exists. |
| 5 | Profiles/classifiers/rejection thresholds are precommitted as protocol-only data and pre-formation containment is proved. | ✗ FAILED | Plan 262-05 is unexecuted. No forbidden executable formation artifacts were found among current Phase 262 outputs, but the required positive protocol/classifier/containment evidence is absent. |

**Score:** 1/5 truths verified (0 present, behavior-unverified)

The later Phase 262 plans are correctly blocked. `262-03-PLAN.md` depends on `262-02`; Plans 04–07 form a dependent chain after it. `STATE.md` records `status: blocked`, `ADMIT-03 hard stop`, and “do not begin Plan 262-03.”

## Charged Resource-Pressure Evidence

The stopped evidence has two distinct charged events and no gameplay evidence:

1. The first unbounded supervised reproduction is a charged outer process attempt classified `system_failure_resource_pressure`. It ran for 14,390 seconds and was terminated at 9% host free memory. Because terminal-safe per-attempt progress did not exist, its completed-attempt count is truthfully `unknown`; every partial outcome was discarded.
2. The bounded calibration is one separately charged supervised calibration attempt. It completed successfully in **35,812 ms** with **721,088 KB maximum RSS**. It is calibration evidence only, not an accepted matrix cell.

The serial projection is **19,338,480 ms** for 540 attempts, over the frozen **5,400,000 ms (90-minute)** gate. The stopped receipt binds both events in `chargedAttemptLedgerRoot`; its accepted ledger is exactly the canonical empty-array root. Recalculation confirmed the receipt root, reducer source root, and empty accepted-ledger root all match.

Therefore:

- accepted cells: **0**;
- reusable partial cells: **0**;
- ADMIT-03: **pending/blocked**;
- prior failure and calibration work: **charged and retained**, never erased or converted to gameplay.

## ADMIT-03 Gap Closure Contract

### Is bounded parallel supervised execution legitimate?

**Yes, conditionally.** A bounded parallel scheduler is an implementation-level closure because independent Match attempts can run concurrently without changing any Match transition, Strategy observation, rule, result, or accepted-cell definition. It is legitimate only if every attempt still executes through `executePreparedRuntimeServiceRequestV118`, the supervised worker-thread adapter, `strategy-runtime-abi-v1.19`, and `engine-kernel-v1.37-candidate-1`.

Parallelism must not:

- raise, reinterpret, or soften the 90-minute total wall-clock gate;
- replace the supervised runtime with direct engine execution;
- change rules, runtime semantics, kernel semantics, limits, arenas, Set conditions, seeds, sides, initiative, or the 540-cell inventory;
- reuse the prior failed run, calibration outcomes, or any partial shard as accepted evidence;
- omit any failed, timed-out, cancelled, unlaunched, or retried allocation from charged accounting.

The current one-attempt serial projection does not authorize a parallel run by inference alone. A new, preregistered bounded parallel calibration must measure the chosen width on the fixed hardware/runtime class before the authoritative run.

### Frozen execution envelope

Retain the existing limits:

- `maxProjectedTotalMilliseconds`: **5,400,000**;
- `maxShardAttempts`: **4**;
- `maxShardMilliseconds`: **600,000**;
- `maxShardRssKilobytes`: **2,097,152** per child;
- `partialAcceptedEvidenceReusable`: **false**.

For the gap implementation, add and freeze before execution:

- `maxConcurrentShards`: **4**;
- `maxAggregateChildRssKilobytes`: **4,194,304**;
- a recorded hardware/OS/Node identity;
- a host free-memory admission floor of **25%** before launch and throughout scheduling;
- one deterministic canonical assignment of all 540 attempt IDs to shards and lanes.

Four-way concurrency is only a ceiling, not a claim that the gate will pass. The single-attempt evidence gives an idealized four-way estimate of about 4,834,620 ms (80.6 minutes), leaving little overhead margin. The actual four-way calibration must measure observed wall-clock throughput and memory; fail closed if its conservative full-run projection exceeds 5,400,000 ms or any memory/headroom limit.

### Success conditions

ADMIT-03 closes only when one new immutable successor branch proves all of the following:

1. Parallel calibration is successful through the unchanged supervised authority, remains within per-child and aggregate memory limits, and conservatively projects the complete run at or below 5,400,000 ms.
2. All 540 predeclared attempt IDs run from scratch. Calibration cells and every prior partial cell are excluded from accepted evidence.
3. The run itself finishes within 5,400,000 ms and the frozen concurrency/memory/timeout/headroom envelope.
4. Every attempt terminates exactly once with a charged disposition; accepted reduction contains exactly 540 successful process-valid cells in canonical ID order.
5. Player violations, system failures, timeouts, cancellations, missing IDs, duplicates, conflicting results, cleanup failures, and authority mismatches are all zero.
6. The independently frozen historical expected predicate matches. The documented leaders (`stonewall-shear` and `vanguard-pressure` at 62-44-2), nine majority-edge cycles, and Smoke/Open Field equality must be included; any stronger full aggregate root must come from pre-existing persisted evidence, never from the new observed run.
7. The passing receipt remains `regression_throughput_only`, contains no Strategy source/private diagnostics, and binds the stopped predecessor receipt as charged lineage without overwriting it.

### Failure conditions

Any of the following produces a new immutable stopped process receipt, zero accepted cells, and no downstream authority:

- parallel calibration projection over 90 minutes;
- per-child RSS over 2 GiB, aggregate child RSS over 4 GiB, or host free memory below 25%;
- concurrency above four, shard size above four, or shard duration above ten minutes;
- any spawn, timeout, signal, worker, runtime, cleanup, or output-parse failure;
- any non-success attempt classification;
- any missing, duplicate, conflicting, reordered, or unknown attempt ID;
- actual total wall time over 90 minutes;
- expected-fixture mismatch or a still-placeholder/observed-derived expected root;
- inability to prove every launched process and worker was terminated;
- any attempt to reuse partial/calibration results or omit charged work.

### Cleanup, progress, and accounting requirements

- Use asynchronous child processes with a fixed four-slot scheduler; serial `spawnSync` cannot provide parallel closure.
- Place each shard in a controllable process group. On first hard failure or parent interruption, stop new launches, send bounded graceful termination, escalate to forced termination, await every child exit, and prove no orphan remains.
- Emit a monotonic terminal event after every shard with shard ID, canonical attempt IDs, terminal classification, elapsed time, maximum RSS, cumulative launched/terminal/failed/unlaunched counts, `acceptedCellsPublished: 0`, and `partialAcceptedEvidenceReusable: false`.
- Preallocate all 540 attempt IDs. On stop, record successful-but-unaccepted launched attempts, failed/cancelled attempts, and never-launched allocations separately; all remain charged.
- Give calibration attempts distinct IDs and ledger entries. They are never aliases for matrix cell IDs.
- Reduce only after complete terminal accounting. Publication is atomic: either all 540 exact cells pass and one accepted root appears, or the accepted root remains the canonical empty root.
- Preserve the current stopped receipt/root. A retry is a new content-addressed successor branch whose lineage binds all prior charged roots; there is no mutable `latest`.

### Required tests for the gap plan

Add deterministic injected-runner tests that do not execute the 540-Match integration:

1. Scheduler never exceeds four active shards or four attempts per shard.
2. Canonical output and ledger roots are identical across completion orders.
3. Parallel calibration uses measured wall time, concurrency, aggregate RSS, and conservative overhead; boundary tests cover exactly 5,400,000 ms and one millisecond over.
4. Per-child RSS, aggregate RSS, host-headroom, shard-timeout, and concurrency mutations fail closed.
5. First shard failure stops new launches, terminates all active children, waits for exits, reports no orphan, and publishes zero cells.
6. Parent exception and interrupt paths perform the same cleanup and accounting.
7. Progress is monotonic, emits once per terminal shard, accounts for launched/terminal/unlaunched IDs exactly, and always reports zero published cells before final reduction.
8. Calibration and prior partial IDs cannot enter the accepted ledger; a seeded reuse attempt is rejected.
9. Missing, duplicate, conflicting, reordered, player-violation, system-failure, timeout, and cancelled outcomes all remain charged and block reduction.
10. The historical expected predicate is non-zero, independently bound, and mutation-tested; observed results cannot rewrite it.
11. One small real four-way supervised integration proves unchanged v1.18 service, v1.19 ABI/kernel, limits, authority tuple, and fixture-only labels.
12. The authoritative integration passes only with 540/540 accepted cells, exact historical match, zero failures, bounded resources, complete cleanup, and total wall time at or below 90 minutes.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/lib/v1-38-foundation-admission.ts` | Exact predecessor admission | ✓ VERIFIED | 1,043 substantive lines; live `--check` passed. |
| `.planning/artifacts/v1.38-foundation-admission.json` | Immutable public-safe passed receipt | ✓ VERIFIED | `status: passed_exact`; exact root returned by live check. |
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | Supervised enumerator/executor/reducer | ⚠️ PARTIAL | Substantive and authority-wired, but serial resource closure fails and expected aggregate is an all-zero placeholder. |
| `.planning/artifacts/v1.38-current-matrix-reproduction.json` | Immutable passing regression receipt | ✗ FAILED | Exists substantively as a truthful stopped receipt, not the required passing reproduction. |
| `scripts/lib/v1-38-study-contract.ts` | Study/accounting/calibration contract | ✗ MISSING | Plan 262-03 blocked. |
| `scripts/lib/v1-38-measurement.ts` | Gates/report/claim logic | ✗ MISSING | Plan 262-04 blocked. |
| `.planning/artifacts/v1.38-pre-search-contract.json` | Immutable pre-search contract | ✗ MISSING | Plans 262-03/04 blocked. |
| `scripts/lib/v1-38-containment.ts` | Protocol/classifier containment proof | ✗ MISSING | Plan 262-05 blocked. |
| `scripts/lib/v1-38-custody.ts` | Custody state machine | ✗ MISSING | Plan 262-06 blocked. |
| `.planning/artifacts/v1.38-foundation-contract-root.json` | Aggregate downstream authority | ✗ MISSING | Correctly unavailable while ADMIT-03 is stopped. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Admission evaluator | v1.37 release checker | Read-only post-tag verification | ✓ WIRED | Automated key-link query passed; live admission check passed. |
| Admission evaluator | generated semantic authority | Exact resolved tuple | ✓ WIRED | Automated key-link query passed. |
| Matrix reproduction | runtime service | `executePreparedRuntimeServiceRequestV118` | ✓ WIRED | Direct import and invocation at the per-attempt executor. |
| Runtime service | canonical kernel | `runVersionedMatchV119` | ✓ WIRED | `apps/runtime-service/src/execute-match.ts` imports and invokes the v1.19 path; kernel identity is bound in request/receipt. |
| Stopped reproduction | Plan 262-03 study contract | Required passed reproduction root | ✗ NOT WIRED | Plan 03 is correctly not executable from a stopped receipt. |

## Data-Flow Trace (Level 4)

No UI/dynamic rendering artifacts exist. For the offline evidence flow:

| Artifact | Data | Source | Produces authoritative data | Status |
|---|---|---|---|---|
| Admission receipt | v1.37 authority identities | Git/tag/checker/spec/runtime join | Yes | ✓ FLOWING |
| Matrix stopped receipt | prior failure + calibration + policy | Actual supervised calibration and recorded failed run | Process evidence only | ✓ FLOWING as stop evidence |
| Matrix accepted ledger | gameplay cells | Complete supervised run | No; canonical empty ledger | ✗ DISCONNECTED for ADMIT-03 |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Exact admission remains valid | `node --import tsx scripts/lib/v1-38-foundation-admission.ts --check` | `passed_exact`, expected root | ✓ PASS |
| Exact 540-attempt inventory and geometry mapping | Named Vitest inventory test | 1 passed, 25 skipped, 4.08 s | ✓ PASS |
| Failed attempts block accepted reduction | Named Vitest failure-accounting test | 1 passed, 25 skipped, 4.07 s | ✓ PASS |
| Full supervised reproduction | Not rerun | Existing bounded evidence proves it would stop; rerunning would consume ~36 s calibration without new information | ? SKIP |

## Probe Execution

No Phase 262 probe scripts are declared. The explicit admission checker and named behavioral tests above are the runnable checks.

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| ADMIT-01 | 262-01 | ✓ SATISFIED | Live exact admission check and passed receipt. |
| ADMIT-02 | 262-01 | ✓ SATISFIED | Exact tuple/runtime roots and key link verified. |
| ADMIT-03 | 262-02 | ✗ BLOCKED | Stopped process receipt; zero accepted cells. |
| ADMIT-04 | 262-01 | ✓ SATISFIED | Typed fail-closed evaluator and mutation tests present. |
| MEAS-01–MEAS-04 | 262-03 | ✗ BLOCKED | Plan and outputs unexecuted. |
| MEAS-05–MEAS-09 | 262-04 | ✗ BLOCKED | Plan and outputs unexecuted. |
| MEAS-10 | 262-05 | ✗ BLOCKED | Plan and outputs unexecuted. |
| SEAL-01 | 262-06/07 | ✗ BLOCKED | No synthetic/authorized custody evidence or root. |
| DECI-02 | 262-05 | ✗ BLOCKED | No classifier fixtures or frozen thresholds. |

There are no orphaned Phase 262 requirements: all 17 roadmap requirements are claimed by Plans 262-01 through 262-07.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | 589 | `HISTORICAL_EXPECTED_AGGREGATE_ROOT` is 64 zero hex digits | 🛑 BLOCKER | Any real aggregate necessarily mismatches; an independent expected fixture/predicate must be frozen before execution. |

No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, placeholder text, `new Function`, `node:vm`, direct `runMatch`, engine import, or game-rule mutation was found in the executed Phase 262 implementation files.

## Human Verification Required

None at this gap-discovery stage. The remaining custody authorization checkpoint is a future explicit human decision after ADMIT-03 and Plans 03–05 pass; it is not a reason to soften the current blocker.

## Gaps Summary

Phase 262 has achieved exact predecessor admission and has truthfully contained the failed reproduction. It has not achieved the phase goal. ADMIT-03 is a hard process blocker, and Plans 262-03 through 262-07 are correctly held behind it.

The appropriate first closure is a new bounded parallel supervised branch under the unchanged 90-minute gate and unchanged canonical runtime/kernel, with explicit four-way concurrency, memory/headroom, cleanup, progress, and charged-accounting proof. Raising the gate, direct-engine execution, rule changes, partial reuse, and omission of either the prior failure or calibration are not valid closures.

After ADMIT-03 passes, the existing dependency chain may resume with Plans 262-03 through 262-07. None of their missing deliverables is deferred to a later milestone phase.

---

_Verified: 2026-07-29T05:03:26Z_
_Verifier: the agent (gsd-verifier)_
