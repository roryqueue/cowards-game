# Architecture Research: v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup

**Domain:** Deterministic programmable Strategy game runtime/account architecture  
**Researched:** 2026-06-14  
**Confidence:** HIGH for current repo boundaries and v1.35 integration shape; MEDIUM for exact implementation names until roadmap phases choose them.

## Executive Recommendation

v1.35 should integrate as a contract cleanup milestone on top of the existing Go-owned backend and runtime-service/provider boundary. Do not move Strategy execution, validation hosts, compiler/toolchain work, or artifact execution into web/API/Go. Instead, make account-owned Strategy Revision save, entry eligibility, sandbox-readiness labels, and package policy all consume the same provider-proof and privacy contracts that Workshop checker, TypeScript persistence competition, ladder, and runtime-service already use.

The highest-value correction is the Go TypeScript account-save drift. Today Go account save routes Python/Rust/Zig through runtime-service provider validation, while TypeScript is still locally validated and can be saved without TypeScript provider proof. Persistence competition and ladder already require TypeScript source-artifact provider proof for counted entry, and Workshop submit already requires runtime-service provider validation. v1.35 should make Go account save call runtime-service for TypeScript too, or else mark any non-proof TypeScript save as explicitly non-execution/non-entry draft storage. Prefer the first option for normal Strategy Revisions: valid account-owned revisions should be provider-proofed at save time.

The second correction is ownership and privacy around local Workshop identity and owner-debug replay. `player:workshop-local` and query-driven owner-debug links are acceptable only as local/test Workshop conveniences when server-side gates prove the requester owns the requested owner view. They must not authorize persisted account-owned behavior, private replay evidence, or public/default output. Public replay/result DTOs remain source-free, StrategyMemory-free, SoldierMemory-free, objective-free, artifact-byte-free, raw-diagnostic-free, host-path-free, env/token/DB-free, and private-runtime-free.

The third correction is claim calibration. Provider proof is not sandbox certification. TypeScript/Python source artifacts prove source/artifact identity and compatibility, not WASM isolation. Rust/Zig immutable WASM/WASI Preview 1 artifacts prove artifact-backed execution through Wasmtime/provider boundaries, not broad hostile-code sandbox certification. TinyGo remains spike-only and hidden. Package policy remains "no packages" for all production languages unless a future narrow lane proves supply-chain, deterministic-build, native-code, reproducibility, privacy, and runtime-boundary requirements.

## Standard Architecture

### System Overview

```text
+------------------------------------------------------------------+
| Web UI                                                           |
| Workshop, Account, Entry, Result, Replay, Learn                  |
| - Displays labels/evidence only                                  |
| - Never executes Strategy source/artifacts                       |
+-----------------------------+------------------------------------+
                              | HTTPS / service DTOs
+-----------------------------v------------------------------------+
| Web/API Layer                                                    |
| Next routes and service boundaries                               |
| - Transport and schema validation                                |
| - Workshop checker response normalization                        |
| - Account save request forwarding to selected Go backend         |
| - No Strategy execution or compiler ownership                    |
+-----------------------------+------------------------------------+
                              | selected Go backend client
+-----------------------------v------------------------------------+
| Go Backend                                                       |
| Normal backend owner                                             |
| - Auth/session and account-owned Strategy Revision persistence    |
| - Exhibition creation and selected competition entry gates        |
| - Match job lifecycle, completion, Chronicle handoff, scoring     |
| - Public-safe result/replay/evidence DTOs                        |
| - Calls runtime-service for provider validation/execution         |
| - Does not execute Strategy code                                 |
+--------------+--------------------------------------+------------+
               |                                      |
               | runtime-service HTTP                 | PostgreSQL
+--------------v---------------------+     +----------v-----------+
| Strategy Execution Service /        |     | Persistence          |
| Runtime Broker / Providers          |     | - Users/strategies   |
| - Provider validation/build/proof    |     | - immutable revisions|
| - TypeScript/Python source artifacts |     | - jobs/matches       |
| - Rust/Zig WASM/WASI artifacts       |     | - Chronicles/results |
| - Runtime execution through adapters |     | - governance events  |
| - Redacted diagnostics               |     +----------------------+
+--------------+---------------------+
               | schema-validated StrategyRuntime calls
+--------------v---------------------+
| Pure Engine + Chronicle             |
| - Deterministic rules only           |
| - Serializable state                 |
| - No DB/network/time/random/filesystem|
| - Public/private replay projection   |
+------------------------------------+
```

