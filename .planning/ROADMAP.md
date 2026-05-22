# Milestone v1.6: Workshop Analytics and Evidence Explorer

**Status:** Planned
**Phases:** 38-44
**Total Plans:** 7
**Requirements:** 54/54 mapped

## Overview

v1.6 turns the deterministic evidence created in v1.5 into something players can study inside the Strategy Workshop. The milestone adds saved gauntlet profiles, compatibility-aware reruns and comparisons, matchup heatmaps, evidence drilldowns, meaningful replay deep links, owner-safe exports, and a local demo proving the full study loop while preserving runtime isolation and public privacy boundaries.

## Phases

### Phase 38: Analytics Evidence Model

**Goal:** Define stable summary data for gauntlets, MatchSets, matchup records, archetype tags, evidence bands, and replay references.
**Requirements:** AEM-01 through AEM-08
**Status:** Pending

Success criteria:

1. Analytics DTOs and schemas cover profiles, runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and export-safe fields.
2. Evidence-band classification is deterministic and distinguishes strong, thin, degraded/non-counted, and system-failed evidence.
3. Summary ordering and compatibility metadata are deterministic for identical inputs.
4. Public analytics schema/DTO tests reject private Strategy/runtime/replay fields by default.

### Phase 39: Saved Gauntlet Profiles

**Goal:** Let users save, rerun, compare, and name deterministic gauntlet profiles without rerunning Strategy code in web/API.
**Requirements:** SGP-01 through SGP-08
**Status:** Pending

Success criteria:

1. Users can save, list, view, rename, annotate, and rerun named profiles with exact deterministic inputs and immutable Strategy Revision ids.
2. Reruns use existing MatchSet/job infrastructure and reject missing, invalid, unauthorized, or incompatible revisions before job creation.
3. Comparison succeeds only for compatibility-equivalent runs and reports concrete mismatch reasons otherwise.
4. Profile hash, compatibility key, matrix expansion order, and summary ordering are stable under repeated identical inputs.

### Phase 40: Matchup Heatmaps

**Goal:** Add Workshop heatmaps showing per-opponent W-L-D, points, failures, side bias, and confidence/evidence count.
**Requirements:** HEAT-01 through HEAT-08
**Status:** Pending

Success criteria:

1. Workshop renders a deterministic Strategy-by-opponent heatmap for selected profile runs and selected opponents.
2. Heatmap cells show W-L-D, points, evidence band, evidence count, replay availability, failure/degraded/system-failed counts, side split, and scoring impact.
3. Heatmap controls support compatible run comparison without triggering Strategy execution in web/API.
4. Desktop and mobile browser checks confirm readable, non-overlapping cells and useful links to evidence drilldowns.

### Phase 41: Evidence Explorer UX

**Goal:** Build sortable/filterable evidence views with drilldowns from Strategy to opponent to MatchSet to replay.
**Requirements:** EXP-01 through EXP-08
**Status:** Pending

Success criteria:

1. Users can inspect evidence grouped by Strategy, opponent, archetype, profile run, MatchSet, and replay reference.
2. Sort and filter controls cover points, W-L-D, evidence band, evidence count, failure category, side bias, opponent archetype, counted status, and replay availability.
3. Drilldowns move cleanly from Strategy summary to opponent record to MatchSet summary to individual replay links.
4. Empty, pending, degraded, replay-unavailable, and system-failed states remain legible and are not framed as Strategy weakness.

### Phase 42: Replay Deep Links

**Goal:** Add replay links targeted to key moments: Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
**Requirements:** LINK-01 through LINK-07
**Status:** Pending

Success criteria:

1. Analytics summaries include public-safe replay references for meaningful moment types when those moments exist.
2. Replay moment detection is deterministic and uses public projection data by default.
3. Replay URLs encode Match id, public sequence or moment id, and moment type with stable URL state.
4. Replay viewer opens at or near the target timeline entry, highlights/focuses it, and gracefully degrades when the target is unavailable.

### Phase 43: Owner Export and Privacy

**Goal:** Add owner-only JSON/CSV export for gauntlet summaries while preserving public privacy boundaries.
**Requirements:** EXPOR-01 through EXPOR-08
**Status:** Pending

Success criteria:

1. Owners can export JSON summaries and CSV matchup records for their own saved gauntlet profile runs.
2. Exported data includes profile metadata, compatibility key, matchup records, evidence bands, MatchSet references, replay references, and deterministic provenance.
3. Export authorization prevents public users or other owners from retrieving private exports.
4. Export privacy and CSV tests prevent private field leakage, row corruption, and formula-style surprises from user-controlled text.

### Phase 44: Demo, Docs, Verification

**Goal:** Generate v1.6 example analytics data, browser-verify pages, update docs, and audit privacy/runtime isolation.
**Requirements:** VER-01 through VER-07
**Status:** Pending

Success criteria:

1. Local demo data lets a user open a Strategy, view matchup heatmaps against Starter and Advanced opponents, identify weak archetypes, drill into representative replays, and export an owner-safe summary.
2. Browser verification covers saved profiles, rerun state, heatmap, explorer drilldowns, replay deep links, and owner export controls.
3. Runtime isolation tests prove analytics/profile/export routes do not execute Strategy code.
4. Documentation and milestone audit cover evidence bands, compatibility comparisons, replay deep links, export privacy, local demo regeneration, privacy boundaries, and deterministic summary behavior.

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| AEM-01 through AEM-08 | Phase 38 | 8 |
| SGP-01 through SGP-08 | Phase 39 | 8 |
| HEAT-01 through HEAT-08 | Phase 40 | 8 |
| EXP-01 through EXP-08 | Phase 41 | 8 |
| LINK-01 through LINK-07 | Phase 42 | 7 |
| EXPOR-01 through EXPOR-08 | Phase 43 | 8 |
| VER-01 through VER-07 | Phase 44 | 7 |

**Coverage:** 54/54 requirements mapped.

## Next Up

**Phase 38: Analytics Evidence Model** — Define the stable data contracts and evidence-band rules that every later v1.6 phase consumes.

Recommended next command:

`$gsd-discuss-phase 38`

---
*Roadmap created: 2026-05-21*
*Last updated: 2026-05-21 after v1.6 milestone roadmap creation*
