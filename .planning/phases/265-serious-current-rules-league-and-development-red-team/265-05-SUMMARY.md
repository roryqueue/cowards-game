---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "05"
subsystem: private league selection and reporting
tags: [private-offline, pure-portfolio, robust-pure, report-projection, bounded-reopen]
dependency_graph:
  requires: [265-01-league-contracts, 265-03-league-repository, 265-04-exact-solver]
  provides: [receipt-derived-pure-portfolio, robust-pure-or-no-finalist, complete-private-report-projection]
  affects: [265-06-cli-wiring, 265-07-source-proof, 266-current-league-freeze]
tech_stack:
  added: []
  patterns: [conjunctive-proof-gates, mixture-pure-separation, denylisted-private-projection, read-only-bounded-report-reopen]
key_files:
  created:
    - packages/strategy-lab/src/league/selection.ts
    - packages/strategy-lab/src/league/selection.test.ts
    - packages/strategy-lab/src/league/report.ts
    - packages/strategy-lab/src/league/report.test.ts
  modified: []
decisions:
  - "A diagnostic mixture remains a root-bound training artifact; it cannot become a portfolio entrant or robust-pure finalist."
  - "Robust-pure selection is a complete conjunction of frozen proof roots, including maximin_oracle_relative_pure, and never adds a numeric pure threshold."
  - "Reports require complete persisted cells and reject derived unterminated terminals or invalid remnants; reopening is bounded and issued:false."
requirements-covered-source: [LEAG-05, LEAG-06, LEAG-07, LEAG-08]
source_only_not_empirically_complete: true
coverage:
  - id: D1
    description: Receipt-derived diverse pure portfolio with diagnostic mixture separation and explicit rejection evidence.
    requirement: LEAG-06
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/selection.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Conjunctive robust-pure or no-finalist disposition using frozen proof roots including maximin_oracle_relative_pure.
    requirement: LEAG-07
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/selection.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Complete bounded private report publication and data-only reopening with private-field and claim denial.
    requirement: LEAG-05
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/report.test.ts
        status: pass
      - kind: unit
        ref: packages/strategy-lab/src/league/repository.test.ts
        status: pass
      - kind: other
        ref: ./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
        status: pass
    human_judgment: false
duration: 6min
completed: 2026-09-15
status: complete
---

# Phase 265 Plan 05: Pure Selection and Private Report Summary

**Receipt-derived pure portfolios, robust-pure/no-finalist proof reduction, and bounded private league reports now preserve qualified evidence without mixture promotion, leakage, or overclaiming.**

## Performance

- **Duration:** 6 min
- **Tasks:** 2/2
- **Files modified:** 4
- **Verification:** 15 focused tests passed; strategy-lab TypeScript build passed.

## Accomplishments

- Added a pure-only portfolio reducer that retains the diagnostic mixture as a separate root, rejects labels/cosmetics implicitly by requiring six receipt-derived dimensions, and records clone, correlation, missing behavior, incomplete response, and duplicate evidence failures.
- Added a robust-pure reducer that accepts only a portfolio candidate with every frozen proof gate, including `maximin_oracle_relative_pure`; any failed proof produces rooted `no_robust_pure_finalist_found` rather than a softened result.
- Added complete private report publication and bounded data-only reopening. Reports bind the snapshot, solver manifest/output, mixture, portfolio, red-team and finalist roots; expose required aggregate curves, matrices, distributions, graphs, allocations, attempts, worst cases, and gaps; and reject unsafe fields, unsupported claims, stale graphs, derived unterminated terminals, and invalid remnants.

## Task Commits

1. **Task 1 RED:** `09f52b72` — failing portfolio-selection coverage.
2. **Task 1 GREEN:** `b96d8fb4` — receipt-derived portfolio and robust-pure disposition.
3. **Task 2 RED:** `c3c53d15` — failing private-report coverage.
4. **Task 2 GREEN:** `73dcb6a0` — rooted private report publication and bounded reopening.

## Files Created/Modified

- `packages/strategy-lab/src/league/selection.ts` — pure portfolio and strict robust-pure/no-finalist reducers.
- `packages/strategy-lab/src/league/selection.test.ts` — synthetic receipt and hard-gate coverage.
- `packages/strategy-lab/src/league/report.ts` — complete safe report projection and bounded immutable reopening.
- `packages/strategy-lab/src/league/report.test.ts` — report completeness, privacy, claim, and reopen tests.

## Decisions Made

- The frozen proof-gate reducer does not consume aggregate win rate, source labels, source hashes, or mixture weights as a substitute for pure evidence.
- `maximin_oracle_relative_pure` is a named proof gate only; no numeric floor was added or softened.
- Reopened `derived_unterminated_start` records and invalid partial-file remnants are process-invalid evidence, never persisted empirical success.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - owned files contain no UI placeholders, empty rendering data paths, or TODO/FIXME markers.

## Threat Flags

None - the new code adds no endpoint, auth path, file-access capability beyond the existing immutable league repository, schema trust-boundary, or production surface.

## Next Phase Readiness

Plan 06 can compose the existing trusted runtime constructor and Plan 07 can prove the connected private league path. This plan provides requirements-covered source only, not empirical requirements completion: no Phase 265 allocation, live provider/model, guest, Match, holdout, formation, public, deployment, or promotion action occurred. CLI wiring remains intentionally outside this plan.

## Self-Check: PASSED

- All four owned source/test files and this summary exist.
- Task commits `09f52b72`, `b96d8fb4`, `c3c53d15`, and `73dcb6a0` exist on `main`.
- No task commit deletes tracked files.
- Focused selection/fingerprint/report/repository suite passed 15/15 tests; strategy-lab typecheck passed.

---
*Phase: 265-serious-current-rules-league-and-development-red-team*
*Completed: 2026-09-15*
