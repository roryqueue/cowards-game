---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "10"
subsystem: replay-recorder
tags: [chronicle, recorder, transition-stream, privacy, candidate-kernel]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: completed candidate execution with controlled recorder material
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact lifecycle repairs and terminal event ordering
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: authoritative executable-reference migration inventory
provides:
  - No-runtime transition-stream Chronicle recorder with typed fail-closed results
  - Exact event/private/snapshot compatibility for the migrated caller group
  - State-hash anchors for every recorded Chronicle boundary snapshot
  - Candidate recorder migration for test-utils, golden, Go fixture generation, runtime-js, and retired worker references
affects: [257-13, 257-14, 257-15, 257-16, 257-19, replay, persistence]
tech-stack:
  added: []
  patterns: [record completed execution, explicit semantic metadata, typed no-Chronicle failure, owner-private references]
key-files:
  created:
    - packages/replay/src/record.ts
    - packages/replay/src/record.test.ts
  modified:
    - packages/replay/src/index.ts
    - packages/test-utils/src/replay-scenarios.ts
    - packages/golden/src/parity.test.ts
    - scripts/generate-go-parity-fixtures.ts
    - packages/runtime-js/src/integration.test.ts
    - apps/worker/src/runner.ts
    - apps/worker/src/runner.test.ts
key-decisions:
  - "The recorder accepts one completed-or-failed candidate execution plus an exact candidate tuple and Chronicle schema label; it has no runtime, driver, reducer, or scheduling dependency."
  - "Candidate state hashes remain evidence beside the current Chronicle shape as boundaryAnchors, so Plan 13—not this plan—owns candidate replay validation semantics."
  - "Chronicle contexts are deterministically reconstructed from transition coordinates plus event-local context, preserving exact v1.4 Chronicle bytes without scheduling gameplay."
  - "Only explicitly owned private payloads from controlled recorder material receive private:event references; invalid ownership or any stream/hash/tuple drift yields a restricted system-integrity failure with no Chronicle."
patterns-established:
  - "Run once, record once: every migrated Chronicle caller drives CANDIDATE_MATCH_KERNEL exactly once and records that exact returned execution."
  - "Recorder compatibility proof: compare the candidate recorder directly with the legacy builder across final state, events, snapshots, and private sections before later replay activation."
