# Phase 11 - UI Review

**Audited:** 2026-05-18  
**Baseline:** `.planning/phases/11-doctrine-debugging-ux/11-UI-SPEC.md`  
**Screenshots:** not captured; no dev server responded on `localhost:3000`, `localhost:5173`, or `localhost:8080`  
**Overall Verdict:** FLAG

---

## Verdict Matrix

| Area | Verdict | Finding |
|------|---------|---------|
| Visual hierarchy | FLAG | Workshop/replay focal areas are structurally present, but sample rows under-teach categories and owner explanation uses the raw-debug panel treatment. |
| Copy | FLAG | Required sample rows, validation empty state, validation heading format, and replay unavailable selector/copy are incomplete. |
| Responsive behavior | FLAG | Grid breakpoints mostly match the spec, but mobile buttons remain at the global 36px minimum instead of the required 44px touch target. |
| Accessibility | FLAG | Text buttons and labels are mostly accessible, but selected sample/timeline states are only visual and replay unavailable lacks the required stable message selector. |
| Privacy-safe public mode | PASS | Public projection/server/client gates omit owner debug data and do not render owner debug UI in public mode. |
| Owner-only debug visibility | PASS | Owner debug requires trusted route options, owner projection data, and an explicit checkbox before rendering. |

---

## Pillar Scores

| Pillar | Score | Verdict | Key Finding |
|--------|-------|---------|-------------|
| 1. Copywriting | 2/4 | FLAG | Required contract copy is missing or altered in validation, samples, and replay unavailable states. |
| 2. Visuals | 3/4 | FLAG | Main hierarchy exists, but sample metadata and owner explanation presentation do not fully match the spec. |
| 3. Color | 3/4 | FLAG | Tokens mostly match, but warning/failure states are not consistently mapped to warning color. |
| 4. Typography | 3/4 | FLAG | Current surfaces include non-contract sizes/weights beyond the Phase 11 typography set. |
| 5. Spacing | 2/4 | FLAG | Breakpoints are mostly correct, but mobile touch targets and some 12px spacing values miss the declared contract. |
| 6. Experience Design | 3/4 | FLAG | Privacy and owner gating are strong; Workshop guidance/sample completeness and unavailable-state selector coverage are incomplete. |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Complete the Sample Strategies contract** - users cannot inspect the required runtime timeout and do-nothing doctrine examples, and rows do not show category chips - add the two missing samples and render category plus `Valid sample`/`Failure mode` chips per UI-SPEC.
2. **Finish validation guidance states** - warnings, exact `ERROR / CODE` formatting, and `No validation issues` empty state are absent - render both errors and warnings through the guidance row component and add the approved empty-state heading/body.
3. **Repair replay unavailable/accessibility details** - the unavailable page lacks `data-testid="replay-unavailable-message"` and mobile buttons remain 36px tall - add the selector to the message wrapper and raise mobile/full-width controls to at least 44px.

## Fix Closure

**Resolved priority fixes:** Added runtime-timeout and do-nothing samples, rendered category plus kind chips, changed validation headings to `ERROR / CODE` and warning-aware rows, added the `No validation issues` state, added the replay unavailable test id, and raised mobile/full-width buttons to a 44px minimum height.

**Resolved accessibility and hierarchy follow-ups:** Template/sample buttons now expose `aria-pressed`; replay timeline rows expose `aria-current="step"` for the selected event; Soldier selector buttons expose `aria-pressed`; and the structured inactivity explanation now uses a distinct panel without raw JSON details.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- FLAG: Validation row heading uses `ERROR · CODE` from `formatValidationIssueHeading`, but the UI-SPEC requires `ERROR / {CODE}` or `WARNING / {CODE}`. See `apps/web/app/workshop/workshop-client-state.ts:30` and render use at `apps/web/app/workshop/workshop-client.tsx:438`.
- FLAG: Validation renders only `validation.errors`; warnings are counted but never rendered as guidance rows, despite the spec requiring warning rows with constraint/remediation copy. See `apps/web/app/workshop/workshop-client.tsx:420` and `apps/web/app/workshop/workshop-client.tsx:426`.
- FLAG: The approved empty state `No validation issues` plus body copy is not rendered when validation has no errors. The validation panel falls through to no list and only status/details. See `apps/web/app/workshop/workshop-client.tsx:416`.
- FLAG: The sample catalog source has 7 rows, not the 8 required rows. `Runtime timeout` and `Do nothing` are missing, and `Stone and blocking` is labeled `Stoning and blocking`. See `packages/persistence/src/workshop.ts:438`.
- FLAG: Required sample row purpose copy is altered. Example: `Basic advance and turn` should say `Advance when clear, otherwise turn to keep facing useful space.`, but source uses `Selects active Soldiers, Advances once, then keeps facing.` See `packages/persistence/src/workshop.ts:440`.
- FLAG: Replay unavailable shell lacks the required `data-testid="replay-unavailable-message"` on the page message. See `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx:14`.
- PASS: Workshop replay availability copy matches the pending/running/failed/blocked/complete-without-Chronicle contract and keeps `Open replay` as the only available link label. See `apps/web/app/workshop/workshop-client-state.ts:179`.

