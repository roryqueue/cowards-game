---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
type: execute
wave: 1
depends_on: []
addendum_to: 265-16-PLAN.md
scope: source_only_owned_reuse_and_static_compilation_redundancy
status: planned_not_implemented
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-04, LEAG-05, LEAG-07]
empirical_authorizing: false
files_modified:
  - scripts/lib/v1-38-lean-baseline-reuse.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts
must_haves:
  truths:
    - One explicitly admitted invocation shares one deeply immutable owned reuse graph across outer publication callbacks and the pipeline.
    - Publishing an admitted original snapshot does not recompile seven sources or reconstruct the selected source again.
    - Unknown objects, copied handles, changed identities and cross-invocation handles fail closed before publication.
    - Default validators, publishers, retained readers and old artifacts retain their existing semantics.
    - Every publication retains fresh authenticated filesystem, source/HEAD, ledger and capacity guards; full accepted-diagnostic auditing remains unchanged.
    - Source-only improvement establishes neither the SIGKILL cause nor native feasibility, empirical completion or renewed authority.
  artifacts:
    - path: scripts/lib/v1-38-lean-baseline-reuse.ts
      provides: opaque invocation-owned reuse admission with validated original snapshots
    - path: scripts/lib/v1-38-lean-baseline-source.ts
      provides: explicit owned-snapshot publisher retaining ordinary publication guards
    - path: scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts
      provides: connected real-validator/factory/publisher efficiency and rejection regressions
  key_links:
    - from: scripts/run-v1-38-lean-correction.ts
      to: scripts/lib/v1-38-lean-baseline-pipeline.ts
      via: one invocation admission shared with publication callbacks, disposed in finally
    - from: scripts/lib/v1-38-lean-baseline-reuse.ts
      to: scripts/lib/v1-38-lean-baseline-source.ts
      via: exact owned source identity and internal completed static-validation proof
---

<objective>
Remove source-proven redundant reuse ownership and static compilation in existing Plan16 without opening another empirical route. Per D-01/D-02/D-04/D-22/D-25/D-27/D-28, preserve immutable provenance, hostile-source isolation, all charges and scientific/privacy bounds. This addendum is not a new numbered plan and does not replace Plan16's empirical tasks.

Output: a narrowly connected source change, failing-then-passing host regressions, one independent review/fix closure, scoped source validation and source verification. No actual allocation, preparation, helper, Match, provider or consumed reader runs.
</objective>

## Terminal frontier and bounds

The v13-1 baseline is consumed: zero recorded Match charges, SIGKILL after117165ms; resource_threshold with initiatingCause UNKNOWN. Terminal-only and saved-authentication checks are closed. Source/HEAD hold is released; the approved envelope is ENDED. The accepted diagnostic and every consumed artifact remain immutable. No old success authorizes changed source.

Carry FULL108000000ms plus ALL subsequent wall time since1791455941097 under165600000ms and absolute deadline2026-10-09T02:39:01.097Z; no idle exclusion, reset, refund or recredit. All35 cumulative charges,15,000,000,000-byte/300-Match caps,2GB scratch,768MiB child flags,31-minute reserve1860000ms, guest1000ms/host5000ms/startup2500ms/Match600000ms and every other bound remain unchanged. No full36 fit, native-RSS cure, new authority/resource/time, formation/holdout opening, LEAG/freeze/public/counting/production credit is claimed.

## Deliberate first-stage boundary

Diagnosis proves repeated seven-source reconstruction and whole-graph cloning; it does not prove the actual resource trigger. This addendum implements only independently justified owned-reuse/static-compilation redundancy reduction. It explicitly leaves repeated full accepted-diagnostic filesystem auditing UNRESOLVED: safely replacing that audit requires a complete authenticated dependency-byte inventory and review of the retained-authority ownership boundary beyond this four-production-file change. Do not bypass, memoize or partially substitute that audit. It remains called by the ordinary publication binding for every applicable publication. A later change would require a separate checked source-only scope; this addendum grants none.

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
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PREPARATION-CONTINUATION-BASELINE-V13-1-SOURCE-DIAGNOSIS-v1.md
@scripts/lib/v1-38-lean-baseline-reuse.ts
@scripts/lib/v1-38-lean-baseline-source.ts
@scripts/lib/v1-38-lean-baseline-pipeline.ts
@scripts/run-v1-38-lean-correction.ts
@packages/strategy-lab/src/factory/admission.ts
</context>

