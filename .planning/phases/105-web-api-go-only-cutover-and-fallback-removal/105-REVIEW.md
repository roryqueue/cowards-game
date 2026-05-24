---
phase: 105-web-api-go-only-cutover-and-fallback-removal
reviewed: 2026-05-24T20:20:28Z
depth: standard
post_validation_review_of:
  - 7d9ca6a
  - ccd5935
diff_base: 4e278fb
files_reviewed: 7
files_reviewed_list:
  - apps/web/app/account/page.tsx
  - apps/web/app/exhibitions/new/page.tsx
  - "apps/web/app/ladder/[seasonId]/page.tsx"
  - apps/web/lib/public-service-adapter.ts
  - tests/phase-105-selected-go-route-behavior.test.ts
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VALIDATION.md
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 105: Post-Validation Code Review Report

**Reviewed:** 2026-05-24T20:20:28Z
**Depth:** standard
**Review Range:** `4e278fb..7d9ca6a`
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Post-validation review of final Phase 105 validation-fix commit `7d9ca6a` plus changes after `4e278fb`.

The selected Go route tests, public current-user helper, API route adapters, privacy-safe error responses, and live topology evidence update were reviewed. The API adapters still call Go clients directly for the selected auth/account/exhibition flows, public read routes do not introduce a TypeScript backend fallback in strict Go/no-TypeScript mode, and the public current-user helper suppresses Go session failures to anonymous state instead of exposing private diagnostics. The validation artifact now records a strict live topology rerun with the web frontend, Go backend, and runtime service running.

One fail-closed blocker remains in the account and exhibition page render path: a Go revision-read outage after a successful current-user read is converted into signed-in UI with an empty revision list.

## Critical Issues

### CR-01: BLOCKER - Signed-in pages do not fail closed when Go revision reads fail

**File:** `apps/web/app/account/page.tsx:15`
**File:** `apps/web/app/exhibitions/new/page.tsx:17`

**Issue:** Both pages assign `user` before awaiting `listAccountReadRevisions()` inside the same `try`. If `getCurrentAccountReadUser()` succeeds but the selected Go-backed revision read throws `GoBackendServiceUnavailableError`, the `catch` sets `accountUnavailable` but leaves `user` truthy and `revisions` as `[]`. Rendering then branches on `user`, so `/account` shows the signed-in account view with an empty revision state, and `/exhibitions/new` renders `ExhibitionClient` with no revisions. That masks a selected Go account-revision outage as a valid empty account/exhibition flow instead of failing closed.

**Fix:**

```tsx
try {
  const nextUser = await getCurrentAccountReadUser()
  const nextRevisions = nextUser ? await listAccountReadRevisions() : []
  user = nextUser
  revisions = nextRevisions
} catch (error) {
  if (
    isGoBackendServiceUnavailableError(error) ||
    (error instanceof CompetitiveInputError && error.status === 401)
  ) {
    user = null
    revisions = []
    accountUnavailable = isGoBackendServiceUnavailableError(error)
  } else {
    throw error
  }
}
```

Also make the unavailable branch take precedence over the signed-in branch when `accountUnavailable` is true, so `NewExhibitionPage` cannot render `ExhibitionClient` unless both the current user and revision list loaded successfully.

## Verification

- `pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts` passed: 3 files, 20 tests.

## Notes

- No source files were modified during this review.
- The existing focused tests do not cover the page-level partial-success case where current-user lookup succeeds and revision listing fails.
- Privacy review did not find stack traces, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, tokens, DB DSNs, host paths, or raw error causes rendered by the changed account/exhibition/public-current-user paths.

---

_Reviewed: 2026-05-24T20:20:28Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
