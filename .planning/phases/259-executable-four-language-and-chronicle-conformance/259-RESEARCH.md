# Phase 259: Executable Four-Language and Chronicle Conformance — Research

**Researched:** 2026-07-16
**HEAD revalidated:** `fc98b2c`
**Confidence:** HIGH for the required architecture, current integration seams, and validation strategy. MEDIUM for which runtime lanes will earn a production certificate in this workstation environment because certification must fail closed on unavailable or incomparable enforcement.

<user_constraints>
## User Constraints

### Corpus composition and governance
- **D-01:** The versioned mandatory corpus contains hand-authored normative scenarios, deterministic boundary tables, seeded generated/property cases, mutation-kill cases, and positive/negative failure traces.
- **D-02:** Maintain small readable audited fixture Strategy programs in TypeScript, Python, Rust, and Zig, bound to one behavior manifest and expected invocation script. Add raw-envelope probes that bypass Strategy logic to isolate adapters.
- **D-03:** Any case, seed, generator, expected trace, fixture source, or mutation change creates a new corpus version/hash. Retain old manifests/evidence and require reviewed semantic diffs; never update goldens in place.
- **D-04:** No semantic case may be skipped by a counted lane. Containment mechanics may use lane-specific probes only when they prove the same declared capability; an unsupported required capability blocks certification.

### Full-trace comparison oracle
- **D-05:** Each case has a committed reviewed canonical transition/failure trace under an exact semantic tuple. All four real adapters reproduce it; TypeScript is a lane, not a live oracle, and engine changes never silently regenerate expectations.
- **D-06:** Compare canonical bytes/hashes for Strategy outputs, StrategyMemory, SoldierMemory, objectives, transition kinds, lifecycle coordinates, ordered events, state hashes, terminal data, and failure classifications. Exclude wall timing, host paths, raw stderr, and private diagnostics from behavioral equality.
- **D-07:** Negative cases must match result class, stable reason code, failing invocation/transition boundary, state/memory mutation behavior, terminal effect, and retryability. Human messages may differ only through approved projections.
- **D-08:** A mismatch produces a restricted canonical diff and fails/quarantines the lane. If the committed oracle is disputed, suspend the affected case/tuple for review; never use tolerances, majority vote, or automatic regeneration.

### Certification and freshness
- **D-09:** Certification requires three independent complete corpus runs in fresh processes/workspaces under identical identities, producing identical canonical evidence hashes.
- **D-10:** An unavailable compiler/runtime is a system failure and creates no new certificate; no skips or synthetic evidence are allowed. Prior evidence survives only while its exact identity and freshness remain valid.
- **D-11:** Certificates stale immediately when any bound identity, policy, corpus, or semantic tuple changes. Otherwise require complete clean recertification at least every 30 days.
- **D-12:** Promote each lane independently and automatically when its exact complete evidence passes. Do not wait for all four, and do not weaken criteria for any lane.

### Chronicle grammar and historical routing
- **D-13:** Current grammar maintains independent state for every `activationId`: selected/started/open/closed status, actor/player, next expected Cycle, Advance state, terminal reason, and allowed event boundaries, alongside global Phase/Round/initiative state.
- **D-14:** Reconstruction compares transition kind, before/after hashes, events, lifecycle coordinates, and terminal data at every step, then final state/outcome/trace root. Reject the first mismatch with a stable code.
- **D-15:** Parser selection uses the exact persisted tuple/version or Phase 256's read-only authoritative resolver. Ambiguous evidence remains raw and immutable but returns a typed unresolved-version result; never guess, probe newest-to-oldest, or migrate on read.
- **D-16:** New Chronicles accept only current vocabulary/boundaries. Historical parsers accept only their original vocabulary. Runtime-service and persistence run the same semantic validator; replay projection follows validation; no migration relabels historical events as current.

### The agent's discretion
- Corpus file layout, generator implementation, exact repeat-run isolation mechanism, and stable code names are flexible within these locked evidence semantics.

### Deferred ideas
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Requirements and Phase Boundary

