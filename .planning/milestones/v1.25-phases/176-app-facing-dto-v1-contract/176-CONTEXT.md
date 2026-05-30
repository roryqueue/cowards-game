# Phase 176: App-Facing DTO v1 Contract - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish versioned app-facing DTO schemas for MatchSet summary/result, Match result, replay metadata, replay evidence, runtime evidence, failure evidence, lifecycle, and public/private splits. This phase freezes shapes; it does not promote runtimes or change the execution ABI.

</domain>

<decisions>
## Implementation Decisions

### DTO Layers
- **D-01:** Use three layers: public app DTOs, owner/test-only DTOs, and execution-internal envelopes.
- **D-02:** Public app DTOs are the default contract consumed by result/replay pages and public routes.
- **D-03:** Owner/test-only DTOs must be explicitly gated and excluded from default public surfaces.
- **D-04:** Runtime-service and Go orchestration internals must be translated before app exposure.

### DTO Family
- **D-05:** Define app-facing v1 DTOs for Lifecycle, MatchSet summary, Match result, Replay metadata, Replay evidence, Runtime evidence, and Failure evidence.
- **D-06:** Public DTOs may expose ids, Strategy Revision display/runtime labels, lifecycle state, public failure category, public message/copy key, retry disposition, replay availability, trustworthy scoring/result summary, redacted runtime labels, and public Chronicle/replay projection.
- **D-07:** Public DTOs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, stack traces, host paths, env values, tokens, DB details, package paths, private runtime internals, or raw runtime-service envelopes.
- **D-08:** Unknown, stale, malformed, or unversioned DTO payloads fail closed.

### the agent's Discretion
Downstream agents may decide whether the implementation uses Zod, JSON Schema artifacts, generated Go validation helpers, or committed schema fixtures, as long as existing repo patterns are respected.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved DTO/evidence model.

### Planning
- `AGENTS.md` - public-output and hostile-code boundaries.
- `.planning/REQUIREMENTS.md` - DTO-01..DTO-07.
- `.planning/ROADMAP.md` - Phase 176 scope and success criteria.

### Code
- `packages/spec/src/service.ts` - current public service DTOs.
- `packages/spec/src/schemas.ts` - schema validation utilities.
- `packages/spec/src/service-fixtures.ts` - existing fixture examples.
- `packages/spec/src/service-contract.test.ts` - contract validation tests.
- `apps/go-backend/main_test.go` - Go public fixture shape and private marker tests.
- `apps/web/lib/public-service-boundary.ts` - app boundary validation.
- `apps/web/app/matches/types.ts` - current replay page data shapes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec` is already the natural home for shared DTO and schema contracts.
- Go tests already reject public fixture payloads with private markers.

### Established Patterns
- Public schemas should expose categories and stable copy/evidence fields rather than raw diagnostics.
- Unknown or malformed public payloads should fail closed rather than be parsed optimistically.

### Integration Points
- DTO schemas must become the shared source for fixtures, Go public output validation, app adapters, and Playwright fixture tests.

</code_context>

<specifics>
## Specific Ideas

Prefer a versioned namespace that can coexist with current `service-api-v1.8` rather than renaming existing service contracts prematurely.

</specifics>

<deferred>
## Deferred Ideas

Fixture catalog scenarios belong to Phase 177. UI migration to the DTOs belongs to Phase 179.

</deferred>

---

*Phase: 176-App-Facing DTO v1 Contract*
*Context gathered: 2026-05-30*
