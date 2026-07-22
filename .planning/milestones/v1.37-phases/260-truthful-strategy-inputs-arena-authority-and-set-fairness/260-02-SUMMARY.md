---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "02"
subsystem: spec-semantic-authority
tags: [semantic-tuple, inactive-candidate, generated-selector, compatibility]

requires:
  - phase: 260-01
    provides: Inactive v1.19 observation ABI, canonical arena catalog, and four-condition Set policy
provides:
  - Exact inactive six-component runtime-v1.19 semantic tuple
  - Compact one-key TypeScript activation source pinned to Phase 259
  - Generated complete Phase-259 current projection with deterministic source and output roots
affects: [260-03, 260-04, 260-10, 260-14, 260-16, 260-17]

tech-stack:
  added: []
  patterns: [explicit-candidate-lookup, one-key-atomic-selection, generated-staleness-guard]

key-files:
  created:
    - packages/spec/src/current-semantic-authority-source.ts
    - packages/spec/src/current-semantic-authority-generated.ts
  modified:
    - packages/spec/src/versions.ts
    - packages/spec/src/integrity-authority.ts
    - packages/spec/src/integrity-authority.test.ts

key-decisions:
  - "Keep runtime-v1.19 outside both current and generally registered tuple collections; only its exact candidate resolver may reach it before activation."
  - "Use one semanticAuthorityKey as the sole TypeScript activation source so ABI, arena, Set-policy, tuple, and certificate members cannot be selected independently."
  - "Pin deterministic hashes of the compact source record and complete generated projection while retaining an eager stale-projection guard against every Phase-259 pointer."

patterns-established:
  - "Inactive candidate lookup: a successor record can be addressed exactly without entering any current or general registered resolver."
  - "Atomic selector projection: one compact key expands to a closed frozen record and rejects all partial or mixed member objects."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, SET-01, SET-02, SET-03, SET-05]

coverage:
  - id: D1
    description: "The complete runtime-v1.19 tuple is available only through exact explicit candidate lookup and rejects mixed, missing, relabeled, v1.18, and Phase-259 reuse selectors."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "packages/spec/src/integrity-authority.test.ts#registers runtime-v1.19 only as an exact inactive six-component candidate"
        status: pass
      - kind: unit
        ref: "packages/spec/src/integrity-authority.test.ts#rejects every mixed incomplete relabeled and old-certificate candidate selector"
        status: pass
    human_judgment: false
  - id: D2
    description: "The compact TypeScript source remains runtime-v1.17 and deterministically projects the complete Phase-259 tuple, ABI, arena, Set-policy, and conformance-certificate selection."
    requirement: SET-01
    verification:
      - kind: unit
        ref: "packages/spec/src/integrity-authority.test.ts#stages one compact Phase-259-valued source and generated projection"
        status: pass
      - kind: unit
        ref: "packages/spec/src/integrity-authority.test.ts#pins deterministic source and projection roots"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every Phase-259 current selector, released v1.18 supervisor contract, v1.14 history, active corpus/trace pin, and protected user baseline remains exact."
    requirement: SET-05
    verification:
      - kind: integration
        ref: "pnpm exec vitest run packages/spec/src/integrity-authority.test.ts packages/spec/src/runtime-invocation-v1-18.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 02: Inactive Successor Tuple and Compact Selector Summary

**An exact runtime-v1.19 candidate now coexists with a frozen, hash-pinned Phase-259 TypeScript selector without activating or relabeling any released behavior.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-17T01:47:54Z
- **Completed:** 2026-07-17T01:57:52Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 5

## Accomplishments

