---
phase: 07
slug: replay-viewer-and-end-to-end-verification
status: complete
researched_at: 2026-05-17
requirements:
  - VIEW-01
  - VIEW-02
  - VIEW-03
  - VIEW-04
  - VIEW-05
  - VIEW-06
  - VIEW-07
  - TEST-06
---

# Phase 7 Research: Replay Viewer and End-to-End Verification

## Research Complete

Phase 7 should be planned as a vertical replay product slice, not as a pure rendering spike. The lowest-risk path is:

1. Expose persisted Chronicle replay data through a Match-centered web/server boundary.
2. Normalize that data into a replay-view model that directly uses `@cowards/replay` projections and `createReplay`.
3. Build a browser-only PixiJS replay board with React timeline/inspector controls.
4. Add Workshop replay links from completed MatchSet summaries.
5. Add fixture-backed UI verification and a separate service-backed Playwright smoke path.

## Key Findings

### Existing replay foundation is strong enough for UI planning

- `packages/replay/src/index.ts` exports build, normalize, hash, validate, reconstruct, and projection utilities.
- `createReplay(chronicle)` in `packages/replay/src/reconstruct.ts` already supports the two UI navigation primitives Phase 7 needs: `stateAt(sequence)` for scrubber jumps and `iterateReplay()` for linear playback/step controls.
- `projectPublicChronicle` and `projectOwnerChronicle` in `packages/replay/src/project.ts` enforce the public/owner privacy boundary. The UI should consume projected data rather than hand-filtering private fields.
- `packages/replay/src/integration.test.ts` already proves build -> validate -> hash -> reconstruct -> iterate -> project for a deterministic Match. Phase 7 can extend this confidence into a browser fixture rather than re-proving the replay core.

### Persistence already has the Chronicle source of truth

- `packages/persistence/src/chronicle-store.ts` exposes `createPostgresChronicleStore(pool).getByMatchId(matchId)`, returning both metadata and the full unified Chronicle artifact.
- `createChronicleMetadata` stores replay-friendly metadata: match ID, schema version, hash, outcome, event/snapshot counts, player IDs, StrategyRevision IDs, and Arena Variant ID.
- The likely server shape is a small replay facade in `apps/web/app/matches/server.ts` or `apps/web/app/replay/server.ts` that:
  - opens a database pool with the same `createDatabasePool` pattern as `apps/web/app/workshop/server.ts`;
  - loads the stored Chronicle by Match ID;
  - projects it with `projectPublicChronicle` by default;
  - optionally returns owner projection for local Workshop owner/debug mode;
  - returns replay metadata plus projection data to `/matches/{matchId}/replay`.

### Workshop handoff needs richer MatchSet match rows

- `listMatchStatusesForSet` currently returns only `{ matchId, status }`.
- `refreshMatchSetStatus` already queries outcome/scoring-relevant Match fields, but `WorkshopTestSummary.matches` does not expose outcome or replay availability.
- To support "full list of Matches with status/outcome and replay links", planning should extend Workshop match summaries to include:
  - `matchId`
  - `status`
  - `outcome` when complete
  - `hasReplay` or equivalent Chronicle existence indicator
  - possibly `winnerPlayerId` or compact outcome label
- Degraded MatchSets should preserve completed Match replay links while marking failed/system Matches clearly.

### PixiJS/React integration should be browser-only

Official PixiJS React docs recommend installing `pixi.js` with `@pixi/react`; `@pixi/react` is a React wrapper around PixiJS and exposes Pixi primitives through JSX. Official PixiJS v8 docs emphasize that `Application` initialization is asynchronous via `app.init(...)`, and the resize plugin can use `resizeTo` for responsive canvas sizing.

Planning implications:

- Add `pixi.js` and likely `@pixi/react` to `apps/web/package.json`.
- Keep the replay board in a Client Component. If using a wrapper like `@pixi/react`, isolate it similarly to the existing Monaco wrapper in `apps/web/app/workshop/monaco-editor.tsx` if SSR/build issues appear.
- Use stable container sizing from CSS and either Pixi `resizeTo` or React-measured dimensions so the replay board does not shift or render blank.
- Board rendering should be deterministic from `FullBoardSnapshot`, event metadata, and selected replay sequence; animation should interpolate display positions only and never mutate the canonical replay state.

Primary docs consulted:

- PixiJS React Getting Started: `https://react.pixijs.io/getting-started`
- PixiJS Application docs: `https://pixijs.download/v8.10.0/docs/app.Application.html`
- PixiJS Resize Plugin docs: `https://pixijs.download/dev/docs/app-2.html`

