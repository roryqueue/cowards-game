---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "16"
subsystem: go-authority-generation
tags: [go, code-generation, arena-catalog, set-policy, semantic-authority]

requires:
  - phase: 260-01
    provides: Frozen candidate arena catalog and four-condition Set-policy authorities
  - phase: 260-02
    provides: Explicit runtime-v1.19 candidate tuple and exact Phase-259 current selector
provides:
  - Sole deterministic TypeScript writer/checker for the candidate Go arena and Set authority
  - Data-only explicit runtime-v1.19 Go projection with exact arena and four-condition records
  - Generated Go current selector that remains byte-pinned to the complete Phase-259 authority
affects: [260-06, 260-14, 260-15, go-scheduling, semantic-authority-activation]

tech-stack:
  added: []
  patterns: [sole-writer-generated-authority, byte-exact-check-mode, explicit-candidate-lookup]

key-files:
  created:
    - scripts/generate-v1-37-arena-set-authority.ts
    - scripts/generate-v1-37-arena-set-authority.test.ts
    - apps/go-backend/arena_set_authority_v1_37_generated.go
    - apps/go-backend/arena_set_authority_v1_37_generated_test.go
    - apps/go-backend/current_semantic_authority_generated.go
  modified: []

key-decisions:
  - "Expose the v1.19 Go catalog and Set-policy records only through an exact candidate-key lookup; generic and Phase-259 keys cannot reach them."
  - "Generate the current Go selector from the complete Phase-259 TypeScript selection and leave it unreferenced by production scheduling until Plan 260-14."
  - "Keep both generated production Go files import-free and data-only; they own no geometry hashing, fairness derivation, gameplay, Chronicle construction, persistence, or Strategy execution."

patterns-established:
  - "Exact source closure: reordered, substituted, seed-semantic, stale-tuple, and preactivation-current inputs fail before any Go bytes are rendered."
  - "Generated isolation: each explicit candidate lookup constructs fresh slice data so callers cannot mutate shared authority state."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "One deterministic TypeScript generator owns all candidate/current Go bytes and check mode compares every committed byte."
    requirement: SET-01
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-arena-set-authority.test.ts#v1.37 arena and Set Go authority generator"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/generate-v1-37-arena-set-authority.ts --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "Go exposes the exact inactive runtime-v1.19 catalog/policy records while its generated current selector remains the complete Phase-259 selection."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "apps/go-backend/arena_set_authority_v1_37_generated_test.go#TestArenaSetAuthorityV137CandidateProjection"
        status: pass
      - kind: unit
        ref: "apps/go-backend/arena_set_authority_v1_37_generated_test.go#TestArenaSetAuthorityV137LookupIsExplicitAndCurrentRemainsPhase259"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm go:parity"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 16: Candidate Go Arena/Set Authority Generation Summary

**Go now has an exact, data-only runtime-v1.19 arena/Set candidate projection while its generated current selector remains the complete Phase-259 runtime-v1.17 authority.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-17T02:46:28Z
- **Completed:** 2026-07-17T02:54:33Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 5

## Accomplishments

- Added the sole deterministic TypeScript-to-Go writer with strict `--write` and byte-exact `--check` modes across all three generated outputs.
- Projected the exact Smoke, Standard Cross, and Open Field alias records plus the four canonical D-13 through D-16 condition/policy records behind explicit `runtime-v1.19` lookup only.
- Generated a separate current selector that stays exactly on runtime-v1.17, the Phase-259 tuple, arena catalog, Set policy, and conformance-certificate family.
- Proved the production Go projection is import-free, data-only, mutation-isolated, and absent from every selected scheduling/current production consumer.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: sole generator contract** - `23c43fa` (test)
2. **Task 1 GREEN: deterministic writer/checker** - `de06590` (feat)
3. **Task 2 RED: generated Go authority behavior** - `5cc8c37` (test)
4. **Task 2 GREEN: candidate and current Go projections** - `fe48cd1` (feat)

## Files Created/Modified

- `scripts/generate-v1-37-arena-set-authority.ts` - Sole closed-world authority reader, renderer, writer, and byte-exact checker.
- `scripts/generate-v1-37-arena-set-authority.test.ts` - Mutation, determinism, source-closure, CLI, and per-output stale-byte tests.
- `apps/go-backend/arena_set_authority_v1_37_generated.go` - Import-free candidate tuple, catalog, policy, condition rows, and explicit candidate lookup.
- `apps/go-backend/arena_set_authority_v1_37_generated_test.go` - Generated Go membership, alias, policy, digest, data-only, mutation-isolation, and inactivity proof.
- `apps/go-backend/current_semantic_authority_generated.go` - Generated complete Phase-259 current selection; no production scheduling consumer is wired.

## Decisions Made

- Candidate lookup accepts only `runtime-v1.19`; empty, Phase-259, v1.18, and unknown future keys fail closed.
- Source digest `sha256:d1ec091831cb7f32d7dcb92eda3a0a91d77c1e694d3891c240ae15e950b9caf7` binds the exact TypeScript candidate/current source closure, and output digest `sha256:f33c173bceb3b6c5e26ba6cc4cbf8370201f9c3e93ebfc29abcb8669f4ae5d7d` binds its generated projection payload.
- Plan 260-14 remains the sole activation owner. This plan adds no scheduling reference and changes no selected Go behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no new dependency, environment variable, secret, database state, or external service is required.

## Verification

- `pnpm exec vitest run scripts/generate-v1-37-arena-set-authority.test.ts`: 1 file, 4 tests passed.
- `pnpm exec tsx scripts/generate-v1-37-arena-set-authority.ts --check`: all three committed outputs matched every byte.
- `PATH=/usr/local/go/bin:$PATH go test ./... -run 'ArenaSetAuthority'`: passed.
- Full Go suite with the existing PostgreSQL URLs: passed in 17.854 seconds.
- `pnpm go:parity` with the existing PostgreSQL URLs: immutable v1.16 fixture parity and complete Go tests passed.
- ESLint on both generator TypeScript files: passed.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Protected working files retained their starting SHA-256 values: `.planning/config.json` `a9502647...953f7b` and `CowardsGameSpec_Full_Consolidated_v1.md` `01b0a95c...fa46`.
- Stub scan: no TODO, FIXME, placeholder, coming-soon, or unavailable implementation markers.

## TDD Gate Compliance

- Task 1 RED `23c43fa` failed because the sole generator module did not exist; GREEN `de06590` passes its exact Vitest contract.
- Task 2 RED `5cc8c37` failed because the explicit candidate lookup and current projection did not exist; GREEN `fe48cd1` passes generated Go and full parity gates.

## Next Phase Readiness

- Plan 260-06 can consume the exact candidate data for an inactive Go four-condition scheduler without re-deriving arena or fairness semantics.
- Plan 260-14 can atomically regenerate the current selector only after complete preactivation proof.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched, unstaged, and uncommitted.

## Self-Check: PASSED

- All five planned files exist and all four TDD commits are present in history.
- Every focused, full-Go, parity, lint, source/output digest, data-only boundary, current-selector, and protected-baseline check passes.
- No unexpected deletion, untracked generated output, production scheduling reference, or new network/auth/file/database trust surface was introduced.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
