# Phase 244: Account Revision Provider-Proof and Entry Gates - Research

**Researched:** 2026-06-14
**Domain:** Go account revision writes, runtime-service provider validation, persistence entry gates, public-safe diagnostics
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

The following constraints are copied from `.planning/phases/244-account-revision-provider-proof-and-entry-gates/244-CONTEXT.md`. [VERIFIED: codebase grep]

### Locked Decisions

## Implementation Decisions

### Account Save Readiness
- **D-01:** Execution-ready account-owned Strategy Revision saves must require runtime-service/provider validation for TypeScript, Python, Rust, and Zig. TypeScript should stop being the local/default exception where readiness or entry eligibility is claimed.
- **D-02:** Runtime-service validation unavailable, stopped, stale, malformed, oversized, mismatched, or unverifiable states must fail closed for execution-ready saves. If draft storage is retained, it must be explicitly non-execution, non-ready, and non-entry-eligible.
- **D-03:** Invalid provider validation may still persist as owner-visible draft evidence only if its validation status and labels cannot be mistaken for execution readiness. Invalid revisions must not satisfy counted or non-counted entry gates.
- **D-04:** Provider proof must bind source identity and artifact identity where applicable: TypeScript and Python source-language artifacts are provenance evidence, while Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed. This phase must not re-label TypeScript/Python as WASM-isolated.

### Entry Gate Parity
- **D-05:** Go exhibition creation, persistence competition entry, and ladder entry should converge on one provider-proof-backed eligibility model for TypeScript, Python, Rust, and Zig.
- **D-06:** Counted entry gates must require provider-grade proof matching source hash/bytes, artifact hash/bytes where applicable, provider id, provider contract version, engine compatibility, registered runtime metadata, package mode `none`, and valid validation status.
- **D-07:** Non-counted exhibition gates must still reject unsupported providers, hidden TinyGo, invalid revisions, stale/missing/mismatched artifacts or proof, incompatible runtime metadata, package mode other than `none`, required host capabilities, and silent fallback.
- **D-08:** The existing persistence competition and ladder provider-proof checks are the stricter reference semantics; Go should be brought into parity rather than creating a parallel looser readiness model.

### Public-Safe Diagnostics and Labels
- **D-09:** Account-save and entry errors should use public-safe categories such as unsupported source format, invalid Strategy Revision, runtime-service unavailable, provider proof invalid/missing/mismatched, incompatible runtime metadata, package policy violation, and hidden unsupported provider.
- **D-10:** Public/default responses must not expose raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, provider signing material, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads.
- **D-11:** Account, entry, public Strategy, result, replay, and developer evidence labels should derive readiness from provider proof and registry policy, not local language assumptions or source-format strings.

### Auto-Selected Discussion Areas
- **D-12:** Auto mode selected all meaningful Phase 244 gray areas: account-save proof behavior, non-execution draft semantics, Go/persistence entry parity, and public-safe diagnostics. Recommended defaults were selected because they match the approved v1.35 milestone intent and Phase 243 locked inventory.

### the agent's Discretion
The planner may choose the exact helper/function boundaries, DTO names, and test grouping. Prefer reusing existing runtime-service validation, provider proof match helpers, runtime registry semantics, and boundary monitor style over inventing a new proof framework.

### Deferred Ideas (OUT OF SCOPE)

- Phase 245 owns owner-debug/private replay authorization, `player:workshop-local` quarantine, account-owned source read authorization proof, and Workshop compatibility alias fate.
- Phase 246 owns sandbox-readiness and certification label contracts.
- Phase 247 owns package/dependency ecosystem policy beyond enforcing the current `none` boundary.
- Phase 248 owns final service-backed proof, expanded privacy scans, and full boundary monitor aggregation.
</user_constraints>

## Summary

