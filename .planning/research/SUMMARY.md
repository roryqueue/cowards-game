# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.16 Runtime Isolation and TypeScript Backend Retirement
**Domain:** TypeScript backend retirement, isolated JS/TS Strategy runtime service boundary, Go-owned backend topology, no-fallback enforcement
**Researched:** 2026-05-24
**Confidence:** High for repo-local TypeScript surface inventory, v1.15 topology/monitor behavior, and immediate cleanup targets; medium for exact deletion order until Phase 103 rebaselines drift.

## Executive Summary

v1.16 should finish the TypeScript backend retirement started in v1.13-v1.15 by narrowing TypeScript to two legitimate normal roles: frontend code and the isolated JS/TS Strategy runtime service. Go is now the backend baseline for normal orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring completion, and public evidence delivery.

The remaining risk is not that TypeScript still exists. It is that TypeScript still contains service facades, Next.js API routes, worker entrypoints, and persistence modules that can behave like a backend through direct database access, job claiming, MatchSet creation, Chronicle persistence, lazy scoring refresh, public DTO assembly, or silent fallback. v1.16 should delete, quarantine, or explicitly relabel those paths while preserving JS/TS Strategy execution through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`.

## Stack Findings

- Keep the existing stack: Next.js frontend, Go backend, PostgreSQL, TypeScript spec/contracts, TypeScript runtime service, runtime-js adapters, and current topology/monitor scripts.
- Do not add a new runtime language host, broker, queue, sandbox replacement, cloud deployment layer, or service mesh.
- Keep `apps/runtime-service` as the JS/TS Strategy execution boundary, provided it stays DB-free and owns no normal job lifecycle, persistence, scoring, public API, or fallback behavior.
- Shape the runtime execution contract as if a language-neutral runtime broker will front or replace the current TypeScript runtime service soon; broker implementation remains out of v1.16 scope.
- Treat `@cowards/service`, TypeScript persistence lifecycle code, and `apps/worker` as parity, rollback, test, fixture, or deferred surfaces after explicit relabeling.
- Extend monitors and topology from v1.15 so page smoke and no-TypeScript-backend operation are closure gates, not optional evidence.

## Surface Inventory Findings

### Clean Runtime-Only Surfaces

- `apps/runtime-service/src/server.ts` exposes `/health` and `/execute-match`, with no DB ownership.
- `apps/runtime-service/src/execute-match.ts` validates runtime service requests, source hashes/bytes, executes JS/TS Strategy code through runtime-js, and returns internal runtime results.
- `packages/runtime-js/src/executor.ts` and `packages/runtime-js/src/abi-bridge.ts` remain the JS/TS Strategy execution implementation and ABI bridge.

### TypeScript Backend Retirement Targets

- `apps/web/app/competitive/server.ts` imports persistence modules for auth, account revisions, competition, ladder, governance, Starter/Advanced artifacts, and `@cowards/service`.
- `apps/web/app/matches/server.ts` still has direct Chronicle store and persistence-backed replay paths for non-Go public evidence and owner-debug replay.
- `apps/web/app/workshop/server.ts` imports Workshop and analytics persistence directly.
- `apps/web/lib/account-service-adapter.ts` and `apps/web/lib/public-service-adapter.ts` retain persistence-backed TypeScript service fallback paths.
- `apps/worker/src/index.ts` and `apps/worker/src/runner.ts` still provide a DB-owning job claim/completion worker, guarded but present.
- `packages/persistence/src/jobs.ts`, `complete-match.ts`, `chronicle-store.ts`, `matchset-status.ts`, `match-service.ts`, `matchset-service.ts`, and `competition.ts` retain lifecycle, completion, Chronicle, scoring, and MatchSet creation code that must not be normal backend after v1.15.

### Deferred Or Explicitly Labeled Surfaces

- Workshop validation/test/rerun/profile/export flows remain significant TypeScript-backed product surfaces and should be labeled deferred unless migrated.
- Ladder scheduling and governance/admin mutations remain deferred unless selected for Go migration.
- Owner-debug replay may need TypeScript/private Chronicle access until a later Go owner-debug replay migration, but it must stay explicit and private.
- Test-support routes and fixture generators should remain test/parity-only and fail outside test environments.

## Watch Out For

- Do not execute Strategy code in Go or web/API processes.
- Do not use Node `vm` as a security boundary.
- Do not remove JS/TS Strategy support; keep it only inside the isolated runtime service boundary.
- Do not let the runtime service become a backend by claiming jobs, writing Chronicles, refreshing scoring, serving public evidence, or accessing DB/network/filesystem beyond its execution contract.
- Do not allow TypeScript service fallback to mask missing Go routes, stopped Go, stopped runtime service, schema drift, privacy drift, or page-load failures.
- Do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, DB DSNs, host paths, or private runtime internals in public outputs.

## Recommended Phase Structure

1. Phase 103: TypeScript Backend Inventory and Retirement Contract.
2. Phase 104: Isolated Runtime Service Boundary Hardening.
3. Phase 105: Web/API Go-Only Cutover and Fallback Removal.
4. Phase 106: TypeScript Worker and Persistence Quarantine.
5. Phase 107: Deferred Surface Relabeling and Privacy Preservation.
6. Phase 108: No-TypeScript-Backend Topology and Monitor Gate.
7. Phase 109: Milestone Verification, Deletion Audit, and Promotion Decision.
