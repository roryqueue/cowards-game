# Stack Research

**Domain:** Deterministic programmable strategy game runtime/account/security-policy cleanup
**Project:** Coward's Game v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup
**Researched:** 2026-06-14
**Confidence:** HIGH for repo-local stack and integration points; MEDIUM for future package-policy roadmap details because they require later product/security decisions.

## Executive Recommendation

Do not add a new platform, runtime, package manager, auth provider, sandbox brand, or broker process for v1.35. The cleanup should be implemented by tightening existing contracts, clients, diagnostics, labels, and proof scripts around the current stack:

- `@cowards/spec` remains the source of truth for provider records, runtime metadata, package policy, public privacy exclusions, Workshop checker envelopes, and sandbox-readiness labels.
- `apps/runtime-service` remains the provider validation/build/proof boundary through `POST /validate-strategy` and `POST /execute-match`.
- Go remains the normal backend owner for account-owned Strategy Revision persistence and competition/exhibition orchestration, but must call runtime-service provider validation when a saved revision is represented as execution-ready or counted eligible.
- Existing monitor/proof scripts should be extended and one focused v1.35 evaluator should be added. No broad observability service is needed.

The main stack change is not a dependency change: make Go account-save and Go-owned entry/read surfaces consume the same provider-grade proof path already used by Workshop submit/save and v1.34 checker proof. TypeScript is the specific drift point: runtime-service already validates TypeScript, emits transpiled source-artifact provenance, and signs provider proof; `apps/go-backend/runtime_service_client.go` still rejects TypeScript validation client-side and `apps/go-backend/live_backend.go` permits TypeScript counted eligibility without `sourceArtifactProviderValidationMatches`.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| pnpm workspace | `pnpm@11.1.2` | Monorepo package manager and script runner | Already drives every proof and monitor command; no new task runner is needed. |
| TypeScript | `^6.0.3` | Contracts, runtime-service, web, runtime packages, scripts | Existing source of runtime/provider contracts and proof harnesses; keep policy and diagnostics in shared TS contracts. |
| `@cowards/spec` | workspace `0.1.0` | Runtime/provider/package/privacy/checker contracts | Extend this for v1.35 labels/gates so web, Go, runtime-service, tests, and monitors share one vocabulary. |
| `apps/runtime-service` | workspace `0.1.0` | Strategy Execution Service / Runtime Broker HTTP+JSON binding | Already owns provider validation, artifact build/proof, and Match execution. Keep hostile validation/build semantics here. |
| Go backend | Go `1.25.0`, `pgx/v5 v5.9.2` | Account-owned revisions, selected API ownership, orchestration | Existing normal backend owner; v1.35 should tighten its runtime-service client and eligibility checks rather than move execution into Go. |
| PostgreSQL | local compose-backed | Canonical persistence | Existing account/revision/competition store; no schema platform replacement needed for this cleanup. |
| Zod | `^4.4.3` | TS boundary/schema validation | Already validates public/service/runtime DTOs; use for any v1.35 contract additions. |
| HMAC SHA-256 provider proof | Node/Go crypto stdlibs | Provider validation proof binding source/artifact identity | Already implemented in runtime-service and verified in persistence/Go helper code; reuse with `COWARDS_PROVIDER_VALIDATION_SECRET`. |

### Runtime Provider Lanes

| Lane | Current Stack | v1.35 Action | Non-Claim |
|------|---------------|--------------|-----------|
| TypeScript | `@cowards/runtime-js`, runtime-service `/validate-strategy`, transpiled JS source artifact | Require provider proof for Go account-save/countable eligibility, or label saved drafts as non-execution draft storage | Not WASM isolation; not production sandbox certification. |
| Python | `@cowards/runtime-python`, `python3 -I`, empty env, no imports/packages | Preserve provider proof and no-package policy; include package/security diagnostics in v1.35 proof | Not general Python package support or broad sandbox certification. |
| Rust | `@cowards/runtime-wasm-wasi`, Wasmtime Preview 1 stdin/stdout JSON, immutable `.wasm` artifact | Preserve artifact/import/proof gates; include stale/missing/mismatched proof probes | No direct-export or Component Model/WIT ABI migration. |
| Zig | `@cowards/runtime-wasm-wasi`, no-std `wasm32-wasi`, immutable artifact | Preserve no-std/helper and import-audit gates | No Zig package ecosystem expansion. |
| TinyGo | `scripts/evaluate-v1-33-tinygo-wasi-spike.ts`, hidden spike evidence | Keep hidden and monitor absence from production surfaces | Not production supported; not counted eligible. |

