# Phase 7: Replay Viewer and End-to-End Verification - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 delivers the first visible replay experience and proves the full local edit-to-replay loop. A user should be able to open a completed Match at a direct replay URL, inspect a readable animated board replay driven by persisted Chronicle data, scrub or step through meaningful replay positions, inspect Soldier/event details including owner-only Awareness Grid debug data when available, and rely on automated E2E coverage for the Workshop -> MatchSet -> execution -> replay path.

This phase is about replay viewing and verification. It is not ranked match history, public sharing, spectator tooling, arbitrary MatchSet building, advanced Chronicle grammar hardening, visual debugger as a full product, or multiplayer/social replay distribution.

</domain>

<decisions>
## Implementation Decisions

### Replay Viewport And Visual Language

- **D-01:** Use an animated arena feel for the replay board while keeping legibility ahead of spectacle. The board should feel alive enough to communicate movement and conflict, but the exact state must remain readable.
- **D-02:** Use PixiJS/canvas for the replay renderer, consistent with the roadmap note, and treat React panels/controls as surrounding UI rather than the primary board renderer.
- **D-03:** Soldiers should be distinguished by owner color plus small numbered badges. Full Soldier identity, status, owner, position, facing, and recent history belong in the inspector rather than always occupying board space.
- **D-04:** Important gameplay events, especially Backstabs, pushes, falls, stoning, blocked movement, Contraction, terminal outcome, and runtime violations, should receive strong callouts on both the board and timeline.
- **D-05:** Playback should include brief animations for movement, pushes, falls, and stoning. Animations must be short, deterministic-looking, and never obscure the canonical timeline position.

### Timeline And Playback Controls

- **D-06:** The primary timeline control is a draggable scrubber. Users should be able to quickly drag through the Match and see the board state update.
- **D-07:** Timeline grouping should be Round -> Activation -> Event, with Cycle detail shown only when relevant. Avoid making Cycle granularity dominate the default experience unless the current event or debug view requires it.
- **D-08:** MVP playback supports pause/play at one speed plus step forward/back. Speed presets and richer playback controls can wait until the first replay surface is proven.
- **D-09:** A replay opens at Match start by default, not final outcome or first action.

### Inspection Panels And Privacy Mode

- **D-10:** When nothing is selected, the inspector shows the current replay position summary: Round, Activation, current event, active player or side where known, and replay/match status.
- **D-11:** When a Soldier is selected, the inspector shows current state plus recent event history for that Soldier. It should not force the user to scan the full event feed to understand what just happened to a selected Soldier.
- **D-12:** Owner-only Awareness Grid debug should support both a compact board-adjacent overlay near the selected/active Soldier and a detailed owner-only panel.
- **D-13:** The replay viewer defaults to public view. If owner data is available, expose an explicit owner/debug toggle rather than silently starting in a private debug mode.
- **D-14:** Public replay must preserve Phase 3 privacy boundaries: no strategy source, StrategyMemory, SoldierMemory, objective payloads, exact Awareness Grids, or raw runtime details by default. Owner/debug mode remains scoped to the local/owning player data.

### Workshop-To-Replay Handoff

- **D-15:** The first replay entry point appears in the Workshop test panel after a MatchSet has completed. This keeps the user flow anchored in the Phase 6 Workshop rather than creating a separate match-history product.
- **D-16:** Completed MatchSets should show a full list of Matches with status/outcome and replay links. Do not only surface one "best" replay.
- **D-17:** Degraded MatchSets should still show replay links for completed Matches and clearly mark system failures or unavailable replays for failed Matches.
- **D-18:** Direct replay URLs should use `/matches/{matchId}/replay`. Keep URLs Match-centered so replay can later be reached from Workshop, history, sharing, or other surfaces without changing the canonical route.

### End-To-End Verification

