---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
scope: source_only_subprocess_attribution
date: 2026-10-04
status: source_repair_self_verified_pending_root_review
actual_initiating_cause: unknown
empirical_repair_proved: false
baseline_unblocked: false
---

# Plan 265-16: bounded subprocess diagnosis v1

The consumed baseline's initiating cause remains **unknown**. Source comparison
does not establish a baseline-only runtime identity or bound mismatch. A separate
cleanup/error-attribution defect is reproducible with isolated mocks; its RED
checkpoint and subsequent source-only repair are not a repair of the actual failed baseline.

## Four bounded stages

1. **Composition comparison.** `runLeanBaselineMatch` and the successful pilot's
   `nativeLeanProvider` authorize immutable factory source, build the selected
   container-subprocess revision, bind source/executable/tuple/image, and issue
   charge-bound lean authority through the same factory → planner → session →
   broker composition. Guest 1,000 ms, host 5,000 ms and Match 600,000 ms remain
   unchanged. The pilot has additional duplicate identity assertions; their
   absence in baseline is not itself a demonstrated failure mechanism because
   relevant factory/planner/session binding checks still apply.
2. **Attribution trace.** Legacy broker code can synthesize `SIGKILL` after a
   bounded legacy wait. Session `runMethod` raises `SUBPROCESS_SIGNAL` when its
   accepted outer frame has a signal field; planner uses `executor/unknown` as
   fallback when no finer session origin exists. The consumed finite diagnostic
   (`native_response/selectActivations/executor/ordinal0/SUBPROCESS_SIGNAL`) does
   not distinguish external native signal, synthetic termination, guest cause,
   memory pressure or host cause. No resource increase or timeout relabeling is
   justified. In the native error path, however, `poison(); throw error` lets
   uncontained cleanup exceptions replace the original error. The inner-response
   path already guards against this masking.
3. **Discriminating mock fixture.** New test
   `scripts/lib/v1-38-lean-subprocess-attribution.test.ts` provides one synthetic
   accepted signal frame and individually throws from stream close, owned
   removal, or final absence inspection. It expects original finite
   `SUBPROCESS_SIGNAL` classification, poisoned/no-next-dispatch behavior, one
   bounded cleanup attempt and explicit incomplete cleanup. Unchanged source
   fails all three cases because the original classification is replaced. Only
   process-local mocks run; the inert source field is serialized, never executed.
4. **RED-to-GREEN source containment.** Manager independently reran the original
   three-case fixture and confirmed exit1/all3 RED before implementation. The
   narrow repair independently contains stream close, owned removal and final
   absence inspection, attempts each step once even after an earlier throw and
   caches `cleanupComplete:false/orphanedChild:true` when any operation throws.
   Original primary errors propagate unchanged; the poisoned/closed state blocks
   further dispatch. The original three fixtures then pass GREEN. Expanded
   mocked cases cover original error object identity and origin, stale response
   correlation, combined cleanup throws and explicit close. Actual initiating
   cause and empirical repair remain unproved; no baseline continuation follows.

## Exact RED evidence

```text
pnpm exec vitest run scripts/lib/v1-38-lean-subprocess-attribution.test.ts --maxWorkers=1
```

Actual session `33391`, exit `1`: 1 test file failed, 3 tests failed, duration
2.08 s; first ten failure-output lines:

```text
 ❯ scripts/lib/v1-38-lean-subprocess-attribution.test.ts (3 tests | 3 failed) 11ms
     × should preserve native signal classification when stream-close cleanup throws 8ms
     × should preserve native signal classification when remove cleanup throws 1ms
     × should preserve native signal classification when absence-check cleanup throws 1ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  scripts/lib/v1-38-lean-subprocess-attribution.test.ts > native subprocess attribution across cleanup failure > should preserve native signal classification when stream-close cleanup throws
 FAIL  scripts/lib/v1-38-lean-subprocess-attribution.test.ts > native subprocess attribution across cleanup failure > should preserve native signal classification when remove cleanup throws
 FAIL  scripts/lib/v1-38-lean-subprocess-attribution.test.ts > native subprocess attribution across cleanup failure > should preserve native signal classification when absence-check cleanup throws
```

Finite assertion: expected original `SUBPROCESS_SIGNAL`, received `null` when the
captured error was no longer `SubprocessSystemFailure`. No raw error or stdio
payload is printed. Confirmed source defect: cleanup error masking. Falsifier:
unmodified source preserves the original code and explicit incomplete cleanup
across the same three mocks. That falsifier failed on all three branches.

## Applied source-only repair and bounded gates

Only `remove()` in `scripts/lib/v1-38-lean-container-match-session.ts` changes
functional source. It independently contains the three cleanup operations,
still attempts removal and final absence inspection, caches an incomplete
receipt if any operation throws and lets the original native error propagate.
No broker/harness, source/runtime identity, stale-response/correlation, timeout,
resource, runtime-violation or game-rule logic changes. No empirical artifact
is read or written by these source gates.

Actual bounded gates, all process-local mocks/static checks:

- Original RED command after repair: exit0, original 3/3 GREEN (duration1.97s).
- Same command after fixture expansion: exit0, 16/16 PASS (duration2.15s).
- Final repeat after formatting only the new fixture: exit0, 16/16 PASS
  (duration2.05s); no intermittent failure observed in these two mock executions.
- Selected existing safe lifecycle/stale/absence/origin mocks: exit0,
  51 PASS/57 skipped (duration2.94s). Exact command:

```text
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts --maxWorkers=1 -t 'private IPC diagnostics injected session|multiplexes mixed methods|poisons on .*persistent response frames|poisons on stream timeout|treats status-1|requires exact absence|accepts the exact|rejects Docker 29.4|keeps separate streams'
```

This selection excludes broker/child/Strategy execution and receipt allocation/
provider tests; isolated native-origin mocks do not construct a real Worker.
Existing exact absence tuples and near misses, poisoned/no-fallback behavior,
stale/corrupt correlation and separate request counters remain protected.

Configured strict no-emit owned-file types: exit0/no diagnostics:

```text
pnpm exec tsc --noEmit --ignoreConfig --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts
```

The first standalone invocation omitted `--types node` and exited2 with missing
Node declarations; it is not recorded as a pass. Adding the explicit types
corrected checker configuration only, not project code. `git diff --check`
passes. No broader test suite or global script typecheck is asserted. Root's
independent post-commit source review/verification is still required; the debug
journal stays at its original path and is not archived as empirically resolved.

The consumed baseline had `cleanupComplete:true` and retained the signal code;
this masking branch was **not observed there** and is not its established
initiating cause. Missing metadata alone is not a defect diagnosis. Source proof
of this adjacent error path cannot unblock the consumed fixed schedule or prove
a prospective empirical repair.

## Immutable history and non-authority

The producer and unique ordinary retained reader `37314` remain closed/spent.
No old/new ordinary retained reader, allocation, prepare, preflight, admission,
provider, Strategy or Match execution was invoked. All `.strategy-lab` consumed
requests, allocation/results/ledger/time/verifiers and zero-byte reservations
remain untouched. No replacement, replay/reconstruction, resource reset,
formation, freeze, holdout, LEAG/Phase completion, public/counted play or product
promotion is claimed or authorized. Cumulative ceilings remain 15 GB / 8 hours /
300 Matches. This is an existing Plan 265-16 supplement, not a new numbered plan.
