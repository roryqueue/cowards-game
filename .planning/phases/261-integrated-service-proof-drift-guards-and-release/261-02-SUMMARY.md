---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "02"
subsystem: release-boundaries
tags: [privacy, drift-guards, strict-release, boundary-monitors, fail-closed]
requires:
  - phase: 261-integrated-service-proof-drift-guards-and-release
    plan: "01"
    provides: closed service-proof manifest and restricted evidence lifecycle
  - phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
    provides: current transition, tuple, event, arena, Set, and four-language authorities
provides:
  - source/fixture release privacy and named-drift checker
  - reserved fail-closed strict release artifact mode
  - one non-recursive construction-time boundary monitor invocation
affects: [261-03, 261-04, 261-05, 261-06, 261-10, 261-11]
tech-stack:
  added: []
  patterns:
    - compose existing integrity analysis instead of duplicating source scanners
    - exact safe envelopes plus recursive concrete-preimage scans
    - explicit construction versus strict-release lifecycle
key-files:
  created:
    - scripts/check-v1-37-release-boundaries.ts
    - scripts/check-v1-37-release-boundaries.test.ts
  modified:
    - scripts/check-boundary-monitors.ts
    - scripts/check-boundary-monitors.test.ts
    - package.json
key-decisions:
  - "Construction runs only source-fixture mode; strict-release remains implemented and fail-closed until Plan 261-11 atomically selects it after all collectors and rollups exist."
  - "Four-language functional conformance and counted containment are independent; an unattested lane remains explicitly non-counted even when functional execution passes."
  - "Release findings contain only stable codes and safe logical artifact IDs, never source paths, diagnostics, or concrete private preimages."
patterns-established:
  - "Thin release join: existing integrity findings are reduced to stable release classes without copying transition, tuple, event, arena, or Set analysis."
  - "Strict artifact inventory: every required receipt, rollup, handoff, readiness artifact, and current event/arena/Set authority is hash-, byte-, identity-, cardinality-, and privacy-checked."
requirements-completed: [PROOF-05, PROOF-06]
coverage:
  - id: D1
    description: Every named PROOF-06 regression and unproved counted claim fails through stable privacy-safe release finding codes.
    requirement: PROOF-06
    verification:
      - kind: unit
        ref: scripts/check-v1-37-release-boundaries.test.ts#named drift and counted mutations
        status: pass
    human_judgment: false
  - id: D2
    description: APIs, documents, logs, fixtures, contracts, proofs, audits, and handoffs require exact safe schemas and reject forbidden fields, markers, and concrete private preimages.
    requirement: PROOF-05
    verification:
      - kind: unit
        ref: scripts/check-v1-37-release-boundaries.test.ts#public artifact privacy matrix
        status: pass
    human_judgment: false
  - id: D3
    description: Strict release rejects missing, stale, edited, duplicated, identity-mixed, or private service, rollback/history, browser, rollup, audit, handoff, readiness, event, arena, and Set evidence.
    requirement: PROOF-05
    verification:
      - kind: unit
        ref: scripts/check-v1-37-release-boundaries.test.ts#strict release inventory mutations
        status: pass
    human_judgment: false
  - id: D4
    description: The default boundary chain runs source-fixture mode exactly once after lower v1.37 authorities without write, live-service, strict, or recursive invocation.
    requirement: PROOF-06
    verification:
      - kind: integration
        ref: scripts/check-boundary-monitors.test.ts#serializes source-only v1.37 release boundaries
        status: pass
      - kind: integration
        ref: pnpm exec tsx scripts/check-boundary-monitors.ts
        status: pass
    human_judgment: false
duration: 17min
completed: 2026-07-19
status: complete
---

# Phase 261 Plan 02: Release Privacy and Drift Guards Summary

**A thin release checker now turns the existing authority analysis into nine executable drift guards, scans every public evidence class against exact schemas and concrete private preimages, and reserves a fail-closed strict artifact gate for final release.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-19T16:34:00Z
- **Completed:** 2026-07-19T16:51:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added stable release finding codes and adversarial mutations for transition duplication, tuple mixing, adapter-owned gameplay, stale evidence, event drift, arena duplication, unfair scheduling, unproved counting, and private leakage.
- Added exact safe-envelope validation and concrete-preimage scans across API, document, log, fixture, contract, proof, audit, and handoff classes without exposing rejected values in findings.
- Added strict release inventory checks for every collector/rollup artifact plus current event, arena, and Set authorities; missing evidence can never produce an empty pass.
- Registered only the non-mutating source/fixture command in the default monitor chain, exactly once and after the Phase-260 proof.

## Task Commits

