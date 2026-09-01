---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: true
coverage_state: complete
empirical_state: blocked
last_audited: 2026-08-31
---

# Phase 262 Validation Strategy

## Disposition

Phase 262 has complete automated behavioral coverage for its 16 assigned requirements, but it is not empirically complete. The sole corrected retry-v4 invocation ended `exhausted` with fresh `0/540`; ADMIT-03 is blocked, Phase 262 is incomplete, and Phase 263 planning and execution remain false. Tests prove the gates and containment behavior. They do not manufacture the missing 540 accepted cells.

The final closeout chain is Plans 145-147 → 94/123/124 → 95/125/126 → 106/127/128/129. The current later-HEAD checker authenticates the immutable Plan 128 five-path publication, the direct-child Plan 129 anchor, the `gaps` projection, retired raw v4 evidence, preserved empty v3 residue and 36 operational lockfiles, and all false downstream authority.

## Test Infrastructure

| Layer | Framework / selector | Behavioral scope |
|---|---|---|
| Unit and integration | Vitest 4.1.6, single worker | Native lease ownership, durable producer recovery, accounting, review gates, privacy projection, lifecycle custody, final publication drift |
| Committed-state integration | `--check-later-head` | Exact Git ancestry/bytes, requirement classification, DAG, cleanup, aggregate, and authority denials |
| Static | TypeScript `--noEmit` | Final source type integrity |

## Current Verification Commands

```bash
node --import tsx scripts/check-v1-38-plan-262-127-final-convergence-v1.ts --check-later-head

pnpm exec vitest run \
  scripts/lib/v1-38-bounded-retry-envelope-v4.test.ts \
  scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.test.ts \
  scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.test.ts \
  scripts/run-v1-38-bounded-retry-envelope-v4.test.ts \
  scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.test.ts \
  scripts/check-v1-38-plan-262-123-admission-source-review-v1.test.ts \
  scripts/check-v1-38-plan-262-95-lifecycle-v4.test.ts \
  scripts/check-v1-38-plan-262-125-lifecycle-source-review-v1.test.ts \
  scripts/check-v1-38-plan-262-127-final-convergence-v1.test.ts \
  --pool=forks --maxWorkers=1

pnpm exec tsc --noEmit --pretty false
```

Current result: later-HEAD `verified:true`; 9/9 files and 130/130 tests pass; TypeScript passes. The suite includes real subprocess/native composition and can fail on behavioral regressions.

## Final Behavioral Coverage Map

| Plan family | Observable behavior | Automated evidence | Status |
|---|---|---|---|
| 145-147 | Retained native ownership excludes competitors; one reviewed invocation is consumed; exhausted terminal is preserved without invented reproduction | native custody, producer, and live-v15 suites | green |
| 94/123/124 | Aggregate leaks no receipt-level handles; literal-zero review gates publication; non-pass forbids Route-12; retirement follows adjudication | admission and source-review suites plus committed aggregate/disposition checks | green |
| 95/125/126/106 | Lifecycle source/review/readiness preserve the gaps branch and false authority | lifecycle and lifecycle-review suites | green |
| 127-129 | Exact review ancestry, atomic Plan 128 publication, later-HEAD carrier/tracking immutability, DAG, cleanup, and denials | final-convergence suite plus `--check-later-head` | green |
| Final review fixes | Restart after admitted calibration recovers durable `supervisionRoot`; missing custody fails before charging/effects; later committed authority drift is rejected | producer restart cases and final-carrier drift case | green |

## Requirements: Coverage Versus Satisfaction

| Requirement | Test coverage | Satisfaction | Evidence |
|---|---|---|---|
| ADMIT-01 | COVERED | SATISFIED | exact v1.37 authority join |
| ADMIT-02 | COVERED | SATISFIED | semantic/runtime identity join |
| ADMIT-03 | COVERED | BLOCKED | pass/fail gates tested; reviewed producer exhausted at fresh 0/540 |
| ADMIT-04 | COVERED | SATISFIED | missing, stale, mismatched, or drifting authority fails closed |
| MEAS-01 | COVERED | SATISFIED | frozen estimands, conditions, and cells |
| MEAS-02 | COVERED | SATISFIED | bounded budgets, retries, and accounting |
| MEAS-03 | COVERED | SATISFIED | metrics, gates, stopping, and claims |
| MEAS-04 | COVERED | SATISFIED | failed work charged and never accepted |
| MEAS-05 | COVERED | SATISFIED | source/runtime targets |
| MEAS-06 | COVERED | SATISFIED | population/core/finalist targets |
| MEAS-07 | COVERED | SATISFIED | response/probe/red-team thresholds |
| MEAS-08 | COVERED | SATISFIED | Advanced remains regression-only with bounded claims |
| MEAS-09 | COVERED | SATISFIED | distinct result states and no threshold softening |
| MEAS-10 | COVERED | SATISFIED | profile-neutral protocol, equal compute, privacy-safe telemetry |
| SEAL-01 | COVERED | SATISFIED WITH LIMIT | `single_operator_local_seal_v1_no_hostile_same_uid`; no independent/external custody claim |
| DECI-02 | COVERED | SATISFIED | classifiers, denominators, and fixtures |

Coverage is 16/16. Satisfaction is 15/16. ADMIT-03 is a terminal empirical blocker, not a missing-test gap.

## Branch and Containment Truth

| Field | Current truth |
|---|---|
| producer / assurance | `exhausted` / `clean` |
| fresh accepted | `0/540` |
| reproduction-v18 / correction-v12 / Route-12 | absent / absent / absent |
| raw v4 evidence | retired after committed aggregate adjudication |
| preserved local residue | empty private-v3 directory and 36 successor lockfiles |
| ADMIT-03 / Phase 262 | blocked / incomplete |
| Phase 263 planning / execution | false / false |
| broader authority | candidate, formation, holdout, public, product, production, counted-play, gameplay-change, activation, archive, and tag all false |

## Validation Audit 2026-08-31

| Metric | Count |
|---|---:|
| Behavioral coverage gaps found | 0 |
| New tests required | 0 |
| Focused tests executed | 130 |
| Failed tests | 0 |
| Empirical requirements blocked | 1 |

The prior validation's pre-closeout inventory and `dispatch Plan 106` instruction were stale and have been removed. No implementation, authority artifact, tracking file, experiment state, or lockfile was changed by this validation update.
