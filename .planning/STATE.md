---
gsd_state_version: 1.0
milestone: v1.37
milestone_name: Rules Integrity and Strategy Evaluation Foundations
status: planning
last_updated: "2026-07-12T19:24:19.801Z"
last_activity: 2026-07-12
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-07-12)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Select and start the milestone after v1.36 Competition Maturity.

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-07-12 — Milestone v1.37 started

## Durable Decisions

- Competition is a resettable public beta with Season-scoped standings, not a permanent rating system.
- Counted entry requires current account ownership, immutability, provider proof, supported language/provider/runtime evidence, valid provenance, and package mode `none`.
- Exhibition and self-play evidence remain distinct from counted competition.
- Counted, non-counted, degraded, disputed, invalid, and invalidated outcomes are classified from canonical evidence and recomputed into standings.
- Strategy execution remains outside web/API/Go and behind runtime-service / Runtime Broker / provider boundaries.
- Public/default output remains source, artifact, memory, objective, diagnostics, runtime-internal, dispute-internal, recovery-sensitive, and operator-detail safe.

## Deferred Items

| Category | Item | Status |
|----------|------|--------|
| Ratings | Durable ratings, all-time rankings, rating refunds | Future explicit milestone |
| Operations | Staffed moderation, sanctions, appeals, and service-level promises | Future explicit milestone |
| Recovery | Full account recovery product and sensitive recovery evidence handling | Future explicit milestone |
| Runtime | Production sandbox certification and runtime ABI migration | Future explicit milestone |
| Packages | Rich package ecosystems and TinyGo production support | Future explicit milestone |
| Validation | Standalone Nyquist VALIDATION.md artifacts for phases 249 and 251-255 | Documentation debt; milestone proof passed |

## Session Continuity

Last session: 2026-07-12
Stopped at: v1.36 archived and ready for next milestone selection
Next command: `$gsd-new-milestone`
