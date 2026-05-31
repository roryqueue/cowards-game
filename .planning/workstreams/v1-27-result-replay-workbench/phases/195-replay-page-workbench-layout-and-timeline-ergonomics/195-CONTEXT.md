# Phase 195: Replay Page Workbench Layout and Timeline Ergonomics - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 195 improves the public replay page workbench layout, timeline scanning, playback ergonomics, focus behavior, mobile usability, and owner/test-only debug treatment. It should keep board realism and public replay evidence central without exposing private Chronicle/debug data or runtime internals by default.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Use strict public/private boundary classification.
- **D-02:** Include desktop/mobile browser evidence for replay UI changes.
- **D-03:** Use plain operational public copy.
- **D-04:** React should render state; reusable replay/timeline derivations should live in non-React helpers where practical.

### Desktop Layout
- **D-05:** Use a board-centered tri-pane workbench layout on desktop.
- **D-06:** The board should remain the dominant central surface because replay inspection is spatial and board realism is a milestone proof goal.
- **D-07:** Metadata/evidence should sit on one side and inspector/event details on the other, with timeline controls below or near the board.

### Timeline Control
- **D-08:** Use a range scrubber plus grouped event list.
- **D-09:** Keep slider/range scrubbing for fast movement through the Match.
- **D-10:** Improve grouped event rows for precise jumps by Round, Activation, Cycle, sequence, and event type.
- **D-11:** Timeline ergonomics should preserve board context while scanning and should not become a raw internal execution log.

### Mobile Layout
- **D-12:** Use a board-first mobile layout with playback/timeline controls sticky or immediately nearby and evidence/inspector sections stacked below.
- **D-13:** Avoid tabs for this phase unless implementation proves the board-first stack cannot meet usability constraints.
- **D-14:** Mobile proof should check stable board dimensions, reachable controls, readable evidence, and no overlapping text or controls.

### Owner Debug
- **D-15:** Keep owner/test-only debug surfaces as gated collapsible secondary panels.
- **D-16:** Owner debug should be hidden by default, available only when server/test gating allows it, and visually secondary to public replay evidence.
- **D-17:** Default public output must not include owner-debug affordances, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, private Awareness Grid details, host/env/token/DB/package details, or private runtime internals.

### the agent's Discretion
- The agent may choose exact grid breakpoints, sticky control behavior, helper filenames, and event-row density as long as the board-centered desktop and board-first mobile decisions hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Carry-forward artifact/taxonomy/visual-proof defaults.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/194-result-page-state-model-and-evidence-readability-pass/194-CONTEXT.md` — Plain operational copy and view-model boundary decisions that influence replay evidence.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — REP-01 through REP-06 define Phase 195 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 195 scope and success criteria.
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md` — Replay workbench findings and watch-outs.

### Replay Source
- `apps/web/app/matches/[matchId]/replay/page.tsx` — Replay route, focus resolution, and owner debug option entry.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Current replay shell, board, timeline, inspector, playback controls, and owner debug rendering.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` — Replay board rendering surface.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Timeline grouping, selected event, inspector, owner debug, and state helpers.
- `apps/web/app/matches/[matchId]/replay/replay-playback.ts` — Playback speed and interval helpers.
- `apps/web/app/matches/replay-ready.ts` — Replay projection, focus, board realism, and public/owner projection boundaries.
- `apps/web/app/matchsets/evidence-copy.ts` — Current replay evidence rows.
- `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` — Existing replay client expectations.
- `apps/web/app/matches/[matchId]/replay/replay-board.test.ts` — Existing board model tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `groupTimelineEntries`, `formatTimelinePosition`, `getCurrentPositionSummary`, and `getTimelineEntryAt` already support grouped timeline inspection.
- `ReplayBoard` already accepts selected sequence, selected Soldier, selected event, and scrubbing state.
- `canShowOwnerDebug`, `getOwnerAwarenessGridInspection`, and owner-private projection handling already provide a gated debug path.
- `replaySpeedOptions` and `getPlaybackIntervalMs` already support playback speed selection.

### Established Patterns
- Replay page is client-rendered with server-provided `ReplayReadyDto`.
- Public replay evidence is separate from owner-debug data.
- Owner debug is currently hidden behind a toggle when available.
- Board realism is validated before ready replay data reaches the client.

### Integration Points
- Layout changes should preserve `data-testid="replay-evidence-panel"` and other useful proof hooks or replace them deliberately.
- Mobile proof should target the public-safe replay fixture URL.
- Any helper extraction should avoid importing server-only or persistence internals into client components.

</code_context>

<specifics>
## Specific Ideas

- Board stays central on desktop and first on mobile.
- Timeline should support both fast scrubbing and precise event jumps.
- Owner debug is allowed as a secondary gated tool, not as part of default public replay.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 195-Replay Page Workbench Layout and Timeline Ergonomics*
*Context gathered: 2026-05-30*
