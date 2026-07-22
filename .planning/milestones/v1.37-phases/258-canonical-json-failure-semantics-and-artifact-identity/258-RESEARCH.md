# Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity — Research

**Researched:** 2026-07-13
**HEAD revalidated:** `c9cb41e`
**Confidence:** HIGH for current repository behavior, integration seams, and the plan ordering below. Exact parser ceilings and runtime-budget values remain intentionally provisional until Plan 01 executes the locked calibration/freeze gate.

<user_constraints>
## User Constraints

### Canonical JSON profile
- **D-01:** Reject duplicate object keys from raw bytes before host-language object conversion in every input, output, memory, objective, manifest, and evidence envelope.
- **D-02:** Allow finite IEEE-754 binary64 numbers; reject NaN/infinities; require integer values within ±(2^53−1); normalize negative zero to `0`; use one shortest-round-trip decimal encoding. Domain schemas may be stricter.
- **D-03:** Require valid UTF-8 and Unicode scalar sequences, preserve exact strings without NFC/NFD normalization, and sort object keys lexicographically by UTF-8 bytes for canonical serialization/hashing.
- **D-04:** Define one canonical parser ceiling for bytes, depth, node count, string bytes, array entries, and object entries. Specific fields may declare lower documented caps.

### Runtime budget contract
- **D-05:** Every counted lane enforces the same named wall, compute/fuel, memory, output, process, and capability budget vector. A lane unable to prove equivalent enforcement remains uncertified.
- **D-06:** Every Strategy method invocation and the cumulative Match have explicit budgets carried in the signed execution request.
- **D-07:** Proven Strategy-caused exhaustion is a player violation; host overload, unavailable enforcement, accounting failure, or ambiguous attribution is a no-mutation system failure.
- **D-08:** Preflight validation, compilation, artifact validation, and conformance have separate budgets and never consume Match budget.

### Failure ownership
- **D-09:** Proven Strategy-code exceptions are player violations; adapter, interpreter, Wasmtime, transport, and host crashes are system failures.
- **D-10:** The adapter owns the authenticated outer envelope. Missing, truncated, unauthenticated, or undecodable envelopes are system failures; duplicate, non-canonical, schema-invalid, or illegal decoded Strategy payloads are player violations.
- **D-11:** Player violations discard every proposed response and memory field, preserve prior memory, and apply only the canonical v1.4 consequence.
- **D-12:** Retry system failures only from identical pre-transition state with the same request identity and budgets under bounded Go policy. Never retry player violations automatically.

### Source, artifact, and evidence identity
- **D-13:** Original source bytes and their domain hash define immutable revision identity. Normalized bytes are a separately hashed derivative with explicit policy/version and line-ending facts; artifacts bind both.
- **D-14:** Use one hash algorithm with fixed domain tags and canonical length-delimited encoding for every identity domain.
- **D-15:** Counted identity binds exact executable/image digest, reported version, target/ABI, compiler flags, adapter build, standard library/sysroot, containment policy, and every behavior-significant execution setting. Public output exposes safe IDs only.
- **D-16:** Evidence is a closed validated hash graph from source through artifact, toolchain/runtime, tuple, policy/corpus, and executable results, with trusted pipeline attestation.
</user_constraints>

<phase_requirements>
## Requirements and Phase Boundary

| ID | Required result | Research implication |
|---|---|---|
| RABI-01 | One fully specified canonical JSON profile | Freeze lexical rules, limits, stable codes, ownership contexts, and canonical bytes before adapter migration. |
| RABI-02 | Iterative bounded validation | No recursive Zod/value walk, host parse, serializer, or duplicate detector may be the first untrusted-data operation. |
| RABI-03 | Exactly success, player violation, system failure | Replace dual-shaped `RuntimeResult` failures and exception-only infrastructure signaling with a discriminated union. |
| RABI-04 | Only engine converts player violations into gameplay | Adapters report classification; the Phase-257 driver/kernel remains the sole penalty authority. |
| RABI-05 | Infrastructure failures never mutate gameplay or persisted results | Bind retry identity and prove unchanged machine/memory/Chronicle/result/standings plus transaction rollback. |
| RABI-06 | Explicit identity domains and bindings | Version original, normalized, artifact, manifest, executable, tuple, policy, corpus, and evidence identities. |
| RABI-07 | Exact runtime/toolchain pins | Floating labels remain discovery-only and cannot support counted evidence. |
| RABI-08 | Same four-language ABI and budget contract | TypeScript, Python, Rust, and Zig expose the same fields and ownership semantics; unsupported enforcement is explicit and uncertified. |

