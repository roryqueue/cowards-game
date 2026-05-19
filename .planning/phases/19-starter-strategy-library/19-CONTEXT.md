# Phase 19: Starter Strategy Library - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 19 delivers a credible, forkable Starter Strategy Library inside the existing Workshop. The phase must seed approximately 10 playable default Strategies, expose safe metadata/source/validation details, allow a signed-in user to intentionally fork a starter into account-owned Strategy data, and prove the starters validate and run without forbidden runtime behavior.

This phase does not build trial ladder entry, standings, public player profiles, public Strategy cards, disputes, moderation, or the production runtime boundary. Those are later v1.3 phases.

</domain>

<decisions>
## Implementation Decisions

### Starter Competence Bar
- **D-01:** Use a mixed competence bar anchored on credible-but-readable starters, with a significant tiered element if strategy design warrants it, but no more than 4 advanced starters.
- **D-02:** No starter should be a joke, placeholder, or pure API demo. Every starter should have a real doctrine and be capable of beating naive or mismatched opponents.
- **D-03:** Advanced starters should mean readable but richer tactical condition chains, with each advanced starter teaching a harder strategic concept.
- **D-04:** StrategyMemory or SoldierMemory is allowed in advanced starters only when it clarifies doctrine or strategic behavior.
- **D-05:** The starter set should prioritize strategic coverage and learning progression. Matchup diversity is useful but secondary; sacrifice matchup diversity before coverage or progression.
- **D-06:** Player-facing starter labels should be doctrine-first only. Do not show beginner/intermediate/advanced, strength tiers, or power rankings publicly.

### Doctrine Shape and Source Style
- **D-07:** Use doctrine-specific source styles. The library should expose players to different strategic coding approaches, even if that creates a steeper learning curve.
- **D-08:** Keep the Strategy API shape consistent, but do not force every starter to share the same internal scaffold.
- **D-09:** Each starter source should include a short doctrine header plus priority comments that orient the reader and label key decision sections.
- **D-10:** Avoid heavy inline tutorial commentary. Source should remain Strategy code first, not an article.
- **D-11:** Use memory only where the doctrine needs it, but ensure at least three starters use StrategyMemory or SoldierMemory in a meaningful capacity.
- **D-12:** The 10 doctrines should be strongly distinct internally. Each starter should make noticeably different decisions and use meaningfully different heuristics, even if that increases maintenance work.

### Library Placement and Fork Flow
- **D-13:** The Starter Library should primarily live as a distinct section inside the Workshop.
- **D-14:** Do not mix serious starter Strategies with failure-mode samples or generic templates. Existing sample/template infrastructure can be reused, but the player-facing grouping must be distinct.
- **D-15:** Selecting a starter should preview its source and metadata first. Forking into account ownership must be an explicit action, such as "Fork to my account."
- **D-16:** Loading a starter as an editor draft can remain a secondary affordance if it fits the Workshop pattern, but account ownership should feel intentional.
- **D-17:** After forking, prefer a small success choice if it stays lightweight; otherwise stay in the Workshop with the fork selected. The default must preserve the edit/test flow.
- **D-18:** Preferred ownership shape: forking creates an account Strategy from the starter template and its first immutable revision, if that fits the current model.
- **D-19:** Minimum lineage shape: forked account data records starter id, starter name, starter version, and starter source hash. The system starter remains immutable.

### Validation and Battle Testing
- **D-20:** Every starter must pass Strategy source validation and at least one smoke Match through the existing execution path.
- **D-21:** Add selective doctrine-specific behavior checks for advanced or trickier starters where feasible.
- **D-22:** Use a small curated starter-vs-starter gauntlet to catch obviously broken doctrines and verify meaningful interactions.
- **D-23:** Do not require fixed win rates, exact winners, or ranked expectations for starters.
- **D-24:** Tests should prove validation, execution, and intended behavior signals where observable.
- **D-25:** Keep an underperforming starter if its doctrine is clear, execution is healthy, and it teaches a distinct strategic idea. Revise or replace only if it is so weak that it misleads players about the doctrine.

