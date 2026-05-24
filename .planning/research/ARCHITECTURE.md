# Architecture Research: v1.15 Go Backend Ownership Completion

**Project:** Coward's Game
**Milestone:** v1.15 Go Backend Ownership Completion
**Researched:** 2026-05-24

## Proposed Ownership Flow

`Web frontend -> Go backend -> TypeScript runtime execution service -> Go persistence -> Go public evidence`

Go should own normal backend lifecycle and persistence-facing behavior. TypeScript should remain:

- frontend implementation,
- service/parity oracle where needed,
- isolated JS/TS Strategy runtime worker/service behind `strategy-runtime-abi-v1.14`.

The key architectural move is to prevent the TypeScript worker from owning normal DB claim/completion writes while still letting the TypeScript runtime execute hostile Strategy code outside Go and web/API.

## Integration Contracts

- **Route ownership manifest v1.15:** add lifecycle surfaces for job claim/lease, Match completion, Chronicle persistence, MatchSet scoring completion, runtime execution handoff, public evidence, rollback, and no-fallback behavior.
- **Internal execution contract:** versioned Go-to-TypeScript request/response envelope. Request includes Match id, seed, arena, bottom/top player ids, source/hash/bytes/runtime metadata, and runtime adapter selection. Response includes Chronicle, final-state completion fields, runtime/system failure taxonomy, and redacted diagnostics.
- **Go persistence contracts:** port or mirror `claimNextMatchJob`, `recordAttemptFailure`, `completeMatch`, `deriveMatchCompletionFields`, `createChronicleMetadata`, `scoreMatchSet`, and `refreshMatchSetStatus` with TypeScript parity fixtures.
- **Public evidence contract:** Go public outputs must use spec-owned schemas and public privacy checks. Raw Chronicle/private projection output must not be exposed by default.

## Build Order

1. Baseline v1.15 ownership and freeze non-goals.
2. Implement Go job lifecycle primitives with TypeScript parity tests.
3. Build the TypeScript stateless execution service while preserving the v1.14 runtime ABI.
4. Wire Go orchestration to claim jobs, call execution, persist Chronicles, and complete Matches transactionally.
5. Port MatchSet scoring/status completion to Go.
6. Cut public evidence/replay-facing web paths to Go-owned contracts where practical.
7. Add topology, monitor, privacy, board realism, stopped-service, no-fallback, and rollback evidence.

## Rollback And No-Fallback Shape

- Use explicit owner switches such as `COWARDS_MATCH_ORCHESTRATOR_OWNER=go|typescript`.
- Do not run Go and TypeScript DB-claiming workers against the same normal queue.
- When Go is selected, TypeScript DB persistence fallback is an error, not a hidden rescue path.
- Runtime service outage is recorded by Go as retryable system failure or failed system after exhaustion.
- Runtime violations remain gameplay results in valid Chronicles, not system failures.
- Rollback should stop the Go orchestrator, switch ownership back to TypeScript, and start the legacy TS worker deliberately.

## Likely Phase Boundaries

1. Boundary baseline and contracts.
2. Go job lifecycle primitives.
3. TypeScript stateless execution service.
4. Go Match orchestration and Chronicle persistence.
5. Go MatchSet scoring completion.
6. Go public evidence delivery and web cutover.
7. Promotion, topology, monitors, no-fallback, and rollback gate.
