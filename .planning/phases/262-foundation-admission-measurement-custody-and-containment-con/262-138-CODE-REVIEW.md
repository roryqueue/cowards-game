---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "138"
reviewed: 2026-08-31T04:58:38Z
reviewed_head: 892c3152
subject_commit: d17c5af0b0484eda7c37299b38d03e3182598d00
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts
  - scripts/check-v1-38-plan-262-138-live-v13-custody-v8.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 262 Plan 138: Code Review Report

**Reviewed:** 2026-08-31T04:58:38Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The two declared native identities are correct: the live subject contains helper-v6.c as `100644`/`ca694310...`/SHA-256 `643d5c7a...` and owner-lock-v1.c as `100644`/`99da3517...`/SHA-256 `fef25dc7...`, in the intended order. The normalized six-record output also uses distinct canonical mode/ordinal pairs and domain-separated v8 roots. However, the claimed genuine-to-stable join is not established at its trust boundary: Plan 138 neither authenticates the Plan 133 executor it invokes nor independently inspects the transient files before Plan 133 deletes them, and its durable mapping replaces the missing join with a declarative `verified` domain string. Repository-history authentication is also vulnerable to local graft/config metadata, and the effect-absence gate omits required destinations and uses a fail-open existence primitive. Plan 139 publication must remain ineligible.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: An unauthenticated lower-level executor can fabricate the entire “genuine” side of the mapping

**File:** `scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts:5-6,127-149,185-231,285-332`

**Issue:** `buildV138Plan138ProspectiveV8ForReview` imports and executes Plan 133, but `authenticateHistory` authenticates only the Plan 136 chain; it never pins the Plan 133 source/test blob, current bytes, or no-later-rewrite state. More importantly, Plan 133 deletes each disposable worktree before returning its observations, so `mapGenuineObservation` cannot and does not no-follow-read either returned absolute path, prove both paths share one disposable checkout, run `ls-tree`/`hash-object` over that checkout, or authenticate the returned execution/Git/installed roots. It only checks path spelling and verifies roots that a modified lower-level executor can recompute itself. The v8 mapping then discards the genuine native and observation roots and records only the literal string `plan133-path-dependent-native-root-v5-verified`; no deterministic cryptographic field distinguishes a real disposable run from six fabricated, self-consistent records. Thus a later rewrite of the unpinned Plan 133 module can emit the expected mode/status/reduced values and forged path-dependent roots, and Plan 138 will launder them into the same stable mapping, observation, payload, and carrier roots. The tests at lines 74-123 inspect only output produced by the same imported executor and post-construction mutations, so they do not exercise this trust-boundary substitution.

**Fix:** Pin and authenticate the exact Plan 133 executor source/test and all executable dependencies before invocation. Change the executor interface so an independent Plan 138 validator runs while each disposable checkout still exists (for example, a callback receiving an open directory descriptor or a read-only transient checkout handle). In that validator, no-follow-read both files, require one common checkout root, verify exact order/path/mode/blob with isolated Git, hash the actual bytes, recompute the genuine native/execution/original-observation roots, and only then emit a privacy-safe stable validation transcript root. Bind that transcript root—not a declarative domain string—into every mapping and downstream root. Add a hostile-executor test that fabricates all six self-consistent records without creating disposable files and prove rejection.

### CR-02: Local Git metadata can forge the ancestry and no-rewrite history accepted by v8

**File:** `scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts:107-148`

**Issue:** All ancestry, commit-scope, and no-later-rewrite decisions use `runV138RetryV3IsolatedGit` directly. That helper clears ambient/global configuration and replacement refs, but Plan 138 never rejects repository-local config, `.git/info/grafts`, shallow metadata, or object alternates and never binds reads to a private immutable metadata snapshot. A repository-local graft can therefore alter the parent graph seen by `merge-base --is-ancestor` and `log commit..HEAD`, making an unrelated or rewritten history satisfy the protected-lineage predicates while the fixed objects and current files remain available. This regresses the bound-metadata defense already required for the Phase 262 custody chain.

**Fix:** Before any history decision, reject forbidden local config, replace refs, grafts, shallow state, and pre-existing alternates. Resolve and bind the repository top-level, HEAD, common object store, and object format, then copy only the required metadata into a private bare snapshot with fixed configuration and content-addressed object access. Run every ancestry, scope, tree, blob, and no-rewrite query through that snapshot; add graft, shallow, include/config, alternate, and concurrent metadata-substitution attacks.

### CR-03: The “zero effects” gate is incomplete and fail-open for occupied paths

**File:** `scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts:50-61,285-290`

**Issue:** `EFFECT_PATHS` omits required Phase 262 downstream/effect destinations already named by the predecessor custody contract, including `v1.38-current-matrix-retry-private-receipt-manifest-v3.json`, `v1.38-plan-262-94-admission-disposition-v3.json`, `v1.38-phase-262-review-fix-correction-v11.json`, and `v1.38-phase-262-current-lifecycle-status-v3.json`. Their presence therefore does not prevent `plan139Eligible: true`. The loop also uses `existsSync`, which returns false for a dangling symlink (and suppresses lookup errors), so an occupied forbidden destination can evade the asserted absence check. This contradicts Plan 138's exhaustive no-effect/downstream precondition and can allow Plan 139 review eligibility in an already-contaminated repository state.

**Fix:** Use the complete frozen effect-destination set shared with the Plan 133/Phase 262 contract, including all private-receipt, adjudication, correction, lifecycle, retry, readiness, Route-11, and publication destinations applicable before Plan 139. Check occupation with `lstatSync` and treat only exact `ENOENT` as absent; fail closed on symlinks and all other errors. Add one test per omitted destination plus dangling-symlink and inaccessible-path cases.

## Verification Performed

- Verified the exact live-subject C tree modes/blobs and independently recomputed both current and historical SHA-256 content digests.
- Traced the full Plan 133 disposable lifecycle: worktrees are removed before Plan 138 receives the returned absolute paths.
- Traced every v8 mapping, execution, observation, observations, payload, and carrier root input and confirmed no genuine root or authenticated transient transcript survives into the stable chain.
- Compared Plan 138's effect set with the predecessor Plan 133 frozen set and confirmed the four named destinations are omitted.
- Verified source/test blobs and source SHA-256 recorded by the Plan 138 summary.
- Ran `git diff --check`; no full 544-second suite was rerun because the trust-boundary and effect-set failures are static and independent of the happy-path result.
- Confirmed no source file was modified.

---

_Reviewed: 2026-08-31T04:58:38Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
