---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "04"
subsystem: private league solver and response loop
tags: [bigint-rational, deterministic-solver, psro, double-oracle, private-evidence]
requires:
  - phase: 265-01
    provides: rooted league contracts and identities
  - phase: 265-02
    provides: complete payoff snapshots and canonical payoff-byte transport
  - phase: 265-03
    provides: immutable private charged-terminal retention patterns
provides:
  - measured and frozen exact-rational restricted-game solver selection
  - immutable mixture and named-pure PSRO targets with charged response evidence
affects: [265-05, 265-06, 265-07, league]
tech-stack:
  added: []
  patterns: [canonical bigint rational arithmetic, revalidated typed-array transport, charge-first response lifecycle]
key-files:
  created:
    - packages/strategy-lab/src/league/solver.ts
    - packages/strategy-lab/src/league/solver.test.ts
    - packages/strategy-lab/src/league/psro.ts
    - packages/strategy-lab/src/league/psro.test.ts
  modified: []
key-decisions:
  - "The bounded synthetic corpus uniquely selected exact-rational-pivoted-restricted-v1 over bounded fictitious play; no Nash, convergence, or optimality claim is made."
  - "Solver input is canonical-byte re-admitted and copied before use because frozen objects do not make Uint8Array elements immutable."
  - "A successful counter requires a separately complete next snapshot and can never close its historical round."
patterns-established:
  - "Solver results ignore worker, shard, and restart operational layout and emit canonical semantic bytes only."
  - "PSRO admission derives one charge and terminal root from receipt fields rather than accepting caller-provided gate booleans."
requirements-completed: [LEAG-03, LEAG-04]
coverage:
  - id: D1
    description: Measured exact-rational solver selection with canonical output invariance and explicit input/failure checks.
    requirement: LEAG-03
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/solver.test.ts
        status: pass
      - kind: other
        ref: ./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
        status: pass
    human_judgment: false
  - id: D2
    description: Frozen PSRO targeting, charge-first response admission, terminal retention, and fresh-snapshot counter re-entry.
    requirement: LEAG-04
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/psro.test.ts
        status: pass
      - kind: other
        ref: ./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-09-15
status: complete
---

# Phase 265 Plan 04: Frozen Exact Solver and Response Loop Summary

**A measured exact bigint-rational restricted-game solver and immutable PSRO response lifecycle now keep private league analysis reproducible, bounded, and counter-complete.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-15T03:00:32Z
- **Completed:** 2026-09-15T03:06:59Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Compared bounded exact-rational fictitious play against exact-rational pivoted restricted solving over degenerate, tie, permutation, and numeric-boundary vectors; the corpus uniquely selected `exact-rational-pivoted-restricted-v1`.
- Re-admitted canonical payoff transport, copied mutable `Uint8Array` bytes before parsing, normalized entrant order and half-point weights, and returned explicit bounded failures instead of an unqualified solve claim.
- Declared immutable solver/mixture/strongest-pure/vulnerable-pure targets, charged every response before work, retained all terminal dispositions, and required accepted late counters to re-enter through a complete new snapshot.

## Task Commits

1. **Task 1: Compare and freeze the deterministic empirical-game solver** - `8aed5de8` (RED), `d22f4403` (GREEN)
2. **Task 2: Implement immutable PSRO target, admission, and re-entry transitions** - `0cf0e94b` (RED), `df90cc80` (GREEN), `6e2342c0` (critical correction)

## Files Created/Modified

- `packages/strategy-lab/src/league/solver.ts` - Synthetic solver comparator, exact bigint-rational restricted solver, canonical result/manifest roots, and explicit failure results.
- `packages/strategy-lab/src/league/solver.test.ts` - Golden selection, byte-layout invariance, and mutable transport tests.
- `packages/strategy-lab/src/league/psro.ts` - Frozen target declaration, receipt-shaped charge/terminal admission, and no-early-closure state transitions.
- `packages/strategy-lab/src/league/psro.test.ts` - Target, disposition-retention, and accepted-counter re-entry tests.

## Decisions Made

- Chose the exact pivoted restricted candidate only because it uniquely passed the committed synthetic corpus; bounded fictitious play did not satisfy all exact boundary vectors.
- Restrict non-pure solving to the tested 2×2 exact pivot and return `RESOURCE_BOUND` outside its frozen support instead of claiming general convergence.
- Require a parsed `CompletePayoffSnapshot` for response re-entry, not merely a caller-provided future root.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Require a complete next snapshot for accepted counter re-entry**
- **Found during:** Task 2
- **Issue:** The first transition version accepted a bare next-snapshot root, which could not prove that an accepted counter entered a complete new empirical-game snapshot.
- **Fix:** Re-admit `CompletePayoffSnapshot` during advancement and reject stale or bare roots.
- **Files modified:** `packages/strategy-lab/src/league/psro.ts`, `packages/strategy-lab/src/league/psro.test.ts`
- **Verification:** Focused solver/PSRO tests and strategy-lab TypeScript build pass.
- **Committed in:** `6e2342c0`

---

**Total deviations:** 1 auto-fixed (1 Rule 2 missing critical functionality).
**Impact on plan:** The correction preserves D-13 through D-15 by making counter re-entry explicitly complete-snapshot-backed.

## Known Stubs

None - the plan-owned files contain no rendering-flow empty values, placeholders, or TODO/FIXME markers.

## Issues Encountered

- The RED-to-GREEN implementation initially attempted to recursively freeze output bytes. Runtime rejects freezing nonempty typed arrays, so canonical result bytes remain returned as copied transport while all serializable roots/records are frozen.

## User Setup Required

None - no external service, package installation, provider, candidate, Match, or empirical allocation was used.

## Next Phase Readiness

- Plans 05–07 can consume frozen solver/output roots and complete PSRO target/admission records.
- Any live league work remains blocked on the separate Phase-265 allocation root; this plan creates source-only machinery only.

## Self-Check: PASSED

- All four plan-owned source/test files exist.
- Task commits `8aed5de8`, `d22f4403`, `0cf0e94b`, `df90cc80`, and `6e2342c0` exist on `main`.
- Focused source-only Vitest suite passed 6/6 tests; the strategy-lab TypeScript build passed.

---
*Phase: 265-serious-current-rules-league-and-development-red-team*
*Completed: 2026-09-15*
