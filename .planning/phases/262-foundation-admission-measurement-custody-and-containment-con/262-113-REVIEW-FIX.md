---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-29T23:48:17Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-113-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 262 Plan 113: Code Review Fix Report

**Fixed at:** 2026-08-29T23:48:17Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-113-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: The reviewed closure still incorporates absolute checkout paths

**Files modified:** `scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `a9c49039`
**Applied fix:** Replaced the historical absolute dependency-root manifest in reviewed custody with a package-identity, relative-content, mode, byte, and dependency-edge manifest. Retained the historical installed root only in explicitly local custody and proved equality across a physically separate equivalent installation.

### CR-02: A Plan-114 trio created in the required linked worktree can never pass canonical readiness

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `bf112e07`
**Applied fix:** Split portable reviewed custody from linked-review local context, derive canonical local custody independently, and require the canonical local closure to remain identical before and after the producer boundary.
**Verification status:** Fixed; requires human verification of the future publication/readiness sequence.

### CR-03: The effectful producer receives pair bytes re-read after authentication with validation disabled

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `3a88b663`
**Applied fix:** Authenticate the exact pair with no-follow current-file checks, canonical/root/schema validation, and a typed frozen producer pair; pass only that admitted pair without rereading or `as any`.

### CR-04: Post-run success omits the required reproduction-v17 custody check

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `ada445f3`
**Applied fix:** Restored no-follow canonical reproduction/journal reads, exact reproduction-v17 schema/root/privacy/authority/journal validation, and the final published-outcome no-change recheck.
**Verification status:** Fixed; requires human verification of the bounded-success branch against a future real producer result.

### CR-05: Immutable and protected history are asserted by literals, not authenticated

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `d236f868`
**Applied fix:** Added successor-rewrite checks for every publication and pair, independently enumerated the frozen protected branches, and enforced Plan-93 bytes, no-rewrite history, and required stop semantics.

### WR-01: The exported prospective renderer accepts fabricated closure evidence

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `1779fdab`
**Applied fix:** The exported evidence API now takes a repository and committed source identity, independently derives and checks custody, and returns the exact derived closure with the rendered contracts.

### WR-02: The custody mutation test does not mutate any custody input

**Files modified:** `scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `b4810382`
**Applied fix:** Replaced result-field edits with isolated real relative-path, executable-mode, working-byte, edit-and-restore history, native-source, and installed-package mutations; retained explicit authenticated-result tamper checks for Git, hardened arguments, and local object identity.

## Verification

- Physically separate equivalent-install control passed.
- Real custody-input mutation fixture passed.
- Future Plan-114 portable/local contract case passed after fixture correction `0b0d261c`.
- Exact reproduction-v17 and closed-mode cases passed.
- `tsc --noEmit --pretty false` passed.
- `--check-source-only` passed with zero live work and downstream authority denied.
- Source scan found no pair reread or `as any` cast.
- `git diff --check` passed for the three Plan 113 source/test files.
- No readiness, production, canonical supplement, or live selector was invoked.

---

_Fixed: 2026-08-29T23:48:17Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_

## Additive Re-review Fix — Iteration 2

**Fixed at:** 2026-08-30T00:09:16Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-113-REVIEW-FIX-REVIEW.md`
**Findings in scope:** 2
**Fixed:** 2
**Skipped:** 0
**Status:** all_fixed

### CR-01: Dangling symlinks bypass forbidden-destination absence checks

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `e0215b77`
**Applied fix:** Replaced every `existsSync` absence decision with a shared `lstat` no-follow classifier. Plan-114, all supplement versions, producer outputs, and downstream outputs now treat regular files, directories, dangling relative or absolute symlinks, and unsafe special entries as present. The final canonical-absence test also uses `lstat` instead of `/usr/bin/test -e`.

### WR-01: Linked review trusts the payload's local execution root

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts`
**Commit:** `ba1f8ddb`
**Applied fix:** The linked-review checker now requires the payload local root to equal the independently derived linked closure local root before checking all rendered bytes and roots. Canonical future custody retains a separate committed-attestation checker and independently derives its canonical local execution root for readiness custody.

### Iteration 2 Verification

- Real dangling relative and absolute symlinks were rejected across the complete forbidden-destination set; a directory at a file destination was also rejected before source admission.
- A second linked worktree with a physically separate equivalent installation produced the same portable reviewed root and a different local execution root; a fully re-rendered context-wrong trio/supplement was rejected.
- Focused tests passed, module parse/import passed under the repository's Node 24 toolchain, and `git diff --check` passed.
- No readiness, live, production, canonical supplement, producer output, or downstream effect was invoked or created.
