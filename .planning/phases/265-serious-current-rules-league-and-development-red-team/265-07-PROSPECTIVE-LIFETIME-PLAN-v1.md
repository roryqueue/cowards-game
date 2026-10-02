---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
type: execute
wave: 1
depends_on: [265-07]
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-04, LEAG-05, LEAG-09]
files_modified:
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - scripts/lib/v1-38-league-prospective-lifetime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
must_haves:
  truths:
    - "A separately rooted prospective-v2 private allocation admits exactly 600000 ms per Match and differs from the approved prospective-v1 resource policy only in that elapsed ceiling."
    - "Legacy allocation V1 and prospective-v1 retain their 120000-ms meanings; ordinary factory/planner defaults, diagnostic-v4 and planner benchmark semantics remain unchanged."
    - "Both private provider clocks receive the exact admitted prospective duration through existing allocation, retained charged Match start and provider provenance; a scalar or forged/crossed authority cannot select it."
    - "Main league and response providers, capacity admission, reservation and retained readers select the same policy version and exact allocation/implementation/source roots."
    - "Mock-clock code acceptance and independently reviewed fixed source are distinct from later empirical completion; no source check awards LEAG or freeze credit."
  artifacts:
    - path: packages/strategy-lab/src/league/allocation.ts
      provides: separate exact prospective-v2 policy, amendment and allocation admission; version-aware capacity admission
    - path: scripts/lib/v1-38-league-prospective-lifetime.ts
      provides: narrow private allocation/start/provider-bound lifetime authority shared by both supervisors
    - path: scripts/lib/v1-38-factory-supervised-runtime.ts
      provides: exact prospective duration admission and enclosing elapsed clock
    - path: scripts/lib/v1-38-planner-supervised-runtime.ts
      provides: same prospective duration on the nested elapsed clock without benchmark reinterpretation
    - path: scripts/run-v1-38-serious-league.ts
      provides: explicit prospective version selection across preparation, capacity, reservation, execution and bounded retained verification
    - path: scripts/lib/v1-38-league-response-runtime.ts
      provides: retained response Match charge/provider authority joins for both seats
  key_links:
    - from: packages/strategy-lab/src/league/allocation.ts
      to: scripts/lib/v1-38-league-prospective-lifetime.ts
      via: exact admitted prospective-v2 amendment/allocation policy and source roots
    - from: retained cell-start or response-match-start
      to: factory and planner lifetime admission
      via: existing charged Match identity plus distinct provider/source/attempt binding
    - from: scripts/v1-38-factory-implementation.ts
      to: leagueCurrentSourceIdentity and retained verification
      via: complete conservative production-source inventory including the shared helper and both runtime call sites
  prohibitions:
    - "No consumed route, allocation, diagnostic, result, authority or unique retained verification is mutated, resumed, retried, refunded, rerun or credited."
    - "No empirical allocation, capacity measurement, provider, model, Match or retained verifier is launched by this source supplement executor."
    - "No other bound, game rule, guest timeout, durability barrier, private/public boundary, holdout or formation gate changes."
    - "No repeat authorization literal, external custody chain, signing ceremony, product certification or new numbered plan/count is introduced."
---

<objective>
Implement only the human-approved prospective private per-Match elapsed lifetime increase from 120000 to 600000 milliseconds in the existing Plan 265-07 path, including both factory/planner clocks and applicable admission, per D-01, D-02, D-04, D-05 and D-06.

Purpose: allow a distinct, reviewed private route to use the approved ceiling without changing historical evidence or unrelated policies. Output: code-only tested versioned admission and wiring, followed by source-bound validation/review and a handoff to the main orchestrator. This is a bounded supplement to Plan 07, not an additional numbered plan or a phase/count change.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-LIFETIME-APPROVAL-20261002.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PROSPECTIVE-LIFETIME-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-LEAGUE-APPROVAL-20261001.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-LIFETIME-ACCOUNTING-NOTE-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-EMPIRICAL-RESULT-v9.md
@.github/workflows/ci.yml

<interfaces>
Current source a98b5c2be9410b63e944143e1b0b693fc5c303bf may be amended: no entry or retained verifier is active. V9 and every earlier consumed route remain immutable history, not authority for a new run.

