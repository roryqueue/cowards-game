---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
reviewed: 2026-10-07T22:32:55Z
depth: deep
status: issues_found
source_commit: 65802b5c94b84057c3b69aad24239498e626a202
source_green_commit: 94164868
diff_base: 835d38f9
submitted_source_root: sha256:6d118d7d7833d5b2cb7d137074da547652c09444886621e1f5d0de8047bce7f7
submitted_source_entries: 910
independently_reviewed: true
author_agent: /root
reviewer_agent: /root/review_two_pair_v11
empirical_admission: false
files_reviewed: 9
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/run-v1-38-lean-correction.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
---

# Phase 265 Plan 16: Independent two-pair source review v1

## Narrative Findings (AI reviewer)

### Summary

The additive v11 source is not ready for data authoring or admission. Four BLOCKER findings affect the required no-refund accounting and authentic terminal custody. Review scope is the nine changed source/test files in `835d38f9..65802b5c`, with focused cross-file tracing of request, allocation, prepared-run, ledger resource, accepted-FINAL, terminal-only, carry and CLI consumers. Approval records, checked supplement, source summary and current STATE were read as contracts. No structural pre-pass was supplied.

This review performed no tests, provider work, Matches, live verification, old-reader invocation, private payload inspection, source modification or commit. Test results below are implementation-summary disclosures, not independently executed proof: final focused v11 tests reportedly 14 passing; expanded regression reportedly 211 passing with 10 older host-stage failures; isolated comparison reportedly the same four failures at old/current source; strict transitive check reportedly the same six inherited errors. No fully green expanded regression, RSS repair, empirical feasibility or Phase/LEAG completion is claimed.

## Critical Issues

### CR-01: BLOCKER — Historical survivor re-inventory refunds prior physical debits

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:543-544`

**Affected:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:795-800`; runner lines 528-531; prepared-run guard lines 910-919.

**Issue:** The initial v11 predecessor takes the pinned v10 baseline's 517 survivor identities, drops every missing path with `filter(existsSync)`, and substitutes each extant path's current `stat.blocks` for its previously charged bytes. Its debit is only `max(physicalFloorBytes, reserve + current inventory sum)`. The terminal carry derivation repeats the same operation against the admitted predecessor. Neither compares the inherited rows with their previous charged values. Shrinking or deleting any non-pinned historical report/file can therefore reduce its debit; the constant 17,272,832-byte aggregate floor masks only reductions below that floor, not refunds above it or per-row disappearance. New paths keep the count above 517, so the allocation's row-count check is not a substitute. Even newly charged bytes can disappear before the first terminal carry snapshot and be refunded there.

`assertLeanPreparedTwoPairPredecessorV11` protects only the snapshot sealed for that same route between its prepare and run. It cannot restore charges already lost while constructing that snapshot, or enforce retention between an allocation and the first carry. Pair 2 similarly remeasures previous identities instead of carrying their prior debit, and does not apply `previous.allocatedDiskBytes` as a debit floor in the predecessor construction. This violates the explicitly approved all-files/no-refund contract and can permit capacity admission on an understated historical debit.

**Fix:** Before any new snapshot, join every inherited identity to its previous charged row. Reject missing/shrunk immutable historical rows; if a specifically authorized mutable publication may become smaller, retain `max(previousDebit, observedDebit)` as accounting, separate from its physical observation. Preserve inherited conservative reserve and at least the full previous cumulative debit, add new positive deltas exactly once, and use the same rule in terminal carry and next-pair predecessor construction. Do not filter required old identities away. Add isolated regressions for deleting/shrinking an unpinned historical row before v11 preparation, after preparation/before carry, and before pair-2 construction; each must reject or preserve every previous debit.

### CR-02: BLOCKER — No-ledger carry accepts fabricated refusal/count/clock custody

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:787-800`

**Affected:** carry authentication lines 808-826; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.test.ts:485-514`.

**Issue:** For a route without a ledger, carry derivation trusts the rooted `terminal-verification-v11.json`'s `predecessor` and `cumulativeCharged`, and joins only rooted terminal-verifier start/close records. It never reauthenticates the real `admission-failure-v8.json`, prepare/run start/close markers, or the verifier report's `failureRoot`; it does not require `check.cumulativeCharged === predecessor.chargedMatches`, validate the predecessor root/schema completely, or require the complete terminal-verification schema. `Number(check.cumulativeCharged)` becomes the next-pair charge count. A SHA256 root proves internally consistent bytes, not authentic lifecycle custody.

