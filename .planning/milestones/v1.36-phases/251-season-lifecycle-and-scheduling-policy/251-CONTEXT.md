# Phase 251: Season Lifecycle and Scheduling Policy - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Source:** v1.36 milestone brief and autonomous continuation approval

<domain>
## Phase Boundary

Make trial Season lifecycle and scheduling deterministic, public-safe, resettable, and Season-isolated. This phase does not change game rules, result classification, standings scoring, governance workflows, or runtime ownership.

</domain>

<decisions>
## Implementation Decisions

### Lifecycle
- Keep the existing public statuses: `draft`, `open`, `scheduling`, `active`, `completed`, `archived`.
- Transitions are monotonic and validated by a spec-owned transition contract; no reopening, backward transition, or post-archive mutation.
- Opening starts the entry window. Entering scheduling closes and freezes the entry window. Completion and archive preserve public evidence links.

### Scheduling
- Scheduling freezes active entrant snapshots before any Season MatchSet is created.
- One database transaction owns the Season lock, status/timestamp changes, deterministic pod creation, schedule-run record, and final active/completed state.
- A Season with fewer than the configured minimum entries completes with a public `insufficient_evidence` outcome and no counted MatchSets.
- Re-running scheduling is idempotent: a completed run is returned or a no-op is recorded; it cannot duplicate Season MatchSets.

### Public Policy
- Public DTOs expose entry-window state, scheduling-window state, lifecycle timestamps, minimum entries, target pod size, resettable archive policy, and outcome.
- Go and TypeScript public reads project the same fields and public copy.
- Archived Seasons remain Season-scoped snapshots with stable result and replay links; no durable rating promise is introduced.

### Ownership and Privacy
- Existing TypeScript persistence mutation remains the compatibility path for this phase; no Strategy execution or runtime validation is added to web/API/Go.
- Public output excludes Strategy source, private memory, objectives, proof material, raw diagnostics, paths, environment values, tokens, database details, and operator-only data.

### the agent's Discretion
- Exact helper names, transaction extraction, migration column names, and focused test organization.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - SEAS-01 through SEAS-05 and Phase 251 success criteria.
- `.planning/REQUIREMENTS.md` - Season lifecycle requirements and hard exclusions.
- `packages/spec/src/competition-policy-v1-36.ts` - public beta, reset, privacy, and authority policy.
- `packages/spec/src/competition.ts` - existing Season DTO and statuses.
- `packages/persistence/src/ladder.ts` - current entry, scheduling, standings, and public DTO implementation.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - existing Season, entry, run, and audit storage.
- `apps/go-backend/live_backend.go` - selected public ladder read projection.

</canonical_refs>

<deferred>
## Deferred Ideas

- Counted-state classifier and standings recomputation remain Phase 252.
- Dispute and invalidation governance remain Phase 253.
- Final page presentation remains Phase 254.
- Service-backed full-path proof remains Phase 255.

</deferred>

---

*Phase: 251-season-lifecycle-and-scheduling-policy*
*Context gathered: 2026-07-11 via approved autonomous flow*
