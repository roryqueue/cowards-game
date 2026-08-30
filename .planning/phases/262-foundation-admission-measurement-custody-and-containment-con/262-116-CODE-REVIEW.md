---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 116
reviewed: 2026-08-30T03:53:30Z
depth: deep
source_range: 3ff893fd^..97e84c59
publication_commit: e1e75fc6ef177a8213d903f1ec365d86f37cf62a
files_reviewed: 5
files_reviewed_list:
  - scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts
  - scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts
  - .planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v1.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-REVIEW.md
  - .planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v1.json
findings:
  critical: 7
  warning: 2
  info: 0
  total: 9
status: issues_found
---

# Phase 262 Plan 116: Code Review Report

**Reviewed:** 2026-08-30T03:53:30Z  
**Depth:** deep  
**Files Reviewed:** 5  
**Status:** issues_found

## Summary

The committed trio authenticates its current raw Git blobs, current no-follow `0644` files, exact three-path add commit, rerendered roots, supplement absence, and denied downstream authority. The current `--check-review` command and TypeScript compilation pass.

Those happy-path checks do not establish the claimed independent literal-zero gate. The reviewer accepts fabricated “nine-mode” input with no observations, emits factually false authentication flags in blocked evidence, cannot publish a blocked result for drift in the reviewed subject itself, and converts several process-integrity failures into publishable subject findings. Its publication writer is also neither symlink-contained nor crash-atomic. Plan 109 must remain ineligible until these blockers are fixed and the trio is republished from the corrected reviewer.

## Critical Issues

### CR-01: A caller can grant Plan-109 eligibility without executing any actual mode

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:713-724`  
**Issue:** The zero gate checks only `actualModesPassed === 9` and a handful of scalar flags. It never requires the exact nine mode names, nine distinct passed observations, a matching observation root, or a non-null disposable execution closure. A targeted call with `actualModesPassed: 9`, empty `observations`, empty `modeNames`, and no disposable closure returned `plan109Eligible:true`. `authenticateV138Plan116PublishedReview` rerenders the same untrusted fields and would accept such a committed trio.

**Fix:** Validate the exact ordered `MODE_NAMES`, exactly nine independently rooted `status:"passed"` observations, recompute `observationRoot`, require a valid disposable closure root, and reject duplicate/missing modes. Reperform or independently authenticate those observations during publication checking.

### CR-02: Blocked evidence falsely states that failed upstream custody authenticated

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:631-636`  
**Issue:** `renderContracts` hardcodes `upstreamAuthenticated:true` and `supplementSemanticsAuthenticated:true` for both zero and blocked results. A targeted `0644 -> 0600` mutation of the authoritative Plan-114 payload produced `FOUNDATION_SUBJECT_REJECTED` while the rendered blocked payload still asserted both authentication flags were true. This makes the evidence internally false.

**Fix:** Carry explicit independently derived authentication outcomes into the renderer. Blocked evidence must set failed or unperformed checks to false and root which boundary failed.

### CR-03: Drift in the Plan-115 subject cannot produce the required blocked evidence

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:711-712`  
**Issue:** When initial subject capture fails, the writer calls the blocked renderer, but that renderer immediately calls `captureSubjectClosure` again. Adapter/test/native current-byte, mode, ancestry, or subject-identity drift therefore throws a second time and publishes nothing instead of the plan-required sorted rooted blocked subject evidence.

**Fix:** Separate immutable expected subject identity from successfully captured closure data. Render a blocked contract from the failed observation without recapturing the failed boundary; reserve no-publication behavior for genuine reviewer/process-integrity failure.

### CR-04: Process-integrity failures are published as subject findings

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:214-231`  
**Issue:** Every non-zero child exit is converted to the same `TypeError` used by deterministic subject rejection. The writer catches any `TypeError` from the actual-mode run and publishes `ACTUAL_MODE_SUBJECT_REJECTED`. Driver timeout, unexpected race-driver failure, compiler/tool failure reported through the adapter, and malformed rejection behavior can therefore produce a canonical blocked trio even though the plan requires process-integrity failure to publish nothing.

