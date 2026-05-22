# Requirements: Coward's Game v1.6 Workshop Analytics and Evidence Explorer

**Defined:** 2026-05-21
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.6 Requirements

Requirements for turning deterministic Workshop and MatchSet evidence into saved, comparable, drillable, replay-backed, and owner-exportable analytics.

### Analytics Evidence Model

- [ ] **AEM-01**: Developer can use stable typed summary contracts for gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, and replay references.
- [ ] **AEM-02**: Analytics summaries include profile id, run id, candidate Strategy Revision ids, opponent Strategy Revision ids, preset id, seed policy, mirror/side policy, scoring policy, rule version, Chronicle version, runtime adapter metadata, and generated-at timestamp.
- [ ] **AEM-03**: Matchup records summarize W-L-D, points, failure counts, degraded/non-counted counts, system-failed counts, side split, evidence count, and representative replay references for each Strategy-opponent pair.
- [ ] **AEM-04**: Evidence bands classify matchup records as strong evidence, thin evidence, degraded/non-counted evidence, or system-failed evidence using deterministic count/status/failure rules.
- [ ] **AEM-05**: Analytics records preserve public-safe opponent labels, tier, primary archetype, secondary archetype tags, lineage ids, and source hashes without Strategy source.
- [ ] **AEM-06**: Analytics summary ordering is deterministic for identical inputs regardless of database row order.
- [ ] **AEM-07**: Analytics DTO/schema tests fail if public summaries expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals.
- [ ] **AEM-08**: Analytics compatibility metadata distinguishes profile identity, display name, profile hash, comparison compatibility key, rule version, Chronicle version, runtime adapter, preset, scoring policy, seed set, opponent set, and candidate revision set.

### Saved Gauntlet Profiles

- [ ] **SGP-01**: User can save a named gauntlet profile with exact candidate revisions, opponents, presets, seeds, rule versions, Chronicle version, runtime adapter metadata, scoring policy, mirror policy, and owner id.
- [ ] **SGP-02**: User can list, view, rename, and annotate their saved gauntlet profiles without changing the profile compatibility key.
- [ ] **SGP-03**: User can rerun a saved gauntlet profile through existing MatchSet/job infrastructure without executing Strategy code in the web/API process.
- [ ] **SGP-04**: Saved profile reruns use immutable Strategy Revision ids and reject missing, invalid, unauthorized, or incompatible revisions before jobs are created.
- [ ] **SGP-05**: User can compare two gauntlet runs only when their profiles are compatibility-equivalent.
- [ ] **SGP-06**: Comparison is blocked with explicit mismatch reasons when candidate revisions, opponents, seeds, preset, scoring policy, rule version, Chronicle version, runtime adapter, or mirror policy differ.
- [ ] **SGP-07**: Profile run summaries expose queued, running, complete, degraded, Strategy-failed, system-failed, non-counted, and replay-unavailable states.
- [ ] **SGP-08**: Profile persistence and rerun tests prove identical saved profiles produce identical profile hashes, compatibility keys, matrix expansion order, and summary ordering.

### Matchup Heatmaps

- [ ] **HEAT-01**: Workshop shows a matchup heatmap across selected owned Strategy Revisions and selected Starter/Advanced/custom opponents.
- [ ] **HEAT-02**: Each heatmap cell shows W-L-D, points, evidence band, evidence count, and replay availability for the Strategy-opponent pair.
- [ ] **HEAT-03**: Heatmap cell details expose failure counts, degraded/non-counted counts, system-failed counts, side split, and scoring impact.
- [ ] **HEAT-04**: Heatmap controls let users choose saved profile runs and compare compatible runs without rerunning Strategy code in the web/API process.
- [ ] **HEAT-05**: Heatmap visuals distinguish strong, thin, degraded/non-counted, and system-failed evidence without implying unsupported certainty.
- [ ] **HEAT-06**: Heatmap rows and columns preserve stable deterministic ordering with optional grouping by opponent tier and archetype.
- [ ] **HEAT-07**: Heatmap cells link to the corresponding evidence explorer drilldown for that Strategy-opponent pair.
- [ ] **HEAT-08**: Heatmap browser tests cover desktop and mobile layouts without overlapping text or unreadable cells.

### Evidence Explorer UX

