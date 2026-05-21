# Phase 35: Completed Demo Tournament - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 35 generates and completes the v1.5 demo tournament using the accepted Advanced Strategy set. It should create the tournament, complete all counted MatchSets, publish standings/stage results with provenance and links, and ensure the tournament reads as realistic but non-durable demo evidence. It should not tune Strategies, create the curated example MatchSet set, or perform the final browser/docs regression sweep.

</domain>

<decisions>
## Implementation Decisions

### Entrants and Format

- **D-01:** The headline demo tournament should be Advanced-only if at least 8 accepted Advanced Strategies remain after validation.
- **D-02:** Prefer including the full accepted Advanced set. If 10 Strategies are accepted, use all 10 unless execution cost or clarity forces a smaller 8+ field.
- **D-03:** Prefer full round robin because it reveals matchup texture. Use group round robin only if full round robin is too costly or less readable.
- **D-04:** v1.4 Starters should not be headline tournament entrants unless the Advanced set fails the 8-entrant quality gate; Starters can still appear in examples and benchmark evidence.

### Counted Evidence and Standings

- **D-05:** Tournament standings must be decided only by complete, counted, replay-backed MatchSets.
- **D-06:** Degraded, system-failed, or non-counted MatchSets must be separated from standings and surfaced as caveats or blockers.
- **D-07:** Tournament evidence should include entrants, format, standings or stage results, counted MatchSets, MatchSet links, replay links, provenance, rule/Chronicle/runtime versions, and generated-at timestamp.
- **D-08:** If standings look degenerate or unrealistic, Phase 35 should flag the issue for Phase 36 replay review/tuning rather than masking it with presentation.

### Public Links and Framing

- **D-09:** Tournament pages should link to public Strategy cards and player/profile pages where applicable.
- **D-10:** Public tournament and linked DTOs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid details, stack traces, or private runtime internals.
- **D-11:** Tournament copy should use non-durable demo framing and avoid official rating or production tournament claims.

### the agent's Discretion

The planner may choose the exact tournament slug, display name, round-robin implementation details, seed ordering, and local script shape, provided evidence is deterministic and complete.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and non-negotiables.
- `.planning/REQUIREMENTS.md` — Phase 35 requirements DEMO-03 through DEMO-06.
- `.planning/ROADMAP.md` — Phase 35 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/31-result-data-analysis-and-evidence-model/31-CONTEXT.md` — Evidence packet and report fields.
- `.planning/phases/32-advanced-strategy-library-design/32-CONTEXT.md` — Advanced seed tier, public card, and lineage decisions.
- `.planning/phases/33-deterministic-gauntlet-validation/33-CONTEXT.md` — Accepted Advanced field and non-degeneracy validation expectations.
- `.planning/phases/34-example-matchset-generation/34-CONTEXT.md` — Local demo/report link expectations.

### v1.5 Research

- `.planning/research/v1.5-SUMMARY.md` — Demo and tournament goals.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Tournament diversity and validation recommendations.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Public result and replay handoff expectations.

### Existing Tournament and Result Code

- `scripts/run-v1-4-demo-tournament.ts` — Existing demo tournament generation pattern and local link output.
- `packages/persistence/src/ladder.ts` — Standings aggregation and counted MatchSet patterns.
- `packages/persistence/src/scoring.ts` — Deterministic scoring and failed-system separation.
- `packages/persistence/src/matchset-status.ts` — MatchSet completion/degraded status.
- `apps/web/app/ladder/[seasonSlug]/page.tsx` — Existing tournament/ladder-style public page pattern if applicable.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — MatchSet result link target.
- `apps/web/app/strategies/[strategyId]/page.tsx` — Public Strategy card link target.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- The v1.4 demo tournament script already creates a completed demo surface with provenance, local browser links, standings, and replay samples.
- Existing scoring code already supports deterministic ranking and system-failure separation.
- Existing public pages can provide tournament, MatchSet, Strategy card, profile, and replay targets.

### Established Patterns

- Demo tournament evidence should be regenerated through a deterministic command, not manually edited.
- Public tournament surfaces should use non-durable demo framing and should not imply durable ratings.
- Complete/counted/replay-backed status is mandatory before standings can be trusted.

### Integration Points

- Phase 35 consumes accepted Advanced Strategies and Phase 33 validation artifacts.
- Phase 35 outputs local links that Phase 36 reviews and Phase 37 browser-verifies.
- The local demo/report should be updated with tournament provenance, standings, MatchSet links, and representative replays.

</code_context>

<specifics>
## Specific Ideas

- A full 10-entrant Advanced round robin is preferred when all 10 Advanced Strategies pass validation.
- If the final accepted set is 8 or 9, the tournament should use all accepted Strategies and record the quality-gate rationale from Phase 33.
- If a champion dominates without close/unfavorable matchups, Phase 35 should surface the issue clearly for Phase 36 instead of smoothing the narrative.

</specifics>

<deferred>
## Deferred Ideas

- Tactical replay review and tuning belong to Phase 36.
- Browser verification and documentation updates belong to Phase 37.

</deferred>

---

*Phase: 35-Completed Demo Tournament*
*Context gathered: 2026-05-20*