The legacy createAllocationV1Shape cap is 120000; prospective-v1 uses that shape with the three-base minimum and exact LEAGUE_APPROVED_PROSPECTIVE_POLICY equality. Factory lifetime defaults to 120000, with a separate diagnostic-v4 grant allowing 240000. Planner defaults to 120000 but its existing scalar admission has a 3600000 ceiling and benchmarkLifetimeMs has its own observer/2200-invocation prerequisites. Preserve these facts; do not apply a new ordinary 120000 maximum to the planner or describe its benchmark scalar as prospective authority.

The existing main Match charge is start = {cellRoot, allocationRoot, root}, persisted by recordLeagueCellStart and retained as cell-start before provider construction. Its Match ID derives from start.root. Response execution retains response-match-start with matchCharge and chargeRoot before either provider; Match ID derives from chargeRoot. Its measured provider attemptRoot is the existing red-team start; its opposing provider attemptRoot is chargeRoot. Neither is a substitute for the per-Match charge. Preserve those identities, including two distinct seats in self-play.

Root order stays final reviewed source bytes → implementation/source roots → versioned amendment/policy root → allocation root → capacity receipt/start observation → durable allocation reservation → charged Match/provider. No receipt-root cycle, mutable latest, or rebuilt historical policy root. scripts/v1-38-factory-implementation.ts uses the conservative boundary inventory; a new scripts/lib helper must be included naturally, not exempted. Reuse existing identity/provenance structures and retention roots; do not introduce a separately signed, externally witnessed or serialized lifetime-token artifact.
</interfaces>
</context>

## Scope and dependencies

Discovery level 0: local research and the current source establish every changed branch; no package, library or external integration is added. Tasks execute serially inside this supplement: failing mock regressions → implementation → wiring/green validation/review. Wave 1 is the supplement-local wave; depends_on references the existing Plan 07 source foundation, not a new phase wave or numbered-plan entry. Existing Plan 07's other tasks and phase decision coverage remain intact.

Only the per-Match elapsed ceiling changes. Retain 96 hours overall, 18 hours per attempt, 24800 provider invocations, 1000-ms guest per-method timeout, 2cpu-256m/cache disabled, runtime/image/source/output/objective/StrategyMemory/SoldierMemory bounds, eleven attempts/zero retries, every opportunity/channel/schedule/probe/finalist/selection value, all ordinary/terminal retention bounds, sync barriers, capacity margins/cadence and owned cleanup. Setup and awaited retention/between-invocation time continue to consume elapsed lifetime; this is not a guest-compute increase or a resetting timer.

<tasks>
<task type="auto" tdd="true">
<name>Task 1: Establish failing code-only prospective lifetime regressions</name>
<files>packages/strategy-lab/src/league/allocation.test.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts, scripts/run-v1-38-serious-league.test.ts, scripts/lib/v1-38-league-response-runtime.test.ts</files>
<read_first>packages/strategy-lab/src/league/allocation.ts; all five files in files; scripts/lib/v1-38-factory-supervised-runtime.ts; scripts/lib/v1-38-planner-supervised-runtime.ts; scripts/run-v1-38-serious-league.ts; scripts/lib/v1-38-league-response-runtime.ts (including wrapLeagueProbeProvider); scripts/v1-38-factory-implementation.ts; packages/strategy-lab/src/league/connected-runner.ts; packages/strategy-lab/src/league/repository.ts; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PROSPECTIVE-LIFETIME-RESEARCH-v1.md</read_first>
<behavior>
- Test groups named "prospective lifetime" are all injected/mock-only: provider/session constructors, host observations and durable writers are stubbed; no Docker, Strategy source execution, real host capacity or empirical route runs.
- Legacy allocation accepts 120000 and rejects 120001; prospective-v1 remains exact120000 with unchanged roots for unchanged documents. Prospective-v2 admits only exact600000; 120000/599999/600001, non-integers, unknown versions, partial/extra fields, any other vector drift and mismatched source/implementation/amendment roots fail closed.
- Defaults remain120000 in both supervisors. Existing valid diagnostic-v4 and planner benchmark cases retain their behavior, including the benchmark3600000 endpoint and its existing prerequisites. A benchmark scalar is not a private league authority; factory still rejects benchmark injection. Mixed prospective/diagnostic/benchmark options fail only on the new prospective branch.
- Missing, altered, structurally forged, wrong-version/allocation/start/Match/seat/source/attempt and reused provider authority is rejected before mocked runtime/session creation. The same correct private authority is checked once at each nested boundary, not treated as two reusable provider grants.
- Mock clocks show both admitted durations are600000, setup time counts, exact boundary expiry cleans up, and factory pre/post-invoke checks still apply. Awaited retention crossing the boundary prevents the next call; there is no timer reset or uncharged retention bypass. Planner ordinary/diagnostic/benchmark checking behavior stays unchanged.
- Main cell and response score/independence-arm providers join the existing retained per-Match charge and both distinct provider identities. Response measured attemptRoot remains its red-team start; opponent attemptRoot remains chargeRoot, including self-play.
- Injected prepare/capacity/run/reservation/retained reader cases select v2 explicitly; version-swapping, crossed roots, stale reviewed bytes, missing capacity/reservation and wrong retained charge roots fail. Legacy/v1 evidence is not silently reclassified as v2. Source inventory contains every changed production file/helper, and changing any of those bytes changes the manifest/source root.
</behavior>
<action>Extend the five existing suites with the above focused cases, reusing current fixtures, source-only host seams and fake monotonic clocks per D-01, D-02, D-04 and D-05. Create test expectations for the separate policy/schema exports and helper interfaces named in Task 2 before implementation. Keep all mocks inside test files and verify constructor/dispatch counters stay zero on each rejected authority. Do not import a real provider, run the empirical CLI, measure capacity or create an empirical allocation. Run only the named focused groups and record expected RED failures from the missing prospective path; do not suppress unrelated failures or treat RED as source acceptance.</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'prospective lifetime'</automated></verify>
<acceptance_criteria>The named cases are collected and intentionally fail on absent prospective support, with zero real providers/Matches/host observations. Existing v1/default/diagnostic/benchmark expectations are represented explicitly, not inferred from the new ceiling.</acceptance_criteria>
<done>Mock-only RED regression coverage exists for the exact policy, both clocks, charge/provider joins, root selectors and source closure; Tasks 2–3 must make it GREEN.</done>
</task>

