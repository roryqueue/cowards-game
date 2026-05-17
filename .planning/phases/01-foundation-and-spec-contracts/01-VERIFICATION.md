---
phase: 01-foundation-and-spec-contracts
status: gaps_found
verified_at: 2026-05-17T23:10:52Z
score: 10/11 requirements verified
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
    status: failed
gaps:
  - truth: "Local verification command runs typecheck, lint, unit tests, integration tests, and selected E2E tests"
    status: failed
    reason: "Root pnpm verify runs format, lint, typecheck, and turbo test, but does not invoke Playwright or any selected E2E command."
    artifacts:
      - path: "package.json"
        issue: "\"verify\" is \"pnpm format:check && pnpm lint && pnpm typecheck && pnpm test\" while \"e2e\" is a separate script."
      - path: "playwright.config.ts"
        issue: "E2E tests are configured under apps/web/e2e, but no selected E2E subset is wired into the local verification gate."
    missing:
      - "Add a selected E2E command to the local verification gate or define a separate documented local quality gate that includes it."
---

# Phase 1: Foundation and Spec Contracts Verification Report

## Verdict

**Status:** gaps_found

Phase 1 largely achieved the foundation and spec-contract goal: the monorepo exists, package boundaries are enforced at source-import level, canonical `@cowards/spec` contracts are substantive and tested, and local PostgreSQL/Redis topology is declared. One assigned requirement is not actually met: `TEST-07` says the local verification command must run selected E2E tests, but `pnpm verify` does not run Playwright or any E2E subset.

## Goal Check

| Goal Truth | Status | Evidence |
| --- | --- | --- |
| Developer can run install, dev, typecheck, lint, and test commands from repo root. | VERIFIED | Root `package.json` defines `dev`, `dev:full`, `lint`, `typecheck`, `test`, `verify`, and `e2e`; `pnpm typecheck`, `pnpm lint`, and `pnpm --filter @cowards/spec test` passed. |
| Monorepo packages exist with boundaries for spec, engine, runtime, replay, map configs, test utilities, web, and worker. | VERIFIED | `pnpm-workspace.yaml` covers `apps/*` and `packages/*`; package manifests exist for `@cowards/spec`, `engine`, `runtime-js`, `replay`, `map-configs`, `test-utils`, `web`, and `worker`. |
| Canonical TypeScript types, constants, Zod schemas, and test fixtures are importable by downstream packages. | VERIFIED | `packages/spec/src/index.ts` exports constants, schemas, types, versions, and fixtures; `@cowards/spec` tests passed 9/9. |
| Version metadata fields exist for deterministic Match reproduction. | VERIFIED | `CompatibilityVersions` and `COMPATIBILITY_VERSIONS` contain `spec`, `engine`, `runtimeJs`, `chronicle`, `strategyRevision`, and `arenaVariant`; `Match`, `ChronicleReproducibilityEnvelope`, and `StrategyRevision` carry version fields. |
| Local verification gate includes selected E2E coverage. | FAILED | `package.json` has `verify: pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`; E2E is only available as separate `pnpm e2e`. |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `package.json` | Root pnpm/Turbo scripts and local quality gate | PARTIAL | Core scripts exist, but `verify` omits selected E2E tests required by `TEST-07`. |
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
| TEST-07 | FAILED | No CI exists, and the local `pnpm verify` gate omits selected E2E tests despite `playwright.config.ts` and root `pnpm e2e` existing. |

## Integration/Data Flow

| From | To | Status | Evidence |
| --- | --- | --- | --- |
| Root workspace | Apps/packages | VERIFIED | `pnpm-workspace.yaml` and Turbo scope include app and package workspaces. |
| `@cowards/spec` | Downstream packages | VERIFIED | Downstream packages depend on `@cowards/spec`; `packages/spec/package.json` has only external `zod`, with no workspace dependency. |
| Spec constants/types | Spec schemas/fixtures/tests | VERIFIED | Fixtures parse through schemas; spec tests validate compatibility keys, initial Soldiers, action schemas, Chronicle, StrategyRevision, and oversize rejection. |
| ESLint boundary config | Effective source import policy | VERIFIED | `eslint --print-config` shows spec blocks `@cowards/engine` and runtime imports; web blocks `@cowards/runtime-js` and worker entrypoint imports. |
| E2E config | Local verify gate | FAILED | `playwright.config.ts` exists, but `pnpm verify` does not invoke `pnpm e2e` or a selected Playwright subset. |

## Automated Checks

| Check | Result | Status |
| --- | --- | --- |
| `pnpm --filter @cowards/spec test` | 1 file, 9 tests passed | PASS |
| `pnpm typecheck` | 9 workspace typecheck tasks successful | PASS |
| `pnpm lint` | 9 workspace lint tasks successful | PASS |
| `pnpm exec eslint --print-config packages/spec/src/index.ts \| rg ...` | Effective config contains spec forbidden imports | PASS |
| `pnpm exec eslint --print-config apps/web/app/page.tsx \| rg ...` | Effective config contains web runtime-js import ban | PASS |
| `docker compose config` | `docker` command not found | SKIPPED |

## Residual Risk

Docker is unavailable in this verification environment, so Compose syntax and container health were checked by file inspection only. Long-running `pnpm dev` and `pnpm dev:full` boot behavior was not started because this audit avoids live services and persistent processes.

`01-VALIDATION.md` still has stale frontmatter and tables (`wave_0_complete: false`, pending file checks) despite the implementation being present. That is planning artifact drift, not a source-code failure for the Phase 1 goal.

Later phases added `@cowards/runtime-js` as an `apps/web` package dependency for safe validation flows, but current web source does not import the executable worker entrypoint. This is acceptable for the Phase 1 boundary goal as verified by effective ESLint source-import restrictions.

## Gaps Summary

Blocking gap: `TEST-07` is not fully satisfied because the local verification command does not run selected E2E tests. Everything else required for Phase 1 foundation and spec contracts is present, substantive, wired, and covered by focused automated checks.

---

_Verified: 2026-05-17T23:10:52Z_  
_Verifier: the agent (gsd-verifier)_
