# Phase 252: Counted-State Classifier and Standings Recompute - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Source:** v1.36 milestone brief and approved autonomous continuation

<domain>
## Phase Boundary

Define one canonical public-safe counted-state classifier and recompute Season standings deterministically from complete counted evidence plus governance state. This phase adds authoritative DTO projections but does not build report/governance mutation UI or redesign public pages.
</domain>

<decisions>
## Implementation Decisions

### Canonical classifier
- Use the v1.36 public vocabulary: `pending`, `counted`, `retrying`, `degraded_system_failure`, `non_counted`, `non_competitive`, `under_review`, `disputed`, `invalid`, and `invalidated`.
- Canonical inputs are stored execution status, expected Match count, Chronicle-backed Match count, scoring availability, competition origin, and stored governance override.
- Stored `counted` is never trusted by itself; complete scoring and replay evidence must still be present.
- Governance/exclusion states take precedence over execution-derived eligibility. Invalidated and invalid remain excluded; disputed/under-review remain held out.

### standings recompute
- Recompute is a pure deterministic reduction over one Season's canonical classified MatchSets and immutable entrant snapshots.
- Public GETs do not mutate MatchSet lifecycle or manually stored rank rows.
- Only classifier output `counted` contributes score. Every other state contributes an exclusion/evidence count only.
- Tie-break order remains unchanged: points, wins, surviving Soldiers, survival turns, Strategy Revision id.

### public evidence
- MatchSet projections expose state label, safe explanation, standings effect, and evidence availability.
- Standing rows expose counted MatchSet count, excluded MatchSet count, evidence availability, tie-break inputs, and stable result/replay links.
- Result DTOs carry the same typed counted-state projection so Phase 254 renders rather than infers.

### parity and privacy
- TypeScript spec owns the contract; persistence and Go implement parity from the same input/output matrix.
- Public fields remain coarse and exclude source, memory, objectives, raw diagnostics, proof material, paths, environment values, tokens, database details, dispute internals, and operator-only data.

### the agent's Discretion
- Helper names, exact migration constraint names, and whether evidence summary fields are optional on general standings DTOs or specialized for ladder standings.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 252 success criteria.
- `.planning/REQUIREMENTS.md` - RESULT-01 through RESULT-06.
- `packages/spec/src/competition-policy-v1-36.ts` - locked counted-state public vocabulary and posture.
- `packages/spec/src/competition.ts` - current MatchSet and standings DTOs.
- `packages/persistence/src/ladder.ts` - current drifting classifier and GET-time standings reduction.
- `apps/go-backend/live_backend.go` - current Go classifier and standings reduction.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - legacy counted/review constraints.
</canonical_refs>

<deferred>
## Deferred Ideas

- Report submission and governance mutations remain Phase 253.
- Final result/standings/replay page UX remains Phase 254.
- Service-backed negative/governance proof remains Phase 255.
</deferred>

---

*Phase: 252-counted-state-classifier-and-standings-recompute*
*Context gathered: 2026-07-11 via approved autonomous flow*