- **D-19:** Use both verification paths: fixture-backed replay UI checks for stable board/timeline/inspector assertions, plus one real smoke E2E path for submit revision -> create MatchSet -> execute -> open replay.
- **D-20:** Visual/browser assertions should prove the replay link handoff, board rendering, timeline controls, and inspector behavior work. Do not require exhaustive visual checks for every event type in the first MVP.
- **D-21:** Playwright should trigger worker execution inline or through a test-mode execution helper so the E2E path does not depend on a separately running long-lived worker process.
- **D-22:** Service/browser-backed E2E should live behind a separate command such as `pnpm e2e`, because it needs services and a browser. Normal package/unit verification can still cover fixture-backed replay utilities and component-level behavior.

### the agent's Discretion

- Planning may choose exact component boundaries, route handler organization, helper naming, and the smallest practical data API shape as long as the replay viewer consumes persisted Chronicle/replay data rather than re-executing strategies or engine transitions.
- Planning may choose exact board colors, icon shapes, animation timing, and timeline styling, provided the result honors the decisions above and stays readable on desktop and mobile.
- Planning may decide whether the first implementation uses a seeded completed Match fixture, a local test endpoint, or a small test-mode helper to make the fixture-backed replay checks stable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements And Roadmap

- `.planning/PROJECT.md` — Core value, Chronicle-first product principles, PixiJS/canvas stack direction, privacy boundaries, and determinism constraints.
- `.planning/REQUIREMENTS.md` — Canonical requirement IDs for VIEW-01 through VIEW-07 and TEST-06.
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, and replay-specific notes.
- `.planning/STATE.md` — Current workflow state and completed phase history.
- `.planning/config.json` — GSD workflow preferences and mode settings.

### Source Specifications

- `./CowardsGameSpec_Full_Consolidated_v1.md` — Canonical gameplay rules, entities, event semantics, replay expectations, and UX/product principles.
- `./CowardsGame_Technical_Architecture_Spec_V1.md` — Technical architecture direction, replay package responsibility, Canvas/PixiJS recommendation, local services, and E2E testing expectations.
- `.planning/spec-amendments/02-backstab-rule.md` — Backstab rule amendment, including the broad "begins or ends activation directly behind an enemy" rule that replay callouts should communicate clearly.

### Upstream Phase Context

- `.planning/phases/06-strategy-workshop-ux/06-CONTEXT.md` — Workshop loop, MatchSet test panel, local identity, and explicit deferral of full replay UI to Phase 7.
- `.planning/phases/06-strategy-workshop-ux/06-UI-SPEC.md` — Current Workshop design contract and responsive UI constraints that Phase 7 should respect when adding replay entry points.
- `.planning/phases/06-strategy-workshop-ux/06-REVIEW.md` — Recent Workshop review fixes, especially canonical plural test APIs, Workshop revision eligibility, and storage fallback behavior.
- `.planning/phases/05-match-orchestration-and-persistence/05-CONTEXT.md` — Match/MatchSet creation, immutable matrices, job status semantics, Chronicle storage, scoring, and degraded MatchSet behavior.
- `.planning/phases/05-match-orchestration-and-persistence/05-VERIFICATION.md` — Verification status for persisted Match/MatchSet orchestration and scoring.
- `.planning/phases/03-chronicle-and-replay-core/03-CONTEXT.md` — Chronicle event shape, replay reconstruction strategy, public/owner projection boundary, and owner-only Awareness Grid recording decisions.
- `.planning/phases/03-chronicle-and-replay-core/03-VERIFICATION.md` — Replay package validation coverage and privacy/determinism verification status.

### Source Code

