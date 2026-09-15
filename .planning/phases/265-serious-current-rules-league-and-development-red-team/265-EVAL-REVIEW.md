# EVAL-REVIEW — Phase 265: Serious Current-Rules League and Development Red Team

**Audit Date:** 2026-09-15
**Audit basis:** State A — `265-AI-SPEC.md` and the implemented source frozen at `9394176caed71cfef4f9ceb4a3a81456baf356c7`; `bd6f3ccc` changes only planning documents.
**AI-SPEC Present:** Yes
**Overall Score:** 28/100
**Verdict:** NOT IMPLEMENTED — empirical evaluation evidence only

This is an outcome audit, not a source-gate score. The captured source gate (29/29 suites, 250/250 tests, 581.87 s) establishes useful mechanics, but no Phase 265 allocation root, real candidate/Match/model/human/external record, retained empirical result, or independent retained verification exists. The planned empirical evaluation therefore has not been delivered. It is intentionally pending the one Task 2 allocation/participant checkpoint; that expected absence is not itself evidence of a policy or rules defect.

## Dimension Coverage

| Dimension | Status | Measurement | Finding |
|-----------|--------|-------------|---------|
| Complete condition-balanced payoff matrix | MISSING | Code + empirical Match evidence | `matrix.ts`/`matrix.test.ts` implement the 8-cell, alias-aware fail-closed reducer, but there are zero allocated Phase 265 cells or retained actual terminals/traces. The injected 8-cell integration uses fabricated `MATCH_ENDED` terminal data. |
| Exact solver and replay determinism | MISSING | Code + retained replay bytes | `solver.test.ts` exercises golden, boundary, permutation, layout, worker/shard, restart, and 12/13-policy inputs, but no retained empirical snapshot/replay has been solved and reconstructed. |
| Response targeting and charged completion | MISSING | Code + empirical allocation reconciliation | PSRO/red-team code and the 122+48 injected positive-response loop exist, but all four real channels have no Phase 265 allocation, starts, terminals, charges, or response-round evidence. |
| Diversity and novelty | MISSING | Code + empirical candidate/fingerprint evidence | Pair-backed diversity and Phase 264 import controls are implemented, but no Phase 265 candidate population demonstrates 12 Strategies, six families, five independent cores, or three finalists. |
| Mixture versus pure selection | MISSING | Code + empirical score/reducer evidence | Conjunctive selection and no-finalist paths are tested synthetically; no empirical portfolio/disposition exists. In addition, the current CLI constructs consecutive-iteration scores from `mixtureScore(block.matrix, candidate)` against that same solved mixture, which cannot establish the required `>55%` preceding-mixture gate in the zero-sum construction. |
| Invariance, legality, and runtime integrity | MISSING | Code + paired empirical contrasts | The source implements all nine probe families and host-issued runtime checks, but only injected callbacks have run; no actual paired contrasts, supervised provider trace, or retained runtime evidence exists. |
| Privacy and claim boundary | MISSING | Static/code checks + actual report audit | Boundary scans, denylisted report fields, and oracle-relative claim rejection are source-covered, but there is no actual Phase 265 private report/trace root to audit for real disclosure and qualification. |
| Task completion and process validity | MISSING | Complete retained run + read-only reopen | The allocation checkpoint has not occurred and Task 3 has not run. The `empiricalRequirementsComplete: false` result is correctly non-authorizing: a process-valid root may still end in `no_robust_pure_finalist_found`, and Phase verification/freeze is a separate decision. |

**Coverage Score:** 0/8 (0%)

### Source-readiness distinction

Seven dimensions have substantive, executable source mechanics behind the recorded source gate: matrix, solver, PSRO/ledger, diversity, probe/runtime, privacy projection, and completion retention. This does **not** change any MISSING outcome above. Source readiness has one identified robust-pure selection blocker below; it is not a deployment assessment.

## Infrastructure Audit

