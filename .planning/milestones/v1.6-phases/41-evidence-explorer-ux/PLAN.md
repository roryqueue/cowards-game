# Phase 41 Plan: Evidence Explorer UX

## Goal
Create a sortable/filterable Evidence Explorer route that drills from Strategy to opponent to MatchSet to representative replay moments.

## Tasks
- Add `/workshop/evidence` as a dedicated route.
- Add filter/sort helpers for band, tier/archetype, replay availability, counted state, and failure category.
- Render a master/detail evidence table with sticky compact Strategy/profile summary.
- Link heatmap rows into the explorer with query-state defaults.

## Verification
- State tests for default weakness-first sort and filters.
- Browser check that the drilldown path reaches replay moments without exposing private fields.
