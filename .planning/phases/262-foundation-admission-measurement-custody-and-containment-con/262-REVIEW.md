---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T04:32:10Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - scripts/lib/v1-38-private-native-bootstrap-v2.ts
  - scripts/lib/v1-38-private-native-bootstrap-v2.test.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v6.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v6.c
  - scripts/lib/v1-38-secure-workspace-path-v6.ts
  - scripts/lib/v1-38-secure-workspace-path-v6.test.ts
  - scripts/native/v1-38-secure-manifest-reader-v6.c
  - scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts
  - scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v9.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v9.test.ts
  - package.json
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T04:32:10Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The iteration-9 remediation is not clean. The explicit `single_operator_local_seal_v1` boundary is now truthful: the reviewed code says that Darwin descriptor execution is unavailable, excludes hostile same-UID concurrency/pathname replacement, and no longer claims resistance to that excluded actor. Within the supported cooperating-controller boundary, the one-shot v6 helper, inherited capability/root descriptors, retained-root `flock`, exact-size retained-leaf read, post-read leaf metadata checks, external barrier directory, one-batch manifest read, and additive correction-v9 denial surface are materially sound.

The protected result also remains truthful. Git comparison and canonical hashes confirm that v2-v8 and Plan 262-88/89 evidence were not rewritten; Plan 262-88 remains exhausted at 0/540, all authority bits remain false, all fourteen forbidden destinations remain absent, and reproduction-v16 remains absent.

Two correctness/provenance defects remain. The exported secure workspace session authenticates a replacement root rather than its retained root descriptor, and historical-v4 executes both pnpm's unmeasured implementation bundle and the current checkout's unmeasured `tsx` loader while claiming an exact installed runtime/toolchain closure. A further Git provenance warning leaves working-tree byte transformations outside the claimed raw-tree binding.

## Critical Issues

### CR-01: Session manifest authentication escapes the session's retained root inode

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-secure-workspace-path-v6.ts:318-325`
**Issue:** `withV138SecureWorkspaceSession()` retains the original root descriptor at lines 271-277, and `session.read()`/`session.assertAbsent()` correctly pass that descriptor to the native reader. `session.authenticate()`, however, calls `readV138WorkspaceBatch(trusted, ...)`, which reopens the root by pathname at lines 216-217. This is not the excluded helper-executable replacement threat; it is a supported API correctness failure that the callback itself can trigger. A diagnostic renamed the original root, created a replacement at the old pathname, and then called `session.authenticate()` with the replacement bytes: it returned `true` under the original session identity. The existing root-replacement test at `v1-38-secure-workspace-path-v6.test.ts:317-340` checks only `read` and `assertAbsent`, so it misses the inconsistent authenticate path. Any caller relying on one session identity can therefore authenticate evidence from a different inode.
**Fix:** Refactor the batch reader to accept and duplicate the already-retained descriptor (plus its captured identity), and implement `session.authenticate()` through that descriptor-bound batch path. Add a root rename/replacement test that calls all three session operations and requires authentication of replacement bytes to fail while authentication of the retained original succeeds.

### CR-02: Historical-v4 omits executable pnpm and tsx code from its claimed toolchain closure

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts:124-145`
**Issue:** The runner hashes only pnpm's small `bin/pnpm.mjs` entry at line 126, but that entry dynamically imports `../dist/pnpm.mjs`; the implementation bundle is neither hashed nor included in `dependencyRoot`. That unmeasured bundle controls the version/store queries at lines 132-145 and both offline installs at lines 353-358, so it can fabricate identical checkout/reference closures and bypass the intended store-integrity proof without any concurrent pathname replacement. Separately, the aggregate branch launches each derivation through `node --import tsx` at lines 287-307, but no current `tsx` loader or dependency closure is authenticated or included in the result/root at lines 393-430. A pre-existing changed loader can fabricate the child JSON before the measured historical Vitest closure runs. Correction-v9 then persists `installedRuntimeClosureAuthenticated: true` at `scripts/check-v1-38-phase-262-review-fix-correction-v9.ts:145`, which overstates this incomplete execution closure. This defect is outside the explicitly excluded hostile-same-UID concurrency/pathname race: the invoked implementation bytes are never measured at all.
**Fix:** Bind the complete installed pnpm distribution, including `dist/pnpm.mjs` and every executable dependency, into a pre-launch/post-launch toolchain manifest and dependency root. Remove the ambient `--import tsx` bootstrap by executing reviewed precompiled JavaScript, or authenticate the exact tsx/esbuild closure and include it in the persisted root before launching it. Add mutation tests for pnpm's dist bundle and the tsx loader that preserve the currently pinned entry files and require rejection before checkout/install/result parsing.

## Warnings

### WR-01: Raw tree checks do not bind the bytes actually executed from the worktree

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.ts:250-275`
**Issue:** `assertRepositoryConfigurationSafe()` rejects several dangerous local keys but permits checkout-affecting keys such as `core.autocrlf`, `core.eol`, and `core.attributesFile`. `assertCheckoutMatchesRawTree()` then compares commit/tree object IDs and asks the same configured Git whether the worktree is clean; neither operation hashes the checked-out files. Git can therefore regard transformed working-tree bytes as clean while the evidence records only the raw tree ID. This weakens `rawCommitAndTreeVerified`/`checkoutCleanBeforeInstall` as a statement about the bytes passed to pnpm and Vitest.
**Fix:** Reject every local configuration key that can affect checkout bytes, explicitly neutralize attributes and conversion settings, and derive a deterministic manifest of the actual checked-out regular files/symlinks. Compare that manifest to bytes read from the pinned Git tree before dependency installation or test execution.

---

_Reviewed: 2026-08-28T04:32:10Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
