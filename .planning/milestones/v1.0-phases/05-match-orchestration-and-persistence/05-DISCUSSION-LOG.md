# Phase 5: Match Orchestration and Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 5-Match Orchestration and Persistence
**Areas discussed:** Match Creation Contract, Revision Locking And Reveal Policy, Job Failure Semantics, Chronicle Storage Shape, MatchSet Scoring And Fixtures

---

## Match Creation Contract

| Question | Option | Selected |
|----------|--------|----------|
| Which creation surface should planners target first? | Seed scripts first | |
| Which creation surface should planners target first? | Internal service API | yes |
| Which creation surface should planners target first? | Thin HTTP/API route | |
| What should the internal creation service accept as its primary input? | Revision IDs only | |
| What should the internal creation service accept as its primary input? | Revision IDs plus dev source shortcuts | yes |
| What should the internal creation service accept as its primary input? | Raw source allowed everywhere | |
| When creating a single Match, should the caller choose both side assignment and seed, or should the system derive them? | Caller supplies both | yes |
| When creating a single Match, should the caller choose both side assignment and seed, or should the system derive them? | Caller supplies seed, system derives sides | |
| When creating a single Match, should the caller choose both side assignment and seed, or should the system derive them? | System derives both | |
| For MatchSet creation, what should be the v1 shape? | Explicit matrix | |
| For MatchSet creation, what should be the v1 shape? | Preset generator | |
| For MatchSet creation, what should be the v1 shape? | Both | yes |

**User's choices:** Internal service API; Revision IDs plus dev source shortcuts; caller supplies seed and side assignment; explicit matrix as canonical stored shape with preset helpers.

**Notes:** The internal service API is the durable contract. Seed scripts should use the same path as production orchestration rather than becoming separate one-off logic.

---

## Revision Locking And Reveal Policy

| Question | Option | Selected |
|----------|--------|----------|
| What should be locked at Match creation time? | Strategy Revision IDs only | |
| What should be locked at Match creation time? | Revision IDs + seed + arena + sides | yes |
| What should be locked at Match creation time? | Revision IDs + arena/sides, seed later | |
| What about initiative? | Derived during engine initialization from seed | yes |
| What about initiative? | Explicitly locked at Match creation | |
| What about initiative? | Derived before job enqueue and stored on Match | |
| When a MatchSet is created from a preset generator, should the generated concrete matrix be immutable immediately? | Yes, freeze generated matrix at MatchSet creation | yes |
| When a MatchSet is created from a preset generator, should the generated concrete matrix be immutable immediately? | Freeze only when jobs enqueue | |
| When a MatchSet is created from a preset generator, should the generated concrete matrix be immutable immediately? | Regenerate on demand | |
| Should the system prevent deleting or mutating records referenced by locked Matches/MatchSets? | Hard immutability | |
| Should the system prevent deleting or mutating records referenced by locked Matches/MatchSets? | Soft archive | |
| Should the system prevent deleting or mutating records referenced by locked Matches/MatchSets? | Mutable metadata only | yes |

**User's choices:** Lock Revision IDs, seed, arena, and sides at creation; keep initiative engine-derived from seed; freeze preset-generated matrices at MatchSet creation; permit metadata mutation but keep core reproducibility content immutable.

**Notes:** Future user-facing deletion should become archive/disable semantics rather than destructive deletion of reproducibility-critical records.

---

## Job Failure Semantics

| Question | Option | Selected |
|----------|--------|----------|
| When a strategy produces a runtime violation during execution, what should the worker do? | Complete the Match normally | yes |
| When a strategy produces a runtime violation during execution, what should the worker do? | Mark Match as strategy-failed | |
| When a strategy produces a runtime violation during execution, what should the worker do? | Stop the Match immediately | |
| What counts as a system failure that should retry? | Infrastructure/transient only | |
| What counts as a system failure that should retry? | Any unexpected exception outside strategy runtime | yes |
| What counts as a system failure that should retry? | Everything that prevents Match completion | |
| How many retries should Phase 5 use for system failures? | No retries | |
| How many retries should Phase 5 use for system failures? | Fixed small retry count | yes |
| How many retries should Phase 5 use for system failures? | Configurable retry policy | |
| What final status should a Match get after retries are exhausted? | FAILED_SYSTEM | yes |
| What final status should a Match get after retries are exhausted? | FAILED with failure category field | |
| What final status should a Match get after retries are exhausted? | BLOCKED | |
| Should a MatchSet continue if one Match fails with FAILED_SYSTEM? | Continue remaining Matches, mark MatchSet degraded | yes |
| Should a MatchSet continue if one Match fails with FAILED_SYSTEM? | Stop the whole MatchSet immediately | |
| Should a MatchSet continue if one Match fails with FAILED_SYSTEM? | Retry/repair failed Match later before scoring | |
| Should failed attempts store enough detail to diagnose system failures? | Attempt log table/records | yes |
| Should failed attempts store enough detail to diagnose system failures? | Only latest failure on Match | |
| Should failed attempts store enough detail to diagnose system failures? | Structured events only | |
| How should worker job claiming behave if a worker dies mid-Match? | Lease/heartbeat with reclaim | yes |
| How should worker job claiming behave if a worker dies mid-Match? | Simple status lock only | |
| How should worker job claiming behave if a worker dies mid-Match? | No reclaim in Phase 5 | |
| Should a worker detect duplicate execution of the same Match? | Idempotent completion guard | |
| Should a worker detect duplicate execution of the same Match? | Database uniqueness only | |
| Should a worker detect duplicate execution of the same Match? | Both | yes |
| What should happen if Chronicle persistence fails after the engine already simulated the Match? | Retry entire job | |
| What should happen if Chronicle persistence fails after the engine already simulated the Match? | Persist Match result first, then Chronicle later | |
| What should happen if Chronicle persistence fails after the engine already simulated the Match? | Keep in-progress until Chronicle persists | yes |

