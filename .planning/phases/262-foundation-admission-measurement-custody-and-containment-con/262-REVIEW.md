---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T22:42:53Z
depth: deep
files_reviewed: 19
files_reviewed_list:
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
  - .planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW-FIX.md
findings:
  critical: 6
  warning: 0
  info: 0
  total: 6
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T22:42:53Z
**Depth:** deep
**Files Reviewed:** 19
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The additive remediation preserves the committed empirical truth: the envelope remains exhausted at fresh `0/540`, reproduction-v16 is absent in the current checkout, and no downstream authority exists. All 18 protected v2 files currently match their recorded SHA-256 values. The serialized focused and historical suite passes 150/150 tests, TypeScript typechecking passes, and the correction checker passes.

Those green checks do not close the review. The five historical defects were implemented as disconnected library primitives, not as a composed successor execution path. The new integrity journal can be forged into a reproduction-exact disposition, pair and lifecycle publication retain race windows, path/symlink containment is incomplete, and the correction checker does not authenticate important negative facts or its mutable review reference. The correction therefore must remain non-authorizing.

## Critical Issues

### CR-01: The claimed fixes are not reachable from any successor execution path

**Files:** `scripts/lib/v1-38-bounded-retry-integrity-successor-v1.ts:156-320`; `scripts/lib/v1-38-durable-publication-successor-v1.ts:158-289`; `scripts/lib/v1-38-restartable-lifecycle-successor-v1.ts:91-209`; `scripts/check-v1-38-phase-262-review-fix-correction-v1.ts:126-140`

**Issue:** Repository-wide call-chain analysis finds no non-test consumer for `recoverV138AdmittedObservationWithoutRoute`, `completeV138SuccessorEffect`, `durablyPublishV138Pair`, or `applyV138RestartableLifecycleTransaction`. The only non-test call to `publishV138NoReplaceUnderLockf` is inside the equally uncalled lifecycle primitive. The immutable v2 controller and checkers still execute their original defective paths. Nevertheless the correction declares all five findings implemented. This proves isolated helpers, not closure of CR-01 through CR-05 in an executable, reviewed source route.

**Fix:** Add a single successor controller/checker route that composes these primitives at every original call site, binds its exact source and tests into a fresh non-authorizing review contract, and proves crash/restart behavior end to end. Keep the current v2 bytes immutable and keep all authority false until that composed route receives an independent zero-finding review.

### CR-02: Hash-valid successor records can forge a reproduction-exact terminal

**File:** `scripts/lib/v1-38-bounded-retry-integrity-successor-v1.ts:101-117,126-203`

**Issue:** `authenticateSuccessorRecords` validates only ordinal/hash linkage. It does not enforce one start, one matching finish, one derived decision, matching effect kind/identity/owner, legal status per effect kind, or decision equality with `decisionFor`. `recoverV138SuccessorEffectDecision` then accepts the first supplied decision without recomputing it. A hash-valid journal containing a calibration start/finish followed by a mismatched `reproduction_exact_terminal` was accepted as `disposition: reproduction_exact` with `acceptedCells: 0`. Separately, the public completion API accepts a reproduction result with status `admitted`, 540 cells, and cleanup true as `effect_recorded`, showing that effect-kind status constraints are absent.

**Fix:** Replace generic event unions with effect-specific schemas and replay a strict state machine. Require exact identity/owner/kind continuity, exactly one start and finish, legal status/cell combinations, no record after a terminal, and a decision byte-for-byte equal to the decision derived from the authenticated finish and frozen deadline. Downstream success must additionally require reproduction kind, `passed_exact`, exact 540, and cleanup true.

### CR-03: Two pair transactions can publish a mixed canonical pair

**File:** `scripts/lib/v1-38-durable-publication-successor-v1.ts:187-289`

**Issue:** Pair publication has no kernel lock or common commit primitive. Both targets are checked before staging, then linked independently. Two conflicting transactions with reversed member order can both pass the initial absence checks; one links target A while the other links target B, after which both fail authentication and leave a mixed pair that belongs to neither intent. Per-member no-replace prevents overwrite but does not make the pair atomic or recoverable to one authoritative intent.

