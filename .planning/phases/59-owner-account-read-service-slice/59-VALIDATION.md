---
phase: 59
slug: owner-account-read-service-slice
status: complete
nyquist_compliant: true
created: 2026-05-22
last_verified: 2026-05-22
---

# Phase 59 — Validation Strategy

## Commands

- [x] `pnpm --filter @cowards/service test`
- [x] `pnpm --filter @cowards/spec test`
- [x] `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- [x] `pnpm boundary:imports`
- [x] `pnpm boundary:monitors`
- [x] `pnpm --filter @cowards/web test -- --runInBand`
- [x] `pnpm typecheck`

## Results

- Service tests: 14 passed.
- Spec tests: 30 passed.
- Import-boundary and boundary-monitor tests: 10 passed.
- Web tests: 94 passed.
- Root typecheck: 12 packages successful.
- `pnpm boundary:imports`: passed with `strict_offenses=0 report_only_offenses=35`.
- `pnpm boundary:monitors`: passed with 35 known broad web offenses baseline-gated.

## Verification Targets

- ACCT-01: account session snapshot reads through `@cowards/service`.
- ACCT-02: account Strategy Revision list reads through `@cowards/service` without Strategy source.
- ACCT-03: owner revision list authorizes by session token and omits session ids, bearer tokens, private handles, stack traces, stderr, host paths, and runtime internals.
- ACCT-04: revision saves, source retrieval, validation/test execution, submissions, MatchSet creation, analytics reruns, exports, and other mutation flows remain out of the migrated read slice.
- ACCT-05: selected account read files and closure are strict import-gated; the mixed revisions route remains non-strict because its `POST` mutation is intentionally unchanged.

## Result

Passed. Phase 59 moves owner account reads behind service-owned DTOs without moving owner mutations, Strategy source retrieval, Strategy execution, Go ownership, or runtime support.
