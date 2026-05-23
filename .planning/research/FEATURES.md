# v1.13 Feature Research: Go Backend Ownership Cutover

**Milestone:** v1.13 Go Backend Ownership Cutover
**Researched:** 2026-05-23

## Table Stakes

- Go reads live PostgreSQL data instead of committed parity fixtures.
- Go becomes the selected owner for normal public product reads: public Strategy page, public player page, public ladder page, public MatchSet summary, and public replay metadata.
- Go owns source-free owner/account reads: auth session read and account Strategy Revision list.
- Go owns core account/session mutations selected for v1.13: sign up, sign in, sign out, Strategy Revision save/create, Starter/Advanced fork, owner-private source retrieval, and exhibition MatchSet creation.
- Web-selected Go paths fail closed without silent TypeScript fallback.
- Every public/service/Go/topology/monitor output stays free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

## Differentiators

- TypeScript service parity becomes a repeatable migration oracle for Go live DTOs.
- Route ownership is visible per route, not inferred from environment flags.
- Cutover evidence includes stopped-Go, bad body, timeout, schema/privacy failure, rollback, and no-fallback drills for every selected route family.
- Mutations are included only where Go can preserve immutable Strategy Revision semantics, session safety, and deterministic MatchSet creation without executing Strategy code.

## Deferred Features

- Go job claiming/completion and Match orchestration.
- Strategy execution, validation runtime replacement, production sandbox promotion, or counted non-JS play.
- Full public replay projection or owner-debug/private Chronicle assembly migration.
- Durable tournament operations, permanent ratings, custom arenas, or new product surfaces unrelated to backend ownership.
