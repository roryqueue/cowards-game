---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "01"
subsystem: spec-semantic-authorities
tags: [strategy-abi, arena-catalog, semantic-hash, set-fairness, deterministic-validation]

requires:
  - phase: 259-cross-language-runtime-conformance
    provides: Exact Phase 259 conformance tuple and released v1.17/v1.18 runtime behavior
provides:
  - Inactive successor Strategy observation ABI candidate with truthful initiative and SoldierBrain advancement fields
  - Canonical v1.37 arena authority with semantic geometry identities and historical alias handling
  - Canonical four-condition Set policy with stable identities, strict completeness, and retry semantics
affects: [260-02, phase-260-strategy-consumers, phase-260-arena-consumers, phase-260-set-execution]

tech-stack:
  added: []
  patterns: [inactive-candidate-authority, domain-framed-semantic-identity, strict-closed-world-validation]

key-files:
  created:
    - packages/spec/src/strategy-observation-abi-v1-19.ts
    - packages/spec/src/strategy-observation-abi-v1-19.test.ts
    - packages/spec/src/arena-catalog-v1-37.ts
    - packages/spec/src/arena-catalog-v1-37.test.ts
    - packages/spec/src/set-condition-policy-v1-37.ts
    - packages/spec/src/set-condition-policy-v1-37.test.ts
  modified: []

key-decisions:
  - "Freeze all three authorities as inactive candidates; this plan does not activate consumers or alter released Phase 259 behavior."
  - "Use successor ABI version v1.19 because v1.18 already identifies the released supervisor invocation contract."
  - "Define arena identity from semantic geometry only, excluding display labels, aliases, and non-arena-owned setup."
  - "Represent Set fairness as four explicit conditions with stable identities rather than seed-suffix conventions."

patterns-established:
  - "Candidate authority: new semantic contracts remain inactive until downstream adapters and conformance evidence explicitly activate them."
  - "Closed-world membership: validators reject omissions, duplicates, substitutions, and noncanonical semantic claims while accepting insertion-order permutations where order is not semantic."

requirements-completed: [STRAT-01, STRAT-02, SET-01, SET-02, SET-03, SET-05]

coverage:
  - id: D1
    description: "Inactive successor Strategy observation ABI truthfully models initial initiative, current-round initiative, and SoldierBrain advancement without changing action semantics."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages/spec/src/strategy-observation-abi-v1-19.test.ts packages/spec/src/runtime-abi-v1-17.test.ts packages/spec/src/runtime-invocation-v1-18.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Canonical v1.37 arena authority freezes Smoke and Standard Cross, preserves Open Field as a historical alias, and derives identities from semantic geometry."
    requirement: SET-01
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages/spec/src/arena-catalog-v1-37.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Canonical four-condition Set policy covers both arena assignments and both initial-initiative assignments with stable identities, exact completeness, and terminal/retry rules."
    requirement: SET-02
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages/spec/src/set-condition-policy-v1-37.test.ts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 01: Immutable Semantic Authorities Summary

**Three inactive, strictly validated authorities now define truthful Strategy observations, canonical arena identity, and exact four-condition Set fairness without changing released runtime behavior.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-17T01:21:52Z
- **Completed:** 2026-07-17T01:36:45Z
- **Tasks:** 3
- **Files modified:** 6 created, 0 existing source files modified

## Accomplishments

- Defined a closed successor observation ABI with absolute and relative initiative facts plus per-activation advancement truth, while keeping HOLD/action/Advance semantics outside the observation contract.
- Froze the official v1.37 arena catalog and domain-framed semantic geometry identities, including the non-schedulable Open Field historical alias.
- Defined four explicit Set conditions, stable scenario/condition/request identities, exact membership validation, and completion/retry classification independent of completion order.

These are candidate authorities only. This plan does not activate the new ABI, migrate execution consumers, or claim phase-level end-to-end conformance; downstream Phase 260 plans must perform and prove those steps.

## Task Commits

Each TDD task was committed as an atomic RED/GREEN pair:

1. **Task 1: Close the observation ABI** - `a677127` (RED test), `685c741` (GREEN feat)
2. **Task 2: Freeze canonical arena authority** - `7d5ac7b` (RED test), `3e056fd` (GREEN feat)
3. **Task 3: Define four-condition Set policy** - `e534387` (RED test), `6893290` (GREEN feat)

## Files Created/Modified

- `packages/spec/src/strategy-observation-abi-v1-19.ts` - Inactive successor observation authority, metadata, and field-safe contextual validation.
- `packages/spec/src/strategy-observation-abi-v1-19.test.ts` - Closed-shape, consistency, ownership-boundary, and Phase 259 preservation tests.
- `packages/spec/src/arena-catalog-v1-37.ts` - Canonical arena catalog, semantic geometry preimage, hash, alias, and catalog validation.
- `packages/spec/src/arena-catalog-v1-37.test.ts` - Bounds, terrain, alias, identity, duplicate, mutation, and closed-world tests.
- `packages/spec/src/set-condition-policy-v1-37.ts` - Four-condition policy, stable identities, completeness validation, and completion/retry evaluation.
- `packages/spec/src/set-condition-policy-v1-37.test.ts` - Coverage, permutation, rejection, shared-seed, identity, and terminality tests.

## Decisions Made

- Kept every authority inactive so Phase 259's released runtime tuple and behavior remain historical facts rather than silently reinterpreted contracts.
- Selected `strategy-runtime-abi-v1.19` for the successor observation ABI because v1.18 is already assigned to the released supervisor invocation contract.
- Limited arena hash preimages to versioned semantic geometry: bounds, Y/X-sorted terrain, and empty arena-owned setup. Human labels, schedulability, and aliases do not alter geometry identity.
- Made all four Set conditions explicit and stable. A common base seed is data, not an encoded condition selector, and retries retain the exact request identity.
- Preserved requirement IDs in summary traceability while leaving phase-level completion to downstream activation and conformance plans.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- Plan-required combined Vitest command: 5 files, 86 tests passed.
- Full `packages/spec/src` Vitest selection: 18 files, 326 tests passed, 1 skipped.
- `pnpm --filter @cowards/spec typecheck`: passed.
- ESLint on all six created files: passed.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Source-boundary diff checks confirmed no changes to released runtime v1.17/v1.18 authorities, shared schema/type sources, map config, persistence presets, competition persistence, or the Go live backend.
- No placeholder/stub implementation or new trust-boundary surface was introduced.

## Next Phase Readiness

- Plan 260-02 can consume the frozen authorities without guessing field names, arena membership, identity rules, or Set condition semantics.
- Activation, adapter propagation, persistence/export changes, cross-language parity, and end-to-end evidence remain deliberately pending.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All six declared source/test files exist and are committed.
- All three tasks have RED/GREEN commits.
- Required tests, typecheck, lint, protected-baseline, and boundary checks pass.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
