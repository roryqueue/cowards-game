# Phase 87: Exhibition Creation Ownership and Worker Handoff - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 87 moves exhibition MatchSet creation to Go ownership while preserving TypeScript worker/runtime ownership. It covers the owner-authenticated creation mutation, transactional MatchSet/entrant/Match/job/revision-lock/provenance/audit writes, and public-safe queued/running/complete/degraded follow-through after creation. It does not move public MatchSet reads beyond Phase 84, claim jobs, execute Strategies, complete Matches, build Chronicles, score completed MatchSets, classify runtime failures, own worker retries/heartbeats, execute Strategy source, own migrations, or change engine rules.

</domain>

<decisions>
## Implementation Decisions

### Mutation Slice

- **D-01:** Move exhibition MatchSet creation to Go ownership as the Phase 87 mutation slice.
- **D-02:** Phase 87 covers only creation. Public MatchSet result/summary reads remain covered by Phase 84, and worker execution remains TypeScript-owned.
- **D-03:** TypeScript behavior remains parity oracle and explicit rollback/reference, not silent fallback in selected-Go evidence paths.

### Transactional Parity

- **D-04:** Go must preserve preset validation, 2-8 distinct owned revisions, counted-runtime eligibility, rate limiting, active duplicate prevention, arena seeding, MatchSet insert, entrant snapshots, Match inserts, queued job inserts, revision locks, provenance, and submission audit event.
- **D-05:** Creation writes must be transactional: partial MatchSet, entrant, Match, job, lock, provenance, or audit records must not be left behind on failure.
- **D-06:** Go-created exhibitions must be inspectable through public-safe result pages and show queued/running/complete/degraded behavior compatible with TypeScript-created exhibitions.
- **D-07:** Go-created job rows must use the schema and status conventions the TypeScript worker already understands.

### Worker Boundary

- **D-08:** Go may enqueue jobs as part of transactional exhibition creation.
- **D-09:** Go must not claim jobs, execute Strategies, complete Matches, build Chronicles, score completed MatchSets, classify runtime failures, heartbeat leases, manage worker retries, or own worker runtime lifecycle.
- **D-10:** The ownership registry and evidence must explicitly mark job claiming/completion, Match execution, Chronicle generation, scoring completion, and runtime failure classification as TypeScript worker-owned.

### No Source Execution

- **D-11:** Exhibition creation may inspect revision metadata and stored eligibility/runtime fields.
- **D-12:** Exhibition creation must not read Strategy source into public DTOs, evidence, logs, or monitor output.
- **D-13:** Exhibition creation must not execute Strategy source, compile it, run tests, invoke Node `vm`, or promote any hostile-code sandbox.

### Failure Behavior

- **D-14:** Invalid preset, invalid revision ids, missing revisions, duplicate revision ids, unauthorized ownership, invalid validation status, invalid counted-runtime eligibility, active duplicate exhibition, rate limit, storage unavailable, transaction failure, schema failure, privacy failure, and Go unavailable must fail closed.
- **D-15:** Failures must map to public-safe or owner-safe service errors without stack traces, SQL details, DB DSNs, host paths, stderr, sessions, tokens, cookies, password hashes, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, Chronicle internals, or private runtime internals.
- **D-16:** Stopped-Go, bad-response, and transaction-failure drills must prove no silent TypeScript fallback when Go exhibition creation is selected.

### the agent's Discretion

Downstream agents may choose exact route switch names, Go package structure, transaction helper shape, evidence artifact format, and whether to share query/provider helpers with earlier phases, but transactional parity, explicit worker boundary, no source execution, and no-fallback selected-Go behavior are locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 goal and hard boundaries.
- `.planning/REQUIREMENTS.md` - MUT-01 through MUT-06 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 87 goal, success criteria, and dependencies.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership states, registry, evidence, and no-fallback decisions.
- `.planning/phases/083-go-persistence-and-live-dto-foundation/083-CONTEXT.md` - Live DB, schema/privacy, parity, and sanitized error decisions.
- `.planning/phases/085-auth-session-and-account-read-ownership/085-CONTEXT.md` - Owner/session identity decisions.
- `.planning/phases/086-account-strategy-revision-source-and-write-ownership/086-CONTEXT.md` - Strategy Revision metadata, source privacy, and no-execution decisions.

### Exhibition and MatchSet Reference

- `packages/spec/src/service.ts` - `createMatchSet` service contract and public MatchSet DTO contracts.
- `packages/persistence/src/competition.ts` - Current exhibition validation, rate limit, duplicate prevention, entrant snapshots, creation orchestration, and public result builder.
- `packages/persistence/src/matchset-service.ts` - Transactional MatchSet, entrant, Match, job, and revision-lock insert behavior.
- `packages/persistence/src/jobs.ts` - TypeScript worker-owned job claiming/lease/retry behavior that Go must not take over.
- `apps/web/app/competitive/server.ts` - Current `createExhibition` reference behavior.
- `apps/web/app/api/exhibitions/route.ts` - Current exhibition creation API boundary.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` - Existing client expectations after creation.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Public result page expectations.

### Monitors and Evidence

- `scripts/check-boundary-monitors.ts` - Boundary monitor and privacy-safe artifact checks.
- `scripts/check-local-topology.ts` - Topology evidence pattern to extend for exhibition creation and worker handoff.
- `scripts/check-service-boundary-imports.ts` - Strict/report-only import baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/persistence/src/competition.ts` already defines validation, rate limit, active duplicate prevention, entrant snapshot assembly, pairwise matrix generation, and audit event behavior.
- `packages/persistence/src/matchset-service.ts` already performs transactional inserts for MatchSets, competition entrants, Matches, match jobs, and revision locks.
- `packages/persistence/src/jobs.ts` clearly separates worker claiming, leases, retries, and completion behavior from creation.
- `apps/web/app/api/exhibitions/route.ts` and `apps/web/app/competitive/server.ts` define the current web mutation shape and response.

### Established Patterns

- Creation may enqueue queued jobs, but TypeScript worker owns claiming/execution/completion.
- Selected-Go paths fail closed rather than silently falling back to TypeScript.
- Public and evidence outputs must omit Strategy source, private memory, objective payloads, replay internals, stack traces, DSNs, tokens, sessions, cookies, and private runtime internals.
- Source handling and Strategy execution remain outside the Go web/API cutover.

### Integration Points

- Phase 87 should update the Phase 82 ownership manifest for exhibition creation and worker-owned surfaces.
- Phase 87 should reuse Phase 83 live DB/error/privacy foundation and Phase 85 owner auth.
- Phase 88 must verify Go-created exhibitions can be read publicly and picked up by the TypeScript worker boundary without ownership confusion.

</code_context>

<specifics>
## Specific Ideas

Treat Go exhibition creation as a transactional job producer, not a worker. It can validate, snapshot, lock, insert, and enqueue, but all claiming, execution, Chronicle creation, scoring completion, and runtime failure classification stay with the TypeScript worker.

</specifics>

<deferred>
## Deferred Ideas

- Job claiming/completion, worker retries/heartbeats, Match execution, Chronicle generation, scoring completion, and runtime failure classification in Go.
- Strategy execution, Workshop tests, sandbox promotion, and Node `vm`.
- Go-owned migrations and engine/rules changes.

</deferred>

---

*Phase: 87-Exhibition Creation Ownership and Worker Handoff*
*Context gathered: 2026-05-23*
