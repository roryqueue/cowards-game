# Phase 254: Public Trust UX Projections - Frontend Pattern Map

**Mapped:** 2026-07-11  
**Scope:** Existing web presentation, typed public-read adapters, responsive behavior, source-contract tests, and Playwright proof relevant to Phase 254.  
**Boundary:** This map identifies composition patterns only. Spec, persistence, and selected-service projections remain authoritative.

## 1. Recommended Composition Shape

Phase 254 should add a small, pure presentation layer over the existing typed public DTOs and then reuse the existing page primitives:

1. Read through `public-service-boundary.ts` or `public-discovery-service.ts`; do not query persistence from React.
2. Convert canonical DTO projections into compact UI rows in pure helpers or view models.
3. Render the primary state in a `status-strip`, use one semantic chip for the categorical state, and put the public explanation/effect in adjacent text.
4. Render evidence totals and stable result/replay links in existing ARIA tables or compact definition lists.
5. Keep replay availability independent from governance/counting state.
6. Test copy and tone in pure projection tests, test required client controls with source-contract tests only where useful, and prove rendered privacy/responsiveness with Playwright.

The closest end-to-end analog is the result page: typed read boundary -> pure view model/copy helpers -> compact status strip -> evidence panels/tables -> browser privacy proof.

## 2. Status Strips, Chips, Tables, and Evidence Rows

### Status strips

- `apps/web/app/globals.css:1353-1362` defines `.status-strip` as a wrapping flex row with an 8px gap, restrained border/background, and compact padding.
- `apps/web/app/ladder/[seasonId]/page.tsx:49-56` uses the strip for lifecycle, resettable standings, no permanent ratings, and entry count.
- `apps/web/app/competitions/[competitionId]/page.tsx:56-62` uses it for competition status, schedule state, and replay coverage.
- `apps/web/app/competitions/[competitionId]/enter/page.tsx:80-83` uses the same primitive for the shared posture's standings scope and durable-rating non-promise.
- `apps/web/app/matchsets/[matchSetId]/page.tsx:115-139` shows the strongest trust hierarchy: lifecycle chip first, lifecycle/availability next, then canonical counted and governance explanations below.

**Reuse:** Lead with one product-facing state chip. Follow with the action/effect that matters, such as entry open/closed or counted/excluded. Put provenance and privacy detail in a secondary paragraph, definition list, or `details` element.

**Avoid:** Do not place every projection field in its own chip. Long explanations inside chips will wrap poorly and make categorical state indistinguishable from policy copy.

### Chips and tones

- `apps/web/app/globals.css:188-217` defines `.workshop-chip`, `.valid`, `.invalid`, `.warning`, and the wrapping `.workshop-chip-row`.
- `apps/web/app/matchsets/evidence-copy.ts:263-276` maps MatchSet execution status to those semantic classes.
- `apps/web/app/globals.css:1590-1600` provides `result-tone-good`, `result-tone-warning`, and `result-tone-danger` for text metrics.
- `apps/web/app/strategies/[strategyId]/page.tsx:58-66` groups validation, readiness, and counted-play labels as compact categorical chips.

**Reuse:** Add a pure Phase 254 state-to-tone helper keyed by canonical counted/governance/availability states. Keep labels from the DTO (`publicLabel`, `publicExplanation`) and use the helper only for presentation tone.

**Trap:** Dynamic class names such as `workshop-chip ${competition.status}` appear at `apps/web/app/public-discovery-components.tsx:103-117`, but CSS only gives special meaning to `valid`, `invalid`, and `warning`. Raw states such as `open`, `active`, `counted`, or `disputed` currently receive neutral styling unless explicitly mapped.

### Tables and compact evidence

- `apps/web/app/globals.css:1272-1318` defines scrollable grid tables, the shared heading row, a five-column standings variant, and a five-column Match ledger variant.
- `apps/web/app/ladder/[seasonId]/page.tsx:85-112` renders ranking, record, and tie-break inputs in the standings table.
- `apps/web/app/ladder/[seasonId]/page.tsx:141-159` renders MatchSet state and result evidence in the Match ledger.
- `apps/web/app/matchsets/[matchSetId]/page.tsx:254-289` and `:328-359` are the result-page equivalents.
- `apps/web/app/matchsets/[matchSetId]/page.tsx:234-252` uses a `details-grid` definition list for evidence labels and values when a full table would be too heavy.
- `apps/web/app/globals.css:1572-1588` defines the compact two-column result metric grid with safe wrapping.

