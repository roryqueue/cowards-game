---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-15T08:35:35Z
depth: deep
files_reviewed: 8
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
---

# Phase 262 Plan 60: Code Review Report V2

**Reviewed:** 2026-08-15T08:35:35Z
**Depth:** deep
**Files Reviewed:** 8 (six files changed in the corrected range plus the two claimed deleted paths checked at both endpoints)
**Status:** issues_found

## Summary

The corrected range was reviewed independently from `81644e27132ce853afc43731c89c3bbf4941b7d0` through `70ce6d61a7275bfb23fe9094207c5c5dc92a0043`. Git confirms the submitted tree `553a2303b272f3ce3dd729975898a27e5ba2adaa`, sole parent `ea31c46fbe8bc6020a87c7096c6a1f585ff23dd8`, seven first-parent correction commits, and six changed paths. The focused suite passed 27/27 tests with zero skips, the dependency analyzer reported zero findings, Turbo typecheck passed 27/27 tasks, and no canonical review-v3, authorization-v9, seal-v9, B9, route, or live artifacts were written.

Those green checks do not establish correctness. Four blockers remain: review command/handler evidence is still self-attested; the correction range is misrepresented as an eight-path aggregate; the tool-identity terminal produces a false failure from healthy state; and the detached-file reader does not actually provide the claimed immutable no-follow custody under concurrent mutation.

## Narrative Findings (AI reviewer)

### Prior-review disposition

| Prior finding | V2 disposition | Evidence |
|---|---|---|
| CR-01 review evidence inventories/joins | **BLOCKER remains** | Exact names are enforced, but command executions and handler semantics are not independently observed (CR-01 below). |
| CR-02 inconsistent v9 route shape | Fixed | The route now normalizes nested authorization, seal, custody, closure, and protected-history records before downstream use. |
| CR-03 active v7 pre-observation anchors | Partially fixed; **new BLOCKER** | Active v7 anchor calls are gone, but the replacement tool-identity comparison is semantically invalid (CR-03 below). |
| CR-04 wrong A9 parent | Fixed | The returned parent is the penultimate correction commit and matches Git. |
| CR-05 active reviewer-v2/dynamic analyzer exemption | Fixed for the reported defect | Reviewer-v2 is excluded from active collection and its historical object is checked separately. |
| CR-06 mutable protected history | Fixed | The failure object, exact roots, and prior authorization bytes are pinned and compared with source/current bytes. |
| WR-01 stale/skipped route tests | Fixed | The focused suite passes 27/27 with no skips and reaches the real v9 route-start handler through full argv. |

## Critical Issues

### CR-01: Review-v3 still accepts fabricated command executions and handler observations

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-source-completeness-review-v3.ts:137-175`

**Related files:** `scripts/lib/v1-38-source-completeness-review-v3.ts:233-254`, `scripts/lib/v1-38-successor-source-seal.ts:6063-6072`, `scripts/evaluate-v1-38-successor-route.test.ts:97-103`, `scripts/evaluate-v1-38-successor-source-complete.test.ts:378-386`

**Issue:** The validator now enforces ten unique command names and the expected command-to-handler names, but it accepts any argv containing the command, any syntactically valid stdout/stderr digests, and arbitrary non-empty prerequisite, destination, effect, and disposition strings. The purported independent-observation join does not accept command or handler observations at all. Authorization instead derives `orderedEvents` directly from the document's own `handlerObservations`, making that comparison tautological. The passing fixtures demonstrate the defect: they use `argv: ["node", command]`, a constant invented digest, and—in the unit fixture—`destination-N`, `injected`, and `observed`, yet validation succeeds. Consequently a zero-finding review can claim ten successful executions without running any command and can describe handler behavior that does not match the route manifest.

**Fix:** Extend the observation API with independently produced `commands` and `handlerObservations`, compare both byte-for-byte with the claims, and validate every observation against `V138_ROUTE_7_SOURCE_MANIFEST` (command, handler, prerequisite, destination, side effect, and terminal disposition). Require exact argv schemas per command and derive output digests from captured execution bytes. Add a negative fixture that changes each semantic field, recomputes `reviewV3Root`, and proves authorization rejects it.

### CR-02: The six-path correction run is mislabeled as an eight-path source aggregate

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5836-5892`

