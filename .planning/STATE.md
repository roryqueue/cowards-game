---
gsd_state_version: 1.0
milestone: v1.36
milestone_name: Competition Maturity
status: planning
stopped_at: defining requirements
last_updated: "2026-06-15T00:00:00.000Z"
last_activity: 2026-06-15 -- Milestone v1.36 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-15)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** v1.36 Competition Maturity requirements and roadmap

## Current Position

Phase: Not started (defining requirements)
Plan: -
Status: Defining requirements
Last activity: 2026-06-15 -- Milestone v1.36 started

Progress: [----------] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

No v1.36 phases yet.

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Recent decisions affecting current work:

- v1.35 shipped and archived on 2026-06-15 after closing runtime/account/security-policy edges or explicitly documenting deferred production sandbox, package ecosystem, TinyGo, and ABI work.
- v1.36 is not a workstream and should continue phase numbering after v1.35, starting at Phase 249 unless the roadmap is explicitly reset later.
- The v1.36 focus is competition maturity: season policy, entry eligibility, standings/result governance, abuse/dispute/account-recovery expectations, public trust copy, and replay/result realism.
- Competition can move toward public beta only where the product has honest evidence; resettable/trial posture, non-durable ratings, and future moderation/recovery work must remain explicit where still true.
- Counted competition eligibility must use current provider-proof, language, runtime, provenance, sandbox-readiness, and package-policy evidence from v1.35.
- Strategy execution remains outside web/API/Go and behind runtime-service / Runtime Broker / provider boundaries.
- Public/default outputs must not expose Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, account-recovery payloads, dispute internals, or operator-only governance details.

### Pending Todos

None yet.

### Blockers/Concerns

- The local `gsd-sdk` binary in this checkout does not expose the `query` subcommand referenced by the workflow text, so milestone switching is being performed manually while preserving the workflow gates.
- Requirements and roadmap still need approval before phase planning/execution begins.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Ratings | Durable permanent rating promise | Future explicit milestone unless v1.36 roadmap proves otherwise | v1.36 start |
| Moderation | Full abuse moderation system and broad operator workflow | Future explicit milestone unless v1.36 scopes a minimal public-safe subset | v1.36 start |
| Recovery | Full account recovery product | Future explicit milestone unless v1.36 scopes honest expectation surfaces only | v1.36 start |
| Runtime | Production sandbox certification for any lane | Future explicit milestone | v1.35 scope |
| Packages | Rich TypeScript/Python/Rust/Zig/TinyGo package ecosystems | Future explicit milestone | v1.35 scope |
| TinyGo | Production TinyGo support | Future explicit milestone | v1.35 scope |
| ABI | Direct exports or Component Model/WIT replacement for Preview 1 stdin/stdout JSON | Future explicit milestone | v1.35 scope |

## Session Continuity

Last session: 2026-06-15T00:00:00.000Z
Stopped at: Milestone v1.36 started; ready for requirements definition
Resume file: .planning/ROADMAP.md
