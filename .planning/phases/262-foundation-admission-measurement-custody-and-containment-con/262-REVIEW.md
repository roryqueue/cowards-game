---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T01:21:10Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v3.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v3.c
  - scripts/lib/v1-38-secure-workspace-path-v3.ts
  - scripts/lib/v1-38-secure-workspace-path-v3.test.ts
  - scripts/native/v1-38-secure-manifest-reader-v3.c
  - scripts/check-v1-38-phase-262-review-fix-correction-v5.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v5.test.ts
  - scripts/lib/v1-38-durable-pair-successor-v2.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.ts
  - vitest.config.ts
findings:
  critical: 6
  warning: 2
  info: 0
  total: 8
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T01:21:10Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Iteration 5 does close the previously demonstrated reusable-helper bypass, prevents partial bytes from becoming visible under deterministic names, cleans successful lifecycle residue, and makes each individual manifest read descriptor-relative after its parent is opened. The focused correction/reader tests pass 33/33, correction-v5 checks canonically, Plan 262-88 remains the exact exhausted non-pass, Plan 262-89 remains `gaps_found`, and both native sources compile with `-Wall -Wextra -Werror`.

The implementation is still not clean. Two transactions can bypass the intended conflict protocol by sharing an intent path while locking disjoint canonical targets. Lifecycle replacement can lose the only durable before-image on an arbitrary system crash. Both native trust paths compile mutable workspace source without an immutable compilation input, and the manifest reader is then used to authenticate its own source. Manifest derivation does not retain one root identity across all reads or absence checks. Correction-v5 does not authenticate the Plan-262-89 lifecycle result whose authority state is now canonical. Finally, the mutation lock files are opened by pathname after the trusted mutation root descriptor is captured, so root replacement separates the locks from the inodes being changed.

The protected v2 paths are unchanged byte-for-byte from review base `24d6e902`; no finding below depends on altering or reinterpreting those historical bytes.

## Critical Issues

### CR-01: Intent paths are omitted from the transaction lock graph

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:86-94,145-190`; `scripts/native/v1-38-successor-transaction-helper-v3.c:282-306,382-409`

**Issue:** The controller locks only pair member targets, or lifecycle step targets plus the lifecycle-status target. The canonical `intentPath` is not in either lock set. Two transactions with the same intent path but disjoint targets therefore run concurrently. Both can observe the intent absent; one `linkat` wins, while the other treats `EEXIST` as success because `write_committed` does not authenticate the existing canonical bytes. Both then publish their disjoint targets and may remove the winner's intent. This defeats the intent-conflict invariant and allows two incompatible transactions to report success. The existing disjoint-race test uses different intent paths, so it cannot detect the case.

**Fix:** Include the normalized intent path in the sorted capability-bound lock projection for both pair and lifecycle operations. After every no-replace link that returns `EEXIST`, authenticate the existing canonical bytes before continuing. Add pair and lifecycle races that use one shared intent path with disjoint targets and require exactly one success with no loser publication.

### CR-02: Lifecycle replacement unlinks the canonical before-image before its backup is durable

**File:** `scripts/native/v1-38-successor-transaction-helper-v3.c:414-434`

**Issue:** Lifecycle execution hard-links the old target into `.v138-lifecycle-staging`, immediately unlinks the canonical target, and only later fsyncs the target parent after installing the replacement. It never fsyncs the staging directory after creating the backup and before the destructive unlink. A machine crash in that window may persist the unlink but not the backup directory entry, leaving neither the original target nor a recoverable before-image. The injected process exits occur only after the replacement and parent fsync, so the advertised crash recovery does not cover this data-loss boundary.

**Fix:** Fsync the staging directory after the authenticated backup link is created and before unlinking the canonical target. Preserve a strict durable ordering through replacement, and inject exits immediately after backup link, after backup-directory fsync, after canonical unlink, and before replacement-directory fsync. Recovery must prove either the complete before state or the complete after state without manual repair.

### CR-03: The native trust bootstrap compiles mutable source and then authenticates itself

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:38-69`; `scripts/lib/v1-38-secure-workspace-path-v3.ts:18-32`

**Issue:** The transaction controller hashes the native source before and after invoking clang by pathname, but clang does not compile the captured buffer. A concurrent replace/restore can present malicious bytes to clang and restore the reviewed bytes before the second hash. The secure manifest reader is weaker: it compiles the mutable workspace source with no source/compiler/output hash at all, caches the result, and then that executable is used to authenticate the reader source listed in correction-v5. That is circular trust: a substituted reader can emit the expected evidence bytes and approve the source that produced it. Inherited compiler environment is also unsanitized, so the compiler invocation is not a frozen transformation even when the binary hash is unchanged.

**Fix:** Read and hash the expected source once, compare it to a commit-qualified reviewed digest, write those exact captured bytes into the private 0700 build directory with exclusive creation, and compile only that private immutable input under a minimal allowlisted environment. Authenticate the resulting executable against a separately rooted expected build identity or replace runtime compilation with a reviewed helper whose bytes are independently pinned. Bootstrap manifest authentication without using an executable that is authenticated only by its own output. Add synchronized source-replace/restore and compiler-environment injection tests.

### CR-04: Correction authentication can splice multiple root snapshots and still uses pathname-only absence checks

**Files:** `scripts/lib/v1-38-secure-workspace-path-v3.ts:35-40,55-112`; `scripts/check-v1-38-phase-262-review-fix-correction-v5.ts:81-100,117-120`

