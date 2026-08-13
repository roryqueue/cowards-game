---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "46"
type: execute
wave: 38
depends_on: [262-45]
files_modified:
  - scripts/verify-v1-38-local-seal.ts
  - scripts/verify-v1-38-local-seal.test.ts
  - .planning/artifacts/v1.38-local-seal-independent-verification-v1.json
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-46-REVIEW.md
autonomous: true
requirements: [SEAL-01]
must_haves:
  truths:
    - "A verifier that did not author Plan 262-45 independently reproduces all non-secret roots and tests the local-seal implementation read-only; this is independent evidence review, never independent custody."
    - "Mutation of bundle, commitment, event chain, request, freeze root, result, receipt, claim wording, or protected historical bytes fails closed."
    - "Second opening, crash-before-result, dirty-tree/freeze mismatch, seeded privacy leak, generic debug API, and misleading custody claims are detected."
    - "The verification artifact can satisfy revised SEAL-01 only for single_operator_local_seal_v1 and leaves ADMIT-03, Phase 262, formation, public, and production authority false."
  artifacts:
    - path: scripts/verify-v1-38-local-seal.ts
      provides: "Read-only clean-checkout verifier and claim-boundary linter"
    - path: .planning/artifacts/v1.38-local-seal-independent-verification-v1.json
      provides: "Content-addressed independent mechanics review result"
    - path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-46-REVIEW.md
      provides: "Reviewer identity separation, findings, commands, and exact verdict"
  key_links:
    - from: .planning/artifacts/v1.38-local-seal-protocol-v1.json
      to: .planning/artifacts/v1.38-local-seal-independent-verification-v1.json
      via: "Byte-identical regeneration plus adversarial mutation matrix"
      pattern: "localSealProtocolRoot"
    - from: .planning/artifacts/v1.38-local-seal-independent-verification-v1.json
      to: .planning/REQUIREMENTS.md
      via: "Revised SEAL-01 proof only; no ADMIT-03 credit"
      pattern: "satisfiesRevisedSeal01"
---

<objective>
Independently verify the local-seal mechanics and reduced claim boundary without implying custody independence, completing the proof side of D-19R/D-20R.

Purpose: Ensure the new trust model is both mechanically sound within its stated scope and honest about what one operator cannot prove.
Output: A separate verifier/test suite, clean-checkout review, immutable evidence artifact, and review report.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md

Execution must assign the review to an agent/person that did not author Plan 262-45. The reviewer may read and execute tests but must not alter Plan 262-45 implementation while producing the first verdict. Any finding routes to a separately committed fix and a fresh full rerun before PASS.
</execution_context>

<context>
@AGENTS.md
@.planning/REQUIREMENTS.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-LOCAL-SEALED-HOLDOUT-RESEARCH.md
@.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-45-SUMMARY.md
@scripts/lib/v1-38-local-seal.ts
@scripts/evaluate-v1-38-local-seal.test.ts
@.planning/artifacts/v1.38-local-seal-protocol-v1.json
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build a read-only adversarial verifier and claim lint</name>
  <files>scripts/verify-v1-38-local-seal.ts, scripts/verify-v1-38-local-seal.test.ts</files>
  <behavior>
    - Clean synthetic stores reproduce the exact commitment, request, event-ledger, safe-receipt, protocol, and policy roots.
    - One-bit/root/key/order/sequence/state/allowlist/cardinality/byte mutation rejects with a stable public-safe reason.
    - A consumed opening can never return to armed or launch a second callback, including after a thrown callback or process-failure fixture.
    - Contract carriers and schemas reject any statement or field implying independent, third-party, separately permissioned, externally authenticated, host-complete, cryptographically erased, or malicious-owner-resistant custody.
    - Historical Plan 262-40/42/43 and terminal-deferment hashes remain exact; no candidate, formation, live route, activation, public local-seal reference, or production path is reachable.
  </behavior>
  <action>Write the verifier tests first and implement a read-only verifier that imports only public local-seal verification surfaces and repository canonical/privacy helpers. It must create only disposable synthetic stores outside the repository, never a real holdout, and clean them after terminal retirement. Add AST/export, exact-schema, artifact absence, cross-carrier wording, protected-hash, dirty-tree/freeze mismatch, and privacy-seed checks. Its output is a bounded structured result; no local path, secret, raw event, preimage, actor identity, Strategy private data, or host diagnostic may be printed. Preserve D-01 through D-06 and D-18 through D-22.</action>
  <verify><automated>pnpm exec vitest run scripts/verify-v1-38-local-seal.test.ts scripts/evaluate-v1-38-local-seal.test.ts --maxWorkers=1</automated></verify>
  <done>The independent verifier detects every required mechanical, history, reachability, privacy, and claim-boundary mutation.</done>