| Component | Status | Finding |
|-----------|--------|---------|
| Eval tooling (Vitest + TypeScript/private trace store) | Installed and called | The CI workflow has an explicit Phase 265 29-suite source-only gate; the captured frozen-source result passed 250 tests. It does not execute an empirical selector. |
| Reference dataset | Partial | All 16 specified injected fixture groups are present and source-gated. They are explicitly nonempirical; no allocated empirical reference population, candidate outcomes, or real red-team rows exist. |
| CI/CD integration | Present | `.github/workflows/ci.yml` runs the exact named Phase 265 gate, package/strict type checks, and boundary scans before allocation. |
| Online guardrails | Partial | Complete-cell, issuance/runtime, frozen allocation, charge, and projection guards exist in the request path, but have only injected coverage and have not guarded an actual empirical run. |
| Tracing (private content-addressed trace/shard/ledger) | Partial | Retention/reopen structures and code checks exist, but there are no actual Phase 265 traces/ledgers to verify. |

**Infrastructure Score:** 70/100

## Critical Gaps

- **BLOCKER — no empirical evaluation evidence.** Every planned dimension lacks its required Phase 265 allocation-backed inputs and retained real outputs. Task 2 approval and Task 3 are pending by design; source fixtures cannot substitute.
- **BLOCKER — robust-pure iteration gate is not measurable as specified.** `selectionFor` records each candidate's `mixtureScore` against the same block's solved distribution, then `selectRobustPure` requires two `>55%` iteration blocks. Preserve the threshold; instead record response performance against the **preceding frozen mixture** (with its target/root and untouched conditions) and test an attainable positive empirical-shaped path.
- **WARNING — fixture index is name-only at its assertion layer.** `fixtures.test.ts` checks that each referenced file contains `it("<testName>")`; it does not verify the indexed `coverage.assertion` text or a machine-readable assertion marker. The underlying named tests contain many relevant assertions, but the index cannot detect assertion drift or a test body emptied after renaming.

## Remediation Plan

### Must fix before the allocation/participant checkpoint:

1. Repair iteration evidence to score each declared response against the preceding immutable mixture/named targets, not its own equilibrium. Keep the strict `>55%`, two distinct consecutive iterations, complete condition blocks, and no-finalist outcome unchanged. Add a realistic positive-path test and retain a no-finalist test.
2. Strengthen the fixture index: bind each fixture to an executable exported assertion ID (or equivalent machine-checkable marker) and verify that marker in the named test. Continue running the actual underlying suites; a label/test-name match alone is insufficient.

### Must complete after explicit allocation approval:

1. Create the single complete Phase 265 allocation root with opportunity, participant/reviewer/provenance, four-channel, retry/burn, material-dependence, resource, and output-directory values. Do not inherit Phase 264 timing or zero-intake facts.
2. Run the full allocation-backed current-rules league through host-issued providers; retain every Match terminal, failure, unfilled/unused capacity, all nine probes, all four channels, PSRO re-entry, matrices, solver outputs, portfolio/finalist-or-no-finalist, and private report.
3. Run the read-only `verify-retained` command against that exact root. Re-audit all eight dimensions against real retained evidence; a process-valid no-finalist is acceptable, a missing/invalid graph is not.

### Nice to have:

- Add an explicit audit test proving no fixture-index assertion pointer can survive if its associated behavioral assertion marker is removed or renamed.

## Files Found

- `packages/strategy-lab/src/league/{matrix,solver,psro,selection,red-team,report,connected-runner,allocation}.{ts,test.ts}`
- `packages/strategy-lab/src/league/{fixtures,fixtures.test,integration.test}.ts`
- `scripts/run-v1-38-serious-league.{ts,test.ts}` and `scripts/lib/v1-38-league-{authoring,response-runtime}.{ts,test.ts}`
- `scripts/check-v1-38-serious-league-boundaries.{ts,test.ts}`
- `.github/workflows/ci.yml`
- `265-EVAL-REFERENCE.md`, `265-07-SOURCE-PROOF.md`, and `265-VALIDATION.md`

## Scoring Inputs

`gsd-tools query eval.score --covered 0 --total 8 --infra ok,partial,ok,partial,partial --raw` returned `coverage_score: 0`, `infra_score: 70`, `overall_score: 28`, and `verdict: NOT IMPLEMENTED`. The generic production vocabulary is not applicable to this private, allocation-gated experiment; this review makes no deployment or production-readiness claim.
