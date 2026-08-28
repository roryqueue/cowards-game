---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T02:45:25Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v4.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v4.c
  - scripts/lib/v1-38-secure-workspace-path-v4.ts
  - scripts/lib/v1-38-secure-workspace-path-v4.test.ts
  - scripts/native/v1-38-secure-manifest-reader-v4.c
  - scripts/check-v1-38-phase-262-review-fix-correction-v7.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v7.test.ts
  - scripts/run-v1-38-phase-262-historical-correction-checkouts.ts
  - package.json
  - scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v3.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v5.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v6.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.ts
findings:
  critical: 5
  warning: 2
  info: 0
  total: 7
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T02:45:25Z
**Depth:** deep
**Files Reviewed:** 16
**Status:** issues_found

## Summary

The v4 remediation is not clean. Correction-v7 does correctly restore the complete thirteen-field false-authority surface, all fourteen forbidden destinations, additive/no-supersession semantics, and the frozen empirical result of 0/540 with reproduction-v16 absent. The protected v2 source and Plan 262-88/89 evidence paths inspected in this review have zero diff from review base `6bfa0bf4`, and every forbidden destination named by correction-v7 is absent.

Five independent integrity defects remain: the transaction helper inherits dynamic-loader environment variables while holding the root capability; the manifest reader is a reusable pathname executable that can be replaced after its one-time check; both compiler bootstraps still execute an unbound pathname between before/after checks; the native pair path reports success despite ignored durability/cleanup failures; and the historical runner trusts unresolved `git`/`pnpm` commands while describing their results as dependency provenance. Two additional robustness gaps concern non-atomic leaf evidence and orphaned cached-reader bootstraps.

## Critical Issues

### CR-01: The privileged native helper inherits dynamic-loader injection variables

**File:** `scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts:228-241`
**Issue:** The child receives `process.env` (or a copy with the test barrier) while inheriting the capability on fd 3 and the authenticated mutation root on fd 4. The helper is a freshly compiled non-platform executable, so variables such as `DYLD_INSERT_LIBRARIES`, `DYLD_LIBRARY_PATH`, and related loader settings can cause attacker-controlled initialization code to execute before `main`. That code receives the same capability descriptors and can mutate the trusted root without passing the token, intent, lock, or operation checks. The compiler and reader children already use allowlisted environments; the mutation helper does not.
**Fix:** Construct an allowlisted environment such as `{ PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", TMPDIR: oneShot.directory }`, add only the validated test barrier when needed, and add a regression dylib/environment test proving loader variables are absent in the helper.

### CR-02: The cached manifest reader can be replaced after its only authentication

**File:** `scripts/lib/v1-38-secure-workspace-path-v4.ts:46-96`
**Issue:** `secureReaderExecutable()` authenticates bytes once, stores only the pathname in `readerExecutable`, and reuses that pathname for every later batch at line 234. The random directory is mode 0700 but is owned by the same local operator account that owns the process; a concurrent same-uid process can discover the prefixed directory, rename or chmod/replace the cached file, and make subsequent correction checks execute arbitrary output-producing code. Because the malicious reader inherits the workspace descriptor on fd 3, it can fabricate reads and forbidden-absence responses. The last byte check at lines 91-92 protects only the initial return, not later invocations.
**Fix:** Make the reader one-shot per batch and remove it after a child handshake, or execute a retained authenticated descriptor through a small fixed launcher. In either case bind the exact launched image to the reviewed digest at every invocation, sanitize its environment, and test replacement after the first successful batch.

### CR-03: Compiler before/after checks do not bind the executable that performed compilation