<task type="auto" tdd="true">
<name>Task 2: Implement exact versioned allocation and narrow private nested-clock authority</name>
<files>packages/strategy-lab/src/league/allocation.ts, scripts/lib/v1-38-league-prospective-lifetime.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.ts</files>
<read_first>.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-LIFETIME-APPROVAL-20261002.md; packages/strategy-lab/src/league/allocation.ts; packages/strategy-lab/src/contracts.ts; packages/strategy-lab/src/factory/admission.ts; packages/strategy-lab/src/runtime-bridge.ts; scripts/lib/v1-38-factory-supervised-runtime.ts; scripts/lib/v1-38-planner-supervised-runtime.ts; Task 1 test cases</read_first>
<behavior>The exact prospective policy changes only perMatchMilliseconds; factory and planner admit600000 only through the private allocation/charged-start/provider authority. Existing versioned roots and ordinary/benchmark/diagnostic contracts retain their meanings.</behavior>
<action>Add LEAGUE_APPROVED_PROSPECTIVE_POLICY_V2, LeagueProspectiveAmendmentV2/ProspectiveLeagueExecutionAllocationV2 and separate create/admitLeagueProspectiveAmendmentV2 and create/admitProspectiveLeagueExecutionAllocationV2 exports. Use exact discriminators league-prospective-measurement-amendment-v2 and league-prospective-execution-allocation-v2 with matching domain-separated roots. Preserve existing exports and discriminators. The successor policy copies every current frozen field except operations.perMatchMilliseconds, exactly600000; exact policy equality is mandatory, not a general ceiling. Bind the new amendment to the existing06cdb050 baseline decision and the recorded20261002 lifetime approval by a new exact lifetimeApproval field referencing265-PROSPECTIVE-LIFETIME-APPROVAL-20261002, not a new interactive literal. Keep historical assessment/base pins and final gates unchanged. Factor shared shape checks only if legacy/v1 root bytes, exact keys, numeric cap and rejection semantics stay identical; select the new admitted exact policy through an explicit version path rather than raising createAllocationV1Shape's default cap. Extend the admitted-allocation union/reader and prospective type predicate deliberately. Reject unknown versions. Update assertProspectiveLeagueProducerRequest and capacity-plan/receipt/cost admission to re-admit the matching prospective version; retain the capacity receipt schema/formula and every margin/floor/value. A v1 receipt never binds a v2 allocation just because its numeric costs agree.

