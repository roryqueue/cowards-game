# Phase 259: Executable Four-Language and Chronicle Conformance - Pattern Map

**Mapped:** 2026-07-16
**Revised:** 2026-07-16 — additive v1.18 public exports, supervisor workspace wiring, Linux cgroup-v2/Docker counted execution, two-entrant receipts, plural trust bootstrap, and protected baseline
**Concrete files covered:** 55 across 34 implementation/test groups
**Analog families:** 6

## Placement Rules

1. `packages/golden` owns immutable corpus descriptions and pure canonical trace projection/comparison. It does not import runtime adapters.
2. `@cowards/runtime-supervisor` owns the public supervisor contract, package-free Rust Linux cgroup-v2 binary, and pinned Docker certification controller; runtime-js/python/wasm-wasi own their supervised adapters.
3. `apps/runtime-service` composes the real TypeScript/Python/Rust/Zig executors because it already depends on all runtime packages, golden, engine, replay, and spec.
4. Repo-root scripts own candidate generation, committed-byte checks, fresh-process certification, plural trust-root bootstrap, and protected working-tree baseline checks.
5. `packages/spec` public exports own additive v1.18 budget/invocation/capability/service/two-entrant-receipt contracts and pure verification; `packages/persistence` owns append-only publication/installation.
6. `packages/replay` owns per-slot grammar, frozen historical interpretation, reconstruction, and shared semantic admission. Runtime-service owns receipt issuance only; persistence and Go verify public spec claims without implementing Chronicle rules.

These placements preserve the dependency graph and keep Strategy execution out of Go, web, and API processes.

## File Classification

Paths marked **new** are the recommended concrete split implied by research. A planner may co-locate a tiny helper with its owner but should not cross the placement rules.

| New/Modified File Group | Role | Data Flow | Analog Family | Quality |
|---|---|---|---|---|
| **new** `packages/golden/src/v1-37-conformance-corpus.ts` | model/config | transform | A | exact |
| **new** `packages/golden/src/v1-37-conformance-trace.ts` | utility/model | transform | A/C | near-exact |
| **new** `packages/golden/src/v1-37-conformance-{corpus,trace}.test.ts`; modified `index.ts` | test/provider | batch/transform | A | exact |
| **new** `scripts/generate-v1-37-conformance-corpus.ts` and `.test.ts` | generator/test | file-I/O/batch | A | exact |
| **new** `scripts/check-v1-37-conformance-corpus.ts` and `.test.ts` | checker/test | file-I/O/batch | A | exact |
| **new** `apps/runtime-service/src/four-language-conformance-runner.ts` and `.test.ts` | service/test | request-response/batch | B/E | role-match |
| **new** `packages/runtime-supervisor/{package.json,tsconfig.json,src/index.ts}` plus root/runtime package references | provider/config | build/import boundary | F | exact |
| **new** `packages/runtime-supervisor/native/src/main.rs`; `native/Cargo.toml`; Linux container wrapper/tests | runtime/test | process/cgroup/file-I/O | F | composite |
| **new** `packages/spec/src/runtime-{budget-profile,invocation,budget-capabilities}-v1-18.ts` and tests; modified public index/package test script | model/validator/provider | transform/build | F | exact |
| **new** `packages/spec/src/runtime-{execution-service,semantic-receipt}-v1-18.ts` and tests; modified public index/package test script | model/validator/provider | transform | E/F | exact |
| modified `apps/runtime-service/src/four-language-parity.test.ts` | test | request-response/batch | A/B; readiness only | exact |
| **new** `scripts/certify-v1-37-language-lane.ts` and `.test.ts` | certifier/test | process/file-I/O/batch | B | composite |
| **new** `packages/spec/src/runtime-conformance-certificate-v1-17.ts` and `.test.ts` | model/validator/test | transform | B | exact |
| modified `packages/spec/src/runtime-evidence-v1-17.ts` | model/config | transform | B | exact |
| modified `packages/spec/src/runtime-evidence-attestation-v1-17.ts` and `.test.ts` | validator/test | transform | B | exact |
| modified `packages/persistence/src/runtime-evidence-authority-publisher.ts` and `.test.ts` | service/store/test | CRUD/transactional | B | exact |
| modified `packages/replay/src/grammar.ts` and `grammar.test.ts` | utility/test | event-driven/state-machine | C | composite |
| **new** `packages/replay/src/historical-v1-4-grammar.ts` | utility | event-driven/state-machine | D | role-match |
| **new** `packages/replay/src/historical-v1-4-transition.ts` | utility | event-driven/transform | D | role-match |
| **new** `packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json` | fixture/config | file-I/O/transform | D | exact |
| modified `packages/replay/src/validate.ts` and `validate.test.ts` | validator/test | transform | D/E | exact |
| modified `packages/replay/src/record.ts` and `record.test.ts` | utility/test | event-driven/transform | A/C | exact |
| modified `packages/replay/src/replay-transition.ts` and `.test.ts` | utility/test | event-driven/transform | C/D | exact |
| modified `packages/replay/src/reconstruct.ts` and `.test.ts` | service/test | event-driven/transform | D/E | exact |
| modified `packages/replay/src/index.ts` | provider/barrel | transform | existing barrel | exact |
| modified `apps/runtime-service/src/execute-match.ts` and `.test.ts` | service/test | request-response | E | exact |
| modified `packages/persistence/src/complete-match.ts` and `.test.ts` | service/store/test | CRUD/transactional | E | exact |
| modified `packages/persistence/src/semantic-integrity.test.ts` | integration test | CRUD/transactional | E | exact |
| **new** `apps/go-backend/runtime_service_client_v1_18.go` and `_test.go`; immutable prior clients retained | client/test | request-response | E/F | role-match |
| **new** plural import-root bootstrap/high-water script/migration/tests | operator/store/test | file-I/O/transactional | B/F | composite |
| **new** protected working-tree baseline script/test/artifact | checker/test | git/file-I/O | A/F | exact |

