---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-05T16:16:47Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/diagnose-v1-38-saved-evidence.ts
  - scripts/diagnose-v1-38-saved-evidence.test.ts
source_sha256: 02280c184533edd4e692d1ca459a3cdb88e8dd306761acce5083333025a14a04
helper_sha256: 02280c184533edd4e692d1ca459a3cdb88e8dd306761acce5083333025a14a04
findings:
  critical: 1
  blocker: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 265: Saved Evidence Diagnostic Code Review

**Reviewed:** 2026-10-05T16:16:47Z  
**Depth:** standard  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

Reviewed the fixed saved-evidence diagnostic and its synthetic tests, with targeted checks of the imported reader and retained-audit boundaries. The source establishes the fixed paths, non-authorizing output fields, origin guard, and finite failure-code projection. Two defects remain in its resource-bound enforcement. This was a source-only review: the diagnostic was not run, and no actual saved records were read. The seven synthetic tests are present in source but were not executed.

## Blockers

### BL-01: Directory traversal has no global node bound

**File:** `scripts/diagnose-v1-38-saved-evidence.ts:569-572`
**Classification:** BLOCKER
**Issue:** `scanInputs()` checks `children.length + files.length` at each individual directory, but does not bound the accumulated number of directories/rows. A nested directory tree can keep each directory below the per-directory threshold while multiplying the number of visited directories across up to six levels. Every directory is retained in `rows`, so this can consume unbounded time and memory before the first `checkBounds()` call, despite the nominal 60-second and 768-MiB limits. The fixed pass can therefore be forced into prolonged traversal or memory exhaustion by an over-nested store.
**Fix:** Maintain a total visited-entry counter (directories and files) and reject before adding/recuring once it exceeds a small fixed inventory cap; also check a deadline during traversal. For example:

```ts
let visited = 0
const visit = (identity: string, depth: number): void => {
  if (++visited > FILE_LIMIT || depth > 5) throw new Error("INPUT_BOUND")
  // inspect and visit children
}
```

## Warnings

### WR-01: The 60-second pass limit does not interrupt synchronous prepass work

**File:** `scripts/diagnose-v1-38-saved-evidence.ts:308-312,331-337`
**Classification:** WARNING
**Issue:** The elapsed-time guard is called only after the complete initial inventory and after the complete snapshot load. Both are synchronous and can perform many filesystem operations and parse bounded-but-large inputs; `scanInputs()` itself never checks the guard. If either phase takes longer than 60 seconds, the code notices only after that work has already exceeded the pass limit, so the limit does not cap pass duration as required.
**Fix:** Thread a monotonic deadline/check callback through inventory and snapshot loading, invoking it between directory visits and bounded file reads/parses. If a hard wall-clock stop is required for non-cooperative synchronous dependencies, run the pass in a capped child process with an external timeout and preserve the existing no-retry entry semantics.

---

_Reviewed: 2026-10-05T16:16:47Z_  
_Reviewer: gsd-code-reviewer agent_  
_Depth: standard_
