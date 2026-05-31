# Phase 196: Degraded, Unavailable, Failed, Queued, and Running Public States - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 196 makes every non-happy public MatchSet/replay state distinct, realistic, and public-safe. It should improve state-specific copy, rendering, and tests for queued, running, degraded, unavailable, failed, stale, malformed, blocked, missing, and no-result states without exposing execution internals or changing the frozen contract.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Use the strict boundary taxonomy and public-safe default output rules from prior phases.
- **D-02:** Use the dedicated result view-model helper from Phase 194 as the preferred home for state-specific public copy and rendering metadata.
- **D-03:** Use plain operational language.
- **D-04:** Include tests and browser/visual proof for user-facing state surfaces.

### State Granularity
- **D-05:** Provide dedicated public-safe treatment for every lifecycle/failure category named by the frozen contract.
- **D-06:** Dedicated coverage should include queued, accepted when surfaced, running, complete, degraded, unavailable, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, blocked, missing Chronicle, and no-result.
- **D-07:** Each category should have explicit copy and tests so states do not fall through to misleading generic failure language.

### Replay Unavailable Handling
- **D-08:** Missing, stale, pending, or unavailable replay states should render a public-safe unavailable panel rather than a blank board, misleading failed-render placeholder, or generic not-found-only page.
- **D-09:** The unavailable panel should show lifecycle, replay availability, public reason/failure category when available, and privacy/provenance copy.
- **D-10:** Replay unavailable UI must not expose raw Chronicle/debug data, raw diagnostics, host/env/token/DB/package details, Strategy source, StrategyMemory, SoldierMemory, objective payloads, or private runtime internals.

### Fallback Rule
- **D-11:** Unknown, unversioned, or unmapped fixture/DTO states should fail closed with explicit schema/view-model test failure.
- **D-12:** Runtime rendering should prefer a safe unavailable/not-found shape over generic evidence when a state cannot be mapped.
- **D-13:** Do not hide contract drift behind best-effort generic failure copy.

### the agent's Discretion
- The agent may choose exact state copy strings and unavailable panel layout, provided each category is distinct, public-safe, and test-covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Strict boundary and visual baseline defaults.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/194-result-page-state-model-and-evidence-readability-pass/194-CONTEXT.md` — Result view-model and public copy decisions.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/195-replay-page-workbench-layout-and-timeline-ergonomics/195-CONTEXT.md` — Replay layout and owner-debug gating decisions.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — STATE-01 through STATE-06 define Phase 196 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 196 scope and success criteria.

### State Contract and Current Copy
- `packages/spec/src/match-execution-contract.ts` — Lifecycle states, failure categories, retry dispositions, result/replay availability, and fixture scenarios.
- `apps/web/app/matchsets/evidence-copy.ts` — Existing status and retry copy.
- `apps/web/app/matchsets/evidence-copy.test.ts` — Existing tests for running, degraded, blocked, invalid-result, and no-result copy.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — Current replay unavailable UI.
- `apps/web/app/matches/server.ts` — Replay metadata/evidence loading and unavailable behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Contract enums in `packages/spec/src/match-execution-contract.ts` are the source of truth for complete state coverage.
- Existing `matchSetEvidenceRows` and tests already cover some categories and should be refactored or expanded rather than discarded blindly.
- Replay unavailable component exists and can be upgraded to evidence-readable public-safe behavior.

### Established Patterns
- Stale/unversioned DTO payloads should fail closed.
- Public evidence exposes categories, not raw diagnostics.
- Replay absence must be distinguished from blank canvas/rendering failure.

### Integration Points
- Result view-model tests should assert category coverage.
- Replay server/page tests should assert unavailable panel behavior for missing/stale/unavailable replay states.
- Fixture e2e proof should verify state-specific copy for every v1.25 fixture.

</code_context>

<specifics>
## Specific Ideas

- Unknown states should be loud in tests and quiet/safe in public rendering.
- Missing replay should feel like an evidence state, not a broken page.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 196-Degraded, Unavailable, Failed, Queued, and Running Public States*
*Context gathered: 2026-05-30*
