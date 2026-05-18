---
phase: 01-foundation-and-spec-contracts
status: passed
verified_at: 2026-05-17T23:21:43Z
score: 11/11 requirements verified
requirements:
  - id: FOUND-01
    status: verified
  - id: FOUND-02
    status: verified
  - id: FOUND-03
    status: verified
  - id: FOUND-04
    status: verified
  - id: FOUND-05
    status: verified
  - id: SPEC-01
    status: verified
  - id: SPEC-02
    status: verified
  - id: SPEC-03
    status: verified
  - id: SPEC-04
    status: verified
  - id: SPEC-05
    status: verified
  - id: TEST-07
    status: verified
gaps: []
---

# Phase 1: Foundation and Spec Contracts Verification Report

## Verdict

**Status:** verified

Phase 1 achieved the foundation and spec-contract goal: the monorepo exists, package boundaries are enforced at source-import level, canonical `@cowards/spec` contracts are substantive and tested, local PostgreSQL/Redis topology is declared, and the local verification gate now runs selected Playwright E2E coverage through the stable replay fixture smoke.

## Goal Check

| Goal Truth | Status | Evidence |
| --- | --- | --- |
| Developer can run install, dev, typecheck, lint, and test commands from repo root. | VERIFIED | Root `package.json` defines `dev`, `dev:full`, `lint`, `typecheck`, `test`, `verify`, and `e2e`; `pnpm typecheck`, `pnpm lint`, and `pnpm --filter @cowards/spec test` passed. |
| Monorepo packages exist with boundaries for spec, engine, runtime, replay, map configs, test utilities, web, and worker. | VERIFIED | `pnpm-workspace.yaml` covers `apps/*` and `packages/*`; package manifests exist for `@cowards/spec`, `engine`, `runtime-js`, `replay`, `map-configs`, `test-utils`, `web`, and `worker`. |
| Canonical TypeScript types, constants, Zod schemas, and test fixtures are importable by downstream packages. | VERIFIED | `packages/spec/src/index.ts` exports constants, schemas, types, versions, and fixtures; `@cowards/spec` tests passed 9/9. |
| Version metadata fields exist for deterministic Match reproduction. | VERIFIED | `CompatibilityVersions` and `COMPATIBILITY_VERSIONS` contain `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`; `Match`, `ChronicleReproducibilityEnvelope`, and `StrategyRevision` carry version fields. |
| Local verification gate includes selected E2E coverage. | VERIFIED | `package.json` defines `e2e:smoke: PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`, and `verify` ends with `pnpm e2e:smoke`; `pnpm verify` passed with 2 Playwright fixture tests. |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `package.json` | Root pnpm/Turbo scripts and local quality gate | VERIFIED | Core scripts exist, and `verify` runs format, lint, typecheck, unit/integration tests, then selected E2E smoke coverage. |
| `pnpm-workspace.yaml` | Workspace globs for apps/packages | VERIFIED | Includes `apps/*` and `packages/*`. |
| `turbo.json` | Build/lint/typecheck/test/dev task graph | VERIFIED | Contains `build`, `lint`, `typecheck`, `test`, and persistent uncached `dev`. |
| `tsconfig.base.json`, `tsconfig.json` | Strict TS config and project references | VERIFIED | Strict flags and package/app references are present. |
| `eslint.config.mjs` | Import-boundary enforcement | VERIFIED | Effective printed configs block `packages/spec` importing engine/runtime/replay internals and block web source importing runtime-js. |
| `compose.yaml`, `.env.example` | Local PostgreSQL/Redis topology | VERIFIED with residual risk | Declares `postgres:18`, `redis:8`, healthchecks, and local URLs; Docker CLI unavailable for `docker compose config`. |
| `apps/web`, `apps/worker` | Minimal runnable app/worker boundaries | VERIFIED | Package manifests and source entrypoints exist; later phases expanded them without breaking Phase 1 source-import checks. |
| `packages/spec/src/*` | Canonical contracts, schemas, versions, fixtures | VERIFIED | Substantive exports, schemas, constants, version object, valid/invalid fixtures, and tests exist. |

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| FOUND-01 | VERIFIED | Root pnpm workspace has `packageManager: pnpm@11.1.2`, lockfile exists, and package scripts run through pnpm. |
| FOUND-02 | VERIFIED | `pnpm dev:full` starts Docker Compose `postgres redis` then Turbo dev; `compose.yaml` defines real PostgreSQL and Redis services. |
| FOUND-03 | VERIFIED | Root scripts expose `test` and `e2e`; typecheck/lint/spec-test commands were run successfully from root. |
| FOUND-04 | VERIFIED | ESLint source boundaries protect spec isolation, engine isolation, and web runtime execution imports; `pnpm lint` passed. |
| FOUND-05 | VERIFIED | `COMPATIBILITY_VERSIONS`, `StrategyRevision`, `ChronicleReproducibilityEnvelope`, `Match`, and `ArenaVariant` version fields support reproducibility metadata. |
| SPEC-01 | VERIFIED | Canonical types exist for Player, Strategy, StrategyRevision, Soldier, Match, MatchSet, ArenaVariant, Chronicle, and runtime input/output contracts. |
| SPEC-02 | VERIFIED | Zod schemas validate runtime inputs/outputs, actions, StrategyRevision, Chronicle, ArenaVariant, and version metadata. |
| SPEC-03 | VERIFIED | Constants cover 12x12 bounds, starting positions, activation counts, 12-cycle budget, memory limits, objective limit, and source size limit. |
| SPEC-04 | VERIFIED | Discriminated/string unions cover statuses, directions, actions, AwarenessCell contents, Chronicle event types, and runtime violation types. |
| SPEC-05 | VERIFIED | `fixtures.valid` and `fixtures.invalid` provide starting boards, Soldiers, Arena Variants, seeds, strategy/runtime examples, and named rule scenarios. |
| TEST-07 | VERIFIED | Root `pnpm verify` now invokes `pnpm e2e:smoke`, which runs `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`; `pnpm verify` passed on 2026-05-17. |