### Supporting Libraries and Local Packages

| Library / Package | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| `@cowards/runtime-js` | workspace `0.1.0` | TypeScript validation, transpiled source artifact, JS/TS execution adapters | Reuse for TypeScript provider proof and source-artifact metadata; do not use it as a web/API executor. |
| `@cowards/runtime-python` | workspace `0.1.0` | Python AST/compile validation, source-bundle provenance, subprocess adapter | Preserve no-import/no-package boundaries and public-safe diagnostics. |
| `@cowards/runtime-wasm-wasi` | workspace `0.1.0` | Rust/Zig compile, import audit, Wasmtime Preview 1 execution | Preserve immutable artifact-backed lanes and proof checks. |
| `@cowards/persistence` | workspace `0.1.0` | Account revision semantics and provider-proof-aware summaries | Use existing proof validators as a reference for Go/account behavior. |
| `@cowards/service` | workspace `0.1.0` | Typed service boundary | Use for service DTO shape and privacy expectations; do not resurrect it as a backend fallback. |
| `@playwright/test` | `^1.60.0` | Browser proof and signed-in E2E | Use for service-backed account/provider proof and public/default privacy scans. |
| Vitest | `^4.1.6` | Unit/integration tests | Add focused spec/runtime/web tests for labels, gates, diagnostics, and privacy. |
| Redocly CLI | `2.31.4` | OpenAPI lint | Keep in `boundary:monitors`; no v1.35 OpenAPI split unless route contracts change. |

## Required Stack Additions / Changes

### 1. Add a v1.35 Local Proof Evaluator

Add a local script modeled after `scripts/evaluate-v1-34-workshop-checker.ts`:

```bash
pnpm exec tsx scripts/evaluate-v1-35-runtime-account-policy.ts
pnpm exec tsx scripts/evaluate-v1-35-runtime-account-policy.ts --check
```

Recommended root scripts:

```json
"v1.35:runtime-account-policy": "pnpm exec tsx scripts/evaluate-v1-35-runtime-account-policy.ts",
"v1.35:runtime-account-policy:check": "pnpm exec tsx scripts/evaluate-v1-35-runtime-account-policy.ts --check"
```

The evaluator should write `.planning/artifacts/v1.35-runtime-account-policy-proof.md` and optionally `.json`, then be added to `pnpm boundary:monitors`.

Proof coverage should include:

- TypeScript, Python, Rust, and Zig account-save through Go with runtime-service available.
- TypeScript provider proof present on Go-created execution-ready/countable revisions.
- Draft/non-execution behavior is explicitly labeled if runtime-service proof is unavailable.
- Stale, missing, mismatched, or unsigned provider proof fails counted/entry eligibility.
- Declared packages, non-empty required capabilities, forbidden imports, package paths, host paths, env/tokens/DB details, source, artifact bytes, and provider proofs do not leak to public/default output.
- TinyGo remains absent from production source-format, submit/save, entry, result, replay, and public evidence paths.

### 2. Extend Existing Go Runtime-Service Client, Not Runtime-Service

Change `apps/go-backend/runtime_service_client.go` so `validateStrategy` accepts `"typescript"` in addition to Python/Rust/Zig. Runtime-service already supports TypeScript provider validation and returns source-artifact metadata plus provider proof.

Then change `apps/go-backend/live_backend.go` so TypeScript account save uses runtime-service validation when a saved revision is represented as valid/execution-ready. For counted eligibility, require:

- language `typescript`
- adapter `runtime-js-worker-thread` or approved JS/TS adapter
- package mode `none`
- empty required capabilities
- source artifact `format: "transpiled-javascript"`
- provider id `strategy-language-provider-js-ts`
- provider contract `strategy-language-provider-contract-v1.33`
- source hash/bytes match
- artifact hash/bytes match actual artifact bytes
- HMAC proof matches `COWARDS_PROVIDER_VALIDATION_SECRET`