1. **Task 1 RED: release boundary mutation contract** - `f6345b3`
2. **Task 1 GREEN: release boundary checker** - `fc8ccad`
3. **Task 2 RED: release monitor wiring contract** - `50338fb`
4. **Task 2 GREEN: construction-only monitor integration** - `fbc1491`
5. **Task 1 hardening RED: strict authority/privacy omissions** - `cedcd61`
6. **Task 1 hardening GREEN: close strict inventory and scans** - `78966cf`

## Files Created/Modified

- `scripts/check-v1-37-release-boundaries.ts` - Thin integrity-result join, public schema/preimage checks, strict evidence inventory, and source/strict CLI modes.
- `scripts/check-v1-37-release-boundaries.test.ts` - 38 tests spanning every named drift class, all eight public classes, and every strict artifact mutation.
- `scripts/check-boundary-monitors.ts` - One report-only assertion that validates release command lifecycle and ordering.
- `scripts/check-boundary-monitors.test.ts` - Exact wiring tests forbidding premature strict, write, live, duplicate, and recursive execution.
- `package.json` - Source-only and strict release commands plus the one construction-time default invocation.

## Verification

- Release and existing integrity suites: 88/88 tests passed.
- New monitor wiring test: 1/1 passed; 26 unrelated cases skipped by focused selection.
- Direct root monitor: all 45 assertions passed, including the new release wiring assertion.
- Source/fixture CLI passed with eight closed public classes and zero future-artifact reads.
- Strict CLI failed as designed on all eleven currently absent required release inputs.
- Workspace typecheck passed 27/27 tasks; focused ESLint and `git diff --check` passed.
- Protected working-tree baseline remained exact at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## Decisions Made

- Strict release consumes the readiness-owned exact artifact inventory instead of guessing future collector paths or duplicating their receipt validators.
- Policy prose may name forbidden categories, but forbidden structural fields, concrete values, host markers, credentials, diagnostics, and restricted IDs always fail recursively.
- Release output reduces upstream findings to stable code/class/logical-ID triples; detailed paths and diagnostics remain outside the public result.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used the workspace package export for the privacy utility**
- **Found during:** Task 2 typed lint verification
- **Issue:** The initial direct cross-package source import violated the repository's restricted-import rule.
- **Fix:** Imported `assertPublicOutputLeakSafe` from `@cowards/spec`, preserving the same canonical implementation without weakening lint policy.
- **Files modified:** `scripts/check-v1-37-release-boundaries.ts`
- **Verification:** Focused ESLint and workspace typecheck passed.
- **Committed in:** `fbc1491`

**2. [Rule 2 - Missing Critical] Closed strict authority and canonical-byte privacy gaps**
- **Found during:** Post-task security self-review
- **Issue:** Strict inventory did not explicitly name current event/arena/Set authorities and did not scan canonical strict bytes against concrete restricted preimages.
- **Fix:** Added exact authority inventory rows, strict record schema/cardinality checks, canonical-byte public privacy scanning, and RED/GREEN mutations.
- **Files modified:** `scripts/check-v1-37-release-boundaries.ts`, `scripts/check-v1-37-release-boundaries.test.ts`
- **Verification:** Focused release/integrity suite passed 88/88.
- **Committed in:** `cedcd61`, `78966cf`

**Total deviations:** 2 auto-fixed (one Rule 3, one Rule 2).  
**Impact on plan:** Both changes enforce repository policy or close required release/privacy behavior; no gameplay, runtime, service, or package scope was added.

## Issues Encountered

The final live-repository case inside the full boundary-monitor Vitest file was terminated by the agent runner before Vitest emitted its summary when run with the entire file. The exact production monitor entry point was run directly instead and passed all 45 assertions; the new wiring case also passed independently. No boundary finding remained.

## User Setup Required

None. Later strict release collection still requires the explicit restricted evidence root and production-shaped service environment defined by Plans 261-03 through 261-05.

## Known Stubs

None. The empty strict inventory before collection is intentional fail-closed lifecycle state, not a passing placeholder.

## Next Phase Readiness

Plan 261-03 can collect real service receipts while the default monitor remains green. Plan 261-10 must publish the exact readiness-owned `releaseBoundaryArtifacts` inventory, and Plan 261-11 must atomically replace the source-only default invocation with strict release after every required input exists.

## Self-Check: PASSED

- Both created checker files and all three modified integration files exist.
- All six RED/GREEN/hardening commits exist in repository history.
- Release/integrity tests, monitor wiring, direct 45-assertion root monitor, source CLI, strict missing-artifact behavior, typecheck, lint, diff, package JSON, and protected baseline checks passed.

---
*Phase: 261-integrated-service-proof-drift-guards-and-release*
*Completed: 2026-07-19*
