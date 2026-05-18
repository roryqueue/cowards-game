# Phase 7: Replay Viewer and End-to-End Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 7-Replay Viewer and End-to-End Verification
**Areas discussed:** Replay viewport and visual language, Timeline and playback controls, Inspection panels and privacy mode, Workshop-to-replay handoff, End-to-end verification flow

---

## Replay Viewport And Visual Language

| Option | Description | Selected |
|--------|-------------|----------|
| Tactical grid | Clear square grid, compact labels, highly readable. | |
| Animated arena | Still legible, but with smoother motion and more visual atmosphere. | ✓ |
| Minimal debugger | Diagram-like, optimized for exact state inspection. | |

**User's choice:** Animated arena: still legible, but with smoother motion and more visual atmosphere.
**Notes:** Replay should be visually richer than a static debugger while preserving exact state readability.

| Option | Description | Selected |
|--------|-------------|----------|
| Owner color + Soldier ID labels always visible | Maximum identity readability, more board clutter. | |
| Owner color + labels only on hover/selection | Cleaner board, identity requires interaction. | |
| Owner color + small numbered badges | Compact board identity, full details in inspector. | ✓ |

**User's choice:** Owner color + small numbered badges, with full details in the inspector.
**Notes:** Board should identify Soldiers compactly; inspector carries detailed state.

| Option | Description | Selected |
|--------|-------------|----------|
| Strong visual callouts on board and timeline | Makes important events hard to miss. | ✓ |
| Subtle highlights with details in event panel | Cleaner, but less immediately readable. | |
| Strong only for decisive events | Reduces noise but may underplay teaching moments. | |

**User's choice:** Strong visual callouts on the board and timeline.
**Notes:** Key gameplay events should be visible at a glance.

| Option | Description | Selected |
|--------|-------------|----------|
| Brief animations | Movement/push/fall/stone transitions animate briefly. | ✓ |
| Mostly step-based | Exact stepping with tiny transition cues only. | |
| No animation for MVP | Prioritizes exact state clarity over motion. | |

**User's choice:** Yes, brief animations for movement/push/fall/stone transitions.
**Notes:** Animations should support comprehension, not hide canonical state.

---

## Timeline And Playback Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Scrubber timeline | Draggable position is the primary control. | ✓ |
| Step buttons first | Precise navigation first, scrubber second. | |
| Event list first | Event feed drives navigation. | |

**User's choice:** A scrubber timeline with draggable position.
**Notes:** Replay should support fast scanning through the Match.

| Option | Description | Selected |
|--------|-------------|----------|
| Phase -> Round -> Activation -> Cycle -> Event | Maximum hierarchy, more visual complexity. | |
| Round -> Activation -> Event | Cycles shown only when relevant. | ✓ |
| Flat event stream | Simple list with landmark markers. | |

**User's choice:** Round -> Activation -> Event, with cycles shown only when relevant.
**Notes:** Cycle granularity is useful debug detail but should not dominate the default timeline.

| Option | Description | Selected |
|--------|-------------|----------|
| Pause/play plus speed presets | Richer playback controls. | |
| Manual stepping only | Exact and simple, but less replay-like. | |
| Pause/play one speed plus step forward/back | Balanced MVP control set. | ✓ |

**User's choice:** Pause/play at one speed plus step forward/back.
**Notes:** Speed controls can wait.

| Option | Description | Selected |
|--------|-------------|----------|
| Match start | Opens at the canonical beginning. | ✓ |
| First meaningful action | Skips setup. | |
| Final outcome | Starts with result, then rewind/scrub. | |

**User's choice:** At Match start.
**Notes:** Default should preserve the full story from the beginning.

---

## Inspection Panels And Privacy Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Current replay position summary | Shows round, activation, event, active player, status. | ✓ |
| Match overview | Shows players, revisions, arena, seed, outcome/scoring. | |
| Event feed | Shows current and nearby events. | |

**User's choice:** Current replay position summary.
**Notes:** Empty state should orient the user to where they are in the replay.

| Option | Description | Selected |
|--------|-------------|----------|
| Current state facts | Status, position, facing, owner, and legal/state facts. | |
| Soldier timeline | What happened to this Soldier across the Match. | |
| Current state plus recent history | Current state with recent Soldier-specific events. | ✓ |

**User's choice:** Current state plus recent event history for that Soldier.
**Notes:** Selection should answer both "what is true now?" and "what just happened?"

| Option | Description | Selected |
|--------|-------------|----------|
| Separate debug tab/panel | Owner-only Awareness Grid appears in a panel. | |
| Overlay near selected active Soldier | Spatially local debug display. | |
| Both overlay and detailed panel | Compact spatial cue plus full owner-only detail. | ✓ |

