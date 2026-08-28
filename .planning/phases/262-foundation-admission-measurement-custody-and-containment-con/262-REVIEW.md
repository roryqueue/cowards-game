---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T03:39:23Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - scripts/lib/v1-38-private-native-bootstrap-v1.ts
  - scripts/lib/v1-38-private-native-bootstrap-v1.test.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v5.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v5.c
  - scripts/lib/v1-38-secure-workspace-path-v5.ts
  - scripts/lib/v1-38-secure-workspace-path-v5.test.ts
  - scripts/native/v1-38-secure-manifest-reader-v5.c
  - scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.ts
  - scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v8.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v8.test.ts
  - package.json
findings:
  critical: 5
  warning: 2
  info: 0
  total: 7
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T03:39:23Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The iteration-8 remediation is not clean. Correction-v8 preserves the complete false-authority surface, all fourteen forbidden destinations, the empirical exhausted result of 0/540, and reproduction-v16 absence. Git comparison from the iteration-8 review base also confirms that protected v2-v7 source and the Plan 262-88/89 disposition/lifecycle evidence were not rewritten.

Five integrity defects remain. Private compiler/helper/reader launches are still pathname launches after a check that a same-UID peer can invalidate; the reader's advertised leaf snapshot accepts in-place leaf mutation; historical replay authenticates only Vitest's one-line entry module rather than the code it imports; historical Git execution permits unbound configuration, hooks, and replacement refs; and persistent lock names can be unlinked and recreated while the old descriptor remains locked. Two additional test/API defects conceal the reader race and expose a sequential manifest check as if it were one authenticated manifest.

## Critical Issues

### CR-01: Owner-clearable flags do not bind the checked compiler or helper image to launch

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-private-native-bootstrap-v1.ts:162-170`
**Issue:** The bootstrap verifies and copies `/usr/bin/clang`, then executes the private compiler by pathname at lines 192-205. The controller repeats the same pattern for the generated helper: it reads the pathname at `scripts/lib/v1-38-bounded-retry-successor-controller-v5.ts:129-132` and again at lines 198-203, then calls `spawn(executable)`. `uchg` is not an isolation boundary against the owner: this module's own cleanup clears it with `/usr/bin/chflags nouchg` at lines 48-56. A concurrent same-UID process can therefore clear the flag and replace either private pathname after its last digest check. A substituted compiler sees the compile-time token and can emit a substituted helper; a substituted helper is launched with the capability and trusted-root descriptors on fd 3/fd 4. The capability's compiler/output hashes do not prevent this because the native helper only syntax-checks those fields at `scripts/native/v1-38-successor-transaction-helper-v5.c:582-586` and never authenticates its loaded image.
**Fix:** Retain descriptors for the authenticated private compiler and helper and execute those exact descriptors through a small reviewed native launcher using descriptor execution such as `fexecve`; keep the descriptors open until successful exec. Apply the same mechanism to the one-shot reader. If Darwin cannot support a descriptor-exec implementation acceptable to the project, explicitly narrow the contract to exclude hostile same-UID concurrency rather than claiming replacement resistance.

### CR-02: The required-leaf snapshot accepts in-place mutation and can return a truncated/new generation

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/native/v1-38-secure-manifest-reader-v5.c:179-224`
**Issue:** The reader preopens each leaf and records `leaves[i].identity`, but never compares a post-read `fstat` with that identity. `require_directory_generations()` checks only parent directories; modifying or truncating an existing leaf does not change its parent directory generation. A live diagnostic against this source preopened a 64 MiB leaf, truncated/replaced its contents in place while the child was running, and exited 0 with the new seven-byte value (`after!\n`) under the claimed `required_leaf_descriptors_and_parent_generation_bound` snapshot. The result can therefore authenticate a different or mixed leaf generation and let correction-v8 compute a false evidence manifest.
**Fix:** Before any output, record each retained leaf's device, inode, generation, size, mtime, and ctime. Read an exact bounded byte count, reject early EOF/trailing growth, then post-`fstat` every leaf and require the complete identity/generation/size/time tuple to be unchanged. Prefer hashing while reading and emit output only after all leaf and parent postconditions pass. Add in-place truncate, overwrite, append, and same-inode mutation races.

