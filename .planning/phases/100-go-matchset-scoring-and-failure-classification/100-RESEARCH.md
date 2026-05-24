# Phase 100: Go MatchSet Scoring and Failure Classification - Research

**Researched:** 2026-05-24 [VERIFIED: .planning/PROJECT.md]  
**Domain:** Go MatchSet scoring/status refresh, failure classification, public standings, parity tests [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]  
**Confidence:** HIGH for current TypeScript scoring/status/public-read behavior; MEDIUM for final runtime-violation penalty attribution because current DB refresh has a known attribution gap. [VERIFIED: packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts + .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

- Public evidence route cutover and web workflow routing — Phase 101.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Scoring redesign or new competition formats — future milestone.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCORE-01 | Developer can use Go-owned scoring logic with parity for wins, losses, draws, points, strategy-failure penalties, failed system Matches, survivor totals, survival turns, and stable tie-breakers. [VERIFIED: .planning/REQUIREMENTS.md] | Port `scoreMatchSet` constants, accumulator fields, failed-system handling, penalty behavior, and sort order exactly. [VERIFIED: packages/persistence/src/scoring.ts] |
| SCORE-02 | Developer can use Go-owned MatchSet status refresh with parity for pending, running, complete, degraded, failed-system, and blocked input states. [VERIFIED: .planning/REQUIREMENTS.md] | Port `determineMatchSetStatus` and the Match row mapping from `refreshMatchSetStatus`; add blocked/failed_system fixture coverage because current tests cover only pending/running/complete/degraded directly. [VERIFIED: packages/persistence/src/matchset-status.ts + packages/persistence/src/scoring.test.ts] |
| SCORE-03 | Developer can verify Go updates `match_sets.status`, `scoring`, `degraded`, and `completed_at` after terminal Match completion without relying on TypeScript public reads to lazily refresh scoring. [VERIFIED: .planning/REQUIREMENTS.md] | Existing TypeScript public MatchSet result builder calls `refreshMatchSetStatus` before reading, so Go must move that refresh earlier into the completion/orchestration path and stop using lazy TypeScript refresh as product behavior. [VERIFIED: packages/persistence/src/competition.ts] |
| SCORE-04 | User can view Go-scored public MatchSet standings after all Matches complete or degrade. [VERIFIED: .planning/REQUIREMENTS.md] | Go public read already maps stored `match_sets.scoring` into standings, so the missing piece is Go-owned scoring persistence plus preserving penalties in the public mapping. [VERIFIED: apps/go-backend/live_backend.go] |
| SCORE-05 | Developer can verify strategy runtime violations affect scoring as player/Strategy failures where the existing rules require, while system failures degrade or fail the MatchSet without assigning false player losses. [VERIFIED: .planning/REQUIREMENTS.md] | Runtime violations are valid Chronicle/Match outcomes and system failures are retryable/terminal system envelopes; scoring currently penalizes only when a caller supplies `strategyFailureRevisionId`. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md + packages/persistence/src/scoring.ts + .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md] |
| SCORE-06 | Developer can run parity fixtures for complete, running, degraded, failed_system, strategy-failure penalty, and tie-breaker MatchSet scenarios. [VERIFIED: .planning/REQUIREMENTS.md] | Existing Vitest coverage supplies the behavioral seed; Phase 100 should add Go unit fixtures and DB refresh tests for the same cases. [VERIFIED: packages/persistence/src/scoring.test.ts] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; Phase 100 scoring may be pure Go calculation plus explicit DB refresh, but must not move game rules into React. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in Go, web/API, or scoring/status refresh. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, filesystem, network, or database access inside engine logic; MatchSet persistence refresh is outside engine logic but should keep pure scoring calculation isolated from DB access. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate runtime boundaries with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay/output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or owner debug by default. [VERIFIED: AGENTS.md]
- Worker/runtime tests must distinguish Strategy failure from system failure. [VERIFIED: AGENTS.md]

## Summary

Phase 100 should add a Go scoring package and a narrow Go persistence refresh that exactly mirror TypeScript `scoreMatchSet`, `determineMatchSetStatus`, and `refreshMatchSetStatus`. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md + packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts] The scoring calculation should stay pure-ish and side-effect free; the DB refresh should be the only layer that reads Match rows and updates `match_sets.status`, `scoring`, `degraded`, and `completed_at`. [VERIFIED: AGENTS.md + packages/persistence/src/matchset-status.ts]

