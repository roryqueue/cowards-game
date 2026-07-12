# Phase 254 Research

## Scope and Locked Direction

Phase 254 is a projection and composition phase. It should make the existing public-beta competition policy understandable across the public site without moving eligibility, scoring, standings, governance, game-rule, or runtime authority into React.

The implementation should follow this order:

1. Close typed public DTO gaps so every page receives authoritative posture, evidence-origin, counted-state, Season, governance, and evidence-link projections.
2. Render those projections through a small set of compact trust UI patterns across competition, entry, Season, standings, result, replay, player, and Strategy surfaces.
3. Prove representative states at desktop, tablet, and mobile widths while preserving public replay privacy and board realism.

Phase 253 remains the prerequisite for governance projection parity. Phase 255 remains responsible for service-backed end-to-end competition proof, final boundary monitors, and final replay-realism proof. Phase 254 may use deterministic public fixtures for browser coverage, but it must not claim those fixtures are service-backed proof.

## Requirement Interpretation

| Requirement | Phase 254 interpretation |
|---|---|
| TRUST-01 | Every named surface renders policy-backed posture and the trust facts relevant to that surface. It does not mean every page repeats every field. |
| TRUST-02 | Player and Strategy evidence is grouped by authoritative competition origin/counting projection. Runtime eligibility labels are not a substitute for historical evidence classification. |
| TRUST-03 | Result and replay show counted/governance state and public Chronicle availability while source, memory, objective, diagnostics, dispute detail, recovery material, and operator data remain absent. |
| TRUST-04 | Lead with product state and effect. Internal contract names, backend ownership language, raw enum values, and alarming infrastructure prose should not be the primary copy. |
| TRUST-05 | React renders DTO fields and safe presentation formatting only. It must not classify evidence, recompute eligibility, infer standings inclusion, or infer competition origin from runtime/language fields. |

## Existing Authoritative Projections

The core policy contracts already exist and should be reused rather than restated in page-local copy:

- `packages/spec/src/competition-policy-v1-36.ts` owns `public beta trial competition`, resettable Season scope, the no-durable-rating statement, privacy exclusions, and forbidden claims.
- `packages/spec/src/competition-entry-eligibility.ts` owns counted-entry categories, public messages, and remediation.
- `packages/spec/src/competition-season-policy.ts` owns Season lifecycle windows, outcome copy, stable Season/standings links, and reset/no-durable policy.
- `packages/spec/src/competition-counted-state.ts` owns the ten counted states, public explanation, standings effect, evidence availability, and safe reason.
- `packages/spec/src/competition-governance.ts` owns coarse governance status/copy, fair-play expectations, recovery expectations, and governance leak checks.
- `packages/persistence/src/standings-recompute.ts` produces standings rows with counted/excluded MatchSet totals, aggregate evidence availability, and stable result/replay links.
- `packages/spec/src/competition.ts` and `packages/spec/src/schemas.ts` expose most of these fields on Season, MatchSet, standings, player, and Strategy DTOs.

The main Phase 254 problem is not missing policy vocabulary. It is projection loss between those contracts and public pages.

## Exact Surface Gap Matrix

