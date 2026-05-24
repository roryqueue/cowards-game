# Phase 106 Validation

**Date:** 2026-05-24
**Scope:** TypeScript worker and persistence lifecycle quarantine

## Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm exec vitest run .planning/phases/106-typescript-worker-and-persistence-quarantine/106-worker-entrypoint.test.ts apps/worker/src/runner.test.ts` | PASS | 23 tests passed across the worker runner tests plus the adversarial executable-entrypoint test proving `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` without `COWARDS_TYPESCRIPT_WORKER_PURPOSE=rollback\|test\|parity` exits before the worker reports ready. |
| `pnpm exec vitest run packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts` | PASS | 71 tests passed. |
| `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts` | PASS | 20 tests passed. |
| `pnpm --filter @cowards/worker typecheck` | PASS | Worker TypeScript build passed. |
| `pnpm --filter @cowards/persistence typecheck` | PASS | Persistence TypeScript build passed. |
| `pnpm --filter @cowards/service typecheck` | PASS | Service TypeScript build passed. |
| `pnpm boundary:imports` | PASS | `strict_offenses=0 report_only_offenses=22`. |
| `pnpm typescript-backend:inventory` | PASS | Regenerated 184-surface inventory artifacts. |
| `pnpm typescript-backend:inventory:check` | PASS | Inventory artifacts current. |
| `pnpm boundary:monitors` | PASS | New `worker_quarantine` checks passed; live topology remains optional by default. |
| `node -e "const fs=require('node:fs'); const a=JSON.parse(fs.readFileSync('.planning/artifacts/v1.16-typescript-worker-quarantine.json','utf8')); const req=['queued_jobs','running_jobs','expired_leases','retries','exhausted_failures','incomplete_matchsets','scoring_public_evidence']; for (const k of req) if (!JSON.stringify(a).includes(k)) throw new Error('missing rollback state '+k); if (a.globalPolicies?.mixedGoAndTypeScriptOwnersAllowed !== false) throw new Error('mixed owners must be false')"` | PASS | Rollback state and mixed-owner policy check passed. |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | PASS | Go backend tests passed from cache. |

## Additional Checks

- Root export quarantine check passed with an async-IIFE form under `pnpm --filter @cowards/persistence exec tsx -e`, because the exact top-level `await` `tsx -e` form compiles eval as CJS in this environment.
- Worker guard stale-language checks passed with `rg`.
- Worker import quarantine check passed with `rg`.

## Evidence

- `apps/worker` rejects normal TypeScript job ownership even when `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript`.
- The executable worker entrypoint calls `assertTypeScriptWorkerEntrypointAllowed` before pool creation and passes resolved non-normal ownership into `runWorkerLoop`.
- `@cowards/persistence` root no longer exports lifecycle claim, completion, retry/failure, scoring refresh, MatchSet service, or manual exhibition creation helpers.
- Retained lifecycle helpers are reachable through `@cowards/persistence/quarantine-lifecycle`.
- `@cowards/service` exposes non-normal role metadata for parity, fixture, rollback, and deferred use.
- Selected public and account adapter tests confirm no local TypeScript service construction in selected Go/no-TypeScript-backend modes.
- Boundary monitors validate worker source guard tokens, quarantine export boundary, service labels, rollback artifact, and no mixed owners.

## Adversarial Coverage Addendum

**Date:** 2026-05-24

| Requirement | Focus | Behavioral Evidence | Status |
| --- | --- | --- | --- |
| QUAR-01 | Real worker entrypoint is not a normal backend worker. | `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-worker-entrypoint.test.ts` spawns the executable with `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` and no non-normal purpose, then asserts it exits with the ownership error before the ready log. | FILLED |
| QUAR-02 | Lifecycle claim/completion/scoring exports are quarantined. | `packages/persistence/src/competition.test.ts` dynamically imports `@cowards/persistence` and proves lifecycle symbols are absent, then imports `@cowards/persistence/quarantine-lifecycle` and proves the explicit quarantine subpath is the only lifecycle export boundary. | FILLED |
| QUAR-03 | Selected exhibition creation cannot use TypeScript MatchSet creation as normal backend. | `apps/web/lib/account-service-adapter.test.ts` scans selected account/fork/exhibition adapters for TypeScript backend imports and verifies selected Go account flows do not construct the local service. | FILLED |
| QUAR-04 | Selected public DTO/replay evidence paths do not lazily refresh TypeScript scoring/status. | `apps/web/lib/public-service-adapter.test.ts` routes selected public MatchSet/replay reads through the Go client only; `apps/web/app/matches/server.test.ts` verifies selected Go replay metadata/evidence do not call the Chronicle store and fail closed without Go. | FILLED |
| QUAR-05 | `@cowards/service` is non-normal support only. | `packages/service/src/service.test.ts` verifies `COWARDS_LOCAL_SERVICE_ROLE`; adapter tests verify selected Go/no-TypeScript-backend routes do not construct it. | FILLED |
| QUAR-06 | Normal TypeScript job ownership remains blocked unless purpose is rollback/test/parity. | `apps/worker/src/runner.test.ts` proves `lifecycleOwner=typescript, workerPurpose=normal` throws and rollback/test/parity are the only allowed purposes; `106-worker-entrypoint.test.ts` proves the executable rejects the same normal case. | FILLED |
| QUAR-07 | Rollback artifact is single-owner and privacy-safe. | `scripts/check-boundary-monitors.test.ts` validates required rollback states, `mixedGoAndTypeScriptOwnersAllowed=false`, and rejects private markers including Strategy memory, owner debug, tokens, DB URLs/DSNs, stack, stderr, and host paths. | FILLED |

## Residual Risks

- `pnpm boundary:monitors` ran with optional live topology checks, matching the Phase 105 default. Full live page smoke remains a Phase 108/109 concern unless local web, Go, and runtime-service processes are started with strict topology flags.
