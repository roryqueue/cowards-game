---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-09-22T01:35:25Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-REVIEW.md
iteration: 7
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 265: Code Review Fix Report

**Source review:** current independent incremental CR-01 review at base `90010c25dc88903b25b014a1eea8d0ac05b93180`.
**Source fix:** `3d25b37e6ad2eb3edbfb298615d85128c98360e1` (`fix(265): CR-01 bound stream frames by bytes`).

## CR-01: v2 reader rejects a stream admitted within artifact limits

**Status:** fixed in source; parent will perform independent recheck and final combined gate.

**Main closeout:** independent recheck is clean at3d25b37e. The subsequent exact
29-suite gate passed273/273 tests, and the separate explicit fail-fast build/type/
boundary chain passed at the same source. This closes the source finding only;
the fixer's focused evidence and no-empirical-work statement below remain intact.

**Files modified:** `scripts/lib/v1-38-league-execution-stream.ts`, `scripts/run-v1-38-serious-league.test.ts`.

The reader no longer compares logical frame count to `maxArtifactRecords`, which caps physical artifacts. It bounds logical frames by authenticated stream `byteLength` and the minimum possible canonical frame size, while still requiring exact descriptor counts, ordinals, chain and execution commitments. On parsing, an extra frame fails as soon as it exceeds the authenticated declared count. The existing `2 * chunkCount + 1 <= maxArtifactRecords` physical-artifact check, graph unique-artifact read budget, writer preflight, canonical per-record admission, and all tamper/order checks remain. No allocation field or value changed.

### Focused evidence

A new actual graph regression uses 550 transitions with 300 nested entries, forcing `MAX_NODES_EXCEEDED` for whole-value admission. It verifies 552 logical frames exceed the 100-artifact allocation, the writer stores fewer than 100 physical artifact files, and `readLeagueRecordGraph` reopens the exact execution.

- **RED at original 90010c25 source:** selected regression failed with `LEAGUE_EXECUTION_STREAM_DESCRIPTOR`; 1 failed, 33 skipped, 15.21 s. An initial import-only attempt failed because the isolated checkout lacked package dependency symlinks and was not counted as RED; those symlinks were added without installing packages.
- **GREEN:** new regression plus existing missing/changed/reordered/bad-count/physical-overbudget test: 2 passed, 32 skipped, 29.46 s. A final tightened physical-count assertion rerun passed: 1 passed, 33 skipped, 30.52 s.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: exit 0.
- Strict scripts/test/helper type check with `tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck --types node,vitest/globals --esModuleInterop`: exit 0.
- `git diff --check`: exit 0.

No full 29-suite gate, real Match, Strategy, provider, model, historical private read, or empirical allocation occurred in this repair.

_Fixer: gsd-code-fixer; iteration 7. Report intentionally left uncommitted for parent lifecycle handling._