**Reuse:** Extend standing rows with counted MatchSet count, excluded MatchSet count, evidence availability, and ordinary result/replay links from `competitionEvidence`. Use a definition list for one object's trust facts and a table for repeated entrants or MatchSets.

**Trap:** Existing table markup uses `role="table"` and `role="row"` but no `role="cell"` or mobile labels. If Phase 254 adds dense evidence columns, either add accessible cells/headers or provide a compact mobile label pattern; do not rely on visual column order alone.

## 3. Typed Public Service Adapters

### Boundary and page-facing read models

- `apps/web/lib/public-service-boundary.ts:35-44` defines the page-facing `PublicReadMatchSetResultDto` by extending the shared public DTO with lifecycle, current-user context, and safe derived rows.
- `apps/web/lib/public-service-boundary.ts:54-97` derives short hashes, owner-only source links, entrant labels, and Chronicle-backed replay links without altering the authoritative result.
- `apps/web/lib/public-service-boundary.ts:99-145` exposes narrow page reads for MatchSet result, replay metadata, Strategy, Player, and ladder Season.
- `apps/web/lib/public-discovery-service.ts:271-311` composes discovery DTOs from injected typed dependencies and validates them through shared schemas.
- `apps/web/lib/public-discovery-service.ts:414-472` converts a typed ladder Season into public competition detail, but currently drops most counted/standing evidence fields.
- `apps/web/lib/public-discovery-service.ts:475-603` composes signed-in entry state and uses canonical eligibility copy for eligible/ineligible revisions.

**Reuse:** Put repeated trust-row derivation in a pure helper or page-facing read model, not in JSX. Keep canonical state/copy unchanged and derive only display grouping, tones, short labels, and safe links.

**Current gap:** `getPublicCompetitionDetail` maps standings to rank/points/record only at `apps/web/lib/public-discovery-service.ts:447-452`; Phase 254 needs to carry through typed `competitionEvidence` rather than reconstruct evidence from MatchSets in React.

### Backend ownership and validation

- `apps/web/lib/public-service-adapter.ts:62-95` selects TypeScript/Go public-read ownership from topology flags and records a no-fallback policy when Go is selected.
- `apps/web/lib/public-service-adapter.ts:99-105` is the narrow public-read service interface.
- `apps/web/lib/public-service-adapter.ts:141-205` routes each read through the selected client; React pages do not choose a backend.
- `apps/web/lib/public-go-read-client.ts:127-159` constrains evidence links to approved relative result/replay paths.
- `apps/web/lib/public-go-read-client.ts:233-347` leak-scans the raw body, validates error/status parity, parses the shared schema, and only then returns the DTO.
- `apps/web/lib/public-go-read-client.ts:393-487` checks canonical Strategy/Player/Season paths and safe evidence links for the public object reads.

**Reuse:** Any new Phase 254 field should enter through the shared DTO/schema and existing adapter. Preserve `encodeURIComponent` for object IDs and use only links supplied by or deterministically derived from typed public IDs.

**Traps:**

- Do not add a route-local `fetch` in a server component when the public service already owns the read.
- Do not parse canonical competition state from `metadata`; use `result.competition`, `matchSet.countedState`, `matchSet.governance`, and standing `competitionEvidence`.
- Do not expose selected-backend diagnostics or ownership terminology as player copy.
- Do not silently fall back to a second backend when selected Go reads fail.

## 4. Existing Surface Patterns

### Competition index, detail, and entry

