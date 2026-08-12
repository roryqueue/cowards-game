---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "03"
type: execute
wave: 29
depends_on:
  - 262-33
blocked_by:
  - developer-routing-decision-and-required-replan
files_modified:
  - .planning/ROADMAP.md
  - .planning/STATE.md
autonomous: false
requirements: []
deferred_requirements:
  - MEAS-01
  - MEAS-02
  - MEAS-03
  - MEAS-04
must_haves:
  truths:
    - "The only valid current branch after Plan 262-33 remains calibration_stopped with fresh 0 charged, 0 accepted, and ADMIT-03 blocked."
    - "Autonomous execution stops at this checkpoint; it cannot begin measurement work or advance to Plan 262-04."
    - "The developer may choose only milestone stop, planning a separately authorized new route, or planning a dependency revision that preserves ADMIT-03 as unmet."
    - "Every choice routes through a fresh $gsd-plan-phase 262 run before any measurement implementation."
  artifacts:
    - path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md
      provides: "Read-only offline verdict and immutable stopped-route facts"
    - path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-SUMMARY.md
      provides: "Read-only developer-decision handoff"
  key_links:
    - from: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md
      to: "$gsd-plan-phase 262"
      via: "All three checkpoint choices require a new executable plan; none resumes this dormant file"
---

<objective>
Stop autonomous execution after Plan 262-33 and obtain a developer routing decision without implementing or completing any measurement requirement.

Purpose: The offline successor cannot change the immutable `calibration_stopped` fresh 0/0 terminal or satisfy ADMIT-03. This file is a dormant checkpoint, not an implementation plan.
Output: A developer-selected routing instruction for a fresh `$gsd-plan-phase 262` run. No source, test, artifact, live, or measurement output is created.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:decision" gate="blocking-human">
  <name>Checkpoint: Stop and choose the next planning route</name>
  <files>.planning/ROADMAP.md, .planning/STATE.md (planning-route record only; no requirement completion)</files>
  <decision>Which planning route, if any, should follow the completed offline successor?</decision>
  <context>Read Plan 262-33's verdict and summary. The valid current branch remains exactly `calibration_stopped`, fresh 0 charged/0 accepted, ADMIT-03 blocked, reproduction:v10 and its marker absent, authority expired, and no retry. Even an offline proof pass is diagnostic only. Autonomous execution MUST stop here and this checkpoint cannot mark MEAS-01 through MEAS-04 complete.</context>
  <action>Present only the three routing options below. Do not execute, edit, test, create a summary, mark a requirement complete, or advance to Plan 262-04. After the developer selects an option, terminate execute-phase and route that selection into a fresh `$gsd-plan-phase 262` invocation.</action>
  <options>
    <option id="stop-milestone">
      <name>Stop milestone</name>
      <pros>Preserves every immutable failure and closes autonomous work without inventing authority.</pros>
      <cons>The remaining Phase 262 requirements stay incomplete.</cons>
    </option>
    <option id="plan-new-route">
      <name>Plan new route</name>
      <pros>Allows a separately scoped proposal for fresh authority and evidence while preserving every prior charge and stopped root.</pros>
      <cons>No route, authority, or live execution exists until a new plan is discussed, checked, and approved.</cons>
    </option>
    <option id="plan-dependency-revision">
      <name>Plan dependency revision</name>
      <pros>Allows the milestone graph or acceptance dependency to be reconsidered explicitly while ADMIT-03 remains unmet.</pros>
      <cons>The revision cannot silently waive ADMIT-03 or authorize measurement implementation.</cons>
    </option>
  </options>
  <how-to-verify>
    1. Confirm Plan 262-33 says `calibration_stopped`, fresh 0/0, and ADMIT-03 blocked.
    2. Select exactly one option.
    3. Stop execute-phase; run `$gsd-plan-phase 262` with the selected route before any measurement implementation.
  </how-to-verify>
  <verify>
    <human-check>Confirm the selected response is exactly one of the three planning routes and that execute-phase stopped without implementation or requirement completion.</human-check>
  </verify>
  <resume-signal>Do not resume this plan. Record `stop-milestone`, `plan-new-route`, or `plan-dependency-revision`, then run `$gsd-plan-phase 262`.</resume-signal>
  <done>A single planning route is recorded, autonomous execution is stopped, and no measurement requirement or downstream plan is completed.</done>
