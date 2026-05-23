# Phase 78: Conditional Public Strategy Go Read Path - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 78 attempts the selected `getPublicStrategyPage` route behavior after the switch contract exists. It must keep the TypeScript default path unchanged, require real or production-equivalent Go data before any promotion claim, and produce either a valid disabled/no-go path or a candidate Go-owned path ready for later privacy, parity, and rollback gates. It must not promote fixture-backed Go traffic, add other Go routes, expose route-owner debug on the public page, or move source/private/runtime/write behavior.

</domain>

<decisions>
## Implementation Decisions

### Live Data Threshold
- **D-01:** Promotion requires a real or production-equivalent Go read source, not fixtures.
- **D-02:** Acceptable promotion evidence is either a narrow read-only DB-backed Go provider for `getPublicStrategyPage` or a documented `promote-none-yet` outcome if that provider is not feasible.
- **D-03:** Controlled local DB evidence can count as production-equivalent only if it reads the same persistent data shape the TypeScript service reads and validates against canonical DTO parity.
- **D-04:** Shadow-only evidence is useful but not enough to claim production promotion.

### No-Go Branch Behavior
- **D-05:** If live data is not feasible, Phase 78 should still produce the disabled switch path plus a blocker artifact, but not a fake promotion.
- **D-06:** TypeScript default behavior remains implemented and active.
- **D-07:** Go production ownership remains disabled when criteria fail.
- **D-08:** The blocker artifact must record why live Go data was not promoted and list the exact missing evidence.
- **D-09:** Any shadow or fixture checks must be clearly labeled evidence-only.
- **D-10:** Production web traffic must not route to fixture-backed Go.

### Parity Cases
- **D-11:** Require the full parity case set before any route promotion can be considered.
- **D-12:** Required cases include success for an existing public Strategy, missing Strategy id, malformed or undecodable id, storage unavailable or upstream unavailable, canonical `canonicalHref`, exact public DTO schema parse, source-free privacy guard, public error shape and status, stable ordering for arrays such as tags/result links/replay links, runtime metadata compatibility fields, and no extra fields beyond the canonical DTO.
- **D-13:** Planner may choose exact fixture/live samples and test mechanics, but may not reduce the required parity set.

### Page Behavior Surface
- **D-14:** Visible Strategy page behavior remains exactly unchanged in TypeScript-owned/default mode.
- **D-15:** In Go-selected mode, successful Go responses render the same page.
- **D-16:** In Go-selected mode, not found renders the same `Strategy not found` behavior.
- **D-17:** Go unavailable, timeout, schema failure, privacy failure, and divergence use a generic public-safe unavailable behavior if one exists, or fail as a sanitized server error without private detail.
- **D-18:** Do not show route owner/debug banners or "served by Go" indicators on the public Strategy page.
- **D-19:** Operational status belongs in evidence/operator diagnostics, not in the user-facing Strategy page.

### the agent's Discretion
Planner may decide whether the feasible path is a narrow Go DB-backed provider or `promote-none-yet`, but must preserve the evidence threshold above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/076-scope-lock-and-route-ownership-manifest/076-CONTEXT.md` — Ownership/no-go criteria and baseline evidence decisions.
- `.planning/phases/077-production-read-switch-contract/077-CONTEXT.md` — Route-specific switch, typed Go client boundary, failure mapping, and diagnostics contract.

### Active Milestone
- `.planning/PROJECT.md` — Current v1.12 milestone posture and non-goals.
- `.planning/REQUIREMENTS.md` — GOREAD requirements and traceability.
- `.planning/ROADMAP.md` — Phase 78 scope and dependencies.
- `.planning/research/SUMMARY.md` — Conditional route implementation recommendation and live-data gap.

### Code References
- `apps/web/app/strategies/[strategyId]/page.tsx` — Current visible public Strategy page behavior.
- `apps/web/lib/public-service-boundary.ts` — Current `getPublicStrategyCard` boundary used by the page.
- `apps/web/lib/public-service-adapter.ts` — Current TypeScript service adapter and switch insertion point from Phase 77.
- `packages/service/src/index.ts` — Canonical TypeScript `getPublicStrategyPage` DTO construction.
- `packages/spec/src/service.ts` — Canonical `getPublicStrategyPage` route metadata.
- `packages/spec/src/schemas.ts` — Canonical DTO and error schemas.
- `apps/go-backend/main.go` — Current fixture-backed Go public Strategy route.
- `apps/go-backend/main_test.go` — Current Go fixture, not-found, mutation rejection, and privacy tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/strategies/[strategyId]/page.tsx`: current page renders a source-free public card and returns `Strategy not found` for null.
- `packages/service/src/index.ts#getPublicStrategyPage`: current canonical DTO builder; Go must match this behavior.
- `apps/go-backend/main.go#publicStrategyPage`: current Go implementation is fixture-backed and therefore not enough for production promotion.
- `apps/go-backend/main_test.go`: existing tests already cover fixture equality, missing resources, mutation rejection, and private marker leaks.

### Established Patterns
- Public Strategy page exposes hashes, runtime metadata, record, lineage, and evidence links, but not Strategy source or private memory/debug data.
- Current Go route can prove shape and privacy, but it cannot prove live production data behavior without a real read provider.
- Public user pages should not expose backend ownership or diagnostic detail.

### Integration Points
- Phase 78 depends on Phase 77's route-specific switch and typed Go client decisions.
- Phase 78 output feeds Phase 79's parity/privacy/boundary gates and Phase 80's failure/rollback drills.

</code_context>

<specifics>
## Specific Ideas

If promotion criteria fail, the desired output is a clean `promote-none-yet` blocker artifact plus disabled Go ownership, not a partial or fixture-backed production route.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 78-Conditional Public Strategy Go Read Path*
*Context gathered: 2026-05-23*
