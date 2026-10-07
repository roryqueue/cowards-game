---
phase: 265
plan: 16
verified: 2026-10-07T05:00:27Z
status: passed_scoped_source_verification
score: 4/4 source truths verified
scope: remaining_budget_source_supplement_only
source_head: 50449e61f096d870888f96b66a00686e76f40c71
source_root: sha256:452182810a0b1179552a7977243144c71709ec460f73f4d361f6f7aa79b33d0c
source_entries: 905
extension_root: sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66
empirical_admission: false
whole_phase_verification: false
---

# Plan 265-16 Remaining-Budget Supplement — Source Verification

**Scope:** Existing Plan 16 remaining-budget supplement only. This is source plumbing verification, not full Plan 16, Phase 265, LEAG, or empirical verification.

## Observable Source Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The new remaining-budget binding is additive, identifies only `v9-1/2/3`, and keeps the legacy v8 binding and resource ceilings distinct. | VERIFIED | `lean-experiment.ts:83-139` admits the exact v9 extension; `isLeanRemainingBudgetMode` enumerates three ordinals. New allocation construction delegates schedule validation then carries the v9 binding; `LEAN_RETRY_V8_TIMEBOX_CAPS` retains the existing 72,000,000 ms elapsed bound and `LEAN_CAPS` remains 15,000,000,000 bytes / 300 Matches (`:10`, `:139`, `:885-919`). Contract tests cover exact binding and v8 distinction (`v1-38-lean-remaining-budget.test.ts`). |
| 2 | Prior costs and old failed-preparation custody are carried as finite, non-success evidence, including complete survivor debit and the reserve floor. | VERIFIED | `inspectLeanRemainingPredecessorV9` uses the current task time floor, authenticates prior v9 closures and the pinned v8-2 preparation refusal, carries 30 prior charges, inventories survivor paths, and adds the reserve/debit (`run-v1-38-lean-correction.ts:727-763`). The old prep authenticator pins bounded bytes and explicitly returns `accepting:false`, `finalReaderClose:false`, zero current charges; it refuses if allocation/store/run/closure artifacts exist (`v1-38-lean-correction-retained.ts:474-501`). The new allocation rejects elapsed-plus-reserve at/over 72,000,000 ms and validates full-row physical debit before the filtered schedule view (`lean-experiment.ts:889-913`). |
| 3 | Failed/refused/absent new routes remain spent and nonauthorizing; only the new accepted diagnostic check with actual FINAL closure and matching source/HEAD lineage can enable the conditional baseline. | VERIFIED | New-route request validation binds mode, exact extension, predecessor closure and per-ordinal continuation (`run-v1-38-lean-correction.ts:429-443`). Retained closure distinguishes accepted/refused/absent and makes nonaccepted v9 closure non-FINAL (`v1-38-lean-correction-retained.ts:348-367, 447-455`). Baseline join requires accepted check, FINAL close, same source, actual HEAD lineage, committed allocations, ancestry and unchanged functional source (`v1-38-lean-baseline-retained.ts:25-55`). Existing synthetic tests exercise the accepted/refused/absent lifecycle and baseline join (`run-v1-38-lean-host-stage-v8.test.ts:195-362`). |
| 4 | The v9 functional manifest contains the actual complete reviewed source bundle and is identical across all three diagnostic ordinals. | VERIFIED | Invoked only the pure `leanCorrectionSourceManifest(mode, LEAN_REMAINING_V9_EXTENSION)` observer. Actual worktree result for each of `v9-1`, `v9-2`, `v9-3`: 905 entries; root `sha256:452182810a0b1179552a7977243144c71709ec460f73f4d361f6f7aa79b33d0c`; extension root `sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66`; zero missing paths. The new verification report is not in its own functional hash closure. This independently matches `NEW265-16-REMAINING-BUDGET-SOURCE-VALIDATION-v1.md:10,29`. |

## Source/Artifact and Wiring Checks

| Artifact | Exists / substantive | Wiring | Result |
|---|---|---|---|
| `packages/strategy-lab/src/league/lean-experiment.ts` | Present; exact mode binding, survivor validation, and allocation guards | Used by request, allocation, admission, and retained consumers | VERIFIED |
| `scripts/run-v1-38-lean-correction.ts` | Present; contains v9 manifest, request, setup witness, predecessor and route handling | Imported by retained/baseline code and exposed through CLI/shell | VERIFIED |
| `scripts/lib/v1-38-lean-correction-retained.ts` | Present; finite prep pins and distinct terminal/accepted closure handling | Called from the correction route and baseline join | VERIFIED |
| `scripts/lib/v1-38-lean-baseline-retained.ts` | Present; requires accepted check + actual FINAL and lineage | Selected baseline retained reader calls the authority gate | VERIFIED |
| `scripts/run-v1-38-lean-correction.sh` | Present; exact dated v9 paths and modes | Routes only exact v9-1/2/3 prepare/run/verify commands | VERIFIED |
| `scripts/lib/v1-38-lean-remaining-budget.test.ts` and `scripts/run-v1-38-lean-host-stage-v8.test.ts` | Present; inert contract/lifecycle assertions | Cover mode, custody, failure, accepted-FINAL and lineage contracts | VERIFIED |

## Checks and Limits

- The independently generated manifest passed exact 905-entry/root comparison for all three ordinals.
- The source-validation artifact records MAIN's selected 145/145 test result and 7 selected synthetic lifecycle tests passing, with 24 host-stage cases explicitly unselected; it also records configured strategy-lab typecheck, shell syntax and diff checks passing. Those test/build commands were **not rerun** in this verification, per the bounded handoff instruction.
- A focused anti-pattern scan of the seven owned source/test files found no `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, placeholder, or empty-return markers.
- No preparation, request authoring, allocation, admission, run, provider/Strategy/Match operation, historical ordinary reader, or private raw payload access was performed.

## Non-Claims

This report establishes only checked source plumbing. It does not verify actual source/data-review admission, a fresh allocation/store/capacity gate, diagnostic or baseline execution, memory feasibility or cure, full 36-cell fit, historical failure cause, all nine LEAG requirements, Phase 265 completion, freeze, downstream authority, or public/counted/production success.

---
_Verified: 2026-10-07T05:00:27Z_
_Verifier: the agent (scoped source verification)_
