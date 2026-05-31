# Phase 206: Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 206 makes every non-happy public result/replay state render an honest, useful Match intelligence state. It focuses on state-specific limitations, degraded/partial evidence handling, unavailable replay behavior, and public-safe copy. It should not add new tactical capabilities beyond earlier phases, change public DTOs, expose private internals, or fake tactical analysis when public evidence is absent.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Keep intelligence visible but limited for every fixture and public state.
- **D-02:** Use public-safe evidence absence language.
- **D-03:** Do not mention private field names, owner-only payloads, runtime internals, quarantine, recovery, operator state, raw diagnostics, or execution internals.
- **D-04:** Do not fake tactical panels when replay evidence is missing, stale, invalid, or unavailable.

### State Taxonomy
- **D-05:** Use state-specific intelligence states for `queued`, `running`, `degraded`, `runtime_unavailable`, `timeout`, `malformed_runtime_result`, `stale_artifact`, `system_failure`, `strategy_failure`, `blocked`, `no_result`, `missing_chronicle`, and `invalid_chronicle`.
- **D-06:** Each state should have distinct limitations and public-safe explanation.
- **D-07:** The taxonomy should map to frozen lifecycle/failure/replay availability fields and v1.29 app-only trust states without changing the contract.

### Result Page Visibility
- **D-08:** Keep the Match Intelligence section visible on result pages for all states.
- **D-09:** Low-signal result states should show state-specific limitations rather than hiding the section.
- **D-10:** Copy should explain what public evidence exists, what is pending or unavailable, and which tactical sections cannot be derived.

### Replay Unavailable Behavior
- **D-11:** Replay unavailable pages should show an intelligence-unavailable explanation.
- **D-12:** Replay unavailable pages should route users back to result evidence when useful.
- **D-13:** Do not render a blank replay workbench, fake board, fake timeline, or fake tactical panels for missing/invalid/stale/no-result replay states.

### Copy Style
- **D-14:** Phrase limitations as "public evidence is pending", "public replay evidence is missing", "public projection is unavailable", "public evidence is withheld", or "public evidence cannot be used".
- **D-15:** Avoid naming private DTO fields or internal causes.
- **D-16:** Copy should be terse, specific, and grounded in public evidence availability.

### Partial and Degraded Evidence
- **D-17:** Show partial intelligence only for evidence actually present.
- **D-18:** Never imply a clean counted outcome from partial/degraded evidence.
- **D-19:** Degraded states should distinguish inspectable public evidence from complete tactical certainty.

### Test Stance
- **D-20:** Fixture tests should assert each state has distinct copy.
- **D-21:** Tests should prove no state falls through to generic "failed" copy when a specific category exists.
- **D-22:** Tests should prove unavailable states do not render fake tactical analysis or private markers.

### the agent's Discretion
- The agent may choose exact copy strings, helper names, and whether state rendering is table-driven or composed from existing copy helpers, provided every state has distinct public-safe output and limitations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Fixture bands, v1.29 baseline, and no DTO expansion stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Intelligence output model, limitations, and low-signal behavior.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/203-result-page-tactical-summary-and-comparison-model/203-CONTEXT.md` — Result-page visibility and low-signal panel stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/204-replay-timeline-annotation-and-jump-target-workbench/204-CONTEXT.md` — Unsupported replay annotation states.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/205-soldier-status-board-control-terrain-stone-and-action-mix-panels/205-CONTEXT.md` — Tactical panel sparse replay behavior.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — STATE-01 through STATE-06 define Phase 206 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 206 scope and success criteria.

### v1.29 Trust Polish
- `.planning/research/v1.29-SUMMARY.md` — v1.29 public state and replay trust baseline.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 public page proof, unavailable/missing/no-result states, privacy scans, and board realism proof.
- `.planning/milestones/v1.29-REQUIREMENTS.md` — v1.29 completed state coverage and contract boundary.

### State and Copy Source
- `packages/spec/src/match-execution-contract.ts` — Frozen lifecycle states, failure categories, result/replay availability, and privacy exclusions.
- `apps/web/app/matchsets/evidence-copy.ts` — Existing public-safe result evidence copy.
- `apps/web/app/matchsets/result-view-model.ts` — Existing state model and failure/replay availability copy.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Result-page rendering integration.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — Unavailable replay rendering.
- `apps/web/app/matches/types.ts` — Replay unavailable reasons and replay page data types.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Frozen and app-only public fixture source.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing lifecycle/failure/replay availability enums already cover most state categories.
- v1.29 added app-only missing-Chronicle/no-result trust states without changing the frozen contract fixture catalog.
- Existing result/replay unavailable components provide copy and layout hooks for state-specific intelligence messages.

### Established Patterns
- Public result/replay states should use product evidence categories, not internal field names.
- Fixture tests and proof artifacts should scan for private markers.
- Missing evidence states should fail closed and remain useful rather than blank.

### Integration Points
- Phase 206 will likely extend Phase 202 limitations and Phase 203/204 rendering helpers.
- Phase 208 must visually prove representative non-happy states.
- Phase 209 monitors should protect the state taxonomy from drift and private leaks.

</code_context>

<specifics>
## Specific Ideas

- State taxonomy: `queued`, `running`, `degraded`, `runtime_unavailable`, `timeout`, `malformed_runtime_result`, `stale_artifact`, `system_failure`, `strategy_failure`, `blocked`, `no_result`, `missing_chronicle`, `invalid_chronicle`.
- Preferred copy framing: "public evidence is pending/missing/withheld/unusable".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 206-Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States*
*Context gathered: 2026-05-31*
