---
phase: 265
plan: 16
status: complete
scope: source-only-baseline-lineage-repair
empirical_authority: false
source_commit: 51801d24d40fccf34b2dcb507cd3ffbb288dec9c
source_root: sha256:1334976f328d1ad6c442cc223659675b6cbc665ca4e956d14baff530de2c1e6e
functional_source_entries: 905
completed: 2026-10-07
duration: 11min
---

# Existing Plan16 Baseline-Lineage Source Repair Summary

Accepted-diagnostic custody now uses a private, ephemeral read-only lineage purpose; the current baseline's own lifecycle is no longer mistaken for a competing destination, while fresh diagnostic admission remains strict.

## Source and commits

- RED `8605c261`: new source-bound regression failed because the narrowly scoped accepted-lineage call and revocation were absent; 22 existing tests passed.
- GREEN `51801d24`: separate private request/predecessor lineage path, capability issuance/revocation after finite accepted-check/actual closed-journal/source/request joins, composed regression and exact artifact inventory.

Changed only `scripts/run-v1-38-lean-correction.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`, `packages/strategy-lab/src/league/lean-experiment.ts` and the already-hashed `scripts/lib/v1-38-lean-remaining-budget.test.ts`. No extra production module or retained new test file. This summary is the only new owned report.

## Narrow implementation

The accepted-check authenticator retains its existing rooted check and actual closed reader-gap/FINAL-journal checks. For v9 only, it additionally requires accepted diagnostic class, matching allocation/source/HEAD/request identities, exact request raw bytes, and current functional source before creating a purpose in a module-private WeakMap. There is no exported issuer. The purpose is revoked in `finally` whether request/predecessor validation succeeds or refuses.

The dedicated request entry point derives the diagnostic mode from that private capability; callers cannot choose a route, ordinal or skip flag. Shared full request, authorization, source/data review, setup, continuation, cold-reuse and predecessor validation remain. Only the current ordinal's own baseline destination is ignored in this read-only context. Other ordinal baselines and future diagnostic destinations still refuse. Public request/predecessor calls carry no purpose and remain strict; no CLI/request selector exists. Baseline top-level admission, one-shot markers, allocation/HEAD/source/capacity checks and the full accepted-check audit are unchanged. The lineage result itself grants no execution or acceptance.

The exact physical list adds the debug diagnosis, actual baseline preparation-terminal verification, and nine explicitly named lineage repair/plan-check/source-summary/source-review/fix/validation/verification reports, including future v2 review. Existing inventory deduplicates, measures/debits allocated blocks and separately binds report raw bytes. All eleven are outside the functional source manifest; no wildcard phase permission or old pin/binding changed.

## Verification and evidence limits

- Final focused `pnpm exec vitest run scripts/lib/v1-38-lean-remaining-budget.test.ts --maxWorkers=1`: **24/24 PASS**,27.18seconds.
- Configured strategy-lab typecheck, correction shell syntax and diff checks: **PASS**.
- Read-only functional-manifest observation: **905 entries**, final root above. No route operation was invoked.
- The composed regression runs the real accepted-check authenticator → dedicated request validation → predecessor inventory/guard chain against virtual fresh request/check/auth/review/continuation bytes rebound to current source. Finite retained metadata is only an inert fixture template; historical request bytes are neither modified nor admitted against their historical source. The inherited sealed-cold seam and final evidence/state boundary are mocked. It deliberately stops at `ACCEPTED_CHARGE` after lineage validation; no result/source payload audit, ordinary reader or acceptance issuance is performed on historical evidence.
- Own baseline prepare/allocation/store/run/terminal/result presence crosses that real chain; the same fresh diagnostic request remains `SPENT_DESTINATION`. Competing ordinal baselines/future diagnostic destinations refuse before evidence. Nonaccepted/wrong-source/wrong-allocation/wrong-ordinal checks, missing actual FINAL closure and forged capabilities refuse. A capability captured during the fixture call is dynamically proven revoked and unusable afterward.
- Exact report regression verifies each identity once, measured existing report allocation as `stat.blocks * 512`, full survivor debit plus conservative reserve, raw-custody wiring and manifest exclusion.

Fixture development encountered two virtual-entry/allocation join mismatches, corrected without production guard weakening. The composed fixture's approximately23-second finite loop exceeded Vitest's default5-second timeout; its test-only bound is30seconds, not a gameplay/runtime/resource cap change. It was then merged into the owned, already-hashed test because a separately named test was not automatically included in the functional manifest. Six previously documented standalone strict-script errors were not rerun or expanded into repairs. No full-suite or standalone-clean compilation claim.

## Actual outcome and authority

Original MAIN52980 remains failed before allocation/store/entry/Match, with4,404ms spent and no new charge. Its exact original throwpoint remains withheld; the debug trace established a reproducible nested guard consistent with that refusal, not a directly observed MAIN thrown code. The old v9-2 accepted diagnostic at source664f2da8 and every failed baseline request/auth/setup/marker/report/check remain immutable historical evidence after this source repair. They cannot authorize execution at the new source.

The approved envelope is ENDED. No helper or metadata authoring, preparation, allocation, store creation, provider/Strategy/Match, ordinary reader or retry occurred. All31 charges, old files, elapsed/resource costs remain carried under the same72Mms/15GB/300 caps,06:19:23.053Z deadline and1,860,000ms next-Match reserve. STATE/user files were left to MAIN. Independent source review and MAIN validation/verification remain next; any future empirical work requires a genuinely new prospective budget/attempt decision. No phase/league/freeze/formation/holdout/public/counting/production success follows.

No known stubs. The read-only custody purpose and exact metadata file surfaces are explicitly covered by the checked supplement; no additional unmodeled execution/network/auth surface was introduced.

## Self-Check: PASSED

All four owned source files and this summary exist. RED/GREEN commits exist; no tracked file deletion. The temporary new test created solely in this task was removed after merging into the already-hashed test; all unrelated and historical untracked files remain untouched.
