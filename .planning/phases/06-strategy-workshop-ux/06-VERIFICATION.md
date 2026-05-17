---
phase: 06-strategy-workshop-ux
status: passed
verified_at: 2026-05-17T23:14:24Z
score: 10/10 must-haves verified
requirements:
  UX-01: verified
  UX-02: verified
  UX-03: verified
  UX-04: verified
  UX-05: verified
  UX-06: verified
---

# Phase 6 Verification: Strategy Workshop UX

## Verdict

**Passed.** Phase 6 achieves its goal: users can create, validate, revise, and launch Workshop test MatchSets from a Strategy Workshop loop.

This verification did not trust SUMMARY claims. It inspected the actual page, client state, API routes, server facade, persistence Workshop service, source contracts, and focused tests. Live Postgres/Redis plus worker execution was not run in this pass; that remains residual risk for the broader service-backed E2E path, not a Phase 6 blocker.

## Goal Check

| Must-have | Status | Evidence |
|---|---|---|
| User can create/edit a Strategy in Monaco using sample doctrine templates. | VERIFIED | `apps/web/app/page.tsx` renders `WorkshopClient`; `apps/web/app/workshop/monaco-editor.tsx` dynamically loads `@monaco-editor/react` with `ssr: false`, `language="typescript"`, and controlled `value/onChange`; `WorkshopClient` initializes source from template data and updates draft state on edit. |
| User can validate source and receive actionable errors. | VERIFIED | Client posts to `/api/workshop/validate`; route calls `workshopServer.validateSource`; validation panel renders status, error/warning counts, `ERROR · CODE` rows, and advanced details (`sourceBytes`, `sourceHash`, runtime/spec compatibility, forbidden patterns). |
| User can submit immutable Strategy Revisions and browse revision history. | VERIFIED | Client posts valid drafts to `/api/workshop/revisions`; server validates before insert and builds a `WORKSHOP_STRATEGY_ID` revision; response omits source text; revision history shows label/timestamp/hash/bytes/validity/used count and can load source back as a draft copy. |
| User can launch Workshop/local test Matches from selected revisions. | VERIFIED | Client posts selected valid revision/opponent/preset to `/api/workshop/tests`; persistence checks the revision is local and valid, creates a persisted MatchSet through `createMatchSetService(...).createFromPreset`, and status route returns MatchSet status, match rows, replay availability, and scoring. |
| Web/API does not execute strategy runtime behavior. | VERIFIED | Workshop web code imports validation/build and persistence facades only; no `@cowards/runtime-js/worker`, engine runner, or replay execution imports were found under `apps/web/app/workshop` or `apps/web/app/api/workshop`. |
| UAT flow is represented in the UI. | VERIFIED | First screen contains Templates, Editor, Validation, Submit revision, Revision history, and Workshop test panels, with controls for validate, submit, load source, launch test, refresh status, and replay handoff when completed matches have replay artifacts. |

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/app/page.tsx` | Workshop is the first screen. | VERIFIED | Calls `getWorkshopInitialData()` and renders `WorkshopClient`. |
| `apps/web/app/workshop/monaco-editor.tsx` | Browser-only Monaco editor wrapper. | VERIFIED | Uses `next/dynamic`, `ssr: false`, TypeScript language mode, controlled source updates, and stable editor frame. |
| `apps/web/app/workshop/workshop-client.tsx` | Full Workshop loop UI. | VERIFIED | Templates, edit/validate, submit, history/source loading, test launch/status/scoring/replay handoff are wired. |
| `apps/web/app/workshop/server.ts` | Server facade for validation, submission, history/source, and tests. | VERIFIED | Per-request pool wrapper, validation-before-insert, static fallback only for storage-unavailable errors, injected dependencies for tests. |
| `apps/web/app/api/workshop/**/route.ts` | JSON route handlers for Workshop operations. | VERIFIED | Initial data, validation, revisions, revision source, test launch, and test status routes delegate to the server facade. Legacy singular routes re-export canonical plural routes. |
| `packages/persistence/src/workshop.ts` | Workshop templates, revision queries, source lookup, MatchSet launch, status summaries. | VERIFIED | Defines templates/opponents/presets, local Workshop constants, SQL scoped to `WORKSHOP_STRATEGY_ID`, revision insertion, local-valid revision guard, MatchSet creation, and status/scoring summary. |
| `packages/spec/src/types.ts` / `schemas.ts` | Notes metadata allowed if UI exposes notes. | VERIFIED | `StrategyRevisionMetadata` and schema include optional `notes`. |

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| UX-01: User can create and edit a Strategy in a Monaco-based editor. | VERIFIED | `StrategySourceEditor` wraps Monaco; `WorkshopClient` renders it with draft source and `onSourceChange` clears stale validation immediately. |
| UX-02: User can start from sample doctrine templates. | VERIFIED | `listWorkshopTemplates()` returns Cautious, Reckless, and Sentinel with source and validation; UI renders template buttons and requires confirmation before replacing a dirty draft. |
| UX-03: User can validate Strategy source and see actionable validation/runtime errors. | VERIFIED | Validation route returns runtime-js validation; UI shows status, counts, issue severity/code/message, and advanced validation details. Tests cover invalid source and `MISSING_DEFAULT_EXPORT` formatting. |
| UX-04: User can submit a Strategy Revision from the editor. | VERIFIED | Submit button is enabled only for current valid validation; server rejects invalid source before insertion; valid submission builds and inserts a Strategy Revision and prepends it to history. |
| UX-05: User can run a local or Workshop test Match before competitive use. | VERIFIED | Launch flow creates a persisted Workshop MatchSet from selected local valid revision, bundled opponent, and preset. UI shows queued/running/complete/failed/degraded status and scoring. Worker execution is external to Phase 6 and covered as residual risk. |
| UX-06: User can view Strategy Revision history and select revisions for Matches. | VERIFIED | Revision query orders newest first, includes `usedInMatches`, UI renders history, selection, valid-revision test selector, and source loading as an editable draft copy. |

## Integration/Data Flow

| Flow | Status | Evidence |
|---|---|---|
| Page -> initial data | VERIFIED | `page.tsx` calls `getWorkshopInitialData`; server calls `getWorkshopSnapshot`; persistence returns templates, revisions, presets, and opponents. |
| Editor -> validation | VERIFIED | `WorkshopClient.validateSource()` posts source to `/api/workshop/validate`; route returns `workshopServer.validateSource(body.source)`. |
| Valid draft -> immutable revision | VERIFIED | Client POST `/api/workshop/revisions`; route calls `submitSource`; server calls `validateWorkshopSource`, `buildWorkshopRevision`, and `insertWorkshopRevision`; persistence restricts to `WORKSHOP_STRATEGY_ID`. |
| Revision history -> source reload | VERIFIED | Client GET `/api/workshop/revisions/{revisionId}/source`; server/persistence query source by revision ID and `WORKSHOP_STRATEGY_ID`; client loads it as unchecked dirty draft rather than mutating the revision. |
| Selected revision -> test MatchSet | VERIFIED | Client POST `/api/workshop/tests`; persistence ensures seed data, verifies local valid revision, resolves opponent, and calls `createMatchSetService(pool).createFromPreset`. |
| MatchSet status -> UI | VERIFIED | Client polls `/api/workshop/tests/{matchSetId}`; persistence refreshes MatchSet status, lists match rows, and returns scoring; UI renders match count, status, rankings, and replay links only when complete with replay. |

### UAT-Style Coverage

| User step | Expected result | Verification |
|---|---|---|
| Open app root. | Strategy Workshop appears as the first screen. | Verified in `page.tsx` and `WorkshopClient` render path. |
| Choose a sample template. | Draft source is replaced only after dirty-draft confirmation, and bundled templates are valid. | Verified in client template handling and `listWorkshopTemplates()` tests. |
| Edit source. | Draft becomes dirty/not checked; stale valid validation cannot enable submit. | Verified in `onSourceChange`, `validationSource === source` gate, and helper tests. |
| Validate invalid source. | User sees invalid status and actionable issue rows. | Verified in validation route, UI rendering, and tests for `ERROR · MISSING_DEFAULT_EXPORT`. |
| Submit valid draft. | New immutable revision is inserted, selected, and shown without exposing source text in summary. | Verified in server facade and tests. |
| Select revision and launch smoke test. | A persisted MatchSet is created and status/scoring are displayed. | Verified in client route calls and persistence MatchSet creation/status code. |
| Refresh test status. | UI updates queued/running/complete/degraded/failed state and match rows. | Verified in polling/status flow and status vocabulary tests. |

## Automated Checks

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @cowards/web typecheck` | PASS | TypeScript check completed with `tsc --noEmit`. |
| `pnpm --filter @cowards/web test -- server.test.ts workshop-client.test.tsx` | PASS | Vitest reported 6 files passed, 28 tests passed. |
| `pnpm --filter @cowards/persistence test -- workshop.test.ts` | PASS | Vitest reported 9 files passed, 28 tests passed, 1 skipped existing DB smoke. |
| `rg` forbidden Workshop imports | PASS | No forbidden runtime worker, engine runner, or replay execution imports found in Workshop web/API paths. |
| `rg` stub/placeholder patterns | PASS with residual notes | Only legitimate nullable returns and recoverable storage/service-unavailable messages were found; no user-visible placeholder implementation blocks Phase 6. |