Phase 244 should make Go account-save and entry gates consume the existing runtime-service provider validation path instead of creating any Go-side Strategy execution or local TypeScript exception. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/phases/244-account-revision-provider-proof-and-entry-gates/244-CONTEXT.md`, `apps/go-backend/live_backend.go`, `apps/runtime-service/src/server.ts`] Runtime-service already accepts `typescript`, `python`, `rust`, and `zig` at `/validate-strategy`, builds provider metadata, and signs source/artifact identity; the current Go client rejects TypeScript before transport, which is the main account-save parity gap. [VERIFIED: `apps/runtime-service/src/server.ts`, `apps/go-backend/runtime_service_client.go`]

The stricter reference semantics already exist in TypeScript persistence competition and ladder helpers: TypeScript and Python require `sourceArtifact` plus `providerValidation`, while Rust and Zig require `compiledArtifact` plus `providerValidation`, and all proof checks bind source hash/bytes, artifact hash/bytes, provider id, provider contract version, artifact bytes hash, and signing proof. [VERIFIED: `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`] Go currently checks Python/Rust/Zig proof for counted play but lets TypeScript counted play through on adapter metadata alone, and Go non-counted exhibition allows Python/Rust/Zig by adapter metadata without passing provenance into proof checks. [VERIFIED: `apps/go-backend/live_backend.go`]

**Primary recommendation:** centralize Go revision readiness into one provider-proof helper used by account save responses, account list semantics, counted entry, and non-counted entry; make TypeScript call runtime-service validation exactly like Python/Rust/Zig for execution-ready saves, and fail closed unless an explicit non-execution draft path is added. [VERIFIED: codebase grep]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authenticated account save transport | Frontend/API transport | Go backend | Web routes are thin transport to selected Go account revision writes; hostile validation must not run in web/API. [VERIFIED: `244-CONTEXT.md`, `apps/go-backend/live_backend.go`] |
| Provider validation/build/proof | Runtime-service / language provider | Go client validates envelope | Runtime-service owns `/validate-strategy`; Go should request validation and verify source identity/envelope before persisting readiness. [VERIFIED: `apps/runtime-service/src/server.ts`, `apps/go-backend/runtime_service_client.go`] |
| Readiness state persistence | Go backend / PostgreSQL | Spec/persistence semantics | Go inserts `runtime`, `engine_compatibility`, `validation`, `metadata`, and artifact metadata into `strategy_revisions`; persistence helpers define stricter proof semantics. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/account-revisions.ts`] |
| Counted/non-counted entry gates | Go backend and persistence services | Spec runtime registry | Go selected exhibition creation and TypeScript persistence competition/ladder gates must agree on provider proof and runtime metadata. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`] |
| Public-safe diagnostics | API/Go response layer and spec checker vocabulary | Runtime-service sanitized failure mapping | Existing checker categories and Go runtime-service redaction are the safest vocabulary source for save/entry errors. [VERIFIED: `packages/spec/src/workshop-checker.ts`, `apps/go-backend/runtime_service_client.go`] |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCT-01 | Go runtime-service validation can request and accept TypeScript provider validation using the same runtime-service/provider boundary as Workshop submit and checker paths. | Runtime-service accepts TypeScript; remove Go client pre-reject and add TypeScript success/negative client tests. [VERIFIED: `apps/runtime-service/src/server.ts`, `apps/go-backend/runtime_service_client.go`] |
| ACCT-02 | TypeScript account save through Go stores provider runtime, validation, engine compatibility, source-artifact identity, and provider-proof metadata when execution-ready or entry-eligible. | Runtime-service returns `runtime`, `validation`, `engineCompatibility`, `metadata`, `sourceHash`, and `sourceBytes`; Go insert already stores these fields. [VERIFIED: `apps/runtime-service/src/server.ts`, `apps/go-backend/live_backend.go`] |
| ACCT-03 | Account save distinguishes execution-ready, invalid, unavailable/system, and non-execution draft states. | Existing checker statuses and Go `validationStatus` are insufficient alone; add explicit readiness/draft labels in metadata or DTO. [VERIFIED: `packages/spec/src/workshop-checker.ts`, `apps/go-backend/live_backend.go`] |
| ACCT-04 | Unavailable, stale, missing, mismatched, malformed, unverifiable, oversized, or incompatible proof fails closed or saves only non-execution draft. | Go client already classifies transport, malformed, oversized, source mismatch, and incomplete success; planner should extend this to TypeScript and account-save semantics. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `apps/go-backend/runtime_service_client_test.go`] |
| ACCT-05 | Go account-save validation errors are public-safe. | Go runtime-service failure redaction exists for execution responses; account-save should normalize categories and avoid embedding raw service failure messages. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `.planning/artifacts/v1.34-workshop-checker-contract.md`] |
| ENTRY-01 | Counted Go exhibition, persistence competition, and ladder entry gates require current provider-grade proof for TypeScript, Python, Rust, and Zig. | Persistence already requires proof for all four; Go counted gate lacks TypeScript proof. [VERIFIED: `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`, `apps/go-backend/live_backend.go`] |
| ENTRY-02 | Non-counted exhibitions reject unsupported providers, hidden TinyGo, stale/missing/mismatched artifacts, incompatible metadata, non-`none` package mode, invalid owner/revision state, and silent fallback. | Go non-counted currently checks ABI/package/capabilities and adapter ids, but does not receive metadata/source identity for Python/Rust/Zig proof. [VERIFIED: `apps/go-backend/live_backend.go`] |
| ENTRY-03 | Go and persistence eligibility agree for eligible, draft, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, package-declared, unavailable-runtime, and TinyGo cases. | Parity can be tested by table fixtures that call Go helpers and TS persistence helpers with matched metadata cases. [VERIFIED: existing test layout in `apps/go-backend/main_test.go`, `packages/persistence/src/competition.test.ts`, `packages/persistence/src/ladder.test.ts`] |
| ENTRY-04 | Account, entry, public Strategy, result, replay, and developer evidence labels derive readiness from provider proof and registry policy. | Spec registry and account list semantics already expose registry/provider-derived labels; Go TypeScript semantics still say local/dev fallback. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/persistence/src/account-revisions.ts`, `apps/go-backend/live_backend.go`] |

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free. [VERIFIED: `AGENTS.md`]
- Do not put game rules in React components. [VERIFIED: `AGENTS.md`]
- Do not execute user Strategy code in web/API/Go. [VERIFIED: `AGENTS.md`]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: `AGENTS.md`]
- Do not use Node `vm` as a security boundary. [VERIFIED: `AGENTS.md`]
- Treat Strategy code as hostile and validate runtime boundaries with schemas. [VERIFIED: `AGENTS.md`]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: `AGENTS.md`]
- Strategy Revisions submitted for Match or MatchSet play are immutable. [VERIFIED: `AGENTS.md`]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: `AGENTS.md`]
- Runtime tests must cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and schema validation; worker tests distinguish strategy failure from system failure. [VERIFIED: `AGENTS.md`]