There is already a reusable shape in Go: `sourceArtifactProviderValidationMatches(...)` supports the TypeScript artifact format but the TypeScript branch of `runtimeAllowsCountedPlay(...)` does not call it. v1.35 should close that exact gap.

### 3. Promote a v1.35 Claim Contract in `@cowards/spec`

Add or tighten spec-owned fields/constants for:

- `sandboxReadinessLabel`: current runtime containment/evidence label.
- `sandboxCertificationState`: explicit values such as `not-certified`, `readiness-evidence-only`, `candidate-lane`, `unavailable-lane`.
- `packagePolicy`: keep `none` as the only counted value; `declared` remains unsupported for counted play.
- `providerProofRequiredFor`: account-save execution readiness, counted entry, ladder/trial entry, public evidence.

Do this in existing runtime/provider structures (`packages/spec/src/runtime.ts`) and tests (`packages/spec/src/spec.test.ts`) instead of a separate policy package.

### 4. Extend Existing Privacy and Redaction Utilities

Reuse and extend:

- `packages/spec/src/public-output-privacy.ts`
- `packages/spec/src/workshop-checker.ts`
- `apps/runtime-service/src/redaction.ts`
- Go runtime failure redaction in `apps/go-backend/runtime_service_client.go`

Add v1.35 checks for provider proof strings, package manifests, lockfile hashes when unsupported, package paths, host paths, env values, DB details, artifact bytes/base64, raw diagnostics, and private runtime internals. Public/default outputs may expose normalized categories, public messages, source/artifact hashes and byte counts, provider id, contract version, ABI version, and readiness labels.

### 5. Extend Existing Monitors

Update `scripts/check-boundary-monitors.ts` rather than adding a new monitor framework. v1.35 monitor checks should verify:

- TypeScript Go account-save does not bypass provider proof for execution-ready/countable revisions.
- Go counted eligibility uses provider proof for TypeScript, Python, Rust, and Zig.
- `player:workshop-local` cannot authorize persisted account-owned or public/private replay owner-debug behavior outside test/local gates.
- Workshop compatibility aliases are either removed, deprecated with tests, or explicitly hidden from production navigation.
- Sandbox wording never escalates from readiness evidence/candidate lane to certification.
- TinyGo remains hidden.
- Package mode `declared` and non-empty `requiredCapabilities` remain non-counted/unsupported.

## Development Tools

| Tool / Command | Purpose | v1.35 Recommendation |
|----------------|---------|----------------------|
| `pnpm boundary:monitors` | Composite contract/privacy/runtime/topology drift gate | Add the new v1.35 proof check here. |
| `pnpm v1.34:workshop-checker:check` | Existing four-language checker proof | Keep as regression baseline for provider-grade checker semantics. |
| `pnpm runtime-abuse:evaluate:check` | Runtime abuse and sandbox-readiness matrix | Reuse labels; do not treat as certification. |
| `pnpm sandbox:evaluate:check` | Runtime sandbox candidate evidence | Keep evidence-only; strict container/runsc lanes fail loud when unavailable. |
| `pnpm wasm-wasi:evaluate:check` | WASM/WASI hardening evidence | Preserve Rust/Zig immutable artifact and import audit gates. |
| `pnpm tinygo-wasi:spike:check` | TinyGo spike evidence freshness | Keep spike-only and hidden; do not wire to production. |
| `pnpm topology:check` | Local topology diagnostics | Include v1.35 service availability/proof requirements if needed. |
| `pnpm go:parity` | Go tests plus fixture parity | Add Go tests for TypeScript runtime-service validation and provider-proof eligibility. |
| `pnpm test:fast` | Formatting, lint, typecheck, tests | Required final baseline. |
| Playwright signed-in proof | Browser/service E2E | Add a focused v1.35 proof only if account/provider/public labels need browser validation. |

## Installation

No new npm, Go, Python, Rust, Zig, Docker, or browser packages are recommended for v1.35.

