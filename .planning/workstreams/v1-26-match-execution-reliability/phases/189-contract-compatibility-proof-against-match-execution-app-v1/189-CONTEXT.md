# Phase 189: Contract Compatibility Proof Against match-execution-app-v1 - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove public execution outcomes remain compatible with the frozen `match-execution-app-v1` contract and update monitors against drift. This phase is proof and compatibility, not contract redesign.

</domain>

<decisions>
## Implementation Decisions

### Compatibility Target
- **D-01:** Validate every public execution outcome against `match-execution-app-v1`.
- **D-02:** Prove no required public DTO fields were removed or semantically narrowed.
- **D-03:** Make no optional app-facing addition unless earlier phase evidence proves it necessary, backward-compatible, and public-safe.

### Outcome Coverage
- **D-04:** Compatibility must cover complete, queued/running, degraded, unavailable runtime, system failure, timeout, malformed runtime result, stale artifact, strategy failure, missing Chronicle, and no-result outcomes.
- **D-05:** Public result/replay proof pages must render compatible evidence without private fields or execution internals.

### Monitors
- **D-06:** Boundary monitors must catch contract drift, ownership creep, Strategy execution in web/API/Go, privacy leaks, production fixture fallback, and premature runtime promotion claims.
- **D-07:** Monitor failures should be specific enough to tell whether drift is contract, privacy, ownership, fixture, or promotion-language related.

### the agent's Discretion
Planner may choose the split between spec tests, web tests, Go fixture/projection tests, and monitor assertions, but all listed outcomes must be covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/workstreams/v1-26-match-execution-reliability/REQUIREMENTS.md` — COMPAT requirements.
- `.planning/workstreams/v1-26-match-execution-reliability/ROADMAP.md` — Phase 189 success criteria.
- `.planning/artifacts/v1.25-interface-freeze-decision.md` — frozen contract decision.

### Contract and App Proof
- `packages/spec/src/match-execution-contract.ts` — schemas and fixture catalog.
- `packages/spec/src/match-execution-contract.test.ts` — compatibility and fail-closed tests.
- `apps/web/lib/public-service-boundary.ts` — public MatchSet contract projection.
- `apps/web/app/matchsets/evidence-copy.ts` — public lifecycle/failure copy.
- `apps/web/app/matches/server.ts` — replay evidence contract projection.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — existing fixture-mode browser proof.
- `scripts/check-boundary-monitors.ts` — monitor extension point.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.25 fixture catalog already covers many target outcomes.
- App fixture adapter is gated to test/local modes and can support proof pages.
- Boundary monitor already checks contract version, lifecycle vocabulary, fixture scenarios, adapter gates, privacy markers, and app contract consumption.

### Established Patterns
- Contract compatibility lives in `packages/spec`, public projection in web boundary modules, and browser proof in Playwright.
- Public privacy scans use denylisted private markers across rendered pages and artifacts.

### Integration Points
- Extend v1.25 proof coverage only where v1.26 outcomes require new reliability/failure evidence.
- Avoid production fixture fallback.

</code_context>

<specifics>
## Specific Ideas

The desired proof statement is: "Execution reliability changed behind the boundary; public outcomes still parse and render as `match-execution-app-v1`."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 189-Contract Compatibility Proof Against match-execution-app-v1*
*Context gathered: 2026-05-30*
