---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-policy-cache-v1
type: execute
wave: 15
depends_on: [265-16-POST-V15-ARCHIVED-PREFIX]
autonomous: true
execution_owner: source_only_ROOT_scheduled
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
  - packages/strategy-lab/src/runtime-bridge.ts
  - packages/strategy-lab/src/runtime-bridge.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
must_haves:
  truths:
    - Actual leanResourcePolicyForAllocationV15 calls hit a private identity cache only for successfully host-issued deeply immutable admitted allocations; untrusted objects never acquire cache authority.
    - All three fresh allocation-file admissions, fresh source/HEAD and native before/after callbacks, RSS/time/physical/ledger/available-memory guards and no-refund checks remain live and unchanged.
    - Ordinal4 alone selects a separately named strict same-bounds policy and private finite host-issued phase/code/totals attribution; old consumed policies, default bridge/result shapes and v15-3 review remain byte-identical.
    - The exact ten raw-pinned refused v15-3 records yield only38-charge cost custody with unknown historical peaks, not accepted FINAL or old reader authority.
    - Actual v15-4 setup/request/continuation/source/retained consumers join the same selected policy, new semantic cache distinction and independently produced exact review-v5 against the actual failed functional commit.
    - Four exact immutable new inputs are functionally hashed, six exact generated outputs are excluded, all ten paths are physically debited, and earlier checked source/report accounting remains present.
    - Source-only readiness grants no empirical admission; ordinal5 stays dormant and all LEAG/current-freeze/formation/holdout/public/counting/production outcomes remain pending.
  artifacts:
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: host-issued identity policy cache, strict ordinal-four policy/caps and exact finite amendment
    - path: packages/strategy-lab/src/runtime-bridge.ts
      provides: opt-in private host-issued finite failure sidecar without changing default execution shape
    - path: scripts/lib/v1-38-lean-baseline-match.ts
      provides: ordinal-four-only actual bridge catch-to-wrapper attribution binding
    - path: scripts/lib/v1-38-lean-resource-window-v15.ts
      provides: exact raw38-charge cost parser and selected v5 document path
    - path: scripts/run-v1-38-lean-correction.ts
      provides: actual selected-policy/prefix/distinction/review/source callers
    - path: scripts/lib/v1-38-lean-correction-retained.ts
      provides: scoped private observation sidecar validation with unchanged full audits
  key_links:
    - from: successful admitLeanAllocation return
      to: leanResourcePolicyForAllocationV15 and leanCapsForAllocation
      via: exact host-returned deeply immutable identity only; no root-key or caller-key insertion
    - from: actual bridge catch and cleanup
      to: baseline wrapper and existing private observation cell
      via: WeakMap-issued exact execution identity, finite host phase/code/totals and allocation/charge/slot joins
    - from: ten-record PIN-INVENTORY-v1
      to: actual readLeanResourceWindowPriorPairV15 ordinal-four branch
      via: exact raw length/hash/full-wrapper canonical/embedded pins and non-authorizing cost role joins
    - from: ordinal-four strict policy
      to: actual continuation/review/manifest/retained/resource consumers
      via: exact v5 receipt, failed functional comparator and new semantic cache distinction
---

<objective>
Add the checked source-only policy-selection repair inside EXISTING Plan265-16, not a new numbered plan, phase or workstream. Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, remove repeated pure policy reconstruction only on safe host-issued identities, preserve fresh admissions/guards, add finite private failure attribution, and specify ordinal-four's honest38-charge immediate-prefix/distinction joins.

Purpose: Test a source-backed reducible hotspot without claiming it caused or cured the initiating UNKNOWN v15-3 failure.
Output: Three serial RED/GREEN source tasks, exact ten metadata pins, separate same-bounds ordinal-four policy, thirteen-file selected review-v5 contract and exact acyclic source/physical amendment. ROOT retains the entire empirical task and its separate gates.
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
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PLAN.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-POLICY-CACHE-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-POLICY-CACHE-PIN-INVENTORY-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v3.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v3.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-TIMING-APPROVAL-20261009.md
</context>

<fixed_constraints>
Source actor=/root/execute_265_policy_cache; independent reviewer=/root/review_265_policy_cache. These are planned actual fresh actors, not preexisting receipts. The executor edits only the ten declared source/test files and writes only scheduled SOURCE-SUMMARY-v1; no source-review receipt is self-issued. Three tasks execute serially with exclusive section ownership below. No new numbered plan or concurrent operational ceremony. No actual request/setup/helper/authorization/allocation/store/capacity/entry/provider/Strategy/Match/empirical verifier/publisher or historical reader/authenticator invocation. Tests use inert injected host/provider/kernel leaves and isolated temporary metadata files, never actual route destinations; no real Match is run even by bridge tests for this supplement. Existing unrelated tests are not rerun by blanket suite selection.

