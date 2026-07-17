---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "07"
subsystem: persistence
tags: [typescript, completion, retry, set-conditions, scoring, postgresql]

requires:
  - phase: 260-04
    provides: Immutable arena, condition, and runtime-v1.19 revalidation substrate
  - phase: 260-05
    provides: Canonical four-condition TypeScript scheduling identity
  - phase: 259-18
    provides: Current semantic receipt and Chronicle completion transaction
provides:
  - Exact runtime-v1.19 terminal and bounded retry identity admission
  - Candidate-only full-matrix D-04 revalidation, status, counted-state, and scoring dispatch
  - Canonical scenario/condition ordering independent of insertion or completion order
affects: [260-08, 260-09, 260-14, match-completion, matchset-status, standings]

tech-stack:
  added: []
  patterns: [explicit-version-dispatch, frozen-condition-identity, revision-revalidation-gate, canonical-matrix-order]

key-files:
  created:
    - packages/persistence/src/matchset-status.test.ts
  modified:
    - packages/persistence/src/complete-match.ts
    - packages/persistence/src/complete-match.test.ts
    - packages/persistence/src/matchset-status.ts
    - packages/persistence/src/scoring.ts
    - packages/persistence/src/scoring.test.ts

key-decisions:
  - "Keep Phase-259 completeMatch, determineMatchSetStatus, and scoreMatchSet behavior unchanged; successor logic is reachable only through explicit runtime-v1.19 functions or the exact candidate tuple query."
  - "Treat success and player_violation as the only terminal classes; a system failure produces retry or degraded disposition without gameplay or terminal evidence."
  - "Require byte-identical condition, request, side, initiative, seed, arena, tuple, revision, revalidation ID, and revalidation root identity across terminal and retry evidence."
  - "Recheck non-revoked D-04 source, artifact, language, provider, lane, ABI, tuple, receipt-root, and reviewed-certificate bindings from PostgreSQL before successor countability."
  - "Return empty rankings for every pending or degraded successor matrix so partial evidence cannot affect counted standings."

patterns-established:
  - "Successor terminal admission: exact frozen scheduling identity plus terminal class, with no compatibility inference from source shape or certificates."
  - "Successor scoring: validate every canonical condition and revision admission, sort by scenario ID then ordinal, then invoke the unchanged Phase-259 scorer."

