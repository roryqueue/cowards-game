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

**Source-backed pure portfolios, recomputed robust-pure/no-finalist selection, and bounded private league reports now preserve qualified evidence without mixture promotion, claim laundering, leakage, or overclaiming.**

## Performance

- **Duration:** 6 min
- **Tasks:** 2/2
- **Files modified:** 4
- **Verification:** 15 focused tests passed; strategy-lab TypeScript build passed.

## Accomplishments

- Replaced the initial root-and-enum selection input with re-admitted canonical `FactoryFingerprintEvidence` and persisted factory producer bytes joined to the immutable candidate admission, proposal, validation, supervision receipt, and source digest. Cosmetic labels, arbitrary roots, correlation, and incomplete evidence fail closed.
- Recomputed frozen strict `> .55`, `> .60`, and `< .60` comparisons from qualified score rows, and selected `maximin_oracle_relative_pure` only by complete pure-worst-case comparison, with no caller pass flag or added numeric floor. Any missing/weak/process-invalid evidence produces rooted `no_robust_pure_finalist_found`.
- Added complete private report publication and bounded data-only reopening. Reports bind the snapshot, solver manifest/output, mixture, portfolio, red-team and issued reducer disposition; expose required aggregate curves, matrices, distributions, graphs, allocations, attempts, worst cases, and gaps; and reject unsafe fields, unsupported claims, stale graphs, forged dispositions, derived unterminated terminals, and invalid remnants.

## Task Commits

1. **Task 1 RED:** `09f52b72` — failing portfolio-selection coverage.
2. **Task 1 GREEN:** `b96d8fb4` — receipt-derived portfolio and robust-pure disposition.
3. **Task 2 RED:** `c3c53d15` — failing private-report coverage.
4. **Task 2 GREEN:** `73dcb6a0` — rooted private report publication and bounded reopening.
5. **Acceptance correction:** `1621b124`, `971c4ee5` — content-validated source/fingerprint admission, recomputed thresholds/maximin, and report disposition capability binding.

## Files Created/Modified

- `packages/strategy-lab/src/league/selection.ts` — pure portfolio and strict robust-pure/no-finalist reducers.
- `packages/strategy-lab/src/league/selection.test.ts` — synthetic receipt and hard-gate coverage.
- `packages/strategy-lab/src/league/report.ts` — complete safe report projection and bounded immutable reopening.
- `packages/strategy-lab/src/league/report.test.ts` — report completeness, privacy, claim, and reopen tests.

## Decisions Made

- The rejected initial v1 selection shape accepted caller-provided roots and enums. The final reducer uses canonical factory artifacts and recomputed evidence rows instead; this was an acceptance correction, not empirical work.
- The frozen reducer does not consume aggregate win rate, source labels, source hashes, mixture weights, pass flags, or proof-root claims as substitutes for pure evidence.
- `maximin_oracle_relative_pure` is derived from complete qualified pure worst cases; no numeric floor was added or softened.
- Reopened `derived_unterminated_start` records and invalid partial-file remnants are process-invalid evidence, never persisted empirical success.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Evidence integrity] Replaced caller-asserted selection and finalist proof shapes**
- **Found during:** Plan acceptance review.
- **Issue:** The initial selection reducer accepted arbitrary roots plus `independence`/`status` enum claims, allowing a fabricated portfolio or finalist.
- **Fix:** Re-admit canonical factory fingerprint/producer artifacts and candidate joins, derive clone/correlation and diversity from retained records, recompute frozen strict-score and maximin gates, and make reports accept only a disposition emitted by that reducer.
- **Files modified:** `packages/strategy-lab/src/league/selection.ts`, `packages/strategy-lab/src/league/selection.test.ts`, `packages/strategy-lab/src/league/report.ts`, `packages/strategy-lab/src/league/report.test.ts`.
- **Verification:** Exact focused suite passed 15/15 and strategy-lab typecheck passed.
- **Committed in:** `1621b124`, `971c4ee5`.

## Known Stubs

None - owned files contain no UI placeholders, empty rendering data paths, or TODO/FIXME markers.

## Threat Flags

None - the new code adds no endpoint, auth path, file-access capability beyond the existing immutable league repository, schema trust-boundary, or production surface.

## Next Phase Readiness

Plan 06 can compose the existing trusted runtime constructor and Plan 07 can prove the connected private league path. This plan provides requirements-covered source only, not empirical requirements completion: no Phase 265 allocation, live provider/model, guest, Match, holdout, formation, public, deployment, or promotion action occurred. CLI wiring remains intentionally outside this plan.

## Self-Check: PASSED

- All four owned source/test files and this summary exist.
- Task/correction commits `09f52b72`, `b96d8fb4`, `c3c53d15`, `73dcb6a0`, `1621b124`, and `971c4ee5` exist on `main`.
- No task commit deletes tracked files.
- Focused selection/fingerprint/report/repository suite passed 15/15 tests; strategy-lab typecheck passed.

---
*Phase: 265-serious-current-rules-league-and-development-red-team*
*Completed: 2026-09-15*