Phase 258 defines and installs the ABI, bounded JSON, failure, budget, and identity foundation. Phase 259 still owns the full executable four-language conformance corpus and current Chronicle grammar/reconstruction proof. Phase 258 must provide negative vectors and executable contract probes without claiming Phase-259 conformance maturity. [VERIFIED: `.planning/REQUIREMENTS.md`; `.planning/ROADMAP.md`; `258-CONTEXT.md`]
</phase_requirements>

## Executive Summary

Phase 257 materially improved the starting point. There is now one current engine transition authority, the kernel has explicit `success`, `player_violation`, and `system_failure` resumes, a system failure returns the unchanged machine, runtime-service contract v1.16 issues an HMAC semantic receipt, Go strictly verifies the TypeScript-issued wire bytes, and migration `0017_runtime_semantic_receipts.sql` makes persisted receipts all-or-none and immutable. The current semantic tuple is `sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae`. [VERIFIED: Phase-257 Plans 19-22; `packages/engine/src/kernel/{types,driver,step}.ts`; `packages/spec/src/runtime-execution-service.ts`; `apps/runtime-service/src/semantic-receipt.ts`; `apps/go-backend/runtime_semantic_receipt.go`; migration 0017]

Those assets are seams, not completion of RABI-01 through RABI-08. The permanent audit still returns `deepValidation: "threw:RangeError"`. TypeScript, runtime-service, Python, and WASM boundaries still call host JSON parsers before duplicate detection, recursive schema/value walks remain, and existing serializers disagree on ordering and numeric/string details. A direct probe of `parseSubprocessIpcResponse` accepted `{"a":1,"a":2}` as `{"a":2}` and even admitted a duplicate top-level `ok` key after last-value-wins conversion. [VERIFIED: permanent audit executed at `c9cb41e`; direct read-only `tsx` probe; `packages/spec/src/schemas.ts`; runtime adapters; `apps/runtime-service/src/server.ts`]

Failure classification is improved at the engine boundary but is still structurally impure below it. Python and WASM normalizers attach a synthetic player `THROWN_EXCEPTION` to adapter `systemFailure`; JS worker malformed IPC also produces the dual shape, while subprocess malformed IPC can escape by exception. The Phase-257 driver happens to prioritize `systemFailure`, preventing gameplay mutation, but RABI-03/RABI-04 require the transport types themselves to make a mixed classification unrepresentable. [VERIFIED: `packages/runtime-{js,python,wasm-wasi}`; focused adapter tests; engine driver]

The v1.16 receipt is an especially important compatibility constraint. It intentionally binds insertion-ordered TypeScript `JSON.stringify` bytes, and Go tests require that a semantically equivalent `json.Marshal` rewrite be rejected. Canonical UTF-8 key ordering will therefore change current response bytes and hashes. Phase 258 must mint an atomically activated ABI/service/receipt version and preserve immutable v1.16 receipt evidence under its original byte semantics; silently changing the v1.16 serializer would corrupt Phase-257 proof. [VERIFIED: `TestRuntimeServiceV116ConsumesTypeScriptIssuedWireGolden`; v1.16 wire golden; Phase-257 Plan-20 summary]

No new package is needed. Implement the canonical codec in the repository with standard TypeScript/Go facilities and generated vectors. Host JSON parsers may be used only after raw bytes have passed the iterative canonical preflight and only where bounded materialization is then safe. [VERIFIED: current workspace stack and research `STACK.md`]

## Revalidated Baseline at `c9cb41e`

