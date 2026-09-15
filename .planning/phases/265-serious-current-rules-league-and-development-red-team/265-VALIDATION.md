---
phase: 265
slug: serious-current-rules-league-and-development-red-team
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-14
---

# Phase265 — Validation Strategy

## Test Infrastructure

Use the installed Vitest4.1.6/TypeScript6 workspace; no installation. Quick feedback uses `./node_modules/.bin/vitest run --maxWorkers=1` followed by the exact owned test paths. The combined phase run must enumerate only Phase265 pure/injected suites and selected existing source-boundary regressions, followed by affected package types. No broad pnpm/Turbo test discovery or historical empirical selector is permitted. Measure latency during implementation; target focused feedback under60seconds without removing coverage. Real Matches/model calls require their separate, complete Phase265 allocation; test fixtures never satisfy empirical goals.

## Sampling Rate

Run exact task tests after each source task, the explicit combined suite at each wave, and all phase checks before UAT. No watch mode. Source-only invariance and numeric spikes may use trusted synthetic inputs; they grant no candidate or Match allocation.

## Requirement Verification Map

| Requirement | Behavior | Source-only test seam | Status |
|---|---|---|---|
| LEAG-01/02 | Complete eight-condition cells per unordered pair; canonical-kernel outcome to entrant `0|1|2` half-point projection; semantic aliases, missing, conflicting and failed cells rejected | `packages/strategy-lab/src/league/contracts.test.ts`, `identity.test.ts`, `matrix.test.ts`, `repository.test.ts`, `connected-runner.test.ts` | 265-01 T1/T2 (W1), 265-02 T1/T2 (W2), 265-03 T1/T2 (W2); T-265-01/04/05/07/08 |
| LEAG-03 | Numeric spike, exact canonical solver, degenerate/boundary vectors and layout/restart invariance | `packages/strategy-lab/src/league/solver.test.ts` | 265-04 T1 (W3); T-265-10 |
| LEAG-04 | Frozen mixture/pure targets, charged candidate admission, late-counter re-entry | `packages/strategy-lab/src/league/psro.test.ts`, `scripts/run-v1-38-serious-league.test.ts` | 265-04 T2 (W3), 265-06 T2 (W4); T-265-11/12/17/18 |
| LEAG-05 | Complete root-qualified reports; safe aggregate projection | `packages/strategy-lab/src/league/report.test.ts`, `fixtures.test.ts`, `integration.test.ts` | 265-05 T2 (W3), 265-07 T1 (W5); T-265-14/15/19 |
| LEAG-06/07/08 | Evidence-grounded diversity, separate pure portfolio, conjunctive finalist/no-finalist result | `packages/strategy-lab/src/league/selection.test.ts`, `fixtures.test.ts` | 265-05 T1 (W3), 265-07 T1 (W5); T-265-13/19 |
| LEAG-09 | Four-channel allocations, charged outcomes, probes/invariance and counter flow | `packages/strategy-lab/src/league/red-team.test.ts`, `scripts/run-v1-38-serious-league.test.ts`, `league/integration.test.ts` | 265-03 T2 (W2), 265-06 T1/T2 (W4), 265-07 T1 (W5); T-265-07/16/17/18/19 |

## Source-Implementation Requirements

- Plans 265-01 through 265-07 create explicit tests with their implementation; no placeholder test counts as coverage.
- Plan 265-04 creates the synthetic numeric golden-vector corpus and records its observed comparison before freezing the solver.
- Plan 265-07 adds private-league production/import/privacy denial cases and an explicit CI step.
- Plan 265-03/06 require the persisted-candidate-to-host-issued-provider handoff through existing factory admission and `scripts/lib/v1-38-factory-supervised-runtime.ts`; a reopened `issued: false` factory record is data only and cannot become a provider.
- Plan 265-07 adds the connected pure/injected runner/retention/reopen fixture and the exact Wave-5 source gate; individual helper tests alone do not prove an executable league path.
- After approved allocation only, Plan 265-07 runs complete full Matches and `verify-retained`; before approval, source checks remain source-only and do not satisfy the empirical phase goal.