In the new private scripts/lib helper define ProspectiveLeagueLifetimeAuthority, issueProspectiveLeagueLifetimeAuthority and claimProspectiveLeagueLifetimeAuthority. Issue only through the existing private charged-Match host closure after exact v2 allocation admission and successful retention of its start. Reuse allocation/amendment/implementation/source roots plus the existing retained start root, Match ID, seat/provider identity, factory authorization/packet/proposal/validation/source/executable roots, budgetRoot, attemptRoot, tuple/runtime/image binding and exact600000 duration. Keep the authority an internal process-local handle tied to this retained provenance; a copied object is not issuance. A small private WeakMap records the issued binding and independent factory/planner claims for that provider; each layer claims once, and later construction, crossed start/source/seat or a forged handle fails before construction. This is internal provenance validation, not a new persisted token, signature, external custody system or user ceremony. Do not change existing FactorySupervisionProvider/LabRuntimeIdentity roots merely to add another copy of the policy.

Add optional prospectiveLifetimeAuthority/prospectiveLifetimeMs private options to both supervisors. The new branch requires both options and exactly600000, claims against the actual selected factory/runtime identity and passes the same handle/duration to the planner. Reject mixed prospective and diagnostic/benchmark/observer options on this branch; leave ordinary constructor/test seams and existing policies untouched. FactoryLifetimeMs must equal the granted duration when supplied; numbers alone never issue authority. Empirical authority cannot be used with synthetic transport/session/provider overrides. Preserve fixture-only mock seams without exporting them into the real route. Keep factory began before nested runtime creation and its pre/post-invoke checks; keep planner began before session setup and its current checking behavior. Do not change the planner's existing3600000 benchmark scalar ceiling, observer/2200 requirements, diagnostic-v4 claims, retired-option denial, guest limits, cleanup or failure classification. Per D-03 and D-06, no engine or game-rule change is permitted.</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts -t 'prospective lifetime'</automated></verify>
<acceptance_criteria>Allocation and supervisor mock groups are GREEN; exact600000 requires the admitted v2 provenance at both layers before session creation. Unchanged policy documents retain their prior roots/admission and benchmark/diagnostic behavior. No resource other than the approved private elapsed ceiling differs.</acceptance_criteria>
<done>Versioned exact admission and both private clocks are ready for existing main/response host wiring; this task does not create a live allocation or prove empirical success.</done>
</task>

<task type="auto" tdd="true">
<name>Task 3: Close every private selector, source join and retained path; validate and hand off</name>
<files>scripts/run-v1-38-serious-league.ts, scripts/lib/v1-38-league-response-runtime.ts, scripts/run-v1-38-serious-league.test.ts, scripts/lib/v1-38-league-response-runtime.test.ts</files>
<read_first>scripts/run-v1-38-serious-league.ts; scripts/lib/v1-38-league-response-runtime.ts (including wrapLeagueProbeProvider); scripts/v1-38-factory-implementation.ts; scripts/check-v1-38-lab-boundaries.ts; scripts/check-v1-38-serious-league-boundaries.ts; .github/workflows/ci.yml; Task 1 root/selector tests; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md</read_first>
<behavior>Every prospective selector is version-aware and fail-closed, source closure includes all changed production bytes, and both main/response providers use their actual retained start and distinct provider identity. Bounded retained reads re-admit the same roots without dispatching or upgrading history.</behavior>
<action>Wire the helper inside LeagueConnectedSession.execute only after recordLeagueCellStart and graph cell-start retention complete; derive authority for each provider from that exact start, Match ID and existing factory request, then pass it and600000 to the factory only for admitted prospective-v2. In produceLeagueResponse do the equivalent after response-match-start returns chargeRoot, for measured and opposing providers in score, independence_left and independence_right arms. Retain existing attemptRoot distinctions instead of conflating the measured authoring start with the Match charge. Authority validation must cover the charge root for both seats, including self-play. Keep wrapLeagueProbeProvider's awaited durable invocation write, failure-prefix settlement, terminal and cleanup paths unchanged per D-01 through D-05.

