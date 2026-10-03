---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
type: execute
wave: 5
depends_on: [265-04, 265-05, 265-06]
files_modified:
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - scripts/lib/v1-38-league-prospective-lifetime.ts
  - scripts/lib/v1-38-league-host-receipt.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - .github/workflows/ci.yml
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-06, LEAG-07, LEAG-08, LEAG-09]
must_haves:
  truths:
    - "Only an exact, rooted prospective V3 allocation and its opaque one-use authority can grant a 5000 ms parent host-response wait; the guest execution budget remains 1000 ms."
    - "The active legacy adapter.execute -> runMethod(mode=legacy) path and the alternative V1.17 executeV117 -> runMethod(mode=v117) path both preserve their broker/request deadlines while using the authorized outer response wait."
    - "Main league and all response-provider purposes/seats derive authority only after their own durable charged start; retained readers select V3 explicitly without reclassifying V1/V2 history."
    - "Source-only tests, independent fixed-source review, the existing eight-command Phase 265 gate, and scoped goal-backward verification pass before handoff; LEAG-01 through LEAG-09 remain unfulfilled pending a complete empirical league."
  artifacts:
    - path: packages/strategy-lab/src/league/allocation.ts
      provides: "Exact prospective V3 policy, amendment/allocation constructors, admission, and union selectors"
      exports: [LEAGUE_APPROVED_PROSPECTIVE_POLICY_V3, createLeagueProspectiveAmendmentV3, admitLeagueProspectiveAmendmentV3, createProspectiveLeagueExecutionAllocationV3, admitProspectiveLeagueExecutionAllocationV3]
    - path: scripts/lib/v1-38-league-host-receipt.ts
      provides: "Process-local one-use host-response authority bound to allocation, retained start, provider, seat, and source identity"
      exports: [ProspectiveLeagueHostReceiptAuthority, issueProspectiveLeagueHostReceiptAuthority, claimProspectiveLeagueHostReceiptAuthority]
    - path: scripts/lib/v1-38-lean-container-match-session.ts
      provides: "Separated parent exchange wait and unchanged broker request deadline for legacy and V1.17 paths"
      contains: "execute(request) -> runMethod(request, \"legacy\"...)"
    - path: .github/workflows/ci.yml
      provides: "Existing Phase 265 source gate including host-receipt, planner, and legacy/V1.17 stream tests"
      contains: "scripts/lib/v1-38-lean-container-match-session.test.ts"
  key_links:
    - from: scripts/run-v1-38-serious-league.ts
      to: scripts/lib/v1-38-league-host-receipt.ts
      via: "durable cell-start retained before authority issue and provider construction"
      pattern: "issueProspectiveLeagueHostReceiptAuthority"
    - from: scripts/lib/v1-38-league-response-runtime.ts
      to: scripts/lib/v1-38-league-host-receipt.ts
      via: "response-match-start charge retained before each measured/opponent provider authority"
      pattern: "issueProspectiveLeagueHostReceiptAuthority"
    - from: scripts/lib/v1-38-lean-container-match-session.ts
      to: scripts/lib/v1-38-planner-supervised-runtime.ts
      via: "claimed authority changes only stream.exchange response wait; request timeout field stays fixed"
      pattern: "hostResponseReceiptMilliseconds"
    - from: packages/strategy-lab/src/league/allocation.ts
      to: retained allocation selectors in scripts/run-v1-38-serious-league.ts
      via: "explicit V3 admission, capacity, preparation, dispatch, and read-only retained joins"
      pattern: "admitProspectiveLeagueExecutionAllocationV3"
  prohibitions:
    - statement: "Do not change LEAG-01 through LEAG-09 evidence requirements or mark any fulfilled from source tests, a diagnostic, or a partial run."
      status: planned
      verification: "The fixed-source review and scoped validation report retain LEAG-01 through LEAG-09 as pending; no source-only result is recorded as empirical evidence."
    - statement: "Do not change the 1000 ms guest limit, the legacy broker q.timeoutMilliseconds, or V1.17 startup, method-wall, cancellation-grace, and aggregate broker deadlines."
      status: planned
      verification: "The focused legacy/V1.17 stream and planner tests assert those exact request and guest limits while separately testing the authorized host wait."
    - statement: "Do not change setup, cleanup, Match lifetime (600000 ms), overall run, CPU, memory, invocation, attempt, charge, retry, accounting, retention, capacity, game, privacy, holdout, or formation bounds."
      status: planned
      verification: "Allocation and runtime focused tests plus the clean fixed-source review confirm only the approved V3 host receipt field differs."
    - statement: "Do not accept a scalar, serialized/copyable object, legacy/default/public/production path, injected stream, or stale/crossed root as authority; do not turn host wait timeout into a guessed Strategy failure."
      status: planned
      verification: "Focused authority and runtime tests reject forged, copied, stale, crossed, and unauthorized grants and retain host wait expiry as transport/system failure."
    - statement: "Do not resume, retry, refund, replace, reinterpret, or recredit V11, its closed verifier, or any consumed allocation/result/diagnostic/authority/verifier."
      status: planned
      verification: "The independent source review and scoped validation appendix confirm this supplement performs no historical-route or consumed-evidence operation."
    - statement: "Do not create an allocation, run a provider/Match/model/Docker/capacity/verifier, open holdout, materialize formation, or claim Phase 265 completion in this supplement."
      status: planned
      verification: "The six-file mock-only tests, source-only CI gate, and scoped validation appendix contain no empirical dispatch or completion claim."
