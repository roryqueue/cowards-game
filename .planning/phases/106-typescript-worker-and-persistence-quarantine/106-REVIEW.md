---
phase: 106-typescript-worker-and-persistence-quarantine
reviewed: 2026-05-24T20:57:51Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - apps/worker/src/index.ts
  - apps/worker/src/runner.test.ts
  - apps/worker/src/runner.ts
  - packages/persistence/package.json
  - packages/persistence/src/competition.test.ts
  - packages/persistence/src/competition.ts
  - packages/persistence/src/index.ts
  - packages/persistence/src/quarantine-lifecycle.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - scripts/generate-typescript-backend-inventory.ts
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-worker-quarantine.json
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 106: Code Review Report

**Reviewed:** 2026-05-24T20:57:51Z
**Depth:** deep
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the Phase 106 worker/persistence quarantine changes from `7cf58d9..8488f9a` against `106-PLAN.md` and QUAR-01 through QUAR-07. The worker startup guard is before pool creation and normal TypeScript lifecycle ownership is blocked, but Chronicle persistence remains reachable outside the explicit quarantine boundary and the selected replay page monitor does not follow the selected normal page import chain. Current reviewed artifacts did not contain real token, DSN, host-path, Strategy source, StrategyMemory, SoldierMemory, or objective payload values, but the new worker quarantine artifact validator does not enforce that property against future changes.

Supporting checks run during review:

- `pnpm --filter @cowards/persistence exec tsx -e ...` confirmed `@cowards/persistence` still exports `createPostgresChronicleStore`, `createChronicleMetadata`, and `createMemoryChronicleStoreForTests`.
- `pnpm exec tsx -e ... analyzeServiceBoundaryImports()` confirmed `apps/web/app/matches/server.ts` persistence imports are report-only, not strict, and the selected replay page has no strict offense.
- `pnpm exec tsx -e ... validateV116TypeScriptWorkerQuarantineArtifact(...)` accepted a synthetic artifact containing `token` and `strategyMemory`.

## Critical Issues

### BLOCKER CR-01: Chronicle Persistence Is Still Exported From The Normal Persistence Root

**File:** `packages/persistence/src/index.ts:7`

**Issue:** QUAR-02 requires TypeScript Chronicle persistence to be deleted, quarantined, or removed from normal runtime backend reachability. The root `@cowards/persistence` export still re-exports `./chronicle-store.js`, which exposes `createPostgresChronicleStore` and its `put()` method for writing Chronicle rows. `packages/persistence/package.json:13` also keeps the direct `@cowards/persistence/chronicle-store` subpath. This means Chronicle persistence is still reachable without the explicit `@cowards/persistence/quarantine-lifecycle` boundary, and the new monitor at `scripts/check-boundary-monitors.ts:1804` omits `chronicle-store` from the forbidden root-export list, so the regression is not caught.

**Fix:**

```typescript
// packages/persistence/src/index.ts
// Remove Chronicle persistence from the normal root export.
export * from "./db.js"
export * from "./migrations.js"
export * from "./schema.js"
// no export * from "./chronicle-store.js"
```

Move retained Chronicle persistence access behind an explicit non-normal subpath or split pure metadata helpers from DB-writing store helpers. Add `chronicle-store` / `createPostgresChronicleStore` to the Phase 106 root-export and package-subpath monitor checks.

### BLOCKER CR-02: Selected Replay Evidence Monitor Does Not Follow The Page Import Chain

**File:** `scripts/check-boundary-monitors.ts:874`

**Issue:** The selected Go route monitor checks forbidden TypeScript backend imports only when `nextPath` starts with `/api/`. The selected normal public replay evidence route is a page path (`/matches/[matchId]/replay`), so the monitor only checks for the token `getMatchReplay`. That page imports `../../server.js`, and `apps/web/app/matches/server.ts` imports `@cowards/persistence/db` and `@cowards/persistence/chronicle-store`. `scripts/check-service-boundary-imports.ts:7` also omits the replay page and server from `strictMigratedFiles`, leaving those persistence imports report-only. This fails the Phase 106 requirement that selected normal public evidence paths cannot lazily use TypeScript Chronicle/public evidence fallback and that tests/monitors fail on selected-normal import regressions.

**Fix:** Make selected route validation resolve local imports for both API routes and pages, then reject `@cowards/persistence`, `@cowards/service`, `@cowards/persistence/quarantine-lifecycle`, `createPostgresChronicleStore`, `buildPublicMatchSetResultDto`, and `refreshMatchSetStatus` anywhere in the selected route import graph. Also add `apps/web/app/matches/[matchId]/replay/page.tsx` and `apps/web/app/matches/server.ts` to strict boundary coverage or split selected Go replay access into a strict Go-only server module.

## Warnings

### WARNING WR-01: Worker Quarantine Artifact Validator Does Not Enforce Privacy Denylist

**File:** `scripts/check-boundary-monitors.ts:1690`

**Issue:** The Phase 106 plan required monitor validation to reject Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, stack, stderr, sessions, tokens, DB DSNs, host paths, and private runtime internals in the new artifacts. `validateV116TypeScriptWorkerQuarantineArtifact` checks structure and ownership policy, but never calls the public payload leak guard or scans the serialized artifact for private markers. A synthetic valid artifact with `token` and `strategyMemory` fields is accepted, so tests will not fail on future privacy regressions in this artifact.

**Fix:** Add a privacy assertion inside `validateV116TypeScriptWorkerQuarantineArtifact`, with tests that mutate the artifact to include each denied marker and expect the validator to throw.

```typescript
export const validateV116TypeScriptWorkerQuarantineArtifact = (
  artifact: unknown,
): string => {
  const root = requireRecord(artifact, "v1.16 TypeScript worker quarantine")
  assertMonitorPublicPayload(root)
  const serialized = JSON.stringify(root)
  for (const marker of requiredV116FailurePrivacyDenylist) {
    if (serialized.includes(marker)) {
      throw new Error(`worker quarantine artifact contains private marker ${marker}`)
    }
  }
  // existing structural checks...
}
```

---

_Reviewed: 2026-05-24T20:57:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
