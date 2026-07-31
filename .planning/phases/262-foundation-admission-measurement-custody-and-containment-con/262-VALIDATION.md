---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-28
last_audited: 2026-07-30
---

# Phase 262 — Validation Strategy

> Nyquist coverage for the actual immutable Plan 262-15/16 terminal route. This audit is read-only with respect to source, tests, configuration, and evidence.

## Actual Terminal Route

| Fact | Checked value |
|---|---|
| Source A | `61d1c470e9a77ffa1f70538cb0c5173f6a792bfa` |
| Seal B | `1bfb413192f113ac7949cde676d7b55aea77f4fe` |
| Selected-route derivation | Recomputed from the two A entrypoints by `typescript-static-source-closure-v1` |
| Current derived path count | 215 |
| Selected-route closure root | `sha256:9dd774f2520ed81995118052ab920820d74f16d75dfe1b63b75ecadbfe7a68d7` |
| Plan 262-16 terminal | `calibration_stopped` |
| Preflight | admitted at 6,900 basis points against the unchanged 2,500-basis-point threshold |
| Calibration | 8 charged identities across 4 shards; 0 child launches; 0 accepted cells |
| Reproduction | not invoked; `v1.38-current-matrix-reproduction-v6.json` absent |
| Authority | single-use authority expired; no retry |
| Downstream gate | Plan 262-03 remains blocked; ADMIT-03 is not satisfied |

The path count above is an observation from the checked current derivation at A. Completeness authority is the recomputed path list, per-path A blob records, resolver metadata, and closure root—not a copied count.

## Test Infrastructure

