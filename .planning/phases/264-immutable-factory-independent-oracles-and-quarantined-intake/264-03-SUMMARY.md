---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "03"
subsystem: private-offline-oracle
tags: [canonical-engine, match-kernel, distillation, factory-packet, information-boundary]
requires:
  - phase: 264-01
    provides: strict factory packet schema and fixed inherited authority pins
provides:
  - independent offline teacher that advances canonical state only through MATCH_KERNEL
  - explicit legal-observation/objective/memory student representation and deterministic distillation
  - data-only emitTeacherFactoryPacket producer with source and provenance roots
affects: [264-05-factory-integration, 264-07-independent-channel-evidence]
tech-stack:
  added: []
  patterns: [trusted-teacher-private-state, legal-student-policy-compiler, static-source-closure]
key-files:
  created:
    - packages/strategy-oracle-teacher/src/teacher.ts
    - packages/strategy-oracle-teacher/src/distill.ts
    - packages/strategy-oracle-teacher/src/emit.ts
    - packages/strategy-oracle-teacher/src/teacher.test.ts
  modified:
    - packages/strategy-oracle-teacher/src/index.ts
key-decisions:
  - "The teacher invokes MATCH_KERNEL for offline transition evaluation and owns no copied rule resolver."
  - "Only compiled legal observation, objective, and memory policy data may be embedded in student source."
  - "The emitter validates source closure statically and returns a FactoryOraclePacket as data without importing or executing generated source."
patterns-established:
  - "Oracle leaves may use shared engine authority and factory schemas, but never another oracle's strategic selector or search core."
  - "Student policy source is generated from the same explicit compiled policy representation used by trusted distillation tests."
requirements-contributed: [ORCL-01, ORCL-03]
requirements-completed: []
implementation_status: implementation_only_pending_phase_integration_and_evidence
metrics:
  duration: 14m
  completed: 2026-09-13
status: complete
---

# Phase 264 Plan 03: Search Teacher and Distiller Summary

**A private canonical-transition teacher now distills deterministic legal-input student policy into rooted, non-executed factory packets.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-13T23:24:55Z
- **Completed:** 2026-09-13T23:38:27Z
- **Tasks:** 2/2
- **Files modified:** 7

## Accomplishments

- Added an independent offline teacher whose counterfactual branch evaluation calls the exported canonical `MATCH_KERNEL`, with teacher-only state structurally excluded from students.
- Added deterministic distillation over an explicit legal observation, allowed objective, and permitted memory representation.
- Added `emitTeacherFactoryPacket`, which emits closure-checked source and strict rooted `FactoryOraclePacket` data without source execution.
- Added paired tests for teacher-only variation, legal-student determinism, provenance/root failures, and source closure/free-identifier denial.

## Task Commits

1. **Task 1: Create the independent offline teacher and distillation package** — `7fb2b83e` (feat)
2. **Task 2: Emit and test the distilled legal student (RED)** — `f0216ebd` (test)
3. **Task 2: Emit and test the distilled legal student (GREEN)** — `135ebbe3` (feat)

## Files Created/Modified

- `packages/strategy-oracle-teacher/src/teacher.ts` — private counterfactual search using canonical engine transitions.
- `packages/strategy-oracle-teacher/src/distill.ts` — explicit stripped student data and deterministic policy compiler.
- `packages/strategy-oracle-teacher/src/emit.ts` — static closure validation and rooted factory packet emission.
- `packages/strategy-oracle-teacher/src/teacher.test.ts` — information-boundary, source closure, and packet-contract proof.
- `packages/strategy-oracle-teacher/src/index.ts` — private leaf entrypoint including exact `emitTeacherFactoryPacket` export.

## Decisions Made

- Kept `counterfactual-teacher-distillation-v1` as leaf-local algorithm metadata; it does not claim model participation or expose teacher state to student source.
- Used the existing fixed factory authority pins and schema through the allowed non-strategic factory seam.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` — passed (3 tests).
- `./node_modules/.bin/tsc -b packages/strategy-oracle-teacher` — passed.
- Source closure tests reject unresolved identifiers and direct imports; emitted source contains no counterfactual or opponent-hypothesis state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Canonicalized nested legal observations before keying distilled policy**
- **Found during:** Task 2
- **Issue:** A shallow JSON key replacer could collapse nested legal observation fields, causing distinct legal records to share a student key.
- **Fix:** Added recursive key-sorted canonicalization and a compiled policy representation consumed by both trusted chooser and source emitter.
- **Files modified:** `packages/strategy-oracle-teacher/src/distill.ts`, `packages/strategy-oracle-teacher/src/emit.ts`
- **Verification:** Focused Vitest suite and package TypeScript build pass.
- **Committed in:** `135ebbe3`

**2. [Rule 2 - Missing Critical] Enforced semantic free-identifier closure for emitted source**
- **Found during:** Task 2
- **Issue:** A denylist and syntax transpilation alone could permit unresolved host identifiers in generated student source.
- **Fix:** Added TypeScript checker-based free-identifier detection and regression coverage.
- **Files modified:** `packages/strategy-oracle-teacher/src/emit.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
- **Verification:** Focused Vitest suite proves unresolved and direct-import source denial.
- **Committed in:** `135ebbe3`

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 2 critical boundary).

## Known Stubs

None. This leaf emits private factory proposal data only; it makes no candidate-admission, empirical, or production claim.

## Issues Encountered

- The workspace has no installed package link for the new oracle package, so the leaf uses the existing relative factory/engine source seams already established by the concurrent tactical leaf. No dependency installation or lockfile change was made.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 05 can consume the exact `emitTeacherFactoryPacket` export as private data under factory admission.
- This implementation contributes to ORCL-01 and ORCL-03 only. It does not establish the phase-wide independent-channel, external-intake, candidate, league, holdout, or empirical evidence requirements.

## Self-Check: PASSED

*Phase: 264-immutable-factory-independent-oracles-and-quarantined-intake*
*Completed: 2026-09-13*
