---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "01"
subsystem: testing
tags: [kernel, compatibility, red-baseline, ast, integrity]
requires:
  - phase: 256-counted-safety-and-canonical-authority
    provides: exact semantic tuple, immutable audit baseline, and current integrity boundary monitor
provides:
  - Exact pre-refactor HEAD, tuple, source-declaration, and seven-probe identity
  - Permanent behavior-first contract for one resumable kernel and driver
  - Stable structural RED finding codes for every current execution bypass
affects: [257-08, 257-11, 257-20, kernel, replay, runtime-service]
tech-stack:
  added: []
  patterns: [marker-qualified expected RED, exact AST identifier findings, immutable source-hash evidence]
key-files:
  created:
    - .planning/artifacts/v1.37-phase-257-red-baseline.json
    - packages/engine/src/kernel/kernel-contract.test.ts
  modified:
    - scripts/check-v1-37-integrity-boundaries.ts
    - scripts/check-v1-37-integrity-boundaries.test.ts
key-decisions:
  - "The inactive future authority is tested through an explicitly candidate-branded CANDIDATE_MATCH_KERNEL seam; current runMatch remains untouched until atomic activation."
  - "Only the exact MISSING_KERNEL_AUTHORITY marker qualifies as the Wave-0 engine RED; discovery, import, compile, configuration, and timeout failures are rejected."
  - "Replay scheduling, runtime-service replay entry, contiguous Activation, and non-engine lifecycle loops have separate stable RED finding codes."
patterns-established:
  - "Expected RED: a shell gate proves a named missing-authority assertion ran and rejects infrastructure failures."
  - "Source identity: pair exact committed file hashes with TypeScript declaration hashes and the active semantic tuple."
requirements-completed: [KERN-01, KERN-02, KERN-07, KERN-11]
coverage:
  - id: D1
    description: Exact pre-refactor source, tuple, audit-baseline, and seven-probe identity is persisted without modifying protected or historical evidence.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts && pnpm v1.37:integrity-boundaries:check"
        status: pass
    human_judgment: false
  - id: D2
    description: One-step, exact resume identity, deterministic driver stream, unchanged failure state, terminal uniqueness, and privacy behavior are permanent executable contracts.
    requirement: KERN-01
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/kernel-contract.test.ts#missing-kernel-authority: one driver owns transitions (qualified expected RED)"
        status: pass
    human_judgment: false
  - id: D3
    description: Replay scheduler, runtime-service replay execution, stale contiguous Activation, and duplicate lifecycle-loop debt are independently named by exact structural fixtures.
    requirement: KERN-07
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-integrity-boundaries.test.ts#Phase 257 RED structural execution debt"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 01: Canonical Kernel RED Baseline Summary

**Exact pre-refactor authority evidence plus marker-qualified kernel and structural RED contracts now prevent the transition migration from hiding drift or bypass debt.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-13T14:33:00Z
- **Completed:** 2026-07-13T14:45:52Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Persisted deterministic HEAD, active semantic tuple, exact source/declaration hashes, immutable Phase-256 baseline hash, seven observations, and their four/two/one ownership split.
- Added a permanent behavior contract for one pure step, exact effect/resume identity, three-way failure ownership, unchanged failure state, deterministic stream, one terminal event, and private-data exclusion.
- Added AST-aware Wave-0 findings that independently expose replay scheduling, runtime-service replay-owned entry, the contiguous Activation wrapper, and non-engine lifecycle-loop duplication while ignoring near-name identifiers.

## Task Commits

Each task was committed atomically:

1. **Task 1: Persist exact pre-refactor authority and reproduction identity** - `d181628` (test)
2. **Task 2: Add permanent RED contracts for kernel authority and bypass removal** - `e8a3840` (test)

## Files Created/Modified

- `.planning/artifacts/v1.37-phase-257-red-baseline.json` - Exact pre-refactor identity and compatibility classification.
- `packages/engine/src/kernel/kernel-contract.test.ts` - Candidate kernel/driver behavioral contract with one qualified missing-authority RED.
- `scripts/check-v1-37-integrity-boundaries.ts` - Stable Phase-257 structural RED analyzer mode.
- `scripts/check-v1-37-integrity-boundaries.test.ts` - Current-source and synthetic exact-identifier structural fixtures.

## Decisions Made

- The Wave-0 contract expects a candidate-branded `CANDIDATE_MATCH_KERNEL` object exposing `createMachine`, `stepMatch`, and `runMatch`; this keeps the future authority testable without replacing the current pointer before Plan 257-19.
- Effect requests and resumes bind request identity, effect kind, semantic tuple, and lifecycle coordinates; mismatched, wrong-kind, duplicate, stale, and system-failure responses must preserve the incoming machine.
- The expected RED is a successful verification outcome only when the exact named test reaches `[EXPECTED_RED:MISSING_KERNEL_AUTHORITY]` and no infrastructure-failure signature appears.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All seven audit observations remained exact, including the two later-phase defects and successful-push history `RIGHT`; no KERN-11 approval trigger occurred.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 257-08 can turn the marker-qualified RED green through the candidate seam without changing the active Match pointer.
- Plan 257-11 can replace Wave-0 structural classification with the complete executable-reference ownership inventory.
- The protected `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain byte-identical to their pre-plan hashes.

## Self-Check: PASSED

- All four delivered files and this summary exist.
- Task commits `d181628` and `e8a3840` are present.
- Coverage metadata classifies all three deliverables as automatically proven.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
