---
phase: 5
slug: match-orchestration-and-persistence
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-17
---

# Phase 5: Match Orchestration and Persistence - Validation Strategy

## Validation Architecture

Phase 5 changes durable behavior, so validation must prove more than TypeScript compilation. The phase should include focused tests around schema repeatability, service contracts, worker failure semantics, and deterministic MatchSet scoring.

## Required Test Areas

### Persistence And Migrations

- Migration runner applies all SQL files in lexical order.
- Re-running migrations is safe after the schema is current.
- Schema includes tables for users, strategies, strategy revisions, arena variants, matches, match sets, match set membership, chronicles, jobs, and attempts.
- Local seed script can populate dev users, strategies, revisions, arenas, MatchSets, Matches, and at least one completed Chronicle.

### Creation Services

- Creating a Match requires two StrategyRevision IDs, an ArenaVariant ID, seed, and explicit side assignment.
- Creating a MatchSet from a preset persists a concrete immutable matrix.
- StrategyRevision reproducibility fields cannot be mutated after referenced by a Match or MatchSet.
- Match and MatchSet status values cover pending/running/complete/failed/blocked semantics.

### Chronicle Persistence

- Chronicle storage adapter stores a unified full Chronicle artifact in PostgreSQL JSONB.
- Metadata includes hash, schema version, outcome, event count, snapshot count, player IDs, StrategyRevision IDs, ArenaVariant ID, and Match linkage.
- Invalid Chronicle validation causes retryable system failure rather than Match completion.
- Database uniqueness prevents two Chronicles for one Match.

### Worker Semantics

- Worker claims jobs with a lease/heartbeat model and can reclaim expired leases.
- Strategy runtime violations are persisted as gameplay events and do not count as system failures.
- Unexpected non-strategy exceptions create attempt records and retry up to the fixed limit.
- Retry exhaustion marks Match `FAILED_SYSTEM`.
- Duplicate completion attempts do not create duplicate outcomes or Chronicle records.

### MatchSet Scoring

- Scoring orders by Match wins, cumulative surviving Soldiers, then cumulative survival time/turn count.
- Scoring is deterministic for equal inputs.
- Any constituent `FAILED_SYSTEM` Match marks the MatchSet scoring degraded/incomplete while allowing other Matches to complete.

## Minimum Verification Commands

```bash
pnpm --filter @cowards/persistence test
pnpm --filter @cowards/worker test
pnpm verify
```

If integration tests require PostgreSQL, they should either:

- start from `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards`, or
- skip with an explicit message when `DATABASE_URL` is absent.