requirements-completed: [KERN-01, KERN-02, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Completed executions record contiguous exact events, one terminal event, controlled private references, and state-hash-anchored snapshots without runtime or scheduling dependencies.
    requirement: KERN-02
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Failed execution and tampered event, boundary, or tuple material fail closed with no Chronicle object.
    requirement: KERN-10
    verification:
      - kind: unit
        ref: "packages/replay/src/record.test.ts#typed no-Chronicle and tamper matrix"
        status: pass
    human_judgment: false
  - id: D3
    description: Golden candidate recording is byte-equivalent to the staged v1.4 builder for state, events, snapshots, and private sections, and public projections remain leak-safe.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "packages/golden/src/parity.test.ts and direct old/candidate differential"
        status: pass
      - kind: integration
        ref: "scripts/generate-go-parity-fixtures.ts --check"
        status: pass
    human_judgment: false
  - id: D4
    description: Exactly the Plan-10 owner group has migrated while all later replay, service, persistence, Activation, and final-definition references remain staged.
    requirement: KERN-01
    verification:
      - kind: structural
        ref: "check-v1-37-executable-reference-inventory.ts --recorder-migrated"
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 10: Transition-Stream Chronicle Recorder Summary

**Completed candidate executions can now be recorded once into v1.4-compatible Chronicle evidence without replay invoking runtime code or reimplementing Match scheduling.**

## Performance

- **Duration:** 18 min
- **Completed:** 2026-07-13
- **Tasks:** 2
- **Files created/modified:** 10

## Accomplishments

- Added `recordChronicleFromExecution`, a recorder that accepts only candidate execution output and exact safe semantic metadata; it imports no runtime, kernel driver, reducer, legacy builder, or scheduling helper.
- Validates exact flattened events, global sequence continuity, one first `MATCH_STARTED`, one final `MATCH_ENDED`, candidate tuple identity, recorder-material equality, state-projection hashes, state-chain continuity, and explicit private ownership before producing evidence.
- Returns restricted typed system-integrity failures without a `chronicle` property for failed execution or any event, material, boundary, tuple, or ownership defect.
- Preserves v1.4 Chronicle event contexts, payloads, privacy, private references, snapshots, reproducibility, final state, and golden bytes while exposing a candidate semantic identity and one state-hash anchor per snapshot outside the historical Chronicle shape.
- Migrated exactly the Plan-10 owner group to one candidate execution and one recorder call per produced Chronicle; retained `buildChronicleFromMatch` and all later owner groups unchanged.
- Removed the obsolete Chronicle dependency injection seam and mock from the retired TypeScript worker.

## Task Commits

1. **RED: Define candidate Chronicle recorder contract** - `f47cbe9`
2. **Task 1 GREEN: Record candidate execution Chronicles** - `ce5126b`
3. **Task 2: Migrate recorder-owned Chronicle callers** - `958bc9a`

## Files Created/Modified

- `packages/replay/src/record.ts` - Fail-closed recorder, exact stream/material verification, owner-private recording, compatible snapshots, and state-hash anchors.
- `packages/replay/src/record.test.ts` - Success, privacy, failed-execution, event/hash/tuple tamper, and forbidden-dependency contracts.
- `packages/replay/src/index.ts` - Public recorder export while retaining the staged legacy builder.
- `packages/test-utils/src/replay-scenarios.ts` - Canonical replay scenarios now run and record the candidate exactly once.
- `packages/golden/src/parity.test.ts` - Candidate determinism, terminal evidence, content hash, privacy, and public DTO proof without invoking current replay semantics.
- `scripts/generate-go-parity-fixtures.ts` - Go service fixtures now derive Chronicles from one candidate execution and recorder call.
- `packages/runtime-js/src/integration.test.ts` - Runtime violation privacy evidence now records the exact candidate execution.
- `apps/worker/src/runner.ts` and `runner.test.ts` - Removed the obsolete retired-worker Chronicle dependency and mock.

## Decisions Made

- The recorder accepts the execution union so a failed candidate attempt can be rejected by the same boundary with a typed, non-retryable, system-owned no-Chronicle result.
- Safe metadata contains only `schemaVersion`, `semanticTupleId`, and the six-component semantic tuple. Unknown or current-identity-by-declaration data is not accepted.
- Current Chronicle snapshots have no hash field. The recorder therefore returns ordered `boundaryAnchors` beside the Chronicle rather than altering or falsely relabeling the historical schema; Plan 13 owns reconstruction and candidate semantic validation.
- Context enrichment is recording, not scheduling: the recorder uses already-emitted transition coordinates and event-local context to reproduce v1.4 Chronicle contexts exactly.
- The migrated golden test no longer feeds a candidate Chronicle into current `createReplay`. It checks exact terminal state/snapshot/hash evidence here; Plan 13 owns candidate replay activation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Restored canonical JSON-safe controlled payload cloning**

- **Found during:** Runtime-js integration verification
- **Issue:** `structuredClone` preserved an `undefined` field inside controlled private objective material. The Chronicle type claimed JSON, but current schema projection correctly rejected the non-JSON value.
- **Fix:** Clone controlled public and private payloads through JSON serialization, matching the existing builder's private sanitization and removing non-JSON members without admitting arbitrary metadata.
- **Verification:** Runtime-js passes 186/186; public/owner projection assertions pass; the candidate recorder and legacy builder are private-section identical.
- **Committed in:** `958bc9a`

**2. [Rule 1 - Correctness] Reconstructed historical event context from recorded coordinates**

- **Found during:** Go parity fixture validation
- **Issue:** Raw engine summaries intentionally omit some Round fallback context, while persisted v1.4 Chronicles require `ROUND_STARTED.context.roundNumber` and historically merge Round/phase context during recording.
- **Fix:** Build fallback context solely from each already-recorded transition's coordinates, then overlay exact event-local context. No action selection, lifecycle edge, or runtime invocation is performed.
- **Verification:** Go fixture `--check` passes with no file changes; direct old-builder/candidate-recorder events and complete Chronicles are exact.
- **Committed in:** `958bc9a`

---

**Total deviations:** 2 auto-fixed correctness issues
**Impact on plan:** Both repairs are recorder-local, preserve v1.4 evidence exactly, and do not activate current candidate replay semantics.

## Issues Encountered

- The root fixture-generation script cannot resolve workspace package imports directly under its standalone `tsx` invocation, so it retains the repository's existing direct-source import convention. Targeted lint for every package/app file changed by this plan passes; the script's pre-existing restricted-import lint posture remains unchanged.
- No golden delta occurred. Go fixture check and direct candidate/legacy Chronicle comparison are both exact.

## Verification

- Recorder contract: **7/7 passed**.
- Engine compatibility and lifecycle focus: **29/29 passed**.
- Golden parity: **3/3 passed**.
- Runtime-js package: **186/186 passed**.
- Retired worker: **34/34 passed**.
- Replay, test-utils, golden, runtime-js, and worker typechecks: passed.
- Candidate versus staged legacy golden differential: exact final state, events, snapshots, and private sections.
- Go parity fixtures: `--check` passed without regeneration or file delta.
- Recorder-migrated inventory: exactly **56 executable references and 13 non-executable mentions**; no Plan-10 owner references remain.
- Worker retirement monitor: `worker_retirement_findings=0`.
- v1.37 integrity boundary monitor: passed with `files=295 creation_calls=5 sql_writers=9 legacy_worker_consumers=4`.
- Targeted Prettier, ESLint, and diff checks: passed.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff remains `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff remains `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
- Neither protected file was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Plan 13 can consume the Chronicle plus ordered state-hash anchors to add candidate semantic validation and reconstruction equivalence without replay scheduling a Match.
- Plans 14-16 can migrate their owned fixture, runtime-service, and persistence callers after Plan 13 defines candidate replay semantics.
- Plan 19 remains the sole owner of removing the legacy builder definition and activating candidate Match execution as current.

## Self-Check: PASSED

- Recorder source/tests and all three Plan-10 commits exist.
- Exact owner migration inventory, golden compatibility, privacy projections, and focused package gates are green.
- No later-owned executable reference, current replay semantic authority, manifest, STATE, ROADMAP, or protected file was changed.
- Only the two protected pre-existing dirty files remain unstaged before this summary commit.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
