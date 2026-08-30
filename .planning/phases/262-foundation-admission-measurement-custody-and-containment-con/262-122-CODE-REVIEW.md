---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "122"
reviewed: 2026-08-30T22:56:43Z
reviewed_head: 2bbd45f85500b052022c81fda8c1c8a1c6536b1b
depth: deep
files_reviewed: 5
files_reviewed_list:
  - scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts
  - scripts/check-v1-38-plan-262-122-live-v13-custody-v3.test.ts
  - .planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-payload-v3.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-122-REVIEW-v3.md
  - .planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-carrier-v3.json
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 262 Plan 122: Code Review Report

**Reviewed:** 2026-08-30T22:56:43Z
**Depth:** deep
**Files Reviewed:** 5
**Status:** issues_found

## Narrative Findings (AI reviewer)

The committed exact-three-add publication and its source/test implementation were reviewed against Plan 262-122, the Plan 121 source/review lineage, Plan 120 invalid-history custody, and the current later HEAD. The focused suite and `--check-review` both pass, but their zero-finding result is unsound: the implementation substitutes canonical-main custody for every disposable observation and its independent producer-reachability check accepts constructor-chain code generation. The published literal-zero trio therefore cannot currently establish revised Plan 110 eligibility.

## Critical Issues

### CR-01 [BLOCKER]: Disposable observations are derived from canonical-main custody

**File:** `scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts:800-813`

**Issue:** Each disposable worktree calls `reauthenticateCanonicalSnapshot(linked, canonicalBefore)`, but that function never derives custody from `linked`; it validates and returns the supplied `canonicalBefore` object unchanged (lines 586-597). `modeObservationV3` then receives canonical-main custody and merely domain-wraps its local component roots with the mode name (lines 725-757). Consequently, the six published `disposableLocal*` roots do not attest to six disposable execution contexts. Their apparent differences and their reproducibility are guaranteed by mode salting, not by fresh-worktree measurement. This defeats the central Plan 122 correction for Plan 120's local-context misbinding and makes the zero-finding/Plan110-eligible verdict incorrect.

**Fix:** Derive a fresh `V138PathStableCustody` inside each linked worktree with `deriveV138PathStableCustody(linked, { sourceCommit, checkoutPaths })`. Compare only its portable reviewed closure to the canonical reviewed closure, retain its genuinely local installed/Git/native components, recompute its local execution closure from those disposable components, and pass that disposable custody into `modeObservationV3`. Keep canonical-main reauthentication as a separate before/after check. Supersede the existing v3 trio additively after regenerating six authentic observations; do not rewrite the committed publication.

### CR-02 [BLOCKER]: Independent producer-reachability guard accepts constructor-chain code generation

**File:** `scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts:483-568`

**Issue:** The AST guard rejects a short identifier list and selected statically concatenated names, but it does not reject constructor chains or general computed/property loader access. A read-only in-memory mutation inserting `globalThis.constructor.constructor("return import(\"./run-v1-38-bounded-retry-envelope-v3.js\").then(m => m.runV138V3ProductionLive)")()` was accepted by `inspectV138Plan122BoundarySourceForReview`. This is exactly the code-generation/alternate-loader class Plan 122 requires the independent reviewer to re-prove as unreachable. The disposable producer guard only replaces the named static import, so such a path could bypass its zero-call marker.

**Fix:** Port an independent, fail-closed AST policy covering constructor-property chains, element/property access to code-generation and loader capabilities, strings/templates that assemble executable or producer/module names, indirect calls/aliases, and alternate module namespace access. Add hostile mutations for `globalThis.constructor.constructor`, computed `constructor` chains, module-loader properties, and dynamically recovered producer exports, and require every one to fail before any observation can count.

## Warnings

### WR-01 [WARNING]: Published-review authentication does not require a later HEAD

**File:** `scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts:1023-1060`

**Issue:** `locatePublication` finds the add commit and `exactAddPublication` only requires that commit to be an ancestor of `HEAD`; equality passes. Thus `--check-review` can authenticate at the publication commit itself, contrary to Task 3's required fresh-later-HEAD process gate. The current invocation did run from later HEAD `2bbd45f8`, but the reusable checker does not enforce the claimed invariant.

**Fix:** Fail when `git rev-parse HEAD` equals the publication commit, then require the publication to be a strict ancestor of the current HEAD before performing committed-byte and fresh semantic checks. Add a detached-publication-HEAD rejection test.

### WR-02 [WARNING]: b331 custody authenticates selected entries but not the required exact scope

**File:** `scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts:464-480`

**Issue:** The implementation pins the parent and three custody entries, but never compares `git diff-tree` for `b331baad` with the required exact seven-path change set. The actual commit currently has the expected seven paths, yet the reviewer does not prove the scope it and the summary claim to authenticate.

**Fix:** Compare the full sorted name-status output with the exact seven expected additions/modifications, in addition to the existing parent/blob/mode/current-byte/no-rewrite checks. Add mutations for missing, extra, and status-changed paths.

## Verification

- `pnpm exec vitest run scripts/check-v1-38-plan-262-122-live-v13-custody-v3.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --hookTimeout=180000 --bail=1`
  - Passed: 1 file, 3 tests, 173.31 seconds.
- `pnpm exec tsx scripts/check-v1-38-plan-262-122-live-v13-custody-v3.ts --check-review`
  - Exited 0 and reported publication `65a7a246`, 6 modes, 0 findings, `plan110Eligible:true`, and all live/producer/counter/authority fields false or zero. This is a false clean result because of CR-01 and CR-02.
- In-memory constructor-chain mutation against `inspectV138Plan122BoundarySourceForReview`
  - Result: `ACCEPTED_CONSTRUCTOR_CHAIN`.
- `git diff --check`
  - Passed.

## Effect Boundary

No readiness selector, live selector, historical producer, producer destination, or effect artifact was invoked or created during this review. Only the focused test, `--check-review`, static reads, Git inspection, and an in-memory AST mutation were used.

---

_Reviewed: 2026-08-30T22:56:43Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
