# Phase 25: Rule Source-of-Truth Version - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 25 publishes the corrected canonical rules and technical architecture source of truth for `cowards-rules-v1.4`. It creates visible root v1.4 rules and architecture specs, marks the v1 specs as historical references, and defines the observable Cycle-interleaved scheduling and Cycle-boundary Backstab contract that later engine, Chronicle, replay, starter Strategy, fixture, and demo phases must follow.

This phase does not rewrite the engine, Chronicle grammar, replay reconstruction, starter Strategies, fixtures, public UI, persistence, or demo data. It defines the written contract and impact checklist those later phases must implement.

</domain>

<decisions>
## Implementation Decisions

### Rules Version Shape
- **D-01:** Create corrected consolidated root canonical specs for v1.4, beside the historical v1 root specs.
- **D-02:** Add both a v1.4 rules spec and a v1.4 technical architecture spec. Suggested names may follow the existing root naming pattern, such as `CowardsGameSpec_Full_Consolidated_v1_4.md` and `CowardsGame_Technical_Architecture_Spec_V1_4.md`.
- **D-03:** Keep `CowardsGameSpec_Full_Consolidated_v1.md` and `CowardsGame_Technical_Architecture_Spec_V1.md` as historical references rather than patching them in place.
- **D-04:** Add an exact-section supersession note that names the old sections and phrases replaced by v1.4, especially Round Activation Pattern, Activation Completion, Backstab boundaries, `post-advance`, and architecture version references.
- **D-05:** README and planning references should point downstream work to the v1.4 root specs first, while still preserving links to v1 historical specs where useful.

### Cycle-Interleaved Example Contract
- **D-06:** The v1.4 rules spec must include Cycle-layer tables, not just prose, so the repeated slot order is unambiguous.
- **D-07:** Include both a Round 2 example and a Round 3 example. The Round 3 example must include the required order `P1S1 -> P2S1 -> P2S2 -> P1S2 -> P1S3 -> P2S3`.
- **D-08:** Examples must show that the same selected Soldier slot order repeats for Cycle 1, Cycle 2, and later Cycle layers while slots remain active.
- **D-09:** The Cycle-layer table must explicitly show an Activation ending early and that selected slot being skipped in later Cycle layers.
- **D-10:** The ended-slot example must state that skipped ended Activations do not receive additional SoldierBrain calls and do not receive memory writes.
- **D-11:** Keep Backstab examples separate from the scheduling examples so ordering, skipping, and Backstab boundaries do not blur together.

### Backstab Boundary Vocabulary
- **D-12:** Replace `post-advance` as a standalone Backstab boundary with Cycle-end Backstab.
- **D-13:** A successful Advance may affect the Cycle-end snapshot, but it does not trigger an extra Backstab check.
- **D-14:** Cycle-start Backstab resolves before the acting SoldierBrain input is produced. If the selected Activation still continues, SoldierBrain observes the post-Backstab state.
- **D-15:** Cycle-end Backstab resolves after every Action resolution, not only after movement Actions.
- **D-16:** Cycle-end Backstab uses an all-board ACTIVE Soldier snapshot before match-end checks and before the next selected slot's Cycle-start boundary.
- **D-17:** Every Cycle-start and Cycle-end boundary section must repeat that Backstab uses simultaneous all-board ACTIVE snapshot resolution, then all unique victims become STONE together.

### v1.4 Action Failure Rule Amendment
- **D-18:** Blocked MOVE/PUSH becomes non-terminal in v1.4: it consumes the acting slot's current Cycle, does not count as a successful Advance, runs the normal Cycle-end boundary, and leaves the selected slot alive for later Cycle layers.
- **D-19:** Schema-invalid output, runtime violations, and schema-valid but impossible Actions remain terminal according to their failure class.
- **D-20:** The v1.4 source specs must explicitly call out this change because it supersedes older wording and current engine behavior where blocked movement ends an Activation.

### Architecture Impact Map
- **D-21:** The v1.4 technical architecture spec must include a strict must-update checklist of impacted surfaces rather than a loose narrative.
- **D-22:** The checklist must name docs, spec/version constants, engine scheduler, Chronicle grammar, replay reconstruction, runtime input assumptions, generated fixtures, starter Strategies/templates, preconfigured demo entrants, demo MatchSets/results, persistence/provenance, UI/debug copy, and tests.
- **D-23:** Phase 25 should define the observable ordering contract precisely, including selected slots, Cycle layers, skip behavior, Backstab boundaries, no-extra-`post-advance` behavior, blocked MOVE/PUSH non-terminal behavior, and termination effects.
- **D-24:** Phase 25 should not prescribe the exact engine data structures or algorithm; Phase 26 owns implementation shape.
- **D-25:** The architecture note must require an explicit policy for old v1/v1.3 Chronicles, fixtures, and demo results: either preserve compatibility behind version gates or mark old artifacts stale/historical with clear provenance. Silent reinterpretation is forbidden.
- **D-26:** The architecture note must include non-negotiable test obligations per impacted surface, especially engine ordering, Backstab boundaries, Chronicle grammar/replay reconstruction, starter smoke, public privacy, and demo provenance.

