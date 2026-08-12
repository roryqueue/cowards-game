---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "40"
type: execute
wave: 35
depends_on: [262-39]
supersedes:
  - plan: 262-06
    responsibility: genuine-operational-custody
files_modified:
  - .planning/artifacts/v1.38-custody-public-reference.json
autonomous: false
requirements: [SEAL-01]
user_setup:
  - service: sealed-holdout-custody
    why: "Only an approved operational control plane can supply genuine private holdout custody evidence."
    dashboard_config:
      - task: "Provide the approved opaque custody reference and independent control attestations without exposing private identities, sources, memory, objectives, or holdout contents."
        location: "Approved sealed-holdout custody control plane"
must_haves:
  truths:
    - "SEAL-01 remains unmet until genuine, independently controlled private holdout custody is evidenced."
    - "Synthetic custody mechanics, historical route artifacts, and self-issued attestations never receive SEAL-01 credit."
    - "Even a genuine custody pass cannot satisfy ADMIT-03, complete Phase 262, authorize Phase 263, or authorize candidate search, formation, or production."
  artifacts:
    - path: .planning/artifacts/v1.38-custody-public-reference.json
      provides: "Bounded public reference to genuine custody evidence, created only after closed mechanical validation and blocking human separation-of-duties verification"
  key_links:
    - from: .planning/artifacts/v1.38-custody-public-reference.json
      to: .planning/artifacts/v1.38-pre-search-policy-root.json
      via: "independent custody identity and policy-root binding without authority promotion"
      pattern: "genuine_operational_custody"
  prohibitions:
    - statement: "No executor may invent, self-approve, infer, or substitute operational custody evidence."
      status: locked
      verification: "Blocking-human checkpoint plus exact evidence provenance checks."
---

<objective>
Obtain a genuine operational custody reference for SEAL-01 only through separate human-controlled evidence per D-19, D-20, D-21, and D-22.

Purpose: Keep synthetic mechanics distinct from real separation of duties and fail closed while those controls are unavailable.
Output: A bounded public custody reference only after the blocking checkpoint is approved; otherwise no artifact and SEAL-01 remains pending.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-38-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-39-SUMMARY.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-33-VERDICT.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-PATTERNS.md
</context>

<tasks>
<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Verify genuine operational custody and separation of duties</name>
  <files>.planning/artifacts/v1.38-custody-public-reference.json</files>
  <read_first>
    <file>.planning/artifacts/v1.38-synthetic-custody-mechanics.json</file>
    <file>.planning/artifacts/v1.38-pre-search-policy-root.json</file>
    <file>.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-DEPENDENCY-REVISION-RESEARCH.md</file>
    <file>scripts/check-v1-38-authorized-custody-handoff.ts</file>
  </read_first>
  <action>Follow the externally authenticated custody-handoff and bounded public-reference patterns mapped in `262-PATTERNS.md`. First run the exact produced custody test path and all policy-root, privacy, protected-history, no-authority, no-live-work, formation-absence, and boundary checks. Require `COWARDS_V1_38_AUTHORIZED_CUSTODY_HANDOFF` to identify the supplied opaque handoff, then run `scripts/check-v1-38-authorized-custody-handoff.ts --check` against the exact pre-search policy root. Mechanical validation must pass the closed schema for commitment profile/digest; approved opaque store/key/trust identities; one-open actor/command; access/query ledgers; safe-projection field/cardinality/byte bounds; contamination response; retention and retirement authority; profile-neutral lineage exclusions across source/training/prompts/caches/opponent/schedule construction; exact policy-root binding; and authenticated external provenance. Missing, extra, self-issued, unauthenticated, stale, mismatched, or invalid evidence keeps SEAL-01 pending and emits no reference. Only after that pass, pause for the developer to judge genuine separation of duties: the approved custodian, opening actor, trust authority, and study/operator lane are operationally distinct; discovery/selection identities remain hidden; release is independently controlled; and the bounded projection exposes no protected content. Human approval cannot waive or replace mechanical validation. After approval, invoke the checker’s bounded write-reference mode; set `satisfiesSeal01: true` only from the mechanically passed handoff, retain every downstream authority field false, and bind the exact policy root per D-19/D-20/D-21.</action>
  <acceptance_criteria>
    - Genuine private custody, separation of duties, immutable hidden selection, and controlled release are independently verified.
    - The public artifact contains only opaque identities and non-sensitive attestations.
    - Missing or unverifiable controls keep SEAL-01 pending and produce no custody reference.
    - Human approval is reachable only after the closed handoff validator passes every required field and authenticated provenance check.
    - Candidate search, Phase 263, formation materialization, and production remain denied regardless of custody outcome.
  </acceptance_criteria>
  <verify>
    <automated>test -n "$COWARDS_V1_38_AUTHORIZED_CUSTODY_HANDOFF" &amp;&amp; pnpm exec vitest run scripts/evaluate-v1-38-custody.test.ts scripts/evaluate-v1-38-pre-search-policy.test.ts --maxWorkers=1 &amp;&amp; pnpm exec tsx scripts/check-v1-38-authorized-custody-handoff.ts --check --input "$COWARDS_V1_38_AUTHORIZED_CUSTODY_HANDOFF" --policy-root .planning/artifacts/v1.38-pre-search-policy-root.json &amp;&amp; pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check</automated>
    <human-check>Confirm the named external control plane and its independent attestations exist, are genuine, and disclose no protected data; type "approved" only when every listed control is independently evidenced.</human-check>
  </verify>
  <done>SEAL-01 receives credit only from genuine operational custody; otherwise this plan remains blocked without weakening any downstream denial.</done>
</task>
</tasks>

<artifacts_this_phase_produces>
- Conditional `.planning/artifacts/v1.38-custody-public-reference.json`: bounded genuine-custody reference; absent while the checkpoint is blocked.
</artifacts_this_phase_produces>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| approved custody control plane to public reference | Human-controlled private evidence crosses into a bounded public attestation |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-262-40-01 | Spoofing | Custody attestations | high | mitigate | Closed authenticated handoff validation precedes human separation-of-duties judgment; reject self-issued or synthetic substitutes. |
| T-262-40-02 | Information Disclosure | Public custody reference | high | mitigate | Opaque identities only; automated privacy scans and explicit human review. |
| T-262-40-03 | Elevation of Privilege | Custody-to-authority projection | high | mitigate | All downstream authority fields remain false; ADMIT-03 is evaluated separately. |
</threat_model>

<verification>
Automated checks must pass before the checkpoint. Human approval must cover genuine independent controls, privacy, and provenance; lack of evidence is a blocking result, not a waiver.
</verification>

<success_criteria>
SEAL-01 is either genuinely evidenced through a bounded public reference or remains explicitly pending. No other requirement, phase, search, formation, or production authority changes.
</success_criteria>

<source_audit>
| Source | Item | Coverage | Status |
|---|---|---|---|
| GOAL | Genuine custody control | Task 1 | COVERED AS BLOCKING |
| REQ | SEAL-01 | Task 1 | COVERED, CREDIT CONDITIONAL |
| RESEARCH | Separate synthetic mechanics from operational authorization | Task 1 | COVERED |
| CONTEXT | D-19..D-22 | Task 1 | COVERED |
</source_audit>

<output>Create `262-40-SUMMARY.md` only after the checkpoint resolves; record either genuine credit or continued blockage exactly.</output>
