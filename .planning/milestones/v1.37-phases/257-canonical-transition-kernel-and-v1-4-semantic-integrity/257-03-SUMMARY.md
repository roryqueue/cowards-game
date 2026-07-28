---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "03"
subsystem: testing
tags: [engine, compatibility, v1-4, deterministic-hashes, rules-addendum]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact lifecycle RED contracts and retained-prefix precedence from Plan 02
provides:
  - Twenty independently named full-observation valid-v1.4 compatibility fixtures
  - Locked per-fixture hashes and thirteen dimension roots with repeatability proof
  - Fail-closed D-09/D-10/D-11/D-13/D-14/D-15 regeneration authorization
  - Protected-spec-safe v1.37 rules integrity companion addendum
affects: [257-08, 257-09, 257-19, kernel-refactor, compatibility-verification]
tech-stack:
  added: []
  patterns: [dimension-root compatibility lock, bounded KERN-11 finding, protected-byte provenance]
key-files:
  created:
    - packages/engine/src/fixtures/v1-4-compatibility.ts
    - packages/engine/src/compatibility-fixtures.test.ts
    - CowardsGameSpec_RulesIntegrityAddendum_v1.37.md
  modified: []
key-decisions:
  - "Compatibility evidence locks twenty scenario hashes plus thirteen observation-dimension roots, so both scenario identity and changed semantic dimensions are executable without storing opaque monolithic snapshots."
  - "D-12 is a preservation ruling and is deliberately rejected as fixture-regeneration authority; only D-09, D-10, D-11, D-13, D-14, and D-15 are accepted."
  - "System failure evidence records the unchanged pre-transition state and zero canonical events, while player violation evidence records the existing owner-private gameplay cleanup."
patterns-established:
  - "Full observation: compare initial/intermediate/final state, coordinates, events, calls, observations, memories, objectives, outcome, failure classification, and terminal count independently."
  - "Compatibility mutation: every dimension produces one bounded hash-only KERN-11 finding rather than silently regenerating a golden."
requirements-completed: [KERN-10, KERN-11]
coverage:
  - id: D1
    description: Every audited valid-v1.4 ambiguity is represented by exactly twenty named scenarios and thirteen independently hashed observation dimensions.
    requirement: KERN-10
    verification:
      - kind: unit
        ref: "packages/engine/src/compatibility-fixtures.test.ts#v1.4 full-observation compatibility corpus"
        status: pass
    human_judgment: false
  - id: D2
    description: Repeated corpus runs are byte-equivalent and match locked fixture hashes plus dimension roots.
    requirement: KERN-11
    verification:
      - kind: unit
        ref: "pnpm --filter @cowards/engine exec vitest run src/compatibility-fixtures.test.ts (two consecutive passes)"
        status: pass
    human_judgment: false
  - id: D3
    description: Every compared dimension rejects mutation with a bounded KERN-11 finding and regeneration accepts only the six approved delta IDs.
    requirement: KERN-11
    verification:
      - kind: unit
        ref: "packages/engine/src/compatibility-fixtures.test.ts#compatibility delta approval boundary"
        status: pass
    human_judgment: false
  - id: D4
    description: The companion addendum records D-09 through D-15, D-12 preservation, historical routing, event removal/version consequence, and explicit deferrals without changing protected bytes.
    requirement: KERN-11
    verification:
      - kind: contract
        ref: "CowardsGameSpec_RulesIntegrityAddendum_v1.37.md"
        status: pass
    human_judgment: false
duration: 17min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 03: v1.4 Compatibility Corpus and Integrity Addendum Summary

**Twenty deterministic full-observation fixtures now freeze the valid v1.4 semantic envelope, while a fail-closed approval boundary and companion addendum prevent a kernel refactor from silently rewriting gameplay evidence.**

## Performance

