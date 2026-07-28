# Technology Stack

**Project:** Coward's Game v1.37 Rules Integrity and Strategy Evaluation Foundations
**Researched:** 2026-07-12
**Scope:** Minimal stack changes for the approved integrity foundation; no experimental rule program
**Confidence:** HIGH for repository-local versions, boundaries, and recommendations

## Executive Recommendation

Do not add a framework or replace the existing TypeScript/Go/runtime-service architecture. v1.37 is primarily a contract, authority, validation, and executable-proof milestone. The safest stack is the stack already shipping Coward's Game, with one canonical transition package boundary, stricter Zod-backed semantic validators, iterative canonical-JSON utilities, versioned trace fixtures, and repo-local proof scripts.

The core implementation should remain TypeScript because `@cowards/spec`, `@cowards/engine`, and `@cowards/replay` already own the relevant types and transitions. Go should continue to own normal orchestration and persistence-facing behavior while consuming generated/versioned contracts. TypeScript, Python, Rust, and Zig should continue to execute only behind runtime-service/provider boundaries. Cross-language conformance should compare data artifacts, not require four independent game engines.

The milestone should pin exact runtime and toolchain identities wherever counted evidence is created. The current CI uses floating Rust `stable` and Wasmtime `latest`; those are acceptable for discovery but not for counted conformance identity. Record resolved versions and artifact hashes now, then pin the approved exact versions in CI and evidence manifests during implementation.

No new npm dependency is recommended. In particular, do not introduce a second schema library, JSON canonicalization package, replay/event-store framework, property-testing framework, workflow engine, or language-specific Match implementation.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | `24` in CI; persist exact resolved patch in evidence | Canonical TypeScript execution and proof host | Existing supported CI/runtime family; exact patch identity must be captured for counted proof. |
| pnpm workspace | `pnpm@11.1.2` | Monorepo orchestration and deterministic proof commands | Already pinned in the root manifest and lockfile. |
| TypeScript | `6.0.3` resolved | Canonical rules contracts, transition kernel, validators, trace corpus, proof tooling | Existing authority language for spec/engine/replay; minimizes drift and migration risk. |
| `@cowards/spec` | workspace `0.1.0` | Canonical ownership/version tuple, JSON limits, semantic schemas, runtime envelopes | Existing shared contract authority. Add versioned contracts here rather than a parallel schema package. |
| `@cowards/engine` | workspace `0.1.0` | One canonical transition kernel | Refactor current transitions into one driver consumed by Match execution and Chronicle recording. |
| `@cowards/replay` | workspace `0.1.0` | Chronicle recording, version-strict grammar, reconstruction | Convert the builder from a second Match loop into a transition recorder/reconstructor. |
| `apps/runtime-service` | workspace `0.1.0` | Hostile-code boundary and four-language conformance coordinator | Keep Strategy execution outside web/API/Go; transport failure classes without deciding gameplay. |
| Go backend | Go `1.25.0`; `pgx/v5 v5.9.2` | Orchestration, persistence, Set scheduling, compatibility rejection | Existing backend owner; consume generated tuple/trace contracts and preserve rollback semantics. |

### Runtime and Language Lanes

| Technology | Existing identity | Purpose | v1.37 recommendation |
|------------|-------------------|---------|----------------------|
| TypeScript Strategy lane | TypeScript `6.0.3`; Node `24`; worker-thread adapter currently counted but evidence-scoped | Source-language Strategy execution | Fail closed for counted scheduling until current containment and full conformance artifacts bind exact adapter, Node, TypeScript, policy, and source/artifact identities. Do not attempt to make regex filtering a production sandbox. |
| Python Strategy lane | Contract currently reports Python `3.9`; subprocess adapter | Source-language Strategy execution | Preserve the adapter, but bind original bytes, normalized LF bytes, source-bundle hash, interpreter executable/version, policy, and adapter version distinctly. |
| Rust Strategy lane | CI `rust-toolchain stable`; target `wasm32-wasip1` | Immutable WASM/WASI Preview 1 artifacts | Resolve and pin an exact Rust compiler/toolchain for evidence. Preserve stdin/stdout JSON ABI; no direct-export or Component Model migration. |
| Zig Strategy lane | Zig `0.16.0`; target currently `wasm32-wasi` | Immutable WASM/WASI Preview 1 artifacts | Keep `0.16.0`, record exact binary identity, and preserve the current no-std/helper and import-audit path. |
| Wasmtime | CI currently `latest` | Rust/Zig WASI host | Replace floating evidence identity with an exact resolved version/digest before a lane can count. Keep the existing subprocess boundary. |

