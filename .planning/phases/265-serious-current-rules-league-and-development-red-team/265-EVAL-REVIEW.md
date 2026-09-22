# EVAL-REVIEW — Phase 265: Serious Current-Rules League and Development Red Team

**Audit Date:** 2026-09-21
**Audit basis:** State A — `265-AI-SPEC.md`; original evaluation re-audit at `244e6a2a` reconciled by main with independent source review at `9c910d828776d9f1497493f72f6be775d09acc67`.
**AI-SPEC Present:** Yes
**Overall Score:** 24/100
**Verdict:** NOT IMPLEMENTED — empirical evaluation evidence only

This is an outcome audit, not a source-gate score. The captured repaired baseline
(29/29 suites, 267/267 tests, 1652.36 s at `5d554920`) predates the final bounded-memory
repairs. The gate at `967742cb` passed268/269 and exposed a failed-probe count
regression; the original test now passes on reviewed repair `9c910d82`, whose
complete gate is running. Independent source
review closes the preceding-target linkage, AST matcher linkage, charged/partial
failure paths, and final retained-memory defect. No Phase 265 allocation root,
real candidate/Match/model/human/external record, retained empirical result, or
independent retained-run verification exists. The planned empirical evaluation
therefore has not been delivered. It is pending the one Task 2 allocation/
participant decision; this expected absence is not a source or rules defect.

## Dimension Coverage

**Latest source-readiness amendment:** the current265-REVIEW.md CR-01 confirms
full-Match encode-before-chunk failure using read-only old execution data.
Synthetic small fixtures did not expose this. Bounded storage and associated
failure-prefix repair remain required before the allocation checkpoint. This
does not change the24/100 empirical score or grant any empirical authority.

| Dimension | Status | Measurement | Finding |
|-----------|--------|-------------|---------|
| Complete condition-balanced payoff matrix | MISSING | Code + empirical Match evidence | `matrix.ts`/`matrix.test.ts` implement the 8-cell, alias-aware fail-closed reducer, but there are zero allocated Phase 265 cells or retained actual terminals/traces. The injected 8-cell integration uses fabricated `MATCH_ENDED` terminal data. |
| Exact solver and replay determinism | MISSING | Code + retained replay bytes | `solver.test.ts` exercises golden, boundary, permutation, layout, worker/shard, restart, and 12/13-policy inputs, but no retained empirical snapshot/replay has been solved and reconstructed. |
| Response targeting and charged completion | MISSING | Code + empirical allocation reconciliation | PSRO/red-team code and the 122+48 injected positive-response loop exist, but all four real channels have no Phase 265 allocation, starts, terminals, charges, or response-round evidence. |
| Diversity and novelty | MISSING | Code + empirical candidate/fingerprint evidence | Pair-backed diversity and Phase 264 import controls are implemented, but no Phase 265 candidate population demonstrates 12 Strategies, six families, five independent cores, or three finalists. |
| Mixture versus pure selection | MISSING | Code + empirical score/reducer evidence | Conjunctive selection and no-finalist paths are source-covered, but no empirical portfolio/disposition exists. Re-audit confirms v5 linked response evidence measures each response against its preceding frozen round target, records the next snapshot/population, requires distinct consecutive accepted responses, and rejects contemporaneous-snapshot tampering in the connected test. |
| Invariance, legality, and runtime integrity | MISSING | Code + paired empirical contrasts | The source implements all nine probe families and host-issued runtime checks, but only injected callbacks have run; no actual paired contrasts, supervised provider trace, or retained runtime evidence exists. |
| Privacy and claim boundary | MISSING | Static/code checks + actual report audit | Boundary scans, denylisted report fields, and oracle-relative claim rejection are source-covered, but there is no actual Phase 265 private report/trace root to audit for real disclosure and qualification. |
| Task completion and process validity | MISSING | Complete retained run + read-only reopen | The allocation checkpoint has not occurred and Task 3 has not run. The `empiricalRequirementsComplete: false` result is correctly non-authorizing: a process-valid root may still end in `no_robust_pure_finalist_found`, and Phase verification/freeze is a separate decision. |

**Coverage Score:** 0/8 (0%)

### Source-readiness distinction