## Standard Stack

### Core
| Library / Component | Version | Purpose | Why Standard |
|---------------------|---------|---------|--------------|
| Go backend | Go module target `1.25.0`; installed Go `1.26.3` | Account save, selected exhibition creation, public-safe service errors, PostgreSQL writes | Existing selected normal backend owner for account writes and exhibitions. [VERIFIED: `apps/go-backend/go.mod`, environment probe] |
| `github.com/jackc/pgx/v5` | repo `v5.9.2`; latest observed `v5.10.0` | PostgreSQL access in Go backend | Existing Go DB driver; no package switch needed. [VERIFIED: `apps/go-backend/go.mod`, `go list -m -versions`] |
| Runtime-service `/validate-strategy` | `runtime-execution-service-v1.15`; ABI `strategy-runtime-abi-v1.14` | Provider validation/build/proof for TypeScript, Python, Rust, Zig | Existing hostile-code/provider boundary for validation and execution. [VERIFIED: `apps/runtime-service/src/server.ts`, `packages/spec/src/runtime.ts`] |
| `@cowards/spec` runtime registry | workspace package | Provider records, runtime ABI, supported language records, checker vocabulary | Source of language/provider/ABI policy and TinyGo absence. [VERIFIED: `packages/spec/src/runtime.ts`, `packages/spec/src/workshop-checker.ts`] |
| `@cowards/persistence` competition/ladder helpers | workspace package | Reference proof semantics for counted eligibility | Existing stricter TypeScript/Python/Rust/Zig proof gates. [VERIFIED: `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`] |

### Supporting
| Library / Component | Version | Purpose | When to Use |
|---------------------|---------|---------|-------------|
| Vitest | repo `^4.1.6`; latest observed `4.1.8` | TypeScript unit tests for spec, persistence, runtime-service | Use for persistence parity and runtime-service validation tests. [VERIFIED: `package.json`, npm registry] |
| Go `testing` + `httptest` | installed Go `1.26.3` | Go helper/client/account-route tests | Use for runtime client, proof helper, public-safe error, and DB-backed route tests. [VERIFIED: environment probe, `apps/go-backend/runtime_service_client_test.go`] |
| Playwright | repo/latest observed `1.60.0` | Browser proof smoke where needed | Phase 244 likely only needs service/API proof; full public replay privacy remains Phase 248. [VERIFIED: `package.json`, npm registry, `244-CONTEXT.md`] |
| Boundary monitor scripts | repo scripts | Drift monitoring for route ownership, runtime, TinyGo, privacy, and v1.35 inventory | Extend only if Phase 244 adds stable provider-proof parity monitor. [VERIFIED: `package.json`, `scripts/check-boundary-monitors.ts`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Runtime-service provider validation | Go local TypeScript validation | Rejected because phase constraints forbid Go/web/API from executing or owning hostile Strategy semantics, and TypeScript must stop being the local/default exception. [VERIFIED: `244-CONTEXT.md`, `apps/go-backend/live_backend.go`] |
| Existing persistence proof helpers copied into Go manually | A new shared cross-language proof service | Not needed for Phase 244; planner should align Go helper semantics with existing persistence reference without creating a new service boundary. [VERIFIED: `packages/persistence/src/competition.ts`, `apps/go-backend/live_backend.go`] |
| Public raw provider diagnostics | Normalized checker-style categories | Raw diagnostics and proof material are forbidden by contract; use public-safe categories. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`] |

**Installation:** no new packages are recommended for this phase. [VERIFIED: codebase inspection]

**Version verification:** npm registry checked on 2026-06-14 for `vitest` `4.1.8`, `typescript` `6.0.3`, `zod` `4.4.3`, `pg` `8.21.0`, `tsx` `4.22.4`, `@playwright/test` `1.60.0`, `turbo` `2.9.18`, and `@redocly/cli` `2.32.2`; Go module versions checked with `go list -m -versions` for `pgx/v5` and `x/crypto`. [VERIFIED: npm registry, Go module proxy]

## Architecture Patterns

### System Architecture Diagram

```text
Authenticated account save request
  -> Web save route / write boundary
  -> Go createStrategyRevision
  -> runtimeServiceClient.validateStrategy(sourceFormat, source)
  -> runtime-service /validate-strategy
  -> language provider validates/builds artifact and returns provider metadata
  -> Go verifies envelope, source hash/bytes, runtime metadata, proof readiness
  -> PostgreSQL strategy_revisions row as execution-ready OR explicit non-execution draft
  -> entry gates read row and re-check proof before MatchSet/ladder use
```

This flow keeps hostile validation/build semantics in runtime-service/provider code and keeps Go as requester, verifier, persistence owner, and gate owner. [VERIFIED: `apps/go-backend/live_backend.go`, `apps/go-backend/runtime_service_client.go`, `apps/runtime-service/src/server.ts`]

### Recommended Project Structure

```text
apps/go-backend/
├── runtime_service_client.go       # accept TS validation; harden envelope/source checks
├── live_backend.go                 # account save and entry gate callers
├── provider_readiness.go           # recommended new focused helper file, or equivalent scoped helpers
├── runtime_service_client_test.go  # client validation states
├── main_test.go                    # proof helper, semantics, privacy regression
└── orchestrator_test.go            # DB-backed exhibition/account route cases if services available

packages/persistence/src/
├── competition.test.ts             # TypeScript proof parity additions
└── ladder.test.ts                  # TypeScript proof parity additions
```

This structure keeps Go parity logic close to Go call sites and avoids moving TypeScript execution into Go. [VERIFIED: repository layout]

### Pattern 1: Provider-Proof Readiness Helper

**What:** Create one Go helper that takes runtime, validation, metadata, source hash/bytes, and intended use, then returns a readiness enum plus public-safe category. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/competition.ts`]

