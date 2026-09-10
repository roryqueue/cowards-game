# Phase 263: Legal Planner and Deterministic Runner Feasibility - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 29 proposed new/modified files (explicit research paths plus marked scaffolding/worker implications)
**Analogs found:** 26 / 29; matches describe structure, not already-proved Phase 263 behavior.

Scope authority is `263-CONTEXT.md` and `263-RESEARCH.md`. Phase 262 passed; its consumed execution route must not be rerun. No Match, preflight, source benchmark, or production change was performed for this map. All paths below are proposed unless identified as existing analogs. Do not expand this phase into the factory, league, formation experiments, or production certification.

## File Classification

Paths beginning `src/` are relative to proposed `packages/strategy-lab/`. Rows marked implied are implementation ownership suggestions, not additional requirements.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/strategy-lab/package.json` (implied) | config | transform | `packages/engine/package.json` | exact |
| `packages/strategy-lab/tsconfig.json` (implied) | config | transform | `packages/engine/tsconfig.json` | exact |
| `src/index.ts` (implied) | utility | transform | kernel driver's explicit export surface | role-match |
| `src/contracts.ts` | model | transform | lean-runner-feasibility strict manifest/terminal validation | role-match |
| `src/identity.ts` | utility | transform | lean-runner-feasibility canonicalHash | exact |
| `src/planner/missions.ts` | model | transform | Advanced doctrine/objective representation | role-match |
| `src/planner/assign.ts` | service | transform | Advanced `selectActivations` | role-match |
| `src/planner/brain.ts` | service | request-response | Advanced `soldierBrain` | role-match |
| `src/planner/emit.ts` | utility | transform | Advanced source validation/revision builder | exact |
| `src/runtime-bridge.ts` | provider | request-response | kernel driver + supervised-subprocess-adapter | exact |
| `src/tasks.ts` | service | batch | lean-runner-feasibility `buildLeanSchedule` | exact |
| `src/ledger.ts` | store | event-driven | lean-runner-feasibility classified execution evidence | role-match |
| `src/shards.ts` | service | file-I/O | no complete atomic shard analog established | none |
| `src/reduce.ts` | service | batch | lean-runner-feasibility `deriveAndValidateLeanTerminal` | exact |
| `src/worker.ts` (implied) | service | event-driven | no trusted fixed-task worker-pool analog established | none |
| `src/runner.ts` (implied) | service | batch | lean-runner-feasibility schedule/terminal composition | role-match |
| `scripts/run-v1-38-planner-feasibility.ts` | controller | file-I/O | lean-runner-feasibility manifest/evidence interfaces | role-match |
| `scripts/check-v1-38-lab-boundaries.ts` | utility | batch | `scripts/check-v1-37-integrity-boundaries.ts` AST inspection | exact |
| `scripts/check-v1-38-lab-boundaries.test.ts` | test | batch | runtime-ownership negative-test structure | role-match |
| `src/planner/assign.test.ts` | test | transform | runtime-ownership explicit fixtures/assertions | role-match |
| `src/planner/missions.test.ts` | test | transform | runtime-ownership explicit fixtures/assertions | role-match |
| `src/planner/brain.test.ts` | test | request-response | runtime-ownership activation fixtures | role-match |
| `src/planner/information-boundary.test.ts` | test | request-response | runtime-ownership private-memory fixtures + runtime-inputs | exact |
| `src/planner/emission.test.ts` | test | transform | Advanced source validation + runtime-ownership tests | role-match |
| `src/runtime-bridge.test.ts` | test | request-response | runtime-ownership binding/failure tests | exact |
| `src/runner-invariance.test.ts` | test | batch | runtime-ownership equality/failure assertions | role-match |
| `src/shards.test.ts` | test | file-I/O | no atomic publication fault-suite analog established | none |
| `src/test/fixtures.ts` (implied) | utility | transform | runtime-ownership `matchInput`/private-memory fixture | exact |
| `src/contracts.test.ts` (implied) | test | transform | runtime-ownership tampered identity negative tests | role-match |

Five primary analog families suffice: canonical kernel/observations, supervised adapter, lean schedule/validation, Advanced source packaging, and kernel runtime-ownership tests. Package configuration and a targeted existing boundary-monitor section supply supporting conventions. No new production dependency is implied by this table. Root package/lockfile/reference changes, if required by workspace tooling, should be mechanical and explicitly listed by the planner, never a production import of the lab.

## Pattern Assignments

### Private package scaffold: package.json, tsconfig.json, index.ts

**Analog:** `packages/engine/package.json` lines 1–20; `packages/engine/tsconfig.json` lines 1–12.

```json
"private": true,
"type": "module",
"main": "./src/index.ts",
"types": "./src/index.ts"
```

```json
"extends": "../../tsconfig.base.json",
"compilerOptions": {
  "composite": true,
  "rootDir": "src",
  "outDir": "dist",
  "types": ["node"]
}
```

Use `workspace:*` for allowed package dependencies; `.js` extensions on relative TypeScript imports. Export only intended offline contracts/functions. `private: true` prevents publishing, not reverse-import reachability; the boundary monitor is still required. Do not copy engine recorder/test exports into the lab.

### contracts.ts, ledger.ts, contracts.test.ts

**Analog:** `scripts/lib/v1-38-lean-runner-feasibility.ts` lines 342–375 and 421–446.

```typescript
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const isSha = (value: unknown): value is `sha256:${string}` =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
```

Copy the fail-closed principle, not fixed Phase 262 keys/cardinality. New lab envelopes should use strict bounded schemas plus canonical raw-byte admission before object conversion. Bound arrays, strings, safe integers, nesting and total file bytes. Parse and rederive admitted root/tuple/source/budget/task identities rather than trusting caller booleans such as `integrityValid`.

The analog separates success/player violation from system failure and rejects semantic roots on nonsemantic records (lines 365–374). Preserve every charged attempt, unused allocation, failure and cleanup outcome; system failure may remain in private accounting but must not contribute a scored result. An operational timeout is not automatically a proven player violation. New append-only attempt/charge/restart semantics need explicit implementation; they are not already supplied by the lean helper.

### identity.ts, tasks.ts

**Analog:** `scripts/lib/v1-38-lean-runner-feasibility.ts` lines 151–155 and 210–251.

```typescript
const canonicalHash = (value: unknown): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value as never, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError(`LEAN_CANONICAL_${encoded.error.code}`)
  return sha256(encoded.bytes)
}
```

```typescript
for (const arena of CANONICAL_ARENA_CATALOG_V1_37.arenas) {
  const executionArena = resolveLeanExecutionArena(CANONICAL_ARENA_CATALOG_V1_37, arena.id)
  for (const [bottomFixtureId, topFixtureId] of sidePairs) {
    for (const initiativeSide of ["bottom", "top"] as const) {
```

Use canonical JSON encoder imports from `@cowards/spec`, and `createHash` from `node:crypto` only in trusted offline code. Improve the helper with typed admitted JSON rather than `as never`; frame task/stream/attempt/result domains as distinct canonical arrays. Bind admitted root, algorithm/version, input root, split, purpose, structural budget and ordinal. Pre-enumerate and freeze task assignment before launching workers. Retain distinct arena labels and exact execution geometry resolution; do not claim three independent geometries.

Do not copy `LEAN_PASSES`, charged IDs, fixture source identity, default limits, or fixed consumed allocation. Worker index, physical shard size, wall clock and completion order do not belong in scientific task/stream identity.

### reduce.ts, runner.ts, runner-invariance.test.ts

**Analog:** `scripts/lib/v1-38-lean-runner-feasibility.ts` lines 378–385.

```typescript
export const deriveAndValidateLeanTerminal = (value: unknown): LeanTerminal => {
  const keys = ["schemaVersion", "claimClass", "historicalFullMatrix", "schedule", "result", "counts", "determinism", "completeCleanup", "evidence", "formationMaterialized", "authority"]
  if (!exactKeys(value, keys) || !Array.isArray(value.evidence)) throw new TypeError("LEAN_TERMINAL_KEYS")
  const evidence = value.evidence.map(validateLeanExecutionEvidence)
  if (evidence.length !== buildLeanSchedule().length || evidence.some((record, ordinal) => record.ordinal !== ordinal)) throw new TypeError("LEAN_EVIDENCE_ORDER")
  const derived = reduceLeanExecutions(evidence)
  if (canonicalHash(derived) !== canonicalHash(value)) throw new TypeError("LEAN_TERMINAL_DERIVATION_MISMATCH")
  return derived
}
```

Copy rederivation/coverage/hash comparison. Replace its input-array ordinal requirement with canonical task-ID ordering after validation; otherwise out-of-order worker completion breaks FACT-03. Reject duplicate task coverage even when bytes match, missing tasks, stale roots, conflicting results and invalid evidence. Resume excludes verified completed tasks from dispatch, not from expected coverage. Scientific roots cover the same sorted semantic records across packing variants; operational roots retain worker/shard/order/restart/attempt/timing identity separately. Never remove arbitrary fields recursively to manufacture equality.

### runtime-bridge.ts

**Analog:** `packages/engine/src/kernel/driver.ts` lines 514–522 and 757–765.

```typescript
let stepped = stepCandidateMatch(machine, { kind: "advance" })
if (stepped.kind === "effect") {
  stepped = stepCandidateMatch(
    stepped.machine,
    runtimeResume(runtime, stepped.request),
  )
}
if (stepped.kind === "failure") {
  return failedExecution(attemptPrestate, stepped.failure)
}
```

This is a protocol analogy, **not a source block to transplant**. The lab imports `MATCH_KERNEL` from `@cowards/engine`, calls `createMachineV119`/`stepMatch`, and handles effect/transition/completed/failure without implementing scheduling, legality, resolution or state mutation. Preserve complete transition records and rollback semantics. Never import kernel-private `stepCandidateMatch`, `runtimeResume`, or `failedExecution`; use the public typed protocol and compare against the canonical driver with fixed trusted effects.

**Supervisor analog:** `packages/runtime-js/src/supervised-subprocess-adapter.ts`, exported `CountedTypeScriptSupervisedAdapterV118` (line 133) and factory `createCountedTypeScriptSupervisedAdapterV118` (line 403). Its canonical evidence encoding is lines 140–149:

```typescript
const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) throw new TypeError("Evidence is not canonical")
  return encoded.bytes
}
```

Core receives a typed injected existing supervisor/provider, not a callback that evaluates source. CLI owns launch/cleanup and exact selected lane admission. Preserve authenticated request/result identity, method/kernel request binding, cumulative accounting and three-way outcomes. Adapter names containing `Counted` do not grant the lab production counted status. Do not import `apps/runtime-service` into the package, fabricate evidence, reuse fixture signing authority for real work, or fall back to `eval`, `new Function`, `vm`, or a trusted worker as sandbox. A necessary package-only adapter seam must be planned explicitly and proved behavior-preserving.

### planner/missions.ts, assign.ts, brain.ts, emit.ts

**Analog:** `packages/persistence/src/advanced-strategies.ts` lines 1–10, 135–211, 509–547. Use its descriptor/source packaging and method boundary only. It is not a ten-mission planner, a lexicographic hard-constraint implementation, or an authoritative legality model. In particular, do not copy its weighted legality/tactical heuristics, floating index tie-break or old Advance assumptions.

```typescript
import {
  buildStrategyRevision,
  validateStrategySource,
  type StrategyRevisionValidationReport,
} from "@cowards/runtime-js"
import type { StrategyRevision } from "@cowards/spec"
```

The existing method response packaging (lines 161–172) is:

```typescript
return {
  soldierId: soldier.id,
  objective: {
    doctrine: profile.doctrine,
    preferred,
    safeDirs: safeBoard(soldier, input),
    contractionSoon,
    seekBackstab: true,
  },
}
```

Replace this packet with the versioned ten-mission contract and explicit completion/stale/failure/fallback semantics. Assignment search compares hard constraint vectors lexicographically, then integer soft preferences and canonical tie-breaks under both initiative hypotheses. Reserve deterministic fallback before optional search. Brain considers all nine concrete Actions using legal observations and authoritative Advance; canonical offline fixtures adjudicate tactical/legality claims rather than copied rules.

The source gate pattern (lines 509–516) is:

```typescript
const validation = validateStrategySource(advanced.source)
return {
  ...advanced,
  validation,
  sourceHash: validation.sourceHash,
  sourceBytes: validation.sourceBytes,
}
```

Keep builder imports out of emitted source. Emit synchronous self-contained source with no closures over privileged teacher state, packages or host capabilities. Validation/size alone is not feasibility; actual emitted methods must run under the exact supervisor and benchmark. Do not register the candidate in the production Advanced library.

### Legal observation fixtures, information-boundary.test.ts, brain.test.ts

**Canonical reusable API:** `packages/engine/src/runtime-inputs.ts` lines 117–125, 160–190 and 193–207.

```typescript
export const createSoldierBrainInputV119 = (
  state: GameState,
  soldierId: string,
  cycleIndex: number,
  hasAdvancedThisActivation: boolean,
  objective?: JsonValue,
): SoldierBrainInputV119 =>
  createSoldierBrainInput(
    state,
    soldierId,
    cycleIndex,
    objective,
    hasAdvancedThisActivation,
    "strategy-runtime-abi-v1.19",
  ) as SoldierBrainInputV119
```

Import and call this API; do not copy its awareness projection. Note that V119 argument order differs from the generic helper. `createStrategyInputV119(state, playerId)` provides full-board legal input including initial/round initiative. Paired tests must first prove canonical input bytes equal, then compare actual emitted output **and returned memory** through fresh/reused supervised contexts. Vary only hidden fields for the relevant method; publicly visible full-board differences are not hidden Strategy inputs. Include positive controls so a constant policy cannot vacuously pass.

### All proposed tests; runtime-bridge.test.ts and fixture helpers in particular

**Analog:** `packages/engine/src/kernel/runtime-ownership.test.ts` lines 1–26, 28–41, 235–243, 688–699 and 737–746.

```typescript
import { describe, expect, it } from "vitest"
```

The wrong-binding assertion (lines 737–746) is:

```typescript
expect(execution).toMatchObject({
  kind: "failure",
  transitions: [],
  failure: {
    classification: "system_failure",
    code: "OUTER_FRAME_WRONG_BINDING",
  },
  unchangedState: state,
})
expect(JSON.stringify(execution)).not.toContain("RUNTIME_VIOLATION")
```

Port the assertions to the selected current tuple/lane, not the test's historical v1.17 constants or fixture-only key. Test wrong request/method/input/tuple/accounting identity, replay, invalid output, system failure, exception privacy and unchanged gameplay. Keep synthetic protocol doubles visibly distinct from real emitted-source feasibility. New mission/assignment tests need nonvacuous positive, stale, failure, fallback and hard-before-soft cases. Source tests cover package/capability/synchronous/source/objective/memory/output limits. Invariance and shard tests require synthetic fault injection before live work. Use canonical bytes for proof hashes, not the historical test's `JSON.stringify` hash helper.

### CLI: scripts/run-v1-38-planner-feasibility.ts

Use the lean helper's manifest → fixed schedule → classified records → rederived receipt composition above. Research additionally identifies `scripts/lib/v1-38-lean-container-match-session.ts` as the lifecycle implementation seam; inspect that seam when implementing actual container launch. This map does not authorize copying the consumed CLI dispatch, locks, markers, fixture revision authorization, limits or allocation.

The command loads an immutable fresh Phase 263 manifest, records exact source/dirty/lockfile/runtime/host identity, injects the existing supervisor, enforces the frozen overall bound and writes private evidence plus safe allowlisted receipt. Keep benchmark timing region and method p99 separate from transport/wall time; no throughput or gate pass is established by this map. Numerical research recommendations remain subject to inherited allocation/benchmark compatibility.

### Boundary script and its negative tests

**Analog:** `scripts/check-v1-37-integrity-boundaries.ts` lines 1556–1574.

```typescript
for (const importDeclaration of imports) {
  if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) continue
  const moduleName = importDeclaration.moduleSpecifier.text
  const importedNames = new Set<string>()
  const clause = importDeclaration.importClause
  if (clause?.name !== undefined) importedNames.add(clause.name.text)
  if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
    for (const specifier of clause.namedBindings.elements) {
      importedNames.add(specifier.propertyName?.text ?? specifier.name.text)
    }
  }
