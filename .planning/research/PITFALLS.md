# Pitfalls Research: v1.15 Go Backend Ownership Completion

**Project:** Coward's Game
**Milestone:** v1.15 Go Backend Ownership Completion
**Researched:** 2026-05-24

## Likely Mistakes

- Promoting `createMatchSet` without promoting downstream lifecycle ownership. v1.14 made Go own exhibition creation, but still deferred job claiming, Match execution, Chronicle generation, and runtime failure classification.
- Imperfect job semantics port. Go must preserve `FOR UPDATE SKIP LOCKED`, lease tokens, attempt numbering, expired-running reclaim, retry exhaustion, and Match/job status updates.
- Breaking idempotent completion. Duplicate completion should be accepted only when the Match is already complete and an existing Chronicle row exists.
- Scoring drift. Go must match TypeScript behavior for degraded/system failure, strategy failure penalties, W-L-D, survivor/survival-turn tie-breakers, and stable ordering.
- Treating Go orchestration as permission to execute Strategy source. Go is a coordinator and persistence owner, not a hostile-code host.
- Returning raw Chronicles or private replay data as public evidence.
- Relabeling worker-thread/subprocess runtime evidence as production sandbox promotion.
- Allowing silent TypeScript backend fallback to hide Go lifecycle failure.

## Privacy And Determinism Hazards

- Public/service/Go/topology/monitor output must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals.
- Runtime ABI handoff must preserve original revision source/hash metadata and must not trust transpiled executable source as the only identity input.
- Go may use time/randomness for sessions, leases, ids, and submission events, but never for engine outcomes, Chronicle content hashes, scoring inputs, or replay reconstruction.
- Board realism checks must remain part of any replay or Match creation change.

## Rollback Hazards

- Mixed Go and TypeScript DB workers can double-claim or double-complete jobs.
- Partial rollback can strand `running` jobs, expired leases, incomplete Chronicles, and MatchSets stuck `running`.
- A stopped TypeScript runtime service should produce explicit Go-owned retry/system-failure behavior, not TypeScript persistence fallback.
- A stopped Go backend should make selected web workflows fail closed without switching to TypeScript service internals.

## Evidence Gaps To Close

- Add lifecycle topology evidence: create MatchSet through Go, claim/execute through runtime boundary, persist Chronicle, refresh scoring, render public MatchSet and replay.
- Add monitor coverage for Go job SQL semantics, lease expiry, retry exhaustion, lifecycle manifest drift, MatchSet scoring parity, runtime ABI drift, and no-fallback behavior.
- Add Go DB-backed integration tests for queue claim, expired lease reclaim, completion idempotency, Chronicle uniqueness, scoring completion, and stopped-runtime classification.

## Prevention By Phase

1. Baseline ownership and non-goals before implementation.
2. Port job lifecycle semantics with parity tests before orchestration.
3. Build runtime execution service as stateless/persistence-free before Go invokes it.
4. Persist only validated Chronicles and enforce idempotency.
5. Port scoring with golden parity before public standings depend on Go.
6. Serve public evidence only through privacy and board-realism gates.
7. Require live topology, stopped-service, rollback, privacy, and monitor evidence before promotion.
