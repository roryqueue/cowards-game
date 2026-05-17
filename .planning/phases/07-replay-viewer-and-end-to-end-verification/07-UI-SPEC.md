---
phase: 7
slug: replay-viewer-and-end-to-end-verification
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-17
---

# Phase 7 - UI Design Contract

> Visual and interaction contract for the Replay Viewer and end-to-end replay verification phase.

---

## Product Surface

The first screen at `/matches/{matchId}/replay` is the replay tool itself. Do not build a landing page, marketing hero, or explanatory intro screen.

The replay viewer is an analysis workbench for deterministic autonomous Matches. It should feel like an animated arena wrapped by exact inspection tools: visually alive enough to show conflict and tempo, but dense, precise, and trustworthy enough to debug doctrine behavior.

Primary user loop:

1. Open a completed Match replay from a direct Match URL or the Workshop test panel.
2. Scrub or step the timeline from Match start.
3. Watch board state, Soldier status, facing, TerrainStones, bounds, and Contraction update.
4. Select Soldiers or timeline events.
5. Inspect current position, recent Soldier events, public event details, and owner-only Awareness Grid data when explicitly enabled.
6. Return to Workshop context or continue scanning Matches from the completed MatchSet list.

Out of scope for this UI contract:

- Ranked/global Match history.
- Public sharing and spectator pages.
- Marketing copy.
- Arbitrary MatchSet builder.
- Full visual debugger product beyond first replay/inspection surface.
- Exhaustive visual regression for every legal event sequence.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | `lucide-react` if icons are introduced; playback controls should use recognizable play, pause, step, rewind, debug, and info icons with accessible labels |
| Font | system UI stack: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`; numeric/timeline metadata uses `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace |
| Canvas renderer | PixiJS through a browser-only Client Component |

No shadcn/Radix setup is required for Phase 7. Use native semantic controls first: `button`, `input[type="range"]`, `select`, `details`, `summary`, and accessible status regions.

If icon-only controls are used, each must have `aria-label` and a tooltip/title. Use text plus icon for primary commands when space allows. Do not hand-roll SVG icons when a lucide icon exists.

---

## Layout Contract

### Desktop >= 1180px

Use a full-height replay workbench with three stable zones:

| Zone | Width | Contents |
|------|-------|----------|
| Left rail | 300px fixed | Match metadata, replay position summary, MatchSet Match list when opened from Workshop |
| Center arena | `minmax(560px, 1fr)` | Replay board canvas, compact board header, timeline scrubber, playback controls |
| Right rail | 360px fixed | Inspector, selected Soldier/event details, owner/debug Awareness Grid panel |

Page shell:

- `min-height: 100dvh`.
- Main workbench max width: none; use the viewport.
- Desktop padding: `16px`.
- Grid gap: `16px`.
- Rails and center pane have `min-height: calc(100dvh - 32px)`.
- Replay board area uses a stable aspect ratio derived from the board bounds, with `min-height: 520px` and no layout shift when timeline state changes.
- Timeline controls sit directly below the board and remain visible without scrolling on a 900px-tall desktop viewport.

### Laptop / Narrow Desktop 900px-1179px

Use a two-column layout:

- Center arena spans full width on top.
- Inspector and Match metadata sit below in two equal columns.
- Replay board minimum height: `460px`.
- Timeline remains attached to the board, not moved into a sidebar.

### Tablet 760px-899px

Use a single-column main flow with sticky compact playback controls if needed:

1. Replay header and status.
2. Board canvas.
3. Timeline scrubber and playback controls.
4. Inspector.
5. Match list / metadata.

Replay board minimum height: `420px`.

### Mobile < 760px

Use a single-column layout:

1. Compact replay header.
2. Board canvas.
3. Timeline scrubber.
4. Playback controls.
5. Current position summary.
6. Inspector.
7. Match list / metadata.

Mobile rules:

- Page padding: `12px`.
- Replay board minimum height: `360px`.
- No horizontal overflow at `360px` viewport width.
- Controls wrap into two rows if needed; no button text may overflow its parent.
- Long IDs truncate with middle or end ellipsis; full IDs appear in copyable details or title text.

---

## Information Architecture

### Replay Header

Compact header, not a hero.

Required content:

- Product label: `Coward's Game`
- Surface label: `Replay`
- Match ID, shortened by default with full ID available.
- Status chip: `Public`, `Owner debug`, `Complete`, `Degraded`, `Failed system`, or `Replay unavailable`.
- Optional breadcrumb/action back to Workshop when the replay was opened from a Workshop MatchSet.

Do not include instructional paragraphs explaining how replay works.

### Replay Board

Required visible states:

- ACTIVE Soldier.
- STONE Soldier.
- FALLEN Soldier marker or absence with recent fall callout.
- TerrainStone.
- Board bounds.
- Contraction boundary.
- Facing direction for Soldiers where facing is known.
- Owner distinction.
- Selected Soldier.
- Current or recent event callout.

Soldier visual contract:

- Owner color plus small numbered badge is always visible.
- Full Soldier ID is not always visible on the board; it appears in the inspector and hover/selection detail.
- Facing should be a clear arrow, notch, or wedge that remains legible at mobile size.
- ACTIVE and STONE must differ by both color/value and shape/texture; do not rely on color alone.
- FALLEN should be represented by a brief animation/callout and inspector history, not as an occupied square.

Event callout contract:

| Event | Board Treatment | Timeline Treatment |
|-------|-----------------|--------------------|
| Backstab | Strong red strike/cut line or burst from attacker to victim | Red marker labeled `Backstab` |
| Push | Amber directional shove arrow between Soldiers | Amber marker labeled `Push` |
| Fall | Violet/drop marker at edge or former square | Violet marker labeled `Fall` |
| Stoning | Gray crystallize/freeze pulse on Soldier square | Gray marker labeled `Stone` |
| Blocked movement | Short blocked arrow and wall/impact tick | Muted marker labeled `Blocked` |
| Contraction | High-contrast bounds pulse and trimmed-board emphasis | Dark marker labeled `Contraction` |
| Runtime violation | Destructive warning marker tied to Soldier/activation | Destructive marker labeled `Runtime violation` |
| Terminal outcome | Final outcome banner/chip above board | Final marker labeled `Outcome` |

Animation contract:

- Movement, push, fall, and stoning animations should be brief: target 180-320ms.
- Animation is display-only interpolation. Canonical state always comes from the selected replay sequence.
- Scrubbing should snap immediately to canonical state and may skip animations while dragging.
- Pause/play at one speed should animate event-to-event transitions without changing event order.

### Timeline And Playback

Required controls:

- Draggable scrubber as primary control.
- Step backward.
- Play / Pause toggle.
- Step forward.
- Current position label.

Timeline grouping:

- Default visible hierarchy: Round -> Activation -> Event.
- Cycle detail appears only when the selected event has `cycleIndex`, an Awareness Grid observation, an action emission, or a runtime violation.
- Timeline should show landmark markers for Round starts, Activation starts, Contraction, and Match end.

Default state:

- Replay opens at Match start.
- If a Chronicle is missing or invalid, show a replay-unavailable state instead of a blank board.

### Inspector

Default inspector content:

- Round.
- Activation.
- Current event type.
- Active player or side where known.
- Current replay status.
- Match outcome if terminal.

Selected Soldier content:

- Short Soldier label/number.
- Full Soldier ID.
- Owner.
- Status.
- Position or `FALLEN`.
- Facing.
- Last successful move direction when available.
- Recent Soldier-specific event history.

Selected event content:

- Event type.
- Sequence.
- Round/Activation/Cycle context when available.
- Public payload fields.
- Clear privacy label: `Public event` or `Owner-only debug available`.

Owner/debug content:

- Replay defaults to public view.
- Owner/debug toggle is explicit and visible only when owner data exists.
- Exact Awareness Grid may appear as both:
  - compact board-adjacent overlay near the selected/active Soldier;
  - detailed panel in the inspector.
- Owner/debug mode must not imply both players' private data is visible. Show the selected owner/player identity.

### Workshop Handoff

When the Workshop test panel shows a completed or degraded MatchSet:

- Show the full Match list, not only aggregate scoring.
- Each Match row shows status, compact outcome, and replay availability.
- Completed Matches with stored Chronicles link to `/matches/{matchId}/replay`.
- Failed/system Matches show failure status and no broken replay link.
- Degraded MatchSets keep completed replay links visible while marking failures clearly.

---

## Spacing Scale

Declared values must be multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, timeline ticks, inline badges |
| sm | 8px | Control internals, compact rows, board label padding |
| md | 16px | Default panel padding, grid gap |
| lg | 24px | Major panel grouping, board-to-timeline gap |
| xl | 32px | Page-level breathing room on large viewports |
| 2xl | 48px | Rare vertical separation only |
| 3xl | 64px | Not used in Phase 7 |

Exceptions: Pixi canvas internals may use board-cell-derived dimensions and animation coordinates.

Border radius:

- Workbench panels: `8px`.
- Buttons, inputs, selects: `6px`.
- Board canvas frame: `8px`.
- Chips/badges: `999px` only for small status pills.
- Do not put cards inside cards. Repeated Match rows and event rows are list rows inside panels, not floating nested cards.