| Surface | Current render and available data | Exact gap | Required Phase 254 projection/rendering | Primary files |
|---|---|---|---|---|
| Competition index | `apps/web/app/competitions/page.tsx` renders generic discovery cards and an internal boundary notice. `PublicCompetitionIndexDtoSchema` carries cards only. | No policy posture, resettable/no-durable statement, Season entry-window state, or exhibition-versus-counted distinction. `BoundaryNotice` displays `public-discovery-v1` and `match-execution-app-v1`, ignores its exclusion-list prop, and reads like internal architecture. | Extend discovery cards/index with a typed trust summary: competition mode, posture label, standings scope, entry state, and evidence scope. Render a calm status strip and short privacy cue; keep technical boundary ids out of primary UI. | `packages/spec/src/public-discovery.ts`; `apps/web/lib/public-discovery-service.ts`; `apps/web/app/public-discovery-components.tsx`; `apps/web/app/competitions/page.tsx` |
| Competition detail | `apps/web/app/competitions/[competitionId]/page.tsx` shows status, schedule label, replay coverage, entrants, flattened standings, and generic MatchSet cards. The ladder source DTO contains much richer lifecycle/counting evidence before discovery mapping. | `getPublicCompetitionDetail` drops Season entry/scheduling windows, outcome, policy, counted-state details, governance, standing evidence totals, and stable Season links. MatchSet cards use lifecycle status and a locally selected evidence string instead of the full counted-state projection. | Give detail a discriminated exhibition/Season trust projection. Ladder detail should render entry/scheduling window, outcome, reset scope, counted/excluded evidence, and counted/governance MatchSet explanations. Exhibition detail should explicitly say evidence is non-standings and self-play/multi-revision is allowed. | `packages/spec/src/public-discovery.ts`; `apps/web/lib/public-discovery-service.ts`; `apps/web/app/public-discovery-components.tsx`; `apps/web/app/competitions/[competitionId]/page.tsx` |
| Counted entry | `apps/web/app/competitions/[competitionId]/enter/page.tsx` already renders the canonical posture and ineligible revision message/remediation. `SignedInCompetitionEntryDashboardDtoSchema` carries authoritative eligibility. | The selected eligible option is reduced to id/label/language before reaching `LadderEntryClient`; its provider-validated message is not shown. The dashboard does not carry the Season entry window/outcome/current entry projection, and accepted state links to generic competition detail rather than the canonical Season link. Exhibition entry contains useful separation copy, but it is page-local rather than represented on the competition card/dashboard trust projection. | Preserve eligibility copy on every option, add typed Season window/current-entry/link fields to the dashboard, show one-entry/no-replacement policy near submit, and render the canonical accepted link. Keep API revalidation authoritative. | `packages/spec/src/public-discovery.ts`; `apps/web/lib/public-discovery-service.ts`; `apps/web/app/competitions/[competitionId]/enter/page.tsx`; `apps/web/app/competitions/[competitionId]/enter/ladder-entry-client.tsx`; `apps/web/app/exhibitions/new/exhibition-client.tsx` |
| Season header/lifecycle | `apps/web/app/ladder/[seasonId]/page.tsx` receives `entryWindow`, `schedulingWindow`, `outcome`, `links`, and policy fields. | The page ignores all three lifecycle projections and hardcodes `Competition Trust Beta`, `Resettable trial standings`, and `No permanent ratings`. The open-Season instruction says to enter from the account page even though the canonical entry flow is under competition entry. | Render policy posture from a typed shared trust projection, both windows, outcome label/explanation, stable links, and a canonical enter link when open. Use `season.statusLabel` only as lifecycle state, not as the whole trust story. | `packages/spec/src/competition.ts`; `packages/spec/src/schemas.ts`; `apps/web/app/ladder/[seasonId]/page.tsx` |
| Season standings | Season standings receive optional `competitionEvidence` with counted/excluded totals, availability, and links. | The page renders only score/record/tie-break inputs. It ignores counted/excluded totals, availability, and result/replay links. `competitionEvidence` is optional even though the canonical Season recompute always supplies it, weakening the UI contract. | Require evidence summary for Season standings (while allowing exhibition result standings to remain a separate shape). Render counted/excluded totals, evidence availability, and compact result/replay links. Preserve the existing tie-break order and do not recompute it in UI. | `packages/spec/src/competition.ts`; `packages/spec/src/schemas.ts`; `packages/persistence/src/standings-recompute.ts`; `apps/go-backend/live_backend.go`; `apps/web/app/ladder/[seasonId]/page.tsx` |
| Season MatchSet ledger | `PublicLadderMatchSetSummaryDto` contains `countedState`, optional `governance`, `resultHref`, and optional `replayHref`. | The page displays `publicExplanation` only, exposes raw execution status, and omits evidence availability, standings effect, governance state, and replay link. Empty/ongoing states are not explained. | Render counted-state label as primary, public explanation/standings effect as secondary, governance only when meaningful, evidence availability, and both stable links. Use calm labels for pending/retrying/degraded/disputed/invalidated states. | `apps/web/app/ladder/[seasonId]/page.tsx`; optional shared trust components under `apps/web/app/` |
| MatchSet result | `apps/web/app/matchsets/[matchSetId]/page.tsx` already reads typed `competition.countedState` and `competition.governance`, and Phase 253 adds reporting. | The page still derives an evidence status from entrant runtime languages when typed competition metadata is absent. That is UI-side classification. It omits Season/posture links and standing evidence totals, prints low-level `scoringPolicy.id`/visibility in the primary strip, and formats governance time with locale-dependent client/server output. `result-view-model.ts` retains infrastructure-heavy lifecycle prose such as orchestration/runtime internals. | Make typed competition trust metadata present for both trial and exhibition results; remove runtime-language fallback classification. Render counted/governance state, evidence availability, standings effect, Season link, reset/no-durable copy when trial, and exhibition scope otherwise. Keep lifecycle detail secondary and product-facing. Use stable `<time dateTime>` presentation. | `packages/spec/src/competition.ts`; `packages/spec/src/schemas.ts`; `packages/persistence/src/competition.ts`; `apps/go-backend/live_backend.go`; `apps/web/app/matchsets/[matchSetId]/page.tsx`; `apps/web/app/matchsets/result-view-model.ts`; `apps/web/app/matchsets/evidence-copy.ts` |
| Replay, ready | `PublicReplayEvidenceServiceDto` contains Chronicle metadata/projection and an execution lifecycle contract. `ReplayReadyDto` carries no MatchSet/Season competition context. Privacy projection and owner-debug gating are already strong. | The replay page cannot show counted state, governance, Season, standings effect, or a result link. `Public-safe projection` is internal phrasing. Fetching or inferring status in `ReplayClient` would violate TRUST-05. | Add optional public competition context to replay evidence: MatchSet id/result link, optional Season id/link, counted-state projection, and governance projection. Thread it through `ReplayReadyDto` and render a compact trust strip above the board. Preserve Chronicle projection and owner-debug boundaries unchanged. | `packages/spec/src/schemas.ts`; `packages/spec/src/service.ts`; TypeScript/Go replay read projection; `apps/web/app/matches/types.ts`; `apps/web/app/matches/server.ts`; `apps/web/app/matches/replay-ready.ts`; `apps/web/app/matches/[matchId]/replay/replay-client.tsx` |
| Replay, unavailable | `ReplayUnavailableDto` shows lifecycle/reason/privacy rows. | It has no public result/competition context and cannot explain whether evidence is pending, degraded, disputed, invalidated, or simply absent. It can direct users only generically to a result page without a link. | Carry the same optional public competition context even when replay evidence is unavailable, ideally through replay metadata/state reads. Render the canonical counted explanation independently from Chronicle availability and link to the MatchSet result. Never expose validation diagnostics. | `packages/spec/src/schemas.ts`; TypeScript/Go replay metadata/state projection; `apps/web/app/matches/types.ts`; `apps/web/app/matches/server.ts`; `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` |
| Public player | `PublicPlayerProfileDto` contains strategies, ladder history, and typed MatchSet summaries. `apps/web/app/players/[handle]/page.tsx` renders strategies and ladder rows only. | The page does not render `profile.results`, points, rank, counted/governance state, or evidence links. `results` incorrectly reuses the ladder-only summary with required `seasonId`; persistence emits `""` for exhibitions, which violates the schema. Ladder-history points are computed as the same all-record total for every Season rather than Season-specific evidence. | Introduce a general public competition evidence summary with optional Season context and authoritative evidence kind. Render counted trial evidence separately from excluded trial, exhibition/study, self-play, and other non-counted evidence. Make ladder history Season-specific and link only to public result/replay pages. | `packages/spec/src/competition.ts`; `packages/spec/src/schemas.ts`; `packages/persistence/src/profiles.ts`; `apps/go-backend/live_backend.go`; `apps/web/app/players/[handle]/page.tsx` |
| Public Strategy | `PublicStrategyCardDto` has one aggregate record plus flat result/replay links. The page renders runtime counted-play eligibility and the aggregate record. | Historical evidence is not grouped by origin/counting. Runtime eligibility can be mistaken for result evidence. `loadPublicRecordsByRevision` uses a local `isCountablePublicStatus` predicate that currently permits pending, retrying, degraded, disputed, and invalidated states and can aggregate non-canonical results. The TypeScript interface requires `runtimeSemantics`, but `PublicStrategyCardDtoSchema` and Go fixtures omit it; selected Go reads can therefore parse a shape that the page cannot safely render. | Replace the local predicate with canonical classified evidence inputs. Add typed evidence groups/rows and distinct labels for counted trial, excluded trial, exhibition/study, and self-play. Align the interface, Zod schema, TypeScript projection, Go projection, fixtures, and page before using runtime semantics. Keep source and private runtime data absent. | `packages/spec/src/competition.ts`; `packages/spec/src/schemas.ts`; `packages/persistence/src/profiles.ts`; `apps/go-backend/live_backend.go`; Go parity fixtures; `apps/web/app/strategies/[strategyId]/page.tsx` |
| Fair-play/recovery cross-links | Phase 253 adds spec-owned fair-play and recovery pages and links from result/account/auth. | Competition index/detail, player, and Strategy surfaces do not yet give a quiet route to current reporting/recovery expectations. Repeating limitation prose everywhere would be noisy. | Add ordinary policy links in relevant action groups and keep full limitation copy on the dedicated pages. Result pages may show the reporting action; other pages should not imply reports alter standings automatically. | `apps/web/app/competitions/page.tsx`; `apps/web/app/competitions/[competitionId]/page.tsx`; `apps/web/app/players/[handle]/page.tsx`; `apps/web/app/strategies/[strategyId]/page.tsx` |

