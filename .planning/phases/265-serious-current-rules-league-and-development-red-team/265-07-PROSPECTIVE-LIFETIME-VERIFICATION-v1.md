---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
verified: 2026-10-02T17:02:51Z
status: passed
verification_scope: bounded-source-supplement-only
score: 5/5 source must-haves verified
behavior_unverified: 0
overrides_applied: 0
source_commit: bb98878ec996ec63529093a45d9e55ed89e64610
checkout_head: f08d8833f8d7393b93e8cafb419470d586d24d31
implementation_root: sha256:d6872b1615cf06c1f7c667d5e58d7ddddfb96e1f296a84a52c5cab7df4a1bf33
source_root: sha256:e64686c2c927a5a0f54d786198df2149c215f8e9e7eab71284b36a1cdcece0ed
empirical_requirements_complete: false
phase_goal_achieved: false
freeze_authorized: false
---

# Plan 265-07 prospective lifetime — source verification

The bounded source supplement passes. Both private clocks admit exactly 600000 ms only through the separately rooted prospective-v2 allocation and charged-provider authority. This is **not** a Phase 265 pass, empirical retained verification, LEAG completion, current freeze, or runtime-success prediction.

**Supplement goal:** Implement only the approved private elapsed-lifetime increase from 120000 to 600000 ms, including both clocks and applicable admission, while preserving history and every other policy dimension.

**Roadmap goal, still incomplete:** Researchers can inspect a complete, independently attacked current-rules empirical game and obtain a bounded portfolio and robust-pure outcome without hiding counters or sparse evidence.

Initial verification of this supplement: no previous supplement verification file existed. Existing `265-VERIFICATION.md`, consumed evidence and earlier reports were not replaced. Read the supplement PLAN/RESEARCH/SUMMARY/REVIEW-v1/FIX-v1/REVIEW-v2/COVERAGE-v1/SOURCE-GATE-v1, current validation/STATE, applicable project and requirement/roadmap context, and the 20261002 approval. SUMMARY claims were used to locate work, not to establish implementation.

## Observable truths

| # | Must-have | Source-level result | Actual evidence |
|---|---|---|---|
| 1 | A separately rooted prospective-v2 private allocation admits exactly 600000 ms per Match and differs from the approved prospective-v1 resource policy only in that elapsed ceiling. | VERIFIED | `allocation.ts:176-209` copies the v1 policy with only `perMatchMilliseconds: 600000`, demands exact policy/operations equality, uses distinct v2 discriminators/root domains and the exact lifetime-approval reference, then projects only elapsed lifetime through existing v1 validators. `allocation.test.ts:53-88` rejects 120000/599999/600001/fractional v2 durations, every other operation drift, malformed documents, crossed roots and version swaps. |
| 2 | Legacy allocation V1 and prospective-v1 retain their 120000-ms meanings; ordinary factory/planner defaults, diagnostic-v4 and planner benchmark semantics remain unchanged. | VERIFIED | Legacy cap remains at `allocation.ts:46`; original prospective policy remains 120000 at `:111`. Factory default/cap is 120000, separately 240000 under v4 (`factory-supervised-runtime.ts:42-48`); planner default is 120000 and benchmark ceiling remains 3600000 with observer/2200 prerequisites (`planner-supervised-runtime.ts:64-73`). Actual allocation, factory diagnostic/default, and planner benchmark/retired-option tests assert these distinctions. The cumulative diff does not raise ordinary scalar limits. |
| 3 | Both private provider clocks receive the exact admitted prospective duration through existing allocation, retained charged Match start and provider provenance; a scalar or forged/crossed authority cannot select it. | VERIFIED | Helper `:27-56` strictly re-admits v2, binds retained charge/Match/seat/attempt/source/executable/authorization/tuple/runtime/image/container identities, and issues a nonserializable WeakMap handle. Factory/planner claims are independent, once-only and ordered factory-first; both require exactly 600000. Factory `:60` denies inherited empirical overrides before source access; `:81-101` starts before nested setup and checks pre/post invoke. Planner `:99-121` starts before session setup and checks elapsed lifetime before invoke. Named factory mock-clock tests at `:79-127` exercise crossed/copied/reused claims, setup, exact expiry/cleanup and awaited retention preventing the next call; planner `:61-79` exercises 599999/600000 and reuse. Passing evidence is the existing fixed-source gate and root-observed planner check, not a new verifier run. |
| 4 | Main league and response providers, capacity admission, reservation and retained readers select the same policy version and exact allocation/implementation/source roots. | VERIFIED | Main issuance follows durable journal plus graph `cell-start` (`runner:465-482`); response follows returned `response-match-start` (`response-runtime:182-205`). Both seats have distinct handles, including self-play; measured response attempt remains the red-team start and opponent remains chargeRoot. Version-aware selectors/capacity/reservation/readers and tactical authoring closure are traced below. Tests exercise actual main and response call sites, not just issuance in isolation. Current manifest derivation matches the final roots and includes every changed production file plus tactical/authoring dependencies. |
| 5 | Mock-clock code acceptance and independently reviewed fixed source are distinct from later empirical completion; no source check awards LEAG or freeze credit. | VERIFIED | Actual source gate wrapper derives only the eight unchanged CI source commands and publishes source-only completion. Current validation stays partial/Nyquist false; all LEAG-01–09 remain unchecked. Review-v2 is clean on final source; earlier summary and coverage pending statements are historical snapshots resolved by current gate evidence, not retroactively rewritten. Approval preserves consumed v9 failure and conditions any distinct route on fresh allocation/capacity. |

