---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "03"
subsystem: private-offline-oracle
tags: [canonical-engine, counterfactual-search, legal-distillation, owned-controller, factory-packet]
requires:
  - phase: 264-01
    provides: strict factory packet schema and fixed inherited authority pins
provides:
  - fixed-condition bounded canonical mission and Action response search
  - explicit search-to-sanitized-training-to-conditional-student path
  - exact owned-controller source bundle and rooted data-only factory packet
affects: [264-05-factory-integration, 264-07-independent-channel-evidence]
tech-stack:
  added: []
  patterns: [global-node-accounting, canonical-runtime-resume, exact-legal-record-projection, source-byte-manifest]
key-files:
  created: []
  modified:
    - packages/strategy-oracle-teacher/src/teacher.ts
    - packages/strategy-oracle-teacher/src/distill.ts
    - packages/strategy-oracle-teacher/src/controller.ts
    - packages/strategy-oracle-teacher/src/emit.ts
    - packages/strategy-oracle-teacher/src/index.ts
    - packages/strategy-oracle-teacher/src/teacher.test.ts
key-decisions:
  - "Compare candidate policies by resuming one fixed canonical decision, never by varying initiative or seed."
  - "Model cautious/aggressive opponent responses as legal canonical resumes; never add hypothesis points to scoring."
  - "Distill only bounded legal feature buckets after exact receipt projection; do not retain raw teacher score or search state."
  - "Use one import-free owned controller for both trusted and emitted entrypoints and bind its exact bytes into a source manifest."
requirements-contributed: [ORCL-01, ORCL-03]
requirements-completed: []
implementation_status: independently_verified_mechanics_pending_phase_integration
completed: 2026-09-14
status: implementation_complete
---

# Phase 264 Plan 03: Search Teacher and Distiller Summary

The private teacher leaf now has a genuine bounded current-rules mechanics path: canonical decision alternatives are resumed through `MATCH_KERNEL`, selected legal observations and targets are projected through an exact sanitizer, the resulting bounded feature policy controls a deterministic student, and the data-only emitter bundles the exact same owned controller used by trusted tests.

## Completed Work

1. Replaced initiative-switched event counting with fixed-condition response search. Three candidate mission/Action policies resume the same student-owned effect, while the declared opponent hypothesis controls only separate schema-valid opponent responses. Ranking uses canonical outcome and Soldier-status consequences with deterministic tie-breaking.
2. Applied one global node cap to machine creation and every canonical advance/resume. Receipts report actual node use, actual student-decision depth, actually evaluated alternatives, canonical state/outcome summaries, and the selected branch's legal targets. Low-budget and early-terminal paths report zero evaluated alternatives without throwing.
3. Added `projectTeacherSearchToLegalTraining` and wired the selected search targets through exact canonical-input/Action validation into bounded legal feature buckets. The student retains no opaque Soldier id, search score, opponent hypothesis, host field, or evaluator state.
4. Moved both `selectActivations` and `soldierBrain` behavior into `controller.ts`. Trusted wrappers parse canonical v1.19 inputs and call those functions; emitted source statically bundles the same bytes and records a controller manifest root that changes with either entrypoint.
5. Hardened receipt, record, Action, policy, student, identity, and closure validation. Unknown kinds/fields, parser-stripped nested extras, duplicate/out-of-domain features, forged controller roots, computed capability recovery, and malformed default exports fail closed. All returned student structures are deeply frozen.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` — passed, 7/7 focused pure tests.
- `./node_modules/.bin/tsc -b packages/strategy-oracle-teacher --pretty false` — passed with unfiltered diagnostics.
- Generated student source was inspected statically but never imported or executed.
- No guest, provider, network, empirical Match, allocation, holdout, formation, public, production, or historical Phase 262/263 path was used.

## Commits

- `7fb2b83e`, `f0216ebd`, `135ebbe3`, `7516aa5c`, `2d566f95`, `8c61ec0b` — historical Plan 03 implementation and partial correction commits.
- `f27230e1` — `fix(264-03): repair connected canonical teacher pipeline`.

## Review Resolution

All six findings in `264-TEACHER-CODE-REVIEW.md` were addressed in the bounded repair and independently closed in `264-TEACHER-READINESS-CHECK.md`. Main also inspected the canonical Action-resume path and passed all seven focused tests plus the unfiltered package build. The generic fix-report logic-change inspection flags are satisfied by those independent source checks; they do not require a separate human checkpoint or establish empirical quality. See `264-TEACHER-REVIEW-FIX.md` for the mapping and cherry-pick provenance (`961d3e07`, `e4228a47`).

## Boundaries and Remaining Work

This is implementation and pure unit evidence only. It does not claim an admitted candidate, empirical Match result, oracle independence, Phase 264 readiness, competitive strength, a Plan 07 allocation, or public/production authority. Plan 05 may consume the packet as hostile private data after integration, and Plan 07 still owns cross-channel independence/readiness evidence.

## Self-Check

- The teacher leaf imports the canonical engine and non-strategic factory/schema seams only; it does not import another oracle's selector, scorer, search tree, or response logic.
- Search targets demonstrably originate from canonical effects and are stripped before policy compilation.
- Both emitted entrypoints are the exact leaf-owned controller functions, with byte-root correspondence tests.
- Focused tests and the full package TypeScript build pass in the isolated repair worktree.
