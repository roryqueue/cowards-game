---
phase: 07
status: findings_found
depth: standard
reviewed_at: 2026-05-17T22:53:05.000Z
scope: phase-07-source-changes
files_reviewed: 32
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
---

# Phase 07 Code Review

## Findings

### CR-01: Owner replay mode is granted by query string instead of authorization

- Severity: critical
- Files: `apps/web/app/matches/[matchId]/replay/page.tsx:32`, `apps/web/app/matches/server.ts:108`
- Requirements: VIEW-04, REPLAY-06, REPLAY-07
- Status: open

The replay page accepts `?mode=owner&ownerPlayerId=...` directly from `searchParams` and passes those values into `getMatchReplay`. The server then treats any request with `mode === "owner"` plus an `ownerPlayerId` as authorized and calls `projectOwnerChronicle`, which includes that player's owner-private replay projection.

That means a caller who can guess or inspect a player id can request owner-only Awareness Grid/debug data for a completed Match without any session or ownership check. Public mode is the default, but the private path is still reachable from the URL. Until the app has real auth/session context, the direct page route should ignore query-provided owner mode or return only public projections. Once auth exists, derive the owner player id from the authenticated principal on the server, not from client-controlled query parameters. Add tests asserting that unauthenticated `mode=owner` requests remain public or unavailable.

### WR-01: Replay board reinitializes Pixi applications on every timeline change without destroying renderer resources

- Severity: warning
- Files: `apps/web/app/matches/[matchId]/replay/replay-board.tsx:305`, `apps/web/app/matches/[matchId]/replay/replay-board.tsx:323`, `apps/web/app/matches/[matchId]/replay/replay-board.tsx:356`
- Requirements: VIEW-01, VIEW-02
- Status: open

`ReplayBoard` creates a new `Application` inside an effect whose dependencies include `selectedSequence`, `selectedSoldierId`, `selectedEvent.label`, and `scrubbing`. Stepping, playback, scrubbing, or changing soldier selection tears down the effect and creates a fresh Pixi application on the same canvas. Cleanup cancels animation, stops the ticker, and removes stage children, but it does not destroy the application/renderer or release GPU resources.

On long replays this can leak WebGL renderer resources and resize/plugin listeners until the browser starts dropping contexts or the board degrades during normal timeline playback. Keep the Pixi application stable in a ref and redraw/update the stage when selected state changes, or use the Pixi destroy API in cleanup with options that preserve the React-owned canvas while freeing renderer resources. Add a regression test or browser smoke path that scrubs many timeline positions and verifies the canvas remains responsive.

### IN-01: Fixture match detection can throw on malformed encoded match ids in test/development mode

- Severity: info
- Files: `apps/web/app/matches/replay-fixture.ts:10`
- Requirements: TEST-06
- Status: open

`isReplayFixtureMatch` calls `decodeURIComponent(matchId)` without guarding malformed percent encodings. The helper is disabled in production, but it is active in test and development, so a bad replay URL can throw a `URIError` before the normal missing-Chronicle unavailable path runs.

Wrap decoding in a small safe helper and return `false` on decode failure. That keeps local/test-only fixture handling from changing the route's error behavior for arbitrary Match IDs.

## Scope

Reviewed files were resolved from Phase 7 summary artifacts, excluding planning documents and generated lockfile detail. The review focused on replay privacy boundaries, persisted replay data flow, Workshop replay handoff, Pixi rendering lifecycle, and Playwright/test-support gates.

## Verification

Review only. No code changes were made and no test suite was run for this review artifact.
