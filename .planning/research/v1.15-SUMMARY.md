# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.15 Go Backend Ownership Completion
**Domain:** Go backend orchestration ownership, Match lifecycle coordination, Chronicle persistence, MatchSet scoring completion, public evidence delivery, runtime ABI handoff
**Researched:** 2026-05-24
**Confidence:** High for repo-local ownership, route, worker, persistence, privacy, and topology findings; medium for exact implementation sequencing until Phase 96 rebaselines drift.

## Executive Summary

v1.15 should complete the normal backend ownership cutover by moving persistence-facing orchestration from TypeScript to Go while preserving the hostile Strategy execution boundary created in v1.14. The correct ownership line is not a Go engine/runtime rewrite. It is a Go-owned lifecycle where web calls Go, Go claims and completes jobs, Go persists validated Chronicles, Go finalizes MatchSet scoring, and Go serves public evidence; TypeScript remains the frontend, parity oracle, and isolated JS/TS Strategy runtime service behind `strategy-runtime-abi-v1.14`.

The current repository already has live PostgreSQL-backed Go routes for selected public reads, auth/session, account Strategy Revisions, artifact-backed Starter/Advanced forks, and exhibition MatchSet creation. The remaining normal backend ownership gap is downstream of that creation step: TypeScript still claims jobs, loads Match inputs, runs engine/replay creation, writes Chronicles, completes Matches, records system failures, refreshes MatchSet scoring, and serves full replay data through persistence-facing web paths.

## Stack Findings

- Keep the existing stack: Go backend, PostgreSQL, TypeScript frontend, TypeScript spec/service contracts, TypeScript runtime-js boundary, and existing topology/monitor scripts.
- Do not add a new queue, broker, orchestration framework, cloud deployment layer, or production sandbox replacement.
- Add Go lifecycle code for job claim/lease/failure/retry/completion, Chronicle persistence, MatchSet scoring refresh, and public evidence delivery.
- Add or refactor a TypeScript stateless execution service so Strategy execution remains outside Go/web/API and behind `strategy-runtime-abi-v1.14`.
- Treat TypeScript persistence/service behavior as parity oracle and rollback reference, not the normal future backend path.

## Feature Table Stakes

### Go Orchestration

- Go owns Match job claim, lease, heartbeat, expired-lease reclaim, retry/failure recording, Match status transitions, attempt rows, and completion idempotency.
- Go owns the selected normal orchestration owner switch and fails closed when selected dependencies are unavailable.
- Go prevents TypeScript DB-owning workers from claiming normal jobs during Go-selected operation.

### Runtime ABI Handoff

- Go invokes TypeScript runtime execution only through a versioned execution contract that preserves v1.14 runtime ABI semantics.
- TypeScript runtime service executes Strategy code, but does not own normal persistence writes or job completion.
- Runtime violations become valid Match/Chronicle outcomes; system failures are retried or classified by Go.

### Chronicle And MatchSet Completion

- Go validates Chronicle schema/version, Match id, Strategy Revision ids, arena id, source hashes, terminal outcome, content hash, and metadata before persistence.
- Go atomically updates Match completion fields, `match_jobs`, `match_job_attempts`, and Chronicle rows.
- Go ports MatchSet scoring/status semantics, including degraded/system failure, strategy-failure penalty, tie-breakers, and completed/degraded timestamps.

### Public Evidence And Web Cutover

- Go public MatchSet/replay/evidence routes reflect Go-completed Matches and scored MatchSets.
- Web normal workflows call Go contracts instead of reaching TypeScript persistence/service internals.
- Public outputs remain source/memory/objective/debug/token/path/DSN/runtime-private safe by default.

### Topology And Monitors

- Local topology evidence covers web frontend -> Go backend -> TypeScript runtime service -> Go persistence -> Go public evidence.
- Boundary monitors fail on unexpected TypeScript backend ownership, unsafe fallback, runtime ABI drift, schema drift, privacy drift, report-only offense increases, and public-output leaks.

## Architecture Findings

- Go already creates exhibition MatchSets and `match_jobs`, but TypeScript still owns job claiming and completion.
- `packages/persistence/src/jobs.ts`, `complete-match.ts`, `chronicle-store.ts`, `matchset-status.ts`, and `scoring.ts` are the TypeScript parity sources for Go lifecycle work.
- `apps/worker/src/runner.ts` is the current coupling point between DB job ownership and runtime/engine execution.
- `apps/web/app/matches/server.ts` and Workshop routes still directly import persistence/service internals for normal replay/workshop paths.
- Existing topology checks are strong for route-level public reads but need lifecycle-level evidence.

## Watch Out For

- Do not execute Strategy code in Go or web/API.
- Do not use Node `vm` as a security boundary.
- Do not retire TypeScript runtime execution or promote production sandbox replacement in v1.15.
- Do not expose raw Chronicles, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals by default.
- Do not allow Go and TypeScript workers to claim/complete the same normal jobs concurrently.
- Do not let public reads lazily hide missing Go scoring completion by calling TypeScript refresh code.

## Recommended Phase Structure

1. Phase 96: Boundary Baseline and Go Ownership Contract.
2. Phase 97: Go Job Lifecycle and Persistence Contracts.
3. Phase 98: Runtime Execution Service Boundary.
4. Phase 99: Go Match Completion and Chronicle Persistence.
5. Phase 100: Go MatchSet Scoring and Failure Classification.
6. Phase 101: Public Evidence Delivery and Web Cutover.
7. Phase 102: Topology, Monitors, Rollback, and Promotion Gate.