**When to use:** Use it after runtime-service validation on account save, in account list semantics, and in counted/non-counted entry gates. [VERIFIED: `apps/go-backend/live_backend.go`]

**Schematic example:**

```go
type revisionReadiness string

const (
  readinessExecutionReady revisionReadiness = "execution_ready"
  readinessNonExecutionDraft revisionReadiness = "non_execution_draft"
  readinessInvalid revisionReadiness = "invalid"
  readinessUnavailable revisionReadiness = "unavailable"
)

// Source: repo pattern from Go counted gate and persistence proof helpers.
func classifyRevisionReadiness(runtime, validation, metadata map[string]any, sourceHash string, sourceBytes int) (revisionReadiness, string) {
  if validationStatus(validation) != "valid" {
    return readinessInvalid, "invalid_strategy_revision"
  }
  if !runtimeProviderProofMatches(runtime, metadata, sourceHash, sourceBytes) {
    return readinessNonExecutionDraft, "provider_proof_invalid"
  }
  return readinessExecutionReady, ""
}
```

This example is intentionally schematic and does not expose Strategy source, raw diagnostics, artifact bytes, or provider proofs. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`]

### Pattern 2: Runtime-Service TypeScript Validation Parity

**What:** Remove the Go client-side `sourceFormat != python/rust/zig` rejection and allow `typescript` through the same `/validate-strategy` request path. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `apps/runtime-service/src/server.ts`]

**When to use:** Use for execution-ready TypeScript account saves and service-backed proof. [VERIFIED: `244-CONTEXT.md`]

**Required checks after response:** status kind is `strategyValidation`, source format matches request, successful response includes runtime/validation/engine/metadata/source identity, source hash/bytes match local source, and metadata contains matching TypeScript source artifact plus provider validation before readiness is claimed. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `packages/persistence/src/competition.ts`]

### Pattern 3: Public-Safe Error Normalization

**What:** Convert runtime-service failures and proof mismatch states to stable categories: `unsupported_source_format`, `invalid_strategy_revision`, `runtime_service_unavailable`, `provider_proof_missing`, `provider_proof_mismatched`, `provider_proof_invalid`, `incompatible_runtime_metadata`, `package_policy_violation`, and `hidden_unsupported_provider`. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`, `packages/spec/src/workshop-checker.ts`]

**When to use:** Use in account save and entry responses; do not pass raw service messages that may include private internals. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `apps/go-backend/live_backend.go`]

### Anti-Patterns to Avoid

- **Go-local Strategy validation as readiness:** Go string scanning currently exists for default TypeScript metadata and is not provider-grade proof. [VERIFIED: `apps/go-backend/live_backend.go`]
- **Adapter-id-only non-counted eligibility:** Non-counted still must reject stale/missing/mismatched proof, incompatible metadata, non-`none` package mode, hidden TinyGo, unsupported providers, and silent fallback. [VERIFIED: `244-CONTEXT.md`, `apps/go-backend/live_backend.go`]
- **Readiness labels from language name:** Labels must derive from provider proof and registry policy, because supported language metadata alone does not prove the row is current. [VERIFIED: `packages/persistence/src/account-revisions.ts`, `packages/spec/src/runtime.ts`]
- **Publicly exposing provider signatures or artifact bytes:** Checker/privacy contracts forbid public/default exposure of provider signing proof and artifact payloads. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`, `.planning/artifacts/v1.35-boundary-surface-inventory.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript validation/provenance | Go parser/transpiler/string scanner | Runtime-service `/validate-strategy` using `@cowards/runtime-js` provider path | Existing service emits provider metadata and source-artifact proof while keeping execution semantics outside Go. [VERIFIED: `apps/runtime-service/src/server.ts`] |
| Proof semantics | A new proof format | Existing providerValidation HMAC contract and artifact/source identity fields | Persistence and runtime-service already share provider id, contract version, source/artifact hashes, byte counts, and proof payload shape. [VERIFIED: `apps/runtime-service/src/server.ts`, `packages/persistence/src/competition.ts`] |
| Public diagnostics taxonomy | Raw runtime/compiler messages | Workshop checker diagnostic categories and Go redaction helpers | Existing contract lists public-safe categories and forbidden exclusions. [VERIFIED: `packages/spec/src/workshop-checker.ts`, `apps/go-backend/runtime_service_client.go`] |
| TinyGo policy | Hidden allowlist or source-format inference | Existing spec lookup and monitor pattern where TinyGo is absent from production source formats | TinyGo must remain spike-only/hidden in this milestone. [VERIFIED: `packages/spec/src/spec.test.ts`, `packages/spec/src/workshop-checker.test.ts`] |

