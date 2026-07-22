---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "22"
subsystem: postactivation-proof
tags: [runtime-v1.19, postactivation, rollback, mixed-state, fail-closed]

requires:
  - phase: 260-21
    provides: Exact preactivation candidate and Phase-259 current inventory
provides:
  - Distinct successor-only postactivation evaluator with a fixed nine-file and eleven-selector database inventory
  - Exact twenty-three-gate receipt contract bound to one HEAD, dirty worktree, and serializable transaction token
  - Restore-equality-before-reinstall rollback orchestration and fixed member-by-member receipt roots
affects: [260-14, 260-15, atomic-activation]

tech-stack:
  added: []
  patterns: [successor-only-predicate, fixed-logical-database-selectors, restore-before-reinstall]

key-files:
  created:
    - scripts/evaluate-v1-37-observation-v1-19-postactivation.ts
    - scripts/evaluate-v1-37-observation-v1-19-postactivation.test.ts
  modified: []

key-decisions:
  - "The postactivation predicate contains only successor facts; Phase-259 values enter rollback through captured preimages rather than old-current assertions."
  - "Database rollback is receipted through eleven fixed logical selectors, including every language certificate, authority/service head, tuple member, arena/Set authority, and D-04 admission decision."
  - "Exact old equality must pass before any successor reinstall callback runs."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]

duration: 8min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 22: Distinct Postactivation and Rollback Evaluator Summary

**Plan 14 now has a separately unit-proved successor-state evaluator that rejects every mixed selection and cannot reinstall until all nine file preimages and all eleven logical database selectors exactly match their rollback snapshot.**

## Performance

- **Duration:** 8 min
- **Tasks:** 2 TDD tasks
- **Files created:** 2
- **Focused assertions:** 68

## Accomplishments

- Added a fixed successor selection for runtime ABI v1.19, the exact six-component tuple, four real certificate lanes/twelve runs, arena catalog, four-condition Set policy, corpus v3 reviewed pin, trace v4 reviewed pin, Workshop v1.19 default, replay/public status, Go projection, and database selection.
- Bound every gate receipt to one pre-commit HEAD, dirty-worktree root, serializable activation token, completion/freshness interval, and non-synthetic result; recursive write execution is rejected.
- Enumerated exactly the nine Plan-14 files and eleven logical database selectors, requiring each member to change, restore exactly, and reinstall exactly.
- Added rollback orchestration that restores files and database first, captures and proves complete old equality, and only then permits full successor reinstall and recapture.
- Preserved the strict D-04 result: nine incomplete historical revisions remain explicit non-counted dispositions; none is promoted by inference.
- Kept write mode inert: it canonicalizes a Plan-14-built proof only when `--activation-transaction` is explicit and never flips a selector or database row itself.

## Task Commits

1. **RED: activated-state, mixed-state, gate, and rollback matrix** — `71c2431`
2. **GREEN: distinct successor-only evaluator** — `0a9f12e`
3. **Task 2: fixed rollback receipt and every-leaf mutation closure** — `4aaee21`

## Verification

- Focused evaluator suite: 68/68 tests passed.
- Every successor selection leaf is mutation-tested.
- Every one of nine file members and eleven database selector members is omission/partial-state tested.
- Every one of twenty-three required gates is omission-tested; stale, synthetic, recursively executing, and differently bound receipts fail.
- Root workspace typecheck and lint passed.
- ESLint, standalone TypeScript compile, Prettier, `git diff --check`, and protected-baseline verification passed.
- Protected baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## Deviations from Plan

None — both files are inert preparation owned by Plan 22. No authoritative write mode ran, no selector changed, and no database activation occurred.

## Surprises

- The activation proof file cannot safely be treated as an ordinary self-hashing selector byte inside its own content. The evaluator therefore receipts the fixed nine-member transaction snapshot and rollback roots without claiming an impossible recursive file digest; Plan 14 remains responsible for canonical final artifact bytes.
- A fixed logical database inventory is safer than embedding writable table names in the evaluator: it forces complete semantic coverage while leaving the serializable Plan-14 transaction responsible for mapping each logical selector to exact canonical row JSON.

## Next Phase Readiness

- Plan 260-14 can construct the proof through `buildV137ObservationV119PostactivationProof`, exercise the exported rollback adapter against the activated dirty worktree and database transaction, then run explicit write/check canonical validation before its single activation commit.
- The postactivation evaluator does not import or reuse the preactivation validator and contains no Phase-259 current-selection literal.
- Only the two protected user files remain dirty.

## Self-Check: PASSED

- All three task commits and both declared files exist.
- The focused suite, workspace quality gates, protected baseline, and clean diff checks passed.
- No current behavior or authority was activated.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
