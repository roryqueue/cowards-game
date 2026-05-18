---
phase: 6
slug: strategy-workshop-ux
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-17
---

# Phase 6 - UI Design Contract

> Visual and interaction contract for the Strategy Workshop UX. Generated for Phase 6 and verified against the UI safety dimensions.

---

## Product Surface

The first screen is the Strategy Workshop itself. Do not build a landing page, marketing hero, or explanatory intro screen.

The Workshop is an operational tool for doctrine authors. It should feel compact, legible, and fast: editor-first, with validation, revisions, templates, and test launch controls close enough to support repeated iteration.

Primary user loop:

1. Pick or keep a doctrine template.
2. Edit Strategy source in Monaco.
3. Read live validation feedback.
4. Submit a valid immutable Strategy Revision.
5. Select a revision.
6. Launch a quick Workshop test MatchSet.
7. Read queued/running/complete status and score summary.

Out of scope for this UI contract:

- Marketing copy.
- Full replay timeline/board viewer.
- Multiplayer matchmaking.
- Multi-strategy management.
- Guided no-code doctrine builder.
- Diff-heavy revision compare view.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | lucide-react if icons are introduced; otherwise none |
| Font | system UI stack: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`; Monaco/editor uses `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace |

No shadcn/Radix setup is required for Phase 6. Use native semantic controls first: `button`, `select`, `input`, `textarea`, `details`, `summary`, and accessible status regions.

If icon buttons are added, use lucide icons and provide `aria-label` or visible text. Do not hand-roll SVG icons.

---

## Layout Contract

### Desktop >= 1180px

Use a full-height workbench with three stable zones:

| Zone | Width | Contents |
|------|-------|----------|
| Left rail | 260px fixed | Template selector, active strategy identity, compact revision list |
| Center editor | `minmax(520px, 1fr)` | Header row, Monaco editor, validation drawer/panel |
| Right rail | 340px fixed | Submit revision form, selected revision details, test match launch, test status/results |

Page shell:

- `min-height: 100dvh`.
- Main workbench max width: none; use the viewport.
- Desktop padding: `16px`.
- Grid gap: `16px`.
- Rails and editor panes have `min-height: calc(100dvh - 32px)`.
- Monaco editor visible height: minimum `520px`; preferred flexible height fills remaining center space.

### Tablet 760px-1179px

Use a two-column layout:

- Center editor spans full width on top.
- Template/revision and submit/test panels sit below in two equal columns.
- Monaco editor minimum height: `460px`.

### Mobile < 760px

Use a single-column layout:

Order:

1. Compact page header.
2. Template selector.
3. Monaco editor.
4. Validation.
5. Submit revision.
6. Revision history.
7. Test launch and status.

Mobile rules:

- Page padding: `12px`.
- Monaco minimum height: `360px`.
- No horizontal overflow at `360px` viewport width.
- Button labels must wrap only at word boundaries; if a control cannot fit, it becomes full width.
- Revision hashes truncate with middle or end ellipsis; full hash appears in a title/tooltip or copyable detail.

---

## Information Architecture

### Page Header

Compact header, not a hero.

Required content:

- Product label: `Coward's Game`
- Surface label: `Strategy Workshop`
- Local identity indicator: `Local Player`
- Optional status chip: `Draft`, `Valid`, `Invalid`, `Submitted`, or `Testing`

Do not include instructional paragraphs explaining how the app works.

### Template Panel

Required controls:

- Template list or select.
- Template names: `Cautious`, `Reckless`, `Sentinel` or equivalent validated doctrine styles.
- Action: `Use template`.

Required states:

- Selected template.
- Unsaved draft warning if applying a template would replace edited source.
- Template validation guarantee: invalid bundled templates must never appear as selectable starters.

### Editor Panel

Required controls:

- Monaco editor with `typescript` or `javascript` language mode.
- Manual action: `Validate source`.
- Draft status text: `Valid draft`, `Invalid draft`, `Not checked`, or `Checking...`.

