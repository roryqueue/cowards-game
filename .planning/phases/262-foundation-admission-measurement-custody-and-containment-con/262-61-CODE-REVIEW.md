---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-23T23:27:37Z
depth: deep
reviewed_source_commit: 2794a8ac41ef7d284f92291bb1d39559d45f7888
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 7
  warning: 1
  info: 0
  total: 8
status: issues_found
---

# Phase 262 Plan 61: Code Review Report

**Reviewed:** 2026-08-23T23:27:37Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The submitted R3 commit is an exact two-path source commit and its 21 focused tests pass, but the implementation does not perform the adversarial review described by Plan 262-61. It copies the route manifest into a no-publish projection without executing any production handler, never calls the shared review-v3 validator, and emits `findingCount: 0` without constructing the required evidence document, observations, disposable publication, or synthetic B9 custody.

The remaining gates are also bypassable. Committed post-A9 drift can be hidden with restored worktree bytes; mutable current evidence is accepted as protected history; the 48-plan lifecycle is reduced to counts; uncommitted review/fix/receipt bytes can satisfy convergence; main readiness does not require a clean repository or absent forbidden destinations; and caller-controlled paths escape the repository. These are trust-boundary failures, not documentation gaps.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The reviewer declares success without executing or observing any route handler

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:335-356`

**Issue:** `deriveV138Plan26261NoPublish` maps the shared manifest to objects containing a constructed argv and then immediately returns `findingCount: 0`. It never creates an exact-A9 detached clone, provisions prerequisites, invokes the production CLI or handlers, observes destinations/effects/dispositions/exits, records before/after snapshots or ordered events, verifies cleanup, exercises publication/B9 custody, or calls `validateV138ReviewV3Document` / `checkV138ReviewV3ClaimsAgainstObservations`. Consequently argument construction and manifest prose are promoted to source-completeness evidence, recreating the exact trust failure Plan 262-61 exists to prevent.

**Fix:** Build an owned exact-A9 disposable repository, run every complete valid argv through the real dispatch and injected handler/runner seams, and derive handler, exit, output, filesystem events, snapshots, cleanup, publication, and B9 observations from execution. Construct the full review-v3 document and pass independently derived observations through the shared strict validator. Reject any unexpected exit, argument-validation branch, copied manifest value, missing event, residual path, or observation mismatch before returning a zero-finding result.

### CR-02 [BLOCKER]: Committed post-A9 source drift and dirty-index masking are accepted

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:130-150`

**Issue:** A9 custody compares the four current worktree files with their A9 blobs, but never inspects `A9..HEAD` history for later commits and never requires a clean index. An attacker can commit a later mutation to one of the protected A9 paths, restore only the index/worktree bytes to A9, and pass this check even though the current first-parent lineage contains post-A9 source drift. The same byte-only read follows replacement leaves and does not verify current file mode or ownership.

**Fix:** Reject every descendant commit touching any of the four A9 paths, require clean index and worktree state, and compare current mode, regular-file/no-follow identity, blob, SHA-256, and length to the exact pinned A9 tuple. Add a repository-backed mutation that commits drift and restores visible bytes without removing the descendant commit.

### CR-03 [BLOCKER]: Protected history and authorization custody are derived from mutable current state

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:206-226`

**Issue:** The checker reads the Plan-262-47 failure JSON directly from the worktree, accepts any `protectedRoots` object whose values merely look like SHA-256 strings, and dynamically selects the latest commit for each authorization path. It does not pin the protected-history commit/blob/root, exact root keys and values, exact six authorization commit/blob/SHA/length records, or the frozen policy/gameplay/runtime/privacy/formation/package/config roots. Coherent replacement bytes or a later authorization rewrite therefore become the new alleged history.

**Fix:** Freeze the exact committed protected-history carrier and every expected root/key, plus all six authorization commit/blob/SHA/length tuples. Read those bytes from immutable Git objects, require current committed/current-file equality and no later rewrite, and reject missing, extra, reordered, or substituted values with specific mutation tests.

### CR-04 [BLOCKER]: The 48-plan lifecycle check accepts count-preserving graph substitution

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:229-241`

**Issue:** Lifecycle validation checks only that 48 tracked plan files and 43 summary files exist and that five basename-derived IDs lack summaries. A committed fixture can replace any completed plan and matching summary with arbitrary `262-99-PLAN.md` / `262-99-SUMMARY.md` files while preserving those counts and the five incomplete names; dependencies, wave order, active/archive membership, summary-to-plan identity, and lifecycle state are never parsed or compared.

**Fix:** Derive and validate the exact ordered 48-plan inventory with each plan ID, dependencies, wave, active/archive placement, expected summary, incomplete set, and lifecycle state. Add repository-backed remove/replace/reorder/dependency/wave/archive mutations that preserve aggregate counts and assert rejection.