## Residual Risk

| Risk | Impact | Disposition |
|---|---|---|
| Live Postgres/Redis-backed browser flow was not run during this pass. | Could hide deployment/service configuration failures in submit/test launch. | Residual risk, not a Phase 6 blocker. Code has storage-unavailable fallbacks and focused unit/integration coverage. |
| Worker execution is not triggered by Phase 6 itself. | Created Workshop MatchSets remain pending until worker services run. | Not a blocker for Phase 6 success criteria, which require launching Workshop/local test Matches and showing status. Full worker-to-replay E2E is Phase 7/milestone scope. |
| `apps/web/e2e/workshop-to-replay.spec.ts` is skipped unless `RUN_SERVICE_E2E=1`, and test-support worker route returns 503. | The complete edit -> execute -> replay browser proof remains unverified. | Residual risk already captured by milestone audit and Phase 7 scope, not assigned UX-01..UX-06 blocker. |
| Visual/browser quality was not rerun in this verifier pass. | Possible regressions in Monaco rendering or responsive layout may require manual browser confirmation. | Prior Phase 6 validation records browser checks at desktop/tablet/mobile widths; this pass verified CSS/layout wiring and automated code paths only. |

## Gaps Summary

No blocking Phase 6 gaps found. UX-01 through UX-06 are implemented and wired through real client, API, validation, persistence, revision-history, and MatchSet launch/status paths.

The only remaining concerns are service-backed/live-environment verification risks that belong to the broader Phase 7 or milestone-level edit-to-replay proof, not to the Phase 6 Strategy Workshop UX contract.

---

_Verified: 2026-05-17T23:14:24Z_
_Verifier: the agent (gsd-verifier)_
