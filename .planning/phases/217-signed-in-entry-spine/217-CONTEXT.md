# Phase 217: Signed-In Entry Spine - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 217 builds `/competitions/[competitionId]/enter` as the signed-in competition entry spine backed by `getSignedInCompetitionEntryDashboard`. It should show eligible saved Strategy Revisions source-free and reuse existing entry/creation behavior where possible.

</domain>

<decisions>
## Implementation Decisions

### Entry Flow
- **D-01:** `/competitions/[competitionId]/enter` is the signed-in entry spine.
- **D-02:** The entry dashboard should be action-forward: select a revision, see eligibility, submit/enter if allowed, then route to competition detail or resulting MatchSet.
- **D-03:** Existing exhibition creation behavior can be reused behind this route rather than replaced immediately.

### Account-Safe Revision Data
- **D-04:** Signed-in users see eligible saved Strategy Revisions without source exposure.
- **D-05:** The dashboard distinguishes valid, invalid, stale, already-entered, and ineligible revisions without becoming a revision editor.
- **D-06:** Anonymous users get a clear sign-in gate and links to sign in/sign up.

### Navigation
- **D-07:** Entry flow links back to Workshop for drafting/saving, Account for revision management, competition detail for rules, and results/replay after entry.

### the agent's Discretion
- Decide whether the first implementation posts to existing exhibition endpoints or adds a thin competition-entry API wrapper, as long as behavior remains account-safe and boundary-safe.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - ENTRY-01 through ENTRY-05.
- `.planning/ROADMAP.md` - Phase 217 scope.
- `.planning/phases/212-discovery-read-requirements-and-boundary-design/212-CONTEXT.md` - Signed-in entry dashboard DTO boundary.
- `.planning/phases/216-competition-hub-and-competition-detail/216-CONTEXT.md` - Competition route/detail context.
- `.planning/artifacts/v1.31-discussion-summary.md` - Entry model decisions.

### Current Signed-In Surfaces
- `apps/web/app/account/page.tsx` - Existing signed-in revision dashboard.
- `apps/web/app/exhibitions/new/page.tsx` - Existing signed-in exhibition entry UI.
- `apps/web/app/api/exhibitions/route.ts` - Existing exhibition creation API.
- `apps/web/lib/account-service-boundary.ts` - Account read boundary.
- `apps/web/app/competitive/server.ts` - Existing competitive server actions/read helpers.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing account revision summaries include validation/runtime/source hash metadata without source content.
- Existing exhibition client supports selecting revisions and presets.

### Established Patterns
- Account services fail closed without TypeScript backend fallback.
- Owner source links are explicitly owner-only and must not appear as public discovery data.

### Integration Points
- Entry dashboard can compose account-safe revisions with public competition detail/entry metadata.

</code_context>

<specifics>
## Specific Ideas

Entry should feel like: choose revision -> confirm eligibility -> enter -> view competition/result evidence.

</specifics>

<deferred>
## Deferred Ideas

Revision editing, source diffing, multi-step tournament registration, payment, team/org entry, and durable ranked eligibility policies.

</deferred>

---
*Phase: 217-signed-in-entry-spine*
*Context gathered: 2026-05-31*
