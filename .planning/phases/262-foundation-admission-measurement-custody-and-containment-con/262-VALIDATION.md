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

> Nyquist coverage after Plans 262-18 through 262-20. Evidence production and
> interpretation remain separate; green stopped-branch checkers do not satisfy
> ADMIT-03.

## Current checked route

| Fact | Checked value |
|---|---|
| `sourceBase2` | `95395308a5eeea68766613e6e72524792046e73a` |
| Reviewed A2 | `6db9f79e38340b303d73d6e379c13f667b5eadc9` |
| Direct-child B2 | `b00af0406b97aa5f0538209d1f31a6e36659e570` |
| A2 custody | 22 linear commits; exact aggregate three source/test paths |
| B2 custody | sole parent A2; exact authorization-v2 and seal-v2 paths |
| Selected route | 215 paths, 769 edges, 35 resolver identities |
| Closure root | `sha256:a2255f932163fa20b29bf9ae50e73843f17971c47e0d13c8d4163e2170778b76` |
| Preflight:v6 | admitted at 7,200 bp against inclusive 2,500 bp |
| Calibration:v6 | `stopped_process_failure`; 8 charged, 8 launched, 8 terminal, 4 shards, cleanup complete |
| Reproduction:v7 | not invoked; artifact and consumption marker absent |
| Terminal:v2 | `calibration_stopped`; 0 accepted cells; authority expired; no retry |
| Route gate | BLOCKED; terminal is not `reproduction_passed` with 540/540 |

The old calibration:v5 charge identities `calibration:v5:0..7` remain
authoritative. Its immutable `shardId`, `childLaunched`, and aggregate launch
fields are historical lossy projections and do not prove physical shard
ownership or operating-system launches. No old artifact or summary was changed.

## Plan 262-18 through 262-20 executable coverage

| Behavior | Evidence | Status |
|---|---|---|
| Full execution-ID to public-ID join | injected missing/duplicate/foreign/conflicting identity tests | COVERED |
| Inventory-owned pairwise shards | injected wrong-shard and stable allocation tests | COVERED |
| Exact-one terminal outcome | injected stopped/unknown-after-consumption tests | COVERED |
| Exclusive `--execute-shard` dispatch | direct-entry dispatch tests | COVERED |
| Authorization/seal schemas and custody | A2/B2 canonical checker plus mutation tests | COVERED |
| Selected-route completeness | independent A2 recomputation and working-blob equality | COVERED |
| Historical custody and corrected interpretation | protected-history checker and Plan 262-20 read-only comparison | COVERED |
| Pattern C ownership | context:v6 records main-only owner and zero executors | COVERED |
| Preflight/calibration accounting | terminal-first checker validates 8 charged/launched/terminal and cleanup | COVERED stopped branch |
| Privacy/raw non-retention | terminal checker plus forbidden-key scan | COVERED |
| Formation absence | 280 paths scanned; zero forbidden paths/content | COVERED |
| Exact successful reproduction | requires literal `reproduction_passed` and 540/540 | MISSING |

## Focused non-live regression result

The Plan 262-20 focused selector completed with **27 passed, 3 failed, 185
skipped**. The three failures are temporary-clone fixture failures with
`V138_SOURCE_A2_AGGREGATE_DELTA_INVALID`: the fixtures derive A2 custody from the
post-integration main line rather than preserving the reviewed A2 boundary.

Canonical checks are unaffected and pass:

- Plan 262-18 pre-live checker at B2: `sealed`.
- Selected-route closure checker on main: exact root and all 215 working blobs.
- Plan 262-19 terminal-first checker on main: `calibration_stopped`.
- Typecheck: 27/27 packages.

The regression-fixture defect is retained because Plan 262-20 is read-only with
respect to source and tests. It prevents a blanket Nyquist/test-isolation claim
and requires separately planned remediation.

## Requirement coverage

| Requirement | Status | Reason |
|---|---|---|
| ADMIT-01 | COVERED | Exact predecessor plus reviewed A2/direct-child B2 admission and history joins pass. |
| ADMIT-02 | COVERED | Exact semantic/runtime/source identities and derived selected route pass. |
| ADMIT-03 | PARTIAL — BLOCKED | Calibration stopped; reproduction:v7 is absent and accepted cells are 0/540. |
| ADMIT-04 | COVERED | Fail-closed terminal, complete charging/cleanup, expired authority, no retry/reuse. |
| MEAS-01..MEAS-04 | MISSING | Plan 262-03 remains blocked and unexecuted. |
| MEAS-05..MEAS-09 | MISSING | Plan 262-04 remains unexecuted. |
| MEAS-10, DECI-02 | MISSING | Plan 262-05 remains unexecuted. |
| SEAL-01 | MISSING | Plans 262-06/07 and genuine operational custody remain unexecuted. |

| Classification | Count |
|---|---:|
| COVERED | 3 |
| PARTIAL | 1 |
| MISSING | 12 |
| Total | 16 |

## Remaining blockers

- A new separately planned, reviewed, and freshly authorized successor is
  required for any further calibration/reproduction attempt; Plan 262-19 cannot
  be retried.
- The three post-integration temporary-clone regression failures require a
  source/test repair plan before a clean Nyquist claim.
- Plan 262-03 remains blocked until an independent verifier confirms literal
  `reproduction_passed`, exactly 540 charged and 540 accepted fresh cells, exact
  admitted 8/8 calibration, historical predicate equality, complete cleanup,
  custody/closure integrity, privacy, runtime, and formation absence.
- Plans 262-03 through 262-07 still own the missing scientific, measurement,
  reporting, containment, classifier, and custody work.

## Sign-off

- [x] A2/B2, protected history, closure, current evidence, cleanup, privacy, and formation were independently rechecked without writers.
- [x] The actual stopped branch is recorded without overclaiming ADMIT-03.
- [x] Historical v5 charges are preserved and projection limits are documented only in successor docs.
- [x] All 16 requirements map to current behavioral evidence or explicit blockers.
- [ ] Focused regression suite is clean: 3 clone-fixture failures remain.
- [ ] ADMIT-03 is satisfied: current result is 0/540 and `calibration_stopped`.
- [ ] Plans 262-03 through 262-07 are executed.

**Exact status:** PARTIAL / NOT NYQUIST-COMPLIANT. Plan 262-03 remains blocked.
