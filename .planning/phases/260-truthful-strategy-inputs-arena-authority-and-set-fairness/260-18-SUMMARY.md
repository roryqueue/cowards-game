---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "18"
subsystem: workshop-sdk-contracts
tags: [workshop, sdk, runtime-v1.19, candidate-pin, four-language]

requires:
  - phase: 260-10
    provides: Exact signed v1.19 observation transport through all four provider lanes
  - phase: 260-17
    provides: Explicit v1.19 public observation schemas with Phase-259 current aliases
provides:
  - Package-free TypeScript, Python, Rust, and Zig v1.19 Workshop/SDK candidate examples
  - Immutable exact source and observation-semantics candidate pin
  - Generated Phase-259 Workshop default selector with exact example source roots
  - Exact version-pair dispatch that cannot select v1.19 through an unversioned path
affects: [260-13, 260-14, 260-19, 260-21, Workshop, SDK]

tech-stack:
  added: []
  patterns: [inactive-candidate-pin, generated-current-selector, exact-version-pair-dispatch]

key-files:
  created:
    - packages/persistence/src/workshop-contract-v1-19-candidate.ts
    - packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts
    - packages/persistence/src/workshop-contract-v1-19-candidate.test.ts
    - packages/persistence/src/current-workshop-contract-generated.ts
  modified:
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts

key-decisions:
  - "Address the Workshop contract by an exact workshop-contract/runtime-ABI version pair; no single field or fallback may select the candidate."
  - "Bind the current Phase-259 Workshop defaults to exact per-language source roots until Plan 14 regenerates the compact selector."
  - "Teach each candidate example to consume kernel-owned observations without adding HOLD, deriving facts, or storing scheduler truth in StrategyMemory or SoldierMemory."

patterns-established:
  - "Workshop candidate pin: exact source roots and canonical observation-semantics root are verified before examples are returned."
  - "Workshop dispatch: omitted selection and exact v1.17 selection are current; only the complete v1.19 pair reaches the inactive candidate."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]

coverage:
  - id: D1
    description: "Four package-free Workshop/SDK examples consume initial/current initiative and pre-Action slot Advance truth under one immutable inactive v1.19 pin."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/workshop-contract-v1-19-candidate.test.ts#passes existing hostile-source validation and real compiler gates"
        status: pass
      - kind: unit
        ref: "packages/persistence/src/workshop-contract-v1-19-candidate.test.ts#binds the exact four sources and observation semantics in one pin"
        status: pass
    human_judgment: false
  - id: D2
    description: "Unversioned and explicit-current Workshop paths preserve exact Phase-259 sources while only an exact v1.19 pair returns candidate examples."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "packages/persistence/src/workshop.test.ts#keeps every unversioned Workshop and SDK example on Phase 259"
        status: pass
      - kind: unit
        ref: "packages/persistence/src/workshop.test.ts#rejects premature or mixed Workshop contract selection"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/persistence typecheck"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 18: Versioned Workshop and SDK Candidate Summary

**Exact four-language v1.19 authoring examples are now pinned and explicitly addressable while every default Workshop path remains byte-bound to Phase 259.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-17T06:47:19Z
- **Completed:** 2026-07-17T07:01:11Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 6

## Accomplishments

- Added package-free TypeScript, Python, Rust, and Zig candidate examples that consume all four initiative facts and the pre-Action `hasAdvancedThisActivation` fact without introducing gameplay authority, HOLD, or memory-derived scheduler state.
- Bound the exact sources and canonical observation semantics in one deeply frozen inactive-candidate pin, with mutation rejection for source, semantics, ABI identity, and activation state.
- Added an exact selector-backed Workshop/SDK dispatch: omitted or v1.17 selection returns the existing Phase-259 sources and validation behavior, while only the complete v1.19 version pair returns the candidate.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: candidate example and pin contract** - `c1fb261` (test)
2. **Task 1 GREEN: four-language examples and exact pin** - `d430a6a` (feat)
3. **Task 2 RED: current/default and mixed-selector gates** - `16ee4f9` (test)
4. **Task 2 GREEN: generated current selector and dispatch** - `1289bfb` (feat)

## Files Created/Modified

- `packages/persistence/src/workshop-contract-v1-19-candidate.ts` - Four candidate example sources plus locked observation-only lifecycle and semantics.
- `packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts` - Exact source, example-set, and semantic roots with fail-closed verification.
- `packages/persistence/src/workshop-contract-v1-19-candidate.test.ts` - Source-policy, TypeScript/Python validation, real Rust/Zig compilation, pin, and mutation proof.
- `packages/persistence/src/current-workshop-contract-generated.ts` - Compact generated Phase-259 default selector and exact source roots reserved for Plan-14 activation.
- `packages/persistence/src/workshop.ts` - Exact current/candidate Workshop contract dispatch without changing existing template or sample bytes.
- `packages/persistence/src/workshop.test.ts` - Phase-259 byte/default preservation and premature/mixed-selection rejection.

## Decisions Made

- Workshop candidate selection requires both `workshop-contract-v1.19` and `strategy-runtime-abi-v1.19`; partial, mixed, extra-key, and activation-flag selectors fail closed.
- Current source roots are checked when default examples are requested, preventing an authoring-surface edit from drifting independently of the generated current pin.
- Rust and Zig examples use the established stdin/stdout WASI envelope and package-none constraints; TypeScript and Python remain provider-wrapped source examples.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The shared wave had other executors committing unrelated phase files concurrently. All staging used exact file allowlists, and plan-local tests were rerun serially to avoid compiler contention.

## User Setup Required

None - no dependency, service, database, secret, or environment configuration is required.

## Automated Evidence

- Candidate contract suite: 5/5 tests passed, including real Rust and Zig WASM/WASI compilation.
- Workshop selector-focused suite: 6/6 tests passed; 24 unrelated Workshop tests were intentionally filtered in the focused run.
- Persistence TypeScript build/typecheck passed.
- ESLint passed for all six plan files.
- Protected working-tree baseline remains exact at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- Task 1 RED `c1fb261` failed because the candidate and pin modules did not exist; GREEN `d430a6a` passes source-policy, validation, compiler, root, and mutation gates.
- Task 2 RED `16ee4f9` failed because Workshop had no selector-backed contract API; GREEN `1289bfb` passes exact-current, explicit-candidate, mixed-version, and premature-activation gates.

## Next Phase Readiness

- Plan 13 can bind certificates to the exact Workshop candidate version and root.
- Plans 19 and 21 can inventory and prove the exact four example sources without treating them as current.
- Plan 14 remains the sole owner of regenerating the current Workshop selector; no existing template, sample, runtime selector, public default, or Strategy execution boundary changed.

## Self-Check: PASSED

- All six implementation/test files exist and all four RED/GREEN commits are present.
- Candidate validation/compilation, exact-pin mutation tests, current-default snapshots, mixed-version rejection, typecheck, lint, and protected-baseline checks pass.
- No unexpected deletion, untracked plan output, current selector change, gameplay change, public-private leak, or protected-file mutation was introduced.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
