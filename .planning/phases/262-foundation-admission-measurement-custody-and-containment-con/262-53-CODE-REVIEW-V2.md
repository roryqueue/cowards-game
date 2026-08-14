---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "53"
reviewed: 2026-08-14T22:16:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/check-v1-38-dependency-revision-boundaries.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 53: Code Review V2 Report

**Reviewed:** 2026-08-14T22:16:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The fixes fully resolve prior CR-02, WR-01, and WR-02. Route-capable files are now included under exact frozen-byte controls with drift analysis, the mutation suite covers the bound evidence families and exclusive publication, and lifecycle/requirement truth is parsed from unique exact machine-status blocks. Prior CR-01 is substantially improved through the exact disposition validator, canonical-byte comparison, root recomputation, and leaf-level no-follow reads, but its no-follow requirement is not fully resolved because ancestor symlinks remain traversable.

The serialized focused Vitest suite passes 10/10. The current disposition CLI also returns the expected `sealed_source_incomplete` 0/0 result, and the dependency-boundary CLI currently returns `passed_absence` with downstream authority denied. Those current-checkout passes do not exercise the ancestor-symlink bypass below.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: No-follow evidence checks still traverse symlinked ancestors

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:63-95`

**Issue:** `readRegularFileNoFollow` and `pathAbsentNoFollow` apply `lstatSync` and `O_NOFOLLOW` only to the final path component. Both operations still follow symlinks in ancestor components. `correctiveDispositionCanonical` then uses these helpers at lines 769-788, while the delegated exact builder reads the authorization and seal through the same leaf-only `regularFile` pattern at `scripts/lib/v1-38-successor-source-seal.ts:5464-5467` and checks all fresh destinations that way at lines 5504-5507. If `.planning` or `.planning/artifacts` is replaced with a symlink, the monitor can validate an externally supplied exact disposition/authorization/seal set and treat external destination absence as repository absence, then emit `passed_absence`. This violates the claimed no-follow repository evidence boundary and leaves prior CR-01 incompletely fixed.

**Fix:** Validate and pin every ancestor from `repoRoot` to the target before any read or absence check, then revalidate the pinned directory identities after the operation. Prefer opening relative to pinned directory descriptors with no-follow semantics where the platform permits it. At minimum, reuse `validateV138CanonicalParentChain` / `checkV138CanonicalParentChain` around all disposition, authorization, seal, and fresh-destination checks, fail on any symlinked ancestor, and add a regression test that places the artifact directory behind an ancestor symlink and asserts the lifecycle checker rejects it.

---

_Reviewed: 2026-08-14T22:16:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
