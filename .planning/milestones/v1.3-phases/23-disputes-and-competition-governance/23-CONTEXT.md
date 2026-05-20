# Phase 23: Disputes and Competition Governance - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 23 adds result flagging, dispute notes, admin review, invalid/non-competitive MatchSet marking, standings exclusion, and audit logs. It makes trial ladder standings governable without becoming a broad admin/account platform.

This phase does not redesign scheduling, scoring, profiles, authentication, account recovery, organizations, or runtime sandboxing.

</domain>

<decisions>
## Implementation Decisions

### Public Flagging
- **D-01:** Signed-in users can flag a MatchSet result with a short dispute note tied to public replay/provenance evidence.
- **D-02:** Flagging should not immediately change standings. It marks the result as under review until an admin decision is recorded.
- **D-03:** Public pages should show a neutral under-review state when relevant, without exposing private notes or admin-only evidence.
- **D-04:** Duplicate flagging by the same user/result should be rate-limited or collapsed to prevent spam.

### Admin Review Surface
- **D-05:** Admin review should be minimal and result-focused: inspect provenance, entrant snapshots, scoring evidence, Chronicle hashes, runtime failure classifications, public/private review details, and existing flags.
- **D-06:** Admin review should not include broad user moderation, account recovery, organizations, support queues, or social moderation.
- **D-07:** Admin-only evidence may include details unavailable publicly, but public DTOs must remain privacy-safe.

### Invalidation and Non-Competitive Marking
- **D-08:** Admin can mark a MatchSet invalid for standings when evidence is incomplete, corrupted, privacy-unsafe, or affected by unresolved system failure.
- **D-09:** Admin can mark a MatchSet non-competitive without deleting public replay evidence.
- **D-10:** Invalid/non-competitive MatchSets remain visible with public counted status and explanation; evidence does not disappear.
- **D-11:** Standings exclude invalid/non-competitive MatchSets and remain recomputable from counted MatchSets plus governance state.
- **D-12:** Governance can affect MatchSet counted status, not mutate underlying Match/Chronicle evidence.

### Audit Log
- **D-13:** Every dispute, review decision, invalidation, and non-competitive marking writes an immutable audit event.
- **D-14:** Audit event fields include actor, target, timestamp, reason, before/after state, public explanation, and private review note when needed.
- **D-15:** Public explanations should be short, neutral, and safe. Private notes are admin-only.
- **D-16:** The audit model should align with Phase 20 minimal season/entry audit events but can add result-governance-specific fields.

### Authorization and Privacy
- **D-17:** Admin review and decision actions require server-side admin authorization.
- **D-18:** Public result/profile/season pages should show governance outcome, counted status, and public explanation only.
- **D-19:** Public outputs must never expose Strategy source, private runtime/debug data, private error details, StrategyMemory, SoldierMemory, objective payloads, owner debug, or raw Awareness Grid details.
- **D-20:** Tests must cover unauthorized admin access rejection, public privacy checks, standings exclusion, and audit creation.

### the agent's Discretion
- The planner may choose exact status enum names if they distinguish counted, under review, invalid, non-competitive, and non-counted.
- The planner may choose whether admin review is a dedicated page or a protected section on result pages.
- The planner may choose exact rate limits for duplicate flagging.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — competition trust and privacy constraints.
- `.planning/REQUIREMENTS.md` — GOV-01 through GOV-08 define Phase 23 requirements.
- `.planning/ROADMAP.md` — Phase 23 goal and success criteria.
- `.planning/research/SUMMARY.md` — governance and invalidation direction.
- `.planning/phases/20-trial-ladder-season-model/20-CONTEXT.md` — lifecycle, entry states, and minimal audit decisions.
- `.planning/phases/21-ladder-scheduling-and-standings/21-CONTEXT.md` — counted/non-counted standings policy.
- `.planning/phases/22-public-profiles-and-strategy-cards/22-CONTEXT.md` — public privacy and DTO decisions.

### Existing Evidence Surfaces
- `packages/spec/src/competition.ts` — existing public MatchSet result DTO and leak-safe checks.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — public result/provenance/evidence page to refine.
- `packages/persistence/src/scoring.ts` — standings exclusion must preserve recomputable scoring semantics.
- `packages/persistence/src/competition.ts` — public result construction and failure classification integration points.
- `apps/web/app/competitive/server.ts` — server-side current user/owner patterns to extend for admin checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Public MatchSet result pages already show status, standings, replay links, provenance, and private excluded fields.
- Existing scoring returns degraded/complete state and can be projected with governance counted status.
- Public leak-safe assertion helper can be mirrored for governance/public result output.

### Established Patterns
- Public evidence stays available while private Strategy details remain hidden.
- System failures do not become player losses.
- Public result pages already distinguish complete/degraded/failed vocabulary.

### Integration Points
- Add result flags and moderation audit tables.
- Add governance service for flagging, review, invalid/non-competitive marking, and standings exclusion.
- Extend public result DTOs with counted status and public governance explanation.
- Add admin-protected review routes/actions.

</code_context>

<specifics>
## Specific Ideas

- Public counted statuses should use neutral language like "Counts for standings," "Under review," "Invalid for standings," and "Non-competitive."
- Public explanations should be safe one-liners; private admin notes stay private.
- Governance decisions should exclude MatchSets from standings without deleting replays.

</specifics>

<deferred>
## Deferred Ideas

- Full admin platform, organizations, support queues, account recovery, and social moderation.
- Public moderation history browsing beyond what is needed for result trust.
- Automated abuse detection.

</deferred>

---

*Phase: 23-Disputes and Competition Governance*
*Context gathered: 2026-05-19*