**Key insight:** the hard part is not creating proof; it is refusing to treat stored language/runtime metadata as proof after source, artifact, provider contract, package policy, or registry state drifts. [VERIFIED: `.planning/REQUIREMENTS.md`, `packages/persistence/src/competition.ts`]

## Common Pitfalls

### Pitfall 1: TypeScript Success Without Source Artifact Proof
**What goes wrong:** TypeScript account save or counted entry succeeds because `runtime-js-worker-thread` is registered. [VERIFIED: `apps/go-backend/live_backend.go`]
**Why it happens:** Go counted gate lacks the TypeScript `sourceArtifactProviderValidationMatches` branch present in persistence. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/competition.ts`]
**How to avoid:** Require TypeScript `sourceArtifact` format `transpiled-javascript`, matching source hash/bytes, matching artifact hash/bytes, provider id `strategy-language-provider-js-ts`, contract `strategy-language-provider-contract-v1.33`, and valid proof. [VERIFIED: `packages/persistence/src/competition.ts`, `apps/runtime-service/src/server.ts`]
**Warning signs:** A TypeScript row with valid local validation but no `metadata.providerValidation` is entry eligible. [VERIFIED: `packages/persistence/src/account-revisions.ts`]

### Pitfall 2: Non-Counted Treated as No-Proof
**What goes wrong:** Non-counted exhibition accepts Python/Rust/Zig rows with valid adapter ids but missing or stale artifact proof. [VERIFIED: `apps/go-backend/live_backend.go`]
**Why it happens:** Go `runtimeAllowsNonCountedExhibition` currently receives only runtime metadata, not revision metadata/source identity. [VERIFIED: `apps/go-backend/live_backend.go`]
**How to avoid:** Change the non-counted helper signature to include metadata/source hash/source bytes and call the same provider-proof matcher used for counted readiness, while still returning non-counted MatchSet status. [VERIFIED: `244-CONTEXT.md`, `apps/go-backend/live_backend.go`]
**Warning signs:** A missing proof passes non-counted but fails counted for the same revision. [VERIFIED: codebase grep]

### Pitfall 3: Runtime-Service Failures Become User-Visible Internals
**What goes wrong:** Account-save 503 or entry error includes raw service failure strings, host paths, source markers, or provider proof details. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `.planning/artifacts/v1.34-workshop-checker-contract.md`]
**Why it happens:** Existing `createStrategyRevision` formats failure code and message directly into user-facing text for Python/Rust/Zig runtime-service failures. [VERIFIED: `apps/go-backend/live_backend.go`]
**How to avoid:** Map failures to stable category codes and calm public messages; keep detailed sanitized diagnostics internal/test-only. [VERIFIED: `packages/spec/src/workshop-checker.ts`, `apps/go-backend/runtime_service_client.go`]
**Warning signs:** Response body contains raw diagnostic markers, artifact bytes/base64, provider proof strings, host paths, env/token/db markers, or Strategy memory names. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-proof.md`]

### Pitfall 4: Malformed Runtime-Service Success Promotes a Draft
**What goes wrong:** An incomplete or mismatched validation success is persisted as execution-ready. [VERIFIED: `apps/go-backend/runtime_service_client.go`]
**Why it happens:** It is easy to check only `ok: true` and ignore identity/proof completeness. [VERIFIED: codebase inspection]
**How to avoid:** Keep Go client fail-closed checks for source hash/bytes, runtime, validation, engine compatibility, metadata, and proof matching, and add TypeScript proof-specific checks. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `packages/persistence/src/competition.ts`]
**Warning signs:** Success response without artifact/proof metadata still writes a ready row. [VERIFIED: `packages/persistence/src/competition.ts`]

## Code Examples

### Entry Gate Parity Shape

```go
// Source: adapted from existing Go and persistence proof gate responsibilities.
func runtimeAllowsEntry(runtime, validation, metadata map[string]any, sourceHash string, sourceBytes int, counted bool) (bool, string) {
  if validationStatus(validation) != "valid" {
    return false, "invalid_strategy_revision"
  }
  if !runtimeMetadataRegistered(runtime) {
    return false, "incompatible_runtime_metadata"
  }
  if stringValue(mapValue(runtime, "package"), "mode") != "none" {
    return false, "package_policy_violation"
  }
  if !runtimeProviderProofMatches(runtime, metadata, sourceHash, sourceBytes) {
    return false, "provider_proof_invalid"
  }
  return true, ""
}
```

This is a planning pattern, not a copy-paste implementation. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/competition.ts`]

### Runtime-Service Account Save Flow

```text
if sourceFormat in {typescript, python, rust, zig}:
  response = runtimeService.validateStrategy(sourceFormat, source, strategyId)
  if transport/system/malformed/oversized/source mismatch:
    reject execution-ready save or store explicit non-execution draft
  if response.ok is false:
    store invalid non-execution draft only if draft mode is explicit
  if response.ok is true and provider proof matches:
    persist runtime, validation, engineCompatibility, metadata, source identity