Diagnosis is CLOSED/inconclusive. At941 survivors, the closed cache-disabled pure probe measured policy selection144.745/150.529ms and admission217.284/160.619ms; at least eight pure selections occur in a checkpoint graph. The compact604411ms, resource643198ms and entry769902ms are different clock scopes. No causal/cure claim, unchanged known-failure rerun, live telemetry inference or historical peak reconstruction follows. Failed functional comparator is763174fdbbadb21982acdfb6f4c9bedd007241cf; source c0d3b102b0e126c5ac346b9c8f839c7876c81270748813afa06290e0414e8a97/966. Historical documentation HEAD356ff8abd4c058b2bdcca0bde8aceaba2a6107d0 is NOT this comparator. Current cost custody is failed_result/current1/cumulative38, pairf0ee5f78/carry98f59a41/holdcb95d720/refusaleaa46341; finalReaderClose=false/check absent/result present/no operator hold-refusal. Preserve old bytes, policies, v4 review and outcomes; no ordinary reader retry/recredit.

Same adopted time envelope: actualResumeMs1791569672000, startedAtMs1791455941097, priorElapsedMs108000000, elapsedMs250530903, absoluteDeadlineMs1791598472000 (2026-10-10T02:14:32Z), reserveMs1860000. Cumulative elapsed is maximum of inherited/ledger and original floor+wall, never overlapping sums; all source/review/test/wait/cleanup wall charged. Entry equality refuses at1791596012000/01:33:32Z; source reserve cutoff1791596612000/01:43:32Z. No new window, re-anchor or reset. Maintain RAM3000000000B including external512000000B+guard335544320B; scratch2000000000/retained12000000000/total15000000000/terminal1000000000;300Matches; guest1000/host5000/startup2500/Match600000; sampler250ms/768MiB old-space. All38 historical charges/files/survivors carry. Ordinal4 is unused capacity only;5 stays dormant. Current-rules verified freeze precedes formation; holdout unopened; all LEAG/public/counting/production claims remain pending.

No external dependencies/services/install tasks. Discovery Level0: existing WeakMap issuance, canonical roots, exact-key schemas, immutable policies and Vitest/inert seams provide all patterns. No codebase map, graph or local skill directory exists. Existing checkpoint-observation composition, host-stage-v7 and compact-execution/diagnostic implementation are read-only dependencies; no engine/rule/runtime allowance or public schema change.
</fixed_constraints>

<interface_contract>
New identifiers named here are implementation targets, NOT claims that they already exist. Existing source functions are admitLeanAllocation, immutableRetryData, admittedRetryCaps, leanResourcePolicyForAllocationV15, leanCapsForAllocation, leanResourceWindowPolicyForModeV15, leanCorrectionSourceManifest, readLeanResourceWindowPriorPairV15, authenticateLeanPreparationContinuationSourceReviewV13, validateLeanResourceWindowContinuationV15, runCanonicalLabMatch, runLeanBaselineMatch, publishLeanCorrectionMatchEvidence and auditLeanCorrectionRetained.

Cache: private WeakMap keyed only by exact successful admission-return object, value immutable selected policy/caps. Keep existing immutableRetryData, its32depth/4096nodes/4096double-counted-properties limits and admittedRetryCaps map/registration byte-identical. Add separately named private immutableHostIssuedPolicyDataV15 ONLY for the NEW policy/caps cache: depth≤32, object nodes≤4096, unique own-property DATA descriptors≤4096, separately total dense-array element checks≤4096. Count each own descriptor once; array index validation is separately bounded rather than counted again as an own property. This is not a generic8192-property ceiling: both4096 budgets must independently pass (maximum combined checks8192). Preserve all original safety predicates: reject proxies/functions/accessors/cycles or repeated-object aliases/nonplain prototypes/nonfrozen objects/sparse arrays; inspect descriptors, never execute getters. Bound work BEFORE further enumeration/index scans; symbol keys and unexpected values cannot smuggle non-data authority. Register only AFTER successful full reconstruction/equality of expected and this new eligibility check; never set(value) for caller input. No root/string Map, caller clone/frozen caller/proxy/accessor admission cache; no file/ledger/measurement/custody cache. A miss retains the full old admission path; its returned host object may be registered, but original caller remains uncached. leanCapsForAllocation may consult the exact NEW issued policy/caps identity pair before its existing path; old helper/map and all legacy cap outputs stay unchanged. Optional read-only diagnostic counters expose only numeric hit/miss/registration snapshots; no cache enable/invalidation/setter or authorizing control API. Non-v15 allocations retain existing null-policy behavior.

Bounded no-Match planner probe using production constructor/admission and inert36-slot baseline with exact pair970 survivors CLOSED0:1016nodes/4299 old double-counted properties/depth3; actual SAME admitted object leanCapsForAllocation184.065/174.626ms, old cap cache miss-only. A second bounded constructor/admission structural probe CLOSED0 measured3248 unique own descriptors +1051 dense elements =4299old-count: each new independent4096budget passes. These are shape/old-cache facts, NOT proof of an implemented new cache. The initial probe seed was rejected by strict schema (CLOSED1); corrected lowercase/hyphen inert seed passed, no writes/provider/Match/route. Historical one-slot JSON separately observed952nodes/3858old-count/depth3 is not admission/hit proof. ROOT chose the separate corrected descriptor-budget check above as bounded internal implementation, NOT a resource/rules extension. Both authentic-size prospective diagnostic970-survivor and conditional36-slot baseline971-or-more-survivor fixtures must pass NEW bounded eligibility and actual repeated same-object policy/caps hit tests. If either remains ineligible/miss-only, STOP source-only/inconclusive and tell ROOT; no silent bound increase/full-baseline recovery claim or empirical admission.

