---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T23:17:58Z
depth: deep
files_reviewed: 29
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
  critical: 5
  warning: 0
  info: 0
  total: 5
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T23:17:58Z
**Depth:** deep
**Files Reviewed:** 29
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

The iteration-2 repair remains non-authorizing and preserves the observed exhausted `0/540` outcome. The serialized historical and successor suite passes 200/200 tests, TypeScript typechecking passes, both correction checkers pass, the Plan-262-88 canonical disposition remains a clean empirical non-pass, the Plan-262-89 final projection remains `gaps_found`, and all 24 entries listed by the correction-v1 checker currently match their recorded hashes.

Those checks do not close the five findings below. The source-only controller is still a disconnected export table while its constituent command surfaces expose write-capable synthetic and worker modes. Pair transactions can derive different mutexes for the same canonical targets. Lifecycle temporary names collide across different target-set mutexes and can install an unauthenticated status stage. Containment checks can reject a path only after lifecycle temporary files have already been written through it. Finally, correction-v2 authenticates the correction-v1 JSON as a blob but does not re-authenticate the 18 protected entries that JSON claims. These are correctness failures in the claimed closure and must keep the correction non-authorizing.

## Critical Issues

### CR-01: The source-only controller is disconnected while constituent command surfaces remain write-capable

**Files:** `scripts/lib/v1-38-bounded-retry-successor-controller-v2.ts:30-36,38-54,57-72`; `scripts/lib/v1-38-durable-pair-successor-v2.ts:104-125`; `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:131-151`

**Issue:** The claimed composed route is only an object that re-exports five independent functions. Its command path never invokes or coordinates them; `--source-check` searches its own source text and `--synthetic-check` prints a declaration. Meanwhile the constituent pair and lifecycle modules accept `--synthetic-pair`, `--pair-worker`, `--synthetic-lifecycle`, and `--lifecycle-worker` payloads that reach filesystem mutation. The worker modes are callable directly and carry no proof that the advertised outer mutex is held. Consequently the reviewed source-only command is not an end-to-end controller, and the package still contains hidden write paths outside that surface.

**Fix:** Make one controller own the complete source-only protocol and move mutation workers behind an unforgeable parent/child handoff. Remove public synthetic/worker command modes or require a capability that an arbitrary direct invocation cannot construct. Add an end-to-end test that enumerates every executable command surface and proves the source-only command cannot reach a write while the reviewed controller is the sole caller of all successor operations.

### CR-02: Canonical pair transactions can select different mutexes for the same targets

**File:** `scripts/lib/v1-38-durable-pair-successor-v2.ts:104-116`

**Issue:** The mutex key hashes `input.intentPath` together with the sorted target list. Two transactions for the same canonical pair but different caller-selected intent paths therefore take different locks. The worker checks and publishes the two targets independently at lines 77-97, so those transactions can both pass the initial checks and interleave into a mixed pair. The existing reversed-order test uses one shared `pair.intent` and therefore does not exercise the divergent-mutex case.

**Fix:** Derive the common mutex solely from canonical trusted-root-relative target identities, after validating and normalizing them. Treat intent identity as data authenticated under that mutex, not as part of mutex selection. Reject intent/member aliasing, and add synchronized reversed-order tests with different intent paths and transaction ids that prove exactly one complete pair and no mixed members.

### CR-03: Lifecycle temporary names cross target-set mutexes and can install a premature status marker

**File:** `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:65-80,88-128,137-143`

**Issue:** The lifecycle mutex is derived from step and lifecycle targets, but stage, backup, and status names are derived only from caller-selected `transactionId` plus step index. Two transactions with different target sets therefore take different locks while sharing `.v138-lifecycle-staging/{transactionId}-0.after`, `.before`, and `.status`. An absent target is accepted as an interrupted step whenever that shared backup has the expected digest (lines 89-90), even if the backup belongs to another transaction. The existing status stage is never authenticated before line 123 links it as the new canonical lifecycle marker. A sequential two-transaction check produced the second transaction's target with its requested after-bytes and its lifecycle target with the first transaction's status bytes before failing the postcondition.

**Fix:** Namespace every temporary file by a digest of the full normalized intent, including trusted root, all targets, before/after digests, lifecycle target/bytes, and transaction id. Authenticate every existing stage, backup, and status stage before use. Do not infer interruption from a backup digest alone; bind it to the exact target inode and durable intent. Add same-transaction-id tests across disjoint and overlapping target sets, including restart after each publication boundary.

### CR-04: Lifecycle containment rejection can occur after writes escape through the staging path

**Files:** `scripts/lib/v1-38-restartable-lifecycle-successor-v2.ts:62-73,82-117`; `scripts/lib/v1-38-secure-workspace-path-v2.ts:24-63`

**Issue:** Canonical inputs use the no-follow resolver, but `.v138-lifecycle-staging` is created and used with ordinary path operations without first passing through that resolver. With that staging entry pointing outside the trusted root, the lifecycle function wrote both `escape-0.after` and `escape-0.before` outside the root. It then rejected the path only when `readV138RegularNoFollow` later encountered the staging symlink, leaving the external writes behind. The pair/lifecycle lock directories are likewise created without no-follow component authentication. Rejecting after mutation does not satisfy trusted-root containment.

**Fix:** Pre-create and authenticate all internal directories beneath a descriptor-held trusted root before any write. Resolve internal lock/stage/backup/status entries through the same relative-only no-follow policy, use descriptor-relative operations where available, and fail before staging if any component is not the expected directory identity. Add checks that assert the external directory remains byte-for-byte empty after intermediate and final path rejection.

### CR-05: Correction-v2 does not re-authenticate correction-v1's 18 protected entries

**Files:** `scripts/check-v1-38-phase-262-review-fix-correction-v2.ts:63-85`; `scripts/check-v1-38-phase-262-review-fix-correction-v1.ts:29-48,59-82`

**Issue:** Correction-v2 authenticates the correction-v1 JSON file and the Plan-262-88 disposition as two fixed blobs, then authenticates only the ten new successor source/test entries. It never parses and rechecks the 18 `protectedFiles` entries carried by correction-v1 and never invokes the correction-v1 checker. A disposable derivation succeeded with `scripts/lib/v1-38-bounded-retry-envelope-v2.ts` and every other original protected entry absent. Thus the new correction can report an integrity result after the baseline it claims to preserve has disappeared or changed.

**Fix:** Import the immutable protected manifest into correction-v2 and authenticate every entry with the v2 no-follow reader, including the historical artifacts and review. Alternatively invoke a refactored pure correction-v1 derivation through the no-follow interface and bind its recomputed root. Add one mutation/absence case per protected-entry class and require correction-v2 derivation to fail before emitting any authority statement.

## Verification Performed

- Serialized historical and successor suite: **14/14 files passed, 200/200 tests passed**.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Correction-v1 and correction-v2 canonical checkers: passed.
- Plan-262-88 canonical artifact check: `non_pass`, exhausted, assurance clean, no activation.
- Plan-262-89 final check: `gaps_found`, no completion mutation.
- Current correction-v1 protected/remediation bytes: **24/24 matched** their recorded hashes.
- Independent checks demonstrated the disconnected write-capable command surfaces, lifecycle cross-transaction temporary collision, write-before-containment-rejection behavior, and correction-v2 derivation without the original protected entries.

---

_Reviewed: 2026-08-27T23:17:58Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
