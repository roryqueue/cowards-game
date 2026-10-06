---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-v6-source-first
type: execute
wave: 13
depends_on: [265-16-replay-validation-source-only]
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-startup-supervisor.mjs
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/run-v1-38-lean-replay-validation-v6.test.ts
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-POLICY-v1.json
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-06, LEAG-07, LEAG-08, LEAG-09]
execution_authorized: source_only
empirical_credit: false
phase_complete: false
must_haves:
  truths:
    - A separately rooted exact v6 diagnostic route can be strictly admitted without widening or relabeling v1-v5 schemas, routes, defaults, policy, or harness control bytes.
    - The admitted v6 reader selects validation-only replay parsing only after full exact allocation admission; v5 keeps its validator branch and older versions keep the old decoder.
    - v6 retains the v5 startup mechanism and all fixed budgets, while every capability, request, allocation, origin, publication, CLI, retained-check, and source-manifest join binds the same v6 identity.
    - v6 effective elapsed time uses the fixed v5 max(wall delta, ceil(monotonic delta)) rule and ledger-close semantics; predecessor custody is finite/read-only and never invokes an old full reader.
    - Source-only tests and gates cannot start a Strategy, Match, provider, helper, real gzip replay, or empirical reader; all LEAG requirements remain uncredited.
  artifacts:
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: exact v6 mode/schema/caps/path admission, v6-only replay selection, effective clock, and finite predecessor accounting
    - path: scripts/run-v1-38-lean-correction.ts
      provides: v6 approval/supplement/request/source-manifest/CLI bindings and immutable source roots
    - path: scripts/run-v1-38-lean-replay-validation-v6.test.ts
      provides: real-admission synthetic v6 validation and v1-v5 compatibility regressions
  key_links:
    - from: v6 request and reviewed source roots
      to: v6 allocation and capability admission
      via: exact schemas, disjoint route paths, approval/supplement, source/data review, and full allocation reconstruction
    - from: admitted v6 allocation
      to: retained replay validator and reader
      via: exact v6 diagnostic/baseline discriminants only; retain explicit v5 validator and historical decoder branches
    - from: startup grant through retained result
      to: v6 allocation identity
      via: correlated invocation/origin/control/publisher/check joins under unchanged v5 startup bounds
    - from: planner and factory startup authority through baseline-source publication
      to: v6 allocation identity and retained result
      via: correlated capability, invocation, origin, control, publisher, and check joins under unchanged v5 startup bounds
---

<objective>
Extend existing Plan 265-16 with the exact approved v6 source route and replay-validation selector, preserving all prior version behavior and limits.

Purpose: the verified repair is currently consumed only by v5 allocations; this additive source continuation allows one separately reviewed v6 route to use it without mutating historical authority or policy.
Output: a tested v6-only source path, immutable finite predecessor/time accounting, and independent source gates. This plan authorizes no data preparation, allocation, entry, Strategy, Match, helper, provider, empirical reader, or downstream credit.
</objective>

<execution_context>
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-REPAIR-APPROVAL-20261006.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-VALIDATION-SOURCE-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-VALIDATION-PLAN-v1.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@AGENTS.md
</execution_context>

<scope_and_authority>
The one fresh private v6 diagnostic is the only initially authorized empirical action. At most one fresh 36-Match baseline may follow, only after full acceptance of that new v6 diagnostic and fresh capacity admission. Carry the 24 already charged Matches and all surviving bytes. The fixed cumulative limits remain 43,200,000 ms, 15,000,000,000 bytes, and 300 Matches; current-turn accounting begins with 36,151,532 ms already carried at 1791247033529. There is no reset, refund, recredit, retry, or reuse of consumed v1-v5 allocation, request, result, reader, or authority.

Preserve guest 1,000 ms, host 5,000 ms, startup 2,500 ms, cancellation at most 100 ms, Match 600,000 ms, retained/scratch/terminal partitions 12 GB/2 GB/1 GB, external reserve 512,000,000 bytes, parent buffer 320 MiB, replay ceiling 256,000,000 bytes, and 4x inflate guard. v6 uses the same startup control mechanism and runtime policy; only separately versioned identity may differ, and all joins must correlate. Do not infer a stop state from the empty zero-ledger; predecessor allocation `602a7e1b`, raw root `0a765ce8`, raw time root `8d9a3adedb736731e32c3ef75279b3da7c7f608585b0e0826954c297b28d5c0d`, terminal `00419d07df57a590288349013170461817bb8656dfc827181d3d1941d70fb114`, and closed time 33,812,347 ms at 1791242322180 are finite read-only inventory only. Preserve all historical survivors; never invoke the old full reader.

