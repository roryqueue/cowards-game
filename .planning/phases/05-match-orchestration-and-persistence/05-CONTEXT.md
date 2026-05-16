# Phase 5: Match Orchestration and Persistence - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers the durable orchestration layer for creating, executing, persisting, and scoring Matches and MatchSets from immutable Strategy Revisions. It should connect the existing runtime, engine, replay, and local PostgreSQL/Redis infrastructure into a reproducible backend workflow with clear failure semantics and deterministic MatchSet scoring.

</domain>

<decisions>
## Implementation Decisions

### Match Creation Contract
- **D-01:** Build an internal service API for Match and MatchSet creation first. Seed scripts and dev tools should call this same API. Do not prioritize a user-facing HTTP route unless planning finds it necessary for local tooling.
- **D-02:** Core creation should be StrategyRevision-ID based. Dev/seed shortcuts may create revisions from inline source first, then call the same ID-based service.
- **D-03:** Single Match creation requires the caller to provide seed and side assignment explicitly.
- **D-04:** MatchSets store an explicit concrete matrix as their canonical persisted shape. Built-in seed/dev helpers may generate that matrix from presets.

### Revision Locking And Reveal Policy
- **D-05:** A Match is fully locked at creation: Strategy Revision IDs, seed, Arena Variant, and side assignment are fixed before execution.
- **D-06:** Initiative remains engine-derived from the locked seed and is recorded through Match result and Chronicle data; it is not supplied separately at creation.
- **D-07:** MatchSet preset generation freezes the full concrete matrix immediately at MatchSet creation.
- **D-08:** Core reproducibility content is immutable once referenced by a locked Match or MatchSet. Metadata, status, and admin notes may change. Future user-facing deletion should be archive/disable rather than destructive delete.

### Job Failure Semantics
- **D-09:** Strategy runtime violations are gameplay events. The worker job succeeds if the engine finishes and Match result plus Chronicle persistence succeed.
- **D-10:** Unexpected non-strategy exceptions outside the strategy runtime enter retry policy. After retry exhaustion, they become permanent system failures, not strategy losses.
- **D-11:** Use a fixed small retry policy, likely 3 attempts, and record attempt history.
- **D-12:** Exhausted system failures produce an explicit `FAILED_SYSTEM` Match status.
- **D-13:** MatchSets continue executing remaining Matches when one Match reaches `FAILED_SYSTEM`, but final MatchSet scoring is degraded or incomplete when any constituent Match has a system failure.
- **D-14:** Store per-attempt job/run records with attempt number, timestamps, worker id, error class/message, retryable flag, and dev/private stack details where appropriate.
- **D-15:** Worker claiming uses lease/heartbeat with reclaim so abandoned jobs can be retried.
- **D-16:** Use both service-level idempotency checks and database uniqueness constraints to prevent duplicate Match completion and Chronicle persistence.
- **D-17:** A Match job is not successful unless both Match result and Chronicle are durable. If Chronicle persistence fails after deterministic simulation, keep the job retryable/in-progress and rerun the deterministic simulation as needed.

### Chronicle Storage Shape
- **D-18:** Chronicle persistence should use a storage adapter. Phase 5's first implementation stores the full Chronicle JSON in PostgreSQL JSONB.
- **D-19:** Store replay/query metadata alongside the full Chronicle: hash, schema/version, outcome, event/snapshot counts, player IDs, StrategyRevision IDs, Arena Variant ID, and Match linkage.
- **D-20:** Store the unified logical Chronicle artifact, including private sections. Projection utilities control access. A future physical public/private split can happen behind the adapter.
- **D-21:** Chronicle integrity or validation failure is a system failure. The job retries and the Match does not complete without a valid Chronicle.

### MatchSet Scoring And Fixtures
- **D-22:** V1 MatchSet scoring includes Match wins plus deterministic tie-breakers: surviving soldiers and survival time/turn count.
- **D-23:** Define tiered standard presets: a small smoke fixture, a standard evaluation fixture, and a larger stress fixture.
- **D-24:** Fixture presets use curated arena lists, scaling from smoke to standard to stress.
- **D-25:** Side balance is configurable by preset. Built-in evaluation presets may mirror sides; custom MatchSets remain explicit.
- **D-26:** Presets use fixed, named, versioned seed lists for reproducible comparisons across revisions.

