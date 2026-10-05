---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
verified: 2026-10-05T23:20:24Z
scope: actual_failed_v5_baseline_entry_terminal_only
status: gaps_found
ordinary_reader_invoked: false
terminal_check_count: 1
entry_session: 84884
entry_exit: 1
terminal_status: child_failed
terminal_exit_code: null
terminal_signal: SIGKILL
terminal_elapsed_ms: 96096
recorded_current_charges: 0
cumulative_recorded_charges: 24
recorded_observations: 0
result_exists: false
check_exists: false
accepted: false
phase_complete: false
freeze_admitted: false
execution_authorized: false
held_head: f2df613f3d5563aa72e7e3e6dc9bcc81bcbaeedf
source_root: sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873
allocation_root: sha256:602a7e1b2869935b03a683943c220d0d7581a10119aa273ef1197633cb3a2d02
closed_elapsed_ms: 33812347
latest_closed_ms: 1791242322180
accounting_active: false
gaps:
  - truth: The distinct fresh36 baseline produces an accepted complete current-rules baseline.
    status: failed
    reason: The unique entry failed with a retained resource_threshold reason before any current charge or observation was recorded; result and ordinary check are absent.
    artifacts:
      - path: .strategy-lab/lean-correction-supervisor-baseline-20261005-v5/child-terminal.json
        issue: child_failed, null exitCode, SIGKILL, elapsed96096ms
    missing:
      - Accepted complete baseline evidence; the consumed envelope cannot be retried without new authority.
---

# Startup v5 baseline — failed-entry terminal verification

The actual baseline entry failed and is closed. Exactly ONE independent read-only terminal check was performed; no ordinary retained reader was invoked because there is no actual result. This verifies terminal custody and recorded accounting only, not a Match, baseline acceptance or Phase265 completion.

## Actual terminal and closure

MAIN84884 closed exit1, with details withheld. The actual retained terminal independently records `child_failed`, `exitCode:null`, `signal:SIGKILL`,96096ms elapsed. The reason receipt has `reasons:[resource_threshold]`, `uncertain:true`, childReady/resourceSampling=`observed`, cleanup=`child_exit_observed`, finalIdentity=`matched`, initiatingCause=`unknown`.

Exact retained parent57975 and child58050 were absent in bounded `ps -p` checks. This confirms those two process IDs are no longer present, not provider/container or machine-wide cleanup certification. The reason's child-exit observation is not a successful Match cleanup receipt.

The exact numeric sample that triggered `resource_threshold` is not retained here. Terminal-only RSS observations are parent627642368B/child607703040B, with physical10625024B/free205825908736B at terminal; these do not establish which threshold/sample initiated termination. No OS OOM, native Strategy failure or precise initiating cause is inferred.

## Bounded identity and absence evidence

| Artifact | Actual semantic identity / raw SHA256 |
|---|---|
|Allocation|semantic `602a7e1b2869935b03a683943c220d0d7581a10119aa273ef1197633cb3a2d02`; raw `0a765ce8e2b91a880c27ed69dbcb235de2ab7c1e12de0c99da4a10e8ecc62111`|
|Request|raw `65085fdf272d95675758e2606a615e7894faeda6446e1f7ea75f4495052794fc`|
|Entry|raw `44a8fc7e2884f0dd8b84226a2705092fe2497b6706733da0eed49cbfd01196b8`|
|Terminal|raw `00419d07df57a590288349013170461817bb8656dfc827181d3d1941d70fb114`|
|Reason|semantic `9c999b79126145216fe07738c419977f1c2b9cfe13e25ab219f3295f0ecd09d2`; raw `325b8b4bd74dfc5c116ce9c9c5e8910b7cb95c1ca56527bd80102844e74e1b16`|
|Empty current journal|0B; raw `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`|
|Time journal|raw `8d9a3adedb736731e32c3ef75279b3da7c7f608585b0e0826954c297b28d5c0d`|

All hashes use the `sha256:` prefix. Allocation raw bytes were read before and after the check and are exactly identical. Allocation/entry/terminal/reason bind the same source `sha256:a0940a8a76119a8e2f0033bd91d24473acd383d97ca17d108395bccabb7d8873`, allocation, held HEAD `f2df613f3d5563aa72e7e3e6dc9bcc81bcbaeedf` and request. Terminal entryBytesRoot equals the measured entry hash. Parent/child identities agree across receipts. Current HEAD remains the held HEAD; bounded tracked-source `git diff --exit-code <heldHEAD> -- packages scripts apps` was empty/exit0. No source manifest/test or native helper was run.

The store contains only allocation, entry, child-terminal, parent-reason, empty ledger and time files. No `result.json`, ordinary baseline check or observation file exists. Thus recorded current charges/observations are0 and the carried predecessor remains24 cumulative charges. **Absence is not proof of zero unrecorded transient observations, work, allocations or side effects.** No successful or failed Match is fabricated from this prefix, and no36-cell result is invented.

## Closed effective accounting

Six events constitute three closed intervals, with no active interval:

| Interval | Effective start ms | Effective close ms | Charged elapsed ms |
|---|---:|---:|---:|
|Preparation|1791242200532|1791242225959|25427|
|MAIN entry|1791242225959|1791242322055|96096|
|Run finalization|1791242322055|1791242322180|125|

Predecessor33690699ms +121648ms current closed work = **33812347ms** cumulative closed elapsed. Latest authenticated close is **1791242322180**. Terminal wall/monotonic observations and effective entry close match retained96096ms custody; preparation→entry→finalization endpoints join exactly. This read-only check appended nothing. All later terminal verification/report/admin work continues carrying from this closure or later authenticated custody; the balance is not reset or frozen by this report.

## Failed envelope and scope limits

The existing at-mostONE fresh baseline envelope is consumed by this failure and ends. No retry, second entry, ordinary reader, old-cell reuse, recredit or fabricated result/head is authorized. Earlier accepted diagnostic/check remains immutable and does not convert this failure into baseline acceptance. Missing baseline evidence blocks the empirical goal; this report is not an instruction to fix/rerun it.

Same exact-v5 cumulative43200000ms,15GB/300Match, all spent24charges/surviving bytes, guest1000/host5000/Match600000, privacy and unchanged game rules remain binding. Historical disk/RSS peaks and exact initiating cause remain unknown. Phase265/LEAG/freeze/formation/holdout/public/counting/production and successful milestone closure receive no credit.

Only this new report was written. No route bytes/journal edits, ordinary reader, source/test edits, Strategy/provider/Match/helper invocation, commit or broad history scan occurred. Source and held HEAD remained fixed through the terminal check.

_Verifier: /root/verify_265_startup_v5; exactly one independent failed-entry terminal-only check._
