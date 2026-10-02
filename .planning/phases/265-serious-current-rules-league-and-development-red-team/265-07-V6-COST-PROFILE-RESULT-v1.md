---
phase: 265
plan: "07"
status: measured_data_only
date: 2026-10-02
issued: false
empirical_completion: false
---

# Current-source v6 cost measurements

After consumed v6 and unique ordinary retained verifier65319 closed, root ran
ONE reviewed data-only profiler (session56053) on current source dbf5daa2,
implementation70430463/source2f008952. Watchdog exit0, no signal, no timeout,
no child output; elapsed11,718.278ms. Result complete=true, cleanupComplete=true,
error=null. Both actual source snapshots match the fixed implementation/source.
No provider, Strategy, Match, model, preflight, capacity admission or Docker
lifecycle occurred. This probe is closed and must not be repeated.

## Exact private artifacts and independent review

- Helper raw SHA256:6dc3ee8096e6e5f89662ddefb155fbd3c470cc58014771d4f3db6c038a2c9fb1.
- Entry raw SHA256:2a7f10cb6ec28c59b8916fb4995e150e526df6e7f52bfff7ce99f175d528c9a6.
- Watchdog raw SHA256:0c9d7f67bac33c75d6ac707b16cf97faac8928de7947971e3158286a0ffd678e.
- Private result `.strategy-lab/league-v6-cost-profile-20261002-a/profile.result.json`,
  41,867bytes, raw SHA256:f029ca2aefa307ce5da39f47d6a6abba97d461632f75b90a525c3a73a0fdb4fb.
- Independent reviewv1 be248f0c found one report-cap blocker; preserved unchanged.
  Root compacted root references and declared0.001ms retained precision, without
  changing timers/actions. Reviewv2 471e6d88 is clean; worst-case literal-only
  report bound56,493<65,536bytes. No probe ran before correction/rereview.

Five fixed, parent-proven retained v6 rows were used in two rounds/five repeats
per row. Selection is lexicographic, not chronology or all-workload coverage.
All350 component samples completed. Fifty fresh durable writer samples matched
the exact original payload/chunk/descriptor identities. Actual accounting:
150publications,504,320bytes,150filefsyncs,100directoryfsyncs;50no-op capacity
prechecks,35retainedreads/136,156bytes. Known owned temporary files/directories
were removed; existing private stores were untouched.

| Component | Samples | Mean ms | Median ms | p95 ms |
| --- | ---: | ---: | ---: | ---: |
| beforeInvocation, no-op capacity | 50 | 1.320 | 1.236 | 2.068 |
| Full value admission | 50 | 3.243 | 3.153 | 4.011 |
| Bytes admission | 50 | 2.277 | 2.218 | 2.602 |
| Encode only | 50 | 0.954 | 0.913 | 1.220 |
| Parse only | 50 | 1.362 | 1.274 | 2.094 |
| SHA only | 50 | 0.021 | 0.020 | 0.025 |
| Real fresh durable append | 50 | 107.548 | 107.026 | 109.440 |

File-sync inclusive time totals2,931.027ms; directory-sync time1,906.276ms.
Combined sync accounts for approximately90% of sampled append elapsed time.
Components overlap and must not be added to full admission/append. Instrumentation
overhead is included; append-minus-sync is not pure CPU. No live whole-Match
cost split, runtime construction cost, chronological trace or completion forecast
is claimed. This is CURRENT-source measurement, not the historical v3 profile.

## Separate observation-only pressure reader

Root's ONE separately reviewed ten-call pressure profile (session20757) completed
exit0/no signal/no raw output, complete=true/error=null. Actual production
`observeLeagueAvailableMemoryBytes` was called; its raw output and available-memory
values were discarded. No capacity receipt, preflight or dispatch was created.
This observation probe is closed, not reusable authority.

- Entry raw SHA256:281ecc5d4eecc55fa6c095dd3b4071076dce162b4b526fa4c03ca84e7910d466.
- Independent source review raw SHA256:495a5f1885a62ebc393321af8d077e4b7c19f1505b8c82706f6d1d3592e7dca7.
- Private `pressure.result.json`,237bytes, raw SHA256:a53478c44825f1290101525d6104a15aa50ba62b2bdd86164b5cb7a286442928.
- Ten observations: mean2.865ms, range2.257–5.352ms.

The two lstat/statfs pairs and full live capacity guard remain unmeasured. Neither
capacity cadence nor metric/threshold changes follow from this observation.

## Next corrective step, not a new empirical claim

CPU-only optimization cannot be presumed to solve the remaining sampled sync
cost. Plan a bounded asynchronous dependency-file sync implementation: keep every
individual file sync, the dependency directory barrier before descriptor publication,
the descriptor's final barrier, exact bytes/digests, conservative no-refund accounting,
and awaited retention before evidence/next dispatch. Source-only planning must
resolve in-flight failures and partial charges before implementation/review/tests.
No async repair is implemented or proven by this document, and no fresh Match
route is started. Standing approval remains subject to technical gates.

Phase265 stays incomplete; all LEAG requirements remain open. No current-rules
freeze, formation materialization, holdout opening, counted/public/production
execution or full empirical league result is authorized by these measurements.