</task>

<task type="auto">
  <name>Task 2: Run clean-checkout review and freeze the revised SEAL-01 verdict</name>
  <files>.planning/artifacts/v1.38-local-seal-independent-verification-v1.json, .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-46-REVIEW.md</files>
  <action>From an exact clean checkout of the Plan 262-45 source commit, independently regenerate/check the protocol artifact, run both focused suites serially, run the dependency-revision boundary checker and typecheck, and inspect the closed exports plus claim wording. Write a review with reviewer/source separation, exact commit/tree, commands, root joins, findings, and the explicit limitation that this is independent evidence verification rather than independent custody. If and only if there are zero unresolved findings, exclusively write a canonical verification artifact with `assuranceClass: single_operator_local_seal_v1`, `satisfiesRevisedSeal01: true`, `independentCustodyClaimed: false`, `admit03Status: blocked`, and every downstream authority false. A finding produces a FAIL artifact/report and stops; it cannot be waived or silently repaired within the review commit.</action>
  <verify><automated>pnpm exec vitest run scripts/verify-v1-38-local-seal.test.ts scripts/evaluate-v1-38-local-seal.test.ts --maxWorkers=1 &amp;&amp; pnpm exec tsx scripts/evaluate-v1-38-local-seal.ts --check &amp;&amp; pnpm exec tsx scripts/verify-v1-38-local-seal.ts --check &amp;&amp; pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check &amp;&amp; pnpm turbo typecheck --concurrency=1 &amp;&amp; git diff --check</automated></verify>
  <done>Revised SEAL-01 has an independent, clean-checkout, zero-finding mechanics verdict with no inflated custody claim and no downstream authority.</done>
</task>

</tasks>

<source_coverage_audit>
SOURCE | ID | Feature/Requirement | Plan | Status | Notes
GOAL | — | Independently validate the local seal before activation | 262-46 | COVERED | Reviewer separate from implementer.
REQ | SEAL-01 | Verified named-operator local seal and explicit limits | 262-46 | COVERED | May pass only revised requirement.
REQ | ADMIT-03 | Matrix reproduction | 262-47 | COVERED | Explicitly excluded from credit here.
RESEARCH | Mutation, privacy, claim lint, history, reachability | 262-46 | COVERED | Full adversarial matrix.
CONTEXT | D-01..D-22, D-19R/D-20R | Fail-closed independent evidence review | 262-46 | COVERED | No independent custody claim.
</source_coverage_audit>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|---|---|
| implementation -> independent verifier | Verifier must not trust author-produced verdicts. |
| synthetic local store -> review evidence | Private fixtures remain local; only bounded roots cross. |
| evidence review -> requirement status | Review may satisfy revised SEAL-01 only. |
## STRIDE Threat Register
| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-262-46-01 | Spoofing | reviewer/assurance wording | high | mitigate | Record independent author/reviewer commits and lint excluded claims. |
| T-262-46-02 | Tampering | roots/history | critical | mitigate | Clean-checkout regeneration and mutation matrix. |
| T-262-46-03 | Information Disclosure | verifier output | critical | mitigate | Exact public-safe schema and seeded leak tests. |
| T-262-46-04 | Elevation of Privilege | requirement credit | critical | mitigate | Exact satisfiesRevisedSeal01 field with ADMIT/downstream denials. |
| T-262-46-SC | Tampering | package installs | low | accept | No package installation occurs. |
</threat_model>

<verification>
- Independent review is performed from a clean source commit by a non-author.
- All focused tests, checker, typecheck, protected-history, and absence gates pass.
- The artifact says independent custody is not claimed and ADMIT-03 remains blocked.
</verification>

<success_criteria>
- Revised SEAL-01 is either truthfully proven or the plan stops with a durable finding.
- No local-seal privacy material or path enters Git or output.
- Formation, candidate, live route, public/default, and production authority remain false.
</success_criteria>

<output>Create `262-46-SUMMARY.md` only after zero-finding independent verification; otherwise create the review/failure artifact and stop without a summary.</output>
