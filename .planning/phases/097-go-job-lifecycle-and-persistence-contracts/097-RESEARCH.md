# Phase 97: Go Job Lifecycle and Persistence Contracts - Research

**Researched:** 2026-05-24 [VERIFIED: .planning/PROJECT.md]  
**Domain:** Go-owned PostgreSQL Match job lifecycle, lease, heartbeat, retry, exhaustion, parity fixtures, and ownership guards [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]  
**Confidence:** HIGH for repo-local behavior and target contracts; MEDIUM for exact package boundaries until Phase 96 artifacts exist [VERIFIED: repo grep + .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

The following Phase 97 decisions are copied from `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md`. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

- **D-01:** Port the existing `packages/persistence/src/jobs.ts` behavior directly into Go-backed Postgres contracts.
- **D-02:** Preserve queued/running selection, expired-lease reclaim, `FOR UPDATE SKIP LOCKED` or equivalent locking, attempt numbering, attempt rows, lease token storage, and retry exhaustion semantics.
- **D-03:** Do not introduce a new queue broker, scheduler, or alternate lifecycle model in this phase.
- **D-04:** Go owns normal job claim, lease, heartbeat, retry queueing, retry exhaustion, and system-failure recording when Go orchestration is selected.
- **D-05:** TypeScript job lifecycle code is a parity oracle plus explicit rollback/test implementation only.
- **D-06:** Go-selected normal orchestration must prevent TypeScript DB-owning workers from claiming or completing normal product jobs.
- **D-07:** Go orchestration may use system time and generated lease tokens because lifecycle orchestration is outside the deterministic game engine.
- **D-08:** Tests should inject clock and token generation so claim, heartbeat, lease mismatch, expired reclaim, retry, and exhaustion cases remain stable and parity-checkable.
- **D-09:** No engine logic may depend on orchestration time or token generation.
- **D-10:** Phase 97 records system-failure envelopes and retry/exhaustion state only.
- **D-11:** Strategy/runtime violation handling remains downstream: Phase 98 defines the runtime service envelope, and Phase 100 classifies scoring effects.
- **D-12:** Failure diagnostics stored or surfaced by Go must be redacted by default.
- **D-13:** Go lifecycle diagnostics must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- **D-14:** Error classes/messages should be stable and actionable without exposing private runtime or owner-only data.
- **D-15:** Normal product queues must not have mixed Go and TypeScript DB-owning claim/completion workers.
- **D-16:** Rollback must be explicit: stop Go orchestration, switch lifecycle ownership to the documented TypeScript rollback owner, and then start the legacy TypeScript DB-owning worker.
- **D-17:** Running jobs, expired leases, retries, and incomplete MatchSets should have documented rollback/no-fallback behavior in the Phase 97 plan and artifacts.

### the agent's Discretion

The agent may choose package boundaries, function names, fixtures, and test harness details that fit the existing Go backend, provided the implementation preserves TypeScript parity and the ownership/no-fallback decisions above. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)

