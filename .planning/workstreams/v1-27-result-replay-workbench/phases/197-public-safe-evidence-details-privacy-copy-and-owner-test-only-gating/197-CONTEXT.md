# Phase 197: Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 197 tightens public-safe evidence details, privacy copy, rendered-page/artifact privacy scans, and owner/test-only debug gating across result, replay, and fixture catalog surfaces. It should improve trust and enforce privacy boundaries without adding new public debug capabilities or exposing private runtime/Strategy data.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Default public output excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, environment values, tokens, DB details, package paths, owner debug, private Chronicle details, and private runtime internals.
- **D-02:** Owner/test-only surfaces remain gated, hidden by default, and visually secondary.
- **D-03:** Boundary monitors should fail privacy regressions instead of allowing best-effort public output.

### Privacy Copy Placement
- **D-04:** Place concise privacy cues near evidence panels.
- **D-05:** Put fuller privacy exclusions and provenance details in details/provenance sections.
- **D-06:** Avoid one large global warning banner unless a later UI review proves it is necessary.
- **D-07:** Privacy copy should be tied to the evidence being inspected and should use readable, specific public-safe language.

### Denylist Scope
- **D-08:** Apply the full public-output denylist across rendered result pages, rendered replay pages, fixture catalog pages, screenshots/proof text where practical, fixture JSON, schema artifacts, app copy, and Markdown evidence artifacts.
- **D-09:** New workbench surfaces and proof artifacts must be added to privacy scan coverage.
- **D-10:** Rendered-page scans are required but not sufficient; fixture and artifact leaks must also be caught.

### Owner/Test Gate Standard
- **D-11:** Use a dual gate for debug or fixture-private surfaces: environment/test/local feature flag where relevant, plus server-side owner/test authorization for owner data.
- **D-12:** Query parameters alone are not acceptable gates for owner/private data or owner-debug fallback.
- **D-13:** Fixture catalog/test-support surfaces require explicit non-production gates and should fail closed in production-like contexts.
- **D-14:** Owner private replay/debug data requires identity/authorization in addition to any test/local enablement.

### the agent's Discretion
- The agent may choose exact privacy copy text and scan implementation details, provided the denylist coverage and dual-gate policy are enforced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Strict taxonomy and visual proof defaults.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/193-fixture-catalog-browser-or-developer-fixture-switcher/193-CONTEXT.md` — Fixture catalog route and fail-closed gate decisions.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/195-replay-page-workbench-layout-and-timeline-ergonomics/195-CONTEXT.md` — Owner debug as gated collapsible secondary panel.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/196-degraded-unavailable-failed-queued-and-running-public-states/196-CONTEXT.md` — Replay unavailable public-safe panel and fail-closed unknown-state rules.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — PRIV-01 through PRIV-05 define Phase 197 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 197 scope and success criteria.

### Privacy and Gate Source
- `packages/spec/src/match-execution-contract.ts` — Public fields excluded, privacy DTO fields, and fixture classification.
- `packages/spec/src/public-output-privacy.ts` — Shared public-output privacy guard.
- `packages/spec/src/service.ts` — Existing public service privacy classes and examples.
- `packages/spec/src/service-contract.test.ts` — Existing public schema/example privacy tests.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture environment gate.
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts` — Owner debug option resolution.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Current owner debug rendering and toggle.
- `scripts/check-boundary-monitors.ts` — Existing privacy, route surface, owner-debug, fixture, and artifact monitor patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing privacy denylist markers in `scripts/check-boundary-monitors.ts` and spec tests can be extended for v1.27 workbench surfaces.
- `MatchExecutionPrivacyV1` already records public/private split and excluded fields.
- Owner-debug checks already exist in boundary monitors and should be strengthened rather than bypassed.

### Established Patterns
- Public outputs are schema/example scanned for private field strings and markers.
- Owner-private surfaces require authorization; fixture surfaces require non-production gates.
- Public pages may describe what is excluded, but should not expose excluded payloads or raw internals.

### Integration Points
- Result view model, replay evidence rows, fixture catalog route, proof artifacts, and screenshots should all be included in privacy scan planning.
- Owner debug UI should remain absent in default public fixture/replay proof.
- Monitor updates should preserve existing v1.25 gate requirements.

</code_context>

<specifics>
## Specific Ideas

- Privacy cues should be close enough to evidence panels that users understand what they are inspecting.
- Fuller exclusions belong in provenance/details to avoid visual noise.
- Query-param-only debug gates are explicitly disallowed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 197-Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating*
*Context gathered: 2026-05-30*
