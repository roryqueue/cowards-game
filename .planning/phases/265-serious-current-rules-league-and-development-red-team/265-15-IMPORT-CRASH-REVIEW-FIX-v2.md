---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-10-03T19:07:01Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-IMPORT-CRASH-REVIEW-v2.md
iteration: 2
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 265: Import-crash review fix, iteration 2

All three v2 source findings received narrow fixes, each in an atomic commit. `all_fixed` describes the v2 code-review disposition only: prospective allocation remains intentionally closed on the unestablished historical disk bound. No pilot, phase, capacity receipt, or resource-accounting amendment is claimed.

## Fixed issues

### CR-01 — Factory attempt inventory remains unbounded before the 48-entry check

**Files modified:** `scripts/assess-v1-38-factory-independence.ts`, `scripts/assess-v1-38-factory-independence.test.ts`, `scripts/run-v1-38-serious-league.ts`  
**Commit:** `71651d61`  
**Status:** fixed: requires human verification.  
**Applied fix:** The lean-only path now iterates filenames with a bounded count, validates syntax and exactly 48 start/terminal pairs, reserves capacity before collecting/sorting names, and refuses over-48 attempts before reading an attempt body or materializing the artifact index. It passes the bounded inventory to the ledger reader; bounded historical reassessment repeats the preflight. The ordinary/legacy reader remains on its original API and semantics. A synthetic 49-start malformed-body fixture proves early denial.

### CR-02 — Predecessor inventory accepts unsupported zero historical bounds

**Files modified:** `packages/strategy-lab/src/league/lean-experiment.ts`, `packages/strategy-lab/src/league/lean-experiment.test.ts`  
**Commit:** `f6c82997`  
**Status:** fixed: requires human verification; admission closed.  
**Applied fix:** The predecessor validator explicitly denies the historical core/cache bound because no contemporaneous failed-PID core limit or TSX cache-write ceiling has been established. A reviewer string, report hash, current absence, or self-asserted numeric zero cannot open it. Synthetic positive-number and zero-number inventories both deny. The pending human disk-accounting choice is neither applied nor anticipated by this source change.

### CR-03 — Prospective writable-scope guard leaves Node cache/report outputs enabled

**Files modified:** `scripts/run-v1-38-lean-experiment.sh` (new pre-Node launcher), `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.test.ts`, `packages/strategy-lab/src/league/lean-experiment.ts`  
**Commit:** `817ab595`  
**Status:** fixed: requires human verification.  
**Applied fix:** The launcher clears Node report/compile-cache/warning/coverage write settings, disables TSX and Node compile caches, sets core soft limit zero, and places `TMPDIR` in a dedicated pilot-owned path before invoking Node/tsx. The runner checks the inherited values and exact temp path. The launcher is included in the source manifest; v2 cumulative physical accounting, publication checks, and resource checkpoints include the owned temp path and prospective allocation file. A shell-only probe exercised hostile inherited settings without starting Node or an empirical route. Future entry should use `sh scripts/run-v1-38-lean-experiment.sh ...`; direct Node entry is not the reviewed launch contract.

## Verification and limits

- The genuine synthetic full-48 historical verifier and two-candidate import regression passed in both ordinary and bounded modes after CR-01. The focused four-file command passed 5 tests (182 filtered); the full lean-runner synthetic suite passed 12 tests.
- Scoped strict TypeScript checks for changed source/tests, `sh -n` for the launcher, and `git diff --check` passed. An initial Vitest invocation used multiple `-t` options and was rejected by its CLI parser before tests ran; it was corrected to one pattern and passed.
- All tests used synthetic/inert fixtures. No old private historical reader, preparation, provider, container, Match, model, or empirical entry was run. The existing immutable v1 failure, 565,459-ms time carry-forward, shared 15-GB/eight-hour/300-Match ceilings, runtime guest/host/Match limits, and unopened holdout were unchanged.
- The historical disk accounting blocker remains external to these source fixes: today's inventory does not establish the failed process's cache/core high-water bound. Fresh v2 allocation must continue to fail closed until a separately authorized and technically sound accounting basis exists. No source-only test can turn that unknown into a pilot pass.

---

_Fixed: 2026-10-03T19:07:01Z_  
_Fixer: gsd-code-fixer_  
_Iteration: 2_