## Required DTO Work Before UI Composition

### 1. Shared public trust projection

Avoid importing several constants into every page and avoid duplicating free-form strings in discovery DTOs. Add a small projection-only contract, either in `competition.ts` or a focused `competition-public-trust.ts`, composed from existing policy contracts:

```ts
interface PublicCompetitionPostureProjection {
  publicLabel: "public beta trial competition"
  standingsScope: "resettable Season-scoped standings"
  durableRatingPromise: "no durable permanent rating promise"
}
```

Use it on Season/trial discovery, entry dashboards, trial results, replay competition context, player history, and Strategy evidence summaries. Exhibition surfaces should receive a separate explicit `standingsEffect`/evidence-scope projection rather than being mislabeled as trial competition.

### 2. Evidence origin and relationship projection

TRUST-02 cannot be satisfied by the ten-state counted classifier alone because `non_competitive` intentionally combines exhibition, study, and other non-trial evidence. Add a public display projection derived by spec/persistence/Go from existing canonical facts, not by React:

- `origin`: `counted_trial | excluded_trial | exhibition | study | other_non_counted`;
- `selfPlay`: boolean, derived from immutable entrant-owner/revision snapshots;
- `publicLabel`, `publicExplanation`, and `standingsEffect` from fixed spec copy;
- optional `seasonId`, `seasonHref`, `resultHref`, and `replayHref`;
- canonical `countedState` and optional `governance` alongside the origin.