| ID | Required result | Research implication |
|---|---|---|
| CONF-01 | Real TypeScript, Python, Rust, and Zig execute one versioned hash-addressed positive/negative corpus | Replace declarations and one-behavior pairings with one immutable case manifest consumed by the real v1.17 adapters. |
| CONF-02 | Compare full state, events, memories, objectives, terminal data, and failure trace | Commit canonical expected traces; compare their canonical bytes/hashes, not selected assertions or outcome alone. |
| CONF-03 | Execute JSON, numeric, Unicode, depth, malformed-output, timeout, resource, stale-artifact, transport, repeat, differential, property, and mutation cases on every lane | Generate one mandatory lane-by-case matrix; an unavailable capability is a failed certification, never a skip. |
| CONF-04 | Relevant identity changes stale prior evidence | Bind certificate validity to the complete Phase-258 identity DAG, semantic tuple, policy, corpus root, fixture bytes, generator, adapter, and result root. |
| CONF-05 | Counted status derives from a current passing artifact hash | Mint production conformance authority only from complete three-run evidence; keep declarations, readiness flags, and fixture signatures non-promoting. |
| CHRN-01 | Track lifecycle and next Cycle independently per `activationId` | Replace the single activation/cycle grammar fields with per-slot state and exact open-boundary ownership. |
| CHRN-02 | Accept exact-version event types, boundaries, payloads, and ordering | Route before parsing and separate current event grammar from frozen historical grammar. |
| CHRN-03 | Validate semantic subject/state agreement, lifecycle, versions, outcomes, and transition postconditions | Extend the existing current semantic validator with stable first-failure codes and per-transition subject/postcondition checks. |
| CHRN-04 | Runtime-service and persistence invoke the same full validator | Preserve the existing shared `@cowards/replay` import seam and prove both boundaries reject before success or mutation. |
| CHRN-05 | Replay reconstruction equals engine transition and trace hashes | Compare every transition coordinate, kind, event vector, before/after hash, terminal data, final state, and trace root. |
| CHRN-06 | Historical v1.4 bytes remain immutable under explicit dispatch | Freeze historical schema, vocabulary, grammar, transition application, fixtures, and digest; never call current logic by fallback. |