## Interface and ownership contract

Use a narrow explicit internal opt-in API, not a changed default. Conceptual interfaces: create an invocation admission from an already fully authenticated LeanColdReuse plus current source/allocation identities; obtain its immutable reuse view; resolve an exact original snapshot; publish that snapshot with the admission; close admission in finally. Choose final names consistently within these four modules.

The reuse module owns issuance. A module-private WeakMap/WeakSet proves object identity, never a caller-supplied brand, root alone, boolean or structurally matching object. Issue only after the existing complete reuse checks succeed. Capture the actual validateLeanBaselineSource results during the existing seven-source validation instead of discarding them; retain only exact validated immutable original snapshots, not compiler ASTs/revisions/transpiler buffers. Own/deep-freeze one graph after complete validation, detach caller references, and bind the admission to one invocation owner, current sourceRoot, allocationRoot, coldRoot, seed and reuse grantRoot. Freeze all reachable nested packet/proposal/validation/corpus/proposal objects; a shallow-frozen unknown value is not trusted.

Do not cache arbitrary unknown validator inputs. Keep existing validateLeanColdReuse, validateLeanBaselineSource, publishLeanReusedBaselineSource, validateLeanReusedBaselineSource and ordinary retained-reader behavior fully validating by default. Authentication may record completed validation privately for its own exact output; creating an invocation admission from that exact issued output must not repeat its seven-source validation. Unknown inputs take the full existing admission path or fail; never infer trust from Object.isFrozen.

The owned publisher requires the exact selected snapshot object from that admission. Cloned, mutated, foreign-role, forged-root and copied-token values reject. Publication still goes through publishSourceBytes and its unchanged allocation/mode/coldRoot/seed checks, caps, readLeanChildEntry, ordinary full baseline authority binding, capacity checks, exclusive600 writes and every file/directory sync. No artifact/schema/root rewrite and no change to provenance or old-version behavior.

Wire an explicit owned pipeline entry alongside the existing fully validating entry. The outer callback and pipeline use the SAME admitted graph and exact snapshot identities. Ordinary callers do not get a silent fast path. Do not modify CLI parser, route modes, request/review gates, allocations, time extensions or empirical commands. The opt-in seam is callable in host source fixtures; prospective child wiring remains behind all existing source/data/helper/allocation/capacity gates. Do not enable it for an already consumed route. A closed invocation rejects further access/publication and releases strong references; no process-global arbitrary-value cache.

<tasks>
<task type="auto" tdd="true">
<name>Task1: RED connected immutable-admission and publication regressions</name>
<files>scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts</files>
<behavior>
One fully admitted graph reaches both the outer publisher and pipeline by reference; seven static source validations occur during full reuse admission, zero additional buildStrategyRevision calls occur while publishing those seven exact snapshots. A second invocation performs its own admission and cannot accept the first invocation's token. Mutation of detached caller inputs cannot affect admitted bytes. Mutating nested admitted data fails. Wrong source/allocation/cold/seed/grant/role roots, forged/copied handles and post-close use reject before file creation. Every ordinary full accepted audit and fresh capacity/entry guard remains observable. Source/HEAD and authenticated-file tampering remain rejecting.
</behavior>
<action>
Create an always-running HOST SOURCE ONLY describe block named precharge owned reuse; no skipIf private-directory dependency. Build a bounded deterministic seven-source reuse value from existing cold/proposal emitters at the historical seed and source identity and exact grant constants already present in source, through the REAL validateLeanColdReuse and REAL buildStrategyRevision/admitFactory/authorizeFactorySupervision. Verify fixture bytes/roots against the pinned constants before measuring counts; fixture construction is offline canonical data/static compilation only, never authored Strategy execution. Do not weaken literal historical pins or add test-specific acceptance options. If deterministic reconstruction cannot satisfy the existing validator within this scope, stop with the exact missing fixture information rather than substituting a successful validator stub.

