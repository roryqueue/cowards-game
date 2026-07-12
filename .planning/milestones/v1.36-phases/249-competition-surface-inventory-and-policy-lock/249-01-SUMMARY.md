---
phase: 249-competition-surface-inventory-and-policy-lock
plan: 01
subsystem: spec
tags: [competition-policy, public-privacy, vitest, tdd]

requires:
  - phase: v1.35
    provides: provider-proof, runtime-boundary, package-policy, and privacy baseline constraints consumed by v1.36 competition policy
provides:
  - Spec-owned competition-policy-v1.36 posture contract
  - Public counted-state projection vocabulary without persistence mappings
  - Privacy exclusions, forbidden claim taxonomy, authority owner labels, and leak-safe public payload assertion
affects: [phase-249, phase-250, phase-251, phase-252, phase-253, phase-254, phase-255]

tech-stack:
  added: []
  patterns: [spec-owned literal policy contract, public-output leak guard wrapper, TDD red-green contract tests]

key-files:
  created:
    - packages/spec/src/competition-policy-v1-36.ts
  modified:
    - packages/spec/src/index.ts
    - packages/spec/src/spec.test.ts

key-decisions:
  - "Kept counted-state work to public projection vocabulary only; Phase 252 owns final persistence enum mappings."
  - "Kept v1.36 policy in @cowards/spec with no entry, Season, standings, governance, UI, runtime, or database behavior."
  - "Wrapped the existing public-output leak guard with competition-specific forbidden public field checks for dispute, recovery, raw diagnostic, and governance internals."

patterns-established:
  - "Versioned competition policy constants are exported from a focused spec module and the package barrel."
  - "Public payloads for competition policy must pass assertCompetitionPolicyV136PublicLeakSafe before downstream use."

requirements-completed: [POST-01, POST-02, POST-03]

duration: 4min
completed: 2026-06-15
---

# Phase 249 Plan 01: Competition Policy Contract Summary

**Spec-owned `competition-policy-v1.36` contract with exact public beta posture, reset/no-durable labels, public counted-state vocabulary, privacy exclusions, owner labels, and forbidden claim categories.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-15T23:11:49Z
- **Completed:** 2026-06-15T23:15:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added RED contract tests for the exact `competition-policy-v1.36` ID, `public beta trial competition` posture, resettable Season-scoped standings, and no durable permanent rating promise.
- Implemented the focused spec module with trust surfaces, counted-state public projections, privacy exclusions, forbidden claim categories/examples, authority owners, and a public leak-safe assertion.
- Exported the policy module from `@cowards/spec` without adding downstream Phase 250-255 behavior.

## Task Commits

1. **Task 1: Add failing contract tests for competition-policy-v1.36** - `8bbdab9` (test)
2. **Task 2: Implement and export the spec-owned policy contract** - `7b3809a` (feat)

## Files Created/Modified

- `packages/spec/src/competition-policy-v1-36.ts` - New v1.36 policy contract constants, types, public payload, privacy exclusions, forbidden claims, authority owners, and leak guard.
- `packages/spec/src/index.ts` - Barrel export for `competition-policy-v1-36.js`.
- `packages/spec/src/spec.test.ts` - Focused TDD contract and privacy tests for POST-01, POST-02, POST-03, D-02, D-11, and D-12.
- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-01-SUMMARY.md` - Plan completion record.

## Decisions Made

- Counted states are labels and standing-effect copy only in this plan; no storage enum, migration, classifier, or persistence mapping was introduced.
- The policy contract uses literal arrays and objects rather than schemas because this phase locks public vocabulary and downstream import targets.
- `assertCompetitionPolicyV136PublicLeakSafe` delegates to `assertPublicOutputLeakSafe` and adds competition-specific key checks for surfaces not yet represented in the generic guard.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope changes.

## Issues Encountered

None. The RED gate failed as expected before Task 2 because `./competition-policy-v1-36.js` did not exist, then the same focused Vitest command passed after implementation.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm exec vitest run packages/spec/src/spec.test.ts` - passed, 44 tests.
- Acceptance greps for exact posture, reset/no-durable labels, trust surfaces, counted-state vocabulary, D-11 guardrail, forbidden claim categories, privacy exclusions, and barrel export - passed.
- Forbidden API guard for `fetch`, `Date.now`, `Math.random`, and `node:vm/fs/net/http/https/child_process` imports in the policy module - passed.

## Known Stubs

None. Stub scan found only the intentional `node === null` guard in the recursive privacy traversal.

## Threat Flags

None. The new spec contract and public leak-safe assertion are the planned mitigations for T-249-01 through T-249-04 and introduce no unplanned network, auth, filesystem, database, or runtime execution surface.

## TDD Gate Compliance

- RED commit present: `8bbdab9`
- GREEN commit present after RED: `7b3809a`
- REFACTOR commit: not needed

## Self-Check: PASSED

- Found created/modified files: `packages/spec/src/competition-policy-v1-36.ts`, `packages/spec/src/index.ts`, `packages/spec/src/spec.test.ts`, and this summary.
- Found task commits: `8bbdab9` and `7b3809a`.
- Re-ran `pnpm exec vitest run packages/spec/src/spec.test.ts`: passed, 44 tests.

## Next Phase Readiness

Plans 249-02 and 249-03 can consume the exported policy contract for inventory artifacts and copy/privacy monitors. The contract intentionally does not implement entry enforcement, Season lifecycle transitions, standings recompute, governance workflow, public page redesign, service-backed proof, Strategy execution, or Node `vm`.

---
*Phase: 249-competition-surface-inventory-and-policy-lock*
*Completed: 2026-06-15*
