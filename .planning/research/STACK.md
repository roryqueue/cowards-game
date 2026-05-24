# Stack Research: v1.15 Go Backend Ownership Completion

**Project:** Coward's Game
**Milestone:** v1.15 Go Backend Ownership Completion
**Researched:** 2026-05-24
**Confidence:** High for current ownership map and local code paths; medium for exact implementation shape until Phase 96 rebaselines drift.

## Current Ownership Map

| Area | Current owner | Stack/code |
| --- | --- | --- |
| Frontend UI | TypeScript | Next/React in `apps/web`, with Pixi replay and Monaco Workshop surfaces. |
| Service contracts | TypeScript canonical | `@cowards/spec`, `service-api-v1.8`, Zod schemas, OpenAPI artifacts. |
| Go backend | Partial primary | Go `net/http`, `pgx/v5`, live PostgreSQL mode in `apps/go-backend/live_backend.go`. |
| Public reads | Go primary when selected | Public Strategy, player, ladder, MatchSet summary, and replay metadata routes. |
| Auth/account/revisions/forks | Go primary when selected | Session, account revision list/source/create/save, Starter/Advanced forks through generated v1.14 artifacts. |
| Exhibition creation | Go primary when selected | Go inserts MatchSets, entrants, Matches, and `match_jobs`. |
| Job claiming/completion | TypeScript-owned | `apps/worker/src/runner.ts`, `packages/persistence/src/jobs.ts`, `complete-match.ts`. |
| Engine/Chronicle build | TypeScript-owned | `@cowards/engine` and `@cowards/replay`; TypeScript remains the parity oracle. |
| Chronicle persistence | TypeScript-owned | `createPostgresChronicleStore` and `completeMatch`. |
| MatchSet scoring completion | TypeScript-owned | `refreshMatchSetStatus` and `scoreMatchSet`. |
| Public replay page data | TypeScript-owned | `apps/web/app/matches/server.ts` opens persistence/Chronicle paths directly. |
| Strategy runtime | TypeScript-owned | `@cowards/runtime-js` behind `strategy-runtime-abi-v1.14`; not a production sandbox replacement. |

## Needed Stack Changes

- Keep the existing stack: Go + PostgreSQL + TypeScript runtime ABI. Do not add Redis, BullMQ, Kafka, NATS, Kubernetes, service mesh, or a cloud observability stack for this milestone.
- Add Go orchestration code for job claim, lease, failure, retry, completion, Chronicle insert, and MatchSet scoring.
- Refactor or wrap the TypeScript worker into a stateless execution/runtime service path so Go owns persistence and lifecycle state while TypeScript executes Strategy code behind the v1.14 ABI.
- Extend Go public evidence delivery beyond metadata so normal public MatchSet/replay workflows do not need TypeScript service fallback when Go is selected.
- Expand topology and boundary monitors from selected-route reads to full lifecycle evidence.

## Existing Evidence Hooks

- `pnpm boundary:monitors`
- `pnpm topology:check`
- `pnpm preflight -- --skip-web`
- `pnpm strategy-artifacts:check`
- `pnpm go:parity`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/worker test`
- `pnpm --filter @cowards/web test -- server.test.ts replay-board.test.ts`
- Service-backed Playwright flows can validate web -> backend -> worker -> replay behavior when local services are running.

## Likely Code Paths

- Primary implementation: `apps/go-backend/live_backend.go`, new Go files under `apps/go-backend/`, `apps/worker/src/runner.ts`, `apps/worker/src/index.ts`, `apps/web/lib/go-backend-service-client.ts`, `apps/web/lib/public-service-adapter.ts`, `apps/web/lib/account-service-adapter.ts`, `apps/web/app/matches/server.ts`, `packages/spec/src/service.ts`, monitor/topology scripts.
- Parity/reference: `packages/persistence/src/jobs.ts`, `packages/persistence/src/complete-match.ts`, `packages/persistence/src/chronicle-store.ts`, `packages/persistence/src/matchset-status.ts`, `packages/persistence/src/scoring.ts`, `packages/replay/src/project.ts`, `packages/runtime-js/src/abi-bridge.ts`.

## Do Not Add

- No Strategy execution in Go or web/API.
- No Node `vm` security-boundary use.
- No production sandbox replacement or final TypeScript runtime retirement.
- No silent TypeScript backend fallback when Go is selected.
- No public output containing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals.