Use a unique mkdtemp real0700 directory and canonical synthetic ledger/entry files with explicit source-fixture identity. Exercise the real owned-admitter, pipeline's initial seven-source publication path and real descriptor/exclusive-write/sync publisher. Stop at the first dispatch with a finite sentinel; do not run training/Match/provider/native Docker. Spies may count actual revision/factory calls and observe guards, but must call through; never replace authentication/validation with successful results. Synthetic FS/Git seams may represent deterministic HEAD/source/capacity inputs and their tampering, but real parsing/root comparisons/rejection decisions must run. Tamper one guard at a time and require no subsequent source publication. Include unchanged legacy/default publisher rejection and ordinary unknown-input revalidation controls. Confirm full accepted-audit invocation count is NOT reduced. RED must fail on missing owned API/repeated work or failed identity checks, not unrelated historical private-path absence. Clean only the exact fixture-owned temporary path in finally.
</action>
<verify><automated>pnpm exec vitest run scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts --testNamePattern='precharge owned reuse' --maxWorkers=1</automated></verify>
<done>Observed RED recorded with specific missing behavior; test block contains no native execution, private artifact reads, consumed reader, skipped success or permissive authenticity mock.</done>
</task>

<task type="auto" tdd="true">
<name>Task2: GREEN one owned graph and completed static-validation proof per invocation</name>
<files>scripts/lib/v1-38-lean-baseline-reuse.ts, scripts/lib/v1-38-lean-baseline-source.ts, scripts/lib/v1-38-lean-baseline-pipeline.ts, scripts/run-v1-38-lean-correction.ts</files>
<behavior>All Task1 admission, identity, mutation, call-count, guard freshness and default-behavior expectations pass; publication bytes and snapshot roots equal the fully validating reference path.</behavior>
<action>
Implement the interface/ownership contract above per D-01/D-02/D-04/D-25. Return/capture completed validated snapshots from the existing validation loop, issue admission only for a fully authenticated owned result, and reuse those immutable identities without whole-graph cloning or compilation per publication. Connect the explicit owned pipeline to the same graph as its outer publication callback. Keep no additional long-lived graph and no retained compiler artifacts. Restrict child opt-in wiring to a separately callable source-only seam that is not activated for existing consumed versions/requests; do not introduce a new version or route merely to ship this source repair. Default branch must remain unchanged. Preserve D-03/D-06/D-22/D-24/D-26/D-27/D-28: no game/training/opportunity/runtime/resource/privacy changes, no learned cross-arm reuse, no old-route authority. Retain every full accepted-diagnostic audit and fresh source/HEAD/request/ledger/capacity guard; do not edit baseline-retained.ts. Close the admission in finally after the invocation and fail closed on mismatched/expired scope.
</action>
<verify><automated>pnpm exec vitest run scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts --testNamePattern='precharge owned reuse' --maxWorkers=1</automated></verify>
<done>GREEN proves one shared immutable graph and no redundant snapshot compilation in opted-in publication, while all authority checks and default semantics survive. If four source files cannot deliver this without weakening guards, stop and report rather than expand scope.</done>
</task>

<task type="auto">
<name>Task3: Independent review/fix, scoped validate and source-verify</name>
<files>scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts, scripts/lib/v1-38-lean-baseline-reuse.ts, scripts/lib/v1-38-lean-baseline-source.ts, scripts/lib/v1-38-lean-baseline-pipeline.ts, scripts/run-v1-38-lean-correction.ts</files>
<action>
Have a genuinely independent reviewer inspect the exact changed source/test diff, real factory/validator/owned-admission/publisher path, identity lifetime and all unchanged authority boundaries. Repair introduced blocking findings within this same file scope, then re-review. Do not relabel current SOURCE-REVIEW-v3 or its source pins as acceptance of new source. A distinctly named source-only review report must explicitly have empirical_authorizing=false and bind the actual new diff/source identity, reviewer and tests; no copied old acceptance. ROOT chooses its separate safe report destination, not a route admission document. Scoped validation runs the connected HOST block serially, unchanged source default tests, lab typecheck, import boundary scan, shell syntax and diff whitespace. Preserve any inherited strict diagnostics as inherited, never a clean typecheck claim. Run each selected block under60seconds; if fixture initialization exceeds the bound, record timeout and stop, do not repeatedly run it or widen caps. Independent goal-backward source verification checks the six must-have truths, exact call counts/reference identity, byte equality, actual mutation/FS/Git rejections and zero skipped tests. Report unresolved repeated filesystem-audit cost, unknown SIGKILL cause and unproved native/full36 feasibility. Source verification grants no route authority. No actual allocation/helper/private artifacts, ordinary old reader, Match, runtime provider or capacity-admitting native probe; no STATE/roadmap/requirements status advancement.
</action>
<verify><automated>pnpm exec vitest run scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts scripts/lib/v1-38-lean-baseline-source.test.ts --maxWorkers=1</automated></verify>
<done>Independent review actually closed with zero introduced blockers, scoped validation and independent source verification actually closed; or honest gaps_found with exact open findings. No empirical success or old review reuse claimed.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries and STRIDE register

