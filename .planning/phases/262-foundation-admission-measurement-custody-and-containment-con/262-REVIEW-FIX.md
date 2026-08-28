---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T03:18:26Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 8
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T03:18:26Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 8

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: The privileged native helper inherits dynamic-loader injection variables

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v5.test.ts`, `scripts/native/v1-38-successor-transaction-helper-v5.c`
**Commit:** dd799410
**Applied fix:** Added an additive v5 route. The capability child receives only fixed `PATH`, `LANG`, `LC_ALL`, its private `TMPDIR`, and an optional validated test barrier. Native startup rejects DYLD, LD, Node loader, and parent-sentinel leakage before reading capability descriptors. The native helper compiles with `-Werror`. **Status:** fixed; security logic requires independent re-review.

### CR-02: The cached manifest reader can be replaced after its only authentication

**Files modified:** `scripts/lib/v1-38-secure-workspace-path-v5.ts`, `scripts/lib/v1-38-secure-workspace-path-v5.test.ts`, `scripts/native/v1-38-secure-manifest-reader-v5.c`
**Commit:** 39f08e1c
**Applied fix:** Replaced the reusable pathname cache with one private reader per batch. Each child uses a strict environment, emits an authenticated one-shot handshake, launches only after exact output digest verification and `uchg` substitution refusal, and is removed immediately after completion. Replacement and zero-residue tests pass. **Status:** fixed; concurrency/security logic requires independent re-review.

### CR-03: Compiler before/after checks do not bind the executable that performed compilation

**Files modified:** `scripts/lib/v1-38-private-native-bootstrap-v1.ts`, `scripts/lib/v1-38-private-native-bootstrap-v1.test.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts`, `scripts/lib/v1-38-secure-workspace-path-v5.ts`
**Commit:** bcfe5a55
**Applied fix:** Copies reviewed clang bytes from a retained descriptor, verifies the Apple source CDHash, deterministically ad-hoc signs and authenticates the private copy, marks compiler/source/output paths user-immutable, reproduces the native output, and verifies the exact output digest again at launch. A transient substitution attempt is refused. Focused bootstrap test passed 1/1. **Status:** fixed; Darwin bootstrap logic requires independent re-review.

### CR-04: Pair publication returns success after ignored fsync and cleanup failures

**Files modified:** `scripts/native/v1-38-successor-transaction-helper-v5.c`, `scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts`, `scripts/lib/v1-38-bounded-retry-successor-controller-v5.test.ts`
**Commit:** 1fb377f0
**Applied fix:** Every canonical-parent fsync, both stage unlinks, intent unlink, staging fsync, and intent-parent fsync now fail closed. Seven distinct durability fault boundaries retain enough authenticated canonical/transaction state for an idempotent rerun, which verifies both canonical members and zero intent/stage residue. Native compilation and source checks pass. **Status:** fixed; durability logic requires independent re-review.

### CR-05: Historical provenance trusts unpinned command implementations

**Files modified:** `scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.ts`, `scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.test.ts`, `.planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v3.json`, `package.json`
**Commit:** c7b200a0
**Applied fix:** The additive v3 runner invokes exact authenticated Git and signed Node paths, hashes exact pnpm/corepack scripts, validates `pnpm@11.1.2`, uses a strict environment, and binds the committed lockfile SHA, Vitest package integrity, installed version, and runner SHA. A PATH-prepended wrapper is rejected before checkout. Both detached historical suites and the persisted v3 artifact check passed. **Status:** fixed; provenance logic requires independent re-review.

### WR-01: The retained-ancestor batch is not a leaf snapshot

**Files modified:** `scripts/native/v1-38-secure-manifest-reader-v5.c`, `scripts/lib/v1-38-secure-workspace-path-v5.ts`, `scripts/lib/v1-38-secure-workspace-path-v5.test.ts`
**Commit:** 8a061393
**Applied fix:** Every required regular leaf is pre-opened and retained before evidence reads. Absence decisions are repeated around parent device/inode/generation/mtime/ctime checks and again before successful exit, so concurrent subtree/leaf path changes invalidate the whole child result. The exported protocol accurately names the required-leaf and parent-generation guarantee. Focused secure-reader suite passed 10/10. **Status:** fixed; snapshot logic requires independent re-review.

### WR-02: Abrupt termination leaves authenticated-reader bootstrap residue indefinitely

**Files modified:** `scripts/lib/v1-38-secure-workspace-path-v5.test.ts`
**Commit:** 8c135b67
**Applied fix:** The CR-02 one-shot design removes the cache and exit-only cleanup lifetime. Additional source and repeated-batch tests prove no reusable `readerExecutable`/exit handler exists and each completed batch removes its private bootstrap. **Status:** fixed.

## Additive Integrity Chain

**Files:** `scripts/check-v1-38-phase-262-review-fix-correction-v8.ts`, `scripts/check-v1-38-phase-262-review-fix-correction-v8.test.ts`, `.planning/artifacts/v1.38-phase-262-review-fix-correction-v8.json`
**Commit:** 3ab5edda
**Correction root:** `sha256:5cf09dc260ccf55637295b6a68d1bcd9a3070ce3a8f6f4b83076cc15cdff4c1e`

Correction-v8 authenticates all new source, tests, the v3 history artifact, package target, prior correction-v7, Plan 262-88 disposition, and current lifecycle status. It preserves all thirteen false authority fields, all fourteen forbidden destinations, exhausted fresh 0/540, and reproduction-v16 absence. It grants no live, retry, candidate, formation, holdout, public, product, production, counted, gameplay, archive, tag, or downstream authority.

## Verification

- Private bootstrap focused test: 1/1 passed.
- Secure reader/bootstrap focused suite: 11/11 passed; final secure-reader suite: 10/10 passed; no-cache test: 1/1 passed.
- Historical toolchain tests: 2/2 passed; correction-v2 and correction-v3 detached suites replayed successfully; v3 persisted provenance check passed.
- Correction-v8: canonical 1/1, authority mutation 13/13, forbidden destination 14/14 passed when serialized; CLI check passed.
- Both v5 native sources compile with `clang -std=c11 -Wall -Wextra -Werror`; controller source-only check passes.
- Full controller synthetic: 1 file and 9/9 tests passed serially on `main` in 348.54 seconds after commit `7cc2c4b7` raised the stale per-test harness limit from 240 to 900 seconds; the protocol itself was unchanged.
- Diff from review base `6b9d475b` is additive except the package target; protected v2-v7 and Plan 262-88/89 evidence bytes have no diff.

---

_Fixed: 2026-08-28T03:18:26Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 8_
