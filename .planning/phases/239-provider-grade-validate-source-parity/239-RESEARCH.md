# Phase 239: Provider-Grade Validate Source Parity - Research

**Researched:** 2026-06-14 [VERIFIED: system date]
**Domain:** Workshop Validate source checker parity across app/API, runtime-service provider validation, and public-safe normalization [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]
**Confidence:** HIGH for repo-local code paths and phase scope; MEDIUM for exact implementation split until planner chooses whether checker schemas live in `@cowards/spec` or web-local code [VERIFIED: codebase grep]

<user_constraints>
## User Constraints (from CONTEXT.md)

Source: `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` [VERIFIED: phase context]

### Locked Decisions

### Checker Envelope Ownership
- **D-01:** `/api/workshop/validate` owns the public `workshop-checker-v1.34` envelope.
- **D-02:** Runtime-service remains provider-focused: it validates/builds/proves provider semantics and may expose structured provider metadata, but it should not own Workshop-specific UX shape.
- **D-03:** The app/API boundary is responsible for public-safe normalization, redaction, checker status mapping, and schema validation before the Workshop UI consumes the response.

### Parity Breadth
- **D-04:** Phase 239 should focus implementation on Workshop Validate source parity.
- **D-05:** Phase 239 may add thin submit/save public normalization where needed so the same provider failure does not appear contradictory between Validate source and submit/save.
- **D-06:** Phase 239 should not perform a full submit/save/entry rewrite; entry remains an authoritative consumer of saved Revision metadata and later proof coverage can verify consistency.

### Unavailable vs Invalid Semantics
- **D-07:** Missing, unreachable, or malformed runtime-service conditions must map to calm unavailable/system states rather than invalid-source diagnostics.
- **D-08:** Missing or misconfigured language toolchains must map to `toolchain_unavailable` where the toolchain is required, especially Rust/Zig compile providers.
- **D-09:** Public copy must avoid implying the player's Strategy is unsafe or broken when infrastructure or toolchain availability blocks checking.

### TypeScript / Go Account-Save Gap
- **D-10:** The known Go TypeScript account-save/provider-proof discrepancy is deferred unless it directly blocks Workshop checker parity.
- **D-11:** If Phase 239 does not clean up that Go TypeScript account-save gap, the implementation summary or evidence artifact must explicitly document the unresolved mismatch and rationale.
- **D-12:** Phase 239 should not become a broad Go ownership cleanup phase.

### the agent's Discretion
- Planner may choose the exact schema implementation location, provided the public checker contract remains shared and outside React components.
- Planner may decide whether runtime-service needs small structured-provider additions to support app/API normalization, provided runtime-service does not emit the Workshop-specific envelope directly.
- Planner may choose the smallest submit/save normalization surface that makes public categories consistent without expanding into entry or Go account-save policy cleanup.

### Deferred Ideas (OUT OF SCOPE)

- Broad Go TypeScript account-save/provider-proof cleanup is deferred unless it directly blocks Workshop checker parity.
- Full entry policy rewrite is deferred; Phase 242 should test entry consistency where scoped.
- Language-specific diagnostic UX polish belongs to Phase 240.
- Rust/Zig debounce/cache/coalescing and boundary monitors belong to Phase 241.
- Four-language service-backed proof, privacy scans, and final audit belong to Phase 242.
- TinyGo production checker support, Go production Strategy runtime work, package ecosystem expansion, ABI migration, and new sandbox claims remain out of scope for v1.34.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
| --- | --- | --- |
| CHECKVAL-01 | TypeScript Validate source continues to use provider-grade checker semantics and remains parity baseline. [VERIFIED: .planning/REQUIREMENTS.md] | Preserve runtime-service route for TypeScript and wrap it in `workshop-checker-v1.34`; current route calls `/validate-strategy` for TypeScript when configured. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:69] |
| CHECKVAL-02 | Python Validate source uses submit-equivalent constrained provider/runtime-service validation. [VERIFIED: .planning/REQUIREMENTS.md] | Change Validate source from local `workshopServer.validateSource` to runtime-service `/validate-strategy`, matching Workshop submit behavior. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:81] [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:71] |
| CHECKVAL-03 | Rust Validate source uses submit-equivalent provider/runtime-service artifact validation. [VERIFIED: .planning/REQUIREMENTS.md] | Current Validate source already calls runtime-service for Rust; normalization must preserve compile/toolchain/artifact/provenance semantics and not collapse all failures to generic validation. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:69] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:444] |
| CHECKVAL-04 | Zig Validate source uses submit-equivalent provider/runtime-service artifact validation. [VERIFIED: .planning/REQUIREMENTS.md] | Current Validate source already calls runtime-service for Zig; normalization must preserve no-std/helper, compile/toolchain, WASM/WASI import, artifact, and provenance semantics. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:69] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:332] |
| CHECKVAL-05 | Validate, submit, save, and entry fail consistently for unsupported provider, stale artifact, mismatched provenance, invalid output shape, unavailable runtime-service/toolchain, privacy-unsafe diagnostics, and no fallback. [VERIFIED: .planning/REQUIREMENTS.md] | Phase 239 should normalize Validate and thin submit/save public categories; full entry proof is deferred to Phase 242. [VERIFIED: 239-CONTEXT.md] |
</phase_requirements>

