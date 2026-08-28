---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T02:02:46Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 6
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T02:02:46Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 6

**Summary:**

- Findings in scope: 8
- Fixed: 8
- Skipped: 0

The fixes remain source-only and additive in assurance. All protected v2 paths, Plan-262-88 evidence, and the empirical exhausted 0/540 outcome remain unchanged. Correction-v6 is an `integrity_non_pass`, grants no authority, performs no live execution, and records root `sha256:91c52d50082fbf306bd6d2566d6bbf5651ee0a3f4a6ae86a8de10a1303b09c51`.

## Fixed Issues

### CR-01: Intent paths omitted from transaction lock graph

**Files modified:** controller-v3, its test, and transaction-helper-v3
**Commit:** `3559776b`
**Applied fix:** Intent paths join the sorted capability-bound lock projection. The intent inode lock durably authenticates the first intent digest, and every no-replace `EEXIST` result authenticates existing canonical bytes. Pair and lifecycle shared-intent races require exactly one winner and zero loser publication.
**Status:** fixed; requires independent verification

### CR-02: Lifecycle before-image durability ordering

**Files modified:** controller-v3, its test, and transaction-helper-v3
**Commits:** `1d7b476d`, `87aafd2d`
**Applied fix:** The staging directory is fsynced after the authenticated backup link and before canonical unlink. Canonical parent durability is ordered through unlink and replacement. Six new crash boundaries prove recovery at every destructive boundary.
**Status:** fixed; requires independent verification

### CR-03: Mutable native trust bootstrap

**Files modified:** controller-v3, secure-workspace-path-v3, and normalized remediation sources
**Commits:** `9b520cce`, `5b7c620d`
**Applied fix:** Both native helpers compare captured source and clang to reviewed digests, exclusively write exact captured bytes inside a private 0700 directory, compile only that private input, and use a minimal allowlisted environment. Poisoned inherited compiler paths no longer affect either build.
**Status:** fixed; requires independent verification

### CR-04: Multi-root manifest splice and pathname absence checks

**Files modified:** secure-workspace-path-v3, its test, and secure-manifest-reader-v3
**Commit:** `488a5f18`
**Applied fix:** One secure session holds one root descriptor and performs every read and absence check by descriptor-relative traversal. Root replacement cannot splice a replacement tree into the manifest.
**Status:** fixed; requires independent verification

### CR-05: Plan-262-89 lifecycle evidence omitted

**Files modified:** correction-v6 checker, tests, and canonical artifact
**Commit:** `22ba7ac3`
**Applied fix:** Correction-v6 authenticates Plan-89 summary, readiness, checker, tests, and lifecycle; recomputes both roots; and enforces Phase 262 incomplete, `gaps_found`, fresh 0/540, reproduction absent, and every authority false.
**Status:** fixed; requires independent verification

### CR-06: Pathname lock namespace divergence

**Files modified:** controller-v3, its test, and transaction-helper-v3
**Commit:** `2e790b4e`
**Applied fix:** The native helper opens sorted lock inodes relative to root fd 4 and retains them through all preconditions and postconditions. A root rename/replacement test proves same-inode serialization.
**Status:** fixed; requires independent verification

### WR-01: Spawn failure hang and helper leak

**Files modified:** controller-v3 and its test
**Commit:** `0992ff7b`
**Applied fix:** Error, exit, close, stderr, and stdin-error paths settle exactly once and always close descriptors and remove the private helper. Forced spawn failure returns without hanging or publication.
**Status:** fixed

### WR-02: Historical correction suites unenforced

**Files modified:** `package.json` and historical-checkout runner
**Commit:** `d8e7e872`
**Applied fix:** `pnpm v1.38:phase262:historical-corrections` creates detached immutable checkouts at each pinned commit, fails if a suite is missing, runs both suites, reports results, and removes each checkout.
**Status:** fixed

## Verification

- Combined active regression: 3 files and 45/45 tests passed.
- Controller evidence: 50 overlap races, 100 disjoint races, 13 shared-intent conflicts, 16 crash recoveries, zero partial canonical files, zero retained lifecycle staging, 0 accepted cells, and no live effects.
- Correction-v6 and secure reader: 2 files and 36/36 tests passed; canonical root `sha256:91c52d50082fbf306bd6d2566d6bbf5651ee0a3f4a6ae86a8de10a1303b09c51` passed.
- Immutable historical target: correction-v2 passed 17/17 at `8ae8cba0`; correction-v3 passed 27/27 at `7b56ecdc`.
- Both native sources pass clang `-Wall -Wextra -Werror`; Turbo typecheck passed 27/27 tasks; Prettier and `git diff --check` passed.
- No protected v2 path, Plan-262-88 evidence, live receipt, outcome, or authority artifact was mutated or reinterpreted.

---

_Fixed: 2026-08-28T02:02:46Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 6_
