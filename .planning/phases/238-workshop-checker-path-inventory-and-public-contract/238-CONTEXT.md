# Phase 238: Workshop Checker Path Inventory and Public Contract - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 238 inventories the current Workshop Validate source, submit, save, and entry validation paths for TypeScript, Python, Rust, and Zig, then defines the full shared public-safe checker contract that later phases will implement. This phase is a contract and inventory phase, not the implementation phase for provider parity, diagnostics UX, caching, or service-backed E2E proof.

</domain>

<decisions>
## Implementation Decisions

### Contract Depth
- **D-01:** Phase 238 must produce a full Workshop checker contract before implementation planning, not only a path inventory.
- **D-02:** The contract should define response schema, status model, diagnostic categories, severity/actionability, language/provider metadata, artifact/provenance state, runtime-service/toolchain availability, cache-relevant identity fields, and privacy exclusions.
- **D-03:** The contract should be specific enough that Phase 239 can implement provider-grade Validate source semantics without rediscovering response shape or privacy posture.

### Inventory Proof Depth
- **D-04:** Inventory should use static code mapping plus focused route/probe checks where helpful.
- **D-05:** Deep live tracing across all services is not required in Phase 238 unless static mapping exposes an ambiguity that cannot be resolved otherwise.
- **D-06:** The inventory must still identify the concrete frontend, app/API, Go/API, runtime-service, Runtime Broker, provider/compiler/toolchain, artifact/provenance, cache, and diagnostic boundaries for each language and path.

### Public-Safe Diagnostics
- **D-07:** Default/public Workshop checker output must use normalized public-safe diagnostics only.
- **D-08:** Raw compiler/runtime diagnostics, host paths, env values, package paths, artifact bytes, Strategy source, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, and objective payloads must not appear in default/public checker responses or UI.
- **D-09:** Raw diagnostics may be considered only if an already-existing private/test-only gate safely owns them; Phase 238 should document whether such a gate exists but must not require one.

### Parity Matrix
- **D-10:** Phase 238 must produce an explicit parity matrix comparing Validate source, submit, save, and entry behavior per language.
- **D-11:** The parity matrix must classify every gap as `fix now`, `defer`, or `no change`, with rationale tied to v1.34 scope and hard boundaries.
- **D-12:** The matrix must include TypeScript as the practical baseline and Python/Rust/Zig as the primary parity targets.

### the agent's Discretion
- Planner may choose the exact artifact format for the inventory and parity matrix, but it should be easy for Phase 239+ agents to consume.
- Planner may decide which focused route/probe checks are necessary after reading the code, provided the final artifact explains what was checked and what was intentionally left to later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goal, runtime/language decisions, and active constraints.
- `.planning/REQUIREMENTS.md` - `CHECKINV-01..CHECKINV-04` and v1.34 hard boundaries.
- `.planning/ROADMAP.md` - Phase 238 goal, canonical refs, and success criteria.
- `.planning/STATE.md` - v1.34 resume notes and active boundary notes.
- `.planning/research/SUMMARY.md` - Current language/runtime research baseline.
- `.planning/milestones/v1.33-REQUIREMENTS.md` - Source artifact provenance and TinyGo spike baseline.
- `.planning/milestones/v1.33-ROADMAP.md` - v1.33 phase outcomes and proof expectations.

### Product and Architecture Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical game terminology and product constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Service/runtime architecture baseline.