| Concern | Current result | Phase-258 target |
|---|---|---|
| Permanent deep-memory audit | `threw:RangeError` at depth 3,000 | Typed deterministic limit error; never throw or overflow |
| Duplicate keys in JS IPC | Last value wins before schema validation | Reject raw duplicate with stable code and ownership path |
| Phase-257 lifecycle repairs | All repaired observations pass | Preserve byte/semantic fixtures; no gameplay change |
| Kernel system failure | Explicit unchanged-machine failure | Keep as sole no-mutation gameplay boundary |
| v1.16 TS/Go receipt | Exact insertion-ordered bytes, signed and immutable | Preserve historical v1.16; mint canonical successor atomically |
| Go JSON admission | UTF-8, duplicate, EOF, unknown-field checks | Replace recursive duplicate walk; add all canonical limits/order/numeric rules |
| Python CRLF source | Original hash differs from normalized artifact hash; execution returns player `INVALID_OUTPUT` | Bind both domains; healthy CRLF revision executes; stale identity is system failure |
| Runtime budgets | Flat fields and lane-specific hidden limits | One signed per-method plus cumulative-Match vector; separate preflight vector |
| Exact toolchain identity | Coarse labels/versions and floating CI/container inputs | Digest-addressed executable/image/toolchain/sysroot/flags/settings or uncertified |
| Evidence graph | Strong closed reachable graph and trusted signature verifier; production producers empty | Add source/normalization/manifest/executable nodes, canonical graph order, DAG/cardinality checks |

Targeted verification performed during research:

- Permanent seven-gap audit: all Phase-257 repairs passed; deep JSON remained `threw:RangeError`; historical boundary remained Phase-259-owned.
- Runtime-service semantic receipt and v1.16 golden focused tests: 2 files, 4 selected tests passed.
- Go runtime-service receipt/transport focused tests passed.
- Python CRLF probe proved different original/normalized hashes and reproduced an `INVALID_OUTPUT` call result.
- Local tool inventory: Node 26.0.0, pnpm 11.1.2, TypeScript 6.0.3, Python 3.9.6, rustc 1.95.0 commit `59807616e`, Zig 0.16.0, Wasmtime 45.0.0 commit `377cd917a`, Go 1.26.3. These are observations, not approved deployment pins.

## Current Architecture and Reusable Seams

### Preserve and extend

1. **Phase-257 kernel/driver** — `KernelSystemFailureResume` and the driver’s system-first classification already ensure unchanged gameplay state. Keep the engine as the only player-consequence authority.
2. **Semantic-integrity result model** — the stable, bounded issue vocabulary, canonical issue ordering, bounded paths, and privacy-safe metadata in spec/Go are suitable for canonical-JSON errors too.
3. **Runtime-service v1.16 receipt** — request/Match/tuple/authority/wire/final-state/outcome bindings and Go transaction recheck are the migration template.
4. **Go strict decode seam** — `decodeStrictJSONUseNumber` and response byte retention are the right call sites, although the recursive duplicate walker must be replaced.
5. **Runtime evidence attestation** — domain-separated length framing, exact shapes, digest checks, byte closure, reachability, trusted-producer selection, and signatures should be extended rather than rewritten.
6. **Go retry and persistence transactions** — attempt failure is separate from completion; retries are bounded; successful completion and receipt persistence are transactional.

### Replace or version

1. Recursive `JsonValueSchema`, recursive `isJsonValue`, recursive Go duplicate walking, and recursive `stableStringify` helpers.
2. Raw `JSON.parse`, `json.loads`, and adapter `JSON.parse(stdout)` as the first operation on untrusted bytes.
3. `RuntimeResult` failure values that can contain both a player violation and a system failure.
4. Flat `StrategyRuntimeLimits` as the complete runtime budget contract.
5. Single-domain `sourceHash`/`sourceBytes` artifact identity.
6. Coarse `ExecutableLaneIdentity` labels that omit executable/image digest, target/ABI, structured flags, sysroot/stdlib, containment settings, and budget profile.
7. Host-JSON wire hashes in the new current receipt. Historical v1.16 retains them unchanged.

## Canonical JSON Profile

### Prescriptive module boundary

Create a spec-owned canonical JSON package surface with four distinct operations:

1. `scanCanonicalJson(bytes, limits, ownershipContext)` — iterative raw-byte tokenizer/state machine; validates UTF-8/scalars, grammar, duplicate keys, number grammar/range, ordering when canonical bytes are required, and every limit without materializing the tree.
2. `parseCanonicalJson(bytes, limits, ownershipContext)` — runs the scanner, then materializes only the already-bounded value; returns a typed result rather than throwing.
3. `encodeCanonicalJson(value, limits)` — iterative serializer with UTF-8-byte key ordering, scalar validation, `-0` normalization, and the specified shortest-round-trip number algorithm.
4. `hashCanonicalJson(domain, value|bytes)` — one domain registry plus length-framed SHA-256; never hashes ambient host serialization.

The scanner must track byte offset, depth, node count, current container entry count, decoded string byte count, object key bytes, and an explicit stack. Duplicate rejection occurs while scanning a key, before creating a host object. JS lone surrogates must be rejected explicitly because `TextEncoder` otherwise replaces them with U+FFFD. Strings retain their exact normalization form. [VERIFIED: D-01 through D-04; current TextEncoder/host behavior]

### Limits to calibrate and freeze in Plan 01

| Limit | Existing evidence | Initial candidate for executable calibration |
|---|---|---|
| Envelope bytes | HTTP and Go response caps are 8 MiB | 8 MiB global envelope ceiling |
| Depth | Valid committed contracts are shallow; depth 3,000 overflows | 64 |
| Nodes | No current global bound | 262,144 |
| String bytes | WASM artifact is 4 MiB, base64 expands to about 5.34 MiB | 6 MiB global; lower field caps everywhere else |
| Array entries | No current global bound | 65,536 |
| Object entries | No current global bound | 65,536 |

These are calibration candidates, not frozen policy. Plan 01 must scan every committed current artifact/fixture, run boundary ±1 and hostile allocation probes, record peak behavior, and freeze one versioned profile before implementation plans proceed. Existing lower caps remain authoritative candidates: source 64 KiB, source artifact 256 KiB, WASM artifact 4 MiB, StrategyMemory 32 KiB, SoldierMemory 2 KiB, objective 1 KiB, invocation output 256 KiB, stderr 64 KiB. Byte limits must state whether they apply to raw UTF-8, decoded string bytes, canonical encoded payload, or transport framing.

### Number and ordering vectors

The shared vector artifact must cover at least: ±0, ±(2^53−1), unsafe integers, smallest/largest finite binary64, subnormals, exponent thresholds, trailing zeros, exponent sign/zero spelling, NaN/infinities at host API boundaries, escaped/unescaped scalar equivalence, non-BMP keys, mixed ASCII case, combining forms, U+2028/U+2029, invalid UTF-8, overlong encodings, lone surrogates, duplicates including escaped-equivalent keys, and limits at N−1/N/N+1. JS `localeCompare`, Go default HTML escaping, Python default spacing/ASCII escaping, and host float formatters are not canonical implementations.

## Failure and Envelope Ownership

Use an unambiguous discriminated result at every boundary:

```ts
type InvocationResult<T> =
  | { kind: "success"; value: T; trace: InvocationTrace }
  | { kind: "player_violation"; violation: PlayerViolation; trace: InvocationTrace }
  | { kind: "system_failure"; failure: SystemFailure; trace: InvocationTrace }
```

No branch may contain fields from another classification. Exceptions are caught at the owning boundary and converted once. The engine receives this union and is the only layer that emits `RUNTIME_VIOLATION` or applies the v1.4 consequence.

The adapter, not Strategy code, constructs the authenticated outer response. The request binds invocation ID, kernel request ID, method, semantic tuple, runtime ABI, revision/artifact identity, exact budget profile/hash, input hash, and retry identity. The outer response repeats/binds those claims and contains either canonical payload bytes/digest, player failure, or system failure. Strategy-owned stdout is payload material; it must never be trusted to authenticate its own transport envelope. This is particularly important for WASM, where the guest currently writes the full JSON envelope.

Ownership classification must be staged:

| Failure | Owner/result |
|---|---|
| Missing/truncated/invalid UTF-8 outer frame, wrong invocation binding, failed authentication, adapter/host/runtime crash | System failure |
| Canonically decoded Strategy payload has duplicate/noncanonical/schema/legality failure | Player violation |
| Proven Strategy exception/trap/exhaustion inside healthy measured invocation | Player violation |
| Ambiguous trap, unavailable meter, host overload, stale artifact, runtime/toolchain mismatch | System failure |
| Invalid source during submission/preflight | Submission violation, outside Match |
| Preflight infrastructure unavailable/fails | System failure, outside Match |

For a player violation, parsing occurs into temporary response/memory values. The kernel commits none of them. Add direct tests with a valid memory prefix plus invalid trailing output, partial nested memory, oversized memory, and illegal Action to prove prior StrategyMemory/SoldierMemory is byte-equivalent and only the canonical violation event/consequence occurs.

## Budget Contract

Replace the flat limits object with versioned structures for `selectActivations`, `soldierBrain`, cumulative Match, and preflight. Each vector names units and measurement boundaries for:

- wall time, including/excluding startup explicitly;
- compute/fuel counter, source of measurement, granularity, and overflow behavior;
- memory ceiling and whether it is guest linear memory, heap, RSS, or a stronger containing process/cgroup bound;
- stdout/payload/stderr bytes separately;
- process/thread/child count;
- capability allowlist and environment/filesystem/network/shell policy;
- cancellation/termination deadline and accounting evidence.

Current values are inconsistent: spec/JS output is 256 KiB while Go sends 32 KiB; JS exposes 50 ms, 500 ms, and 1,000 ms layers; worker memory is 16 MiB old + 8 MiB young + 4 MiB stack; WASM hardcodes 10,000,000 fuel, 64 MiB memory, and 1 MiB stack; Python has no equivalent compute or memory meter. Phase 258 must make this mismatch explicit. A lane that cannot report and prove every required meter remains uncertified even if its documentation says counted eligible. Production trusted evidence remains empty until Phase 259.

Preflight budgets must be separate typed profiles. Existing scattered subprocess timeouts/caps are useful calibration inputs, not the Match budget. Request signing must cover both per-invocation and cumulative budget profiles. The runtime returns measured usage deltas; the engine/service ledger rejects impossible, missing, decreasing, or over-limit accounting as system failure unless Strategy causation is proven.

## Source, Artifact, Runtime, and Toolchain Identity

### Source domains

The revision model needs immutable original UTF-8 bytes/hash plus a derivative record:

- original source domain/version, byte count, hash;
- line-ending facts (`none`, `lf`, `crlf`, `cr`, `mixed`), counts, terminal-newline fact;
- normalization policy ID/version;
- normalized bytes/hash/byte count;
- artifact bytes/hash and manifest hash binding both source domains;
- provider/ABI/policy identity.

The current Python builder converts CRLF/CR to LF but records the original validation hash as `sourceHash`. A direct CRLF probe produced different hashes and then a player `INVALID_OUTPUT`. Under the new contract the normalized artifact executes against its normalized identity while the immutable revision remains the original identity. A stale or mismatched stored artifact is a system failure during Match execution, not a player penalty.

The web save path currently calls a generic `.trim()` helper on Strategy source. For newly created identity-v2 revisions, preserve the exact submitted source string/UTF-8 bytes and validate emptiness without trimming away meaningful bytes. Existing revisions cannot recover pre-trim upload bytes; treat their persisted source bytes as the immutable legacy-original domain and never rewrite them.

### Executable identity

Extend lane identity with immutable digests and behavior settings: runtime/compiler executable or container image digest, reported version, target triple/ABI, structured compiler/linker flags, adapter source/build digest, stdlib/sysroot/package-lock inputs, containment policy/settings, canonical budget profile hash, canonical JSON profile, normalization policy, and host/guest ABI settings. Keep semantic tuple versioning separate: rebuilding an executable invalidates evidence without pretending the rules changed.

Current CI uses `ubuntu-latest`, Rust `stable`, Wasmtime `latest`, Node major 24, unpinned action tags, and floating `node:24-alpine`. Those may remain developer discovery lanes but cannot identify counted evidence. Do not substitute the observed local versions as production pins; choose reviewed immutable digests and prove them in the managed pipeline.

## Evidence Graph and Receipt Migration