### Agent's Discretion
Planning may choose the database access library, migration tool, queue implementation, and exact module boundaries, provided the result fits the existing TypeScript monorepo, local Postgres/Redis setup, and deterministic orchestration decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements And Roadmap
- `.planning/PROJECT.md` - project vision, source spec references, and high-level architecture direction.
- `.planning/REQUIREMENTS.md` - canonical requirement IDs, especially MATCH-01 through MATCH-07, DATA-01 through DATA-05, and TEST-05.
- `.planning/ROADMAP.md` - Phase 5 goal, success criteria, dependencies, and notes.
- `.planning/STATE.md` - current workflow state and completed phase history.

### Source Specifications
- `./CowardsGameSpec_Full_Consolidated_v1.md` - full consolidated game specification.
- `./CowardsGame_Technical_Architecture_Spec_V1.md` - original technical architecture specification.

### Upstream Phase Context
- `.planning/phases/04-strategy-runtime-sandbox/04-CONTEXT.md` - Strategy Revision/runtime sandbox boundaries and failure model.
- `.planning/phases/03-chronicle-and-replay-core/03-CONTEXT.md` - Chronicle/replay contracts and public/private projection model.
- `.planning/phases/02-pure-rules-engine/02-CONTEXT.md` - pure engine boundaries and deterministic game rule semantics.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec` defines branded IDs and shared contracts including `StrategyId`, `StrategyRevisionId`, `MatchId`, `MatchSetId`, `ArenaVariantId`, runtime types, and Strategy Revision structures.
- `packages/runtime-js` builds immutable in-memory Strategy Revisions and exposes executable runtime entrypoints for strategy execution.
- `packages/engine` exposes `runMatch(input: RunMatchInput): TransitionResult`, derives initiative from the seed, and owns deterministic gameplay execution through the StrategyRuntime boundary.
- `packages/replay` builds, validates, hashes, projects, and reconstructs Chronicles from Match results.
- `packages/map-configs` exists but is currently skeletal; Phase 5 may need to firm up Arena Variant seed data or fixtures.
- `apps/worker` exists as the natural home for job claiming and execution but currently only logs readiness and imports the runtime JS worker entrypoint.
- `compose.yaml` and `.env.example` already provide local PostgreSQL and Redis configuration.

### Established Patterns
- Keep domain contracts in shared packages rather than duplicating ad hoc types in apps.
- Treat the engine as pure and deterministic. Persistence, queues, retries, and leases belong outside the engine.
- Treat runtime violations as strategy/gameplay output, not infrastructure failure.
- Keep full private Chronicle data available internally and use projection utilities for public replay surfaces.

### Integration Points
- Match creation service should bridge persisted Strategy Revisions, Arena Variants, explicit seeds, side assignments, and queueable Match jobs.
- Worker execution should claim leased jobs, load locked inputs, execute runtime plus engine, build and validate the Chronicle, persist result and Chronicle atomically/idempotently, and record attempts.
- MatchSet creation should freeze a concrete matrix from explicit caller input or versioned presets, then enqueue or create the constituent Matches.
- MatchSet scoring should aggregate completed constituent Matches and report degraded/incomplete scoring when any Match is `FAILED_SYSTEM`.

</code_context>

<specifics>
## Specific Ideas

- Built-in MatchSet presets should include smoke, standard evaluation, and stress tiers.
- Presets should have fixed, versioned seed lists so evaluation results can be compared across Strategy Revisions over time.
- Evaluation presets should be able to mirror side assignments, but the persisted matrix remains explicit and immutable.
- Chronicle storage should start in PostgreSQL JSONB through an adapter so blob/object storage can be introduced later without rewriting orchestration code.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Match Orchestration and Persistence*
*Context gathered: 2026-05-16*
