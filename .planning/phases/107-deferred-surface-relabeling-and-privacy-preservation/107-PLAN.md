---
phase: 107-deferred-surface-relabeling-and-privacy-preservation
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-typescript-surface-labels.ts
  - scripts/generate-typescript-surface-labels.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - package.json
  - .planning/artifacts/v1.16-final-typescript-surface-labels.json
  - .planning/artifacts/v1.16-final-typescript-surface-labels.md
  - apps/web/app/matches/[matchId]/replay/owner-debug.ts
  - apps/web/app/matches/[matchId]/replay/owner-debug.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/replay-fixture.ts
  - apps/web/app/api/test-support/replay-fixture/route.ts
  - apps/web/app/api/test-support/replay-fixture/route.test.ts
  - apps/web/app/api/test-support/run-worker-once/route.ts
  - apps/web/app/api/test-support/run-worker-once/route.test.ts
  - apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts
  - apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts
autonomous: true
requirements: [DEF-01, DEF-02, DEF-03, DEF-04, DEF-05, DEF-06]
user_setup: []
must_haves:
  truths:
    - "Developer can inspect final v1.16 labels for every remaining backend-like TypeScript surface."
    - "Workshop validation, source, test launch, analytics rerun, profile save, export, and runtime flows are explicitly deferred and private/owner-scoped where applicable."
    - "Ladder mutation and governance/admin mutation paths are explicitly deferred, not selected normal backend behavior."
    - "Owner-debug replay is private/deferred, gated by enablement plus owner authorization, and cannot be used as public replay evidence fallback."
    - "Test-support routes, fixture generators, parity, rollback, runtime, and frontend-only paths have explicit gates and cannot serve normal product runtime traffic."
    - "Deferred, rollback, parity, test, fixture, and owner-debug paths preserve public-output and owner-source privacy by default."
  artifacts:
    - path: ".planning/artifacts/v1.16-final-typescript-surface-labels.json"
      provides: "Machine-readable final DEF-06 TypeScript surface label artifact covering every inventory surface"
      contains: "v1.16-final-typescript-surface-labels"
    - path: ".planning/artifacts/v1.16-final-typescript-surface-labels.md"
      provides: "Human-readable final label matrix grouped by Workshop, ladder, governance, owner-debug, test-support, fixtures, parity, rollback, runtime, and frontend-only"
      contains: "Deferred Surface Relabeling"
    - path: "scripts/generate-typescript-surface-labels.ts"
      provides: "Deterministic label artifact generator/checker"
      exports: ["generateFinalTypeScriptSurfaceLabels", "validateFinalTypeScriptSurfaceLabels"]
    - path: "scripts/check-boundary-monitors.ts"
      provides: "Monitor lane consuming final label artifact and privacy/gate checks"
      exports: ["validateV116FinalTypeScriptSurfaceLabels"]
  key_links:
    - from: "scripts/generate-typescript-surface-labels.ts"
      to: ".planning/artifacts/v1.16-typescript-backend-inventory.json"
      via: "Reads all 184 current inventory surfaces as source of truth"
      pattern: "v1\\.16-typescript-backend-inventory\\.json"
    - from: "scripts/check-boundary-monitors.ts"
      to: ".planning/artifacts/v1.16-final-typescript-surface-labels.json"
      via: "Boundary monitor validation lane"
      pattern: "validateV116FinalTypeScriptSurfaceLabels"
    - from: "apps/web/app/matches/[matchId]/replay/owner-debug.ts"
      to: "apps/web/app/matches/server.ts"
      via: "resolveOwnerDebugReplayOptions returns allowOwnerDebug only for private gated requests"
      pattern: "allowOwnerDebug"
    - from: "apps/web/app/api/test-support/replay-fixture/route.ts"
      to: "apps/web/app/matches/replay-fixture.ts"
      via: "Fixture route calls isReplayFixtureEnabled gate"
      pattern: "isReplayFixtureEnabled"
---

<objective>
Create the Phase 107 executable implementation plan for final deferred surface relabeling and privacy preservation.

Purpose: v1.16 must make every remaining TypeScript backend-like path explicitly allowed, gated, private where needed, and monitor-enforceable, without migrating Workshop, ladder, governance, owner-debug replay, or other deferred product surfaces.

