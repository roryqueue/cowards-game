---
phase: 265
plan: 16
date: 2026-10-05
status: diagnosis_only_initiating_cause_unknown
route: baseline-v4
implementation_authorized: false
empirical_reproduction: false
---

# V4 baseline subprocess diagnosis

The initiating reason remains **unknown**. Static source does establish a diagnostic-provenance defect: the selected TypeScript persistent broker can emit synthetic `SIGKILL` metadata when its deadline/completion gate fails, and that sentinel is reported as `SUBPROCESS_SIGNAL` without its specific origin. The evidence does not establish that an operating-system signal occurred, that Wasmtime was involved, or that OOM caused the failure. The earlier human-facing statement that the subprocess received a signal must therefore be narrowed to “the broker reported a signal-shaped failure; this selected source route can generate it synthetically.”

## Consumed evidence and source routing

Only NEW `.strategy-lab/lean-correction-supervisor-baseline-20261005-v4/observation-9.json` finite metadata was inspected: `cell.diagnostic` contains `SUBPROCESS_SIGNAL / native_response / executor / selectActivations / ordinal0`; `cell.compact` contains `system_failure / SUPERVISOR_FAILURE / elapsedMs7358 / invocationCount2 / cleanupComplete:true`. No private source, error text, IO or stdio was printed. The diagnostic does not retain broker branch, wait disposition or completion-buffer state.

The selected static chain is:

`legacy broker deadline/completion failure → synthetic signal field → SUBPROCESS_SIGNAL → executor/unknown origin → native_response/executor → compact SUPERVISOR_FAILURE`.

- `scripts/lib/v1-38-planner-supervised-runtime.ts:127` selects the TypeScript persistent container adapter, not the Wasmtime lane.
- `scripts/lib/v1-38-lean-container-match-session.ts:140-142` starts its wait deadline before Worker construction; deadline or completion flag other than `1` triggers Worker termination and a synthetic `signal:"SIGKILL"` result.
- The same file `:368-380` maps validated broker response with non-null signal to `SubprocessSystemFailure("SUBPROCESS_SIGNAL")`. Actual stream timeout/child exit follows distinct stream-failure handling at `:233` and `:253-255`.
- `scripts/lib/v1-38-planner-supervised-runtime.ts:155-159` falls back to `executor/unknown` when the exception lacks registered session provenance.
- `scripts/lib/v1-38-lean-baseline-match.ts:180` projects the retained origin as `native_response/executor`.
- `scripts/run-v1-38-lean-experiment.ts:170-174` normalizes system failures to compact `SUPERVISOR_FAILURE`.

This establishes the selected branch's diagnostic meaning, not its initiating performance/resource cause. Worker startup/module-loading overhead, expensive method execution, scheduling delay and Worker resource failure cannot be separated with the retained fields. Cell elapsed7358ms spans setup, two invocations and cleanup, not one guest execution or one host receipt. It disproves exhaustion of Match600000ms; it does not by itself prove any guest/host timer defect. Presence of the finite diagnostic and explicit normalization also defeats inference of a hidden broadcatch solely from the compact code.

The timers are distinct, not an accidental host5000→1000 reduction: `scripts/lib/v1-38-lean-experiment-authority.ts:54-57` provides `receiptMs:5000`; the session installs it at `:302-305` and uses it for host `stream.exchange` at `:368`. Broker request `:363` still carries the unchanged1000ms guest-side deadline used at `:140-142`, including Worker startup. These facts do not establish an unauthorized timeout-bound defect.

## Narrow prospective recommendation — not authorization

Retain a finite, authenticated broker-origin diagnostic distinguishing deadline expiry, non-ready completion and observed stream termination. Carry the origin through the existing native-response exception registration and retained correlation; do not expose raw error/stdio/Strategy contents. Keep `system_failure`, compact normalization, guest1000ms, host5000ms and Match600000ms unchanged. Preserve old default/legacy schema behavior: any new strict origin representation must use an explicit prospective version/join rather than reinterpret old consumed artifacts.

Source-only, no-native synthetic regression fixtures should cover deadline versus completion-not-ready provenance; actual stream exit versus synthetic sentinel; selected method/ordinal/invocation correlation; fallback when origin is genuinely unavailable; strict privacy allowlisting and unchanged bounds; and unchanged old schema acceptance/normalization. These fixtures would verify diagnostic fidelity only. They are not a demonstrated performance repair or permission for a fresh diagnostic, baseline, provider, Strategy, Match, helper, importer or ordinary reader.

No implementation, commit, test or actual native reproduction occurred. The unique baseline entry84983 and retained reader26989 remain closed; consumed requests/allocation/results/checks/journals/authority remain immutable. The accepted retained check remains incomplete10/36, nine successes plus one system failure; no current baseline/Phase265/freeze/formation/holdout/public/counted/production/fullLEAG credit follows. See `265-16-FRESH-READER-BASELINE-VERIFICATION-v1.md` for exact roots.

## Accounting

All later source/report/admin wall time carries from24910444ms at1791229625398. At observed1791230224438, conservative closed-anchor carry was599040ms, cumulative25509484ms, leaving3290516ms under the unchanged28800000ms ceiling. This is a report snapshot, not a mutation/refund/reset of the consumed journal; all time after that observation also carries. Existing15GB/eight-hour/300Match bounds and23 cumulative charges remain unchanged. The four-hour proposal is unapproved.
