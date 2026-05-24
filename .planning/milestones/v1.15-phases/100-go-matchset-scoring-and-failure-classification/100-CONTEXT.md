# Phase 100: Go MatchSet Scoring and Failure Classification - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 100 makes Go the normal MatchSet scoring and status refresh owner after Phase 99 terminal Match updates. It ports the current TypeScript scoring/status semantics into Go, preserves parity for rankings and degraded/system-failure behavior, and prevents public reads from depending on lazy TypeScript scoring refresh.

This phase does not redesign scoring rules, deliver public evidence route cutover, complete topology promotion gates, or retire the TypeScript runtime.

</domain>

<decisions>
## Implementation Decisions

### Go Scoring Ownership

- **D-01:** Go owns normal MatchSet scoring and status refresh after terminal Match updates.
- **D-02:** TypeScript `packages/persistence/src/scoring.ts` and `packages/persistence/src/matchset-status.ts` remain parity oracle plus explicit rollback/test implementation only.
- **D-03:** Public reads must not rely on TypeScript to lazily refresh scoring once Go scoring ownership is selected.

### Parity Scope

- **D-04:** Port current `scoreMatchSet` and `refreshMatchSetStatus` behavior to Go rather than redesigning scoring.
- **D-05:** Parity fixtures must cover wins, losses, draws, points, strategy-failure penalties, failed-system Matches, survivor totals, survival turns, and stable tie-breakers.
- **D-06:** Stable ranking tie-breakers remain points, wins, surviving Soldiers, survival turns, then Strategy Revision id.

### Status Refresh

- **D-07:** Go updates `match_sets.status`, `scoring`, `degraded`, and `completed_at` proactively after terminal Match completion.
- **D-08:** Status rules remain conservative: pending/running are non-terminal; complete requires all counted Matches complete; degraded applies when terminal evidence includes failed-system Matches; blocked/invalid inputs fail closed or remain inspectable without inventing standings.
- **D-09:** Go status refresh must handle pending, running, complete, degraded, failed-system, and blocked input states with TypeScript parity.

### Failure Classification

- **D-10:** System failures degrade or fail the MatchSet without assigning false wins or losses to players.
- **D-11:** Failed-system Match participation may be counted for both entrants where current rules require, but no false player loss is created.
- **D-12:** Runtime violations affect scoring only where existing rules classify them as Strategy/player failures, including strategy-failure penalties.
- **D-13:** Runtime service/infrastructure failures remain system failures, not Strategy/player losses.

### Public Safety

- **D-14:** Public Go-scored standings must be source-safe and replay-safe by default.
- **D-15:** Public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

### the agent's Discretion

The agent may choose Go package boundaries, fixture shape, SQL helper structure, and when to call refresh after completion, provided Go is the normal scoring owner and parity with TypeScript scoring/status behavior is verified.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — SCORE-01 through SCORE-06 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 100 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state and ownership warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Prior Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Lifecycle ownership labels, no-fallback defaults, rollback semantics, and manifest vocabulary.
- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` — Go job lifecycle and system-failure persistence decisions.
- `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md` — Runtime violation versus system-failure envelope boundaries.
- `.planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md` — Terminal Match completion and Chronicle persistence decisions.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine boundaries, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### TypeScript Parity Oracle

- `packages/persistence/src/scoring.ts`: Current scoring constants, ranking model, wins/losses/draws/points, strategy-failure penalties, failed-system participation, degraded flag, and ranking tie-breakers.
- `packages/persistence/src/matchset-status.ts`: Current status refresh SQL, Match score input mapping, status determination, `match_sets` update, and public Match summary helper.
- `packages/persistence/src/scoring.test.ts`: Existing unit coverage for tie-breakers, side-specific survivor totals, strategy-failure penalties, and failed-system degraded behavior.

### Downstream Public Reads

- Public MatchSet pages and APIs currently consume stored `match_sets.scoring` and Match/Chronicle read models. Phase 100 should ensure those reads see Go-refreshed scoring instead of depending on TypeScript lazy refresh.

### Risks To Guard

- Accidentally assigning wins/losses for system failures.
- Treating runtime service infrastructure faults as Strategy failures.
- Reordering rankings by unstable map/order behavior.
- Marking MatchSets complete when failed-system terminal evidence should degrade.
- Emitting private runtime/source data in scoring evidence.

</code_context>

<specifics>
## Specific Ideas

The phase should treat scoring as a pure-ish Go parity package plus a narrow persistence refresh. A clean plan will separate scoring calculation tests from DB refresh tests, then wire refresh into the completion flow after Phase 99 terminal updates.

</specifics>

<deferred>
## Deferred Ideas

- Public evidence route cutover and web workflow routing — Phase 101.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Scoring redesign or new competition formats — future milestone.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.

</deferred>

---

*Phase: 100-Go MatchSet Scoring and Failure Classification*
*Context gathered: 2026-05-24*
