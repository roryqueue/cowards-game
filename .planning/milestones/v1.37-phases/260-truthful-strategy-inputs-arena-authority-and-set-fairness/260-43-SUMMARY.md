---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "43"
subsystem: go-parity-selector-independence
tags: [historical-dispatch, go-parity, mixed-authority, fail-closed-activation]
requires:
  - phase: 260-42
    provides: Candidate-compatible seven-seam readiness proof
provides:
  - Selector-independent immutable v1.17 Go parity fixtures
  - Explicit historical v1.17 Workshop analytics construction
  - Eight-path selector seam plus database-backed mixed-authority Go proof
  - Refreshed independently re-executed preactivation proof
affects: [260-14, 260-15]
requirements-completed: [STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 43: Go Parity Selector Independence Summary

**Immutable v1.17 Go parity generation is now historical-by-address, and activation readiness directly proves that v1.19 file selection against a still-v1.17 database head fails closed with zero scheduling writes.**

## Accomplishments

- Replaced selector-dependent Go Chronicle generation with `MATCH_KERNEL.runMatchV117` and the exact immutable v1.17 semantic tuple.
- Added an explicit v1.17 Workshop analytics constructor for historical fixture generation while leaving the default selector-driven constructor unchanged.
- Added a package-manager-free selector-independence test that runs the generator `--check` under both current selections and requires byte-identical generated Go artifacts.
- Made Go scheduler tests derive blank-key behavior from the generated current selector and made database creation tests assert semantic-authority refusal with zero writes in the precommit mixed state.
- Expanded the selector inventory to eight Vitest paths, then strengthened it after review with a direct Go gate that runs the scheduler and both PostgreSQL mixed-head branches inside the disposable v1.19-selector clone.
- Required both database environments, hashed both Go test sources, recorded `v1.19-file-selector-with-v1.17-head-zero-write`, and propagated that exact disposition into the top-level preactivation proof.

## Commits

- `046ef03` — `docs(260): route Go parity selector repair`
- `d79f9bb` — `fix(260-43): pin Go parity to historical kernel`
- `2863c3c` — `fix(260-43): version historical analytics fixture`
- `8b37300` — `test(260-43): assert mixed authority fails closed`
- `456f691` — `test(260-43): persist eight-seam readiness`
- `9143a98` — `test(260-43): bind Go parity final readiness`
- `c0e30b9` — `test(260-43): bind mixed authority Go proof`
- `25ae79e` — `test(260-43): persist mixed authority readiness`
- `b086648` — `test(260-43): bind mixed authority final readiness`

## Verification

- The historical generator selector-independence test, generator `--check`, and full Go suite passed under both committed v1.17 and disposable v1.19 selectors without generated-file drift.
- The final composite selector audit passed with zero findings and directly executed the three Go cases under the v1.19-file/v1.17-head mixed state.
- Auditor/evaluator focused suite passed 44/44 with one database-only case intentionally skipped in the environment-free unit pass; the real database-backed path passed separately in both write and check modes.
- Seam artifact `--write` and independent `--check` passed with both database environments mandatory.
- Preactivation proof `--write` and independent fourteen-gate `--check` both reported `OBSERVATION_V1_19_PREACTIVATION_PROVED`.
- Full workspace typecheck and lint passed, and the protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Independent review found one P1 evidence-binding gap; after repair, targeted re-review: PASS.

## Boundary disposition

No generated Go production file, current selector, default runtime behavior, gameplay state, Action legality, event order, outcome, public output, or protected user file changed. The database remains `active-v1.17-bootstrap`, revision `0`, with no pending intent, finalization, or compensation.
