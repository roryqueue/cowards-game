# Retained-disk amendment plan check

Status: **ISSUES FOUND — 1 blocker**

Scope checked: `265-15-RETAINED-DISK-AMENDMENT-v1.md`, approved `265-15-HISTORICAL-DISK-ACCOUNTING-DECISION-v1.md`, `265-15-IMPORT-CRASH-REPAIR-PLAN-v1.md`, and the relevant accounting/admission paths in `packages/strategy-lab/src/league/lean-experiment.ts` and `scripts/run-v1-38-lean-experiment.ts`.

## Finding

**[BLOCKER] Task C does not identify which approved decision bytes the new prospective basis must bind.** The current source's `LEAN_FAILED_PREFIX.approvedDecisionIdentity` and `approvedDecisionBytesRoot` bind `265-15-CRASH-ACCOUNTING-DECISION-v1.md`. Task C says to bind “the approved decision bytes,” while the supplement lists both approvals. An implementation could therefore reuse the existing crash-time approval binding without binding the separately approved historical-disk choice that authorizes unknown historical peak usage. In that case the new basis would not be demonstrably gated by the approval it implements.

**Narrow fix:** In Task C, name `265-15-HISTORICAL-DISK-ACCOUNTING-DECISION-v1.md` as a required, separately identified and byte-root-bound approval input to the prospective schema/allocation, distinct from the pre-existing crash-accounting decision binding. The focused tests should reject omission, substitution with only the crash decision, and altered disk-decision bytes. Keep the old v1/v2 historic-bound verifier fail-closed.

## Verified coverage

- The approved choice is accurately represented as historical disk peak `unknown`, without claiming the observed 12,288-byte surviving store is a historical peak.
- The amendment requires rechecking and carrying surviving allocated blocks, preserving exact predecessor identities, rejecting byte/block drift and double counting, and treating unattributable historical cache use as unknown rather than zero.
- The amendment preserves the 565,459 ms prospective time carry, zero prior Match charges, 28,800,000 ms / 300-Match caps, 15,000,000,000-byte total, and existing 12/2/1 GB partitions. It calls for retained, temporary, allocation, terminal/result and other future writes to be included, while keeping same-process free-capacity checks distinct from the disk budget.
- The source confirms the old v2 path currently calls `inspectLeanFailedPrefix()` and is blocked by `HISTORICAL_CORE_CACHE_BOUNDS_ESTABLISHED = false`; Task C's distinct prospective schema/basis can avoid relaxing that legacy gate. The current v2 also carries 12,288 bytes and enforces publication/resource ceilings, but its existing approval root is the crash-accounting decision noted above.
- No new numbered plan is needed. The supplement preserves the open legacy v1 interval, all old bytes, prospective-only accounting, and the runtime/privacy/freeze-before-formation restrictions.

No source files, STATE, or execution artifacts were changed. No private historical reader, prepare/run/provider/Match command, tests, or heavy scan was run.
