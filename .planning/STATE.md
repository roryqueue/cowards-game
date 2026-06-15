---
gsd_state_version: 1.0
milestone: v1.36
milestone_name: Competition Maturity
status: planning
stopped_at: Phase 249 planned
last_updated: "2026-06-15T00:00:00.000Z"
last_activity: 2026-06-15 -- Phase 249 planned and verified
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# State: Coward's Game

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-15)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 249 execution

## Current Position

Phase: 249 - Competition Surface Inventory and Policy Lock
Plan: 0 of 3
Status: Plans verified; ready to execute
Last activity: 2026-06-15 -- Phase 249 planned and verified

Progress: [----------] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Status | Plans | Requirements |
|-------|--------|-------|--------------|
| 249. Competition Surface Inventory and Policy Lock | Ready to execute | 0/3 | 5 |
| 250. Counted Entry and One-Active-Revision Enforcement | Not started | 0/0 | 6 |
| 251. Season Lifecycle and Scheduling Policy | Not started | 0/0 | 5 |
| 252. Counted-State Classifier and Standings Recompute | Not started | 0/0 | 6 |
| 253. Governance, Dispute, Abuse, and Recovery Surfaces | Not started | 0/0 | 6 |
| 254. Public Trust UX Projections | Not started | 0/0 | 5 |
| 255. Service-Backed E2E Proof and Boundary Monitors | Not started | 0/0 | 6 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Recent decisions affecting current work:

- v1.35 shipped and archived on 2026-06-15 after closing runtime/account/security-policy edges or explicitly documenting deferred production sandbox, package ecosystem, TinyGo, and ABI work.
- v1.36 is not a workstream and continues phase numbering after v1.35. The active phase range is 249-255.
- v1.36 uses 7 standard-granularity phases derived from the 39 current milestone requirements only.
- v1.36 competition posture is public beta trial competition with resettable Season-scoped standings and no durable permanent rating, all-time ranking, rating refund, or mature staffed moderation promise.
- Counted competition eligibility must use current provider-proof, language, runtime, provenance, sandbox-readiness, and package-policy evidence from v1.35.
- Package mode remains `none`; TinyGo remains spike-only and hidden from production surfaces.
- No game-rule changes are planned for v1.36.
- Strategy execution remains outside web/API/Go and behind runtime-service / Runtime Broker / provider boundaries.
- Public/default outputs must not expose Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, account-recovery payloads, dispute internals, or operator-only governance details.

### Pending Todos

- Run `$gsd-execute-phase 249` to execute the verified plans.

### Blockers/Concerns

- The local `gsd-sdk` binary in this checkout does not expose the `query` subcommand referenced by the workflow text, so milestone switching and roadmap creation were performed manually while preserving workflow gates.
- v1.36 must avoid treating archived v1.35 requirements as active scope; v1.35 is baseline evidence only.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Ratings | Durable permanent rating promise, all-time rankings, rating refunds | Future explicit milestone | v1.36 roadmap |
| Moderation | Full abuse moderation system, public sanction history, appeal SLAs, staffed operations | Future explicit milestone | v1.36 roadmap |
| Recovery | Full account recovery product and sensitive recovery payload handling | Future explicit milestone | v1.36 roadmap |
| Runtime | Production sandbox certification for any lane | Future explicit milestone | v1.35 scope |
| Packages | Rich TypeScript/Python/Rust/Zig/TinyGo package ecosystems | Future explicit milestone | v1.35 scope |
| TinyGo | Production TinyGo support | Future explicit milestone | v1.35 scope |
| ABI | Direct exports or Component Model/WIT replacement for Preview 1 stdin/stdout JSON | Future explicit milestone | v1.35 scope |
| Game Rules | Any deterministic rule changes | Future explicitly approved milestone only | v1.36 roadmap |

## Session Continuity

Last session: 2026-06-15T00:00:00.000Z
Stopped at: Phase 249 planned and verified
Resume file: `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-01-PLAN.md`
Next command: `$gsd-execute-phase 249`
