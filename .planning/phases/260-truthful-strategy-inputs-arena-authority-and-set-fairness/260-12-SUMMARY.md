---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "12"
subsystem: executable-conformance-traces
tags: [candidate-only, fixed-schema-bundle, semantic-diff, independent-review, immutable-history]

requires:
  - phase: 260-03
    provides: Kernel-owned v1.19 observations and executable v1.4 behavior-preservation proof
  - phase: 260-11
    provides: Reviewed inactive corpus-v3 candidate and exact case/source pins
provides:
  - One fixed-schema 30-case v1.19 observation trace bundle with canonical input, invocation, state, event, memory, objective, terminal, and failure evidence
  - Explicit per-case semantic diff and compatibility dispositions for ten protected rule, lifecycle, arena, history, and failure surfaces
  - Independent review and inactive closure pin binding every candidate artifact while preserving the Phase-259 active registry
affects: [260-13, 260-14, 260-19, four-language-certification, conformance-trace-governance]

tech-stack:
  added: []
  patterns: [single-inventoried-trace-bundle, exact-before-after-disposition, distinct-reviewer-closure-pin]

key-files:
  created:
    - packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/traces.bundle.json
    - packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/manifest.json
    - packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/semantic-diff.json
    - packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/compatibility-disposition.json
    - packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/independent-review.json
    - packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts
  modified:
    - scripts/generate-v1-37-conformance-traces.ts
    - scripts/generate-v1-37-conformance-traces.test.ts
    - scripts/review-v1-37-conformance-trace-diff.ts
    - scripts/check-v1-37-conformance-traces.ts

key-decisions:
  - "Inventory every candidate output in one exact traces.bundle.json instead of relying on wildcard per-case files."
  - "Treat the 16 prior cases as observation-or-fixture-identity-only deltas and the 14 new D-01 through D-08 cases as explicit observation additions; no wildcard disposition is permitted."
  - "Keep v4 inactive and separately pinned; Plan 14 alone may change the Phase-259 active trace registry."

patterns-established:
  - "Trace candidate closure: corpus candidate pin -> fixed bundle -> semantic diff -> complete disposition -> distinct reviewer -> immutable inactive pin."
  - "Executable byte guard: the default checker proves both the active Phase-259 trace and reviewed inactive v4 candidate without promoting either implicitly."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, SET-05]

coverage:
  - id: D1
    description: "Trace v4 bundles every reviewed corpus-v3 case exactly once with canonical input and complete state, event, memory, objective, terminal, failure, and trace-root evidence."
    requirement: STRAT-03
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-traces.test.ts#bundles every corpus-v3 case in one fixed-schema inactive observation candidate"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run scripts/generate-v1-37-conformance-traces.test.ts packages/golden/src/v1-37-conformance-trace.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every case has exact baseline/candidate roots and every protected gameplay, lifecycle, arena, history, and failure-ownership surface has a machine-checkable unchanged disposition."
    requirement: SET-05
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-traces.test.ts#disposes every trace case and protected semantic surface explicitly"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-conformance-traces.ts --candidate=v1.37-observation-trace-v4"
        status: pass
    human_judgment: false
  - id: D3
    description: "A distinct reviewer and closure pin bind the exact corpus, tuple, manifest, bundle, diff, dispositions, review, case roots, and protected surfaces while v3 remains current."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-traces.test.ts#independently reviews and pins the exact inactive trace closure"
        status: pass
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-traces.test.ts#rejects incomplete dispositions before independent review"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-conformance-traces.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase-259 active registry, reviewed history, v2/v3 traces, and the protected user working-tree baseline remain exact."
    requirement: SET-05
    verification:
      - kind: integration
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#active trace registry and historical evidence"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 12: Reviewed Observation Trace-v4 Candidate Summary

**A 30-case fixed-schema v1.19 trace bundle now carries complete reviewed observation evidence behind an exact inactive closure pin while Phase-259 v3 remains byte-exact current.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-17T07:04:50Z
- **Completed:** 2026-07-17T07:32:07Z
- **Tasks:** 3 TDD tasks
- **Files modified:** 10

## Accomplishments

- Generated one explicitly inventoried bundle for all 30 corpus-v3 cases instead of committing an unlisted wildcard directory of per-case outputs.
- Recorded canonical inputs plus full invocation, state, ordered-event, memory, objective, terminal, failure, and trace-root evidence under the inactive runtime-v1.19 tuple.
- Added exact before/after roots and one disposition per case, plus unchanged dispositions for gameplay state, Action legality, event order, cleanup, terminal timing/reason, outcome, Backstab, arena geometry, historical interpretation, and failure ownership.
- Independently recomputed and pinned the complete candidate closure while guarding the active registry at `sha256:f97efb668bd956da600c0ca9bc1514473ad79554eba2477042c49091a698494d`.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: fixed-schema trace bundle contract** - `95eae2c`
2. **Task 1 GREEN: bundled corpus-v3 observation traces** - `e602a65`
3. **Task 2 RED: complete semantic disposition contract** - `e3d175a`
4. **Task 2 GREEN: exact diff and compatibility dispositions** - `950df51`
5. **Task 3 RED: independent review closure contract** - `6973732`
6. **Task 3 GREEN: reviewed inactive candidate pin** - `73d67ba`

