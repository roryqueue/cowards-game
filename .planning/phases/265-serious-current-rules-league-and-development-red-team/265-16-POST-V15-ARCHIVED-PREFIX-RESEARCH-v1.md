# Phase 265 Plan 16 — archived failed-prefix cost contract research

## Scope and status

This is a source-only supplement within existing Plan 16, not a new numbered plan, resource request, route authorization, or implementation. Discovery is Level 0: the affected TypeScript/Vitest custody code and its callers already exist; no dependency, external API, or install is needed. Existing Plan16 boundaries govern. This document drafts a missing prospective custody contract for the next separately scheduled/checkable source supplement; it does not edit source, history, STATE, allocation, or runtime evidence.

The prior checkpoint repair is source-verified at commit `47425b37ee8d4a9ebdf0851667689d6d5ec0713e`, root `sha256:6f843d8614f3397403e613367cf751e89032dd8cc28b0fe5e322a679fd513742` / 955 entries. Exact current review is `265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md`; the matching source verification is `265-16-POST-V15-CHECKPOINT-REPAIR-SOURCE-VERIFICATION-v1.md`. That verification explicitly leaves this contract and a concrete repaired-call-chain distinction as missing dependencies.

ROOT has added `265-16-POST-V15-TIMING-DECISION-v1.md`, a pending proposal for a separate additional eight-hour allowance or inconclusive closure. It is NOT approved and grants no authority. Include this exact file in the successor's finite physical debit inventory, without treating it as an approved budget artifact or excluding it from accounting. Until direct approval, preserve the supplied current envelope and do not prepare or enter a route.

Historical facts remain immutable: diagnostic v15-2 is refused; ROOT 73583 closed 0, ordinary reader 58084 closed 1/refused, current charge 1 / cumulative charge 37. The extra duplicate-publisher 7008 operator-error hold-refusal is also closed/refused history, not a hold authenticator. Preserve the refused closure, its `accepted=false` and `finalReaderClose=false` state, operator error, all 37 charges, survivor set and byte floor, elapsed upper bound, and every pinned RAW identity. The initiating throw remains UNKNOWN. Never rerun, refund, reclassify, or use either old reader/authenticator; never reinterpret the hold refusal or pair closure as acceptance.

## Source seams and contract shape

`scripts/lib/v1-38-lean-resource-window-v15.ts` exports the finite v14-1 `LEAN_RESOURCE_WINDOW_V15_HISTORY_PINS`, `authenticateLeanResourceWindowPriorPairV15`, and the separate accepted-result join. Its reader validates the accepted 36-charge v14-1 ancestry before deriving later pair costs. `scripts/run-v1-38-lean-correction.ts` uses `readLeanResourceWindowPriorPairV15` from the request/continuation validator and `validateLeanResourceWindowContinuationV15`; the call chain also binds request source/review, allocation and the source manifest. `packages/strategy-lab/src/league/lean-experiment.ts` owns the finite report paths and mode/policy types. Existing tests are `scripts/run-v1-38-lean-resource-window-v15.test.ts` and `packages/strategy-lab/src/league/lean-resource-window-v15.test.ts`.

Smallest viable addition is a *distinct* v15-2 archived-failed-prefix cost authenticator, selected only by the v15-3 continuation path. Keep the current v14-1 authenticated-prefix reader and accepted-join API unchanged for existing behavior. The new authenticator must accept only exact source-controlled RAW byte/root pins for the enumerated archived v15-2 records and exact expected key sets; never directory-scan, glob, accept caller-selected pins, or invoke an old reader. It composes a new immutable predecessor/cost root, with 37 cumulative charges and monotonic elapsed, allocated bytes, and per-survivor identity/byte floors. `unknown` historical peak fields remain unknown; do not invent peak measurements. Include the refused ordinary close and separate publisher hold-refusal as distinct non-authorizing evidence, while neither is substituted for the other's closure role.

The producer/consumer join must separately prove a concrete prospective distinction tied to the *actual repaired checkpoint call chain*, not merely changed source/HEAD/hash or a review saying the code is different. Bind the new current source root, exact fresh independent review receipt and contract version to the v15-3 continuation and request; tie v15-2 raw-prefix pins to that continuation's cost predecessor. Preserve exact refused/operator-error outcome fields as historical facts and prohibit any `accepted`, `finalReaderClose`, successful-audit, or hold-authentication promotion. A missing pin, extra record, malformed schema, non-monotonic cost/survivor, wrong distinction, stale review/root, or mismatched call-chain evidence must fail closed before request admission. Generic source identity drift alone is explicitly insufficient.

