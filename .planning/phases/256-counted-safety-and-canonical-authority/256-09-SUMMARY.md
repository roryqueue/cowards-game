---
phase: 256-counted-safety-and-canonical-authority
plan: "09"
subsystem: runtime-service-authority
tags: [ed25519, anti-rollback, containment, conformance, toctou, privacy]
requires:
  - phase: 256-02
    provides: executable lane eligibility and certificate evidence rules
  - phase: 256-03
    provides: atomic semantic tuple and ordered execution identity contract
  - phase: 256-17
    provides: signed reference-only authority envelope and durable anti-rollback contract
  - phase: 256-18
    provides: production-empty certificate authority and verified evidence graph
provides:
  - independently verified mounted runtime authority before service startup
  - exact per-side authority enforcement at acceptance, pre-invocation, and post-execution
  - status-conditioned exhibition and counted execution with redacted zero-result drift failure
affects: [go-runtime-client, service-proof, phase-259-conformance, phase-261-release]
tech-stack:
  added: []
  patterns: [single-descriptor signed authority reads, durable high-water activation, three-point execution recheck, reference-only fixture authority]
key-files:
  created:
    - apps/runtime-service/src/runtime-evidence-authority.ts
    - apps/runtime-service/src/runtime-evidence-authority.test.ts
    - apps/runtime-service/src/counted-safety.test.ts
  modified:
    - apps/runtime-service/src/execute-match.ts
    - apps/runtime-service/src/server.ts
    - apps/runtime-service/src/index.ts
    - apps/runtime-service/src/execute-match.test.ts
    - apps/runtime-service/src/four-language-parity.test.ts
    - apps/runtime-service/src/runtime-execution-evidence.test-support.ts
key-decisions:
  - "Runtime-service trusts only the freshly loaded signed mounted authority; request references are compared but never promoted into proof."
  - "Exhibition requires exact current containment only, while counted execution requires exact current containment and conformance for each side."
  - "Any pre/post authority drift is a retryable redacted system failure and no in-memory Match result crosses the service boundary."
patterns-established:
  - "Authority timing: load at request acceptance, reload immediately before runtime creation/invocation, and reload after Match execution before returning success."
  - "Decision binding: a domain-separated framed hash binds the scheduler decision ID to tuple, bundle, generation, entrant, lane, status, and status-conditioned certificate references."
requirements-completed: [SAFE-01, SAFE-02, SAFE-04, AUTH-03]
coverage:
  - id: D1
    description: "Mounted runtime authority verifies exact Ed25519 bytes, validity, trust domain, deployment pin, and durable restart-safe high-water state before startup"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "apps/runtime-service/src/runtime-evidence-authority.test.ts#mounted runtime evidence authority"
        status: pass
      - kind: unit
        ref: "apps/runtime-service/src/runtime-evidence-authority.test.ts#fails the production entrypoint safely before server creation or listen"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every Strategy execution rechecks exact per-side containment, conformance, decision, lane, tuple, generation, revocation, and disable state before and after invocation"
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/counted-safety.test.ts#runtime-service counted safety"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/runtime-service typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fixture-only direct and four-language executions remain reference-only, exhibition-shaped, and incapable of satisfying production trust"
    requirement: SAFE-04
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/execute-match.test.ts#runtime execution service"
        status: pass
      - kind: integration
        ref: "apps/runtime-service/src/four-language-parity.test.ts#v1.32 four-language golden Strategy corpus"
        status: pass
    human_judgment: false
duration: 34min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 09: Runtime-Service Authority Enforcement Summary

**Runtime-service now starts and executes only against one independently verified mounted authority, with exact per-side three-point rechecks and failure-safe result discard.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-07-13T06:31:54Z
- **Completed:** 2026-07-13T07:05:26Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Added a DB-free mounted authority loader using bounded single-descriptor reads, independent Node Ed25519 verification, strict payload/graph/freshness checks, deployment pins, fixture-domain rejection in production, and durable atomic high-water activation before startup.
- Bound both Strategy sides to exact tuple, bundle generation/hash, lane, scheduling-decision hash, status-conditioned certificate pairs, revocations, supersessions, and operator disables at acceptance and immediately before invocation.
- Reverified authority after execution and discarded all Chronicle, final state, memory, success, and player-fault surfaces when any in-flight authority drift occurred, returning only a schema-valid redacted retryable system failure.

