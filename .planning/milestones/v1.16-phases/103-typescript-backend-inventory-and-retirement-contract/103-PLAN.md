---
phase: 103-typescript-backend-inventory-and-retirement-contract
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-typescript-backend-inventory.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - package.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.md
  - .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md
autonomous: true
requirements:
  - BASE-01
  - BASE-02
  - BASE-03
  - BASE-04
  - BASE-05
  - BASE-06
user_setup: []
must_haves:
  truths:
    - "Developer can inspect a complete v1.16 TypeScript backend-like surface inventory."
    - "Developer can verify every TypeScript surface uses only the allowed retirement role taxonomy."
    - "Developer can verify v1.15 Go ownership is the normal backend baseline."
    - "Developer can verify TypeScript service/backend behavior is classified only as frontend, runtime, parity, fixture, test, rollback, deferred, quarantined, or deleted."
    - "Developer can verify non-goals, privacy, determinism, hostile-code isolation, rollback clarity, and no silent fallback are explicit."
  artifacts:
    - path: "scripts/generate-typescript-backend-inventory.ts"
      provides: "Deterministic scanner and stale-output checker"
      exports:
        - "generateTypeScriptBackendInventory"
        - "validateTypeScriptBackendInventory"
    - path: "scripts/generate-typescript-backend-inventory.test.ts"
      provides: "Scanner, schema, role taxonomy, baseline, privacy, and stale-output tests"
    - path: ".planning/artifacts/v1.16-typescript-backend-inventory.json"
      provides: "Machine-readable monitor/topology inventory manifest"
      contains: "v1.16-typescript-backend-inventory"
    - path: ".planning/artifacts/v1.16-typescript-backend-inventory.md"
      provides: "Human-readable TypeScript backend retirement matrix"
    - path: ".planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md"
      provides: "Phase 103 verification, validation, and downstream monitor expectations"
  key_links:
    - from: "scripts/generate-typescript-backend-inventory.ts"
      to: ".planning/artifacts/v1.16-typescript-backend-inventory.json"
      via: "deterministic generation and --check comparison"
      pattern: "v1\\.16-typescript-backend-inventory"
    - from: "scripts/generate-typescript-backend-inventory.ts"
      to: ".planning/artifacts/v1.16-typescript-backend-inventory.md"
      via: "same manifest data rendered as markdown matrix"
      pattern: "TypeScript Backend Inventory"
    - from: ".planning/artifacts/v1.16-typescript-backend-inventory.json"
      to: "scripts/check-boundary-monitors.ts"
      via: "monitor-ready schema fields for Phase 108 consumption"
      pattern: "fallbackPolicy|enforcementStatus|privacyClass"
---

<objective>
Create the executable Phase 103 baseline for TypeScript backend retirement.

Purpose: Phase 103 must establish the source-of-truth inventory and retirement contract before later phases delete, quarantine, relabel, or enforce no-TypeScript-backend topology. It does not migrate runtime execution, remove backend paths, or implement the future Runtime Broker.

Output: A deterministic scanner/checker, machine-readable JSON manifest, human-readable markdown matrix, scanner tests, package script hooks, and Phase 103 validation notes covering BASE-01 through BASE-06.
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
@.planning/research/v1.16-SUMMARY.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md
@.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-RESEARCH.md
@.planning/artifacts/v1.15-lifecycle-ownership-manifest.json
@.planning/artifacts/v1.15-typescript-surface-labels.json
@.planning/artifacts/v1.15-live-web-go-runtime-topology.json
@.planning/artifacts/v1.15-failure-drills.json
@.planning/artifacts/v1.15-promotion-decision.md
@.planning/artifacts/v1.15-boundary-baseline.md
@scripts/check-service-boundary-imports.ts
@scripts/check-boundary-monitors.ts
@scripts/check-local-topology.ts
@package.json

<interfaces>
Use these existing local patterns directly.

From `scripts/check-service-boundary-imports.ts`:
```typescript
export interface ServiceBoundaryOffense {
  path: string
  line: number
  pattern: string
  statementText?: string | undefined
}

export interface ServiceBoundaryAnalysis {
  strictOffenses: readonly ServiceBoundaryOffense[]
  reportOnlyOffenses: readonly ServiceBoundaryOffense[]
  exitCode: 0 | 1
}
```

Use the same TypeScript AST parsing pattern:
```typescript
ts.createSourceFile(repoPath, sourceText, ts.ScriptTarget.Latest, true, sourceKindForPath(repoPath))
```

