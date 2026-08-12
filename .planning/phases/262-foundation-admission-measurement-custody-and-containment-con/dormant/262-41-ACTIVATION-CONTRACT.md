---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "41"
type: execute
wave: 36
depends_on: [262-39, 262-40]
blocked_by:
  - future-separately-planned-literal-admit-03-pass
  - genuine-seal-01-pass
supersedes:
  - plan: 262-07
    responsibility: foundation-activation-root
files_modified:
  - scripts/evaluate-v1-38-foundation-activation.ts
  - scripts/evaluate-v1-38-foundation-activation.test.ts
  - .planning/artifacts/v1.38-foundation-activation-root.json
autonomous: true
requirements: [ADMIT-01, ADMIT-02, ADMIT-03, ADMIT-04, SEAL-01]
must_haves:
  truths:
    - "This plan is dormant until a separately planned future route produces a literal current-rules ADMIT-03 pass and Plan 262-40 produces genuine SEAL-01 evidence."
    - "The foundation_activation_root is a distinct domain from the non-authorizing pre_search_policy_root and accepts only the exact two-latch conjunction."
    - "Activation may release Phase 263 candidate-search work only; formation materialization remains denied until the current-rules league freeze in Phase 266, and production remains denied."
  artifacts:
    - path: scripts/evaluate-v1-38-foundation-activation.ts
      provides: "Dormant exact two-latch activation evaluator"
      exports: [generateV138FoundationActivationRoot, checkV138FoundationActivationRoot]
    - path: .planning/artifacts/v1.38-foundation-activation-root.json
      provides: "Activation root emitted only after literal ADMIT-03 and genuine SEAL-01 passes"
  key_links:
    - from: .planning/artifacts/v1.38-foundation-activation-root.json
      to: .planning/artifacts/v1.38-pre-search-policy-root.json
      via: "distinct-domain exact policy identity binding"
      pattern: "foundation_activation_root"
    - from: .planning/artifacts/v1.38-foundation-activation-root.json
      to: .planning/artifacts/v1.38-custody-public-reference.json
      via: "genuine custody pass, never synthetic substitution"
      pattern: "satisfiesSeal01"
  prohibitions:
    - statement: "Do not execute this plan from the current blocked state, plan a live route here, reuse expired route 5/A6 material, or infer either latch."
      status: locked
      verification: "Blocked-by metadata, exact-literal tests, and dependency-boundary monitor."
---

<objective>
Define the dormant foundation activation root that can exist only after literal future ADMIT-03 and genuine SEAL-01 passes per D-01, D-02, D-03, D-04, D-05, D-06, D-18, D-21, and D-22.

Purpose: Make the final authority boundary exact without granting present authority or planning any live work.
Output: A tested activation evaluator and root schema, executable only after both separately supplied blockers clear.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-39-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-40-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-DEPENDENCY-REVISION-RESEARCH.md
</context>

<tasks>
<task type="auto" tdd="true">
  <name>Task 1: Define the dormant exact two-latch activation evaluator</name>
  <files>scripts/evaluate-v1-38-foundation-activation.ts, scripts/evaluate-v1-38-foundation-activation.test.ts</files>
  <read_first>
    <file>scripts/lib/v1-38-policy-authority.ts</file>
    <file>.planning/artifacts/v1.38-pre-search-policy-root.json</file>
    <file>.planning/artifacts/v1.38-custody-public-reference.json</file>
    <file>.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md</file>
  </read_first>
  <action>Before implementation, assert that both frontmatter blockers are supplied by completed, separately planned work. Write exact and mutation tests for a distinct `foundation_activation_root` schema/domain. Require the pre-search policy root with all measurement/policy requirements ready; a new current-rules matrix admission receipt whose literal status is `reproduction_passed`, whose fresh counts are exactly 540 charged and 540 accepted with zero invalid/system failures, and whose authority is valid; and a genuine Plan 262-40 custody reference with `satisfiesSeal01: true`. Reject the current blocked verdict, expired/no-retry route 5, A6, historical routes/artifacts, synthetic custody, inferred counts, alternative literals, missing bindings, formation inputs, and production inputs per D-01/D-02/D-03/D-04. Keep formation and production authority false.</action>
  <acceptance_criteria>
    - The current repository state fails the activation precondition explicitly and cannot emit a root.
    - Only exact literal ADMIT-03 and genuine SEAL-01 evidence can satisfy the two latches.
    - Historical, expired, synthetic, inferred, or policy-only inputs fail closed.
    - Activation schema remains domain-separated from the policy root.
  </acceptance_criteria>
  <verify><automated>pnpm exec vitest run scripts/evaluate-v1-38-foundation-activation.test.ts --maxWorkers=1 &amp;&amp; pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check</automated></verify>
  <done>The dormant evaluator has an exact, testable authority boundary and cannot run from present evidence.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Emit activation only after both independent blockers clear</name>
  <files>scripts/evaluate-v1-38-foundation-activation.ts, scripts/evaluate-v1-38-foundation-activation.test.ts, .planning/artifacts/v1.38-foundation-activation-root.json</files>
  <read_first>
    <file>.planning/artifacts/v1.38-pre-search-policy-root.json</file>
    <file>.planning/artifacts/v1.38-custody-public-reference.json</file>
    <file>.planning/ROADMAP.md</file>
    <file>.planning/STATE.md</file>
  </read_first>
  <action>After Task 1 tests and both external blockers pass, generate the activation root from exact canonical bytes with separate policy, admission, and custody identities. Set `satisfiesAdmit03: true`, `satisfiesSeal01: true`, `candidateSearchAuthorized: true`, and `phase263Authorized: true`; retain `formationMaterializationAuthorized: false` until Phase 266 current-rules league freeze and `productionAuthorized: false`. Prove deterministic write/check identity and mutations for either latch, bindings, counts, literals, or authority fields. Keep the public projection bounded and privacy-safe. Do not create a route, candidate, formation, live work item, or production artifact.</action>
  <acceptance_criteria>
    - No activation artifact exists unless both exact latches and every binding pass.
    - An emitted root deterministically binds policy, fresh admission, and genuine custody evidence.
    - Phase 263 candidate-search authority is the only downstream capability released.
    - Formation remains gated by Phase 266 and production remains denied.
  </acceptance_criteria>
  <verify><automated>pnpm exec vitest run scripts/evaluate-v1-38-foundation-activation.test.ts --maxWorkers=1 &amp;&amp; pnpm exec tsx scripts/evaluate-v1-38-foundation-activation.ts --check &amp;&amp; pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check</automated></verify>
  <done>A foundation activation root can be emitted only after literal ADMIT-03 and genuine SEAL-01 pass, without materializing later-phase work.</done>
