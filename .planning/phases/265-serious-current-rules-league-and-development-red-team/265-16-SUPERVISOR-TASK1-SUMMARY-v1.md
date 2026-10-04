---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: supervisor-continuation
scope: task_1_source_only
status: complete
plan_complete: false
phase_complete: false
empirical_execution: not_started
subsystem: private-supervisor
tags: [finite-reasons, parent-custody, opt-in, tdd]
requires:
  - phase: 265-15
    provides: Existing bounded parent lifecycle and immutable consumed evidence
provides:
  - Explicit opt-in finite parent-supervisor reason envelope
  - Exact canonical byte validator and typed downstream contract
affects: [265-16-supervisor-task-2, 265-16-supervisor-task-3]
tech-stack:
  added: []
  patterns: [host-owned finite branch observation, exclusive preterminal publication]
key-files:
  created: []
  modified: [scripts/run-v1-38-lean-baseline.ts, scripts/run-v1-38-lean-baseline.test.ts]
key-decisions:
  - Preserve default parent behavior and emit no new artifact without explicit true opt-in.
  - Snapshot process exit only; provider cleanup and subsequent terminal publication are not certified by this envelope.
requirements-completed: []
duration: 8min
completed: 2026-10-04
---

# Phase 265 Plan 16 Task 1: Finite Parent Supervisor Observations Summary

Opt-in canonical host-only branch reasons bind the actual parent entry and exit before terminal publication, while preserving existing uncertainty and failure behavior.

## Accomplishments

- Instrumented all existing uncertainty setters with finite deduplicated codes without changing checks, their ordering, timers, resource thresholds, kill signals, terminal classification, or cleanup operations.
- The existing terminal callback first resolves optional child-failure receipt publication, then publishes the bounded owner-only reason snapshot, then derives/publishes the unchanged child terminal. A reason publication/validation failure latches uncertainty and still attempts terminal publication; it cannot authorize success.
- Exact-key finite validators reject malformed roots/identities/enums, extra/raw keys, nonfinite numbers, duplicate/out-of-order codes, contradictory observations, invalid roots, noncanonical bytes and payloads over 4096 bytes.
- Added paired on/off mocks for every existing uncertainty branch, simultaneous reasons, default artifact absence, publication order/capacity, failure-preserving reason/terminal publication, child failure-receipt separation, and pre-entry capacity/ready cleanup.

## Task Commits

- RED: `2e7ad492` — test(265-16): add parent supervisor observation regressions. Initial run: 13 failed/8 passed, including missing API/artifact expectations; the fake deadline fixture was subsequently shortened and its misplaced setup corrected without changing runtime timers.
- GREEN: `a59a062f` — feat(265-16): capture bounded opt-in parent uncertainty reasons.

## Downstream API Contract

`runLeanBoundedParent` accepts `supervisorObservation?: true`. Omission emits no reason artifact. Explicit true writes exactly `LEAN_SUPERVISOR_REASON_FILE = "parent-supervisor-reasons.json"` in the caller's existing private store using the existing exclusive owner0600 file writer and publication-capacity accounting. No route, helper mode or empirical entry is introduced here.

Exports:

- `LEAN_SUPERVISOR_REASON_MAX_BYTES = 4096`
- `LEAN_SUPERVISOR_REASON_CODES`: ordered frozen finite code list
- `LeanSupervisorReasonCode`, `LeanSupervisorReasonEnvelope`
- `isLeanSupervisorReasonEnvelope(value: unknown): value is LeanSupervisorReasonEnvelope`
- `validateLeanSupervisorReasonBytes(bytes: Uint8Array): LeanSupervisorReasonEnvelope`, throwing finite `LEAN_BASELINE_SUPERVISOR_REASONS` on rejection

The exact schema is `lean-parent-supervisor-reasons-v1`; its root domain is also `lean-parent-supervisor-reasons-v1`. Top-level keys are exactly `schemaVersion`, `allocationRoot`, `sourceRoot`, `requestBytesRoot`, `entryBytesRoot`, `head`, `parentPid`, `childPid`, `exitCode`, `signal`, `uncertain`, `reasons`, `observations`, `root`. Entry bytes root is computed from the actual published entry file. All other custody/exit values come from held parent observations, not child assertions.