</task>

</tasks>

<deferred_implementation_contract>

This section is non-executable reference material for the required future replan. It preserves the former Plan-262-03 measurement scope without granting implementation authority or requirement credit.

| Deferred requirement | Preserved implementation scope for future planning |
|---|---|
| MEAS-01 | Define an immutable study contract for separately adapted fixed-factory metagames, explicit paired contrasts, complete cell identities, splits, opponent fields, semantic arenas, sides, entrant initiative, matched seed blocks, response/stopping/finalist/portfolio/robust-pure selection, and oracle-relative claims per D-11, D-12, and D-17. |
| MEAS-02 | Define the complete multi-resource opportunity vector and immutable retry lineage across candidate, response, search, teacher, distillation, Match, model, human, replay, cache, hardware/runtime, and artifact-limit dimensions per D-13. |
| MEAS-03 | Freeze metric code, denominators, hard/compensating gates, stopping, response/finalist rules, interpretation, claim grammar, starting calibration values, admissibility bounds, exact benchmark roots, and parameter-specific selectors before candidate output per D-11 through D-17. |
| MEAS-04 | Preserve separate charged-work and accepted-cell ledgers; rejected, invalid, duplicate, failed, system-failed, retried, unfilled, and unused work remains charged and can never become accepted gameplay evidence per D-05 and D-16. |

The prior intended destinations remain `scripts/lib/v1-38-study-contract.ts`, `scripts/evaluate-v1-38-foundation-contract.test.ts`, and `.planning/artifacts/v1.38-calibration-freeze-policy.json`. The preserved behaviors include `V138StudyContractSchema`, `V138CalibrationFreezePolicySchema`, `deriveV138CalibrationFreezePolicy`, `validateV138AccountingClosure`, and `calibrateV138StudyContract`, plus deterministic profile-neutral calibration using only admitted historical regression and synthetic inputs. A future plan must re-evaluate dependencies, exact evidence inputs, tests, custody, and authorization from the then-current branch; nothing in this section may be executed directly.

</deferred_implementation_contract>

<threat_model>

## Trust Boundaries

| Boundary | Description |
|---|---|
| Offline proof -> developer decision | Diagnostic success must not become measurement authority. |
| Developer choice -> future implementation | Every choice must pass through a new checked plan. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-262-03-01 | Elevation of Privilege | dormant checkpoint | high | mitigate | No auto task, empty requirements, mandatory stop, and fresh plan-phase for all options. |
| T-262-03-02 | Tampering | immutable route status | high | mitigate | Present exact checked calibration_stopped/0/0/blocked facts without writer authority. |

</threat_model>

<source_audit>

| Source | Item | Coverage | Plan path |
|---|---|---|---|
| GOAL | Immutable admission before research | COVERED as stop | Checkpoint refuses autonomous progress under blocked ADMIT-03. |
| REQ | MEAS-01..MEAS-04 | DEFERRED TO REQUIRED REPLAN; NOT CLAIMED | Non-executable contract preserves exact scope; `requirements: []` prevents completion credit. |
| RESEARCH | Developer decision after offline A6 proof | COVERED | Sole blocking-human task. |
| CONTEXT | D-01, D-02, D-05, D-11..D-17 | COVERED | Immutable stop plus preserved deferred contract. |
| CONTEXT | New live route or dependency change | REQUIRES NEW PLAN | Options authorize planning only, never implementation. |

</source_audit>

<verification>

No implementation or project verification command is authorized. Confirm the task inventory contains exactly one blocking-human checkpoint, no auto task, no source/test/artifact path in `files_modified`, `requirements: []`, and all three options route to `$gsd-plan-phase 262` before work.

</verification>

<success_criteria>

- Autonomous execution stops with the current calibration_stopped/0/0/ADMIT-03-blocked branch intact.
- Exactly one of the three planning routes is selected.
- No requirement is completed, no 262-03 summary is created, and no downstream plan begins.
- A fresh `$gsd-plan-phase 262` run is required before any measurement implementation.

</success_criteria>

<output>
Do not create `262-03-SUMMARY.md`. Stop execute-phase and route the selected option to `$gsd-plan-phase 262`.
</output>
