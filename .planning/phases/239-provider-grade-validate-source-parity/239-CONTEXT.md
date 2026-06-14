# Phase 239: Provider-Grade Validate Source Parity - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 239 implements provider-grade Workshop Validate source parity for TypeScript, Python, Rust, and Zig. The phase should make `/api/workshop/validate` return the Phase 238 public checker contract, route Python through submit-equivalent runtime-service/provider validation, schema-validate and normalize provider responses before exposing them to Workshop, and align thin submit/save public failure categories where needed for consistency. This phase does not rewrite entry, productionize TinyGo, move Strategy execution into web/API/Go, migrate the Rust/Zig ABI, or make new sandbox claims.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Prior Decisions
- `.planning/PROJECT.md` - Current milestone state, hard runtime/language boundaries, and v1.34 target features.
- `.planning/REQUIREMENTS.md` - `CHECKVAL-01..CHECKVAL-05`, v1.34 hard boundaries, and out-of-scope items.
- `.planning/ROADMAP.md` - Phase 239 goal, canonical refs, and success criteria.
- `.planning/STATE.md` - Active resume notes and boundary notes.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - Locked Phase 238 inventory/contract decisions.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Required public checker envelope, status model, diagnostic categories, cache identity, and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - Phase 239 fix set and current Validate/submit/save/entry asymmetries.
- `.planning/milestones/v1.32-REQUIREMENTS.md` - Four-language provider eligibility baseline.
- `.planning/milestones/v1.33-REQUIREMENTS.md` - TypeScript/Python source artifact provenance and TinyGo spike baseline.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - Prior all-language parity evidence.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only evidence and non-promotion context.

### Code Paths
- `apps/web/app/api/workshop/validate/route.ts` - Current Validate source route and natural owner of the public checker envelope.
- `apps/web/app/api/workshop/revisions/route.ts` - Workshop submit/save route and runtime-service provider validation behavior.
- `apps/web/app/workshop/workshop-client-state.ts` - Current draft validation state labels, gating, and display helpers.
- `apps/web/app/workshop/workshop-client.tsx` - Workshop client validate/submit/save flows and stale source handling.
- `apps/web/app/workshop/server.ts` - Local Workshop validation/submission abstraction.
- `apps/runtime-service/src/server.ts` - Runtime-service `/validate-strategy` provider validation and proof metadata.
- `packages/spec/src/runtime.ts` - Supported language/provider registry, provider contract version, runtime ABI posture, and provider boundary semantics.
- `packages/runtime-js/src/validation.ts` - TypeScript validation and transpiled artifact provenance.
- `packages/runtime-python/src/validation.ts` - Python constrained validation and source artifact provenance.
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig compile, toolchain, WASM/WASI import validation, and artifact metadata.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service validation client and current Python/Rust/Zig validation boundaries.
- `apps/go-backend/live_backend.go` - Go account save, provider proof matching, counted eligibility, and known TypeScript account-save gap.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StrategyRevisionValidationReport` and `StrategyRevisionValidationIssue` already carry `valid`, `errors`, `warnings`, `sourceBytes`, `sourceHash`, severity, constraint, remediation, reference, and optional source location fields.
- `getSupportedStrategyLanguageBySourceFormat` and provider records in `packages/spec/src/runtime.ts` provide language labels, provider ids, provider contract versions, runtime ABI posture, and privacy/boundary semantics.
- Runtime-service `/validate-strategy` already validates all four production source formats and returns provider/runtime/validation/metadata/source fields on success.

### Established Patterns
- Workshop Validate source currently returns `{ validation }`, with TypeScript/Rust/Zig calling runtime-service when configured and Python using local Workshop validation.
- Workshop submit calls runtime-service provider validation for TypeScript, Python, Rust, and Zig before creating a Revision.
- Runtime-service success metadata can include source or compiled artifacts internally; public/default checker output must strip artifact bytes and signing proofs.
- Go schema-checks runtime-service behavior before trusting metadata in execution/account contexts; app/API checker responses should similarly treat runtime-service JSON as untrusted.

### Integration Points
- New checker envelope should wrap the current Validate source route rather than moving Workshop UX semantics into runtime-service.
- Python parity requires `/api/workshop/validate` to use runtime-service provider validation, matching submit/save semantics.
- Rust/Zig parity requires compile/toolchain/artifact/provenance states to survive normalization as public categories without exposing raw compiler output or artifact bytes.
- Submit/save normalization should be thin and public-facing: enough for consistent categories, not a broad Go or entry rewrite.

</code_context>

<specifics>
## Specific Ideas

- Treat TypeScript as the practical status/actionability baseline while preserving its provenance-only, non-WASM-isolation claim.
- Validate source should be preflight guidance; submit/save/entry remain authoritative gates and must still fail closed.
- If the Go TypeScript account-save provider-proof mismatch remains after this phase, record it explicitly as deferred rather than hiding it inside implementation notes.

</specifics>

<deferred>
## Deferred Ideas

- Broad Go TypeScript account-save/provider-proof cleanup is deferred unless it directly blocks Workshop checker parity.
- Full entry policy rewrite is deferred; Phase 242 should test entry consistency where scoped.
- Language-specific diagnostic UX polish belongs to Phase 240.
- Rust/Zig debounce/cache/coalescing and boundary monitors belong to Phase 241.
- Four-language service-backed proof, privacy scans, and final audit belong to Phase 242.
- TinyGo production checker support, Go production Strategy runtime work, package ecosystem expansion, ABI migration, and new sandbox claims remain out of scope for v1.34.

</deferred>

---

*Phase: 239-Provider-Grade Validate Source Parity*
*Context gathered: 2026-06-14*