Do not broaden this v15-3 contract to v15-4 or v15-5. They remain fail-closed until each has its own concrete checked distinction and full immediate-prefix contract. This supplement does not generate data/helper reviews, attestation, authorization, setup, allocation, store, capacity receipt, provider/Strategy/Match entry, or empirical result.

## Portable adversarial test inventory

- Happy-path synthetic fixture proves a correctly pinned refused 37-charge prefix yields *cost-only* predecessor data and still reports refused/non-authorizing status.
- Reject each missing, modified, re-rooted, duplicate, reordered, or unexpected raw pin/record; reject mismatched literal byte digest and canonical object root independently.
- Reject charge count below 37 or any later non-monotone elapsed, allocated-byte, survivor identity, or survivor allocation; preserve exact inherited floors without inventing peak RSS/disk.
- Prove ordinary-reader refusal, ROOT closure, and extra publisher hold-refusal remain distinct; hold-refusal cannot satisfy a carry/hold/accepted-reader role.
- Reject forged `accepted=true`, `finalReaderClose=true`, successful-reader/audit claims, and any promotion of failed v15-2 into accepted ancestry.
- Accept only the enumerated v15-3 concrete call-chain distinction bound to current source and exact fresh independent review; changed root alone, absent/stale review, a generic “repair” label, or a distinction for another mode refuses.
- v15-4/v15-5 still reject absent immediate v15-3/v15-4 checked prefix contracts. Legacy/default and accepted v14-1 paths remain byte/behavior-compatible.
- Exercise the real producer/request/continuation validator through inert fixtures; prove no test imports or invokes provider, Match, setup writer, allocation writer, historical ordinary reader, or authenticator.

## Limits and budget

All planning, source work, tests, review and cleanup debit the same continuous allowance. Hard stop `2026-10-09T18:38:33Z`; total cap 223171903 ms from 1791455941097 plus the fixed 108000000 ms floor; remaining reserve 1860000 ms. RAM 3 GB is separate from scratch 2 GB, retained 12 GB, total disk 15 GB, terminal 1 GB, 300 Match maximum, Match 600000 ms, guest 1000 ms, host 5000 ms, startup 2500 ms, oldspace 768 MiB, and 250 ms sampling. No reset, refund, re-anchor, deletion, or resource/bound change. At the supplied current time of 17:52 UTC, no new experiment can start after 17:57:33 UTC; this plan makes no execution or completion promise inside that interval. If review/check/verification or any further source gate cannot close before the exact deadline/reserve boundary, close source-only with no entry and report inconclusive.

## Multi-source audit for this supplement

| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Phase 265 empirical league/development goal | Contract is only a prerequisite; no empirical claim | COVERED as prerequisite; not achieved |
| REQ | LEAG-01 through LEAG-09 | Existing Plan16 scope/dispositions unchanged; this contract grants no requirement credit | COVERED by existing phase plan; no new completion |
| RESEARCH | Current finite v15 reader only accepts pinned v14-1 ancestry; v15-2 failure prefix is absent | Add dedicated exact-RAW failed-prefix cost authenticator and caller join | COVERED |
| RESEARCH | Concrete repair distinction must bind real repaired call chain | Require explicit current-source/review-bound v15-3 distinction; source drift alone fails | COVERED |
| RESEARCH | Preserve no-refund charges, elapsed and survivor accounting | Monotonic 37-charge predecessor and adversarial refusal cases | COVERED |
| CONTEXT | D-01/D-02/D-05/D-22/D-25/D-27/D-28 constraints inherited from checked Plan16 | Cost-only, finite RAW pins, strict joins, no authority expansion or history mutation | COVERED |
| CONTEXT | Pending `265-16-POST-V15-TIMING-DECISION-v1.md` is unapproved | Exact path is inventoried/debited only; it supplies no time, budget, or route authority | COVERED |
| CONTEXT | Other Plan16 locked rules and deferred ideas | No runtime/rule/strategy/league/holdout/public/production changes; deferred ideas excluded | COVERED by existing Plan16; no deferred idea added |

## Research conclusion

The missing piece is a legitimate *prospective* cost-only custody contract for a failed/refused historical prefix, not a special case that weakens the current accepted-prefix gate. Keep its data model and selection separate, prove it with immutable RAW pins and exact joins, and keep failed-evidence semantics unrepresentable as accepted authority. The plan below covers this source contract only. Its success would establish a checkable source prerequisite, not authorize or establish a later empirical route.