requirements-completed: [SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "Success and player violations require exact frozen runtime-v1.19 condition identity; side, initiative, arena, tuple, request, and D-04 drift fail closed."
    requirement: SET-03
    verification:
      - kind: unit
        ref: "packages/persistence/src/complete-match.test.ts#runtime-v1.19-frozen-condition-completion"
        status: pass
    human_judgment: false
  - id: D2
    description: "System failures retry only with identical identity while bounded attempts become degraded and add no terminal evidence."
    requirement: SET-05
    verification:
      - kind: unit
        ref: "packages/persistence/src/complete-match.test.ts#retries-system-failures-only-with-an-identical-frozen-request-and-bounded-attempt"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/complete-match.test.ts#rolls-back-attempt-mismatch-and-late-writes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only exact complete canonical matrices with current non-revoked D-04 evidence count; partial, retryable, exhausted, substituted, duplicate, and revoked matrices remain non-counted."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "packages/persistence/src/scoring.test.ts#runtime-v1.19-exact-matrix-scoring"
        status: pass
      - kind: unit
        ref: "packages/persistence/src/matchset-status.test.ts#runtime-v1.19-MatchSet-status"
        status: pass
    human_judgment: false
  - id: D4
    description: "Scenario ID and condition ordinal canonicalization makes scoring output byte-identical across insertion and completion permutations while Phase-259 tests remain exact."
    requirement: SET-05
    verification:
      - kind: unit
        ref: "packages/persistence/src/scoring.test.ts#is-byte-identical-for-every-insertion-and-completion-permutation"
        status: pass
      - kind: command
        ref: "pnpm --filter @cowards/persistence typecheck"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 07: TypeScript Successor Completion and Scoring Summary

**TypeScript now has an explicit runtime-v1.19 terminal/retry admission and a PostgreSQL-backed exact-matrix scoring branch that counts only canonical four-condition scenarios with current revision-specific D-04 evidence, while Phase-259 behavior stays unchanged.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-17T05:22:42Z
- **Completed:** 2026-07-17T05:45:18Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 6

## Accomplishments

- Added a strict successor condition identity carrying scenario, condition, request hash, sides, initial initiative, seed, arena/catalog/geometry, exact candidate tuple, and both revisions' D-04 revalidation IDs and roots.
- Added terminal admission for only `success` and `player_violation`, plus bounded retry evaluation that rejects any identity drift and degrades exhausted or non-retryable system failures without producing terminal evidence.
- Added an exact candidate MatchSet scorer that rejects duplicate, substituted, or generic four-terminal counterfeits and returns no rankings for partial, retryable, degraded, revoked, missing, or cross-bound evidence.
- Added PostgreSQL candidate status dispatch that rechecks each frozen Strategy Revision against non-revoked source, artifact, ABI, tuple, real receipt, lane/provider, and reviewed-certificate evidence before setting `counted_status`.
- Canonicalized all successor scoring by scenario ID and condition ordinal so input order cannot change output bytes.

## Task Commits

1. **Task 1 RED: successor terminal/retry identity expectations** - `b7cac99`
2. **Task 1 GREEN: frozen terminal and bounded retry admission** - `e8b1618`
3. **Task 2 RED: exact matrix status/scoring expectations** - `037ee83`
4. **Task 2 GREEN: PostgreSQL D-04 gate and canonical scoring** - `49fa9aa`
5. **Exact authority correction: canonical arena catalog version** - `e9d3b0f`

## Files Created/Modified

- `packages/persistence/src/complete-match.ts` - Adds exact runtime-v1.19 condition terminal and retry admission without changing the current completion transaction.
- `packages/persistence/src/complete-match.test.ts` - Covers valid terminals, condition/request/side/initiative/tuple/revalidation drift, retries, player violations, and existing PostgreSQL rollback behavior.
- `packages/persistence/src/matchset-status.ts` - Adds candidate-only status derivation and PostgreSQL D-04 revalidation before counted-state mutation.
- `packages/persistence/src/matchset-status.test.ts` - Proves complete, retryable pending, invalid-evidence pending, and exhausted degraded states.
- `packages/persistence/src/scoring.ts` - Adds multi-scenario exact membership validation, canonical ordering, evidence gating, and non-counted empty scoring.
- `packages/persistence/src/scoring.test.ts` - Covers permutations, omissions, duplicates, substitutions, generic four-terminal counterfeits, player violations, failures, revocation, and current scoring snapshots.

## Decisions Made

- The existing Phase-259 `completeMatch`, `determineMatchSetStatus`, and `scoreMatchSet` paths remain the current selectors; no default, tuple, or production activation changed.
- Candidate score computation does not expose partial rankings. Pending and degraded matrices persist an empty ranking set, preventing accidental standings influence.
- D-04 eligibility is not inferred from a lane certificate. The candidate query independently matches immutable revision source/artifact facts, exact ABI/tuple and execution lane, real service receipt evidence, reviewed certificate, and absence of revocation.
- Multiple scenarios are sorted by scenario ID and each scenario's conditions by canonical ordinal before invoking the unchanged scoring arithmetic.

## Deviations from Plan

None in implementation scope. The long PostgreSQL completion suite exceeded one tool output window, so its long cases were rerun as focused shards; every test in the file was observed passing.

## Issues Encountered

- The unsharded PostgreSQL completion command exceeded the tool's single output window before Vitest printed its final aggregate. The remaining player-violation, rollback/idempotence, and authority-head cases were executed separately and passed.
- The package-wide Vitest invocation similarly exceeded the output window; plan-focused suites, persistence typecheck, formatting, and every PostgreSQL completion case passed independently.

## Verification

- `pnpm --filter @cowards/persistence typecheck` - passed.
- `pnpm exec vitest run packages/persistence/src/matchset-status.test.ts packages/persistence/src/scoring.test.ts` - 9 passed.
- `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run packages/persistence/src/complete-match.test.ts --maxWorkers=1` - all 14 tests observed passing across the main run and focused long-case shards.
- Focused PostgreSQL player-violation case - passed.
- Focused PostgreSQL fault-after-each-write, idempotence, and conflict-refusal case - passed.
- Focused PostgreSQL authority-head refusal case - passed.
- Prettier check over all six plan files - passed.
- Protected user files retained exact starting hashes and remain unstaged.

## TDD Gate Compliance

- Task 1 RED `b7cac99` failed because successor terminal/retry admission did not exist; GREEN `e8b1618` passes exact identity, terminal-class, and bounded-retry tests.
- Task 2 RED `037ee83` failed because successor status/scoring functions did not exist; GREEN `49fa9aa` passes exact membership, D-04, permutation, player-violation, and failure-state tests.

## Next Phase Readiness

- Plan 260-08 can mirror the same exact condition/retry and canonical scoring contract in Go.
- Plan 260-09 can attach candidate Chronicle recording to the already frozen terminal identity without making replay the source of Set membership truth.
- Plan 260-14 remains the only activation owner; current Phase-259 completion, status, scoring, tuple selection, and defaults are unchanged.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All six plan files exist, both TDD RED/GREEN pairs and the authority correction are present, and the summary records their hashes.
- Focused unit, PostgreSQL rollback/player-violation/authority, typecheck, formatting, stub, whitespace, and protected-baseline checks pass.
- No current selector, gameplay rule, Strategy execution boundary, public DTO, or protected user file changed.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