`runtime-evidence-attestation.ts` is the strongest reusable component. Extend its graph node kinds to include original source, normalized source, normalization policy, artifact manifest, runtime executable/image, compiler executable, sysroot/stdlib, adapter build, budget profile, canonical JSON profile, and containment settings/results. Consolidate duplicate framing/hash helpers behind one reviewed domain registry.

The current graph proves exact supplied bytes and root reachability but does not reject a reachable multi-node cycle or enforce expected edge cardinality/path shape. The successor must require deterministic node/edge ordering, acyclicity, unique required bindings, and exact cardinalities for the selected evidence schema. Keep production trusted producers empty; Phase 259 adds a reviewed executable producer.

Canonical JSON changes require an atomic current-contract migration similar to Phase-257 Plan 19:

1. retain immutable v1.16 request/response golden, receipt verifier, and persisted receipt records under original insertion-order wire semantics;
2. mint successor runtime ABI, runtime-service contract, semantic receipt, canonical JSON profile, and Go/TS golden together;
3. migrate new writes only; never rewrite migration-0017 historical JSONB/hash pairs;
4. switch engine/service/Go callers, artifact manifests, monitor allowlists, and generated contracts in one compatibility-gated commit;
5. preserve historical read/verification dispatch by receipt version.

## Recommended 14-Plan Decomposition

| Plan | Wave | Deliverable | Depends on |
|---|---:|---|---|
| 258-01 | 1 | Contract freeze: executable calibration, exact JSON ceilings, number/string/order rules, stable codes, ownership matrix, budget units/boundaries, identity-domain registry, and successor-version migration map | Phase-257 final artifacts |
| 258-02 | 2 | RED canonical JSON corpus: raw-byte positive/negative vectors, ±1 limits, Unicode/numeric cases, duplicate paths, adversarial depth/allocation, and TS/Go expected results | 01 |
| 258-03 | 3 | Spec-owned iterative scanner/parser with typed bounded errors; no host object conversion before duplicate/limit checks | 02 |
| 258-04 | 3 | Iterative canonical encoder, UTF-8-byte key comparator, shortest-round-trip number encoder, domain-framed hashes, and manifest serializer | 02 |
| 258-05 | 4 | Integrate bounded JSON with `JsonValue`, memory/objective schemas and service request admission; make permanent deep audit typed and non-throwing | 03-04 |
| 258-06 | 4 | Versioned three-way invocation ABI and adapter-owned authenticated outer envelope; make mixed player/system failures unrepresentable | 01,03-04 |
| 258-07 | 5 | Engine/runtime-service ownership integration: engine-only penalty, temporary-memory commit, unchanged-state system failure, request/response identity binding | 05-06 |
| 258-08 | 5 | TypeScript runtime integration across worker/subprocess/container paths, raw payload parsing, exact output limits, and failure trace | 06-07 |
| 258-09 | 5 | Python integration plus original/normalized source identity repair, raw host boundaries, preflight/execution classification, CRLF regressions | 06-07 |
| 258-10 | 5 | Rust/Zig/WASM integration: adapter-owned envelope, raw payload codec, trap attribution, artifact/stale identity, Wasmtime settings | 06-07 |
| 258-11 | 6 | Go canonical decoder/encoder parity, signed request and budget binding, identical bounded retry request, no-mutation/rollback/persistence proof | 05-10 |
| 258-12 | 6 | Runtime and preflight budget ledgers, enforcement/capability reports, cross-lane contract parity, and fail-closed uncertified posture | 08-11 |
| 258-13 | 7 | Full source/artifact/toolchain/registry/evidence graph expansion, exact pins/digests, DAG/cardinality validation, successor receipt and immutable v1.16 dispatch | 04,09-12 |
| 258-14 | 8 | Atomic current activation plus integrated evaluator, privacy/structural guards, permanent audit update, service/Go rollback proof, docs and validation artifact | 13 |

Plans 03 and 04 may execute in parallel after the corpus is frozen. Plans 08-10 may execute in parallel after the ABI and engine/service ownership seam land. Plans 11-14 are serialized because they bind Go persistence, exact budgets, identity evidence, and the current receipt activation.

