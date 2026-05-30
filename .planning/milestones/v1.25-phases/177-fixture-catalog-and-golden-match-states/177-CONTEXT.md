# Phase 177: Fixture Catalog and Golden Match States - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Commit schema-valid fixture scenarios and replay goldens for app and contract testing. This phase should make fixtures authoritative enough for UI and contract tests without relying on live Match execution services.

</domain>

<decisions>
## Implementation Decisions

### Fixture Ownership
- **D-01:** Canonical fixture schemas/catalog should live with the app-facing contract in `packages/spec`.
- **D-02:** App-specific fixture adapter code belongs in `apps/web`.
- **D-03:** Go parity fixtures should live near backend tests only where needed for public output validation.
- **D-04:** Fixtures must use the approved lifecycle and DTO/evidence boundaries.

### Scenario Coverage
- **D-05:** Include complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay scenarios.
- **D-06:** Fixture metadata must identify public, owner/test-only, execution-internal, or intentionally unstable status.

### the agent's Discretion
Downstream agents may decide exact fixture file layout and manifest/checksum format, provided fixtures validate against the v1 app-facing DTO schemas and remain easy for app, Go, and monitor tests to consume.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Milestone Context
- `.planning/phases/v1.25-MILESTONE-DISCUSSION-CONTEXT.md` - approved lifecycle and DTO/evidence model.

### Planning
- `.planning/REQUIREMENTS.md` - FIX-01..FIX-07.
- `.planning/ROADMAP.md` - Phase 177 scope and success criteria.

### Code
- `packages/spec/src/service-fixtures.ts` - current service fixture examples.
- `packages/spec/src/service-contract.test.ts` - fixture/schema validation pattern.
- `apps/go-backend/testdata/service-fixtures/` - existing Go public fixture files.
- `apps/go-backend/main_test.go` - Go fixture route validation.
- `apps/web/app/matches/replay-fixture.ts` - replay fixture source.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - replay board realism constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Go fixture manifest and replay fixture checks provide a pattern for stable fixture catalogs.
- Replay board tests already enforce plausible visual rendering constraints.

### Established Patterns
- Public fixtures must be private-marker scanned.
- Replay fixtures must have in-bounds visible Soldiers and terrain.

### Integration Points
- Fixtures feed schema tests, app rendering tests, Go parity tests, drift monitors, and the Phase 180 adapter.

</code_context>

<specifics>
## Specific Ideas

Fixture catalog should be small, explicit, and golden enough to serve as the contract between parallel execution and app work.

</specifics>

<deferred>
## Deferred Ideas

Adapter selection and browser proof belong to phases 180 and 181.

</deferred>

---

*Phase: 177-Fixture Catalog and Golden Match States*
*Context gathered: 2026-05-30*
