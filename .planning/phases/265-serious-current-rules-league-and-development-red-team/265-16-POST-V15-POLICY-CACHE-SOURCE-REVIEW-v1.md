---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-09T21:24:49Z
depth: standard
scope: source-only-policy-cache-supplement
source_commit: b21db1433611b494091a269d13c8f58dc91ba2bf
source_root: sha256:e3833116fa70fb6f6aff275cdda316ac443c0214c3b4d6d0fd3cb5a4169ccbca
source_entries: 972
diff_base: 763174fdbbadb21982acdfb6f4c9bedd007241cf
implementation_isolation_base: 811410340b05173f2bd1a80d1e2c297ce0400303
implementation_repair_commit: 6996d3e7
author_agent: /root/execute_265_policy_cache
reviewer_agent: /root/review_265_policy_cache
independently_reviewed: true
files_reviewed: 13
files_reviewed_list:
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-checkpoint-observation-v15.ts
  - scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - packages/strategy-lab/src/runtime-bridge.ts
  - packages/strategy-lab/src/runtime-bridge.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
findings_open: 0
status: clean
empirical_authorized: false
selected_review_v5: false
---

# Phase 265: Policy-cache source review

**Reviewed:** 2026-10-09T21:24:49Z  
**Depth:** standard  
**Files reviewed:** 13 ordered paths; ten changed files and three unchanged closure dependencies  
**Status:** clean, source-only; zero reproduced actionable findings

## Summary

Independent adversarial review of the merged policy-cache supplement, including repair6996d3e7, against the actual failed FUNCTIONAL source763174fdbbadb21982acdfb6f4c9bedd007241cf. Historical documentation HEAD356ff8abd4c058b2bdcca0bde8aceaba2a6107d0 is custody metadata, not the semantic comparator. No BLOCKER or WARNING was established in the submitted source changes and their called closure.

This intermediate report is not the selected RESOURCE-WINDOW-SOURCE-REVIEW-v5 receipt. ROOT REVIEW-FIX closure must precede that separately scheduled receipt. It does not establish recovery, initiating cause, an accepted diagnostic, full retention/reader success, baseline readiness, empirical admission, Phase265/LEAG completion, freeze, formation, holdout, public, counted, or production authority.

## Narrative Findings (AI reviewer)

No actionable findings. The following records the source paths challenged and the evidence supporting that scoped result; it is not a statement that all historical code or empirical gates are correct.

### Cache eligibility, issuance, and fresh observations

`packages/strategy-lab/src/league/lean-experiment.ts:1137-1199` uses a separate descriptor-only immutable predicate and a private WeakMap. The new registration is after complete allocation reconstruction and equality and keys only the returned `expected` object, never incoming `value`, a root string, file bytes, or a resource/ledger observation. The new predicate rejects proxies, accessors, functions, aliases/cycles, unfrozen objects, nonplain prototypes, symbols, sparse arrays, nonfinite values, excessive depth, and its separately counted descriptor/element/node ceilings. Hits at `:1847-1848` and `:2023-2024` select only the immutable policy/caps pair. Misses preserve complete admission. No cache-control setter or caller-key insertion was found.

The old `immutableRetryData`, `admittedRetryCaps` declaration, and old successful-return registration were independently compared to failed functional source and are byte-identical. Both old2/3 policy bodies, including self-root construction, are byte-identical. The new policy at `:1994-2007` carries only strict4, charged38, the checked new PLAN root and successor lineage under unchanged resource/timing values; strict5 still refuses.

The actual connected path remains `assertLeanCorrectionCheckpointV15` → `checkpointLeanObservationV15` → fresh host operations → selected prefix/correction/disk guards (`scripts/run-v1-38-lean-correction.ts:473-498`; `scripts/lib/v1-38-lean-checkpoint-observation-v15.ts:21-38`). Two explicit fresh file admissions plus the fresh ledger read remain. The child callback at correction`:1628-1641` still samples current/max RSS, parent RSS, free disk, time, physical bytes, charge count, available memory, and temporary disk. Native wrapper pre/post checkpoints remain at `scripts/lib/v1-38-lean-baseline-match.ts:123,144,154`; unchanged source/HEAD/entry and parent hold checks are not replaced by cache state. Source inspection and named connected tests cover allocation replacement after a cache hit and RAM/time/available-memory refusal. No file/ledger/measurement cache or no-refund bypass was found.