- [ ] **EXP-01**: User can open an evidence explorer for a Strategy and inspect matchup evidence grouped by opponent, archetype, profile run, MatchSet, and replay reference.
- [ ] **EXP-02**: User can sort evidence by points, W-L-D, evidence band, evidence count, failure count, side bias, opponent archetype, and replay availability.
- [ ] **EXP-03**: User can filter evidence by opponent tier, archetype tag, profile run, counted status, evidence band, failure category, side, and replay availability.
- [ ] **EXP-04**: User can drill down from Strategy summary to opponent record to MatchSet summary to individual Match replay links.
- [ ] **EXP-05**: Evidence explorer copy clearly distinguishes benchmark/demo evidence from durable ratings, official tournament results, or permanent balance truth.
- [ ] **EXP-06**: Evidence explorer public DTO/page tests fail if private Strategy/runtime/replay fields are present by default.
- [ ] **EXP-07**: Evidence explorer states handle empty profiles, pending runs, degraded runs, replay-unavailable Matches, and system failures without conflating them with Strategy weakness.
- [ ] **EXP-08**: Evidence explorer UI uses existing Workshop design patterns and remains usable without adding a general-purpose analytics dashboard landing page.

### Replay Deep Links

- [ ] **LINK-01**: Analytics summaries can include public-safe replay references targeted to meaningful moments instead of only Match start.
- [ ] **LINK-02**: Replay moment detection finds representative Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization moments when present.
- [ ] **LINK-03**: Replay deep links encode Match id, public sequence or moment id, and moment type using stable URL state.
- [ ] **LINK-04**: Replay viewer can open a deep link at or near the targeted public sequence and visually highlight or focus the corresponding timeline entry.
- [ ] **LINK-05**: Replay deep links degrade gracefully when a target sequence is unavailable, incompatible, private, or no longer present.
- [ ] **LINK-06**: Replay moment detection is deterministic for identical Chronicles and uses public projection data by default.
- [ ] **LINK-07**: Owner debug replay authorization remains server-side and separate from public deep-link targeting.

### Owner Export and Privacy

- [ ] **EXPOR-01**: Owner can export a saved gauntlet profile run summary as JSON containing profile metadata, compatibility key, matchup records, evidence bands, MatchSet references, and replay references.
- [ ] **EXPOR-02**: Owner can export matchup records as CSV with stable columns and RFC 4180-compatible escaping.
- [ ] **EXPOR-03**: Owner exports omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, owner debug, and private runtime internals by default.
- [ ] **EXPOR-04**: Export endpoints authorize the profile owner before returning JSON or CSV data.
- [ ] **EXPOR-05**: Exported summaries include enough deterministic provenance to reproduce what was summarized without containing raw private runtime artifacts.
- [ ] **EXPOR-06**: Export tests cover user-controlled names/notes and prevent CSV formatting or formula-style surprises from corrupting row boundaries.
- [ ] **EXPOR-07**: Public users cannot export another user's owner-only analytics summary.
- [ ] **EXPOR-08**: Export UI explains counted/degraded/system-failed evidence status in the exported data without claiming durable ratings.

### Demo, Docs, Verification

- [ ] **VER-01**: v1.6 generates local example analytics data using Starter and Advanced opponents so a user can study a Strategy's weak and strong archetype matchups.
- [ ] **VER-02**: Local demo flow lets a user open a Strategy, view its matchup heatmap, identify weak archetypes, drill into representative replays, and export an owner-safe gauntlet summary.
- [ ] **VER-03**: Browser verification covers saved profiles, rerun state, heatmap, evidence explorer, replay deep links, and owner export controls.
- [ ] **VER-04**: Runtime isolation tests prove analytics, profile save, profile rerun, comparison, heatmap, explorer, and export web/API routes do not execute Strategy code.
- [ ] **VER-05**: Public privacy tests cover analytics summaries, heatmaps, explorer drilldowns, replay references, Strategy cards, MatchSet links, and exports.
- [ ] **VER-06**: Documentation updates cover saved gauntlet profiles, compatibility-equivalent comparison, evidence bands, heatmap interpretation, replay deep links, export privacy, and local demo regeneration.
- [ ] **VER-07**: Milestone audit verifies all v1.6 requirements, representative browser pages, privacy boundaries, runtime isolation, and deterministic summary behavior before completion.

