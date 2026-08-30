---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "115"
reviewed: 2026-08-30T02:38:46Z
depth: deep
source_range: 0e18b685^..d7ebb154
files_reviewed: 2
files_reviewed_list:
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 262 Plan 115: Code Review Report

**Reviewed:** 2026-08-30T02:38:46Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The adapter independently pins the authoritative Plan-114 v2 publication and final-clean closure, renders the unchanged supplement-v3 schema, exposes only the three planned selectors, and performs no live or producer call. The normal disposable write/one-path-commit/check path also succeeds and rejects committed rewrite and add-scope drift.

Those happy-path properties do not make the adapter safe to advance. It grants Plan-109 eligibility before the mandatory Plan-116 review, accepts executable current custody, and uses a check-then-open parent-directory sequence that can redirect the exclusive canonical write outside the repository. No canonical supplement or effect artifact was created by this review.

Verification:

- Canonical `--check-source-only` passed and returned the expected authoritative-v2/final-clean roots, sealed-inactive pair, zero counters, and denied downstream authority.
- A disposable worktree with the current authoritative v2 payload changed to mode `0755` still passed `--check-source-only`, proving CR-02.
- The focused disposable write/commit/check/recheck test passed in 10.68 seconds.
- `pnpm exec tsc --noEmit --pretty false` and scoped `git diff --check` passed.
- No readiness, live, producer, supplement, or downstream selector ran against the shared checkout.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: The unreviewed Plan-115 adapter declares Plan 109 eligible

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts:324-345,348-362`; `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts:84-109`

**Issue:** Every source-only, written, and committed-check projection reports `plan109Eligible:true`. Plan 115 is only the new executable adapter under review; the research and plan require Plan 116 to independently review its exact committed closure before revised Plan 109 becomes eligible. The shared-checkout source-only command therefore exposes eligibility before the mandatory independent gate exists, and the test explicitly cements that premature result.

**Fix:** Report only Plan-116 review eligibility from Plan 115 (for example `plan116ReviewEligible:true`) and make `plan109Eligible` absent or false. Plan-109 eligibility must be emitted only by the authenticated literal-zero Plan-116 carrier after exact adapter custody and disposable-mode review.

#### CR-02: Current executable-mode drift passes authoritative custody checks

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts:133-143,164-171,179-190`; `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts:144-169`

**Issue:** `readRegularNoFollow` rejects symlinks and non-files but never rejects executable permission bits. `exactPublication` checks only the committed Git mode. After a valid `100644` publication, changing the current payload, review, carrier, final-clean review, pair, or supplement to `0755` leaves bytes and the committed mode unchanged, so authentication still succeeds. The executable-mode test changes mode before commit, which merely produces a Git `100755` entry and does not exercise current-mode drift. A disposable reproduction changing the current authoritative v2 payload to `0755` still returned `source_only_checked`.

**Fix:** Require `(lstat.mode & 0o111) === 0` before opening every current custody file, retain the no-follow descriptor check, and recheck descriptor identity, size, and mode after reading. Add post-commit `chmod 0755` mutations for every authoritative v2/final-clean/supplement path and require fail-closed behavior.

#### CR-03: Parent-directory validation is vulnerable to a symlink-swap write escape

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts:123-128,364-393`

**Issue:** The writer lexically resolves the supplement path, separately `lstat`s `.planning` and `.planning/artifacts`, and then opens the absolute pathname. Another process can replace `.planning/artifacts` with a symlink after the checks but before `openSync`. `O_NOFOLLOW` protects only the final path component, so the exclusive create can be redirected outside the repository. This violates the plan's containment and parent no-symlink boundary and can create or delete an external file during error cleanup.

**Fix:** Perform the write relative to pinned no-follow directory descriptors using an `openat`/`renameat`-style native helper, validating each parent beneath the repository descriptor. At minimum, bind parent device/inode identities before creation and verify the opened file's parent and final device/inode through a race-resistant native operation; abort and safely clean up only the inode created by this invocation. Add a deterministic parent-swap adversarial test.

## Non-Authority

This review grants no Plan-116 or Plan-109 eligibility and creates no supplement, readiness, live invocation, producer effect, counter consumption, downstream artifact, or Phase-263 authority. Plan 115 must remain blocked pending correction and fresh independent review.

---

_Reviewed: 2026-08-30T02:38:46Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
