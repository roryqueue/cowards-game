# Phase 36: Replay Review and Tuning - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 36 reviews representative replays from gauntlets, example MatchSets, and the completed demo tournament for realistic Cycle-interleaved play, tactical diversity, and non-degenerate behavior. It may tune Strategies only when replay review reveals a documented issue, then requires regenerated source hash/provenance and rerun evidence. It should not create the Advanced Library from scratch, generate the initial gauntlet suite, or perform final browser/privacy/docs regression.

</domain>

<decisions>
## Implementation Decisions

### Replay Review Scope

- **D-01:** Review representative replays from starter gauntlets, advanced gauntlets, curated example MatchSets, and the demo tournament.
- **D-02:** Ensure every accepted Advanced Strategy has at least one reviewed replay tied to its claimed archetype behavior.
- **D-03:** Prioritize replays linked to close matchups, unfavorable champion matchups, specialist proof, system/Strategy failures, surprising standings, and curated examples.
- **D-04:** Review should use both browser replay inspection and Chronicle/evidence summaries where available.

### Quality Criteria

- **D-05:** Replay review must confirm realistic Cycle-interleaved selected Soldier scheduling and Cycle-start/Cycle-end Backstab behavior.
- **D-06:** Review must confirm tactical diversity across contact pressure, anti-backstab positioning, wall control, center control, contraction survival, evasive mobility, trap/control, mirror-breaking/adaptive play, late-cycle stabilization, and memory-based response.
- **D-07:** Tune for credible diversity, tactical texture, and role clarity rather than pure aggregate win-rate optimization.
- **D-08:** Privacy/rules regressions discovered during replay review are blockers, not cosmetic issues.

### Tuning and Rerun Policy

- **D-09:** Any tuning must record the observed issue, old/new source hash, provenance change, affected archetype claim, and affected evidence profile.
- **D-10:** Tuned Strategies must rerun affected gauntlets or MatchSets and any smoke evidence needed to prove the fix did not break prior role proof.
- **D-11:** If tuning changes tournament entrants or outcomes, tournament evidence must be regenerated or explicitly invalidated and routed back to Phase 35.
- **D-12:** The local demo/report should include direct local links to the tournament, representative MatchSets, and reviewed replays selected in this phase.

### the agent's Discretion

The planner may choose the exact review checklist, screenshot artifacts, reviewer notes format, and tuning loop mechanics. It should keep the review repeatable and tied to deterministic links.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and canonical gameplay constraints.
- `.planning/REQUIREMENTS.md` — Phase 36 requirements REV-01 through REV-04.
- `.planning/ROADMAP.md` — Phase 36 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/31-result-data-analysis-and-evidence-model/31-CONTEXT.md` — Behavior signal and evidence interpretation guidance.
- `.planning/phases/32-advanced-strategy-library-design/32-CONTEXT.md` — Advanced archetype and memory-use expectations.
- `.planning/phases/33-deterministic-gauntlet-validation/33-CONTEXT.md` — Validation, tuning, and representative replay gates.
- `.planning/phases/34-example-matchset-generation/34-CONTEXT.md` — Example MatchSet links and selection goals.
- `.planning/phases/35-completed-demo-tournament/35-CONTEXT.md` — Tournament evidence and non-degenerate standings expectations.

### Rules and Replay Specs

- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Runtime, persistence, and replay architecture constraints.
- `.planning/milestones/v1.4-ROADMAP.md` — v1.4 Cycle-interleaved rule correction context.
- `.planning/milestones/v1.4-phases/29-demo-competition-rebuild/29-VERIFICATION.md` — Prior demo replay verification shape and privacy checks.

### Existing Replay and Evidence Code

- `apps/web/app/replays/[matchId]/page.tsx` — Replay page to inspect during review.
- `packages/chronicle` — Chronicle event grammar and replay reconstruction code, if present.
- `packages/persistence/src/matchset-status.ts` — MatchSet completion and evidence refresh.
- `scripts/run-v1-4-demo-tournament.ts` — Prior demo verification and link emission pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing replay pages and Chronicle summaries provide the concrete review surface for validating behavior.
- Phase 33/34/35 artifacts should already contain representative replay links and MatchSet links, reducing manual search during review.
- Prior v1.4 validation artifacts show the expected privacy and replay-browser verification shape.

### Established Patterns

- Replay review should not expose private Strategy data while diagnosing public behavior.
- Tuning changes invalidate old source hashes and require regenerated provenance.
- Realism and diversity are acceptance criteria even when deterministic tests pass.

### Integration Points

- Phase 36 outputs reviewed replay selections and tuning notes for the local demo/report.
- Phase 37 consumes the reviewed local links for browser verification and documentation.
- Any material tuning can send work back to Phase 33, 34, or 35 for regenerated evidence.

</code_context>

<specifics>
## Specific Ideas

- The replay review checklist should explicitly look for Cycle-interleaving, Backstab boundary timing, contraction participation, repeated STONE/FALLEN patterns, blocked move texture, and whether memory-using Strategies visibly adapt across cycles or Matches.
- Degenerate-looking outcomes should be documented even when they are deterministic and technically valid.

</specifics>

<deferred>
## Deferred Ideas

- Final browser regression, privacy tests, runtime isolation tests, and documentation updates belong to Phase 37.

</deferred>

---

*Phase: 36-Replay Review and Tuning*
*Context gathered: 2026-05-20*