---

<objective>
Add the approved prospective private 5000 ms host response-receipt allowance to existing Plan 265-07 while preserving its 1000 ms guest execution limit and every other frozen bound.

Purpose: distinguish delayed host receipt from Strategy execution without changing runtime semantics or rewriting consumed evidence.
Output: exact prospective V3 allocation admission, opaque start/provider-bound authority, both active runtime routes, durable main/response wiring, retained-selector coverage, source-only tests, CI inclusion, independent review, and scoped source verification.
</objective>

<execution_context>
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-DECISION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PROSPECTIVE-LIFETIME-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PROSPECTIVE-LIFETIME-PLAN-v1.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@CowardsGame_Technical_Architecture_Spec_V1.md
@CowardsGameSpec_Full_Consolidated_v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-AI-SPEC.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PATTERNS.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-VALIDATION.md
@packages/strategy-lab/src/league/allocation.ts
@scripts/lib/v1-38-league-prospective-lifetime.ts
@scripts/lib/v1-38-lean-container-match-session.ts
@scripts/lib/v1-38-planner-supervised-runtime.ts
@scripts/lib/v1-38-factory-supervised-runtime.ts
@packages/runtime-js/src/candidate-subprocess-observation.ts
@scripts/run-v1-38-serious-league.ts
@scripts/lib/v1-38-league-response-runtime.ts
@.github/workflows/ci.yml
</context>

<integration_contract>
The two source-ownership lanes may be implemented independently against this exact shared contract, then joined by Task 3:

