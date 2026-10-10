---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T22:43:39Z
depth: standard
source_head: 63924e5ccfe740461bde685fab8b9bd784c0f7b6
diff_base: 305a932cf6e43c2d3afb1e44cf5f26a5b334c640
files_reviewed: 7
files_reviewed_list:
  - scripts/run-v1-38-lean-private-matches.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Two-Match Source Review

## Narrative Findings (AI reviewer)

Bounded independent source review of the seven owned source/test paths against the stated initial base, with direct tracing into the existing canonical bridge, compact producer and factory/runtime authority boundaries. No tests, metadata CLI, preparation, entry, provider, Strategy, Match, historical materialization or empirical reader were run. No source files were changed. This is not empirical admission, feasibility, full Chronicle verification, or Phase/LEAG completion. The inherited strict errors and untested genuine-handle canonical-composer path remain disclosed limitations, not newly proven findings.

## Critical Issues

### CR-01: BLOCKER — A charged exceptional attempt has no retainable terminal/result

**File:** `scripts/run-v1-38-lean-private-matches.ts:221-236`; reader `:248-264`; shared composer `scripts/lib/v1-38-lean-baseline-match.ts:200-203`.

**Issue:** After the durable debit, the runner has only a `finally` for provider cleanup, not a catch/finalization path. A rejection from source validation, the composer, its post-cleanup checkpoint/compact projection, the stream producer, stream verifier, or terminal resource observation exits before the terminal and aggregate result are written. This is reachable without a fabricated handle: a resource/time checkpoint can refuse after the actual Match and cleanup, and the stream guard explicitly throws at the 600000ms boundary or a row/stream cap. The ledger still charges the attempt, and a partially written stream can survive, but the unique retained reader immediately opens `result.json` and then requires a full terminal/replay pair for every debit. It therefore cannot inspect and classify that charged partial attempt. The top-level catch reduces it to `LEAN_PRIVATE_MATCH_ROUTE`; the intended finite failure observation and honest partial-evidence closure are unavailable. If the second-slot capacity refuses after a successful first terminal, the same missing aggregate-result problem also loses readability of that first completed slot.

**Fix:** Within this dedicated lane, retain a bounded privacy-safe stop/failure terminal and aggregate result for every durably charged attempt and for a stop before slot two. Count attempts from durable debits, not only successfully written normal terminals. Preserve already-issued actual execution/accounting/identity commitments when available; if no actual result exists, use an explicit terminal-only failure variant with absent/unavailable provenance rather than inventing an execution root, source HEAD, board, or cleanup success. Unknown cleanup must stop admission, with no retry or second debit. Separate bounded failure-finalization checks from the exhausted success/admission guard, and extend the one read-only verifier to authenticate that finite failure variant plus the durable debit and any retained partial-stream commitment. Avoid treating a partial stream as a complete board chain. Add inert fault fixtures for composer rejection after debit, producer cap/guard refusal, and second-capacity refusal after terminal zero; assert readable charged failure, preserved prior terminal, and no additional issuance. Do not change the old routes or approval limits.

## Review boundary and handoff

Source review commands are closed; ownership of this review artifact is released to ROOT on delivery. One concrete blocker is open. No runtime-runnable happy-path defect was established within this bounded review; absence of another finding is not assurance or authority to enter. Source-only review/fix and the remaining independent gates still precede any allocation/entry.