Phase 259 owns executable language certification and Chronicle/replay equivalence. It does not add Strategy observations, repair Set fairness, complete the service/persistence release proof, or archive the milestone; those remain Phase 260 and Phase 261 work. [VERIFIED: repository `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `259-CONTEXT.md`]
</phase_requirements>

## Summary

Phase 259 should be implemented as two joined proofs: a private executable conformance proof and a version-dispatched Chronicle/replay proof. The join key is a canonical full-trace root under the exact Phase-256 semantic tuple and Phase-258 identity DAG. A lane earns independent production conformance authority only after three complete fresh-process runs reproduce the same corpus and evidence roots. [VERIFIED: repository Phase 256–259 context contracts and Phase-258 evidence modules]

The starting point is materially stronger than the original audit. Current runtime-service execution records engine transitions, validates the resulting Chronicle, validates reconstruction, and creates replay through `@cowards/replay`; TypeScript completion persistence independently invokes the same current Chronicle and reconstruction validators before opening its transaction. The current audit reproduction at `fc98b2c` passes the repaired lifecycle, depth, arena, and successful-push compatibility observations. [VERIFIED: repository `apps/runtime-service/src/execute-match.ts`, `packages/persistence/src/complete-match.ts`, and audit reproduction executed 2026-07-16]

The remaining conformance gap is still substantive. `v1-37-current-language-corpus.ts` projects one historical behavior into four sources and lists thirteen required gate names. On the selected successor contract, `four-language-parity.test.ts` treats `UNSUPPORTED_RUNTIME_ADAPTER` for every pairing as its expected result; on the legacy branch it compares only outcome identity, broad event presence, and privacy markers. That is a readiness inventory, not CONF-01 through CONF-05 evidence. [VERIFIED: repository `packages/golden/src/v1-37-current-language-corpus.ts` and `apps/runtime-service/src/four-language-parity.test.ts`]

### Architecture responsibility map

| Responsibility | Canonical owner | Inputs | Output/consumer |
|---|---|---|---|
| Corpus manifest, fixture bytes, case generators, reviewed expected traces | `packages/golden` | Exact tuple, Phase-258 ABI/policy/identity, audited fixture sources | Lane runners and certificate verifier |
| TypeScript execution | `packages/runtime-js` real v1.17 adapter | Authenticated request bytes, exact executable source, host signing identity | Authenticated exclusive result and execution receipt |
| Python execution | `packages/runtime-python` candidate host/adapter | Same ABI request, revision identity, exact host/tool identity | Same authenticated result classes and receipt evidence |
| Rust/Zig execution | `packages/runtime-wasm-wasi` plus language-specific build identity | Same ABI request, exact WASI artifact/toolchain/Wasmtime identity | Same authenticated result classes and receipt evidence |
| Match transitions and gameplay consequences | `packages/engine` transition kernel | Validated runtime result and canonical prestate | Recorded transition stream; no corpus code reimplements rules |
| Canonical full-trace projection and comparison | `packages/golden` using spec/replay types | Runtime invocation traces plus engine transition stream | Private result root, restricted diff, run manifest |
| Certificate verification and counted eligibility | `packages/spec` and Phase-256 authority/persistence seams | Three identical complete run roots and exact identity graph | Per-lane current certificate or fail-closed status |
| Current Chronicle grammar and semantic validation | `packages/replay` | Exact current tuple, Chronicle, execution transitions, anchors | Typed success or stable first-failure code |
| Historical v1.4 interpretation | Frozen historical replay modules | Exact persisted historical tuple and original bytes | Historical validation/replay only |
| Service admission | `apps/runtime-service` | Completed kernel execution and Chronicle recording | Validated internal result or no-mutation system failure |
| Persistence admission | `packages/persistence` parity/quarantine path and normal Go-owned boundary | Validated Chronicle, final state, exact execution evidence | Atomic persist or rollback/system failure |
| Public projection | Existing Go/web public boundaries | Safe IDs, classifications, status, hashes | No source, artifact, memory, objective, raw diagnostic, or host detail |

All ownership assignments above extend existing package boundaries; none authorizes Strategy execution in Go, web, or API code. [VERIFIED: repository `AGENTS.md`, package imports, Phase-256/258 context]

## Revalidated Baseline at `fc98b2c`

The persisted core-rules reproduction completed successfully on 2026-07-16. It reported immediate last-Soldier victory with one `MATCH_ENDED`, Cycle-end Backstab closure reason `BACKSTABBED`, valid-prefix excess-order behavior, typed `MAX_DEPTH_EXCEEDED` player violation, rejection of overlapping initial terrain, preservation of the historical Backstab boundary schema literal, and successful-push pusher history `RIGHT`. The reproduction explicitly requires the historical literal to remain accepted at schema level, so `legacyBoundaryAccepted: true` is compatibility evidence, not permission for newly produced current evidence. [VERIFIED: repository audit reproduction executed at `fc98b2c`; reproduction source `lifecycleCompatible` predicate]

The current replay validator already performs exact current route/tuple checks, authenticated execution-evidence checks, trusted re-recording equality, current event contract dispatch, initial/intermediate/final semantic state validation, state-hash chaining, anchor checks, reconstruction, and terminal consistency. This is the correct seam to deepen rather than replace. [VERIFIED: repository `packages/replay/src/validate.ts`]

Two precise Chronicle gaps remain:

1. `GrammarState` owns only one `activeActivation` and one `activeCycleIndex`; current activation event sets still mention removed historical `PUSH_ATTEMPTED`; and some activation-context validation does not persist the returned context. Per-slot interleaving therefore is not structurally represented. [VERIFIED: repository `packages/replay/src/grammar.ts`]
2. `validateHistoricalV14Chronicle` parses through a historical schema but then calls several shared validators, including `validateChronicleGrammar` and `validateChronicleTransitions`. A current grammar refactor could therefore change historical interpretation unless the historical route is frozen behind version-specific implementations and immutable digest fixtures. [VERIFIED: repository `packages/replay/src/validate.ts`]

The production trusted-producer registry for runtime evidence remains deliberately empty with a source comment reserving managed evidence for Phase 259. This is the intended fail-closed state until real per-lane certificates exist. [VERIFIED: repository `packages/spec/src/runtime-evidence-attestation-v1-17.ts`]

## Standard Stack

No dependency addition is warranted. Use the existing workspace and standard-library primitives. [VERIFIED: repository root and package manifests]

| Layer | Existing component | Phase-259 use |
|---|---|---|
| Workspace/runtime | Node 26, pnpm 11, TypeScript 6 | Corpus schemas, runners, canonical trace projection, deterministic generation |
| Validation/tests | Zod 4, Vitest 4 | Trusted shape validation after raw admission; unit, property, mutation, adapter, replay suites |
| Browser/E2E | Playwright 1.60 | Only if a public/operator projection changes; no UI work is required by this phase |
| Python | Python 3.9 isolated subprocess host | Real Python fixture and raw-envelope lane |
| Rust | rustc/cargo 1.95 | Build exact WASI fixture artifact and bind compiler/toolchain identity |
| Zig | Zig 0.16 | Build exact WASI fixture artifact and bind compiler/toolchain identity |
| WASI host | Wasmtime 45 | Execute Rust/Zig artifacts through the shared bounded host adapter |
| Control plane | Go 1.26 | Verify installed current authority and preserve no-Strategy-execution boundary |
| Persistence | PostgreSQL 16 client and existing migrations/repositories | Store and enforce exact certificates/publication identity and atomic Chronicle acceptance |
| Identity/crypto | Existing SHA-256, Ed25519, HMAC, canonical JSON, domain-framed helpers | Hash/sign exact trace and certificate material; do not invent new cryptography |

### Package legitimacy audit

Not applicable: research recommends no package installation, package ecosystem, new language, parser library, property-testing dependency, or cryptography dependency. Deterministic generation can use seeded repository code and Vitest loops; identity and raw canonical JSON primitives already exist. [VERIFIED: repository Phase-258 implementations and package manifests]

## Architecture Patterns

### 1. Immutable corpus as reviewed specification

Create a new Phase-259 corpus version rather than extending the v1.37 readiness projection in place. Its root manifest should bind:

- semantic tuple and exact ABI/policy identities;
- ordered case IDs and kind (`normative`, `boundary`, `generated`, `mutation`, `failure`, `raw-envelope`);
- generator version plus explicit seeds;
- all four fixture source byte hashes and build invocation identity;
- expected invocation scripts and canonical expected trace hashes;
- required capability/gate membership for every case;
- the canonical corpus root.

The committed expected traces must be generated only into a candidate directory, reviewed as a semantic diff, and published under a new corpus version. The check command must refuse to overwrite the active golden. [VERIFIED basis: repository hash-checked generated-artifact patterns; D-01 through D-05 prescribe the new semantics]

### 2. Canonical full-trace record

Define one private, closed projection that joins runtime and engine evidence without including nondeterministic or host-private fields. At minimum it should include:

```ts
type CanonicalConformanceTrace = Readonly<{
  corpusVersion: string
  caseId: string
  laneIdentityHash: string
  semanticTupleId: string
  invocations: readonly Readonly<{
    invocationId: string
    method: "selectActivations" | "soldierBrain"
    resultClass: "success" | "player_violation" | "system_failure"
    stableCode: string | null
    canonicalPayloadHash: string | null
    strategyMemoryHash: string
    soldierMemoryHash: string
    objectiveHash: string
    retryable: boolean
  }>[]
  transitions: readonly Readonly<{
    ordinal: number
    kind: string
    coordinates: JsonValue
    beforeStateHash: string
    afterStateHash: string
    orderedEventsHash: string
    terminalHash: string | null
  }>[]
  finalStateHash: string
  outcomeHash: string
  traceRoot: string
}>
```

The exact concrete names are discretionary, but equality must cover the D-06/D-07 fields. Hashing memories/objectives does not make them public: private trace material remains restricted evidence, while public/operator projections expose only approved safe identifiers and classifications. [VERIFIED basis: repository Phase-258 canonical identity/privacy contracts and `packages/replay/src/record.ts` transition material]

### 3. One lane runner, four real executors

Use a registry whose lane implementations translate one canonical case into the already-authenticated v1.17 adapter request. TypeScript executes `executeV117`; Python executes `createPythonCandidateInvocationAdapterV117`/the real host; Rust and Zig execute separate exact artifacts through `runWasmWasiStrategyMethodV117Sync`. Raw-envelope cases call the adapter admission seam with controlled raw observations rather than embedding malformed behavior in fixture Strategy logic. [VERIFIED: repository adapter exports in `packages/runtime-js`, `packages/runtime-python`, and `packages/runtime-wasm-wasi`]

The runner must report an unavailable compiler/runtime as a typed system failure and a failed certificate. It must never fall back to a legacy adapter, accept the current `UNSUPPORTED_RUNTIME_ADAPTER` matrix as success, or silently reduce case coverage. [VERIFIED basis: repository current parity branch and locked D-04/D-10]

### 4. Deterministic three-run certification

Each lane certification should launch three child processes with fresh temporary workspaces and minimal environments, then require equality of:

- exact discovered/bound toolchain, runtime, adapter, artifact, policy, corpus, and tuple identities;
- complete case inventory with no skip/xfail/unsupported result;
- per-case trace root and restricted classification;
- whole-run manifest/evidence root.

Only the verifier, not a runner or fixture, can construct the reviewed production conformance certificate. Certificate freshness is the minimum of its 30-day policy window and every bound attestation/certificate window. Any bound root change invalidates lookup rather than mutating the old record. Promotion is lane-independent through the existing Phase-256 authority publication and scheduling derivation. [VERIFIED basis: repository Phase-256 authority modules, Phase-258 evidence DAG, D-09 through D-12]

### 5. Per-slot current Chronicle grammar

Represent current grammar state as global match/round/initiative state plus `Map<activationId, SlotState>`. A slot state needs selected/started/open/closed flags, activation index, actor/player, next expected Cycle, Advance state, terminal reason, and last accepted event boundary. A separate `openCycle` reference can enforce that action events belong to exactly one slot and Cycle while allowing every selected slot to retain independent next-Cycle history. [VERIFIED basis: v1.4 interleaving schedule, audit F-08, D-13]

Use stable first-failure codes for duplicate selection/start/end, wrong actor or Soldier, skipped or repeated Cycle, event after closure, inconsistent payload/context subject, invalid Advance history, invalid terminal reason, and event at the wrong boundary. Never mutate grammar state after the first rejected event. [VERIFIED basis: existing replay error model and D-13/D-14]

### 6. Version-dispatched validation and reconstruction

Resolve exact tuple/version before schema selection. Current input must flow through current schema, vocabulary, grammar, semantic state validator, transition comparator, and replay transition implementation. Historical v1.4 input must flow through frozen historical equivalents. Unknown or ambiguous input returns a typed unresolved-version result while preserving original bytes. [VERIFIED basis: repository `resolveReplayCompatibilityIdentity`, Phase-256 historical resolver contract, D-15/D-16]

For current evidence, compare the recorded engine transition and reconstructed transition at every ordinal: kind, coordinates, before/after hashes, ordered events, terminal data, and accumulated trace root. Stop at the first mismatch with a stable code and transition index, then compare final state and outcome. [VERIFIED basis: `packages/replay/src/record.ts`, `replay-transition.ts`, `validate.ts`, D-14]

### 7. Shared service and persistence admission

Keep `validateCurrentChronicle` and `validateCurrentReplayReconstruction` in `@cowards/replay` as the sole current semantic admission API. Runtime-service already injects and invokes both around recording/replay. `admitCurrentMatchCompletion` already invokes both and compares terminal anchors/final state before the TypeScript transaction. Phase 259 should add adversarial integration tests and ensure the normal Go-owned persistence route accepts only runtime-service evidence whose same semantic receipt/trace root has been strictly verified; Go must not reimplement Chronicle rules. [VERIFIED: repository runtime-service dependencies, `packages/persistence/src/complete-match.ts`, `apps/go-backend` ownership notes]

## Exact Current Code Seams

| File/module | Preserve | Change/add |
|---|---|---|
| `packages/golden/src/v1-37-current-language-corpus.ts` | Immutable v1.32 source projection as historical readiness source | Add a new immutable conformance corpus owner; do not mutate old source bytes/goldens |
| `apps/runtime-service/src/four-language-parity.test.ts` | Pairing/readiness regression and privacy assertions | Replace any promotion significance with a real mandatory lane-by-case runner and full-trace assertions |
| `packages/runtime-js/src/{adapter,worker-thread-adapter,subprocess-adapter}.ts` | Authenticated outer response and host-only signing material | Expose/use one exact real v1.17 executor selected by certified containment identity |
| `packages/runtime-python/src/python-subprocess-adapter.ts` | Candidate host admission, typed failure ownership, receipts | Drive real fixture and raw-probe corpus through the exact source/tool identity |
| `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` | Shared host classification and exact artifact/runtime identity | Run distinct Rust/Zig artifacts and bind each build/toolchain identity |
| `packages/spec/src/runtime-evidence-{v1-17,attestation-v1-17}.ts` | Closed 15-node/26-edge DAG, ten exact pins, production-empty trust | Add reviewed conformance artifact/certificate bindings and managed production producer only after proof |
| `packages/replay/src/record.ts` | Transition material, state hashes, events, terminal/failure fields | Supply canonical full-trace projection inputs/root |
| `packages/replay/src/grammar.ts` | Existing event/error helpers | Split current/historical vocabulary and replace singleton activation state with per-slot state |
| `packages/replay/src/validate.ts` | Exact current route, semantic state checks, shared API | Make current grammar/postconditions transition-complete and freeze historical calls away from current helpers |
| `packages/replay/src/{replay-transition,reconstruct}.ts` | Existing deterministic reconstruction and explicit dispatch | Return/compare transition and trace roots at each ordinal |
| `apps/runtime-service/src/execute-match.ts` | Shared replay validator dependency seam | Prove full semantic rejection before a success result leaves the service |
| `packages/persistence/src/complete-match.ts` | Pre-transaction current admission and reconstruction check | Bind exact trace root and add negative rollback/admission proof |
| `packages/persistence/src/runtime-evidence-authority-publisher.ts` | Append-only signed install and source manifests | Admit only complete reviewed per-lane Phase-259 conformance certificates |
| `apps/go-backend/runtime_service_client_v1_17.go` and orchestrator | Exact wire/semantic receipt verification and normal lifecycle ownership | Verify the new bound trace/certificate fields without implementing rules or Strategy runtime |

## Validation Architecture

Nyquist validation is enabled. Planning should establish missing Wave-0 fixtures and tests before implementation so every downstream task has an executable proof target. [VERIFIED: repository `.planning/config.json` read-only setting `workflow.nyquist_validation: true`]

### Requirement-to-proof map

| Requirement | Primary test architecture | Required failure proof |
|---|---|---|
| CONF-01 | Golden manifest/hash tests plus real adapter integration runner for all four lanes | Missing lane, missing case, fallback adapter, changed fixture, or incomplete inventory prevents a run root |
| CONF-02 | Canonical trace projector/comparator unit tests and end-to-end positive cases | Mutate each state/event/memory/objective/terminal/failure field and require exact first diff |
| CONF-03 | Generated lane-by-case matrix with explicit case-kind coverage and mutation-kill registry | Unsupported capability, skipped case, survivor mutation, nondeterministic seed, or partial result fails certification |
| CONF-04 | Identity mutation table over engine/adapter/runtime/toolchain/ABI/policy/corpus/artifact | Every one-field change makes lookup stale; old evidence remains immutable |
| CONF-05 | Phase-256 eligibility and persistence authority integration tests | Gate name, readiness flag, fixture signature, expired/incomplete/wrong-root cert never promotes |
| CHRN-01 | Replay grammar unit tests with interleaved activation slots | Duplicate/skipped/out-of-order Cycle, wrong slot/actor/Soldier, reopen/after-close event rejected |
| CHRN-02 | Version-dispatch, event literal, payload, and ordering table tests | Current accepts no historical-only literal; historical accepts no current-only event; unknown tuple unresolved |
| CHRN-03 | Semantic Chronicle adversarial mutation suite | Subject/state, occupancy, lifecycle, tuple, outcome, and postcondition mutations fail with stable codes |
| CHRN-04 | Runtime-service and persistence integration tests | Invalid Chronicle cannot return success or open/commit gameplay persistence; fault rollback remains complete |
| CHRN-05 | Transition-by-transition reconstruction differential tests | Mutate kind, coordinate, event order, before/after hash, terminal, final root and reject first mismatch |
| CHRN-06 | Frozen historical fixture bytes/digests and dispatch tests | Current refactor cannot change historical result; read never rewrites, relabels, normalizes, or migrates |

### Wave-0 validation assets

Before parallel implementation, create or identify:

1. closed corpus manifest/result schemas and canonical hash vectors;
2. one readable four-language behavior manifest with exact invocation script;
3. raw-envelope observation fixtures for every failure class;
4. seeded generator determinism and mutation-kill registry tests;
5. canonical full-trace projector and restricted-diff test vectors;
6. fresh-process three-run harness fixture and unavailable-toolchain fixture;
7. interleaved per-slot Chronicle valid fixture plus one mutation per stable error family;
8. frozen v1.4 Chronicle byte/digest/interpretation manifest;
9. runtime-service and persistence invalid-evidence/rollback fixtures;
10. production authority negative fixtures proving the empty/unproved posture.

### Focused implementation commands

```bash
pnpm --filter @cowards/golden test
pnpm --filter @cowards/replay test
pnpm --filter @cowards/runtime-js test
pnpm --filter @cowards/runtime-python test
pnpm --filter @cowards/runtime-wasm-wasi test
pnpm --filter @cowards/runtime-service test
pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
```

### Integration and repository gates

```bash
DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence test
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1
pnpm go:parity
pnpm strategy-artifacts:check
pnpm contract:check
pnpm boundary:imports
pnpm v1.37:integrity-boundaries:check
pnpm lint
pnpm typecheck
pnpm boundary:monitors
```

The final phase gate must execute the complete corpus three times per candidate lane in fresh processes, compare all roots, then run Chronicle, runtime-service, persistence, Go, privacy, and boundary monitors. A green unit suite without real compiler/runtime execution is insufficient. [VERIFIED basis: requirements CONF-01 through CHRN-06 and locked D-09/D-10]

## Security Domain Review

Security enforcement is applicable because every Strategy and every persisted/public evidence envelope is untrusted input. The relevant OWASP ASVS domains are V4 access control, V5 validation/sanitization/encoding, V6 stored cryptography, V9 communications, V10 malicious code, V12 files/resources, and V13 API/web-service boundaries. [VERIFIED basis: repository hostile-Strategy boundary and authenticated runtime design]

| Threat | Required control |
|---|---|
| Forged runner/certificate promotes a lane | Managed producer key, closed certificate shape, three complete run roots, exact Phase-258 DAG, append-only verified installation |
| Golden or generator tampering blesses drift | Version/hash every case, seed, fixture, generator, expected trace; reviewed new-version semantic diff only |
| Strategy or guest mints authority | Host alone signs outer response/receipt; guest returns untrusted payload bytes only |
| Runtime/toolchain substitution | Fresh exact identity observation before execution; stale mismatch is no-mutation system failure |
| Resource exhaustion or unavailable meter becomes player blame | Require positive Strategy attribution; unavailable/ambiguous enforcement blocks certification and remains system-owned |
| Version confusion reinterprets Chronicle | Exact tuple dispatch before parsing; no newest-first probing, fallback, or migrate-on-read |
| Evidence leaks source/memory/objective/host data | Keep full traces private; restricted diff/public projections contain safe codes, IDs, hashes, and status only |
| Invalid Chronicle mutates durable state | Validate complete semantic/reconstruction evidence before transaction and prove rollback on every later fault |

## Don't Hand-Roll

- Do not create another Match loop or reproduce rules inside corpus code; consume the engine transition kernel and recorder stream.
- Do not use TypeScript output as a live oracle, majority vote, tolerances, snapshot auto-update, or “regenerate expected” during normal tests.
- Do not write a second JSON codec, hash framing, signature format, certificate verifier, or public redaction scheme; reuse Phase-258 canonical identity/evidence primitives.
- Do not create four semantically different test harnesses. One case manifest and comparison contract drives four thin real-adapter executors.
- Do not let Zod/host JSON parsing be the first operation on raw adversarial bytes; preserve the Phase-258 bounded canonical admission boundary.
- Do not parse current input with historical schemas or let historical validators call mutable current grammar/transition helpers.
- Do not equate compiler availability, adapter metadata, passing containment, named gates, or signed diagnostics with executable conformance.
- Do not publish raw mismatch values when they may contain source, artifacts, memory, objectives, diagnostics, paths, or host data.

## Common Pitfalls

1. **Pairwise Matches obscure lane defects.** A bottom/top matrix tests interaction but does not isolate which adapter produced a wrong invocation result. Certify each lane against the same single-lane case oracle first; retain pairings as integration coverage. [VERIFIED: current parity test structure]
2. **One final trace root hides the first divergence.** Store ordered per-invocation/per-transition hashes and compute the root over them so a restricted diff can identify the first safe coordinate. [VERIFIED basis: D-08/D-14]
3. **A skipped hostile probe falsely looks portable.** Capability equivalence must be declared and proved; otherwise the lane is uncertified. [VERIFIED basis: D-04]
4. **Historical sharing is semantic coupling.** Shared function calls can make an old tuple inherit a current bug fix. Freeze behavior-specific implementations or immutable interpretation vectors, not only a historical schema name. [VERIFIED: current historical validator calls shared helpers]
5. **Certificate freshness is checked only at issuance.** Scheduling, claim, execution, completion, and authority installation must compare the current bound roots and time window. [VERIFIED: Phase-256 fail-closed model]
6. **Private hash preimages leak in diffs or fixtures.** A hash-safe public record does not make its full private trace safe for logs/API. Separate evidence storage and projections at the type/API boundary. [VERIFIED: project privacy constraints]
7. **System failure is converted into a test failure without no-mutation proof.** Negative conformance must check retryability, pre/post machine and memory identity, terminal effect, and absence of player penalty. [VERIFIED: CONF-02 and Phase-258 failure contract]
8. **PostgreSQL absence blocks all local work.** Unit and adapter/replay suites remain useful, but database-backed CHRN-04/certificate install proof is mandatory before phase completion and must not be represented by mocks. [VERIFIED basis: existing persistence integration model]

## State of the Art in This Repository

| Earlier posture | Current starting posture | Phase-259 target |
|---|---|---|
| Thirteen gate names and one Strategy behavior | Exact v1.17 ABI, canonical JSON, three-way failures, evidence DAG, real adapter candidates | Versioned mandatory full corpus, three-run real lane certificates |
| Final outcome and broad event presence | Engine transition records include kinds, coordinates, state hashes, events, terminal/failure material | Canonical full-trace equality and safe first-divergence report |
| Single Chronicle activation/cycle grammar state | Strong exact current tuple/semantic/reconstruction validator around singleton grammar | Independent slot lifecycle plus transition-complete equality |
| Version checks with shared parser/grammar helpers | Explicit current vs historical route and migration refusal | Frozen exact historical parser/grammar/transition path and byte digest |
| Fixture-only/empty production conformance authority | Phase-256 append-only signed authority and Phase-258 exact evidence DAG | Independent current per-lane authority only from complete proof |

## Environment Audit

Observed locally on 2026-07-16: Node `v26.0.0`, pnpm `11.1.2`, Python `3.9.6`, Go `1.26.3`, rustc/cargo `1.95.0`, Zig `0.16.0`, Wasmtime `45.0.0`, and PostgreSQL client `16.14`. The default local PostgreSQL readiness probe at `/tmp:5432` returned no response. These values are research observations, not approved deployment pins or conformance evidence. [VERIFIED: repository-local command output]

The root manifest declares pnpm 11.1.2, TypeScript 6.0.3, Vitest 4.1.6, Playwright 1.60, and `packages/spec` declares Zod 4.4.3. Exact resolved lockfile/artifact identities must be bound by the certificate rather than inferred from these ranges. [VERIFIED: repository package manifests]

## Assumptions

- Phase 258's activated v1.17 request/response/receipt and identity contracts remain the sole successor ABI foundation; Phase 259 will not redefine their gameplay semantics. [VERIFIED: Phase-258 context and current code]
- Phase 256 authority publication remains the sole path to counted eligibility; Phase 259 supplies evidence, not a competing registry. [VERIFIED: Phase-256 context and current persistence authority]
- Rust and Zig remain distinct language lanes even though both execute through the shared WASM/WASI host, because their fixture sources, compiler/toolchain identities, and artifacts are independently bound. [VERIFIED: repository runtime packages and requirements]
- UI review is unnecessary unless implementation changes public/operator pages; the committed phase scope is backend/runtime/replay/evidence. [VERIFIED: Phase-259 requirements and context]

## Open Questions and Stop Conditions

No planning-blocking user decision remains. The locked choices determine corpus governance, equality, certification, and historical routing.

Implementation must stop for explicit compatibility approval if a proposed Chronicle “clarification,” current grammar repair, replay comparator, or corpus expectation changes any valid v1.4 Match state, action legality, event order, outcome, Strategy observation, or historical interpretation. If a committed oracle is disputed, suspend that case/tuple rather than regenerating it. [VERIFIED: milestone approval gate and D-08]

A certification attempt may legitimately leave an individual lane uncertified when it cannot provide every required capability or comparable resource evidence in the exact environment. Phase 259 and the milestone do **not** finish in that state: CONF-01 through CONF-05 and the milestone definition of done require executable conformance for TypeScript, Python, Rust, and Zig unless the user explicitly approves a scope or compatibility ruling. The failure is never a reason to weaken the corpus, fabricate evidence, or block independent promotion of a different complete lane while remediation continues. [VERIFIED: milestone definition of done, CONF-01 through CONF-05, D-04, D-10, D-12]

## Sources

### Primary planning and rules sources

- `.planning/phases/259-executable-four-language-and-chronicle-conformance/259-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md`
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md`
- `.planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`

### Primary implementation sources

- `packages/golden/src/v1-37-current-language-corpus.ts`
- `apps/runtime-service/src/four-language-parity.test.ts`
- `packages/runtime-js/src/adapter.ts` and real v1.17 adapter implementations
- `packages/runtime-python/src/python-subprocess-adapter.ts`
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts`
- `packages/spec/src/runtime-evidence-v1-17.ts`
- `packages/spec/src/runtime-evidence-attestation-v1-17.ts`
- `packages/replay/src/grammar.ts`
- `packages/replay/src/record.ts`
- `packages/replay/src/replay-transition.ts`
- `packages/replay/src/reconstruct.ts`
- `packages/replay/src/validate.ts`
- `apps/runtime-service/src/execute-match.ts`
- `packages/persistence/src/complete-match.ts`
- `packages/persistence/src/runtime-evidence-authority-publisher.ts`
- `apps/go-backend/runtime_service_client_v1_17.go`
- `AGENTS.md`

## Research Metadata

- **Research mode:** repository-primary, architecture and verification research
- **External lookup:** none; current repository contracts and executable evidence were sufficient
- **Audit reproduction:** passed at `fc98b2c` on 2026-07-16
- **New dependencies recommended:** none
- **Planning readiness:** ready; no unresolved user decision

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Research completed: 2026-07-16*