```

Copy AST-based module/reference inspection, not the entire historical audit/reproduction command. Extend coverage to namespace/re-export/relative aliases, dynamic import/require, transitive entry points and production images/deployment/Go/generated assets. Include negative fixtures for each supported route and a safe-output privacy fixture. Production → lab edges are forbidden; lab → allowed canonical packages is intended. Resolve paths from `import.meta.url` as the monitor does at lines 20–22, not test runner cwd. Do not make the production build import the lab to run the checker.

## Shared Patterns

- **Rules and observation ownership:** reuse `MATCH_KERNEL` and canonical input builders as APIs. Source heuristics can rank legal-input-derived intentions but cannot become a copied transition/legality oracle.
- **Auth/error handling:** no new web auth. Retain supervisor request admission and success/player-violation/system-failure attribution. Never convert a host failure into player loss or log raw private errors in the receipt.
- **Strict canonical boundaries:** validate raw bytes and strict bounded envelopes, then identities/coverage, then rederive outputs. Canonical Action/result schema validity alone does not prove lab metadata strictness or tactical safety.
- **Reproducibility:** canonical task-sorted semantic bytes and separately rooted operational evidence; all attempt accounting remains retained. Physical shard layout is not scientific identity.
- **Privacy:** source, objectives, memories, teacher state and private traces stay under the offline artifact root. A private trace is not a canonical Chronicle or public replay.

## No Analog Found

| File | Role | Data Flow | Reason / implementation guidance |
|---|---|---|---|
| `src/shards.ts` | service | file-I/O | No complete strict atomic shard/resume publisher established in the bounded analog search. Use research's single publisher, generated safe paths, same-directory complete temp file, validation before publication, destination recheck/no blind overwrite. Rename alone is not a no-clobber or power-loss guarantee. |
| `src/worker.ts` | service | event-driven | No fixed-task trusted pool established. Workers execute preassigned IDs and report bounded records; they never generate scientific identities or execute hostile source outside the supervisor. |
| `src/shards.test.ts` | test | file-I/O | Requires new faults before/during write, before/after publish, before ledger observation, duplicate/gap/conflict/truncation/stale/tampered evidence and safe resume. |

Mission/beam semantics also have no exact algorithmic analog: the role matches above cover ABI packaging only. Implement those from the locked mission/lexicographic/legal-information contract and prove them with canonical fixtures.

## Metadata

**Analog search scope:** engine kernel/runtime inputs, runtime-js supervisor, persistence Advanced descriptors, scripts/lib lean evidence, existing integrity monitor, engine package config.
**Source files inspected for excerpts:** 9 (including two configuration files); bounded targeted sections used for the 2,126-line integrity monitor.
**Coverage:** 11 exact, 15 role-match, 3 none = 29 classified files.
**Pattern extraction date:** 2026-09-09.
**Execution:** read-only source inspection; only this PATTERNS.md was written. Read/Write-specific tools were unavailable, so shell reads and the available patch tool were used; no shell file-writing workaround was used.