**Score: 5/5 source truths verified.** No source truth is absent, stubbed, unwired or left behavior-unexercised within this mock/source acceptance scope. Real host/league completion is deliberately not asserted.

## Three-task acceptance

| Task | Result | Evidence and limits |
|---|---|---|
| T1 — failing mock regressions | VERIFIED | Actual tests cover exact policy, historical meanings, nested claims, clocks, main/response provenance and source inventory. Recorded genuine RED98481 and later defect-restoration RED72814 are historical root/fixer observations; no mutation or RED rerun was performed here. Current named assertions are present in passing fixed-source suites. |
| T2 — exact admission/nested clocks | VERIFIED | Allocation/helper/factory/planner substantive code and downstream calls agree on exact v2/600000. No scalar authority, copied handle, planner-first claim or inherited empirical constructor escape. Source-preserved v4 and benchmark regressions are present. |
| T3 — selectors/root joins/gates/handoff | VERIFIED | All listed selectors, actual main/response construction, tactical producer/retained closure and conservative source inventory are connected. Clean review-v2, exclusive complete eight-command marker and root-observed scoped checks close source acceptance. No empirical work is credited. |

## Artifacts: existence, substance and wiring

The cumulative source/test diff from `47ad3650..bb98878e` contains exactly 13 files, 538 additions/42 deletions. Independent byte comparison found zero worktree mismatches against `bb98878e`; diff whitespace check passes.

| Artifact(s) | Substance and connection | Result |
|---|---|---|
| `packages/strategy-lab/src/league/allocation.ts` / `allocation.test.ts` | Exact versioned admission, union dispatch, producer and capacity validation; imported by runner/helper/response/authoring; exact-value and crossed-version/capacity assertions. | VERIFIED |
| `scripts/lib/v1-38-league-prospective-lifetime.ts` | Real issued-binding state, charge/runtime validation, distinct claim state and duplicate-provider denial; imported/called by both hosts and both supervisors. | VERIFIED |
| `scripts/lib/v1-38-factory-supervised-runtime.ts` / `.test.ts` | Admission before nested runtime creation; same authority threaded into planner; elapsed pre/post checks and cleanup; inherited empirical override and once-only/mock-clock tests. | VERIFIED |
| `scripts/lib/v1-38-planner-supervised-runtime.ts` / `.test.ts` | Real identity/revision admission, exact nested claim and elapsed session clock; synthetic-transport expiry and historical benchmark/diagnostic tests. | VERIFIED |
| `scripts/run-v1-38-serious-league.ts` / `.test.ts` | Complete preparation/capacity/reservation/dispatch/read-only retained composition; test `:531` reads actual retained charge before both providers and `:39/:48` checks source preparation/inventory. | VERIFIED |
| `scripts/lib/v1-38-league-response-runtime.ts` / `.test.ts` | Actual returned Match charge drives both constructor options/handles; retained response identity checks at `:331-348`; integration test `:144-215` captures 18 providers across nine cells, both sides/all arms and refusal-zero-provider path. Separate 72-condition enumeration is retained. | VERIFIED |
| `scripts/lib/v1-38-league-tactical-corpus.ts` / `.test.ts` | Shared prospective predicate retains ordinals 0/3/6; actual authoring/retained test at `:72-111` checks profiled producer, 100 selected rows, source/profile/envelope and missing/crossed target/corpus/selection. | VERIFIED |

