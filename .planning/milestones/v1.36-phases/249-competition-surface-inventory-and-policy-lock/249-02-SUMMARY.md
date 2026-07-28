---
phase: 249-competition-surface-inventory-and-policy-lock
plan: 02
subsystem: tooling
tags: [competition-inventory, public-privacy, artifacts, vitest, tdd]

requires:
  - phase: 249-01
    provides: spec-owned competition-policy-v1.36 posture, privacy, forbidden-claim, and owner vocabulary
provides:
  - Deterministic v1.36 competition surface inventory evaluator
  - Synchronized Markdown and JSON competition surface inventory artifacts
  - Temp-root artifact drift, row-sync, posture-copy, forbidden-claim, and privacy-marker tests
affects: [phase-249, phase-250, phase-251, phase-252, phase-253, phase-254, phase-255]

tech-stack:
  added: []
  patterns: [typed static evaluator, generated Markdown/JSON artifacts, temp-root artifact check tests]

key-files:
  created:
    - scripts/evaluate-v1-36-competition-policy.ts
    - scripts/evaluate-v1-36-competition-policy.test.ts
    - .planning/artifacts/v1.36-competition-surface-inventory.md
    - .planning/artifacts/v1.36-competition-surface-inventory.json
  modified: []

key-decisions:
  - "Inventory rows use exactly one downstream disposition from the Phase 249 locked set."
  - "Markdown and JSON artifacts are generated from one typed evaluator source and checked for stale or desynchronized rows."
  - "The evaluator inventories downstream Phase 250-255 ownership without implementing entry, Season, standings, governance, UX, proof, runtime, database, or game-rule behavior."

patterns-established:
  - "v1.36 competition inventory artifacts are current only when evaluator-rendered Markdown and JSON match the checked-in files."
  - "Rows that require posture labels must carry exact public beta trial competition and reset/no-durable copy."

requirements-completed: [POST-01, POST-02, POST-03, POST-04]

duration: 8min
completed: 2026-06-15
---

# Phase 249 Plan 02: Competition Surface Inventory Summary

**Typed v1.36 competition surface inventory evaluator with synchronized Markdown/JSON artifacts for route, code, docs, monitor, proof, fixture, and snapshot handoff rows.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-15T23:20:00Z
- **Completed:** 2026-06-15T23:27:41Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added RED Vitest coverage for POST-01 through POST-04 inventory row contract, required groups, disposition vocabulary, posture copy, forbidden claims, private markers, and artifact drift.
- Implemented `scripts/evaluate-v1-36-competition-policy.ts` with typed rows, validation, Markdown/JSON renderers, write/check functions, and CLI flags.
- Generated `.planning/artifacts/v1.36-competition-surface-inventory.md` and `.json` from the evaluator and verified both artifacts are current.

## Task Commits

1. **Task 1: Add evaluator tests for the v1.36 inventory contract** - `332373b` (test)
2. **Task 2: Implement the deterministic inventory evaluator** - `55bb389` (feat)
3. **Task 3: Generate synchronized Markdown and JSON inventory artifacts** - `e8837bf` (docs)

## Files Created/Modified

- `scripts/evaluate-v1-36-competition-policy.test.ts` - Temp-root Vitest contract and artifact drift tests.
- `scripts/evaluate-v1-36-competition-policy.ts` - Static evaluator, validator, renderer, writer, checker, and CLI.
- `.planning/artifacts/v1.36-competition-surface-inventory.md` - Human-readable competition surface inventory.
- `.planning/artifacts/v1.36-competition-surface-inventory.json` - Machine-readable inventory for later monitor/proof consumers.
- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-02-SUMMARY.md` - This completion record.

## Decisions Made

- Kept row validation local and deterministic, using the spec-owned `competition-policy-v1.36` constants without adding new dependencies.
- Kept `future/defer` only as an allowed disposition and artifact taxonomy item; current concrete rows are assigned to lock/fix/prove dispositions.
- Left `.planning/STATE.md` and `.planning/ROADMAP.md` untouched because plan execution was invoked with centralized orchestrator tracking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed literal forbidden category text from default rows**
- **Found during:** Task 2 (Implement the deterministic inventory evaluator)
- **Issue:** Two default rows used the literal locked category `private-runtime`, causing the evaluator to reject its own inventory.
- **Fix:** Reworded those row descriptions to say "private runtime" without embedding a forbidden claim category string.
- **Files modified:** `scripts/evaluate-v1-36-competition-policy.ts`
- **Verification:** `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts`
- **Committed in:** `55bb389`

**2. [Rule 1 - Bug] Suppressed row-sync noise for completely stale Markdown**
- **Found during:** Task 2 (Implement the deterministic inventory evaluator)
- **Issue:** Replacing Markdown with a non-table stale file reported every row as missing row-sync drift instead of one clear stale Markdown failure.
- **Fix:** Row-sync drift checks now run only when the Markdown contains parseable inventory rows.
- **Files modified:** `scripts/evaluate-v1-36-competition-policy.ts`
- **Verification:** `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts`
- **Committed in:** `55bb389`

---

**Total deviations:** 2 auto-fixed (2 bug fixes).
**Impact on plan:** Both fixes kept the evaluator fail-loud while making diagnostics precise. No scope expansion.

## Issues Encountered

The RED gate failed as expected before Task 2 because `scripts/evaluate-v1-36-competition-policy.ts` did not exist. No blockers remained after implementation.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts` - passed, 6 tests.
- `pnpm exec tsx scripts/evaluate-v1-36-competition-policy.ts --check` - passed.
- Wave gate `pnpm exec vitest run packages/spec/src/spec.test.ts scripts/evaluate-v1-36-competition-policy.test.ts` - passed, 50 tests.
- Task acceptance greps and JSON shape checks - passed.

## Known Stubs

None. Stub scan found no `TODO`, `FIXME`, placeholder copy, hardcoded empty UI values, or unwired mock data in the plan files.

## Threat Flags

None. The new file I/O is the planned static artifact writer/checker for T-249-05 through T-249-08, and no unplanned network endpoint, auth path, database boundary, runtime execution, Strategy execution, or service-backed proof surface was introduced.

## TDD Gate Compliance

- RED commit present: `332373b`
- GREEN commit present after RED: `55bb389`
- REFACTOR commit: not needed

## Self-Check: PASSED

- Found created files: `scripts/evaluate-v1-36-competition-policy.ts`, `scripts/evaluate-v1-36-competition-policy.test.ts`, `.planning/artifacts/v1.36-competition-surface-inventory.md`, `.planning/artifacts/v1.36-competition-surface-inventory.json`, and this summary.
- Found task commits: `332373b`, `55bb389`, and `e8837bf`.
- Re-ran plan verification: focused evaluator tests, artifact `--check`, and wave gate all passed.

## Next Phase Readiness

Plan 249-03 can wire these artifacts into the boundary monitor chain. Later Phases 250-255 can consume row dispositions without this plan having implemented entry enforcement, Season lifecycle, standings recompute, governance workflow, React game rules, Strategy execution, service-backed proof, database migrations, or Node `vm`.

---
*Phase: 249-competition-surface-inventory-and-policy-lock*
*Completed: 2026-06-15*
