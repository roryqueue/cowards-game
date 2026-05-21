# Phase 32: Advanced Strategy Library Design - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 32 defines and publishes the v1.5 Advanced Strategy Library tier. It covers the advanced seed roster contract, archetype diversity expectations, immutable system-owned seed Revision metadata, public-safe Strategy cards, and Workshop fork/apply flows. It should not run the full gauntlet validation, generate demo MatchSets, complete the demo tournament, or perform replay tuning; those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Advanced Tier Placement

- **D-01:** Advanced Strategies should live in a separate Advanced Library section inside the Strategy Workshop.
- **D-02:** The Advanced Library should sit adjacent to the Starter Library while being clearly tiered as a stronger seed set.
- **D-03:** Phase 32 should create public Strategy cards for Advanced seeds, but not a dedicated public browse route.
- **D-04:** Public labels should use `Starter` and `Advanced seed`.

### Archetype Roster and Naming

- **D-05:** The accepted Advanced set should reserve one primary slot per required archetype, while allowing hybrid behavior where it improves the Strategy.
- **D-06:** Advanced Strategy names should combine a vivid flavor name with an explicit archetype label.
- **D-07:** Target 10 Advanced Strategies. Accept 8-9 only if validation later records a written quality justification.
- **D-08:** At least half of the accepted Advanced set should use memory. There is no maximum memory-using count, and the planner should not force a Strategy to be stateless when memory meaningfully strengthens its archetype.

### Metadata and Public Card Contract

- **D-09:** Public cards should lead with doctrine and archetype, then ground claims with deterministic evidence summaries.
- **D-10:** Strength language must remain profile-scoped. Use `Advanced seed`, primary archetype, and caveats instead of durable ratings.
- **D-11:** Cards should expose public-safe evidence packet links plus representative MatchSet and replay samples.
- **D-12:** Mandatory public fields should include archetype, tags, doctrine, expected behavior, memory-use classification, source hash, byte/runtime limits, compatibility metadata, validation status, evidence/provenance links, and profile-scoped caveats.

### Fork/Apply and Source Visibility

- **D-13:** Applying an Advanced seed should be an explicit Apply-to-draft flow with confirmation and clear Advanced seed lineage.
- **D-14:** Advanced seed source should be visible only in owner-authorized Workshop library/apply surfaces. Public cards must not expose source.
- **D-15:** Advanced seed framing should be concise: label the item as an Advanced seed and describe it as a stronger benchmark/template.
- **D-16:** Advanced forks should preserve lineage with `advancedId`, version, source hash, archetype, and compatibility profile.

### the agent's Discretion

The planner may choose the exact Advanced seed names, metadata property names, card layout details, apply-flow copy, and storage shape, provided the public/private boundary and lineage requirements above are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and non-negotiables.
- `.planning/REQUIREMENTS.md` — Phase 32 requirements ADV-01 through ADV-10.
- `.planning/ROADMAP.md` — Phase 32 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/30-workshop-power-tools/30-CONTEXT.md` — Prior decisions about Workshop gauntlets, comparison, diagnostics, replay handoff, and profile-scoped result language.
- `.planning/phases/31-result-data-analysis-and-evidence-model/31-CONTEXT.md` — Evidence packet, behavior signal, review trigger, and local report contracts consumed by Advanced Library work.

### v1.5 Research

- `.planning/research/v1.5-SUMMARY.md` — Balanced v1.5 tooling and Advanced Library direction.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Advanced Strategy diversity, evidence, tuning, and tournament recommendations.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Workshop library, comparison, diagnostics, and evidence UX recommendations.

### Existing Strategy and Public Surfaces

- `packages/persistence/src/starter-strategies.ts` — Existing Starter Strategy definitions, starter source, metadata shape, and immutable Revision builder.
- `packages/persistence/src/profiles.ts` — System/public profile patterns relevant to system-owned seed ownership.
- `packages/persistence/src/workshop.test.ts` — Existing Starter Strategy invariants, source/hash uniqueness expectations, and memory-using coverage examples.
- `apps/web/app/strategies/[strategyId]/page.tsx` — Current public Strategy card surface and source/privacy boundary.
- `apps/web/app/api/account/starter-forks/route.ts` — Current Starter fork route and ownership flow to extend or mirror for Advanced apply/fork.
- `apps/web/app/competitive/server.ts` — Public DTO and Strategy summary integration points.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `starter-strategies.ts` provides the clearest local model for system-owned seed Strategies, source-hash generation, compatibility metadata, tags, and revision construction.
- Starter fork infrastructure already creates a user-owned draft from a system seed; Phase 32 can adapt that pattern for explicit Advanced seed apply/fork.
- Public Strategy cards already show safe metadata, hashes, compatibility, owner/profile context, and records without exposing private source.

### Established Patterns

- Seed Strategies should be immutable once submitted for Match or MatchSet play.
- Public surfaces can show doctrine, tags, hashes, records, lineage, and evidence, but must not reveal source, StrategyMemory, SoldierMemory, or objective payloads.
- Strategy code must never execute in web/API processes; Advanced seed creation should reuse persistence/runtime boundaries rather than introducing new execution paths.
- Existing tests enforce a Starter library of 10 Strategies with unique hashes and a mix of memory and stateless behavior; Advanced tests should use analogous invariants without cloning the Starter assumptions exactly.

### Integration Points

- Phase 32 should likely introduce an Advanced Strategy registry or extend the seed-library model so Workshop, public cards, fork/apply flows, and later gauntlet scripts consume the same canonical records.
- Public cards need evidence-link fields that Phase 33 and later phases can populate after deterministic gauntlets.
- Advanced lineage should integrate with the existing Starter lineage/public profile approach while making the seed tier explicit.

</code_context>

<specifics>
## Specific Ideas

- The Advanced set should cover pressure/contact, anti-backstab positioning, wall control, center control, contraction survival, evasive mobility, trap/control, mirror-breaking/adaptive play, late-cycle stabilization, and memory-based opponent response.
- Advanced names should be memorable enough for a seed library but anchored by clear archetype labels so players understand what each Strategy teaches.
- Memory should be treated as an advanced capability and a tactical tool, not a required marker of sophistication.
- Evidence fields may initially be present with pending/unvalidated status in Phase 32, then filled by Phase 33 and later evidence generation.

</specifics>

<deferred>
## Deferred Ideas

- Full deterministic gauntlet execution, tuning, and evidence population belong to Phase 33.
- Curated example MatchSets belong to Phase 34.
- Completed demo tournament generation belongs to Phase 35.
- Replay review and tactical tuning based on representative replays belongs to Phase 36.

</deferred>

---

*Phase: 32-Advanced Strategy Library Design*
*Context gathered: 2026-05-20*