Level 4 dynamic-UI data tracing is not applicable: this supplement creates no rendering artifact. Its relevant data path was traced instead: admitted immutable allocation → retained charged start → actual factory admission/revision identity → issued handle → two claims; tactical retained matrix → rederived corpus/profile → authored packet/envelope → retained rederivation. These paths do not substitute hardcoded empty data for production evidence. Inert test records are explicitly fixture-only.

## Key links and selector closure

| Required link | Evidence | Result |
|---|---|---|
| Exact allocation policy/source roots → lifetime helper | Helper imports and invokes `admitProspectiveLeagueExecutionAllocationV2`, binds allocation budget and retained identities, stores allocation/amendment/implementation/source roots; real preparation/run reject stale source before issuance. | WIRED |
| Retained main/response charge → factory and planner admission | Runner retains journal+graph charge before issuance; response retains returned chargeRoot before either provider. Factory derives actual runtime binding, claims once, passes the same handle to planner; planner derives actual identity and claims once. Actual host-wiring tests and refusal/expiry negatives protect the connections. | WIRED |
| Conservative implementation manifest → current source and retained verification | `factory-implementation.ts:11-16` uses existing boundary inventory, sorted raw-byte hashes and original domains. Runner `:325-327` derives both roots and `:1017-1031` enforces current v2 roots/capacity/reservation. Read-only derivation independently returns 857 entries with exact expected roots, including tactical corpus and authoring. | WIRED |

Named selector audit:

- Initial candidate reader/qualification and matching-version preparation: runner `:286-338`; unknown amendment version fails rather than upgrades history.
- Preflight, observation/measurement and supplied-receipt admission: `:373-397`; static validation precedes measurement, supplied receipt is checked rather than refreshed.
- Session constructor and actual main provider: `:450-482`.
- Allocation-only exclusive reservation/start marker: `:593-605`; once-use key is allocation-rooted, never receipt-rooted; durable `wx`/sync behavior remains.
- Run static validation, capacity alternatives and dispatch/invocation guard: `:678-715` and existing graph/budget callbacks.
- Retained current v2 source/capacity/reservation/base/provider joins: `:1017-1031/:1067-1075`; no retroactive current-source restriction added to historical v1.
- Tactical runner formation/retained check: `:740-746/:1159-1164`; shared selector `tactical-corpus.ts:159` feeds actual authoring `authoring.ts:106-112/:183-190`.
- CLI prepare/preflight/run/retained/capacity alternatives: `:1251-1277`; legacy prepare remains legacy and retained mode rejects capacity options.

A production discriminator scan found only preserved v1 definitions/explicit admission branches and matching-version preparation, not another stale v1-only consumer.

## Behavioral evidence and completed gate

No tests, types, scans, probe, helper mode, provider, capacity observation, allocation, Match or retained verifier were launched by this verifier. The instructed bounded verification consumes the already completed unique gate instead of duplicating it. It independently inspects actual code, named test assertions, gate wrapper, completion bytes and current manifest; root/fixer observations are labelled separately.

| Evidence | Observed result | Basis |
|---|---|---|
| Exclusive eight-command gate43923 | `source_gate_passed`; all eight ordinals `[3,4,1,2,5,6,7,8]`; ended `2026-10-02T16:52:34.179Z`, elapsed 2236803 ms | Direct read of `.strategy-lab/phase265-lifetime-source-gate-v1-complete.json`; raw SHA `a03bb26f0dce863bb3aad30a4d5187c1ce2112c44e01ea3ed4a0c659e437460d`. Wrapper raw `8500db6bbedc65a11d60b2c1f30c98312a8da1ca9d68d9a8b140e3eeaee1506e` derives exactly eight unchanged CI commands, checks 13 source/test+CI pins and conservative roots before/after each command, and writes exclusive markers. |
| Actual gate test/build/types/scan counts | 493 league/factory/runtime tests; 20 tactical tests; build/strict types; three 1354-file scans with zero violations; service strict0/ownership0/report-only19 | Root-observed terminal outputs recorded in current SOURCE-GATE-v1 and validation. The completion marker establishes eight command successes, not independently encoded per-test counts. |
| Scoped entry36354 | 48 planner, 149 package-cwd engine, 277 package-cwd runtime-js tests pass; initial chain exits1 only at nonexistent `packages/core/tsconfig.json` | Root-observed outputs/report; not an entirely passing chain and no separate private proof marker is invented. |
| Corrected actual core build | `tsc -b packages/spec packages/engine packages/runtime-js --pretty false`, exit0; no source change | Root-observed chunk `a5a2f5`; report raw `120b171f2fb58722a878e27f37942cf6063c57dffa256b36f71acbc499b96c63`. This SHA hashes SOURCE-GATE-v1.md, not an extra-build marker. |
| Independent current-source check here | 857 production manifest entries; exact d6872b16/e64686c2 roots; 13 source/test bytes match final commit; no debt markers; diff-check pass | Read-only current manifest invocation, Git byte comparison and scoped text inspection. |