## Files Created/Modified

- `scripts/generate-v1-37-conformance-traces.ts` - Generates the exact candidate bundle, diff, dispositions, and guarded committed candidate path.
- `scripts/generate-v1-37-conformance-traces.test.ts` - Covers bundle inventory, explicit dispositions, independent review, stale evidence, and active-byte guards.
- `scripts/review-v1-37-conformance-trace-diff.ts` - Independently validates all v4 files, traces, roots, coverage, and unchanged protected surfaces.
- `scripts/check-v1-37-conformance-traces.ts` - Checks candidate v4 explicitly or active v3 plus v4 together without changing selection.
- `packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4/` - Exact manifest, bundle, diff, disposition, and review evidence.
- `packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts` - Immutable inactive closure pin for downstream certification.

## Decisions Made

- The bundle root hashes exact generated JSON bytes under a domain-separated identity because the complete bundle intentionally exceeds the bounded runtime canonical-JSON profile; each contained trace retains its own canonical semantic root.
- Candidate replay recording uses the canonical Smoke arena and explicit four-condition authority. Its arena-ID change is classified only as allowed fixture identity; semantic geometry remains unchanged and separately pinned.
- The independent reviewer is a distinct source module and recomputes trace semantics, roots, case/disposition coverage, and protected surfaces before writing immutable review bytes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected stale generator tests that regenerated a reviewed version**
- **Found during:** Task 1 GREEN verification
- **Issue:** Existing generator tests used reviewed candidate version v2. After later kernel evolution, the append-only reviewed-root guard correctly rejected regenerating that identity.
- **Fix:** Changed successful test generation to an explicitly unreviewed test-only v999 identity while retaining the test that proves reviewed-version root mismatch rejection.
- **Files modified:** `scripts/generate-v1-37-conformance-traces.test.ts`
- **Verification:** Full generator and golden trace suite passes, including reviewed-history rejection tests.
- **Committed in:** `e602a65`

**2. [Rule 2 - Missing Critical] Extended the independent reviewer and checker for the new bundle schema**
- **Found during:** Tasks 2 and 3
- **Issue:** The plan required independent review and exact CLI checking, but the existing reviewer/checker understood only wildcard per-case v2/v3 candidates and were absent from `files_modified`.
- **Fix:** Added v4-specific independent recomputation, stale/self-authored review rejection, closure-pin validation, and explicit/default read-only checker modes.
- **Files modified:** `scripts/review-v1-37-conformance-trace-diff.ts`, `scripts/check-v1-37-conformance-traces.ts`
- **Verification:** Both candidate-only and default active-plus-candidate checker commands pass; mutation tests reject incomplete dispositions.
- **Committed in:** `950df51`, `73d67ba`

---

**Total deviations:** 2 auto-fixed (1 blocking stale-test correction, 1 missing critical review/check path).
**Impact on plan:** Both changes were required for honest append-only history and executable independent review. No active selector, gameplay rule, historical trace, or public/private boundary changed.

## Issues Encountered

- Candidate v1.19 Chronicle recording initially failed because the candidate replay contract now requires exact persisted arena/scenario/condition authority. The generator now supplies the canonical Smoke/four-condition identity rather than bypassing replay validation.
- The complete fixed-schema bundle is approximately 14 MiB because it carries 30 full traces plus explicit evidence projections. This is committed review evidence, not a runtime/public payload, and its exact hash is pinned.

## User Setup Required

None - no external service configuration or dependency installation required.

## Verification

- Generator plus golden trace suite: 2 files, 29 tests passed.
- Candidate checker: exact inactive v4 closure passed.
- Default checker: active Phase-259 v3 and inactive v4 passed together.
- Golden TypeScript build/typecheck passed.
- ESLint and Prettier passed for every changed source/pin file and all non-bundle JSON artifacts.
- Active registry remains `sha256:f97efb668bd956da600c0ca9bc1514473ad79554eba2477042c49091a698494d`; reviewed history remains `sha256:ca149da0163e83d7b89d3abb3ae4701bf132f82eaeb6461539c6d60994dbffac`.
- Protected working-tree baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- Task 1 RED `95eae2c` failed because the bundled v4 generator did not exist; GREEN `e602a65` emits all 30 exact records.
- Task 2 RED `e3d175a` failed because diff/disposition files did not exist; GREEN `950df51` creates and checks complete coverage.
- Task 3 RED `6973732` failed because the pin/reviewer did not exist; GREEN `73d67ba` independently binds the inactive closure and rejects tampering.

## Next Phase Readiness

- Plan 260-19 can execute the exact corpus-v3/trace-v4 pins three fresh times in each real lane.
- Plan 260-13 can bind each inactive successor certificate to `V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN` without consulting the active registry.
- Plan 260-14 remains the sole activation owner; current v3 lookup, reviewed history, and all historical evidence remain exact.

## Self-Check: PASSED

- All ten source/evidence files and six TDD commits exist.
- Exact bundle, disposition, review, pin, active/historical, typecheck, lint, format, and protected-baseline gates pass.
- Only the two protected user files remain dirty.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