### Database and Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | `18` in service E2E CI | Match/Chronicle/Set/version-tuple persistence and rollback proof | Existing canonical store; extend schemas/migrations only where tuple or conformance identities must persist. |
| Redis | `8` in service E2E CI | Existing job/topology support | Reuse unchanged; it is not a rules authority. |
| Docker Compose | existing repository topology | Service-backed execution and rollback proof | Existing repeatable local integration path. |
| Git + SHA-256 manifests | repository-native | Bind source bytes, normalized bytes, artifacts, contracts, toolchains, runtimes, corpus, and evidence | Already used throughout project evidence; extend the manifest model rather than adding an artifact platform. |

### Testing and Verification

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Vitest | `4.1.6` resolved | Unit, semantic, differential, reconstruction, mutation, and conformance tests | Primary TypeScript test runner for kernel/spec/replay/runtime-service. |
| Zod | `4.4.3` resolved | Shape validation and typed contract parsing | Retain for structural schemas; add explicit semantic refinement functions for cross-record invariants. |
| Playwright | `1.60.0` resolved | Service-backed and public privacy/boundary proof | Final proof of execution, persistence, replay, fairness, rollback, and public-safe output. |
| Go `testing` | Go `1.25.0` | Generated-contract parity, compatibility rejection, Set scheduling, persistence/rollback | Keep Go checks fixture-driven and derived from canonical TypeScript artifacts. |
| Existing proof/evaluator scripts | `tsx 4.22.0` resolved | Reproducible manifests and drift monitors | Add v1.37 evaluators using the established `--write` / `--check` pattern. |

## Required Stack Changes

### 1. Canonical authority and compatibility contract in `@cowards/spec`

Add one versioned tuple carried by every new Match, runtime request/result, Chronicle, arena scenario, Set schedule, persisted record, and proof artifact:

```ts
type CanonicalMatchVersionTuple = {
  rules: "cowards-rules-v1.4"
  engine: string
  runtimeAbi: string
  chronicle: string
  arenaCatalog: string
  setPolicy: string
}
```

The literal values beyond the preserved rules version should be chosen during requirements/design and generated from one authority. Compatibility must be table-driven and fail before execution or persistence on missing, unknown, mixed, or stale tuples. Historical v1.4 evidence keeps its original tuple/interpretation and is never rewritten.

### 2. One transition kernel in `@cowards/engine`

Refactor the existing Phase/Round/Contraction flow into a deterministic transition iterator/driver. Each step should accept validated canonical state plus an explicit input and return validated next state, canonical events, runtime requests, and terminal/failure status. `runMatch` consumes it; Chronicle records it; replay reconstructs it. Do not create an event-sourcing framework or move the kernel into replay.

The kernel boundary should make these checks unavoidable after every relevant transition:

- semantic state invariants;
- immediate outcome after status changes;
- selected-slot status/terminal-reason agreement;
- immutable/cloned canonical constants;
- canonical event emission and ordering;
- no gameplay mutation on system failure.

### 3. Semantic validation layered over Zod

Keep Zod for shape parsing, then run explicit iterative semantic validators for:

- arena bounds, terrain, starting occupancy, and authority/version identity;
- unique Soldier identities and ownership;
- unique occupancy and in-bounds positions;
- ACTIVE/STONE/FALLEN status-position consistency;
- Phase/Round/activation/initiative consistency;
- selected-slot lifecycle and terminal reasons;
- initial/intermediate/final outcome consistency;
- Chronicle event subject, version, slot, Cycle, and reconstructed-state agreement.

These validators should return typed, public-safe error codes. They should not leak source, memory, objectives, raw payloads, host paths, stack traces, or security internals.

