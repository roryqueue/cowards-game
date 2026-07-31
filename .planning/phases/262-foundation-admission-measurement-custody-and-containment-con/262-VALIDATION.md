---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-28
last_audited: 2026-07-31
---

# Phase 262 — Validation Strategy

> Plan 262-23 independently checked the A3/B3 route and actual terminal. The
> route is fail-closed and Phase 262 remains not Nyquist-compliant.

## Current route facts

| Fact | Independently checked value |
|---|---|
| Reviewed A3 | `7ec7bae62fac9344bed9919b6e5095f9451c7eea`; exact three sealed source blobs match working bytes |
| Direct-child B3 | `1387813e9f7262ac0c5916635addee9cdb96354b`; sole parent A3; exact two artifact paths |
| Archived A2/B2 | A2 `6db9f79e...` pinned exactly; B2 direct child; both ancestors of A3 |
| Selected-route closure | checker passes; root `sha256:c7334d560340ffeede39a610b592e8b34fa82d094293e6d35c5096ca2db14483` |
| Protected history | 16 exact cumulative calibration:v5/v6 charges; reproduction:v7 and marker absent |
| Preflight:v7 | admitted at 7,100 bp against inclusive 2,500 bp |
| Calibration:v7 | `stopped_process_failure`; 8 charged, 8 launched, 8 terminal, 4 shards, cleanup complete |
| Reproduction:v8 | absent; 0 charged and 0 accepted |
| Terminal:v1 | `calibration_stopped`; authority expired; no retry/reuse |
| Route gate | BLOCKED; not literal `reproduction_passed` 540/540 |

## Executable coverage result

| Check | Result | Status |
|---|---|---|
| v3 authorization/seal checker | `V138_PLAN_262_15_ARTIFACT_MUST_BE_ABSENT` | FAILED |
| selected-route closure checker | exact root recomputed | PASSED |
| terminal-v1 checker | `calibration_stopped` branch valid | PASSED, stopped branch only |
| literal plan Vitest command | Vitest 4 rejects `--poolOptions` | FAILED command contract |
| supported full foundation selector | no verdict after ~44m; interrupted exit 130 | INCONCLUSIVE |
| focused Darwin + route3 selector | one worker; hard 600s bound; exit 142 without verdict | INCONCLUSIVE |
| `pnpm typecheck` | 27/27 tasks | PASSED |
| `pnpm boundary:monitors` | seven PostgreSQL Go proofs lack test database URL | FAILED |

Because no passing behavioral test verdict exists, the archived-A2 fixture,
one-in-flight/pending-close RSS lifecycle, same-child ESRCH/no-row rule, stale
callback/sibling isolation, concurrent success, and legitimate Darwin global
failure are present in source but not behaviorally verified by Plan 262-23.
Route3 schema/writer/terminal mutation coverage is likewise not newly proven.

## Requirement coverage

| Requirement | Status | Reason |
|---|---|---|
| ADMIT-01 | COVERED | Exact predecessor and A2/B2/A3/B3 ancestry/custody manually recomputed. |
| ADMIT-02 | COVERED | Exact selected identities and derived closure recomputed. |
| ADMIT-03 | PARTIAL — BLOCKED | Terminal is `calibration_stopped`; reproduction:v8 absent; 0/540. |
| ADMIT-04 | COVERED | Failed checker/tests and stopped terminal fail closed; no retry/reuse or repair. |
| MEAS-01..MEAS-04 | MISSING | Plan 262-03 remains blocked and unexecuted. |
| MEAS-05..MEAS-09 | MISSING | Plan 262-04 remains unexecuted. |
| MEAS-10, DECI-02 | MISSING | Plan 262-05 remains unexecuted. |
| SEAL-01 | MISSING | Plans 262-06/07 remain unexecuted. |

| Classification | Count |
|---|---:|
| COVERED | 3 |
| PARTIAL | 1 |
| MISSING | 12 |
| Total | 16 |

## Nyquist verdict

- [x] A2/B2/A3/B3 ancestry, source blobs, B3 custody, closure root, charges,
  current artifacts, reproduction absence, cleanup, and terminal were checked.
- [x] Drift and unavailable external proof fail closed without repair.
- [ ] Complete non-live selector passes.
- [ ] Boundary monitors pass.
- [ ] ADMIT-03 has exact `reproduction_passed` 540/540 evidence.
- [ ] Plans 262-03 through 262-07 deliver the remaining contract.

**Exact status:** PARTIAL / NOT NYQUIST-COMPLIANT. Plan 262-03 remains blocked.