## Summary

Phase 239 should implement the checker contract at the app/API boundary, not in React and not in runtime-service. [VERIFIED: 239-CONTEXT.md] The natural implementation is a small shared checker schema/type module plus a route normalizer used by `apps/web/app/api/workshop/validate/route.ts`, because that route already owns the Workshop Validate source endpoint and currently returns only `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:45]

The primary behavior gap is Python: Validate source uses local Workshop validation, while Workshop submit uses runtime-service provider validation for TypeScript, Python, Rust, and Zig. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:81] [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:71] Rust and Zig already go through runtime-service in Validate source when configured, but missing runtime-service is currently returned as an invalid `TRANSPILE_FAILED` report and runtime-service JSON is cast without schema validation. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:13] [VERIFIED: apps/web/app/api/workshop/validate/route.ts:42]

**Primary recommendation:** Add `WorkshopCheckerResponse` schemas/types in `@cowards/spec`, add a web/API normalizer that maps runtime-service success, provider invalid, transport unavailable, malformed envelope, and toolchain/compile failures into the v1.34 checker envelope, then update `/api/workshop/validate` to use that normalizer for all four production languages while preserving a legacy `validation` field until the Workshop UI is updated. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] [VERIFIED: apps/web/app/workshop/workshop-client.tsx:205]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in web/API or Go. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate runtime boundaries with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay/checker output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, database details, or private runtime internals by default. [VERIFIED: AGENTS.md] [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
| --- | --- | --- | --- |
| Checker envelope ownership | API / Backend (Next route) | Browser / Client | `/api/workshop/validate` is the locked owner of the public envelope; browser should consume validated data, not shape provider semantics. [VERIFIED: 239-CONTEXT.md] |
| Provider validation/build | Runtime-service | Runtime packages | Runtime-service `/validate-strategy` dispatches TypeScript, Python, Rust, and Zig provider validation/build helpers and emits provider metadata/proof on success. [VERIFIED: apps/runtime-service/src/server.ts:116] |
| Public-safe normalization/redaction | API / Backend (Next route or helper) | Spec package schemas | Phase context assigns normalization, redaction, status mapping, and schema validation to the app/API boundary. [VERIFIED: 239-CONTEXT.md] |
| Workshop display/gating | Browser / Client | API / Backend | Current client stores `StrategyRevisionValidationReport` and derives `valid/invalid/checking/not-checked`; richer status display is mostly Phase 240, but Phase 239 may need compatibility handling. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:60] |
| Account save parity | Go Backend | API / Backend | Go account save validates Python/Rust/Zig through runtime-service but TypeScript still uses local metadata validation; context defers broad cleanup unless it blocks checker parity. [VERIFIED: apps/go-backend/live_backend.go:584] [VERIFIED: apps/go-backend/live_backend.go:2548] |

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
| --- | --- | --- | --- |
| `@cowards/spec` | workspace `0.1.0` | Shared contracts, runtime registry, zod schemas. [VERIFIED: pnpm list] | Existing source of truth for provider records, validation report schemas, and exported types. [VERIFIED: packages/spec/src/runtime.ts:420] [VERIFIED: packages/spec/src/schemas.ts:676] |
| `zod` | installed `4.4.3`; npm latest `4.4.3`, modified 2026-05-04. [VERIFIED: pnpm list] [VERIFIED: npm registry] | Runtime schema validation for checker and runtime-service response shapes. [VERIFIED: packages/spec/src/schemas.ts:1] | Zod 4 supports `safeParse`, and current repo already uses zod schemas in `@cowards/spec`. [CITED: https://zod.dev/v4] [VERIFIED: packages/spec/src/schemas.ts:676] |
| `@cowards/runtime-service` | workspace `0.1.0` | Provider validation endpoint and proof metadata. [VERIFIED: pnpm list] | Existing `/validate-strategy` route already dispatches all four supported source formats. [VERIFIED: apps/runtime-service/src/server.ts:121] |
| `@cowards/runtime-js`, `@cowards/runtime-python`, `@cowards/runtime-wasm-wasi` | workspace `0.1.0` | Language-specific validation/build implementations. [VERIFIED: pnpm list] | Existing submit and runtime-service paths already consume these providers. [VERIFIED: apps/runtime-service/src/server.ts:16] |

### Supporting

| Tool | Version | Purpose | When to Use |
| --- | --- | --- | --- |
| `vitest` | installed `4.1.6`; npm latest `4.1.8`, modified 2026-06-12. [VERIFIED: pnpm list] [VERIFIED: npm registry] | Focused TypeScript unit/integration tests. [VERIFIED: package.json] | Run specific files by path for Phase 239 verification. [CITED: https://github.com/vitest-dev/vitest/blob/main/docs/guide/filtering.md] |
| TypeScript | installed and npm latest `6.0.3`, modified 2026-04-16. [VERIFIED: pnpm list] [VERIFIED: npm registry] | Type checking and source-language provider validation. [VERIFIED: package.json] | Use existing typecheck/build, do not introduce new compiler tooling. [VERIFIED: package.json] |

**Installation:** no new npm packages are recommended. [VERIFIED: package.json] Existing workspace dependencies cover schema validation and tests. [VERIFIED: pnpm list]

## Current Behavior

| Flow | Current Behavior | Phase 239 Implication |
| --- | --- | --- |
| `POST /api/workshop/validate` | Accepts `typescript`, `python`, `rust`, `zig`; TypeScript/Rust/Zig call runtime-service when configured; Python returns local `workshopServer.validateSource`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:54] [VERIFIED: apps/web/app/api/workshop/validate/route.ts:69] | Route must switch Python to runtime-service and wrap all four results in `workshop-checker-v1.34`. [VERIFIED: 239-CONTEXT.md] |
| Missing runtime-service URL | TypeScript/Rust/Zig return a fabricated invalid `TRANSPILE_FAILED` validation report. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:13] | Must map to `runtime_service_unavailable`, not invalid source. [VERIFIED: 239-CONTEXT.md] |
| Runtime-service response handling | Validate route casts JSON to `{ validation?: unknown }` and returns `result.validation`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:42] | Must schema-validate and normalize before returning to UI. [VERIFIED: 239-CONTEXT.md] |
| Workshop submit route | Calls runtime-service for all four production formats before saving, then passes runtime, validation, engine compatibility, metadata, and `runtimeServiceValidated: true` to `workshopServer.submitSource`. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:71] [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:33] | Validate source should reuse equivalent provider semantics but should not make submit non-authoritative. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Runtime-service success | `/validate-strategy` returns provider id/contract/runtime ABI posture, runtime, validation, engine compatibility, metadata, source hash, and source bytes on success. [VERIFIED: apps/runtime-service/src/server.ts:224] | Normalizer can derive language, owners, source, artifact, provenance, runtime ABI, and provider metadata from success responses. [VERIFIED: apps/runtime-service/src/server.ts:178] |
| Runtime-service invalid provider response | `/validate-strategy` returns `ok:false`, `kind:"strategyValidation"`, `sourceFormat`, and `validation` for validation failures. [VERIFIED: apps/runtime-service/src/server.ts:146] | Normalizer can map invalid source categories, but provider/runtime metadata on invalid failures must come from registry fallback or a small runtime-service addition. [VERIFIED: packages/spec/src/runtime.ts:1149] |
| Runtime-service malformed request/system error on validate | Handler returns `ok:false`, `kind:"strategyValidation"`, and an `error` string on parsing/build exceptions. [VERIFIED: apps/runtime-service/src/server.ts:281] | Route must avoid exposing raw error strings directly; map malformed/unexpected response to `system_unavailable`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Rust/Zig compile/toolchain failures | Compile failures currently use `TRANSPILE_FAILED`; toolchain unavailable is represented by compile failure or version helper text, not a distinct validation code. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:371] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:515] | Phase 239 can map coarse provider issues to `compile_failed` or `toolchain_unavailable`; exact UX taxonomy can be refined in Phase 240. [VERIFIED: .planning/ROADMAP.md] |
| Client state | Workshop client expects `{ validation }` and stores only `StrategyRevisionValidationReport`; status labels are `not-checked`, `checking`, `valid`, `invalid`. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:205] [VERIFIED: apps/web/app/workshop/workshop-client-state.ts:6] | Preserve legacy `validation` during Phase 239 or update client state in the same plan; full UX polish is Phase 240. [VERIFIED: .planning/ROADMAP.md] |
| TinyGo | Supported language registry excludes TinyGo and tests assert TinyGo is not in Workshop editor formats. [VERIFIED: packages/spec/src/spec.test.ts:424] [VERIFIED: apps/web/lib/runtime-labels.test.ts:60] | Do not add TinyGo to checker schema source formats or UI. [VERIFIED: .planning/REQUIREMENTS.md] |

## Files to Touch

| File | Change | Confidence |
| --- | --- | --- |
| `packages/spec/src/types.ts` | Add exported checker contract types: response, diagnostic, categories, status, owner, artifact/provenance/runtime/toolchain/cache/privacy. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | HIGH |
| `packages/spec/src/schemas.ts` | Add zod schemas for checker diagnostics and `WorkshopCheckerResponse`; use `z.strictObject` or current local strict patterns. [CITED: https://zod.dev/v4/changelog?id=drops-nonstrict] [VERIFIED: packages/spec/src/schemas.ts:676] | HIGH |
| `packages/spec/src/spec.test.ts` | Add contract/schema tests for checker response, source formats, privacy exclusions, no TinyGo, and legacy validation compatibility if retained. [VERIFIED: packages/spec/src/spec.test.ts:424] | HIGH |
| `apps/web/app/api/workshop/validate/route.ts` | Replace local Python validation with runtime-service validation; schema-parse runtime-service JSON; return `WorkshopCheckerResponse` plus optional legacy `validation`; map missing/unreachable/malformed runtime-service to unavailable/system states. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:5] | HIGH |
| `apps/web/app/api/workshop/checker-normalization.ts` or `apps/web/app/api/workshop/validate/checker-normalization.ts` | New helper for public-safe normalization/redaction/status/category mapping. [ASSUMED] | MEDIUM |
| `apps/web/app/api/workshop/validate/route.test.ts` | New focused route tests for TypeScript/Python/Rust/Zig success, Python runtime-service parity, missing service unavailable, malformed service system unavailable, invalid provider result, and privacy redaction. [VERIFIED: route tests exist nearby but not for validate route] | HIGH |
| `apps/runtime-service/src/server.ts` | Optional small addition: include `provider` metadata on invalid validation responses so app/API normalizer does not infer from registry only. [VERIFIED: apps/runtime-service/src/server.ts:146] | MEDIUM |
| `apps/runtime-service/src/server.test.ts` | If runtime-service invalid response is expanded, test invalid TypeScript/Python/Rust/Zig responses include provider metadata and do not include raw private paths. [VERIFIED: apps/runtime-service/src/server.test.ts:81] | MEDIUM |
| `apps/web/app/api/workshop/revisions/route.ts` | Optional thin submit public normalization for missing/unreachable runtime-service error wording; keep scope narrow. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:17] | MEDIUM |
| `apps/web/app/workshop/workshop-client.tsx` and `workshop-client-state.ts` | Only touch if planner chooses to consume new envelope immediately; otherwise keep legacy validation field and defer richer UI to Phase 240. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:205] [VERIFIED: .planning/ROADMAP.md] | MEDIUM |

## Recommended Architecture Patterns

### Data Flow

```text
Workshop editor
  -> POST /api/workshop/validate
  -> validate request source/sourceFormat
  -> runtime-service /validate-strategy for TypeScript, Python, Rust, Zig
      -> provider validator/build helper
      -> provider response
  -> app/API schema parse + public-safe normalizer
  -> workshop-checker-v1.34 envelope (+ legacy validation during transition)
  -> Workshop UI state