### 4. Repository-owned canonical JSON preflight

Implement an iterative parser/preflight utility in `@cowards/spec` or a narrowly scoped workspace module owned by it. The contract must define byte encoding, maximum bytes, maximum depth, maximum nodes/entries, strings/Unicode policy, finite-number and safe-integer rules, negative zero, object key ordering for hashing, duplicate-key handling at raw-byte parse time, and serialization behavior.

Do not rely on recursive Zod traversal for adversarial depth and do not add an off-the-shelf canonical-JSON dependency unless a phase-specific spike proves the native implementation inadequate. Raw-byte duplicate-key detection must occur before ordinary `JSON.parse` loses that evidence.

### 5. Three-way runtime result transport

Use one discriminated envelope across all adapters:

```ts
type InvocationResult<T> =
  | { kind: "success"; value: T; traceIdentity: string }
  | { kind: "playerViolation"; code: string }
  | { kind: "systemFailure"; code: string; retryability: string }
```

Only the canonical engine boundary maps a player violation to gameplay consequences. A system failure aborts/degrades according to service policy with zero gameplay or memory mutation. Python and WASM/WASI normalizers must stop converting infrastructure failures into `THROWN_EXCEPTION` player violations.

### 6. Executable four-language conformance corpus

Store a versioned, hash-addressed corpus of canonical JSON inputs and expected full traces. Each language lane executes identical cases through its actual adapter. Compare:

- complete canonical state transitions and event sequence;
- StrategyMemory, SoldierMemory, and objective transport internally (never public output);
- success/player-violation/system-failure classes;
- invalid JSON/schema/semantics, oversize/depth/node/numeric boundaries;
- timeout/resource/unavailable/transport/malformed/stale-artifact cases;
- deterministic repeats and exact runtime/toolchain/adapter identity.

Counted eligibility should consume a fresh signed/hash-bound conformance artifact, not a list of declared gate names.

### 7. Chronicle reconstruction and compatibility fixtures

Use `@cowards/replay` to maintain per-`activationId` slot grammar state, restrict event literals by Chronicle/rules version, and compare reconstructed transition hashes to engine execution. Freeze representative v1.4 Chronicles/results as immutable compatibility fixtures and validate them only under original semantics.

### 8. v1.37 proof and boundary monitors

Add root scripts following the existing evaluator convention, for example:

```bash
pnpm v1.37:rules-integrity:check
pnpm v1.37:four-language-conformance:check
pnpm v1.37:boundary-monitors:check
pnpm v1.37:service-proof:strict
```

Monitors should fail on duplicate Match loops, replay-owned transition logic, adapter-owned gameplay classification, unbound/floating counted runtime identity, duplicate arena authorities, stale contiguous-Activation exports, unsupported event vocabulary, mixed tuples, private corpus leakage, and public/default exposure of prohibited data.

## Existing Components to Reuse

