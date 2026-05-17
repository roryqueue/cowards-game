---
phase: 06
status: open
depth: standard
reviewed_at: 2026-05-17T20:53:48.000Z
scope: phase-06-source-changes
files_reviewed: 35
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
---

# Phase 06 Code Review

## Findings

### F-01: Workshop test launch accepts arbitrary StrategyRevision IDs

- Severity: warning
- Files: `packages/persistence/src/workshop.ts:354`, `packages/persistence/src/matchset-service.ts:84`, `packages/persistence/src/repositories.ts:132`
- Requirements: UX-05, UX-06
- Status: open

`createWorkshopTestMatchSet` passes caller-provided `revisionId` directly into `createMatchSetService(pool).createFromPreset`. The lower-level MatchSet service verifies that the revision exists, but it does not verify that the revision belongs to `WORKSHOP_STRATEGY_ID` or to the single local Workshop identity. A direct API caller can therefore launch Workshop tests for any existing `StrategyRevision`, including bundled opponent revisions or future non-local revisions.

This undercuts the Phase 6 boundary that the Workshop is a single local active strategy and weakens the protections from T-06-11/T-06-14. Add an ownership/scope check before creating the MatchSet, ideally by reading the revision and requiring `revision.strategyId === WORKSHOP_STRATEGY_ID` and `revision.validation.valid === true`, then cover the rejection path in persistence or web facade tests.

### F-02: Edited drafts can be submitted while the UI still trusts stale validation

- Severity: warning
- Files: `apps/web/app/workshop/workshop-client.tsx:74`, `apps/web/app/workshop/workshop-client.tsx:127`, `apps/web/app/workshop/workshop-client-state.ts:46`
- Requirements: UX-03, UX-04
- Status: open

`submitEnabled` is derived from the last validation report, but `onSourceChange` only updates `source` and `isDirty`. It does not clear `validation` or set `checking` until the 500ms debounce fires. After a valid draft is edited into invalid source, the Submit button remains enabled during that window and sends the edited source with the stale valid state.

The server still rejects invalid source, so this is not a persistence bypass. It is still a user-visible contract bug: Phase 6 says invalid drafts cannot be submitted, and the UI claims to block submission based on validation state. Clear validation or immediately mark the draft as checking on each source edit, and only allow submission when the validation report corresponds to the current source hash/bytes.

### F-03: Initial Workshop load hides all server-side data failures as an empty static snapshot

- Severity: warning
- Files: `apps/web/app/workshop/server.ts:81`, `apps/web/app/api/workshop/route.ts:3`, `apps/web/app/api/workshop/revisions/route.ts:7`
- Requirements: UX-04, UX-06
- Status: open

`getInitialData` catches every error from the persistence-backed snapshot and returns `getWorkshopStaticSnapshot()`. This makes a missing local database recoverable, but it also hides schema drift, bad queries, seed regressions, and programming errors as a normal-looking Workshop with no revision history. The revisions API inherits the same behavior and will report an empty list instead of a service failure.

Narrow this fallback to known local-storage-unavailable failures, or return an explicit `storageUnavailable`/`degraded` state that the UI can display. Unexpected persistence errors should be logged and surfaced as failures so Phase 7 does not build replay links or status flows on silently stale data.

### F-04: Legacy singular Workshop API routes diverge from the canonical plural routes

- Severity: info
- Files: `apps/web/app/api/workshop/submit/route.ts:21`, `apps/web/app/api/workshop/test/route.ts:26`, `apps/web/app/api/workshop/revisions/route.ts:12`, `apps/web/app/api/workshop/tests/route.ts:26`
- Requirements: UX-04, UX-05
- Status: open

The client uses `/api/workshop/revisions` and `/api/workshop/tests`, but the older singular `/api/workshop/submit` and `/api/workshop/test` endpoints remain active with different error handling. The plural routes convert storage errors into the Phase 6 recoverable message; the singular routes let those errors escape. This is easy to miss because normal UI flows never touch the singular paths.

Either remove the singular endpoints before they become accidental public contracts, or make them thin redirects/delegates to the plural implementations so all callers get the same validation, status, and storage-failure behavior.

## Verification

Review only. No code changes were applied and no test suite was run for this artifact.
