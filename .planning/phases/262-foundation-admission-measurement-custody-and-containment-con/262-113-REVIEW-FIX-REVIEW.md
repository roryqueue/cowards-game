---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "113"
reviewed: 2026-08-29T23:58:25Z
depth: deep
review_type: fix_re_review
source_range: a9c49039..0b0d261c
evidence_commit: 4e5f26fb
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts
  - scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts
  - scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts
original_findings:
  resolved: 7
  unresolved: 0
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 113: Code Review Fix Re-review

**Reviewed:** 2026-08-29T23:58:25Z
**Depth:** deep
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The fixes resolve the core defect in each of the seven original findings. The reviewed installed manifest is now path-stable across a physically separate equivalent installation; portable review custody is separated from canonical local execution custody; the producer receives the already authenticated typed pair; bounded success performs exact reproduction-v17 custody; publication, Plan-93, pair, and protected paths receive no-rewrite checks; prospective evidence derives its reviewed closure from the repository; and the tests now mutate real custody inputs.

The corrected source still cannot ship. A new fail-open absence check admits dangling symlinks at every forbidden Plan-114, supplement, producer-output, and downstream path. This was reproduced against exact commit `0b0d261c`: a dangling symlink at the Plan-114 payload path satisfied `assertAbsent`, and `--check-source-only` returned success. The Plan-114 review-local root also remains structurally trusted rather than verified by the linked-review checker.

Verification run in a detached worktree pinned to `0b0d261c`:

- Focused Vitest suite: 7/7 passed.
- `--check-source-only`: passed with `liveInvoked:false`, fresh charged/accepted zero, and downstream authority denied.
- `tsc --noEmit --pretty false`: passed.
- Scoped `git diff --check`: passed.
- No readiness, production, supplement publication, or live selector was invoked.

## Original Finding Resolution

| Original finding | Result | Evidence |
|---|---|---|
| CR-01 absolute installed paths | Resolved | Stable package identities, relative content/symlink records, local-only historical installed root, and separate-install equality test. |
| CR-02 linked/canonical local-root contradiction | Resolved | Portable reviewed root and linked-review local context are separate; canonical local root is derived and compared before/after the producer boundary. |
| CR-03 unauthenticated pair reread | Resolved | Exact typed pair is returned by admission and passed directly to the producer without reread or `as any`. |
| CR-04 missing reproduction-v17 post-check | Resolved | Bounded success performs no-follow canonical artifact/journal reads, exact reproduction validation, and outcome recheck. |
| CR-05 literal-only immutable history | Resolved | Publications, pair, Plan-93, and enumerated protected paths now enforce ancestry, exact bytes/modes, semantics, and successor no-rewrite history. |
| WR-01 fabricated closure renderer | Resolved | The public derivation API takes a repository and committed source identity and derives the reviewed closure itself. |
| WR-02 synthetic mutation test | Resolved | Tests exercise real path, mode, byte, history, native-source, installed-package, and evidence mutations. |

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Dangling symlinks bypass every forbidden-destination gate

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts:311-313`

**Issue:** `assertAbsent` uses `existsSync`, which follows symlinks and returns `false` for a dangling symlink. Consequently a filesystem entry can already occupy any supposedly absent Plan-114, supplement-v1/v2/v3, producer-owned, or downstream destination while all source/prospective/readiness gates treat it as absent. The closed-mode test repeats the same blind spot by using `/usr/bin/test -e`. A later writer can follow such a link and create or modify a target outside the intended repository path, and the source-only gate already makes a false no-artifact claim. In the pinned detached worktree, adding `plan114Payload -> /tmp/v138-review-missing-target` still produced a successful `source_only_checked` result.

**Fix:** Implement absence with `lstatSync` and treat every directory entry, including dangling symlinks, sockets, and special files, as present. Reuse a no-follow `pathPresent` helper for all forbidden paths. Add mutations for dangling relative and absolute symlinks at a Plan-114 path, supplement-v1/v2/v3, a producer-owned output, and a downstream output; every source/prospective/readiness boundary must reject them before any effect.

### Warnings

#### WR-01: The linked-review local custody value is accepted from the payload instead of verified

**Classification:** WARNING

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts:523-539`

**Issue:** `checkV138LiveV10ProspectiveCustodyForReview` derives no expectation for `reviewedLocalExecutionClosureRoot`. It reads that value from `input.plan114.payload`, validates only its SHA syntax, and then renders the expected payload, review, carrier, and supplement using the same supplied value. During the required linked-worktree review, the function also receives the independently derived linked `reviewedClosure`, so it can verify the payload's review-local value exactly but does not. Canonical production does not use this field as its local execution root, so this is not an execution bypass; it does allow internally consistent Plan-114 evidence to attest a fabricated linked-review local context.

**Fix:** Split review-time and canonical-consumption validation. The review-time checker must require `payload.reviewedLocalExecutionClosureRoot === reviewedClosure.localExecutionClosureRoot`. The canonical consumer may treat the committed review-local root as an attestation while independently deriving and pinning its distinct canonical local root. Add a mutation test changing only the review-local root and re-rendering all dependent bytes; linked-review validation must reject it.

---

_Reviewed: 2026-08-29T23:58:25Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
