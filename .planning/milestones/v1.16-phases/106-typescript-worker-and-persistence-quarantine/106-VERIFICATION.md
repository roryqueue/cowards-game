---
phase: 106-typescript-worker-and-persistence-quarantine
verified: 2026-05-24T21:37:22Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
---

# Phase 106: TypeScript Worker and Persistence Quarantine Verification Report

**Phase Goal:** Developers can verify TypeScript DB-owning worker and persistence lifecycle code cannot act as the normal backend after v1.15.
**Verified:** 2026-05-24T21:37:22Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | QUAR-01: `apps/worker` is no longer a normal backend worker entrypoint and can run only as explicit rollback, parity, or test infrastructure. | VERIFIED | `apps/worker/src/index.ts` calls `assertTypeScriptWorkerEntrypointAllowed(process.env)` before `createDatabasePool()`. `apps/worker/src/runner.ts` accepts only `rollback`, `test`, or `parity`; normal purpose throws `TypeScriptWorkerOwnershipError`. Entrypoint spawn test passed. |
| 2 | QUAR-02: TypeScript job claim, lease, retry, failure, Match completion, Chronicle persistence, and MatchSet scoring modules are no longer exported or reachable as normal runtime backend paths. | VERIFIED | Dynamic import showed normal `@cowards/persistence` root exports none of `claimNextMatchJob`, `completeMatch`, `recordAttemptFailure`, `refreshMatchSetStatus`, `createMatchSetService`, `createManualExhibitionMatchSet`, or `buildPublicMatchSetResultDto`; quarantine subpath exports them. `scripts/check-boundary-monitors.ts` checks root export absence and quarantine import boundary. |
| 3 | QUAR-03: TypeScript MatchSet creation services for selected normal exhibition flows are deleted, quarantined, or relabeled as rollback/deferred/test-only. | VERIFIED | `createManualExhibitionMatchSet` remains in `packages/persistence/src/competition.ts` but is listed in `TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.quarantinedFunctions` with `selectedNormalBackend: false`. Selected account/exhibition API adapter tests scan selected route files and verify no `@cowards/persistence` or `@cowards/service` fallback imports. |
| 4 | QUAR-04: TypeScript public DTO reads no longer lazily refresh Go-owned MatchSet scoring/status in selected normal public evidence paths. | VERIFIED | `buildPublicMatchSetResultDto` still calls `refreshMatchSetStatus`, but only as non-normal service support. `apps/web/lib/public-service-adapter.ts` selected public reads call the Go client and require Go URL; `apps/web/app/matches/server.ts` selected replay metadata/evidence branches call Go clients before Chronicle store fallback. Tests prove selected replay metadata/evidence do not call the Chronicle store. |
| 5 | QUAR-05: `@cowards/service` is parity oracle, fixture generator, rollback reference, or deferred support rather than the normal backend for selected routes. | VERIFIED | `packages/service/src/index.ts` exports `COWARDS_LOCAL_SERVICE_ROLE` with `normalBackend: false`, `selectedNormalBackend: false`, and roles `parity-oracle`, `fixture-generator`, `rollback-reference`, `deferred-support`. Account/public adapter tests prove selected Go modes do not construct the local TypeScript service. |
| 6 | QUAR-06: Tests prove normal TypeScript job ownership remains blocked unless worker purpose is rollback, test, or parity. | VERIFIED | `apps/worker/src/runner.test.ts` asserts `lifecycleOwner: "typescript", workerPurpose: "normal"` throws and rollback/test/parity are allowed. `106-worker-entrypoint.test.ts` spawns the real executable with `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` and no purpose, expecting failure before ready log. |
| 7 | QUAR-07: Rollback documentation prevents mixed Go and TypeScript DB claim/completion owners and describes queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior. | VERIFIED | `.planning/artifacts/v1.16-typescript-worker-quarantine.json` sets `mixedGoAndTypeScriptOwnersAllowed: false` and covers `queued_jobs`, `running_jobs`, `expired_leases`, `retries`, `exhausted_failures`, `incomplete_matchsets`, and `scoring_public_evidence`. Markdown artifact documents single-owner rollback and return-to-Go order. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/worker/src/index.ts` | Entrypoint guard before DB pool creation | VERIFIED | Guard appears before `createDatabasePool`; startup logs quarantine purpose. |
| `apps/worker/src/runner.ts` | Worker ownership guard and quarantined lifecycle imports | VERIFIED | Imports lifecycle helpers from `@cowards/persistence/quarantine-lifecycle`; `assertTypeScriptWorkerJobOwnershipAllowed` rejects normal purpose. |
| `packages/persistence/src/index.ts` | Normal-safe persistence root | VERIFIED | Root exports DB/schema/repository/deferred support modules only; lifecycle symbols absent by dynamic import. |
| `packages/persistence/src/quarantine-lifecycle.ts` | Explicit lifecycle quarantine export boundary | VERIFIED | Exports claim/completion/failure/scoring/MatchSet creation/Chronicle helpers plus `TYPE_SCRIPT_LIFECYCLE_QUARANTINE`. |
| `packages/persistence/package.json` | Quarantine subpath export | VERIFIED | `./quarantine-lifecycle` maps to `./src/quarantine-lifecycle.ts`; no `./chronicle-store` public subpath. |
| `packages/persistence/src/competition.ts` | MatchSet creation and lazy public DTO refresh labeled non-normal | VERIFIED | `TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE` labels selected-normal backend false and names quarantined functions. |
| `packages/service/src/index.ts` | `@cowards/service` non-normal role metadata | VERIFIED | `COWARDS_LOCAL_SERVICE_ROLE` labels service as parity/fixture/rollback/deferred support, not selected normal backend. |
| `scripts/check-boundary-monitors.ts` | Worker quarantine, source, role, rollback, privacy, and monitor checks | VERIFIED | `worker_quarantine` monitor lane validates artifact, source boundary, root export absence, and service labels. |
| `scripts/check-service-boundary-imports.ts` | Selected normal import boundary | VERIFIED | Allows quarantine imports only for explicit replay/private/deferred/test exceptions; selected strict files remain gated with `strict_offenses=0`. |
| `.planning/artifacts/v1.16-typescript-worker-quarantine.json` | Machine-readable rollback/quarantine contract | VERIFIED | Covers single owner, allowed purposes, required rollback states, source checks, and no mixed-owner policy. |
| `.planning/artifacts/v1.16-typescript-worker-quarantine.md` | Human-readable rollback docs | VERIFIED | Documents stop-Go-first, rollback purpose requirement, job states, public evidence behavior, and return-to-Go order. |
| `.planning/artifacts/v1.16-typescript-backend-inventory.*` | Refreshed inventory labels | VERIFIED | Inventory check passes and labels worker/lifecycle/service surfaces as quarantined, rollback, parity, test, deferred, or frontend-only. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `apps/worker/src/index.ts` | `apps/worker/src/runner.ts` | `assertTypeScriptWorkerEntrypointAllowed` before `createDatabasePool` | WIRED | Source order and entrypoint test verify fail-before-ready behavior. |
| `apps/worker/src/runner.ts` | `packages/persistence/src/quarantine-lifecycle.ts` | `@cowards/persistence/quarantine-lifecycle` imports | WIRED | Runner imports claim/completion/failure helpers only from quarantine subpath. |
| `packages/persistence/src/index.ts` | `packages/persistence/src/quarantine-lifecycle.ts` | intentional omission from root export | WIRED | Dynamic import proves root symbols absent and quarantine symbols present. |
| `packages/service/src/index.ts` | `packages/persistence/src/competition.ts` | local service default `buildPublicMatchSetResultDto` | WIRED NON-NORMAL | Local service still composes TypeScript DTO support, but role metadata and selected adapter tests keep it out of selected normal routes. |
| `apps/web/lib/public-service-adapter.ts` | Go public read client | selected public read methods | WIRED | Selected route ownership calls Go client and fails without Go URL. |
| `apps/web/app/matches/server.ts` | Go replay metadata/evidence client | selected public replay branches | WIRED | Selected branches call Go public read clients and bypass Chronicle store unless owner-debug/private/non-selected. |
| `scripts/check-boundary-monitors.ts` | `.planning/artifacts/v1.16-typescript-worker-quarantine.json` | artifact validation | WIRED | `pnpm boundary:monitors` reports worker quarantine artifact and source checks passing. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `apps/worker/src/index.ts` | `jobOwnership` | `assertTypeScriptWorkerEntrypointAllowed(process.env)` | Yes | FLOWING - resolved config is passed into `runWorkerLoop`. |
| `apps/worker/src/runner.ts` | `options.jobOwnership` | Entrypoint or explicit test/parity/rollback caller | Yes | FLOWING - every `runWorkerOnce` asserts allowed purpose before claim. |
| `packages/persistence/src/quarantine-lifecycle.ts` | lifecycle exports | Existing implementation modules | Yes | FLOWING NON-NORMAL - exports real DB lifecycle functions through explicit quarantine boundary. |
| `apps/web/lib/account-service-adapter.ts` | `goClient`/local service | env-based selected route ownership | Yes | FLOWING - selected mode calls Go client and does not construct local service; non-selected local service is deferred support. |
| `apps/web/lib/public-service-adapter.ts` | selected public read methods | env-based selected route ownership and Go client | Yes | FLOWING - methods require Go client; no local TypeScript service fallback exists. |
| `apps/web/app/matches/server.ts` | replay metadata/evidence | Go public read client when selected; Chronicle store only for non-selected/owner-debug/private paths | Yes | FLOWING - tests prove selected public replay paths bypass Chronicle store and fail closed without Go. |
| `.planning/artifacts/v1.16-typescript-worker-quarantine.json` | rollback states/policies | Static rollback contract consumed by boundary monitor | Yes | FLOWING - monitor parses required fields and privacy denylist. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Worker entrypoint rejects normal TypeScript owner before ready log | `pnpm exec vitest run .planning/phases/106-typescript-worker-and-persistence-quarantine/106-worker-entrypoint.test.ts apps/worker/src/runner.test.ts` | 2 files, 23 tests passed | PASS |
| Selected normal routes avoid TypeScript service/DTO/Chronicle fallback | `pnpm exec vitest run packages/persistence/src/competition.test.ts packages/service/src/service.test.ts apps/web/lib/account-service-adapter.test.ts apps/web/lib/public-service-adapter.test.ts apps/web/app/matches/server.test.ts` | 5 files, 71 tests passed | PASS |
| Monitor/import/inventory tests cover quarantine and privacy probes | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/generate-typescript-backend-inventory.test.ts scripts/check-service-boundary-imports.test.ts` | 3 files, 30 tests passed | PASS |
| Package typechecks | `pnpm --filter @cowards/worker typecheck`; `pnpm --filter @cowards/persistence typecheck`; `pnpm --filter @cowards/service typecheck` | All exited 0 | PASS |
| Root export quarantine | `pnpm --filter @cowards/persistence exec tsx -e "(async()=>{const m=await import('@cowards/persistence'); const q=await import('@cowards/persistence/quarantine-lifecycle'); ...})()"` | `root` empty for lifecycle symbols; quarantine exported all expected lifecycle symbols | PASS |
| Boundary imports, inventory, monitors, rollback artifact | `pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm boundary:monitors && node -e "...rollback artifact..."` | `strict_offenses=0 report_only_offenses=17`; inventory current; worker quarantine monitor passed; rollback artifact ok | PASS |
| Go backend compatibility | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | `ok github.com/cowards-game/go-backend (cached)` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| QUAR-01 | 106-PLAN Task 1 | Worker non-normal entrypoint | SATISFIED | Entrypoint guard before DB pool, entrypoint spawn test passed. |
| QUAR-02 | 106-PLAN Task 2 | Lifecycle exports not normal reachable | SATISFIED | Root export dynamic import empty for lifecycle symbols; quarantine subpath explicit. |
| QUAR-03 | 106-PLAN Task 2 | MatchSet creation quarantined/relabeled | SATISFIED | Competition role metadata plus selected route import scans. |
| QUAR-04 | 106-PLAN Task 2 | Selected public DTO reads do not lazy refresh TS scoring | SATISFIED | Selected public adapter and replay server tests route to Go and bypass Chronicle/local service paths. |
| QUAR-05 | 106-PLAN Task 2 | `@cowards/service` non-normal support only | SATISFIED | Service role metadata and selected adapter no-construction tests. |
| QUAR-06 | 106-PLAN Task 1 | Normal TS job ownership blocked unless rollback/test/parity | SATISFIED | Runner and executable-entrypoint tests. |
| QUAR-07 | 106-PLAN Task 3 | Rollback docs prevent mixed owners and cover job states | SATISFIED | JSON/markdown rollback artifact plus monitor and node assertion. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `apps/worker/src/index.ts` | 20-24 | `console.log` startup logs | INFO | Expected process startup diagnostics after guard; no private markers. |
| `packages/service/src/index.ts` | multiple | `return null` for not-found DTOs | INFO | Normal not-found behavior, not a stub. |
| `scripts/check-boundary-monitors.ts` / `scripts/generate-typescript-backend-inventory.ts` | multiple | empty accumulators / CLI logging | INFO | Scanner implementation details, not user-facing stubs. |

No blocker or warning anti-patterns found.

### Human Verification Required

None. Phase 106 is verifiable by static source checks, import/export checks, focused tests, monitor runs, and rollback artifact validation. Full live web/Go/runtime page smoke remains explicitly scheduled for Phases 108/109 and is not a Phase 106 blocker.

### Gaps Summary

No gaps found. The phase goal is achieved: TypeScript worker and persistence lifecycle behavior is quarantined as rollback/test/parity/deferred support, selected normal routes use Go or fail closed, monitor gates cover drift, rollback docs prevent mixed owners, and public-output privacy denylist checks pass.

---

_Verified: 2026-05-24T21:37:22Z_
_Verifier: the agent (gsd-verifier)_
