# Research Summary

**Project:** Coward's Game  
**Date:** 2026-05-19  
**Milestone context:** v1.3 Competition Trust Beta

## Key Findings

**Stack:** Keep the existing TypeScript monorepo, Next.js app, PostgreSQL persistence, worker execution, Chronicle validation, and Playwright/Vitest verification spine. v1.3 should extend the v1.2 competition contracts rather than introduce a parallel ladder subsystem.

**Competition:** Resettable trial ladder seasons are the right step before durable ratings. Use season-scoped standings, one active Strategy Revision per user per season, immutable entry snapshots, deterministic pod/round-robin MatchSet generation, and counted/non-counted result policy.

**Starter Strategies:** The Starter Strategy Library should be a first-class Workshop feature with about 10 forkable, validated, readable, genuinely playable doctrines. These should be system-owned templates that users intentionally fork into account-owned Strategies.

**Profiles:** Public player and Strategy pages can increase pride and learning, but must publish only safe metadata: handle, display name, Strategy name/description/tags, lineage metadata, source hash, runtime compatibility, records, standings, and replay/result links. Source and private runtime/debug data stay owner-only.

**Governance:** Trial ladder standings need result governance before they become a trust promise. Add flag/dispute notes, admin-only result inspection, invalid/non-competitive MatchSet marking, public counted status, and immutable audit logs.

**Runtime:** The existing worker-thread adapter should remain a local/dev fallback, not the production hostile-code boundary. The v1.3 spike should choose between hardened subprocess and containerized subprocess behind the existing `StrategyExecutionAdapter`; WASM/WASI is promising only if future Strategy language/runtime direction changes. Node `node:wasi` is not suitable for untrusted Strategy code.

## Prescriptive Direction

1. Build the Starter Strategy Library first so new players can learn and fork credible doctrines before entering competition.
2. Add season and eligibility contracts before scheduler UX: one active ladder entry per user, immutable snapshots, next-season-only replacement by default, and explicit stale behavior.
3. Generate ladder MatchSets as small deterministic round-robin pods using existing MatchSet/scoring infrastructure.
4. Build standings as a projection of counted MatchSets and replay/provenance evidence, not as opaque mutable totals.
5. Add public player/Strategy pages with strict public DTO privacy assertions.
6. Add dispute/moderation/invalidation with audit logs before calling standings trustworthy.
7. Complete a production runtime boundary spike and hostile Strategy regression matrix before v1.3 ships.

## Requirements Implications

Recommended v1.3 requirement categories:

- Starter Strategy Library
- Trial Ladder Seasons
- Ladder Eligibility and Entry
- Automated Scheduling and Standings
- Public Profiles and Strategy Cards
- Dispute and Moderation
- Runtime Boundary Spike

## Roadmap Implications

Recommended phase continuation after v1.2 Phase 18:

1. **Phase 19: Starter Strategy Library**
   Seed 10 forkable, validated, doctrine-tagged starter Strategies and Workshop fork flow.
2. **Phase 20: Trial Ladder Season Model**
   Add season, entry, eligibility, snapshot, stale revision, replacement, and public season contracts.
3. **Phase 21: Ladder Scheduling and Standings**
   Add queue/scheduler, deterministic pods, counted MatchSets, standings projection, and degraded/invalid exclusion.
4. **Phase 22: Public Profiles and Strategy Cards**
   Add public player handle pages and public Strategy cards with lineage/history/result links and privacy-safe DTOs.
5. **Phase 23: Disputes and Competition Governance**
   Add result flagging, admin review, invalid/non-competitive marking, public counted status, and audit logs.
6. **Phase 24: Production Runtime Boundary Spike**
   Choose and prototype hardened subprocess/container/WASM path behind the adapter, keep worker fallback, and expand hostile regression coverage.

## Watch Out For

- Accidentally naming or storing trial standings as permanent ratings.
- Letting ladder strictness break exhibition self-play.
- Allowing Strategy replacement after scheduling without explicit policy.
- Counting degraded/system-failed MatchSets in standings.
- Mutating standings without auditable invalidation events.
- Leaking Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, or private runtime internals on public pages.
- Shipping starter Strategies that are readable but strategically useless.
- Treating Node worker threads or Node WASI as the production sandbox.
- Adding account lifecycle, organizations, tournaments, prizes, or durable rating math before the trust beta has abuse data.

## Sources

- User v1.3 milestone brief.
- `.planning/PROJECT.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-ROADMAP.md`
- `packages/spec/src/competition.ts`
- `packages/persistence/migrations/0003_competitive_alpha.sql`
- `packages/persistence/src/competition.ts`
- `packages/persistence/src/scoring.ts`
- `packages/persistence/src/workshop.ts`
- `packages/runtime-js/src/adapter.ts`
- `packages/runtime-js/src/subprocess-adapter.ts`
- Node child process docs: https://nodejs.org/api/child_process.html
- Node worker threads docs: https://nodejs.org/api/worker_threads.html
- Node WASI docs: https://nodejs.org/api/wasi.html
- Docker resource constraints docs: https://docs.docker.com/engine/containers/resource_constraints/
- Wasmtime interruption docs: https://docs.wasmtime.dev/examples-interrupting-wasm.html
- Wasmtime resource limiter docs: https://docs.wasmtime.dev/api/src/wasmtime/runtime/limits.rs.html