The reasons are ordered by the exported list, deduplicated, and may coexist: `child_error`, `malformed_ipc`, `duplicate_failure_receipt`, `resource_threshold`, `resource_sampling_exception`, `deadline_timeout`, `final_identity_mismatch`, `final_identity_exception`, `failure_receipt_publication_uncertain`.

Observations have exactly these finite keys/dispositions:

| Key | Allowed values |
| --- | --- |
| entry | published |
| childReady | observed |
| resourceSampling | observed, exception |
| finalIdentity | matched, mismatch, exception |
| failureReceipt | absent, published, publication_failed |
| cleanup | child_exit_observed |
| terminalization | unobserved |
| initiatingCause | unknown |

`cleanup` is process exit only, never provider/container cleanup acceptance. Terminal write and finally cleanup occur later and cannot be retroactively inserted. A pre-entry failure publishes no invented entry-bound envelope. Missing/failed reason custody remains non-accepting. A valid receipt can produce a failed terminal while `uncertain` is false: receipt presence itself already causes failure under unchanged classification.

The validator checks canonical shape/root/bytes only. Tasks 2/3 still own actual route/source/request/entry/terminal/result joins, complete retained evidence/cleanup, unique check accounting, and acceptance; a reason envelope alone confers no authority.

## Verification

- `pnpm exec vitest run scripts/run-v1-38-lean-baseline.test.ts --maxWorkers=1`: 23/23 pass; 4.80 seconds total, 872ms test execution.
- `pnpm exec tsc -p packages/strategy-lab/tsconfig.json --noEmit`: pass with the unchanged strict project configuration.
- Stronger explicit script compiler check with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`: the current transitive closure has the same nine pre-existing diagnostics as pre-RED originals, with zero new diagnostics. An in-memory TypeScript compiler-host overlay compared the two owned original files at `2e7ad492^` with current source using identical flags; no file rewrites or compiler weakening were used for that comparison.
- `git diff --check`: pass. No task commit deletes tracked files.
- Stub scan: no TODO/FIXME/placeholder stubs in the owned files. Unknown initiating cause and unobserved future terminalization are deliberate evidence limits, not inferred faults.

## Deferred Issues

Stronger explicit-file checking reports nine inherited optional-property diagnostics in `assess-v1-38-factory-independence.ts`, `v1-38-league-response-runtime.ts`, `v1-38-lean-child-cli-terminal.ts`, existing baseline scope/match calls, `run-v1-38-lean-experiment.ts`, and `run-v1-38-serious-league.ts`. A separate explicit-file attempt without exact optional-property mode instead encountered the inherited `feasibility-protocol.ts:52` inferred JsonValue issue. Neither ad-hoc command is a clean full closure type pass; the unchanged project check is clean, and the strict before/after comparison proves zero task-introduced diagnostics. These unrelated issues were not repaired.

## Deviations from Plan

None to functional scope. This is only the owning Task 1 source handoff; MAIN owns broader independent review/verification and subsequent tasks. STATE, ROADMAP, REQUIREMENTS, historical artifacts/readers, empirical allocations and all resource/opportunity bounds remain unchanged. No old cause is claimed and no speculative RSS race is patched.

## Threat Surface and Result Boundary

The only added file-access surface is the planned private parent-reason file, covered by T-265-S16-01/04/05 and exclusive bounded publication. No new endpoint/auth/provider/engine/game-rule/public surface is introduced. No source, error text/stack, child IO, input, StrategyMemory or SoldierMemory is retained in the reason envelope. No empirical/provider/Match/allocation/old-reader/helper-mode action was performed. No LEAG, freeze, formation, holdout, public, counted, production, release or whole-plan/phase completion credit is granted.

## Self-Check: PASSED

Both modified source/test files and this scoped summary exist. RED `2e7ad492` and GREEN `a59a062f` are present in repository history. No tracked deletion occurred. Only owned files were staged in either task commit.
