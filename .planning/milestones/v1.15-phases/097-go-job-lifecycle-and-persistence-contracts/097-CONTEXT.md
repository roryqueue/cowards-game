# Phase 97: Go Job Lifecycle and Persistence Contracts - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 97 moves Match job lifecycle primitives to Go for normal product orchestration: claim, lease, heartbeat, retry queueing, retry exhaustion, and system-failure recording. TypeScript remains the parity oracle and explicit rollback/test implementation, not a concurrent normal DB-owning worker.

This phase does not complete Matches, persist Chronicles, score MatchSets, execute Strategy code, or classify gameplay/runtime violations for scoring. Those remain downstream Phase 98 through Phase 100 responsibilities.

</domain>

<decisions>
## Implementation Decisions

### Persistence Contract Shape

- **D-01:** Port the existing `packages/persistence/src/jobs.ts` behavior directly into Go-backed Postgres contracts.
- **D-02:** Preserve queued/running selection, expired-lease reclaim, `FOR UPDATE SKIP LOCKED` or equivalent locking, attempt numbering, attempt rows, lease token storage, and retry exhaustion semantics.
- **D-03:** Do not introduce a new queue broker, scheduler, or alternate lifecycle model in this phase.

### Go Ownership Scope

- **D-04:** Go owns normal job claim, lease, heartbeat, retry queueing, retry exhaustion, and system-failure recording when Go orchestration is selected.
- **D-05:** TypeScript job lifecycle code is a parity oracle plus explicit rollback/test implementation only.
- **D-06:** Go-selected normal orchestration must prevent TypeScript DB-owning workers from claiming or completing normal product jobs.

### Time, Tokens, And Determinism

- **D-07:** Go orchestration may use system time and generated lease tokens because lifecycle orchestration is outside the deterministic game engine.
- **D-08:** Tests should inject clock and token generation so claim, heartbeat, lease mismatch, expired reclaim, retry, and exhaustion cases remain stable and parity-checkable.
- **D-09:** No engine logic may depend on orchestration time or token generation.

### Failure Scope

- **D-10:** Phase 97 records system-failure envelopes and retry/exhaustion state only.
- **D-11:** Strategy/runtime violation handling remains downstream: Phase 98 defines the runtime service envelope, and Phase 100 classifies scoring effects.
- **D-12:** Failure diagnostics stored or surfaced by Go must be redacted by default.

### Privacy And Diagnostics

- **D-13:** Go lifecycle diagnostics must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- **D-14:** Error classes/messages should be stable and actionable without exposing private runtime or owner-only data.

### Rollback And No-Fallback

- **D-15:** Normal product queues must not have mixed Go and TypeScript DB-owning claim/completion workers.
- **D-16:** Rollback must be explicit: stop Go orchestration, switch lifecycle ownership to the documented TypeScript rollback owner, and then start the legacy TypeScript DB-owning worker.
- **D-17:** Running jobs, expired leases, retries, and incomplete MatchSets should have documented rollback/no-fallback behavior in the Phase 97 plan and artifacts.

### the agent's Discretion

The agent may choose package boundaries, function names, fixtures, and test harness details that fit the existing Go backend, provided the implementation preserves TypeScript parity and the ownership/no-fallback decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — ORCH-01 through ORCH-08 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 97 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state and ownership warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Ownership labels, no-fallback defaults, rollback semantics, and manifest requirements.
- `.planning/artifacts/v1.14-route-ownership-manifest.json` — Prior no-fallback and rollback vocabulary.
- `.planning/artifacts/v1.14-promotion-decision.md` — Promoted v1.14 runtime and Go route decisions.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine boundaries, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### TypeScript Parity Oracle

- `packages/persistence/src/jobs.ts`: Current claim, heartbeat, retry, and failure implementation. Includes `CLAIM_NEXT_MATCH_JOB_SQL`, `DEFAULT_LEASE_MS`, `createLeaseToken`, `claimNextMatchJob`, `heartbeatMatchJob`, `recordAttemptFailure`, and `shouldExhaustRetries`.
- `apps/worker/src/runner.ts`: Current DB-owning worker flow that claims a job, executes a Match, completes it, or records attempt failure.
- `packages/persistence/src/complete-match.ts`: Downstream completion behavior that Phase 97 must not reimplement except where needed for ownership guards.
- `packages/persistence/src/jobs.test.ts` and `apps/worker/src/runner.test.ts`: Existing tests and expectations to mine for parity fixtures.

### Go Integration Points

- `apps/go-backend/live_backend.go`: Current Go backend creates `match_jobs` for exhibition MatchSets but does not claim or complete them.
- `packages/persistence/migrations/0001_initial.sql`: Source schema for `match_jobs`, `match_job_attempts`, statuses, lease fields, attempts, max attempts, and indexes.
- `apps/go-backend/README.md`: Still documents TypeScript ownership of job claiming and orchestration; Phase 97 may need to update this once Go lifecycle contracts exist.

### Established Patterns

- Existing selected Go paths fail closed when selected configuration is missing.
- Existing v1.14 boundary monitors distinguish strict and report-only offenses.
- Existing TypeScript job claim uses database locking and transaction boundaries rather than in-memory coordination.

</code_context>

<specifics>
## Specific Ideas

The phase should focus on a small, testable Go persistence package or service boundary for lifecycle primitives before introducing runtime execution or Match completion. Good verification is more valuable than breadth here: duplicate claim prevention, lease mismatch rejection, expired reclaim, retry queueing, and exhaustion are the core behavioral risks.

</specifics>

<deferred>
## Deferred Ideas

- Calling the TypeScript runtime execution service from Go — Phase 98.
- Atomic Match completion and Chronicle persistence — Phase 99.
- MatchSet scoring and gameplay/runtime failure scoring classification — Phase 100.
- Public evidence route delivery — Phase 101.
- Final topology and promotion gates — Phase 102.

</deferred>

---

*Phase: 97-Go Job Lifecycle and Persistence Contracts*
*Context gathered: 2026-05-24*
