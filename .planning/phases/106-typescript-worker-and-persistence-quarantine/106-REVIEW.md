---
phase: 106-typescript-worker-and-persistence-quarantine
reviewed: 2026-05-24T21:11:32Z
depth: deep
re_review_of:
  - c2fca1479751c091ec6ea3aadd5ff0ced688ea7f
  - 8863ac18e56ca3aa5977c3ce1978e53d8f95ffef
files_reviewed: 18
files_reviewed_list:
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/replay-fixture.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/worker/src/runner.test.ts
  - packages/persistence/package.json
  - packages/persistence/src/index.ts
  - packages/persistence/src/quarantine-lifecycle.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-service-boundary-imports.test.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-worker-quarantine.json
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 106: Final Code Review Re-Review

**Reviewed:** 2026-05-24T21:11:32Z
**Depth:** deep
**Commits:** `c2fca1479751c091ec6ea3aadd5ff0ced688ea7f`, `8863ac18e56ca3aa5977c3ce1978e53d8f95ffef`
**Status:** issues_found

## Summary

Final re-review of the Phase 106 fixes against the current review findings.

CR-01 is resolved. Chronicle persistence is no longer exported from `@cowards/persistence` root or from the public `@cowards/persistence/chronicle-store` package subpath, and retained lifecycle access is isolated behind `@cowards/persistence/quarantine-lifecycle`.

CR-02 is only partially resolved. The replay page is now included in `strictMigratedFiles`, and the service boundary analyzer recursively follows local imports from `apps/web/app/matches/[matchId]/replay/page.tsx` to `apps/web/app/matches/server.ts`. However, the new strict allowlist suppresses every `@cowards/persistence` import in the replay server/helpers, so the selected replay page chain can still reach disallowed persistence modules and symbols without failing the monitor.

WR-01 remains open. The worker quarantine artifact privacy validator rejects the new covered examples, but it still performs exact case-sensitive substring checks and still accepts DSN-like values and strategy-source-like values that were called out in the prior warning.

Supporting checks run:

- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/check-service-boundary-imports.test.ts scripts/generate-typescript-backend-inventory.test.ts apps/web/app/matches/server.test.ts packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/worker/src/runner.test.ts` passed: 7 files, 105 tests.
- `pnpm exec tsx -e '...validateV116TypeScriptWorkerQuarantineArtifact probes...'` rejected `owner debug`, `DATABASE_URL`, and `dsn`, but accepted `{ connection: "postgres://x" }` and `{ source: "strategy code" }`.
- `pnpm exec tsx -e '...analyzeServiceBoundaryImports synthetic replay chain...'` accepted a replay page -> `apps/web/app/matches/server.ts` chain importing `buildPublicMatchSetResultDto` from `@cowards/persistence/competition` with zero strict offenses.

## Critical Issues

### BLOCKER CR-02: Selected Replay Strict Chain Still Allows Broad Persistence Reachability

**File:** `scripts/check-service-boundary-imports.ts:43`

**Issue:** The fix adds `apps/web/app/matches/[matchId]/replay/page.tsx` to strict coverage and recursively follows the local import chain, but `strictAllowedForbiddenImports` now allows the broad `@cowards/persistence` pattern for `apps/web/app/matches/server.ts`, `apps/web/app/matches/replay-ready.ts`, and `apps/web/app/matches/replay-fixture.ts`. Because the matcher suppresses any offense whose pattern is allowed, a selected replay graph can import `@cowards/persistence/competition`, `@cowards/persistence/quarantine-lifecycle`, or other persistence subpaths without a strict failure. A synthetic replay page -> server chain importing `buildPublicMatchSetResultDto` from `@cowards/persistence/competition` returned `strictOffenses: []` and `exitCode: 0`. This does not close the prior requirement that selected-normal replay import-chain coverage fail closed for TypeScript persistence/lifecycle reachability.

**Fix:**
```ts
// Do not allow broad @cowards/persistence for selected replay dependencies.
// Either remove these entries entirely, or narrow the exception to exact
// intentionally quarantined imports and explicitly reject normal lifecycle
// symbols such as buildPublicMatchSetResultDto/refreshMatchSetStatus.
const strictAllowedForbiddenImports = new Map<string, ReadonlySet<string>>([
  ["apps/web/lib/public-service-adapter.ts", new Set(["@cowards/persistence"])],
  ["apps/web/lib/account-service-adapter.ts", new Set(["@cowards/persistence"])],
  ["apps/web/lib/workshop-analytics-service-adapter.ts", new Set(["@cowards/persistence"])],
  ["apps/web/lib/workshop-read-service-adapter.ts", new Set(["@cowards/persistence"])],
])
```

## Warnings

### WARNING WR-01: Worker Quarantine Artifact Privacy Validator Still Misses DSN And Strategy Source Variants

**File:** `scripts/check-boundary-monitors.ts:1722`

**Issue:** `assertArtifactPrivacyLeakSafe` still compares keys and string values against `forbiddenWorkerArtifactStrings` with exact, case-sensitive `includes` checks. The added markers cover some examples, but the validator still accepts DSN-like values when the key is not exactly denied and still accepts strategy-source-like values such as `{ source: "strategy code" }`. These were part of the prior warning's required denylist classes.

**Fix:**
```ts
const normalizePrivacyText = (value: string): string =>
  value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase()

const forbiddenNormalizedMarkers = new Set([
  "owner debug",
  "database url",
  "db dsn",
  "dsn",
  "strategy source",
  "strategy code",
])

const isForbiddenPrivacyText = (value: string): boolean => {
  const normalized = normalizePrivacyText(value)
  return (
    [...forbiddenNormalizedMarkers].some((marker) => normalized.includes(marker)) ||
    /\b(?:postgres|postgresql):\/\//i.test(value)
  )
}
```

Extend `scripts/check-boundary-monitors.test.ts` with separate probes for at least `{ connection: "postgres://x" }`, `{ databaseUrl: "postgres://x" }`, `{ source: "strategy code" }`, `owner_debug`, and `strategy source`.

---

_Reviewed: 2026-05-24T21:11:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