### CR-03: Historical replay authenticates the Vitest stub but not the code that executes

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.ts:145-169`
**Issue:** The runner pins the lockfile integrity string and hashes only `node_modules/vitest/vitest.mjs`. That file is just `import './dist/cli.js'`; neither `dist/cli.js` nor its imported Vitest/Vite/esbuild dependencies are authenticated before Node executes them. A modified installed package can retain the expected one-line entry file and version while changing the actual runner, so both detached suites can report arbitrary success and the persisted dependency root still uses the expected stub hash. The checked pathname can also be replaced after line 162 and before line 167.
**Fix:** Verify the installed package/store content against the lockfile integrity with a complete file manifest, or execute from an immutable verified package archive/store snapshot. Bind every imported runner/dependency byte (including native helpers) into the dependency root and retain/descriptor-bind the exact entry image through launch. Add a test that preserves `vitest.mjs` and `package.json` but mutates `dist/cli.js`, and require rejection before test execution.

### CR-04: Historical Git provenance permits local hooks, config, and replacement refs

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-phase-262-historical-correction-checkouts-v3.ts:124-173`
**Issue:** Exact Git bytes and code signature do not determine Git behavior. The clean environment at lines 47-53 does not disable system/global/local configuration, hooks, or replacement objects. `git worktree add` can execute a configured `post-checkout` hook, and local/global config can redirect `core.hooksPath`; replacement refs can change what an otherwise exact object command sees. A same-operator repository can therefore mutate the checkout or dependency tree before the historical suites while the evidence records the expected Git executable identity.
**Fix:** Invoke Git with `GIT_CONFIG_NOSYSTEM=1`, an isolated HOME/XDG config root, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_NO_REPLACE_OBJECTS=1`, and command-level `-c core.hooksPath=/dev/null`; reject unexpected repository config relevant to object lookup/worktrees. Resolve commit/tree/blob identities from raw authenticated objects or a read-only clone and verify the complete checkout tree before installing dependencies.

### CR-05: Persistent lock pathnames can be replaced while the old descriptor remains locked

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/native/v1-38-successor-transaction-helper-v5.c:123-145`
**Issue:** The helper locks a descriptor opened from a deterministic root-relative lock name, but never verifies that the root entry still names that inode. Advisory locks attach to the open file description, not the pathname. A same-UID peer can unlink the mode-0600 lock file after line 133 and create a new file at the same name; a second controller then locks the new inode and both mutate the same target concurrently. This defeats the claimed root lock namespace even though both helpers hold successful `F_SETLK` locks.
**Fix:** Place locks in an authenticated owner-only directory and retain a directory-level guard that prevents lock-entry replacement, or re-`fstatat` every lock name after acquisition and before mutation and require it to match the held descriptor while holding a non-replaceable root coordination primitive. Add a race that unlinks/recreates a held lock and prove the contender fails closed.

## Warnings

### WR-01: The reader barrier invalidates its own root generation and makes the replacement test a false positive

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/native/v1-38-secure-manifest-reader-v5.c:94-115`
**Issue:** Directory identities are refreshed at lines 195-196, then `barrier()` creates and fsyncs a ready marker in the root at lines 103-105. The immediate generation check at line 199 must therefore observe the barrier's own root-directory ctime/mtime change. The test at `scripts/lib/v1-38-secure-workspace-path-v5.test.ts:122-147` accepts `V138_READER_BATCH_GENERATION_CHANGED`, so it passes even if the subtree replacement logic contributes nothing. This concealed CR-02 and does not prove the advertised replacement behavior.
**Fix:** Put synchronization markers outside the authenticated root or create them before the snapshot identities are captured. Assert a replacement-specific identity mismatch, and add a no-replacement barrier control that must succeed.

### WR-02: The exported manifest authenticator reads entries in separate one-shot sessions

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-secure-workspace-path-v5.ts:303-306`
**Issue:** `authenticateV138ManifestNoFollow()` delegates to `session.authenticate()`, which invokes a new one-shot reader for every entry. A concurrent writer can splice mutually inconsistent generations between entries while the function returns true. Correction-v8 correctly uses `readV138WorkspaceBatch`, but the exported v5 API name still promises authentication of one manifest without its snapshot guarantee.
**Fix:** Implement `authenticate` with a single `readV138WorkspaceBatch` call containing every entry and compare all hashes from that batch, or rename/deprecate the sequential API so callers cannot treat it as a coherent manifest snapshot.

---

_Reviewed: 2026-08-28T03:39:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