### Retain rather than repurpose

- `packages/golden/src/v1-37-current-language-corpus.ts` remains the readiness projection. The conformance corpus receives a new version/root.
- Runtime adapters remain thin real executors. Add supervised v1.18 seams through public `@cowards/spec` and `@cowards/runtime-supervisor` exports; never import another workspace's `src` tree or add conformance meaning inside adapters.
- Historical v1.4 Chronicle bytes and historical receipts remain unchanged.
- No UI file is implied.

## Pattern Assignments

## Family A — Immutable Corpus, Full Trace, Generator, and Check

**Apply to:** golden corpus/trace files, generator/check scripts, and retained parity regression.

### Closed manifest and ordered literal-byte root

**Analog:** `scripts/generate-canonical-json-v1-1-corpus.ts:18-99,489-506`

```typescript
export interface CanonicalJsonV11Corpus {
  schemaVersion: "canonical-json-v1.1-corpus-v1"
  contract: "runtime-abi-v1.17-contract-v1"
  generatedBy: "scripts/generate-canonical-json-v1-1-corpus.ts"
  rawByteDomain: "literal-unparsed-bytes"
  hashAlgorithm: "sha256"
  vectorRootDomain: "cowards-game:canonical-json-v1.1-corpus:v1"
  vectorRootFraming: "unsigned-64-bit-big-endian-length-then-bytes"
  vectorRootSha256: string
  vectorCount: number
  vectors: readonly CanonicalJsonV11Vector[]
}

const definitions = allDefinitions.sort((left, right) =>
  left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
)
for (const definition of definitions) {
  hash.update(frame(Buffer.from(definition.id)))
  hash.update(frame(definition.raw()))
}
```

Copy the literal schema/version fields, generator identity, hash domain/framing, deterministic order, and exact result shape. The Phase-259 case record adds kind, seed/generator identity, four fixture source hashes, invocation script, required capabilities, and expected canonical trace hash. Original bytes, not parsed objects or a live TypeScript output, define identity.

### Separate candidate write and normal check modes

**Analog:** `scripts/check-canonical-json-v1-1-red.ts:304-324`

