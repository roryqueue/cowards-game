---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-28T00:35:09Z
depth: deep
files_reviewed: 34
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts
  - scripts/lib/v1-38-bounded-retry-successor-controller-v2.test.ts
  - scripts/lib/v1-38-successor-effect-state-machine-v2.ts
  - scripts/lib/v1-38-successor-effect-state-machine-v2.test.ts
  - scripts/lib/v1-38-durable-pair-successor-v2.ts
  - scripts/lib/v1-38-durable-pair-successor-v2.test.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts
  - scripts/lib/v1-38-secure-workspace-path-v2.ts
  - scripts/lib/v1-38-secure-workspace-path-v2.test.ts
  - scripts/native/v1-38-successor-transaction-helper-v2.c
  - scripts/check-v1-38-phase-262-review-fix-correction-v1.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v1.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v2.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v2.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v3.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v3.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v4.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v4.test.ts
  - scripts/lib/v1-38-bounded-retry-envelope-v2.ts
  - scripts/run-v1-38-bounded-retry-envelope-v2.ts
  - scripts/run-v1-38-bounded-retry-envelope-v2.test.ts
  - scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts
  - scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.test.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
  - scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.ts
  - scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts
  - scripts/lib/v1-38-bounded-retry-integrity-successor-v1.ts
  - scripts/lib/v1-38-bounded-retry-integrity-successor-v1.test.ts
  - scripts/lib/v1-38-durable-publication-successor-v1.ts
  - scripts/lib/v1-38-durable-publication-successor-v1.test.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v1.ts
  - scripts/lib/v1-38-restartable-lifecycle-successor-v1.test.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-28T00:35:09Z
**Depth:** deep
**Files Reviewed:** 34
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Iteration 4 correctly moves pair publication onto a sorted per-target kernel-lock graph, derives pair and lifecycle staging names from full normalized intent, retains authenticated target directory descriptors through native mutation, and recovers at the ten injected post-fsync process-exit boundaries. The focused current suite passes, immutable correction-v2/v3 publication checkouts pass, and clang/TypeScript checks pass.

The implementation is not clean. The native helper is itself a direct mutation interface outside the controller. Its deterministic writes are not recoverable from a crash or I/O failure during a write. Successful lifecycle transactions retain the complete before-image and all stages indefinitely. Correction-v4 neither authenticates the protected evidence it projects nor survives the independent rereview it declares replaceable. Finally, correction evidence reads still use a pathname check/use sequence and do not receive the descriptor-held containment added to native writes.

## Critical Issues

