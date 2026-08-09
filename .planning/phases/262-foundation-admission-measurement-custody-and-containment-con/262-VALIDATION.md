---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-28
last_audited: 2026-08-09
---

# Phase 262 — Validation Strategy

> Plan 262-26 independently verified the complete route-ordinal-4 terminal and
> closed every previously red verifier-infrastructure row. The route itself is
> fail-closed at `calibration_stopped`, so Phase 262 remains not
> Nyquist-compliant.

## Current route facts

| Fact | Independently checked value |
|---|---|
| Reviewed A4 | `1be54efec080436ea47ba5be3644ab1ab1686163`; exact five sealed source blobs match Git and working bytes |
| Direct-child B4 | `d0e3a2cae3d0849aec7f8b1c783f7ed16c8e2947`; sole parent A4; exact authorization-v4 and seal-v4 paths |
| Archived custody | A2/B2/A3/B3 remain ancestors; three prior authorization byte hashes and all protected roots/markers/required absences pass |
| Protected charges | 24 prior identities plus 8 unique, disjoint calibration:v8 identities; 32 cumulative charges |
| Preflight:v8 | `preflight_admitted` under the unchanged 2,500-basis-point gate |
| Calibration:v8 | `stopped_process_failure`; 8 charged, 8 launched, 8 terminal, 4 shards, cleanup complete, 0 accepted |
| Reproduction:v9 | artifact and consumption marker absent; 0 charged and 0 accepted |
| Terminal:v1 | `calibration_stopped`; authority expired; no retry or partial reuse |
| Route gate | BLOCKED; not literal `reproduction_passed` with exact fresh 540/540 |

## Executable coverage result

| Check | Result | Status |
|---|---|---|
| terminal-aware authorization/seal v4 checker | same `calibration_stopped` terminal root | PASSED |
| Plan-262-25 terminal-v1 checker | same `calibration_stopped` terminal root | PASSED stopped branch |
| independent Git/blob/charge/presence recomputation | A4/B4, protected history, 24+8 charges, markers, absence, cleanup, expiry agree | PASSED |
| frozen-A4 successor suite | Vitest 4 forks, one worker, no file parallelism, 120000 ms timeout, bail 1; 55/55 | PASSED |
| `pnpm typecheck` on main | 27/27 tasks | PASSED |
| unchanged `pnpm boundary:monitors` | isolated PostgreSQL 18 on dynamic loopback port and tmpfs; strict chain green; owned container removed | PASSED |

The successor suite was run from a uniquely named disposable detached worktree
at frozen A4. Only the two Plan-262-24 review documents were copied into that
checkout as untracked fixture inputs; dependencies were installed offline and
frozen-lockfile inside the disposable checkout. The worktree was removed after
the literal 55/55 verdict. No writer, provider, live observation, Strategy,
Match, preflight, calibration, reproduction, `ps`, or memory-pressure command
was invoked.

## Coverage retained by the bounded successor suite

- strict pre-live checking remains distinct from terminal-aware post-live
  checking;
- generation/path-scoped mutations cover route-3 and route-4 custody,
  protected history, destinations, roots, markers, and all terminal rows;
- the closed child protocol covers success, malformed, unknown, oversize,
  duplicate, contaminated, and nonzero-exit subprocess cases without extensible
  diagnostics;
- route-4 tests enforce literal terminal discrimination, exact counts,
  complete cleanup, authority expiry, privacy, runtime/gameplay identity, and
  formation absence; and
- database-backed ownership, rollback, conformance, and release-boundary rows
  execute rather than skip.

## Requirement coverage

| Requirement | Status | Reason |
|---|---|---|
| ADMIT-01 | COVERED | Exact predecessor plus A2/B2/A3/B3/A4/B4 ancestry and custody independently recompute. |
| ADMIT-02 | COVERED | Selected tuple, sealed source blobs, roots, runtime/gameplay identity, and protected history pass. |
| ADMIT-03 | PARTIAL — BLOCKED | Terminal is `calibration_stopped`; reproduction:v9 is absent and accepted cells are 0/540. |
| ADMIT-04 | COVERED | The stopped terminal fails closed with expired authority, no repair, no reuse, and no retry. |
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

- [x] A4/B4 and all protected ancestry, blobs, authorization bytes, roots,
  charges, markers, presence rows, cleanup, expiry, privacy, runtime/gameplay,
  and formation absence are independently checked.
- [x] The terminal-aware and terminal-v1 checkers pass the actual stopped row.
- [x] The bounded successor suite passes exactly 55/55.
- [x] Typecheck and strict database-backed boundary monitors pass with complete
  disposable-infrastructure cleanup.
- [ ] ADMIT-03 has literal `reproduction_passed` with 540 charged and 540
  accepted fresh reproduction:v9 cells.
- [ ] Plans 262-03 through 262-07 deliver the remaining contract.

**Exact status:** PARTIAL / NOT NYQUIST-COMPLIANT. Plan 262-26 verification
execution is complete, but ADMIT-03 and Plan 262-03 remain blocked with expired
authority and no retry.
