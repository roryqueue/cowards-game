---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "187"
subsystem: hostile-runtime
tags: [docker, preflight, diagnostics, custody, lean-admit-03]
requires:
  - phase: 262-186
    provides: immutable refused preflight-v5 and one-finding result-validity review
provides:
  - executable injected success-path preflight with invariant adapter evidence
  - closed privacy-safe refusal diagnostics
  - authenticated Plan185 29-path correction and fresh source-only v7 custody
affects: [262-188, 262-175, 262-176]
tech-stack:
  added: []
  patterns: [production-default dependency seams, closed diagnostic enum, additive custody correction]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-187-SUMMARY.md
  modified:
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-185-SUMMARY.md
key-decisions:
  - "Keep environment injection limited to Docker text reads, session creation, monotonic timing, and evaluation, all defaulting to the production path."
  - "Persist only one of eight enumerated diagnostic codes and never raw exception or runtime detail."
  - "Correct Plan185 additively while preserving its stale 27-path claim as superseded history."
requirements-completed: []
coverage:
  - id: D1
    description: "The no-Docker injected preflight traverses both fixtures and methods, completes cleanup, and reaches the real evaluator with pass evidence."
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/run-v1-38-lean-runner-feasibility.test.ts#drives the injected no-Docker preflight through both fixtures and the real evaluator"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fresh v7 custody authenticates the corrected historical closure and reserves no operational effect."
    requirement: ADMIT-01
    verification:
      - kind: integration
        ref: "node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-preflight-reference-source-only-v7"
        status: pass
    human_judgment: false
metrics:
  duration: 16m
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 187: Final Preflight Reference Repair Summary

The successful preflight path now reaches evaluation without a loop-scope failure, while fresh v7 custody records only bounded diagnostics and authenticates the exact historical and current runnable closures.

## Performance

- **Started:** 2026-09-08T19:41:00Z
- **Completed:** 2026-09-08T19:57:00Z
- **Tasks:** 2/2
- **Files modified:** 6
- **Focused verification:** 73 passed, 25 immutable historical tests skipped
- **Docker preflights / Match invocations:** 0 / 0
- **Successor locks:** 36

## Accomplishments

- Added a full injected no-Docker success-path regression that opens two fake persistent sessions, executes four warm and twelve measured method calls, closes both sessions, and reaches the real evaluator with exact pass evidence.
- Removed the guaranteed post-loop `adapter` ReferenceError by sourcing final evidence from `LEAN_CONTAINER_ADAPTER_ID`, with a focused source-semantic regression guarding that invariant.
- Added eight closed privacy-safe preflight refusal codes; raw exceptions, stacks, process output, paths, source, frames, host data, and runtime details cannot enter the strict artifact schema.
- Additively corrected Plan185 to the exact 29-path closure and preserved its prior 27-path value as stale, superseded history.
- Reserved the collision-free preflight-v6 and v7 authorization/review/invocation/terminal/adjudication/eligibility family with every operational destination absent.

## Exact Source Identities

- **Runnable source commit:** `4c5b6700d7a94a665c4ddc844c987b287bfa6bb3`
- **Runnable source tree:** `0626037f0b5881f414422cb06cfeb49b862d689e`
- **Exact 29-path executable closure:** `sha256:c3524c5599c96add23ba79b475bdf8dc9b2bde0c7967b672e88f0f92dcc01abc`
- **Corrected Plan185 closure:** `sha256:007eb34c12041eb535f0ff4b5999e8b894fa105fff421fb64dd5045822ac93ae`

## Task Commits

1. **Task 1 RED: expose success-path scope failure** — `af46070e`
2. **Task 1 GREEN: execute injected preflight successfully** — `5b4ef77b`
3. **Task 2 RED: specify bounded v7 custody** — `16d3f158`
4. **Task 2 GREEN: establish diagnostics and v7 source custody** — `4c5b6700`
5. **Task 2 correction: authenticate Plan185 closure** — `379e77a6`

## Files Created/Modified

- `scripts/run-v1-38-lean-runner-feasibility.ts` — injectable preflight environment, invariant adapter result, and v7 direct selector wiring.
- `scripts/run-v1-38-lean-runner-feasibility.test.ts` — full success-path and lexical regression coverage.
- `scripts/check-v1-38-lean-admission.ts` — bounded diagnostics, corrected historical closure check, and fresh v7 trust/effect contracts.
- `scripts/check-v1-38-lean-admission.test.ts` — reason-code, privacy, closure, and path regressions.
- `262-185-SUMMARY.md` — additive 29-path closure correction.

## Decisions Made

- Kept injected dependencies narrow and production-defaulted so tests traverse the actual fixture, sample, cleanup, and evaluator control flow.
- Classified only internal known error identities; unknown errors collapse to `unexpected_failure` without preserving their bytes.
- Left requirements and lifecycle tracking unchanged because this source-only plan creates no empirical authority.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The first targeted standalone TypeScript experiment also surfaced unrelated pre-existing script diagnostics because its transitive import graph includes legacy checker code. The plan's required root TypeScript check and the focused source-semantic regression both pass; no unrelated files were changed.

## User Setup Required

None.

## Known Stubs

None.

## Threat Flags

None. The new seams are test-injectable only, production defaults are unchanged, and this plan created no new network, public, authentication, persistence, or gameplay boundary.

## Next Phase Readiness

Plan188 may run exactly one fresh non-consuming preflight-v6 and one independent seven-category review. Plan175 remains denied until that preflight passes and authorization-v7 plus a zero-finding review are committed. The sole 24-Match corrective opportunity remains unconsumed.

## Self-Check: PASSED

All listed commits and files exist. The focused 73-test suite, root TypeScript check, v7 source-only checker, exact 36-lock inventory, destination-absence checks, and `git diff --check` pass. No Docker preflight, authorization, review, marker, Match, terminal, adjudication, eligibility, lifecycle, archive, or tag effect was produced.