**Fix:** Hold one deterministic kernel lock covering the sorted canonical target set and intent from precheck through both publications and parent fsyncs. Bind target ordering and transaction identity to the lock, reject every conflicting intent before publishing either member, and add a synchronized reversed-order two-process race test that proves either one complete pair or no new canonical member.

### CR-04: Lifecycle step replacement remains race-prone and can run after a premature commit marker

**File:** `scripts/lib/v1-38-restartable-lifecycle-successor-v1.ts:151-204`

**Issue:** The supplied `lockPath` protects only final lifecycle-status publication. Mutable steps are rechecked and then installed with `renameSync`, which replaces an existing pathname. A cooperating second invocation or non-cooperating writer can change a target after line 178 and before line 181 and have its bytes silently overwritten. In addition, an already present exact lifecycle status is accepted even when steps remain in their before state; the function then mutates them while the canonical commit marker already claims completion. These states violate the transaction's advertised commit-point semantics.

**Fix:** Acquire the lifecycle kernel lock before intent/state validation and hold it through every step, status publication, and parent fsync. Use a compare-and-swap/no-clobber protocol appropriate for existing mutable targets, and reject an existing lifecycle status unless every postcondition already holds. Add synchronized races at each step and a fixture with exact status plus incomplete steps.

### CR-05: Publication and integrity checks do not enforce workspace or symlink containment

**Files:** `scripts/lib/v1-38-durable-publication-successor-v1.ts:39-55,112-126,187-210`; `scripts/lib/v1-38-restartable-lifecycle-successor-v1.ts:107-120`; `scripts/check-v1-38-phase-262-review-fix-correction-v1.ts:59-69`

**Issue:** Publication APIs accept arbitrary absolute-resolved paths and do not bind them to a canonical workspace/artifact root. `assertSafeParent` checks only the immediate parent; an intermediate directory symlink is followed. Lifecycle mutation performs no parent-chain safety check at all. The correction checker uses `existsSync`/`readFileSync`, so a protected regular file replaced by a symlink to identical external bytes authenticates successfully. This was reproduced: all 18 protected entries passed and `status: integrity_non_pass` was derived with the first protected source represented by a symlink.

**Fix:** Require an explicit trusted root, resolve it with `realpath`, reject absolute/escaping inputs, walk every path component with no-follow semantics, and verify the final entry is a regular file with the expected device/inode policy. Open and hash through no-follow descriptors rather than path-based TOCTOU pairs. Add intermediate-directory and final-file symlink tests for every publisher, lifecycle step, and protected-file authenticator.

### CR-06: The correction checker asserts negative evidence and review identity without authenticating them

**File:** `scripts/check-v1-38-phase-262-review-fix-correction-v1.ts:59-69,111-176`

**Issue:** `reproductionV16Present: false` and every authority denial are emitted as constants after authenticating a fixed positive-file list. The checker never proves that reproduction-v16, retry/activation, candidate, or Phase-263 authority destinations are absent. A fixture containing a rogue `.planning/artifacts/v1.38-current-matrix-reproduction-v16.json` with 540 accepted cells still passed `checkV138Phase262ReviewFixCorrection`. The artifact also claims an exact SHA for mutable `262-REVIEW.md`, but `authenticateFiles` never reads that path; replacing the required aggregate review leaves the correction checker green while its stated path/SHA is false.

**Fix:** Define and authenticate a complete forbidden-destination manifest with no-follow absence checks, or derive every denial from an independently replayed authoritative journal/disposition plus explicit absence proofs. Bind the triggering review to an immutable artifact or commit-qualified blob and authenticate it; represent the mutable aggregate re-review separately. Add tests for each forbidden destination and for review replacement/mutation.

## Verification Performed

- Serialized focused and historical suites: **8/8 files passed, 150/150 tests passed**.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Correction checker: passed against the current checkout.
- Protected-byte manifest: all **18/18** recorded v2 files currently match.
- Independent semantic-journal reproduction: a hash-valid calibration journal plus mismatched exact-reproduction decision returned `reproduction_exact` with zero accepted cells.
- Independent symlink reproduction: an exact-byte protected-file symlink passed correction derivation.
- Independent forbidden-destination reproduction: a rogue reproduction-v16 artifact remained undetected by the correction checker.
- Repository call graph: the successor remediation exports have no composed non-test caller.

---

_Reviewed: 2026-08-27T22:42:53Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
