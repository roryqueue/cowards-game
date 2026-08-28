---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T04:50:30Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 10
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T04:50:30Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 10

**Summary:**

- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: Session manifest authentication escapes the session's retained root inode

**Files modified:** `scripts/lib/v1-38-secure-workspace-path-v6.ts`, `scripts/lib/v1-38-secure-workspace-path-v6.test.ts`
**Commit:** 8206aff1
**Applied fix:** Refactored one-batch authentication onto the session's retained root descriptor and captured device/inode identity. The child receives a duplicated inherited descriptor, never reopens the root pathname, and the regression test proves a renamed original root remains readable/authentic while replacement-path bytes cannot authenticate.

### CR-02: Historical-v4 omits executable pnpm and tsx code from its claimed toolchain closure

**Files modified:** `scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts`, its focused test, `package.json`, additive historical-v5/correction-v10 sources, tests, and artifacts
**Commits:** 3d97d5da, 87aac909
**Applied fix:** Authenticated all 448 files in the installed pnpm distribution, including `dist/pnpm.mjs`, before and after every pnpm invocation and bound that closure into each dependency root. Removed the ambient `node --import tsx` child bootstrap by deriving both historical cases in the already reviewed process. Mutation tests reject a changed pnpm implementation with the pinned entry unchanged. Additive correction-v10 binds the new provenance and preserves 0/540 with every authority false.

### WR-01: Raw tree checks do not bind the bytes actually executed from the worktree

**Files modified:** `scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts`, its focused test, and additive historical-v5 evidence
**Commit:** 33a70ed2
**Applied fix:** Neutralized checkout conversion settings, rejected checkout-affecting local config and tracked `.gitattributes`, and compared each executed regular file or symlink to its authenticated Git blob identity with mode checks. The exact executed-byte manifest root is persisted and included in each dependency root. Tests reject both CRLF-transformed bytes and attribute-controlled checkouts.

## Correction Chain

Commit `87aac909` records additive correction-v10 and historical-v5 evidence without changing protected v2-v9 or Plan 262-88/89 evidence. Correction root `sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3` preserves the explicit `single_operator_local_seal_v1_no_hostile_same_uid` boundary, admission at fresh 0/540, reproduction-v16 absent, every authority bit false, and all fourteen forbidden destinations absent.

## Verification

- Secure retained-root reader/session suite: 17/17 passed.
- Historical provenance suite, including pnpm-dist mutation, ambient-tsx exclusion, CRLF/attribute rejection, and the full twin-checkout mutated-runner path: 6/6 passed.
- Additive correction-v10 canonical, authority, forbidden-destination, and evidence-mutation suite: 38/38 passed.
- Combined focused regression: 61/61 passed in 88.25 seconds.
- Canonical historical-v5 and correction-v10 package checkers passed after independently deriving both real historical correction runs.
- Real correction-v2 and correction-v3 offline checkout/install/Vitest derivations passed; their executed-byte manifests cover 4,101 and 4,104 files respectively.

---

_Fixed: 2026-08-28T04:50:30Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 10_