```typescript
const receipt = runCurrentConsumers(stage)
if (args.includes("--write")) writeCanonicalJsonV11RedReceipt(receipt)
if (args.includes("--check")) {
  const errors = checkCanonicalJsonV11RedReceipt(receipt)
  if (errors.length > 0) throw new Error(errors.join("\n"))
}
```

The normal command compares committed bytes/roots and exits nonzero on drift. Candidate generation writes outside the active golden and requires a new corpus version plus reviewed semantic-diff authorization before promotion.

### Full-trace dimensions

**Analog:** `packages/engine/src/fixtures/v1-4-compatibility.ts:35-105,177-230`

Its `COMPATIBILITY_DIMENSIONS` already covers initial/intermediate state, lifecycle coordinates, events, runtime calls, observations, memory/objective handoffs, final state, outcome, failure trace, and terminal count, with per-dimension and overall hashes. Reuse this shape with strongly typed invocation/transition records. Follow `packages/engine/src/compatibility-fixtures.test.ts:323-390`: mutate each compared dimension and require one bounded finding.

## Family B — Three-Run Evidence and Existing Authority

**Apply to:** real lane runner, certifier, certificate verifier, evidence DAG, trusted producer activation, publisher, and bound certificate references.

### Closed verifier, managed trust, and branded snapshot

**Analog:** `packages/spec/src/runtime-evidence-attestation-v1-17.ts:44-99,342-446`

```typescript
export const RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17 = Object.freeze([])

const issued = requireInstant(attestation.issuedAt)
const validUntil = requireInstant(attestation.validUntil)
const instant = requireInstant(input.verificationInstant)
if (issued > instant || instant > validUntil || issued > validUntil)
  fail("VALIDITY")
if (!producer) fail("UNTRUSTED_PRODUCER")
validateGraph(attestation.graph, attestation.identityManifest, input.evidenceBytes)

const verified = new WeakSet<object>()
```

The runner cannot mint a trusted certificate by shape. The pure verifier checks canonical bytes, closed shape, 30-day-bounded freshness, managed producer, complete identity/corpus graph, three complete identical run roots, and signature, then returns an immutable verifier-known snapshot.

### Fresh process/workspace and no-write observation

**Analog:** `scripts/check-v1-36-historical-proof.ts:238-281`

```typescript
const snapshotRoot = mkdtempSync(path.join(tmpdir(), "cowards-v136-archive-"))
try {
  const before = artifacts.map(hashObservedFile)
  chmodTree(snapshotRoot, false)
  const result = spawnSync(tsxPath, [harness], {
    cwd: snapshotRoot,
    timeout: 120_000,
  })
  const after = artifacts.map(hashObservedFile)
  if (JSON.stringify(before) !== JSON.stringify(after)) return "write-attempt"
  if (result.status !== 0) return "failed"
} finally {
  rmSync(snapshotRoot, { recursive: true, force: true })
}
```

Run the complete corpus three times in separate child processes/workspaces with minimal environments. Require exact observed identity equality before result-root equality. An unavailable compiler/runtime is a system failure and creates no certificate.

### Reuse current passing/fresh publication; do not add a registry

**Analog:** `packages/persistence/src/runtime-evidence-authority-publisher.ts:963-1007,1305-1437`

The existing snapshot query selects only passed certificates joined to passed attestations, current over the full validity interval, and matching the exact semantic tuple. Publication then uses a serializable transaction, advisory lock, signed payload, source-manifest hash, append-only source edges, and generation head. Add Phase-259 certificate bindings to this source graph; do not create a parallel `passedLanguages` flag or publisher.

`packages/spec/src/runtime-execution-service.ts:250-303` already carries optional `conformanceCertificateRef` IDs/hashes per entrant. Populate those fields from verified artifacts.

## Family F — Public Workspace Wiring and Linux Cgroup-v2 Supervision

**Apply to:** supervisor package/manifests, root/runtime project references, public spec barrels/test enumeration, Rust binary, Docker certification controller, and adapter imports.

### Workspace/project-reference closure