- Task 1 exports `LEAGUE_APPROVED_PROSPECTIVE_POLICY_V3`, `LeagueProspectiveAmendmentV3`, `ProspectiveLeagueExecutionAllocationV3`, `createLeagueProspectiveAmendmentV3`, `admitLeagueProspectiveAmendmentV3`, `createProspectiveLeagueExecutionAllocationV3`, `admitProspectiveLeagueExecutionAllocationV3`, and an explicit version-aware admitted-allocation selector. The only V3 policy delta from exact admitted prospective V2 is `hostResponseReceiptMilliseconds: 5000`; `operations.perMatchMilliseconds` remains exactly 600000 and every other policy value is exactly equal to V2.
- Task 2 exports `ProspectiveLeagueHostReceiptAuthority`, `issueProspectiveLeagueHostReceiptAuthority`, and `claimProspectiveLeagueHostReceiptAuthority` from the new private `scripts/lib/v1-38-league-host-receipt.ts`. The non-serializable WeakMap-issued capability binds V3 allocation/amendment/policy, implementation/source closure, exact retained charged start, Match, seat, attempt/provider/runtime identity, and a single use. It is issued only after durable `cell-start` or `response-match-start` retention; the main and every response provider (score, independence_left, independence_right; both seats/self-play) receive separately bound authority.
- Runtime propagation carries authority, never a caller-chosen numeric grant. At the trusted stream boundary, claim once and pass 5000 only as the parent `stream.exchange(..., { timeoutMilliseconds })` wait argument. Keep the serialized broker request's `timeoutMilliseconds` at its existing value: `1000` in legacy `adapter.execute`/`runMethod(mode="legacy")`, and the existing `startupTimeoutMs + guest.timeoutMs + cancellationGraceMilliseconds` in V1.17 `executeV117`/`runMethod(mode="v117")`. V1.17 `methodWallMilliseconds`, startup, cancellation, method timeout receipts, stream poisoning, frame checks, and cleanup are unchanged.
- An exact host wait expiry remains a transport/system failure with existing trusted `stream_exchange/wait_timeout` provenance; elapsed host wait alone never classifies Strategy timeout. Only the pre-existing authenticated guest timeout receipt may use its existing guest-timeout semantics. Invocation remains charged, immutable, no-retry/no-refund, and cleanup remains mandatory.
</integration_contract>

<tasks>

<task type="auto" tdd="true" wave="1">
<name>Task 1: Add exact prospective V3 allocation policy and selectors</name>
<files>packages/strategy-lab/src/league/allocation.ts, packages/strategy-lab/src/league/allocation.test.ts</files>
<read_first>packages/strategy-lab/src/league/allocation.ts; packages/strategy-lab/src/league/allocation.test.ts; scripts/lib/v1-38-league-prospective-lifetime.ts; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-RESEARCH-v1.md; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md</read_first>
<behavior>
- Legacy allocation V1 and consumed prospective V1/V2 admission retain exact schemas, roots, values, selectors, and rejection semantics.
- Prospective V3 accepts only the exact V2 policy plus a separately rooted `hostResponseReceiptMilliseconds: 5000`; its per-Match policy remains exactly 600000 ms.
- Missing/extra keys, 4999/5001, changed guest or any other bound, stale implementation/source, wrong amendment/approval/discriminator, structural coercion, or ambiguous version fail closed before selection, capacity, or provider construction.
</behavior>
<action>Per the human-approved host receipt decision (D-01, D-02, D-05, D-06), add exact V3 amendment/allocation schemas and constructors using the integration-contract export names. Preserve legacy, prospective V1, and existing prospective V2 meanings; do not widen shared numeric maxima or change default policy. Add `hostResponseReceiptMilliseconds: 5000` as the sole V3 policy difference while keeping `perMatchMilliseconds: 600000` and all other V2 fields exact. Root the new policy and amendment under distinct domains, bind the recorded approval, implementation/source roots and existing immutable allocation lineage, and make version selection explicit/fail-closed. Update shared admission unions only so V3 is accepted by named V3-aware private readers; do not silently upgrade inputs or reinterpret V1/V2. Add exact equality, boundary, missing/extra/partial, wrong-root/version, stale-root and legacy-preservation tests before implementation (RED), then make them pass (GREEN).</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts -t 'prospective host response receipt'</automated></verify>
<acceptance_criteria>Only V3 admits the exact 5000 ms host receipt field; V1/V2 and all other V3 policy values remain unchanged. Exact symbols/types are exported and covered by tests; no capacity receipt, allocation file, or provider is created.</acceptance_criteria>
<done>Allocation policy and selector contract is stable for runtime integration, with historical schemas and outputs byte/meaning-preserved.</done>
</task>

