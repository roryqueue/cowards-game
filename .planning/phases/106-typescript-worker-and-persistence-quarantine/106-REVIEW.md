---
phase: 106-typescript-worker-and-persistence-quarantine
reviewed: 2026-05-24T21:21:43Z
depth: deep
re_review_of:
  - 4995a0765ea20b1fbd588a9d9d60355e9153fc03
  - 25b18ebe9c0f0617441e8c0f0ee8b5bdbce57661
files_reviewed: 4
files_reviewed_list:
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/check-service-boundary-imports.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 106: Narrow Final Code Review Re-Review

**Reviewed:** 2026-05-24T21:21:43Z
**Depth:** deep
**Commits:** `4995a0765ea20b1fbd588a9d9d60355e9153fc03`, `25b18ebe9c0f0617441e8c0f0ee8b5bdbce57661`
**Status:** issues_found

## Summary

Narrow final re-review of the remaining Phase 106 worker artifact privacy finding after `25b18eb`, plus confirmation that CR-02 remains resolved after `4995a07`.

CR-02 remains resolved. The service boundary monitor recursively includes the selected replay page dependency chain, rejects non-explicit replay persistence imports such as `@cowards/persistence/competition`, and keeps current strict offenses at zero. The explicit replay helper persistence subpaths remain limited to `@cowards/persistence/db`, `@cowards/persistence/quarantine-lifecycle`, and `@cowards/persistence/repositories` for `apps/web/app/matches/server.ts`, and `@cowards/persistence/quarantine-lifecycle` for `replay-ready.ts` and `replay-fixture.ts`.

WR-01 remains open. Commit `25b18eb` added the previously cited exact probes for `postgresql://`, `owner_debug`, `databaseUrl`, and `accessToken`, and those exact forms are now rejected. The validator still relies on exact key equality and case-sensitive string matching, so the same private classes remain passable through common unlisted spellings including `databaseURL`, `access_token`, `owner-debug`, `strategy_memory`, and uppercase `POSTGRESQL://`.

Supporting checks run:

- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts` passed: 2 files, 19 tests.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec tsx scripts/check-service-boundary-imports.ts` passed with `strict_offenses=0 report_only_offenses=17`.
- Targeted worker privacy probe rejected `owner_debug`, `databaseUrl`, and `accessToken`, but accepted `databaseURL`, `access_token`, `owner-debug`, `strategy_memory`, and `POSTGRESQL://`.

## Warnings

### WARNING WR-01: Worker Quarantine Artifact Privacy Validator Still Misses Private Variants

**File:** `scripts/check-boundary-monitors.ts:1718`

**Issue:** `assertArtifactPrivacyLeakSafe` checks object keys only by exact equality and string values with case-sensitive `includes` against `forbiddenWorkerArtifactStrings`. The current denylist now catches the exact examples added in `25b18eb`, but still permits common spelling and casing variants for the same forbidden classes, including DB URL/DSN values and private token, owner-debug, and StrategyMemory fields. A hostile or drifted artifact can therefore pass the quarantine monitor while carrying private material under names such as `databaseURL`, `access_token`, `owner-debug`, `strategy_memory`, or `POSTGRESQL://`.

**Fix:**
```ts
const normalizePrivacyText = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()

const forbiddenNormalizedMarkers = [
  "token",
  "access token",
  "strategy memory",
  "soldier memory",
  "owner debug",
  "database url",
  "db dsn",
  "dsn",
  "strategy source",
  "source text",
] as const

const isForbiddenArtifactPrivacyText = (value: string): boolean => {
  const normalized = normalizePrivacyText(value)
  return (
    forbiddenNormalizedMarkers.some((marker) =>
      normalized.includes(marker),
    ) || /\b(?:postgres|postgresql):\/\//i.test(value)
  )
}
```

Use this helper for both object keys and string values, and add regression tests for `databaseURL`, `access_token`, `owner-debug`, `strategy_memory`, and uppercase `POSTGRESQL://` in addition to the exact probes already covered.

---

_Reviewed: 2026-05-24T21:21:43Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