**User's choices:** Strategy runtime violations are normal gameplay events; unexpected non-strategy exceptions retry; use a fixed small retry count; exhausted retries become `FAILED_SYSTEM`; MatchSets continue but become degraded; store attempt logs; use lease/heartbeat reclaim; use idempotency plus database uniqueness; require durable Chronicle persistence before job success.

**Notes:** The user explicitly wanted extra edge-case coverage here. The Chronicle-persistence-after-simulation case should rerun deterministic simulation rather than marking the Match complete without a Chronicle.

---

## Chronicle Storage Shape

| Question | Option | Selected |
|----------|--------|----------|
| Where should full Chronicle content live in Phase 5? | PostgreSQL JSONB | |
| Where should full Chronicle content live in Phase 5? | Filesystem/blob reference | |
| Where should full Chronicle content live in Phase 5? | Storage adapter with Postgres JSONB implementation | yes |
| What should the database store separately from the full Chronicle blob? | Minimal metadata | |
| What should the database store separately from the full Chronicle blob? | Replay/query metadata | yes |
| What should the database store separately from the full Chronicle blob? | Denormalized timeline summaries | |
| Should private Chronicle sections live in the same stored artifact as public data? | Unified artifact | yes |
| Should private Chronicle sections live in the same stored artifact as public data? | Split public/private columns or records | |
| Should private Chronicle sections live in the same stored artifact as public data? | Store public only | |
| What should happen if Chronicle integrity validation fails after simulation? | Treat as system failure and retry | yes |
| What should happen if Chronicle integrity validation fails after simulation? | Persist Match result but mark Chronicle invalid | |
| What should happen if Chronicle integrity validation fails after simulation? | Persist invalid artifact for debugging only | |

**User's choices:** Use a storage adapter with PostgreSQL JSONB implementation; store replay/query metadata; keep a unified logical Chronicle artifact including private sections; retry on Chronicle validation failure.

**Notes:** Projection utilities, not storage splitting, control public/private access in Phase 5.

---

## MatchSet Scoring And Fixtures

| Question | Option | Selected |
|----------|--------|----------|
| What should the v1 MatchSet scoring output include? | Match wins only | |
| What should the v1 MatchSet scoring output include? | Match wins plus surviving soldiers and survival time/turn count tie-breakers | yes |
| What should the v1 MatchSet scoring output include? | Full per-arena leaderboard stats | |
| How should Phase 5 define standard MatchSet fixtures? | Small canonical fixture only | |
| How should Phase 5 define standard MatchSet fixtures? | Tiered presets | yes |
| How should Phase 5 define standard MatchSet fixtures? | Custom only | |
| How should fixture presets choose arenas? | Single default arena variant | |
| How should fixture presets choose arenas? | Curated arena list per preset | yes |
| How should fixture presets choose arenas? | Caller-supplied arenas only | |
| How should MatchSet presets handle side balance? | Both sides for every pairing | |
| How should MatchSet presets handle side balance? | Seeded side assignment only | |
| How should MatchSet presets handle side balance? | Configurable | yes |
| How should presets choose seeds and repetitions? | Fixed seed list per preset | yes |
| How should presets choose seeds and repetitions? | Seed base plus generated sequence | |
| How should presets choose seeds and repetitions? | Caller supplies all seeds | |

**User's choices:** Score wins plus surviving-soldier and survival-time/turn-count tie-breakers; define smoke/standard/stress presets; use curated arenas per preset; make side balance configurable; use fixed, versioned seed lists.

**Notes:** Fixed seed lists are intended to keep comparisons reproducible across Strategy Revisions.

## Agent's Discretion

- Planning may choose specific persistence, migration, queue, and module-boundary implementation details consistent with the current monorepo and the decisions captured in context.

## Deferred Ideas

None.
