# Stack Research: v1.3 Competition Trust Beta

**Project:** Coward's Game  
**Date:** 2026-05-19  
**Milestone context:** v1.3 Competition Trust Beta

## Existing Stack to Preserve

- TypeScript monorepo with pnpm, Turbo, Vitest, Playwright, Next.js, PostgreSQL, Docker Compose, and package boundaries across `@cowards/spec`, `@cowards/engine`, `@cowards/replay`, `@cowards/runtime-js`, `@cowards/persistence`, `@cowards/web`, and `@cowards/worker`.
- Pure deterministic engine remains isolated from persistence, network, filesystem, wall-clock time, and React.
- Competition contracts already exist in `packages/spec/src/competition.ts` for exhibition presets, immutable entrant snapshots, public standings, Match evidence, provenance, publication policy, and leak checks.
- Persistence already has v1.2 ownership/session/competition tables in `packages/persistence/migrations/0003_competitive_alpha.sql`.
- Runtime already exposes a replaceable Strategy execution adapter and has worker-thread plus subprocess metadata in `packages/runtime-js/src/adapter.ts` and `packages/runtime-js/src/subprocess-adapter.ts`.

## Recommended Stack Additions

### Ladder and Governance Persistence

Add a v1.3 migration for:

- `competition_seasons`: resettable trial ladder seasons with status, preset/scoring policy, open/close timestamps, and publication policy.
- `season_entries`: one active Strategy Revision snapshot per user per season, replacement policy, stale behavior, and public entry status.
- `season_matchsets`: scheduled MatchSet batches/pods tied to a season and counted/non-counted status.
- `season_standings`: materialized or recomputable public standings derived from counted MatchSets.
- `result_flags`: player-submitted dispute notes tied to MatchSet/Match/result evidence.
- `result_moderation_events`: admin-only audit trail for invalidation, non-competitive marking, and review decisions.
- `starter_strategies` or seed metadata: forkable default Strategy templates with doctrine metadata, source, tags, validation status, and versioning.

### Public Surface

Use existing Next.js app routes and server modules:

- `/players/[handle]` for public player handle pages.
- `/strategies/[strategyId]` or `/strategies/[strategySlug]` for public Strategy cards without source.
- `/seasons/[seasonId]` for trial ladder standings and season state.
- `/seasons/[seasonId]/enter` or account/workshop affordances for ladder entry.
- Existing `/matchsets/[matchSetId]` result page should gain counted/non-counted/provenance/dispute state instead of a duplicate result surface.

### Runtime Boundary Spike

Keep `worker-thread` as the local/dev fallback, but treat it as compatibility containment only. Node worker resource limits constrain V8 heap/stack in the Worker and still share the host process; Node docs explicitly say those limits affect the JS engine and not all external data, and a global out-of-memory can still abort the process.

Prefer a v1.3 production spike around the existing subprocess adapter upgraded to one of:

1. **Containerized subprocess adapter:** invoke the existing JSON IPC harness inside a short-lived container or sandboxed service with Docker CPU/memory/pids/network/filesystem controls.
2. **Hardened subprocess adapter:** keep a host process boundary with shell disabled, explicit env, stdio caps, timeout, and kill handling as an incremental step while container work lands.
3. **WASM/WASI prototype only if compiled Strategy language changes become in-scope:** Wasmtime has deterministic fuel and resource limiter mechanisms, but moving JS/TS Strategy authoring to Wasm is a larger product/runtime shift.

Do not use Node `node:wasi` as a hostile-code sandbox. Node documentation marks WASI experimental and says not to rely on it for untrusted code.

## What Not to Add

- No permanent rating engine dependency yet. Trial standings can use existing deterministic points, tie-breakers, and counted MatchSet aggregation.
- No all-time leaderboard tables or durable Elo/Glicko schema contracts in v1.3.
- No new engine dependency for ladder rules. Eligibility, scheduling, and standings belong in spec/persistence/service layers.
- No React-owned game or scoring rules.
- No Strategy source execution in web/API routes.

## Verification Implications

- Extend Vitest coverage for season eligibility, one-active-entry constraints, replacement policy, stale revisions, standings aggregation, counted/non-counted MatchSets, disputes, invalidation audit logs, public DTO privacy, and starter template validation.
- Extend service-backed Playwright coverage for fork starter -> save revision -> exhibition test -> enter ladder -> generated MatchSet -> standings/result/replay evidence.
- Add hostile Strategy runtime regression tests around the chosen production adapter path: forbidden globals, dynamic import, process/worker/fs/network attempts, infinite loop, memory pressure, stdout/stderr flood, malformed JSON IPC, subprocess/container exit, timeout, and adapter system failure.

## Sources

- Local: `.planning/PROJECT.md`
- Local: `.planning/milestones/v1.2-REQUIREMENTS.md`
- Local: `packages/spec/src/competition.ts`
- Local: `packages/persistence/migrations/0003_competitive_alpha.sql`
- Local: `packages/runtime-js/src/adapter.ts`
- Local: `packages/runtime-js/src/subprocess-adapter.ts`
- Node child process docs: https://nodejs.org/api/child_process.html
- Node worker threads docs: https://nodejs.org/api/worker_threads.html
- Node WASI docs: https://nodejs.org/api/wasi.html
- Docker resource constraints docs: https://docs.docker.com/engine/containers/resource_constraints/
- Wasmtime interruption docs: https://docs.wasmtime.dev/examples-interrupting-wasm.html
- Wasmtime resource limiter docs: https://docs.wasmtime.dev/api/src/wasmtime/runtime/limits.rs.html
