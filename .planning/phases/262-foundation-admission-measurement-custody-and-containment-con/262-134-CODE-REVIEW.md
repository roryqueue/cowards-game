---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "134"
reviewed: 2026-08-31T03:15:04Z
reviewed_head: 0dd2e2c9
subject_commit: 80d82e91eb763a2d89a104affba6738ebc6ac8c7
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-134-live-v13-custody-v6.ts
  - scripts/check-v1-38-plan-262-134-live-v13-custody-v6.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 134: Code Review Report

**Reviewed:** 2026-08-31T03:15:04Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The focused suite passes and the prospective validator rejects mutations of the in-memory fixture. However, the source-only v6 result is not bound to the repository root supplied by each caller, and the prospective bytes are not reproducible across fresh processes because they commit random absolute disposable-worktree paths into authenticated roots. Both defects break the reusable custody boundary required before Plan 135 publication. Plan 135 and Plan 110 must remain ineligible until the source is corrected and independently re-reviewed.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Module cache replays eligibility for an unauthenticated repository root

**File:** `scripts/check-v1-38-plan-262-134-live-v13-custody-v6.ts:276-295`

**Issue:** `buildV138Plan134ProspectiveV6ForReview` returns the process-global `cached` evidence before resolving or checking `rootInput`, checking effect destinations, authenticating Git history, reading committed bytes, or executing fresh observations. After one successful call for the canonical checkout, every later `checkV138Plan134SourceOnlyForReview` call in that process accepts any root and returns `plan135Eligible:true`. A targeted reproduction first checked the canonical checkout and then checked `/definitely/not/a/repository`; the second call returned the full successful authenticated projection instead of failing. The same early return also hides source/history changes or a newly created effect destination after the first check.

**Fix:** Remove the module-global cache, or key an immutable cache entry to a fully authenticated root identity and re-run all mutable preconditions on every call. At minimum, resolve/realpath the requested root, authenticate its bound HEAD and protected paths, re-check every effect destination, and bind those values into the cache key before any cached result can be returned. Add a test that primes one valid root and then proves a missing repository, a different checkout, changed protected bytes, and a post-prime effect path all fail closed.

### CR-02: Prospective v6 evidence is nondeterministic and cannot be independently reauthenticated

**File:** `scripts/check-v1-38-plan-262-134-live-v13-custody-v6.ts:270-355`

**Issue:** The builder re-executes Plan 133's disposable observations and `copyObservationV6` preserves every field except `observationRoot`. Plan 133 records `native.paths` directly, and those paths contain the random `mkdtempSync` owner directory (`scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts:581,645-654`). Consequently, each fresh process produces different `disposableLocalNativeSourcePaths`, observation roots, `observationsRoot`, payload root, payload SHA, and carrier root. The `cached` equality check at lines 409-410 makes authentication circular within one process, but a later independent process cannot regenerate and authenticate the exact prospective bytes that Plan 135 would publish. This contradicts the content-addressed, independently reusable root/link contract and exposes private host temporary paths in the proposed evidence.

**Fix:** Canonicalize disposable source paths to fixed repository-relative names before constructing observation bodies and roots, and reject absolute or traversal-bearing values. Derive every root from those stable relative records. Replace `canonical(input) === canonical(cached)` with independent validation against authenticated committed identities and recomputed stable roots. Add a two-process reproduction test that requires byte-identical payload/carrier roots and a privacy assertion that no absolute host path appears in any prospective publication.

## Verification Performed

- Focused serialized Vitest passed: 1 file, 6 tests, 134.17 seconds.
- Cross-root cache reproduction succeeded incorrectly: after a canonical-root check, `/definitely/not/a/repository` returned `plan135Eligible:true` and the same carrier root.
- Traced disposable observation construction through Plan 133 and confirmed `mkdtempSync` absolute paths are included in each authenticated observation body.
- No producer, readiness, live, terminal, reproduction-v17, Route-11, or downstream effect command was invoked during review.
- No source file was modified.

---

_Reviewed: 2026-08-31T03:15:04Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