- **Duration:** 17 min
- **Completed:** 2026-07-13T15:36:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added exactly twenty named scenarios covering collision distinctions, successful and blocked push behavior, movement history, illegal reversal, Cycle-interleaved initiative/snake order, all required Backstab boundaries and simultaneous forms, contraction/final 2x2, player versus system failure, memory/objective ordering, blocked-cycle continuation, and terminal uniqueness.
- Captured thirteen observation dimensions per scenario: initial state, transition-complete intermediate results, lifecycle coordinates, ordered event payload/context/privacy, runtime calls, Strategy observations, SoldierBrain observations, memory handoffs, objective handoffs, final state, outcome, failure trace, and terminal-event count.
- Locked reviewed per-fixture hashes and corpus-wide dimension roots; two consecutive focused runs reproduce identical observations and hashes.
- Added mutation proof for every dimension plus fail-closed missing, unknown, preserved, and duplicate approval-ID cases.
- Published the v1.37 rules-integrity companion without reading the dirty consolidated working copy as canonical or changing its bytes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Capture the full v1.4 compatibility corpus** - `87e6984` (test)
2. **Task 2: Enforce an explicit compatibility-delta allowlist** - `13b6dfb` (test)
3. **Task 3: Publish the non-overlapping v1.37 rules-integrity addendum** - `1c05bfe` (docs)

Additional gate fix: `201e84c` uses the ESLint-recognized `globalThis.structuredClone` spelling with identical runtime semantics.

## Files Created

- `packages/engine/src/fixtures/v1-4-compatibility.ts` - Scenario harness, full observations, canonical hashes, locked roots, drift findings, and regeneration authorization.
- `packages/engine/src/compatibility-fixtures.test.ts` - Semantic assertions, repeatability, locked drift, per-dimension mutation, and allowlist tests.
- `CowardsGameSpec_RulesIntegrityAddendum_v1.37.md` - D-09 through D-15 ruling record, preservation bundle, historical routing, KERN-11 gate, and deferrals.

## Decisions Made

- A compact two-level lock is used: each named scenario has an immutable overall hash, and each observation dimension has a corpus-wide root. This locates whether drift is scenario inventory/content or a specific semantic dimension while remaining reviewable.
- The corpus preserves D-12 behavior only. It does not encode the Phase 257 D-09/D-10/D-11 defects as expected behavior.
- `HOLD` and `END_ACTIVATION` remain absent, and Cycle-start Backstab remains executable in the corpus.
- No valid Match semantic delta occurred, so the KERN-11 user checkpoint was not triggered.

## Protected Spec Evidence

The exact working-copy and binary-diff hashes were captured before the first task edit and recomputed immediately before the addendum commit:

| Evidence | Before | After |
| --- | --- | --- |
| Dirty working-copy bytes | `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46` | `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46` |
| Binary diff bytes | `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d` | `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d` |

Both pairs match exactly. `.planning/config.json` was also left unstaged and untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint did not recognize the bare Node `structuredClone` global**

- **Found during:** Final package lint gate
- **Issue:** TypeScript and Vitest accepted the global, but ESLint's `no-undef` environment rejected it.
- **Fix:** Used `globalThis.structuredClone` in the fixture and mutation test.
- **Files modified:** `packages/engine/src/fixtures/v1-4-compatibility.ts`, `packages/engine/src/compatibility-fixtures.test.ts`
- **Verification:** Focused 12/12 tests, typecheck, and package lint all pass; locked hashes remain unchanged.
- **Committed in:** `201e84c`

---

**Total deviations:** 1 auto-fixed blocking issue
**Impact on plan:** No scope expansion and no semantic change.

## Verification

- `pnpm --filter @cowards/engine exec vitest run src/compatibility-fixtures.test.ts` — 12/12 passed twice consecutively.
- `pnpm --filter @cowards/engine exec vitest run src/compatibility-fixtures.test.ts -t "compatibility delta"` — 3/3 passed.
- `pnpm --filter @cowards/engine typecheck` — passed.
- `pnpm --filter @cowards/engine lint` — passed.
- Addendum required-term and non-empty checks — passed.
- Protected working-byte and binary-diff SHA-256 equality — passed.

## User Setup Required

None.

## Next Phase Readiness

- Candidate kernel work can compare every preserved semantic dimension against this corpus and must stop at KERN-11 on any unapproved valid-input delta.
- D-09 through D-11 remain deliberately represented by their separate expected-RED contracts, not normalized into preserved goldens.
- Plan 257-19 can update only the D-13/D-14/D-15 structural/version surfaces under the explicit regeneration guard while preserving observation roots for D-12 behavior.

## Self-Check: PASSED

- All three delivered artifacts and four implementation commits exist.
- Focused tests passed twice; mutation, typecheck, lint, formatting, and diff checks pass.
- Only the protected pre-existing dirty files remain outside this plan's commits.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