**File:** `scripts/lib/v1-38-bounded-retry-successor-controller-v4.ts:119-140`
**Issue:** The controller hashes and code-signature-checks `/usr/bin/clang` before compilation and hashes/checks the same pathname afterward, but both compilations execute that pathname later at lines 127-130. A replace/restore substitution during the compilation window can use the same deterministic substitute for both builds, satisfying the two-output equality check, then restore reviewed clang before the post-check. The capability's compiler/output hash fields do not close this gap: the C helper only verifies that fields 7-9 are syntactically hex (`scripts/native/v1-38-successor-transaction-helper-v4.c:574-581`) and never binds them to its loaded image. The identical pattern exists in the manifest-reader bootstrap at `scripts/lib/v1-38-secure-workspace-path-v4.ts:60-86`.
**Fix:** Open/copy the reviewed compiler into a private immutable bootstrap location while its source descriptor is retained, verify the private copy and its code signature, execute that exact private image for both builds, and bind/verify the resulting executable digest at launch. A regression should substitute the compiler only during spawn and prove fail-closed behavior.

### CR-04: Pair publication returns success after ignored fsync and cleanup failures

**File:** `scripts/native/v1-38-successor-transaction-helper-v4.c:376-388`
**Issue:** The pair transaction ignores every `fsync` result for canonical parent directories (line 381), ignores `unlinkat` results while deleting stages and intent (lines 384-385), and ignores the final staging/intent-directory `fsync` results (line 386). An I/O error can therefore produce exit code 0 even though the canonical links were not durably committed or transaction residue was not durably removed. This contradicts the durable-pair postcondition and can turn a power loss into missing evidence after the controller has reported completion.
**Fix:** Check every `fsync` and `unlinkat` return, fail with a specific code, and retain authenticated recovery state when cleanup cannot complete. Add fault-injection coverage for each canonical-parent, staging, intent-parent, and unlink failure boundary.

### CR-05: Historical “provenance” trusts unpinned command implementations

**File:** `scripts/run-v1-38-phase-262-historical-correction-checkouts.ts:32-57`
**Issue:** The runner invokes `git` and `pnpm` by PATH. It records only `pnpm --version`, not the resolved pnpm/corepack executable path or bytes, and it has no expected identity for the installed Vitest bytes. A PATH-prepended wrapper can report `11.1.2`, install a fabricated test runner offline, return selected Git identifiers, and make that runner report both historical suites passed. The artifact then records the attacker's observed hashes and `--check` regenerates the same self-consistent values. Hashing the current Node and observed Vitest file does not establish that the dependency installer or installed runner came from the committed lockfile.
**Fix:** Resolve and hash/code-sign every executable before use (`git`, corepack/pnpm, Node), invoke exact authenticated paths with a sanitized environment, verify package-manager version against `packageManager`, and derive expected package/runner integrity from the committed lockfile/store metadata rather than accepting any observed runner hash. Persist those expected identities in the dependency root and add a PATH-wrapper rejection test.

## Warnings

### WR-01: The retained-ancestor batch is not a leaf snapshot

**File:** `scripts/native/v1-38-secure-manifest-reader-v4.c:141-166`
**Issue:** Every ancestor is retained before evidence work, which correctly prevents intermediate-subtree replacement. Leaf files and absence decisions are still opened or checked sequentially, however, so concurrent same-directory renames can splice different leaf generations or make forbidden files absent only for their individual checks. The resulting artifact calls this one batch, but consumers must not treat it as a simultaneous evidence snapshot.
**Fix:** Pre-open and retain every required regular leaf descriptor before reading any bytes, capture final-entry identities, and use a shared lock/generation protocol for absence decisions; otherwise rename the protocol/claims to state explicitly that only ancestor identity is snapshot-bound.

### WR-02: Abrupt termination leaves authenticated-reader bootstrap residue indefinitely

**File:** `scripts/lib/v1-38-secure-workspace-path-v4.ts:93-98`
**Issue:** The cached reader directory is removed only by a process `exit` listener. `SIGKILL`, host loss, or a crash before normal exit leaves the compiled executable, captured source, and reproduction output in `/tmp` with no next-start scavenging. Besides accumulating residue, this lengthens the window for CR-02 because the reusable executable can survive the process that created it.
**Fix:** Prefer a one-shot reader removed after handshake. If caching remains, maintain an authenticated owner record and scavenge stale prefixed directories at startup after verifying ownership, modes, and that no live owner holds them.

---

_Reviewed: 2026-08-28T02:45:25Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