**User's choice:** Both: compact overlay plus detailed owner-only panel.
**Notes:** Owner debug should support spatial understanding and detailed inspection.

| Option | Description | Selected |
|--------|-------------|----------|
| Public default + owner/debug toggle | Privacy-safe default; explicit debug access when available. | ✓ |
| Owner/debug default for local Workshop | Useful locally, but less privacy-safe. | |
| Public only for MVP | Simpler, but defers Awareness Grid debug. | |

**User's choice:** Public view, with an explicit owner/debug toggle when owner data is available.
**Notes:** Preserve public projection as the default surface.

---

## Workshop-To-Replay Handoff

| Option | Description | Selected |
|--------|-------------|----------|
| Workshop test panel | Replay links appear after a MatchSet completes. | ✓ |
| Revision history | Replay links appear next to revisions used in matches. | |
| Dedicated Match history area | Creates a broader local history surface. | |

**User's choice:** In the Workshop test panel after a MatchSet has completed.
**Notes:** Keep first replay entry point in the existing test loop.

| Option | Description | Selected |
|--------|-------------|----------|
| Best single replay plus aggregate score | Quick highlight path. | |
| Full Match list | Show every Match with status/outcome and replay links. | ✓ |
| Aggregate first, expandable Matches | Compact default with drill-down. | |

**User's choice:** Full list of Matches with status/outcome and replay links.
**Notes:** User wants direct access to all constituent Match replays.

| Option | Description | Selected |
|--------|-------------|----------|
| Show completed replays and mark failures | Completed data remains usable in degraded sets. | ✓ |
| Hide links unless full set completed | Avoids partial results, but wastes usable replays. | |
| Prioritize failed job debugging | More operational, less replay-focused. | |

**User's choice:** Show completed Match replays and clearly mark failures.
**Notes:** Degraded MatchSets should not hide valid replay artifacts.

| Option | Description | Selected |
|--------|-------------|----------|
| `/matches/{matchId}/replay` | Direct Match-centered URL. | ✓ |
| `/workshop/matches/{matchId}/replay` | Workshop-scoped route. | |
| `/workshop/tests/{matchSetId}/matches/{matchId}` | MatchSet-scoped route. | |

**User's choice:** Direct match URLs, like `/matches/{matchId}/replay`.
**Notes:** Route should remain canonical outside Workshop.

---

## End-To-End Verification Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Real local services and worker path | Submit revision, create MatchSet, run worker, open replay. | |
| Seeded completed Match fixture | Stable replay viewer checks. | |
| Both fixture and real smoke E2E | Fixture for stable UI checks, real path for one smoke path. | ✓ |

**User's choice:** Both: fixture for stable replay UI checks, real path for one smoke E2E.
**Notes:** Balance reliable UI checks with proof that the real local loop works.

| Option | Description | Selected |
|--------|-------------|----------|
| Board and timeline only | Basic render and navigation proof. | |
| Board, timeline, inspector, and handoff | Covers the core user-facing replay path. | ✓ |
| Full visual checks for key events | More exhaustive but heavier. | |

**User's choice:** Board, timeline, inspector, and replay link handoff all work.
**Notes:** Exhaustive event-specific visual coverage can be deferred.

| Option | Description | Selected |
|--------|-------------|----------|
| Inline/test-mode worker logic | No long-running worker process needed. | ✓ |
| Require local worker app running | Closer to production but more brittle locally. | |
| Precomputed Chronicle only | Stable but does not prove worker path. | |

**User's choice:** Trigger worker logic inline/test-mode so no long-running process is needed.
**Notes:** Playwright should not depend on a separate worker daemon.

| Option | Description | Selected |
|--------|-------------|----------|
| Part of normal `pnpm verify` | Strong default gate, but requires services/browser. | |
| Separate `pnpm e2e` command | Clear service/browser boundary. | ✓ |
| Fixture in verify, service E2E separate | Split coverage. | |

**User's choice:** Separate command like `pnpm e2e` because it needs services/browser.
**Notes:** Keep service-backed browser E2E out of the normal verify loop.

## the agent's Discretion

- Exact component boundaries, route handler structure, data API shape, board colors, icon shapes, animation timing, and fixture/test helper shape are left to planning and implementation.

## Deferred Ideas

- Speed presets and richer playback controls.
- Exhaustive visual checks for every event type.
- Ranked match history, public sharing, spectator tooling, and social replay distribution.
- Strict exhaustive Chronicle grammar and replay verification hardening.
