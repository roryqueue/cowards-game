---
phase: 265
plan: 16
verified: 2026-10-07T05:22:39Z
status: passed_scoped_source_verification
score: 3/3 source truths verified
scope: v9_file_basis_source_repair_only
source_head: 38694137e999daa29b8608437c1eef11edc32c3a
source_root: sha256:664f2da8fd2199d965773de7422575f52dbebeeb486a0c661702a97d648c8ee6
source_entries: 905
extension_root: sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66
empirical_admission: false
whole_phase_verification: false
---

# V9 File-Basis Repair — Scoped Source Verification

**Scope:** File-basis validator correction, exact report-debit follow-up, and v9-1 failed-author-refusal custody. This is source-only verification; it is not admission or empirical execution.

## Observable Source Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The conservative disk basis remains at least the unchanged 14,864,384-byte floor and covers the complete sum of unique validated survivor rows; rows themselves need not independently sum to the inherited reserve floor. | VERIFIED | `validateLeanRemainingSurvivorsV9` requires exact shape, at least the historical row count, safe exact identities, unique rows, natural byte counts, total row sum no greater than `allocatedDiskBytes`, and `allocatedDiskBytes >= physicalFloorBytes` (`lean-experiment.ts:893-903`). The old extra predicate `rowSum >= physicalFloorBytes` is absent. The actual inventory method and regression assert each extant report debit is `stat.blocks * 512`, includes the v2 review report once, preserves the inherited reserve and excludes reports from the functional manifest (`v1-38-lean-remaining-budget.test.ts`, “debits every exact file-basis gate report once…”). This does not claim that extant rows alone meet the floor. |
| 2 | The spent v9-1 author-finalization refusal is authenticated as a distinct closed-prefix custody anchor, with 30 historical charges and no accepted check, admission, reader-close fields, or FINAL authority. | VERIFIED | Called the explicitly scoped `authenticateLeanRemainingClosedPrefixV9("v9-1")` once. It validated the ten pinned metadata identities and destination absences and returned `custodyClass=author_finalization_refusal`, `closureClass=refused`, `closedAtMs=1791349668689`, `closedElapsedMs=67705636`, `currentCharges=0`, `cumulativeCharged=30`, `finalReaderClose=false`, `accepted=false`, `authorizing=false`; it had no `readerStartMs` or `readerCloseMs`. The authenticator checks exact pins, bounded regular-file metadata, request/auth/setup consistency, the later observation timestamp's meaning, absence of forbidden route surfaces, and exact temp-directory contents (`v1-38-lean-correction-retained.ts:505-566`). No ordinary reader or admission path was invoked. |
| 3 | New v9 routes remain distinct; prior failed-author history can only seed bounded accounting, while ordinary actual retained closure and accepted-check/FINAL baseline authority remain required for later route/baseline decisions. | VERIFIED | The v9 predecessor/request consumers branch to `authenticateLeanRemainingClosedPrefixV9` for the prior prefix and use `closedAtMs` as a custody accounting anchor (`run-v1-38-lean-correction.ts:427-443, 727-763`; covered by the source assertion in the focused test). The prefix authenticator falls back to the existing actual-reader closure for other v9 modes. The baseline gate still separately demands an accepted diagnostic check, actual `finalReaderClose`, matching source and committed HEAD/allocation lineage (`v1-38-lean-baseline-retained.ts:25-52`). Current source-review v2 confirms the follow-up changed only the exact physical-report allowlist and its test, not baseline/runtime admission. |

## Manifest and Validation Evidence

- Recomputed `leanCorrectionSourceManifest(mode, LEAN_REMAINING_V9_EXTENSION)` for `v9-1`, `v9-2`, and `v9-3`: each returned **905 entries**, **0 missing paths**, root `sha256:664f2da8fd2199d965773de7422575f52dbebeeb486a0c661702a97d648c8ee6`; extension root was `sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66`.
- Clean independent `NEW265-16-V9-FILE-BASIS-SOURCE-REVIEW-v2.md` reports zero findings at this HEAD/root. It specifically confirms the added exact physical-custody report identities do not broaden to a phase-wide allowance or enter the functional source manifest.
- MAIN validation records 22/22 focused tests, configured strategy-lab typecheck, shell syntax, and diff checks passing. These tests/build checks were **not rerun** for this verification. I ran only the allowed pure manifest observer and one finite metadata-only closed-prefix authenticator.
- Focused anti-pattern scan on the changed production/test files found no debt markers or empty-return stubs.

## Limits

No fresh request, preparation, allocation, store, admission, capacity check, provider/Strategy/Match run, old ordinary reader, or baseline was invoked. No physical-floor claim beyond the conservative allocated debit was made. This report does not verify new source/data-review admission, memory feasibility, baseline success, full Phase 265 or LEAG completion, freeze, or downstream/public/counting/production authority.

---
_Verified: 2026-10-07T05:22:39Z_
_Verifier: the agent (scoped source verification)_
