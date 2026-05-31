# Phase 198: Desktop/Mobile Visual Proof Across All Fixtures - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 198 proves that v1.27 result/replay/fixture workbench surfaces render plausibly across fixtures and responsive viewports without live Match execution services. It should produce automated browser assertions, representative screenshots, privacy scans, replay board realism checks, and fail-closed fixture-mode proof.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Browser proof is required for user-facing result/replay/fixture surfaces.
- **D-02:** Full public-output denylist follows rendered pages and proof artifacts.
- **D-03:** Fixture mode must prove no live execution dependency and must fail closed when disabled or production-like.

### Viewport Matrix
- **D-04:** Require desktop, tablet, and mobile visual proof.
- **D-05:** Existing Playwright desktop `1440x900` and mobile `390x844` projects are not enough by themselves; Phase 198 should add a tablet project or explicit tablet viewport proof step.
- **D-06:** Tablet proof is required because the workbench is a realistic inspection surface at tablet dimensions.

### Screenshot Artifacts
- **D-07:** Record representative screenshots plus automated assertions.
- **D-08:** Screenshots should cover the fixture catalog, several key result states, and replay workbench on desktop/tablet/mobile.
- **D-09:** Automated assertions should still visit every v1.25 MatchSet fixture scenario, even if not every fixture gets a screenshot on every viewport.
- **D-10:** Avoid screenshotting every fixture on every viewport unless implementation discovers a strong need; that would be noisy and brittle.

### Fixture Fail-Closed Proof
- **D-11:** Add automated negative tests for disabled or production-like fixture mode.
- **D-12:** Negative tests should assert the fixture catalog and fixture-backed reads are unavailable without relying on a real production deployment.
- **D-13:** Static boundary monitors remain useful, but route/read behavior must also be proven dynamically.

### the agent's Discretion
- The agent may decide exact tablet viewport dimensions, screenshot names, representative result states, and whether tablet proof is a new Playwright project or an explicit viewport step.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Full visual audit baseline.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/193-fixture-catalog-browser-or-developer-fixture-switcher/193-CONTEXT.md` — Fixture catalog route and fail-closed behavior.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/195-replay-page-workbench-layout-and-timeline-ergonomics/195-CONTEXT.md` — Replay workbench layout decisions.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/197-public-safe-evidence-details-privacy-copy-and-owner-test-only-gating/197-CONTEXT.md` — Privacy scan and gating decisions.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — PROOF-01 through PROOF-06 define Phase 198 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 198 scope and success criteria.

### Browser Proof Source
- `playwright.config.ts` — Existing desktop and mobile projects; Phase 198 must add tablet or explicit tablet viewport proof.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing all-fixture result/replay proof.
- `apps/web/e2e/replay.visual.spec.ts` — Existing replay visual proof patterns.
- `apps/web/lib/match-execution-fixture-adapter.test.ts` — Existing adapter gate tests.
- `apps/web/lib/public-service-adapter.test.ts` — Existing fixture-backed public read behavior tests.
- `apps/web/app/matches/server.test.ts` — Existing replay fixture and board realism tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Playwright already has `desktop` and `mobile` projects; tablet can be added consistently.
- Existing fixture e2e proof already loops through all v1.25 fixture IDs and checks private markers.
- Existing replay visual tests and board realism tests provide patterns for nonblank canvas and visible piece checks.

### Established Patterns
- Playwright web server runs with `PLAYWRIGHT_TEST=1`, enabling fixture mode for proof.
- Screenshot path template is already configured.
- Negative fixture gate tests can be unit/integration tests without requiring production deployment.

### Integration Points
- Proof artifacts should be referenced from v1.27 validation/audit artifacts later.
- Screenshot generation should avoid excessive repo churn.
- Tablet project addition, if used, should not destabilize unrelated e2e suites.

</code_context>

<specifics>
## Specific Ideas

- Use assertions for exhaustive fixture coverage and screenshots for representative visual review.
- Tablet is explicitly required, even though it was stronger than the agent's initial recommendation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 198-Desktop/Mobile Visual Proof Across All Fixtures*
*Context gathered: 2026-05-30*
