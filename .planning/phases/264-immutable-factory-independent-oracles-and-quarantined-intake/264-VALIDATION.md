---
phase: 264
slug: immutable-factory-independent-oracles-and-quarantined-intake
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-13
---

# Phase264 — Validation Strategy

## Test Infrastructure

Use the existing Vitest4.1.6 and TypeScript6.0.3 workspace. No package installation or new testing framework is required.

- Quick: `./node_modules/.bin/vitest run --maxWorkers=1 <exact task test files>`.
- Wave/phase: explicit Phase264 pure/injected test files, existing private lab boundary and canonical kernel ownership tests; then `./node_modules/.bin/tsc -b` on the affected private packages.
- Do not use broad Turbo/pnpm test dispatch, historical empirical CLI selectors, or real-guest historical suites. A green synthetic test is not genuine candidate, model, human or independence evidence.
- Measure actual test latency during execution; the263 safe suite took323.09seconds. Target focused feedback below60seconds where practical without dropping coverage.

## Sampling Rate

Run targeted checks at every task commit, combined bounded integration at each wave, and the explicit final source/contract suite before verification/UAT. No watch mode. The planner must replace placeholder task commands with exact paths in the map below.

## Interim implementation evidence

- Final client compatibility source `f2f1486428e6e237e5a9ed5c01c2ac7fbf8ea755`: main **77/77 tests across 13 suites**, strict affected types, model/lab builds and **1,292 boundary files / zero violations**. Independent final review passes 28 focused tests and strict types, zero unresolved findings. Normal/no-echo records and strict malformed/stale/duplicate/incomplete rejection are covered across transport and retained decoders; only redundant agent-message deltas are suppressed upstream. Prior snapshot mismatch during concurrent editing was resolved by the full stable-source rerun, not a weaker gate. Actual outcome/accounting is independently reconstructed; two attempts remain charged failures and no Match ran. Phase-level Nyquist completion remains false pending real calibration.

- Client-update continuation2026-09-14: installed0.154.0 advertised exact Sol; the provider completed one fresh turn, then the local checker rejected a normal prompt echo. Outcome `sha256:3f624715ffff0c569b02b4123705e777c864b34830e94af5b5db3b2dd3a8c9bf` retains exact response reconstruction across two bounded chunks,9,767tokens and completed cleanup. Cumulative2attempts,0workloads. Prompt-echo/response-size source repairs and independent review are in progress; this is not an empirical pass or authority for another attempt.

- Final Task04 repair validation at `f9f0cd63adeabc9c29ac3defbb259b4c3a318ab0`: **79/79 tests across13files**, strict types for author/transport/execution-evidence/model-bundle, model/lab project builds, and1292boundary files with zero violations. Independent exact review passes35/35 and zero unresolved findings. Tests now reject unavailable advertised models before charge; retain future failed-turn raw bytes/available usage/measured elapsed; and permanently reject any failure/error notification despite later completion or a mismatched turn ID. The original A-01 remains failed with incomplete capture; no source test reconstructs it. Nyquist phase completion remains false while genuine calibration is blocked.

- Plan08 reviewed source at `3a8a90b453fa7c8630fefc18b90e6d5997543413`: main passed65/65 tests in12 explicit source/fake-process suites, strict operational types and the1292-file boundary check; the independent reviewer passed12/12 retained-assessment/evidence cases. Numeric calibration, exact fresh48cell/all12source reopening, private observation extraction, source clone/dependency screening, all-attempt author provenance, complete assessment/read-only verification and actual resource ceilings are implemented. The full retained unrun allocation stays unresolved on reopen. No source test is counted as a real calibration result.
- Actual Task04 result: one charged authoring system failure, zero valid sources, zero teacher searches and zero supervised workloads; cleanup complete, usage unavailable. The source-tested raw failure path nevertheless lost its transcript/measured duration, and thread identity echo did not prove installed-client availability. RUN-01/02 now have same-plan repairs in progress. Their future regression pass cannot reconstruct A-01 or renew its stopped authority. Current roots and gaps are in264-TASK04-OUTCOME.md.