Source gates are strictly ordered after implementation: independent source review and bounded fix(es), then validation, then source verification. Only after all three pass may MAIN authorship begin for new data/helper/allocation/entry. Keep source/HEAD fixed for any later authorized empirical route. No generic baseline-pipeline edit is required unless a specific v6 join needs it. No freeze, formation, holdout, public, counted, production, or Phase 265 credit is authorized.
</scope_and_authority>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Define exact v6 allocation, caps, route roots, selector, and carried clock</name>
  <files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-replay-validation-v6.test.ts, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-POLICY-v1.json</files>
  <behavior>
    - Only exact v6 diagnostic/baseline allocation schemas with full `admitLeanAllocation` success select validation-only frame parsing; v5 still selects its existing validator and legacy v1-v4 still use their unchanged decoder.
    - Unknown labels, extra keys, wrong approval/supplement/policy/source roots, route-path overlap, cap mutations, and malformed predecessor joins reject before inflate or charge.
    - v6 exposes exactly the approved cumulative limits and unchanged runtime/startup limits; the effective close accepts the v5 conservative monotonic-ceil lead without raw-rounded mismatch.
    - The exact old v5 baseline predecessor (allocation `602a7e1b`, raw root `0a765ce8`, raw time root `8d9a3adedb736731e32c3ef75279b3da7c7f608585b0e0826954c297b28d5c0d`, terminal `00419d07df57a590288349013170461817bb8656dfc827181d3d1941d70fb114`) with zero new charges and an empty ledger is accepted without any stopped-state predicate; it authenticates 24 prior charges and the 33,812,347 ms close at 1791242322180, carries roots/time/charges only, and never invokes its old reader.
  </behavior>
  <action>Write RED tests first, then implement the additive v6 union/mode, exact schemas, disjoint diagnostic/baseline paths, allocated caps, strict selector, v5-compatible effective elapsed/ledger close rule, and finite predecessor verifier. The new policy artifact binds the inherited v5 startup policy and exact unchanged bounds. Reject extra fields and reconstruct expected allocations before acceptance. No route may default to legacy caps. No old empirical reader, historical gzip, generic pipeline behavior, helper, Strategy, Match, provider, or external dependency is introduced. Keep all LEAG requirement credit false.</action>
  <verify>
    <automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1</automated>
  </verify>
  <done>Exact v6 admission and carried accounting are behavior-tested through production admission code, while v5 and legacy compatibility tests pass unchanged and no empirical capability is exercised.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Bind v6 request, CLI, capability, startup, and publication identity end to end</name>
  <files>scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-correction.sh, scripts/run-v1-38-lean-baseline.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-factory-supervised-runtime.ts</files>
  <behavior>
    - A v6 request authenticates the exact approval, continuation supplement, reviewed source/data roots, inherited startup-policy identity, setup accounting, and immutable predecessor inventory; mutation or cross-route reuse refuses.
    - Diagnostic and conditional-baseline command names, destinations, request/allocation/check names, and unique MAIN identities are disjoint from all consumed v1-v5 routes.
    - v6 startup grant, control frame, invocation, and origin bindings correlate to the same v6 allocation without changing startup mechanism or guest/host/Match budgets; generic runtime callers cannot gain startup capability.
    - Shell/CLI parsing cannot silently route a v6 request through v5 or legacy defaults.
  </behavior>
  <action>Write route and carrier RED tests before implementation. Extend v6-specific request parsing/root derivation, exact approval and supplement consumption, command selection, 0700 destination derivation, and immutable publication identity. Extend `leanCorrectionSourceManifest` so the v6 closure pins this plan, the 20261006 approval, the policy artifact, the v6 fixture, and every runtime builder added or consumed by v6, without changing v5 manifest behavior. Thread the admitted v6 identity through the existing startup capability factory/session and CLI while retaining the same v5 control mechanism and byte-compatible v1-v5 branches. Preserve ordering constraints in contracts: reviewed source/data precede immutable allocation, same-process fresh capacity precedes charge/provider dispatch, and failed/refused diagnostic cannot select baseline. Do not authorize or run any command. Avoid editing the generic pipeline unless Task 3 proves a route-specific join is currently impossible without it.</action>
  <verify>
    <automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts --maxWorkers=1</automated>
  </verify>
  <done>Every v6 capability and route edge is bound to the exact v6 allocation identity, startup budgets are unchanged, and compatibility controls demonstrate v1-v5 paths do not acquire v6 authority.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Correlate planner authority, startup proof, and baseline-source publication</name>
  <files>scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-lean-baseline-source.ts, scripts/lib/v1-38-lean-baseline-match.ts, scripts/lib/v1-38-lean-startup-supervisor.mjs</files>
  <behavior>
    - Planner runtime startup authority and factory capability paths accept only correlated v6 identity while v5/legacy descriptors and behavior remain unchanged.
    - Startup grant/control/invocation/origin and baseline Match proof correlate to the same allocation/source/HEAD with unchanged v5 startup limits.
    - `publishLeanBaselineSource` and `publishLeanReusedBaselineSource` bind v6 route/allocation/source identity into publication consumed by retained checks; v5 publication remains byte-compatible or unchanged behavior is proven with explicit regression evidence.
    - The exact zero-charge empty-ledger predecessor remains admissible without a stopped predicate and is never opened by its old empirical reader.
  </behavior>
  <action>Write RED regressions, then minimally update `lean-experiment-authority.ts`, `planner-supervised-runtime.ts`, the baseline source publisher, baseline Match carrier, and startup supervisor so every planner/factory startup capability and newly published source artifact carries and checks the same v6 route/allocation/source/HEAD identity through retained admission. Exercise both new-source and reused-source publication paths. Preserve v5 bytes/behavior; if a seam needs no edit, prove the unchanged implementation through direct source inspection and positive/negative regression coverage. Pin all changed authority, planner, publisher, Match, and startup runtime builders in the v6 source manifest. Keep the exact zero-charge old v5 predecessor acceptable without `stopped=true`; authenticate only finite named roots, close time, and historical charge carry, and never invoke its old reader.</action>
  <verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts --maxWorkers=1</automated></verify>
  <done>Planner authority, startup capability, and both baseline-source publication paths demonstrably bind v6 identity while v5/legacy behavior remains unchanged; all new runtime builders are in the reviewed source closure.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Close retained-reader joins and pass ordered independent source gates</name>
  <files>scripts/lib/v1-38-lean-correction-retained.ts, scripts/lib/v1-38-lean-baseline-pipeline.ts, scripts/run-v1-38-lean-replay-validation-v6.test.ts</files>
  <behavior>
    - Strictly admitted v6 diagnostic and baseline evidence validate every replay frame; malformed/rehashed late frames reject, while v5 validation and older decoder behavior remain covered.
    - Retained check, no-result terminal-only selection, and actual-result reader selection bind allocation/source/HEAD and v6 route identity; no historical reader is called.
    - The exact old zero-charge empty-ledger predecessor passes finite root/time/charge custody checks without a stopped predicate or old reader invocation.
    - If no specific v6 route-aware change is needed in the baseline pipeline, it remains untouched and source verification records inspected seam plus regression evidence.
    - Independent review/fix → validation → source verification complete in order before MAIN authors new data/helper/allocation/entry.
  </behavior>
  <action>Write final RED cases, then update retained evidence selection for strict v6 admission and every publication/startup/predecessor join. Edit the baseline pipeline only if a concrete v6 identity edge requires it; otherwise leave it untouched and record inspection and regression proving no fallback or bypass. After implementation, enforce this exact gate order: (1) independent source review and bounded in-scope fixes, (2) validation of final fixed source, then (3) independent source verification against approved truths and the complete source manifest. Halt before MAIN if any gate fails or source/HEAD changes after verification. State that synthetic tests do not prove RSS feasibility, full-buffer inflate remains, and no 36-Match fit is promised. Run no helper, provider, Strategy, Match, real gzip, empirical/historical reader, allocation, or entry.</action>
  <verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1</automated></verify>
  <done>All v6 reader/publication joins and source-manifest pins pass ordered independent gates; execution remains source-only and the conditional baseline still requires separate acceptance and fresh capacity after the new v6 diagnostic.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Approval/source documents → CLI/request | Untrusted edits or stale roots must not mint v6 authority. |