## Integration/Data Flow

| From | To | Status | Evidence |
| --- | --- | --- | --- |
| Root workspace | Apps/packages | VERIFIED | `pnpm-workspace.yaml` and Turbo scope include app and package workspaces. |
| `@cowards/spec` | Downstream packages | VERIFIED | Downstream packages depend on `@cowards/spec`; `packages/spec/package.json` has only external `zod`, with no workspace dependency. |
| Spec constants/types | Spec schemas/fixtures/tests | VERIFIED | Fixtures parse through schemas; spec tests validate compatibility keys, initial Soldiers, action schemas, Chronicle, StrategyRevision, and oversize rejection. |
| ESLint boundary config | Effective source import policy | VERIFIED | `eslint --print-config` shows spec blocks `@cowards/engine` and runtime imports; web blocks `@cowards/runtime-js` and worker entrypoint imports. |
| E2E config | Local verify gate | VERIFIED | `playwright.config.ts` runs `apps/web/e2e`; root `verify` invokes the selected fixture-backed replay Playwright smoke. |

## Automated Checks

| Check | Result | Status |
| --- | --- | --- |
| `pnpm --filter @cowards/spec test` | 1 file, 9 tests passed | PASS |
| `pnpm typecheck` | 9 workspace typecheck tasks successful | PASS |
| `pnpm lint` | 9 workspace lint tasks successful | PASS |
| `pnpm exec eslint --print-config packages/spec/src/index.ts \| rg ...` | Effective config contains spec forbidden imports | PASS |
| `pnpm exec eslint --print-config apps/web/app/page.tsx \| rg ...` | Effective config contains web runtime-js import ban | PASS |
| `pnpm e2e:smoke` | `replay.fixture.spec.ts` passed on desktop and mobile projects, 2 passed | PASS |
| `pnpm verify` | Format, lint, typecheck, Turbo tests, and selected replay fixture E2E smoke passed | PASS |
| `docker compose config` | `docker` command not found | SKIPPED |

## Residual Risk

Docker is unavailable in this verification environment, so Compose syntax and container health were checked by file inspection only. Long-running `pnpm dev` and `pnpm dev:full` boot behavior was not started because this audit avoids live services and persistent processes.

Running Playwright/Next locally generated `test-results/.last-run.json` and updated the Next-managed `apps/web/next-env.d.ts` route import during verification. Those generated local changes were removed/restored after the checks; future local E2E runs may regenerate them.

Later phases added `@cowards/runtime-js` as an `apps/web` package dependency for safe validation flows, but current web source does not import the executable worker entrypoint. This is acceptable for the Phase 1 boundary goal as verified by effective ESLint source-import restrictions.

## Gaps Summary

No blocking gaps remain for Phase 1. `TEST-07` is satisfied by the root `e2e:smoke` script and its inclusion in `pnpm verify`.

---

_Verified: 2026-05-17T23:21:43Z_
_Verifier: the agent (gsd-verifier)_