### CR-01: The native helper is a directly executable mutation bypass

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts:30-43,59-75`; `scripts/native/v1-38-successor-transaction-helper-v2.c:201-247,260-365`

**Issue:** Removing TypeScript mutation exports does not make the controller the sole mutation owner. The controller installs the helper at a predictable persistent path derived only from the public source hash, does not authenticate an existing executable, and the helper accepts caller-supplied root device/inode, intent bytes, namespace, targets, and payloads without a controller capability or a cryptographic join between those fields. Directly executing the cached helper against an arbitrary temporary root returned status 0 and published both caller-selected members. The direct helper also bypasses the controller's normalized lock graph and accepts namespace values that are not validated as fixed-width hex before use as descriptor-relative stage names.

**Fix:** Do not expose a reusable unauthenticated helper executable. Build into a private controller-owned directory, authenticate the compiled bytes and ownership/mode, pass an unforgeable per-invocation capability over an inherited descriptor, and have the helper recompute and validate the complete intent and lock-set projection. Add a test that locates or invokes the helper directly and proves zero mutation for every input not launched through the controller capability.

### CR-02: A crash or I/O failure during `write_exclusive` creates an unrecoverable partial transaction file

**File:** `scripts/native/v1-38-successor-transaction-helper-v2.c:155-166,217-233,308-340`

**Issue:** Intent and stage names are opened directly with `O_CREAT|O_EXCL`, then written and fsynced in place. If the process exits during the write loop, or a write/fsync fails, the deterministic name remains present with partial bytes. Recovery treats any present non-exact intent or stage as a conflict and can never replace it. The forced-exit tests inject only after each write has completed and been fsynced, so they do not exercise the failure window that makes the advertised restartable operation permanently fail.

**Fix:** Write and fsync through a separate uncommitted descriptor/name, publish the deterministic intent/stage name only after the bytes are complete, and define safe cleanup for abandoned uncommitted files. Add kill/fault injection inside the write loop and immediately before fsync; a fresh process must recover without manual deletion and without accepting truncated bytes.

### CR-03: Correction-v4 projects protected evidence without authenticating it

**File:** `scripts/check-v1-38-phase-262-review-fix-correction-v4.ts:69-90,98-113`

**Issue:** Correction-v4 authenticates the three prior correction artifact files and validates roots of the manifest arrays embedded in them, but it never authenticates the files named by `v1Protected`, `v1Remediation`, `v2Successor`, or `v3Successor`. It then reads the Plan-262-88 disposition without an expected digest and checks only three fields. In an isolated fixture, changing `authority.phase263ExecutionAuthorized` from false to true was accepted and correction-v4 still emitted false authority. Thus the correction can attest an exhausted, non-authorizing history while the protected evidence it cites says execution is authorized.

**Fix:** Authenticate every fixed path-and-digest entry before deriving the correction, including the exact Plan-262-88 disposition, terminal, journal, review, and source lineage. Validate the complete disposition schema and every authority bit. Add one-field mutations for all protected artifacts and every denial; each must fail before a correction object is returned.

### CR-04: The required independent rereview necessarily invalidates correction-v4

**File:** `scripts/check-v1-38-phase-262-review-fix-correction-v4.ts:101-114,117-123`; `scripts/check-v1-38-phase-262-review-fix-correction-v4.test.ts:70-75`

**Issue:** The correction correctly pins the immutable triggering review at commit `ca6aaaa8`, but it also incorporates the current mutable aggregate `262-REVIEW.md` digest into `body` and therefore into `correctionRoot`. The artifact is required to be checked by recomputing that body. Replacing `262-REVIEW.md` with the independent rereview changes the expected correction and makes the committed correction-v4 fail its own checker, despite the field claiming `replaceableByIndependentRereview: true`. The test mutates the aggregate and derives a new object, but never checks the committed artifact, masking the contradiction.

**Fix:** Keep mutable aggregate observations outside the correction-rooted body, or bind only the immutable commit-qualified trigger plus a separately authenticated terminal rereview artifact after it exists. Add an end-to-end test that replaces the aggregate review and requires the already committed correction-v4 checker to remain valid without rewriting correction history.

### CR-05: Protected evidence reads retain an intermediate-directory replacement gap

**File:** `scripts/lib/v1-38-secure-workspace-path-v2.ts:34-76,78-92`

**Issue:** `resolveV138RelativeNoFollow` checks each parent with `lstatSync`, returns an absolute string, and `readV138RegularNoFollow` later opens that string with `O_NOFOLLOW` only on the final component. An intermediate directory can be renamed and replaced with a symlink after validation but before open, redirecting the read to external bytes. The native mutation helper now holds parent descriptors, but correction-v4 and all manifest authentication continue through this pathname-based reader, so protected evidence does not have equivalent containment.

**Fix:** Implement manifest reads by opening and retaining the trusted root and every parent directory descriptor with no-follow semantics, then open the final regular file relative to the held parent descriptor and verify its identity. Add a synchronized post-parent-open/pre-file-open directory-replacement test and require the checker to read only the authenticated directory inode.

## Warnings

### WR-01: Successful lifecycle transactions retain before-images and all recovery stages indefinitely

**File:** `scripts/native/v1-38-successor-transaction-helper-v2.c:317-347`

**Issue:** After status publication succeeds, lifecycle code closes descriptors without unlinking the intent, each `.before` backup, each `.after` stage, or the status stage. A direct successful one-step transaction left all three staging files plus the intent. This retains superseded source bytes, grows storage for every unique intent, and makes the cleanup claim and privacy boundary weaker than the pair implementation, which does remove its stages and intent.

**Fix:** After all canonical postconditions and directory fsyncs succeed, remove the intent, before-image backups, after stages, and status stage descriptor-relatively, fsync the affected directories, and verify the final staging namespace is empty. Add success and recovered-success cleanup assertions while preserving idempotent handling of an already published lifecycle status.

## Verification Performed

- Current successor/correction/lifecycle suite: 13/13 files and 210/210 tests passed in serialized execution.
- Correction-v1: 4/4 tests passed and canonical checker passed.
- Immutable correction-v2 checkout `8ae8cba0`: 17/17 tests and canonical checker passed.
- Immutable correction-v3 checkout `7b56ecdc`: 27/27 tests and canonical checker passed.
- Native helper compiled with `/usr/bin/clang -std=c11 -Wall -Wextra -Werror`.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Correction-v4 canonical checker passed before replacement of this aggregate review.
- Plan-262-89 final checker returned `gaps_found`, `completionMutated: false`.
- Direct adverse reproduction: the cached native helper published two arbitrary members without the controller.
- Direct adverse reproduction: a successful lifecycle left its intent plus `.before`, `.after`, and status stage files.
- Direct adverse reproduction: correction-v4 accepted a protected Plan-262-88 disposition with `phase263ExecutionAuthorized: true` and still emitted false authority.

---

_Reviewed: 2026-08-28T00:35:09Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
