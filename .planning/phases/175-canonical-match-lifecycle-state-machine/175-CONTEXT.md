# Phase 175: Canonical Match Lifecycle State Machine - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Define and test canonical Match and MatchSet lifecycle semantics. This phase should produce the state machine vocabulary and contract tests, not broad UI rewrites or fixture catalog implementation.

</domain>

<decisions>
## Implementation Decisions

### Lifecycle Vocabulary
- **D-01:** Use app-facing states `queued`, `accepted`, `running`, `complete`, `failed`, `degraded`, and `unavailable`.
- **D-02:** Model retryability as `retryDisposition`, not as top-level states.
- **D-03:** Include `terminal`, `resultAvailability`, and `replayAvailability` in lifecycle evidence.
- **D-04:** Distinguish strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, blocked, missing Chronicle, and no-result states through failure categories.

### MatchSet Composition
- **D-05:** MatchSet `complete` requires required Matches to be complete and scoring resolved.
- **D-06:** MatchSet `degraded` is terminal partial public evidence, not a counted clean outcome by default.
- **D-07:** MatchSet `unavailable` means execution/runtime availability prevents evaluation; it must not be used for game losses or Strategy failures.

### the agent's Discretion
Downstream agents may decide exact schema/test factoring, but must preserve the lifecycle semantics approved in `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle model.

### Planning
- `AGENTS.md` - canonical terminology and boundaries.
- `.planning/REQUIREMENTS.md` - LIFE-01..LIFE-06.
- `.planning/ROADMAP.md` - Phase 175 scope and success criteria.

### Code
- `packages/spec/src/service.ts` - current lifecycle fields and public DTO vocabulary.
- `packages/spec/src/service-contract.test.ts` - contract test patterns.
- `apps/go-backend/orchestrator.go` - current Match orchestration lifecycle behavior.
- `apps/go-backend/live_backend.go` - public backend projection.
- `apps/web/app/matchsets/evidence-copy.ts` - app copy currently interpreting lifecycle/evidence.
- `scripts/check-boundary-monitors.ts` - drift monitor to extend for lifecycle vocabulary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing service schemas and fixtures already include lifecycle-like status fields.
- Existing Go tests assert public route shapes and private marker rejection.

### Established Patterns
- System/runtime failures are evidence categories; they are not game outcomes.
- Public result copy should consume normalized lifecycle semantics instead of raw runtime terms.

### Integration Points
- Lifecycle definitions should become the shared input for DTO schemas, fixtures, app copy, and drift monitors.

</code_context>

<specifics>
## Specific Ideas

Represent retryability with `retryDisposition: retryable | non_retryable | not_applicable`. Keep `degraded` terminal and partial. Ensure malformed runtime result, stale artifact, and missing Chronicle fail closed.

</specifics>

<deferred>
## Deferred Ideas

Full DTO schema implementation belongs to Phase 176. Full fixture catalog belongs to Phase 177. UI copy hardening belongs to Phase 179.

</deferred>

---

*Phase: 175-Canonical Match Lifecycle State Machine*
*Context gathered: 2026-05-30*
