---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "49"
subsystem: selected-runtime-service-and-replay-authority
tags: [runtime-service, replay, chronicle, v1.17, v1.19, semantic-authority]
requires: [260-48]
provides:
  - selected-current runtime-service dispatch bound to the complete semantic authority
  - exact v1.19 Chronicle Match/Set/arena/initiative reproducibility
  - immutable executable v1.17 service, receipt, observation, replay, and wire routes after selection
  - selected-current replay validation and reconstruction suitable for atomic activation
affects: [260-14, 260-15, 261]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]
completed: 2026-07-19
status: complete
---

# Phase 260 Plan 49 Summary

The complete runtime-service, Chronicle recorder, and replay stack now passes under released v1.17 and disposable selected v1.19. Unversioned defaults follow the exact selected authority, explicit historical requests remain immutable and executable, and every successful v1.19 Chronicle is bound to the frozen Match, Set condition, arena geometry, side, revision, and initial-initiative authority required for trustworthy reconstruction.

## Work completed

- Bound candidate Match authority through request admission, kernel execution, Chronicle recording, semantic validation, HTTP/service responses, and reconstruction.
- Separated selected-current configuration from explicit v1.17 and v1.18 service routing without tuple coercion or allowlist widening.
- Kept exact v1.17 request schemas, response wire, receipts, observations, nested test bridge, and full Match execution available after v1.19 selection.
- Made tuple and runtime-evidence resolution order-neutral and version-exact across current, v1.17, and historical v1.14 metadata.
- Added selector-neutral replay test support that uses the canonical arena catalog and real four-condition Set policy rather than weakening the production recorder.
- Extended current replay admission and reconstruction to require the exact successor reproducibility envelope when v1.19 is selected.
- Added successor initial initiative to canonical semantic replay state and projection while explicitly omitting it from frozen v1.17 projections.
- Regenerated the preactivation proof from independently executed gates without changing live selectors or the database head.

## Verification

- Released replay: 14 files passed, 230 tests passed.
- Disposable selected-v1.19 replay: 14 files passed, 230 tests passed.
- Released runtime-service: 16 files passed, 156 tests passed; typecheck and lint passed.
- Disposable selected-v1.19 runtime-service: 16 files passed, 156 tests passed; typecheck and lint passed.
- Released and selected spec: 334 passed, 1 intentional skip; 35/35 generator proofs passed.
- Focused exact v1.17 and v1.19 HTTP/provider routes passed for TypeScript, Python, Rust, and Zig.
- Preactivation evaluator passed and refreshed `.planning/artifacts/v1.37-observation-v1.19-preactivation-proof.json` from its executable gate receipts.
- Protected baseline and user-owned dirty files remained unchanged.
- Database remained `active-v1.17-bootstrap|0` with no pending intent, finalization, or compensation.

## Review disposition

All review findings are resolved in `260-49-REVIEW.md`. The final review found no remaining actionable issue.

## Key commits

- `282dd22` through `ec0c601` — bind candidate Match authority and preserve exact service routes.
- `fad08e6`, `ad13573`, `af69249` — preserve immutable v1.17 execution, wire, and observation structure after selection.
- `944b11a`, `4e1e659`, `45a1eda`, `67ccdc5` — model and test both semantic runtime generations exactly.
- `dbfe015`, `daf36b5`, `8cfef3f`, `921193d` — bind selected replay fixtures, admission, reconstruction, and initiative state.
- `d33dc3b`, `e265fa3` — restore frozen v1.17 source identity and keep historical replay projection immutable.

## Surprise

The selected replay failures exposed a real activation-readiness defect rather than merely stale tests: the successor schema knew initial initiative, but the TypeScript semantic-state model and replay projection did not, and current replay could not carry the persisted candidate authority. The first repair also demonstrated why historical identity must be actively protected: adding the new field indiscriminately immediately broke v1.17 Chronicle validation and protected service bytes. The final implementation is explicitly authority-aware and proves both generations independently.

## Next gate

Plan 260-14 may now begin the single coordinated activation of five selector files and one transactional database selection head. No activation mutation occurred in Plan 49.