Existing package scripts to preserve and compose with:
```json
{
  "boundary:imports": "pnpm exec tsx scripts/check-service-boundary-imports.ts",
  "topology:check": "pnpm exec tsx scripts/check-local-topology.ts",
  "boundary:monitors": "pnpm contract:check && pnpm contract:lint && pnpm boundary:imports && pnpm go:parity && pnpm sandbox:evaluate:check && pnpm topology:check && pnpm exec tsx scripts/check-boundary-monitors.ts"
}
```
</interfaces>
</context>

<source_audit>
## Multi-Source Coverage Audit

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | Developers can inspect the v1.16 baseline for all remaining TypeScript backend-like surfaces and exact allowed roles after retirement. | Covered by Task 1 scanner and Task 2 JSON/markdown artifacts. |
| REQ | BASE-01 complete inventory of routes, modules, persistence imports, service use, workers, runtime, replay, frontend, parity, rollback, test, fixture, and deferred paths. | Covered by Task 1 discovery roots and Task 2 manifest rows. |
| REQ | BASE-02 ownership manifest with strict allowed roles and no normal TypeScript backend role. | Covered by Task 1 schema tests and Task 2 `allowedRoles`. |
| REQ | BASE-03 v1.15 Go ownership is backend baseline. | Covered by Task 2 baseline references and global policies. |
| REQ | BASE-04 TypeScript service/backend behavior documented only as non-normal allowed roles. | Covered by Task 2 classifications for `@cowards/service`, persistence, worker, replay, and web adapters. |
| REQ | BASE-05 non-goals explicit. | Covered by Task 2 `globalPolicies` and Task 3 validation notes. |
| REQ | BASE-06 determinism, immutability, schema validation, privacy, hostile-code isolation, rollback clarity, and no silent fallback explicit. | Covered by Task 2 schema fields and Task 3 verification expectations. |
| RESEARCH | Add `scripts/generate-typescript-backend-inventory.ts` and `scripts/generate-typescript-backend-inventory.test.ts`. | Covered by Task 1. |
| RESEARCH | Emit `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md`. | Covered by Task 2. |
| RESEARCH | Use TypeScript AST import/export scanning, local import chains, explicit classification overlay, deterministic sorting, and `--check`. | Covered by Task 1. |
| RESEARCH | Use monitor-ready fields for Phase 108. | Covered by Task 2 and Task 3. |
| CONTEXT | D-01 through D-03 manifest/matrix and coverage roots. | Covered by Tasks 1 and 2. |
| CONTEXT | D-04 through D-06 role taxonomy and required metadata for deferred/rollback entries. | Covered by Tasks 1 and 2. |
| CONTEXT | D-07 through D-09 delete/quarantine/relabel retirement defaults. | Covered by Task 2 retirement action fields. |
| CONTEXT | D-10 through D-11 monitor-ready fields without making every monitor strict in Phase 103. | Covered by Task 2 schema and Task 3 validation expectations. |
| CONTEXT | Deferred idea: implement future language-neutral Runtime Broker. | Excluded. The plan names broker-ready fields but does not build a broker. |
</source_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build deterministic inventory scanner and contract tests</name>
  <files>scripts/generate-typescript-backend-inventory.ts, scripts/generate-typescript-backend-inventory.test.ts, package.json</files>
  <behavior>
    - Test 1: scanner discovers `apps/web/app/api/**/route.ts` route files and exported HTTP methods for BASE-01.
    - Test 2: scanner discovers backend-like imports through direct imports and local import chains for `@cowards/persistence`, `@cowards/service`, `apps/worker`, `packages/runtime-js`, `competitive/server`, `matches/server`, and migration/worker symbols for BASE-01.
    - Test 3: manifest validation accepts only `frontend-only`, `runtime-service`, `runtime-adapter`, `parity-only`, `fixture-only`, `test-only`, `rollback-only`, `deferred`, `quarantined`, and `deleted`, and rejects `typescript-backend`, `legacy`, or normal backend owner labels for BASE-02 per D-04 and D-05.
    - Test 4: deferred and rollback-only entries fail validation unless `owner`, `reason`, `gate`, `risk`, and `futureMigration` are non-empty for BASE-02 and BASE-04 per D-06.
    - Test 5: `--check` fails when generated JSON or markdown differs from committed artifacts, and passes when artifacts are current.
  </behavior>
  <action>Create `scripts/generate-typescript-backend-inventory.ts` with exported `generateTypeScriptBackendInventory` and `validateTypeScriptBackendInventory` helpers plus CLI modes `--write` and `--check`. Use TypeScript AST import/export extraction and local import resolution following `scripts/check-service-boundary-imports.ts`; do not use regex-only parsing. Scan these roots per D-03: `apps/web/app/api/**/route.ts`, `apps/web/app/**/*.ts(x)`, `apps/web/lib/**/*.ts`, `apps/worker/src/**/*.ts`, `apps/runtime-service/src/**/*.ts`, `packages/persistence/src/**/*.ts`, `packages/service/src/**/*.ts`, and `packages/runtime-js/src/**/*.ts`, excluding generated/build folders. Seed classifications from `.planning/artifacts/v1.15-typescript-surface-labels.json` and add an explicit overlay for roots named in `103-RESEARCH.md`. Add `scripts/generate-typescript-backend-inventory.test.ts` using Vitest. Add package scripts `typescript-backend:inventory` and `typescript-backend:inventory:check` that run the generator in write/check mode. The scanner must read source files and emit planning artifacts only; it must not execute Strategy code, touch database state, contact network services, or change runtime behavior.</action>
  <verify>
    <automated>pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts</automated>
    <automated>pnpm typescript-backend:inventory && pnpm typescript-backend:inventory:check</automated>
  </verify>
  <done>Scanner and tests exist, package scripts run, unclassified discovered backend-like surfaces fail validation, invalid role labels fail validation, deferred/rollback metadata requirements are enforced, and stale artifacts are detected.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Generate monitor-ready JSON manifest and human markdown matrix</name>
  <files>.planning/artifacts/v1.16-typescript-backend-inventory.json, .planning/artifacts/v1.16-typescript-backend-inventory.md, scripts/generate-typescript-backend-inventory.test.ts</files>
  <behavior>
    - Test 1: JSON manifest has `schemaVersion: "v1.16-typescript-backend-inventory"`, `milestone: "v1.16"`, strict `allowedRoles`, and `globalPolicies.normalTypeScriptBackendAllowed: false` for BASE-02.
    - Test 2: JSON manifest references v1.15 baseline artifacts and records Go as backend baseline for orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence for BASE-03.
    - Test 3: each surface row includes monitor-ready fields for D-10 and D-11: `id`, `path`, `kind`, `role`, `retirementAction`, `owner`, `reason`, `gate`, `risk`, `futureMigration`, `currentOwner`, `normalBackendOwner`, `fallbackPolicy`, `privacyClass`, `enforcementStatus`, route/runtime linkage fields, import evidence, backend capability booleans, and `sourceRefs`.
    - Test 4: global policies list Phase 103 non-goals from BASE-05, including no Strategy execution in Go/web/API, no Node `vm` security boundary, no Node `node:wasi` untrusted sandbox, no production sandbox replacement, no Runtime Broker implementation, no counted non-JS play, no Go migration/schema ownership, and no cloud deployment work.
    - Test 5: markdown matrix is generated from the same manifest data and includes no row absent from JSON.
  </behavior>
  <action>Run the generator to write `.planning/artifacts/v1.16-typescript-backend-inventory.json` and `.planning/artifacts/v1.16-typescript-backend-inventory.md` per D-01 and D-02. The JSON manifest is the monitor/topology input surface; the markdown matrix is the human audit surface. Classify every discovered surface with exactly one allowed role per D-04. Do not classify anything as `typescript-backend`, `legacy`, or a normal TypeScript backend owner per D-05. Cover Next.js API routes, TypeScript server modules, direct persistence imports, `@cowards/service` uses, workers/job lifecycle, replay/public evidence, runtime service, runtime adapter, frontend-only, test-only, parity-only, fixture-only, rollback-only, deferred, quarantined, and deleted surfaces per D-03. Encode retirement defaults per D-07 through D-09: unused backend-like code should be marked `deleted`, still-needed rollback/parity/fixture/test code should be `quarantined` or its explicit non-normal role with a gate, and product surfaces should be `deferred` only when intentionally selected as deferred. Keep Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, DB DSNs, host paths, and private runtime internals out of artifact payload examples; record forbidden marker names only.</action>
  <verify>
    <automated>pnpm typescript-backend:inventory:check</automated>
    <automated>pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts</automated>
    <automated>node -e "const m=require('node:fs').readFileSync('.planning/artifacts/v1.16-typescript-backend-inventory.json','utf8'); const j=JSON.parse(m); if(j.schemaVersion!=='v1.16-typescript-backend-inventory') throw new Error('bad schema'); if(j.globalPolicies.normalTypeScriptBackendAllowed!==false) throw new Error('normal TS backend allowed'); if(!Array.isArray(j.surfaces)||j.surfaces.length===0) throw new Error('missing surfaces');"</automated>
  </verify>
  <done>Machine JSON and human markdown inventory artifacts are committed, generated from one source of truth, sorted deterministically, monitor-ready, privacy-safe, and cover BASE-01 through BASE-06.</done>