## Exact Combined Source Gate

Run after Wave5 and before the allocation checkpoint:

```sh
./node_modules/.bin/vitest run --maxWorkers=1 \
  packages/strategy-lab/src/league/contracts.test.ts \
  packages/strategy-lab/src/league/identity.test.ts \
  packages/strategy-lab/src/league/matrix.test.ts \
  packages/strategy-lab/src/league/solver.test.ts \
  packages/strategy-lab/src/league/repository.test.ts \
  packages/strategy-lab/src/league/connected-runner.test.ts \
  packages/strategy-lab/src/league/psro.test.ts \
  packages/strategy-lab/src/league/selection.test.ts \
  packages/strategy-lab/src/league/red-team.test.ts \
  packages/strategy-lab/src/league/report.test.ts \
  packages/strategy-lab/src/league/fixtures.test.ts \
  packages/strategy-lab/src/league/integration.test.ts \
  scripts/run-v1-38-serious-league.test.ts \
  scripts/check-v1-38-serious-league-boundaries.test.ts \
  packages/strategy-lab/src/runtime-bridge.test.ts \
  packages/strategy-lab/src/runner-invariance.test.ts \
  packages/strategy-lab/src/factory/repository.test.ts \
  packages/strategy-lab/src/factory/fingerprint.test.ts \
  packages/strategy-lab/src/factory/admission.test.ts \
  packages/strategy-lab/src/factory/supervision-artifacts.test.ts \
  scripts/lib/v1-38-factory-supervised-runtime.test.ts \
  packages/strategy-lab/src/league/allocation.test.ts \
  scripts/lib/v1-38-league-authoring.test.ts \
  scripts/lib/v1-38-league-response-runtime.test.ts \
  scripts/assess-v1-38-factory-independence.test.ts \
  scripts/v1-38-factory-execution-evidence.test.ts \
  scripts/v1-38-factory-assessment-correction.test.ts
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/check-v1-38-serious-league-boundaries.ts scripts/check-v1-38-serious-league-boundaries.test.ts
./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts
pnpm exec tsx scripts/check-service-boundary-imports.ts
```

## Manual-Only Verification

Plan 265-06 expanded the gate to include allocation accounting, native authoring, the three-arm response runtime, historical assessment/execution/correction import readers, and their strict script types. Its frozen-source 16-suite gate passed 122 tests in 412.45 seconds; the complete Wave-5 gate above retains every original suite and adds these dependencies. Do not edit implementation sources during identity-bound tests. The final source gate is not a real-data compatibility or empirical pass: after independent review, main will separately read the exact retained Phase 264 assessment through `verifyHistoricalFactoryAssessmentForLeague`, without dispatch or artifact mutation.

Before real candidate/Match/model/human/external work, 265-07 Task2 is the one consolidated decision that must supply exact opportunity, operational/review, resource/retry-burn, material-dependence, and participant/provenance values in a Phase265 allocation root. Research established no current allocation exists. The exact combined source gate above must pass and be installed in CI before this checkpoint; no Phase264 timing waiver or zero-intake disposition carries forward. On `approve-allocation`, Task3 runs all allocated full Matches (not a Phase264 one-Phase fixture), retains all outcomes/failures/unfilled capacity, and then invokes `verify-retained`; synthetic tests cannot mark these empirical facts green. On `do-not-allocate`, Phase265 remains pending authorization, not complete. There is no UI in this private phase.

## Validation Sign-Off

- [ ] All tasks have exact automated checks or preceding Wave0 dependencies.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All referenced tests exist and pass; measured runtimes recorded.
- [ ] Synthetic/source coverage and actual empirical evidence remain distinct; source-gate pass is not empirical completion.
- [ ] The approved branch retains the full league result and passes bounded `verify-retained`; the declined branch remains pending authorization.
- [ ] Private/runtime/engine boundaries pass.
- [ ] Independent verification and private UAT complete.

Approval: standing autonomous implementation instruction covers in-scope source work. This strategy does not invent a live allocation or change frozen rules, thresholds or formation/holdout gates.
