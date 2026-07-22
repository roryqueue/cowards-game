---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "04"
subsystem: testing
tags: [semantic-integrity, engine, replay, runtime-service, postgres, go, red-contracts]
requires:
  - phase: 256-counted-safety-and-canonical-authority
    provides: exact current compatibility tuple and system-failure ownership boundary
provides:
  - Language-neutral 27-vector arena, state, lifecycle, tuple, outcome, and transition semantic corpus
  - Exact missing-enforcement RED contracts for spec, engine, replay, runtime-service, TypeScript persistence, and Go
  - Real PostgreSQL no-mutation and rollback evidence for TypeScript and Go semantic invalidity
affects: [257-05, 257-06, 257-11, 257-12, 257-18, semantic-validation, persistence-admission]
tech-stack:
  added: []
  patterns: [shared language-neutral vectors, marker-qualified expected RED, pre-write row snapshots, no-scheduler structural scan]
key-files:
  created:
    - packages/spec/src/fixtures/semantic-integrity-vectors.json
    - packages/spec/src/semantic-integrity.test.ts
    - packages/engine/src/kernel/semantic-boundaries.test.ts
    - packages/replay/src/semantic-integrity.test.ts
    - apps/runtime-service/src/semantic-integrity.test.ts
    - packages/persistence/src/semantic-integrity.test.ts
    - apps/go-backend/semantic_integrity_test.go
  modified: []
key-decisions:
  - "Semantic issues use the fixed family order TUPLE, ARENA, PLAYER, SOLDIER, POSITION, LIFECYCLE, OUTCOME, TRANSITION with a safe CANONICAL_INTEGRITY_FAILURE public category."
  - "All six RED lanes qualify only through their exact missing-contract marker after shape validation, boundary execution, and infrastructure rejection."
  - "TypeScript and Go persistence proofs use real PostgreSQL and compare Match, job, attempt, Chronicle, result, and standings row counts before and after rejection."
patterns-established:
  - "Semantic RED: prove the adversarial value is shape-valid before expecting the future stable semantic code."
  - "Failure-safe RED: an arbitrary nonzero, database error, missing test, compile failure, or timeout never counts as semantic enforcement evidence."
requirements-completed: [KERN-03, KERN-11]
coverage:
  - id: D1
    description: One deterministic shared corpus covers every KERN-03 arena, state, lifecycle, tuple, outcome, and transition invariant class with bounded expected issues.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/spec/src/semantic-integrity.test.ts#keeps every adversarial value structurally valid and the corpus deterministic"
        status: pass
    human_judgment: false
  - id: D2
    description: Spec and engine reach only their exact missing-semantic-contract markers after accepting shape-valid semantic invalidity.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "qualified RED: [EXPECTED_RED:MISSING_SEMANTIC_CONTRACT:SPEC] and [EXPECTED_RED:MISSING_SEMANTIC_CONTRACT:ENGINE]"
        status: pass
    human_judgment: false
  - id: D3
    description: Replay and runtime-service expose precise RED contracts for invalid reconstructed or runtime-final state without reclassifying integrity failure as player fault.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "qualified RED: [EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:REPLAY] and [EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:RUNTIME]"
        status: pass
    human_judgment: false
  - id: D4
    description: TypeScript and Go persistence paths prove shape-valid semantic invalidity leaves gameplay and competition tables unchanged in real PostgreSQL.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "qualified RED: [EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:PERSISTENCE] and [EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:GO] with explicit PostgreSQL DSNs"
        status: pass
    human_judgment: false
  - id: D5
    description: No test expectation changes valid v1.4 behavior; each failure is isolated to the approved missing semantic boundary.
    requirement: KERN-11
    verification:
      - kind: other
        ref: "combined six-lane marker gate with infrastructure-failure rejection"
        status: pass
    human_judgment: false
duration: 28min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 04: Cross-Boundary Semantic Integrity RED Matrix Summary