The committed positive fixture demonstrates the bypass by publishing a four-field partial request, 517 fabricated survivor rows and three rooted verifier objects, with no admission start/close or admission-failure receipt at all, then successfully authenticating a closed outcome. Its report even omits fields emitted by the real verifier. Changing that synthetic report's cumulative count from 32 to 33 and recomputing its root is not rejected by any no-ledger equality check or carry bounds. Reader timestamps can also be detached from the actual refusal time; the accounting floor is calculated from those report-supplied times. Pair 2 consumes this purported closed outcome as predecessor custody.

**Fix:** Introduce a finite terminal-verification authenticator used by carry consumers, rederiving the report from exact actual admission/refusal/absence records and their byte/root joins. Require exact request/report/reader schemas, a fully validated predecessor bound to authentic historical/prior-pair custody, genuine null entry/result identity, zero current charges and the exact inherited cumulative charge count. Join the report's failure root and reader start to the actual admission close; validate its cumulative elapsed value against authentic effective-close/monotonic and uninterrupted v11 floors. For ledger-present failures, validate the original pre-verifier ledger/time prefix rather than naively comparing a saved failure's time hash with the now-extended time file. Replace the synthetic positive fixture with a complete inert actual-lifecycle fixture, and add root-recomputed mutations of count, predecessor, failure root, reader times and missing admission files.

### CR-03: BLOCKER — Filtering report rows bypasses complete predecessor schema validation

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:977-989`

**Affected:** allocation admission lines 1074-1083; contrast existing v9/v10 full validation at lines 949-969.

**Issue:** Unlike v9/v10, v11 never validates the entire predecessor before producing a legacy schedule-only view. The v11 checks do not require a natural/integer `chargedMatches`, exact report-row keys, natural report-row bytes, unique report identities, or that the sum of all original rows fits `allocatedDiskBytes`. Allowed phase-report rows are removed at line 986 before the old schedule validator checks rows, then the original unvalidated predecessor is sealed at line 989. The charge count is likewise replaced with 28/29 during the schedule check, losing its only opportunity for natural-number validation.

A rooted v11 baseline-1 predecessor with `chargedMatches: 32.5` passes the 32..33 checks; a diagnostic-2 predecessor with 32.5 likewise passes its interval. A rooted predecessor containing 517 valid private rows plus an allowed report row with `allocatedBytes: -1`, duplicated report identity or additional keys is also never fully checked, because those rows are discarded before schedule validation. `admitLeanAllocation` reconstructs through the same v11 builder, so it repeats the bypass rather than rejecting the malformed original predecessor. The admitted result can contain non-integral charges or invalid/understated resource accounting, contrary to the runtime-boundary schema requirement.

**Fix:** Add a complete v11 predecessor validator and run it before constructing the schedule view. Require exact predecessor keys/root/schema, natural safe-integer charge count, valid history/unknown-peak fields, exact unique survivor rows, allowed canonical identities, natural safe-integer row bytes, bounded safe cumulative row sum and `sum <= allocatedDiskBytes`. Preserve the complete validated predecessor unchanged in the final allocation. Add both constructor and JSON-roundtrip admission rejection tests for fractional/string counts, negative/fractional report bytes, duplicate/extra-key report rows, and a report-inclusive sum exceeding the sealed debit.

### CR-04: BLOCKER — Terminal-only verifier lacks final source/HEAD hold enforcement

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:833-867`

**Affected:** terminal carry publication lines 769-806.

**Issue:** The new terminal-only verifier snapshots the functional manifest and HEAD once at line 833. Its final check at line 857 checks elapsed/RSS/disk only; closing the interval and publishing the close, terminal verification and carry never recheck source, HEAD or request bytes against that snapshot. In the actual-entry branch, `entry.head` is compared with the early snapshot only. Source/HEAD drift during subsequent predecessor/baseline-closure custody reads or before terminal publication can therefore still produce a valid-looking terminal check and carry. Carry derivation does not check current source/HEAD either. The contract explicitly requires source and HEAD to remain fixed through the actual terminal and the one appropriate independent check, including no-result paths; the ordinary retained reader has a guard for these joins at lines 279-287/302, but the new terminal-only path does not.

**Fix:** Use a v11 terminal-only hold guard binding the fixed manifest root, HEAD, exact request bytes and actual entry identity when present. Invoke it around substantive custody reads and immediately before successful close/report/carry publication, and recheck after publication before returning a completed check. A failed hold may preserve a finite nonauthorizing refusal receipt, but must not issue authenticated successful terminal-check custody. Add isolated controlled mutations of source, HEAD and request after initial snapshot but before final close/publication, for both no-entry and entered/no-result branches.

---

No source files changed. No commit created. All four findings require repair and independent re-review before any fresh data/helper authoring, allocation or MAIN route.
