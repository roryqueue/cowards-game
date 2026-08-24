---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T23:32:49Z
depth: deep
reviewed_source_commit: 7b13a8f3d1e770b855f16217d6dec254e42e12b6
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V12

**Reviewed:** 2026-08-24T23:32:49Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

This fresh review covers the exact `main` target
`7b13a8f3d1e770b855f16217d6dec254e42e12b6`, its immediate physical-observation
commitment repair, and the predecessor report-boundary repair `bea47d07`.

V11 CR-01's label-contamination defect is fixed: `locationCommitment` and
`filesystemIdentityCommitment` are separate domain-separated commitments of
the observed roots before the run label is included in the derived component
roots. They retain no raw path or filesystem identity, are recomputed from the
serialized commitment record, and are compared for the detached input,
corresponding clones, and obstruction input. The Plan-62 boundary also correctly
normalizes a nested pair-audit validation failure to its report-specific error.

One blocker remains. The new all-seven-commitment regression mutates each
physical commitment, but the validator omits the seventh cleanup-parent record
from cross-run reuse checks. It also only compares matching roles, so reuse of
the same observed path/filesystem identity in different roles across runs is
accepted. Thus the retained commitments do not yet prevent every cross-run
actual reuse required by the physical-custody audit.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Pair audit leaves cleanup and cross-role physical reuse undetected

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:3537-3560`

**Issue:** The validator checks `physicalCommitments[0]` (detached), matching
clone entries `[1..4]`, and `physicalCommitments[5]` (obstruction), but never
compares `physicalCommitments[6]`, the cleanup parent. A serialized audit whose
right cleanup record is recomputed with the left cleanup record's
`locationCommitment` and `filesystemIdentityCommitment` therefore passes: the
per-record integrity check at lines 3175-3195 accepts those retained values,
and the cross-run branch has no cleanup comparison. The same role-by-index
approach also accepts a left physical input reused as a different right-side
role. This defeats the intended actual-physical-input non-reuse proof even
though labels can no longer mask equality.

The target's regression itself demonstrates the missing case: its loop claims
to require `PAIR_AUDIT_REUSE_INVALID` for every index `0..6`, but the index-6
mutation has no corresponding predicate in the validator.

**Fix:** Compare every left physical observation with every right physical
observation, rejecting equality of either commitment rather than comparing only
matching indices. Keep the exact role/ordering checks separately.

```ts
const leftPhysical = audit.runs[0].physicalCommitments
const rightPhysical = audit.runs[1].physicalCommitments
if (leftPhysical.some(left => rightPhysical.some(right =>
  left.locationCommitment === right.locationCommitment ||
  left.filesystemIdentityCommitment === right.filesystemIdentityCommitment)))
  fail("V138_PLAN_262_61_PAIR_AUDIT_REUSE_INVALID")
```

Retain the current per-role group checks, and add recomputed-root mutations for
the cleanup parent and at least one cross-role pair (for example, left detached
to right clone).

## Verification Performed

- Confirmed `HEAD`/`main` is exactly
  `7b13a8f3d1e770b855f16217d6dec254e42e12b6`; its direct diff changes only the
  two reviewed checker/test files.
- Read the full target diff and traced commitment construction, serialized
  record recomputation, pair-audit reuse validation, and the Plan-62 report
  error boundary.
- Confirmed the new commitments hash only pre-hashed observed roots under
  distinct domains and the serialized record excludes the raw observation
  fields; the reuse checks at lines 3537-3559 use the label-independent
  commitments, not label-dependent component roots.
- Ran `pnpm exec tsc --noEmit --pretty false` successfully.
- Ran the focused target/error-boundary tests successfully: 2 passed, 72
  skipped. The consumed two-fresh-derivation pair proof was deliberately not
  rerun.
- Ran `git diff --check 7b13a8f3^..7b13a8f3` successfully.

---

_Reviewed: 2026-08-24T23:32:49Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