The current Go public MatchSet read already maps stored `match_sets.scoring` into public standings, but it drops persisted penalty arrays by emitting `penalties: []`; Phase 100 must preserve penalties from stored scoring before claiming public standings parity. [VERIFIED: apps/go-backend/live_backend.go + packages/persistence/src/competition.ts] The current TypeScript public result builder also lazily calls `refreshMatchSetStatus`, so Phase 100 must move refresh ownership into Go completion/orchestration rather than depending on TypeScript public reads to mask stale scoring. [VERIFIED: packages/persistence/src/competition.ts + .planning/RETROSPECTIVE.md]

**Primary recommendation:** implement Go `ScoreMatchSet`, `DetermineMatchSetStatus`, `RefreshMatchSetStatus`, and `StandingsFromScoring` parity first, then wire Go refresh immediately after Phase 99 terminal Match updates and add fixtures proving no false losses for `failed_system` Matches. [VERIFIED: packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts + .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| MatchSet score calculation | API / Backend Go | TypeScript parity oracle | Backend owns competition scoring after Match completion; TypeScript scoring is locked as oracle/rollback only. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |
| MatchSet status refresh persistence | API / Backend Go | Database / Storage | Go must compute status/scoring and update `match_sets`; PostgreSQL stores canonical status/scoring JSON. [VERIFIED: packages/persistence/src/matchset-status.ts + packages/persistence/migrations/0001_initial.sql] |
| Failure classification for scoring | API / Backend Go | TypeScript runtime service | Go classifies system-vs-Strategy effects for scoring; TypeScript runtime service only returns runtime-violation or system-failure envelopes. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md + packages/spec/src/runtime.ts] |
| Public standings projection | API / Backend Go | Frontend | Go public read assembles source-safe public standings; frontend renders DTOs and must not own scoring rules. [VERIFIED: apps/go-backend/live_backend.go + AGENTS.md] |
| Public privacy validation | API / Backend Go | Spec schemas / Web client | Go must emit source-safe data; existing spec/web guards validate service DTO privacy and safe evidence links. [VERIFIED: packages/spec/src/public-output-privacy.ts + apps/web/lib/public-go-read-client.ts] |
| Parity tests | Test infrastructure | TypeScript oracle | Go tests should compare behavior to the TypeScript fixture expectations and DB state, while TypeScript tests remain the oracle. [VERIFIED: packages/persistence/src/scoring.test.ts + package.json] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Go toolchain | module `go 1.25.0`; installed `go1.26.3` | Implement Go scorer, refresh, DB tests, and public DTO mapping. | Existing Go backend is a Go module and current local toolchain can run it. [VERIFIED: apps/go-backend/go.mod + `go version`] |
| `github.com/jackc/pgx/v5` | v5.9.2, published 2026-04-19 | PostgreSQL access for Go refresh queries and transactional updates. | Existing Go backend already uses pgx/pgxpool for live DB access. [VERIFIED: apps/go-backend/go.mod + `go list -m -json`] |
| PostgreSQL schema | migrations 0001, 0003, 0004 | Canonical storage for `matches`, `match_sets`, `match_set_matches`, `chronicles`, and competition entrant snapshots. | Current persistence schema stores all fields Phase 100 must refresh. [VERIFIED: packages/persistence/migrations/0001_initial.sql + packages/persistence/migrations/0003_competitive_alpha.sql + packages/persistence/migrations/0004_competition_trust_beta.sql] |
| TypeScript scoring oracle | repo package code | Behavioral oracle for Go parity. | Phase context locks TS `scoring.ts` and `matchset-status.ts` as parity oracle. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Vitest | repo `^4.1.6`; npm latest 4.1.7 modified 2026-05-20 | Existing TypeScript parity tests and fixture generation checks. | Use for TypeScript oracle tests and any generated fixture checks. [VERIFIED: package.json + `pnpm view vitest version time.modified`] |
| TypeScript | repo `^6.0.3`; npm latest 6.0.3 modified 2026-04-16 | TypeScript oracle compilation and scripts. | Use existing TS scripts/tests only; do not move backend scoring ownership back to TS. [VERIFIED: package.json + `pnpm view typescript version time.modified`] |
| Zod | repo `^4.4.3`; npm latest 4.4.3 modified 2026-05-04 | Spec/service DTO validation. | Use existing schemas/fixtures for public DTO parity and privacy validation. [VERIFIED: packages/spec/package.json + `pnpm view zod version time.modified`] |
| `pg` | repo `^8.20.0`; npm latest 8.21.0 modified 2026-05-18 | Existing TypeScript persistence oracle. | Keep for oracle/rollback/test paths; do not add new TS product refresh logic. [VERIFIED: packages/persistence/package.json + `pnpm view pg version time.modified`] |
| Playwright | repo `^1.60.0`; npm latest 1.60.0 modified 2026-05-23 | Browser evidence in later public cutover/topology phases. | Phase 100 can defer browser checks unless public page rendering is touched directly. [VERIFIED: package.json + `pnpm view @playwright/test version time.modified`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Go scorer using existing pgx | TypeScript lazy `refreshMatchSetStatus` from public reads | Rejected by phase decision because public reads must not rely on TypeScript lazy refresh once Go scoring is selected. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |
| Stored scoring JSON | Recompute standings on every public request | Rejected for Phase 100 because the requirement explicitly says Go updates `match_sets.scoring` after terminal Match completion. [VERIFIED: .planning/REQUIREMENTS.md] |
| Existing PostgreSQL tables | New queue/scoring service or broker | Rejected by v1.15 scope; no new orchestration framework is part of this phase. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |

**Installation:**
```bash
# No new dependency installation is recommended for Phase 100.
cd apps/go-backend && go test ./...
pnpm --filter @cowards/persistence test -- scoring.test.ts
```
[VERIFIED: package.json + apps/go-backend/go.mod]

**Version verification:** package and module versions above were checked with `go version`, `go list -m -json`, and `pnpm view ... version time.modified`. [VERIFIED: command output]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 99 terminal Match update
        |
        v
Go completion/orchestration hook
        |
        v
Load MatchSet Match rows ordered by matrix_index
        |
        v
Map rows to MatchScoreInput
        |
        +--> status is failed_system? count failedSystemMatches for both entrants; mark degraded
        |
        +--> status is complete? add W/L/D, points, side-specific survivors, survival turns
        |
        +--> strategyFailureRevisionId present? apply -1 strategy_failure penalty
        |
        v
Sort rankings: points, wins, survivingSoldiers, survivalTurns, strategyRevisionId
        |
        v
Determine MatchSet status from Match statuses + degraded flag
        |
        v
Update match_sets(status, scoring, degraded, completed_at)
        |
        v
Go public MatchSet summary reads stored scoring -> public standings
```
[VERIFIED: packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts + apps/go-backend/live_backend.go]

### Recommended Project Structure

```text
apps/go-backend/
├── scoring.go              # Pure scoring structs, constants, ScoreMatchSet, DetermineMatchSetStatus
├── scoring_test.go         # Pure parity fixtures for W/L/D, penalties, failed_system, tie-breakers
├── matchset_status.go      # DB row mapping and RefreshMatchSetStatus
├── matchset_status_test.go # DB-oriented refresh/update/status tests
└── live_backend.go         # Public DTO mapping consumes stored scoring; no scoring rules added here
```
[VERIFIED: apps/go-backend directory shape + packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts]

### Pattern 1: Pure Scoring Before Persistence

**What:** Keep Go scoring as a deterministic function over `[]MatchScoreInput`; no DB, time, network, or Strategy execution in the scorer. [VERIFIED: packages/persistence/src/scoring.ts + AGENTS.md]  
**When to use:** Use for all unit parity fixtures and before persistence refresh writes. [VERIFIED: packages/persistence/src/scoring.test.ts]

**Example:**
```go
// Source: packages/persistence/src/scoring.ts
score := ScoreMatchSet([]MatchScoreInput{
    {
        MatchID: "match:1",
        BottomStrategyRevisionID: "strategy-revision:a",
        TopStrategyRevisionID: "strategy-revision:b",
        WinnerStrategyRevisionID: ptr("strategy-revision:a"),
        Status: "complete",
        BottomSurvivingSoldiers: 2,
        TopSurvivingSoldiers: 0,
        BottomSurvivalTurns: 8,
        TopSurvivalTurns: 8,
    },
})
```
[VERIFIED: packages/persistence/src/scoring.ts]

### Pattern 2: Refresh Stored MatchSet State Proactively

**What:** After a terminal Match update, Go loads every Match in the MatchSet ordered by `matrix_index`, calculates scoring/status, and updates `match_sets`. [VERIFIED: packages/persistence/src/matchset-status.ts]  
**When to use:** Call after Phase 99 successful completion and after terminal failed-system exhaustion; do not wait for public result reads. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md + packages/persistence/src/jobs.ts]

**Example:**
```sql
-- Source: packages/persistence/src/matchset-status.ts
update match_sets
set status = $1::match_set_status,
    scoring = $2,
    degraded = $3,
    completed_at = case
      when $1::match_set_status in ('complete', 'degraded') then now()
      else completed_at
    end
where id = $4;
```
[VERIFIED: packages/persistence/src/matchset-status.ts]

### Pattern 3: Public DTO Mapping From Stored Scoring

**What:** Public standings map `match_sets.scoring.rankings` to entrant snapshots and expose `rank`, entrant id, strategy revision id, owner handle, display label, source hash, points, W/D/L, penalties, survivor totals, survival turns, and tie-breaker path. [VERIFIED: packages/persistence/src/competition.ts + packages/spec/src/competition.ts]  
**When to use:** Go public MatchSet summary should read stored scoring only; it should not recompute or refresh scoring in the public handler. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md + apps/go-backend/live_backend.go]

### Anti-Patterns to Avoid

- **Lazy TypeScript refresh on public read:** This hides stale Go scoring and violates D-03. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md + packages/persistence/src/competition.ts]
- **System failure as player loss:** `failed_system` should mark degradation and failed-system participation, then skip W/L/D scoring. [VERIFIED: packages/persistence/src/scoring.ts]
- **Unstable map iteration for rankings:** Rankings must sort by points, wins, surviving Soldiers, survival turns, then Strategy Revision id. [VERIFIED: packages/persistence/src/scoring.ts]
- **Public handler as scoring rules layer:** Go public read should project already-stored scoring and preserve privacy; scoring rules belong in the Go scoring package. [VERIFIED: apps/go-backend/live_backend.go + AGENTS.md]
- **Dropping penalty arrays in public standings:** Current Go `standingsFromScoring` emits empty penalties, which is not parity with TypeScript public result mapping. [VERIFIED: apps/go-backend/live_backend.go + packages/persistence/src/competition.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Competition scoring rules | Ad hoc SQL aggregates in route handlers | Go port of `scoreMatchSet` | Existing scorer encodes penalties, failed-system behavior, and deterministic tie-breakers. [VERIFIED: packages/persistence/src/scoring.ts] |
| MatchSet status aggregation | Per-route status guesses | Go port of `determineMatchSetStatus` | Existing status logic handles pending, running, complete, and degraded semantics. [VERIFIED: packages/persistence/src/matchset-status.ts] |
| Public privacy scanning | Custom string blacklist in Phase 100 | Existing spec/web public-output privacy guards and Go route public-safe discipline | Public-output forbidden fields are centralized in spec and already used by service/web public reads. [VERIFIED: packages/spec/src/public-output-privacy.ts + apps/web/lib/public-go-read-client.ts] |
| Runtime failure taxonomy | New scoring-only error taxonomy | Existing runtime ABI violation/system-failure split | Runtime ABI already separates player-caused violations from system failures. [VERIFIED: packages/spec/src/runtime.ts] |

**Key insight:** the hard part is preserving existing scoring/failure semantics across ownership migration, not inventing a better scoring model. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `match_sets.status`, `match_sets.scoring`, `match_sets.degraded`, and `match_sets.completed_at` persist scoring/status; `matches` persist terminal status, winners, survivor totals, survival turns, and system failure fields. [VERIFIED: packages/persistence/migrations/0001_initial.sql] | Go refresh must update these fields; no schema migration is required for exact current TS refresh parity. [VERIFIED: packages/persistence/src/matchset-status.ts] |
| Live service config | No external live service config stores scoring ownership for Phase 100; route ownership/no-fallback is tracked in planning artifacts and scripts. [VERIFIED: .planning/artifacts/v1.14-route-ownership-manifest.json + scripts/check-boundary-monitors.ts] | Later phases may update lifecycle manifests/monitors; Phase 100 should not depend on UI-only service config. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| OS-registered state | None found for MatchSet scoring/status refresh. [VERIFIED: `rg` project scan + `.planning/STATE.md`] | No OS re-registration action. [VERIFIED: `.planning/STATE.md`] |
| Secrets/env vars | `DATABASE_URL` is required for live Go DB mode; public diagnostics must not expose it. [VERIFIED: apps/go-backend/main.go + packages/spec/src/public-output-privacy.ts] | Use existing Go live DB configuration; do not add scoring-specific secrets. [VERIFIED: apps/go-backend/live_backend.go] |
| Build artifacts | Go tests compile from `apps/go-backend`; generated service fixtures exist but are read-route parity artifacts, not the source of live scoring. [VERIFIED: apps/go-backend/testdata/service-fixtures + package.json] | Do not regenerate fixtures unless public DTO shape changes; Phase 100 can add Go tests without fixture churn. [VERIFIED: scripts/generate-go-parity-fixtures.ts] |

## Common Pitfalls

### Pitfall 1: Strategy Penalty Attribution Is Not Persisted By Current Refresh

**What goes wrong:** Go implements `strategyFailureRevisionId` support in the pure scorer but never applies penalties in DB refresh because current Match rows do not expose that attribution. [VERIFIED: packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts]  
**Why it happens:** The TypeScript scorer accepts `strategyFailureRevisionId`, but `refreshMatchSetStatus` does not set it from SQL rows. [VERIFIED: packages/persistence/src/scoring.ts + packages/persistence/src/matchset-status.ts]  
**How to avoid:** Wave 0 must identify the Phase 99/Phase 98 attribution carrier; if none exists, keep scorer parity and document that persisted runtime-violation penalties require an explicit attribution source before public standings can show them. [VERIFIED: .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md]  
**Warning signs:** Go tests pass pure penalty fixtures but DB refresh/public standings never include non-empty `penalties`. [VERIFIED: apps/go-backend/live_backend.go + packages/persistence/src/scoring.test.ts]

### Pitfall 2: Failed-System Matches Become False Losses

**What goes wrong:** A failed-system Match is scored as a loss for one side or a draw for both sides. [VERIFIED: packages/persistence/src/scoring.ts]  
**Why it happens:** Implementers treat every terminal status as gameplay evidence. [VERIFIED: packages/persistence/src/scoring.ts]  
**How to avoid:** For `status == failed_system`, increment `failedSystemMatches` for both entrants, mark `degraded = true`, and continue without W/L/D or survivor scoring. [VERIFIED: packages/persistence/src/scoring.ts]  
**Warning signs:** Rankings change points, wins, losses, or draws after adding a failed-system Match. [VERIFIED: packages/persistence/src/scoring.test.ts]

### Pitfall 3: Public Reads Hide Missing Go Refresh

**What goes wrong:** Public MatchSet pages look correct because TypeScript service refreshes scoring lazily, while Go never updates stored scoring after terminal Matches. [VERIFIED: packages/persistence/src/competition.ts + .planning/RETROSPECTIVE.md]  
**Why it happens:** Existing `buildPublicMatchSetResultDto` calls `refreshMatchSetStatus` before reading MatchSet rows. [VERIFIED: packages/persistence/src/competition.ts]  
**How to avoid:** Add tests that inspect the database immediately after Go completion/failure refresh, before calling any TypeScript public result builder. [VERIFIED: .planning/REQUIREMENTS.md]  
**Warning signs:** Go public summary works only after visiting a TypeScript-backed page or running a TypeScript helper. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]

### Pitfall 4: `completed_at` Semantics Drift

**What goes wrong:** `completed_at` is cleared, reset repeatedly, or set for running/pending MatchSets. [VERIFIED: packages/persistence/src/matchset-status.ts]  
**Why it happens:** Status refresh writes timestamps without mirroring the existing CASE expression. [VERIFIED: packages/persistence/src/matchset-status.ts]  
**How to avoid:** Preserve `completed_at = case when status in ('complete','degraded') then now() else completed_at end`. [VERIFIED: packages/persistence/src/matchset-status.ts]  
**Warning signs:** Pending/running refresh changes `completed_at`, or complete/degraded refresh lacks a timestamp. [VERIFIED: packages/persistence/src/matchset-status.ts]

## Code Examples

### TypeScript Oracle: Failed-System Handling

```typescript
// Source: packages/persistence/src/scoring.ts
if (match.status === "failed_system") {
  degraded = true
  bottom.failedSystemMatches += 1
  top.failedSystemMatches += 1
  continue
}
```
[VERIFIED: packages/persistence/src/scoring.ts]

### TypeScript Oracle: Ranking Tie-Breakers

```typescript
// Source: packages/persistence/src/scoring.ts
rankings: [...scores.values()].sort(
  (left, right) =>
    right.points - left.points ||
    right.wins - left.wins ||
    right.survivingSoldiers - left.survivingSoldiers ||
    right.survivalTurns - left.survivalTurns ||
    left.strategyRevisionId.localeCompare(right.strategyRevisionId),
)
```
[VERIFIED: packages/persistence/src/scoring.ts]

### Go Public Mapping Gap To Fix

```go
// Source: apps/go-backend/live_backend.go
"penalties": []map[string]any{},
```
[VERIFIED: apps/go-backend/live_backend.go]

Replace the constant empty penalty array with a mapping from stored scoring ranking `penalties`, preserving `matchId`, `reason`, and `points`. [VERIFIED: packages/persistence/src/competition.ts + packages/spec/src/competition.ts]

## State of the Art

| Old Approach | Current / Required Approach | When Changed | Impact |
|--------------|-----------------------------|--------------|--------|
| Public result builder refreshes MatchSet status before publishing. [VERIFIED: packages/persistence/src/competition.ts] | Go proactively refreshes stored status/scoring after terminal Match updates. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] | v1.15 Phase 100 scope. [VERIFIED: .planning/ROADMAP.md] | Tests must inspect stored DB state without relying on TypeScript public read side effects. [VERIFIED: .planning/REQUIREMENTS.md] |
| Go public summary reads stored scoring and maps standings, but currently drops penalties. [VERIFIED: apps/go-backend/live_backend.go] | Go public summary preserves stored scoring penalties and tie-breaker fields. [VERIFIED: packages/persistence/src/competition.ts] | Phase 100 public standings parity. [VERIFIED: .planning/REQUIREMENTS.md] | Public standings become parity-safe for strategy-failure penalty evidence. [VERIFIED: packages/spec/src/competition.ts] |
| TypeScript worker owns job execution, Match completion, and failure recording. [VERIFIED: apps/worker/src/runner.ts] | Go owns downstream scoring/status after Phase 99 completion/failure updates. [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md + .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] | v1.15 phases 99-100. [VERIFIED: .planning/ROADMAP.md] | TypeScript remains runtime boundary/parity oracle, not product scoring owner. [VERIFIED: .planning/PROJECT.md] |

**Deprecated/outdated:**
- Fixture-only Go MatchSet summary evidence is insufficient for Phase 100 because v1.15 requires live Go scoring persistence. [VERIFIED: apps/go-backend/README.md + .planning/REQUIREMENTS.md]
- Lazy TypeScript scoring refresh from public reads is insufficient for Go-selected normal ownership. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 99 will expose enough terminal Match/failure data for Phase 100 to refresh MatchSet status immediately after completion/failure. [ASSUMED] | Summary / Patterns | If Phase 99 does not expose a hook or MatchSet id lookup, planner must add a lookup from `match_set_matches` by Match id before refresh. |

## Open Questions

1. **What is the authoritative persisted source for `strategyFailureRevisionId` during DB refresh?**
   - What we know: pure TypeScript scoring supports `strategyFailureRevisionId` and applies a `-1` `strategy_failure` penalty. [VERIFIED: packages/persistence/src/scoring.ts]
   - What is unclear: current TypeScript `refreshMatchSetStatus` does not populate `strategyFailureRevisionId` from DB rows, and Phase 15 review explicitly says penalties require upstream runtime attribution. [VERIFIED: packages/persistence/src/matchset-status.ts + .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md]
   - Recommendation: Wave 0 must inspect Phase 99 output; if no explicit attribution exists, implement scorer penalty parity but keep persisted penalty application blocked behind an explicit attribution task rather than deriving a non-parity rule silently. [VERIFIED: .planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md + .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md]

2. **Should `blocked` status remain running-like or fail-closed in Go status determination?**
   - What we know: `match_status` and `match_set_status` include `blocked`, and public DTO maps blocked MatchSet status to failed. [VERIFIED: packages/persistence/migrations/0001_initial.sql + packages/persistence/src/competition.ts]
   - What is unclear: current `determineMatchSetStatus` has no explicit blocked branch, so blocked Match statuses fall through as non-complete/non-running and generally produce `running` unless all-pending. [VERIFIED: packages/persistence/src/matchset-status.ts]
   - Recommendation: preserve TypeScript parity for initial Go port, then add explicit test documentation for blocked input behavior because Phase context requires blocked scenarios to be inspectable/fail-closed. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Go | Go scorer and Go tests | yes | go1.26.3 installed; module declares go 1.25.0 | None needed. [VERIFIED: `go version` + apps/go-backend/go.mod] |
| pnpm | TypeScript oracle tests/scripts | yes | 11.1.2 | None needed. [VERIFIED: `pnpm --version` + package.json] |
| Node.js | TypeScript tests/scripts | yes | v24.15.0 | None needed. [VERIFIED: `node --version`] |
| Docker | Optional Postgres service/preflight | yes | 29.4.3 | Local `DATABASE_URL` path may work without Docker if Postgres is running. [VERIFIED: `docker --version` + README.md] |
| PostgreSQL | DB refresh integration tests | not probed as running in this research | — | Use unit tests for pure scoring; DB tests should skip or use configured `DATABASE_URL` unless planner adds a local test DB harness. [VERIFIED: packages/persistence/src/dev-smoke.test.ts] |

**Missing dependencies with no fallback:**
- None identified for pure scoring implementation and Go unit tests. [VERIFIED: command output + apps/go-backend/go.mod]

**Missing dependencies with fallback:**
- A running PostgreSQL database was not verified during research; use skip-if-missing integration tests or the existing Docker/local service scripts. [VERIFIED: packages/persistence/src/dev-smoke.test.ts + README.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Go `testing` for `apps/go-backend`; Vitest 4.x for TypeScript oracle. [VERIFIED: apps/go-backend/main_test.go + package.json] |
| Config file | Go: `apps/go-backend/go.mod`; TS: package scripts and package-level Vitest conventions. [VERIFIED: apps/go-backend/go.mod + package.json] |
| Quick run command | `cd apps/go-backend && go test ./...` [VERIFIED: package.json] |
| Full suite command | `pnpm go:parity && pnpm --filter @cowards/persistence test -- scoring.test.ts` [VERIFIED: package.json + packages/persistence/src/scoring.test.ts] |

### Phase Requirements To Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SCORE-01 | Pure Go scoring matches W/L/D, points, survivor totals, survival turns, failed-system participation, and tie-breaker ordering. [VERIFIED: packages/persistence/src/scoring.test.ts] | unit | `cd apps/go-backend && go test ./... -run TestScoreMatchSet` | no, Wave 0 add `apps/go-backend/scoring_test.go`. [VERIFIED: apps/go-backend file listing] |
| SCORE-02 | Go status refresh matches pending/running/complete/degraded/failed-system/blocked behavior. [VERIFIED: packages/persistence/src/matchset-status.ts] | unit + DB integration | `cd apps/go-backend && go test ./... -run TestDetermineMatchSetStatus` | no, Wave 0 add `apps/go-backend/matchset_status_test.go`. [VERIFIED: apps/go-backend file listing] |
| SCORE-03 | Go refresh writes `match_sets.status`, `scoring`, `degraded`, and `completed_at` without invoking TS public result builder. [VERIFIED: .planning/REQUIREMENTS.md] | DB integration | `DATABASE_URL=... cd apps/go-backend && go test ./... -run TestRefreshMatchSetStatus` | no, Wave 0 add DB harness or skip-if-no-DB test. [VERIFIED: apps/go-backend file listing] |
| SCORE-04 | Go public summary displays stored Go-scored standings and penalties. [VERIFIED: apps/go-backend/live_backend.go] | handler/unit or live DB integration | `cd apps/go-backend && go test ./... -run TestPublicMatchSetSummary` | partial existing handler fixture tests; penalty-preservation test missing. [VERIFIED: apps/go-backend/main_test.go] |
| SCORE-05 | Runtime violations can become strategy penalties only with explicit attribution; system failures degrade without player losses. [VERIFIED: packages/spec/src/runtime.ts + packages/persistence/src/scoring.ts] | unit + integration | `cd apps/go-backend && go test ./... -run TestFailureClassification` | no, Wave 0 add classification fixture. [VERIFIED: apps/go-backend file listing] |
| SCORE-06 | Parity fixtures cover complete, running, degraded, failed_system, strategy-failure penalty, and tie-breakers. [VERIFIED: .planning/REQUIREMENTS.md] | unit | `cd apps/go-backend && go test ./... -run TestScoringParityFixtures` | no, Wave 0 add fixture tests. [VERIFIED: apps/go-backend file listing] |

### Sampling Rate

- **Per task commit:** `cd apps/go-backend && go test ./...` [VERIFIED: package.json]
- **Per wave merge:** `pnpm go:parity && pnpm --filter @cowards/persistence test -- scoring.test.ts` [VERIFIED: package.json]
- **Phase gate:** `pnpm boundary:monitors` after public/ownership monitor updates in later phases; Phase 100 should at least keep `go test ./...` green. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `apps/go-backend/scoring.go` and `apps/go-backend/scoring_test.go` covering SCORE-01 and SCORE-06. [VERIFIED: apps/go-backend file listing]
- [ ] `apps/go-backend/matchset_status.go` and `apps/go-backend/matchset_status_test.go` covering SCORE-02 and SCORE-03. [VERIFIED: apps/go-backend file listing]
- [ ] Penalty-preserving public standings test for `standingsFromScoring`. [VERIFIED: apps/go-backend/live_backend.go]
- [ ] Strategy-failure attribution decision/test before claiming persisted runtime-violation penalties. [VERIFIED: .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no for public scoring refresh calculation; yes indirectly for owner-created MatchSets | Keep existing auth/session ownership unchanged in Phase 100. [VERIFIED: apps/go-backend/live_backend.go] |
| V3 Session Management | no direct Phase 100 change | Do not touch session cookies/tokens in scoring work. [VERIFIED: apps/go-backend/live_backend.go] |
| V4 Access Control | yes for public standings projection | Public MatchSet outputs must remain source-safe and visibility-aware. [VERIFIED: packages/persistence/src/competition.ts + packages/spec/src/public-output-privacy.ts] |
| V5 Input Validation | yes | Validate status enums, stored scoring JSON shape, and public DTO output with existing schemas/fixtures where applicable. [VERIFIED: packages/spec/src/schemas.ts] |
| V6 Cryptography | no new cryptography | Do not add crypto; preserve existing Chronicle hash/provenance behavior from prior phases. [VERIFIED: .planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public scoring leaks private Strategy/runtime fields | Information Disclosure | Build standings from entrant snapshots and scoring fields only; run public-output privacy checks. [VERIFIED: packages/persistence/src/competition.ts + packages/spec/src/public-output-privacy.ts] |
| System failure misclassified as player loss | Tampering / Repudiation | Preserve runtime ABI system-failure split and scorer `failed_system` branch. [VERIFIED: packages/spec/src/runtime.ts + packages/persistence/src/scoring.ts] |
| Stale scoring shown as authoritative | Integrity | Proactive Go refresh after terminal Match updates and DB assertions before public read. [VERIFIED: .planning/REQUIREMENTS.md + packages/persistence/src/matchset-status.ts] |
| Unsafe diagnostics in public topology/monitor output | Information Disclosure | Omit Strategy source, memories, objective payloads, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals. [VERIFIED: AGENTS.md + .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - deterministic engine, hostile Strategy isolation, terminology, and public-output privacy constraints. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - v1.15 scope, phase mapping, and ownership direction. [VERIFIED: local planning docs]
- `.planning/phases/096-.../096-CONTEXT.md` through `.planning/phases/100-.../100-CONTEXT.md` - locked lifecycle ownership, runtime boundary, completion, and scoring decisions. [VERIFIED: local phase contexts]
- `packages/persistence/src/scoring.ts`, `packages/persistence/src/matchset-status.ts`, `packages/persistence/src/scoring.test.ts` - TypeScript scoring/status oracle and current coverage. [VERIFIED: local code]
- `packages/persistence/src/competition.ts`, `packages/spec/src/competition.ts`, `packages/spec/src/schemas.ts` - public MatchSet result DTO and schema expectations. [VERIFIED: local code]
- `apps/go-backend/live_backend.go`, `apps/go-backend/main_test.go`, `apps/go-backend/go.mod` - current Go public read mapping, tests, and Go dependencies. [VERIFIED: local code]

### Secondary (MEDIUM confidence)

- `.planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md` - documented residual risk that strategy penalties require upstream attribution. [VERIFIED: local planning archive]
- `.planning/milestones/v1.3-phases/21-ladder-scheduling-and-standings/21-CONTEXT.md` - counted/non-counted policy and strategy/system failure split for ladder standings. [VERIFIED: local planning archive]
- Command outputs for tool/package versions: `go version`, `go list -m -json`, `pnpm view`, `node --version`, `pnpm --version`, `docker --version`. [VERIFIED: command output]

### Tertiary (LOW confidence)

- None. [VERIFIED: this research used local code/planning docs and package registries only]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommended tools/libraries are already present and versions were checked locally or through registries. [VERIFIED: apps/go-backend/go.mod + package.json + command output]
- Architecture: HIGH - phase context explicitly locks Go as scoring/status owner and TypeScript as parity oracle. [VERIFIED: .planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md]
- Pitfalls: MEDIUM - stale refresh and failed-system behavior are directly verified; runtime-violation attribution remains a known open implementation decision. [VERIFIED: packages/persistence/src/competition.ts + packages/persistence/src/scoring.ts + .planning/milestones/v1.2-phases/15-matchset-competition-model/15-REVIEW.md]

**Research date:** 2026-05-24 [VERIFIED: .planning/PROJECT.md]  
**Valid until:** 2026-06-23 for local architecture findings; re-check package versions and phase artifacts before implementation if Phase 99 changes land first. [ASSUMED]
