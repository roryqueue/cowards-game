---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T02:38:50Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 7
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T02:38:50Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 7

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Native trust bootstrap still permits a compiler replace/restore substitution

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v4.test.ts`, `scripts/native/v1-38-successor-transaction-helper-v4.c`, `scripts/lib/v1-38-secure-workspace-path-v4.ts`, `scripts/lib/v1-38-secure-workspace-path-v4.test.ts`, `scripts/native/v1-38-secure-manifest-reader-v4.c`
**Commit:** 17732f49
**Applied fix:** Added an additive v4 route that verifies the exact Apple platform code-signature/CDHash and byte digest of clang before and after compilation, binds every compiler input, compiles twice to identical output basenames, requires exact byte-for-byte reproduced executables, authenticates owner/mode/output bytes before spawn, and retains the existing one-shot capability/root-descriptor protocol. The controller and secure-reader focused suites pass. This security-sensitive bootstrap logic requires independent reviewer verification.

### CR-02: One root descriptor does not prevent cross-call intermediate-subtree splicing

**Files modified:** `scripts/lib/v1-38-secure-workspace-path-v4.ts`, `scripts/lib/v1-38-secure-workspace-path-v4.test.ts`, `scripts/native/v1-38-secure-manifest-reader-v4.c`
**Commit:** 8b72d463
**Applied fix:** Replaced per-entry reader children with one batch reader that pre-opens and retains every ancestor descriptor, binds device/inode identity for the whole session, and performs every read and forbidden-absence decision in that same child. A synchronized test swaps the intermediate subtree after entry one and proves entry two remains on the retained snapshot. This concurrency/security logic requires independent reviewer verification.

### CR-03: Correction-v6 supersedes the predecessor while dropping frozen no-retry denials

**Files modified:** `scripts/check-v1-38-phase-262-review-fix-correction-v7.ts`, `scripts/check-v1-38-phase-262-review-fix-correction-v7.test.ts`, `.planning/artifacts/v1.38-phase-262-review-fix-correction-v7.json`
**Commit:** 4916a325
**Applied fix:** Added correction-v7 as explicitly additive with no predecessor-authority supersession, carried forward the exact thirteen-field false authority schema including `foundationActivationAuthorized`, retained all fourteen retry/Route-10/candidate/formation/holdout/public/counting/gameplay/archive/tag forbidden destinations, and derives them in one retained-ancestor read/absence batch. The 37-test suite mutates every authority bit and materializes every forbidden destination. Correction root: `sha256:fdd9a566bd53c661bf595dcda3c2146421ed909e3b315fa04c9aff475f4ec81c`. This authority-contract logic requires independent reviewer verification.

### WR-01: Pre-spawn bootstrap failures leak private directories and descriptors

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v4.test.ts`
**Commit:** b10a75d4
**Applied fix:** Added one outer ownership scope around every pre-spawn bootstrap operation, closes each descriptor and removes the private directory on every throw until ownership transfers, and injects six failures spanning directory, source, output, capability write/open, and root-open boundaries. The full 9-test controller race/recovery suite passed in 196.9 seconds with exact zero-residue assertions.

### WR-02: Detached historical results do not record the toolchain/dependency provenance that executed them

**Files modified:** `scripts/run-v1-38-phase-262-historical-correction-checkouts.ts`, `.planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v2.json`, `package.json`
**Commit:** b9ff1d72
**Applied fix:** Each historical checkout now installs its own frozen-lockfile dependency graph offline, executes the installed Vitest source through the pinned Node binary, and persists/verifies commit tree, test blob, lockfile blob/hash, package blob/manager, pnpm version, Node path/version/hash, Vitest logical path/hash, isolation class, and dependency root. The canonical package target re-ran and verified correction-v2 (17/17) and correction-v3 (27/27).

## Verification

- Native v4 reader and transaction helper compile cleanly under `clang -std=c11 -Wall -Wextra -Werror`.
- Secure workspace v4: 9/9 tests passed.
- Controller v4: 9/9 tests passed, including 50 overlapping races, 100 disjoint races, crash recovery, bypass, replacement, spawn, and bootstrap cleanup evidence.
- Correction-v7 plus secure workspace: 37/37 tests passed; CLI canonical check passed.
- Historical detached checkouts: 17/17 and 27/27 passed from isolated frozen-lockfile installs; persisted provenance check passed.
- `git diff --check` passed.
- Protected v2 sources, Plan-262-88/89 evidence, terminal, journal, and lifecycle artifacts have zero diff from review base `6bfa0bf4`.
- No live execution, retry, reproduction, candidate, formation, holdout, public, production, archive, or tag authority was created.

---

_Fixed: 2026-08-28T02:38:50Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 7_
