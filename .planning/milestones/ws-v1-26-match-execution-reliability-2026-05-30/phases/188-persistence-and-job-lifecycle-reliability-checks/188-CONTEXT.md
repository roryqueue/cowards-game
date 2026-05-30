# Phase 188: Persistence and Job Lifecycle Reliability Checks - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Strengthen retry/job lifecycle idempotency, stale lease handling, completion safety, and MatchSet refresh reliability. This phase focuses on persistence-facing reliability checks owned by Go.

</domain>

<decisions>
## Implementation Decisions

### Idempotency and Stale Writes
- **D-01:** Job claiming, lease, heartbeat, retry queueing, terminal failure, and completion paths must be safe under duplicate or stale attempts.
- **D-02:** Stale lease reclaim behavior must be deterministic and must not allow simultaneous active workers for the same unexpired job.
- **D-03:** Match completion must reject stale lease tokens, terminal job rewrites, duplicate Chronicle writes, and stale completion after terminal failure.
- **D-04:** MatchSet status refresh must be idempotent across retry, failure, degraded, complete, and no-result paths.

### Persistence Privacy
- **D-05:** Failure detail persistence stores only allowlisted public-safe scalars and never raw Strategy/runtime diagnostics.
- **D-06:** Local Postgres integration coverage is preferred where persistence semantics cannot be proven with pure unit tests.

### Scope Guardrails
- **D-07:** Do not move migration/schema ownership or persistence authority into runtime-service or web/API.
- **D-08:** Do not change engine determinism or Strategy runtime behavior to make persistence tests pass.

### the agent's Discretion
Planner may choose whether to add new integration tests, improve existing test helpers, or add a targeted live drill artifact, as long as duplicate/stale lifecycle cases are covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — JOB requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 188 success criteria.

### Go Persistence and Lifecycle
- `apps/go-backend/job_lifecycle.go` — claim, heartbeat, retry, terminal failure, detail sanitization.
- `apps/go-backend/job_lifecycle_test.go` — existing local Postgres lifecycle integration tests.
- `apps/go-backend/completion.go` — completion transaction and Chronicle write behavior.
- `apps/go-backend/completion_test.go` — completion idempotency and stale lease tests.
- `apps/go-backend/matchset_status.go` — MatchSet scoring/status refresh.
- `apps/go-backend/matchset_status_test.go` — MatchSet refresh and degraded/failure tests.
- `packages/persistence/migrations/0001_initial.sql` — match/job schema and default attempts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing phase 97-style test helpers seed jobs and matches in local Postgres.
- Completion tests already cover duplicate and stale completion shapes.
- MatchSet status tests already include failed/degraded state handling.

### Established Patterns
- Go uses lease tokens and transactional `for update` checks to reject stale writers.
- MatchSet refresh happens inside terminal failure/completion transactions where possible.

### Integration Points
- Add coverage near existing Go integration tests, preserving the `COWARDS_GO_BACKEND_TEST_DATABASE_URL` gate.
- Reuse cleanup helpers so tests do not leave milestone-specific rows.

</code_context>

<specifics>
## Specific Ideas

This phase should close the "what if a stale worker reports late?" hole before the live proof leans on reliability claims.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 188-Persistence and Job Lifecycle Reliability Checks*
*Context gathered: 2026-05-30*
