---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "14"
subsystem: replay-fixtures
tags: [replay, chronicle, candidate-kernel, recorder, historical-v1-4]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: transition-stream Chronicle recorder with private material and boundary anchors
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact candidate semantic validation and reconstruction routes
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: staged executable-reference inventory
provides:
  - Candidate run-once/record-once fixtures for determinism, grammar, integration, reconstruction, and snapshot boundaries
  - Explicit literal historical routing for the hand-authored v1.4 movement Chronicle
  - Passive empty-selection candidate admission through Contraction without counterfeit Activation evidence
affects: [257-15, 257-16, 257-19, replay, runtime-service, persistence]
tech-stack:
  added: []
  patterns: [one execution one recording, candidate validation before fixture use, literal historical versions]
key-files:
  created: []
  modified:
    - packages/replay/src/determinism.test.ts
    - packages/replay/src/grammar.test.ts
    - packages/replay/src/integration.test.ts
    - packages/replay/src/reconstruct.test.ts
    - packages/replay/src/snapshot-boundaries.test.ts
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts
key-decisions:
  - "Every generated fixture invokes CANDIDATE_MATCH_KERNEL once, records that exact execution once, and validates or reconstructs it through the inactive candidate route without becoming current or publishable."
  - "The hand-authored movement Chronicle pins all six literal v1.4 versions and enters through the explicit historical profile instead of importing live compatibility versions."
  - "Activation, Awareness, and Action events are conditionally required by lifecycle grammar, not globally required for a completed candidate Match whose valid empty selections produce no Activation window."
patterns-established:
  - "Fixture trust chain: candidate execution -> exact recorder -> semantic admission -> focused assertion; no fixture-owned scheduling loop."
  - "Historical handcrafted evidence never inherits mutable current version constants."
requirements-completed: [KERN-02, KERN-10, KERN-11]
coverage:
  - id: D1
    description: All five generated replay fixture groups use one candidate execution and one recording per produced Chronicle.
    requirement: KERN-02
    verification:
      - kind: unit
        ref: "packages/replay/src/determinism.test.ts, grammar.test.ts, integration.test.ts, reconstruct.test.ts, snapshot-boundaries.test.ts"
        status: pass
      - kind: structural
        ref: "check-v1-37-executable-reference-inventory.ts --replay-fixtures-ready"
        status: pass
    human_judgment: false
  - id: D2
    description: Deterministic hashes, event grammar, private owner projections, reconstruction, and Round/Contraction/terminal snapshot behavior remain compatible.
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "Plan 14 six-file replay fixture gate"
        status: pass
      - kind: compatibility
        ref: "packages/engine/src/compatibility-fixtures.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Frozen historical v1.4 movement evidence retains literal versions and explicit historical validation.
    requirement: KERN-11
    verification:
      - kind: historical
        ref: "scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false
duration: 16min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 14: Replay Fixture Migration Summary

**All general replay fixtures now consume one recorded candidate execution instead of initiating the duplicate Match builder, with historical movement evidence explicitly pinned to v1.4.**

## Accomplishments

- Removed exactly ten Plan-14-owned executable references: one `buildChronicleFromMatch` import and one call from each of the five fixture files.
- Determinism fixtures now create independent candidate executions for each intended comparison, record each once, and compare normalized Chronicle bytes and content hashes after candidate semantic admission.
- Grammar and snapshot-boundary fixtures validate their generated baseline evidence through the exact inactive candidate route before applying focused corruptions.
- Integration now proves the complete candidate chain: execute once, record once, add the canonical content hash, validate as non-current/non-publishable, reconstruct, iterate, and project public/owner views.
- Candidate reconstruction tests use `createCandidateReplay`; the hand-authored movement fixture uses literal frozen v1.4 versions and explicit `historical-v1.4` dispatch.
- Preserved controlled private Strategy memory, Soldier memory, objectives, and Awareness Grid payloads in owner-only material while public output remains free of every marker.
- Preserved globally contiguous events, state-only boundary hashes, Round/Contraction/terminal snapshot anchors, exact terminal outcome, and one final `MATCH_ENDED`.

## Task Commits

1. **Plan 13 integration fix: Admit passive candidate Chronicles** — `8379f6e`
2. **Task 1: Migrate all five replay fixture callers** — `c97e6ed`

## Files Modified

