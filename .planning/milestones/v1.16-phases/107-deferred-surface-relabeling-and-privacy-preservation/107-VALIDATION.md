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

## Post-Fix Validation Pass After `6f012b9` - 2026-05-24

**Scope:** Re-ran the previously escalated DEF-01 / DEF-02 / DEF-06 gaps after `6f012b9` (`fix(phase-107): classify deferred persistence surfaces precisely`). Focus was the final TypeScript surface label semantics for `packages/persistence/src/workshop.ts` and `packages/persistence/src/ladder.ts`, plus monitor behavior for path-level semantic drift and public-output/privacy enum drift.

### Commands Run

```bash
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts
pnpm exec tsx -e '<standalone mutation probe: packages/persistence/src/workshop.ts -> deferred-service-support/owner-debug; fail if validator accepts drift>'
pnpm exec tsx -e '<standalone mutation probe: packages/persistence/src/ladder.ts -> private-owner-debug-replay/owner-debug plus publicOutputPrivacy/privacyClass invalid enum values; fail if validator accepts drift>'
pnpm typescript-surface-labels:check
pnpm exec tsx scripts/check-boundary-monitors.ts
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'
```

### Results

- Focused generator/monitor tests: **passed**, 2 files passed, 18 tests passed.
- Full Phase 107 focused suite: **passed**, 8 files passed, 61 tests passed.
- `pnpm typescript-surface-labels:check`: **passed**, final surface label artifacts current.
- `pnpm exec tsx scripts/check-boundary-monitors.ts`: **passed**, including `[surface_labels] v1.16 final TypeScript surface labels: 185 final TypeScript surface labels checked`.
- Exact committed artifact labels now match the required semantics:

| Path | Required label | Observed label | Status |
| --- | --- | --- | --- |
| `packages/persistence/src/workshop.ts` | `taxonomyRole=deferred`, `surfaceLabel=deferred-workshop-runtime-support`, `capabilityGroup=Workshop` | `taxonomyRole=deferred`, `surfaceLabel=deferred-workshop-runtime-support`, `capabilityGroup=Workshop` | green |
| `packages/persistence/src/ladder.ts` | `taxonomyRole=deferred`, `surfaceLabel=deferred-ladder-mutation`, `capabilityGroup=ladder` | `taxonomyRole=deferred`, `surfaceLabel=deferred-ladder-mutation`, `capabilityGroup=ladder` | green |

### Remaining Escalation

**BLOCKER - DEF-06 monitor coverage still accepts path-level semantic drift and privacy enum drift**

The normal monitor command passes against the current artifact, but adversarial mutation probes show `validateV116FinalTypeScriptSurfaceLabels()` still accepts bad future drift:

| Probe | Expected | Actual |
| --- | --- | --- |
| Mutate `packages/persistence/src/workshop.ts` from `deferred-workshop-runtime-support` / `Workshop` to `deferred-service-support` / `owner-debug` | Monitor rejects path-level semantic drift | `ACCEPTED_DRIFT` |
| Mutate `packages/persistence/src/ladder.ts` from `deferred-ladder-mutation` / `ladder` to `private-owner-debug-replay` / `owner-debug` with owner-debug gate language | Monitor rejects path-level semantic drift | `ACCEPTED_DRIFT` |
| Mutate a row's `publicOutputPrivacy` to invalid enum value `public` | Monitor rejects privacy enum drift | `ACCEPTED_DRIFT` |
| Mutate a row's `privacyClass` to invalid enum value `public` | Monitor rejects privacy enum drift | `ACCEPTED_DRIFT` |

The combined ladder/privacy mutation probe exited `1` with this exact output:

```text
ladder path semantic drift: ACCEPTED_DRIFT
publicOutputPrivacy enum drift: ACCEPTED_DRIFT
privacyClass enum drift: ACCEPTED_DRIFT
```

Implementation files are read-only for this validation pass, so the monitor validator was not changed. The post-`6f012b9` state is **PARTIAL**: the final artifact labels for DEF-01/DEF-02/DEF-06 are corrected, but DEF-06 monitor coverage does not yet prove those semantics are protected from future path-level or privacy-enum drift.

## Post-Fix Validation Pass After `810a03e` - 2026-05-24

**Scope:** Re-ran the outstanding DEF-06 monitor coverage gaps after `810a03e` (`fix(phase-107): enforce path-level surface label semantics`). Focus was adversarial drift in `validateV116FinalTypeScriptSurfaceLabels()` rather than the generator alone.

### Commands Run

```bash
pnpm exec vitest run scripts/check-boundary-monitors.test.ts
pnpm boundary:monitors
```

### Results

- `scripts/check-boundary-monitors.test.ts`: **passed**, 11 tests passed.
- `pnpm boundary:monitors`: **passed**, including `[surface_labels] v1.16 final TypeScript surface labels: 185 final TypeScript surface labels checked`.
- `validateV116FinalTypeScriptSurfaceLabels()` now rejects:
  - `packages/persistence/src/workshop.ts` drift from `deferred-workshop-runtime-support` / `Workshop` to `deferred-service-support` / `owner-debug`.
  - `packages/persistence/src/ladder.ts` drift from `deferred-ladder-mutation` / `ladder` to `private-owner-debug-replay` / `owner-debug`.
  - `packages/persistence/src/governance.ts` drift away from `deferred-governance-admin-mutation` / `governance-admin`.
  - Invalid `privacyClass` enum values such as `public`.
  - Invalid `publicOutputPrivacy` enum values such as `public`.

### Final Validation Status

**PASS.** The original artifact label bug and the follow-up monitor coverage bug are both closed. DEF-01, DEF-02, DEF-03, DEF-04, DEF-05, and DEF-06 are covered by generator tests, monitor tests, focused route/privacy tests, current artifacts, and boundary monitors. Phase 108 can rely on the Phase 107 surface-label lane as a strict drift monitor.
