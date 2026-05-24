# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Plan

**Status:** Ready for execution
**Research:** `102-RESEARCH.md`
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08

## Objective

Prove v1.15 promotion readiness with live local topology, no-fallback drills, rollback documentation, monitor coverage, replay realism, privacy checks, and final promotion/defer artifacts.

## Tasks

1. Extend topology checker.
   - Add a repeatable v1.15 topology path for web -> Go -> TypeScript runtime service -> Go completion/Chronicle persistence -> Go scoring -> Go public evidence.
   - Record source-safe `.planning/artifacts/v1.15-live-web-go-runtime-topology.json`.

2. Add stopped-service drills.
   - Stopped Go: selected web/API workflows fail closed without TypeScript backend fallback.
   - Stopped runtime service: Go records retryable or terminal system failure without TypeScript persistence fallback.

3. Add rollback drill documentation and evidence.
   - Explicit operator sequence: stop Go orchestration, switch owner, start TypeScript rollback worker.
   - Cover queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior where practical.

4. Expand boundary monitors.
   - Fail on TypeScript backend ownership creep, unsafe fallback, schema drift, runtime ABI drift, lifecycle/route manifest drift, privacy drift, report-only offense increases, and public-output leaks.

5. Run browser replay gate.
   - Validate Go-created or Go-completed replay evidence has plausible full Match starts, in-bounds visible Soldiers/terrain, no clipped/off-board pieces, and no canonical-start regressions.

6. Write final artifacts.
   - `.planning/artifacts/v1.15-promotion-decision.md`
   - `.planning/artifacts/v1.15-live-web-go-runtime-topology.json`
   - Any monitor/rollback evidence files needed to support the decision.
   - `102-SUMMARY.md`, `102-VERIFICATION.md`, and `102-VALIDATION.md`.

## Verification

- `pnpm boundary:monitors`
- v1.15 topology command
- stopped-Go and stopped-runtime drills
- browser replay validation for realistic Go-created/completed evidence
- `git diff --check`

## Exit Criteria

- Promotion/defer artifacts prove normal Go backend ownership, no fallback, rollback safety, monitor coverage, public-output privacy, and remaining TypeScript runtime-only scope.
