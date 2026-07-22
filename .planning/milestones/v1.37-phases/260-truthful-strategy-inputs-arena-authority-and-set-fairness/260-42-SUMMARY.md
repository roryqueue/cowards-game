---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "42"
subsystem: activation-gate-compatibility
tags: [historical-contracts, generated-current, database-evidence, fail-closed-seams]
requires:
  - phase: 260-33
    provides: Committed preactivation readiness before the real coordinator rehearsal
provides:
  - Exact historical-v1.17 and generated-current-v1.19 spec assertions
  - Seven-path selector-sensitive seam inventory
  - Mandatory database-backed seam execution
  - Refreshed independently re-executed preactivation proof
affects: [260-14, 260-15]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 42: Candidate-Gate Compatibility Repair Summary

**The real candidate selector gate now passes all seven declared seams, with historical v1.17 contracts and generated-current v1.19 behavior asserted independently and the database-backed certificate test impossible to skip.**

## Accomplishments

- Scoped the v1.18 capability promotion query to the exact four `runtime-conformance-certificate-v1.17` rows it verifies, while remaining duplicate-sensitive and certificate-verifier-backed.
- Preserved the immutable v1.17 invocation candidate and released selected envelopes as distinct lifecycle/admission contracts after the current ABI advances.
- Made unversioned observation schemas, shared fixtures, and current resolver assertions derive from the generated semantic selection while continuing to validate explicit historical v1.17 and successor v1.19 shapes separately.
- Preserved the released provider contract and canonical-request/raw-canonical-payload WASI posture instead of inventing successor semantics from the ABI pointer.
- Expanded the selector-sensitive seam inventory from four paths to seven and proved the complete selector-only candidate simulation with zero findings.
- Closed the review finding that could have certified a skipped PostgreSQL seam: the auditor now refuses before cloning without the signed-conformance database environment, records `databaseBackedExecution: required-and-executed`, and rejects any other proof value.
- Regenerated the seam artifact and authoritative preactivation proof from committed inputs, then independently re-executed both checks.

## Commits

- `02c8784` — `docs(260): route candidate gate compatibility repair`
- `f16994e` — `test(260-42): repair candidate gate assumptions`
- `71395b0` — `test(260-42): preserve released WASI posture`
- `0fbff13` — `test(260-42): bind database-backed seam receipt`
- `7c30e7e` — `fix(260-42): require database-backed seam execution`
- `d4c9762` — `test(260-42): prove mandatory database seam`
- `b5e18d8` — `test(260-42): bind fail-closed final readiness`

## Verification

- The three repaired spec suites passed 110/110 with PostgreSQL-backed certificate execution enabled.
- The exact seven-file candidate selector simulation passed 171/171 with zero findings.
- The strengthened seam auditor suite passed 19/19, including missing-database refusal, disposable dependency mutation, untracked mutation, and real selector simulation.
- Seam artifact `--write` and independent post-commit `--check` passed under the complete database environment.
- Authoritative preactivation proof `--write` and independent fourteen-gate post-commit `--check` both reported `OBSERVATION_V1_19_PREACTIVATION_PROVED`.
- Full workspace typecheck and lint passed after removing stale ignored Next.js generated types.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Independent code review found one P1 skip-path issue; after the fail-closed repair, re-review: PASS.

## Boundary disposition

No production runtime source, selector, gameplay behavior, Action legality, event order, outcome, Strategy observation semantics, public output, or protected user file changed. The database remains `active-v1.17-bootstrap`, revision `0`, with no pending intent, finalization, or compensation.
