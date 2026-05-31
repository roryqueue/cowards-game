# Phase 204: Replay Timeline Annotation and Jump-Target Workbench - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 204 adds public-safe replay timeline annotations, jump targets, and lightweight annotation navigation to the existing replay workbench. It should consume Phase 202 intelligence annotations/turning points and support Phase 203 result-page deep links. It must not implement the broader Soldier/board-control/action-mix panels scoped to Phase 205, expose owner debug data, change public DTOs, or infer hidden Strategy intent.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Use Phase 202 annotations and turning points as the data source.
- **D-02:** Result-page previews from Phase 203 should deep-link into this replay focus behavior.
- **D-03:** Public sequence, public timeline, and public board state data only.
- **D-04:** No owner debug payloads, hidden Strategy intent, raw diagnostics, or execution internals.

### Annotation Placement
- **D-05:** Show annotations inline in the existing replay timeline/event list.
- **D-06:** Add a compact `Key Moments` rail or section for quick jumps.
- **D-07:** Do not create a separate annotation page or detached replay report.

### Initial Categories
- **D-08:** Initial supported categories are `FALLEN`, `STONE`, `BACKSTAB`, `PUSH`, `CONTRACTION`, `NO_ADVANCE_CLEANUP`, `DECISIVE_PUSH`, and `LATE_CYCLE_STABILIZATION`.
- **D-09:** Categories should map to public event types, public sequence evidence, or Phase 202 derived public evidence only.
- **D-10:** Unsupported or absent categories should not show empty clutter; the UI should show available moments and limitations.

### Jump Behavior
- **D-11:** Use query-driven focus with `moment` and/or `sequence`.
- **D-12:** Preserve existing fallback behavior when a target is missing, including match-start fallback and moment-not-found states.
- **D-13:** Jump targets should never require owner debug, private Chronicle sections, or execution-internal identifiers.

### Filtering and Emphasis
- **D-14:** Keep controls lightweight.
- **D-15:** Category toggles or segmented chips are acceptable only if they do not crowd mobile.
- **D-16:** If mobile crowding is a risk, prefer annotation emphasis and `Key Moments` navigation over full filtering.

### Annotation Detail
- **D-17:** Each annotation should show category, sequence, Round, Activation, Cycle where available, confidence, and public evidence source.
- **D-18:** Annotation copy should be terse and evidence-based, not coach-like or speculative.
- **D-19:** Confidence and evidence source should help users understand why a moment is highlighted.

### Unsupported Replay States
- **D-20:** Missing, invalid, stale, unavailable, or no-result replay states should explain why annotations are unavailable.
- **D-21:** Do not show an empty timeline or fake tactical annotations for unsupported replay states.
- **D-22:** Unavailable copy should preserve privacy by naming public evidence absence rather than private/internal fields.

### the agent's Discretion
- The agent may choose exact visual affordances, icon/chip labels, ordering of key moments, and whether filters ship in Phase 204 or defer to annotation emphasis if mobile layout is tight.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Signal inventory, v1.29 baseline, fixture bands, and no DTO expansion stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Intelligence view model, turning points, annotations, confidence, and limitations.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/203-result-page-tactical-summary-and-comparison-model/203-CONTEXT.md` — Result-page turning-point previews and replay deep-link expectations.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — REP-01 through REP-06 define Phase 204 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 204 scope and success criteria.

### Replay Workbench Source
- `apps/web/app/matches/types.ts` — Replay focus request/response, timeline entries, replay states, and unavailable replay types.
- `apps/web/app/matches/replay-ready.ts` — Existing moment matching, focus resolution, timeline building, and fallback behavior.
- `apps/web/app/matches/[matchId]/replay/page.tsx` — Replay route query parsing for focus.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Replay timeline, playback controls, event list, inspector, and owner-debug gating.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Timeline grouping, current position, event inspector, Soldier inspector, and owner-only helpers.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — Missing/invalid replay UI state.
- `apps/web/app/globals.css` — Existing replay workbench layout and responsive styling.

### Baseline Proof and Privacy
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 replay trust, unavailable/missing states, board realism, privacy proof, and playback proof.
- `packages/replay/src/project.ts` — Public Chronicle projection sanitization and owner/private separation.
- `packages/spec/src/match-execution-contract.ts` — Frozen replay metadata/evidence DTOs and public privacy exclusions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing replay focus supports moment and sequence requests with fallback handling.
- Existing timeline entries already carry sequence, event type, Round, Activation, Cycle, privacy label, context, and payload.
- Existing replay UI has timeline/event list, current position, playback controls, focus banner, and inspector rails that can host annotations and key moments.

### Established Patterns
- Replay UI should remain workbench-like and responsive, with desktop/mobile proof.
- Owner debug controls are separately gated and should remain absent from default public output.
- Public unavailable states should explain evidence absence without leaking internal/private field names.

### Integration Points
- Phase 204 connects Phase 202 annotation output to replay timeline rendering.
- Phase 203 result turning-point links should resolve through Phase 204 focus behavior.
- Phase 208 will browser-proof desktop/mobile annotation rendering.

</code_context>

<specifics>
## Specific Ideas

- Inline annotation markers plus compact `Key Moments` navigation.
- Initial categories: `FALLEN`, `STONE`, `BACKSTAB`, `PUSH`, `CONTRACTION`, `NO_ADVANCE_CLEANUP`, `DECISIVE_PUSH`, `LATE_CYCLE_STABILIZATION`.
- Prefer annotation emphasis over full filtering if mobile layout gets crowded.

</specifics>

<deferred>
## Deferred Ideas

- Full replay board tactical overlays and broad tactical panels are deferred to Phase 205.

</deferred>

---

*Phase: 204-Replay Timeline Annotation and Jump-Target Workbench*
*Context gathered: 2026-05-31*
