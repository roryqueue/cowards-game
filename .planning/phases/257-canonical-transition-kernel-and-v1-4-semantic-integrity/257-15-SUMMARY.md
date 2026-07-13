---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "15"
subsystem: runtime-service-candidate-staging
tags: [runtime-service, candidate-kernel, chronicle, authority, privacy, replay]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: exact candidate transition driver and semantic tuple
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: transition-stream Chronicle recorder plus candidate validation and reconstruction
  - phase: 256-counted-safety-and-canonical-authority
    provides: containment authority, exact lane identity, and three-load drift timing
provides:
  - Internal non-public candidate-exhibition service staging with one driver invocation and one recording
  - Exact candidate tuple, revision, containment, lane, and authority admission without publication or counted authority
  - Redacted non-penalizing failure ownership through driver, semantic, recorder, replay, and authority boundaries
  - Runtime-service/build test migration while preserving the active old production caller for Plan 19
affects: [257-16, 257-19, runtime-service, replay, persistence, counted-scheduling]
tech-stack:
  added: []
  patterns: [internal candidate brand, triple-load authority, execute-once-record-once, bounded failure ownership]
key-files:
  created: []
  modified:
    - apps/runtime-service/src/execute-match.ts
    - apps/runtime-service/src/execute-match.test.ts
    - apps/runtime-service/src/counted-safety.test.ts
    - apps/runtime-service/src/semantic-integrity.test.ts
    - packages/replay/src/build.test.ts
key-decisions:
  - "Candidate staging is a test-only internal function with candidate_exhibition/count:false/nonpublishable branding; it is deliberately absent from HTTP and public request/response schemas."
  - "Candidate admission reuses the current containment authority and three-load drift timing but does not fabricate candidate publication, install, or conformance receipts."
  - "Player violations remain completed gameplay; runtime-system and system-integrity failures return no result or Chronicle and never become a player penalty."
  - "The active old production builder and its two definitions remain untouched until the atomic current switch in Plan 19."
patterns-established:
  - "Candidate service chain: exact request -> authority load -> revision/artifact checks -> authority reload -> driver once -> final semantics -> recorder once -> candidate validation/reconstruction -> authority reload -> internal success."
  - "Any failure before final authority confirmation discards all in-memory gameplay evidence and returns only bounded ownership, code, retryability, and playerPenalty:false."
requirements-completed: [KERN-01, KERN-02, KERN-03, KERN-07, KERN-10, KERN-11]
coverage:
  - id: D1
    description: An exact internal candidate exhibition invokes the candidate driver once, records once, validates, reconstructs, and confirms authority before returning non-current evidence.
    requirement: KERN-01
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/execute-match.test.ts#stages exact candidate exhibition internally with three authority loads and no public current claim"
        status: pass
    human_judgment: false
  - id: D2
    description: Player violations remain gameplay while driver, semantic, recorder, reconstruction, and authority failures remain redacted, non-penalizing, and boundary-retryable.
    requirement: KERN-07
    verification:
      - kind: unit
        ref: "apps/runtime-service/src/execute-match.test.ts candidate failure matrix and apps/runtime-service/src/semantic-integrity.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Public/current, counted, partial, mixed, conformance, and stale-revision routes cannot admit the unregistered candidate tuple.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/execute-match.test.ts admission rejection table and public response-schema rejection"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#inactive candidate"
        status: pass
    human_judgment: false
  - id: D4
    description: Sixteen owned test/build references moved to candidate execution while the active old production path and historical behavior remain staged for Plan 19.
    requirement: KERN-10
    verification:
      - kind: other
        ref: "scripts/check-v1-37-executable-reference-inventory.ts --runtime-service-ready"
        status: pass
      - kind: integration
        ref: "full runtime-service, replay, and engine package suites"
        status: pass
    human_judgment: false
duration: 30min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 15: Candidate Runtime-Service Staging Summary

**The runtime service can now execute, record, semantically validate, reconstruct, and authority-confirm the inactive candidate kernel without making it public, current, counted, or publishable.**

## Accomplishments

- Added an exact internal `candidate_exhibition` request and result contract. It requires `counted: false`, the complete inactive tuple, candidate-compatible revalidated revisions, containment-only entrant evidence, and no publication/conformance fields.
- Reused Phase-256 authority safety at acceptance, immediately before invocation, and after replay reconstruction. Revoked, superseded, disabled, mismatched, unavailable, or drifted authority fails closed and discards any completed in-memory result.
- Runs `CANDIDATE_MATCH_KERNEL.runMatch` once, validates the exact runtime-final state, records the same execution once, validates and reconstructs that recording, and binds success to its exact terminal hash and outcome.
- Preserved failure ownership and retryability: player violations remain successful gameplay; runtime-system and system-integrity failures expose no Chronicle/result, never mutate gameplay, and always carry `playerPenalty: false`.
- Proved candidate request rejection for current, partial, mixed, counted, conformance-bearing, and stale-revision inputs before unauthorized calls. The same candidate result is rejected by the public response schema and the request is rejected by the public service entry point.
- Migrated all sixteen Plan-15-owned old-builder references from runtime-service and replay build tests. The inventory now passes at **10 exact references and 12 non-executable mentions**, leaving only the explicitly deferred production caller/definitions and later-plan owners.
- Replaced replay build fixtures with one candidate execution and one recording while retaining event, snapshot, Awareness Grid privacy, terminal-outcome, and failed-execution assertions.