Policy: export LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY and LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_CAPS; schema and labRoot domain=lean-resource-window-policy-cache-envelope-v15-4-v1. Spread unchanged successor BODY (not successor's self root) then override schemaVersion, predecessorExtensionRoot=sha256:466ba6fabf888b9f3e6772df42a2c53c86d75d05821629b7ada79506090cd88c, charged38, attemptOrdinals[4], planRoot=raw SHA-256 of this final PLAN-v1 after independent PLAN-CHECK-v1 PASS. Keep maximumDiagnostics1/maximumBaselines1 and approvalRoot=sha256:21fae32b03b5027d6ec6913b420c758ea30368c61ae43676f47725c6acad1738 joined to exact existing TIMING-APPROVAL-20261009. Preserve every timing/resource/memory approval value above. New caps are the identical successor caps values with separate named singleton. v15-2 old exports and v15-3 successor exports/canonical roots remain byte-identical. Strictly admit all three schemas, select2→old/3→successor/4→new, refuse5; never substitute policy by copying ordinal/root fields.

Attribution: in runtime-bridge.ts add a small private WeakMap keyed by the EXACT actual returned LabMatchExecution plus opt-in bound allocationRoot/chargeRoot/slotRoot. Add new opt-in host binding and readLabHostFailureV15(execution,binding); these do not grant execution authority. Before each trusted operation set an inline host phase scalar; accumulate host numeric duration totals without inspecting the caught value. Fixed phases: machine_construction, provider_binding, kernel_step, provider_invoke, evidence_verification, result_projection, cleanup, unknown. Fixed codes: HOST_THROW, HOST_REFUSAL, CLEANUP_INCOMPLETE, UNKNOWN. Sidecar exact schema=lean-private-host-failure-v15-4-v1 with allocationRoot/chargeRoot/slotRoot/phase/code/phaseTotalsMs; totals exact seven non-unknown phase keys, finite nonnegative safe integer milliseconds. Stage/code originate only at host catch/refusal sites; no message/stack/arbitrary property/serialization of thrown objects. Absent branding/binding mismatch returns unknown with finite zero totals; spoofed thrown proxies/getters are never inspected. Keep stage timing outside pure engine logic, charge its actual wall, do not add an allowance. Capture first failure accurately; cleanup uncertainty remains failure and cannot erase an earlier attributed phase. Bind to the final returned object even if cleanup replaces execution; no strongly retained object key.

runLeanBaselineMatch opts in ONLY when admitted allocation mode is v15-4. Preserve default and old result shapes. Read exact host-issued execution sidecar in the same invocation; clone/proxy/root-copy lookups return unknown. Add ONLY v15-4 private return/cell key hostFailureV15 (null on success, finite projected sidecar on failure); use allocation/charge/slot joins. This lives inside the existing rooted private observation cell, not a new writable sidecar file or public replay/compact schema. Task3 adds exactly the necessary mode4 cell whitelist and finite validation in the actual retained audit; legacy cell keys and full audits unchanged. Rooted persisted JSON is validated metadata, not renewed host branding or accepted authority. Avoid a telemetry framework, exception taxonomy, extra files or thrown-payload capture. If an unforeseen source dependency needs editing, stop to ROOT for an exact ownership/review/inventory amendment; do not expand ownership silently.
</interface_contract>

<source_ownership>
Task1 owns lean-experiment.ts cache/policy/caps/classification/document/report constants and its existing package resource test. Task2 owns runtime-bridge.ts/test and existing baseline-match.ts/test. Task3 owns custody.ts (v1-38-lean-resource-window-v15.ts), correction.ts, retained.ts and the script resource-window test. No file overlaps across tasks; task3 depends on both preceding interfaces and tasks remain serial. Resource policy amendment constants are produced in Task1 and consumed in Task3, so no late shared lean-experiment edit is implied. Three bounded task contexts, no >5-file task.

Exact semantic review closure is13 paths, in this order: scripts/run-v1-38-lean-correction.ts; scripts/run-v1-38-lean-baseline.ts; scripts/lib/v1-38-lean-checkpoint-observation-v15.ts; scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts; packages/strategy-lab/src/league/lean-experiment.ts; scripts/lib/v1-38-lean-resource-window-v15.ts; scripts/run-v1-38-lean-resource-window-v15.test.ts; packages/strategy-lab/src/league/lean-resource-window-v15.test.ts; scripts/lib/v1-38-lean-correction-retained.ts; packages/strategy-lab/src/runtime-bridge.ts; packages/strategy-lab/src/runtime-bridge.test.ts; scripts/lib/v1-38-lean-baseline-match.ts; scripts/lib/v1-38-lean-baseline-match.test.ts. This is the existing nine-file closure plus the FOUR actually modified bridge/wrapper dependencies, not an unchanged nine-file certificate. Existing host-stage-v7 and run-v1-38-lean-experiment.ts remain read-only inherited source-manifest dependencies; their old exception-brand/compact/diagnostic behavior is preserved and inspected, not rewritten. No unrelated transitive subsystem is added to the semantic diff review.
</source_ownership>

<finite_inventory>
Exactly ten new full paths under .planning/phases/265-serious-current-rules-league-and-development-red-team/:

| Exact basename | Functional identity | Physical debit |
|---|---|---|
| 265-16-POST-V15-POLICY-CACHE-RESEARCH-v1.md | include input | include |
| 265-16-POST-V15-POLICY-CACHE-PLAN-v1.md | include input | include |
| 265-16-POST-V15-POLICY-CACHE-PLAN-CHECK-v1.md | include input | include |
| 265-16-POST-V15-POLICY-CACHE-PIN-INVENTORY-v1.md | include input | include |
| 265-16-POST-V15-POLICY-CACHE-SOURCE-SUMMARY-v1.md | exclude generated output | include |
| 265-16-POST-V15-POLICY-CACHE-SOURCE-REVIEW-v1.md | exclude generated output | include |
| 265-16-POST-V15-POLICY-CACHE-REVIEW-FIX-v1.md | exclude generated output | include |
| 265-16-POST-V15-POLICY-CACHE-VALIDATION-v1.md | exclude generated output | include |
| 265-16-POST-V15-POLICY-CACHE-SOURCE-VERIFICATION-v1.md | exclude generated output | include |
| 265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v5.md | exclude selected generated receipt | include |

Task1 exports exact POLICY_CACHE_SOURCE_INPUTS/EXCLUSIONS/AMENDMENT_PATHS constants under LEAN_RESOURCE_WINDOW_V15_ prefix, appending all ten to REPORT_PATHS without removing earlier paths. Source branch4 includes all earlier exact noncyclic archival inputs and preserves their exact cyclic exclusions, then hashes the four new inputs AND the thirteen named source/test review paths. Explicitly include bridge/wrapper/test dependencies even if inherited closure already contains them, with set semantics preventing duplicates. Delete only the six new exact outputs for this amendment; no new broad glob/prefix/suffix exclusions. Unknown similarly named files receive no exemption. Functional exclusions never exempt physical stat blocks/growth; previously charged disappearance/shrinkage refuses, zero-byte records do not refund allocation.

Ordering: four inputs immutable after independent check closes; ROOT schedules exact amendment before source execution. Source commit/manifest fixed only after implementation plus independent review/fix. Intermediate review and scheduled REVIEW-FIX finish before final selected v5 is produced; clean first pass may issue finite no-fix disposition in scheduled REVIEW-FIX. Exact selected v5 generated only against final fixed source/root/13-file closure and actual fresh actors, never overwritten or substituted with v4. Its actual saved file must be owned/private mode0600 before the existing readLeanCorrectionPrivateBytes/default selected-review consumer runs; ROOT schedules this permission at creation, preserving receipt bytes and hash. Permission-only correction cannot replace a receipt; consumer readiness requires actual private-byte/default validation, not injected fixture read. Summary/review/fix/validation/distinct verification outputs cannot self-hash. Any later source fix or report outside these names requires separately checked exact receipt/inventory amendment before creation or allocation. All named outputs can be absent until their stage, but charged outputs cannot disappear or shrink. Actual all-four-input/current-manifest/default-review projection after v5 must be verified; fixture identity alone is insufficient.
</finite_inventory>

<tasks>
<task type="auto" tdd="true">
  <name>Task 1: Cache only safe host-issued policy identity and define same-bounds ordinal-four contracts</name>
  <files>packages/strategy-lab/src/league/lean-experiment.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts</files>
  <read_first>Research and checked pin inventory; lean-experiment.ts immutableRetryData/admitLeanAllocation/leanResourcePolicyForAllocationV15/leanCapsForAllocation/strict extension admission/policy bodies/actual checkpoint and ledger reads/report debit; existing resource tests. Read each selected range once.</read_first>
  <behavior>
    - Actual same admission-return object repeated through leanResourcePolicyForAllocationV15 produces identical selected singleton/output and increasing cache-hit count without another reconstruction, for BOTH authentic-size970-survivor diagnostic and36-slot baseline fixtures; frozen caller clone and separately reconstructed identities do not share cache authority. Miss-only/ineligible baseline blocks readiness without weakening eligibility.
    - Caller objects are never registered: mutable/deep-mutable/frozen copy/root-copy/proxy/accessor/wrong-root cases retain full admission or refuse as before; rejected host-return eligibility cannot populate cache. New separate4096descriptor/4096dense-element/4096node/32depth bounds each refuse overflow; existing immutableRetryData/map stay byte-identical. Non-v15 result stays null.
    - Actual inert checkpoint/ledger callbacks still perform all THREE fresh allocation-file admissions, before-ledger/after-ledger checks, fresh source/HEAD/native before-and-after observations, RSS/time/physical/available-memory/cost guards. Tampered file after a hit, resource equality/overflow, report disappearance/shrinkage and survivor reductions refuse.
    - Old v15-2/v15-3 policy canonical bytes/root/caps/default guards unchanged; new strict4 policy exact roots/charged38/ordinal4/same bounds; mismatched3/4 and re-anchor/refund/cap changes refuse;5 refused.
    - All ten amendment paths are physically inventoried, only four are source inputs and six outputs; earlier archival input/exclusion sets remain unchanged.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, record named failing tests before editing. Implement interface_contract's separately named descriptor-only immutableHostIssuedPolicyDataV15 with independent4096descriptor/4096dense-element/4096node/32depth bounds and identical proxy/accessor/prototype/frozen/function/cycle/density predicates; leave immutableRetryData and admittedRetryCaps byte-identical. Register private identity-only policy/caps pair only after successful full admission/equality of expected and new eligibility; never cache incoming value, observed files, root strings or live guards. Check this private WeakMap at actual leanResourcePolicyForAllocationV15 and leanCapsForAllocation entry; on miss keep complete current admission, no shortcut inside admitLeanAllocation itself. Optional counters are read-only finite numbers, not admission controls. Exercise actual same host-issued object selector/caps on authentic-size970-survivor diagnostic and971-or-more-survivor36-slot baseline, including old double-counted bound regression and new independent budget overflow adversaries. Connected inert checkpoint tests count THREE fresh file admissions and each original guard/callback using current read/stat/Git observation seams; native leaves inert. Do not prove only an unused helper or equal objects whose identities change. Add exact policy/caps/schema/root/ordinal/document choices from interface_contract and all strict consumer family classifications needed by these pure functions. Capture canonical hashes for BOTH old policy singletons before edits and require byte equality afterward; do not change old bodies, exports, roots, report input/exclusion sets, clock formula or runtime/memory bounds. Capture final checked PLAN raw root only after checker PASS; no self-referential root literal inside this document. Implement exact new amendment constants and append all ten paths to physical report list. Split script consumer wiring into Task3, no actual route allowed at any intermediate commit. GREEN/refactor targeted new tests only; preserve legacy expectations, changing dormant4 assertions only to distinguish pure new policy selection from not-yet-admitted empirical authority;5 stays refused.</action>
  <verify><automated>NODE_OPTIONS=--max-old-space-size=768 node_modules/.bin/vitest run packages/strategy-lab/src/league/lean-resource-window-v15.test.ts -t 'policy cache' --testTimeout 5000</automated></verify>
  <done>Same host-issued object demonstrably hits actual pure selector cache, every original fresh guard count and refusal is preserved, strict4 policy is separately rooted under identical limits, legacy policy bytes match, exact10 physical amendment constants exist. No actual authority or route artifact created.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Preserve finite private host failure phase across the actual bridge catch and wrapper</name>
  <files>packages/strategy-lab/src/runtime-bridge.ts, packages/strategy-lab/src/runtime-bridge.test.ts, scripts/lib/v1-38-lean-baseline-match.ts, scripts/lib/v1-38-lean-baseline-match.test.ts</files>
  <read_first>Actual bridge catch/cleanup and baseline-match.ts create/run/finally/compact return; existing bridge/wrapper tests; read-only host-stage-v7.ts and compactExecution/deriveLeanSupervisorDiagnostic in scripts/run-v1-38-lean-experiment.ts. Their default shapes cannot be changed.</read_first>
  <behavior>
    - Inert fixed host faults at construction/binding/step/invoke/evidence/projection/cleanup yield exact allowlisted phase/code and finite numeric totals through actual bridge catch and actual wrapper; default/no-opt-in and all old modes retain byte-identical shapes/classifications.
    - Arbitrary thrown proxy/accessor with hostile diagnostic properties causes no property/message/stack access or serialization; thrown copies/spoofs/root-equal execution clones do not acquire brand; binding mismatch gives unknown, never caller-asserted phase/code.
    - v15-4 private observation field carries exact allocation/charge/slot identities, null on success, finite metadata on failure; compact/public replay/result execution shape and three-way failure semantics remain unchanged.
    - Cleanup replacement keeps returned-object branding and prior phase truth; no totals cross invocation/await scope or double-count overlapping phases. Failed Match stays system failure, never accepted evidence.
  </behavior>
  <action>Per D-02/D-25/D-28, write named RED tests using mocked/inert MATCH_KERNEL/provider leaves so no canonical empirical Match/provider/Strategy execution occurs. Implement ONLY interface_contract's opt-in inline host scalar/totals plus private WeakMap issuance/read projection in runtime-bridge.ts. Set phase before the actual fixed trusted operation and classify at host catch/refusal site; do not read caught objects, even for convenience error codes or diagnostic formatting. Keep code/phase allowlists finite and total schema bounded; validation/clock failure falls back unknown without throwing private content. Do not copy events/transitions, guest payloads, source, runtime evidence or arbitrary thrown values into sidecar; preserve current transitions-loss semantics and unknown past cause. Read from the actual final returned execution identity, with allocation/charge/slot binding and frozen projection, not from a root map or caller's serializable diagnostic. In actual runLeanBaselineMatch select opt-in strictly from admitted mode4, consume that host-issued sidecar after the bridge returns, and add the sole finite private hostFailureV15 field to the v15-4 returned cell body as specified. Keep existing host-stage-v7 thrown wrapper logic unchanged; unknown wrapper failures remain unknown instead of enlarging its code taxonomy. Existing correction publication already serializes the returned cell; Task3 connects exact mode4 schema validation. Expose no generic observer/plugin, new report/writable filename, default diagnostic property, public field, resource extension or acceptance bypass. GREEN runs only named new inert bridge/wrapper cases; no broad legacy kernel tests or empirical command.</action>
  <verify><automated>NODE_OPTIONS=--max-old-space-size=768 node_modules/.bin/vitest run packages/strategy-lab/src/runtime-bridge.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts -t 'policy cache host attribution' --testTimeout 5000</automated></verify>
  <done>Actual catch-to-wrapper stage/code survives only via exact host-issued identity in opted-in4, private finite bound totals are retained, hostile thrown properties untouched, legacy/default shapes and system-failure status unchanged.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Join exact38-charge cost prefix, meaningful cache distinction and fresh independent review-v5</name>
  <files>scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-correction.ts, scripts/lib/v1-38-lean-correction-retained.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
  <read_first>Exact new PIN-INVENTORY-v1; existing v15-2 parser/pins and v15-3 reader/review/distinction code; correction actual source manifest/setup/request/continuation/publication/checkpoint/resource/timing consumers; retained actual observation key join/publication/exhaustion/accepted guards; focused source test excluding large fixture literal reads.</read_first>
  <behavior>
    - Actual bounded injected-byte reader for4 authenticates exactly ten new pins and seven role joins, returns only rooted38-charge cost with final970 survivors/27303936B/228267940ms/unknown peaks; old v15-2/v15-3 readers/pins/reviews remain unchanged.
    - Missing/extra/path-substituted/raw/canonical/embedded/policy/ordinal/role/survivor/cost/tamper/acceptance-promotion spoofs refuse;5 and partial malformed4 policy refuse BEFORE historical IO. No old authenticator/reader/publisher called by4 cost branch.
    - Actual setup/request/continuation/review/source/retained resource/time consumers agree on strict new4 policy and immutable approval/plan roots. Own accepted4 diagnostic plus actual FINAL is the only conditional baseline path; failed3 cost history cannot satisfy it.
    - Exact semantic tag host_issued_immutable_policy_cache_v15, evidenceRoot=request.sourceRoot, reviewRoot=raw selected v5 join top-level request/continuation/review. Identity drift, old v4, wrong base/actors/closure/findings/policy refuse.
    - Actual publication and retained audit connect mode4 hostFailureV15 nullable finite cell metadata to allocation/charge/slot and observation root; extra keys/nonfinite/negative/spoofed phase/code/cross-slot joins refuse, legacy schemas unchanged.
    - Actual production manifest hashes all4 inputs/called13 closure plus earlier noncyclic inputs, excludes only6 new exact outputs and earlier checked cyclic outputs; all10 debited, charged growth/shrink/disappearance behavior unchanged.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, boundedly recompute all ten inventory lengths/raw/canonical/embedded facts before code and stop on mismatch without changing pins. First recursive-key-scan the metadata fixture for private payload keys; retain only these ten complete metadata wrappers in the portable fixture after that check. Write connected named RED tests before production edits. Add source-controlled LEAN_RESOURCE_WINDOW_ARCHIVED_V15_3_PINS and authenticateLeanResourceWindowArchivedPrefixV15_3 with EXACT inventory literals, complete key sets/seven role joins and schema/root v15-3-failed-prefix-cost-only-v1; return only specified non-authorizing cost projection. Add mode4 actual readLeanResourceWindowPriorPairV15 dispatch using its existing bounded readBytes seam; select/strictly validate4 policy before the ten reads,5 refuse before IO; preserve existing2/3 branches byte-for-byte where possible. Do not call priorPair authenticator/ordinary reader/publisher or introduce FINAL/accepted authority in cost return. Connect policy4 through actual extension documents, setup, request, continuation, reservation, predecessor inspection, all selected memory/time/resource guards, parent terminal reserve and retained publication/exhaustion/accepted joins; no old singleton leak. Keep all three actual fresh allocation-file admissions and pre/post-native callbacks untouched. Add only host_issued_immutable_policy_cache_v15 distinction for4, current source evidenceRoot and exact v5 bytes reviewRoot, with strict final source/commit/manifest/13-file joins. Preserve old semantic tags/contracts/review3/review4. Select exact RESOURCE-WINDOW-SOURCE-REVIEW-v5 for4 and enforce independently_reviewed:true/status:clean/findings_open:0/identity_only:false, exact13 ordered files, diff_base763174fdbbadb21982acdfb6f4c9bedd007241cf, source author/reviewer from fixed_constraints; source_entries must equal actual current manifest, not hardcoded966. V5 narrative must review actual cache eligibility/hit/fresh-guard boundaries and finite catch attribution against failed functional source, without cure claim. Require identical request/continuation/policy/attestation/evidence/source/review joins; retain separate fresh actual ROOT attestation/DATA/HELPER/authorization and own accepted diagnostic+FINAL requirements rather than issue them here. Wire exact Task1 amendment into real branch4 source manifest including inherited noncyclic/cyclic sets and bridge/wrapper/test source closure. In actual retained observation audit add only4's hostFailureV15 exact nullable keys/finite phase/code/totals and allocation/charge/slot joins inside existing cell; preserve full audits and old schemas, no new writable sidecar filename or unaudited acceptance. Connected tests must call actual cost reader, setup/request/continuation producers and validators, selected source-review consumer, publication/retained consumer, real manifest and report debit with inert leaf observations/files, not just helper unit acceptance. Fixtures cannot manufacture actual review/allocation/route authority. GREEN/refactor named focused cases only; report tests/proof limits honestly.</action>
  <verify><automated>NODE_OPTIONS=--max-old-space-size=768 node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts -t 'policy cache' --testTimeout 5000</automated></verify>
  <done>Exactly10 actual pins match; connected4 contracts agree on38-charge cost/strict same bounds/semantic tag/fresh v5/finite attribution and manifest/debit closure. Every spoof/stale/authority-promotion case refuses; old artifacts/readers/policies unchanged. Source scope ready only for independent review/fix, ROOT validation and distinct source verification.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries

| Boundary | Description |
|---|---|
| Caller allocation → host cache | Object identity and deep immutability are necessary; a copied root/frozen caller cannot issue authority. |
| Live file/ledger/resource observations → cached pure selection | Cached policy never substitutes a fresh admission, source/HEAD/capacity measurement or no-refund guard. |
| Thrown values → private attribution | Host site scalars/WeakMap identity only; hostile exception fields are never inspected. |
| Failed historical metadata → ordinal4 continuation | Exact RAW38-charge cost projection cannot issue accepted/FINAL authority. |
| Independent v5 → actual source consumer | Exact failed base/current manifest/actors/13 files/semantic tag, not fixture-only or identity drift. |
| Source exclusions → physical cost | Four hashed inputs/six exact output exclusions/all10 debits retain no-refund evidence. |

## STRIDE register

| ID | Category | Component | Severity | Disposition | Mitigation |
|---|---|---|---|---|---|
| T-265-PC-01 | Spoofing | Allocation/cache key | critical | mitigate | Task1 only host-return expected insertion after immutable eligibility; actual hits plus clone/proxy/accessor/root spoof tests. |
| T-265-PC-02 | Tampering | File/resource guards | critical | mitigate | Tasks1/3 count all three fresh file admissions and live guard callbacks after hit; tamper/overflow/no-refund refusals. |
| T-265-PC-03 | Information disclosure | Bridge/wrapper sidecar | high | mitigate | Task2 finite host phase/code/numeric totals; exact identity/binding, no exception/payload inspection or public output. |
| T-265-PC-04 | Repudiation | Failed3 custody/cost | high | mitigate | Task3 exact10 pins/seven role joins/38charges/final970 survivors/unknown peaks, no old reader recredit. |
| T-265-PC-05 | Elevation of privilege | Ordinal/review/baseline | critical | mitigate | Tasks1/3 strict4 policy/new tag/exact independent v5/current roots; own accepted diagnostic+actual FINAL only;5 dormant. |
| T-265-PC-06 | Denial of service | Window/cache/totals | high | mitigate | Task1 separate4096descriptor/4096dense-element/4096node/32depth budgets, unchanged old helper/map/no strong keys; Task2 bounded totals; same all-wall resources. |
| T-265-PC-07 | Tampering | Source/physical inventory | high | mitigate | Task3 exact4 includes/6 excludes/10 debits/13-file closure; unrelated-name and shrink tests. |
| T-265-PC-SC | Supply-chain tampering | Dependency installs | low | accept | No installs/services; existing repository TypeScript/Vitest only. |
</threat_model>

<verification>
Each task records exact named RED failure and GREEN/refactor exit/count/duration, no suppressed-error PASS. Each named command must complete within60s; if an inert test exceeds that, stop/report to ROOT for a bounded exact selection, not a blanket rerun. Inherited six strict type errors, previous private-fixture/serious-monitor NOTPASS and missing historical command exits remain explicit, never newly green by this supplement. No broad test suite, old reader/authenticator or empirical command is part of source proof. Source executor writes only scheduled summary and commits only its owned source/test changes plus that summary if ROOT directs its normal source workflow; THIS PLANNER makes no commit or STATE/ROADMAP/history edit.

After independent source review/fix and ROOT scoped validation, ROOT runs ONE bounded no-Match comparative pure probe with the actual saved v15-3 metadata allocation admitted through production admitLeanAllocation, then holds that exact returned object across calls. Compare the literal old full admission+mode+selection algorithm against actual current leanResourcePolicyForAllocationV15(a), two calls each, same object/inputs; capture exact identity unchanged, root/caps/output equality and numeric miss/hit/registration deltas. The same bounded process additionally confirms actual repeated same-object hits on separately issued inert authentic-size4 diagnostic and36-slot baseline fixtures, never actual future request/allocation publications. Real941-survivor historical object alone cannot prove that prospective baseline fits eligibility. Do not call actual source document authenticator/admission/helper/reader/provider/Strategy/Match. No test-only fast path or repeated reconstructed-object identity substitutes. Required qualitative proof is actual repeated same-object hit and unchanged output/guard refusal behavior, not flaky timing threshold. Report both timings/counts truthfully; slower/inconclusive timing or either miss-only prospective fixture is source-only inconclusive, not recovery or empirical readiness. All probe time is charged. Publish only finite safe metadata in scheduled VALIDATION, no extra probe artifact path.

Distinct source verifier independently checks old policy byte equality, all10 actual pins and applicable roots, actual current manifest/default saved-v5 source consumer projection after receipt exists, and ONE named connected cache-hit/guard case; do not accept source executor prose or fixture-only manifest identity as production proof. Capture session outcomes/CLOSED state. Exact generated verifier output remains excluded but physically debited; it cannot change final functional source identity. No actual actor/DATA/HELPER/authority/request/allocation is minted by this projection. Source defects after selected v5 require ROOT's new exact checked receipt/inventory before continuing, never receipt overwrite.
</verification>

<source_audit>
| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Active bounded current-rules empirical game/response/accounting/honest outcome | Existing Plan16 retains empirical ownership; Tasks1–3 close new source prerequisites only | COVERED prerequisite; not achieved |
| REQ | LEAG-01/02/03/04/05/07 | Same original source/custody/accounting gates preserved, no accepted empirical credit | COVERED prerequisite; incomplete |
| REQ | LEAG-06/08/09 | Existing approved lean Plan16 dispositions remain unchanged; source supplement does not replace phase-wide goal | COVERED existing scope; incomplete |
| RESEARCH | Safe identity WeakMap selection hotspot without cause/cure claim | Task1 actual-hit/fresh-guard tests; bounded later ROOT pure probe | COVERED |
| RESEARCH | Finite private catch phase/code/totals and unknown fallback | Task2 actual bridge/wrapper identity path; Task3 retained finite join | COVERED |
| RESEARCH | Immutable failed3 cost-only prefix/all costs/unknown peaks | Exact inventory; Task3 raw parser/actual reader branch | COVERED |
| RESEARCH | Exact acyclic source/debit and meaningful fresh4 distinction | Tasks1/3 exact10 amendment/13-file v5/new semantic tag/current source | COVERED |
| CONTEXT | D-01/D-02/D-05 immutable identity/fail-closed/all-spent evidence | Tasks1–3 exact object/pins/joins/freshguards/no-recredit | COVERED |
| CONTEXT | D-22/D-25 cumulative ledger/private compact/old readers | Tasks1–3 unchanged caps/continuous wall/bounded private sidecar | COVERED |
| CONTEXT | D-27/D-28 honest incomplete/freeze/holdout/rules/runtime/privacy | Fixed source-only frontier and every task; no empirical authority | COVERED |
| CONTEXT | D-03/04/06 canonical kernel/hostile supervised code/rules/formation freeze | Read-only engine/runtime; inert tests only; D-28 actions retain boundaries | COVERED invariant |
| CONTEXT | D-07–21/D-23/24/26 matrix/solver/response/diversity/report/profile/freeze | Existing approved Plan16 empirical/deferred dispositions remain; none implemented/recredited by source supplement | COVERED existing scope/deferred exclusions |

No unplanned new source item; no deferred formation/holdout/diversity-certification/product idea enters these tasks. Research's provisional names are resolved to the exact inputs/outputs above. Additional code ownership or evidence output is not silently added.
</source_audit>

<success_criteria>
Three serial source tasks and independent gates can prove safe actual policy-cache reuse with unchanged guards/bounds, finite private attribution, exact38-charge cost-only prefix, and real current-source/v5/manifest/physical joins. This is SOURCE readiness only. Initiating cause remains UNKNOWN unless separately established; successful source tests or faster pure selection cannot imply an accepted diagnostic, baseline, LEAG completion or experimental recovery.

ROOT-only empirical frontier AFTER independent review/fix, ROOT validation, distinct source verification and bounded probe: actual fresh actor/DATA/HELPER/semantic distinction/setup/request/authorization joins; current source AND HEAD hold; new committed immutable allocation carrying38 charges/final survivor costs; owned empty0700 store; passing SAMEPROCESS capacity BEFORE charge/provider; ONE unique entry and ONE appropriate actual verifier; own accepted4 diagnostic+actual FINAL alone permit conditionalONE36 baseline after fresh capacity. Do not execute these operations from source executor. Preserve same deadline/cutoffs; if gates cannot fit, honest partial/inconclusive stop, no reset or widened authorization. No current-rules freeze/formation/holdout/public/counting/production credit.
</success_criteria>

<output>
Create only `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-POLICY-CACHE-SOURCE-SUMMARY-v1.md` when source tasks finish; remaining five generated outputs are ROOT-scheduled independent stages. This supplement and inventory are planner-owned inputs inside existing Plan16, not new numbered plan files. No STATE/ROADMAP/source/history or commit by planner.
</output>
