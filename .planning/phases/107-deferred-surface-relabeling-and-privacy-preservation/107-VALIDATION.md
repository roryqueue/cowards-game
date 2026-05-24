# Phase 107 Validation

**Validated:** 2026-05-24T22:03:35Z

## Commands

```bash
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'
pnpm boundary:imports
pnpm typescript-backend:inventory:check
pnpm typescript-surface-labels:check
pnpm boundary:monitors
pnpm --filter @cowards/web typecheck
```

## Results

- Focused Vitest: **8 files passed, 56 tests passed**.
- `pnpm boundary:imports`: **strict_offenses=0, report_only_offenses=17**.
- `pnpm typescript-backend:inventory:check`: **passed**, inventory current at 185 surfaces.
- `pnpm typescript-surface-labels:check`: **passed**, final label artifacts current at 185 surfaces.
- `pnpm boundary:monitors`: **passed**, including `[surface_labels] v1.16 final TypeScript surface labels: 185 final TypeScript surface labels checked`.
- `pnpm --filter @cowards/web typecheck`: **passed**.

## Monitor Evidence

The boundary monitor now validates:

- Required groups: Workshop, ladder, governance/admin, owner-debug, test-support, fixture, parity, rollback, runtime service, runtime adapter, frontend-only.
- `selectedNormal=true` only for frontend-only, runtime-service, and runtime-adapter rows.
- Deferred rows include gate, owner, risk, privacy class, future migration, and monitor status.
- Owner-debug rows require enablement gates, owner authorization language, and no public fallback.
- Test-support and fixture rows require test/playwright/explicit fixture gates and no normal product runtime traffic.
- Public-output examples reject private markers and fields.

## Residual Risks

- Phase 107 does not migrate Workshop, ladder, governance/admin, or full owner-debug replay to Go; those remain explicitly deferred.
- `pnpm boundary:monitors` ran with optional live topology smoke only. Strict live no-TypeScript-backend topology remains Phase 108 scope.

## Adversarial Validation Pass - 2026-05-24

**Scope:** DEF-01 through DEF-06 exact validation coverage, focused on final label artifact coverage, Workshop/ladder/governance/deferred labels, owner-debug requester binding/private authorization/no public fallback, test-support and fixture gates, public-output privacy across artifact fields/markdown/default outputs, and monitor integration.

### Tests Added

- `scripts/generate-typescript-surface-labels.test.ts`
  - Verifies the committed markdown artifact includes every source inventory path, not just matching JSON counts.
  - Verifies representative Workshop, ladder, and governance/admin deferred surfaces are labeled by their actual capability group and not a generic or unrelated group.
  - Verifies shareable label fields and rendered markdown remain public-output safe.
- `scripts/check-boundary-monitors.test.ts`
  - Verifies `runBoundaryMonitorChecks()` includes the `surface_labels` lane.
- `apps/web/app/api/test-support/replay-fixture/route.test.ts`
  - Verifies default 404 and enabled fixture catalog outputs pass the canonical public-output privacy guard.
- `apps/web/app/api/test-support/run-worker-once/route.test.ts`
  - Verifies default 404 output passes the canonical public-output privacy guard.
- `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts`
  - Verifies success, forbidden, missing, and storage-unavailable default outputs pass the canonical public-output privacy guard.
- `apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts`
  - Verifies success, missing, and storage-unavailable default outputs pass the canonical public-output privacy guard.

### Commands Run

```bash
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts
pnpm typescript-surface-labels:check
pnpm exec tsx scripts/check-boundary-monitors.ts
pnpm exec vitest run scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'
```

### Results

- Focused suite with new adversarial label semantics: **failed**, 8 files run, 60 passed, 1 failed.
- Isolated adversarial label test: **failed**, 6 passed, 1 failed.
- Focused suite excluding the known failing exact-label assertion: **passed**, 7 files passed, 54 tests passed.
- `pnpm typescript-surface-labels:check`: **passed**, artifacts current.
- `pnpm exec tsx scripts/check-boundary-monitors.ts`: **passed**, including `[surface_labels] v1.16 final TypeScript surface labels: 185 final TypeScript surface labels checked`.

### Escalated Blocker

**BLOCKER - DEF-01 / DEF-02 / DEF-06 exact deferred label semantics**

The final label artifact has exact path coverage, but representative deferred product surfaces are not all labeled by their actual capability:

| Path | Expected | Actual |
| --- | --- | --- |
| `packages/persistence/src/workshop.ts` | `taxonomyRole=deferred`, `surfaceLabel=deferred-workshop-runtime-support`, `capabilityGroup=Workshop` | `taxonomyRole=deferred`, `surfaceLabel=deferred-service-support`, `capabilityGroup=owner-debug` |
| `packages/persistence/src/ladder.ts` | `taxonomyRole=deferred`, `surfaceLabel=deferred-ladder-mutation`, `capabilityGroup=ladder` | `taxonomyRole=deferred`, `surfaceLabel=private-owner-debug-replay`, `capabilityGroup=owner-debug` |

This is an implementation gap in `scripts/generate-typescript-surface-labels.ts`: the classifier can route deferred Workshop/ladder persistence surfaces into generic or owner-debug labels, while the existing monitor only checks required groups and broad policy fields. Implementation files are read-only for this validation pass, so no generator fix was applied.

### Debug Iterations

| Iteration | Failure Type | Action | Result |
| --- | --- | --- | --- |
| 1 | Test import error | Changed script-level privacy import to the repo-local helper path used by the generator. | Import fixed. |
| 2 | Test expectation too broad | Replaced markdown ban on gate terminology with canonical public-output guard plus secret marker checks. | Privacy assertion fixed. |
| 3 | Assertion failure against committed artifact behavior | Collected all representative mismatches without weakening expected semantics. | Confirmed implementation blocker above. |