- `packages/replay/src/determinism.test.ts` — Independent candidate execution/recording for normalized byte and hash comparisons.
- `packages/replay/src/grammar.test.ts` — Candidate-recorded legal grammar baseline before event-window mutations.
- `packages/replay/src/integration.test.ts` — End-to-end candidate validation, reconstruction, hashing, iteration, and privacy projection.
- `packages/replay/src/reconstruct.test.ts` — Candidate reconstruction plus literal frozen historical movement replay route.
- `packages/replay/src/snapshot-boundaries.test.ts` — Candidate-recorded Round, Contraction, Match-end, and terminal boundary fixtures.
- `packages/replay/src/validate.ts` and `validate.test.ts` — Conditional candidate lifecycle requirements and passive Contraction/universal-event regressions.

## Decisions Made

- Generated candidate Chronicles are never passed off as current evidence. Every helper carries the exact candidate tuple identity and ordered recorder anchors into Plan 13 admission.
- The integration content hash is added after recording, then verified by candidate semantic validation; tuple identity is not hidden in unhashed `storageMetadata`.
- The handcrafted movement Chronicle cannot import `COMPATIBILITY_VERSIONS`. Its original six values are frozen literally beside the fixture and it first enters replay through `profile: "historical-v1.4"`.
- The historical helper validates the frozen route before using the read-only replay iterator; it does not execute runtime code or decide lifecycle edges.

## Deviations from Plan

### Auto-fixed Issue

**Candidate validation globally required events from an Activation window that might never exist**

- **Found during:** Passive Contraction snapshot fixture migration
- **Issue:** A valid candidate Match with empty Activation selections reached max-phase Contraction and terminal outcome without `ACTIVATION_STARTED`, `AWARENESS_GRID_OBSERVED`, or `ACTION_EMITTED`. Plan 13 admission incorrectly rejected it as `CANDIDATE_EVENT_INVALID` because those conditional classes were globally required.
- **Fix:** Candidate completion now globally requires only Match, Round, Strategy, and terminal event classes. Existing grammar validates Activation/Cycle windows exactly when they occur. Current and historical routes were not changed.
- **Regression:** Added a passive empty-selection Contraction success case and exact missing-universal-event negatives.
- **Verification:** Plan 13 focus passes 51/51 and full replay passes 157/157.
- **Committed in:** `8379f6e`

---

**Total deviations:** 1 auto-fixed correctness issue
**Impact on plan:** The fix admits a valid already-produced candidate event stream without inventing events, changing gameplay, relaxing current/history, or updating a golden.

## Issues Encountered

- The preflight inventory contained 36 exact references because Plan 18 had already removed its 16 references. Removing the ten Plan 14 references produced the expected **26** remaining references: Plan 15 owns 16, Plan 16 owns 2, and Plan 19 owns 8.
- No historical artifact, deterministic hash expectation, privacy expectation, snapshot expectation, or locked v1.4 compatibility fixture changed.

## Verification

- Plan 14 fixture plus recorder gate: **57/57 passed** across 6 files.
- Plan 13 semantic/reconstruction focus after integration fix: **51/51 passed**.
- Full replay package: **157/157 passed** across 13 files.
- Locked v1.4 compatibility corpus: **14/14 passed** with no unexplained delta.
- v1.36 historical proof: passed with **8 artifacts and 11 sources**.
- Replay TypeScript project build: passed.
- Replay-fixtures-ready inventory: passed with **26 exact references and 13 non-executable mentions**.
- Targeted ESLint, Prettier, forbidden builder/live-version/storage-metadata scan, and `git diff --check`: passed.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff remains `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff remains `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
- Neither protected file, `STATE.md`, nor `ROADMAP.md` was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Plan 15 can migrate the 16 runtime-service/build-test references onto the same run-once/record-once candidate evidence path.
- Plan 16 can migrate the two persistence references after service admission is stable.
- Plan 19 remains the only owner of the final eight references and candidate current-identity activation.

## Self-Check: PASSED

- All five planned fixture files and both task/fix commits exist.
- Exactly ten Plan 14 executable references were removed; no later owner was migrated.
- Candidate fixtures remain non-current and historical movement evidence uses literal pinned versions.
- Focused/full replay, compatibility, history, inventory, typecheck, lint, format, and protected-byte gates pass.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