Editor behavior:

- Live debounced validation starts after edits pause.
- Manual validation is always available.
- Editor should not visually jump when validation results update.
- Do not display line-number-specific fake diagnostics unless the validation report actually contains locations. Current validation reports are source-level, so show source-level issues.

### Validation Panel

Required content:

- Validity summary.
- Error count and warning count.
- Error rows with `severity`, `code`, and `message`.
- Advanced details section with `sourceBytes`, `sourceHash`, `runtimeVersion`, `engineCompatibility.spec`, `engineCompatibility.engine`, and `forbiddenPatterns`.

Primary error row format:

`ERROR · MISSING_DEFAULT_EXPORT` followed by the validation message.

Advanced details should be collapsed or visually secondary by default when errors exist.

### Submit Revision Panel

Required controls:

- Label input.
- Notes input only if implementation adds `notes` to `StrategyRevisionMetadataSchema`; otherwise omit notes from the first UI.
- Primary action: `Submit revision`.

Rules:

- Submit disabled when validation is missing, pending, or invalid.
- Submit disabled while submission is in progress.
- Successful submit appends/prepends the new revision to history and selects it.
- Failed submit displays a specific recoverable message.

### Revision History Panel

Required content per revision:

- Label or fallback `Untitled revision`.
- Created timestamp.
- Short source hash.
- Source bytes.
- Validity.
- Used-in-match count when available.

Required interactions:

- Select revision for Workshop test.
- Load revision source back into draft for editing/reuse. This creates a draft copy, not mutation of the immutable revision.

Do not implement visual diff in Phase 6.

### Test Match Panel

Required controls:

- Revision selector, defaulting to selected/latest valid revision.
- Opponent selector with bundled sample opponents.
- Preset selector with `smoke-v1`, `standard-v1`, `stress-v1` when available.
- Action: `Launch test`.
- Action: `Refresh status` if polling is not continuous.

Required status:

- MatchSet ID.
- Status: `pending`, `running`, `complete`, `failed_system`, `blocked`, or `degraded`.
- Match count.
- Score summary when available: wins/losses/draws, surviving soldiers, survival turns.

Do not show replay board, event timeline, Strategy source for opponents, StrategyMemory, SoldierMemory, or private Chronicle payloads.

---

## Spacing Scale

Declared values must be multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, table cell micro gaps |
| sm | 8px | Control internals, chip gaps |
| md | 16px | Default panel padding, grid gap |
| lg | 24px | Major group separation |
| xl | 32px | Page section breathing room on larger viewports |
| 2xl | 48px | Rare vertical separation only |
| 3xl | 64px | Not used in Phase 6 |

Exceptions: Monaco editor internal spacing may follow Monaco defaults.

Border radius:

- Panels: `8px`.
- Buttons, inputs, selects: `6px`.
- Chips/badges: `999px` only for small status pills.
- Do not nest cards inside cards. Rails/panels are framed work areas; repeated revisions/templates may be list rows, not separate floating cards inside another card.

---

## Typography

Letter spacing is `0`.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.45 |
| Label | 12px | 600 | 1.3 |
| Small/metadata | 12px | 400 | 1.35 |
| Heading | 18px | 700 | 1.25 |
| Page title | 22px | 750 | 1.2 |
| Code/editor | 13px | 400 | 1.5 |

Do not use viewport-scaled font sizes.

Use compact headings inside panels; no hero-scale typography.

---

## Color

Palette must not read as one-note purple, beige, dark slate, or brown/orange. Use neutral ink with cool gray surfaces and restrained semantic accents.