Keep self-play orthogonal to origin so a study/exhibition can be labeled self-play without inventing another standings state. A Season id plus counted state distinguishes counted versus excluded trial evidence. For non-Season evidence, the explicit exhibition creation mode/stored state can distinguish verified exhibition from flexible study evidence; ambiguous legacy rows should use `other_non_counted`, not UI guesswork.

### 3. Profile evidence portfolio

Replace the single aggregate Strategy record as the only historical signal with a typed portfolio:

```ts
interface PublicCompetitionEvidencePortfolio {
  countedTrial: PublicEvidenceGroup
  excludedTrial: PublicEvidenceGroup
  exhibition: PublicEvidenceGroup
  study: PublicEvidenceGroup
  selfPlay: PublicEvidenceGroup
  otherNonCounted: PublicEvidenceGroup
}
```

Each group should expose MatchSet count, public record only where meaningful, evidence availability, and safe result/replay links. Do not double-add self-play scores into another visible total; self-play is best rendered as a tagged subset/count. The existing `record` may remain temporarily for compatibility only if it is explicitly the counted-trial record and is generated by canonical classification.

### 4. Replay competition context

Extend both ready evidence and unavailable metadata/state paths with a public-safe competition context. A ready replay must not query the result page from the client, and the client must not derive counted state from lifecycle. The context should be joined/projected server-side from `matches -> match_set_matches -> match_sets`, using only the same fields already allowed by public MatchSet reads plus Chronicle presence.

### 5. Tighten schema parity

- Stop using `PublicLadderMatchSetSummaryDto` for exhibition rows on `PublicPlayerProfileDto.results`; use a general result evidence summary with optional Season context.
- Make Season standing evidence required in `PublicTrialLadderSeasonDtoSchema`, even if generic `PublicStandingDto` keeps it optional for exhibition results.
- Add `runtimeSemantics` to `PublicStrategyCardDtoSchema` and Go fixtures/projections, or remove it from the public interface/page. The current interface/schema split is unsafe under selected Go reads.
- Validate new evidence links as safe relative canonical paths, extending the existing public Go client link checks to profile and replay context links.
- Run leak-safe assertions over the new portfolio and replay context, not only over the outer service envelope.