<task type="auto" tdd="true" wave="1">
<name>Task 2: Wire one-use host authority through active legacy and V1.17 runtime paths</name>
<files>scripts/lib/v1-38-league-host-receipt.ts, scripts/lib/v1-38-league-prospective-lifetime.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-container-match-session.test.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/run-v1-38-serious-league.ts, scripts/run-v1-38-serious-league.test.ts, scripts/lib/v1-38-league-response-runtime.ts, scripts/lib/v1-38-league-response-runtime.test.ts, .github/workflows/ci.yml</files>
<read_first>scripts/lib/v1-38-league-prospective-lifetime.ts; scripts/lib/v1-38-lean-container-match-session.ts; scripts/lib/v1-38-lean-container-match-session.test.ts; scripts/lib/v1-38-planner-supervised-runtime.ts; scripts/lib/v1-38-planner-supervised-runtime.test.ts; scripts/lib/v1-38-factory-supervised-runtime.ts; scripts/lib/v1-38-factory-supervised-runtime.test.ts; scripts/run-v1-38-serious-league.ts; scripts/run-v1-38-serious-league.test.ts; scripts/lib/v1-38-league-response-runtime.ts; scripts/lib/v1-38-league-response-runtime.test.ts; packages/runtime-js/src/candidate-subprocess-observation.ts; .github/workflows/ci.yml; Task 1 integration contract</read_first>
<behavior>
- The active legacy `adapter.execute` -> `runMethod(mode="legacy")` frame and broker deadline stay at 1000 ms while only an authorized outer stream wait is 5000 ms.
- The V1.17 `executeV117` -> `runMethod(mode="v117")` request preserves startup + 1000 ms method + existing cancellation-grace broker deadline; only its parent receipt wait receives authorized 5000 ms. Authenticated guest receipts and host wait failures retain distinct classifications.
- Authority is opaque, one-use, V3-only, bound after durable main/response charge to exact source/provider/start/seat/Match; copied, scalar-only, stale, crossed, reused, synthetic/injected, public/default, or V1/V2 attempts fail before runtime/session dispatch.
- Retained/preparation/capacity/run/reservation/main-response/verify-retained selectors explicitly admit V3 while preserving old V1/V2 history; no source selector bypass exists.
</behavior>
<action>Create the separate private `v1-38-league-host-receipt.ts` authority module and version-aware V3 lifetime-admission bridge required by the shared contract; retain the existing V1/V2 helper semantics. Thread the opaque authority from the main `LeagueConnectedSession.execute` only after `cell-start` durability, and independently from `produceLeagueResponse` after `response-match-start` durability for score and both independence arms, both seats and self-play. In `v1-38-lean-container-match-session.ts`, split the existing `runMethod` wait parameters: keep the encoded legacy request's `timeoutMilliseconds` at 1000 and V1.17's existing aggregate broker request unchanged, but use 5000 for `stream.exchange` only after claiming the exact authority. Cover the current production legacy `adapter.execute` path as well as V1.17; do not test only `executeV117`. Preserve existing request/response keys, method/startup/cancellation handling, authenticated receipts, `stream_exchange/wait_timeout` origin, `TRANSPORT_CRASH` system-failure mapping, poisoning, charged invocation, retention-before-return and cleanup. Update every prospective selector and retained source/capacity/reservation join without changing source inventory semantics. Add mock-only RED/GREEN tests for both clock paths, post-1000/pre-5000 authenticated receipt, exact 5000 expiry, malformed/no/crossed receipt, both provider origins and all response identities, legacy/default/public/benchmark/diagnostic isolation, authority-forgery/reuse, charge-before-dispatch and cleanup. Add the missing planner-supervisor and lean-session tests to the existing Phase 265 Vitest CI command; install no packages and invoke no live route.</action>
<verify><automated>./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'host response receipt'</automated></verify>
<acceptance_criteria>Both actual stream modes prove host-only 5000 ms behavior, unchanged broker/guest/cancellation limits, correct system-versus-Strategy failure semantics, and exact V3 durable authority. Main and every response provider path plus retained selectors are covered; CI now includes the missing planner/session suites. Tests use injected/fake-clock seams only.</acceptance_criteria>
<done>Private runtime integration is source-complete and mock-verified without a real provider, allocation, capacity observation, Match, or verifier.</done>
</task>

