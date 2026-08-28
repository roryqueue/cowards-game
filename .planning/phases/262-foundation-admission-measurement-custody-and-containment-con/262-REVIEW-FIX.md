---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T00:23:58Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 4
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T00:23:58Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 4

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

All six fixes change transaction, containment, crash-recovery, or integrity logic. They require the planned independent iteration-4 source re-review before any later authority decision. Correction-v4 is additive, preserves the empirical 0/540 outcome, and grants no authority.

## Fixed Issues

### CR-01: Exported mutation functions still bypass the composed controller

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts`, `scripts/lib/v1-38-durable-pair-successor-v2.ts`, `scripts/lib/v1-38-durable-pair-successor-v2.test.ts`, `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts`, `scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts`, `scripts/lib/v1-38-secure-workspace-path-v2.ts`, `scripts/native/v1-38-successor-transaction-helper-v2.c`
**Commit:** f9346c25f3c2398fdd54f472e08317d7cbb1fd93
**Applied fix:** Removed every importable pair, lifecycle, directory-creation, and directory-lock mutation export. Pair and lifecycle modules now expose pure intent derivation only. The controller owns the sole private native invocation and exposes only non-writing constants/source checks plus two non-live CLI checks; its synthetic mode creates and removes its own temporary root. Export-inventory tests prove dynamic imports cannot obtain a write, publish, apply, invoke, worker, or run function.
**Status:** fixed; requires independent verification

### CR-02: Overlapping pair transactions take different locks and leave a partial losing pair

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts`
**Commit:** a1244815a0caec0f636442096eb2c5258bb4a0d4
**Applied fix:** The controller acquires one kernel-owned `/usr/bin/lockf -t 0` advisory lock for each normalized canonical target in deterministic sorted order and holds the nested lock chain through native prechecks, publication, both postconditions, and cleanup. Fifty `{shared,left}` versus `{right,shared}` races each produced exactly one complete pair and no losing unique member.
**Status:** fixed; requires independent verification

### CR-03: Disjoint pair transactions collide in the shared stage namespace

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts`
**Commit:** fc6c39b5d1ac518388519ccb5ddd9b2c9a192248
**Applied fix:** Stage names now derive from the complete normalized pair intent: trusted-root path/device/inode, intent path, transaction ID, both normalized targets, and both content digests. The durable intent authenticates the same descriptor. One hundred simultaneous disjoint same-ID/same-bytes races completed both pairs in every iteration.
**Status:** fixed; requires independent verification

### CR-04: A process exit leaves locks that permanently block crash recovery

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts`
**Commit:** e949441acc77c7fcd4f806618151a4e9185876b2
**Applied fix:** Removed directory pseudo-locks. Kernel advisory locks are released on process exit. Forced `_exit(97)` injection covers all five pair boundaries and all five two-step lifecycle boundaries (intent, each stage/member/step, status stage, and status publication); ten fresh processes recovered without deleting a lock, intent, stage, backup, or status byte.
**Status:** fixed; requires independent verification

### CR-05: Internal directory authentication is not held through subsequent writes

**Files modified:** `scripts/native/v1-38-successor-transaction-helper-v2.c`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts`
**Commit:** 41afe1605987d085ca793469bbc81ca587701b2f
**Applied fix:** Added a committed dependency-free native helper compiled locally with clang. It opens and verifies the trusted root and every target parent using `openat`/`fstatat`, `O_NOFOLLOW`, and `AT_SYMLINK_NOFOLLOW`, retains those descriptors, and performs every pair/lifecycle mutation with descriptor-relative `openat`, `linkat`, and `unlinkat`. Synchronized post-open/pre-write directory replacement tests for pair and lifecycle leave both external replacement directories empty while completing through the held authenticated directory descriptors.
**Status:** fixed; requires independent verification

### CR-06: Correction-v3 trusts mutable checker exports for its immutable manifests

**Files modified:** `scripts/check-v1-38-phase-262-review-fix-correction-v4.ts`, `scripts/check-v1-38-phase-262-review-fix-correction-v4.test.ts`, `.planning/artifacts/v1.38-phase-262-review-fix-correction-v4.json`
**Commit:** 1b1c66b45cfd49fc01cf48c75862a2121837b69e
**Applied fix:** Published additive correction-v4 without importing any prior checker manifest. It authenticates exact correction-v1/v2/v3 artifact bytes and roots, binds literal count plus canonical path-and-digest roots for every v1 protected/remediation, v2/v3 successor, and forbidden manifest, compares every path and digest across prior artifacts, and deep-freezes every nested value. It binds the immutable iteration-4 review blob at `ca6aaaa8`, the complete current successor/native manifest, exhausted 0/540, absent reproduction-v16, and all authority false. Tests mutate nested prior paths/digests, successor bytes, forbidden paths, and review bytes; every mutation fails closed.
**Correction artifact SHA-256:** `sha256:9f2fc7b1b3008e877ba7b39a05ac4c90a0cdd86afc57ad18a93fda1b7157f36c`
**Correction root:** `sha256:279c37b8acd63c432921242d07276b33f1b8265b1a96cd610284f0785379b3b3`
**Status:** fixed; requires independent verification

## Verification

- Current serialized successor/correction/lifecycle suite: 13 files, 194 tests passed; correction-v1 separately passed 4/4.
- Native helper: clang `-std=c11 -Wall -Wextra -Werror` passed.
- TypeScript: `pnpm exec tsc --noEmit --pretty false` passed.
- Current canonical correction-v1 and correction-v4 checkers passed.
- Immutable correction-v2 publication checkout `8ae8cba0`: 17/17 tests and canonical checker passed.
- Immutable correction-v3 publication checkout `7b56ecdc`: 27/27 tests and canonical checker passed.
- Pair concurrency: 50/50 overlapping races left no partial loser; 100/100 disjoint same-ID/same-bytes races completed both transactions.
- Crash recovery: 5/5 pair and 5/5 lifecycle forced-exit boundaries recovered without manual deletion.
- Directory replacement: pair and lifecycle post-open/pre-write replacements left external directories empty.
- Plan 262-88 remains immutable `non_pass` / `exhausted` at fresh 0/540 with no reproduction or activation. Its historical clean-assurance adjudication is superseded for future authority by correction-v4 and the required independent re-review.
- Plan 262-89 lifecycle tests passed; the canonical lifecycle status remains Phase 262 `incomplete`, verification `gaps_found`, lifecycle mutation false, and every downstream authority false.

---

_Fixed: 2026-08-28T00:23:58Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 4_
