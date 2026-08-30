---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "114"
reviewed: 2026-08-30T00:53:47Z
depth: deep
source_range: a180c253..13035534
publication_commit: ab539ab2b3706981aaeb053b3fafce6b46532b40
files_reviewed: 5
files_reviewed_list:
  - scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts
  - scripts/check-v1-38-plan-262-114-live-v10-custody-v1.test.ts
  - .planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-114-REVIEW.md
  - .planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json
findings:
  critical: 5
  warning: 0
  info: 0
  total: 5
status: issues_found
---

# Phase 262 Plan 114: Code Review Report

**Reviewed:** 2026-08-30T00:53:47Z
**Depth:** deep
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The canonical trio is atomically committed and the read-only `--check-review` command currently authenticates its exact add scope, roots, bytes, no-rewrite history, and forbidden-effect absence. Those properties do not validate the zero-finding verdict. The reviewer is circular at both its custody and value-semantic boundaries, cannot turn real semantic defects into its promised blocked evidence, retains stale custody across the observation window, follows current publication symlinks, and cannot authenticate the blocked publication it claims to support.

The published literal-zero verdict and Plan-109 eligibility are therefore unsupported. No supplement or live effect was observed during this review.

Verification:

- `pnpm exec tsx scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts --check-review` passed for publication `ab539ab2`.
- The full focused Vitest suite was started and then intentionally interrupted at the orchestrator's request to avoid another expensive six-mode run; no test failure had been emitted before interruption.
- Scoped `git diff --check` passed before the Vitest command started.
- No readiness, production, supplement, or live selector was invoked.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: The reviewer delegates the facts under review back to Plan 113

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts:16-23,246-265,522-529`

**Issue:** Plan 114 must independently derive raw, recursive, installed/toolchain, native, reviewed, and local custody. Instead it imports and calls Plan 113's `deriveV138PathStableCustody`, one of the exact functions whose correctness Plan 114 is meant to review. The linked-worktree runner repeats the same call. If Plan 113 omits an input, normalizes a path incorrectly, or computes a spoofable root consistently in both locations, Plan 114 reproduces the same defect and reports agreement. The only independent work around this call is shallow identity/shape checking.

**Fix:** Implement a source-separated derivation in the Plan-114 reviewer from raw Git modes/blobs/current bytes, recursive imports, installed package/toolchain manifests, repo-relative native sources, Git arguments/executable, and local custody facts. Compare those independently computed fields and roots to Plan 113; do not import the Plan-113 custody helper.

#### CR-02: Three semantic observations call live-v10's own acceptance decisions

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts:556-583`

**Issue:** The generated value runner imports `* as subject` from live-v10 and treats `checkV138LiveV10PostRunOutputCustodyForReview`, `computeV138LiveV10ReproductionV17ReceiptRoot`, and `checkV138LiveV10ReproductionV17ForReview` as the oracle for non-pass, success, and exact reproduction. The review therefore asks the implementation whether its own outputs are valid and performs only shallow status/count/authority checks afterward. A shared defect in status topology, receipt-root construction, schema, privacy, authority, or journal joins passes both implementation and reviewer. This directly violates the source-separated semantic-review requirement.

**Fix:** Independently derive expected non-pass/success and reproduction-v17 semantics, receipt roots, exhaustive keys, privacy/authority fields, and journal joins. Execute the subject functions as observations, but compare their complete results against the independent oracle without importing their acceptance/root helpers.

#### CR-03: Real semantic defects cannot produce the promised deterministic blocked evidence

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts:250-314,557-571`; `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.test.ts:62-106`

**Issue:** Foundation custody, history, pair, counter, privacy, and authority mismatches call `fail(...)` before a finding collector exists. Any exception from the three value observations is likewise collapsed into `V138_PLAN114_VALUE_MODE_PROCESS_INTEGRITY`. Thus trustworthy semantic deviations publish nothing instead of deterministic blocked evidence. The test titled “roots every ... mutation as blocked” does not mutate a single boundary; it merely passes each desired code as an already-created finding to the renderer. The blocked branch is presentation-only and is not connected to actual observations.

**Fix:** Separate enumerated process-integrity failures from observable semantic mismatches. Convert independently observed mismatches into sorted findings and continue through deterministic blocked rendering. Add real isolated mutations for every listed path/mode/blob/history/pair/counter/privacy/authority and subject-output boundary, and prove identical mutations yield identical blocked bytes while true integrity failures write nothing.

#### CR-04: Cached foundation custody can go stale before publication

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts:246-249,316-322,472-475,614-629,674-680`

**Issue:** `foundationCache` is keyed only by repository path and has no invalidation. `writeReview` authenticates and caches the foundation, spends minutes running disposable observations, then renders through the cached value without re-reading source, history, pair, toolchain, or current bytes. A change after initial authentication is invisible and can still receive a zero trio. The test process also reuses cached custody between tests, preventing genuine post-authentication mutation tests from exercising the boundary.

**Fix:** Remove the cache from security decisions or scope it only to immutable raw objects while rechecking current bytes and local custody. Re-authenticate the complete canonical foundation after observations and immediately before writing, compare before/after roots, and abort without publication on any change. Tests must mutate after the first authentication and prove the second check detects it.

#### CR-05: Publication authentication is neither no-follow nor blocked-verdict capable

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts:213-225,639-657`

**Issue:** Current payload/REVIEW/carrier bytes are read with following `readFileSync` calls and current file type/mode is never checked, so symlinks to external exact bytes satisfy “current custody.” Separately, `authenticateV138Plan114PublishedReview` always rerenders `findings: []` and `actualModesPassed: 6`. Any legitimate blocked trio produced by `writeReview` necessarily fails the read-only authenticator even though the plan requires blocked publication support. The function also trusts the payload's linked-local root as its own rerender input.

**Fix:** Read current trio entries with `lstat` plus `O_NOFOLLOW`, require regular `100644` files and stable device/inode/size during reads, and compare them to raw committed blobs. Parse the committed verdict/finding set, independently reproduce the corresponding zero or blocked evidence, and authenticate either valid branch. Bind the linked-local attestation to independently captured review evidence rather than accepting it as a free rerender seed.

## Non-Authority

This review grants no Plan-109 eligibility and creates no supplement, live invocation, route, capacity, reset, downstream artifact, or Phase-263 authority. The trio at `ab539ab2` must be treated as blocked pending corrective implementation and a fresh independent executable review.

---

_Reviewed: 2026-08-30T00:53:47Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
