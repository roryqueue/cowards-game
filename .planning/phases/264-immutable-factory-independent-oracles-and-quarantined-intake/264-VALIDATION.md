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

- Plan01: 18 focused factory tests, package build and clean independent source review.
- Plan02: 6 focused tactical tests, package build and independent owned-source correspondence check.
- Plan03: 7 focused teacher tests and full unfiltered package build in main; independent re-review closed all six authoritative findings. Canonical Action consequences, actual global work counters, connected legal distillation and exact shared-controller emission are inspected mechanics, not empirical quality evidence.
- Plan04: 7 focused model tests, package build and independent provenance/lineage recheck. Genuine model evidence and companion persistence/consumption remain downstream responsibilities.
- Workspace integration: added only the four missing private-package importer records to `pnpm-lock.yaml`, matching each manifest's existing workspace dependencies. A direct check confirmed all four mappings; every external resolution and snapshot after the `packages:` section remains byte-identical. No install or dependency version change occurred, and no private package was added to the default build references.
- Plan06: final15focused intake/protocol tests, full package build and independent2/2truth recheck pass after initial eight findings and two remaining linkage/retention defects were fixed. Combined exact factory suite passes33tests. Unavailable protocol retains a non-authorizing refusal, with no attempt or source work. Plan05 integration, the final phase suite and empirical readiness remain pending.
- Plan05 interim: the integrated boundary suite passes69tests in7.41seconds and the main source-only monitor reports1269files/zero violations. Its literal core inventory and recursive manifest checks close the reproduced sharing routes; root `.strategy-lab` evidence is excluded from source scanning, while copies under public directories remain tested. This is static graph monitoring, not sandbox certification.
- Plan05 interim: `factory/supervision-artifacts.test.ts` passes4tests, with independent review and package build. Full private ordered records survive aggregate evidence above8MiB and individual records above262144bytes by splitting into bounded artifacts; reopen checks the receipt/execution/trace commitments and grants no renewed authority. The large disk/canonicalization regression uses a20second test timeout only; no guest or execution limit changed.
- Plan05 fingerprint recheck passes18focused tests and preserves explicit unverified lineage/dependency/comparison reasons. This closes label-laundering mechanics, not genuine multi-axis independence. The connected preparation/runner, all-attempt accounting, final source review and phase-level evidence remain in progress.

## Requirement Verification Map

| Requirement | Behavior and required evidence | Initial test seam | Status |
|---|---|---|---|
| FACT-05 | Exact immutable candidate/source/native-lane/lineage roots plus private root-only publication/read/resume | 264-01: `factory/{contracts,identity,repository}.test.ts`; 264-08 actual-or-blocked receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/identity.test.ts packages/strategy-lab/src/factory/repository.test.ts` |
| FACT-06 | Charge before work and retain every terminal disposition, including uncertain resume coverage | 264-01: `factory/{ledger,repository}.test.ts`; 264-08 ledger receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/ledger.test.ts packages/strategy-lab/src/factory/repository.test.ts` |
| FACT-07 | Hostile source reaches selected supervision only with three-way result | 264-01: `factory/admission.test.ts`; 264-08 supervised receipt | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/admission.test.ts` |
| FACT-08 | Six rederived fingerprints, development-only calibration, unresolved quarantine, and roots-only producer pipeline | 264-05: `factory/{fingerprint,calibration}.test.ts`, `scripts/ingest-v1-38-factory-packet.test.ts`; 264-08 result | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts packages/strategy-lab/src/factory/calibration.test.ts scripts/ingest-v1-38-factory-packet.test.ts` |
| ORCL-01 | Three independent mechanisms and a separately controlled intake | 264-02..06 package/intake tests; 264-08 readiness | focused oracle tests plus boundary audit below |
| ORCL-02 | Tactical selector/scoring/search emits legal deterministic source | 264-02: `strategy-oracle-tactical/src/tactical.test.ts` | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-tactical/src/tactical.test.ts` |
| ORCL-03 | Offline canonical teacher emits legal-information-only student | 264-03: `strategy-oracle-teacher/src/teacher.test.ts` | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` |
| ORCL-04 | Exact frozen provider/model bundle; no live runner call | 264-04: `strategy-oracle-model/src/model.test.ts`; 264-07/08 exact-input gate | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts` |
| ORCL-05 | Frozen disclosures/budgets/provenance/conflicts and retained dispositions | 264-06: `factory/{intake-protocol,intake}.test.ts`; 264-07/08 exact-input gate | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/intake-protocol.test.ts packages/strategy-lab/src/factory/intake.test.ts` |
| ORCL-06 | Private leaves and non-strategic shared-helper allowlist | 264-05: factory boundary monitor | `./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-factory-boundaries.test.ts && ./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts` |
| ORCL-07 | Dependency/authorship/source/behavior/correlation/clone/failure evidence | 264-05 fingerprint receipt; 264-08 readiness | `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/fingerprint.test.ts` |

## Wave0 and Empirical Boundaries

Plans264-01 through264-04 and264-06 create the focused contracts and named packet emitters/validators; Plan264-05 then ingests a real leaf packet through `FactoryRepository` before preparation and runner checks. The ingestion contract names `emitTacticalFactoryPacket`, `emitTeacherFactoryPacket`, `emitModelFactoryPacket`, and `admitQuarantinedIntakePacket`; it verifies `producerIdentity`, `origin`, `evidenceClass`, `packetRoot`, `sourceRoot`, `nativeLane`, `runtimeProfile`, and source-root linkage, with `--ingest`, `--producer`, `--packet-root`, `--repository-root`, and `--empirical` flags handled fail-closed. New owned files are `scripts/ingest-v1-38-factory-packet.ts` and `scripts/ingest-v1-38-factory-packet.test.ts`; fixtures are mechanics-only and never empirical evidence. Plan264-07 is the one consolidated late decision for missing exact provider/version, authorized intake participants/protocol, and a finite fresh development calibration allocation. Plan264-08 either consumes only that fresh manifest through `scripts/{prepare,run}-v1-38-factory-calibration.ts`, or writes an explicit blocked readiness report and launches nothing. Existing private identity, supervision, runner, fixtures and checks are reused without rerunning any consumed Phase263 selector, preparation command, Match budget, or evidence. The full current-rules league remains Phase265, and formation remains blocked until Phase266 freeze. Actual provider and human/external provenance cannot be replaced with made-up metadata.

## Manual-Only Verification

Most code and retained-artifact checks are automated. Genuine external participant identity, conflict declarations and exact provider provenance require actual records from that channel. Infrastructure can be implemented and tested while those records are unavailable; their evidential readiness must remain unresolved rather than fabricate acceptance.

## Validation Sign-Off

- [ ] Every task has exact automated verification or preceding Wave0 coverage.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All test references exist and pass.
- [ ] Pure/injected and empirical evidence are separately identified.
- [ ] All requirement and decision claims have actual supporting evidence.
- [ ] Source/private/production boundaries pass.
- [ ] Independent goal verification and private UAT complete.

Approval: existing autonomous implementation instruction applies to in-scope plans; this draft does not authorize reruns, external spending or expand frozen scientific bounds.
