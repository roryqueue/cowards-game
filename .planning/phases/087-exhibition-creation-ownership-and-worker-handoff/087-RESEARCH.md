# Phase 87 Research: Exhibition Creation Ownership and Worker Handoff

## Findings

- Exhibition creation reference behavior is in `packages/persistence/src/competition.ts`, `packages/persistence/src/matchset-service.ts`, and `apps/web/app/competitive/server.ts`.
- Creation transaction writes MatchSet, entrants, Matches, queued jobs, match-set links, revision locks, and submission audit events.
- Worker claiming/leases/retries/completion live in `packages/persistence/src/jobs.ts` and remain TypeScript-owned.

## Implementation Notes

- Add Go exhibition creation route as transactional job producer only.
- Preserve validation, rate limit, duplicate prevention, entrant snapshots, job inserts, and audit event.
- Do not claim, heartbeat, execute, complete, score, or classify jobs in Go.

