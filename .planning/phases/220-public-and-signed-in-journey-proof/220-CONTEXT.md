# Phase 220: Public and Signed-In Journey Proof - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 220 proves anonymous and signed-in journeys through the public site on desktop and mobile. It records route coverage, discovery DTO names, privacy scan results, boundary results, and non-claims.

</domain>

<decisions>
## Implementation Decisions

### Journey Coverage
- **D-01:** Prove anonymous discovery: `/` -> `/watch` -> MatchSet -> replay -> player/Strategy -> Learn.
- **D-02:** Prove competition discovery: `/competitions` -> detail -> entry sign-in gate -> signed-in dashboard.
- **D-03:** Prove signed-in build-to-compete: Workshop -> saved revision -> entry -> result -> replay.

### Proof Data
- **D-04:** Browser proof may use seeded/fixture data for public discovery and signed-in paths as long as the proof states what is fixture-backed versus live.
- **D-05:** Do not require live Match execution for normal public site proof.

### Viewports and Layout
- **D-06:** Desktop and mobile proof must check navigation, cards, tables, evidence rows, buttons, and replay/result links for overlap/clipping.
- **D-07:** Mobile tabular data can use compact rows/cards rather than forced desktop tables.

### the agent's Discretion
- Choose exact proof script names and fixture/live mix that best fits existing e2e patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - PROOF-01 through PROOF-05.
- `.planning/ROADMAP.md` - Phase 220 scope.
- `.planning/phases/219-privacy-boundary-and-discovery-monitor-coverage/219-CONTEXT.md` - Safety proof expectations.
- `.planning/artifacts/v1.31-discussion-summary.md` - Journey proof decisions.

### Proof Precedents
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts` - Public result/replay proof precedent.
- `apps/web/e2e/replay.visual.spec.ts` - Desktop/mobile replay visual proof precedent.
- `apps/web/e2e/workshop-to-replay.spec.ts` - Signed-in Workshop-to-replay precedent.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` - Proof artifact shape and non-claims.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Playwright proof and visual specs.
- Existing fixture-backed public MatchSet/replay scenarios.

### Established Patterns
- Public proof artifacts record URLs, state classifications, privacy results, and non-claims.

### Integration Points
- Journey proof should run after pages, links, and monitors exist.

</code_context>

<specifics>
## Specific Ideas

Proof artifact should distinguish fixture-backed public discovery from any live signed-in proof so future audits do not overclaim execution coverage.

</specifics>

<deferred>
## Deferred Ideas

Live full tournament/ladder execution proof and durable ranking proof.

</deferred>

---
*Phase: 220-public-and-signed-in-journey-proof*
*Context gathered: 2026-05-31*