<task type="auto" wave="3">
<name>Task 3: Independently review, fix, run the fixed-source gate, and verify scoped truths</name>
<files>packages/strategy-lab/src/league/allocation.ts, scripts/lib/v1-38-league-host-receipt.ts, scripts/lib/v1-38-league-prospective-lifetime.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/run-v1-38-serious-league.ts, scripts/lib/v1-38-league-response-runtime.ts, .github/workflows/ci.yml</files>
<read_first>.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-RESEARCH-v1.md; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md; .planning/phases/265-serious-current-rules-league-and-development-red-team/265-VALIDATION.md; .github/workflows/ci.yml; files modified by Tasks 1–2</read_first>
<action>Root orchestrator executes this task serially only after Tasks 1 and 2 and an independent source review. Use the existing source-review report format at `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-SOURCE-REVIEW-v1.md`; require its frontmatter `status: clean`, `reviewed_commit` equal to the current HEAD, and nonempty `implementation_root` and `source_root` values for the actual fixed source. If review findings require source edits, have the independent reviewer review the resulting fixed source and update that report before continuing. Run the exact six-file focused mock-only suite, the existing source-closure coverage test, and all eight Phase 265 CI gate commands below once against that same reviewed source; command 1 includes the lean-session and planner tests, and command 4 includes every touched runtime source/test plus the new host-receipt module. Do not start or duplicate an identity-bound gate at another source root. Check exact V3 root joins, approval binding, both deadlines, immutable old V1/V2 selectors, source closure coverage, charge-before-dispatch and read-only retained behavior. Use scoped goal-backward verification only: allocation/authority/clock path truths may pass after these gates, but empirical matrix completeness, solver/response/red-team/portfolio/finalist truths remain pending actual complete eligible full-league evidence. Do not write a Phase 265 completion claim or trigger route preparation/dispatch.</action>
<verify><automated>node -e 'const fs=require("node:fs");const cp=require("node:child_process");const p=".planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-SOURCE-REVIEW-v1.md";const s=fs.readFileSync(p,"utf8");const h=s.match(/^---\s*\n([\s\S]*?)\n---/);if(!h)process.exit(1);const f=Object.fromEntries([...h[1].matchAll(/^([a-z_]+):\s*(.*?)\s*$/gm)].map(m=>[m[1],m[2].replace(/^(["\x27])(.*)\1$/,"$2")]));if(f.status!=="clean"||f.reviewed_commit!==cp.execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim()||!/^sha256:[0-9a-f]{64}$/.test(f.implementation_root||"")||!/^sha256:[0-9a-f]{64}$/.test(f.source_root||""))process.exit(1)' && ./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts && ./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'prospective lifetime source closure inventories each changed production byte' && ./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/contracts.test.ts packages/strategy-lab/src/league/identity.test.ts packages/strategy-lab/src/league/matrix.test.ts packages/strategy-lab/src/league/solver.test.ts packages/strategy-lab/src/league/repository.test.ts packages/strategy-lab/src/league/connected-runner.test.ts packages/strategy-lab/src/league/psro.test.ts packages/strategy-lab/src/league/selection.test.ts packages/strategy-lab/src/league/red-team.test.ts packages/strategy-lab/src/league/report.test.ts packages/strategy-lab/src/league/fixtures.test.ts packages/strategy-lab/src/league/integration.test.ts scripts/run-v1-38-serious-league.test.ts scripts/check-v1-38-serious-league-boundaries.test.ts scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts packages/strategy-lab/src/runtime-bridge.test.ts packages/strategy-lab/src/runner-invariance.test.ts packages/strategy-lab/src/factory/repository.test.ts packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/admission.test.ts packages/strategy-lab/src/factory/supervision-artifacts.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts && ./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-tactical-corpus.test.ts && ./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false && ./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/check-v1-38-serious-league-boundaries.ts scripts/check-v1-38-serious-league-boundaries.test.ts scripts/lib/v1-38-league-host-receipt.ts scripts/lib/v1-38-league-prospective-lifetime.ts scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts && ./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts && ./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts && ./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts && pnpm exec tsx scripts/check-service-boundary-imports.ts</automated></verify>
<acceptance_criteria>Independent review is clean after bounded fixes; focused suites, source closure, applicable strict types, boundary scans, and all eight existing CI commands pass at the same fixed source root. Source-level host receipt truths are verified; LEAG-01–09 stay pending/unfulfilled, and no empirical or Phase 265 completion claim is produced.</acceptance_criteria>
<done>Source-only supplement is ready for parent-controlled next-step consideration under standing approval; no fresh allocation, same-process capacity, dispatch, or retained verification is performed here.</done>
</task>
</tasks>

