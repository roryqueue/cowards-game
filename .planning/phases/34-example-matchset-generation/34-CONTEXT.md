# Phase 34: Example MatchSet Generation - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 34 generates curated, representative example MatchSets from accepted Advanced Strategies and selected v1.4 benchmark Starters. It should select interactions that demonstrate archetype behavior, complete the MatchSets, capture replay-backed links, and add them to the local demo/report. It should not tune Strategies, generate the full demo tournament, or run the final browser/docs verification pass.

</domain>

<decisions>
## Implementation Decisions

### Example Selection

- **D-01:** Generate at least five curated example MatchSets.
- **D-02:** Select examples from Phase 33 validation evidence whenever possible, so examples are evidence-backed rather than hand-picked in isolation.
- **D-03:** Prefer non-transitive, close, counter-style, or role-revealing matchups over strongest-vs-weakest demonstrations.
- **D-04:** Include selected v1.4 benchmark Starters when they clarify Advanced Strategy behavior, especially Backstab Hunter, Aggro Chaser, and Wall Press.

### Coverage Targets

- **D-05:** Example MatchSets should collectively cover anti-backstab vs backstab pressure, wall control vs contact pressure, center control vs evasive mobility, trap/control vs pressure, contraction survival vs mobility or pressure, and memory adaptation or mirror-breaking when Phase 33 evidence supports it.
- **D-06:** The example set does not need to cover every Advanced Strategy, but should avoid showcasing only one dominant archetype.

### Completion and Reporting

- **D-07:** Example MatchSets must be complete, counted when eligible, replay-backed, and reproducible from local scripts or documented commands.
- **D-08:** Each example should include provenance, compatibility metadata, entrants, MatchSet result link, representative replay links, and a brief public-safe explanation of what the interaction demonstrates.
- **D-09:** Degraded, system-failed, or non-counted examples may be documented only as caveats; they should not be selected as headline examples unless the point is explicitly diagnostic.

### the agent's Discretion

The planner may choose exact example names, number of matches per MatchSet, route/link formatting, and whether the generation script creates examples directly or derives them from Phase 33 artifacts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and privacy/runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 34 requirements DEMO-01 and DEMO-02.
- `.planning/ROADMAP.md` — Phase 34 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/31-result-data-analysis-and-evidence-model/31-CONTEXT.md` — Evidence packet and local report contracts.
- `.planning/phases/32-advanced-strategy-library-design/32-CONTEXT.md` — Accepted Advanced seed metadata and archetype expectations.
- `.planning/phases/33-deterministic-gauntlet-validation/33-CONTEXT.md` — Validation evidence, representative replay, and tuning gate requirements.

### v1.5 Research

- `.planning/research/v1.5-SUMMARY.md` — Milestone-level demo/report expectations.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Strategy diversity and example interaction recommendations.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Replay handoff and result-summary expectations.

### Existing Demo and Result Code

- `scripts/run-v1-4-demo-tournament.ts` — Existing deterministic demo generation and link/report style.
- `packages/persistence/src/matchset-status.ts` — MatchSet completion, degraded status, and scoring refresh.
- `packages/persistence/src/scoring.ts` — Counted scoring and system-failure separation.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Representative MatchSet result page to link from local reports if present.
- `apps/web/app/replays/[matchId]/page.tsx` — Representative replay target to link when present.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing demo generation already creates deterministic, linkable MatchSets and replay samples.
- Phase 31/33 evidence artifacts should provide candidate matchups and representative replay categories for Phase 34 to select.
- Public result pages already carry the privacy-safe presentation contract that example links should respect.

### Established Patterns

- Examples should be reproducible through scripts or documented commands, not manually assembled database state.
- Public demo/report text must use non-durable framing and avoid implying official rankings.
- MatchSet result pages and replays must not expose Strategy source or private memory/objective payloads.

### Integration Points

- The local demo/report should receive stable links to each example MatchSet and representative replay.
- Phase 35 may reuse strong example interactions as tournament narrative anchors, but should generate its own completed tournament evidence.

</code_context>

<specifics>
## Specific Ideas

- Candidate example labels can be tactical and readable, such as `Anti-Backstab Stress Test`, `Wall Control Under Pressure`, `Center vs Mobility`, `Trap Breakpoint`, and `Memory Adaptation Mirror`.
- If fewer than five high-quality interactions emerge from Phase 33, Phase 34 should record the gap and route it back to Phase 33/36 tuning rather than filling the report with weak examples.

</specifics>

<deferred>
## Deferred Ideas

- The completed 8+ entrant tournament belongs to Phase 35.
- Replay-quality review and any tuning from visual/tactical review belongs to Phase 36.
- Browser verification of example pages belongs to Phase 37.

</deferred>

---

*Phase: 34-Example MatchSet Generation*
*Context gathered: 2026-05-20*