## Future Requirements

Deferred to later milestones.

### Replay Analysis Expansion

- **REPLAYX-01**: User can search replay timelines across all public event types with event filters and saved timeline queries.
- **REPLAYX-02**: User can inspect threat/backstab overlays, contraction risk markers, and side-by-side replay comparisons.

### Competition Operations

- **COMPX-01**: User can participate in official scheduled public tournaments with public operations, moderation, and governance.
- **COMPX-02**: User can participate in durable all-time ratings after analytics, abuse data, and governance support a permanent ranking promise.

### Runtime and Strategy Authoring

- **RUNX-01**: Developer can promote the containerized subprocess boundary from production-candidate to production-grade hostile-code isolation.
- **AUTHX-01**: User can use Strategy authoring snippets, lint rules, tactical helpers, and deeper diagnostics for no-advance/trapped-Soldier mistakes.

## Out of Scope

Explicitly excluded from v1.6. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Durable ratings or permanent leaderboards | v1.6 studies deterministic evidence but does not create a permanent competitive promise. |
| Official public tournament operations | Analytics improves Workshop learning; tournament operations need separate governance/product work. |
| Production-grade hostile-code sandboxing | Existing runtime boundaries remain mandatory, but sandbox promotion is not the v1.6 focus. |
| Browser/API Strategy execution | Violates the core isolation rule; analytics may enqueue existing worker-backed MatchSets only. |
| Raw private runtime export | Owner exports are summary-oriented by default; raw private artifacts need a separate explicit authorization design. |
| Full replay timeline search and overlays | v1.6 adds targeted deep links, not a complete replay analysis suite. |
| New chart/table dependency by default | Local typed React/CSS should be attempted first; dependencies can be justified during planning if needed. |
| Custom or randomized arenas | Arena changes would distort comparison compatibility and evidence interpretation. |
| Live model inference or human control during Matches | Contradicts the deterministic autonomous Match contract. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| AEM-01 | — | Pending |
| AEM-02 | — | Pending |
| AEM-03 | — | Pending |
| AEM-04 | — | Pending |
| AEM-05 | — | Pending |
| AEM-06 | — | Pending |
| AEM-07 | — | Pending |
| AEM-08 | — | Pending |
| SGP-01 | — | Pending |
| SGP-02 | — | Pending |
| SGP-03 | — | Pending |
| SGP-04 | — | Pending |
| SGP-05 | — | Pending |
| SGP-06 | — | Pending |
| SGP-07 | — | Pending |
| SGP-08 | — | Pending |
| HEAT-01 | — | Pending |
| HEAT-02 | — | Pending |
| HEAT-03 | — | Pending |
| HEAT-04 | — | Pending |
| HEAT-05 | — | Pending |
| HEAT-06 | — | Pending |
| HEAT-07 | — | Pending |
| HEAT-08 | — | Pending |
| EXP-01 | — | Pending |
| EXP-02 | — | Pending |
| EXP-03 | — | Pending |
| EXP-04 | — | Pending |
| EXP-05 | — | Pending |
| EXP-06 | — | Pending |
| EXP-07 | — | Pending |
| EXP-08 | — | Pending |
| LINK-01 | — | Pending |
| LINK-02 | — | Pending |
| LINK-03 | — | Pending |
| LINK-04 | — | Pending |
| LINK-05 | — | Pending |
| LINK-06 | — | Pending |
| LINK-07 | — | Pending |
| EXPOR-01 | — | Pending |
| EXPOR-02 | — | Pending |
| EXPOR-03 | — | Pending |
| EXPOR-04 | — | Pending |
| EXPOR-05 | — | Pending |
| EXPOR-06 | — | Pending |
| EXPOR-07 | — | Pending |
| EXPOR-08 | — | Pending |
| VER-01 | — | Pending |
| VER-02 | — | Pending |
| VER-03 | — | Pending |
| VER-04 | — | Pending |
| VER-05 | — | Pending |
| VER-06 | — | Pending |
| VER-07 | — | Pending |

**Coverage:**
- v1.6 requirements: 54 total
- Mapped to phases: 0
- Unmapped: 55

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 after v1.6 milestone definition*