```

This flow keeps provider-grade validation behind runtime-service and keeps Workshop-specific envelope semantics in app/API. [VERIFIED: 239-CONTEXT.md]

### Pattern 1: Shared Schema First

**What:** Define checker response schemas in `@cowards/spec`, export them through `packages/spec/src/index.ts`, and use `safeParse` in the route before trusting runtime-service JSON. [VERIFIED: packages/spec/src/index.ts:1] [CITED: https://zod.dev/v4]

**When to use:** Use for every response crossing runtime-service to app/API and app/API to browser. [VERIFIED: AGENTS.md]

**Example:**

```ts
const parsed = RuntimeServiceStrategyValidationResponseSchema.safeParse(raw)
if (!parsed.success) {
  return buildSystemUnavailableChecker({ sourceFormat, source })
}
return normalizeProviderValidation(parsed.data, { sourceFormat, source })
```

### Pattern 2: Normalize to Contract, Preserve Legacy Field

**What:** Return the new checker envelope as the primary response and include `validation: checker.validationReport` or equivalent compatibility field until client state moves to checker status. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:205]

**When to use:** Use in Phase 239 if full UI state migration is deferred to Phase 240. [VERIFIED: .planning/ROADMAP.md]

### Pattern 3: Registry-Derived Metadata on Failure

**What:** For invalid provider responses that lack full runtime metadata, derive public language/provider/owner/runtime ABI fields from `getSupportedStrategyLanguageBySourceFormat` and `getStrategyLanguageProviderRecord`. [VERIFIED: packages/spec/src/runtime.ts:1149] [VERIFIED: packages/spec/src/runtime.ts:1156]

**When to use:** Use when runtime-service returns `ok:false` with `validation` only. [VERIFIED: apps/runtime-service/src/server.ts:146]

### Anti-Patterns to Avoid

- **Returning raw runtime-service JSON to the browser:** The current route casts and returns `result.validation`; Phase 239 requires schema validation and public-safe normalization. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:42] [VERIFIED: 239-CONTEXT.md]
- **Classifying infrastructure failures as invalid Strategy source:** Missing runtime-service must become unavailable/system, not `TRANSPILE_FAILED`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:13] [VERIFIED: 239-CONTEXT.md]
- **Moving checker UX envelope into runtime-service:** Runtime-service remains provider-focused and should not own Workshop-specific response shape. [VERIFIED: 239-CONTEXT.md]
- **Adding TinyGo to production checker surfaces:** TinyGo remains spike-only/hidden. [VERIFIED: .planning/REQUIREMENTS.md]
- **Adding broad Go account-save cleanup:** Known TypeScript account-save provider-proof mismatch is deferred unless it blocks checker parity. [VERIFIED: 239-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| Runtime schema validation | Ad hoc property checks for nested checker/runtime-service envelopes. [ASSUMED] | Zod schemas in `@cowards/spec`. [VERIFIED: packages/spec/src/schemas.ts:676] | Existing contracts already use zod and schemas are exported through `@cowards/spec`. [VERIFIED: packages/spec/src/index.ts:10] |
| Provider metadata | Duplicated hard-coded provider ids in the route. [ASSUMED] | `getSupportedStrategyLanguageBySourceFormat` and `getStrategyLanguageProviderRecord`. [VERIFIED: packages/spec/src/runtime.ts:1149] | Registry already contains provider id, contract version, runtime ABI version, owners, and privacy/boundary notes. [VERIFIED: packages/spec/src/runtime.ts:569] |
| Python validation | Local Workshop validation for checker parity. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:81] | Runtime-service `/validate-strategy`. [VERIFIED: apps/runtime-service/src/server.ts:121] | Submit already requires runtime-service provider validation for Python. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts:71] |
| Rust/Zig compile/toolchain detection | Web/API compilation or local React checks. [ASSUMED] | Runtime-service provider validators in `@cowards/runtime-wasm-wasi`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:332] | Compile/build behavior must remain behind provider/runtime-service boundary. [VERIFIED: AGENTS.md] |
| Public privacy scans | Grepping only UI strings. [ASSUMED] | Contract tests asserting excluded fields and JSON output absence for source, `bytesBase64`, raw diagnostics, host paths, env, tokens, and private internals. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Checker contract explicitly defines excluded fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Common Pitfalls

### Pitfall 1: Invalid vs Unavailable Collapse

**What goes wrong:** Missing `COWARDS_RUNTIME_SERVICE_URL`, stopped service, bad JSON, or malformed response is shown as an invalid Strategy. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:13]
**Why it happens:** Current route fabricates a validation report with `TRANSPILE_FAILED`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:20]
**How to avoid:** Map no endpoint/transport to `runtime_service_unavailable`, malformed response to `system_unavailable`, and missing compiler evidence to `toolchain_unavailable` where detectable. [VERIFIED: 239-CONTEXT.md]

### Pitfall 2: Public Contract Leaks Internal Artifacts

**What goes wrong:** Runtime-service success metadata can contain `bytesBase64` for source artifacts or compiled WASM artifacts. [VERIFIED: packages/runtime-python/src/validation.ts:43] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:416]
**Why it happens:** Provider metadata is internal proof data, but Workshop checker output is public/default. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**How to avoid:** Explicitly construct public `artifact.hash`, `artifact.bytes`, and state fields; never spread runtime-service `metadata`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

### Pitfall 3: Source Hash Is Blank on Unavailable Results

**What goes wrong:** Current missing-service synthetic report sets `sourceHash: ""`, but existing schema requires non-empty source hash. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:28] [VERIFIED: packages/spec/src/schemas.ts:683]
**How to avoid:** Compute source hash in app/API for unavailable checker envelopes or avoid reusing `StrategyRevisionValidationReportSchema` for unavailable state. [ASSUMED]

### Pitfall 4: Rust/Zig Toolchain Is Slow or Locally Absent

**What goes wrong:** Rust and Zig validation compiles source through local toolchains and can take 10-30 seconds per call. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:367] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:511]
**How to avoid:** Phase 239 should add focused tests with mocked/stub runtime-service for route behavior, and reserve live Rust/Zig compile proof for narrow runtime-service tests or later Phase 242. [VERIFIED: .planning/ROADMAP.md]

### Pitfall 5: TypeScript Account-Save Mismatch Becomes Scope Creep

**What goes wrong:** Planner tries to require Go account-save provider proof for TypeScript in Phase 239. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md]
**How to avoid:** Document mismatch if left unresolved; only add thin public category normalization if needed for checker consistency. [VERIFIED: 239-CONTEXT.md]

## Code Examples

### Route-Level Fallback Shape

```ts
// Source: apps/web/app/api/workshop/validate/route.ts and v1.34 contract
if (!endpoint) {
  return Response.json(
    buildWorkshopCheckerUnavailable({
      sourceFormat,
      source,
      status: "runtime_service_unavailable",
      publicReason: "Runtime-service validation is unavailable; retry after services are running.",
    }),
    { status: 200 },
  )
}
```

This preserves preflight guidance without judging source invalid when infrastructure is missing. [VERIFIED: 239-CONTEXT.md]

### Provider Metadata Derivation

```ts
// Source: packages/spec/src/runtime.ts
const language = getSupportedStrategyLanguageBySourceFormat(sourceFormat)
const provider = getStrategyLanguageProviderRecord(language?.id)
```

These helpers already provide language labels and provider contract/runtime ABI metadata. [VERIFIED: packages/spec/src/runtime.ts:1149] [VERIFIED: packages/spec/src/runtime.ts:1156]

## State of the Art

| Old Approach | Current Required Approach | Changed By | Impact |
| --- | --- | --- | --- |
| Python Validate source uses local Workshop validation. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:81] | Python Validate source uses runtime-service provider semantics. [VERIFIED: .planning/REQUIREMENTS.md] | v1.34 CHECKVAL-02 [VERIFIED: .planning/REQUIREMENTS.md] | Python checker behavior should match submit/save provider policy. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md] |
| Validate source returns `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:78] | Validate source returns `workshop-checker-v1.34` public envelope. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Phase 238 contract [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Client/API can distinguish ready, invalid, unavailable, stale, and system/toolchain states. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Rust/Zig unavailable/toolchain/compile failures collapse into coarse validation. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md] | Checker status and diagnostics preserve unavailable/toolchain/artifact/provenance categories. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | v1.34 contract [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Users get public-safe actionability without raw compiler/runtime output. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Validation Architecture

### Test Framework

| Property | Value |
| --- | --- |
| Framework | Vitest installed `4.1.6`; latest npm `4.1.8`. [VERIFIED: pnpm list] [VERIFIED: npm registry] |
| Config file | Root `vitest.config.ts`; app-level `apps/web/vitest.config.ts`. [VERIFIED: rg --files] |
| Quick run command | `pnpm --filter @cowards/spec test -- spec.test.ts`; `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts`; `pnpm --filter @cowards/runtime-service test -- server.test.ts` [VERIFIED: package.json] [CITED: https://github.com/vitest-dev/vitest/blob/main/docs/guide/filtering.md] |
| Full suite command | `pnpm test` or package-specific `pnpm --filter @cowards/web test` / `pnpm --filter @cowards/runtime-service test`; do not run as part of research. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
| --- | --- | --- | --- | --- |
| CHECKVAL-01 | TypeScript Validate returns ready/invalid checker envelope from provider response and no raw artifact bytes. [VERIFIED: .planning/REQUIREMENTS.md] | route integration with mocked runtime-service | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts -t TypeScript` | No, add in Wave 0. [VERIFIED: rg] |
| CHECKVAL-02 | Python Validate calls runtime-service and does not fall back to local Workshop validation. [VERIFIED: .planning/REQUIREMENTS.md] | route integration with mocked runtime-service | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts -t Python` | No, add in Wave 0. [VERIFIED: rg] |
| CHECKVAL-03 | Rust Validate maps success, invalid compile/import, unavailable runtime-service, and toolchain unavailable categories. [VERIFIED: .planning/REQUIREMENTS.md] | route integration plus optional runtime-service unit | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts -t Rust` | No, add in Wave 0. [VERIFIED: rg] |
| CHECKVAL-04 | Zig Validate maps success, invalid compile/import/no-std/helper, unavailable runtime-service, and toolchain unavailable categories. [VERIFIED: .planning/REQUIREMENTS.md] | route integration plus optional runtime-service unit | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts -t Zig` | No, add in Wave 0. [VERIFIED: rg] |
| CHECKVAL-05 | Validate and thin submit/save errors use consistent public categories and no fallback. [VERIFIED: .planning/REQUIREMENTS.md] | focused route/unit tests | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts app/api/workshop/revisions/route.test.ts` | Validate route test missing; revisions route test missing. [VERIFIED: rg] |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/spec test -- spec.test.ts` for schema changes, then the relevant package-specific route/service test file. [VERIFIED: package.json]
- **Per wave merge:** `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts app/workshop/workshop-client.test.tsx` and `pnpm --filter @cowards/runtime-service test -- server.test.ts` if runtime-service changes. [VERIFIED: package.json]
- **Phase gate:** `pnpm typecheck` plus focused tests above; defer large `pnpm test` and service-backed E2E to Phase 242 unless planner explicitly needs it. [VERIFIED: .planning/ROADMAP.md]

### Wave 0 Gaps

- [ ] `apps/web/app/api/workshop/validate/route.test.ts` - covers checker envelope and runtime-service normalization for CHECKVAL-01..04. [VERIFIED: rg]
- [ ] `packages/spec/src/spec.test.ts` additions - covers checker schema, statuses, categories, privacy exclusions, and no TinyGo. [VERIFIED: packages/spec/src/spec.test.ts:424]
- [ ] Optional `apps/runtime-service/src/server.test.ts` additions - covers invalid provider responses if runtime-service metadata is expanded. [VERIFIED: apps/runtime-service/src/server.test.ts:81]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| --- | --- | --- | --- | --- |
| Node.js | TypeScript/Vitest/Next route work | yes [VERIFIED: command probe] | v24.15.0 [VERIFIED: command probe] | none needed |
| pnpm | Workspace scripts | yes [VERIFIED: command probe] | 11.1.2 [VERIFIED: command probe] | none needed |
| Python | Python runtime provider validation | yes [VERIFIED: command probe] | 3.9.6 [VERIFIED: command probe] | mocked route tests if live provider unavailable |
| Rust `rustc` | Rust provider compile validation | yes [VERIFIED: command probe] | 1.95.0 [VERIFIED: command probe] | mocked route tests for checker normalization |
| Zig | Zig provider compile validation | yes [VERIFIED: command probe] | 0.16.0 [VERIFIED: command probe] | mocked route tests for checker normalization |
| Go | Go account save review/optional thin normalization | yes [VERIFIED: command probe] | go1.26.3 [VERIFIED: command probe] | avoid Go changes unless needed |

**Missing dependencies with no fallback:** none detected for Phase 239 research. [VERIFIED: command probe]

**Missing dependencies with fallback:** none detected; route-level tests can mock runtime-service to avoid requiring live Rust/Zig compiles. [VERIFIED: route test inventory]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
| --- | --- | --- |
| V2 Authentication | no direct checker auth change [VERIFIED: phase context] | Preserve existing routes; account save auth is outside checker route. [VERIFIED: apps/web/app/api/account/revisions/save/route.ts:4] |
| V3 Session Management | no direct checker session change [VERIFIED: phase context] | No new session behavior. [VERIFIED: 239-CONTEXT.md] |
| V4 Access Control | yes for public/default privacy boundaries [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Public-safe envelope excludes source, memory, raw diagnostics, private internals, and artifacts. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| V5 Input Validation | yes [VERIFIED: AGENTS.md] | Zod schemas for checker response and runtime-service response parsing. [VERIFIED: packages/spec/src/schemas.ts] |
| V6 Cryptography | yes, only for existing provider proof metadata transport [VERIFIED: apps/runtime-service/src/server.ts:91] | Do not expose signing proof in checker response; runtime-service continues HMAC provider proof internally. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
| --- | --- | --- |
| Hostile Strategy source reaches web/API execution | Elevation of Privilege | Do not execute source in web/API/Go; route only transports to runtime-service provider boundary. [VERIFIED: AGENTS.md] |
| Runtime-service malformed JSON trusted by UI | Tampering | Schema-parse provider responses before normalization. [VERIFIED: 239-CONTEXT.md] |
| Raw compiler/runtime diagnostics leak paths or internals | Information Disclosure | Redact by constructing checker diagnostics from normalized categories only. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Artifact bytes leak in checker payload | Information Disclosure | Never spread `metadata.sourceArtifact` or `metadata.compiledArtifact`; expose only hash/bytes/state. [VERIFIED: packages/spec/src/schemas.ts:740] [VERIFIED: packages/spec/src/schemas.ts:766] |
| Unsupported provider silently falls back to TypeScript/local validation | Tampering | Reject unsupported source formats and do not fallback across languages/providers. [VERIFIED: apps/web/app/api/workshop/validate/route.ts:54] |

## Likely Blockers

1. **Runtime-service invalid responses lack provider metadata.** The normalizer can infer from registry, but if planner wants exact provider echo on invalid responses, runtime-service must add `provider` to `ok:false` validation payloads. [VERIFIED: apps/runtime-service/src/server.ts:146]
2. **Current validation issue code union lacks checker diagnostic categories.** Add separate checker diagnostic category schema instead of overloading `StrategyRevisionValidationCode`. [VERIFIED: packages/spec/src/types.ts:194] [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
3. **Toolchain unavailable is not a first-class provider validation code.** Rust/Zig compile failure currently reports `TRANSPILE_FAILED`; Phase 239 may need heuristic mapping for unavailable toolchain or a provider change. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts:371]
4. **Client still expects `{ validation }`.** Full envelope consumption in UI will touch React state; preserving a legacy `validation` field avoids dragging Phase 240 UX into Phase 239. [VERIFIED: apps/web/app/workshop/workshop-client.tsx:205]
5. **Go TypeScript provider-proof mismatch is real but deferred.** Do not block checker parity on broad Go cleanup; document it in implementation summary if unresolved. [VERIFIED: 239-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
| --- | --- | --- | --- |
| A1 | A new web-local `checker-normalization.ts` helper is the best file split if schema types live in `@cowards/spec`. | Files to Touch | Low; planner may choose a different helper location without changing behavior. |
| A2 | Route-level mocked runtime-service tests are sufficient for Phase 239, with live four-language E2E deferred to Phase 242. | Validation Architecture | Medium; planner may require one live provider smoke for confidence. |
| A3 | Computing source hash in app/API for unavailable checker envelopes is acceptable. | Common Pitfalls | Low; an alternative is to represent unavailable source identity outside legacy validation report. |

## Open Questions

1. **Should checker schemas live in `@cowards/spec` or web-local code?**  
   What we know: the checker contract is public and shared, and existing contracts live in `@cowards/spec`. [VERIFIED: packages/spec/src/schemas.ts]  
   What's unclear: whether future Go/entry tests need to import the checker schema directly. [ASSUMED]  
   Recommendation: put public checker types/schemas in `@cowards/spec`; keep normalization implementation web-local. [ASSUMED]

2. **Should runtime-service add provider metadata to invalid validation responses now?**  
   What we know: success responses include provider metadata; invalid responses currently do not. [VERIFIED: apps/runtime-service/src/server.ts:224] [VERIFIED: apps/runtime-service/src/server.ts:146]  
   What's unclear: whether registry-derived metadata is considered enough for invalid checker envelopes. [ASSUMED]  
   Recommendation: add `provider` to invalid validation responses because it is structured provider metadata, not Workshop UX envelope ownership. [VERIFIED: 239-CONTEXT.md]

3. **How far should submit/save normalization go?**  
   What we know: Phase 239 allows thin submit/save normalization but forbids a broad rewrite. [VERIFIED: 239-CONTEXT.md]  
   What's unclear: whether Workshop submit route error strings must be converted to checker-like categories in this phase. [ASSUMED]  
   Recommendation: normalize only missing runtime-service and provider invalid response categories surfaced by Workshop submit; leave Go account-save TypeScript proof cleanup deferred. [VERIFIED: 239-CONTEXT.md]

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables, testing expectations, runtime boundaries. [VERIFIED: file read]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - milestone scope and constraints. [VERIFIED: file read]
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - locked decisions and deferred scope. [VERIFIED: file read]
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - required checker envelope/status/privacy model. [VERIFIED: file read]
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - current asymmetries and Phase 239 fix set. [VERIFIED: file read]
- `apps/web/app/api/workshop/validate/route.ts`, `apps/web/app/api/workshop/revisions/route.ts`, `apps/runtime-service/src/server.ts`, `packages/spec/src/runtime.ts`, `packages/spec/src/schemas.ts`, runtime provider validation files. [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)

- Context7 Zod docs for Zod 4 `safeParse` and strict object guidance. [CITED: https://zod.dev/v4]
- Context7 Vitest docs for running specific test files and test name filters. [CITED: https://github.com/vitest-dev/vitest/blob/main/docs/guide/filtering.md]
- npm registry version checks for `zod`, `vitest`, and `typescript`. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None; assumptions are isolated in the Assumptions Log. [VERIFIED: this document]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - repo already has zod/spec/runtime-service/Vitest and versions were checked locally and against npm. [VERIFIED: pnpm list] [VERIFIED: npm registry]
- Architecture: HIGH - phase context explicitly assigns checker envelope to `/api/workshop/validate`, runtime-service to provider semantics, and app/API to normalization/redaction. [VERIFIED: 239-CONTEXT.md]
- Pitfalls: HIGH for current route/runtime-service behavior; MEDIUM for exact toolchain-unavailable mapping because current provider code reports coarse `TRANSPILE_FAILED`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]

**Research date:** 2026-06-14 [VERIFIED: system date]
**Valid until:** 2026-07-14 unless v1.34 scope or provider contracts change first. [ASSUMED]
