---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "23"
subsystem: candidate-public-result-privacy
tags: [public-contract, privacy, set-fairness, arena-catalog, preactivation]

requires:
  - phase: 260-05
    provides: Frozen TypeScript candidate scenario, condition, side, initiative, arena, and D-16 status facts
  - phase: 260-06
    provides: Go parity for exact candidate four-condition scheduling
  - phase: 260-17
    provides: Explicit public v1.19 semantic and arena-catalog candidate dispatch
provides:
  - Strict explicitly addressed v1.19 public Match-condition result DTO
  - Allowlisted projection of condition, side, initiative, arena, and Set publication status
  - Recursive candidate-specific privacy rejection beyond the general public-output scanner
affects: [260-24, 260-14, 260-15, candidate-result-view, public-boundary-monitors]

tech-stack:
  added: []
  patterns: [explicit-candidate-dispatch, strict-recursive-allowlist, cross-field-public-validation]

key-files:
  created: []
  modified:
    - packages/spec/src/match-execution-contract.ts
    - packages/spec/src/match-execution-contract.test.ts

key-decisions:
  - "Publish one explicit condition result per candidate Match, repeating only the validated Set publication status needed by the result view."
  - "Accept only active candidate arena records; historical aliases remain readable through historical dispatch but cannot masquerade as a schedulable v1.19 result."
  - "Keep the candidate discriminator separate from match-execution-app-v1 so importing the candidate cannot activate or mutate the current Phase-259 contract."

patterns-established:
  - "Candidate public projection validates status/counting, ordinal/label, side distinctness, and initial-initiative consistency before returning bytes."
  - "Candidate privacy runs the general public scanner plus a narrower recursive deny-set for generic artifacts, receipts, signatures, keys, host data, and security internals."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-04, SET-05]

coverage:
  - id: D1
    description: "The explicit v1.19 DTO exposes only approved condition, side, initiative, active catalog, semantic hash, and fail-closed Set publication facts."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "packages/spec/src/match-execution-contract.test.ts#stages a strict v1.19 public condition result without selecting it as current"
        status: pass
      - kind: command
        ref: "pnpm exec vitest run packages/spec/src/match-execution-contract.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Private source, artifacts, memories, objectives, receipts, diagnostics, signatures, keys, host data, credentials, and security internals fail recursively at every candidate nesting level."
    requirement: STRAT-04
    verification:
      - kind: security
        ref: "packages/spec/src/match-execution-contract.test.ts#rejects candidate-only private poison recursively at every nesting level"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current Phase-259 and historical v1.4 result/evidence dispatch remain byte-stable and reject mixed candidate payloads."
    requirement: SET-05
    verification:
      - kind: compatibility
        ref: "packages/spec/src/match-execution-contract.test.ts#preserves current and historical result dispatch bytes around candidate parsing"
        status: pass
      - kind: command
        ref: "pnpm contract:check"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 23: Candidate Public Result Contract Summary

**The v1.19 candidate now has a strict, mechanically renderable public condition-result contract while the current Phase-259 app DTO and historical v1.4 dispatch remain exact.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-17T06:48:00Z
- **Completed:** 2026-07-17T06:53:00Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 2

## Accomplishments

- Added `match-execution-public-result-v1.19-candidate-1` with an explicit `runtime-v1.19` discriminator and no unversioned/current alias.
- Exposed only Match/Set IDs, pending/degraded/countable publication state, active arena/catalog identity, semantic geometry hash, canonical condition ID/label/ordinal, side entrant keys, and the initial-initiative entrant.
- Validated counted/status agreement, canonical ordinal/label agreement, distinct side entrants, and label-derived initial initiative before publication.
- Rejected mixed versions, extra fields, retry internals, historical-alias scheduling, malformed hashes/IDs, and premature current parsing.
- Added recursive poison coverage for source, artifacts, StrategyMemory, SoldierMemory, objectives, receipts, diagnostics, signatures, keys, host data/paths, credentials, and security internals.
- Proved existing current schema/output bytes and historical evidence bytes remain unchanged around candidate parsing.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: candidate result contract expectations** — `f25429e` (test)
2. **Task 1 GREEN: strict explicit candidate projection** — `3957bd5` (feat)
3. **Task 2 RED: recursive privacy and compatibility probes** — `08e0803` (test)
4. **Task 2 GREEN: candidate-specific recursive privacy boundary** — `d0ee12c` (feat)

## Files Modified

- `packages/spec/src/match-execution-contract.ts` — Added the explicit candidate source/result schemas, cross-field validator, strict projector/parser, and recursive candidate privacy assertion.
- `packages/spec/src/match-execution-contract.test.ts` — Added candidate dispatch, mutation, recursive poison, current-byte, and historical-byte coverage.

## Decisions Made

- Candidate public status uses exactly `pending`, `degraded`, or `countable`; `counted` can be true only for `countable`, so retry mechanics never leak into the DTO.
- Condition labels derive from the canonical four-condition policy and must agree with ordinal, sides, and initial initiative; web consumers need not calculate fairness semantics.
- Only `active` catalog records can appear in candidate result output. Historical aliases remain outside candidate scheduling and cannot count as diversity.
- The existing broad public-output scanner remains unchanged. The candidate result adds a narrower recursive deny-set because generic receipt, signature, and key names are legitimate elsewhere only under separately approved public schemas.

## Deviations from Plan

None. The work remained within the two declared spec contract files and did not change current selectors, service routes, persistence, replay, web behavior, runtime ownership, geometry, or gameplay.

## Issues Encountered

- ESLint does not recognize the global `structuredClone` in this package configuration. The test-only clone was replaced with a JSON round trip, after which all gates passed.

## Verification

- Focused candidate/current/historical suite: 13 tests passed.
- Full `@cowards/spec` suite: 333 tests passed, 1 existing skip.
- `pnpm --filter @cowards/spec typecheck`: passed.
- `pnpm --filter @cowards/spec build`: passed.
- `pnpm --filter @cowards/spec lint`: passed.
- `pnpm contract:check`: passed with current generated service contract unchanged.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- No dependency, database, service, secret, UI, or user setup is required.

## TDD Gate Compliance

- Task 1 RED `f25429e` failed because the explicit v1.19 result projector/parser/schema did not exist; GREEN `3957bd5` passes.
- Task 2 RED `08e0803` failed because candidate-specific recursive privacy enforcement did not exist; GREEN `d0ee12c` passes.

## Next Phase Readiness

- Plan 260-24 can render the approved condition, side, initiative, catalog, and publication labels mechanically without owning hashes or fairness derivation.
- Plans 260-14 and 260-15 can activate and audit the candidate through its explicit discriminator while current Phase-259 behavior remains unchanged until the atomic activation.
- The pre-existing protected modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- Both modified files exist, all four RED/GREEN commits are present, and no file was deleted.
- Focused/full spec, typecheck, build, lint, contract, privacy, compatibility, and protected-baseline gates pass.
- No current selector, historical schema, public service route, arena authority, gameplay rule, or protected user file changed.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
