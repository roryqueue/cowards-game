# Phase 179: Replay and Result Page Interface Hardening - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Make result and replay pages consume frozen app-facing contracts and public-safe lifecycle copy. This phase should harden interface usage and rendering; it should not introduce new game rules or execute Strategy code in the app.

</domain>

<decisions>
## Implementation Decisions

### App Consumption
- **D-01:** Result pages consume MatchSet/result DTOs through the frozen app-facing contract or fixture adapter.
- **D-02:** Replay pages consume replay metadata/evidence DTOs through the frozen app-facing contract or fixture adapter.
- **D-03:** Pages must not infer lifecycle state from runtime internals.

### Public Safety
- **D-04:** Public pages must omit source, memories, objectives, raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- **D-05:** Owner/test-only replay debug surfaces remain gated and outside the default public contract.
- **D-06:** Page copy covers queued, running, complete, degraded, failed, unavailable, retryable, and non-retryable semantics using public-safe language.

### the agent's Discretion
Downstream agents may choose exact component factoring and copy keys, provided the UI consumes DTOs through the contract and preserves existing visual/workflow patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle and DTO/evidence model.

### Planning
- `.planning/REQUIREMENTS.md` - UI-01..UI-06.
- `.planning/ROADMAP.md` - Phase 179 scope and success criteria.

### Code
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - result page.
- `apps/web/app/matchsets/evidence-copy.ts` - lifecycle/evidence copy.
- `apps/web/app/matches/server.ts` - replay/result loading adapter.
- `apps/web/app/matches/types.ts` - current page data types.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - replay UI.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` - replay state helpers.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - replay board rendering.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Replay page already separates state helpers, board rendering, and client UI.
- Evidence copy is centralized enough to become contract-driven.

### Established Patterns
- Replay/public pages should render public projections only.
- Board realism requires visible Soldiers and terrain inside declared bounds.

### Integration Points
- This phase consumes schemas and fixtures from phases 176-177 and should be covered by Phase 178 monitors/tests.

</code_context>

<specifics>
## Specific Ideas

Use fixture scenarios to exercise page copy for queued/running/complete/degraded/failed/unavailable states and retry dispositions.

</specifics>

<deferred>
## Deferred Ideas

The full fixture adapter lives in Phase 180; this phase may consume it if already available or prepare page boundaries for it.

</deferred>

---

*Phase: 179-Replay and Result Page Interface Hardening*
*Context gathered: 2026-05-30*