**Analogs:** root `tsconfig.json`; runtime package `package.json`/`tsconfig.json`; explicitly enumerated `packages/spec/package.json` test script.

Register `@cowards/runtime-supervisor` under the existing `packages/*` workspace glob, depend on `@cowards/spec: workspace:*`, add build/test/lint/typecheck scripts and a composite reference to spec, add the root project reference, then add `@cowards/runtime-supervisor: workspace:*` plus project references to all three runtime packages. One later wiring plan owns the offline lockfile update after every manifest exists. Production code imports only `@cowards/spec` and `@cowards/runtime-supervisor`.

### Counted aggregate meter and macOS-hosted Linux proof

**Analogs:** `packages/runtime-js/src/container-subprocess-adapter.ts` Docker hardening/argument validation; `scripts/evaluate-runtime-sandbox.ts` fail-loud Docker/image preflight; Phase-258 exact executable/image/settings identity.

The zero-dependency Rust supervisor runs only on Linux for counted evidence. For each invocation it creates one delegated cgroup-v2 subtree, sets `cpu.max`, `memory.max`, and `pids.max`, moves the session leader into it, drops the guest to a distinct UID, and reads baseline/final `cpu.stat usage_usec`, `memory.peak`, `pids.current/events`, and `memory.events`. Cancellation uses the process group plus `cgroup.kill`, rejects late output, and waits for an empty cgroup. Missing controllers/delegation, escape, lingering descendant, or ambiguous read/write fails with no certificate.

On a macOS development host, required four-language certification runs only inside the existing Docker engine with an exact digest-addressed Linux image, engine/server version, Linux kernel/cgroup identity, read-only root, no network, bounded tmpfs, dropped capabilities, and no-new-privileges. Delegation is explicit and two-stage: a pinned trusted bootstrap/finalizer container has only `SYS_ADMIN`, `CHOWN`, and `DAC_OVERRIDE`, host cgroup namespace, and a daemon-host `/sys/fs/cgroup` bind long enough to create/chown/remove `/cowards/<run-id>` without any Strategy input; the long-lived unprivileged supervisor uses `--cgroup-parent=/cowards/<run-id>` and receives only that subtree as a writable bind. The first implementation requires the pinned `cgroupfs` driver and fails closed on systemd/unknown drivers. Native macOS measurement is non-counted proof-only; do not use `wait4`/rusage as a parity claim.

### Two-entrant public receipt and operator bootstrap

The public spec receipt contains separate closed bottom/top certificate references and Ed25519 verification. Runtime-service owns only the signing callback; persistence and Go verify independently through public exports. Certificate import reuses the existing plural `RuntimeEvidenceAuthorityImportTrustRoot[]` mechanism after protected descriptor/high-water bootstrap. The protected baseline checker records existing config/spec bytes and diffs rather than demanding a clean tree.

## Family C — Per-Slot Chronicle Grammar and Transition Coordinates

**Apply to:** replay grammar/tests, recorder trace material, reconstruction comparator, and stable current errors.

### Slot collection plus exact transition coordinate

**Analog:** `packages/engine/src/kernel/types.ts:60-79,148-165,185-200`

```typescript
export interface KernelCoordinates {
  readonly phaseNumber: number
  readonly roundNumber: 1 | 2 | 3 | 4
  readonly cycleIndex?: number
  readonly activationId?: string
  readonly activationIndex?: number
  readonly actingPlayerId?: string
  readonly soldierId?: string
  readonly stage: KernelStage
  readonly ordinal: number
}

export interface MatchMachine {
  readonly cursor: KernelCursor
  readonly selections: Readonly<{ bottom: readonly ActivationOrder[]; top: readonly ActivationOrder[] }>
  readonly slots: readonly ActivationSlotState[]
  readonly fullEvents: readonly TransitionEventSummary[]
}
```

Mirror this separation: global Match/Round/initiative state plus `Map<activationId, SlotGrammarState>` internally and a separate exact `openCycle` coordinate. Initialize each slot once with actor/player/Soldier/index/next Cycle/Advance/closure data. Never serialize the host map; Chronicle sequence remains deterministic order.

