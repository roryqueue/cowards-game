---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "05"
subsystem: bounded-successor-json-admission
tags: [canonical-json, raw-byte-admission, field-caps, runtime-service, compatibility-audit]
requires:
  - phase: 258-03
    provides: Iterative bounded raw scanner/parser and exact byte-bound receipts
  - phase: 258-04
    provides: Iterative canonical encoder and successor identity framing
  - phase: 258-06
    provides: Exclusive v1.17 result ABI and authenticated candidate envelope
provides:
  - Profile-aware canonical JSON facade for raw bytes and already-materialized values
  - Method-bound successor payload schemas with exact StrategyMemory, SoldierMemory, and objective caps
  - Raw runtime-service candidate admission with system-owned outer corruption and player-owned decoded payload faults
  - Typed non-throwing permanent deep audit with an executable valid-v1.4 compatibility stop
affects: [258-07, 258-08, 258-09, 258-10, 258-11, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Preserve raw transport bytes until profile-owned canonical admission completes
    - Share one cycle-free successor payload schema between the ABI and runtime-service
    - Bind successful payload shape and lower caps to the authenticated invocation method
key-files:
  created:
    - packages/spec/src/canonical-json.ts
    - packages/spec/src/canonical-json-boundaries.test.ts
    - packages/spec/src/runtime-payload-v1-17.ts
  modified:
    - packages/spec/src/runtime-invocation-v1-17.ts
    - packages/spec/src/schemas.ts
    - apps/runtime-service/src/server.ts
    - apps/runtime-service/src/server.test.ts
    - .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
key-decisions:
  - "Outer authenticated-envelope corruption remains a redacted system failure; only canonical/schema-invalid decoded Strategy payload bytes are player violations."
  - "A successful v1.17 result is method-bound and cannot be authenticated unless its StrategyMemory, SoldierMemory, and objective values satisfy their lower canonical-byte profiles."
  - "Current v1.16 HTTP dispatch and its insertion-ordered proof bytes remain unchanged; Plan 05 installs candidate admission helpers without activating the successor."
patterns-established:
  - "Raw bytes are scanned and materialized before any recursive domain schema; bounded successor schemas may run only after canonical admission."
  - "The permanent audit fails immediately on any valid-v1.4 lifecycle, event, outcome, boundary, or observation delta."
requirements-completed: [RABI-01, RABI-02, RABI-03]
coverage:
  - id: D1
    description: "Every successor JSON profile enforces the frozen global ceilings and exact lower field caps with typed owner-preserving errors before recursive domain validation."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: "packages/spec/src/canonical-json-boundaries.test.ts (10/10)"
        status: pass
      - kind: unit
        ref: "packages/spec/src canonical suite (242/242)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Depth 3,000 raw and materialized values return MAX_DEPTH_EXCEEDED without throwing, while valid values are canonically re-encoded and hash-bound."
    requirement: RABI-02
    verification:
      - kind: other
        ref: ".planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
        status: pass
      - kind: unit
        ref: "canonical-json-boundaries.test.ts#rejects deep materialized values iteratively"
        status: pass
    human_judgment: false
  - id: D3
    description: "Runtime-service candidate admission preserves raw bytes, redacts system-owned outer corruption, classifies decoded payload faults as player-owned, and accepts valid method payloads."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "apps/runtime-service/src/server.test.ts (62/62 package suite)"
        status: pass
      - kind: other
        ref: "canonical JSON go-missing receipt (70 vectors)"
        status: pass
    human_judgment: false
duration: 22min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 05: Bounded Successor JSON Admission Summary

**Successor spec and runtime-service boundaries now preserve raw bytes through bounded canonical admission, enforce method-specific nested caps, and return typed owner-correct failures without changing active v1.16 behavior or valid v1.4 gameplay.**

## Performance

- **Duration:** 22 min active execution and review
- **Started:** 2026-07-14T01:23:31-04:00
- **Completed:** 2026-07-14T10:14:02-04:00 after interruption
- **Tasks:** 2 TDD tasks plus 2 review fixes
- **Files created:** 3
- **Files modified:** 7

## Accomplishments

- Added one profile-aware facade that scans raw bytes, materializes only receipt-bound tokens, re-encodes canonically, returns exact canonical hashes/lengths, and maps lower-profile overflow to `FIELD_CAP_EXCEEDED` without loosening any global ceiling.
- Replaced the successor invocation ABI's recursive generic success value with method-bound `selectActivations` and `soldierBrain` payload schemas that enforce 32 KiB StrategyMemory, 2 KiB SoldierMemory, and 1 KiB objective caps.
- Added runtime-service candidate helpers that retain raw request bytes, classify unauthenticated or undecodable outer envelopes as redacted system failures, and classify canonical or schema-invalid decoded Strategy payloads as player violations.
- Updated the permanent live audit so the depth-3,000 reproduction reports `rejected:MAX_DEPTH_EXCEEDED:player_violation` rather than throwing `RangeError`, and added an executable compatibility stop across all Phase-257 lifecycle observations.
- Preserved the inactive-candidate posture and every protected v1.16 proof byte; no current endpoint, default ABI, historical Chronicle, or valid v1.4 state/action/event/outcome/observation changed.

## Task Commits

1. **Task 1 RED: Add failing successor admission gates** — `fb552f4` (test)
2. **Task 1 GREEN: Install bounded successor JSON admission** — `6765d93` (feat)
3. **Task 2 RED: Add failing raw service admission gates** — `924e5d8` (test)
4. **Task 2 GREEN: Gate successor service raw admission** — `86ffa53` (feat)
5. **Review RED: Expose nested successor cap gaps** — `e38876e` (test)
6. **Review fix: Bind nested successor payload caps** — `fb40659` (fix)
7. **Review fix: Stabilize full corpus scan gate** — `35b973b` (fix)

## Verification

- Complete `packages/spec/src` suite passed 242/242 across 24 files; the stable spec package suite remained 73/73.
- Runtime-service suite passed 62/62 across seven files; spec and runtime-service typechecks and lints passed.
- Canonical expected-RED verifier retained exactly 70 vectors, the `go-missing` stage, and root `f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0`.
- Permanent audit returned the exact typed depth failure and all six lifecycle/compatibility observations without a compatibility stop.
- Protected `.planning/config.json`, the consolidated v1 spec, active v1.16 service source, wire golden, and Go client remained unstaged and byte-unchanged by this plan.

## Decisions Made

- Keep the new payload schemas in a cycle-free successor module shared by the invocation ABI and runtime-service instead of duplicating lower-cap logic or importing the legacy recursive schema graph.
- Match `success.value` to `trace.method` at runtime-schema admission; a `soldierBrain` payload cannot be authenticated as `selectActivations`, or vice versa.
- Preserve legacy permissive object parsing semantics for valid fields while enforcing canonical successor byte profiles before domain validation; this plan does not tighten valid v1.4 gameplay.

## Deviations from Plan

### Auto-fixed Issues

1. **[High - Correctness] Authenticated success accepted over-cap nested values.**
   - **Found during:** Independent post-GREEN adversarial review
   - **Issue:** `RuntimeInvocationResultV117Schema` enforced only the 256 KiB aggregate payload profile, so it could authenticate a success containing StrategyMemory, SoldierMemory, or an objective above its frozen lower cap even though the service helper rejected the same value.
   - **Fix:** Added three failing vectors, moved successor payload schemas to one shared module, bound success shape to `trace.method`, and made runtime-service consume the same schemas.
   - **Verification:** Focused successor/service suite passed 35/35 and all three prior counterexamples now fail schema admission.
   - **Committed in:** RED `e38876e`, GREEN `fb40659`

2. **[Warning - Gate stability] Full concurrent scanner corpus used Vitest's default timeout.**
   - **Found during:** Complete post-fix spec regression
   - **Issue:** The exact 67-vector scanner gate passed alone but reached 5.089 seconds under the full concurrent suite and timed out at the implicit five-second default.
   - **Fix:** Declared the same explicit 20-second budget already used by the encoder and aggregate corpus tests.
   - **Verification:** Complete spec source suite passed 242/242 in 9.10 seconds.
   - **Committed in:** `35b973b`

**Total deviations:** 2 auto-fixed (1 correctness, 1 gate stability). **Impact:** Stronger authenticated lower-cap enforcement and reproducible full-suite proof with no current-runtime or gameplay activation.

## Issues Encountered

The active v1.16 service still intentionally uses its historical HTTP+JSON path. Plan 05 added explicit candidate raw-admission seams but did not rewrite or activate current dispatch; the atomic successor flip remains owned by Plan 258-14.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-07 can now rely on one method-bound three-way payload contract and implement engine-only penalties, unchanged-state system failures, and identical-request retries without accepting oversized nested state.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