**Issue:** Each `readV138RegularNoFollow` call resolves and opens the root pathname afresh. Correction derivation performs dozens of independent calls, so replacing the root directory between calls can assemble a passing manifest from different directory inodes; no single root device/inode is retained for the derivation. Forbidden destinations are checked through `resolveV138RelativeNoFollow`, which lstat-checks parents by pathname and then lstat-checks the final component later. Replacing an intermediate directory with a symlink between those operations can turn an unsafe or present forbidden destination into an accepted absence. The synchronized reader test proves only one file read after one parent is opened, not an atomic manifest or absence set.

**Fix:** Open one trusted root descriptor at the beginning of the correction check, bind its device/inode into the result, and perform every evidence read and every final-component absence check relative to that same descriptor in one scoped reader session. Implement descriptor-relative absence checks with `fstatat(..., AT_SYMLINK_NOFOLLOW)` after holding every parent descriptor. Add root-swap tests between manifest entries and parent-swap tests immediately before forbidden-destination checks.

### CR-05: Correction-v5 omits the canonical Plan-262-89 lifecycle evidence

**File:** `scripts/check-v1-38-phase-262-review-fix-correction-v5.ts:35-60,101-114`

**Issue:** The correction authenticates Plan-262-88 disposition, terminal, journal, source review, and remediation sources, but it does not authenticate Plan-262-89's committed summary, driver-readiness artifact, final lifecycle-status-v2 artifact, checker, or tests. The lifecycle artifact is now the canonical record that Phase 262 is incomplete and both Phase-263 authorities are false. Mutating that artifact to claim completion or downstream authority does not change correction-v5 or make its checker fail, so correction-v5 can remain `integrity_non_pass` while the repository's terminal lifecycle evidence contradicts it. The fix report says Plan 262-89 was verified, but that verification is not part of the correction root.

**Fix:** Add the committed Plan-262-89 summary, readiness, checker/test identities, and lifecycle-status-v2 bytes to an additive correction successor. Validate its full exact schema, recompute `statusRoot`, require `phase262Status: incomplete`, `plan89VerificationStatus: gaps_found`, 0/540, and every authority bit false. Add one-field mutation tests for all lifecycle authority and completion fields.

### CR-06: Pathname-opened lock files can diverge from the descriptor-held mutation root

**File:** `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:61-69,86-100`

**Issue:** `compileOneShotNative` opens fd 4 for the trusted root, but the subsequent `/usr/bin/lockf` chain opens each lock file through `identity.path`. If the root directory is renamed and replaced after fd 4 is captured but before `lockf` opens its paths, the helper mutates the old root through fd 4 while the kernel locks belong to the replacement root. A second caller reaching the old root through its new name can acquire a different lock set and mutate the same targets concurrently. Child-directory replacement tests do not exercise replacement of the lock namespace root.

**Fix:** Open and lock the sorted lock files descriptor-relatively from fd 4 inside the authenticated native process (or pass already-open lock descriptors), and retain those locks through all preconditions and postconditions. Do not derive the effective lock namespace from a pathname after the mutation root descriptor exists. Add a synchronized root rename/replacement test and prove both contenders serialize on the same inode locks.

## Warnings

### WR-01: Native spawn failures can hang forever and retain the private helper

**File:** `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:95-109`

**Issue:** `invokeNative` resolves only on the child's `exit` event and registers no `error` or `close` fallback. If `lockf` cannot be spawned, Node emits `error` without a normal `exit`; the promise remains pending and the one-shot directory/capability survive. Errors on the stdin pipe are also unhandled. A resource-exhaustion or launch failure therefore converts fail-closed execution into a hang and cleanup leak.

**Fix:** Install `error`, `exit`, `close`, stderr, and stdin-error handling before writing input; settle the promise exactly once; close inherited descriptors and remove the private directory in every synchronous and asynchronous failure path. Add a forced spawn-failure test.

### WR-02: Historical correction tests are silently absent from normal test discovery

**File:** `vitest.config.ts:3-14`

**Issue:** The global test configuration excludes correction-v2 and correction-v3 tests, while the comment merely instructs operators to run them from immutable checkouts. No executable test target in this change enforces those checkout runs or reports a missing result. Consequently the ordinary green suite can be presented as the active review suite even when the protected historical verification was never executed in a fresh environment. This does not mutate protected bytes, but it weakens test-result provenance.

**Fix:** Keep the current-tree exclusions if import-time historical manifests require them, but add an explicit CI/package target that creates detached immutable checkouts at the pinned commits, runs each excluded suite, and fails when either run is missing. Report those results separately from current-tree test counts.

## Verification Performed

- Correction-v5 and secure-reader focused suites: 2/2 files and 33/33 tests passed.
- Correction-v5 canonical checker: passed with root `sha256:f55a78bed76ca40fbb817fac37c168bf12b684b0772e7dc4876f3f6666ae777a`.
- Plan-262-88 checker: exact `non_pass`, `exhausted`, zero assurance defects, no activation.
- Plan-262-89 final checker: exact `gaps_found`, lifecycle root `sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6`, no completion mutation.
- Both native v3 helpers compile with `/usr/bin/clang -std=c11 -Wall -Wextra -Werror -fsyntax-only`.
- `git diff --check`: passed.
- All eleven protected v2 source/helper paths have zero diff from `24d6e902`; their current SHA-256 values match correction-v4's recorded source manifest.

---

_Reviewed: 2026-08-28T01:21:10Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