## Task Commits

1. **Task 1 RED: mounted authority trust-chain cases** - `d9493b5` (test)
2. **Task 1 GREEN: independent startup authority loader** - `ff63cb5` (feat)
3. **Approved D-02 contract correction: containment-only exhibition shape** - `19d2bac` (fix)
4. **Task 2 RED: per-invocation authority matrix** - `b887ee2` (test)
5. **Task 2 GREEN: exact pre/post authority enforcement** - `39e99db` (feat)

## Files Created/Modified

- `apps/runtime-service/src/runtime-evidence-authority.ts` - Independently verifies signed mounted bundles and durably advances anti-rollback high water before returning authority.
- `apps/runtime-service/src/runtime-evidence-authority.test.ts` - Covers signatures, trust, freshness, graph closure, bootstrap, atomic writes, failures, concurrency, rollback, and restart.
- `apps/runtime-service/src/counted-safety.test.ts` - Covers exhibition/counted acceptance, exact reference mismatch, kill switch, revocation, unavailable authority, and pre/post drift with no returned gameplay.
- `apps/runtime-service/src/execute-match.ts` - Compares both sides against fresh authority at three execution boundaries and binds opaque scheduling decisions to exact authority references.
- `apps/runtime-service/src/server.ts` and `apps/runtime-service/src/index.ts` - Pass the verified loader into execution and fail startup before server creation/listening.
- `apps/runtime-service/src/runtime-execution-evidence.test-support.ts` - Creates explicit fixture-domain authority and reference-only status-conditioned requests.
- `apps/runtime-service/src/execute-match.test.ts` and `apps/runtime-service/src/four-language-parity.test.ts` - Execute only through paired fixture authority without implying counted or production eligibility.

## Decisions Made

- A loader result is the only service-side authority object. The request may identify the expected bundle, tuple, decision, lane, and certificates, but none of those request fields can establish trust.
- Exhibition-only requests must identify exact current containment and no conformance; counted requests must identify exact current containment plus conformance. A newer conformance certificate makes an older exhibition reference stale rather than silently upgrading it.
- Any load failure, anchor uncertainty, identity mismatch, revocation, disable, or generation/hash drift remains system-owned. Post-execution failure suppresses the already computed in-memory result instead of converting it into gameplay or a player penalty.

## Deviations from Plan

None - plan executed exactly as written after the explicitly approved D-02 contract correction.

## Issues Encountered

- Task 2 initially resumed against the pre-correction assumption that exhibition fixtures carried conformance. The approved shared correction added effective status and scheduling-decision references; Task 2 then enforced the corrected containment-only exhibition contract and full counted pair without broadening gameplay semantics.

## User Setup Required

None - production paths, key, minimum generation/hash, and bootstrap mode remain deployment configuration owned by the later integrated service proof.

## Verification

- Focused authority/execution/server run passed: 46/46 tests.
- Four-language parity run passed: 4/4 tests with real TypeScript, Python, Rust, and Zig adapters/toolchains.
- Full `@cowards/runtime-service` suite passed: 53/53 tests.
- `pnpm --filter @cowards/runtime-service typecheck` passed.
- `git diff --check` passed.

## Next Phase Readiness

- Go can consume the same reference-only request contract and reject response drift in Plan 256-11 without trusting runtime-service response identity as Chronicle authority.
- Production conformance remains absent and cannot make a lane counted until Phase 259 installs separately reviewed executable evidence.
- No Match state, Action legality, event order, outcome, Strategy observation, or historical v1.4 evidence changed.

## Self-Check: PASSED

- All four TDD task commits exist in RED/GREEN order and the approved shared correction is recorded explicitly.
- Startup, acceptance, pre-invocation, post-execution, revocation, kill-switch, rollback, fixture isolation, privacy, parity, and package gates are automated and passing.
- The protected consolidated spec and `.planning/config.json` remain untouched and unstaged.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
