---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "18"
subsystem: testing
tags: [transition-kernel, activation, compatibility, audit-probe]

requires:
  - phase: 257-08
    provides: Candidate transition driver and arbitrary-state Activation seam
  - phase: 257-09
    provides: Approved D-09, D-10, and D-11 candidate repairs
  - phase: 257-10
    provides: Candidate current-event recorder material
  - phase: 257-11
    provides: Exact executable-reference inventory and staged migration modes
provides:
  - All exact contiguous-Activation test and probe callers migrated to the candidate authority
  - Permanent audit output for approved D-09, D-10, and D-11 candidate behavior
  - Immutable v1.4 compatibility evidence preserved across candidate caller migration
  - Public-surface and structural contracts ready for atomic current-authority activation
affects: [257-19, 257-20, activation-authority, compatibility-audit]

tech-stack:
  added: []
  patterns:
    - Fixed one-step candidate transitions for focused selection probes
    - Candidate driver delegation for arbitrary semantically valid Activation states
    - Historical event projection at the immutable v1.4 evidence boundary

key-files:
  created:
    - packages/engine/src/public-surface.test.ts
  modified:
    - packages/engine/src/activation.test.ts
    - packages/engine/src/movement.test.ts
    - packages/engine/src/backstab.test.ts
    - packages/engine/src/fixtures/v1-4-compatibility.ts
    - packages/engine/src/lifecycle-repairs.test.ts
    - .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts

key-decisions:
  - "Preserve immutable v1.4 event bytes by projecting candidate recorder events to the historical zero-sequence representation; never regenerate locked hashes."
  - "Use fixed candidate step calls for D-09 selection evidence and the candidate arbitrary-state driver for D-10/D-11; no caller recreates a Cycle scheduler."
  - "Keep the active legacy definition current and exported until Plan 19 performs atomic authority activation and deletion."

patterns-established:
  - "Caller migration: inject semantically valid state into the candidate seam and require a completed execution before asserting results."
  - "Structural readiness: scan migrated sources for copied scheduling loops and use the Activation-specific inventory independently of generic builder migration."

requirements-completed: [KERN-04, KERN-05, KERN-06, KERN-07, KERN-10, KERN-11]

coverage:
  - id: D1
    description: "All 16 exact stale Activation references owned by Plan 18 are migrated, leaving only the active Plan 19 definition."
    requirement: KERN-04
    verification:
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-37-executable-reference-inventory.ts --activation-callers-ready"
        status: pass
    human_judgment: false
  - id: D2
    description: "The permanent audit reports approved D-09 retained-prefix, D-10 Backstab closure, and D-11 immediate-outcome results through candidate seams."
    requirement: KERN-05
    verification:
      - kind: integration
        ref: "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
        status: pass
      - kind: unit
        ref: "packages/engine/src/lifecycle-repairs.test.ts#approved lifecycle behavior through the candidate authority"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 20 immutable v1.4 fixtures and successful-push reversal history remain unchanged after candidate caller migration."
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "packages/engine/src/compatibility-fixtures.test.ts#locks exactly the 20 independently named audited scenarios"
        status: pass
      - kind: unit
        ref: "packages/engine/src/movement.test.ts#preserves successful-push reversal history through the candidate activation authority"
        status: pass
    human_judgment: false
  - id: D4
    description: "The candidate remains explicitly non-current and the post-activation public surface excludes the contiguous helper without copied caller loops."
    requirement: KERN-10
    verification:
      - kind: unit
        ref: "packages/engine/src/public-surface.test.ts#candidate and current engine public surfaces"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 18: Activation Caller Migration Summary