- `apps/web/app/public-discovery-components.tsx:68-100` is the reusable MatchSet card: status, evidence label, replay coverage, and ordinary result/replay links.
- `apps/web/app/public-discovery-components.tsx:103-136` is the competition card analog.
- `apps/web/app/competitions/[competitionId]/page.tsx:37-65` composes heading, actions, status strip, and boundary notice.
- `apps/web/app/competitions/[competitionId]/page.tsx:68-145` separates replay coverage, entrants, and standings into full-width sections.
- `apps/web/app/competitions/[competitionId]/enter/page.tsx:69-113` shows the counted-entry path and canonical ineligibility message/remediation.
- `apps/web/app/competitions/[competitionId]/enter/ladder-entry-client.tsx:23-65` models submit state as a closed union and fails with calm public copy.

**Phase 254 fit:** Add public-beta posture and Season lifecycle near the heading; show entry eligibility next to the entry action; keep exhibition separation literal; preserve the current no-nested-card layout.

### Season and standings

- `apps/web/app/ladder/[seasonId]/page.tsx:34-70` is the primary Season trust surface.
- `apps/web/app/ladder/[seasonId]/page.tsx:79-118` renders standings and the no-counted-evidence empty state.
- `apps/web/app/ladder/[seasonId]/page.tsx:120-159` renders entry snapshots and the public MatchSet ledger.
- `packages/spec/src/competition.ts:91-134` supplies lifecycle windows, outcome, stable links, standings, and per-MatchSet counted/governance projections.
- `packages/spec/src/competition.ts:304-328` supplies counted/excluded totals, evidence availability, and stable result/replay links for each standing.

**Phase 254 fit:** Prefer `season.entryWindow.publicLabel`, `season.schedulingWindow.publicLabel`, and `season.outcome.publicExplanation` over hand-written lifecycle text. Add an `id="standings"` anchor because the shared Season contract already publishes `standingsHref`.

**Trap:** The current page prints raw `entry.status`, `matchSet.status`, and IDs at `apps/web/app/ladder/[seasonId]/page.tsx:123-157`. Phase 254 should pair raw identifiers with public labels/explanations and avoid making internal-looking values the primary trust copy.

### Result

- `apps/web/app/matchsets/result-view-model.ts:19-52` defines the reusable view-model shape: label, tone, summaries, sections, and rows.
- `apps/web/app/matchsets/result-view-model.ts:262-393` turns typed lifecycle/evidence into deterministic sections and ledger rows.
- `apps/web/app/matchsets/evidence-copy.ts:39-67` maps per-Match evidence to public labels.
- `apps/web/app/matchsets/[matchSetId]/page.tsx:115-139` already renders typed counted/governance projections.
- `apps/web/app/matchsets/[matchSetId]/page.tsx:234-252` provides a stable `matchset-evidence-panel` browser-test seam.

**Phase 254 fit:** Move counted/governance trust grouping into a pure result trust view model so the result and replay can share presentation semantics without sharing authority.

**Trap:** `apps/web/app/matchsets/result-view-model.ts:228-260` still parses `metadata.countedStatus`. Replace that legacy path with `result.competition?.countedState`; do not extend the metadata convention.

### Replay