**A 27-vector language-neutral corpus and six marker-qualified RED lanes now pin semantic meaning, failure ownership, and zero-mutation behavior before validators are implemented.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-13T15:16:00Z
- **Completed:** 2026-07-13T15:44:15Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Defined structurally valid single- and multi-fault vectors for bounds, terrain, starts, identity, ownership, occupancy, status/position/facing, initiative, tuple, lifecycle, outcome, events, and hashes with fixed family ordering and diagnostic caps.
- Added exact spec, engine, replay, runtime-service, persistence, and Go missing-enforcement contracts whose markers appear only after the intended absent semantic boundary is reached.
- Proved replay validation makes no runtime calls, runtime-service currently returns invalid final state as canonical success, and TypeScript/Go persistence currently reaches later logic while leaving Match, job, attempt, Chronicle, result, and standings rows unchanged.
- Added a production-Go structural scan that rejects copied Phase/Round/Cycle/Activation/Contraction resolver entry points.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define shape-valid semantic vectors and stable expected codes** - `1fd42fa` (test)
2. **Task 2: Add replay, runtime-service, and TypeScript persistence RED boundaries** - `ca9dc94` (test)
3. **Task 3: Add Go shared-vector and rollback RED boundary** - `e96631e` (test)

## Files Created/Modified

- `packages/spec/src/fixtures/semantic-integrity-vectors.json` - Shared stable code, ordering, bounds, baseline, mutation, and multi-fault corpus.
- `packages/spec/src/semantic-integrity.test.ts` - Corpus determinism, shape-validity, caps, and missing spec contract RED.
- `packages/engine/src/kernel/semantic-boundaries.test.ts` - Missing engine admission RED for terrain/start overlap.
- `packages/replay/src/semantic-integrity.test.ts` - Invalid reconstructed snapshot and zero-scheduling RED.
- `apps/runtime-service/src/semantic-integrity.test.ts` - Invalid final-state system-failure/no-Chronicle RED.
- `packages/persistence/src/semantic-integrity.test.ts` - Real PostgreSQL pre-mutation semantic admission RED.
- `apps/go-backend/semantic_integrity_test.go` - Shared-vector, response, completion, scheduler-absence, and PostgreSQL rollback RED.

## Decisions Made

- Stable issue spelling and order are now executable shared inputs rather than independently declared TypeScript and Go conventions.
- The public semantic failure category is restricted to `CANONICAL_INTEGRITY_FAILURE`; detailed stable codes remain restricted system/integrity evidence.
- Current missing semantic admission is documented without treating a later lease failure or transaction rollback as proof that validation already exists.
- No valid Match state, Action legality, event order, outcome, or Strategy observation changed, so KERN-11 did not trigger an approval stop.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The local PostgreSQL setup script initially inherited the shell user and was rejected by the already-running password-authenticated server. Running it with explicit `PGUSER=cowards`, `PGPASSWORD=cowards`, and the required DSN completed setup and migrations cleanly.
- The committed runtime request golden predates the current fixture-authority builder's expanded lane identity, so it cannot construct present authority evidence. The runtime RED uses the existing current builders and fixture evidence path instead; this is test setup only and does not change production semantics.

## User Setup Required

None - the existing local PostgreSQL service and explicit test credentials were sufficient.

## Next Phase Readiness

- Plan 257-05 can implement the shared issue vocabulary and pure validators directly against the committed vectors.
- Plans 257-06, 257-11, 257-12, and 257-18 have exact boundary-specific GREEN targets and no-mutation expectations.
- All six expected-RED commands pass their marker and infrastructure-rejection gates; spec, engine, replay, runtime-service, and persistence typechecks pass.
- Protected `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retain their captured byte hashes.

## Self-Check: PASSED

- All seven delivered files and this summary exist.
- Task commits `1fd42fa`, `ca9dc94`, and `e96631e` are present.
- The combined SPEC, ENGINE, REPLAY, RUNTIME, PERSISTENCE, and GO marker gate passes with real PostgreSQL and explicit infrastructure-failure rejection.
- No shared `STATE.md` or `ROADMAP.md` edit was made by this executor.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
