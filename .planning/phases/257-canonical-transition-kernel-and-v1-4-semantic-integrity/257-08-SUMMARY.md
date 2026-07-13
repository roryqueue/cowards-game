---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "08"
subsystem: engine-kernel
tags: [transition-kernel, effects-as-data, semantic-validation, replay, v1.4-compatibility]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: semantic state/arena validators and inactive exact candidate tuple
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: locked 20-scenario v1.4 compatibility corpus
provides:
  - Pure resumable one-edge candidate Match transition authority
  - Exact runtime effect/resume identity with three-way failure classification
  - Privacy-safe state projections, state and machine hashes, and per-boundary recorder material
  - Inactive candidate Match driver plus arbitrary-valid-state Activation migration seam
affects: [257-09, 257-10, 257-13, 257-18, 257-19, chronicle, replay]
tech-stack:
  added: []
  patterns: [effects as data, validate before commit, dual state and machine hashes, inactive candidate seam]
key-files:
  created:
    - packages/engine/src/kernel/types.ts
    - packages/engine/src/kernel/validate.ts
    - packages/engine/src/kernel/step.ts
    - packages/engine/src/kernel/driver.ts
  modified:
    - packages/engine/src/index.ts
    - packages/engine/src/kernel/kernel-contract.test.ts
    - packages/engine/src/kernel/semantic-boundaries.test.ts
    - packages/engine/src/compatibility-fixtures.test.ts
    - packages/spec/src/semantic-integrity.ts
    - packages/spec/src/semantic-integrity.test.ts
key-decisions:
  - "The candidate keeps privacy-safe gameplay hashes separate from cursor-aware machine hashes so lifecycle-only edges remain distinct without inventing board changes."
  - "Runtime effects use kernel-local stage-specific identities while frozen v1.4 Chronicle activationId spelling remains unchanged."
  - "System failure discards the entire exposed transition stream and returns the exact pre-effect gameplay state with system ownership."
  - "The driver is exported only as CANDIDATE_MATCH_KERNEL; active runMatch and current authority remain unchanged until Plan 19."
patterns-established:
  - "Boundary recorder: every accepted edge carries tuple, coordinates, classification, safe events, before/after projections, state hashes, machine hashes, and terminal/failure status."
  - "Custom-state migration: tests drive one selected Activation through the candidate runner without recreating Cycle scheduling."
requirements-completed: [KERN-01, KERN-02, KERN-03, KERN-07, KERN-10, KERN-11]
coverage:
  - id: D1
    description: A pure candidate reducer advances one lifecycle or runtime-response edge and never invokes runtime I/O.
    requirement: KERN-01
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/kernel-contract.test.ts#advances exactly one deterministic lifecycle edge without runtime I/O"
        status: pass
    human_judgment: false
  - id: D2
    description: Exact effect identities, semantic input/output validation, privacy-safe records, and stale/duplicate failure behavior are enforced before commit.
    requirement: KERN-07
    verification:
      - kind: unit
        ref: "packages/engine/src/kernel/kernel-contract.test.ts"
        status: pass
      - kind: unit
        ref: "packages/engine/src/kernel/semantic-boundaries.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: The inactive driver is byte-deterministic and exposes no partial canonical stream or player penalty on system failure.
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "packages/engine/src/kernel/kernel-contract.test.ts#driver execution and system failure"
        status: pass
    human_judgment: false
  - id: D4
    description: Candidate full-Match and arbitrary-state Activation execution preserve current v1.4 state and event observations while the locked 20-scenario corpus remains unchanged.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "packages/engine/src/compatibility-fixtures.test.ts#explicit active/candidate full-match adapter"
        status: pass
      - kind: integration
        ref: "packages/engine/src/compatibility-fixtures.test.ts#arbitrary valid activation state"
        status: pass
    human_judgment: false
duration: 22min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 08: Candidate Transition Kernel and Driver Summary

**A pure, effects-as-data Match machine now owns candidate lifecycle transitions and records every accepted boundary, while active v1.4 execution remains unchanged.**

