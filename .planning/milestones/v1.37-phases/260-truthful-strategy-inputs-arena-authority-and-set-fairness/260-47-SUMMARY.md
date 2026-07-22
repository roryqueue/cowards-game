---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "47"
subsystem: selected-current-engine-facade
tags: [engine, selector, initiative, compatibility, readiness]
requires:
  - phase: 260-46
    provides: Clone-local candidate dependencies and semantic trace authority
provides:
  - Selector-aware unversioned Match and activation construction
  - Strict v1.19 initiative admission with deterministic compatibility construction
  - Explicit immutable v1.4 and v1.17 historical routes
  - Receipted full-engine execution under released v1.17 and disposable selected v1.19
affects: [260-14]
requirements-completed: [STRAT-01, STRAT-02, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 47: Selected-Current Engine Facade Summary

**Unversioned engine construction now follows the selected semantic authority, while immutable v1.4/v1.17 evidence remains on explicit historical routes and the complete engine suite passes under both selections.**

## Accomplishments

- Made unversioned initial-state, Match-machine, Match-run, activation-machine, and activation-run facades delegate to strict v1.19 implementations when `runtime-v1.19` is selected.
- Derived the initial initiative owner only at compatibility-shaped unversioned construction from the existing deterministic seed rule; explicit v1.19 APIs remain strict and reject absent or hostile initiative state.
- Kept released v1.17 APIs unchanged and moved immutable v1.4 fixture construction, runtime inputs, activation dispatch, and machine-hash evidence onto explicit historical constructors and ABI versions.
- Preserved the locked 20-fixture v1.4 full-observation corpus and its historical machine hash without adding successor-only observations.
- Bound the repaired engine implementation and tests into the 55-input preactivation proof.
- Expanded the disposable selected-v1.19 seam gate to run the complete engine package before the nine service seams and PostgreSQL Go proof, with an exact-command, zero-finding, dependency-immutable receipt.

## Review finding resolved

- The first proof revision hashed the repaired facades but did not receipt the full engine suite under disposable selected v1.19. The seam contract now executes `packages/engine/src` under the candidate selectors, validates the literal command, and seals that execution into the preactivation artifact.
- Final independent re-review returned PASS with no remaining actionable issue.

## Verification

- Released v1.17 engine: 19 files and 149/149 tests passed.
- Disposable selected v1.19 engine: 19 files and 149/149 tests passed with zero seam findings and an unchanged clone-local dependency tree.
- Revised seam/evaluator tests: 44 passed with one intentional database-environment skip.
- Expanded production seam inventory: passed with zero findings, exact candidate engine execution, nine declared cross-service seams, and PostgreSQL Go proof.
- Preactivation proof: regenerated and independently checked across 14 gates and 55 exact inputs.
- Full workspace typecheck and lint passed.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Database remained `active-v1.17-bootstrap`, revision `0`, with no pending intent, finalization, or compensation.

## Key commits

- `8c90aa3` — `fix(260-47): align current engine facade dispatch`
- `e1ebd8d` — `fix(260-47): make historical engine seams explicit`
- `34814eb` — `test(260-47): separate historical engine seams`
- `40c50d9` — `test(260-47): bind engine facade readiness inputs`
- `57f49cd` — `test(260-47): receipt full candidate engine suite`
- `38046e7` — `test(260-47): seal full candidate engine receipt`
- `6e1d614` — `test(260-47): refresh full candidate engine readiness`

## Boundary disposition

No selector, database authority, valid v1.4 Match state, Action legality, event order, outcome, historical observation, public output, protected user file, or live dependency installation changed. Plan 14 remains the sole authorized activation path.
