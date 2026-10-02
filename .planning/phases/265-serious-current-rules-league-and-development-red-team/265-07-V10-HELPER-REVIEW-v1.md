---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-02T16:44:49Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - .strategy-lab/league-265-prospective-v10-20261002-a/prepare-data.ts
  - .strategy-lab/league-265-prospective-v10-20261002-a/run-entry.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 265 v10 Helper Review

**Reviewed:** 2026-10-02T16:44:49Z  
**Depth:** deep  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

Reviewed only the two new private v10 helpers and traced their V2 allocation,
repository, and source-gate dependencies. Both helpers are import-inert and the
preparation paths distinguish historical static capacity sizing from fresh
capacity admission. However, the entry guard does not establish that the new
league repository is empty, and the entry accepts a self-asserted completion
JSON without proving that the unique source gate actually produced it. Do not
publish the allocation or enter the route until both blockers are fixed.

## Critical Issues

### CR-01: The prepared league repository is not checked for emptiness

**Classification:** BLOCKER  
**File:** `.strategy-lab/league-265-prospective-v10-20261002-a/prepare-data.ts:33`  
**Issue:** `assertPreparedLeagueDirectory()` only calls `createLeagueRepository()`.
That constructor's `safeDirectory()` checks that the existing path resolves to
itself, is a directory, and has a `league-` basename; it does not enumerate or
reject existing contents. `run-entry.ts:47` invokes this function before
publication/reservation, but a pre-populated `league-evidence` directory passes
the guard. The later run can therefore mix this supposedly fresh v10 route with
stale or foreign retained artifacts, undermining allocation/retained evidence
isolation.

**Fix:** Keep the guard read-only, but explicitly `lstat` the exact expected
directory and require `readdir` to return no entries before returning the
repository. Reject symlinks and unexpected directory identity; do not create,
clean, or repair the directory in this guard.

### CR-02: A fabricated completion marker bypasses the actual source gate

**Classification:** BLOCKER  
**File:** `.strategy-lab/league-265-prospective-v10-20261002-a/run-entry.ts:29-33`  
**Issue:** `requireCompletedGate()` treats any parseable JSON at the fixed
`*-complete.json` path as proof once six caller-controlled fields match. It
does not bind the marker to the unique gate's exclusive start record, verify
that no failure/terminal marker exists, or validate the gate helper/CI command
pins and command evidence. A hand-written marker containing the expected
source roots and `[3,4,1,2,5,6,7,8]` is sufficient to pass this check and reach
allocation publication or route entry even if the active gate never completed.
The current source-gate report is explicitly active/not passed, so this is a
live bypass of the required eight-command gate, not merely missing historical
metadata.

**Fix:** Admit a strict completion record tied to the unique exclusive start
record and its reviewed helper/CI pins, verify the ordered command completion
evidence and absence of a terminal failure, and bind the admitted completion
root to the source-gate report before allowing either mode to proceed. Keep
the current active report non-authorizing until the gate has actually closed.

## Verification Notes

No helper mode, type-check, test, source gate, capacity observation, allocation,
provider, Match, or retained verifier was run. No source/helper/test file was
modified. The only write was this review artifact.

---

_Reviewer: independent gsd-code-reviewer; deep scoped helper review._
