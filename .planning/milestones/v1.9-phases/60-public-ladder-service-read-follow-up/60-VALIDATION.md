---
phase: 60
slug: public-ladder-service-read-follow-up
status: complete
nyquist_compliant: true
created: 2026-05-22
last_verified: 2026-05-22
---

# Phase 60 — Validation Strategy

## Commands

- [x] `pnpm --filter @cowards/spec contract:generate`
- [x] `pnpm --filter @cowards/spec test`
- [x] `pnpm --filter @cowards/service test`
- [x] `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- [x] `pnpm exec prettier --check packages/spec/src/schemas.ts packages/spec/src/service.ts packages/spec/src/service-fixtures.ts packages/spec/src/spec.test.ts packages/spec/src/service-contract.test.ts packages/service/src/index.ts packages/service/src/service.test.ts apps/web/lib/public-service-boundary.ts 'apps/web/app/ladder/[seasonId]/page.tsx' apps/web/app/competitive/server.ts scripts/check-service-boundary-imports.ts scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.ts`
- [x] `pnpm boundary:imports`
- [x] `pnpm boundary:monitors`
- [x] `pnpm --filter @cowards/web test -- --runInBand`
- [x] `pnpm typecheck`

## Results

- Spec tests: 30 passed.
- Service tests: 17 passed.
- Import-boundary and boundary-monitor tests: 10 passed.
- Prettier check passed for touched files.
- Web tests: 94 passed.
- Root typecheck: 12 packages successful.
- `pnpm boundary:imports`: passed with `strict_offenses=0 report_only_offenses=34`.
- `pnpm boundary:monitors`: passed with 7 public OpenAPI paths checked, 7 public route examples checked, 34 known broad web offenses baseline-gated, and 4 Go route manifest entries checked.

## Verification Targets

- READ-01: public ladder season is the selected follow-up read boundary; no Go route expansion was added.
- READ-02: ladder page reads through `@cowards/service` and preserves not-found, standings, entries, MatchSet links, counted-state explanation, and no-permanent-ratings behavior.
- READ-05: Go mutation endpoints, auth/session mutation, ladder writes, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution remain out of scope.

## Result

Passed. Phase 60 moves the public ladder season page read behind `@cowards/service` and strict import enforcement while keeping Go expansion and write/orchestration ownership unchanged.