| Parent/planner supervisor → startup capability/runtime builder | Startup remains narrowly capability-gated and fully correlated through both runtime authority seams. |
| Allocation → retained replay reader | Only complete exact v6 admission selects the new validator. |
| Historical custody → predecessor accounting | Prior evidence is finite read-only input, never re-opened by an empirical reader. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-16-V6-01 | Elevation of privilege | v6 request, CLI, planner/factory startup authority | high | mitigate | Exact schemas, allocation reconstruction, and correlated v6 roots; generic runtime remains unable to issue startup capability. |
| T-265-16-V6-02 | Tampering | v6 allocation, source publisher/manifest, replay selection | high | mitigate | Disjoint paths, full admission before validator selection, identity-bound publication, and manifest pins for plan/approval/policy/fixture/runtime builders. |
| T-265-16-V6-03 | Information disclosure | private evidence and replay reader | medium | mitigate | Preserve private-only outputs and existing source/Strategy/memory/objective payload exclusions. |
| T-265-16-V6-04 | Repudiation | carried clock and predecessor inventory | high | mitigate | Bind monotonic-ceil elapsed, conservative close, exact predecessor roots and ledger semantics; do not infer zero-ledger stop state. |
| T-265-16-V6-SC | Supply-chain tampering | runtime builder/source closure | medium | mitigate | Pin every builder and new fixture/policy/plan/approval in the reviewed source manifest; no new packages. |
</threat_model>

<verification>
Run the focused new v6 synthetic suite and unchanged v5 compatibility suite. Review the complete diff against approval, research, source verification, v5 decoder/cap/policy/control-byte identities, and source manifest closure. Complete independent source review/fixes → validation → source verification, in that order, before MAIN prepares any new artifacts. Test/report/admin costs continue to count against carried time. Do not run the old full reader or any empirical helper/provider/Strategy/Match.
</verification>

<success_criteria>
The exact v6 route is strictly isolated and fully joined from approval through retained check; v1-v5 compatibility and all fixed limits remain intact; source-only gates pass; no empirical work or phase credit is claimed.
</success_criteria>

<output>
Create a concise Plan 265-16 v6 source summary with reviewed source/manifest roots, focused test results, gate outcomes, unresolved limits, and explicit source-only authority. MAIN may proceed to separately reviewed new data/helper/allocation/entry only after the three ordered source gates pass and within remaining carried caps.
</output>
