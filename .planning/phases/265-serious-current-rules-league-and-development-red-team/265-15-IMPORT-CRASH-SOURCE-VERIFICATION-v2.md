---
phase: 265-serious-current-rules-league-and-development-red-team
scope: Plan 265-15 SOURCE-REPAIR subgoal; re-verification of v1 retained-ledger gap
source_anchor: 748d7869a50d1311db1aa2d3edbb86f667ae0553
verified: 2026-10-03
disposition: source-repair-verified
empirical_admission: not-established
---

# Plan 265-15 source-repair verification (v2)

This re-verifies only the retained-attempt read gap recorded in [v1](265-15-IMPORT-CRASH-SOURCE-VERIFICATION-v1.md), while carrying forward its other scoped source findings. It is not a full Phase 265 verification or empirical-route review. I did not run tests, broad scans, private historical readers, preparation, allocation, providers, Matches, or retained verification.

## Re-verification

| Item | Status | Evidence |
| --- | --- | --- |
| Retained start/terminal ledger records are read under the same bounded descriptor cap as other factory artifacts. | VERIFIED | At `748d7869`, `readRetainedFactoryLedger` delegates both starts and terminals to `readFactoryAttemptStart` / `readFactoryAttemptTerminal`. Those use the shared reader, which validates named and opened file type/size, uses `O_NOFOLLOW`, allocates at most `CAP + 1`, detects short reads or concurrent growth, and closes the descriptor in `finally`. The start root is checked against its filename; terminal validation binds it to the exact validated start. |
| The repaired path preserves the ordinary ledger schema/root behavior and keeps the preflight and legacy paths distinct. | VERIFIED (source review) | The lean inventory still enforces its filename/count bound before ledger reopening and supplies its names to the bounded path. The ordinary caller still omits `leanNames`, preserving the default inventory route; stable valid canonical records retain the same sorted roots and ledger-root derivation. Independent [v5 review](265-15-IMPORT-CRASH-REVIEW-v5.md) found no blocker or warning in the changed scope. |
| Crash-bound time accounting, one-assessment/two-candidate closure reuse, failed-v1 immutability, and runtime/gameplay/privacy boundaries remain as previously verified. | CARRIED FORWARD (scoped) | No change in `748d7869` touches those paths. Prior source verification and the focused v5 review/validation records remain the evidence; this narrow pass did not repeat their broader traces. |

## Focused validation evidence

The source author reports repository tests **9/9**, a selected canonical assessor-ledger test **1/1**, strict TypeScript across four scoped files, and `git diff --check` passing. The new tests inject growth after opening for both start and terminal reads and deny oversized files before decoding. These are reported results, not commands rerun in this verification. No broad suite pass is inferred.

## Remaining gates and disposition

The retained-ledger source gap from v1 is closed. The overall source-repair subgoal is verified at the stated source anchor, based on the carried-forward scoped checks and this focused re-verification.

This does **not** resolve the pending human choice about the unknown historical disk peak. The surviving 12,288 allocated bytes remain a current floor, not a historical high-water bound; absent an approved alternative, historical admission remains closed. No private historical admission, measured peak memory, capacity receipt, pilot, LEAG/freeze credit, or whole-Phase-265 completion is established.

**Disposition:** source-repair verified only; historical-disk decision and empirical admission remain open for human/root-owned resolution.