</task>

<task type="auto">
  <name>Task 3: Record validation expectations and downstream monitor contract</name>
  <files>.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md, .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md</files>
  <action>Create `103-VALIDATION.md` documenting the exact Phase 103 validation commands, requirement coverage, source audit result, and downstream expectations for Phases 104-108. Include the generator check, scanner test, `pnpm boundary:imports`, and `pnpm boundary:monitors` as validation expectations; note that Phase 103 designs monitor-ready fields per D-10 and D-11 but does not require every no-TypeScript-backend monitor to become strict until Phase 108. Include a concise table mapping BASE-01 through BASE-06 to artifacts and commands. Confirm that the future language-neutral Strategy Execution Service / Runtime Broker remains out of scope and that JS/TS Strategy support remains only through the isolated runtime service/runtime adapter roles. After all tasks pass, create `103-SUMMARY.md` from the GSD summary template with files changed, commands run, requirement coverage, and any residual risks.</action>
  <verify>
    <automated>test -s .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md</automated>
    <automated>grep -v '^#' .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md | grep -q 'BASE-01' && grep -v '^#' .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md | grep -q 'pnpm typescript-backend:inventory:check'</automated>
    <automated>pnpm boundary:imports</automated>
  </verify>
  <done>Validation document exists, requirement coverage and downstream monitor contract are explicit, summary exists after completion, and Phase 103 does not claim to enforce Phase 108 strict topology ahead of scope.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
