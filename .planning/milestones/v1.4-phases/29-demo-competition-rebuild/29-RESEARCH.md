# Phase 29 Research: Demo Competition Rebuild

## Findings

- `scripts/run-v13-demo-tournament.ts` owned the previous demo generation path:
  it reset demo rows, seeded eight starter entrants, scheduled a trial ladder,
  drained worker jobs, and printed public links.
- Active v1.4 requirements need `/ladder/v1-4-demo`, not `v13-demo` or
  `v14-demo`, and old v1.3 demo rows should be cleaned aggressively.
- The strongest v1.4 starter set should favor tactical/mobility/pressure
  doctrines over passive corner/turtle doctrines.
- Public verification should cover the ladder page, MatchSet result page, replay
  page, Strategy card, player profile, counted status, and privacy-safe replay
  projection.