**Every owned contiguous-Activation caller now delegates to the candidate transition authority while immutable v1.4 evidence and the still-current legacy export remain intact.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-13T17:26:36Z
- **Completed:** 2026-07-13T17:35:42Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Removed all 16 exact Plan-18 caller references and passed the independent Activation-callers-ready inventory with only the active Plan-19 definition remaining.
- Updated the permanent probe to report D-09 as `1/0`, D-10 as `STONE/ended/BACKSTABBED`, and D-11 as `STONE/WIN/1` through candidate seams.
- Kept every locked v1.4 compatibility hash unchanged, including the D-12 successful-push pusher history of `RIGHT` and pushed-Soldier history of `LEFT`.
- Added public-surface and copied-loop structural tests while keeping candidate `runMatch` explicitly distinct from current `runMatch`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate all callers and probe without deleting active old surface** - `70c6178` (test)

## Files Created/Modified

- `packages/engine/src/public-surface.test.ts` - Freezes old-current versus candidate/final surface and rejects copied scheduling loops in migrated callers.
- `packages/engine/src/activation.test.ts` - Moves arbitrary-state Activation and D-09 selection cases to candidate driver/step seams.
- `packages/engine/src/movement.test.ts` - Proves candidate successful-push reversal history preservation.
- `packages/engine/src/backstab.test.ts` - Routes Activation-boundary Backstab coverage through the candidate driver.
- `packages/engine/src/fixtures/v1-4-compatibility.ts` - Captures the two full-Activation fixtures through the candidate authority while preserving historical event bytes.
- `packages/engine/src/lifecycle-repairs.test.ts` - Replaces staged legacy expectations with approved D-09/D-10/D-11 candidate results.
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` - Reports current candidate repair results without modifying the immutable Phase-256 baseline.

## Decisions Made

- Compatibility capture uses candidate recorder material and resets only event sequence to the historical v1.4 representation. This preserves both owner-private evidence and every locked byte-level hash.
- D-09 evidence uses three fixed transition advances plus one runtime resume. D-10 and D-11 use the arbitrary-state Activation driver. Neither test nor probe owns a Cycle loop.
- The public-surface contract tests the candidate's intended final shape without deleting or switching the current export before Plan 19.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Root retained-prefix matrix still exercised staged old selection semantics**

- **Found during:** Task 1 focused test gate
- **Issue:** Five D-09 cases called the old selection primitive and remained RED after the repaired candidate behavior was approved.
- **Fix:** Migrated the matrix to fixed candidate `stepMatch` transitions and asserted retained selections, classification, memory, and event evidence.
- **Files modified:** `packages/engine/src/activation.test.ts`
- **Verification:** Focused 57-test gate and full 110-test engine suite pass.
- **Committed in:** `70c6178`

**2. [Rule 1 - Bug] Candidate result events omitted historical owner-private recorder payloads**

- **Found during:** Task 1 immutable compatibility gate
- **Issue:** Using transition-result events changed two fixture hashes because immutable v1.4 evidence includes recorder-private payloads.
- **Fix:** Projected candidate recorder material to the historical zero-sequence representation instead of changing or regenerating any lock.
- **Files modified:** `packages/engine/src/fixtures/v1-4-compatibility.ts`
- **Verification:** All 20 fixture locks pass; no locked hash line changed.
- **Committed in:** `70c6178`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were required to complete the planned migration and preserve approved behavior; no production authority or compatibility lock changed.

## Issues Encountered

- The repository's typed ESLint project does not include `.planning/artifacts/**`. All six engine files pass ESLint; the audit probe passes Prettier and executes successfully through `tsx`.
- The legacy `--baseline` inventory intentionally reports reference drift after migration (`51` expected grouped entries versus `27` current). The stage-specific `--activation-callers-ready` mode is green, as required; the temporary HEAD-equals-baseline monitor remains expected RED until Plan 20 replaces it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 19 can atomically switch current authority and delete the sole remaining contiguous-Activation definition without hidden callers.
- Plan 20 can replace the intentionally stale baseline monitor with final drift guards over the activated authority.
- No D-12 compatibility approval is required; all immutable evidence remained unchanged.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
