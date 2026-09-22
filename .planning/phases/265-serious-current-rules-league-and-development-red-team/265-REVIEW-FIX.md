---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-09-22T01:19:31Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-REVIEW.md
iteration: 6
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 265: Code Review Fix Report

**Source review:** current CR-01 realism amendment at main source `9c910d828776d9f1497493f72f6be775d09acc67`.
**Source fix:** `65b5cf63662f46151b8ddcb014d5799594e4c0de` (`fix(265): CR-01 stream oversized private executions`).

## CR-01: full executions exceed canonical admission before chunking

**Status:** fixed in source; requires independent review and final combined gate. The historical retained execution was not read or run by this fixer.

**Files modified:** `scripts/lib/v1-38-league-execution-stream.ts` (new), `scripts/run-v1-38-serious-league.ts`, `scripts/run-v1-38-serious-league.test.ts`, `packages/strategy-lab/src/league/connected-runner.ts`, `packages/strategy-lab/src/league/contracts.ts`.

Small admissible graph values retain their exact v1 bytes and roots. Oversized executions in the three affected graph kinds now use a private v2 execution reference whose header, state, result events, transitions, and accounting are individually canonicalized and ordinal-bound, packed into 128 KiB chunks, and committed through chunk roots, a chain root, counts, lengths, an execution commitment, and the existing parent graph links. The graph reader authenticates streams on traversal, retains only compact index metadata, and reconstructs one requested execution on demand. Aggregate read/write bytes and artifact records remain charged to the declared limits; no canonical profile limit changed. Oversized result-event and normalized-gameplay aggregates use domain-separated ordered-record roots, while small roots remain v1. Replay comparisons use the same bounded ordered commitments.

The connected runner publishes the cell-result before its immutable journal terminal and reserves terminal headroom. If retention or later terminal publication fails, it records an anchored issuance-failure/charged process-invalid prefix rather than a scored result. The retained verifier recognizes only that authenticated failure disposition. No rules, runtime, live issuance, or scoring policy was changed.

### Verification actually run

- Focused serious-league selector (new stream, tamper/order, charged failure-prefix tests): **3 passed, 30 skipped**, 80.50 s.
- Retest of the final tamper/order regression after a test-only type correction: **1 passed, 32 skipped**, 3.35 s.
- Connected-runner and contracts tests: **7 passed**, 5.61 s.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: exit 0.
- Strict scripts/test/helper type check with `tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --skipLibCheck --types node,vitest/globals --esModuleInterop` on the three changed script files: exit 0.
- `git diff --check`: exit 0.

The original 9c baseline combined gate was run by the parent (29 suites/269 tests passed); it is not evidence that this new source has passed that full gate. No full CLI suite or real Match was run here. The pre-fix storage failure is the read-only historical witness in the amended review; the new tests were not claimed as pre-fix RED/TDD.

### Data-only diagnostic and format overhead

`diagnoseLeagueExecutionStorage(createLeagueRepository(freshEmptyLeagueDirectory), alreadyRetainedExecution, declaredLimits)` is an exported data-only entry point. It refuses a nonempty repository, writes and reopens one graph record, compares the complete execution, and returns `headRoot`, input/stored bytes, overhead, and artifact count. The fresh directory must be a realpath whose basename starts `league-`. It does not dispatch a Match, provider, model, or replay. The parent may call it on an already-retained old execution in a separate fresh temporary repository; no historical artifact was read by this fixer.

A synthetic 9,204,904-byte execution generated solely for this check packed into **71 stream chunks/143 stream artifacts**; stream artifacts totaled 9,226,946 bytes (**+22,042 bytes, 0.24%** over ordinary JSON input). The full fresh graph diagnostic reported **146 artifacts, 9,227,650 stored bytes, +22,746 bytes** (0.247%) including parent graph. This is format overhead for this synthetic shape, not a measured old-trace count, heap bound, OOM claim, or allocation approval. Resource proposals must account for two artifacts per 128 KiB stream chunk, one stream descriptor, and three parent graph artifacts for a small parent.

_Fixer: gsd-code-fixer; iteration 6. Report intentionally uncommitted for parent lifecycle handling._