| Property | Value |
|---|---|
| **Framework** | Vitest 4.1.6 plus read-only TypeScript CLI checkers |
| **Config** | Package scripts and root Vitest defaults |
| **Safe injected command** | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "<non-live selector>" --maxWorkers=1 --reporter=verbose` |
| **Canonical Plan 262-15 check** | `node --import tsx scripts/lib/v1-38-successor-source-seal.ts --check-plan-262-15-authorization-v1 ...` |
| **Canonical closure check** | `node --import tsx scripts/lib/v1-38-successor-source-seal.ts --check-selected-route-closure-from-seal --seal .planning/artifacts/v1.38-successor-source-seal-v1.json` |
| **Canonical Plan 262-16 check** | `node --import tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-plan-262-16-terminal ...` |
| **Prohibited in this audit** | Writers, `memory_pressure`, audit reproducer, preflight, calibration, Match, reproduction, Strategy execution, or evidence generation |

## Requirement Coverage

Requirement status is behavioral: a green helper or stopped-branch checker does not satisfy a requirement whose demanded successful artifact is absent.

| Requirement | Owning tasks/plans | Behavioral verification | Status |
|---|---|---|---|
| ADMIT-01 | 262-01, 262-G8, 262-G9, 262-G10 | Admission mutations; checked A/B authorization and terminal lineage | COVERED |
| ADMIT-02 | 262-01, 262-G8, 262-G9, 262-G10 | Exact tuple/source bindings; A-derived route and resolver identity recheck | COVERED |
| ADMIT-03 | 262-02, 262-G1..G10, 262-CR1 | Inventory, expectation, scheduler/accounting, hostile-output, custody and terminal checks exist; actual route has 0/540 accepted cells | PARTIAL — requirement unmet |
| ADMIT-04 | 262-01, 262-G8, 262-G9, 262-G10 | Fail-closed mutation tests and stopped terminal with no retry/reproduction | COVERED |
| MEAS-01 | 262-03 | `contract` behavior and immutable study contract | MISSING — plan unexecuted |
| MEAS-02 | 262-03 | `accounting` structural opportunity vector | MISSING — plan unexecuted |
| MEAS-03 | 262-03 | `contract` stopping/selection/claim grammar | MISSING — plan unexecuted |
| MEAS-04 | 262-03 | `accounting` failure-ledger separation | MISSING — plan unexecuted |
| MEAS-05 | 262-04 | `gates` source/runtime feasibility values | MISSING — plan unexecuted |
| MEAS-06 | 262-04 | `gates` population/core/finalist thresholds | MISSING — plan unexecuted |
| MEAS-07 | 262-04 | `gates` response/probe/red-team thresholds | MISSING — plan unexecuted |
| MEAS-08 | 262-04 | `gates` Advanced regression-only and bounded claims | MISSING — plan unexecuted |
| MEAS-09 | 262-04 | `reporting` orthogonal terminal states | MISSING — plan unexecuted |
| MEAS-10 | 262-05 | `classifiers`, protocol-only lineage/order/holdout, containment | MISSING — plan unexecuted |
| SEAL-01 | 262-06, 262-07 | Synthetic custody plus real separately authorized custody/root path | MISSING — implementation and operational authority absent |
| DECI-02 | 262-05 | Profile-neutral classifier and invariant fixture suite | MISSING — plan unexecuted |

### Requirement Coverage Counts

| Classification | Count |
|---|---:|
| COVERED | 3 |
| PARTIAL | 1 |
| MISSING | 12 |
| Total | 16 |

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test/check | Current status |
|---|---|---:|---|---|---|
| 262-01 | 262-01 | 1 | ADMIT-01, ADMIT-02, ADMIT-04 | `-t admission` | COVERED — historical exact admission and fail-closed mutations exist |
| 262-02 | 262-02 | 2 | ADMIT-03 | `-t matrix` | PARTIAL — exact supervised 540-cell reproduction absent |
| 262-G1 | 262-08 | 3 | ADMIT-03 | `-t "matrix expectation"` | COVERED helper — independent historical predicate |
| 262-G2 | 262-09 | 4 | ADMIT-03 | injected calibration policy/scheduler/accounting/resources/cleanup/cancellation | COVERED helper |
| 262-G3 | 262-10 | 5 | ADMIT-03 | Plan 262-10 branch checker | PARTIAL — stopped with 0 accepted cells |
| 262-G4 | 262-11 | 6 | ADMIT-03 | diagnostic:v2 and calibration:v2 branch checkers | PARTIAL — stopped at 3.45% headroom |
| 262-G5 | 262-12 | 7 | ADMIT-03 | preflight:v3/calibration:v3/v4-absence checkers | PARTIAL — stopped at 4.02% headroom |
| 262-G6 | 262-13 | 8 | ADMIT-03 | context:v4/preflight:v4/calibration:v4/v5-absence checkers | PARTIAL — stopped at 4.37% headroom |
| 262-G7 | 262-14 | 9 | ADMIT-03 | producing-Git-object and persisted/supplied isolation tests | COVERED helper — grants no measurement authority |
| 262-G8 | 262-15 | 10 | ADMIT-01..04 | checked authorization/seal plus closure recomputation | COVERED helper — A/B and derived closure passed; not ADMIT-03 success |
| 262-G9 | 262-16 | 11 | ADMIT-01..04 | canonical terminal-first checker | COVERED stopped branch — `calibration_stopped`, 8 charged, 0 children, 0 accepted, reproduction absent |
| 262-G10 | 262-17 | 12 | ADMIT-01..04 | read-only Plan 262-15/16 checkers plus this refresh | PARTIAL — Nyquist refresh complete, but full Plan 262-17 verification/tracking is outside this file and route is stopped |
| 262-CR1 | review fix | review | ADMIT-03 | `-t "matrix parent boundary rejects"` | COVERED helper — malformed child output cannot enter calibration evidence |
| 262-03 | 262-03 | 13 | MEAS-01..04 | `-t "contract|accounting|calibration"` | MISSING — blocked by stopped route |
| 262-05/06 | 262-04 | 14 | MEAS-05..09 | `-t "gates|reporting"` | MISSING — plan unexecuted |
| 262-07/09 | 262-05 | 15 | MEAS-10, DECI-02 | `-t "classifiers|protocol.only|containment"` | MISSING — plan unexecuted |
| 262-08 | 262-06/07 | 16–17 | SEAL-01 | `-t custody` plus operational handoff/root checks | MISSING — synthetic implementation and real custody authority absent |

## Manual and Missing Blockers

| Behavior | Requirement | Classification | Blocker / required evidence |
|---|---|---|---|
| Exact current-rules reproduction | ADMIT-03 | Manual/resource-consuming | A new separately planned and authorized successor must produce a checked `reproduction_passed` terminal with exactly 540/540 accepted cells; Plan 262-16 authority is expired |
| Artifact-presence selector isolation | ADMIT-01..04 | Warning | Four focused presence tests currently fail because the test dirties `262-15-REVIEW.md` before attempting `git checkout`; Plan 262-17 forbids test changes, so the canonical read-only checkers are the current authority |
| Study/accounting contract | MEAS-01..04 | Missing implementation/test | Plan 262-03 remains blocked |
| Numeric gates/report grammar | MEAS-05..09 | Missing implementation/test | Plan 262-04 is unexecuted |
| Protocol/classifier/containment behavior | MEAS-10, DECI-02 | Missing implementation/test | Plan 262-05 is unexecuted |
| Synthetic custody mechanics | SEAL-01 | Missing implementation/test | Plan 262-06 is unexecuted |
| Real custody identities and encrypted store | SEAL-01 | Manual/external authority | Named custodian, one-open actor, approved external encrypted store, key/trust domain, retention, retirement, and authenticated bounded handoff cannot be invented by tests |
| Aggregate custody/containment root | SEAL-01 | Missing implementation/test | Plan 262-07 cannot execute before the upstream measurement and custody gates |

## Validation Audit 2026-07-30 — Plan 262-17 Refresh

| Check | Actual result | Classification |
|---|---|---|
| Canonical Plan 262-15 authorization/seal checker | passed from canonical destinations | COVERED |
| Selected-route closure recomputation from seal | passed; current derivation returned 215 paths and root `sha256:9dd774f2520ed81995118052ab920820d74f16d75dfe1b63b75ecadbfe7a68d7` | COVERED |
| Canonical Plan 262-16 terminal checker | passed; `calibration_stopped`, 8 charged, 4 shards, 0 child launches, 0 accepted, reproduction absent | COVERED stopped branch |
| Injected Darwin parser/provider selector | 19 passed, 170 skipped | COVERED |
| Combined selected-route/source-custody selector | runner printed no terminal summary under host pressure; canonical closure checker independently passed | WARNING |
| Artifact-presence/hostile-receipt selector | 5 hostile-receipt tests passed; 4 presence tests failed on self-created dirty `262-15-REVIEW.md` blocking Git checkout | WARNING — test isolation gap retained |

No writer, `memory_pressure`, audit reproducer, preflight, calibration, Match, reproduction, Strategy execution, or evidence-generating command was invoked. No source, test, configuration, or evidence file was modified.

## Validation Sign-Off

- [x] All 16 Phase 262 requirement IDs map to owning tasks and behavioral verification.
- [x] Plan 262-15 custody and the selected route were checked from immutable A/B evidence.
- [x] The closure is described as derived at A; its checked current count/root are recorded without making the count a completeness authority.
- [x] The actual Plan 262-16 stopped branch is recorded without treating a green checker as ADMIT-03 success.
- [x] Every downstream missing implementation/test and manual authority blocker remains explicit.
- [x] Commands use no watch mode and this refresh invoked only injected/non-live tests and read-only checkers.
- [ ] ADMIT-03 remains unmet because reproduction:v6 is absent and accepted cells are 0/540.
- [ ] Plans 262-03 through 262-07 remain unexecuted.
- [ ] Nyquist compliance remains false: 3/16 requirements are covered, 1/16 is partial, and 12/16 are missing.

**Exact status:** PARTIAL / NOT NYQUIST-COMPLIANT. Plan 262-03 remains blocked.