**Fix:** Use distinct error classes for subject findings and process integrity. Convert only enumerated deterministic custody/semantic rejection codes into findings; propagate all execution, toolchain, timeout, parse, and harness failures without writing any trio path.

### CR-05: Review publication can escape through symlinked parent directories

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:798-807`  
**Issue:** The trio writer uses lexical `path.resolve` containment followed by ordinary `writeFileSync(..., "wx")`. It never opens and pins repository-relative parents with `O_NOFOLLOW`. If `.planning/artifacts` is swapped for a symlink, the payload and carrier are created outside the repository. This violates custody and creates unapproved external effects even if the later Git lifecycle fails.

**Fix:** Reuse an independently reviewed native descriptor-relative writer: pin repository and every parent identity, open parents with `O_DIRECTORY|O_NOFOLLOW`, create through retained directory descriptors, verify file identity/mode, fsync file and parent, and reject parent swaps with safe inode-specific cleanup.

### CR-06: The promised atomic three-file publication is not crash-atomic

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:798-812`  
**Issue:** The writer creates the payload, review, and carrier sequentially. Its rollback runs only for caught JavaScript errors. Process termination, host failure, or interruption after the first or second write leaves a permanent partial trio; subsequent runs fail the initial absence gate and cannot recover. This contradicts the Plan-116 atomic publication lifecycle.

**Fix:** Publish through a recoverable transaction protocol with a pinned parent, temporary owner-private files, fsync, an explicit transaction marker/recovery rule, and a single durable activation point; alternatively define and implement deterministic stale-partial cleanup that authenticates ownership and exact bytes before removal.

### CR-07: Runtime dependency bytes are not bound to the reviewed recursive closure

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:277-310`  
**Issue:** Recursive dependency roots are computed from `bb1d639a`, but only the three top-level subject entries are compared with current no-follow bytes and protected by `noRewrite`. Disposable modes run the adapter from a `HEAD` worktree and load current dependency modules. A later rewrite of a recursive import can therefore change reviewed behavior while the historical recursive root and publication rerender remain unchanged.

**Fix:** Persist the recursive manifest, require every entry to remain `100644` with exact current no-follow bytes equal to its pinned Git blob, apply `noRewrite` to the complete recursive/native/package closure, and execute from the pinned subject tree rather than an unconstrained `HEAD` worktree.

## Warnings

### WR-01: The Git wrapper's “allow failure” argument is ineffective

**Classification:** WARNING  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:143-144`  
**Issue:** The local wrapper passes `allowFailure` as the imported helper's third argument, but that parameter is an ignored ambient-environment value, not an allow-failure flag. Calls such as ancestry probes and `objectExists` throw on expected negative results instead of returning a status, making missing-object and invalid-ancestry branches inconsistent.

**Fix:** Add an explicit status-returning isolated Git API or catch only the known child-process non-zero result at the probe call sites; never overload the ambient-environment parameter.

### WR-02: The publication test silently passes when the trio is absent

**Classification:** WARNING  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts:134-136`  
**Issue:** The canonical authentication test returns successfully when any review path is missing. A deleted or partially published trio therefore skips the central lifecycle assertion instead of failing the completed Plan-116 suite.

**Fix:** Split pre-publication and post-publication suites. The completed-phase test must require all three paths and authenticate them; only an explicitly named pre-publication test may assert absence.

## Verification

- Current `--check-review`: passed for publication `e1e75fc6ef177a8213d903f1ec365d86f37cf62a`.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check 3ff893fd^..97e84c59`: passed.
- Targeted forged-mode probe: reproduced `plan109Eligible:true` with zero observations and null disposable closure.
- Targeted blocked-upstream probe: reproduced `FOUNDATION_SUBJECT_REJECTED` with both authentication flags incorrectly true; physical mode was restored.
- Shared supplement-v3 and effect destinations remained absent; worktree remained clean before this report.

---

_Reviewed: 2026-08-30T03:53:30Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: deep_