### Playwright should be separate from normal verify

The root package currently has no Playwright dependency or config. `pnpm verify` runs formatting, lint, typecheck, and Vitest tests. Phase 7 decisions explicitly put service/browser E2E behind a separate command such as `pnpm e2e`.

Official Playwright docs support `webServer` in config for launching a dev server during tests, including multiple web servers if needed. That maps cleanly to a dedicated config and command.

Planning implications:

- Add `@playwright/test` as a root dev dependency or web-app dev dependency.
- Add `playwright.config.ts` or an `apps/web/playwright.config.ts` depending on desired ownership.
- Add root script `e2e`, likely `playwright test`, and keep it out of `pnpm verify` for now.
- Use fixture-backed browser tests for replay UI states that should not require Docker.
- Use one service-backed smoke path that can start local services, submit a revision, create a MatchSet, trigger worker execution inline/test-mode, then open `/matches/{matchId}/replay`.

Primary docs consulted:

- Playwright web server docs: `https://playwright.dev/docs/test-webserver`
- Playwright configuration docs: `https://playwright.dev/docs/test-configuration`

## Recommended Plan Shape

### Plan 07-01: Replay data facade and route contracts

Purpose: create the server/data boundary for `/matches/{matchId}/replay`.

Likely files:

- `apps/web/app/matches/[matchId]/replay/page.tsx`
- `apps/web/app/matches/server.ts`
- `apps/web/app/matches/types.ts`
- `apps/web/app/matches/server.test.ts`
- `packages/persistence/src/chronicle-store.ts` if a small helper is needed

Key decisions to encode:

- Default projection is public.
- Owner/debug projection is explicit.
- Missing Chronicle returns a replay-not-found state, not a fake replay.
- Server returns replay-ready timeline entries derived from `createReplay` and projected events/snapshots.

### Plan 07-02: Replay client shell, timeline, and inspector

Purpose: build the React control surface around replay data before adding Pixi.

Likely files:

- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-state.ts`
- `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx`
- `apps/web/app/globals.css`

Key decisions to encode:

- Start at Match start.
- Use a draggable scrubber as primary navigation.
- Group timeline by Round -> Activation -> Event; expose Cycle only when relevant.
- Support pause/play at one speed plus step forward/back.
- Empty inspector shows current replay position summary.
- Soldier selection shows current state plus recent Soldier-specific events.
- Owner/debug toggle is explicit and disabled/hidden when owner data is absent.

### Plan 07-03: PixiJS replay board

Purpose: render the board as a browser-only animated arena.

Likely files:

- `apps/web/package.json`
- `pnpm-lock.yaml`
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts`
- `apps/web/app/matches/[matchId]/replay/replay-board.test.ts`
- `apps/web/next-dynamic.d.ts` if dynamic import typings need the same workaround Monaco needed
- `apps/web/app/globals.css`

Key decisions to encode:

- Owner colors plus numbered Soldier badges.
- Distinct ACTIVE, STONE, FALLEN, TerrainStone, bounds, and Contraction visuals.
- Strong event callouts for Backstab, push, fall, stoning, blocked movement, runtime violation, terminal outcome.
- Brief display-only animations for move/push/fall/stone transitions.
- Canvas must render nonblank at desktop and mobile viewport checks.

### Plan 07-04: Workshop replay handoff

Purpose: expose replay links from completed Workshop MatchSets.

Likely files:

- `packages/persistence/src/matchset-status.ts`
- `packages/persistence/src/workshop.ts`
- `packages/persistence/src/workshop.test.ts`
- `apps/web/app/workshop/types.ts`
- `apps/web/app/workshop/workshop-client.tsx`
- `apps/web/app/workshop/workshop-client-state.ts`
- `apps/web/app/workshop/workshop-client.test.tsx`
- `apps/web/app/globals.css`

Key decisions to encode:

- MatchSet summary includes full Match list with status/outcome/replay availability.
- Completed Matches link to `/matches/{matchId}/replay`.
- Degraded MatchSets still link completed Match replays and mark failed/system Matches.

### Plan 07-05: E2E harness and final replay verification

Purpose: prove fixture-backed UI behavior and one real edit-to-replay smoke path.

Likely files:

- `package.json`
- `pnpm-lock.yaml`
- `playwright.config.ts`
- `apps/web/e2e/replay.fixture.spec.ts`
- `apps/web/e2e/workshop-to-replay.spec.ts`
- `apps/web/app/api/test-support/replay-fixture/route.ts` or a safer test-only helper path if needed
- `apps/web/app/api/test-support/run-worker-once/route.ts` or an inline test helper if route exposure is too risky
- `.planning/phases/07-replay-viewer-and-end-to-end-verification/07-VALIDATION.md`

Key decisions to encode:

- `pnpm e2e` is separate from `pnpm verify`.
- Fixture-backed UI tests assert board, timeline, inspector, and replay route/link behavior without Docker.
- Service-backed smoke E2E uses local services and an inline/test-mode worker execution helper rather than requiring a separate worker daemon.
- Any test-support route must be gated to test/development mode and unavailable in production builds.

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Web/API accidentally reruns Strategy code to build replay data | high | Use persisted Chronicle retrieval and `@cowards/replay` reconstruction only in web routes; keep `@cowards/runtime-js/worker` restricted by ESLint. |
| Public replay leaks owner-only Awareness Grid, memory, objectives, source, or raw runtime details | high | Server should default to `projectPublicChronicle`; owner/debug toggle must explicitly request owner projection and tests should stringify public response and assert private markers absent. |
| Pixi canvas renders blank under Next/SSR or responsive resizing | high | Use a browser-only Client Component/dynamic wrapper, stable CSS dimensions, and browser checks for nonblank canvas pixels at desktop and mobile sizes. |
| Animation state drifts from canonical replay sequence | medium | Treat animation as display interpolation only; derive canonical board from `createReplay(...).stateAt(sequence)` whenever the selected sequence changes. |
| Workshop shows replay links before Chronicles exist | medium | Add `hasReplay` or equivalent to Match summaries; only link completed Matches with stored Chronicles. |
| E2E becomes flaky because it depends on a long-running worker process | medium | Provide inline/test-mode worker execution helper for Playwright smoke path. |
| Service-backed E2E slows or destabilizes normal verification | medium | Keep `pnpm e2e` separate from `pnpm verify`; fixture-backed unit/component tests remain in normal package test commands. |

## Validation Architecture

### Required automated coverage

- Web server/facade unit tests:
  - Match replay facade returns public projection by default.
  - Missing Chronicle returns a not-found response/state.
  - Public response excludes private markers such as `strategyMemory`, `soldierMemory`, `objectivePayload`, `awarenessGrid`, `strategySource`, and raw runtime details.
  - Owner/debug response includes only the requested owner section when available.
- Replay state/helper tests:
  - Initial sequence is Match start.
  - Step forward/back changes selected sequence deterministically.
  - Scrubber values map to timeline entries.
  - Soldier selection returns current state plus recent Soldier-specific events.
  - Timeline grouping can represent Round -> Activation -> Event and only surfaces Cycle detail when relevant.
- Replay board model tests:
  - ACTIVE, STONE, FALLEN, TerrainStone, board bounds, and Contraction map to distinct render descriptors.
  - Event types listed in VIEW-06 map to callout descriptors.
  - Numbered Soldier badges are stable per owner/side.
- Workshop handoff tests:
  - MatchSet summaries include Match rows with status/outcome/replay availability.
  - Completed Match rows render `/matches/{matchId}/replay` links.
  - Failed/system Match rows do not render broken replay links.
- Playwright tests:
  - Fixture-backed replay route renders board, timeline, inspector, and responds to scrub/step controls.
  - Service-backed smoke path submits a revision, creates a MatchSet, triggers inline worker execution, and opens a completed Match replay.

### Commands

- Quick package checks:
  - `pnpm --filter @cowards/web typecheck`
  - `pnpm --filter @cowards/web test`
  - `pnpm --filter @cowards/persistence test`
- Full normal verification:
  - `pnpm verify`
- Browser/service E2E:
  - `pnpm e2e`

### Manual/browser verification

Before sign-off, run the web app and inspect at least:

- Desktop: 1440x900
- Laptop: 1180x800
- Tablet: 820x1180
- Mobile: 390x844

Confirm:

- Pixi board is nonblank and framed correctly.
- Timeline, inspector, and controls do not overlap the board.
- Soldier badges and owner colors remain readable.
- Strong callouts are visible without hiding board state.
- Owner/debug toggle does not expose private data in public mode.

## Open Planning Questions

None requiring user input. The remaining choices are implementation details covered by the agent's discretion in `07-CONTEXT.md`.
