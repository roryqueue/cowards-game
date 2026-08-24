---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T23:19:46Z
depth: deep
reviewed_source_commit: bea47d07b892c822477f8231fbfd765a604fc819
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V11

**Reviewed:** 2026-08-24T23:19:46Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

This review covers the full Plan-262-61 source-custody iteration from V10
(`07f0f61d`) through the requested `bea47d07` target, including successor
`1b91031f` and the report-boundary error repair. The target correctly converts
changed path lists to bounded repository-relative locations and maps nested
pair-audit failures to the report boundary. It also makes the serialized
commitment fields self-consistent.

However, the new self-consistency recipe explicitly removes the observed path
and inode/device roots before hashing. Consequently its resulting
`pathComponentRoot` and `inodeDeviceComponentRoot` are not commitments to a
physical location or filesystem identity. The later cross-run “reuse” checks
therefore establish only that the public `left`/`right` labels differ, rather
than that two distinct physical roots were observed. This does not meet the
Plan-61 physical-custody/fresh-derivation proof the pair audit is used to carry.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Re-rooted physical commitments discard the physical facts they purport to attest

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2802-2816, 2869-2895, 3523-3546`

**Issue:** `pairAuditRun` passes each observed `pathRoot` and `identityRoot`
into `localObservationCommitment`, but that helper destructures both values into
unused variables at lines 2803-2804. The only values hashed into the replacement
component roots are public metadata including `run`, `kind`, `group`, `ordinal`,
content, mode, and `executionCommit` (lines 2805-2816). Thus an audit generated
from the same physical detached input, clone, obstruction, or cleanup directory
would yield different component roots merely because one run is labelled
`left` and the other `right`. The apparent physical-distinctness tests at
3523-3546 compare those label-derived outputs; they cannot detect reuse of an
actual path/inode/device. The flags `rawPhysicalPreimageRetained: false` and
`independentCustody: false` avoid claiming independent custody, but they do not
make these roots evidence of the claimed two-fresh physical observation.

**Fix:** Keep a privacy-safe commitment to the actual observation in each
serialized record (for example, a domain-separated hash of the separately
canonicalized path and inode/device observation), and make
`localObservationCommitment` include that commitment rather than discard it.
The verifier must recompute that retained commitment and compare left/right
values before declaring physical non-reuse. If retaining such a commitment is
not acceptable, remove the physical-freshness assertion and do not expose the
values as physical path/inode commitments.

## Warnings

### WR-01 [WARNING]: Mutation coverage tests only the synthetic component roots, not the lost observation-to-commitment join

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:518-533`

**Issue:** The new regression mutates a serialized `pathComponentRoot` and
re-roots the enclosing audit, which confirms the synthetic commitment recipe is
closed. It never demonstrates that a changed observed `pathRoot` or
`identityRoot` changes the serialized commitment: those inputs have already
been discarded before the audit is built. The suite can therefore pass while a
pair constructed from reused physical inputs remains indistinguishable at the
serialized pair-audit boundary.

**Fix:** Add a builder-level regression that changes only an input physical
path/inode commitment while retaining all non-physical metadata, then assert
the produced serialized commitment changes and the pair validator rejects
cross-run reuse. Exercise detached input, every clone, obstruction, and cleanup
parent.

## Verification Performed

- Confirmed `bea47d07b892c822477f8231fbfd765a604fc819` is `main` with sole
  parent `1b91031fb973de4edb393fc84274107a972c6114`; the direct target diff
  changes exactly the two reviewed source/test paths.
- Read the full V10 review and Plan-262-61 contract, then traced fresh route
  observation, pair construction, commitment construction, event/projection
  joins, report-manifest validation, and the Plan-262-62 caller.
- Confirmed successor `1b91031f`'s changed-location projection is used for
  route deltas and synthetic publication custody, with canonical
  repository-relative validation.
- `pnpm exec tsc --noEmit --pretty false` and `git diff --check
  07f0f61d..bea47d07` passed.
- Targeted Vitest coverage for the `bea47d07` nested-pair error boundary passed:
  1 test passed, 72 skipped.
- The longer two-fresh end-to-end derivation was started as a read-only
  disposable-repository check and remained running at report creation; no
  source, test, plan, REVIEW-FIX, sentinel, Plan-262-62, canonical, or live
  artifact was modified by this review.

---

_Reviewed: 2026-08-24T23:19:46Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