### Finite catch attribution and retained cell

`packages/strategy-lab/src/runtime-bridge.ts:27-44,56-72,73-134` tracks host-owned phase/code/totals in the invocation, without inspecting the caught value. Issuance is against the exact final returned execution object after cleanup replacement, bound to allocation/charge/slot. The first failure is not erased by cleanup. Copies and mismatched bindings read unknown; invalid timing falls back to unknown with zeros. The execution/public/legacy shape is not extended.

`scripts/lib/v1-38-lean-baseline-match.ts:111-112,171,200` opts in only after strict admitted4 mode selection and reads the actual bridge-returned identity. Only its existing private return/cell gains nullable `hostFailureV15`; success carries null, failure carries finite metadata. Existing host-stage-v7 branding/wrapper behavior remains unchanged. Hostile thrown proxy tests observe no property access or serialization, and cleanup replacement keeps the original phase.

The actual publication validates the field before retention and spreads it into the existing rooted observation, not a new sidecar file (`scripts/run-v1-38-lean-correction.ts:1555-1572`). The retained audit adds the key only for4 and checks its schema, exact seven totals, finite nonnegative safe integer totals/sum, allowlisted phase/code consistency, and three-root join (`scripts/lib/v1-38-lean-resource-window-v15.ts:376-383`; `scripts/lib/v1-38-lean-correction-retained.ts:187-188`). Persisted JSON remains validated metadata, not renewed host branding or accepted/FINAL authority. Existing full audit, ledger, metric, result, and resource checks remain.

### Historical cost, strict consumers, and source accounting

The additive cost parser first verifies all ten exact path/length/raw/canonical/schema/key-set/embedded pins, then joins seven finite roles and inherited→carry→pair survivor monotonicity (`scripts/lib/v1-38-lean-resource-window-v15.ts:324-369`). The4 dispatch selects strict policy before reads and invokes only the distinct ten-pin failed3 parser (`scripts/run-v1-38-lean-correction.ts:2032-2036`), not the old prior-pair or failed2 authenticators/ordinary readers. Its frozen return is authorizing:false,38 charged,970 final survivors,27303936B,228267940ms, and unknown historical peaks. No accepted check, successful/FINAL, or hold-authentication authority is projected.

Strict4 is connected through actual extension documents, setup/request/continuation, predecessor/reservation, selected resources/time, own accepted-diagnostic join, and retained consumers. The conditional baseline still requires its own accepted4 diagnostic and actual FINAL; failed3 cost history cannot satisfy those gates (`correction.ts:2072-2080,2142-2180,2205-2231`). The new semantic distinction binds current source evidenceRoot and selected reviewRoot, exact failed functional base, actors, and13 ordered paths (`:2087-2109`). Default selected-v5 reading uses bounded private-file admission. Its consumer checks current real manifest count/root and reviewed-commit ancestry plus source equality (`:539-563`), not hardcoded966 or fixture-only identities.

The production manifest was recomputed using `leanCorrectionSourceManifest('v15-4', LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY)` with no injected base/read seam. Result:972 entries and source sha256:e3833116fa70fb6f6aff275cdda316ac443c0214c3b4d6d0fd3cb5a4169ccbca. All13 source paths and exact four new inputs are included; all six exact cyclic outputs are excluded. Earlier input/exclusion sets remain connected. All ten amendment paths remain physical report debits with charged growth/shrink/disappearance checks (`lean-experiment.ts:960-974,2056-2072`; correction manifest`:281-303`). A generated review is not a functional input and cannot change the reviewed source identity.

## Closed source evidence

One bounded768MiB read-only production-manifest/pin comparison, session30901, CLOSED exit0:

- Actual HEAD b21db1433611b494091a269d13c8f58dc91ba2bf; real production source972/e3833116 as above;13/13 closure,4/4 inputs,6/6 exclusions.
- Actual saved ten pins: raw length/digest10/10; complete-wrapper canonical10/10; embedded roots7/7; required root absence3/3. No historical custody authenticator/ordinary reader/publisher was called by this comparison.
- Old policy2/3 bodies and old immutable helper/map/registration comparisons all true. Policy4 root sha256:cc82460b7ce59632b02348209d3fc2a760de527f36d39ac52f7f211e77133b37.

After writing this report, the same bounded production call was repeated in session1209, CLOSED exit0. HEAD remained b21db1433611b494091a269d13c8f58dc91ba2bf and source root remained sha256:e3833116fa70fb6f6aff275cdda316ac443c0214c3b4d6d0fd3cb5a4169ccbca. Git status showed no tracked source modifications; the scheduled report is untracked alongside pre-existing unrelated untracked artifacts/locks, which were left untouched.

Only the permitted new inert named tests ran. All commands used `NODE_OPTIONS=--max-old-space-size=768`, `perl -e 'alarm 60; exec @ARGV'`, and CLI `--testTimeout 5000`.

| Session | Exact selection | CLOSED exit | Result |
|---|---|---:|---|
|8503|`vitest run packages/strategy-lab/src/runtime-bridge.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts -t 'policy cache host attribution' --testTimeout 5000`|0|10 passed,14 skipped,24 total;4.76s|
|80884|`vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts -t 'policy cache' --testTimeout 5000`|0|22 passed,23 skipped,45 total;27.99s|
|91272|`vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts -t 'policy cache' --testTimeout 5000`|0|3 passed,13 skipped,16 total;4.28s|

Thus35 named inert cases passed;50 legacy/unrelated cases were skipped, not credited. The one explicitly approved inert publication test has its existing15000ms test-only override; CLI/all other test limits and operational host5000 remain unchanged. The script tests include same-object cache-hit/fresh-three-admission guard paths, tamper/refusal, actual bounded cost dispatch, thirteen-file fixture consumer, production manifest with inert injected base, physical debit/no-refund, rooted publication with inert retention leaf, and retained cell rejection before the next existing METRIC guard. The separate comparison above, not the injected manifest test, establishes the real972-entry production identity. Diff whitespace check over the exact13 paths CLOSED exit0.

## Proof limits and unchanged frontier

The selected actual0600 review-v5 does not yet exist and was not issued, overwritten, or actually consumed. Its real default-consumer projection, ROOT REVIEW-FIX/validation, distinct source verifier, and the separately scheduled bounded same-object comparative probe remain downstream. Named tests are source evidence, not authority or a speedup/cure measurement. In particular, no full successful retained fixture or accepted FINAL was manufactured.

Normal retention publication10253ms at5000 and inert publication8126ms at5000 remain historical NOTPASS. Passing the explicitly15000ms inert publication case does not establish full normal retention or empirical reader success. The inherited six strict host-graph type errors, earlier private-fixture/serious-monitor NOTPASS, and missing historical command exit/count evidence remain unresolved/uncredited; this reviewer ran no type/build/full legacy suite and makes no broad type/test PASS claim.

Initiating v15-3 cause remains UNKNOWN. Compact604411ms, resource643198ms, and entry769902ms are different scopes, not reconstructed cause or lifetime proof. Original anchor1791455941097/FULL108000000ms floor, elapsed cap250530903, absolute deadline2026-10-10T02:14:32Z, reserve1860000, entry equality cutoff01:33:32Z/source cutoff01:43:32Z, RAM3GB/disk15GB/300Matches and guest1000/host5000/startup2500/Match600000 remain unchanged. All review/test/wait wall is charged without reset/refund.

No source, STATE, authority, actor/DATA/HELPER gate, request, allocation, store, capacity, entry, provider, Strategy, Match, old ordinary reader/authenticator, or empirical publisher was changed/invoked. No commit/push. Only this scheduled intermediate report is written; older history/policies/reviews stay immutable. ROOT alone owns the next gated action.

_Reviewer: /root/review_265_policy_cache (gsd-code-reviewer). GSD code-review used for scoped adversarial source findings and independent evidence/proof-limit separation._