### Compatibility and Provenance Labels
- **D-27:** Introduce a dedicated rule/spec label such as `cowards-rules-v1.4`. Do not rely only on package engine version or Chronicle schema version to describe corrected rules.
- **D-28:** Show or store the rule-version label at every evidence boundary: docs, compatibility constants, Chronicle metadata, generated fixtures, demo MatchSets/results, replay/public result provenance, and developer validation summaries.
- **D-29:** Old v1.3 demo/replay evidence should be labeled historical and not directly comparable to v1.4 corrected-rule results.
- **D-30:** Existing Strategy source may be reused, but counted/demo v1.4 entries must be regenerated or revalidated under `cowards-rules-v1.4` so provenance is clean.

### the agent's Discretion
- The planner may choose exact v1.4 root file names if they are visibly canonical and follow the existing repository naming style.
- The planner may decide the exact supersession note format, as long as it names replaced sections and phrases explicitly.
- The planner may choose whether the strict architecture checklist is table-based or section-based, as long as each impacted surface has an owner, expected update, compatibility/provenance note, and test obligation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Planning
- `.planning/PROJECT.md` — current v1.4 milestone goal, non-negotiables, source-of-truth correction context, and active constraints.
- `.planning/REQUIREMENTS.md` — RULE-01 through RULE-07 define Phase 25 requirements.
- `.planning/ROADMAP.md` — Phase 25 goal, success criteria, notes, and downstream phase boundaries.
- `.planning/STATE.md` — current milestone position and accumulated context.

### Historical Source Specs to Supersede
- `CowardsGameSpec_Full_Consolidated_v1.md` — historical v1 rules spec; v1.4 must supersede timing and Backstab boundary language from this file.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — historical v1 architecture spec; v1.4 must supersede architecture/version surfaces affected by corrected scheduling.
- `.planning/spec-amendments/02-backstab-rule.md` — historical Phase 2 Backstab amendment; v1.4 must replace Activation-boundary and `post-advance` wording with Cycle-boundary wording.
- `README.md` — repository entry point that currently references the historical v1 specs and Backstab amendment.

### Impacted Contract and Implementation Surfaces
- `packages/spec/src/versions.ts` — current compatibility version constants; must gain or expose the dedicated v1.4 rules label downstream.
- `packages/spec/src/types.ts` — Chronicle, Strategy, runtime, and compatibility types that may need rule-version/provenance fields.
- `packages/spec/src/schemas.ts` — Chronicle schemas currently allow `post-advance` Backstab boundaries and will need v1.4 compatibility treatment downstream.
- `packages/engine/src/activation.ts` — current full-Activation resolver and Round ordering helper; Phase 26 will rewrite behavior to Cycle layers.
- `packages/engine/src/backstab.ts` — existing simultaneous Backstab resolver; boundary vocabulary and callers must align with v1.4.
- `packages/replay/src/build.ts` — Chronicle builder currently walks selected Activations one at a time.
- `packages/replay/src/grammar.ts` — Chronicle grammar currently assumes one active Activation context at a time.
- `packages/replay/src/validate.ts` — Chronicle compatibility and version validation integration point.
- `packages/replay/src/replay-transition.ts` — replay reconstruction/transition validation must match corrected interleaving.
- `packages/test-utils/src/engine-scenarios.ts` and `packages/test-utils/src/replay-scenarios.ts` — generated scenario fixture surfaces to rebaseline.
- `packages/persistence/src/starter-strategies.ts` — starter Strategy source, comments, metadata, and v1.4 validation impact.
- `packages/persistence/src/presets.ts` — MatchSet preset and provenance surface for demo/competition evidence.
- `scripts/run-v13-demo-tournament.ts` — historical demo generation path whose outputs become non-comparable historical evidence.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/versions.ts` already centralizes compatibility versions, making it the natural home or export point for `cowards-rules-v1.4`.
- `packages/engine/src/backstab.ts` already resolves Backstab from a simultaneous snapshot of ACTIVE Soldiers, so v1.4 likely needs caller/boundary changes more than a new core Backstab algorithm.
- `packages/replay/src/validate.ts` already has version-incompatibility handling and can support explicit v1/v1.4 artifact policy.
- Public projection/privacy tests already exist around Chronicle and result DTOs and should be extended, not replaced.

### Established Patterns
- Specs and planning docs are treated as contracts before implementation phases.
- Chronicle is the canonical replay artifact and must remain deterministic, compatible, and privacy-safe.
- Runtime failure and system failure distinctions must not be blurred by rule-version changes.
- Public evidence exposes provenance and hashes, not private Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness Grid details, or runtime internals.

### Integration Points
- Phase 26 consumes the v1.4 observable ordering contract for engine scheduling.
- Phase 27 consumes the v1.4 rule label and compatibility policy for Chronicle grammar, replay reconstruction, and fixture rebaseline.
- Phase 28 consumes the v1.4 Strategy timing explanation for starter Strategy source comments, templates, examples, and validation.
- Phase 29 consumes the v1.4 rule label for demo regeneration, standings/results provenance, public replay evidence, and validation summaries.

</code_context>

<specifics>
## Specific Ideas

- Use `cowards-rules-v1.4` as the dedicated corrected rules label unless the planner finds a stronger local naming convention.
- Make old v1.3 demo evidence visibly historical and not directly comparable to corrected v1.4 results.
- Write examples so "turn" never substitutes for Round, Activation, Cycle, Action, or slot.
- The v1.4 Backstab wording should make it impossible to accidentally implement Cycle-start, Cycle-end, and a third post-Advance boundary.
- The v1.4 movement wording should make blocked MOVE/PUSH visibly different from invalid output, runtime violation, or impossible Action failure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-Rule Source-of-Truth Version*
*Context gathered: 2026-05-20*
