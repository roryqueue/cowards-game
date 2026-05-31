# Phase 208: Desktop/Mobile Visual Proof Across Fixtures - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 208 proves the v1.30 public Match Intelligence result/replay surfaces across fixtures and responsive viewports. It should add or extend browser assertions, representative screenshots, board realism checks, private-marker scans, fixture-mode/no-live-execution proof, and fail-closed fixture gate proof. It should not broaden feature scope, add new intelligence capabilities, or rely on live Match execution for normal UI proof.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Browser proof is required for user-facing intelligence UI.
- **D-02:** Fixture mode must work without live execution and fail closed when disabled.
- **D-03:** Default public pages must scan clean for private markers.
- **D-04:** Mobile stability is a hard gate.

### Viewport Matrix
- **D-05:** Require desktop, tablet, and mobile proof.
- **D-06:** Carry forward the v1.27/v1.29 proof standard that tablet matters for serious workbench inspection.
- **D-07:** Exact viewport dimensions are at the agent's discretion, but must represent real desktop, tablet, and phone layouts.

### Coverage Model
- **D-08:** Use exhaustive assertions across every frozen public fixture plus v1.29 app-only public trust fixtures.
- **D-09:** Use screenshots for representative states only.
- **D-10:** Do not screenshot every fixture on every viewport unless implementation finds a strong reason; avoid noisy artifact churn.

### Representative Screenshots
- **D-11:** Capture at least complete replay-ready intelligence, degraded/partial, unavailable runtime, failed strategy or system failure, no-result, missing-Chronicle, and mobile replay tactical view.
- **D-12:** Screenshots should support human review of layout, density, text fit, controls, and tactical readability.
- **D-13:** Screenshot names and storage paths should be stable enough for proof artifacts without overwhelming the repo.

### Board and Layout Checks
- **D-14:** Require nonblank board output for replay-ready intelligence.
- **D-15:** Require visible in-bounds Soldiers and terrain.
- **D-16:** Require canonical start plausibility where applicable.
- **D-17:** Require no overlapping visible board pieces and no core control/text collisions.
- **D-18:** Any board emphasis or tactical panel added in earlier phases must not destabilize these checks.

### Fixture Fail-Closed Proof
- **D-19:** Add dynamic proof that fixture/test-support routes and reads fail closed when gates are disabled or production-like mode is simulated.
- **D-20:** This must cover both fixture catalog/test-support affordances and fixture-backed reads used by result/replay intelligence.
- **D-21:** Static boundary monitors are not enough by themselves for fixture fallback proof.

### Artifact Stance
- **D-22:** Produce proof artifact paths and privacy scan summaries.
- **D-23:** Avoid committing a screenshot explosion.
- **D-24:** Proof artifacts should summarize commands, viewport coverage, fixture coverage, representative screenshots, board checks, fixture fail-closed checks, and privacy scan results.

### the agent's Discretion
- The agent may choose exact viewport dimensions, screenshot names, representative state fixture IDs, proof script shape, and whether screenshots live under Playwright output or copied planning artifacts, provided proof remains reviewable and not noisy.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Fixture bands and v1.29 baseline.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Intelligence adapter output and tests.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/203-result-page-tactical-summary-and-comparison-model/203-CONTEXT.md` — Result-page intelligence sections and low-signal states.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/204-replay-timeline-annotation-and-jump-target-workbench/204-CONTEXT.md` — Replay annotations and mobile-light controls.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/205-soldier-status-board-control-terrain-stone-and-action-mix-panels/205-CONTEXT.md` — Tactical panels and optional board emphasis.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/206-degraded-unavailable-queued-running-failed-and-missing-chronicle-intelligence-states/206-CONTEXT.md` — State-specific intelligence limits.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/207-owner-test-only-gated-deeper-analysis-review/207-CONTEXT.md` — Default public absence for gated diagnostics.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — PROOF-01 through PROOF-06 define Phase 208 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 208 scope and success criteria.

### Prior Proof Baselines
- `.planning/workstreams/v1-27-result-replay-workbench/phases/198-desktop-mobile-visual-proof-across-all-fixtures/198-CONTEXT.md` — Desktop/tablet/mobile proof decisions and screenshot/assertion split.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 public page proof, privacy scans, board realism, playback, and contract compatibility proof.
- `playwright.config.ts` — Existing browser project/viewports and screenshot settings.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing all-fixture result/replay proof.
- `apps/web/e2e/replay.visual.spec.ts` — Existing replay visual and board proof patterns.
- `apps/web/lib/match-execution-fixture-adapter.test.ts` — Existing fixture adapter gate tests.
- `apps/web/app/matches/server.test.ts` — Existing replay fixture and board realism test patterns.

### UI Source
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Result intelligence visual proof target.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Replay intelligence visual proof target.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` — Board rendering proof target.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — Missing/invalid/unavailable replay proof target.
- `apps/web/app/globals.css` — Responsive workbench styling.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Playwright setup and v1.25/v1.29 proof specs already provide fixture-mode and replay visual patterns.
- Existing board realism tests cover in-bounds pieces, nonblank canvas, and canonical starts.
- Existing fixture adapter tests cover gate behavior and can be extended for dynamic fail-closed proof.

### Established Patterns
- Use assertions for exhaustive fixture coverage; use screenshots for representative visual review.
- Browser proof should run with explicit fixture/test gates and not require live execution services.
- Public proof artifacts should record privacy scan summaries and avoid leaking sensitive environment data.

### Integration Points
- Phase 208 validates result intelligence from Phase 203, replay annotations from Phase 204, tactical panels from Phase 205, state coverage from Phase 206, and gated absence from Phase 207.
- Phase 209 will turn relevant proof expectations into boundary monitor coverage.

</code_context>

<specifics>
## Specific Ideas

- Representative screenshots: complete replay-ready intelligence, degraded/partial, unavailable runtime, failed strategy/system failure, no-result, missing-Chronicle, mobile replay tactical view.
- Exhaustive assertions should cover every frozen public fixture plus v1.29 app-only public trust fixtures.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 208-Desktop/Mobile Visual Proof Across Fixtures*
*Context gathered: 2026-05-31*