| Component | v1.37 use |
|-----------|-----------|
| `packages/spec/src/constants.ts` | Canonical limits and constants; clone/freeze nested values and export read-only contracts. |
| `packages/spec/src/schemas.ts` | Structural schemas plus entry points into semantic validators. |
| `packages/spec/src/runtime.ts` | Runtime registry, exact evidence identity, common ABI/failure/budget contracts, counted eligibility. |
| `packages/engine/src/match.ts` | Source behavior for the single transition driver; remove loop duplication rather than copying it. |
| `packages/engine/src/activation.ts` | Slot lifecycle repairs, order precedence, stale export removal, truthful activation state. |
| `packages/engine/src/runtime-inputs.ts` | Add initiative and authoritative `hasAdvancedThisActivation`. |
| `packages/replay/src/build.ts` | Convert from Match executor to transition recorder. |
| `packages/replay/src/grammar.ts` | Per-slot state machine. |
| `packages/replay/src/validate.ts` | Tuple/version-strict semantic and reconstruction validation. |
| `packages/runtime-js` | Existing TypeScript validation/adapter path; quarantine counted use until evidence passes. |
| `packages/runtime-python` | Existing AST/subprocess path; repair byte normalization and failure transport. |
| `packages/runtime-wasm-wasi` | Existing Rust/Zig compilation, artifact, import-audit, Wasmtime path. |
| `packages/golden` and audit reproductions | Seed full-trace conformance and regression fixtures. |
| `packages/map-configs` | Consolidate official arena authority and geometry identity. |
| `apps/go-backend` | Compatibility, scheduling fairness, persistence, idempotency, rollback, and public-safe orchestration proof. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Transition authority | TypeScript kernel in `@cowards/engine` | New Rust core or four native engines | A rewrite expands risk and makes language neutrality harder to prove; languages need equal ABI behavior, not separate rule ownership. |
| Schema validation | Zod plus explicit semantic validators | Ajv/new schema framework | Existing contracts are Zod-based; changing validators does not solve cross-record semantics by itself. |
| Canonical JSON | Small repo-owned iterative contract | New canonicalization package only | Limits and failure behavior are game ABI semantics and must be controlled/tested across all lanes. |
| Chronicle | Record kernel transitions | Dedicated event-sourcing framework | Chronicle already exists; a framework would add a second authority and migration burden. |
| Cross-language proof | Shared JSON corpus and full-trace comparison | Gate-name declarations or final-outcome comparison | Declarations and coarse outcomes miss state, memory, event, and failure drift. |
| Rust/Zig ABI | Preserve WASI Preview 1 stdin/stdout JSON | Direct exports / Component Model / WIT | Explicitly deferred and unnecessary for semantic parity. |
| Property coverage | Vitest data-driven/differential generators | Add `fast-check` immediately | Existing runner is sufficient for bounded exhaustive and deterministic generated cases; add a property library only if a later plan proves a concrete gap. |
| Toolchain policy | Exact pinned versions plus hashes | `stable` / `latest` counted evidence | Floating identities make conformance irreproducible and stale-proof detection impossible. |
| Arena authority | One catalog in existing map/spec boundary | New arena service | The problem is duplicate authority, not missing infrastructure. |

## What Not to Add or Change

- No v2 experimental rule flags, Cycle-cap variants, inward starts, facing-only MOVE, attacker-facing Backstab, hidden information, or live randomness.
- No new official arena geometry beyond authority/fairness repair.
- No Strategy execution in web/API/Go and no silent runtime fallback.
- No new languages, TinyGo promotion, package ecosystem, durable rating system, moderation platform, or UI framework.
- No direct-export, Component Model, or WIT migration.
- No new public DTO fields containing source, artifacts, memory, objectives, diagnostic payloads, host data, security details, or conformance corpus secrets.
- No reinterpretation or rewriting of persisted v1.4 Chronicles/results.

## Installation

No dependency installation is recommended.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test:fast
pnpm boundary:monitors
```

The implementation may add workspace files, generated fixtures, scripts, migrations, and CI pins, but should not add third-party packages without phase-specific evidence.

## Sources

- User-approved v1.37 milestone summary and committed/deferred scope. Confidence: HIGH.
- `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`. Current milestone and shipped architecture/boundaries. Confidence: HIGH.
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` and persisted reproduction artifacts. Confirmed authority, validation, lifecycle, runtime, Chronicle, identity, parity, and scheduling gaps. Confidence: HIGH.
- v2.0 proposal/requirements/roadmap. Source material used selectively; experimental rules and full 63-requirement/13-phase program are not activated. Confidence: HIGH.
- `CowardsGameSpec_Full_Consolidated_v1.md`, `CowardsGameSpec_CycleInterleaved_v1.4.md`, and `CowardsGame_Technical_Architecture_Spec_v1.4.md`. Preserved gameplay and architecture authority. Confidence: HIGH.
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`. Strategy evaluation prerequisites only. Confidence: HIGH.
- Root/package manifests, `pnpm-lock.yaml`, `apps/go-backend/go.mod`, and `.github/workflows/ci.yml`. Exact repository dependency versions and current floating toolchain setup. Confidence: HIGH.
- Current `packages/spec`, `packages/engine`, `packages/replay`, runtime adapters, runtime-service, map configs, Go backend, and proof scripts. Integration boundaries and minimal-change recommendation. Confidence: HIGH.