- Calling the TypeScript runtime execution service from Go — Phase 98. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- Atomic Match completion and Chronicle persistence — Phase 99. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- MatchSet scoring and gameplay/runtime failure scoring classification — Phase 100. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- Public evidence route delivery — Phase 101. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- Final topology and promotion gates — Phase 102. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORCH-01 | Go-owned job claim contracts preserve queued/running selection, database locking, lease tokens, attempt numbering, and expired-lease reclaim. [VERIFIED: .planning/REQUIREMENTS.md] | Port `CLAIM_NEXT_MATCH_JOB_SQL` behavior directly; keep `FOR UPDATE SKIP LOCKED`; test queued and expired-running claims. [VERIFIED: packages/persistence/src/jobs.ts + PostgreSQL docs] |
| ORCH-02 | Go heartbeat/lease extension rejects stale or mismatched leases and avoids unrelated jobs. [VERIFIED: .planning/REQUIREMENTS.md] | Implement `update match_jobs ... where id=$job and lease_token=$token and status='running'`; use injected clock in tests. [VERIFIED: packages/persistence/src/jobs.ts] |
| ORCH-03 | Go failure recording preserves retryable failure, exhaustion, Match `failed_system`, attempt rows, and redacted diagnostics. [VERIFIED: .planning/REQUIREMENTS.md] | Port `recordAttemptFailure` and `shouldExhaustRetries`; add privacy scanner around stored details. [VERIFIED: packages/persistence/src/jobs.ts + apps/worker/src/runner.test.ts] |
| ORCH-04 | Go lifecycle contracts are schema-validated and parity-tested against TypeScript jobs/completion/runner behavior. [VERIFIED: .planning/REQUIREMENTS.md] | Generate parity fixtures from TypeScript job semantics and assert Go JSON/error/status equivalence. [VERIFIED: scripts/generate-go-parity-fixtures.ts pattern + packages/persistence/src/jobs.test.ts] |
| ORCH-05 | Go-selected normal orchestration prevents TypeScript DB-owning worker claim/completion. [VERIFIED: .planning/REQUIREMENTS.md] | Add an explicit ownership gate before `runWorkerLoop` can claim DB jobs in normal mode, leaving rollback/test paths explicit. [VERIFIED: apps/worker/src/index.ts + .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| ORCH-06 | Rollback/no-fallback rules cover running jobs, expired leases, retries, and incomplete MatchSets. [VERIFIED: .planning/REQUIREMENTS.md] | Document operator sequence and state handling in Phase 97 artifacts; do not silently start both DB-owning workers. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| ORCH-07 | Go diagnostics omit private Strategy/runtime/session/host/database internals by default. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse current public-output forbidden-key vocabulary and allowlisted failure details only. [VERIFIED: AGENTS.md + packages/spec/src/public-output-privacy.ts + apps/worker/src/runner.ts] |
| ORCH-08 | Go tests cover claim, idle, lease mismatch, expired reclaim, retry queueing, exhaustion, and duplicate running prevention. [VERIFIED: .planning/REQUIREMENTS.md] | Add Go DB-backed tests around `match_jobs` and parity fixtures; use injected time/token for deterministic assertions. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
</phase_requirements>

## Summary

Phase 97 should add a narrow Go job lifecycle package in `apps/go-backend` that owns claim, lease, heartbeat, retry queueing, retry exhaustion, and system-failure recording for normal product orchestration. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] The implementation should be a direct semantic port of `packages/persistence/src/jobs.ts`, not a new queue architecture. [VERIFIED: packages/persistence/src/jobs.ts + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

The current TypeScript worker couples DB job ownership with runtime/engine execution: it claims a job, loads Match input, builds a Chronicle, completes the Match, or records a retryable system failure. [VERIFIED: apps/worker/src/runner.ts] Phase 97 must split only the DB lifecycle primitives into Go and leave Strategy execution, Chronicle persistence, Match completion, MatchSet scoring, and runtime violation classification to later phases. [VERIFIED: .planning/ROADMAP.md + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

**Primary recommendation:** implement `apps/go-backend/job_lifecycle.go` with injected `Clock` and `TokenGenerator`, PostgreSQL transaction helpers using pgx, a public-safe diagnostics sanitizer, Go DB tests, TypeScript-generated parity fixtures, and an ownership gate that prevents `apps/worker` from DB-claiming normal jobs when Go lifecycle ownership is selected. [VERIFIED: apps/go-backend/live_backend.go + packages/persistence/src/jobs.ts + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; job lifecycle time/token generation must stay outside engine logic. [VERIFIED: AGENTS.md + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- Do not put game rules in React components; this phase is Go/PostgreSQL lifecycle work, not UI rules work. [VERIFIED: AGENTS.md + .planning/ROADMAP.md]
- Do not execute user Strategy code in the web/API process or Go process; Phase 97 must not add any Strategy execution path. [VERIFIED: AGENTS.md + .planning/ROADMAP.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic; Phase 97 may use time/token generation only in orchestration code with injected test seams. [VERIFIED: AGENTS.md + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- Do not use Node `vm` as a security boundary. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate runtime boundaries with schemas; Phase 97 diagnostics must not store private Strategy/runtime payloads. [VERIFIED: AGENTS.md + .planning/REQUIREMENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play; Phase 97 should not mutate revision source/runtime fields. [VERIFIED: AGENTS.md + packages/persistence/migrations/0001_initial.sql]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default; Phase 97 failure diagnostics must follow the same privacy posture. [VERIFIED: AGENTS.md + .planning/REQUIREMENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Job claim and expired-lease reclaim | API / Backend (Go) | Database / Storage | Go becomes the selected normal orchestration owner; PostgreSQL row locks enforce concurrency. [VERIFIED: .planning/ROADMAP.md + PostgreSQL docs] |
| Lease heartbeat | API / Backend (Go) | Database / Storage | The backend validates lease token/job/status and writes lease expiry; database predicates prevent unrelated updates. [VERIFIED: packages/persistence/src/jobs.ts] |
| Retry queueing and exhaustion | API / Backend (Go) | Database / Storage | Go classifies system failures as retryable/exhausted and persists job/attempt/Match state. [VERIFIED: packages/persistence/src/jobs.ts + .planning/REQUIREMENTS.md] |
| TypeScript job lifecycle parity | API / Backend (TypeScript parity-only) | Test infrastructure | TypeScript lifecycle code remains the parity oracle and explicit rollback/test implementation only. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| Strategy execution | Runtime service (TypeScript runtime-only) | API / Backend (Go caller in later phase) | Strategy execution remains isolated behind the existing JS/TS runtime boundary and is out of Phase 97 scope. [VERIFIED: .planning/ROADMAP.md + AGENTS.md] |
| Match completion and Chronicle persistence | Deferred to Phase 99 | Database / Storage | Phase 97 must not complete Matches or persist Chronicles except documenting lease guard interactions. [VERIFIED: .planning/ROADMAP.md] |
| MatchSet scoring | Deferred to Phase 100 | Database / Storage | Scoring effects and runtime violation classification are downstream responsibilities. [VERIFIED: .planning/ROADMAP.md] |
| No mixed DB-owning workers | API / Backend ownership gate | Operational docs/manifest | Go and TypeScript workers must not claim/complete the same normal queue concurrently. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Go module toolchain | `go 1.25.0` in module; local `go1.26.3` available | Compile and test Go backend lifecycle code | Existing `apps/go-backend/go.mod` declares Go and local tests pass under installed Go. [VERIFIED: apps/go-backend/go.mod + `go version` + `go test ./...`] |
| `github.com/jackc/pgx/v5` | `v5.9.2`, published 2026-04-19 | PostgreSQL driver, pool, transactions, SQL execution | Existing Go backend already uses `pgxpool`; pgx docs expose `Pool.Begin`, `Tx.Commit`, and `Tx.Rollback`. [VERIFIED: apps/go-backend/go.mod + `go list -m -json` + Context7 `/websites/pkg_go_dev_github_com_jackc_pgx_v5`] |
| PostgreSQL | Local CLI `16.14`; project Compose uses PostgreSQL service | Authoritative storage, row locking, job queue table | Existing schema stores `match_jobs` and `match_job_attempts`; PostgreSQL docs support `FOR UPDATE SKIP LOCKED` for queue-like consumers. [VERIFIED: `psql --version` + packages/persistence/migrations/0001_initial.sql + PostgreSQL docs] |
| TypeScript persistence package | Workspace local | Parity oracle for job lifecycle semantics | `packages/persistence/src/jobs.ts` contains current claim, heartbeat, retry, and failure implementation. [VERIFIED: packages/persistence/src/jobs.ts] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| Vitest | Installed `4.1.6`; npm latest `4.1.7` as of 2026-05-20 | Existing TypeScript parity tests and fixture generation checks | Use for TypeScript parity fixture generator/tests, not for Go implementation tests. [VERIFIED: package.json + `npm view vitest version time.modified`] |
| TypeScript | Installed and npm latest `6.0.3` as of 2026-04-16 | Existing TS parity source compilation | Use existing repo TS scripts when generating fixtures. [VERIFIED: package.json + `npm view typescript version time.modified`] |
| Playwright | Installed and npm latest `1.60.0` as of 2026-05-23 | Later topology/browser validation | Phase 97 does not require browser checks unless ownership guard changes surface in web flow. [VERIFIED: package.json + `npm view @playwright/test version time.modified` + .planning/ROADMAP.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL `match_jobs` queue | Redis/BullMQ/new broker | Rejected because Phase 97 explicitly preserves existing PostgreSQL lifecycle and forbids a new queue broker. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| pgx direct SQL | ORM/sqlc | Existing Go backend uses direct pgx SQL; adding codegen/ORM would increase scope and create another parity surface. [VERIFIED: apps/go-backend/live_backend.go + apps/go-backend/go.mod] |
| Real random/time in tests | Injected clock/token | Rejected for tests because Phase 97 requires deterministic, parity-checkable claim/heartbeat/retry assertions. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |

**Installation:** no new package is required for the recommended implementation. [VERIFIED: apps/go-backend/go.mod]

```bash
cd apps/go-backend
PATH=/usr/local/go/bin:$PATH go test ./...
```

**Version verification:** `go list -m -json github.com/jackc/pgx/v5 golang.org/x/crypto` verified `pgx/v5 v5.9.2` published 2026-04-19 and `x/crypto v0.52.0` published 2026-05-22. [VERIFIED: local command]

## Architecture Patterns

### System Architecture Diagram

```text
Go lifecycle worker/API command
  |
  | claim request: worker_id, optional match_ids, lease_ms, now/token
  v
PostgreSQL transaction
  |
  | SELECT queued or expired-running job
  | ORDER BY run_after, created_at
  | FOR UPDATE SKIP LOCKED
  v
Decision: row found?
  |-- no --> return idle/null
  |
  |-- yes --> update match_jobs running + lease token + attempts
              update matches running
              insert match_job_attempts running
              return claimed job

Claimed job
  |
  | heartbeat(job_id, lease_token)
  v
Predicate update only if running and token matches
  |
  |-- rowCount=0 --> stale/mismatched lease rejected
  |-- rowCount=1 --> lease extended

System failure envelope
  |
  v
PostgreSQL transaction locks job by id + lease token
  |
  v
Decision: retryable and attempts < max_attempts?
  |-- yes --> mark attempt failed_system; reset job to queued
  |-- no  --> mark attempt failed_system; mark job failed_system; mark Match failed_system
```

This flow is a direct decomposition of current TypeScript lifecycle behavior. [VERIFIED: packages/persistence/src/jobs.ts]

### Recommended Project Structure

```text
apps/go-backend/
├── job_lifecycle.go          # Go claim, heartbeat, failure, retry/exhaustion contracts [VERIFIED: apps/go-backend existing package layout]
├── job_lifecycle_test.go     # DB-backed and pure helper tests for ORCH-01..ORCH-08 [VERIFIED: .planning/REQUIREMENTS.md]
├── job_lifecycle_fixtures.go # Optional fixture loader for TypeScript-generated parity cases [ASSUMED]
└── live_backend.go           # Wire selected Go lifecycle endpoints/commands only after the narrow package is tested [VERIFIED: apps/go-backend/live_backend.go]
```

### Pattern 1: Transactional Claim With Row Locking

**What:** select a single eligible job inside a transaction using `FOR UPDATE SKIP LOCKED`, then update job status/lease/attempts and insert the attempt row before commit. [VERIFIED: packages/persistence/src/jobs.ts + PostgreSQL docs]

**When to use:** every Go claim path, including optional `matchIds` filters. [VERIFIED: packages/persistence/src/jobs.ts]

**Example:**

```sql
-- Source: packages/persistence/src/jobs.ts and PostgreSQL SELECT locking docs
select id, match_id, attempts
from match_jobs
where
  (status = 'queued' and run_after <= $1)
  or (status = 'running' and lease_expires_at < $1)
order by run_after asc, created_at asc
for update skip locked
limit 1
```

PostgreSQL documents `SKIP LOCKED` as skipping rows that cannot be locked immediately and notes it is useful to avoid lock contention with multiple queue-like consumers. [CITED: https://www.postgresql.org/docs/current/sql-select.html]

### Pattern 2: Inject Clock And Token Generator

**What:** expose `Now func() time.Time` and `NewLeaseToken func() (string, error)` on the Go job lifecycle service. [ASSUMED]

**When to use:** claim and heartbeat tests, expired lease reclaim tests, and deterministic parity fixtures. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

**Example:**

```go
// Source: repo pattern in LiveServer.now plus Phase 97 D-08.
type JobLifecycle struct {
  pool          *pgxpool.Pool
  now           func() time.Time
  newLeaseToken func() (string, error)
}
```

The existing `LiveServer` already has an injectable `now func() time.Time`; reusing that style keeps Go test seams consistent. [VERIFIED: apps/go-backend/live_backend.go]

### Pattern 3: Lease-Token Predicate Update

**What:** heartbeat and failure operations must predicate on both `job_id` and `lease_token`; heartbeat must also require `status='running'`. [VERIFIED: packages/persistence/src/jobs.ts]

**When to use:** heartbeat extension, failure recording, later completion guard interaction. [VERIFIED: packages/persistence/src/jobs.ts + packages/persistence/src/complete-match.ts]

**Example:**

```sql
-- Source: packages/persistence/src/jobs.ts
update match_jobs
set lease_expires_at = $1,
    updated_at = now()
where id = $2
  and lease_token = $3
  and status = 'running'
```

### Pattern 4: Failure Recording Is Attempt-First, Then Job/Match State

**What:** record failure details on the current attempt, then either reset the job to queued or mark job and Match as `failed_system`. [VERIFIED: packages/persistence/src/jobs.ts]

**When to use:** system failures only in Phase 97; runtime/gameplay violation scoring remains downstream. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

**Example:**

```go
// Source: packages/persistence/src/jobs.ts
func shouldExhaustRetries(attempts int, maxAttempts int, retryable bool) bool {
  return !retryable || attempts >= maxAttempts
}
```

### Anti-Patterns to Avoid

- **Adding a queue broker:** violates the locked decision to preserve the current PostgreSQL lifecycle model. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]
- **Claiming outside a transaction:** breaks `FOR UPDATE SKIP LOCKED` protection because the row lock must cover selection and mutation. [VERIFIED: PostgreSQL docs + packages/persistence/src/jobs.ts]
- **Heartbeat by job id only:** can extend stale or stolen leases; the TypeScript parity source requires lease token and running status. [VERIFIED: packages/persistence/src/jobs.ts]
- **Treating all failures as player losses:** Phase 97 only records system failure retry/exhaustion; scoring classification is Phase 100. [VERIFIED: .planning/ROADMAP.md]
- **Letting TypeScript worker run as normal owner under Go selection:** explicitly violates no mixed DB-owning worker constraints. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
- **Persisting raw runtime diagnostics:** violates public/default privacy constraints for source, memories, objective payloads, stack traces, stderr, tokens, paths, and DSNs. [VERIFIED: AGENTS.md + .planning/REQUIREMENTS.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrent job queue selection | In-memory locks or process-local mutexes | PostgreSQL transaction plus `FOR UPDATE SKIP LOCKED` | Row locks survive multi-process workers and are the existing parity behavior. [VERIFIED: packages/persistence/src/jobs.ts + PostgreSQL docs] |
| Lease tokens | Predictable counters or job ids | Cryptographically random token generator behind injectable interface | Lease tokens gate stale claims; predictable tokens are unnecessary risk. [VERIFIED: packages/persistence/src/jobs.ts uses `crypto.randomUUID`; ASSUMED for Go crypto/rand choice] |
| Retry exhaustion | Ad hoc status checks in callers | Shared Go helper equivalent to `shouldExhaustRetries` | Current rule is simple and parity-critical: non-retryable or attempts >= max attempts. [VERIFIED: packages/persistence/src/jobs.ts] |
| Diagnostic redaction | String replace after JSON serialization | Allowlisted detail DTOs before storage/response | Existing worker only copies selected subprocess fields and omits stderr. [VERIFIED: apps/worker/src/runner.ts + apps/worker/src/runner.test.ts] |
| DB transaction lifecycle | Manual scattered Begin/Commit without rollback discipline | Small helper or consistent defer rollback pattern with explicit commit | pgx requires Commit or Rollback to finalize a transaction. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool] |
| Parity evidence | Human inspection only | Generated fixtures plus Go tests | Existing Go parity flow uses generated fixtures and `go test ./...`. [VERIFIED: package.json + scripts/generate-go-parity-fixtures.ts] |

**Key insight:** the hard problem is not finding a queue library; it is preserving the exact persisted state machine while changing the normal DB owner from TypeScript to Go. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md + packages/persistence/src/jobs.ts]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `match_jobs` stores `status`, `attempts`, `max_attempts`, `worker_id`, `lease_token`, `lease_expires_at`, and `run_after`; `match_job_attempts` stores attempt rows and diagnostics; `matches` stores lifecycle status/failure fields. [VERIFIED: packages/persistence/migrations/0001_initial.sql] | Go lifecycle code must update the same rows/columns as TypeScript; no data migration is required for the current schema. [VERIFIED: packages/persistence/src/jobs.ts + packages/persistence/migrations/0001_initial.sql] |
| Live service config | Existing Go route selection uses `COWARDS_GO_BACKEND_OWNER`, `COWARDS_GO_*`, and `COWARDS_GO_BACKEND_URL`; worker process currently starts DB-owning `runWorkerLoop` by default. [VERIFIED: apps/web/lib/public-service-adapter.ts + apps/web/lib/account-service-adapter.ts + apps/worker/src/index.ts] | Add explicit lifecycle ownership config/guard so Go-selected normal queues cannot also be claimed by TypeScript worker. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| OS-registered state | None found in repo for launchd/systemd/pm2 registrations. [VERIFIED: `rg` over repo for worker/config ownership terms] | None for Phase 97; operator docs should still state not to run both normal DB owners. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| Secrets/env vars | `DATABASE_URL` is required by live Go backend and TypeScript persistence; selected Go route paths require `COWARDS_GO_BACKEND_URL`; worker uses `WORKER_ID` and `STRATEGY_EXECUTION_ADAPTER`. [VERIFIED: apps/go-backend/live_backend.go + apps/web/lib/public-service-adapter.ts + apps/worker/src/index.ts] | Do not log DSNs/tokens; lifecycle diagnostics must redact config values. [VERIFIED: .planning/REQUIREMENTS.md] |
| Build artifacts | Go tests are local to `apps/go-backend`; TypeScript parity fixtures live under `apps/go-backend/testdata/service-fixtures`. [VERIFIED: apps/go-backend/main_test.go + apps/go-backend/testdata/service-fixtures/fixture-manifest.json] | Add lifecycle parity fixtures separately or extend generator without rewriting existing read-route fixtures. [ASSUMED] |

## Common Pitfalls

### Pitfall 1: Claim And Update Are Split

**What goes wrong:** two workers can see the same eligible job if selection and mutation are not one transaction. [VERIFIED: PostgreSQL docs + packages/persistence/src/jobs.ts]  
**Why it happens:** `SKIP LOCKED` only protects rows locked by the active transaction; committing before mutation releases protection. [VERIFIED: PostgreSQL docs]  
**How to avoid:** wrap select, job update, Match status update, and attempt insert in one transaction. [VERIFIED: packages/persistence/src/jobs.ts]  
**Warning signs:** tests can produce duplicate `running` attempt rows or two claim responses for one job. [ASSUMED]

### Pitfall 2: Expired Lease Reclaim Loses Attempt Numbering

**What goes wrong:** reclaimed jobs overwrite or reuse attempt rows. [VERIFIED: packages/persistence/migrations/0001_initial.sql unique `(job_id, attempt_number)`]  
**Why it happens:** implementation forgets `attemptNumber = attempts + 1` when reclaiming `running` jobs. [VERIFIED: packages/persistence/src/jobs.ts]  
**How to avoid:** increment persisted `attempts` during every claim and insert attempt id `match-job-attempt:{jobID}:{attemptNumber}`. [VERIFIED: packages/persistence/src/jobs.ts]  
**Warning signs:** unique constraint errors on attempt insert or missing failure history. [ASSUMED]

### Pitfall 3: Heartbeat Extends A Stale Lease

**What goes wrong:** an old worker extends a job after another worker reclaimed it. [VERIFIED: packages/persistence/src/jobs.ts]  
**Why it happens:** heartbeat matches only `job_id` or `worker_id`. [ASSUMED]  
**How to avoid:** predicate heartbeat on `job_id`, exact `lease_token`, and `status='running'`; return false on zero rows. [VERIFIED: packages/persistence/src/jobs.ts]  
**Warning signs:** heartbeat succeeds after a test manually changes `lease_token`. [VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 4: Retry Exhaustion Is Off By One

**What goes wrong:** a third failed attempt requeues instead of marking `failed_system`, or a second failed attempt exhausts too early. [VERIFIED: packages/persistence/src/jobs.test.ts]  
**Why it happens:** implementer compares prior attempts instead of the already-incremented attempt count. [VERIFIED: packages/persistence/src/jobs.ts]  
**How to avoid:** use parity helper equivalent to `!retryable || attempts >= maxAttempts`. [VERIFIED: packages/persistence/src/jobs.ts]  
**Warning signs:** Go and TypeScript fixtures disagree for attempts 2/3 and 3/3. [VERIFIED: packages/persistence/src/jobs.test.ts]

### Pitfall 5: Mixed DB-Owning Workers During Cutover

**What goes wrong:** Go and TypeScript both claim/complete jobs from the normal queue. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]  
**Why it happens:** existing TypeScript `apps/worker/src/index.ts` starts `runWorkerLoop` without a lifecycle ownership gate. [VERIFIED: apps/worker/src/index.ts]  
**How to avoid:** add explicit config that disables TypeScript DB claim/completion in Go-selected normal mode while preserving rollback/test modes. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]  
**Warning signs:** local topology starts `pnpm --filter @cowards/worker dev` alongside Go lifecycle owner for normal product jobs. [VERIFIED: scripts/dev-local-postgres.sh + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

### Pitfall 6: Diagnostics Leak Runtime Internals

**What goes wrong:** stored attempt details include Strategy source, stderr, stack traces, host paths, tokens, or DSNs. [VERIFIED: .planning/REQUIREMENTS.md]  
**Why it happens:** raw error objects are serialized. [ASSUMED]  
**How to avoid:** allowlist fields before persistence; mirror current worker behavior that excludes subprocess `stderr`. [VERIFIED: apps/worker/src/runner.ts + apps/worker/src/runner.test.ts]  
**Warning signs:** privacy scan over `match_job_attempts.details` finds forbidden keys or URI substrings. [VERIFIED: packages/spec/src/public-output-privacy.ts]

## Code Examples

### Go Transaction Discipline

```go
// Source: pgx docs and existing live_backend.go transaction style.
tx, err := pool.Begin(ctx)
if err != nil {
  return err
}
defer func() {
  _ = tx.Rollback(ctx)
}()

// select/update/insert lifecycle rows here

if err := tx.Commit(ctx); err != nil {
  return err
}
```

pgx documents that `Pool.Begin` starts a transaction and that `Commit` or `Rollback` must be called to finalize it. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool]

### Claim Result DTO

```go
// Source: packages/persistence/src/jobs.ts ClaimedMatchJob.
type ClaimedMatchJob struct {
  JobID          string    `json:"jobId"`
  MatchID        string    `json:"matchId"`
  AttemptNumber  int       `json:"attemptNumber"`
  LeaseToken     string    `json:"-"`
  LeaseExpiresAt time.Time `json:"leaseExpiresAt"`
}
```

The public/API response should not expose raw lease tokens by default; internal callers may carry the token in memory for heartbeat/failure calls. [VERIFIED: .planning/REQUIREMENTS.md]

### System Failure Input

```go
// Source: packages/persistence/src/jobs.ts recordAttemptFailure input.
type RecordAttemptFailureInput struct {
  JobID        string
  LeaseToken   string
  ErrorClass   string
  ErrorMessage string
  Retryable    bool
  Details      map[string]any
}
```

Go should sanitize `Details` before insert and return only stable statuses: `retry_queued` or `failed_system`. [VERIFIED: packages/persistence/src/jobs.ts + .planning/REQUIREMENTS.md]

### Ownership Guard Shape

```ts
// Source: apps/worker/src/index.ts and Phase 97 no-mixed-owner decision.
if (process.env.COWARDS_LIFECYCLE_OWNER === "go") {
  throw new Error("TypeScript DB-owning worker is disabled while Go lifecycle ownership is selected")
}
```

The exact env name is discretionary, but the guard must preserve explicit rollback/test paths. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixture-only/read-only Go backend | Live Go backend owns selected reads, auth/session, account revisions, forks, and exhibition creation | v1.13/v1.14 [VERIFIED: .planning/PROJECT.md] | Phase 97 can add Go persistence lifecycle code inside the existing live backend rather than starting a new service. [VERIFIED: apps/go-backend/live_backend.go] |
| TypeScript worker owns job claim through completion | v1.15 target splits Go DB lifecycle from TypeScript runtime execution | v1.15 planning [VERIFIED: .planning/ROADMAP.md] | TypeScript remains runtime/parity/rollback, but not normal DB owner when Go is selected. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| Broad route ownership manifest only | v1.15 requires lifecycle ownership manifest | Phase 96 planning [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] | Phase 97 should update or consume lifecycle ownership fields for job claim/lease/failure surfaces. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |

**Deprecated/outdated:**

- The Go backend README still says Go remains read-only and TypeScript owns job claiming/orchestration; that statement is outdated for the v1.15 target and should be updated during implementation if Go lifecycle contracts land. [VERIFIED: apps/go-backend/README.md + .planning/ROADMAP.md]
- Running the TypeScript DB-owning worker as the normal product worker during Go-selected lifecycle ownership is disallowed by Phase 96/97 decisions. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `job_lifecycle_fixtures.go` may be useful as an optional fixture loader. | Recommended Project Structure | Low; planner can instead load JSON in tests directly. |
| A2 | Go lease tokens should use a crypto-random token generator. | Don't Hand-Roll | Medium; TypeScript uses `crypto.randomUUID`, and Go implementation must choose an equivalent stable API. |
| A3 | Duplicate claim bugs will surface as duplicate running attempts in tests. | Common Pitfalls | Low; actual database symptoms could also be lock waits or unique constraint errors. |
| A4 | Raw error-object serialization is the main diagnostics leak risk. | Common Pitfalls | Medium; leaks can also enter through manually built detail maps. |

## Open Questions

1. **Phase 96 artifact availability**
   - What we know: Phase 97 depends on ownership labels and no-fallback policy from Phase 96 context. [VERIFIED: .planning/ROADMAP.md + .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]
   - What's unclear: the machine-readable v1.15 lifecycle manifest does not exist in the current tree yet. [VERIFIED: `find .planning/phases` + `rg .planning/artifacts`]
   - Recommendation: plan Phase 97 to consume/update Phase 96 manifest fields if present, and fail the lifecycle monitor if missing after Phase 96 executes. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md]

2. **Lifecycle owner configuration name**
   - What we know: existing selected Go paths use `COWARDS_GO_BACKEND_OWNER` and route-family env switches. [VERIFIED: apps/web/lib/public-service-adapter.ts + apps/web/lib/account-service-adapter.ts]
   - What's unclear: no dedicated lifecycle-owner env var exists yet. [VERIFIED: `rg COWARDS.*LIFECYCLE` returned no current config]
   - Recommendation: use a clear variable such as `COWARDS_JOB_LIFECYCLE_OWNER=go|typescript_rollback` and document it in the Phase 97 plan/artifact. [ASSUMED]

3. **DB-backed Go test setup**
   - What we know: Go tests currently pass without a live database, and local Postgres/Docker paths exist. [VERIFIED: `go test ./...` + scripts/dev-local-postgres.sh + package.json]
   - What's unclear: whether planner should require live Postgres for Phase 97 Go tests or use SQL-level fixture tests plus one integration lane. [VERIFIED: apps/go-backend/main_test.go]
   - Recommendation: add fast pure/helper tests plus an integration test gated by `DATABASE_URL`; include `pnpm preflight:local -- --skip-web` or setup-only local Postgres as the full verification lane. [VERIFIED: scripts/dev-local-postgres.sh + package.json]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Go | Go backend lifecycle implementation/tests | yes | `go1.26.3 darwin/amd64` local; module `go 1.25.0` | None needed. [VERIFIED: `go version` + apps/go-backend/go.mod] |
| pgx | Go PostgreSQL access | yes | `github.com/jackc/pgx/v5 v5.9.2` | None; existing dependency. [VERIFIED: `go list -m -json` + apps/go-backend/go.mod] |
| PostgreSQL CLI | Local DB setup/tests | yes | `psql 16.14`, `pg_isready 16.14` | Docker Compose Postgres path also exists. [VERIFIED: local command + package.json] |
| Docker | Docker-backed services/preflight | yes | `Docker 29.4.3` | No-Docker local Postgres path exists. [VERIFIED: local command + scripts/dev-local-postgres.sh] |
| Redis CLI | Direct Redis checks | no | not found in probe | Phase 97 job lifecycle does not require direct Redis; preflight can skip Redis for local path. [VERIFIED: local command + package.json] |
| Node/pnpm | TypeScript parity fixtures and repo scripts | yes | Node `v24.15.0`, pnpm `11.1.2` | None needed. [VERIFIED: local command + package.json] |

**Missing dependencies with no fallback:** none for Phase 97 research and planning. [VERIFIED: environment probes]

**Missing dependencies with fallback:**

- `redis-cli` is absent, but Phase 97 does not need direct Redis and local preflight supports `--skip-redis`. [VERIFIED: local command + package.json]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Go `testing` for `apps/go-backend`; Vitest for TypeScript parity source/fixture generator. [VERIFIED: apps/go-backend/main_test.go + package.json] |
| Config file | Go module `apps/go-backend/go.mod`; Vitest scripts through package workspace. [VERIFIED: apps/go-backend/go.mod + package.json] |
| Quick run command | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` [VERIFIED: local command passed] |
| Full suite command | `pnpm go:parity && pnpm --filter @cowards/persistence test -- jobs.test.ts && pnpm --filter @cowards/worker test -- runner.test.ts` [VERIFIED: package.json + package scripts] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ORCH-01 | queued and expired-running claim with `FOR UPDATE SKIP LOCKED`, lease token, attempt row | Go integration + fixture parity | `cd apps/go-backend && go test ./... -run TestJobLifecycleClaim` | no - Wave 0 [VERIFIED: apps/go-backend has no job_lifecycle_test.go] |
| ORCH-02 | heartbeat rejects stale/mismatched leases | Go unit/integration | `cd apps/go-backend && go test ./... -run TestJobLifecycleHeartbeat` | no - Wave 0 [VERIFIED: apps/go-backend has no job_lifecycle_test.go] |
| ORCH-03 | retry queueing and exhaustion update attempt/job/Match state | Go integration + TS parity fixture | `cd apps/go-backend && go test ./... -run TestJobLifecycleFailure` | no - Wave 0 [VERIFIED: apps/go-backend has no job_lifecycle_test.go] |
| ORCH-04 | Go parity against TypeScript job semantics | TS generator + Go fixture test | `pnpm go:parity` plus new lifecycle fixture check | partial - existing route parity only [VERIFIED: package.json + apps/go-backend/testdata/service-fixtures] |
| ORCH-05 | TypeScript worker disabled as normal DB owner under Go selection | Vitest unit + monitor | `pnpm --filter @cowards/worker test -- runner.test.ts` and `pnpm boundary:monitors` | partial - current guard absent [VERIFIED: apps/worker/src/index.ts] |
| ORCH-06 | rollback/no-fallback rules documented for running jobs/retries/incomplete MatchSets | artifact/monitor test | `pnpm exec tsx scripts/check-boundary-monitors.ts` | partial - v1.14 manifest only [VERIFIED: scripts/check-boundary-monitors.ts + .planning/artifacts/v1.14-route-ownership-manifest.json] |
| ORCH-07 | diagnostics redaction | Go unit + privacy scanner | `cd apps/go-backend && go test ./... -run TestJobLifecycleDiagnostics` | no - Wave 0 [VERIFIED: apps/go-backend has no job_lifecycle_test.go] |
| ORCH-08 | idle, lease mismatch, expired reclaim, duplicate prevention | Go integration | `cd apps/go-backend && go test ./... -run TestJobLifecycle` | no - Wave 0 [VERIFIED: apps/go-backend has no job_lifecycle_test.go] |

### Sampling Rate

- **Per task commit:** `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` plus targeted Vitest for touched TS ownership guard. [VERIFIED: local command + package.json]
- **Per wave merge:** `pnpm go:parity && pnpm --filter @cowards/persistence test -- jobs.test.ts && pnpm --filter @cowards/worker test -- runner.test.ts`. [VERIFIED: package.json]
- **Phase gate:** `pnpm boundary:monitors` after lifecycle manifest/monitor work exists, plus Go lifecycle integration tests with `DATABASE_URL` when DB-backed tests are added. [VERIFIED: package.json + .planning/REQUIREMENTS.md]

### Wave 0 Gaps

- [ ] `apps/go-backend/job_lifecycle.go` - Go lifecycle implementation for ORCH-01..ORCH-03. [VERIFIED: file absent]
- [ ] `apps/go-backend/job_lifecycle_test.go` - claim/heartbeat/failure/retry/exhaustion/duplicate tests for ORCH-01..ORCH-08. [VERIFIED: file absent]
- [ ] TypeScript parity fixture generator extension for lifecycle cases. [VERIFIED: scripts/generate-go-parity-fixtures.ts currently targets route/service fixtures]
- [ ] TypeScript worker ownership guard test for no mixed DB-owning workers. [VERIFIED: apps/worker/src/index.ts currently starts `runWorkerLoop` unconditionally]
- [ ] Boundary monitor extension for v1.15 lifecycle ownership manifest after Phase 96 artifact exists. [VERIFIED: scripts/check-boundary-monitors.ts currently checks v1.14 route manifest]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no direct new user auth | Phase 97 is internal lifecycle; keep existing session/auth code untouched. [VERIFIED: .planning/ROADMAP.md] |
| V3 Session Management | no direct new session behavior | Do not log or expose session tokens in diagnostics. [VERIFIED: .planning/REQUIREMENTS.md] |
| V4 Access Control | yes for internal ownership control | Require explicit lifecycle owner selection and rollback mode; do not allow mixed owners. [VERIFIED: .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md] |
| V5 Input Validation | yes | Validate job ids, lease tokens, retryable flags, and failure detail DTO shape before DB writes. [VERIFIED: .planning/REQUIREMENTS.md] |
| V6 Cryptography | yes for lease tokens | Use Go crypto-backed random token generation behind an injectable interface; do not use predictable tokens. [ASSUMED] |
| V7 Error Handling and Logging | yes | Store stable redacted error class/message/details only; omit source, memories, objectives, stderr, stack traces, tokens, paths, and DSNs. [VERIFIED: .planning/REQUIREMENTS.md + apps/worker/src/runner.ts] |
| V10 Malicious Code | yes by boundary preservation | Do not execute Strategy code in Go or web/API; TypeScript runtime execution remains downstream/runtime-only. [VERIFIED: AGENTS.md + .planning/ROADMAP.md] |

### Known Threat Patterns for Go Job Lifecycle

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Duplicate job execution due to claim race | Tampering / Denial of Service | Transactional claim with row locks and duplicate-claim tests. [VERIFIED: packages/persistence/src/jobs.ts + PostgreSQL docs] |
| Stale worker extending or failing another worker's job | Tampering | Predicate heartbeat/failure on exact lease token and running state. [VERIFIED: packages/persistence/src/jobs.ts] |
| Diagnostics privacy leak | Information Disclosure | Allowlisted details and public-output privacy scanner. [VERIFIED: apps/worker/src/runner.ts + packages/spec/src/public-output-privacy.ts] |
| Mixed Go/TypeScript DB owners | Tampering / Repudiation | Ownership manifest plus startup guard and rollback-only TypeScript DB worker mode. [VERIFIED: .planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md] |
| Retry exhaustion drift | Reliability / Repudiation | Shared Go helper parity-tested against TypeScript `shouldExhaustRetries`. [VERIFIED: packages/persistence/src/jobs.ts + packages/persistence/src/jobs.test.ts] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` - locked Phase 97 scope, decisions, deferred items, parity sources. [VERIFIED: local file]
- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` - no-fallback, rollback, lifecycle manifest, no mixed DB owners. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - ORCH-01 through ORCH-08. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 97 sequencing and downstream exclusions. [VERIFIED: local file]
- `AGENTS.md` - deterministic engine, hostile Strategy isolation, terminology, privacy non-negotiables. [VERIFIED: local file]
- `packages/persistence/src/jobs.ts` - TypeScript parity oracle for claim, heartbeat, retry, failure, exhaustion. [VERIFIED: local file]
- `apps/worker/src/runner.ts` and `apps/worker/src/index.ts` - current DB-owning worker flow and startup behavior. [VERIFIED: local file]
- `packages/persistence/migrations/0001_initial.sql` - `match_jobs` and `match_job_attempts` schema. [VERIFIED: local file]
- `apps/go-backend/live_backend.go` and `apps/go-backend/go.mod` - existing Go live backend, pgx usage, current dependency versions. [VERIFIED: local file]
- Context7 `/websites/pkg_go_dev_github_com_jackc_pgx_v5` - pgx transaction docs. [CITED: https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool]
- Context7 `/websites/postgresql_current` and official PostgreSQL docs - row locking and `SKIP LOCKED`. [CITED: https://www.postgresql.org/docs/current/sql-select.html]

### Secondary (MEDIUM confidence)

- Local version probes: `go version`, `go list -m -json`, `npm view`, `psql --version`, `docker --version`, `pg_isready --version`. [VERIFIED: local commands]
- Existing package scripts in `package.json` for `go:parity`, `boundary:monitors`, `preflight`, and tests. [VERIFIED: package.json]

### Tertiary (LOW confidence)

- Assumed exact names for new Go files, fixture loader, and lifecycle ownership environment variable. [ASSUMED]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all recommended packages/tools are already in repo and versions were locally verified. [VERIFIED: apps/go-backend/go.mod + package.json + local commands]
- Architecture: HIGH - phase scope and ownership split are explicit in Phase 96/97 context and roadmap. [VERIFIED: .planning/ROADMAP.md + phase CONTEXT files]
- Pitfalls: HIGH for claim/lease/retry/privacy/mixed-owner issues because they map to existing code and locked decisions; MEDIUM for exact failure symptoms. [VERIFIED: packages/persistence/src/jobs.ts + .planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md]

**Research date:** 2026-05-24 [VERIFIED: system date]  
**Valid until:** 2026-06-23 for repo-local findings; re-check pgx/PostgreSQL docs and npm/Go module versions if implementation starts after that date. [ASSUMED]