All eight dimensions have substantive source mechanisms: matrix, solver, PSRO/ledger, diversity, selection, probe/runtime, privacy projection, and completion retention. Re-audit found **zero remaining source-evaluation blockers** in the two previously disputed links: v5 response-history measurement uses preceding frozen targets, and the 16-row index uses AST-verified matcher markers. This does **not** change any MISSING outcome above, and the current exact source gate remains pending; it is not a deployment assessment.

## Infrastructure Audit

| Component | Status | Finding |
|-----------|--------|---------|
| Eval tooling (Vitest + TypeScript/private trace store) | Configured / current run in progress | CI has the exact Phase 265 29-suite source-only gate, with a 45-minute test-step allowance after the measured 27.54-minute baseline. The captured 267-test baseline predates the final memory fix. Main's current exact gate does not execute an empirical selector. |
| Reference dataset | Partial | All 16 specified injected fixture groups are present and source-gated. They are explicitly nonempirical; no allocated empirical reference population, candidate outcomes, or real red-team rows exist. |
| CI/CD integration | Present | `.github/workflows/ci.yml` runs the exact named Phase 265 gate, package/strict type checks, and boundary scans before allocation. |
| Online guardrails | Partial | Complete-cell, issuance/runtime, frozen allocation, charge, and projection guards exist in the request path, but have only injected coverage and have not guarded an actual empirical run. |
| Tracing (private content-addressed trace/shard/ledger) | Partial | Retention/reopen structures and code checks exist, but there are no actual Phase 265 traces/ledgers to verify. |

**Infrastructure Score:** 60/100

## Critical Gaps

- **BLOCKER — no empirical evaluation evidence.** Every planned dimension lacks its required Phase 265 allocation-backed inputs and retained real outputs. Task 2 approval and Task 3 are pending by design; source fixtures cannot substitute.

No additional source-evaluation blocker was found in this re-audit. The AST index intentionally establishes matcher linkage, not semantic adequacy or runtime execution; the named tests and pending exact gate provide those separate layers.

## Remediation Plan

### Must complete before the allocation/participant checkpoint:

1. Run the exact current 29-suite source gate, affected type checks, and boundary scans once at the reviewed source root. This re-audit does not treat fix-report focused results as substitute evidence.

### Must complete after explicit allocation approval:

1. Create the single complete Phase 265 allocation root with opportunity, participant/reviewer/provenance, four-channel, retry/burn, material-dependence, resource, and output-directory values. Do not inherit Phase 264 timing or zero-intake facts.
2. Run the full allocation-backed current-rules league through host-issued providers; retain every Match terminal, failure, unfilled/unused capacity, all nine probes, all four channels, PSRO re-entry, matrices, solver outputs, portfolio/finalist-or-no-finalist, and private report.
3. Run the read-only `verify-retained` command against that exact root. Re-audit all eight dimensions against real retained evidence; a process-valid no-finalist is acceptable, a missing/invalid graph is not.

### Nice to have:

- Keep the AST linkage negatives (comment, bare `expect`, unrelated test, and wrong matcher marker) alongside the corpus as it evolves.

## Files Found

- `packages/strategy-lab/src/league/{matrix,solver,psro,selection,red-team,report,connected-runner,allocation}.{ts,test.ts}`
- `packages/strategy-lab/src/league/{fixtures,fixtures.test,integration.test}.ts`
- `scripts/run-v1-38-serious-league.{ts,test.ts}` and `scripts/lib/v1-38-league-{authoring,response-runtime}.{ts,test.ts}`
- `scripts/check-v1-38-serious-league-boundaries.{ts,test.ts}`
- `.github/workflows/ci.yml`
- `265-EVAL-REFERENCE.md`, `265-07-SOURCE-PROOF.md`, and `265-VALIDATION.md`

## Scoring Inputs

`gsd-tools query eval.score --covered 0 --total 8 --infra partial,partial,ok,partial,partial --raw` returned `coverage_score: 0`, `infra_score: 60`, `overall_score: 24`, and `verdict: NOT IMPLEMENTED`. The generic production vocabulary is not applicable to this private, allocation-gated experiment; this review makes no deployment or production-readiness claim.