No UI phase is necessary. This phase changes internal contracts, generated artifacts, operator-safe evidence, and documentation; any public status copy should remain derived from counted evidence and can be verified with existing pages/e2e coverage. Do not build a new UI surface.

## Risks and Required Stops

1. **Canonical receipt compatibility:** Changing v1.16 wire ordering/hashes in place is forbidden. Mint a successor and preserve dispatch.
2. **Gameplay drift:** JSON/failure changes may alter only previously invalid or infrastructure-failed calls. If a valid v1.4 Action, state, event order, outcome, or Strategy observation changes, stop for approval.
3. **False equivalence:** Do not call wall timeout “compute” or JS heap “process memory.” Missing equivalent measurement keeps a lane uncertified.
4. **Allocation before limits:** A scanner that decodes the entire string/object or recursively walks after host parse does not satisfy RABI-02.
5. **Mixed ownership:** Duplicate detection must retain location/phase so outer-envelope corruption is system failure while decoded Strategy payload invalidity is player-owned.
6. **Legacy revision bytes:** Pre-trim upload bytes do not exist for old revisions. Preserve committed/persisted bytes as legacy identity; do not manufacture history.
7. **Graph closure without structure:** Reachability alone admits cycles and unintended paths. Require DAG and schema-specific bindings.
8. **Public leakage:** New traces, meter reports, toolchain paths, source bytes, artifacts, memory/objectives, stderr, host facts, and signing material remain restricted.
9. **Production promotion:** Documentation, gate names, local probes, fixture keys, and current “eligible” labels cannot create counted authority. Trusted production producers remain empty until Phase 259.

## Non-Goals

- Full four-language conformance certification or a production trusted producer (Phase 259).
- Chronicle grammar/per-activation semantic reconstruction (Phase 259).
- New gameplay rules, Cycle caps, starts, movement/facing/Backstab changes, HOLD, or arena geometries.
- New languages, package ecosystems, TinyGo promotion, durable ratings, moderation, or broad UI redesign.
- Rewriting historical v1.4 Chronicles, Phase-257 v1.16 receipts, or pre-existing revision source bytes.
- Claiming that local tool versions or floating CI labels are counted pins.

## Verification Strategy

### Focused during implementation

```bash
pnpm --filter @cowards/spec test
pnpm --filter @cowards/engine test
pnpm --filter @cowards/runtime-js test
pnpm --filter @cowards/runtime-python test
pnpm --filter @cowards/runtime-wasm-wasi test
pnpm --filter @cowards/runtime-service test
pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
```

Add a Phase-258 evaluator command that runs the canonical JSON corpus, three-way/no-mutation matrix, budget vector checks, source-normalization vectors, exact identity graph, v1.16 historical dispatch, and successor TS/Go wire golden. The permanent deep audit must return a stable typed limit result rather than `RangeError`.

### Go and persistence

```bash
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1
COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1
DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence test
pnpm go:parity
```

The DB suite must prove identical signed request/budget/pre-state across retries, no Chronicle/result/standings/memory/gameplay writes on every system failure, immutable historical v1.16 receipts, successor receipt all-or-none persistence, idempotence, and transaction rollback.

### Repository gates

```bash
pnpm strategy-artifacts:check
pnpm contract:check
pnpm contract:lint
pnpm boundary:imports
pnpm v1.37:integrity-boundaries:check
pnpm lint
pnpm typecheck
pnpm boundary:monitors
```

Update generated artifacts and monitor expectations only from the successor contract writer. Never rewrite the immutable Phase-256 baseline, Phase-257 RED/current result, v1.16 wire golden, migration-0017 evidence, or historical v1.4 material.

## Planning Readiness

Research found no user-decision blocker. The locked decisions fully determine the architecture and failure ownership. Plan 01 must freeze calibrated numeric limits/budgets before downstream plans begin; a lane that cannot meet the frozen equivalence contract is explicitly allowed to remain uncertified. The principal surprise is that the strong Phase-257 v1.16 receipt intentionally authenticates non-canonical insertion-ordered bytes, making an explicit historical/current receipt-version migration mandatory rather than a serializer swap.

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Research completed: 2026-07-13*