<source_coverage_audit>
| Source | Item | Plan coverage | Status |
|---|---|---|---|
| GOAL | Complete independently attacked current-rules empirical game and bounded portfolio/finalist outcome | This supplement only prevents host-receipt ambiguity from changing classification; original Plan 07 and the other existing phase plans retain empirical responsibility | PRESERVED; empirical goal still pending |
| REQ | LEAG-01 through LEAG-09 | V3 selectors and failure semantics preserve each existing evidence path; all nine remain pending until complete eligible full-league evidence is retained and verified | PRESERVED; NOT FULFILLED |
| RESEARCH | Exact prospective private 5000 ms host wait separate from guest 1000 ms and Match 600000 ms | Tasks 1–3; rooted V3 policy, host-only exchange argument, and both legacy/V1.17 paths | COVERED for source implementation only |
| RESEARCH | Charge/start-bound authority on main and response providers, root selectors, immutable legacy/default/public paths | Tasks 1–3 with opaque one-use authority and exact source/capacity/retained joins | COVERED for source implementation only |
| RESEARCH | Host wait expiry remains a system/transport failure; only trusted guest receipt has guest-timeout meaning | Tasks 2–3, injected receipt and boundary-timeout tests | COVERED for source implementation only |
| CONTEXT | D-01–D-06 immutable evidence, fail-closed errors, canonical kernel, hostile source, charging, no game-rule/formation change | Tasks 1–3; no engine/gameplay changes and V11/consumed history immutable | PRESERVED |
| CONTEXT | D-07–D-15 complete matrices, deterministic snapshots/solver, immutable response loop and charged counters | No solver/matrix/response semantics changed; requirements remain owned by existing Plans 01–07 | PRESERVED; empirical checks pending |
| CONTEXT | D-16–D-21 pure portfolio/finalist, all-channel red team, qualified claims | No selection, red-team budget, finalist, or claim gate changed; requirements remain owned by existing Plans 05–07 | PRESERVED; empirical checks pending |
| APPROVAL | 2026-10-02 exactly 5000 ms host receipt; all other bounds fixed; no repeated route literal | Tasks 1–3 implement only the approved response-wait delta; future route requires independent fixed-source review, passing gates, new allocation, checked empty 0700 store, and fresh same-process capacity | COVERED; no route execution here |
</source_coverage_audit>

<threat_model>
## Trust Boundaries (OWASP ASVS Level 1 scope; all High findings block acceptance until mitigated)

| Boundary | Description |
|---|---|
| Allocation document → private host authority | Untrusted/serialized policy values cannot mint the new response wait. |
| Durable charge/start → factory/planner/stream | Crossed seat, provider, Match, attempt, runtime, source, or start identities cannot authorize another wait. |
| Guest worker/broker → parent persistent stream | Guest result receipt is validated independently of the parent response-receipt timer. |
| Private runtime diagnostics → retained/public readers | Host timeout metadata remains private and cannot leak strategy source, memory, objective payloads, or raw runtime data. |
| Source changes → CI/source closure → later route | A changed or incomplete source root cannot reuse a reviewed allocation, and this source plan cannot dispatch. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-HR-01 | Spoofing/Elevation | V3 allocation and authority | high | mitigate | Exact policy/root admission and opaque one-use issuance after durable charge; scalar, copied, serialized, stale, or crossed grants fail before construction. |
| T-265-HR-02 | Tampering/Denial of Service | broker request and host exchange timer | high | mitigate | Separate arguments; prove legacy q remains 1000 and V1.17 method/startup/cancellation values remain fixed while only the authorized outer wait is 5000. |
| T-265-HR-03 | Repudiation/Tampering | guest-versus-system failure evidence | high | mitigate | Preserve authenticated guest receipt path; host expiry remains trusted transport/system failure, charged with no retry/refund, and exact retained failure-prefix tests remain. |
| T-265-HR-04 | Information Disclosure | private response diagnostics and public/default selectors | high | mitigate | Keep authority private/nonserializable, retain redaction, audit imports/selectors and run existing league/lab/factory/service boundary scans. |
| T-265-HR-05 | Tampering | source/capacity/retained joins | high | mitigate | V3 exact source closure, allocation/capacity/start/provider joins, independent review and all eight fixed-source gates. |
| T-265-HR-SC | Tampering | dependency installation | high | mitigate | No package install or new dependency; existing lockfile/source and boundary gates remain required. |
</threat_model>

