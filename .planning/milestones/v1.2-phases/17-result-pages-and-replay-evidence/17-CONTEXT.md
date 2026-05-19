# Phase 17: Result Pages and Replay Evidence - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase publishes privacy-safe, dispute-friendly MatchSet result/status pages. It should show standings, scoring breakdowns, Match evidence, replay links, provenance, degraded/failed handling, and owner-only affordances for signed-in entrant owners. It should not build account history, public recent MatchSet indexes, live spectator surfaces, or richer private debug bundles beyond links/actions that remain server-authorized.

</domain>

<decisions>
## Implementation Decisions

### Result Page Layout
- **D-01:** Result pages use standings first, evidence below.
- **D-02:** The top of page should show final status, standings, and score summary before deeper evidence.

### Scoring Breakdown
- **D-03:** Use expandable per-entrant scoring breakdowns.
- **D-04:** Default view shows rank, points, wins/draws/losses, and penalties.
- **D-05:** Expanded view shows head-to-head, surviving Soldiers, survival turns, and tie-breaker path.

### Match Evidence
- **D-06:** Present Match evidence as a ledger table/list.
- **D-07:** The ledger should include entrants, status, score contribution, failure/degraded markers, Chronicle hash, and replay links.

### Provenance
- **D-08:** Include a compact provenance panel with copyable IDs.
- **D-09:** Provenance should include MatchSet id, preset id/version, scoring policy version, engine version, entrant snapshot ids/hashes, and Chronicle hashes.
- **D-10:** Avoid a raw JSON provenance dump in v1.2 unless the planner can guarantee privacy projection and low UX cost.

### Degraded and Failed Results
- **D-11:** Use a plain top status banner for complete/degraded/failed states.
- **D-12:** Affected Matches should show public reason categories such as strategy failure, system failure, invalid result, or no replay.
- **D-13:** Public pages should explain what happened without exposing private runtime internals or private error text.

### Owner-Only Affordances
- **D-14:** A signed-in entrant owner may see owner-only source/debug links or actions on the result page.
- **D-15:** Public result output must remain unchanged for anonymous/non-owner viewers.
- **D-16:** Every private link/action endpoint must independently perform server-side authorization.

### Discovery and History
- **D-17:** Result/status pages are direct-link only in v1.2.
- **D-18:** Do not build account exhibition history or a public recent MatchSets index in this phase.

### the agent's Discretion
The planner may choose exact component layout, responsive table behavior, copy affordances, and whether owner-only links appear inline or in a small owner panel, provided public output remains stable and privacy-safe.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.2 result privacy and evidence goals.
- `.planning/REQUIREMENTS.md` — Phase 17 requirements RES-01 through RES-06.
- `.planning/ROADMAP.md` — Phase 17 goal, success criteria, and notes.
- `.planning/phases/14-competitive-ownership-and-sessions/14-CONTEXT.md` — owner-only source/debug rules.
- `.planning/phases/15-matchset-competition-model/15-CONTEXT.md` — scoring, tie-breaker, publication, and label decisions.
- `.planning/phases/16-exhibition-queue-and-entry/16-CONTEXT.md` — status/result page handoff and polling.
- `.planning/research/SUMMARY.md` — public evidence and privacy watch-outs.

### Primary Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — Chronicle/privacy terminology and public replay constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — web/API/replay boundaries.

### Existing Code
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — existing replay page layout, owner-debug toggle, and inspector style.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — replay DTO interpretation and owner-private data access.
- `apps/web/app/matches/server.ts` — replay data loading and owner authorization.
- `apps/web/app/matches/replay-ready.ts` — public/owner replay-ready projection path.
- `packages/replay/src/validate.ts`, `packages/replay/src/grammar.ts`, and `packages/replay/src/project.ts` — Chronicle validation and projection gates.
- `packages/persistence/src/matchset-status.ts` — status/scoring aggregation.
- `packages/persistence/src/scoring.ts` — current ranking data that result pages will extend or consume.
- `apps/web/app/workshop/workshop-client.tsx` — existing scoring/status/replay link display in Workshop.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Replay pages already separate public projection and owner-private data.
- Workshop UI already displays MatchSet status, scoring rankings, Match links, and owner debug links.
- Chronicle store and replay-ready builder already expose hash/provenance-style replay data.

### Established Patterns
- Owner debug is requested through query params but authorized server-side before owner DTOs are returned.
- Public replay projection excludes Strategy source, StrategyMemory, SoldierMemory, objectives, raw Awareness Grid data, and runtime internals.
- MatchSet status/scoring is refreshed from persisted Matches.

### Integration Points
- Add a public MatchSet result route/page under `apps/web`.
- Add result DTO projection that combines MatchSet scoring, entrant snapshots, Match ledger, replay availability, and provenance.
- Add owner-aware result affordance checks that do not change public DTOs.
- Reuse polling from Phase 16 for running status, then render the same page as final result after completion/degradation.

</code_context>

<specifics>
## Specific Ideas

- People should immediately see who won, then be able to audit why.
- The Match evidence ledger should feel like a calm "show your work" table.
- Provenance should be enough to audit, not a raw dump.
- Direct-link only keeps the phase focused.

</specifics>

<deferred>
## Deferred Ideas

- Account exhibition history.
- Public recent MatchSets index.
- Live spectator/result surface.
- Full JSON provenance download/view.
- Rich private debug bundle directly embedded in result pages.

</deferred>

---

*Phase: 17-Result Pages and Replay Evidence*
*Context gathered: 2026-05-19*
