---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T02:10:42Z
depth: deep
files_reviewed: 18
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v3.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v3.c
  - scripts/lib/v1-38-secure-workspace-path-v3.ts
  - scripts/lib/v1-38-secure-workspace-path-v3.test.ts
  - scripts/native/v1-38-secure-manifest-reader-v3.c
  - scripts/check-v1-38-phase-262-review-fix-correction-v6.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v6.test.ts
  - scripts/lib/v1-38-durable-pair-successor-v2.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts
  - scripts/run-v1-38-phase-262-historical-correction-checkouts.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v5.ts
  - vitest.config.ts
  - package.json
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T02:10:42Z
**Depth:** deep
**Files Reviewed:** 18
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Iteration 6 materially improves intent-path conflict handling, descriptor-relative lock acquisition, lifecycle fsync ordering, root-descriptor retention, Plan-89 binding, and spawn settlement. The current Plan-89 artifact still records `incomplete` / `gaps_found`, exhausted fresh 0/540, no reproduction-v16, and every authority field it carries is false. The protected v2 sources and helpers remain byte-identical to review base `24d6e902`; this review found no mutation or reinterpretation of the empirical result.

The source is not clean. Runtime compilation still does not establish an immutable compiler-to-output transformation, and the cached manifest reader is then trusted to authenticate the evidence that pins its own source. A single root descriptor prevents pathname replacement of the root but does not prevent intermediate-directory replacement between separate reader children, so correction-v6 can still be assembled from multiple subtree snapshots. Finally, correction-v6 declares that it supersedes correction-v5 for future authority while dropping the predecessor's explicit no-more-retry destinations and `foundationActivationAuthorized: false`; the latest authority surface is therefore incomplete precisely where the exhausted route must remain closed.

## Critical Issues

### CR-01: Native trust bootstrap still permits a compiler replace/restore substitution

**Files:** `scripts/lib/v1-38-secure-workspace-path-v3.ts:35-83`; `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:85-146`

**Issue:** Both bootstraps hash `/usr/bin/clang` bytes and later execute that pathname. The secure reader never re-reads the compiler after compilation and never authenticates the emitted executable at all; it checks only owner and mode before caching the binary. The controller performs before/after pathname hashes, but a substitute compiler can be installed for the spawn and restored before the second read. A forged reader can emit attacker-selected evidence bytes and then approve the remediation manifest that includes the reader source itself. Capturing the C source closes the source swap but does not bind the compiler invocation or resulting machine code.

**Fix:** Eliminate runtime compiler trust from evidence authentication: build a reviewed reader/helper artifact ahead of time and pin its exact executable digest and platform identity from an independent root. If runtime compilation must remain, open and execute a compiler through a retained authenticated descriptor or platform code-signature identity, bind all compiler inputs, and authenticate the exact produced executable against an independently derived expected identity before first use. Add synchronized compiler replace/restore tests for both bootstrap paths; an owner/mode check is not an executable identity check.

### CR-02: One root descriptor does not prevent cross-call intermediate-subtree splicing

**Files:** `scripts/lib/v1-38-secure-workspace-path-v3.ts:175-250`; `scripts/native/v1-38-secure-manifest-reader-v3.c:48-88`; `scripts/check-v1-38-phase-262-review-fix-correction-v6.ts:266-291`

**Issue:** `withV138SecureWorkspaceSession` retains fd 3 for the root, but every `read`, `authenticate`, and `assertAbsent` spawns a new reader which traverses intermediate components again. A concurrent actor can rename and replace `.planning`, `.planning/artifacts`, or `scripts` between manifest entries while preserving the root inode. Each individual read is no-follow and descriptor-relative, yet the full correction can combine valid files from different subtree inodes and can check forbidden absence in a replacement subtree after authenticating evidence in the original one. The tests cover replacement of the root pathname and replacement during one already-open parent, not replacement of an intermediate between two session calls.