## Performance

- **Duration:** 22 min
- **Completed:** 2026-07-13
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added a finite private Match machine with exact cursor, pending-effect, consumed-resume, slot, selection, and candidate-tuple identity.
- Added distinct privacy-safe gameplay projections and hashes plus cursor-aware machine hashes; memory, objectives, artifacts, diagnostics, host data, and security internals cannot enter boundary records.
- Implemented a pure staged reducer for Match, Round, selection, Cycle, Activation, Soldier observation/response, contraction, terminal, and maximum-phase boundaries without calling the legacy Match/Activation loops.
- Implemented an inactive driver that alone invokes injected runtime effects, resumes their exact requests, and returns deterministic transitions plus controlled recorder material.
- Added a candidate Activation runner for arbitrary semantically valid `GameState` fixtures so later stale-entry migration does not create another scheduling loop.
- Proved exact active/candidate full-Match final-state and internal event equality and preserved the locked 20-fixture corpus.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define machine, effects, records, and hash projections** - `237ed9d`
2. **Task 2: Implement the pure one-edge reducer** - `fbfbc7a`
3. **Task 3: Add the inactive driver and integration seams** - `1787394`
4. **Closeout: Preserve the owned executable-reference inventory** - `a1e5c94`

## Files Created/Modified

- `packages/engine/src/kernel/types.ts` - Private machine, effect/resume, transition, recorder, and execution contracts.
- `packages/engine/src/kernel/validate.ts` - Finite privacy-safe projections, domain-separated hashes, and validate-before-commit gates.
- `packages/engine/src/kernel/step.ts` - Pure one-edge candidate lifecycle reducer using existing movement, Backstab, outcome, and contraction primitives.
- `packages/engine/src/kernel/driver.ts` - Inactive effect interpreter, Match driver, and arbitrary-state Activation runner.
- `packages/engine/src/index.ts` - Candidate-branded integration export only; active exports remain intact.
- `packages/engine/src/kernel/kernel-contract.test.ts` - Hash, boundary, resume, deterministic driver, privacy, and system-failure contracts.
- `packages/engine/src/kernel/semantic-boundaries.test.ts` - Candidate factory semantic rejection proof.
- `packages/engine/src/compatibility-fixtures.test.ts` - Real active/candidate Match and Activation differential adapters beside the locked corpus.
- `packages/spec/src/semantic-integrity.ts` - Correct terminal-transition rule allowing causal events only before one final `MATCH_ENDED`.
- `packages/spec/src/semantic-integrity.test.ts` - Terminal prefix, duplicate terminal, and post-terminal regression cases.

## Decisions Made

- Boundary records carry both state-only and machine hashes. A `ROUND_STARTED` edge may preserve board state while still advancing the controlled cursor, so conflating the hashes would either lose an edge or invent gameplay mutation.
- The candidate preserves v1.4 activation IDs such as `1:1:0`. Kernel effect request IDs are separate and stage-specific; they do not rewrite historical event context.
- Recorder boundaries retain privacy-safe before/after state projections so Chronicle can snapshot Round, Activation, and contraction boundaries and later compare reconstructed gameplay hashes directly.
- The arbitrary-state Activation runner canonicalizes event sequence numbers. Its adapter consumes the existing locked Plan 03 terminal-push observation and normalizes that legacy observation's all-zero placeholder sequences; complete Match execution compares exact assigned sequences and events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added per-boundary state projections and a custom-state Activation runner**

- **Found during:** Task 1/Task 3 downstream Plan 13/18 preflight
- **Issue:** Initial/final recorder state and cursor-only hashes could not support per-slot Chronicle snapshots, reconstructed board-hash comparison, or migration of custom-state Activation fixtures without another test-owned scheduler.
- **Fix:** Added privacy-safe boundary projections, separate state/machine hashes, and a driver-owned arbitrary-valid-state Activation seam.
- **Verification:** Kernel contract, semantic boundary, and explicit Activation differential tests pass.
- **Committed in:** `237ed9d`, `1787394`

