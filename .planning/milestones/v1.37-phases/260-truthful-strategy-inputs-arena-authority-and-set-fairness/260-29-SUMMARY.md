---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "29"
subsystem: runtime-workshop
tags: [runtime-service, workshop, semantic-authority, database-boundary]
requires:
  - phase: 260-27
    provides: Compact file-current semantic selector
  - phase: 260-28
    provides: Exact database semantic-authority head
provides:
  - DB-free runtime contract resolution from compact current
  - Exact compact frozen-request validation
  - Closed v1.17/v1.19 Workshop pin registry
  - Database-head enforcement before Workshop persistence
affects: [260-31, 260-33, 260-14, 260-15]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 29: Runtime and Workshop Default Delegation Summary

**Runtime-service remains database-free while Workshop static and persisted paths now follow compact file current and the exact active database head.**

## Accomplishments

- Replaced v1.17 lifecycle-as-current inference with selector-backed runtime contract resolution.
- Added exact compact frozen-request validation without importing persistence or database code into runtime-service.
- Preserved the released v1.17 lifecycle record as immutable historical evidence.
- Added a frozen two-pin Workshop registry for exact v1.17 and v1.19 examples.
- Made static Workshop output follow file current while revision and test-MatchSet persistence reject absent, pending, stale, or mismatched heads.
- Preserved explicit historical v1.17 and inactive v1.19 example dispatch, package-free validation, and privacy boundaries.

## Commit

- `8b8a178` — `feat(260-29): delegate runtime and Workshop defaults`

## Verification

- Runtime current-selection gate: 3 files, 41 tests passed.
- Workshop plus selection-head database gate: 47 tests passed.
- Full Workshop suite: 35 tests passed.
- Full runtime-service suite: 154 tests passed.
- Spec, persistence, and runtime-service typechecks passed.
- Boundary imports reported zero strict and zero ownership offenses.
- Changed-file lint, formatting, diff check, and protected baseline passed.

## Review Note

Plan-27 literal narrowing exposed a historical v1.14 runtime-service type error
in an unowned file. The parent fixed it in `e57bc08`; runtime behavior remained
unchanged and the full runtime gate then passed.