### Pillar 2: Visuals (3/4)

- PASS: Workshop keeps the intended left catalog, center editor/validation, and right submit/test structure. See `apps/web/app/workshop/workshop-client.tsx:274` and grid CSS at `apps/web/app/globals.css:116`.
- FLAG: Sample rows render only one chip, `Valid sample` or `Failure mode`, and do not show the required category chips such as `Movement`, `Push`, `Backstab`, `Stone`, `Runtime violation`, `Invalid output`, or `Do nothing`. See `apps/web/app/workshop/workshop-client.tsx:326` and `apps/web/app/workshop/workshop-client.tsx:343`.
- FLAG: Owner inactivity explanation uses the same dark `replay-debug-panel` treatment as raw debug JSON, reducing hierarchy between structured explanation and advanced raw debug. See `apps/web/app/matches/[matchId]/replay/replay-client.tsx:273` and raw JSON at `apps/web/app/matches/[matchId]/replay/replay-client.tsx:336`.
- PASS: Replay keeps board/timeline in the center and inspector in the right rail at desktop widths. See `apps/web/app/matches/[matchId]/replay/replay-client.tsx:118` and `apps/web/app/globals.css:345`.

### Pillar 3: Color (3/4)

- PASS: Core CSS variables match the UI-SPEC dominant, secondary, accent, destructive, warning, and success colors. See `apps/web/app/globals.css:1`.
- FLAG: Failure-mode sample chips use the default chip color, not warning text color, even though the UI-SPEC requires warning chip text for failure samples. See `apps/web/app/workshop/workshop-client.tsx:345` and `.workshop-chip` CSS at `apps/web/app/globals.css:177`.
- FLAG: Validation guidance styling is destructive-only, with `border-left` and code color always mapped to destructive. Warning validation rows would be visually presented as errors. See `apps/web/app/globals.css:236`.
- PASS: Accent usage is largely reserved for primary controls, active rows, replay links, focus outlines, timeline controls, and status chip text. See `apps/web/app/globals.css:72`, `apps/web/app/globals.css:208`, `apps/web/app/globals.css:290`, `apps/web/app/globals.css:330`, and `apps/web/app/globals.css:452`.

### Pillar 4: Typography (3/4)

- FLAG: Current replay header uses `24px`, which is outside the Phase 11 allowed new sizes of 12, 14, 18, and 22px. See `apps/web/app/globals.css:325`.
- FLAG: Awareness Grid cells use `9px`, also outside the allowed typography set. See `apps/web/app/globals.css:542`.
- FLAG: CSS scan found weights `600`, `650`, and `750` in touched Workshop/replay surfaces. The spec allows only `400` and `700` for new additions, while noting some existing 650/750 may remain until a broader cleanup. See `apps/web/app/globals.css:69`, `apps/web/app/globals.css:152`, and `apps/web/app/globals.css:168`.
- PASS: Body, label, section heading, and page-position sizes are otherwise represented with 14px, 12px, 18px, and 22px. See `apps/web/app/globals.css:43`, `apps/web/app/globals.css:156`, and `apps/web/app/globals.css:420`.

### Pillar 5: Spacing (2/4)

- PASS: Desktop Workshop grid exactly matches `260px minmax(520px, 1fr) 340px`. See `apps/web/app/globals.css:116`.
- PASS: Responsive layout matches the required Workshop and replay breakpoints: two-column Workshop under 1180px, one-column Workshop under 760px, two-column replay under 1180px, and one-column replay under 900px. See `apps/web/app/globals.css:561`, `apps/web/app/globals.css:601`, and `apps/web/app/globals.css:611`.
- FLAG: Mobile/full-width buttons are only widened, not given the required 44px touch target. The global button minimum remains 36px and the mobile rule does not override it. See `apps/web/app/globals.css:65` and `apps/web/app/globals.css:660`.
- FLAG: Several Phase 11 surface values use 12px spacing/padding, which is a multiple of 4 but not one of the declared scale tokens in the UI-SPEC table. See `apps/web/app/globals.css:374`, `apps/web/app/globals.css:431`, `apps/web/app/globals.css:449`, and `apps/web/app/globals.css:613`.

