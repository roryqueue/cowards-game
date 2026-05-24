---
phase: 106-typescript-worker-and-persistence-quarantine
reviewed: 2026-05-24T21:05:58Z
depth: deep
re_review_of: c2fca1479751c091ec6ea3aadd5ff0ced688ea7f
files_reviewed: 15
files_reviewed_list:
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/replay-fixture.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - packages/persistence/package.json
  - packages/persistence/src/index.ts
  - packages/persistence/src/quarantine-lifecycle.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - .planning/artifacts/v1.16-typescript-worker-quarantine.json
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 106: Code Review Re-Review

**Reviewed:** 2026-05-24T21:05:58Z
**Depth:** deep
**Commit:** `c2fca1479751c091ec6ea3aadd5ff0ced688ea7f`
**Status:** issues_found

## Summary

Re-reviewed commit `c2fca14` against the prior Phase 106 findings. CR-01 is resolved: Chronicle persistence is no longer exported from `@cowards/persistence` or the `@cowards/persistence/chronicle-store` package subpath, and retained access now goes through `@cowards/persistence/quarantine-lifecycle`.

CR-02 remains open. The selected replay page import chain is still not enforced as a strict selected-normal boundary; the new monitor hard-codes a positive check for the quarantined Chronicle import instead of rejecting TypeScript persistence reachability through the page graph. WR-01 is partially fixed, but the artifact privacy validator still misses several required denylist variants and real DSN-style markers.

Supporting checks run:

- `pnpm --filter @cowards/persistence exec tsx -e '(async()=>{...})()'` confirmed `@cowards/persistence/chronicle-store` is rejected and quarantine exports `createPostgresChronicleStore` / `createChronicleMetadata`.
- `pnpm exec tsx -e 'import("./scripts/check-service-boundary-imports.ts").then(...)'` showed `apps/web/app/matches/server.ts` replay persistence imports are still report-only, with zero strict offenses.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts apps/web/app/matches/server.test.ts packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/worker/src/runner.test.ts` passed: 6 files, 98 tests.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.

## Critical Issues

### BLOCKER CR-02: Selected Replay Evidence Monitor Still Does Not Follow And Enforce The Page Import Chain

**File:** `scripts/check-boundary-monitors.ts:890`

**Issue:** The selected Go route validator still applies forbidden import checks only when `route.nextPath.startsWith("/api/")`. The selected replay evidence route is the page path `/matches/[matchId]/replay`, so the monitor does not recursively inspect `apps/web/app/matches/[matchId]/replay/page.tsx -> ../../server.js`. `apps/web/app/matches/server.ts:1` still imports `@cowards/persistence/db`, `apps/web/app/matches/server.ts:2` imports `@cowards/persistence/quarantine-lifecycle`, and `scripts/check-service-boundary-imports.ts:7` still omits the replay page/server from `strictMigratedFiles`, leaving those imports report-only. The added check at `scripts/check-boundary-monitors.ts:1891` requires the quarantined Chronicle boundary to be present, which documents the fallback path instead of making the selected-normal import graph fail closed.

**Fix:** Resolve local imports for every selected route, including pages, and reject selected-normal import graphs that reach `@cowards/persistence`, `@cowards/service`, `@cowards/persistence/quarantine-lifecycle`, `createPostgresChronicleStore`, `buildPublicMatchSetResultDto`, or `refreshMatchSetStatus`. Add `apps/web/app/matches/[matchId]/replay/page.tsx` and `apps/web/app/matches/server.ts` to strict boundary coverage, or split public selected replay access into a Go-only server module that has no TypeScript persistence imports.

## Warnings

### WARNING WR-01: Worker Quarantine Artifact Privacy Validator Still Has Denylist Gaps

**File:** `scripts/check-boundary-monitors.ts:277`

**Issue:** The validator now rejects obvious keys like `token` and `strategyMemory`, but it still uses case-sensitive substring markers and misses required variants. A synthetic otherwise-valid artifact with `diagnosticExample: { ownerDebug: true }` is rejected, but `diagnosticExample: { note: "owner debug" }`, `diagnosticExample: { DATABASE_URL: "postgres://x" }`, `diagnosticExample: { dsn: "postgres://x" }`, and `diagnosticExample: { source: "strategy code" }` are accepted. That leaves gaps for the prior denylist's owner debug, DB DSN, and Strategy source classes.

**Fix:** Normalize keys and strings before scanning, include snake_case and spaced variants such as `owner_debug`, `owner debug`, `db_dsn`, `database_url`, `dsn`, and `strategy source`, and add value-pattern checks for DSN-like strings such as `postgres://`. Extend tests to mutate the artifact with each denied class and assert rejection.

---

_Reviewed: 2026-05-24T21:05:58Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
