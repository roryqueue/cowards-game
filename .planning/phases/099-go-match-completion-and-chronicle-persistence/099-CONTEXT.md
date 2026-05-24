# Phase 99: Go Match Completion and Chronicle Persistence - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 99 moves normal Match completion and Chronicle persistence to Go after a valid Phase 97 running lease and Phase 98 execution result. The phase must make completion atomic, idempotent only in safe recovery cases, compatible with existing replay reconstruction, and strict about Chronicle integrity and public/private projection safety.

This phase does not implement MatchSet scoring, final failure classification, public evidence route cutover, or topology promotion gates. Those remain Phase 100 through Phase 102 responsibilities.

</domain>

<decisions>
## Implementation Decisions

### Go Completion Ownership

- **D-01:** Go owns normal Match completion after a valid running lease and validated execution result.
- **D-02:** TypeScript `packages/persistence/src/complete-match.ts` remains parity oracle plus explicit rollback/test implementation only.
- **D-03:** TypeScript must not complete normal product Matches when Go completion ownership is selected.

### Atomic Persistence

- **D-04:** Completion must be one database transaction: validate lease, validate Chronicle, insert Chronicle, update `matches`, update `match_jobs`, and finish the current `match_job_attempts` row.
- **D-05:** The transaction must fail closed without completing the Match if Chronicle validation, storage, lease validation, or attempt completion fails.
- **D-06:** Go should preserve the current TypeScript contract that completion requires the job lease token and `running` job state unless safe idempotency applies.

### Idempotency And Conflicts

- **D-07:** Duplicate completion is idempotent only when the Match is already `complete` and a Chronicle row exists for that Match.
- **D-08:** Invalid lease plus no completed Chronicle must fail closed.
- **D-09:** Existing Chronicle reuse is allowed only when compatible with the requested Match completion. Hash/id drift, mismatched metadata, or storage conflict ambiguity must fail closed.

### Completion Field Parity

- **D-10:** Go derives Match completion fields from final state with TypeScript parity.
- **D-11:** Required derived fields include outcome, winner, surviving Soldier count, per-side surviving Soldier counts, survival turns, and per-side survival turns.
- **D-12:** Parity fixtures should compare Go output against `deriveMatchCompletionFields` behavior before replacing the normal completion path.

### Chronicle Validation

- **D-13:** Go validates Chronicle schema version, Match id, Strategy Revision ids, arena id, terminal outcome, event count, snapshot count, canonical metadata, and content hash before persistence.
- **D-14:** Go-completed Chronicles must remain readable by existing replay reconstruction and public projection code during migration.
- **D-15:** Invalid Chronicles, mismatched Match ids, hash drift, missing terminal outcomes, incompatible schema, and public/private projection leaks fail closed without completing the Match.

### Privacy And Public Safety

- **D-16:** Completion artifacts, service responses, topology evidence, and monitor output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals by default.
- **D-17:** Public replay compatibility evidence should use projected/public-safe replay surfaces, not raw Chronicle internals.

### the agent's Discretion

The agent may choose Go package boundaries, transaction helper shapes, validation helper names, and fixture formats, provided completion remains atomic, parity-tested, idempotent only in safe cases, and source/private-data safe by default.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — COMP-01 through COMP-08 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 99 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state and ownership warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Prior Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Lifecycle ownership labels, no-fallback defaults, rollback semantics, and manifest vocabulary.
- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` — Go job lifecycle, lease, retry, failure, and rollback decisions.
- `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md` — Execution result and system-failure envelope boundary.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine boundaries, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### TypeScript Parity Oracle

- `packages/persistence/src/complete-match.ts`: Current lease validation, idempotent duplicate completion, derived completion fields, Chronicle store write, Match/job/attempt updates.
- `packages/persistence/src/chronicle-store.ts`: Current Chronicle validation, metadata derivation, canonical content hash, insert-on-conflict behavior, and read-by-Match-id behavior.
- `packages/replay/src/validate.ts` and `packages/replay/src/hash.ts`: Chronicle validation and hash behavior that Go must match or consume through generated/parity fixtures.
- `packages/replay/src/project.ts`: Public/owner Chronicle projection behavior and privacy expectations.

### Replay Compatibility Surfaces

- `apps/web/app/matches/server.ts`: Current persisted Chronicle read path for replay pages and public replay metadata.
- `apps/web/app/matches/replay-ready.ts`: Replay reconstruction, public/owner projection, and board realism checks.
- `apps/web/app/matches/server.test.ts`: Existing tests for replay privacy, unavailable Chronicles, invalid Chronicles, URL decoding, and public metadata.

### Go Integration Points

- `apps/go-backend/live_backend.go`: Current Go backend creates Match jobs for exhibition MatchSets but does not complete Matches or persist Chronicles.
- `packages/persistence/migrations/0001_initial.sql`: Source schema for `matches`, `chronicles`, `match_jobs`, and `match_job_attempts`.

### Risks To Guard

- Completing a Match without a valid lease.
- Writing a Chronicle whose ids, hash, terminal outcome, or metadata do not match the final state.
- Treating incompatible storage conflicts as safe idempotency.
- Exposing raw/private Chronicle or runtime data in public evidence.

</code_context>

<specifics>
## Specific Ideas

The phase should make completion boring and inspectable. Prefer a narrow Go completion function with explicit validation, one transaction, and parity fixtures against TypeScript before wiring it into broader orchestration.

</specifics>

<deferred>
## Deferred Ideas

- MatchSet scoring and final failure classification — Phase 100.
- Public evidence route delivery and web route cutover — Phase 101.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.

</deferred>

---

*Phase: 99-Go Match Completion and Chronicle Persistence*
*Context gathered: 2026-05-24*
