---
phase: 265
plan: 16
scope: exact-historical-survivor-path-source-fix
source_commit: 31880765e6f636100b29e27a40bdb23ec6bbe03a
base_commit: 8573653e
verified: 2026-10-07
status: verified
score: 3/3 scoped truths
whole_phase_verified: false
empirical_admission: false
---

# Plan 16 survivor-path correction — source-only verification

**Scope:** Verify the final two-file compatibility correction at commit `31880765e6f636100b29e27a40bdb23ec6bbe03a`. This is not a new source admission, route authorization, or verification of Phase 265 as a whole.

## Observable truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The three historical phase-review paths are admitted only for the exact new bookkeeping-continuation binding; legacy restrictions remain unchanged. | VERIFIED | The production diff adds a private set containing only the named baseline-data-review, diagnostic-1-data-review, and shared review paths. Filtering is guarded by `isLeanBookkeepingContinuationV8(extension)`, after existing exact extension admission and ordinal/prior-closure/charge checks. It adds no broad phase-path or Markdown allowance. The v7 constructor remains the unchanged schedule validator; legacy v7 and old v8 bindings do not take the new branch. The independent review records tests rejecting legacy and unrelated/traversal paths. |
| 2 | The complete original predecessor inventory is schema- and budget-validated before the temporary schedule view is filtered, then retained intact in the actual allocation. | VERIFIED | The new branch checks exact predecessor and row keys, nonempty rows, permitted identity/path form, natural byte counts, unique identities, safe aggregate arithmetic, and aggregate `<= allocatedDiskBytes` before deriving `scheduleSurvivors`. Only the schedule-only view filters the three exact paths; the final allocation body restores `predecessor: p`. The positive inert test uses the real v8 constructor and `admitLeanAllocation`, asserting all 367 rows, predecessor root/counters, 63,896,581ms, and the complete 14,864,384-byte debit—including the three 20,480-byte review rows—are preserved. Negative coverage includes malformed/unsafe/duplicate/unrelated paths and aggregate overflow. |
| 3 | The correction changes no retry authority, route, caps/policy, cache behavior, or consumed historical state. | VERIFIED | The commit diff changes exactly `lean-experiment.ts` and `v1-38-lean-bookkeeping-continuation.test.ts`; it adds no imports or production owner. Binding, cache, caps, and policy definitions are outside the diff. The final allocation retains the original predecessor rather than changing historical rows or charges. The already-verified preparation terminal report records that the approved v8-2 diagnostic/baseline pair failed before store/allocation/child/charge and is closed; this correction grants no retry or baseline authority. |

## Focused evidence

- Fixed HEAD is `31880765e6f636100b29e27a40bdb23ec6bbe03a`; the reviewed diff is from `8573653e` and contains only the two scoped files.
- Scoped `git diff --check` passed.
- MAIN’s final focused validation session `98800`: exit 0; two files, 69 tests passed in 7.05 seconds; configured strategy-lab types and diff checks passed. This comprises 41 continuation/path cases and 28 admitted-cap-cache cases. No tests were rerun for this verification.
- Independent source review was clean and separately ran the new focused path group: 10 passed, 31 intentionally unselected.
- No source inventory was changed or treated as current-final evidence; the earlier source root `8cf180ad…` predates this fix.
- No historical reader, private payload, actual allocation/preparation/run, Strategy/provider/Match, empirical command, or full suite was run.

## Limits

This confirms only the exact survivor-path source correction. It does not identify the earlier withheld preparation failure cause, establish an RSS cure or full-36 fit, or complete Plan 16, LEAG, Phase 265, freeze, formation, holdout, public/counted, or production gates. The prior v8-2 pair remains closed and spent; no new attempt is authorized.

---

_Verified: 2026-10-07_  
_Verifier: independent scoped source verification_
