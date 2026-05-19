# Phase 16: Exhibition Queue and Entry - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the v1.2 entry flow for small unranked exhibition MatchSets. It lets a signed-in User manually create an exhibition by selecting owned immutable Strategy Revisions, validates the entry set, locks snapshots on create, enqueues Match jobs, and exposes status/result navigation. It does not build open matchmaking, public revision discovery, multi-user invitations, ranked queues, or a public MatchSet index.

</domain>

<decisions>
## Implementation Decisions

### Entry Creation
- **D-01:** Use a manual "create exhibition" flow.
- **D-02:** The creator selects a competition preset and 2-8 owned Strategy Revisions.
- **D-03:** This flow is intended to support self-play/testing by letting one User compare multiple owned Strategy Revisions.

### Ownership Policy
- **D-04:** v1.2 exhibition entries are owner-only. The creator may enter only their own account-owned revisions.
- **D-05:** Do not allow selecting other users' revisions in v1.2.
- **D-06:** Do not build public revision discovery or consent/invite rules in this phase.

### Locking and Execution
- **D-07:** Lock on create. When the User creates the exhibition, selected revision snapshots lock immediately and jobs are enqueued.
- **D-08:** Do not add draft competitions, scheduled lock windows, or open queue windows.

### Preflight Validation
- **D-09:** Strictly preflight before creating a MatchSet.
- **D-10:** Block create unless every selected revision is owned by the session User, valid, runtime/engine compatible, distinct by revision id, and allowed for the chosen preset.
- **D-11:** Invalid, incompatible, or duplicate inputs should fail before a MatchSet exists whenever knowable.

### Duplicate Policy
- **D-12:** Distinct revision id is required. The same exact revision id cannot occupy multiple entrant slots in one exhibition.
- **D-13:** Separate immutable revisions with identical source hashes are allowed in v1.2 alpha.
- **D-14:** Exact active duplicate MatchSets are handled by Phase 18; Phase 16 should expose enough data to support that guardrail.

### Status and Navigation
- **D-15:** After create, the User lands on a MatchSet status/result page.
- **D-16:** Status updates use polling, not SSE/WebSockets.
- **D-17:** Status vocabulary should include accepted, queued, running, complete, degraded, and failed.

### Developer Seeding
- **D-18:** Developer-seeded MatchSets are allowed only through test-support/dev API paths.
- **D-19:** Do not add a public UI or hidden admin screen for seeding in v1.2.

### the agent's Discretion
The planner may choose exact form layout, polling interval, endpoint names, and whether this appears in Workshop or a separate competition route, as long as the manual 2-8 owned-revision flow is first-class and public/ranked queue scope is avoided.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.2 milestone scope and self-play requirement.
- `.planning/REQUIREMENTS.md` — Phase 16 requirements EXH-01 through EXH-06.
- `.planning/ROADMAP.md` — Phase 16 goal, success criteria, and notes.
- `.planning/phases/14-competitive-ownership-and-sessions/14-CONTEXT.md` — session/User ownership requirements.
- `.planning/phases/15-matchset-competition-model/15-CONTEXT.md` — competition preset, entrant, scoring, and snapshot decisions.
- `.planning/research/SUMMARY.md` — exhibition/self-play direction and pitfalls.

### Primary Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — deterministic Match terminology and Strategy Revision immutability.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — web/API/worker boundaries.

### Existing Code
- `apps/web/app/workshop/workshop-client.tsx` — existing revision selection, test launch, and status rendering patterns.
- `apps/web/app/workshop/server.ts` — Workshop server facade for revision submission and test launch.
- `apps/web/app/api/workshop/test/route.ts` and `apps/web/app/api/workshop/tests/route.ts` — existing test MatchSet API surfaces.
- `packages/persistence/src/workshop.ts` — current Workshop test MatchSet creation and opponent/preset list.
- `packages/persistence/src/matchset-service.ts` — MatchSet creation and revision locking.
- `packages/persistence/src/matchset-status.ts` — MatchSet status aggregation and scoring refresh.
- `packages/persistence/src/presets.ts` — preset definitions reused or adapted for Smoke/Standard Exhibition.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Workshop UI already has revision list, valid-revision filtering, test launch controls, status summaries, scoring display, and replay links.
- `createWorkshopTestMatchSet` already validates one local revision and creates a preset MatchSet against an opponent.
- `createMatchSetService.createFromPreset` and `.createFromMatrix` can be extended or wrapped for multiple entrants.

### Established Patterns
- API routes under `apps/web/app/api/workshop` return JSON DTOs with `ok`/error style responses.
- Status polling already exists conceptually through Workshop test summary endpoints.
- MatchSet creation currently locks revisions during insertion.

### Integration Points
- Add competitive exhibition create endpoint that requires a session User.
- Add persistence/query helpers to list account-owned valid revisions for entry.
- Reuse/extend MatchSet status endpoints so Phase 17 can render the same page as final result evidence.
- Add test-support/dev API for deterministic seeded competition creation.

</code_context>

<specifics>
## Specific Ideas

- Manual exhibition should support 2-8 owned revisions.
- Same User self-play is a core v1.2 alpha use case.
- Exact same revision id twice is invalid; two separate revisions with identical source hash are valid.
- Polling is enough for alpha.

</specifics>

<deferred>
## Deferred Ideas

- Open queue auto-matching.
- Multi-user selected entries or public revision discovery.
- Fixture opponents in public UI.
- Draft competitions or scheduled lock windows.
- Account exhibition history and public recent MatchSet index.

</deferred>

---

*Phase: 16-Exhibition Queue and Entry*
*Context gathered: 2026-05-19*