- Plan01: 18 focused factory tests, package build and clean independent source review.
- Plan02: 6 focused tactical tests, package build and independent owned-source correspondence check.
- Plan03: 7 focused teacher tests and full unfiltered package build in main; independent re-review closed all six authoritative findings. Canonical Action consequences, actual global work counters, connected legal distillation and exact shared-controller emission are inspected mechanics, not empirical quality evidence.
- Plan04: 7 focused model tests, package build and independent provenance/lineage recheck. Genuine model evidence and companion persistence/consumption remain downstream responsibilities.
- Workspace integration: added only the four missing private-package importer records to `pnpm-lock.yaml`, matching each manifest's existing workspace dependencies. A direct check confirmed all four mappings; every external resolution and snapshot after the `packages:` section remains byte-identical. No install or dependency version change occurred, and no private package was added to the default build references.
- Plan06: final15focused intake/protocol tests, full package build and independent2/2truth recheck pass after initial eight findings and two remaining linkage/retention defects were fixed. Combined exact factory suite passes33tests. Unavailable protocol retains a non-authorizing refusal, with no attempt or source work. Plan05 integration, the final phase suite and empirical readiness remain pending.
- Plan05 interim: the integrated boundary suite passes69tests in7.41seconds and the main source-only monitor reports1269files/zero violations. Its literal core inventory and recursive manifest checks close the reproduced sharing routes; root `.strategy-lab` evidence is excluded from source scanning, while copies under public directories remain tested. This is static graph monitoring, not sandbox certification.
- Plan05 interim: `factory/supervision-artifacts.test.ts` passes4tests, with independent review and package build. Full private ordered records survive aggregate evidence above8MiB and individual records above262144bytes by splitting into bounded artifacts; reopen checks the receipt/execution/trace commitments and grants no renewed authority. The large disk/canonicalization regression uses a20second test timeout only; no guest or execution limit changed.
- Plan05 fingerprint recheck passes18focused tests and preserves explicit unverified lineage/dependency/comparison reasons. This closes label-laundering mechanics, not genuine multi-axis independence. The connected preparation/runner, all-attempt accounting, final source review and phase-level evidence remain in progress.
- Plan05 combined source snapshot `b04d8b8b`: main passed150tests across19explicit factory/oracle/CLI/boundary files in48.02seconds, all four private package builds, the1269-file source-only boundary monitor, and all three real CLI `--help` paths. These checks launched no guest, empirical Match, model call or external submission. The5-test complete-supervision storage regression is included. Independent final integration review additionally passed39tests and confirmed provenance, receipt, intake-reopen and adapter repairs, while identifying three remaining comparison-input gaps. They are being fixed within Plan05; this snapshot does not close the plan or phase.

## Requirement Verification Map

### Final Plan05 source/mechanics validation

Atf7395d8a, main passed156/156tests in20explicit files in53.02seconds, all four private package builds, standalone four-script types with explicit TypeScript6 `--ignoreConfig --types node`, the1271-file source monitor, all three CLI help paths and the CI YAML syntax/format check. Another16unchanged kernel ownership/legal-information regressions pass in12.13seconds. Independent264-WORKLOAD-CLOSURE-REVIEW.md passes6focused tests and finds no remaining Plan05 implementation gap. The16-fixture evaluation index and source-only CI gate are complete; no remote CI result or empirical readiness is inferred.

The exact main suite is the19files in the `Private factory source and evaluation checks (no experimental runs)` step of `.github/workflows/ci.yml`, plus `scripts/check-v1-38-lab-boundaries.test.ts`, invoked together with `./node_modules/.bin/vitest run --maxWorkers=1`. The additional command is `./node_modules/.bin/vitest run --maxWorkers=1 packages/engine/src/kernel/runtime-ownership.test.ts packages/strategy-lab/src/planner/information-boundary.test.ts`. Full exact package/script type commands are retained in264-05-SUMMARY.md.

Plan05's known source gaps are closed, not waived. The approved 264-READINESS-DECISION.md now fixes the outer route: four model-authoring attempts including corrections in30minutes, 48 supervised development workloads in90minutes, and human/external intake unused with zero submissions and effort. Plans07/08 must implement the pre-output exact source-slot/cell allocation, honest model provenance, source-backed calibration, threshold freeze, and affirmative-or-unresolved assessment before any empirical command is released to independent source review. Private UAT passes6source/mechanics cases and blocks1actual-readiness case; it does not count fabricated participation, fixture projections, roots alone, or reused Phase263 evidence.

