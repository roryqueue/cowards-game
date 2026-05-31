# Phase 207: Owner/Test-Only Gated Deeper Analysis Review - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 207 adds or audits owner/test-only gated deeper analysis surfaces for Match intelligence derivation diagnostics. These surfaces are for development, fixture/proof review, and authorized inspection of public derivation mechanics only. They must not become richer public intelligence, expose private Match/Strategy data, create production fixture fallback, or render controls/payloads in default public output.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Default public output excludes deeper diagnostics.
- **D-02:** Owner/test-only panels may inspect derivation mechanics, not private Match/Strategy data.
- **D-03:** Fixture mode and owner/test debug must never become a production fallback.
- **D-04:** Phase 207 should prepare monitor hooks for Phase 209 hard-blocking.

### Purpose
- **D-05:** Gated deeper analysis is for derivation diagnostics and fixture/proof review.
- **D-06:** It is not a product-facing richer public intelligence feature.
- **D-07:** It should help reviewers understand why a public intelligence section appeared, degraded, or became unavailable.

### Allowed Gated Content
- **D-08:** Allowed gated content includes fixture ID, capability band, confidence inputs, public signal coverage, unsupported-section reasons, annotation source events, and derivation warnings.
- **D-09:** Allowed content must be derived from public DTO/projection data or fixture metadata already safe for local/test diagnostics.
- **D-10:** Public signal coverage should describe presence/absence of public evidence, not private field contents.

### Forbidden Gated Content
- **D-11:** Forbidden content includes Strategy source, StrategyMemory, SoldierMemory, objective payloads, awareness-grid private data, raw diagnostics, stacks, host paths, env values, tokens, DB details, package paths, runtime internals, quarantine details, recovery details, and operator details.
- **D-12:** Forbidden content must not appear in default public HTML, serialized props, fixture payloads, proof artifacts, or gated diagnostics.
- **D-13:** Owner Chronicle private sections are not an input to v1.30 public intelligence diagnostics.

### Gate Model
- **D-14:** Require explicit local/test gate or owner-authorized mode.
- **D-15:** Default public pages must not render controls, collapsed panels, hidden serialized diagnostics, or private data attributes.
- **D-16:** Test-support diagnostics must fail closed when fixture/test gates are disabled.

### UI Posture
- **D-17:** Use a small collapsible diagnostics panel or test-support view.
- **D-18:** Do not make gated diagnostics a prominent product feature.
- **D-19:** If a diagnostics affordance risks public confusion, keep it under test-support routes rather than main result/replay pages.

### Monitor Stance
- **D-20:** Phase 207 should add or prepare stable markers and code structure so Phase 209 can hard-block private imports and default-public leakage.
- **D-21:** Monitor targets should include default public result/replay rendering, fixture/test diagnostics, derivation code imports, and proof artifacts.
- **D-22:** Private import blocking should cover runtime-service internals, Go orchestration internals, persistence internals, owner Chronicle private sections, private debug payloads, and operator/recovery internals.

### the agent's Discretion
- The agent may choose whether the gated surface is implemented as a collapsible panel, test-support view, or both, provided default public absence and fail-closed gating are proven.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Public/gated/internal signal classification and fixture capability bands.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Adapter input boundary, output model, limitations, and forbidden private inputs.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/203-result-page-tactical-summary-and-comparison-model/203-CONTEXT.md` — Default public result-page intelligence behavior.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/204-replay-timeline-annotation-and-jump-target-workbench/204-CONTEXT.md` — Public replay annotation behavior and owner-debug exclusion.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/205-soldier-status-board-control-terrain-stone-and-action-mix-panels/205-CONTEXT.md` — Tactical panel public-only boundary.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/206-degraded-unavailable-queued-running-failed-and-missing-chronicle-intelligence-states/206-CONTEXT.md` — Public-safe low-signal and unavailable state behavior.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — GATE-01 through GATE-05 define Phase 207 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 207 scope and success criteria.

### Existing Gating and Privacy Baseline
- `.planning/workstreams/v1-27-result-replay-workbench/phases/197-public-safe-evidence-details-privacy-copy-and-owner-test-only-gating/197-CONTEXT.md` — Prior owner/test gating and privacy decisions.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 public privacy scans and proof baseline.
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts` — Existing owner-debug authorization/gating helper.
- `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` — Existing owner-debug tests.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Existing owner-debug UI gating and default public replay behavior.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture gate behavior.
- `packages/replay/src/project.ts` — Public vs owner Chronicle projection and private-section separation.
- `scripts/check-boundary-monitors.ts` — Existing monitor source for privacy, ownership, fixture fallback, and internal import checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing replay owner-debug helpers distinguish owner-authorized mode from default public mode.
- Existing fixture adapter gates local/test fixture reads.
- Existing public projection removes private payload keys and private markers.
- Boundary monitors already check several ownership and privacy regressions.

### Established Patterns
- Owner/test-only controls must be absent from default public output, not merely collapsed.
- Public proof scans should check rendered pages and artifacts for private markers.
- Gated/test-support features should fail closed when environment gates are disabled.

### Integration Points
- Phase 207 should audit or extend result/replay/intelligence code so Phase 209 can monitor imports and leakage.
- Gated diagnostics can consume Phase 202 derivation metadata if it remains public-safe.
- Phase 208 visual proof should not treat gated diagnostics as default public UI.

</code_context>

<specifics>
## Specific Ideas

- Allowed diagnostics: fixture ID, capability band, confidence inputs, public signal coverage, unsupported-section reasons, annotation source events, derivation warnings.
- Preferred UI posture: small collapsible diagnostics panel or test-support view, with test-support preferred if public confusion risk appears.

</specifics>

<deferred>
## Deferred Ideas

- Rich owner-only tactical diagnostics based on private Strategy/Chronicle data are deferred to a future owner-private design, not v1.30 public intelligence.

</deferred>

---

*Phase: 207-Owner/Test-Only Gated Deeper Analysis Review*
*Context gathered: 2026-05-31*