| Role | Value | Usage |
|------|-------|-------|
| App background | `#F4F6F3` | Page background |
| Primary surface | `#FFFFFF` | Editor shell, panels |
| Secondary surface | `#E8ECE6` | Rail backgrounds, selected list rows |
| Border | `#C9D1C5` | Panel/control borders |
| Primary text | `#17201A` | Main text |
| Secondary text | `#58635A` | Metadata, descriptions |
| Accent | `#256D85` | Primary CTA, active selection, focus ring |
| Accent hover | `#1E5A70` | Primary CTA hover |
| Success | `#2F7D46` | Valid states, completed tests |
| Warning | `#9A6B12` | Warnings, pending/running |
| Destructive | `#B42318` | Invalid/error states and destructive actions only |
| Code background | `#101418` | Monaco/editor surrounding surface if dark editor theme is used |

Accent reserved for:

- Primary CTA `Submit revision`.
- Active template/revision selection.
- Focus ring.
- Links to future replay/details if any.

Destructive reserved for:

- Validation errors.
- Failed test states.
- Template replacement warning confirmation only if implemented.

---

## Copywriting Contract

Keep copy focused on the doctrine loop, not generic programming education.

| Element | Copy |
|---------|------|
| Page title | Strategy Workshop |
| Primary CTA | Submit revision |
| Secondary CTA | Validate source |
| Template CTA | Use template |
| Test CTA | Launch test |
| Refresh CTA | Refresh status |
| Empty revision heading | No revisions yet |
| Empty revision body | Submit a valid draft to create the first immutable revision. |
| No selected revision | Select a revision to launch a Workshop test. |
| Valid draft | Valid draft |
| Invalid draft | Invalid draft |
| Checking draft | Checking... |
| Submit blocked | Resolve validation errors before submitting. |
| Test queued | Test queued |
| Test running | Test running |
| Test complete | Test complete |
| Test failed | Test failed; review system status before retrying. |
| Destructive confirmation | Replace draft: this will overwrite the current unsaved source with the selected template. |

Avoid:

- “AI”, “bot”, or “programming tutorial” framing.
- Long how-to paragraphs.
- Claims that Monaco provides full typechecking.
- Claims that a test completed unless worker/status data says so.

---

## Interaction States

### Loading

- Initial page data loading: skeleton rows or quiet `Loading Workshop...` text.
- Monaco loading: stable editor-sized placeholder reading `Loading editor...`.
- Validation pending: `Checking...` chip and previous result may remain visually muted.
- Test launch pending: disable `Launch test` and show `Launching...`.

### Empty

- Empty revisions: show copy from Copywriting Contract plus disabled test launch.
- Empty templates should never occur in production; if it does, show `No templates available` and disable `Use template`.

### Error

- Validation errors use row format with code and message.
- Server/API errors use a panel-level message with a retry path.
- Database unavailable: `Workshop storage is unavailable. Check DATABASE_URL and local services.`
- Worker not running: represent as pending/running status, not as a UI error unless the backend reports failure.

### Success

- Submitted revision: show `Revision submitted` and select the new revision.
- Valid draft: success chip plus advanced hash/byte details.
- Test complete: show score summary, not replay UI.

### Focus and Keyboard

- Every interactive control must be reachable by keyboard.
- Focus ring: `2px solid #256D85`, offset `2px`.
- Buttons must have visible focus and disabled states.
- Monaco keyboard behavior remains Monaco default.

---

## Responsive Safety

Required viewport checks before Phase 6 completion:

- Desktop: 1440x900.
- Laptop: 1180x800.
- Tablet: 820x1180.
- Mobile: 390x844.

At each viewport:

- No text overlaps.
- No panel content spills horizontally outside the viewport.
- Monaco area is visible and editable.
- Header controls do not collide.
- Primary actions remain reachable without hidden horizontal scrolling.
- Validation rows wrap cleanly.

---

## Accessibility Contract

- Use semantic headings in descending order.
- Inputs have visible labels.
- Validation summary uses `role="status"` or `aria-live="polite"`.
- Error list is programmatically associated with the validation panel heading.
- Disabled buttons also provide nearby explanatory text where the reason is not obvious.
- Color is not the only state indicator; include text labels like `Valid`, `Invalid`, `Pending`, `Complete`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed in Phase 6 without a separate review |

No external UI block registries should be used for Phase 6.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-17
