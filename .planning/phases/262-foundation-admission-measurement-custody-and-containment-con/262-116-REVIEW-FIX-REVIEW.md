---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 116
reviewed: 2026-08-30T14:38:14Z
depth: deep
source_range: 189b7e96..01df2062
files_reviewed: 8
files_reviewed_list:
  - scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts
  - scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts
  - scripts/native/v1-38-plan-262-116-review-transaction-v1.c
  - .planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v2.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-REVIEW-v2.md
  - .planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v2.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-REVIEW-FIX.md
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-SUMMARY.md
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 116: Fix Re-review Report

**Reviewed:** 2026-08-30T14:38:14Z  
**Depth:** deep  
**Files Reviewed:** 8  
**Status:** issues_found

## Summary

The fixes materially improve the implementation. Forged or duplicate mode evidence is rejected; authentication flags and failed boundaries render truthfully; failed subject closure is captured once; process errors use a separate class; current recursive/native/package custody is pinned to the subject commit; expected-negative Git probes work; descriptor-relative native writes contain symlinked parents; crash-partial recovery is rooted and byte-authenticated; and completed-phase tests now require both publication generations.

The corrected v2 publication nevertheless fails its mandatory authentication today. Both the CLI and the completed-phase Vitest assertion re-executed the actual modes and stopped with `V138_PLAN116_POST_AUTH_OBSERVATIONS_INVALID`. In addition, the authenticator cannot validate any truthful blocked v2 publication because it requires the failed foundation to pass before it reconstructs the evidence with all authentication flags forced true. Corrected v2 therefore cannot yet be the authoritative Plan-109 eligibility gate.

## Critical Issues

### CR-01: The committed v2 trio fails mandatory independent post-authentication

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:975-981`  
**Issue:** `authenticateV138Plan116PublishedReview` re-executes the pinned nine modes and requires their observation bytes/root and disposable closure to equal the committed payload. On current clean HEAD `01df2062`, both `--check-review` and the mandatory publication test fail with `V138_PLAN116_POST_AUTH_OBSERVATIONS_INVALID`. The committed claim that independent post-authentication passed is therefore false or stale, and `plan109Eligible:true` is not currently authenticated.

**Fix:** Diff the freshly re-executed observation set and disposable closure against payload v2, remove every nondeterministic field or bind it through a stable portable identity, rerun the nine modes from the final reviewer closure, and publish a new superseding exact three-file trio. Require `--check-review` to pass from the final clean HEAD before exposing Plan-109 eligibility.

### CR-02: Truthful blocked v2 evidence has no authenticatable lifecycle

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts:958-988`  
**Issue:** The writer can now publish blocked evidence with `subjectAuthenticated`, `upstreamAuthenticated`, and `supplementSemanticsAuthenticated` set according to the failed boundary. The authenticator cannot authenticate that evidence. It first calls `captureSubjectClosure` and `authenticateIndependentUpstream`, so persistent subject/upstream drift exits before reading the blocked contract. If the drift is later repaired, it rerenders with all three flags hardcoded true and `failedBoundary:null`, which cannot equal the truthful blocked payload. Thus the plan-required literal-zero-or-blocked trio supports only the zero branch.

**Fix:** Authenticate blocked publications from their captured failure record without requiring the failed boundary to pass. Independently re-observe the boundary and compare the rooted rejection when drift persists; define an explicit historical-blocked verification rule when drift is repaired. Pass the resulting authentication object into `renderContracts` instead of hardcoding success.

## Resolved Prior Findings

- CR-01 forged nine-mode eligibility: resolved by exact ordered observations, distinct roots, aggregate re-rooting, and a required disposable closure.
- CR-02 truthful blocked flags: rendering resolved; end-to-end blocked authentication remains open as CR-02 above.
- CR-03 subject drift recapture: resolved in the writer/render path.
- CR-04 process-failure classification: resolved for the tested error taxonomy.
- CR-05 symlink escape: resolved by retained no-follow native parent traversal.
- CR-06 crash-partial publication: resolved by the authenticated pending marker and exact recovery protocol.
- CR-07 recursive runtime custody: resolved by current byte/mode/no-rewrite checks and subject-commit worktrees.
- WR-01 Git negative probes: resolved.
- WR-02 missing-publication test skip: resolved.

## Verification

- Mandatory `--check-review`: **failed** with `V138_PLAN116_POST_AUTH_OBSERVATIONS_INVALID`.
- Targeted completed-phase authentication test: **failed** with the same error.
- Targeted recursive-custody, subject-blocked rendering, forged-mode, process-classification, Git-probe, and symlink-containment tests: passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check 189b7e96..01df2062`: passed.
- Transaction marker, supplement-v3, and canonical effect destinations: absent.

---

_Reviewed: 2026-08-30T14:38:14Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: deep_
