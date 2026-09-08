---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "185"
subsystem: hostile-runtime
tags: [docker, persistent-stream, framed-ipc, custody, lean-admit-03]
requires: [262-184]
provides: [match-scoped-container-stream, exact-container-absence, direct-v6-custody]
affects: [262-186, 262-175, 262-176]
tech-stack:
  added: []
  patterns: [worker-coordinated synchronous bridge, request-id framed NDJSON, exact Docker absence predicate]
key-files:
  created: []
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
key-decisions:
  - "Use one docker exec -i broker stream per Match, with a host worker only coordinating synchronous framed transport."
  - "Run every Strategy method in a fresh in-container Node child so globals and module state cannot cross calls."
  - "Classify a container as absent only for the exact bounded no-such-object diagnostic naming that container."
metrics:
  duration: 16m
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 185: Persistent Hostile Stream Closure Summary

One digest-pinned hostile container and one long-lived Docker stream now serve every Strategy method in a Match, with strict correlated framing and fail-closed cleanup.

## Performance

- **Runnable source commit:** `ae4fd480197393d1c7d27dbc43878d3b31e36b25`
- **Runnable source tree:** `0c402d3f1eaab766325948d1925ef0aafa1fd7b7`
- **Executable closure root:** `sha256:1e187745221a31d67d1d284b3e4abb0cc83d231b85b89910b99c3e31244c30fa`
- **Focused verification:** 87 passed, 25 historical tests skipped
- **Preserved successor locks:** 36
- **Docker preflights / Match invocations:** 0 / 0

## Accomplishments

- Replaced the per-method Docker CLI lifecycle with exactly one Match-scoped `docker exec -i` stream and an in-container broker.
- Added contiguous request IDs, exact-key NDJSON envelopes, canonical base64, one-in-flight ordering, byte caps, deadlines, desynchronization poisoning, and no fallback.
- Preserved fresh method execution contexts by launching transient Node children inside the already-running hostile container rather than executing Strategy source in the host coordinator.
- Made pre-create and post-remove absence checks accept only Docker's exact no-such-object response for the exact validated container name.
- Added the collision-free preflight-v5, authorization/review/invocation/terminal/adjudication/eligibility-v6 custody family and rewired the dormant direct selector to it.
- Preserved Plan 184 as immutable refusal history and kept every fresh authority bit false.

## Task Commits

1. `69693228` — RED: specify persistent Match stream protocol.
2. `0ccd8091` — GREEN: multiplex hostile methods per Match.
3. `9d689eaa` — RED: specify v6 persistent-stream custody.
4. `8b2b3953` — GREEN: establish v6 persistent-stream custody.
5. `aceb235a` — Fix exact recorded Plan 184 finding count.
6. `ae4fd480` — Fix deterministic stream shutdown and pre-allocation payload cap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the historical Plan 184 finding count**

- **Found during:** Task 2 source-only validation
- **Issue:** The new immutable-history guard expected two findings, while the committed review records one.
- **Fix:** Bound the guard to the exact committed one-finding refusal.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Commit:** `aceb235a`

**2. [Rule 1 - Bug] Made timeout cleanup terminate the persistent process deterministically**

- **Found during:** Task 2 post-implementation inspection
- **Issue:** A timed-out exchange could leave the coordinator waiting on the old request, and graceful broker exit was initially reported as a stream failure.
- **Fix:** Explicitly fail the abandoned exchange, distinguish close receipts, terminate forced sessions, and cap payloads before base64 allocation.
- **Files modified:** `scripts/lib/v1-38-lean-container-match-session.ts`
- **Commit:** `ae4fd480`

## Verification

- `pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts scripts/run-v1-38-lean-runner-feasibility.test.ts scripts/check-v1-38-lean-admission.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1`
- `pnpm exec tsc --noEmit --pretty false`
- `node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-container-stream-source-only-v6`
- Lock inventory equals 36.
- `git diff --check`

No Docker command, preflight artifact, authorization, review, marker, Match, terminal, tracking, archive, or tag effect was produced by this plan.

## Known Stubs

None.

## Self-Check: PASSED

All listed files and commits exist; the v6 source-only checker passes against the separately committed runnable source, with zero live invocations and all authority false.