## UI Composition Guidance

### Shared patterns

Use at most three small reusable components where repetition is real:

- `CompetitionPostureStrip`: posture, Season scope, entry/Season state, no-durable statement.
- `CountedEvidenceStatus`: counted-state label, explanation, standings effect, evidence availability, optional governance status/time.
- `EvidenceLinks`: stable result/replay/Season links with unavailable states.

These components should accept complete typed projections. They must not accept raw statuses and map them to policy copy internally. Color/tone mapping may be presentation-only, exhaustive, and neutral by default; it must not determine counting or severity.

### Copy hierarchy

1. Primary: `Counted`, `Under review`, `Exhibition evidence`, `Entry open`, or similarly direct product state.
2. Secondary: what changes for the user, especially standings effect or next action.
3. Tertiary: evidence availability, timestamp, provenance/privacy detail, and policy links.

Replace or demote internal phrases such as `public-discovery-v1`, `not-match-execution-app-v1`, `Public-safe projection`, raw scoring ids, and orchestration/runtime implementation language. Privacy copy should say what is available and that private Strategy data remains private; it need not enumerate every internal field on every page.

### Layout

- Keep compact status strips and unframed subsections inside the existing 1180px page shell.
- Do not add nested cards. Use tables for standings/ledgers and simple grouped rows for evidence portfolios.
- Keep cards at the existing 8px maximum radius.
- Preserve stable table column widths. On mobile, either retain deliberate table-local horizontal scrolling or switch trust-heavy ledgers to labeled stacked rows; never allow page-level horizontal overflow.
- Use links/buttons only for actions. Counted state, evidence availability, and posture are labels, not controls.
- Keep result reporting visually secondary to result/evidence status.

## Concrete File and Test Map

### Spec/contracts

- **Add or extend** `packages/spec/src/competition-public-trust.ts` / `packages/spec/src/competition.ts` for posture, evidence-origin, evidence-row, evidence-portfolio, and replay-context types plus fixed public copy.
- **Add** focused contract tests for origin/self-play classification, posture copy, exhaustive counted/governance composition, safe links, and forbidden private fields.
- **Modify** `packages/spec/src/public-discovery.ts` for discriminated competition card/detail trust data and richer entry dashboard Season context.
- **Modify** `packages/spec/src/schemas.ts` for discovery, profile portfolio, required Season standing evidence, Strategy runtime-semantics parity, and replay competition context.
- **Modify** `packages/spec/src/service.ts`, `packages/spec/src/service-fixtures.ts`, and `packages/spec/src/service-contract.test.ts` for public read contracts and leak-safe examples.
- **Regenerate** `packages/spec/artifacts/service-api-v1.8.openapi.json` only after handwritten contracts/tests pass.

### TypeScript persistence/projections

- **Modify** `packages/persistence/src/profiles.ts` to remove `isCountablePublicStatus`, classify every row from canonical lifecycle/scoring/Chronicle/governance/Season facts, compute Season-specific ladder history, and build grouped evidence portfolios.
- **Modify** `packages/persistence/src/competition.ts` only as needed to guarantee typed trust metadata for both trial and exhibition result reads.
- **Modify** `packages/persistence/src/ladder.ts` only if required to make Season standing evidence non-optional or expose canonical entry links; do not change recompute semantics.
- **Add/extend tests** in `packages/persistence/src/profiles.test.ts`, `competition.test.ts`, and `ladder.test.ts` for counted-only record totals, excluded-state non-contribution, exhibition/study/self-play grouping, Season-specific history, sorted links, and leak safety.

### Go selected-read parity

- **Modify** `apps/go-backend/live_backend.go` for the same profile portfolio, discovery-source inputs where applicable, Strategy runtime-semantics schema parity, and replay competition context.
- **Add** a focused `public_trust_projection_test.go` or extend counted/governance tests with origin/self-play/profile/replay parity matrices.
- **Regenerate** public player, Strategy, MatchSet, ladder, replay evidence, and replay metadata fixtures/checksums.
- **Keep out of scope** all governance mutations, Strategy execution, and service-backed browser claims.

