---
phase: 07-replay-viewer-and-end-to-end-verification
status: gaps_found
verified_at: 2026-05-17T23:16:00Z
score: 6/8 requirements verified
requirements:
  VIEW-01: verified
  VIEW-02: verified
  VIEW-03: verified
  VIEW-04: failed
  VIEW-05: verified
  VIEW-06: verified
  VIEW-07: verified
  TEST-06: failed
gaps:
  - truth: "VIEW-04: User can inspect the active Soldier's Awareness Grid for recorded Cycles."
    status: failed
    reason: "Owner/debug rendering exists only when the replay DTO already contains ownerPrivate data, but the user-facing replay route calls getMatchReplay(matchId) with no trusted owner option, so no user path can open owner/debug replay data or inspect Awareness Grid contents."
    artifacts:
      - path: "apps/web/app/matches/[matchId]/replay/page.tsx"
        issue: "Calls getMatchReplay(resolvedParams.matchId) without any authenticated/trusted owner context."
      - path: "apps/web/app/matches/[matchId]/replay/replay-client.tsx"
        issue: "Owner debug toggle is conditional on owner projection data but the route never supplies it."
    missing:
      - "Add an authorized owner replay path that derives ownerPlayerId from trusted server context and passes allowOwnerDebug: true."
      - "Cover the visible Awareness Grid inspection path with unit or browser tests."
  - truth: "TEST-06: Playwright tests cover strategy editing, revision submission, MatchSet creation, Match execution status, and replay viewing."
    status: failed
    reason: "The fixture replay Playwright test passes, but the Workshop edit-to-replay spec is skipped by default and the worker test-support route is a static 503 scaffold. A RUN_SERVICE_E2E=1 spot-check failed before revision submission in this environment, so no green service-backed edit -> execute -> replay browser run exists."
    artifacts:
      - path: "apps/web/e2e/workshop-to-replay.spec.ts"
        issue: "Entire spec is skipped unless RUN_SERVICE_E2E=1; the test also accepts a 503 worker response."
      - path: "apps/web/app/api/test-support/run-worker-once/route.ts"
        issue: "POST always returns service_unavailable with status 503 when enabled."
    missing:
      - "Implement the test-support worker execution path or equivalent service-backed harness."
      - "Make the service-backed Playwright run capable of passing against local Postgres/Redis plus worker execution."
---

# Phase 7 Verification Report

## Verdict

Status: `gaps_found`.

The visible replay viewer is largely implemented: completed Match replay URLs load persisted Chronicles, render a Pixi board, expose scrub/step controls, show Soldier details, emphasize major events, and link from completed Workshop Match rows. The phase goal is not fully achieved because two must-have outcomes are not proven in the codebase: a user-accessible active Soldier Awareness Grid inspection path, and a green service-backed Workshop edit -> execute -> replay Playwright path.

## Goal Check

Phase goal: Deliver the visible replay experience and full edit-to-replay verification path.

| Goal Truth | Status | Evidence |
| --- | --- | --- |
| Completed Match replay can open from `/matches/{matchId}/replay` using persisted Chronicle data. | PASS | `apps/web/app/matches/[matchId]/replay/page.tsx:11` calls `getMatchReplay`, and `apps/web/app/matches/server.ts:177` loads `createPostgresChronicleStore(pool).getByMatchId(matchId)`. |
| Replay defaults to public projection and does not rerun strategy code in the web app. | PASS | `apps/web/app/matches/server.ts:115` selects `projectPublicChronicle` by default; no runtime worker imports were found under the replay route/server files. |
| Replay opens at Match start and supports scrub/step/play timeline navigation. | PASS | `initialSequence: 0` is returned at `apps/web/app/matches/server.ts:157`; scrubber and buttons are wired in `replay-client.tsx:131`, `replay-client.tsx:147`, and `replay-client.tsx:161`. |
| User can inspect Soldier status, position, facing, owner, and event context. | PASS | Inspector helpers return these fields in `replay-state.ts:239`; rendered in `replay-client.tsx:217`. |
| User can inspect active Soldier Awareness Grid for recorded Cycles. | FAIL | Owner debug UI is conditional on owner data (`replay-client.tsx:253`), but the route only calls `getMatchReplay(matchId)` with public defaults (`page.tsx:13`). |
| Board distinguishes ACTIVE, STONE, FALLEN, TerrainStone, bounds, Contraction, and major event callouts. | PASS | Board model encodes shapes/textures/colors at `replay-board-model.ts:10`, `replay-board-model.ts:98`, `replay-board-model.ts:165`, and `replay-board-model.ts:238`. Fixture Playwright passed nonblank canvas and event labels. |
| Workshop handoff shows final outcome, aggregate scoring, Match rows, and replay links only when available. | PASS | Scoring render at `workshop-client.tsx:502`; Match rows and links at `workshop-client.tsx:522`; `canOpenReplay` requires complete plus `hasReplay` at `workshop-client-state.ts:116`. |
| Playwright verifies full edit -> submit revision -> create MatchSet -> execute -> replay. | FAIL | `workshop-to-replay.spec.ts:3` skips unless `RUN_SERVICE_E2E=1`; `run-worker-once/route.ts:9` always returns 503 when enabled. |

UAT-style replay flow coverage:

| Step | Expected | Evidence | Status |
| --- | --- | --- | --- |
| Open a completed Match replay URL. | Replay workbench appears, not a placeholder. | Route renders `ReplayClient` for ready data; fixture E2E asserted heading and canvas. | PASS |
| Scrub or step to a timeline position. | Current sequence, board, and inspector update. | Range and step controls update selected index; fixture E2E moved to Backstab sequence. | PASS |
| Select a Soldier. | Inspector shows ID, owner, status, position, and facing. | `getSoldierInspector` plus fixture E2E assertions for owner/facing. | PASS |
| Inspect Awareness Grid. | Owner/debug view shows recorded Cycle grid for the active Soldier. | No user-facing route supplies owner projection data. | FAIL |
| Return from Workshop completed MatchSet to replay. | Completed rows expose `Open replay`. | Workshop UI has link gating, but full service browser flow is not green. | PARTIAL |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/web/app/matches/server.ts` | Match replay facade over persisted Chronicles and replay projection. | PASS | Loads Chronicle store, returns unavailable for missing/invalid data, builds timeline and state DTOs. |
| `apps/web/app/matches/[matchId]/replay/page.tsx` | Direct replay route. | PARTIAL | Public replay route exists; no owner/debug route context for Awareness Grid. |
| `apps/web/app/matches/[matchId]/replay/replay-client.tsx` | Replay workbench, timeline, inspector, owner-debug panel. | PARTIAL | Workbench and conditional owner panel exist; owner panel is unreachable from the route. |
| `apps/web/app/matches/[matchId]/replay/replay-board.tsx` and `replay-board-model.ts` | Pixi board and visual state/event descriptors. | PASS | Model distinguishes states/events; fixture E2E verifies nonblank canvas. |
| `apps/web/app/workshop/workshop-client.tsx` and state helpers | Workshop replay handoff and scoring. | PASS | Completed Match links are gated by `complete && hasReplay`. |
| `apps/web/e2e/replay.fixture.spec.ts` | Browser replay viewer coverage. | PASS | Passed on desktop/mobile in this verification. |
| `apps/web/e2e/workshop-to-replay.spec.ts` | Service-backed edit-to-replay coverage. | FAIL | Skipped by default; flagged run failed; worker helper is static 503. |

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| VIEW-01 | PASS | Replay route, Pixi board, fixture E2E nonblank canvas. |
| VIEW-02 | PASS | Timeline scrubber, step/play controls, grouped Round/Activation/Event helpers, unit and fixture E2E coverage. |
| VIEW-03 | PASS | Soldier inspector exposes owner, status, position/FALLEN, and facing. |
| VIEW-04 | FAIL | No user-accessible owner/debug replay route, despite internal owner projection support. |
| VIEW-05 | PASS | Board model distinguishes ACTIVE, STONE, FALLEN, TerrainStone, bounds, and Contraction. |
| VIEW-06 | PASS | Event labels and board callouts cover Push, Backstab, Fall, Stone, Blocked, Contraction, Runtime violation, and Outcome. |
| VIEW-07 | PASS | Workshop UI renders outcome/scoring and completed Match replay links only when `hasReplay` is true. |
| TEST-06 | FAIL | Fixture replay E2E passes; full service-backed Workshop edit-to-replay test is skipped/scaffolded and failed when forced locally. |

## Integration/Data Flow

| Link | Status | Evidence |
| --- | --- | --- |
| Replay route -> server facade | PASS | `page.tsx:13` calls `getMatchReplay`. |
| Server facade -> persisted Chronicle store | PASS | `server.ts:177` calls `createStore(pool).getByMatchId(matchId)`. |
| Stored Chronicle -> replay DTO | PASS | `server.ts:115` projects Chronicle; `server.ts:119` calls `createReplay`; `server.ts:131` builds replay states. |
| Replay DTO -> board/timeline/inspector | PASS | `ReplayClient` passes selected sequence/event to `ReplayBoard`; helpers derive summaries/inspectors from DTO state. |
| Owner Chronicle projection -> user-visible Awareness Grid | FAIL | Internal projection exists behind `allowOwnerDebug`, but route never supplies trusted owner options. |
| Workshop MatchSet summary -> replay link | PASS | `canOpenReplay` and `getReplayHref` gate links in the Workshop Match list. |
| Workshop browser flow -> worker execution -> replay | FAIL | `run-worker-once` route returns 503; service-backed Playwright is skipped by default and not green when forced here. |

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @cowards/web test -- app/matches/server.test.ts 'app/matches/[matchId]/replay/replay-state.test.ts' 'app/matches/[matchId]/replay/replay-board.test.ts' app/workshop/workshop-client.test.tsx` | PASS | 6 files, 28 tests passed. |
| `pnpm --filter @cowards/web typecheck` | PASS | `tsc --noEmit` passed. |
| `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` | PASS | 2 passed, desktop and mobile. |
| `PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts` | PARTIAL | 2 skipped because `RUN_SERVICE_E2E` was not set. |
| `RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts` | FAIL | 2 failed waiting for `Revision submitted`; local services were unavailable, and the worker helper remains a static 503 scaffold. |

## Residual Risk

Live Postgres/Redis services were not available during this pass. That alone is not treated as a product failure, but TEST-06 remains a blocking gap because the committed service-backed harness is skipped by default and its worker execution endpoint does not execute work.

Visual quality beyond the desktop/mobile fixture assertions remains a human review risk for the 1180x800 and 820x1180 viewport checks called out in `07-VALIDATION.md`.

The replay fixture DTO is useful for browser coverage, but it is not a substitute for a stored Chronicle produced by the Workshop/worker path.

## Gaps Summary

Two blocking gaps prevent Phase 7 from passing:

1. VIEW-04 is not achieved as a user flow. The code can render owner debug data if preloaded, but the replay page always requests public data and there is no authorized owner/debug entry point.
2. TEST-06 is not achieved. Fixture-backed replay Playwright coverage is real and passing, but the full service-backed edit -> submit revision -> create MatchSet -> execute -> replay path is still skipped/scaffolded and does not pass when forced in this environment.

_Verified: 2026-05-17T23:16:00Z_
_Verifier: the agent (gsd-verifier)_