Replace explicit prospective-v1-only selectors with the strict admitted prospective predicate where both versions are intended; use an explicit v2 creator when constructing the successor. Cover all these concrete branches: readLeagueInitialCandidates; validateProspectiveLeagueInitialCandidates; prepareProspectiveSeriousLeague; preflightProspectiveSeriousLeague; observe/measureProspectiveCapacity; prospectiveRunCapacity; LeagueConnectedSession construction; prepareLeagueRunInputs; runReservation/runMarker/reserveRun; runSeriousLeague capacity measurement and per-dispatch guard; verifyRetainedSeriousLeague capacity/reservation/base checks; CLI prepare-prospective/preflight/run/verify-retained and capacityInput versus capacityReceipt alternatives. Preserve command meanings: prepare stays legacy; prepare-prospective dispatches explicitly on the amendment discriminator to the matching creator, rejects ambiguity/unknown versions, and does not silently upgrade a supplied historical input. Preserve allocation-only once-use reservation, receipt and start-observation retention, same-process measurement after static validation and before reservation/charge, no refresh of supplied receipts, read-only retained mode and current reviewed source checks. Generalize strict prospective allocation types in response/authoring consumers only through the shared union; do not disable prospective producer assertions or source checks.

Add retained v2 root joins for the existing allocation/amendment/policy, current implementation/source closure, capacity receipt/reservation and charged main/response provider identities. Reuse current bounded journal/graph and cleanup readers; do not add an authority-token journal. Reject wrong version, duration, changed current source or crossed start identities; preserve v1/history meanings without accepting old v1 work as a v2 result. The root manifest remains factoryAssessmentImplementationManifest → leagueCurrentSourceIdentity; assert the inventory covers allocation, helper, factory, planner, runner, response, and all transitive production dependencies, with exact byte roots. Keep its existing conservative scan semantics, canonical sorting and historical domains; no exclusion or hard-coded new root pin.

Run the focused mock groups GREEN, touched script/lab types and boundary scans. Then run all eight existing commands verbatim from the Phase265 private league source-gate block of .github/workflows/ci.yml, plus planner mock suite, package-scoped engine/runtime-js tests and spec/engine/runtime-js build. Record command exits against one fixed new source/implementation/source-root snapshot, without stale test-count assertions. These full source gates can exceed60seconds: root launches/retains one unique gate and reports progress; do not duplicate a running or completed identical-source gate. Obtain independent source review of the fixed diff, exact root joins and all unchanged bounds; apply bounded findings and revalidate affected/new-source gates before acceptance. No package install, certification, release tag or broadened custody work is needed.

Stop at source-only handoff. The main orchestrator alone may subsequently prepare a distinct freshv10 route under standing approval: reviewed fixed source and applicable passing gates → reviewed fresh requests if required → new immutable exact v2 allocation → fresh passing same-process capacity → root-controlled dispatch → terminal and one unique retained verification at fixed source. No repeat literal is needed; none of those empirical steps is an executor action in this supplement. Any capacity/integrity/cleanup failure stops the route without reuse/refund; hold source fixed through live terminal and unique retained verification, with no competing CPU-heavy work. Source acceptance alone supplies no LEAG, freeze, holdout, formation, public, counted or production credit. Preserve all D-07 through D-21 gates without altering solver, population, matrices, response loop, portfolio, selection or claims.</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'prospective lifetime' &amp;&amp; ./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-league-prospective-lifetime.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-serious-league.ts scripts/lib/v1-38-league-response-runtime.ts</automated></verify>
<acceptance_criteria>All mock regressions, touched types, full unchanged source gates and independent exact-source review pass. Every named selector retains strict version/root joins. Handoff identifies fixed source/implementation/source roots and pending empirical prerequisites, not a fabricated capacity receipt or league result.</acceptance_criteria>
<done>The source-only supplement is accepted and the main orchestrator can conditionally prepare a distinct route; no empirical execution or LEAG/freeze completion has occurred in this executor.</done>
</task>
</tasks>

## Multi-source coverage audit

| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Complete independently attacked current-rules game with honest bounded portfolio/robust-pure result | Existing Plans01–07 retain empirical completion responsibility; supplement Tasks1–3 change only prospective elapsed admission and handoff | COVERED, empirical pending |
| REQ | LEAG-01, LEAG-02 | Tasks1–3 preserve full matrix/charged fail-closed terminals and source-bound retained reads; existing Plans01–03 supply matrix behavior | COVERED |
| REQ | LEAG-03 | Existing Plan04 deterministic solver unchanged; no solver amendment | COVERED by existing plan |
| REQ | LEAG-04, LEAG-09 | Task3 wires both response providers and all prospective producer/capacity checks; existing Plans06–07 retain complete response/red-team gates | COVERED |
| REQ | LEAG-05 | Task3 preserves exact qualified private roots and source-versus-empirical distinction; existing Plans05–07 supply report | COVERED |
| REQ | LEAG-06, LEAG-07, LEAG-08 | Existing Plan05 selection/portfolio/finalist gates unchanged | COVERED by existing plan |
| RESEARCH | Exact successor policy, legacy cap, distinct diagnostic/benchmark semantics | Tasks1–2 | COVERED |
| RESEARCH | Both clocks, setup/retention elapsed interval, crossed/forged authority denial | Tasks1–3 using existing provenance, not external token ceremony | COVERED |
| RESEARCH | All selectors, source closure, capacity and bounded retained joins | Tasks1–3 and explicit Task3 selector list | COVERED |
| CONTEXT | D-01, D-02, D-03, D-04, D-05, D-06 | Tasks1–3 immutable fail-closed charged private full-kernel supervised boundary | COVERED |
| CONTEXT | D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15 | Existing Plans01–04/06–07 preserved; Task3 makes no matrix/solver/response gate change | COVERED |
| CONTEXT | D-16, D-17, D-18, D-19, D-20, D-21 | Existing Plans05–07 preserved; Task3 no portfolio/finalist/probe/claims relaxation | COVERED |
| APPROVAL | 20261002 exact600000 plus standing fresh-route approval | Tasks1–3; conditional route remains main-orchestrator work | COVERED |

Deferred formation, holdout, rule experiments and product certification remain excluded. No source-audit gap is concealed by the supplement; empirical requirements remain pending until actual eligible complete evidence exists.

<threat_model>
## Trust boundaries

| Boundary | Description |
|---|---|
| Versioned allocation → private provider construction | Untrusted documents/scalars must not authorize a new elapsed ceiling. |
| Retained charged Match/provider identity → nested factory/planner | Crossed source, seat, attempt or start must not acquire another provider's authority. |
| Source/capacity/reservation → retained verification | Stale source or consumed allocation must not become prospective-v2 evidence. |

## STRIDE threat register

| Threat ID | Category | Component | Severity | Disposition | Mitigation plan |
|---|---|---|---|---|---|
| T-265-LT-01 | Spoofing/Elevation | scalar or forged lifetime authority | high | mitigate | Tasks1–2 exact version/policy and private issued-handle provenance; both layer claims before construction. |
| T-265-LT-02 | Tampering | crossed allocation/start/source/seat | high | mitigate | Tasks1–3 bind existing charged Match and actual selected provider identity; duplicate/crossed claims fail. |
| T-265-LT-03 | Denial of service | elapsed ceiling drift or timer reset | high | mitigate | Tasks1–2 exact600000, preserved setup/retention interval, guest/invocation/wall/cleanup limits and boundary expiry. |
| T-265-LT-04 | Repudiation/Tampering | stale roots or history reinterpretation | high | mitigate | Task3 strict versioned source/capacity/reservation/retained joins, immutable charged history and source-bound gates. |
| T-265-LT-05 | Information disclosure | public or synthetic authority leakage | high | mitigate | Private helper/source inventory plus existing lab/factory/league/service scans; no public export/promotion or source payload change. |
| T-265-SC | Tampering | package installs | high | mitigate | No installation or new dependency is planned. |
</threat_model>

<verification>
Mock-only admission and clock tests must pass before source acceptance. Complete unchanged Plan07/CI source gates, touched runtime types, package-scoped engine/runtime regressions and independent fixed-source review are mandatory before a fresh route. Do not interpret local synthetic starts/capacity contexts as observed host measurements. No empirical provider, Match, allocation, capacity measurement or retained verifier is part of executing this supplement.
</verification>
<success_criteria>
Only prospective private elapsed lifetime changes to exactly600000; both clocks and all applicable selectors enforce that exact reviewed version and provenance. Legacy/v1, diagnostic and benchmark meanings, all other bounds and historical bytes remain intact. Source acceptance is documented honestly; freshv10 execution and actual LEAG/freeze completion remain separate conditional root work.
</success_criteria>
<output>
Return source-only acceptance, exact changed-file/source/implementation roots, gate/review results and any blocker to the main orchestrator. Do not overwrite existing265-07-SUMMARY.md or any consumed empirical proof. The root records/commits the bounded handoff and decides conditional fresh route progression; no phase/plan counts change.
</output>