Stable dimensions:

- Board container must define `min-height`, `aspect-ratio` or measured dimensions, and `overflow: hidden`.
- Playback icon buttons use square `36px` or `40px` dimensions so state changes do not resize controls.
- Timeline scrubber row height must remain stable while labels change.

---

## Typography

Letter spacing is `0`. Do not scale font size with viewport width.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.45 |
| Label | 12px | 600 | 1.3 |
| Small/metadata | 12px | 400 | 1.35 |
| Timeline tick | 11px | 600 | 1.2 |
| Heading | 18px | 700 | 1.25 |
| Page title | 22px | 750 | 1.2 |
| Board badge | 12px | 750 | 1 |

Rules:

- No hero-scale text inside the replay workbench.
- Monospace is reserved for IDs, hashes, sequence numbers, and raw-ish debug payload labels.
- Long IDs must wrap or truncate without overlapping adjacent content.

---

## Color

Base palette should extend the existing Workshop colors without becoming a one-hue interface.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#f4f6f3` | App background |
| Surface | `#ffffff` | Panels, controls |
| Secondary (30%) | `#e8ece6` | Subtle rows, inactive timeline areas |
| Border | `#c9d1c5` | Panel/control borders |
| Text | `#17201a` | Primary text |
| Text secondary | `#58635a` | Metadata, muted copy |
| Board background | `#101418` | Pixi arena background |
| Board grid | `#2d3735` | Board cells/grid lines |
| Accent (10%) | `#256d85` | Primary action, bottom/local owner color, focus |
| Accent hover | `#1e5a70` | Primary action hover |
| Opponent owner | `#b65a3a` | Top/opponent owner color |
| Stone | `#7d8580` | STONE Soldiers |
| TerrainStone | `#46514c` | TerrainStone obstacles |
| Success | `#2f7d46` | Complete/success statuses |
| Warning | `#9a6b12` | Degraded/pending warnings |
| Destructive | `#b42318` | Failed/system/runtime violation states |
| Backstab | `#d1403f` | Backstab callouts only |
| Push | `#b8872c` | Push callouts only |
| Fall | `#6e5acb` | Fall/off-board callouts only |
| Contraction | `#111827` | Contraction boundary emphasis |

Accent reserved for:

- Primary actions.
- Focus ring.
- Local/bottom owner identity.
- Active timeline position.
- Selected row/border state.

Do not use the accent color for every interactive element. Secondary buttons remain neutral unless selected.

Accessibility:

- Status must never be communicated by color alone; pair with text, icon, shape, or line style.
- Backstab/push/fall/stone/contraction callouts must differ by label and shape/line treatment, not just color.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title | `Replay` |
| Product label | `Coward's Game` |
| Primary CTA | `Open replay` |
| Playback primary | `Play replay` / `Pause replay` |
| Step controls | `Step back` / `Step forward` |
| Empty inspector heading | `Match start` |
| Empty inspector body | `Scrub or step through the timeline to inspect board state and events.` |
| No replay heading | `Replay unavailable` |
| No replay body | `This Match does not have a stored Chronicle yet.` |
| Public mode label | `Public view` |
| Owner mode label | `Owner debug` |
| Owner toggle helper | `Owner debug reveals local private replay data for the selected owner.` |
| Missing owner data | `Owner debug data is not available for this replay.` |
| Degraded MatchSet copy | `Some Matches failed, but completed replays are available.` |
| Runtime violation label | `Runtime violation` |
| Destructive confirmation | None required in Phase 7 |

Copy rules:

- Avoid teaching paragraphs in the main UI.
- Use direct nouns and verbs: `Open replay`, `Refresh status`, `Owner debug`, `Step forward`.
- Error states must say what happened and what the user can do next.

---

## Responsive And Canvas Verification Contract

Required browser checks before Phase 7 sign-off:

| Viewport | Expected Result |
|----------|-----------------|
| 1440x900 | Three-zone workbench fits without vertical control loss; board and timeline visible together |
| 1180x800 | Board remains nonblank; left/right rails fit or collapse without overlap |
| 820x1180 | Single-column/tablet layout keeps board, timeline, and inspector readable |
| 390x844 | No horizontal overflow; controls wrap cleanly; board remains usable |

Canvas-specific checks:

- Pixi canvas is nonblank after first render.
- Canvas resizes with its container.
- Soldier badges render inside board bounds.
- Timeline state changes update board state.
- Scrubbing does not leave stale animation artifacts.
- Public mode screenshots do not show owner-only Awareness Grid panels.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed without explicit review |

Do not add third-party visual component registries in Phase 7. PixiJS and Playwright are functional dependencies, not UI block registries.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-17