Transition comparison uses the engine's ordinal, kind, full coordinates, ordered events, before/after hashes, and terminal data. It rejects the first mismatch rather than inferring a slot from payloads.

### Stable bounded errors

**Analog:** `packages/replay/src/validate.ts:68-112,764-794`

Use the frozen code-order array and bounded `currentFailure` projection. Add stable codes for duplicate select/start/end, wrong actor/Soldier, skipped or repeated Cycle, wrong open slot, after-close event, Advance mismatch, and terminal-reason mismatch. Do not mutate grammar state after the first rejected event.

## Family D — Frozen Historical Dispatch and Byte Proof

**Apply to:** historical grammar/transition modules, historical fixture manifest, version resolver, validation/reconstruction dispatch, and compatibility tests.

### Route before parser; never migrate on read

**Analog:** `packages/replay/src/validate.ts:172-359`

```typescript
export type ReplayCompatibilityIdentityResolution =
  | { status: "current_exact"; tupleId: string }
  | { status: "historical_original_semantics"; tupleResolution: "unresolved_legacy" }
  | { status: "historical_v1_16_exact"; tupleId: string; tupleResolution: "resolved_v1.16" }
  | { status: "invalid"; reason: ClosedReason }

const compatibility = resolveReplayCompatibilityIdentity(input)
if (compatibility.status === "invalid") return versionFailure(...)
return compatibility.status === "historical_original_semantics"
  ? validateHistoricalV14Chronicle(input.chronicle)
  : validateChronicle(input.chronicle)

return error("UNSUPPORTED_MIGRATION", "No Chronicle migrations are supported.")
```

Keep this discriminated route but make every branch import version-specific schema, vocabulary, grammar, and transition logic. Historical code must not call mutable current helpers; unknown/ambiguous input returns a typed unresolved result with original bytes intact.

### Explicit historical tuple and blob-pin manifest

**Analogs:**

- `packages/engine/src/kernel/driver.ts:582-670` — explicit `runHistoricalV14ActivationFromState`/Round dispatch under the historical tuple, including preservation of original event sequence semantics.
- `scripts/check-v1-36-historical-proof.ts:25-78,118-169,284-345` — strict manifest with path, Git blob, SHA-256, byte length, exact entry set, read-only validation mode, and post-run write detection.

Create the replay historical manifest with exact Chronicle fixture bytes and hashes plus the frozen schema/vocabulary/grammar/transition source identity and expected interpretation hash. Validation may read but never normalize, relabel, or rewrite it.

## Family E — Shared Semantic Admission Before Success or Mutation

**Apply to:** replay API, runtime-service, TypeScript persistence parity path, Go evidence verification, and integration tests.

### Service pipeline is injected once from `@cowards/replay`

**Analog:** `apps/runtime-service/src/execute-match.ts:58-64,892-922,1125-1210`

```typescript
const defaultDependencies = {
  runMatch,
  recordChronicle: recordChronicleFromExecution,
  validateChronicle: validateCurrentChronicle,
  reconstructChronicle: validateCurrentReplayReconstruction,
  createReplay: createCurrentReplay,
}

const recorded = dependencies.recordChronicle({ execution, metadata })
if (!recorded.ok) return systemFailureResponse(...)
const validated = dependencies.validateChronicle(semanticInput)
if (!validated.ok) return systemFailureResponse(...)
const reconstruction = dependencies.reconstructChronicle({ chronicle, execution })
if (!reconstruction.ok) return systemFailureResponse(...)
```

Put transition/trace-root equality inside replay validation and bind its verified root into the semantic receipt. Service-local code only orchestrates and maps any failure to a redacted, non-penalizing system failure.

### Persistence validates complete evidence before durable use

**Analog:** `packages/persistence/src/complete-match.ts:45-85,121-175,194-255`

