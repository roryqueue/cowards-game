# Phase 15: MatchSet Competition Model - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase defines the deterministic competition contract for v1.2: presets, entrants, immutable Strategy Revision snapshots, Match composition, scoring points, tie-breakers, stale revision behavior, and public result publication rules. It should create the rules/data model that later queue and result phases use, without building ranked ladders, live queues, or result-page UX.

</domain>

<decisions>
## Implementation Decisions

### Competition Presets
- **D-01:** Define two v1.2 competition presets: Smoke Exhibition and Standard Exhibition.
- **D-02:** Smoke Exhibition is for fast validation and diagnostics.
- **D-03:** Standard Exhibition is the default public alpha competition preset.

### Entrants and Snapshots
- **D-04:** Entrants are immutable Strategy Revision snapshots, not mutable Strategies or abstract player slots.
- **D-05:** Each snapshot should capture revision id, source hash, runtime/engine compatibility, owner User id, public handle, display label, and snapshot timestamp.
- **D-06:** Public result output may use revision id/hash/label and owner handle, but must never copy Strategy source into public results.

### Match Composition
- **D-07:** For more than two entrants, MatchSets use all distinct pairwise entrant combinations.
- **D-08:** Pairwise Matches are mirrored according to preset policy.
- **D-09:** Small entrant caps are handled by Phase 16/18; the model should support the 2-8 owned revision range chosen for v1.2.

### Scoring Policy
- **D-10:** Use explicit point scoring for public competition: win = 3, draw = 1, loss = 0.
- **D-11:** Strategy runtime failure receives an explicit deterministic penalty. Exact penalty value/presentation may be finalized in planning or Phase 18, but the scoring model must support it.
- **D-12:** Survival evidence should be tie-breaker/supporting evidence rather than primary score.

### Tie-Breakers
- **D-13:** Tie-breakers are outcome-first: points/wins, then head-to-head when applicable, surviving Soldiers, survival turns, and deterministic revision-hash fallback.
- **D-14:** Tie-breakers must not depend on wall-clock time, database row order, worker scheduling, or other incidental nondeterminism.

### Stale Revision Behavior
- **D-15:** Once a MatchSet locks, the snapshot stays valid and competes even if a newer revision is submitted or the Strategy is later archived.
- **D-16:** Incompatible entries should be rejected before lock.
- **D-17:** Do not replace entrants with latest revisions after entry.

### Publication Rules
- **D-18:** Public result pages publish after MatchSet completion, degradation, or evidence-backed failure.
- **D-19:** v1.2 does not publish live partial competition result pages.
- **D-20:** Public entrant labels use handle + revision label + short hash, for example `@rory / "Cautious fork" / a1b2c3d4e5`.

### the agent's Discretion
The planner may choose exact preset ids, scoring policy id/version names, snapshot storage shape, and how much logic lives in `packages/spec` versus `packages/persistence`, provided scoring/preset contracts remain serializable and deterministic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.2 scope and competition/privacy decisions.
- `.planning/REQUIREMENTS.md` — Phase 15 requirements COMP-01 through COMP-08.
- `.planning/ROADMAP.md` — Phase 15 goal, success criteria, and notes.
- `.planning/phases/14-competitive-ownership-and-sessions/14-CONTEXT.md` — Phase 14 ownership/session decisions that constrain entrant ownership.
- `.planning/research/SUMMARY.md` — competition model direction and pitfalls.

### Primary Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — canonical Match, Strategy Revision, Chronicle, and privacy terminology.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — package boundary and deterministic architecture constraints.

### Existing Code
- `packages/persistence/src/presets.ts` — current `smoke-v1`, `standard-v1`, and `stress-v1` MatchSet presets.
- `packages/persistence/src/matchset-service.ts` — current preset matrix generation and revision locking.
- `packages/persistence/src/scoring.ts` — current MatchSet ranking by wins/survival metrics/revision id.
- `packages/persistence/src/scoring.test.ts` — existing scoring behavior tests.
- `packages/persistence/migrations/0001_initial.sql` — current `match_sets.matrix`, `scoring`, preset fields, and Match linkage tables.
- `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` — shared DTO/schema location for any new competition contracts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MATCH_SET_PRESETS` already defines smoke, standard, and stress presets with arena variants, seeds, and mirroring.
- `generatePresetMatrix` already produces mirrored Matches from two revision ids; Phase 15 likely generalizes or wraps this for N entrants.
- `scoreMatchSet` already produces rankings with wins/draws/losses/survival metrics and deterministic revision id fallback.

### Established Patterns
- MatchSets persist their matrix as JSON and link to Matches through `match_set_matches` with stable `matrix_index`.
- Strategy Revisions are locked when a MatchSet is inserted.
- System failures currently set Match/MatchSet degraded flags and failed system counts.

### Integration Points
- Add versioned competition/scoring policy contracts in shared spec/persistence code.
- Add entrant snapshot representation that records User/handle/revision evidence at lock time.
- Extend scoring outputs so Phase 17 can show public score breakdowns and tie-breaker path.

</code_context>

<specifics>
## Specific Ideas

- Preset names should read as competition presets, not generic internal presets: Smoke Exhibition and Standard Exhibition.
- Public labels should be human-readable and audit-friendly: handle, revision label, short hash.
- Match composition should support a user comparing up to 8 owned revisions against each other.

</specifics>

<deferred>
## Deferred Ideas

- Ranked ladders and durable rating policy.
- Public tournaments.
- Live/public partial result surfaces.
- Latest-revision entry semantics.

</deferred>

---

*Phase: 15-MatchSet Competition Model*
*Context gathered: 2026-05-19*