### Existing Workshop and API Paths
- `apps/web/app/workshop/workshop-client.tsx` - Workshop client state, manual Validate source button, 500ms dirty-source auto-validation, submit/save buttons, and language selector.
- `apps/web/app/workshop/workshop-client-state.ts` - Current checker state labels and submit gating helpers.
- `apps/web/app/api/workshop/validate/route.ts` - Current Workshop Validate source route and runtime-service validation integration point.
- `apps/web/app/api/workshop/revisions/route.ts` - Workshop revision submit/save API behavior and runtime-service validation integration point.
- `apps/web/app/workshop/server.ts` - Workshop server abstraction for validate and submit behavior.
- `apps/web/app/api/account/revisions/save/route.ts` - Account save API path used by signed-in proof flows.
- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` - Competition/trial ladder entry API path.
- `apps/web/app/competitive/server.ts` - Competition entry server behavior.

### Runtime-Service and Provider Validation
- `apps/runtime-service/src/server.ts` - `/validate-strategy` provider validation, provider proof creation, and runtime metadata output.
- `apps/go-backend/live_backend.go` - Go account revision creation, runtime-service validation usage, local TypeScript validation fallback, and provider validation matching.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service validation client and failure taxonomy.
- `packages/runtime-js/src/validation.ts` - TypeScript/JS validation diagnostics and source policy.
- `packages/runtime-python/src/validation.ts` - Python constrained provider validation, validation host, and source artifact provenance.
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig compile, WASM/WASI import validation, artifact creation, and toolchain detection.
- `packages/spec/src/runtime.ts` - Supported language/provider registry, provider contract posture, labels, and runtime semantics.

### Prior Evidence
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - Previous all-language parity evidence.
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md` - Prior service-backed all-language proof baseline.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only non-promotion evidence.
- `.planning/artifacts/v1.18-python-validation-diagnostics.json` - Earlier Python validation diagnostic evidence.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StrategyRevisionValidationReport` already carries `valid`, `errors`, `warnings`, `sourceBytes`, `forbiddenPatterns`, `sourceHash`, `runtimeVersion`, and `engineCompatibility`; the new checker contract can either wrap or extend this shape.
- `StrategyRevisionValidationIssue` already has public-safe guidance fields such as `constraint`, `remediation`, `reference`, `pattern`, `line`, and `column`.
- `apps/web/app/workshop/workshop-client-state.ts` centralizes current checker labels and submit gating and is the natural place to add richer checker states later.
- Runtime-service `/validate-strategy` already returns provider metadata, runtime, validation, engine compatibility, metadata, source hash, and source bytes for successful validation.

### Established Patterns
- Workshop client keeps a validation result tied to `validationSource` and `validationSourceFormat`; stale status is inferred by mismatch.
- Workshop currently auto-validates dirty source after 500ms and also exposes a manual Validate source button.
- Public/default UI uses validation issue headings and guidance rather than raw compiler/runtime output.
- Go treats runtime-service responses as untrusted and schema/contract checks them before using metadata.
- Provider validation proof binds provider id, contract version, source hash/bytes, artifact hash/bytes, and signing proof for provider-backed counted eligibility.

### Integration Points
- Validate source path: `apps/web/app/workshop/workshop-client.tsx` -> `/api/workshop/validate` -> `apps/web/app/api/workshop/validate/route.ts` -> local Workshop validation and/or runtime-service `/validate-strategy`.
- Submit/save path: Workshop client -> `/api/workshop/revisions` or account save route -> Workshop server or Go backend -> runtime-service/provider validation for Python/Rust/Zig and provenance matching for counted eligibility.
- Runtime-service path: `/validate-strategy` dispatches to TypeScript, Python, Rust, or Zig provider validation/build helpers and emits provider proof metadata.
- Entry path: competition/trial ladder entry consumes saved Strategy Revisions and counted provider eligibility; Phase 238 should inventory the exact current gate rather than changing it.

### Current Asymmetries To Inventory
- `apps/web/app/api/workshop/validate/route.ts` appears to route TypeScript/Rust/Zig through runtime-service when available, while Python may currently fall back to local Workshop validation; Phase 238 should verify and document this precisely.
- `apps/go-backend/runtime_service_client.go` validation currently rejects TypeScript and allows Python/Rust/Zig only; Phase 238 should decide how the checker contract describes TypeScript parity without moving runtime ownership.
- Go `createStrategyRevision` uses runtime-service validation for Python/Rust/Zig, while TypeScript still uses local source metadata validation unless artifact matching applies; Phase 238 should map this as an intentional baseline or a gap.
- Rust/Zig validation has toolchain and compile cost implications; Phase 238 should identify the contract fields needed by later caching/debounce work but should not implement those ergonomics.

</code_context>

<specifics>
## Specific Ideas

The contract should support these language-specific public-safe diagnostic families:
- Python: policy/capability, forbidden import, package/dependency, syntax/build, provenance, runtime-service unavailable, timeout/limit, invalid output/schema.
- Rust: compile, artifact/provenance, forbidden WASI/import, runtime-service, toolchain unavailable, timeout/limit, invalid output/schema.
- Zig: compile, artifact/provenance, forbidden WASI/import, no-std/helper misuse, runtime-service, toolchain unavailable, timeout/limit, invalid output/schema.

The inventory/parity matrix should explicitly compare:
- Validate source.
- Workshop submit/save.
- Account save where distinct.
- Competition/trial ladder entry.

</specifics>

<deferred>
## Deferred Ideas

- Implementing provider-grade Validate source parity belongs to Phase 239.
- Implementing language-specific diagnostic UX belongs to Phase 240.
- Implementing Rust/Zig debounce/caching/coalescing and boundary monitors belongs to Phase 241.
- Service-backed four-language E2E proof, privacy scans, and final audit belong to Phase 242.
- TinyGo production checker support, Go production Strategy runtime work, package ecosystem expansion, ABI migration, and new sandbox claims remain out of scope for v1.34.

</deferred>

---

*Phase: 238-Workshop Checker Path Inventory and Public Contract*
*Context gathered: 2026-06-01*
