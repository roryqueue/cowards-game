# Phase 193: Fixture Catalog Browser or Developer Fixture Switcher - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 193 adds an explicit non-production fixture catalog browser or developer fixture switcher for the v1.25 Match execution fixture scenarios. It should make fixture-backed result/replay app development ergonomic without making fixture mode a public production fallback or changing the frozen `match-execution-app-v1` contract.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults From Phase 192
- **D-01:** Use one canonical phase artifact/context when practical.
- **D-02:** Classify boundaries strictly: frozen app contract, public service projection, owner/test-only, execution-internal, persistence-internal, or intentionally unstable.
- **D-03:** Include browser/visual evidence for user-facing result/replay UI touched by this phase.
- **D-04:** Fixture mode must remain explicit, non-production gated, and fail closed.

### Surface Location
- **D-05:** Add a dedicated gated test-support/developer route for the fixture catalog, such as `/dev/match-execution-fixtures` or `/test-support/match-execution-fixtures`.
- **D-06:** Keep fixture catalog controls separate from default public result/replay pages so those pages do not feel like test tools.
- **D-07:** The catalog route may deep-link into existing fixture-backed result/replay pages.

### Navigation Model
- **D-08:** Use a scenario list with state metadata and deep links.
- **D-09:** Each fixture row/card should show lifecycle state, failure category when present, retry disposition, result availability, replay availability, privacy classification, and links to result/replay pages where applicable.
- **D-10:** Avoid overbuilding filtering/grouping in this phase unless it emerges naturally from the existing fixture metadata.

### Production Gate Behavior
- **D-11:** When fixture mode is disabled or production is simulated, the catalog route should fail closed with a 404/not-found shape.
- **D-12:** Do not show a public explanatory unavailable page for the catalog route in production-like contexts, because exposing the route shape weakens the no-production-fixture-fallback posture.
- **D-13:** Tests should assert the catalog is reachable only under allowed local/test gates and absent when disabled or production-like.

### the agent's Discretion
- The agent may choose exact route path naming, row/card presentation, and whether the catalog uses a table or compact list, provided the surface remains gated and metadata-rich.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Carry-forward defaults for artifact shape, strict taxonomy, and visual proof.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — FIX-01 through FIX-06 define Phase 193 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 193 scope and success criteria.
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md` — Fixture workbench research baseline and watch-outs.

### Frozen Fixture Contract
- `packages/spec/src/match-execution-contract.ts` — Fixture catalog, lifecycle/failure/retry/replay availability values, and fixture classification.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Existing fixture gate and public read adapter.
- `apps/web/lib/match-execution-fixture-adapter.test.ts` — Existing adapter gate and fixture coverage tests.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing fixture result/replay proof.
- `scripts/check-boundary-monitors.ts` — Existing fixture gate, catalog, privacy, and ownership monitor patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MATCH_EXECUTION_CONTRACT_FIXTURES_V1` and fixture lookup helpers in `packages/spec/src/match-execution-contract.ts` can drive the catalog without hard-coding URLs separately.
- `isMatchExecutionFixtureEnabled` in `apps/web/lib/match-execution-fixture-adapter.ts` should be reused or mirrored through a server-safe helper so route gating remains consistent.
- Existing result URLs follow `/matchsets/match-set%3Afixture%3A<fixture-id>`.
- Existing replay fixture URL follows `/matches/match%3Afixture%3Apublic-safe-replay/replay`.

### Established Patterns
- Fixture enablement is allowed only when `NODE_ENV !== "production"` and one of the explicit fixture/test flags is enabled.
- Unknown or disabled fixtures should return `null`/not found rather than invented data.
- Browser proof currently scans rendered pages for private markers and nonblank replay canvas output.

### Integration Points
- New route should live under the web app route tree and should not be linked from default public navigation.
- Tests should cover both route availability and production-like absence.
- Boundary monitors should be extended if a new route label or fixture gate needs to be tracked.

</code_context>

<specifics>
## Specific Ideas

- The fixture catalog should be useful as both a developer switchboard and proof index.
- It should list all v1.25 scenarios: complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay.
- The catalog should make result/replay availability obvious before opening a fixture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 193-Fixture Catalog Browser or Developer Fixture Switcher*
*Context gathered: 2026-05-30*
