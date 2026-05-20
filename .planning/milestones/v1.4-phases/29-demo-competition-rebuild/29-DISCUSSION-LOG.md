# Phase 29: Demo Competition Rebuild - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 29-Demo Competition Rebuild
**Areas discussed:** Demo Rebuild Scope, Validation Metrics, Old v1.3 Cleanup, Public Surface Verification, End-to-End Test Command

---

## Demo Rebuild Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full public evidence loop | Rebuild v1.4 demo ladder and every public evidence surface it feeds: MatchSets, standings, result pages, replay links, profiles, Strategy cards, and governance/counting states. | ✓ |
| Demo ladder only | Rebuild ladder season and MatchSets, relying on existing pages to keep working. | |
| Replay evidence only | Focus on replay links and corrected interleaved tactical evidence. | |

**User's choice:** Full public evidence loop.
**Notes:** Use `/ladder/v1-4-demo` style slug, seed from v1.4 starters with at least 8 entrants, and use real generated counted results plus isolated seeded governance/counting examples if needed.

---

## Validation Metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Corrected-rule evidence metrics | Rule version, entrant count, jobs, counted/non-counted states, interleaved Cycle traces, contraction count, movement count, blocked-move recovery, Backstab count, privacy checks, and representative links. | ✓ |
| Competition metrics only | Entrants, standings, records, MatchSets, counted status, replay links. | |
| Engine behavior metrics only | Interleaving traces, movement, Backstab, contraction, blocked movement. | |

**User's choice:** Corrected-rule evidence metrics.
**Notes:** Realistic play must show multiple behavior signals. Demo matches should commonly reach contraction. Include qualitative human review notes.

---

## Old v1.3 Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Delete active v1.3 demo data, keep script history only if useful | Remove active `/ladder/v13-demo` data/routes/seeds and replace script paths with v1.4 equivalents; keep history only in planning/audit docs. | ✓ |
| Stale/blocked route | Keep `/ladder/v13-demo` route but show historical/stale explanation. | |
| Redirect to v1.4 | Redirect old route to `/ladder/v1-4-demo`. | |

**User's choice:** Delete active v1.3 demo data, keep script history only if useful.
**Notes:** Replace the v1.3 demo script with a v1.4 script/path. v1.4 script should explicitly clean old `v13-demo` rows. Active docs should not reference v1.3 demo evidence.

---

## Public Surface Verification

| Option | Description | Selected |
|--------|-------------|----------|
| All public evidence pages | Render `/ladder/v1-4-demo`, MatchSet results, replay pages, player profiles, Strategy cards, and governance/non-counted state pages locally. | ✓ |
| Ladder + replay only | Verify the main ladder and representative replay pages. | |
| Ladder + MatchSet only | Verify competition result pages, but not profiles/cards/replay. | |

**User's choice:** All public evidence pages.
**Notes:** Verify public privacy absence, keep governance examples isolated from clean standings, and include browser visual review.

---

## End-to-End Test Command

| Option | Description | Selected |
|--------|-------------|----------|
| Full v1.4 trust chain | Run engine, replay, persistence, worker, web, starter, demo tournament, Playwright replay/public page checks, privacy checks, and browser verification. | ✓ |
| Demo tournament only | If the demo rebuild completes and pages render, that is enough. | |
| Package tests only | Run unit/integration tests but not the full generated demo. | |

**User's choice:** Full v1.4 trust chain.
**Notes:** Run both `pnpm verify` if feasible and a focused v1.4 demo verification script. Fail on poor qualitative demo evidence, not only failing tests. Write a `29-SUMMARY.md` or demo validation report.

---

## Planner Discretion

- The planner may choose exact script names and metrics thresholds.
- The planner may choose exact implementation for isolated governance examples.

## Deferred Ideas

- Durable ratings and official tournaments.
- Broad spectator/community surfaces.
- Full owner/private workflow retesting unless touched.
