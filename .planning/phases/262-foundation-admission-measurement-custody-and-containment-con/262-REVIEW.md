---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T23:55:00Z
depth: deep
files_reviewed: 31
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
  - scripts/check-v1-38-phase-262-review-fix-correction-v2.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v2.test.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v3.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v3.test.ts
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
  - scripts/check-v1-38-phase-262-review-fix-correction-v1.ts
  - scripts/check-v1-38-phase-262-review-fix-correction-v1.test.ts
findings:
  critical: 6
  warning: 0
  info: 0
  total: 6
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T23:55:00Z
**Depth:** deep
**Files Reviewed:** 31
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The iteration-3 implementation preserves the clean empirical non-pass: current tests pass 222/222, immutable correction-v2 tests pass 17/17, TypeScript passes, correction-v1 and correction-v3 checkers pass, Plan 262-88 remains `non_pass` with no activation, and Plan 262-89 remains `gaps_found` without completion mutation. Exact-target reversed pair races now share a lock, lifecycle temporary names include the full normalized intent, existing lifecycle intent/stage/backup/status bytes are authenticated, and static intermediate/final internal-directory symlinks are rejected before external writes.

Six correctness defects remain. The composed controller is still bypassable through exported write functions. Whole-pair lock keys do not serialize overlapping pairs and can leave the losing transaction partially published. Disjoint pairs reuse stage names and interfere. Crash-stale directory locks make the advertised durable/restartable operations unrecoverable. Internal path identities are checked and then reused only as strings, leaving a replacement gap before writes. Finally, correction-v3 obtains its supposedly immutable manifests from unauthenticated mutable checker modules and validates correction-v2 lineage paths but not the prior digest values. These defects keep the correction non-authorizing.

## Critical Issues