## Current Boundaries

| Boundary | Current Owner | v1.35 Rule |
| --- | --- | --- |
| Engine rules | `packages/engine` and spec contracts | Preserve pure, deterministic, serializable engine. No v1.35 rule changes. |
| Strategy validation/build/proof | runtime-service / provider packages | Keep hostile validation, transpile/compile, artifact generation, and proof here. |
| Strategy execution | runtime-service / Runtime Broker / provider-selected adapters | No execution in web/API/Go. Go only invokes runtime-service contracts. |
| Normal backend orchestration | Go backend | Preserve Go ownership for account writes, entry gates, Match jobs, completion, scoring, public evidence. |
| Workshop checker UI | web/API plus runtime-service provider calls | May normalize public-safe diagnostics; must not become an execution boundary. |
| Account-owned Strategy Revisions | Go backend persistence-facing API | Require provider proof for valid/execution-eligible revisions, especially TypeScript. |
| Competition and ladder entry | Go selected routes plus TypeScript persistence parity paths | Entry must fail closed on missing/stale/mismatched provider proof. |
| Owner-debug/private replay | server-authorized replay options only | Local query params cannot authorize private output by themselves. |
| Public/default output | service/Go/web projections | Must stay redacted by default. |
| Package/dependency policy | provider registry and runtime validators | Keep `package.mode = "none"` and no host imports/packages for all production lanes. |

## Affected Components

| Component | Current Role | v1.35 Integration Work |
| --- | --- | --- |
| `apps/go-backend/live_backend.go` | Account save, exhibition creation, entry eligibility, runtime metadata projection | Route TypeScript account save through runtime-service provider validation; require TypeScript provider proof for Go counted eligibility; decide explicit behavior for invalid/non-proof saves. |
| `apps/go-backend/runtime_service_client.go` | Go client for runtime-service execution and validation | Extend `validateStrategy` to accept TypeScript and schema-check TypeScript provider metadata/source artifact identity. Redact transport/contract failures before public API responses. |
| `apps/web/lib/account-revision-write-boundary.ts` | Web account save boundary to selected Go backend | Keep as transport/auth boundary only; do not add local proof logic or Strategy execution. |
| `apps/web/app/api/workshop/validate/route.ts` | v1.34 Workshop checker contract | Use as proof/diagnostic shape reference; do not let checker readiness substitute for submit/save/entry gates. |
| `packages/persistence/src/workshop.ts` | Workshop submit/save artifact-proof enforcement | Treat as the strict reference for all four provider-proof paths. |
| `packages/persistence/src/competition.ts` and `packages/persistence/src/ladder.ts` | TypeScript persistence counted-entry gates | Treat TypeScript source-artifact proof checks as the semantic reference for Go parity. |
| `packages/spec/src/runtime.ts` | Supported-language/provider registry and runtime adapter registry | Add or tighten sandbox-readiness/package-policy labels without changing execution ownership. |
| `packages/spec/src/workshop-checker.ts` | Public checker envelope and privacy exclusions | Reuse diagnostic/privacy categories for account/provider-proof and package-policy failures where useful. |
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | Owner-debug enablement and requester identity gate | Replace local-only requester assumptions for persisted/private replay paths with server-authenticated participant checks. |
| `apps/web/app/workshop/workshop-client-state.ts` | Local Workshop replay owner links using `player:workshop-local` | Quarantine to local Workshop test summaries only; never authorize account-owned/private persisted behavior. |
| `scripts/check-boundary-monitors.ts` | Active drift gates | Add v1.35 monitors for TypeScript provider proof, account ownership, sandbox labels, package policy, TinyGo hiding, and privacy leakage. |

## Data Flow

### Workshop Validate Source

```text
Workshop editor
  -> /api/workshop/validate
  -> runtime-service /validate-strategy
  -> provider validation/build/proof
  -> web-normalized workshop-checker-v1.34 envelope
  -> UI diagnostic state
```

This is a preflight UX flow. It may show readiness but must not create eligibility by itself. Public checker output excludes raw diagnostics, source, artifact bytes, provider signing proofs, host paths, env values, package paths, tokens, DB details, StrategyMemory, SoldierMemory, objective payloads, and private runtime internals.

### Account Save