Output: final v1.16 TypeScript surface label artifacts, source/test gate hardening, monitor integration, and validation evidence for DEF-01 through DEF-06.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/get-shit-done/workflows/execute-plan.md
@/Users/roryquinlan/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/research/v1.16-SUMMARY.md
@.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md
@.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-RESEARCH.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VERIFICATION.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md
@.planning/phases/104-isolated-runtime-service-boundary-hardening/104-VERIFICATION.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-SUMMARY.md
@.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-VERIFICATION.md
@.planning/phases/106-typescript-worker-and-persistence-quarantine/106-SUMMARY.md
@.planning/phases/106-typescript-worker-and-persistence-quarantine/106-VERIFICATION.md
@.planning/artifacts/v1.16-typescript-backend-inventory.json
@.planning/artifacts/v1.16-selected-go-route-manifest.json
@.planning/artifacts/v1.16-runtime-service-boundary.json
@.planning/artifacts/v1.16-typescript-worker-quarantine.json
@scripts/generate-typescript-backend-inventory.ts
@scripts/check-boundary-monitors.ts
@scripts/check-boundary-monitors.test.ts
@packages/spec/src/public-output-privacy.ts
@apps/web/app/matches/[matchId]/replay/owner-debug.ts
@apps/web/app/matches/server.ts
@apps/web/app/matches/replay-fixture.ts
@apps/web/app/api/test-support/run-worker-once/route.ts
@apps/web/app/api/test-support/replay-fixture/route.ts

<interfaces>
Existing contracts executors should reuse:

```typescript
// scripts/generate-typescript-backend-inventory.ts
export function generateTypeScriptBackendInventory(options?: GenerateOptions): TypeScriptBackendInventory;
export function validateTypeScriptBackendInventory(inventory: TypeScriptBackendInventory): string[];
export function renderTypeScriptBackendInventoryJson(inventory: TypeScriptBackendInventory): string;
```

```typescript
// scripts/check-boundary-monitors.ts
export const runBoundaryMonitorChecks: () => Promise<BoundaryMonitorCheck[]>;
export const validateV116TypeScriptWorkerQuarantineArtifact: (artifact: unknown) => string;
export const validateV116RuntimeServiceBoundaryArtifact: (artifact: unknown) => string;
```

```typescript
// apps/web/app/matches/[matchId]/replay/owner-debug.ts
export const isOwnerDebugReplayEnabled: (env?: Partial<Record<string, string | undefined>>) => boolean;
export const resolveOwnerDebugReplayOptions: (searchParams: Record<string, string | string[] | undefined> | undefined, env?: Partial<Record<string, string | undefined>>) => GetMatchReplayOptions | undefined;
```

```typescript
// apps/web/app/matches/server.ts
export const createMatchReplayServer: (deps?: MatchReplayServerDeps) => MatchReplayServer;
```

```typescript
// packages/spec/src/public-output-privacy.ts
export const assertPublicOutputLeakSafe: (value: unknown, label?: string) => void;
```
</interfaces>
</context>