**Related files:** `scripts/lib/v1-38-source-completeness-review-v3.ts:40-49`, `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-SUMMARY.md:98-118`

**Issue:** Git reports exactly six modified paths in `81644e27..70ce6d61`. Both reviewer-v2 files are absent at the base and at A9; their deletions occurred before this range. The code correctly checks the correction aggregate against the filtered six-path `V138_PLAN_262_60_REVIEW_FIX_CHANGED_PATHS`, but then returns all eight entries as `sourceA9Paths`, synthesizing two `mode: "deleted"` terminal-state records. Review-v3 requires that synthetic eight-entry inventory as the exact source custody. This is not the aggregate changed-path boundary claimed by the summary and fix report, so downstream authorization records a materially false custody statement.

**Fix:** Model the histories explicitly. Record the corrected author run as its exact six-path aggregate, and record the two earlier deletions as separately authenticated historical custody with their actual deletion commit/range. If one eight-path implementation boundary is required, choose and verify a base preceding the deletions and authenticate every intervening author-run/trailer; do not relabel an endpoint state inventory as the corrected run's changed-path aggregate.

### CR-03: Healthy tool identity deterministically satisfies `tool_identity_failed`

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:20132-20141`

**Issue:** The v9 pre-observation rewrite sets `sealedRoot` to a new hash over source A9, authorization root, and execution versions, then sets `observedRoot` to `deriveV138ToolIdentityRoot()`. These roots represent different schemas and payloads, so absent a cryptographic collision they differ even when the current tool identity is exactly healthy. The later generic inequality check therefore accepts `tool_identity_failed` from a valid environment and can publish a false terminal disposition. This contradicts the fix report's claim that only the named observation varies while exact v9 joins are retained.

**Fix:** Bind the expected `deriveV138ToolIdentityRoot()` value into authorization-v9/seal-v9 (or another immutable v9 protected contract) and compare the observed tool identity with that same-domain expected value. A healthy equality must reject `tool_identity_failed`; only a genuinely different independently observed root may create that terminal. Add positive and negative terminal tests using a valid v9 route.

### CR-04: Detached review custody is vulnerable to ancestor-swap races and truncation hangs

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5756-5787`

**Related files:** `scripts/lib/v1-38-successor-source-seal.ts:5995-6021`, `scripts/lib/v1-38-source-completeness-review-v3.ts:260-285`

**Issue:** Both detached readers `lstat` path components and later open the leaf with `O_NOFOLLOW`. `O_NOFOLLOW` protects only the final component; an ancestor can be replaced with a symlink between the checks and `open`, while the returned metadata still claims `symlinkFree: true`. The public inspector additionally performs an earlier, less-validated read before the checked pass. Both fixed-size read loops also add the result of `readSync` without handling zero; if the same-owner read-only file is chmodded and truncated after `fstat`, EOF returns zero forever and authorization hangs instead of failing closed. These defects violate the advertised detached immutable/no-follow boundary for hostile evidence.

**Fix:** Remove the preliminary unchecked read and resolve the detached file through pinned directory descriptors (`openat`/equivalent with `O_DIRECTORY|O_NOFOLLOW` for every component), then validate and read once from the pinned leaf descriptor. Abort if `readSync` returns zero before the expected size and cap allocation before reading. Add adversarial tests that swap an ancestor and truncate the file during the read; both must terminate with exact rejection codes.

## Verification Reproduced

- Focused serialized Vitest: 2 files, 27 tests passed, 0 skipped.
- Dependency analyzer: passed, 0 findings, 16 sources scanned, exact 43/48 lifecycle.
- Turbo typecheck: 27/27 tasks passed (cached).
- `git diff --check 81644e27..70ce6d61`: passed.
- Git custody: tree and sole parent match the submitted values; the range contains seven commits and exactly six changed paths.
- Deletion correctness: both reviewer-v2 paths are absent at sourceBase9 and sourceA9, proving they were not deleted by this correction range.
- Write safety: canonical review-v3, authorization-v9, seal-v9, and route-start paths remained absent after verification.

---

_Reviewed: 2026-08-15T08:35:35Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
