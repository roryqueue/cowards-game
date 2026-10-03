---
phase: 265-serious-current-rules-league-and-development-red-team
scope: Plan 265-15 Task C retained-disk source repair only
source_anchor: a5baa65051e0eaa05c0dc0ef9c2bfdfed9725d28
source_root: sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695
verified: 2026-10-03
disposition: source-repair-verified
empirical_admission: not-established
---

# Plan 265-15 Task C retained-disk source verification

Scope is prospective disk-accounting implementation at the fixed source anchor, not the full phase or an empirical route. Prior Tasks A/B and the retained-ledger repair are carried forward from their scoped verifications. I did not run tests, scans, historical readers, preparation, allocation, provider, Match, or retained verification, and did not inspect private Strategy/source/memory data.

## Observable source truths

| Truth | Status | Evidence |
| --- | --- | --- |
| The new basis records the old disk peak as unknown and counts the measured surviving predecessor files rather than inventing a historical bound. | VERIFIED | `lean-experiment.ts` defines `lean-prospective-surviving-disk-v1` with `historicalPeakDiskBytes: "unknown"`; its six fixed survivor identities and byte digests are checked, allocated blocks are measured, duplicate inodes and drift are rejected, and the old four-file store total must remain 12,288 allocated bytes. The check is deliberately bounded to those six files; there is no retrospective shared-cache scan. |
| Disk approval is separately byte-bound from the existing crash/time approval. | VERIFIED | `LEAN_DISK_APPROVAL` binds the approved `265-15-HISTORICAL-DISK-ACCOUNTING-DECISION-v1.md` identity and exact byte root. Basis construction hashes supplied approval bytes against that root. The pre-existing `LEAN_FAILED_PREFIX.approvedDecisionIdentity/BytesRoot` still names the separate `265-15-CRASH-ACCOUNTING-DECISION-v1.md`; the basis cannot substitute time approval for disk approval. `RETAINED-DISK-PLAN-CHECK-v2.md` confirms the former plan-check blocker was specifically resolved by this distinct binding. |
| Failed v1 history is preserved; new cumulative accounting does not reset time or Match charges or mutate the predecessor. | VERIFIED (source structure) | Fixed predecessor byte roots, identities, open-v1 interval, 565,459-ms time upper bound, zero old Match charges, and old allocation/store paths remain constants. The new schema is `lean-experiment-allocation-v2` at disjoint paths. V2 carries measured survivors forward; existing v1 admission/time behavior is not rewritten. No historical file was opened or changed in this verification. |
| Retained and future experiment writes are included under the unchanged numeric limits, with creation/publication preflight. | VERIFIED (source-only) | The 15,000,000,000-byte total, 12,000,000,000 retained, 2,000,000,000 scratch, 1,000,000,000 terminal, 28,800,000-ms time and 300-Match caps remain fixed. `LEAN_PROSPECTIVE_WRITABLE_PATHS` enumerates the owned temp directory, v2 allocation and prospective request; store blocks are measured separately. `createLeanLedger` performs capacity checks before store `mkdir`, rechecks the measured predecessor and path blocks, and precharges each exclusive store write. Publication/resource checkpoints continue to account store, owned paths and predecessor. The review traced request/allocation preparation and parent/child entry, terminal, result and evidence writes. |
| The approved policy itself establishes historical peak or live capacity/admission. | NOT ESTABLISHED (explicitly not claimed) | The amendment authorizes prospective accounting with the historical peak disclosed as unknown. A 12,288-byte surviving store is a current observed floor, not a historical high-water mark. Source logic and synthetic tests do not establish actual filesystem capacity, measured old peak, pilot admission, or Match result. |

## Review and test evidence

Independent [retained-disk review v2](265-15-RETAINED-DISK-REVIEW-v2.md) is clean at commit `a5baa65051e0eaa05c0dc0ef9c2bfdfed9725d28`, records source root `sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695`, and reports zero findings across the accounting module, tests, runner, and launcher. It specifically reviewed the pre-`mkdir` near-cap refusal and future-write paths. The author reports 28 focused tests, types, and shell checks passed; these were not rerun here. No broad suite or private historical reader result is inferred.

## Boundaries and disposition

The existing historic-numeric-bound validator remains fail-closed; the new route is a separately approved prospective basis, not a backfilled historical bound. Gameplay rules, runtime semantics, privacy policy, and public/counted/production authority are unchanged. The approval does not authorize preparation or live work before root-owned source/HEAD and same-process capacity gates.

**Disposition:** Task C source repair verified only. The disk policy is human-approved and implemented, but actual empirical admission, measured peak memory, pilot/LEAG/freeze credit, and whole-Phase-265 completion remain unestablished.
