---
phase: 256-counted-safety-and-canonical-authority
plan: "03"
subsystem: execution-integrity-contracts
tags: [semantic-tuple, runtime-evidence, match-evidence, replay, privacy, tdd]
requires:
  - phase: 256-01
    provides: immutable canonical tuple registry and exact resolver
  - phase: 256-02
    provides: exact executable lane identity, certificate references, and evidence decisions
provides:
  - strict runtime request envelope carrying one semantic tuple and ordered bottom/top evidence references
  - exact persisted Match execution evidence with privacy-safe public projection
  - atomic current replay tuple validation with immutable historical v1.4 dispatch
affects: [persistence, runtime-service, go-backend, chronicle, phase-256-authority-bundle]
tech-stack:
  added: []
  patterns: [atomic tuple resolution, ordered per-entrant evidence, explicit historical dispatch, allowlisted public projection]
key-files:
  created: []
  modified:
    - packages/spec/src/runtime-execution-service.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts
    - packages/spec/src/match-execution-contract.ts
    - packages/spec/src/match-execution-contract.test.ts
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts
key-decisions:
  - "One semantic compatibility tuple is Match-wide, while executable lane and certificate identity remains ordered and per entrant."
  - "Current replay requires an exact registered tuple; tuple-less v1.4 Chronicles route explicitly through original semantics and remain unresolved rather than being backfilled."
  - "Public Match integrity evidence is constructed as an allowlist of tuple, status, freshness, and certificate hashes; exact lane, toolchain, artifact, build, and certificate IDs remain internal."
patterns-established:
  - "Execution identity: compatibility tuple, authority bundle hash/generation, and bottom/top evidence travel as one strict snapshot."
  - "History routing: current-exact and historical-v1.4 are explicit profiles; validation never infers a current tuple from legacy fields."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: "Runtime requests atomically validate one registered tuple and exact ordered per-entrant execution evidence"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "packages/spec/src/spec.test.ts#RuntimeExecutionServiceRequestSchema atomically validates execution evidence identity"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Match evidence preserves exact tuple and heterogeneous bottom/top identity while exposing only safe public fields"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "packages/spec/src/match-execution-contract.test.ts#persists one exact compatibility tuple and ordered heterogeneous entrant evidence pair"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec test"
        status: pass
    human_judgment: false
  - id: D3
    description: "Replay rejects missing or mixed current tuples and preserves explicit byte-immutable historical v1.4 dispatch"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#atomically validates current tuples while preserving explicit historical dispatch"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/replay test"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 03: Atomic Execution and Replay Identity Summary

**Runtime requests, persisted Match evidence, and current replay now share one exact semantic tuple while retaining ordered bottom/top executable proof and immutable v1.4 history.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-13T02:28:16Z
- **Completed:** 2026-07-13T02:39:16Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added strict runtime request contracts for one registered six-field tuple, authority bundle identity, and heterogeneous bottom/top lane, certificate, revision, scheduling, evaluation, and freshness evidence.
- Added exact Match evidence construction, side-order enforcement, version-routed historical parsing, and an allowlisted public projection that excludes restricted executable identity.
- Added explicit current replay validation through the canonical tuple resolver while preserving tuple-less v1.4 Chronicles as byte-immutable original-semantics evidence.

## Task Commits

Each TDD task was committed through RED and GREEN:

1. **Task 1 RED: execution evidence identity cases** - `65685af` (test)
2. **Task 1 GREEN: strict runtime execution identity** - `1550f0a` (feat)
3. **Task 2 RED: exact Match evidence cases** - `f437ec0` (test)
4. **Task 2 GREEN: ordered persisted Match evidence** - `26cd026` (feat)
5. **Task 3 RED: replay tuple dispatch cases** - `330c7ff` (test)
6. **Task 3 GREEN: atomic replay compatibility dispatch** - `42dafaa` (feat)

## Files Created/Modified

- `packages/spec/src/runtime-execution-service.ts` - Shared compatibility, authority, entrant-pair, scheduling, freshness, and evidence-drift contracts.
- `packages/spec/src/schemas.ts` - Strict atomic tuple, lane, certificate, decision, snapshot, and request validation.
- `packages/spec/src/spec.test.ts` - Complete, heterogeneous, partial, mixed, alias, revision-binding, and system-failure cases.
- `packages/spec/src/match-execution-contract.ts` - Exact Match evidence, safe projection, and explicit historical/current routing.
- `packages/spec/src/match-execution-contract.test.ts` - Heterogeneous side order, privacy, and immutable historical evidence proof.
- `packages/replay/src/validate.ts` - Canonical tuple resolution for current replay plus explicit v1.4 dispatch.
- `packages/replay/src/validate.test.ts` - Current exact/mixed/missing tuple and historical byte-immutability regressions.

## Decisions Made

- Kept the singular semantic tuple separate from the ordered executable identity pair, so language/toolchain/artifact differences do not fabricate gameplay versions.
- Included authority bundle hash and registry generation now as reference identity; Plan 256-17 can refine this to the signed reference-only bundle without changing the singular-tuple/per-entrant shape.
- Kept exact executable identity internal and projected only stable public-safe tuple, decision, freshness, and evidence hash fields.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The three RED commits failed on the absent request, Match-evidence, and replay APIs as intended. All corresponding GREEN commits and package suites now pass.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm --filter @cowards/spec exec vitest run src/spec.test.ts src/match-execution-contract.test.ts -t "execution|compatibility|evidence"` - 15/15 selected tests passed.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/spec test` - 72/72 passed.
- `pnpm --filter @cowards/replay exec vitest run src/validate.test.ts` - 22/22 passed.
- `pnpm --filter @cowards/replay test` - 127/127 passed.
- `pnpm --filter @cowards/replay typecheck` - passed.

## Next Phase Readiness

- Plans 256-04/05 can persist the exact tuple and ordered entrant pair without inventing a Match-wide executable lane.
- Plans 256-09/11/17 can migrate runtime-service and Go builders to the reference-only signed authority identity and recheck it around execution.
- No gameplay state, Action legality, event order, outcome, Strategy observation, or historical Chronicle bytes changed.

## Self-Check: PASSED

- All seven modified source/test files exist and all six RED/GREEN commits are present in order.
- Focused and full spec/replay suites plus both package typechecks pass.
- Public projection tests exclude lane/toolchain/artifact/build/certificate identifiers and private Strategy data.
- The dirty consolidated spec, `.planning/config.json`, and generated Next files were not staged or modified by this plan.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
