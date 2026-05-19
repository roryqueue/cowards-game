---
phase: 11-doctrine-debugging-ux
reviewed: 2026-05-18T19:11:06Z
depth: deep
files_reviewed: 26
files_reviewed_list:
  - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
  - apps/web/app/matches/[matchId]/replay/replay-client.test.tsx
  - apps/web/app/matches/[matchId]/replay/replay-client.tsx
  - apps/web/app/matches/[matchId]/replay/replay-state.test.ts
  - apps/web/app/matches/[matchId]/replay/replay-state.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/types.ts
  - apps/web/app/workshop/types.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/app/workshop/workshop-client.test.tsx
  - apps/web/app/workshop/workshop-client.tsx
  - apps/web/e2e/replay.fixture.spec.ts
  - packages/persistence/src/workshop.test.ts
  - packages/persistence/src/workshop.ts
  - packages/replay/src/debug-explanations.test.ts
  - packages/replay/src/debug-explanations.ts
  - packages/replay/src/index.ts
  - packages/replay/src/project.test.ts
  - packages/replay/src/project.ts
  - packages/runtime-js/src/guards.ts
  - packages/runtime-js/src/validation.test.ts
  - packages/runtime-js/src/validation.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/spec.test.ts
  - packages/spec/src/types.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-18T19:11:06Z
**Depth:** deep
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Reviewed the Phase 11 Workshop, replay DTO, replay projection, runtime validation, and spec-schema changes with cross-file tracing through the owner-debug route and replay-ready assembly. The highest-risk defect is an owner-debug privacy bypass: trusted owner mode can be selected entirely by query string when the environment flag is enabled. I also found missing required failure-mode samples and a validation schema mismatch that rejects legitimate oversized-source validation reports.

## Critical Issues

### CR-01: BLOCKER - Owner Debug Trusts Query String Owner Identity

**File:** `apps/web/app/matches/[matchId]/replay/owner-debug.ts:32`
**Issue:** `resolveOwnerDebugReplayOptions` accepts `ownerPlayerId` directly from URL query params and returns `{ mode: "owner", allowOwnerDebug: true }` whenever `PLAYWRIGHT_TEST`, `NODE_ENV=test`, or `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1` is set. `buildReadyReplayFromChronicle` then passes that unverified id into `projectOwnerChronicle` and `buildSoldierInactivityExplanations` (`apps/web/app/matches/replay-ready.ts:95-131`). In any deployed/debug/staging environment where the flag is enabled, a requester can change `?ownerPlayerId=...` and receive that player's `ownerPrivate` payload, including owner debug, StrategyMemory, SoldierMemory, objective payloads, Awareness Grid, and raw runtime details. That violates the Phase 11 owner-only debug gate.

**Fix:**
Derive the owner player id from authenticated server-side ownership checks, not the query string. Keep query params as opt-in only.

```typescript
// Sketch: page/server boundary should receive the authenticated viewer.
const ownerDebugOptIn = searchParams?.ownerDebug === "1"
const authorizedOwnerPlayerId = await resolveAuthorizedMatchPlayerId({
  matchId: resolvedParams.matchId,
  viewerUserId: session.user.id,
})

const options =
  ownerDebugOptIn && authorizedOwnerPlayerId
    ? {
        mode: "owner",
        allowOwnerDebug: true,
        ownerPlayerId: authorizedOwnerPlayerId,
      }
    : undefined
```

Add a negative test proving `?ownerPlayerId=top` cannot expose top private data to a bottom owner, and do not enable persisted-match owner debug through `COWARDS_ENABLE_OWNER_DEBUG_REPLAY` without an authorization source.

## Warnings

### WR-01: WARNING - Required Timeout And Do-Nothing Samples Are Missing

**File:** `packages/persistence/src/workshop.ts:438`
**Issue:** The Phase 11 UI contract requires sample rows for runtime timeout and do-nothing failure modes, but `listWorkshopSamples()` only returns four starter samples plus forbidden clock, invalid output, and thrown exception (`packages/persistence/src/workshop.ts:438-490`). The tests lock in that incomplete list by expecting only three failure-mode ids (`packages/persistence/src/workshop.test.ts:123-127`). This leaves DEBUG-02/D-06 incomplete and removes the direct sample coverage for timeout and no-useful-Activation behavior.

**Fix:** Add stable sample entries such as `sample:failure-runtime-timeout` and `sample:failure-do-nothing`, include `expectedRuntimeViolationType: "TIMEOUT"` for the timeout sample where applicable, and update tests to require the full failure-mode catalog.

### WR-02: WARNING - Validation Report Schema Rejects SOURCE_TOO_LARGE Reports

**File:** `packages/spec/src/schemas.ts:235`
**Issue:** `validateStrategySource` correctly returns a validation report with `SOURCE_TOO_LARGE` and `sourceBytes > STRATEGY_SOURCE_BYTES` (`packages/runtime-js/src/validation.ts:205-212`), but `StrategyRevisionValidationReportSchema` caps `sourceBytes` at `STRATEGY_SOURCE_BYTES` (`packages/spec/src/schemas.ts:230-236`). That means the shared schema rejects a legitimate invalid validation report. Any API or persistence boundary that validates the report contract will turn a user-actionable validation failure into a schema failure.

**Fix:** Allow validation reports to describe oversized input while keeping `StrategyRevisionSchema.source` and persisted revision `sourceBytes` bounded.

```typescript
export const StrategyRevisionValidationReportSchema = z.object({
  // Validation reports must be able to report oversized rejected input.
  sourceBytes: z.number().int().min(0),
  // ...
})
```

Add a spec test that parses a `SOURCE_TOO_LARGE` report with `sourceBytes: STRATEGY_SOURCE_BYTES + 1`.

---

_Reviewed: 2026-05-18T19:11:06Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## Fix Closure

**Resolved CR-01:** `resolveOwnerDebugReplayOptions` now treats the query string as an opt-in request only. Persisted Match replay assembly only honors explicit trusted server owner options; requested owner ids from URL/environment fall back to public projection. Fixture replay permits the bottom fixture owner for E2E only through a scoped allow-list, and tests cover persisted-query and fixture-query privacy rejection.

**Resolved WR-01:** Workshop samples now include runtime timeout and do-nothing failure-mode entries, plus required category chips for starter and failure samples.

**Resolved WR-02:** `StrategyRevisionValidationReportSchema` now allows oversized rejected input reports while leaving persisted revision/source constraints intact, with spec coverage for `SOURCE_TOO_LARGE`.
