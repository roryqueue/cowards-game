---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-30T03:01:25Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-115-REVIEW-FIX-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 262 Plan 115 Code Review Fix Report

All three critical findings are fixed. Plan 115 remains source-only and review-gated: it created no canonical supplement or effect artifact, and only Plan 116 can establish later Plan-109 eligibility.

## Fixed Issues

### CR-01: The unreviewed Plan-115 adapter declares Plan 109 eligible

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts`
**Commit:** `6952db17`
**Applied fix:** Every source-only, written, and committed-check projection now reports `plan116ReviewEligible: true`, `plan109Eligible: false`, and `reviewRequired: true`. Plan 115 cannot expose pre-review Plan-109 authority.

### CR-02: Current executable-mode drift passes authoritative custody checks

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts`
**Commit:** `3b9db7fb`
**Applied fix:** Current custody requires a no-follow regular file with exact permission mode `0644` before open, after descriptor open, and after the read. The post-read check also revalidates device, inode, size, and full mode. Post-commit executable drift is rejected independently at the authoritative v2 payload, review, carrier, final-clean review, and supplement paths.

### CR-03: Parent-directory validation is vulnerable to a symlink-swap write escape

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts`, `scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c`
**Commit:** `c21f0ef8`
**Applied fix:** A dedicated native helper pins repository identity, walks every parent with `openat(O_DIRECTORY|O_NOFOLLOW)`, retains the authenticated artifacts directory descriptor, performs exclusive `openat` creation, sets exact `0644`, fsyncs the file, reopens the canonical parent to compare device/inode, and fsyncs the retained parent. On a parent swap or write failure it removes only its own inode through `unlinkat` on the retained descriptor.

## Verification

- Focused Vitest: 9/9 passed in 73.60 seconds.
- The deterministic real CLI race replaced `.planning/artifacts` with a symlink after native parent capture. The helper returned `V138_PLAN115_NATIVE_PARENT_CHANGED`; neither the external directory nor the retained original contained the supplement afterward.
- Post-commit `0755` drift at all five current authoritative review/supplement paths failed closed.
- Native C compilation passed `-std=c11 -Wall -Wextra -Werror`; TypeScript and `git diff --check` passed.
- Canonical supplement-v1/v2/v3, readiness, live, journal, terminal, reproduction, and downstream effect paths remain absent.

---

_Fixed: 2026-08-30T02:50:49Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_

## Additive Fix Re-review Closure — Iteration 2

### CR-01: Predictable shared-temporary binary cache permits arbitrary helper substitution

**Files modified:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts`, `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts`
**Commit:** `a13b5600`
**Applied fix:** Removed the predictable shared binary cache. Every write compiles in a fresh owner-only `0700` directory, validates directory owner/device/inode, validates the executable as an owner-matching single-link regular `0700` file, rechecks descriptor device/inode/size/mode/owner and SHA-256 immediately before execution, and removes only the same identity-checked private directory afterward. A real pre-seeded legacy cache executable was not invoked.

### CR-02: Plan 116 receives the obsolete pre-fix two-file custody closure

**Files modified:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-115-SUMMARY.md`, `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-PLAN.md`, `.planning/STATE.md`
**Commit:** recorded in the additive evidence commit following this report
**Applied fix:** Replaced the authoritative handoff with final commit `a13b5600e3baf31b5460066558bafd53a3bb5581`, tree `a555fc01a83da07c1ea3c6b79463dad3269aada1`, parent `89ba082b1e583c55f4a02a30f36925642e6b826a`, and exact `100644` blobs `300832848dacb12d395c4a573182c60b00c71374` (adapter), `a2275640b28322f20f1e10f4d93449c30fafe782` (test), and `a733b6ce9239d02e522a78ad83930037e644a4d0` (native helper). The older two-file and first corrected closures are explicitly superseded history.

## Iteration 2 Verification

- The real cache-poison test passed and confirmed the poison marker remained absent and the private compiler directory was cleaned.
- Plan-116 planning now explicitly requires all three exact modes/blobs plus native cache-poison and parent-swap observations.
- TypeScript and `git diff --check` passed; canonical supplement and all live/effect paths remain absent.

---

_Fixed: 2026-08-30T03:01:25Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_