## Task Commits

1. **Task 1: Stage tuple-routed candidate service execution and migrate owned callers** — `e35b288`

## Files Modified

- `apps/runtime-service/src/execute-match.ts` — Internal exact candidate request/result types, admission, triple-load authority verification, single-driver/recorder chain, and bounded failure projection.
- `apps/runtime-service/src/execute-match.test.ts` — Candidate success, admission rejection, player/system/recorder/reconstruction/drift, privacy, and public-schema tests.
- `apps/runtime-service/src/counted-safety.test.ts` — Active-old triple-load regressions without Plan-15-owned builder seams.
- `apps/runtime-service/src/semantic-integrity.test.ts` — Invalid candidate runtime-final state fails before recorder/replay calls.
- `packages/replay/src/build.test.ts` — Candidate run-once/record-once event, private Awareness Grid, outcome, and failed-recording fixtures.

## Decisions Made

- The candidate entry point is exported only as `executeCandidateExhibitionForTest` and documented internal/test-only. No HTTP route, public schema, counted scheduler, publication path, or authority manifest recognizes it.
- Existing containment certificates may prove that the exact runtime lane is contained, but they do not claim that the candidate semantic tuple is installed or conformant. Candidate publication receipts are neither required nor invented.
- Final semantic validation happens before recording. Recorder and replay failures occur after completed gameplay in memory but still return no canonical evidence or player-facing result.
- Authority is checked a third time only after recording and reconstruction. A late registry change therefore discards the otherwise complete candidate result.
- Existing active-old execution stays byte-for-byte on its old builder path until Plan 19; this plan stages the replacement without a mixed-current period.

## Deviations from Plan

None in shipped scope. The plan's forecast expected 13 non-executable inventory mentions; the current checker accepts and reports 12 because concurrent cleanup had already removed one comment-only mention. The required executable count is exactly 10 and passes.

## Issues Encountered

- The first full runtime-service run reported a one-off runtime violation in the four-language pairwise corpus and a separate one-off Zig compile failure. Both tests passed immediately in isolated reruns, and the complete runtime-service suite then passed **69/69** unchanged. No golden, runtime, or timeout was modified.
- Concurrent replay integrity review briefly exposed an incomplete validator state while Plan 15 tests were running. After the review fixes settled (`e3bc438`, `33f90bf`, `3ded72e`), normal candidate, player-violation, privacy, reconstruction, replay, and type gates all passed.
- The broad `v1.37:integrity-boundaries:check` intentionally reports the three repaired Phase-257 lifecycle observations as drift from the immutable Phase-256 RED audit baseline. Phase-257 planning explicitly forbids rewriting that baseline and assigns the repair delta artifact/check to Plan 20. This is an expected later-plan gate, not a Plan-15 failure.

## Verification

- Full runtime-service package: **69/69 passed** across 7 files on the final rerun.
- Plan-15 runtime-service focus: **45/45 passed** across execute, counted-safety, and semantic-integrity tests.
- Full replay package after review hardening: **162/162 passed** across 13 files.
- Full engine package after review hardening: **115/115 passed** across 15 files.
- Replay build/record focus: **16/16 passed**.
- Runtime-service, replay, and engine TypeScript builds: passed.
- Inactive candidate persistence-publication negative: **1/1 passed** against PostgreSQL.
- Inactive kernel candidate generator check: current.
- v1.37 integrity-authority check: current.
- Runtime-service-ready executable inventory: passed with **10 exact references and 12 non-executable mentions**.
- Targeted ESLint, Prettier, `git diff --check`, source/artifact privacy assertions, and protected-byte checks: passed.
- Shared repository lint and typecheck after concurrent review remediation: passed.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff remains `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff remains `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
- Neither protected file, `STATE.md`, nor `ROADMAP.md` was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Plan 16 can persist candidate evidence only after the same exact non-public admission and reconstruction contract succeeds.
- Plan 19 remains the sole owner of registering the candidate tuple, switching the public/current service path atomically, and removing the final old caller/definitions.
- Plan 20 must write the separate Phase-257 audit result/delta artifact against the immutable Phase-256 RED baseline; the expected observation drift is already visible and bounded to the repaired lifecycle probes.

## Self-Check: PASSED

- All five planned implementation/test files and task commit `e35b288` exist.
- All sixteen owned old-builder references are removed; later-plan production references remain.
- Candidate evidence remains internal, non-current, nonpublishable, and never counted.
- Focused/full service, replay, engine, type, authority, persistence-negative, inventory, lint, format, privacy, and protected-byte gates pass.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