```text
Workshop or Account save
  -> /api/account/revisions/save
  -> selected Go backend createStrategyRevision
  -> runtime-service /validate-strategy for TypeScript/Python/Rust/Zig
  -> provider proof bound to source hash/bytes and artifact hash/bytes
  -> Go schema/proof gate
  -> immutable account-owned Strategy Revision row
```

Recommended v1.35 behavior: a saved Strategy Revision that is `valid` and entry-capable must have current provider proof. Runtime-service unavailable should fail closed for execution-eligible saves. If the roadmap chooses draft storage, it should be a clearly labeled non-execution state with counted/non-counted entry blocked, no owner-debug expansion, and no misleading "ready" label.

### Counted Entry and Exhibition Creation

```text
Entry request
  -> Go loadOwnedEntrants / persistence entry path
  -> ownership check
  -> revision validation.valid check
  -> provider-proof gate
  -> package/capability gate
  -> immutable entrant snapshot
  -> Match jobs
```

Counted entry should require provider proof for all four production languages. Non-counted exhibitions may have product-specific rules, but they still must not silently accept unsupported providers, hidden TinyGo, stale artifacts, non-`none` packages, host capabilities, or source/artifact mismatches.

### Match Execution

```text
Go job lifecycle
  -> runtime-service execute-match request
  -> provider-selected runtime implementation
  -> pure engine via schema-validated StrategyRuntime outputs
  -> Chronicle
  -> Go completion/scoring/public evidence
```

v1.35 should not change this path. It should add monitors proving Go remains the orchestrator and runtime-service remains the hostile-code boundary.

### Public Replay and Owner Debug

```text
Replay page request
  -> server replay read
  -> default public Chronicle projection
  -> optional owner-debug request
  -> server-side requester/participant authorization
  -> owner-private projection only when authorized
```

Query params such as `ownerDebug=1` and `ownerPlayerId=...` are requests, not authorization. `player:workshop-local` should be confined to local Workshop test replay convenience and must not unlock persisted account/private replay evidence.

## New or Modified Contracts

### 1. Account Revision Provider Proof Contract

Add a v1.35 account-save proof gate that mirrors the existing provider proof shape:

```text
contractVersion: strategy-language-provider-contract-v1.33
providerId: strategy-language-provider-js-ts | strategy-language-provider-python |
            strategy-language-provider-rust-wasi | strategy-language-provider-zig-wasi
sourceHash/sourceBytes: exact saved source identity
artifactHash/artifactBytes: exact generated artifact identity
proof: server-verifiable provider proof
artifact policy:
  TypeScript: sourceArtifact.format = transpiled-javascript, sandboxClaim = provenance-only
  Python: sourceArtifact.format = python-source-bundle, sandboxClaim = provenance-only
  Rust: compiledArtifact target wasm32-wasip1, preview1, stdin-stdout-json
  Zig: compiledArtifact target wasm32-wasi, preview1, stdin-stdout-json
```

Go should verify source identity, artifact identity, provider id, contract version, proof signature, ABI version, validation status, package mode, and required capabilities before marking a revision valid/entry-capable.

### 2. Revision Readiness Labels

Add one canonical label model consumed by Account, Workshop, Entry, Strategy cards, MatchSet result evidence, Replay trust copy, and Learn:

| Label | Meaning | Allowed Public Claim |
| --- | --- | --- |
| `provider-proof-valid` | Source/artifact/provider proof matches current contract | Eligible only if language registry and entry policy also allow it. |
| `provenance-only` | TypeScript/Python source artifact proof | Identity/provenance evidence, not WASM isolation. |
| `immutable-wasm-wasi-artifact` | Rust/Zig artifact-backed provider proof | Immutable Preview 1 artifact path, not broad sandbox certification. |
| `readiness-evidence-only` | Abuse/sandbox candidate evidence exists | Not production sandbox certification. |
| `spike-only-hidden` | TinyGo and future candidates | No production UI/entry/result/replay exposure. |
| `non-execution-draft` | Optional future draft state only | Cannot enter Match/MatchSet; no readiness claim. |

### 3. Sandbox-Readiness Contract

Update the readiness matrix rather than promoting a sandbox. The matrix should distinguish:

| Field | Required Meaning |
| --- | --- |
| `containmentBoundary` | Current technical boundary such as runtime-service subprocess or Wasmtime CLI. |
| `hostileCodeEvidence` | Probes that passed: no fallback, forbidden capability, timeout, invalid output, oversized output, privacy. |
| `candidateLane` | Whether stronger isolation is a candidate, unavailable, spike-only, or active. |
| `productionCertification` | Must remain `none` unless a future milestone explicitly proves it. |
| `publicClaim` | Exact allowed user-facing language. |
| `developerClaim` | More detailed internal explanation, still no raw internals. |

### 4. Package Policy Contract

Keep the current production policy: `package.mode = "none"` for TypeScript, Python, Rust, Zig, and TinyGo production surfaces. v1.35 should record future-package gates:

- deterministic dependency resolution and lockfile provenance
- supply-chain trust and package allowlist
- native-code and postinstall policy
- reproducible build/toolchain metadata
- no host path/package path leakage in public diagnostics
- no package install during Match execution
- artifact compatibility keys include package policy and dependency identity
- runtime-service/provider boundary owns any package build step

### 5. Privacy Monitor Contract

Privacy monitors should scan public/default DTOs, checker responses, account save failures, result/replay pages, proof artifacts, logs used as evidence, and diagnostics for:

```text
Strategy source, source snippets, artifact bytes/base64, provider signing proof,
StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid,
raw compiler/runtime diagnostics, stack traces, stderr, host paths,
package paths, env values, tokens, DB details, quarantine/operator/recovery payloads,
private runtime internals
```

## Proof-Gate Architecture

v1.35 should add gates in this order:

1. **Schema gate:** Every runtime-service validation response is decoded with expected kind/sourceFormat/version fields and bounded response bytes.
2. **Identity gate:** `sourceHash` and `sourceBytes` must match the submitted source exactly.
3. **Artifact gate:** Required source or compiled artifact must be present, hash-valid, byte-count-valid, ABI-valid, and bound to the source.
4. **Provider proof gate:** Provider id, contract version, source identity, artifact identity, and proof signature must match.
5. **Eligibility gate:** Language/provider registry, package mode, required capabilities, validation status, runtime ABI, and adapter id must permit the requested use.
6. **Privacy gate:** Public/default response builders reject private keys and marker strings before returning.
7. **Claim gate:** Sandbox/package labels are derived from registry/matrix contracts and fail tests if they overclaim isolation, package support, or TinyGo support.
8. **Boundary gate:** Monitors prove no imports or code paths execute Strategy code in web/API/Go.

## Recommended Build Order

### Phase 1: Inventory and Contract Lock

Inventory account save, account-owned revision summaries, owner-debug/private replay, Workshop aliases, Go-owned entry, provider-proof, sandbox label, package policy, and privacy monitor surfaces. Produce explicit fix/remove/defer decisions for each. This phase should update no behavior except possibly adding characterization tests.

### Phase 2: Go Account Save Provider Proof Parity

Extend Go runtime-service validation to TypeScript and require provider-grade proof for valid account-owned TypeScript revisions. Align Go account-save failure responses with public-safe checker categories. Add tests for missing runtime-service, invalid provider proof, stale source/artifact identity, malformed provider response, non-`none` package mode, and no fallback.

### Phase 3: Entry Eligibility and Revision Readiness Unification

Make Go exhibition/counted entry use the same provider-proof semantics already present in TypeScript persistence competition and ladder paths. Add revision readiness labels that distinguish `valid for entry`, `invalid`, `runtime unavailable`, `non-execution draft` if chosen, and `provider proof missing`. Ensure public Account/Strategy/Entry surfaces use labels from registry/proof state, not local language assumptions.

### Phase 4: Auth, Local Trust, Owner-Debug, and Compatibility Alias Cleanup

Quarantine `player:workshop-local` to local Workshop test replay only. Replace private replay authorization with server-side signed-in owner/participant checks for persisted Matches. Decide old Workshop API aliases as one of: remove, hidden compatibility shim with deprecation tests, or migrate callers. Preferred: remove unused aliases; keep only tested shims if current flows still depend on them.

### Phase 5: Sandbox-Readiness and Package Policy Contracts

Update spec/runtime labels, readiness matrix, Learn/evidence copy, and diagnostics so every lane states exactly what it proves. Keep TypeScript/Python provenance-only, Rust/Zig Preview 1 immutable artifact-backed, TinyGo spike-only hidden, and package mode none. Add future package-support requirements without enabling package ecosystems.

### Phase 6: Privacy, Boundary Monitors, and Service-Backed Proof