- Registered the closed six-component successor tuple with v1.19 observation ABI, current kernel/Chronicle identities, canonical arena catalog v1.37, and four-condition Set policy v1.37 behind one explicit candidate-only resolver.
- Added the sole compact TypeScript activation source as `{ semanticAuthorityKey: "runtime-v1.17" }` and a frozen generated projection of the complete Phase-259 authority, including its conformance-certificate family.
- Pinned source root `sha256:14296beaf5e79d731dba3de3501dde7239731ce51b0c926bced3d76f5eff29e1` and output root `sha256:bb814addab77fd473103651eb9aac2980ed45770d5147fb54de1f703143b2ce0`, with fail-closed stale and partial-selection checks.
- Preserved the current tuple ID `sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe`, runtime ABI v1.17, supervisor invocation v1.18 behavior, v1.14 history, active corpus/trace registries, and current certificate behavior.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1: Register the closed inactive runtime-v1.19 candidate tuple** - `de03832` (RED test), `eda855a` (GREEN feat)
2. **Task 2: Stage the Phase-259-valued compact TypeScript selector** - `3d70355` (RED test), `fe1081f` (GREEN feat)

## Files Created/Modified

- `packages/spec/src/current-semantic-authority-source.ts` - Sole compact one-key activation source, still pinned to runtime-v1.17.
- `packages/spec/src/current-semantic-authority-generated.ts` - Frozen complete Phase-259 projection, deterministic roots, current aliases, and exact selector resolver.
- `packages/spec/src/versions.ts` - Candidate-only v1.19 ABI and tuple-key constants; current pointers unchanged.
- `packages/spec/src/integrity-authority.ts` - Closed v1.19 tuple record and explicit candidate resolver, kept outside current/general registries.
- `packages/spec/src/integrity-authority.test.ts` - TDD coverage for exact candidate identity, mutation resistance, atomic selection, deterministic roots, and Phase-259 preservation.

## Decisions Made

- The successor is deliberately absent from `CANONICAL_COMPATIBILITY_TUPLES` and `REGISTERED_CANONICAL_COMPATIBILITY_TUPLES`. This keeps generic/current behavior byte-exact while allowing deliberate version-specific candidate work.
- The activation source contains only one key. Generated aliases expand that key into a complete tuple/ABI/catalog/policy/certificate record, making partial member activation unrepresentable.
- Root pins cover the canonical compact source record and generated selection payload. The generated module also compares every current pointer and tuple component at import time so stale or split generation fails closed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided an impossible literal comparison in the inactive-key guard**
- **Found during:** Task 1 GREEN typecheck
- **Issue:** TypeScript correctly rejected a direct equality check between the disjoint literal types `runtime-v1.19` and `runtime-v1.17`.
- **Fix:** Compared their string projections while retaining the runtime fail-closed guard.
- **Files modified:** `packages/spec/src/integrity-authority.ts`
- **Verification:** `pnpm --filter @cowards/spec typecheck` passed.
- **Committed in:** `eda855a`

---

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** No scope or semantic change; the correction preserves the intended inactive-key assertion.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- Plan-focused tuple and released-supervisor tests: 2 files, 38 tests passed.
- Complete `packages/spec/src` Vitest selection: 38 files, 522 tests passed, 1 skipped.
- `pnpm --filter @cowards/spec typecheck`: passed.
- `pnpm --filter @cowards/spec build`: passed.
- ESLint on all five plan files: passed.
- Active corpus registry, reviewed corpus pin, active trace registry, v1.17 certificate source, and v1.18 invocation source have no Plan-02 diff.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Stub scan: no TODO, FIXME, placeholder, coming-soon, or unavailable implementation markers.

## TDD Gate Compliance

- Task 1 RED `de03832` precedes GREEN `eda855a`.
- Task 2 RED `3d70355` precedes GREEN `fe1081f`.
- Both RED gates failed for the absent successor/selector implementation, and both GREEN gates pass their declared commands.

## Next Phase Readiness

- Wave 3 can build historical-safe persistence and generated Go/spec projections from one exact candidate tuple and one Phase-259-preserving selector.
- Plan 260-14 remains the sole owner of changing the compact key and regenerating current projections.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- Both generated-selector files exist and all five plan files are present in the four TDD commits.
- All declared verification, typecheck, build, lint, protected-baseline, and no-active-registry-diff checks pass.
- No unexpected deletions, untracked generated outputs, or new trust-boundary surfaces were introduced.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