- `apps/web/app/matches/[matchId]/replay/replay-client.tsx:84-103` derives public/owner mode and evidence rows before render.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx:140-180` renders a compact replay header/status and a stable `replay-evidence-panel` seam.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx:24-57` is the fail-closed unavailable-state pattern with public reason and next step.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx:391-418` shows how typed metrics and tones are rendered without exposing raw runtime data.

**Phase 254 fit:** Add counted/governance context as a separate typed trust strip or evidence group. Keep `Public view`/`Owner debug` as the replay privacy mode, not as the competition state.

**Trap:** Governance must never decide whether the replay link exists. `PublicCompetitionGovernanceProjection.replayAvailable` reports evidence availability, but Chronicle-backed replay projection remains the authority for the actual link and playback data.

### Player and Strategy

- `apps/web/app/players/[handle]/page.tsx:21-65` renders Strategy cards; `:66-79` renders Season history.
- `apps/web/app/strategies/[strategyId]/page.tsx:47-80` renders validation/runtime/counting chips and public tags.
- `apps/web/app/strategies/[strategyId]/page.tsx:81-126` renders immutable revision/runtime/record facts.
- `apps/web/app/strategies/[strategyId]/page.tsx:127-143` renders bounded result/replay links.
- `packages/spec/src/competition.ts:136-184` is the current Player/Strategy DTO surface.

**Phase 254 fit:** Distinguish counted trial evidence from exhibition/study/self-play with labeled groups or typed evidence summaries. Keep the aggregate record subordinate unless the DTO proves it contains only counted evidence.

**Current contract limitation:** Player results carry counted/governance state, but `PublicStrategyCardDto` only has one aggregate record plus undifferentiated result/replay links. Do not label that record as counted Season performance without extending the shared projection first.

## 5. Responsive CSS Patterns

- `apps/web/app/globals.css:1152-1199` uses `auto-fit` grids, `minmax`, wrapping metrics, and 8px-or-less radii for discovery cards.
- `apps/web/app/globals.css:1222-1256` keeps section headings/actions flexible and compact.
- `apps/web/app/globals.css:1272-1318` gives desktop tables stable minimum widths and column tracks.
- `apps/web/app/globals.css:609-730` gives replay a three-column shell, bounded header status, and a stable square board via `aspect-ratio`.
- `apps/web/app/globals.css:1720-1767` collapses evidence and replay layouts at 900px.
- `apps/web/app/globals.css:1769-1954` stacks headers, cards, metric grids, and tables at mobile width; table text becomes wrapping and headings are hidden.
- `playwright.config.ts:45-68` runs desktop 1440x900, tablet 900x1100, and mobile 390x844 projects.

**Reuse:** Use stable grid tracks with `minmax(0, 1fr)`, `min-width: 0`, wrapping action/status rows, and `overflow-wrap: anywhere` for IDs and public explanations. Keep fixed-format replay/board dimensions governed by `aspect-ratio`.

**Traps:**

- Mobile hides `.app-table-row.heading` at `apps/web/app/globals.css:1944-1946`; new evidence cells need visible per-row labels or an alternate stacked definition-list treatment.
- `.replay-status-chip` uses `white-space: nowrap` at `apps/web/app/globals.css:651-664`; do not place long counted/governance explanations in it.
- Do not add a sixth table column without defining a dedicated grid variant and checking all three Playwright viewports.
- Do not put trust cards inside existing cards or turn full page sections into floating cards.

## 6. Unit and Source-Contract Test Patterns

### Preferred: typed pure projection tests

- `apps/web/app/matchsets/result-view-model.test.ts:11-59` adapts frozen service fixtures into the page-facing read DTO.
- `apps/web/app/matchsets/result-view-model.test.ts:61-149` tests every lifecycle, privacy marker exclusion, tone, and failure precedence against the pure view model.
- `apps/web/app/matchsets/evidence-copy.test.ts:21-139` finds labeled evidence rows and tests public meanings rather than JSX shape.
- `apps/web/lib/public-service-adapter.test.ts` injects route owners/clients to prove selection and no-fallback behavior.
- `apps/web/lib/public-go-read-client.test.ts:383-429` table-tests schema/privacy/divergence/unsafe-link failures through the typed client.

**Reuse:** Table-test all ten counted states and governance states through the UI projection helper. Assert label, tone, standings effect, evidence availability, and links. Serialize the result and scan it for private markers.

### Source-based tests

- `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx:1-49` reads component source to pin required controls and owner-debug gates.
- `apps/web/app/matchsets/[matchSetId]/competition-report-client.test.tsx:1-21` pins bounded intake and rejects client-owned authority/private identity fields.
- `apps/web/app/account/recovery/page.test.tsx:1-15` proves the recovery surface remains policy-only and contains no form/upload affordance.
- `apps/web/app/learn/page.test.ts:1-35` pins required trust/non-claim copy and rejects raw diagnostic/path/provider markers.

**Reuse selectively:** Source tests are appropriate for absence of forbidden controls/imports/fields and the presence of stable accessibility/test hooks. Use typed helper tests for policy wording, state matrices, and tone so harmless JSX refactors do not break the suite.

## 7. Playwright and Browser Proof Patterns

- `apps/web/e2e/v1-31-public-site-spine.spec.ts:3-43` centralizes public privacy markers and relative-link safety checks.
- `apps/web/e2e/v1-31-public-site-spine.spec.ts:45-112` walks discovery, competition, result, learn, Workshop, and account surfaces by role and stable test seams.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts:20-44` enumerates result/replay states and scans rendered bodies.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts:54-94` proves all public result states, replay evidence, interaction, unavailable reasons, and nonblank canvas output.
- `apps/web/e2e/replay.fixture.spec.ts:77-153` proves replay board/timeline/inspector behavior and scans public output for owner-only details.
- `apps/web/e2e/replay.fixture.spec.ts:156-223` proves owner-debug detail is absent by default and appears only after both authorization and explicit opt-in.
- `apps/web/e2e/replay.visual.spec.ts:42-152` decodes canvas PNG pixels instead of trusting element visibility.
- `apps/web/e2e/replay.visual.spec.ts:204-230` rejects blank, clipped, or one-sided board rendering.
- `apps/web/e2e/replay.visual.spec.ts:296-341` combines pixel proof with stable screenshots for scale, Soldier positions, contraction, and event callouts.

**Phase 254 browser matrix:**

- Competition index/detail/entry: public-beta label, exhibition separation, entry window, eligibility message/remediation, reset/no-rating copy.
- Season: lifecycle/window/outcome, counted/excluded totals, evidence availability, tie-break values, safe result/replay links.
- Result: all counted/governance states with calm explanation and standings effect.
- Replay: same trust context while board remains nonblank, canonical start plausible, Soldiers/STONE inside bounds, and private owner/runtime data absent.
- Player/Strategy: counted evidence visibly separated from excluded exhibition/study/self-play evidence.
- Run every layout assertion under desktop, tablet, and mobile projects; check `document.documentElement.scrollWidth <= clientWidth`, visible/non-overlapping trust strips, and readable stacked evidence rows.

## 8. Implementation Traps to Avoid

- Do not create eligibility, lifecycle, counted, governance, scoring, or replay authority in React.
- Do not parse `metadata` for fields now present in typed competition projections.
- Do not infer counted status from `status === "complete"`, a replay link, aggregate points, or provider language.
- Do not imply durable ratings, all-time rank, rating repair, staffed moderation, response deadlines, appeals, or full recovery.
- Do not expose report counts, reporter/operator identity, private report detail, audit payloads, raw diagnostics, Strategy source, memory, objectives, tokens, paths, database details, or runtime internals.
- Do not show source-language/provider details as broad sandbox certification.
- Do not couple replay visibility to review/dispute/invalidation; public replay remains evidence-driven.
- Do not show undifferentiated Player/Strategy aggregate records as counted trial records without a typed split.
- Do not use raw enum values as the only player-facing copy when canonical labels/explanations exist.
- Do not add long text to non-wrapping chips or add table columns without mobile labels and viewport proof.
- Do not weaken selected-service schema, link, privacy, or no-fallback validation for presentation convenience.

## 9. Suggested File Ownership for Planning

- Shared trust presentation helpers: new file near `apps/web/app/public-discovery-components.tsx` or the relevant `result-view-model.ts`; keep them pure and typed.
- Competition composition: `apps/web/lib/public-discovery-service.ts`, competition index/detail/entry pages, and `public-discovery-components.tsx`.
- Season composition: `apps/web/app/ladder/[seasonId]/page.tsx`.
- Result composition: `apps/web/app/matchsets/result-view-model.ts`, `evidence-copy.ts`, and the MatchSet page.
- Replay composition: replay page/types/client only after the typed read DTO carries competition trust context.
- Player/Strategy composition: profile/card pages plus shared DTO/schema extensions if evidence grouping is not already expressible.
- Responsive primitives: `apps/web/app/globals.css`; prefer dedicated trust/table variants over global column changes.
- Verification: focused view-model tests, selective source-contract tests, and a Phase 254 Playwright spec that reuses the existing privacy/link/canvas helpers.

---

*Phase: 254-public-trust-ux-projections*  
*Artifact: existing frontend pattern map for planning*
