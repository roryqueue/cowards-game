# Phase 28: Starter Strategy and Input Rebaseline - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 28 updates starter Strategies, Workshop templates, sample/failure examples, fixture Strategies, and preconfigured demo-entry generation inputs so players learn and test against `cowards-rules-v1.4`. Starters must behave credibly under Cycle-interleaved scheduling, Cycle-boundary Backstab, and blocked MOVE/PUSH as a Cycle cost rather than a selected-slot terminator.

This phase prepares corrected starter-derived inputs and generation paths. It does not run the full demo ladder rebuild or validate public standings/results under v1.4; Phase 29 owns that end-to-end demo competition evidence.

</domain>

<decisions>
## Implementation Decisions

### Starter Versioning and Lineage
- **D-01:** Keep stable starter IDs such as `starter:centerline-bully`, but bump starter definition `version` to `v1.4`.
- **D-02:** New v1.4 starter sources must produce new source hashes and lineage metadata.
- **D-03:** Public and private metadata must explicitly distinguish lineage versions such as "Forked from Centerline Bully v1" versus "Forked from Centerline Bully v1.4".
- **D-04:** Old v1 starter forks remain inspectable/editable but are stale for counted/demo v1.4 play until updated.
- **D-05:** Because the product is not live yet, auto-upgrade old starter forks aggressively by replacing old starter-fork source with the v1.4 starter equivalent instead of overprotecting historical test data.
- **D-06:** Capture the pre-live assumption in code/docs/tests so future agents understand why aggressive upgrade is acceptable here.

### Doctrine Retuning Bar
- **D-07:** Run a tactical pass across the starter set under v1.4 timing.
- **D-08:** Preserve doctrine identities where they still work, but weak or misleading doctrines may be replaced freely.
- **D-09:** Keep about 10 starter doctrines, with a hard minimum of 8 if replacement/tuning work proves some current doctrines misleading.
- **D-10:** Starter behavior should emphasize adaptive tactical awareness: reacting to board changes between own Cycles, avoiding stale objectives, treating blocked movement as cost, managing Backstab exposure, and surviving contraction.
- **D-11:** Starter source should include concise concept comments for the v1.4 tactic being demonstrated without becoming a tutorial.
- **D-12:** Do not enforce fixed win-rate targets or parity. Require credible interactions and no misleadingly broken doctrines.

### Strategy API Guidance
- **D-13:** Workshop templates and samples should first teach the interleaved observation model: SoldierBrain may observe board changes caused by other selected Soldiers between its own Cycles, so it should re-check local state each Cycle.
- **D-14:** Update all template/sample code, including the default template, serious starter samples, failure-mode examples, and fixture Strategies, so none teach full-Activation monopolies or old blocked-move behavior.
- **D-15:** Update or remove stale failure-mode samples. Revise examples to demonstrate still-valid failures, and delete samples that exist only for old full-Activation or blocked-move terminal semantics.
- **D-16:** Strategy API docs/templates should describe blocked MOVE/PUSH as tactical cost, not death: it consumes the Cycle, does not Advance, does not end the selected slot, and the Soldier chooses again on its next opportunity.
- **D-17:** Docs/templates should discuss memory as an adaptation tool while warning that interleaving can invalidate stale plans and each Cycle must re-check current state.

### Demo Entrant Revalidation
- **D-18:** Regenerate all preconfigured/demo entrants from v1.4 starter sources.
- **D-19:** Phase 28 prepares reusable generation paths and metadata; Phase 29 runs the demo competition rebuild.
- **D-20:** Delete old v1.3 demo entrants once v1.4 generation is ready rather than carrying stale entrant metadata.
- **D-21:** Starter-derived demo revision metadata must include `cowards-rules-v1.4`, starter version `v1.4`, source hash, and generation provenance.

### Starter Test Gauntlet
- **D-22:** Each starter must pass source validation, run in at least one smoke Match, and show at least one observable behavior signal tied to its doctrine or v1.4 adaptation.
- **D-23:** Curated starter-vs-starter gauntlet should prove interaction diversity: movement, shrink avoidance, Backstab exposure/avoidance, blocked movement recovery, memory adaptation, and survival into contraction for representative matchups.
- **D-24:** Every starter must participate in at least one Match that reaches board contraction.
- **D-25:** Starter/Strategy public metadata tests must include privacy checks for source visibility rules, private memory, runtime internals, objectives, and owner debug.
- **D-26:** Phase 28 must include a concise human-readable starter rebaseline summary covering which starters changed or were replaced, which v1.4 behaviors they demonstrate, and any remaining weaker doctrines.

