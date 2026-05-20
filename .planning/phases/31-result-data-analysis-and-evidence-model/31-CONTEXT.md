# Phase 31: Result Data Analysis and Evidence Model - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 31 defines the v1.5 evidence model that later phases use to analyze v1.4 demo data, summarize fresh gauntlets, validate archetype claims, flag review risks, and generate local reports. It should establish reusable JSON/Markdown artifact shapes and behavior-signal vocabulary, not build the Advanced Strategy library itself or render app pages.

</domain>

<decisions>
## Implementation Decisions

### Evidence Packet Shape

- **D-01:** The minimum complete evidence packet should include provenance, standings, and representative links.
- **D-02:** Evidence packet provenance must include profile/run identity, generated-at timestamp, rule version, Chronicle version, runtime adapter, counted/degraded status, caveats, W-L-D/points, MatchSet links, and replay samples.
- **D-03:** Evidence packets should identify runs with a stable profile hash plus a readable label, such as `v1.5 starter gauntlet / Smoke`.
- **D-04:** Representative links should be deterministic samples by category: first completed replay, best win, worst loss, first Strategy failure, and first interesting behavior signal when available.
- **D-05:** Caveat fields should always be included, including sample size, profile scope, non-durable framing, and degraded/system-failed counts.

### Behavior Signal Taxonomy

- **D-06:** Behavior signals support archetype claims; they are not proof alone.
- **D-07:** First-class metrics should use the core rules signal group: Backstab resolutions, contraction participation, Advances, blocked moves, STONE/FALLEN, skipped Activations, terminal reasons, and survival turns.
- **D-08:** Archetype claims should use a claim-to-signal mapping table that names expected supporting signals and representative replay categories.
- **D-09:** Ambiguous signals require replay-backed interpretation. If a count could mean multiple things, the report should label it ambiguous unless representative replay evidence supports the claim.

### Review Trigger Thresholds

- **D-10:** Review triggers flag for human review, not automatic failure.
- **D-11:** Privacy/system integrity triggers are hard stops. Any public leak, system-failed result deciding evidence, or Strategy code executing in the wrong process must block acceptance.
- **D-12:** Dominance should be flagged when the champion has no close or unfavorable advanced-field matchup.
- **D-13:** Overfitting to v1.4 winners should be flagged by a derivative-pattern cap: more than three Advanced Strategies primarily descended from Backstab Hunter, Aggro Chaser, or Wall Press style.

### Local Report Format

- **D-14:** The canonical evidence artifact should be JSON, with a Markdown summary generated from it.
- **D-15:** Phase 31 report artifacts should live in `.planning/phases/31-result-data-analysis-and-evidence-model/`.
- **D-16:** Later phases should consume the report through a stable schema contract.
- **D-17:** Phase 31 should require app-page readiness only through link fields. It should not build a static mock page, reusable view-model, or full local report page.

### the agent's Discretion

The planner may choose exact JSON file names, schema property names, Markdown layout, and implementation helpers. It should preserve the JSON-canonical/Markdown-generated relationship and keep the schema stable enough for Phases 32-37.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and constraints.
- `.planning/REQUIREMENTS.md` — Phase 31 requirements EVID-01 through EVID-06.
- `.planning/ROADMAP.md` — Phase 31 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/30-workshop-power-tools/30-CONTEXT.md` — Prior phase decisions about gauntlet profile identity, profile-scoped language, system-failure separation, and result comparability.

### v1.5 Research

- `.planning/research/v1.5-SUMMARY.md` — Balanced v1.5 evidence/tooling direction.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Advanced Library evidence, diversity, review-trigger, and tournament reporting recommendations.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Gauntlet profile, diagnostics, and result-summary expectations that evidence packets must support.

### v1.4 Evidence

- `.planning/milestones/v1.4-phases/29-demo-competition-rebuild/29-VALIDATION.md` — v1.4 demo validation commands and local browser links.
- `.planning/milestones/v1.4-phases/29-demo-competition-rebuild/29-VERIFICATION.md` — v1.4 demo verification summary, Chronicle/rule version proof, replay-backed evidence, and privacy verification.
- `scripts/run-v1-4-demo-tournament.ts` — Existing demo generation script and current evidence output shape.
- `packages/persistence/src/scoring.ts` — Existing scoring, Strategy failure penalty, failed-system separation, and deterministic ranking order.
- `packages/persistence/src/matchset-status.ts` — Existing MatchSet scoring refresh, degraded status, and match summary path.
- `packages/persistence/src/ladder.ts` — Existing ladder standings, counted status, public DTO, and scheduling evidence path.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/run-v1-4-demo-tournament.ts` already reads Chronicle metrics, validates `chronicle-v1.4` and `cowards-rules-v1.4`, emits standings, entrants, runtime adapter metadata, MatchSet result links, and replay samples.
- `scoreMatchSet` already separates Strategy failure penalties from `failedSystemMatches` and uses deterministic ranking tie-breakers.
- `refreshMatchSetStatus` already maps persisted matches into scoring input and records degraded status.
- `buildTrialLadderSeasonDto` already aggregates counted MatchSets into public standings and public MatchSet summaries.

### Established Patterns

- Generated evidence should preserve compatibility labels so v1.4 evidence and v1.5-generated evidence are not confused.
- Counted/degraded/non-counted distinctions already matter for public standings and should flow into evidence packets.
- Existing demo scripts fail fast when rule/Chronicle versions or basic realism metrics are missing.
- Public DTOs and generated reports must remain privacy-safe by default.

### Integration Points

- Phase 31 can extract or extend the v1.4 script's metrics shape into a reusable evidence model.
- Future gauntlet, Advanced Library, example MatchSet, and tournament phases should consume the Phase 31 JSON schema.
- Markdown report generation should be deterministic and derived from the JSON artifact rather than hand-authored.

</code_context>

<specifics>
## Specific Ideas

- Evidence packet links should be deterministic samples by category, not merely top-ranked examples.
- Behavior signals should stay humble: they support claims only when interpreted through replay and matchup context.
- Privacy/system integrity is the only trigger class that hard-stops acceptance regardless of balance.
- Dominance should be understood through matchup texture, not just aggregate win rate.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 31-Result Data Analysis and Evidence Model*
*Context gathered: 2026-05-20*
