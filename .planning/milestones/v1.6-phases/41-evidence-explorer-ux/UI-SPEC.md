# Phase 41 UI Spec: Evidence Explorer

## Contract
- The explorer is an operational analysis page, not a marketing page.
- Default sort helps find weaknesses first: low points, losses, weak bands, then low evidence count.
- Degraded/system rows lead with reliability context.
- Detail panel shows MatchSet ids, Match ids, replay moment links, and compatibility metadata.

## Controls
- Band filter, tier/archetype filter, counted-status filter, replay-availability filter, and sort select.
- Query parameters can preselect a Strategy/opponent pair from the heatmap.

## Privacy
- Never render source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, or owner debug by default.