### the agent's Discretion
- The planner may choose which current starter doctrines to replace if they mislead under v1.4, as long as the set remains at least 8 and ideally about 10.
- The planner may choose exact behavior signals per starter.
- The planner may choose whether auto-upgrade is implemented as data migration, seed/reset behavior, or pre-live regeneration logic, as long as old starter-fork source does not linger as active v1.4 demo/counted input.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Upstream Rule Context
- `.planning/PROJECT.md` — starter/library, privacy, runtime, and v1.4 rule-correction constraints.
- `.planning/REQUIREMENTS.md` — STRAT-01 through STRAT-07 define Phase 28 requirements.
- `.planning/ROADMAP.md` — Phase 28 goal, success criteria, and notes.
- `.planning/STATE.md` — active milestone context.
- `.planning/milestones/v1.3-phases/19-starter-strategy-library/19-CONTEXT.md` — original starter library competence, doctrine, fork, and validation decisions.
- `.planning/milestones/v1.4-phases/25-rule-source-of-truth-version/25-CONTEXT.md` — v1.4 rule label, interleaving, Backstab, blocked MOVE/PUSH, provenance, and stale-data decisions.
- `.planning/milestones/v1.4-phases/26-engine-cycle-scheduler-rewrite/26-CONTEXT.md` — engine behavior around slot state, skip events, memory writes, Backstab timing, and blocked MOVE/PUSH.
- `.planning/milestones/v1.4-phases/27-chronicle-and-replay-rebaseline/27-CONTEXT.md` — v1.4 replay evidence, fixture, privacy, and stale legacy handling decisions.

### Starter, Workshop, and Demo Surfaces
- `packages/persistence/src/starter-strategies.ts` — 10 starter definitions, source strings, version fields, source hashes, buildStarterStrategyRevision, and lineage metadata.
- `packages/persistence/src/workshop.ts` — default template, sentinel/cautious/reckless examples, Workshop samples, failure-mode samples, starter snapshot.
- `apps/web/app/workshop/workshop-client.tsx` — Starter Library preview/apply/fork UI, source/validation display, and user-facing starter metadata.
- `apps/web/app/workshop/server.ts` — Workshop server facade for validation, source submission, and account starter forks.
- `apps/web/app/competitive/server.ts` — starter fork endpoint and account-owned Strategy Revision patterns.
- `packages/persistence/src/account-revisions.ts` — account revision metadata and starter lineage persistence.
- `packages/persistence/src/profiles.ts` — public player/Strategy card projection and starter lineage visibility.
- `apps/web/app/players/[handle]/page.tsx` and `apps/web/app/strategies/[strategyId]/page.tsx` — public lineage display.
- `scripts/run-v13-demo-tournament.ts` — current v1.3 demo entrant generation path to replace or generalize for v1.4.
- `packages/runtime-js/src/validation.ts` and `packages/runtime-js/src/revision.ts` — Strategy source validation, hashing, and immutable revision creation.

### Tests and Verification
- `packages/persistence/src/workshop.test.ts` — starter listing, source hash uniqueness, sample metadata, and Workshop fixture tests.
- `apps/web/app/workshop/workshop-client.test.tsx` — Workshop starter/sample UI behavior tests.
- `apps/web/app/workshop/server.test.ts` — Workshop server/fork behavior tests.
- `packages/runtime-js/src/integration.test.ts` — runtime-engine-Chronicle integration surface for source/runtime behavior.
- `packages/persistence/src/competition.test.ts`, `packages/persistence/src/ladder.ts`, and `packages/persistence/src/matchset-service.ts` — starter-derived entrant metadata and counted/demo compatibility surfaces.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StarterStrategyDefinition` already has stable id, version, doctrine notes, expected behavior, memory flag, source, validation, source hash, and source bytes.
- `buildStarterStrategyRevision` already writes starter lineage metadata with starter id/name/version/hash.
- Workshop samples already distinguish starter and failure-mode sample kinds.
- Public profile and Strategy pages already display starter lineage version.
- Demo generation already seeds Strategy/Revisions from starter definitions and source hashes.

### Established Patterns
- Starters are doctrine-first, credible, readable, and not publicly tiered or power-ranked.
- At least some starters should use memory meaningfully.
- Public outputs expose safe metadata and hashes, not private Strategy internals or runtime/debug data.
- Generated demo inputs can be reset because v1.4 is pre-live and old demo evidence is historical.

### Integration Points
- Bump starter version type/values and update all generated lineage/provenance metadata.
- Update starter sources and Workshop templates/samples to teach v1.4 observation and blocked movement semantics.
- Replace v1.3 demo generation naming/metadata with reusable v1.4 generation inputs for Phase 29.
- Add tests for validation, smoke Matches, behavior signals, contraction participation, lineage version visibility, auto-upgrade/reset behavior, and public metadata privacy.

</code_context>

<specifics>
## Specific Ideas

- Keep the current starter names only if they remain truthful under v1.4.
- Blocked MOVE/PUSH should be handled as information/cost in starter behavior, not a catastrophic failure.
- Memory-using starters should demonstrate adaptation without blindly following stale objectives.
- Human summary should call out weaker doctrines honestly rather than hiding them behind green tests.

</specifics>

<deferred>
## Deferred Ideas

- Running the full v1.4 demo ladder and validating public standings/result pages belongs to Phase 29.
- Broad standalone public starter library beyond existing Workshop/profile/card surfaces remains future product work.
- Public power rankings or difficulty labels remain intentionally avoided.

</deferred>

---

*Phase: 28-Starter Strategy and Input Rebaseline*
*Context gathered: 2026-05-20*