The named clock/claim/ordering regressions contain actual transition assertions; they are not upgraded on mere symbol presence. Root's existing passing source tests, including the separately observed full planner suite, supply behavioral evidence within the approved mock scope. No additional named rerun is warranted or authorized here. No shell probe is declared by this supplement; source-only gate evidence is not empirical replay.

## Prohibitions and unchanged boundaries

The PLAN supplies four plain-language prohibitions, not structured test/judgment-tier items. Each was checked as a bounded source/execution restriction, without inventing formal enforcement or a new human checkpoint.

| Prohibition | Bounded finding |
|---|---|
| No consumed route/allocation/diagnostic/result/authority/unique verifier mutation, resume, retry, refund, rerun or credit | VERIFIED in submitted diff and this verification: no consumed evidence path changes; historical v1 semantics and allocation-only once-use reservation remain. V9 stays five charged/four successes/one lifetime failure, process-invalid. No historical reader/run was invoked here. |
| No empirical allocation, capacity, provider, model, Match or retained-verifier launch by supplement executor | VERIFIED for the source-only evidence under review and this verifier's actions: gate derives only existing source commands; tests use admitted injected fixtures and inert records. Executor/fixer reports explicitly disclose source-only observations. This is not a universal machine/process attestation. |
| No other bound, rule, guest timeout, durability, privacy, holdout or formation change | VERIFIED: exact v2 policy differs only in elapsed ceiling; retained v1 projection checks every other field. No engine/runtime-js source rule changes in 13-file diff; 1000-ms guest timeout, 24800 invocation limit, 96-hour/18-hour limits, 2cpu-256m/cache-off and existing source/output/memory/retention/capacity/cleanup contracts remain. Awaited retention still precedes return/next invocation. |
| No repeat authorization literal, external custody/signing/product certification/new numbered plan | VERIFIED: new approval reference is an exact data field, not another interactive literal. No new persisted lifetime token/signature/endpoints/dependency or numbered plan was added. This report does not create any such obligation. |

No `TBD`, `FIXME`, `XXX`, `TODO`, `HACK` or `PLACEHOLDER` occurs in the 13 changed files. No production stub/hollow data path found. CR-01 tactical selection, CR-02 inherited empirical constructor, and WR-01 actual-response test wiring are substantively corrected in current code; generic earlier fix labels do not create another human-only checkpoint. No new BLOCKER or WARNING identified.

## Requirements, roadmap and remaining work

| Contract | Source result | Empirical status |
|---|---|---|
| LEAG-01/02 | Complete-matrix/charged fail-closed machinery preserved; versioned lifetime does not impute failures | NOT COMPLETED |
| LEAG-04/09 | Both response seats/arms and tactical producer/retained joins preserved | NOT COMPLETED |
| LEAG-05 | Source/version-qualified readers and source-versus-result distinction preserved | NOT COMPLETED |
| LEAG-03/06/07/08 | No solver/diversity/portfolio/finalist-policy change; owned by existing other Phase265 plans, not orphaned supplement scope | NOT COMPLETED |
| Roadmap SC1–SC5 | All five whole-phase criteria remain non-negotiable; supplement does not reduce or satisfy the missing complete matrix, full response/red-team campaign, inspectable complete report or portfolio/finalist evidence | PHASE GOAL INCOMPLETE |

No source gap was deferred to Phase266 or later. Phase266's real freeze requires complete independently verified Phase265 evidence; later formation/holdout work cannot absorb missing current empirical results. No human-verification item is introduced by this bounded source supplement, and absence of whole-league evidence is not relabelled as a human-only checkpoint.

Standing approval permits conditional preparation of a distinct fresh same-scope route only after its remaining technical prerequisites: reviewed helper/request preparation, new immutable exact v2 allocation and fresh passing same-process capacity before charge/dispatch. V10 helpers are currently inert; this verification starts no mode. Hold source fixed through future terminal and its one unique retained verification; preserve every consumed allocation/result/verifier and keep holdout unopened and formation behind the current freeze. No public, counted or production authority follows.

Only this report was created; no source edit, commit, broad staging, history replacement or shared phase-state mutation was performed. A local Write tool is unavailable, so the available patch tool created the report without shell writes.

_Verifier: bounded goal-backward source-supplement verification; no commit._