| --- | --- |
| Source tree -> inventory scanner | Scanner reads untrusted or drifted repository source and converts it into monitor-readable artifacts. |
| Inventory artifacts -> developer/monitor consumers | Artifacts become evidence and later monitor inputs, so stale or incomplete data can mislead enforcement. |
| Private runtime/backend code -> public planning artifacts | Artifact rows may describe private routes, runtime diagnostics, or owner-debug behavior without leaking private payloads. |
| Go backend baseline -> TypeScript retirement labels | v1.15 Go ownership evidence constrains which TypeScript paths can remain non-normal. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- |
| T-103-01 | Tampering | `scripts/generate-typescript-backend-inventory.ts` | mitigate | Deterministic AST scanner, explicit overlay, sorted output, and `--check` stale-output comparison. |
| T-103-02 | Repudiation | `.planning/artifacts/v1.16-typescript-backend-inventory.json` | mitigate | Require `sourceRefs`, baseline artifact references, route/import evidence, and validation tests for every classified surface. |
| T-103-03 | Information Disclosure | JSON/markdown inventory artifacts | mitigate | Store env var names and forbidden marker names only; do not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, sessions, tokens, DB DSNs, host paths, stack traces, stderr, owner-debug payloads, or private runtime internals. |
| T-103-04 | Elevation of Privilege | Runtime service/runtime adapter classifications | mitigate | Validate runtime roles cannot claim jobs, complete Matches, persist Chronicles, refresh scoring, serve public evidence, or act as fallback. |
| T-103-05 | Denial of Service | Phase 108 monitor consumers | mitigate | Include monitor-ready fields now and document downstream consumption expectations without making Phase 103 responsible for strict topology enforcement. |
| T-103-06 | Spoofing | TypeScript backend role taxonomy | mitigate | Reject `typescript-backend`, `legacy`, vague normal-owner labels, and roles outside D-04 taxonomy. |
</threat_model>

<verification>
Run these commands before marking Phase 103 complete:

```bash
pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts
pnpm typescript-backend:inventory:check
pnpm boundary:imports
pnpm boundary:monitors
```

If `pnpm boundary:monitors` fails only because Phase 108 strict no-TypeScript-backend checks are not yet implemented, record the exact failure in `103-SUMMARY.md`; otherwise fix Phase 103 drift before completion. Do not treat stale generated artifacts, missing BASE coverage, invalid role labels, or public/private data leaks as acceptable residual risk.
</verification>

<success_criteria>
- BASE-01 through BASE-06 are each mapped to artifacts and automated checks.
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` covers every discovered TypeScript backend-like surface required by D-03.
- `.planning/artifacts/v1.16-typescript-backend-inventory.md` renders the same rows for human inspection.
- The strict role taxonomy from D-04 is enforced; D-05 labels are rejected.
- Deferred and rollback-only entries include owner, reason, gate, risk, and future migration note per D-06.
- v1.15 Go ownership is recorded as the backend baseline.
- Runtime service and runtime adapter rows remain execution-boundary roles only, not backend owners.
- Non-goals and privacy/determinism/runtime constraints are explicit.
- `--check` detects stale JSON or markdown artifacts.
</success_criteria>

<output>
After completion, create `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md`.
</output>
