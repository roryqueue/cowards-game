# Phase 205 Context: Stale Lease, Duplicate Worker, and Interrupted MatchSet Recovery

**Milestone:** v1.28 Match Execution Operations, Recovery, and Incident Drills
**Phase:** 205
**Status:** Context captured
**Date:** 2026-05-30

## Decisions

- Use existing Go lease semantics as the stale lease recovery baseline: unexpired jobs are not double-claimed, expired leases can be reclaimed, and stale tokens cannot mutate terminal state.
- Treat recovery idempotency from Phase 203 as the duplicate operator control convergence mechanism.
- Use MatchSet refresh markers and existing status logic as the interrupted MatchSet baseline for this phase.
- Keep deeper live signed-in interrupted MatchSet proof in Phase 208.