### CR-01: Exported mutation functions still bypass the composed controller

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts:13-14,43-49`; `scripts/lib/v1-38-durable-pair-successor-v2.ts:114-128`; `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:193-207`; `scripts/lib/v1-38-durable-pair-successor-v2.test.ts:15-18`; `scripts/lib/v1-38-restartable-lifecycle-successor-v2.test.ts:20-22`

**Issue:** Direct execution of the pair and lifecycle files now rejects every argument, and the controller CLI exposes only `--source-check` and `--synthetic-check`. That closes the old direct-file argument modes, but not the module surface. Both write functions remain public exports and the tests themselves invoke those exports with `node --eval import(...).then(...)`, supplying an arbitrary trusted root. A caller therefore does not need the controller, its temporary-root creation, or its two permitted CLI modes to reach pair or lifecycle writes. The controller is not the sole mutation owner and the claimed contained protocol can still be bypassed.

**Fix:** Move pair and lifecycle mutation into a controller-owned module closure and export only the two non-live controller commands. If separate modules are necessary, require a capability created inside the controller and unavailable from any exported symbol; tests must drive mutations through the controller rather than dynamically importing the constituents. Add an export/argument-surface inventory test proving no importable or directly executable route can write outside the controller-created temporary root.

### CR-02: Overlapping pair transactions take different locks and leave a partial losing pair

**File:** `scripts/lib/v1-38-durable-pair-successor-v2.ts:31-36,94-108,120-125`

**Issue:** The lock is one hash of the complete sorted two-target set. Transactions for `{shared, left}` and `{shared, right}` therefore use different locks even though they mutate `shared`. Because members publish in sorted order, one transaction can link its unique member before discovering that the shared member contains the winner's bytes. In an independent 50-iteration race, all 50 runs ended with one process failing while both unique members existed and the shared member contained only the winner's bytes: the failed transaction was partially published. The exact-two-target reversed-order test cannot detect this overlap case.

**Fix:** Acquire one lock per normalized canonical target in deterministic sorted order, or use a single common publication lock, and hold every acquired lock from precondition inspection through both postconditions and cleanup. Add `{shared,left}` versus `{right,shared}` process races with opposing sort orders and assert the losing transaction leaves neither of its members behind.

### CR-03: Disjoint pair transactions collide in the shared stage namespace

**File:** `scripts/lib/v1-38-durable-pair-successor-v2.ts:94-109`

**Issue:** Stage names contain only caller-selected `transactionId`, member index, and content digest. Two disjoint target pairs with the same transaction id and bytes take different target-set locks but address the same stage files. Either transaction may unlink a shared stage before the other links it, causing an unrelated transaction failure. An independent 30-iteration race observed 5 failures. This is especially material under a single-use, no-retry envelope.

**Fix:** Derive a stage namespace from the full normalized pair intent: trusted root, intent path, transaction id, both normalized targets, and both digests. Authenticate that namespace in the durable intent and add simultaneous same-id/same-bytes disjoint-pair tests that require both transactions to complete on every run.

### CR-04: A process exit leaves locks that permanently block crash recovery

**Files:** `scripts/lib/v1-38-secure-workspace-path-v2.ts:78-112`; `scripts/lib/v1-38-durable-pair-successor-v2.ts:123-127`; `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:202-207`

**Issue:** The exclusive lock is a directory removed only by the current process's `finally` block. A forced exit or power loss leaves the directory in place; later invocations merely wait ten seconds and throw `V138_SECURE_LOCK_TIMEOUT`. A direct stale-lock reproduction reached that timeout after 10,007 ms. Thus the durable pair cannot resume its intent and the restartable lifecycle cannot inspect or finish its staged state after the exact failure class those protocols are meant to survive. The source comment calling this a kernel lock is inaccurate; the directory is not released by the kernel when its owner exits.

**Fix:** Use an advisory lock whose ownership is released on process exit, or add a durable owner identity and a safe stale-owner reclamation protocol that survives PID reuse and reboot. Add forced-exit tests after intent, each member/step boundary, and status publication, then require a fresh process to recover without manual lock deletion.

### CR-05: Internal directory authentication is not held through subsequent writes

**Files:** `scripts/lib/v1-38-secure-workspace-path-v2.ts:44-75,78-111`; `scripts/lib/v1-38-durable-pair-successor-v2.ts:77,94-109`; `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:95,102-105,154-190`

**Issue:** Static hostile intermediate/final entries now fail before mutation, but `ensureV138TrustedDirectories` returns ordinary absolute path strings after `lstat`. Pair and lifecycle code later opens, links, unlinks, and removes through those strings without retaining a descriptor or rechecking directory device/inode identity. Another process can replace an authenticated internal directory between the check and use, redirecting the subsequent stage or lock operation. Lock cleanup has the same gap between the final `lstat` and `rmdir`. The implementation therefore does not provide the descriptor-held containment described by the remediation.

**Fix:** Open and retain descriptors for the trusted root and each internal directory, verify their identities, and perform mutations relative to those held descriptors through a small helper that provides descriptor-relative operations. If the runtime cannot do that directly, isolate all mutations in a helper that can. Add synchronized directory-replacement tests at the post-check/pre-write boundary and require external directories to remain empty.

### CR-06: Correction-v3 trusts mutable checker exports for its immutable manifests

**Files:** `scripts/check-v1-38-phase-262-review-fix-correction-v3.ts:3-10,28,38-40,63-73`; `scripts/check-v1-38-phase-262-review-fix-correction-v1.ts:29-57`; `scripts/check-v1-38-phase-262-review-fix-correction-v2.ts:33-61`

**Issue:** Correction-v3 does authenticate every entry currently returned by its imported arrays, but the arrays originate in the correction-v1 and correction-v2 checker source files. Those checker files are not themselves in any authenticated v3 manifest, and their nested arrays/objects are only shallow-frozen. Changing or mutating an imported list can omit a protected/remediation/forbidden entry or change a prior successor digest before v3 derives its expected result. The lineage join at lines 72-73 compares only ordered paths, not the `sha256` values recorded in correction-v2. Consequently v3 does not independently fix the immutable entry set and prior digest lineage it claims to reauthenticate.

**Fix:** Define the complete v1 protected/remediation manifest, v2 successor manifest, and forbidden manifest as literal deeply immutable data inside correction-v3 (or authenticate the exact v1/v2 checker source blobs before importing them). Compare every correction-v2 artifact entry's path and digest to the fixed prior manifest, not only its paths. Add tests that alter each imported manifest source, mutate nested entries before derivation, and change a correction-v2 prior digest while preserving paths; all must fail.

## Verification Performed

- Current serialized suite: **14/14 files passed, 222/222 tests passed**.
- Immutable correction-v2 publication checkout `8ae8cba0`: **17/17 tests passed** and canonical checker passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Correction-v1 and correction-v3 canonical checkers: passed.
- Plan 262-88 canonical artifacts: `non_pass`, `exhausted`, clean assurance, no correction or activation.
- Plan 262-89 final projection: `gaps_found`, `completionMutated: false`.
- Process argument inventory: controller permits only `--source-check` and `--synthetic-check`; pair/lifecycle direct-file entry rejects all modes; correction-v1/v2/v3 permit only `--derive` and `--check`. Dynamic module imports remain the mutation bypass described in CR-01.
- Independent adverse checks: overlapping pairs produced a partial loser in **50/50** races; disjoint same-id/same-bytes pairs failed in **5/30** races; a pre-existing lock produced `V138_SECURE_LOCK_TIMEOUT` after **10,007 ms**.
- Runtime immutability check: all manifest containers reported frozen, while their protected, successor, and forbidden entry objects reported unfrozen.

---

_Reviewed: 2026-08-27T23:55:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