</task>
</tasks>

<artifacts_this_phase_produces>
- `scripts/evaluate-v1-38-foundation-activation.ts`: exact dormant activation writer/checker.
- `scripts/evaluate-v1-38-foundation-activation.test.ts`: two-latch, mutation, privacy, and no-authority-before-pass coverage.
- `.planning/artifacts/v1.38-foundation-activation-root.json`: conditional activation root, absent in the current blocked state.
</artifacts_this_phase_produces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| admission and custody evidence to activation | Two independent untrusted evidence streams cross into one capability grant |
| activation to Phase 263 | A bounded authority projection crosses into downstream planning |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-262-41-01 | Spoofing | Admission/custody latches | high | mitigate | Exact identity/literal/count validation; reject historical and synthetic substitutes. |
| T-262-41-02 | Tampering | Activation root | high | mitigate | Canonical bytes, domain-separated root, deterministic checker, mutation tests. |
| T-262-41-03 | Elevation of Privilege | Downstream authority | high | mitigate | Release only candidate search/Phase 263; formation and production remain false. |
| T-262-41-04 | Information Disclosure | Public projection | high | mitigate | Bounded opaque references and privacy monitor; no private runtime data. |
</threat_model>

<verification>
Static dependency checks must prove this plan is unreachable today. When separately unblocked, exact/mutation tests, deterministic checks, formation-absence, privacy, protected-history, no-live-work, and no-production monitors must all pass.
</verification>

<success_criteria>
The dependency graph contains an exact dormant activation boundary. Present state remains blocked; future activation requires literal current-rules ADMIT-03 plus genuine SEAL-01 and releases no formation or production work.
</success_criteria>

<source_audit>
| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Split non-authorizing policy readiness from final foundation activation | Plans 262-34..41 | COVERED |
| REQ | ADMIT-01, ADMIT-02, ADMIT-04 | Plans 262-34, 262-39, 262-41 | COVERED |
| REQ | ADMIT-03 | Plans 262-34, 262-39, 262-41 | COVERED AS BLOCKED UNTIL SEPARATE FUTURE PASS |
| REQ | MEAS-01..04 | Plan 262-35 | COVERED |
| REQ | MEAS-05..09 | Plan 262-36 | COVERED |
| REQ | MEAS-10, DECI-02 | Plan 262-37 | COVERED |
| REQ | SEAL-01 | Plans 262-38, 262-40, 262-41 | COVERED; GENUINE CREDIT BLOCKING |
| RESEARCH | Graph/status revision, policy modules, synthetic custody, genuine custody, two-latch activation | Plans 262-34..41 | COVERED |
| CONTEXT | D-01..D-22 locked decisions | Plans 262-34..41 | COVERED |
| CONTEXT | Deferred candidate, formation, production, and live-route work | Excluded | EXCLUSION, NOT A GAP |
</source_audit>

<output>Create `262-41-SUMMARY.md` only after both blockers clear and execution completes; otherwise leave this plan dormant.</output>