### CR-05 [BLOCKER]: Review convergence can be forged with uncommitted worktree prose

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:268-319`

**Issue:** `latestReview` enumerates tracked filenames but hashes current worktree bytes and accepts any text containing lines `status: clean` and `total: 0`; it does not parse or reconcile critical/warning/info counts, require the report bytes to be committed/current, or bind the report to the exact R3. `inspectReviewerConvergence` likewise reads current REVIEW-FIX bytes and accepts substring inclusion of the R3, paths, and roots. A dirty rewrite of both files can therefore manufacture a zero-finding convergence result without an immutable report or fix history.

**Fix:** Parse exact report frontmatter, require all severity counts and total to be zero, exact two-path scope, deep depth, reviewed R3/tree/parent, and committed/current byte equality with no later rewrite. Give REVIEW-FIX an exact schema that binds every report and source-fix commit in order, the terminal report/root, final R3, and its immutable carrier; reject dirty or uncommitted bytes and substring-only bindings.

### CR-06 [BLOCKER]: Receipt, readiness, and summary gates omit the custody they claim to prove

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:322-439`

**Issue:** Receipt validation ignores `phase`, `plan`, the bounded agent-history snapshot, receipt commit/blob/root, and committed/current equality. `--check-main-readiness` hashes status and destination presence before and after but never asserts that status is clean or forbidden destinations are absent, so an unchanged dirty/conflicting repository passes. Summary checks merely search arbitrary prose for six substrings; they do not require an exact schema, receipt commit/blob/root, false identity/downstream-authority claims, or a canonical one-path first-parent carrier. These omissions let mutable local files satisfy the Plan-262-62 handoff.

**Fix:** Validate the receipt against the unique completed Plan-61 history entry and exact phase/plan/time/R3/report/fix fields, then require its committed one-path carrier, blob, SHA-256, and current-byte equality. Make readiness explicitly reject nonempty status, ownership conflicts, any forbidden destination, and unexpected temp/clone/candidate hooks. Parse an exact summary schema and bind all receipt custody plus false identity/authority fields before and after its one-path first-parent commit.

### CR-07 [BLOCKER]: Caller-controlled paths escape repository confinement and extra CLI arguments are accepted

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:359-425`

**Issue:** `requireOption` accepts duplicate options, arbitrary extra arguments, absolute paths, and traversal. The receipt, agent-history, and summary branches feed those values through `path.resolve(repoRoot, value)`, which preserves absolute paths and resolves `..` outside the repository. Only the repository-root leaf itself is checked for being a symlink; ancestor/leaf symlinks, hard links, alternate physical roots, mode/ownership drift, and no-follow identity are not checked. This violates the explicit physical-confinement boundary and allows handoff checks to consume attacker-selected external bytes.

**Fix:** Define an exact argv grammar for every mode; reject duplicates/extras and require exact canonical repository-relative paths. Resolve with realpath/no-follow traversal from a verified physical root, reject escapes, symlink ancestors/leaves, hard links, non-regular files, and ownership/mode drift, and bind file identity across the read. Add absolute, `..`, alternate spelling, symlink, hard-link, duplicate-option, and extra-argument fixtures.

## Warnings

### WR-01 [WARNING]: The test suite is mostly positive-shape coverage and misses the required semantic mutation families

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:65-249`

**Issue:** The 21 passing tests do not execute a real route handler, construct a review-v3 document, call the shared validator, mutate recomputed roots, test snapshots/events/cleanup, exercise publication or B9 custody, validate predecessor deep-freeze/isolation, test exact authorization bytes, perform count-preserving lifecycle substitution, test committed drift hidden by restored bytes, or cover receipt/readiness/summary CLI modes. Several assertions only check shapes or `toThrow()` without a specific rejection code. The final generic canonicalization test does not prove that any production checker consumes the recomputed root.

**Fix:** Replace shape assertions with named repository-backed mutation tests for every Plan 262-61 failure family and assert the exact rejection code. Run each real full-argv handler/terminal branch through injected observers, add forbidden-write and cleanup inventories, and cover every receipt/history/readiness/summary positive and negative case including CLI path confinement.

## Verification Performed

- Confirmed commit `2794a8ac41ef7d284f92291bb1d39559d45f7888` changes exactly the two scoped checker/test paths and current bytes match that commit.
- Focused Vitest suite passed: 1 file, 21/21 tests.
- `--derive-no-publish` exited zero and canonical Plan-262-62 review, Plan-262-62 report, and authorization-v9 destinations remained absent.
- `git diff --check` passed for the reviewed commit.
- Traced the shared review-v3 validator and route manifest; the reviewed checker imports only constants/argv construction and never invokes the validator or production route execution.
- No source files were modified by review.

---

_Reviewed: 2026-08-23T23:27:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