**2. [Rule 1 - Correctness] Narrowed terminal transition semantics**

- **Found during:** Task 2 semantic record validation
- **Issue:** The semantic validator rejected every causal event preceding `MATCH_ENDED`, although valid terminal edges can contain a fall, stone, or Backstab before the one terminal event.
- **Fix:** Require exactly one final `MATCH_ENDED` for terminal transitions and reject duplicate, post-terminal, or nonterminal occurrences.
- **Verification:** Focused semantic integrity regression tests pass.
- **Committed in:** `fbfbc7a`

**3. [Rule 3 - Blocking] Removed unowned legacy executable references from the differential test**

- **Found during:** Plan 15 executable-reference preflight after Plan 08 closeout
- **Issue:** The new Activation differential imported and called the tracked legacy helper from `compatibility-fixtures.test.ts`, creating two unowned exact references outside the Plan 11 baseline.
- **Fix:** Reused the already-captured terminal-push observation from the Plan 03 fixture module, which is the owned legacy evidence source, and removed both exact references from the test.
- **Verification:** Reference inventory tests pass 12/12 and baseline mode reports exactly 69 executable references and 13 non-executable mentions.
- **Committed in:** `a1e5c94`

---

**Total deviations:** 3 auto-fixed (1 missing critical seam, 1 correctness repair, 1 blocking ownership repair)
**Impact on plan:** Both changes are foundational for already-planned replay/fixture consumers and preserve current v1.4 observations.

## Issues Encountered

- The broad engine suite intentionally remains RED in exactly the eight pre-seeded Plan 09 cases: five parameterized excess-order cases plus the excess-order lifecycle contract, no-Advance terminal timing, and Cycle-end Backstab terminal reason. The other 83 engine tests pass. Plan 08 did not repair these ahead of their owned plan.
- Package-wide spec lint still reports six pre-existing bare `Buffer` references outside Plan 08 files. Targeted lint for every Plan 08 file passes; spec typecheck and tests pass.

## Verification

- Kernel contract, semantic boundary, current Match, and complete compatibility suites: **29/29 passed**.
- Full engine suite: **83 passed; 8 intentional Plan 09 RED failures** and no unexpected failures.
- Spec package test command: **72/72 passed**; focused semantic integrity suite: **8/8 passed**.
- Engine and spec typechecks: passed.
- Engine package lint and targeted Plan 08 lint/Prettier/diff checks: passed.
- Plan 11 executable-reference inventory: **12/12 tests passed**; `--baseline` reports exactly **69 exact references and 13 non-executable mentions**.
- Forbidden-loop inspection: candidate `step.ts` and `driver.ts` contain no `resolveRound`, `resolveActivationSelection`, or `resolveActivationCycle` call.
- Current `packages/spec/src/versions.ts` remains exactly `98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821`; active `match.ts` and `activation.ts` have no diff.
- Exact candidate tuple ID remains `sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae`.

## Protected Working Bytes

The two pre-existing dirty files were never staged or modified by this plan:

- `.planning/config.json` file hash `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff hash `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` file hash `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff hash `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.

## User Setup Required

None.

## Next Phase Readiness

- Plan 09 can repair the three approved lifecycle defect groups against one candidate step authority.
- Plans 10 and 13 can consume per-boundary safe projections and state hashes without replay owning Match scheduling.
- Plan 18 can migrate custom-state Activation fixtures through the candidate runner rather than the stale public helper.
- Plan 19 remains the sole owner of replacing active `runMatch` and current authority pointers.

## Self-Check: PASSED

- All four created kernel files exist and all three task commits are present.
- Focused Plan 08 gates are green; broad-engine failures are exactly the locked next-plan RED set.
- The Plan 11 executable-reference baseline remains exact with no new unowned reference.
- Active Match/Activation sources and current version bytes remain unchanged.
- Only the two protected pre-existing dirty files remain unstaged before this summary commit.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
