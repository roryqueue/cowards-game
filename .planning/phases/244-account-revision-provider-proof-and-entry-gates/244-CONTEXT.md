# Phase 244: Account Revision Provider-Proof and Entry Gates - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 244 makes account-owned Strategy Revision save and entry readiness honest across Go, persistence, and provider/runtime-service boundaries. It must close the current TypeScript account-save/provider-proof drift, require current provider-grade proof whenever a revision is execution-ready or entry-eligible, and make any allowed non-execution draft storage visibly non-ready and non-eligible.

This phase owns account-save provider proof and entry eligibility parity only. It must not change runtime ownership, execute Strategy code in web/API/Go, broaden package support, certify a production sandbox, expose private diagnostics/source/artifacts, or take over Phase 245 owner-debug/auth alias cleanup, Phase 246 sandbox labels, Phase 247 package policy, or Phase 248 final proof scans.

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and Milestone Scope
- `.planning/PROJECT.md` - Current v1.35 milestone intent, hard boundaries, and active decisions.
- `.planning/REQUIREMENTS.md` - ACCT-01 through ACCT-05 and ENTRY-01 through ENTRY-04 requirements.
- `.planning/ROADMAP.md` - Phase 244 goal, dependency on Phase 243, success criteria, and downstream phase split.
- `.planning/STATE.md` - Active milestone state and current Phase 244 pointer.

### Phase 243 Inputs
- `.planning/phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md` - Locked inventory decisions and handoff boundaries.
- `.planning/artifacts/v1.35-boundary-surface-inventory.md` - Authoritative v1.35 boundary inventory and decision register; Phase 244 rows are `v135-account-save-go-typescript-proof`, `v135-competition-entry-go-persistence-proof`, and `v135-provider-proof-runtime-service-contract`.
- `.planning/artifacts/v1.35-boundary-surface-inventory.json` - Machine-readable inventory consumed by monitors.
- `.planning/phases/243-boundary-surface-inventory-and-contract-lock/243-SECURITY.md` - Phase 243 threat verification and accepted monitor-runtime risk.

### Provider Proof and Checker Baselines
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Public-safe checker/provider proof response contract and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-proof.md` - Four-language service-backed checker proof baseline.
- `.planning/artifacts/v1.32-language-surface-inventory.md` - Supported language and provider surface baseline.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - Four-language provider and counted eligibility evidence.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only/defer evidence.

### Canonical Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical terminology, Strategy Revision ownership, immutability, replay privacy, package and sandbox expectations.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Runtime boundary, account/persistence architecture, validation, and package-boundary architecture.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/api/account/revisions/save/route.ts` and `apps/web/lib/account-revision-write-boundary.ts` - Web account save remains a thin transport to selected Go backend and already rejects unsupported source formats before forwarding.
- `apps/go-backend/live_backend.go#createStrategyRevision` - Go account save defaults to TypeScript, validates Python/Rust/Zig through runtime-service, applies submitted Starter/Advanced artifacts, and currently lets TypeScript save without provider proof.
- `apps/go-backend/runtime_service_client.go#validateStrategy` - Go runtime-service validation client posts to `/validate-strategy`, bounds response bytes, checks source identity on successful validation, and currently rejects TypeScript as unsupported client-side.
- `apps/go-backend/live_backend.go#runtimeAllowsCountedPlay` and `#runtimeAllowsNonCountedExhibition` - Go entry gates check registered runtime metadata, package mode `none`, required capabilities, and provider proof for Python/Rust/Zig, but TypeScript currently passes counted eligibility without source-artifact provider proof.
- `packages/persistence/src/competition.ts#runtimeAllowsCountedPlay` - Persistence reference requires TypeScript, Python, Rust, and Zig provider validation/provenance for counted exhibition entry.
- `packages/persistence/src/ladder.ts#assertLadderEligibleRuntime` - Ladder entry uses the same stricter provider-proof pattern for TypeScript/Python/Rust/Zig.
- `packages/persistence/src/account-revisions.ts#provenanceAwareRuntimeSemantics` - Account read models already downgrade counted eligibility when supported-language proof is missing or mismatched.
- `packages/spec/src/runtime.ts` - Runtime registry, counted eligibility, package mode, public semantics, and language/provider metadata.
- `packages/spec/src/workshop-checker.ts` - Public-safe provider proof states and diagnostic vocabulary.
- `scripts/check-boundary-monitors.ts` - Existing monitor hub for runtime/ownership/privacy drift; Phase 244 should extend this pattern if it adds provider-proof or entry parity monitors.

### Established Patterns
- Web/API routes should transport authenticated requests and schemas; hostile Strategy validation must stay behind runtime-service / Runtime Broker / provider boundaries.
- Runtime-service validation success must bind source hash/bytes and provider metadata before Go or persistence can treat a revision as ready.
- Public/default DTOs expose readiness labels and public-safe errors, not raw provider proof, signatures, artifact bytes, source, logs, host paths, or private runtime internals.
- Persistence competition and ladder gates already model provider-proof-backed counted eligibility; Go should converge on that model.
- Invalid or unavailable validation states should be represented as validation/readiness states, not silently promoted by language name.

### Integration Points
- Account save path: `apps/web/app/api/account/revisions/save/route.ts` -> `apps/web/lib/account-revision-write-boundary.ts` -> `apps/go-backend/live_backend.go#createStrategyRevision` -> PostgreSQL account revision rows.
- Runtime validation path: `apps/go-backend/runtime_service_client.go#validateStrategy` -> `apps/runtime-service/src/server.ts` `/validate-strategy` -> language providers.
- Entry path: `apps/web/app/api/exhibitions/route.ts` and ladder/competition routes -> Go exhibition creation or persistence services -> Strategy Revision runtime/metadata checks.
- Account/public labels: persistence account read semantics, public Strategy pages, MatchSet/result/replay evidence, and developer proof artifacts.

</code_context>

<specifics>
## Specific Ideas

- Treat provider proof as a readiness gate, not a sandbox claim.
- Prefer fail-closed execution readiness over ambiguous save success when runtime-service proof cannot be obtained.
- If drafts remain possible, use explicit labels such as non-execution draft / not entry eligible; avoid words that imply the revision can run or enter competition.
- Add negative tests for stale/missing/mismatched proof, unsupported provider, hidden TinyGo, non-`none` package mode, malformed runtime-service response, and unavailable runtime-service.

</specifics>

<deferred>
## Deferred Ideas

- Phase 245 owns owner-debug/private replay authorization, `player:workshop-local` quarantine, account-owned source read authorization proof, and Workshop compatibility alias fate.
- Phase 246 owns sandbox-readiness and certification label contracts.
- Phase 247 owns package/dependency ecosystem policy beyond enforcing the current `none` boundary.
- Phase 248 owns final service-backed proof, expanded privacy scans, and full boundary monitor aggregation.

</deferred>

---

*Phase: 244-Account Revision Provider-Proof and Entry Gates*
*Context gathered: 2026-06-14*
