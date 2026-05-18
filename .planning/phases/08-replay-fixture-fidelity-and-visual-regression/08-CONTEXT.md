# Phase 8: Replay Fixture Fidelity and Visual Regression - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces fragile hand-authored replay demos with legal engine-generated scenarios and focused visual checks. It covers canonical demo Match generation, fixture legality tests, replay projection parity, Playwright screenshot checks, and failure diagnostics for the fixture/replay path.

</domain>

<decisions>
## Implementation Decisions

### Demo Corpus Shape
- **D-01:** Build both mechanic-specific demos and, if useful, one compound tour Match. The mechanic-specific corpus should include push, fall, contraction, legal Backstab, runtime failure, and endgame as separate canonical demos so failures are easy to localize.
- **D-02:** A compound tour Match is allowed only if it remains engine-generated and useful for replay smoke coverage. It must not become a hand-authored visual story that bypasses engine legality.

### Fixture Generation Policy
- **D-03:** Engine-generated fixtures are the default. New canonical replay data should be produced through legal engine/test-utils scenarios and Chronicle/replay projection paths.
- **D-04:** Hand-authored replay states are legacy/test-only exceptions. They may remain only for tiny UI fallbacks, and each exception must be explicit and guarded by legality/projection tests.

### Visual Regression Scope
- **D-05:** Use focused mechanic-specific Playwright screenshots rather than broad full-page visual snapshots.
- **D-06:** Screenshot checks should cover board scale, Soldier positions, contraction bounds, and event callouts at stable desktop and mobile viewports.
- **D-07:** Tests should use deterministic fixture data, stable selectors, and avoid dynamic page regions where possible.

### Failure Diagnostics
- **D-08:** Fixture and visual failures should identify the failing layer: engine legality, Chronicle validation, projection/DTO shaping, or UI rendering.
- **D-09:** Layer classification should appear in test names, helper errors, or assertion messages so failures are actionable during local and CI runs.

### the agent's Discretion
- The planner may choose the exact helper/module names, scenario-builder API shape, and screenshot thresholding as long as the resulting system follows the decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone Context
- `.planning/PROJECT.md` — Current v1.1 goal and non-negotiable project constraints.
- `.planning/REQUIREMENTS.md` — Phase 8 requirements FID-01 through FID-07.
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, and phase boundary.
- `.planning/research/SUMMARY.md` — v1.1 research summary and build-order rationale.
- `.planning/research/FEATURES.md` — Replay fidelity feature expectations and anti-features.
- `.planning/research/ARCHITECTURE.md` — Proposed engine-generated fixture architecture.
- `.planning/STATE.md` — Post-shipment replay fixture correction context.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay terminology and rule behavior.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundaries and replay/runtime intent.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/test-utils/src/engine-scenarios.ts`: Existing scenario helper foundation that can grow into canonical legal replay scenario builders.
- `packages/replay/src/build.ts`: Builds Chronicles from engine-run Matches and should be the preferred fixture source.
- `apps/web/app/matches/replay-fixture.ts`: Current hand-authored replay fixture path that should be replaced or sharply constrained.
- `apps/web/app/matches/replay-fixture.test.ts`: Existing legality guard tests that can be expanded and/or moved closer to engine-generated fixtures.
- `apps/web/e2e/replay.fixture.spec.ts`: Existing Playwright replay fixture smoke path suitable for focused screenshot expansion.

### Established Patterns
- Replay UI already consumes projected DTOs rather than raw engine state.
- Current fixture tests already classify some legality concerns, including canonical starting formation, push legality, terrain-blocked movement, contraction fallout, and Backstab positioning.
- v1.0 package boundaries keep engine/replay logic out of React and should remain intact.

### Integration Points
- New fixture builders likely connect `packages/test-utils`, `packages/replay`, and `apps/web/app/matches/server.ts` or the test-support replay fixture route.
- Screenshot checks should run through Playwright against the same replay viewer route used by persisted Match replays where feasible.
</code_context>

<specifics>
## Specific Ideas

- Treat each canonical mechanic demo as a debugging artifact, not only a visual demo.
- Keep the compound tour optional; clarity and legality matter more than one impressive fixture.
- Failure messages should make it obvious whether the engine, Chronicle, projection, or UI is wrong.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 8-Replay Fixture Fidelity and Visual Regression*
*Context gathered: 2026-05-18*