### Web projections and pages

- **Modify** `apps/web/lib/public-discovery-service.ts` to preserve rather than flatten policy-backed ladder and MatchSet trust fields.
- **Modify** `apps/web/app/public-discovery-components.tsx` and add a focused component test for product-facing boundary/posture/evidence presentation.
- **Modify** competition index, detail, and entry pages plus `ladder-entry-client.tsx`.
- **Modify** `apps/web/app/ladder/[seasonId]/page.tsx` for lifecycle, standings evidence, and MatchSet ledger trust.
- **Modify** result page, `result-view-model.ts`, and `evidence-copy.ts` to remove inference/fallback classification and calm infrastructure-heavy copy.
- **Modify** replay types/server/ready/unavailable/client to thread and render server-projected competition context without touching board/game logic.
- **Modify** player and Strategy pages to render grouped evidence and dedicated policy links.
- **Modify** `apps/web/app/globals.css` only for shared trust rows, evidence groups, and responsive behavior; preserve the established palette and table/card conventions.

### Browser/E2E

- **Add** `apps/web/e2e/v1-36-public-trust-ux.spec.ts` for deterministic projection-backed UI coverage.
- **Extend** the existing fixture adapter or add test-only public fixtures for one open Season, one counted result, one disputed/invalidated result, one degraded/non-counted result, one self-play exhibition, one player portfolio, and one Strategy portfolio. Keep fixture routing explicitly test-only.
- **Reuse** `apps/web/e2e/replay.fixture.spec.ts` and `replay.visual.spec.ts` for replay privacy, nonblank canvas, and board framing checks; add trust assertions without replacing the existing pixel proof.
- **Extend** `apps/web/e2e/v1-31-public-site-spine.spec.ts` only if the shared public-safe link/body helpers are worth reusing; otherwise import/extract a helper to avoid divergent privacy marker lists.

## Responsive and Browser Validation

Use the repository Playwright projects as the baseline:

- desktop: 1440 x 900;
- tablet: 900 x 1100;
- mobile: 390 x 844.

Run all three projects for the new trust UX spec. Run existing replay visual snapshots at desktop and mobile as already configured.

For every named surface:

1. Assert the canonical primary state is visible above or near the affected table/action.
2. Assert the resettable/no-durable statement appears on trial entry/Season/standings contexts, not as a site-wide warning.
3. Assert exhibition/study/self-play evidence is labeled as non-standings evidence.
4. Assert result/replay links are present only when the DTO provides them and that all hrefs remain safe relative paths.
5. Assert representative counted, pending/retrying, degraded, disputed, invalidated, and non-competitive copy is rendered verbatim from fixture projections.
6. Assert no page-level horizontal overflow:

```ts
const overflow = await page.evaluate(() => ({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
}))
expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth)
```

7. For tables, separately assert the table container is visible and locally scrollable when its stable minimum width exceeds mobile width.
8. Check long Strategy names, handles, MatchSet ids, Season names, and the longest counted-state explanation for wrapping/ellipsis without overlapping adjacent controls.
9. Use `toHaveScreenshot` for a small representative set: open Season/standings, disputed result, self-play player portfolio, and replay trust strip with board. Prefer locator screenshots over full-page snapshot sprawl.
10. Preserve replay canvas checks: one visible canvas, nonblank pixels on both halves, board bounds intact, visible Soldier/STONE positions, and a plausible canonical start. Final service-backed realism proof remains Phase 255.

Browser privacy assertions should scan both visible body text and serialized test fixture responses for Strategy source, artifact bytes, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host/env/package paths, tokens, DB details, private runtime fields, reporter/operator identity, report/dispute detail, audit payloads, and recovery evidence. Do not reject calm public phrases such as `Strategy source remains private`; marker checks should target keys/payloads or use allowlisted public policy copy.

## Recommended Verification Commands

Focused contract/projection checks:

```sh
pnpm exec vitest run packages/spec/src/competition-public-trust.test.ts packages/spec/src/public-discovery.test.ts packages/spec/src/service-contract.test.ts packages/persistence/src/profiles.test.ts packages/persistence/src/competition.test.ts packages/persistence/src/ladder.test.ts apps/web/lib/public-discovery-service.test.ts
pnpm --filter @cowards/spec typecheck
pnpm --filter @cowards/persistence typecheck
pnpm --filter @cowards/service typecheck
pnpm --filter @cowards/web typecheck
```