### the agent's Discretion
- The planner may decide which starter doctrines count as advanced, subject to the maximum of 4 advanced starters.
- The planner may decide which at least three starters use memory, as long as memory has meaningful strategic value.
- The planner may choose the exact curated gauntlet matchups and doctrine-specific behavior signals.
- The planner may choose whether the post-fork success choice is lightweight enough to include; otherwise use the Workshop-with-fork-selected fallback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — Current milestone goal, constraints, and non-negotiable project context.
- `.planning/REQUIREMENTS.md` — START-01 through START-07 define Phase 19 requirements and boundaries.
- `.planning/ROADMAP.md` — Phase 19 goal, success criteria, and notes.
- `.planning/research/SUMMARY.md` — v1.3 research summary with starter library and runtime trust context.

### Existing Workshop and Strategy Code
- `packages/persistence/src/workshop.ts` — Existing Workshop templates, samples, validation summaries, revision building, test MatchSet creation, and Workshop snapshot shape.
- `apps/web/app/workshop/workshop-client.tsx` — Existing Workshop UI for templates, samples, editor, validation, revision history, account save, and test launch flows.
- `apps/web/app/workshop/server.ts` — Existing Workshop server facade that routes validation, source submission, source loading, and tests.
- `apps/web/app/competitive/server.ts` — Existing account-owned revision save/source access and competitive server patterns useful for fork-to-account behavior.
- `packages/runtime-js/src/validation.ts` — Strategy source validation rules, forbidden patterns, byte limits, and validation report shape.
- `packages/runtime-js/src/revision.ts` — Strategy Revision building, hashing, validation, and immutability behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `listWorkshopSamples()` in `packages/persistence/src/workshop.ts`: existing pattern for starter/failure-mode sample metadata, source, validation, categories, and grouping.
- `listWorkshopTemplates()` in `packages/persistence/src/workshop.ts`: existing pattern for templates with label, source, and validation.
- `buildWorkshopRevision()` and `buildStrategyRevision()`: existing revision creation paths that can inform starter fork behavior.
- `createAccountStrategyRevision()` via `apps/web/app/competitive/server.ts`: existing account-owned revision save flow.
- `WorkshopClient` in `apps/web/app/workshop/workshop-client.tsx`: existing UI already supports source preview/loading, validation, account saving, and grouping samples.
- Workshop tests in `apps/web/app/workshop/workshop-client.test.tsx` and persistence/runtime tests can be extended for starter grouping, validation, and smoke behavior.

### Established Patterns
- Workshop samples are already grouped into starter samples and failure-mode samples; Phase 19 should make the serious Starter Library more distinct rather than flattening those together.
- Strategy source validation returns structured reports with source hash, source bytes, runtime version, and compatibility metadata.
- Account-owned competitive revisions already go through session-backed server authorization and should remain separate from local Workshop owner shortcuts.
- Public/competitive outputs avoid private Strategy internals by default; starter metadata should follow the same privacy posture.

### Integration Points
- Add Starter Library data in persistence/workshop or a closely related starter service.
- Add Workshop UI section for starter browsing, preview, and explicit fork action.
- Add an API/server action for fork-to-account that uses session-backed user identity.
- Add tests around starter validation, source loading/preview, fork lineage, account-owned revision creation, and smoke/gauntlet execution.

</code_context>

<specifics>
## Specific Ideas

- Starter set should include: Centerline Bully, Corner Lurker, Backstab Hunter, Wall Press, Ring Runner, Mirror Breaker, Center Turtle, Aggro Chaser, Escape Artist, and Trap Setter.
- Use doctrine labels and tactical tags, not public difficulty or power labels.
- At least three starters should use StrategyMemory or SoldierMemory meaningfully.
- No more than four starters should be advanced.
- Fork lineage should include starter id/name/version/source hash at minimum.

</specifics>

<deferred>
## Deferred Ideas

- Account/onboarding starter entry point — useful later, but Phase 19 keeps the primary surface in Workshop.
- Standalone public starter library page — likely belongs after public profiles and Strategy cards.
- Starter power rankings or public difficulty labels — intentionally avoided for Phase 19.

</deferred>

---

*Phase: 19-Starter Strategy Library*
*Context gathered: 2026-05-19*
