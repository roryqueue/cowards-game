---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-05T16:21:02Z
depth: standard-targeted-rereview
files_reviewed: 2
files_reviewed_list:
  - scripts/diagnose-v1-38-saved-evidence.ts
  - scripts/diagnose-v1-38-saved-evidence.test.ts
source_sha256: 399a67e7629f253238f7390540b9bcf469682a8056af362133fc1cc941f3b8bf
helper_sha256: 399a67e7629f253238f7390540b9bcf469682a8056af362133fc1cc941f3b8bf
findings:
  critical: 0
  blocker: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Saved Evidence Diagnostic Targeted Re-review

**Reviewed:** 2026-10-05T16:21:02Z  
**Depth:** standard, targeted to BL-01 and WR-01 fixes  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

The global visit counter now bounds recursive inventory expansion, and the monotonic/RSS guard is threaded through each visit and loader stage. The supplied external 60-second alarm also covers non-cooperative synchronous calls and process startup. The prior findings are substantially addressed. One residual resource-bound gap remains: each directory is still fully materialized by `readdirSync` before the count and RSS checks can reject it. This was a source-only targeted re-review; no real diagnostic or saved-data reader was run.

## Warnings

### WR-02: Directory enumeration allocates before enforcing the global cap

**File:** `scripts/diagnose-v1-38-saved-evidence.ts:580-584`
**Classification:** WARNING
**Issue:** The new global visit cap is enforced as child paths are recursively visited, but `readdirSync(absolute)` first constructs an array containing every immediate child. The subsequent `guard()` and `children.length` check happen only after this allocation. A directory containing a very large number of entries can therefore exceed the intended 768-MiB RSS bound (or trigger process OOM) before the safeguard runs. The external alarm bounds elapsed time, but does not prevent this allocation.
**Fix:** Enumerate directory entries incrementally and stop as soon as the remaining global visit budget is exhausted; close the directory handle on all paths. Avoid an API that materializes the full entry list before the bound is checked.

---

_Reviewed: 2026-10-05T16:21:02Z_  
_Reviewer: gsd-code-reviewer agent_  
_Depth: standard-targeted-rereview_