**Fix:** Authenticate the set from an immutable Git tree/commit, or hold a repository-wide mutation lock and retained descriptors for every ancestor used by the manifest and absence set for the entire derivation. Bind those ancestor device/inode identities into the correction result and reject any change. Add a synchronized test that swaps `.planning/artifacts` after one authenticated entry but before the next entry/absence check and prove the derivation fails.

### CR-03: Correction-v6 supersedes the predecessor while dropping frozen no-retry denials

**File:** `scripts/check-v1-38-phase-262-review-fix-correction-v6.ts:122-135,270-278,287-291,317-355`

**Issue:** Correction-v5 explicitly denies creation of a new retry envelope, journal, terminal, Route-10 activation, candidate/Phase-263 authorization artifacts, formation/holdout/public/counting/gameplay artifacts, and archive/tag artifacts; it also carries `foundationActivationAuthorized: false`. Correction-v6 says `supersedesForFutureAuthority` but defines an authority key set without `foundationActivationAuthorized` and checks only reproduction-v16 plus one Plan-263 activation path for absence. Merely pinning the predecessor blob/root does not preserve those denials when the new artifact declares itself the future-authority successor. A consumer that correctly reads only the latest correction sees no explicit denial of another retry envelope or foundation activation despite the terminal exhausted 0/540 state.

**Fix:** Make correction-v6 additive without superseding predecessor authority, or carry forward the complete exact authority schema and every predecessor forbidden destination (including the canonical retry-v3/envelope/journal/terminal and Route-10 paths). Validate every bit false and every forbidden destination absent in the same scoped evidence session. Add mutation/presence tests for each carried-forward denial.

## Warnings

### WR-01: Pre-spawn bootstrap failures leak private directories and descriptors

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts:85-175`; `scripts/lib/v1-38-secure-workspace-path-v3.ts:35-83`

**Issue:** Cleanup is explicit for selected identity/compile failures and for child settlement, but the bootstrap bodies are not wrapped in `try/finally`. Exceptions from captured-source writes, chmod/stat, capability writes, either `openSync`, the final executable read, or the secure-reader output validation leave the 0700 build directory behind; a failure after opening the capability descriptor can leak descriptors too. The forced-spawn test begins only after `compileOneShotNative` has returned and does not cover these paths.

**Fix:** Give each bootstrap one outer ownership scope that closes every opened descriptor and recursively removes its directory on every throw until ownership is deliberately transferred to a successfully spawned child/cache. Inject failures at every filesystem and descriptor boundary and assert zero residue.

### WR-02: Detached historical results do not record the toolchain/dependency provenance that executed them

**File:** `scripts/run-v1-38-phase-262-historical-correction-checkouts.ts:26-89`

**Issue:** The runner pins the checkout commits, but symlinks current-main `node_modules` and invokes the current-main Vitest binary. Its result records only generation, commit, test path, and `passed`; it does not authenticate the historical tree/test blob, current lockfile, Node/Vitest/tsx versions, or dependency identity. A later dependency change can alter the result while producing the same reported provenance.

**Fix:** Record and verify the checkout tree and test blob plus the lockfile/package-manager/runtime/test-runner identities. Prefer installing/running the commit's lockfile-isolated dependencies or a separately pinned immutable toolchain, and persist those roots with the detached-checkout result.

## Verification Performed

- Inspected the complete v3 controller/native/secure-reader call chain, correction-v6 derivation, Plan-89 lifecycle binding, Plan-88 terminal interaction, and detached-checkout runner.
- Confirmed current lifecycle evidence is `incomplete` / `gaps_found`, terminal `exhausted`, fresh accepted 0/540, reproduction-v16 absent, and all twelve lifecycle authority fields false.
- Confirmed protected v2 source/helper paths inspected in this review have zero diff from `24d6e902`; current changes are additive v3/correction-v6 surfaces.
- `git diff --check` passed. Passing tests were treated as evidence only and do not close the race and authority-contract findings above.

---

_Reviewed: 2026-08-28T02:10:42Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