<source_audit>
## Multi-Source Coverage Audit

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | Phase 107 goal: inspect remaining Workshop, ladder, governance, owner-debug, test-support, fixture, parity, and rollback paths as non-normal with privacy guarantees. | Tasks 1, 2, and 3. |
| REQ | DEF-01 Workshop validation/source/test/analytics/profile/export/runtime deferred labels. | Task 1 label artifact and Task 3 monitor assertions. |
| REQ | DEF-02 ladder/admin/governance mutation deferred labels. | Task 1 label artifact and Task 3 monitor assertions. |
| REQ | DEF-03 owner-debug private/deferred authorization gates, no public fallback. | Task 2 source/tests and Task 3 monitor artifact checks. |
| REQ | DEF-04 test-support routes, fixture generators, parity harnesses gated/labeled. | Task 1 labels, Task 2 route gates/tests, Task 3 monitor checks. |
| REQ | DEF-05 public-output and owner-source privacy for deferred/rollback paths. | Task 2 focused privacy tests and Task 3 public-output monitor checks. |
| REQ | DEF-06 final TypeScript surface label artifact covering all backend-like paths. | Task 1 artifact generator plus Task 3 monitor consumption. |
| RESEARCH | 184 current inventory surfaces: 44 deferred, 48 test-only, 16 parity-only, 5 rollback-only, 3 fixture-only, 1 quarantined, 44 frontend-only, 5 runtime-service, 18 runtime-adapter. | Task 1 requires exact coverage and count validation against inventory. |
| CONTEXT | D-01, D-02, D-03 final machine-readable label artifact with owner/reason/risk/privacy/gate/future migration/monitor status. | Task 1. |
| CONTEXT | D-04, D-05, D-06 Workshop, ladder/governance, account/private-source deferred gates. | Task 1 and Task 3. |
| CONTEXT | D-07, D-08, D-09 owner-debug private gates and selected public replay stays Go-owned. | Task 2 and Task 3. |
| CONTEXT | D-10, D-11 test-support and fixtures test/fixture-only gates. | Task 2 and Task 3. |
| CONTEXT | D-12, D-13 privacy denylist. | Task 1 artifact privacy and Task 3 monitor lane. |
| CONTEXT | D-14, D-15 label/harden only, no accidental migration. | All tasks: no Go migration, no route ownership expansion. |
| DEFERRED | Workshop migration to Go; broader ladder/admin/governance migration to Go; full owner-debug replay migration to Go. | Excluded. No task implements these deferred ideas. |
</source_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Generate final v1.16 TypeScript surface label artifacts</name>
  <files>scripts/generate-typescript-surface-labels.ts, scripts/generate-typescript-surface-labels.test.ts, package.json, .planning/artifacts/v1.16-final-typescript-surface-labels.json, .planning/artifacts/v1.16-final-typescript-surface-labels.md</files>
  <behavior>
    - Test 1: generator reads `.planning/artifacts/v1.16-typescript-backend-inventory.json` and emits exactly one final label row for every inventory surface path.
    - Test 2: every final row includes `owner`, `reason`, `risk`, `privacyClass`, `gate`, `futureMigration`, `monitorStatus`, `selectedNormal`, `taxonomyRole`, and `surfaceLabel` per D-01, D-02, and D-03.
    - Test 3: Workshop routes/modules are labeled as `deferred-workshop-validation`, `deferred-workshop-private-source`, `deferred-workshop-test-launch`, `deferred-workshop-analytics-rerun`, `deferred-workshop-profile-save`, `deferred-workshop-export`, `deferred-workshop-runtime-support`, or `deferred-workshop-ui` per D-04.
    - Test 4: ladder and governance/admin mutation surfaces are labeled `deferred-ladder-mutation` or `deferred-governance-admin-mutation` per D-05.
    - Test 5: owner-debug replay, account private-source, test-support routes, fixtures, parity-only, rollback-only, quarantined, runtime-service, runtime-adapter, and frontend-only surfaces each receive explicit labels and gates per D-06 through D-11.
    - Test 6: final artifacts reject normal TypeScript backend roles, missing monitor status, missing future migration notes on deferred rows, public-output forbidden marker keys, and stale JSON/markdown output.
  </behavior>
  <action>Create `scripts/generate-typescript-surface-labels.ts` as a deterministic artifact generator/checker modeled on `scripts/generate-typescript-backend-inventory.ts`. It must use the Phase 103 taxonomy as `taxonomyRole`, add richer `surfaceLabel` and `capabilityGroup` fields without changing allowed roles, and write `.planning/artifacts/v1.16-final-typescript-surface-labels.json` plus `.md`. Add `typescript-surface-labels` and `typescript-surface-labels:check` package scripts. The JSON schema version must be `v1.16-final-typescript-surface-labels`, include `sourceInventoryPath`, `sourceInventorySurfaceCount`, `roleCounts`, `capabilityGroups`, `globalPolicies.normalTypeScriptBackendAllowed=false`, `globalPolicies.publicOutputPrivacyRequired=true`, and `phase107DecisionCoverage` listing D-01 through D-15. Do not migrate Workshop, ladder, governance, or owner-debug replay; label and gate them per D-14 and D-15.</action>
  <verify>
    <automated>pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts && pnpm typescript-surface-labels:check</automated>
  </verify>
  <done>Final JSON and markdown artifacts exist, are generated from the current inventory, cover all 184 current surfaces, cover DEF-01/DEF-02/DEF-06 visibly, include monitor-ready fields, and fail check mode when stale or privacy-unsafe.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Harden owner-debug, test-support, and fixture gates</name>
  <files>apps/web/app/matches/[matchId]/replay/owner-debug.ts, apps/web/app/matches/[matchId]/replay/owner-debug.test.ts, apps/web/app/matches/server.ts, apps/web/app/matches/server.test.ts, apps/web/app/matches/replay-fixture.ts, apps/web/app/api/test-support/replay-fixture/route.ts, apps/web/app/api/test-support/replay-fixture/route.test.ts, apps/web/app/api/test-support/run-worker-once/route.ts, apps/web/app/api/test-support/run-worker-once/route.test.ts</files>
  <behavior>
    - Test 1: owner-debug options resolve only when `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_OWNER_DEBUG_REPLAY=1` is present, an explicit `ownerDebug=1|owner` or `debug=1|owner` query is present, and `ownerPlayerId` is present per D-07.
    - Test 2: selected public replay evidence calls Go and fails closed without Go URL even when owner-debug query params are present but owner-debug gates are absent, proving no public evidence fallback per D-08 and D-09.
    - Test 3: owner-debug output appears only after the replay server's persisted owner authorization approves the requested owner; unauthorized owner-debug requests return public projection without owner-debug fields.
    - Test 4: replay fixture route is unavailable in normal product runtime and enabled only by `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or an explicit fixture env gate such as `COWARDS_ENABLE_REPLAY_FIXTURES=1`; automatic development-mode availability must not serve normal product traffic per D-10 and D-11.
    - Test 5: run-worker-once test-support responses remain 404 outside test/playwright, force `COWARDS_TYPESCRIPT_WORKER_PURPOSE=test` when enabled, bound diagnostics, and do not expose stack, stderr, token, DB DSN, host path, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, or private runtime internals in normal/default output per D-12 and D-13.
  </behavior>
  <action>Make owner-debug replay gates explicit and private. Preserve existing selected Go public replay behavior; do not let query params bypass selected public Go replay or force Chronicle persistence fallback. Update `isReplayFixtureEnabled` to accept an injectable env parameter and require test/playwright or an explicit fixture env gate rather than broad development-mode availability. Add a missing route test for `apps/web/app/api/test-support/replay-fixture/route.ts`. Keep `run-worker-once` test-support behavior test-only and diagnostics bounded; add privacy assertions over normal/default outputs. Do not add public endpoints, Go migrations, or new runtime execution paths.</action>
  <verify>
    <automated>pnpm exec vitest run 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts</automated>
  </verify>
  <done>Owner-debug replay is private/deferred and authorized, public replay remains selected Go-owned when selected, test-support and fixture routes cannot serve normal product traffic, and focused tests cover DEF-03, DEF-04, and DEF-05.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Integrate final labels into boundary monitors and privacy checks</name>
  <files>scripts/check-boundary-monitors.ts, scripts/check-boundary-monitors.test.ts, apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts, apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts, .planning/artifacts/v1.16-final-typescript-surface-labels.json, .planning/artifacts/v1.16-final-typescript-surface-labels.md</files>
  <behavior>
    - Test 1: `validateV116FinalTypeScriptSurfaceLabels` accepts the committed final label artifact and rejects missing Workshop, ladder, governance, owner-debug, test-support, fixture, parity, rollback, runtime, or frontend-only groups.
    - Test 2: monitor rejects final label rows with `selectedNormal=true` unless they are explicit frontend Go adapters or runtime-service/runtime-adapter execution-boundary rows with no backend authority.
    - Test 3: monitor rejects deferred rows missing a non-empty gate, future migration note, owner, risk, privacy class, or monitor status.
    - Test 4: monitor rejects owner-debug labels unless they reference enablement gates, owner authorization, private/deferred status, and no public evidence fallback.
    - Test 5: monitor rejects test-support and fixture labels unless they reference test/playwright/explicit fixture gates and cannot serve normal product runtime.
    - Test 6: monitor privacy check rejects public/default examples or artifacts containing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.
  </behavior>
  <action>Add a Phase 107 monitor lane to `scripts/check-boundary-monitors.ts`, exporting `validateV116FinalTypeScriptSurfaceLabels` and checking `.planning/artifacts/v1.16-final-typescript-surface-labels.json`. Reuse existing artifact privacy helpers and `assertPublicOutputLeakSafe`/public DTO leak guards where practical. Extend `scripts/check-boundary-monitors.test.ts` with failing cases for missing groups, stale source inventory count, accidental public fallback, insufficient gates, and private marker leakage. Keep existing Phase 104/105/106 monitor lanes intact. Add or extend focused Workshop route tests only where needed to prove no-store/local-owner gating for deferred analytics/test summary outputs; do not migrate Workshop behavior. Regenerate final labels after source/test changes and keep `pnpm typescript-backend:inventory:check` current if the new tests alter the inventory.</action>
  <verify>
    <automated>pnpm exec vitest run scripts/check-boundary-monitors.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts' && pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm typescript-surface-labels:check && pnpm boundary:monitors && pnpm --filter @cowards/web typecheck</automated>
  </verify>
  <done>Boundary monitors consume the final Phase 107 label artifact, fail on drift or privacy leaks, and prove DEF-01 through DEF-06 through static artifacts plus focused route/privacy tests.</done>
</task>

</tasks>

<dependency_graph>
## Task Dependencies

| Task | Needs | Creates | Wave |
| --- | --- | --- | --- |
| Task 1 | Phase 103 inventory, Phase 104 runtime artifact, Phase 105 selected Go route manifest, Phase 106 worker quarantine artifact | final label generator, check script, JSON/markdown final label artifacts | 1 |
| Task 2 | Current owner-debug/test-support/replay fixture source and Phase 105 public replay behavior | hardened gates and focused route/replay tests | 1 |
| Task 3 | Task 1 final labels and Task 2 explicit gates | monitor validation lane and phase-wide privacy enforcement | 2 within this plan |

Task 1 and Task 2 touch different files and can be implemented independently before Task 3. Task 3 depends on both because it validates the final artifacts against the hardened gate behavior.
</dependency_graph>

<threat_model>
## Trust Boundaries

| Boundary | Description |
| --- | --- |
| Browser/client -> Next API | Workshop, ladder, governance, test-support, fixture, and replay requests cross from untrusted clients into TypeScript route handlers. |
| Public replay route -> Go public read client | Selected public replay must use Go public evidence and fail closed without TypeScript Chronicle fallback. |
| Owner-debug replay -> Chronicle persistence quarantine | Owner/private Chronicle access crosses into persisted private replay material and must require explicit owner authorization. |
| Test-support routes -> worker/persistence subprocess | Test support can trigger worker code and may produce diagnostics; it must be unavailable in normal product runtime. |
| Artifact/monitor files -> developer decisions | Machine-readable label artifacts influence Phase 108 monitors; stale or leaky artifacts can hide ownership drift. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- |
| T-107-01 | Information Disclosure | owner-debug replay | mitigate | Gate owner-debug with env/query/owner authorization, keep public selected replay on Go, and test no public fallback. |
| T-107-02 | Elevation of Privilege | deferred Workshop/ladder/governance routes | mitigate | Label as deferred/non-normal with owner/private/admin/session gates and monitor selectedNormal=false. |
| T-107-03 | Information Disclosure | test-support diagnostics and fixture outputs | mitigate | 404 outside test/explicit fixture gates, bound diagnostics, and run public-output privacy assertions over normal/default payloads. |
| T-107-04 | Tampering | parity/rollback TypeScript paths | mitigate | Keep parity/rollback labels explicit, selectedNormal=false, and require Phase 106 single-owner rollback artifact linkage. |
| T-107-05 | Repudiation | final surface labels | mitigate | Generate deterministic JSON/markdown artifacts from inventory with stale-output check and monitorStatus per row. |
| T-107-06 | Spoofing | artifact privacy/gate metadata | mitigate | Boundary monitor rejects missing gates, missing owners, missing future migration notes, and forbidden private marker keys/strings. |
</threat_model>

<verification>
Run these commands after all tasks complete:

```bash
pnpm exec vitest run scripts/generate-typescript-surface-labels.test.ts scripts/check-boundary-monitors.test.ts 'apps/web/app/matches/[matchId]/replay/owner-debug.test.ts' apps/web/app/matches/server.test.ts apps/web/app/api/test-support/run-worker-once/route.test.ts apps/web/app/api/test-support/replay-fixture/route.test.ts 'apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.test.ts' 'apps/web/app/api/workshop/tests/[matchSetId]/route.test.ts'
pnpm boundary:imports
pnpm typescript-backend:inventory:check
pnpm typescript-surface-labels:check
pnpm boundary:monitors
pnpm --filter @cowards/web typecheck
```

If source changes alter the TypeScript backend inventory, regenerate `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md`, then re-run both inventory and surface-label check commands.
</verification>

<success_criteria>
- DEF-01 through DEF-06 are covered by committed artifacts, tests, and monitor lanes.
- `.planning/artifacts/v1.16-final-typescript-surface-labels.json` covers every current inventory surface and explains why each TypeScript path can remain.
- Workshop, ladder, governance, owner-debug, test-support, fixture, parity, rollback, runtime, and frontend-only labels are inspectable and monitor-enforced.
- Owner-debug remains private/deferred and cannot become public replay fallback.
- Test-support and fixtures cannot serve normal product runtime traffic.
- Public/default outputs from deferred, rollback, parity, test, fixture, and owner-debug paths do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.
- No task migrates Workshop, broader ladder/admin/governance mutation, or full owner-debug replay to Go.
</success_criteria>

<output>
After completion, create `.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-SUMMARY.md` and `.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-VALIDATION.md`.
</output>
