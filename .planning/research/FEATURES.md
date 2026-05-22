# Feature Research: v1.6 Workshop Analytics and Evidence Explorer

**Project:** Coward's Game
**Date:** 2026-05-21
**Milestone context:** v1.6 Workshop Analytics and Evidence Explorer

## Table Stakes

### Saved Gauntlet Profiles

Players need named, rerunnable profiles that capture the exact deterministic test contract:

- Candidate Strategy Revision ids.
- Opponent Strategy Revision ids and opponent labels/archetype tags.
- Preset, seeds, mirror/side policy, scoring policy, rule version, Chronicle version, runtime adapter/version, and profile expansion order.
- Creator/owner and timestamps.
- Compatibility hash or equivalence fingerprint.

The profile is the thing players compare, not just the display name. Renaming should not affect compatibility; changing participants, seeds, preset, scoring, or compatibility versions should.

### Rerun and Compare

Players need to rerun saved profiles through the existing MatchSet/worker infrastructure and compare result summaries only when profiles are compatibility-equivalent. A comparison should explain mismatch causes rather than silently comparing unlike evidence.

### Matchup Heatmaps

Heatmaps should let players scan Strategy-by-opponent performance:

- W-L-D, points, failure counts, degraded/non-counted counts.
- Side bias, especially bottom/top splits under mirrored presets.
- Evidence count and confidence/evidence band.
- Opponent archetype tags, including Starter and Advanced lineages.
- Drilldown affordance to the underlying MatchSet and representative replays.

### Evidence Bands

Evidence bands should be product language, not hidden math:

- **Strong evidence:** enough counted, replay-backed compatible Matches to treat a pattern as meaningful.
- **Thin evidence:** counted evidence exists but sample size is too low or too narrow.
- **Degraded/non-counted evidence:** some completed evidence exists, but non-counted/degraded status prevents confident conclusions.
- **System-failed evidence:** system failure dominates; it should not punish or credit Strategy quality.

### Evidence Explorer

Players need a sortable/filterable path from high-level profile to concrete proof:

Strategy -> opponent/archetype -> matchup record -> MatchSet -> Match -> replay moment.

The explorer should support filters for opponent tier, archetype, evidence band, failure category, side bias, counted status, and replay availability. It should not require reading raw event payloads.

### Replay Deep Links

Deep links should target meaningful public moments:

- Backstab.
- Contraction.
- No-advance cleanup or blocked/no-reverse recovery.
- Fall.
- Decisive push.
- Late-cycle stabilization.

These links should open the public replay at or near a public sequence and preserve owner-debug authorization separately.

### Owner Export

Owner exports should be useful for offline analysis:

- JSON summary preserving profile, compatibility hash, MatchSet references, heatmap records, evidence bands, representative replay links, and aggregate metrics.
- CSV rows for matchup records and optional Match-level summaries.
- Explicit privacy boundary: no Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, owner debug, or private runtime internals unless a future owner-authorized export mode is explicitly designed.

## Differentiators

- The player studies deterministic evidence without needing to rerun Strategy code in the web/API process.
- Heatmaps are not vague ratings; every cell can explain its profile, evidence band, counted status, and representative replay proof.
- Public analytics remain safe by construction, while owner exports are richer but still summary-oriented.

## Anti-Features

- Durable rating claims or all-time balance truth.
- Public exposure of private Strategy internals.
- Cross-profile comparisons that blur rule/preset/seed/scoring differences.
- Deep links that merely point to Match start.
- Analytics computed by re-executing Strategy source in React/API code.

## Sources

- User v1.6 milestone brief.
- `.planning/milestones/v1.5-REQUIREMENTS.md`
- `.planning/milestones/v1.5-ROADMAP.md`
- `apps/web/app/workshop/workshop-client.tsx`
- `packages/persistence/src/workshop.ts`
- `apps/web/app/matches/replay-ready.ts`