```typescript
const validation = validateCurrentChronicle(currentEnvelope)
const reconstruction = validateCurrentReplayReconstruction({ chronicle, execution })
if (
  !validation.ok ||
  !reconstruction.ok ||
  terminalAnchor?.stateHash !== reconstruction.terminalStateHash ||
  !isDeepStrictEqual(execution.result.state, finalState)
) {
  throw new MatchCompletionSemanticSystemFailure(
    "CURRENT_CHRONICLE_RECONSTRUCTION_MISMATCH",
  )
}
return brandedStructuredClone
```

Bind the verified Phase-259 trace root here and in Go's verified receipt. Persistence consumes only admitted evidence and never parses events to derive gameplay. Preserve the error shape: `failureCategory: "system_failure"`, `ownership: "system_integrity"`, `playerPenalty: false`.

## Shared Patterns

### Exact identity before behavior

Apply this order everywhere:

1. raw canonical/closed-shape admission;
2. exact tuple, corpus, policy, artifact, adapter, runtime, and toolchain identity;
3. freshness, trust, and signature;
4. semantic execution/Chronicle validation;
5. projection or durable side effect.

### Immutable deterministic records

Use `Readonly`, `Object.freeze`, `structuredClone`, explicit sorted arrays, and existing domain-framed hashes. Do not serialize host `Map`/`Set` directly or expose mutable corpus constants.

### Restricted failures and mutation tests

Use closed safe codes/coordinates and bounded issue projections. Keep full traces and preimages private. For every closed record mutate every field/binding; for each slot transition test duplicate, skipped, reordered, wrong-subject, and after-close cases; for every service/persistence rejection prove no success and no gameplay, memory, Chronicle, result, standings, or partial SQL mutation.

### Import boundaries

- Package implementation imports workspace entrypoints (`@cowards/spec`, `@cowards/replay`, etc.).
- Supervisor consumers import `@cowards/runtime-supervisor`; project references and the final lockfile enforce build order.
- Repo-root generators may use direct source imports only with the established narrow ESLint suppression.
- Test-only executor seams remain adjacent test support and do not enter production barrels.

## No Exact Single-File Analog

| Concern | Closest Composition | Planning Rule |
|---|---|---|
| Three complete real-language runs becoming one certificate | Historical fresh-workspace runner + runtime evidence verifier + existing authority publisher | Compose a new certifier; never reduce to one run, skip a case, or synthesize evidence. |
| Per-`activationId` Chronicle map | Engine slot collection/coordinates + replay bounded error model | Implement a new internal state map; preserve deterministic event order and version-specific semantics. |
| Aggregate multi-language quantitative meter | Docker containment analog + Phase-258 identity + Linux cgroup-v2 controller files | Count only pinned Linux cgroup-v2 aggregate evidence; native macOS/per-process rusage never satisfies parity. |

These are composite patterns, not unresolved design choices; `259-CONTEXT.md` and `259-RESEARCH.md` lock their semantics.

## Planning Cut Suggestions

1. immutable corpus, schema, generator, and checker;
2. canonical full-trace projection/comparator;
3. public additive spec APIs, supervisor workspace wiring, Linux cgroup-v2/Docker controller, and real four-lane executors;
4. fresh-process certifier and pure certificate verifier;
5. evidence DAG/trusted producer/publication integration;
6. current per-slot grammar;
7. frozen historical grammar/transition/byte manifest;
8. transition-by-transition reconstruction equality;
9. public two-entrant receipt verification plus runtime-service issuance binding;
10. persistence/Go admission and rollback;
11. plural trust-root bootstrap, protected baseline, complete three-run, privacy, and boundary gate.

## Metadata

**Search scope:** `packages/golden`, `packages/spec`, `packages/engine`, `packages/replay`, `packages/persistence`, `packages/runtime-*`, `apps/runtime-service`, `apps/go-backend`, and repo-root `scripts`

**Strongest analog families:**

1. canonical JSON corpus generator/checker plus v1.4 compatibility trace;
2. runtime evidence attestation verifier plus append-only authority publisher;
3. engine slot collection/transition coordinates plus replay bounded errors;
4. replay compatibility resolver plus immutable archived proof checker;
5. runtime-service and persistence shared Chronicle admission.

**Pattern extraction date:** 2026-07-16

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
