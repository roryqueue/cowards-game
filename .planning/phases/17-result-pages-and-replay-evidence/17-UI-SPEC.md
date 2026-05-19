# Phase 17 UI Spec: Result Pages and Replay Evidence

**Status:** Ready

## Screen

Public MatchSet result/status page.

## Layout Contract

1. Status banner: complete, running, degraded, failed.
2. Standings table: rank, entrant label, points, W/D/L, penalties.
3. Expandable entrant details: head-to-head, surviving Soldiers, survival turns, tie-breaker path.
4. Match ledger: Match, entrants, status, score impact, reason category, Chronicle hash, replay link.
5. Provenance panel: MatchSet id, preset/version, scoring policy, engine, entrant snapshots, Chronicle hashes.
6. Owner panel/actions only when signed in as an entrant owner.

## Visual Contract

- Dense, table-first, audit-friendly.
- No nested cards; use full-width sections and simple tables/lists.
- Public data and owner-only actions must be visually distinct.
- Mobile should stack sections without horizontal overflow.

