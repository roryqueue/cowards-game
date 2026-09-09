---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "191"
subsystem: hostile-runtime
tags: [docker, worker-threads, isolation, tdd, custody]
requires:
  - phase: 262-190
    provides: immutable zero-Match preflight-v7 refusal and seven-category review-v8
provides:
  - fresh bounded guest Worker execution for every broker method request
  - v9 source custody and fresh preflight-v8 operational path
affects: [262-192, 262-175, 262-176, phase-262-closure]
tech-stack:
  added: []
  patterns: [Match-scoped Docker broker, request-scoped guest Worker, termination-before-response]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-191-SUMMARY.md
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
key-decisions:
  - "Keep the digest-pinned Docker container and its exec stream Match-scoped while creating a fresh resource-bounded Worker for each accepted request."
  - "Require Worker termination and port closure before emitting the correlated broker response; poison the session on timeout or ambiguity."
requirements-completed: []
coverage:
  - id: D1
    description: "Every accepted broker request executes in a fresh bounded guest Worker without a per-method child process."
    requirement: DECI-02
    verification:
      - kind: integration
        ref: "scripts/lib/v1-38-lean-container-match-session.test.ts#fresh stateless Workers and timeout cleanup"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fresh v9 custody authenticates the exact 29-path source closure while every operational destination remains absent."
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: "node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-guest-worker-source-only-v9"
        status: pass
    human_judgment: false
metrics:
  duration: 16m
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 191: Fresh Guest Worker Broker Repair Summary

The persistent hostile-code Docker broker now runs each Strategy method in a newly created, resource-bounded Worker and destroys that Worker before returning a correlated response.

## Performance

- **Duration:** 16 minutes
- **Tasks:** 2/2
- **Files modified:** 5
- **Docker / preflight / Match invocations:** 0 / 0 / 0
- **Successor locks:** 36

## Accomplishments

- Removed the broker's per-method Node subprocess launch while preserving one Match-scoped container and one persistent Docker exec stream.
- Reused the established legacy and v1.17 hostile Worker harnesses with empty environment, empty `execArgv`, bounded heap/stack resources, strict request serialization, request-ID correlation, byte caps, deadlines, and termination-before-response.
- Added live broker-only regressions proving fresh module state, forbidden-capability behavior, timeout termination, serialized framing, and no per-method child-process dependency.
- Reserved collision-free preflight-v8 and authorization/review/invocation/terminal/adjudication/eligibility-v9 paths without creating any operational artifact.
- Passed source-only v9 custody over runnable commit `04a2a4873d15eeca2dfe997f9b6845884b712359`, tree `f1f0d64ec091a033d76d1d2dba2a6893ac152c14`, and 29-path closure `sha256:921438ece659a6f37a2399615701a1add98803a365659f054c3a9324d1bc55b0`.

## Task Commits

1. **Task 1 RED:** `80ab591a` — require fresh guest Workers and serialized correlated responses.
2. **Task 1 GREEN:** `43781854` — replace per-method processes with fresh bounded Workers and add runtime regressions.
3. **Task 2:** `3433c21e` — add v9 custody, schemas, selectors, and fresh operational paths.
4. **Task 2 correction:** `04a2a487` — bind v9 to the current Plan190 carrier rather than a superseded diagnosis digest.

## Verification

- 81 focused broker/admission tests passed; 25 immutable historical tests skipped by their existing guards.
- 21 runtime integration, isolation-boundary, v1.17 ABI, and container-adapter tests passed.
- TypeScript `--noEmit` passed.
- Source-only v9 custody passed with zero live invocations and all broader authority false.
- Exactly 36 successor locks remain; no Docker, preflight, authorization, review, marker, Match, tracking, archive, or tag effect occurred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided reviving a superseded Plan188 diagnosis digest**
- **Found during:** Task 2 source-only verification
- **Issue:** The legacy Plan188 assertion pinned an earlier version of the evolving diagnostic note and no longer represented the current Plan190 history carrier.
- **Fix:** The v9 source-only chain now authenticates the immutable Plan190 preflight/review roots plus the still-valid earlier evidence roots without reviving the superseded diagnostic digest.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Verification:** Source-only v9 selector and focused test suite pass.
- **Committed in:** `04a2a487`

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The correction keeps current history authoritative and does not broaden runtime or execution authority.

## Known Stubs

None.

## Threat Flags

None. The Worker is defense in depth inside the unchanged Docker hostile-code boundary; no new network, persistence, public, gameplay, or product surface was introduced.

## Next Phase Readiness

Plan262-192 can run exactly one non-consuming preflight-v8 over the committed Plan191 source. Matches remain prohibited unless that preflight passes and the independent seven-category review admits Plan175.

## Self-Check: PASSED

All listed source files and commits exist, both verification suites pass, the exact source closure authenticates, fresh v9 destinations are absent, and all 36 locks remain.