Add monitors and proof for corrected account/provider-proof behavior, entry gates, sandbox/package labels, TinyGo absence, no Strategy execution in web/API/Go, and public/default privacy. Include one service-backed proof that saves TypeScript/Python/Rust/Zig account revisions through provider validation, attempts entry, opens result/replay evidence where feasible, and scans for private markers.

## Anti-Patterns

### Local Validation as Eligibility

**What goes wrong:** Go or web/API accepts local TypeScript validation as equivalent to runtime-service provider proof.  
**Consequence:** Account revisions can appear ready while counted entry later rejects them, or worse, entry accepts weaker proof than persistence lanes.  
**Instead:** Valid/execution-eligible account revisions require provider proof at save or explicit non-execution draft labeling.

### Query Params as Owner Authorization

**What goes wrong:** `ownerDebug=1&ownerPlayerId=...` is treated as permission.  
**Consequence:** Private replay evidence can leak outside the owner boundary.  
**Instead:** Query params request owner view; server-side signed-in participant authorization decides whether owner projection is returned.

### Sandbox Claim Inflation

**What goes wrong:** Provider proof, subprocess isolation, or WASM/WASI artifact backing is described as production sandbox certification.  
**Consequence:** Product trust copy overpromises security and hides the need for future isolation work.  
**Instead:** Use explicit labels: provenance-only, immutable artifact-backed, readiness evidence only, production certification none.

### Package Support by Accident

**What goes wrong:** A runtime lane permits imports/dependencies because a toolchain can compile them locally.  
**Consequence:** Nondeterminism, native code, host-path leaks, supply-chain risk, and replay incompatibility enter through diagnostics or artifacts.  
**Instead:** Keep `package.mode = "none"` and fail diagnostics publicly until a future package milestone proves the full policy.

### Public Evidence from Internal Diagnostics

**What goes wrong:** Runtime-service failure code/message, compiler stderr, stack traces, provider proofs, or artifact metadata are passed through directly.  
**Consequence:** Source, host paths, package paths, tokens, DB details, or private runtime internals leak.  
**Instead:** Normalize into public diagnostic categories and run deny-list scans before public/default output.

## Scaling Considerations

| Scale | Architecture Adjustment |
| --- | --- |
| Local/early beta | Keep monorepo, Go backend, runtime-service, PostgreSQL, and scripts. Focus on fail-closed contracts and proof evidence. |
| Larger public beta | Separate runtime-service capacity per provider/toolchain; add queued validation/build jobs for expensive Rust/Zig checks; cache by provider/source/artifact identity. |
| High-volume competition | Split validation/build from Match execution, store artifacts in object storage, add provider-specific worker pools, and promote stronger sandbox/deployment proof before broad hostile-code exposure. |

First bottleneck is likely provider validation/build latency and toolchain availability, especially Rust/Zig. Second bottleneck is runtime-service execution capacity during MatchSet spikes. Neither justifies moving code execution into Go or web/API.

## Sources

- `.planning/PROJECT.md` - v1.35 goal, hard boundaries, current runtime/account state.
- `.planning/STATE.md` - active v1.35 boundary notes and v1.34 resume context.
- `.planning/MILESTONES.md` - v1.14-v1.34 ownership and runtime decisions.
- `.planning/artifacts/v1.35-v1.36-milestone-prompts.md` - explicit v1.35 scope.
- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - account-save TypeScript provider-proof drift and path inventory.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - public checker contract and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-proof.md` - service-backed four-language checker proof.
- `.planning/artifacts/v1.32-language-surface-inventory.md` - provider registry/product surface inventory.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - four-language conformance and privacy matrix.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - readiness evidence only, no production sandbox certification.
- `CowardsGameSpec_Full_Consolidated_v1.md` - canonical game/runtime/privacy constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - pure engine, runtime isolation, persistence, replay, and test architecture.
- Current code inspected: `apps/go-backend/live_backend.go`, `apps/go-backend/runtime_service_client.go`, `apps/web/lib/account-revision-write-boundary.ts`, `apps/web/app/matches/[matchId]/replay/owner-debug.ts`, `apps/web/app/workshop/workshop-client-state.ts`, `packages/spec/src/runtime.ts`, `packages/spec/src/workshop-checker.ts`, `packages/persistence/src/workshop.ts`, `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`.

---
*Architecture research for: Coward's Game v1.35 runtime/account/provider-proof cleanup*  
*Researched: 2026-06-14*
