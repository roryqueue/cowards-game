# Phase 33: Deterministic Gauntlet Validation - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 33 validates and tunes the accepted v1.5 Advanced Strategy candidates through deterministic MatchSet evidence. It runs starter, advanced-only, and curated counter gauntlets; records evidence packets; links representative replays; and documents any Strategy changes with regenerated source hashes and rerun evidence. It should not design the Advanced Library metadata model from scratch, generate curated demo MatchSets, create the demo tournament, or perform the final browser/docs regression pass.

</domain>

<decisions>
## Implementation Decisions

### Gauntlet Suite Shape

- **D-01:** Every accepted Advanced Strategy must run against all 10 v1.4 Starter Strategies in a deterministic starter gauntlet.
- **D-02:** The Advanced set should run against itself as a complete deterministic round robin unless an equivalent complete MatchSet suite is demonstrably clearer in the local evidence report.
- **D-03:** Curated counter gauntlets are required for anti-backstab, wall/edge control, center control vs mobility, contraction survival, trap/control vs pressure, and memory-based adaptation.
- **D-04:** Curated gauntlets should prefer meaningful counter-pressure and non-transitive examples over strongest-vs-weakest demonstrations.

### Evidence and Profile Identity

- **D-05:** Each gauntlet run should emit the Phase 31 canonical JSON evidence packet plus a generated Markdown summary.
- **D-06:** Every run must include stable profile hash, readable profile label, rule/Chronicle/runtime compatibility, counted/degraded/non-counted status, generated-at timestamp, standings, W-L-D/points, MatchSet links, replay links, and caveats.
- **D-07:** Representative replay links should be deterministic samples by category, including first completed replay, best win, worst loss, first Strategy failure when applicable, and first interesting behavior signal when applicable.
- **D-08:** System failures and non-counted outcomes must remain separate from Strategy performance and must not decide validation claims.

### Acceptance and Tuning Gates

- **D-09:** Every Advanced Strategy needs at least one representative replay that demonstrates its claimed archetype behavior.
- **D-10:** Every Advanced Strategy needs at least one close or favorable matchup proving its reason to exist; specialists may keep uneven aggregate records when role evidence is strong.
- **D-11:** Dominance review should trigger when the champion has no close or unfavorable advanced-field matchup.
- **D-12:** Tuning should happen only in response to documented review triggers, replay-backed issues, privacy/system hard stops, or missing archetype proof.
- **D-13:** Any Strategy changed during tuning must become a new immutable Revision with a new source hash/provenance, then rerun through affected gauntlets plus a small smoke regression against unchanged evidence.

### the agent's Discretion

The planner may choose exact scripts, MatchSet batch sizes, output file names, and rerun minimization mechanics. It should keep run profiles deterministic and make regenerated evidence easy for Phases 34-37 to consume.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone context and deterministic/runtime/privacy constraints.
- `.planning/REQUIREMENTS.md` — Phase 33 requirements GAUNT-01 through GAUNT-07.
- `.planning/ROADMAP.md` — Phase 33 goal, success criteria, and notes.
- `.planning/STATE.md` — Current workflow state.
- `.planning/phases/31-result-data-analysis-and-evidence-model/31-CONTEXT.md` — Evidence packet schema, behavior signals, review triggers, and report contract.
- `.planning/phases/32-advanced-strategy-library-design/32-CONTEXT.md` — Advanced Strategy tier, archetype, metadata, lineage, and memory-use decisions.

### v1.5 Research

- `.planning/research/v1.5-SUMMARY.md` — Milestone-level validation strategy.
- `.planning/research/v1.5-STRATEGY-LIBRARY.md` — Advanced Strategy tuning, diversity, and non-degenerate set recommendations.
- `.planning/research/v1.5-WORKSHOP-UX.md` — Gauntlet/profile summary and replay handoff expectations.

### Existing Evidence and Execution Code

- `scripts/run-v1-4-demo-tournament.ts` — Existing deterministic demo-generation and evidence-output pattern.
- `packages/persistence/src/scoring.ts` — Current scoring, Strategy failure penalty, failed-system separation, and deterministic tie-breakers.
- `packages/persistence/src/matchset-status.ts` — MatchSet completion/degraded status and scoring refresh.
- `packages/persistence/src/ladder.ts` — Existing counted MatchSet aggregation and public standings pattern.
- `packages/persistence/src/starter-strategies.ts` — v1.4 Starter benchmark definitions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing demo tournament scripts already validate rule/Chronicle versions, collect standings, emit replay links, and guard against missing realism metrics.
- Scoring utilities already distinguish Strategy failures from system failures and should be reused for gauntlet evidence.
- MatchSet persistence already supplies completed/counted/degraded signals that evidence packets need.

### Established Patterns

- Deterministic evidence should be generated from stored MatchSets and Chronicles, not hand-maintained prose.
- Compatibility versions must remain explicit so v1.4 benchmark evidence and v1.5 fresh evidence are not conflated.
- Privacy-safe public links are acceptable; Strategy source, memory, objective payloads, and owner-debug data are not.

### Integration Points

- Phase 33 should consume the Advanced registry from Phase 32 and produce evidence artifacts consumed by example MatchSets, tournament generation, replay review, and final docs.
- Evidence summaries should feed Strategy card evidence fields when the implementation path supports it.

</code_context>

<specifics>
## Specific Ideas

- Treat Backstab Hunter, Aggro Chaser, and Wall Press as fixed v1.4 benchmark opponents, not templates for the whole Advanced field.
- Curated counter profiles should be named/readable, such as `v1.5 anti-backstab counter`, `v1.5 center-vs-mobility`, and `v1.5 trap-vs-pressure`.
- Validation should record why any 8-9 Strategy final set is accepted instead of the target 10.

</specifics>

<deferred>
## Deferred Ideas

- Curated public demo MatchSets belong to Phase 34 after gauntlet evidence identifies good interactions.
- Completed tournament generation belongs to Phase 35 after the Advanced set is accepted.
- Browser verification and docs updates belong to Phase 37.

</deferred>

---

*Phase: 33-Deterministic Gauntlet Validation*
*Context gathered: 2026-05-20*