```bash
# No dependency install required for v1.35 stack cleanup.

# Existing verification commands to reuse:
pnpm test:fast
pnpm boundary:monitors
pnpm v1.34:workshop-checker:check
pnpm runtime-abuse:evaluate:check
pnpm sandbox:evaluate:check
pnpm wasm-wasi:evaluate:check
pnpm tinygo-wasi:spike:check
```

Only add a root script for the v1.35 evaluator if the milestone implements the proof harness.

## Alternatives Considered

| Recommended | Alternative | Why Not for v1.35 |
|-------------|-------------|-------------------|
| Extend runtime-service `/validate-strategy` use from Go | New Runtime Broker process | Current runtime-service already implements provider validation/proof; a new process would be architecture churn. |
| Spec-owned readiness/certification labels | UI-only copy changes | The risk is cross-surface drift; labels must be contract-backed and monitorable. |
| Existing HMAC provider proof | New signing/KMS system | Local HMAC proof already exists and is enough for repo-local provider proof cleanup; KMS belongs to deployment hardening. |
| Existing privacy denylist/redaction utilities | New DLP/scanning vendor | The milestone needs deterministic repo-local proof, not external observability. |
| Keep `package.mode: "none"` | npm/PyPI/Cargo/Zig package support | Package ecosystems require supply-chain, reproducibility, native-code, and deterministic-build policy that is explicitly future work. |
| Existing Playwright/Vitest/Go tests | New E2E framework | Current test stack already covers signed-in proof, browser privacy, Go behavior, and local service-backed checks. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Node `vm` as a security boundary | Explicitly forbidden; not a hostile-code sandbox. | Runtime-service/provider boundaries and existing runtime adapters. |
| Strategy execution in web/API/Go | Violates core architecture and AGENTS non-negotiables. | Go calls runtime-service; web displays validated DTOs. |
| New rich package lanes | No current reproducibility/supply-chain/native-code policy. | `package.mode: "none"` and self-contained Strategy source. |
| PyPI/npm/Cargo/Zig package installs during validation/execution | Would add nondeterminism, supply-chain risk, host access risk, and package-path leaks. | Provider diagnostics should reject package/dependency use publicly and safely. |
| TinyGo production support | Existing spike imports forbidden/unsupported WASI capabilities. | Keep `tinygo-wasi:spike:check` as hidden evidence only. |
| Direct exports or Component Model/WIT migration | Out of scope and previously non-promoted. | Keep WASI Preview 1 stdin/stdout JSON. |
| `node:wasi` sandbox claims | Existing monitors reject treating it as an untrusted Strategy sandbox. | Wasmtime Preview 1 artifact-backed lane for Rust/Zig. |
| gVisor/runsc certification language without executable adapter proof | Existing lanes fail loud when unavailable/unimplemented. | Candidate/unavailable labels only. |
| Public raw diagnostics | Can leak source, host paths, package paths, tokens, DB details, or internals. | Normalized public-safe diagnostic categories and remediation. |
| New auth/account platform | v1.35 is ownership/proof cleanup, not account recovery/OAuth/password reset. | Tighten existing session/owner gates and `player:workshop-local` quarantine. |

## Stack Patterns by Variant

**If a user saves a Strategy Revision to account and it may be used for Match/MatchSet play:**
- Use Go account-save as the persistence owner.
- Require runtime-service provider validation for TypeScript, Python, Rust, and Zig.
- Store provider metadata/proof and artifact metadata.
- Because execution readiness must mean provider-grade proof, not local syntax heuristics.

**If runtime-service is unavailable during account save:**
- Either fail closed for execution-ready save, or store only an explicitly labeled non-execution draft if product requirements choose that path.
- Do not mark the revision counted eligible or provider-ready.
- Because unavailable runtime-service is not evidence that the Strategy is valid or invalid.

**If a revision enters counted competition/trial ladder:**
- Evaluate saved immutable revision metadata only.
- Require provider proof for all four production source formats.
- Reject stale/missing/mismatched artifacts, hidden TinyGo, declared packages, non-empty required capabilities, and unavailable lanes.
- Because entry gates should not recompile mutable source or rely on UI checker state.

