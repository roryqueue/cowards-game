# Phase 224: StrategyLanguageProvider Runtime Contract - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 224 defines the runtime/provider contract and ABI posture that all four languages must use. It may version or migrate execution contracts if needed, but it should not complete individual Python/Rust/Zig production promotion.

</domain>

<decisions>
## Implementation Decisions

### Provider Contract
- **D-01:** Define a `StrategyLanguageProvider` contract, or equivalent, that covers validation, build/compile, artifact packaging, runtime adapter selection, execution compatibility, counted eligibility, public labels, private diagnostics, and evidence requirements.
- **D-02:** Runtime-service / Runtime Broker remains the boundary for provider-owned validation and execution. Web/API/Go may request provider operations but must not execute hostile Strategy code.
- **D-03:** Provider outputs must distinguish Strategy failure from system failure and cross all trust boundaries through schemas.

### ABI Decision
- **D-04:** Default assumption: keep WASI Preview 1 stdin/stdout JSON active for Rust/Zig unless Phase 224 proves that a migration is necessary and safe.
- **D-05:** Any ABI, service contract, DTO, or Match execution contract change must include versioning or migration notes, rollback expectations, tests, and public privacy proof.

### The Agent's Discretion
- Decide the exact TypeScript interface shape and version names during planning. Favor compatibility with existing runtime metadata and broker registry.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PROV-01..PROV-05`.
- `.planning/ROADMAP.md` - Phase 224 goal and success criteria.
- `.planning/phases/223-unified-supported-language-registry-and-eligibility-model/223-CONTEXT.md` - Registry/model decisions.

### Code
- `packages/spec/src/runtime.ts` - Runtime ABI, metadata, adapter records, product validation, broker registry.
- `packages/spec/src/runtime-execution-service.ts` - Strategy Execution Service / Runtime Broker contract.
- `apps/runtime-service/src/server.ts` - Runtime-service HTTP surface.
- `apps/runtime-service/src/execute-match.ts` - Match execution through runtime-service.
- `apps/runtime-service/src/runtime-config.ts` - Runtime configuration.
- `apps/runtime-service/src/redaction.ts` - Runtime diagnostic redaction.
- `apps/go-backend/runtime_service_client.go` - Go client boundary.

### Evidence
- `.planning/artifacts/v1.24-direct-export-abi-proof.md` - Direct export candidate evidence.
- `.planning/artifacts/v1.24-component-model-wit-proof.md` - Component Model/WIT candidate evidence.
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md` - App-facing contract baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RUNTIME_EXECUTION_SERVICE_BOUNDARY_CONTRACT` already states future broker readiness.
- Runtime envelopes and failure codes already exist in `packages/spec/src/runtime.ts`.

### Established Patterns
- Contract changes are strongest when represented in `packages/spec` and guarded by tests/monitors.
- Runtime diagnostics need redaction before any public projection.

### Integration Points
- Runtime-service validation endpoint for Rust/Zig exists today and should become provider-owned.
- Go runtime-service client should not learn language-specific internals.

</code_context>

<specifics>
## Specific Ideas

The provider contract should make ABI status obvious to readers. If Preview 1 remains active, say that deliberately in code/docs/proof rather than inheriting it accidentally.

</specifics>

<deferred>
## Deferred Ideas

Direct exports and Component Model/WIT promotion are deferred unless Phase 224 proves migration is necessary for v1.32.

</deferred>

---

*Phase: 224-StrategyLanguageProvider Runtime Contract*
*Context gathered: 2026-05-31*