```

This pattern avoids Go execution and avoids raw diagnostic exposure. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `apps/runtime-service/src/server.ts`, `.planning/artifacts/v1.34-workshop-checker-contract.md`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TypeScript account save could rely on Go default runtime/local validation. | Phase 244 should require runtime-service/provider proof for TypeScript execution-ready account saves. | Phase 244 planned on 2026-06-14. [VERIFIED: `244-CONTEXT.md`] | TypeScript no longer bypasses provider-grade readiness. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| Python/Rust/Zig proof handling focused on counted play. | Non-counted entry must also reject stale/missing/mismatched proof and incompatible runtime metadata. | Phase 244 planned on 2026-06-14. [VERIFIED: `244-CONTEXT.md`] | Non-counted no longer means proof-optional. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| Checker contract was preflight only. | Account save and entry gates should align with checker readiness categories but still enforce persistence gates. | v1.34 checker contract, consumed by v1.35 Phase 244. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`, `.planning/REQUIREMENTS.md`] | UI/checker readiness and backend eligibility stop drifting. [VERIFIED: `.planning/REQUIREMENTS.md`] |

**Deprecated/outdated:**
- Go client message saying runtime-service validation only supports Python/Rust/Zig is outdated because runtime-service now accepts TypeScript at `/validate-strategy`. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `apps/runtime-service/src/server.ts`]
- Go TypeScript semantics labelled `local-dev-fallback` should not be used as an entry readiness claim once provider proof is required. [VERIFIED: `apps/go-backend/live_backend.go`, `244-CONTEXT.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All research claims are based on repo files, environment probes, npm registry, or Go module version queries. | — | — |

## Open Questions

1. **Should invalid/unavailable account saves persist at all, or fail with no row?**
   - What we know: CONTEXT allows draft storage only if explicitly non-execution and non-entry-eligible. [VERIFIED: `244-CONTEXT.md`]
   - What's unclear: No current request DTO field explicitly asks for draft persistence. [VERIFIED: `apps/go-backend/live_backend.go`]
   - Recommendation: Default execution-ready save should fail closed; add draft persistence only if planner introduces an explicit request flag and public labels. [VERIFIED: `.planning/REQUIREMENTS.md`]

2. **Should JavaScript remain in Go entry helpers?**
   - What we know: Phase 244 requirements name TypeScript, Python, Rust, and Zig, while spec registry still includes JavaScript as supported counted. [VERIFIED: `.planning/REQUIREMENTS.md`, `packages/spec/src/runtime.ts`]
   - What's unclear: Account save route only accepts TypeScript/Python/Rust/Zig source formats today. [VERIFIED: `apps/go-backend/live_backend.go`]
   - Recommendation: Do not expand JavaScript behavior in Phase 244; preserve existing registry behavior but focus tests and readiness changes on named phase languages. [VERIFIED: `244-CONTEXT.md`]

3. **Should Go reuse exact TypeScript persistence helper code through a generated fixture?**
   - What we know: Go and TS have duplicate proof logic today. [VERIFIED: `apps/go-backend/live_backend.go`, `packages/persistence/src/competition.ts`]
   - What's unclear: There is no current cross-language generated proof fixture for all negative cases. [VERIFIED: codebase grep]
   - Recommendation: Add table fixtures or mirrored tests rather than adding a new runtime service just for proof matching. [VERIFIED: repository test layout]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Go | Go backend tests | yes | `go1.26.3` installed; module target `1.25.0` | none needed. [VERIFIED: environment probe, `go.mod`] |
| Node.js | TypeScript tests/runtime-service | yes | `v24.15.0` | none needed. [VERIFIED: environment probe] |
| pnpm | Workspace scripts | yes | `11.1.2` | npm is available but workspace scripts use pnpm. [VERIFIED: environment probe, `package.json`] |
| PostgreSQL local service | DB-backed account/exhibition tests | no response | client `psql 16.14`; `pg_isready` no response on `/tmp:5432` | use `pnpm services:up` or `scripts/dev-local-postgres.sh` before DB integration proof. [VERIFIED: environment probe, `package.json`] |
| Wasmtime | Rust/Zig runtime-service tests/proofs | yes | `45.0.0` | skip WASM service-backed proof if not needed; unit proof can be metadata-only. [VERIFIED: environment probe] |
| Rust toolchain | Rust provider validation tests | yes | `rustc 1.95.0` | metadata-only unit tests if toolchain unavailable. [VERIFIED: environment probe] |
| Zig toolchain | Zig provider validation tests | yes | `0.16.0` | metadata-only unit tests if toolchain unavailable. [VERIFIED: environment probe] |

**Missing dependencies with no fallback:**
- None for unit-level research and planning. [VERIFIED: environment probe]

**Missing dependencies with fallback:**
- PostgreSQL service is not currently responding; planner should start project services for DB-backed account/entry proof or keep pure helper/client tests separate. [VERIFIED: environment probe]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Go `testing`; Vitest `^4.1.6` in repo and latest observed `4.1.8`; Playwright `1.60.0` available for optional browser proof. [VERIFIED: `package.json`, npm registry] |
| Config file | Go module `apps/go-backend/go.mod`; TypeScript workspace package scripts in package JSON files. [VERIFIED: `apps/go-backend/go.mod`, `package.json`] |
| Quick run command | `cd apps/go-backend && go test ./...`; `pnpm --filter @cowards/runtime-service test`; `pnpm --filter @cowards/persistence test`; `pnpm --filter @cowards/spec test`. [VERIFIED: `package.json`, package scripts] |
| Full suite command | `pnpm test:fast` then targeted `pnpm go:parity`; DB-backed tests require PostgreSQL service. [VERIFIED: `package.json`, environment probe] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | Go client accepts TypeScript `/validate-strategy` and rejects malformed/mismatched responses | Go unit + runtime-service Vitest | `cd apps/go-backend && go test ./... -run TestRuntimeServiceClient` and `pnpm --filter @cowards/runtime-service test` | yes, expand existing files. [VERIFIED: test files] |
| ACCT-02 | Go account save persists TS provider metadata and source-artifact identity for execution-ready saves | Go API/DB integration | `cd apps/go-backend && go test ./... -run Test.*Account.*Revision` after DB service startup | partial; likely Wave 0 test gap. [VERIFIED: test scan] |
| ACCT-03 | Ready/invalid/unavailable/draft states are distinct and labels cannot imply eligibility | Go unit/API + account list semantics | `cd apps/go-backend && go test ./... -run Test.*Runtime.*Metadata` and TS spec/account tests if touched | partial. [VERIFIED: `apps/go-backend/main_test.go`, `packages/persistence/src/account-revisions.ts`] |
| ACCT-04 | Unavailable/stale/missing/mismatched/malformed/oversized/unverifiable proof fails closed or draft-only | Go runtime client and helper table tests | `cd apps/go-backend && go test ./... -run TestRuntimeServiceClient` | partial; add TypeScript/proof cases. [VERIFIED: `apps/go-backend/runtime_service_client_test.go`] |
| ACCT-05 | Save errors are normalized public-safe categories | Go API/unit redaction tests | `cd apps/go-backend && go test ./... -run Test.*Safe|Test.*RuntimeServiceClient` | partial. [VERIFIED: `apps/go-backend/runtime_service_client_test.go`] |
| ENTRY-01 | Counted gates require proof for TS/Python/Rust/Zig | Go + persistence unit | `cd apps/go-backend && go test ./... -run Test.*Counted` and `pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts` | partial; add TypeScript to Go and persistence tests. [VERIFIED: test scan] |
| ENTRY-02 | Non-counted rejects unsupported/stale/package/TinyGo/fallback states | Go unit/table | `cd apps/go-backend && go test ./... -run Test.*NonCounted` | partial; add metadata-aware non-counted cases. [VERIFIED: `apps/go-backend/main_test.go`] |
| ENTRY-03 | Go and persistence helpers agree across matrix cases | Cross-language fixture or mirrored tests | `pnpm go:parity` plus targeted Go/TS tests | partial; add parity fixture or matrix. [VERIFIED: `package.json`, test scan] |
| ENTRY-04 | Labels derive from proof and registry policy | Go/TS unit + monitor | `pnpm --filter @cowards/spec test` and targeted Go tests | partial. [VERIFIED: `packages/spec/src/spec.test.ts`, `apps/go-backend/live_backend.go`] |

### Sampling Rate
- **Per task commit:** targeted Go/Vitest command for touched tier. [VERIFIED: repository scripts]
- **Per wave merge:** `pnpm go:parity` plus `pnpm --filter @cowards/spec test`, `pnpm --filter @cowards/persistence test`, and `pnpm --filter @cowards/runtime-service test`. [VERIFIED: `package.json`]
- **Phase gate:** `pnpm test:fast` and any DB-backed proof after `pnpm services:up`; full `pnpm boundary:monitors` if monitor files change. [VERIFIED: `package.json`, environment probe]

### Wave 0 Gaps
- [ ] Add Go TypeScript runtime-service validation client tests in `apps/go-backend/runtime_service_client_test.go`. [VERIFIED: existing file lacks TypeScript test by grep]
- [ ] Add Go TypeScript provider proof helper/counting test in `apps/go-backend/main_test.go` or focused new test file. [VERIFIED: existing Go proof tests cover Python/Rust/Zig only]
- [ ] Add metadata-aware non-counted entry tests for Python/Rust/Zig/TypeScript stale and missing proof. [VERIFIED: existing non-counted helper lacks metadata input]
- [ ] Add persistence TypeScript counted proof tests to `packages/persistence/src/competition.test.ts` and `packages/persistence/src/ladder.test.ts` for explicit parity coverage. [VERIFIED: grep did not find TypeScript counted proof cases]
- [ ] Add account-save DB/API proof test if services are available, or document DB startup prerequisite. [VERIFIED: PostgreSQL not responding during environment audit]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Account save and entry require current user/session through Go/web transport; Phase 245 owns deeper auth cleanup. [VERIFIED: `apps/go-backend/live_backend.go`, `244-CONTEXT.md`] |
| V3 Session Management | yes | Existing session cookie/Bearer handling remains Go route transport concern; do not change in this phase unless tests touch selected routes. [VERIFIED: `apps/go-backend/live_backend.go`] |
| V4 Access Control | yes | Entry loader joins revisions to strategy owner and user id; preserve owner check. [VERIFIED: `apps/go-backend/live_backend.go`] |
| V5 Input Validation | yes | Runtime-service request/response envelopes, source identity, runtime metadata, validation status, package mode, and provider proof must be validated before readiness. [VERIFIED: `apps/go-backend/runtime_service_client.go`, `packages/spec/src/runtime.ts`] |
| V6 Cryptography | yes | Existing HMAC provider proof contract using configured secret; do not invent new crypto. [VERIFIED: `apps/runtime-service/src/server.ts`, `packages/persistence/src/competition.ts`] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Strategy code executes in Go/web/API during validation | Elevation of privilege | Keep validation/build/execution behind runtime-service/provider boundary; Go only transports and verifies metadata. [VERIFIED: `AGENTS.md`, `apps/runtime-service/src/server.ts`] |
| Stale or mismatched artifact accepted as current revision | Tampering | Verify source hash/bytes, artifact hash/bytes, provider id, contract version, proof, and artifact payload digest. [VERIFIED: `packages/persistence/src/competition.ts`, `apps/go-backend/live_backend.go`] |
| Package-declared runtime slips into entry | Tampering / Elevation of privilege | Require package mode `none` and empty required capabilities. [VERIFIED: `packages/spec/src/runtime.ts`, `apps/go-backend/live_backend.go`] |
| Raw diagnostics leak source, paths, proof, tokens, or private internals | Information disclosure | Normalize categories and redact service details; never expose proof signatures or artifact payloads by default. [VERIFIED: `.planning/artifacts/v1.34-workshop-checker-contract.md`, `apps/go-backend/runtime_service_client.go`] |
| TinyGo appears as production-supported source/provider | Spoofing / policy bypass | Continue using supported source-format registry; TinyGo lookup remains null. [VERIFIED: `packages/spec/src/spec.test.ts`, `packages/spec/src/workshop-checker.test.ts`] |
| Sandbox/package overclaims | Information integrity / repudiation | Describe provider proof as readiness/provenance, not production sandbox certification or package ecosystem support. [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/artifacts/v1.35-boundary-surface-inventory.md`] |

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - v1.35 milestone boundaries and active decisions. [VERIFIED: codebase grep]
- `.planning/REQUIREMENTS.md` - ACCT-01..05 and ENTRY-01..04 requirements. [VERIFIED: codebase grep]
- `.planning/ROADMAP.md` - Phase 244 goal and success criteria. [VERIFIED: codebase grep]
- `.planning/STATE.md` - current phase state. [VERIFIED: codebase grep]
- `.planning/phases/244-account-revision-provider-proof-and-entry-gates/244-CONTEXT.md` - locked decisions, discretion, deferred scope, code context. [VERIFIED: codebase grep]
- `.planning/artifacts/v1.35-boundary-surface-inventory.md` - authoritative Phase 243 handoff rows. [VERIFIED: codebase grep]
- `.planning/artifacts/v1.34-workshop-checker-contract.md` and `.planning/artifacts/v1.34-workshop-checker-proof.md` - checker contract, privacy exclusions, service-backed baseline. [VERIFIED: codebase grep]
- `apps/go-backend/live_backend.go` - Go account save, insert, entry gates, runtime semantics. [VERIFIED: codebase grep]
- `apps/go-backend/runtime_service_client.go` - runtime-service client, validation envelope checks, redaction. [VERIFIED: codebase grep]
- `apps/runtime-service/src/server.ts` - `/validate-strategy` source-format support and provider validation metadata. [VERIFIED: codebase grep]
- `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`, `packages/persistence/src/account-revisions.ts` - stricter reference proof and account semantics. [VERIFIED: codebase grep]
- `packages/spec/src/runtime.ts`, `packages/spec/src/workshop-checker.ts` - runtime registry, provider contracts, checker statuses/categories. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)
- npm registry version checks for `vitest`, `typescript`, `zod`, `pg`, `tsx`, `@playwright/test`, `turbo`, `@redocly/cli`. [VERIFIED: npm registry]
- Go module proxy version checks for `github.com/jackc/pgx/v5` and `golang.org/x/crypto`. [VERIFIED: Go module proxy]
- Environment probes for Go, Node, pnpm, PostgreSQL client/readiness, Wasmtime, Rust, Zig. [VERIFIED: shell probe]

### Tertiary (LOW confidence)
- None. [VERIFIED: research log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing repo stack and package versions were verified locally and against registries where relevant. [VERIFIED: `package.json`, `go.mod`, npm registry, Go module proxy]
- Architecture: HIGH - all recommended ownership boundaries come from phase context and current source paths. [VERIFIED: `244-CONTEXT.md`, codebase grep]
- Pitfalls: HIGH - each pitfall maps to an observed code gap or locked requirement. [VERIFIED: codebase grep]

**Research date:** 2026-06-14
**Valid until:** 2026-06-21 for npm/tooling versions; 2026-07-14 for repo-specific architecture if Phase 244 has not yet been implemented. [VERIFIED: current date and version probes]
