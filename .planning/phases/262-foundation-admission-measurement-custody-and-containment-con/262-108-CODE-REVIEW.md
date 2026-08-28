---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "108"
review_type: independent_code_review
reviewed_commits: c9126a3d..ca3d8f78
status: blocked
finding_count: 4
critical_count: 2
high_count: 2
plan_262_109_eligible: false
reviewed: 2026-08-28
---

# Phase 262 Plan 108 Code Review

## Verdict

**BLOCKED.** The focused suite and canonical checker pass, and the implementation preserves the no-effect boundary during its normal path. However, the published literal-zero result is not supported by an independent custody implementation or the required mutation/finding behavior. Plan 109 must not consume the current trio.

## Scope and Verification

- Reviewed commits: `c9126a3d`, `55afcdf4`, `ac72e5fd`, `ca3d8f78`.
- Reviewed implementation, tests, semantic payload, human REVIEW, and external carrier.
- Governing contracts: `262-108-PLAN.md`, `262-107-RESEARCH.md`, `262-CONTEXT.md`, and `AGENTS.md`.
- Focused Plan-108 suite: `8/8` passed.
- Canonical `--check-review`: passed and reported literal zero.
- TypeScript: `pnpm exec tsc --noEmit --pretty false` passed.
- `git diff --check`: passed.
- No live mode was invoked during this code review.

## Findings

### F-262-108-01 — Critical custody decisions are delegated back to the Plan-107 subject

**Severity:** critical  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v8.ts:15-26,273-309,421-568`

The independent reviewer imports `authenticateV138LiveV8ProtectedHistory` and all three review/supplement root functions from the exact Plan-107 adapter it is meant to review. It then uses those subject-owned functions to accept protected history and construct the payload, carrier, and supplement roots. A defect or omission in the Plan-107 protected-history inventory is therefore repeated by Plan 108 rather than detected independently. Likewise, malformed domain separation in the subject becomes the reviewer's accepted root definition.

Raw-byte binding of the subject does not make these semantic checks independent. Threat `T-262-108-01` explicitly requires independent derivation, and the plan's primary truth is that the actual adapter and its executed closure are reviewed rather than trusted.

**Required fix:** independently encode the complete protected-history lineage/path/blob/mode/no-rewrite contract in the Plan-108 reviewer and derive all semantic/carrier/supplement roots locally. Subject functions may be invoked only as an exercised implementation and compared against the independently derived result. Keep the producer-incapable synthetic adapter call solely as an actual no-effect exercise.

### F-262-108-02 — Non-zero findings cannot produce the required blocked trio

**Severity:** critical  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v8.ts:421-578,711-748`

`buildTrio` hardcodes `findingCount:0`, an empty finding list, `reviewStatus:"zero_findings"`, four passed modes, and `plan109Eligible:true`. Every custody or mutation failure before that point throws. `publishV138Plan262108Review` therefore either writes a literal-zero trio or writes nothing; there is no code path that inventories a detected finding, derives its root, renders `status: blocked`, and publishes a truthful blocked trio.

This violates the explicit task contract that any mutation produces a finding and blocks Plan 109, and that a non-zero result publishes the truthful blocked trio without normalization or repair. It also means the empty finding root proves only a hardcoded branch, not the absence of findings.

**Required fix:** separate observation from publication. Convert each review failure into a deterministic finding record/code, derive the finding root over that inventory, and render either a literal-zero or blocked payload/REVIEW/carrier. `plan109Eligible` must be computed from exact zero plus all actual-mode passes, never assigned as a constant. Integrity failures that prevent trustworthy publication must remain distinct fail-closed process errors.

### F-262-108-03 — `--check-review` does not authenticate the committed trio's Git blobs or modes

**Severity:** high  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v8.ts:123-134,497-514,751-769`

The carrier claims `100644` modes and exact raw payload/REVIEW hashes, but `checkV138Plan262108PublishedReview` reads only current working files with `safeWorkingBytes`. That helper rejects symlinks but does not require the claimed mode. The check never resolves the trio at its publication commit, compares current bytes with committed blobs, or rejects a later committed rewrite. A dirty working restoration can also make the checker accept expected bytes while the committed artifact differs.

The Plan-107 consumer performs stronger committed-file checks later, but Plan 108 itself claims that the committed trio rerenders exactly and that the external carrier establishes raw-byte custody. Its own checker does not prove those claims.

**Required fix:** bind the exact trio publication commit, raw Git blobs, `100644` modes, ancestry, current no-follow bytes/modes, and no-later-rewrite status before accepting the carrier. Add dirty-byte, mode-drift, committed-blob-drift, and successor-rewrite regression tests for each member of the trio.

### F-262-108-04 — The mutation suite does not cover the declared review surface

**Severity:** high  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v8.test.ts:38-103`

The test named "rejects dirty bytes for every executed dependency" iterates only `clean.checkoutPaths`, which contains five entry paths. The reviewer reports a 135-path recursive closure, but no recursive dependency outside those five is mutated. The suite also contains no adversarial tests for the plan-mandated omitted dependency, Git path/mode substitution, protected-history branch, portable/full-root alias, review self-custody, pair rewrite, counter drift, authority claim, or forbidden effect cases. Nor does it invoke and assert the behavior of the seven declared CLI modes; it tests only the unknown-argument rejection.

Passing `8/8` therefore cannot support the published statement that every specified mutation was independently detected before literal-zero publication.

**Required fix:** add disposable-repository mutations for every enumerated trust boundary, including at least one non-entry recursive dependency and every protected-history branch. Exercise every CLI mode directly, assert exact no-effect state before and after, and require the mutation matrix to complete before a zero-finding trio can be built.

## Confirmed Properties

- Source identity is pinned to corrected Plan-107 commit `a964be04a8a0628d4969d2b38b02a31a51120a83` and its exact tree and parent.
- The normal derivation path reads committed source bytes, distinguishes portable and full closure roots, and leaves pathname-launch replacement resistance unclaimed.
- Disposable supplement publication occurs only in a temporary clone and cleanup is attempted in `finally`.
- The canonical supplement, journal, private receipts, terminal, reproduction, activation, readiness, and lifecycle destinations remain absent.
- The payload and carrier retain literal zero, `authorizesExecution:false`, and `downstreamAuthority:"denied"`; the problem is the sufficiency and independence of the proof supporting those values.

## Non-Authority

This review grants no Plan-109 eligibility and no supplement, execution, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. Seal-v13 and retry-envelope:v3 remain unchanged, sealed inactive, and unconsumed at zero counters.