| Requirement | Behavior and required evidence | Initial test seam | Status |
|---|---|---|---|
| FACT-05 | Exact immutable candidate/source/native-lane/lineage roots plus private root-only publication/read/resume | 264-01: `factory/{contracts,identity,repository}.test.ts`; 264-08 actual-or-blocked receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/identity.test.ts packages/strategy-lab/src/factory/repository.test.ts` |
| FACT-06 | Charge before work and retain every terminal disposition, including uncertain resume coverage | 264-01: `factory/{ledger,repository}.test.ts`; 264-08 ledger receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/ledger.test.ts packages/strategy-lab/src/factory/repository.test.ts` |
| FACT-07 | Hostile source reaches selected supervision only with three-way result | 264-01: `factory/admission.test.ts`; 264-08 supervised receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/admission.test.ts` |
| FACT-08 | Six receipt-derived numeric fingerprints, source-backed calibration, frozen thresholds, and unresolved quarantine | 264-08: `factory/{fingerprint,calibration,calibration-corpus}.test.ts`, `scripts/assess-v1-38-factory-independence.test.ts` | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/calibration.test.ts packages/strategy-lab/src/factory/calibration-corpus.test.ts scripts/assess-v1-38-factory-independence.test.ts` |
| ORCL-01 | Three materially independent mechanisms with actual retained evidence; separately controlled intake remains explicitly unused | 264-02..06 package/intake tests; 264-08 affirmative-or-unresolved assessment | focused oracle tests, assessment, and boundary audit below |
| ORCL-02 | Tactical selector/scoring/search emits legal deterministic source | 264-02: `strategy-oracle-tactical/src/tactical.test.ts` | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-tactical/src/tactical.test.ts` |
| ORCL-03 | Offline canonical teacher emits legal-information-only student | 264-03: `strategy-oracle-teacher/src/teacher.test.ts` | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` |
| ORCL-04 | Versioned frozen request/response bundle with requested/reported IDs, client settings/version, actual usage, and explicitly unavailable serving snapshot; no live runner call | 264-07: model/contract/ingestion plus author-command tests | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts packages/strategy-lab/src/factory/contracts.test.ts scripts/ingest-v1-38-factory-packet.test.ts scripts/author-v1-38-factory-model-source.test.ts` |
| ORCL-05 | Frozen disclosures/budgets/provenance/conflicts and retained dispositions; Phase264 intake allocation is zero | 264-06 intake tests and 264-07 manifest tests | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/intake-protocol.test.ts packages/strategy-lab/src/factory/intake.test.ts scripts/prepare-v1-38-factory-calibration.test.ts` |
| ORCL-06 | Private leaves and non-strategic shared-helper allowlist | 264-05: factory boundary monitor | `./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-factory-boundaries.test.ts && ./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts` |
| ORCL-07 | Dependency/authorship/source/behavior/counterfactual/correlation/clone/failure evidence for every automated mechanism | 264-08 source-backed corpus and assessor | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/calibration-corpus.test.ts scripts/assess-v1-38-factory-independence.test.ts` |

## Wave0 and Empirical Boundaries

Plans264-01 through264-06 provide contracts and named packet emitters/validators. Plan264-07 freezes one tactical base S01, one teacher base S03, one first-valid model base S05, and nine calibration-only AST-safe derived controls S02/S04/S06..S12. Fit edges are S01/S02, S03/S04, S05/S06, S01/S07, S01/S08, and S11/S12; base cross-mechanism edges S01/S03, S01/S05, and S03/S05 remain separate. It freezes A-01..A-04 token accounting, existing 256-invocation/120000ms/1s-method runtime limits, two deliberately geometry/side-confounded blocks, both initiatives, and48 workloads. Plan264-08 replaces projection-only input with retained source/packet/receipt controls, freezes numeric thresholds after labeled controls, root-matches an affirmative-or-unresolved D-19 assessor, and requires a fresh independent exact-source-commit recheck plus artifact reopen checks before the main-only empirical task. All three mechanisms require actual retained authorship, source, behavior, counterfactual, clone/dependency, and failure-mode evidence; physical separation does not pass. Fixed-mechanics/one-phase cells are development instruments, not competitive evidence. Existing private identity, supervision, runner, and tests are reused without Phase263 selectors or capacity. The full league remains Phase265, and formation remains blocked until Phase266 freeze.

## Manual-Only Verification

Most code and retained-artifact checks are automated. Phase264 human/external intake is intentionally unused with zero submissions/effort, so no participant record is required for this bounded route. Provider provenance requires retained actual authoring records, and readiness remains unresolved unless the future approved finite run produces the complete source-backed evidence set after independent source review.

## Validation Sign-Off

- [ ] Every task has exact automated verification or preceding Wave0 coverage.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All test references exist and pass.
- [ ] Pure/injected and empirical evidence are separately identified.
- [ ] All requirement and decision claims have actual supporting evidence.
- [ ] Source/private/production boundaries pass.
- [ ] Independent goal verification and private UAT complete.

Approval: existing autonomous implementation instruction applies to in-scope plans; this draft does not authorize reruns, external spending or expand frozen scientific bounds.
