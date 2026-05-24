---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
verified: 2026-05-24T22:50:58Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 107: Deferred Surface Relabeling and Privacy Preservation Verification Report

**Phase Goal:** Developers can inspect remaining TypeScript Workshop, ladder, governance, owner-debug, test-support, fixture, parity, and rollback paths as explicitly allowed non-normal surfaces with privacy guarantees.
**Verified:** 2026-05-24T22:50:58Z
**Status:** PASS
**Re-verification:** No - initial verification. No previous `*-VERIFICATION.md` existed for Phase 107.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Developer can inspect final v1.16 labels for every remaining backend-like TypeScript surface. | VERIFIED | `.planning/artifacts/v1.16-final-typescript-surface-labels.json` has schema `v1.16-final-typescript-surface-labels`, source count 185, and 185 rows. Spot-check found no missing/extra paths versus `.planning/artifacts/v1.16-typescript-backend-inventory.json`. `scripts/generate-typescript-surface-labels.ts` defines required row fields and global policies at lines 123-167 and generates from the inventory at lines 521-545. |
| 2 | Workshop validation, source, test launch, analytics rerun, profile save, export, and runtime flows are explicitly deferred and private/owner-scoped where applicable. | VERIFIED | Generator maps Workshop paths to the specific deferred labels at lines 196-230 and Workshop rows to `selectedNormal=false`, owner-private privacy, no public fallback, and future migration notes at lines 260-268. Tests assert all Workshop labels and representative paths including `packages/persistence/src/workshop.ts` and `workshop-analytics.ts` at lines 62-80 and 102-192. |
| 3 | Ladder mutation and governance/admin mutation paths are explicitly deferred, not selected normal backend behavior. | VERIFIED | Generator maps ladder to `deferred-ladder-mutation` at lines 271-287 and governance/admin to `deferred-governance-admin-mutation` at lines 289-300. The final artifact spot-check confirms `packages/persistence/src/ladder.ts` and `packages/persistence/src/governance.ts` are `taxonomyRole=deferred`, `selectedNormal=false`, and `normalBackendAuthority=false`. |
| 4 | Owner-debug replay is private/deferred, gated by enablement plus owner authorization, and cannot be used as public replay evidence fallback. | VERIFIED | `owner-debug.ts` requires test/playwright/explicit env, owner query opt-in, owner player id, and matching server-side requester id at lines 11-43. `server.ts` gates owner-debug on env plus requester identity at lines 177-183, keeps selected public replay on Go when owner-debug is not allowed at lines 183-201, and calls persisted owner authorization before owner projection at lines 217-230. Tests cover fail-closed Go public evidence, ungated debug bypass rejection, unauthorized public fallback, and authorized owner upgrade at `server.test.ts` lines 614-977. |
| 5 | Test-support routes, fixture generators, parity, rollback, runtime, and frontend-only paths have explicit gates and cannot serve normal product runtime traffic. | VERIFIED | Final label generator labels test-support, fixtures, parity, rollback, runtime service/adapter, and frontend-only categories at lines 319-390. Replay fixture enablement requires `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_REPLAY_FIXTURES=1` at `replay-fixture.ts` lines 32-37, and the route returns 404 when disabled at `route.ts` lines 24-32. Run-worker-once requires test/playwright env at `route.ts` lines 24-27 and returns 404 outside that gate at lines 161-167. |
| 6 | Deferred, rollback, parity, test, fixture, and owner-debug paths preserve public-output and owner-source privacy by default. | VERIFIED | Generator validates public examples with `assertPublicOutputLeakSafe` at lines 650-658. Monitor validates shareable label fields, public examples, privacy enum values, and public-output marker leaks at `scripts/check-boundary-monitors.ts` lines 2103-2115 and 2175-2200. Focused tests assert public-output safety for label markdown, fixture route output, run-worker output, Workshop compare output, and Workshop test-summary output. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `.planning/artifacts/v1.16-final-typescript-surface-labels.json` | Machine-readable DEF-06 artifact covering every inventory surface. | VERIFIED | Exists, schema is `v1.16-final-typescript-surface-labels`, 185/185 inventory rows, policies disallow normal TypeScript backend and public fallback. |
| `.planning/artifacts/v1.16-final-typescript-surface-labels.md` | Human-readable final label matrix. | VERIFIED | Exists and `scripts/generate-typescript-surface-labels.test.ts` verifies every inventory path appears in the markdown at lines 29-35. |
| `scripts/generate-typescript-surface-labels.ts` | Deterministic label artifact generator/checker. | VERIFIED | Exports `generateFinalTypeScriptSurfaceLabels` and `validateFinalTypeScriptSurfaceLabels`; check mode passed. |
| `scripts/check-boundary-monitors.ts` | Monitor lane consuming final label artifact and privacy/gate checks. | VERIFIED | Exports `validateV116FinalTypeScriptSurfaceLabels`; monitor lane is wired into `runBoundaryMonitorChecks` at lines 2632-2636. |
| Owner-debug/test-support/fixture route files | Source gates and tests for DEF-03/DEF-04/DEF-05. | VERIFIED | Owner-debug, replay fixture, and worker test-support route gates exist and focused tests pass. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `scripts/generate-typescript-surface-labels.ts` | `.planning/artifacts/v1.16-typescript-backend-inventory.json` | Reads source inventory and maps each surface. | WIRED | `sourceInventoryPath` and `readJson` feed `inventory.surfaces.map(createFinalRow)` at lines 521-525. |
| `scripts/check-boundary-monitors.ts` | `.planning/artifacts/v1.16-final-typescript-surface-labels.json` | `validateV116FinalTypeScriptSurfaceLabels` monitor lane. | WIRED | Validation reads the artifact through `checkV116FinalTypeScriptSurfaceLabels` at lines 2211-2214 and runs as `[surface_labels]` at lines 2632-2636. |
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | `apps/web/app/matches/server.ts` | `allowOwnerDebug`, requested owner id, requester id. | WIRED | Route option helper returns `allowOwnerDebug` only with gates; server re-checks env and requester identity before private replay access. |
| `apps/web/app/api/test-support/replay-fixture/route.ts` | `apps/web/app/matches/replay-fixture.ts` | `isReplayFixtureEnabled` gate. | WIRED | Route calls `isReplayFixtureEnabled(env)` and returns 404 when false. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `v1.16-final-typescript-surface-labels.json` | `surfaces` | `.planning/artifacts/v1.16-typescript-backend-inventory.json` via generator | Yes, 185 current inventory rows mapped exactly. | FLOWING |
| `scripts/check-boundary-monitors.ts` | final label artifact | Reads committed JSON and current inventory, validates counts, path set, labels, gates, privacy. | Yes, monitor command reports `185 final TypeScript surface labels checked`. | FLOWING |
| Owner-debug replay path | `allowOwnerDebug`, authorized owner list | Query/env helper plus persisted owner authorization resolver | Yes, private projection appears only when resolver authorizes the requested owner. | FLOWING |
| Replay fixture route | fixture catalog | `@cowards/test-utils` canonical replay scenarios behind explicit fixture gate | Yes, enabled route returns bounded match/scenario catalog; disabled route returns 404. | FLOWING |
| Run-worker-once route | worker payload/diagnostics | Explicit test-support worker process or injected test process | Yes, enabled route parses bounded worker JSON; disabled route returns 404; failure diagnostics are redacted. | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Focused Phase 107 tests | `pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'` | 8 files passed, 61 tests passed. | PASS |
| Final labels are current | `pnpm typescript-surface-labels:check` | `Final TypeScript surface label artifacts are current`. | PASS |
| Source inventory is current | `pnpm typescript-backend:inventory:check` | `TypeScript backend inventory artifacts are current`. | PASS |
| Final labels cover inventory exactly | Node path-set spot-check | `inventory=185`, `labels=185`, `missing=[]`, `extra=[]`, `selectedBad=[]`, `authorityBad=[]`. | PASS |
| Boundary monitors include Phase 107 lane | `pnpm boundary:monitors` | Passed; `[surface_labels] v1.16 final TypeScript surface labels: 185 final TypeScript surface labels checked`. | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DEF-01 | 107-PLAN | Workshop validation, source, test launch, analytics rerun, profile save, export, runtime flows labeled deferred. | SATISFIED | Generator classifications, artifact rows, and tests cover every required Workshop label. |
| DEF-02 | 107-PLAN | Admin/governance and ladder mutation surfaces labeled deferred. | SATISFIED | Generator and monitor enforce ladder/governance path-level labels; artifact rows are deferred and non-normal. |
| DEF-03 | 107-PLAN | Owner-debug replay explicit private/deferred path with authorization, not public fallback. | SATISFIED | Helper, server, and tests require explicit env/query/requester/owner authorization and keep selected public evidence on Go unless authorized owner-debug applies. |
| DEF-04 | 107-PLAN | Test-support routes, fixture generators, parity harnesses gated/labeled away from normal runtime traffic. | SATISFIED | Final labels include test-support, fixture, parity, rollback, runtime, frontend-only groups; routes return 404 outside gates. |
| DEF-05 | 107-PLAN | Deferred/rollback paths preserve public-output and owner-source privacy in tests/local workflows. | SATISFIED | Public-output privacy guards run in generator, monitor, route tests, and Workshop route tests. |
| DEF-06 | 107-PLAN | Final TypeScript surface label artifact covers every remaining backend-like path and explains why it may remain. | SATISFIED | JSON/markdown artifacts cover 185/185 inventory paths with owner, reason, risk, privacy class, gate, future migration, monitor status, selectedNormal, taxonomyRole, and surfaceLabel. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `scripts/generate-typescript-surface-labels.ts` | 761, 776 | `console.log` in CLI entrypoint | Info | Expected command output, not a stub. |
| `scripts/check-boundary-monitors.ts` | 2680, 2682 | `console.log` in monitor CLI entrypoint | Info | Expected command output, not a stub. |
| `apps/web/app/api/test-support/run-worker-once/route.ts` | 52 | `console.log` in spawned test worker script | Info | Emits bounded JSON result for test-support route; route is gated and diagnostics are redacted. |
| `apps/web/app/matches/server.ts` | 99, 116 | `return []` for failed owner authorization | Info | This is deny-by-default authorization behavior, not empty data flowing to public output. |

### Human Verification Required

None. Phase 107 is an artifact, route-gate, privacy, and monitor contract; focused automated checks cover the observable requirements. Strict live no-TypeScript-backend topology and browser page smoke are Phase 108/109 scope, and `pnpm boundary:monitors` reports live topology diagnostics as optional.

### Gaps Summary

No blocking gaps found. DEF-01 through DEF-06 are verified end-to-end against code, artifacts, route gates, tests, and monitor wiring. The earlier Phase 107 validation blockers documented after `6f012b9` were addressed by `810a03e`, and current monitor tests now reject path-level semantic drift and privacy enum drift.

---

_Verified: 2026-05-24T22:50:58Z_
_Verifier: the agent (gsd-verifier)_