| ID | Category | Boundary | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| PR-01 | Spoofing/Elevation | Unknown caller value → owned admission | high | mitigate | Private identity issuance after full real authentication; forged/copy/frozen-unknown/cross-scope rejection |
| PR-02 | Tampering | Caller graph → retained snapshots | high | mitigate | Owned deep freeze, completed validation proofs, exact object/role/root binding, byte equality tests |
| PR-03 | Tampering/Repudiation | Owned snapshot → filesystem publication | high | mitigate | Unchanged full accepted audit, fresh entry/sourceHEAD/ledger/capacity checks and exclusive synced writes |
| PR-04 | Denial of service | Invocation retention → lifetime | medium | mitigate | Single graph, no compiler-object retention, finally close, no arbitrary global cache |
| PR-05 | Information disclosure | Host source fixture → reports | high | mitigate | Source-only synthetic namespace, no actual private inputs/payloads or empirical route |
| PR-SC | Supply-chain tampering | Dependencies | low | accept | No package installs or new dependencies |
</threat_model>

## Dependency and source coverage audit

One serial addendum: Task1 needs existing validator/factory/publisher, creates RED; Task2 needs RED, creates connected opt-in owned semantics; Task3 needs GREEN, closes independent review/validation/verification. No parallel shared-file execution. Level0 discovery: established TypeScript/WeakMap/admission/fsync patterns, no external dependency/docs lookup needed.

| Source | Item | Coverage |
|---|---|---|
| GOAL | Active bounded current-rules empirical game with honest evidence | Existing Plan16 owns empirical goal; this addendum Tasks1–3 support source safety/efficiency only, never completion |
| REQ | LEAG-01/02/03/04/05/07 | Existing Plan16 owns unchanged empirical coverage; Tasks1–3 preserve exact snapshots/admission/evidence, no green requirement |
| REQ | LEAG-06/08/09 | Existing approved Plan16 dispositions retained: original diversity/robust gates deferred, original red-team scope superseded; no invented fulfillment |
| RESEARCH | Diagnosis duplicate graph/seven-source and selected-source recompilation | Tasks1/2 COVERED with counts and shared-identity proof |
| RESEARCH | Repeated full accepted-diagnostic audit | Explicit authorized first-stage exclusion; unchanged, UNRESOLVED, not reported fixed |
| RESEARCH | Actual threshold branch/native pressure/full36 feasibility | Unknown; outside source-only repair, no causal or feasibility claim |
| CONTEXT | D-01/02/03/04/05/06/10/22/24/25/26/27/28 | Tasks1–3 preserve provenance, isolation, charges, limits, default/old semantics and terminal stop |
| CONTEXT | D-07/08/09/11–21/23 | Existing Plan16 remains owner; this addendum changes no schedule/solver/response/portfolio/claims or pilot tier |
| CONTEXT | Deferred formation, rules and certification ideas | Excluded, never implemented here |

<verification>Connected host regressions are proof of source semantics/count reduction only. Run pnpm --filter @cowards/strategy-lab typecheck, pnpm boundary:imports, bash -n scripts/run-v1-38-lean-correction.sh, and git diff --check separately; report actual statuses without broad test reruns. If the shell launcher is absent, record not applicable instead of inventing a path. No source manifest writer or empirical command is required by this plan.</verification>
<success_criteria>One invocation-owned immutable graph and seven completed snapshot validations replace repeated clone/rebuild work; default/legacy and all fresh guards remain. Independent review/validation/source verification close or honest gaps_found. Repeated accepted-audit cost remains unresolved; native failure cause and fit remain unproved; expired envelope stays closed.</success_criteria>
<output>ROOT records bounded source-only closure at a separately safe destination after actual work; no old source-review relabel, new numbered plan, automatic next route, Plan16 completion or STATE change. This planning task itself only writes this addendum and executes no implementation/test/empirical work.</output>