**If a surface displays sandbox status:**
- Use spec-owned readiness/certification labels.
- Say "readiness evidence", "candidate lane", or "not certified" where appropriate.
- Do not say "production sandbox certified" unless a future milestone proves and explicitly promotes that claim.

**If diagnostics mention packages/dependencies:**
- Use public-safe categories such as `package_or_dependency`, `forbidden_import`, `forbidden_capability`, `unsupported_provider`, or `system_unavailable`.
- Never include raw compiler/runtime output, package paths, host paths, env values, DB details, tokens, source, artifact bytes, or provider proof strings.

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| `strategy-language-provider-contract-v1.33` | `strategy-runtime-abi-v1.14` | Current provider proof and runtime ABI baseline. |
| `workshop-checker-v1.34` | TypeScript/Python/Rust/Zig provider validation | Reuse as checker/proof baseline; v1.35 may add account/provider policy proof but should not break checker contract without a migration. |
| TypeScript provider | `runtime-js-worker-thread`, `runtime-js-subprocess`, source artifact `transpiled-javascript` | Source-artifact provenance only, not WASM isolation. |
| Python provider | `runtime-python-subprocess-experimental`, Python metadata `3.9`, `python3 -I` validation host | No imports/packages; counted support is provider-gated evidence, not general Python sandbox certification. |
| Rust provider | `runtime-wasm-wasi-wasmtime-preview1`, `1.95.0-wasm32-wasip1` | Immutable WASM/WASI Preview 1 artifact and provider proof required. |
| Zig provider | `runtime-wasm-wasi-wasmtime-preview1`, `0.16.0-wasm32-wasi` | No-std/helper lane; immutable WASM/WASI Preview 1 artifact and provider proof required. |
| TinyGo spike | TinyGo `0.41.1`, target `wasi` | Evidence exists but production support remains false due forbidden/unsupported imports. |
| Go backend | Go `1.25.0`, `pgx/v5 v5.9.2` | Extend runtime-service validation client; do not execute Strategy code. |
| Web | Next `^16.2.6`, React `^19.2.6` | Display labels/diagnostics only; do not add game/rule/runtime execution behavior. |

## Sources

- `.planning/PROJECT.md` - v1.35 goal, hard boundaries, current runtime/account/security-policy scope. Confidence: HIGH.
- `.planning/STATE.md` - active v1.35 boundary notes and v1.34 proof baseline. Confidence: HIGH.
- `.planning/artifacts/v1.35-v1.36-milestone-prompts.md` - desired v1.35 scope and non-goals. Confidence: HIGH.
- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - concrete account-save/provider-proof drift, Workshop alias, and entry-surface findings. Confidence: HIGH.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` and `.planning/artifacts/v1.34-workshop-checker-proof.md` - current checker envelope and service-backed proof. Confidence: HIGH.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only/defer evidence. Confidence: HIGH.
- `packages/spec/src/runtime.ts`, `packages/spec/src/workshop-checker.ts`, `packages/spec/src/public-output-privacy.ts`, `packages/spec/src/schemas.ts` - provider, runtime, package, checker, and privacy contracts. Confidence: HIGH.
- `apps/runtime-service/src/server.ts`, `apps/runtime-service/src/redaction.ts` - provider validation/proof and redaction implementation. Confidence: HIGH.
- `apps/go-backend/runtime_service_client.go`, `apps/go-backend/live_backend.go` - Go runtime-service client, account-save path, provider-proof validators, counted eligibility gap. Confidence: HIGH.
- `scripts/check-boundary-monitors.ts`, `scripts/evaluate-v1-34-workshop-checker.ts`, `scripts/evaluate-runtime-sandbox.ts`, `scripts/evaluate-v1-24-runtime-abuse-lab.ts`, `scripts/evaluate-v1-33-tinygo-wasi-spike.ts` - existing monitors and proof harness families. Confidence: HIGH.
- `CowardsGameSpec_Full_Consolidated_v1.md` and `CowardsGame_Technical_Architecture_Spec_V1.md` - canonical deterministic runtime/security/account/replay constraints. Confidence: HIGH.

---
*Stack research for: Coward's Game v1.35 runtime/account/provider-proof/sandbox/package-policy cleanup*
*Researched: 2026-06-14*
