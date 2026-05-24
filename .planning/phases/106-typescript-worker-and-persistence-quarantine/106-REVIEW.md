---
phase: 106-typescript-worker-and-persistence-quarantine
reviewed: 2026-05-24T21:17:46Z
depth: deep
re_review_of:
  - c2fca1479751c091ec6ea3aadd5ff0ced688ea7f
  - 8863ac18e56ca3aa5977c3ce1978e53d8f95ffef
  - 4995a07b608b91fbe57147a5fa5a266587fe935d
files_reviewed: 11
files_reviewed_list:
  - apps/web/app/matches/[matchId]/replay/page.tsx
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/replay-fixture.ts
  - packages/persistence/package.json
  - packages/persistence/src/index.ts
  - packages/persistence/src/quarantine-lifecycle.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/check-service-boundary-imports.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 106: Final-Final Code Review Re-Review

**Reviewed:** 2026-05-24T21:17:46Z
**Depth:** deep
**Commits:** `c2fca1479751c091ec6ea3aadd5ff0ced688ea7f`, `8863ac18e56ca3aa5977c3ce1978e53d8f95ffef`, `4995a07b608b91fbe57147a5fa5a266587fe935d`
**Status:** issues_found

## Summary

Final-final re-review of the remaining Phase 106 findings after `4995a07`.

CR-02 is resolved. The selected replay page is in the strict chain, local replay dependencies are recursively followed, and the replay helper allowlist now rejects both root `@cowards/persistence` and non-explicit subpaths such as `@cowards/persistence/competition`. The explicit replay persistence subpaths allowed by the monitor are limited to `@cowards/persistence/db`, `@cowards/persistence/quarantine-lifecycle`, and `@cowards/persistence/repositories` for `apps/web/app/matches/server.ts`, and only `@cowards/persistence/quarantine-lifecycle` for `replay-ready.ts` and `replay-fixture.ts`.

WR-01 remains open. The worker quarantine artifact validator now catches the exact requested examples for `token`, `strategyMemory`, `owner debug`, `DATABASE_URL`, `postgres://`, `source`, and `sourceText`, but it still relies on exact case-sensitive marker checks and misses common private artifact variants including `postgresql://`, `owner_debug`, `databaseUrl`, and `accessToken`.

No obvious regression from the replay-chain fixes was found.

Supporting checks run:

- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts` passed: 2 files, 19 tests.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec tsx scripts/check-service-boundary-imports.ts` passed with `strict_offenses=0 report_only_offenses=17`.
- Targeted replay strict-chain probe rejected root `@cowards/persistence` and `@cowards/persistence/competition`, and allowed only the explicit replay subpaths named above.
- Targeted worker privacy probe rejected `token`, `strategyMemory`, `owner debug`, `DATABASE_URL`, `postgres://`, `source`, and `sourceText`, but accepted `postgresql://`, `owner_debug`, `databaseUrl`, and `accessToken`.

## Warnings

### WARNING WR-01: Worker Quarantine Artifact Privacy Validator Still Misses Private Variants

**File:** `scripts/check-boundary-monitors.ts:1726`

**Issue:** `assertArtifactPrivacyLeakSafe` still checks keys with exact equality and string values with exact case-sensitive `includes` against `forbiddenWorkerArtifactStrings`. The current denylist catches the specific fixed probes, but a valid PostgreSQL DSN using `postgresql://` and common field-name variants such as `owner_debug`, `databaseUrl`, and `accessToken` still pass. That leaves the quarantine artifact privacy gate vulnerable to leaking the same token, owner-debug, and DB-DSN classes under common spellings.

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

Use this helper for both object keys and string values, and add regression tests for `postgresql://example`, `owner_debug`, `databaseUrl`, and `accessToken` in addition to the exact probes already covered.

---

_Reviewed: 2026-05-24T21:17:46Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