### Pillar 6: Experience Design (3/4)

- PASS: Dirty-draft protection is preserved for both templates and samples with the approved confirmation copy. See `apps/web/app/workshop/workshop-client.tsx:36`, `apps/web/app/workshop/workshop-client.tsx:138`, and `apps/web/app/workshop/workshop-client.tsx:150`.
- PASS: Replay links are gated by `canOpenReplay(match)` and unavailable states render explanatory text instead of dead links. See `apps/web/app/workshop/workshop-client-state.ts:162` and `apps/web/app/workshop/workshop-client.tsx:624`.
- FLAG: Sample catalog is not experience-complete against the UI-SPEC because it omits two required teaching/failure cases and category chips, making the debugging learning path incomplete. See `packages/persistence/src/workshop.ts:438` and `apps/web/app/workshop/workshop-client.tsx:311`.
- FLAG: Selected template/sample/timeline state is visual-only via `.active` or selected index, with no `aria-pressed`, `aria-current`, or equivalent selected-state semantics. See `apps/web/app/workshop/workshop-client.tsx:301`, `apps/web/app/workshop/workshop-client.tsx:318`, and `apps/web/app/matches/[matchId]/replay/replay-client.tsx:196`.
- PASS: Owner debug explanations are hidden until owner data is available and the checkbox is enabled. See `apps/web/app/matches/[matchId]/replay/replay-state.ts:302`, `apps/web/app/matches/[matchId]/replay/replay-client.tsx:258`, and `apps/web/app/matches/[matchId]/replay/replay-client.tsx:271`.

---

## Privacy And Owner Debug

- PASS: Public projection removes private keys including `objective`, `objectivePayload`, `ownerDebug`, `soldierInactivity`, `soldierInactivityExplanations`, `soldierMemory`, `strategyMemory`, `strategySource`, and runtime detail keys. See `packages/replay/src/project.ts:12`.
- PASS: Owner replay options require an enabled trusted environment, explicit `ownerDebug`/`debug` query opt-in, and non-empty `ownerPlayerId`. See `apps/web/app/matches/[matchId]/replay/owner-debug.ts:11` and `apps/web/app/matches/[matchId]/replay/owner-debug.ts:18`.
- PASS: `ReplayReadyDto.ownerDebug` is only included for owner mode with `ownerPlayerId`; public mode returns no owner debug field. See `apps/web/app/matches/replay-ready.ts:126` and `apps/web/app/matches/types.ts:55`.
- FLAG: The structured owner explanation panel renders `JSON.stringify(soldierInactivityExplanation.details)` inside the explanation. The DTO details are intended to be public-safe, but the UI-SPEC says raw JSON belongs only in the advanced debug panel. See `apps/web/app/matches/[matchId]/replay/replay-client.tsx:293`.

---

## Registry Safety

Registry audit skipped: `components.json` is absent, `11-UI-SPEC.md` declares `shadcn_initialized: false`, and no third-party registry blocks are approved.

---

## Files Audited

- `AGENTS.md`
- `.planning/phases/11-doctrine-debugging-ux/11-UI-SPEC.md`
- `.planning/phases/11-doctrine-debugging-ux/11-UI-CHECK.md`
- `.planning/phases/11-doctrine-debugging-ux/11-02-SUMMARY.md`
- `.planning/phases/11-doctrine-debugging-ux/11-03-SUMMARY.md`
- `.planning/phases/11-doctrine-debugging-ux/11-04-SUMMARY.md`
- `.planning/phases/11-doctrine-debugging-ux/11-05-SUMMARY.md`
- `.planning/phases/11-doctrine-debugging-ux/11-06-SUMMARY.md`
- `apps/web/app/globals.css`
- `apps/web/app/workshop/workshop-client.tsx`
- `apps/web/app/workshop/workshop-client-state.ts`
- `apps/web/app/matches/[matchId]/replay/page.tsx`
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts`
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-state.ts`
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx`
- `apps/web/app/matches/replay-ready.ts`
- `apps/web/app/matches/server.ts`
- `apps/web/app/matches/types.ts`
- `packages/persistence/src/workshop.ts`
- `packages/replay/src/project.ts`
- `packages/replay/src/debug-explanations.ts`

---

## Commands Run

- Screenshot safety gate for `.planning/ui-reviews/.gitignore`.
- Dev-server detection on ports `3000`, `5173`, and `8080`; all unavailable.
- Source scans for copy, color, typography, spacing, responsive rules, registry usage, and owner/public debug strings.