- `apps/web/app/page.tsx` — Current Workshop entrypoint that may need to expose replay links from MatchSet results.
- `apps/web/app/workshop/workshop-client.tsx` — Workshop test panel and MatchSet status UI that should gain replay handoff links.
- `apps/web/app/workshop/server.ts` — Workshop server facade and existing persistence bridge patterns.
- `apps/web/app/api/workshop/tests/route.ts` — Canonical Workshop test launch route.
- `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` — Canonical Workshop test status route.
- `packages/persistence/src/workshop.ts` — Workshop MatchSet summary, opponents, presets, and test launch services.
- `packages/persistence/src/chronicle-store.ts` — Chronicle persistence adapter and Match-linked storage metadata.
- `packages/persistence/src/matchset-status.ts` — MatchSet status/scoring aggregation used by Workshop test status.
- `apps/worker/src/runner.ts` — Existing worker path that builds Chronicles and completes Matches.
- `packages/replay/src/index.ts` — Replay package public exports.
- `packages/replay/src/build.ts` — Chronicle construction from Match execution.
- `packages/replay/src/reconstruct.ts` — Replay reconstruction/state lookup utilities.
- `packages/replay/src/project.ts` — Public and owner projection utilities that enforce privacy.
- `packages/replay/src/validate.ts` — Chronicle validation utilities.
- `packages/spec/src/types.ts` — Canonical Chronicle, Match, Soldier, Awareness Grid, and replay-facing contract types.
- `packages/spec/src/schemas.ts` — Zod schemas for Chronicle and replay-facing contract validation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/replay` already exposes Chronicle build, validation, projection, reconstruction, hashing, and iteration utilities. Phase 7 should consume these instead of inventing UI-only replay state.
- `createReplay(chronicle)` and replay reconstruction APIs support `stateAt(sequence)` and replay iteration, matching the scrubber and step controls selected in discussion.
- `projectPublicChronicle` and `projectOwnerChronicle` enforce the public/owner data boundary; the UI should use these rather than manually stripping private fields.
- `packages/persistence/src/chronicle-store.ts` stores completed Match Chronicles and metadata, giving Phase 7 a natural source for `/matches/{matchId}/replay`.
- `apps/worker/src/runner.ts` can execute a queued Match through runtime, engine, Chronicle build, and completion; Phase 7 E2E can wrap or reuse this path in an inline/test-mode helper.
- The Workshop client already displays MatchSet status, match count, and aggregate scoring, which is the right place to add the first completed-Match replay links.

### Established Patterns

- Game rules and replay reconstruction stay out of React components. React renders and controls; `packages/replay`, `packages/spec`, and persistence services provide replay data.
- Public data remains the default surface. Owner-only private sections are opt-in and scoped.
- Local MVP workflows should remain service-backed where possible, but browser/service E2E can sit behind a separate command when local services are required.
- The existing app design favors a dense workbench over a marketing page. The replay viewer should be an actual usable tool on first render, not a landing page.

### Integration Points

- Add a direct Match replay route at `/matches/{matchId}/replay`.
- Add server/API access to fetch a persisted Chronicle by Match ID, project it to public or owner view as appropriate, and return replay-ready data to the client.
- Add replay links to the Workshop test panel once MatchSet summaries include completed Match IDs/statuses/outcomes.
- Add a PixiJS/canvas replay board component plus React timeline, inspector, and privacy/debug controls.
- Add fixture-backed replay UI tests and a separate service-backed E2E command for the full edit-to-replay smoke path.

</code_context>

<specifics>
## Specific Ideas

- The board should feel like an animated arena, not a plain static table, but every piece of gameplay state must remain readable.
- Timeline should be approachable first: Round -> Activation -> Event, with Cycle detail shown only when the current replay position makes it useful.
- Strong callouts should make Backstabs, pushes, falls, stoning, blocked movement, Contraction, terminal outcomes, and runtime violations hard to miss.
- Owner-only Awareness Grid debug should feel like a replay analysis feature: compact spatial overlay plus detailed panel, gated behind an explicit owner/debug toggle.
- Workshop should show the list of completed Matches and replay links when a MatchSet completes, not just aggregate status.

</specifics>

<deferred>
## Deferred Ideas

- Speed presets and richer playback controls can come after the first pause/play plus step controls are proven.
- Full visual regression coverage for every event type is deferred; Phase 7 should prove the core board/timeline/inspector/link handoff and leave exhaustive visual cases for a later hardening pass.
- Ranked match history, public sharing, spectator tooling, and social replay distribution remain future phases.
- Strict exhaustive Chronicle grammar, event-state-machine validation, replay fuzz/property testing, and version migration hardening remain deferred to the post-Phase-7 Chronicle Grammar and Replay Verification Hardening idea captured in Phase 3.

</deferred>

---

*Phase: 7-Replay Viewer and End-to-End Verification*
*Context gathered: 2026-05-17*