Parity/artifact checks:

```sh
pnpm --filter @cowards/spec contract:generate
pnpm --filter @cowards/spec contract:check
pnpm go:parity:generate
pnpm go:parity
pnpm public-discovery:check
pnpm v1.36:competition-policy:check
```

Browser checks:

```sh
PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=tablet --project=mobile -- v1-36-public-trust-ux.spec.ts
PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile -- replay.visual.spec.ts
PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile -- replay.fixture.spec.ts
```

Quote paths containing bracketed route segments when invoking Vitest directly from zsh.

## Privacy and Authority Boundaries

Public trust projection may include:

- fixed posture, lifecycle, counted-state, governance, evidence-origin, and recovery/fair-play policy copy;
- Season, standings, result, replay, player, and Strategy canonical links;
- coarse evidence availability, public Chronicle hash/provenance already allowed by existing DTOs, public score/record, and public timestamps;
- immutable revision id/hash and coarse public runtime metadata already allowed by existing contracts.

It must not include:

- Strategy source or artifact bytes;
- StrategyMemory, SoldierMemory, objectives, awareness/owner-debug payloads in public mode;
- raw diagnostics, provider stderr, host/env/package paths, tokens, DB details, or private runtime internals;
- reporter identity, report/dispute detail, report counts, dedupe/rate metadata, operator identity/notes, audit before/after payloads, or recovery evidence;
- UI-derived eligibility, standings inclusion, scoring truth, governance authority, or execution behavior.

Owner-debug replay remains an explicit gated owner mode. Phase 254 should not broaden it or use owner fields to enrich public trust UI.

## Main Risks and Mitigations

- **UI becomes classifier:** Current result/profile code already contains local status predicates and runtime-based fallbacks. Remove these and require complete projections before composing pages.
- **Profile totals are misleading:** The current Strategy record predicate admits several non-counted states. Rebuild records from canonical classified evidence and test every state.
- **Selected Go read breaks Strategy page:** Interface/schema/fixture drift around `runtimeSemantics` can produce a parsed response missing a page-required field. Align all layers before page work.
- **Replay trust status diverges from result:** Do not issue a client-side result fetch or duplicate classification. Add one server-projected context used by ready and unavailable replay states.
- **Discovery flattening loses authority:** Expand discovery DTOs rather than reconstructing lifecycle/counting from card status strings.
- **Copy becomes repetitive or alarming:** Use the hierarchy above, reserve full policy limitations for dedicated pages, and keep primary copy short.
- **Responsive tables become unreadable:** Keep stable widths, contain overflow locally, and test long content at 390px.
- **Fixture proof is mistaken for service proof:** Label Phase 254 browser fixtures as deterministic projection fixtures. Phase 255 owns service-backed claims.
- **Privacy scan false positives:** Scan private keys/payloads while allowing approved statements that private data is withheld.
- **Unrelated game/replay regression:** Do not change engine rules or board state. Re-run existing replay visual and pixel checks after adding the trust strip.

## Recommended Plan Split

### 254-01: Typed public trust and evidence portfolios

Add the shared posture/evidence-origin/profile/replay-context projections; fix player/Strategy record classification and Season history; align Zod, TypeScript, Go selected reads, service fixtures, OpenAPI, safe links, and leak tests. This plan should end with no page needing to infer a trust state.

### 254-02: Competition, entry, Season, standings, and result composition

Add the shared compact trust components; preserve rich projections through public discovery; update competition index/detail/entry, Season/standings/MatchSet ledger, and result pages; remove runtime/status fallback classification; add focused component/service tests and calm-copy assertions.

### 254-03: Replay, player, Strategy, and responsive browser proof

Thread replay competition context through ready/unavailable states; render player/Strategy evidence portfolios; add policy links; implement responsive styles; add deterministic desktop/tablet/mobile Playwright coverage and representative screenshots; re-run existing replay pixel/privacy checks and v1.36 policy/artifact checks.

This three-plan split is preferable to two plans because replay/profile contract parity is cross-backend work, while competition/Season page composition is broad UI work. Separating the final browser pass also prevents screenshot churn from masking DTO correctness issues.