<verification>
## Scoped validation architecture

Focused RED/GREEN coverage is limited to existing mock-only suites: `packages/strategy-lab/src/league/allocation.test.ts`, `scripts/lib/v1-38-lean-container-match-session.test.ts`, `scripts/lib/v1-38-planner-supervised-runtime.test.ts`, `scripts/lib/v1-38-factory-supervised-runtime.test.ts`, `scripts/run-v1-38-serious-league.test.ts`, and `scripts/lib/v1-38-league-response-runtime.test.ts`. Test both `execute -> runMethod(legacy)` and `executeV117 -> runMethod(v117)`, with fake/injected clocks and no Docker/process/provider launch.

The new/extended symbols are the V3 policy/amendment/allocation types and constructors in `allocation.ts`; `ProspectiveLeagueHostReceiptAuthority`, `issueProspectiveLeagueHostReceiptAuthority`, and `claimProspectiveLeagueHostReceiptAuthority` in `scripts/lib/v1-38-league-host-receipt.ts`; and the version-aware V3 lifetime/start claim in `scripts/lib/v1-38-league-prospective-lifetime.ts`. The exchange boundary must receive separate broker-request and host-wait values, without making a configurable public API.

CI validation is the pre-existing eight-command Phase 265 source gate in `.github/workflows/ci.yml`: named Vitest suite, tactical corpus, strategy-lab build, strict touched-script TypeScript, serious-league boundary scan, lab boundary scan, factory boundary scan, and service-boundary scan. Add the planner and lean-session test files to its existing Vitest suite; do not replace or weaken any command. Independently review/fix once at fixed source root before running the full gate. No empirical allocation, real capacity measure, provider/model/Docker/Match, holdout, formation, or verifier command is allowed in these tasks.

Goal-backward truth verified by this source plan: an approved new private receipt grant can extend only the host's outer response wait with immutable identity and failure classification. Not verified here: full cell matrix/payoff completeness, solver result, response-loop closure, full red-team allocations, diversity/portfolio, robust-pure/no-finalist outcome, or Phase 265 completion. Those remain false/pending until actual full-league evidence and the existing independent retained verifier pass.
</verification>

<success_criteria>
The only added numeric allowance is a V3-rooted private outer response wait of exactly 5000 ms. Guest 1000 ms, Match 600000 ms, every other setup/cleanup/lifecycle/invocation/memory/CPU/run/attempt/accounting/retention/capacity/gameplay/privacy/holdout/formation value and all V1/V2/default/public behavior remain unchanged. Both current legacy and alternative V1.17 source paths are covered, all high threats mitigated, independent fixed-source review and all eight existing CI commands pass, and no source-only result is represented as a fulfilled LEAG requirement or complete Phase 265 evidence.
</success_criteria>

<output>
Return source-only acceptance and fixed source/implementation/source-root identities, independent review and gate status, any unresolved blocker, and the fact that a distinct fresh route still awaits committed allocation, new checked empty 0700 store, and fresh passing same-process capacity. Do not create/overwrite the existing 265-07-SUMMARY or claim empirical/phase completion. The root owns commits and any later route decision.
</output>
