# Phase 29 Summary

## Completed

- Replaced `scripts/run-v13-demo-tournament.ts` with
  `scripts/run-v1-4-demo-tournament.ts`.
- Demo reset now clears both `trial-season:v13-demo` and
  `trial-season:v1-4-demo` active data paths.
- Seeded eight v1.4 entrants: Centerline Bully, Backstab Hunter, Wall Press,
  Ring Runner, Mirror Breaker, Aggro Chaser, Escape Artist, and Trap Setter.
- Generated and completed `/ladder/v1-4-demo` with two counted MatchSets and 96
  v1.4 Chronicles.
- Browser-verified the ladder, MatchSet, replay, Strategy card, and player
  profile pages.

## Demo Result

Backstab Hunter won the generated tournament at 23-1-0, followed by Aggro Chaser
and Wall Press. The ordering looks realistic for the current rules: tactical
rear-arc pressure and direct contact outperform weaker escape/trap doctrines in
this seed set.

## Demo Metrics

- Chronicles: 96
- Chronicle schema: `chronicle-v1.4`
- Rule version: `cowards-rules-v1.4`
- Cycle starts: 25,391
- Skipped activations: 3,292
- Move advances: 19,556
- Move blocks: 303
- Backstab resolutions: 516
- Contractions: 114

