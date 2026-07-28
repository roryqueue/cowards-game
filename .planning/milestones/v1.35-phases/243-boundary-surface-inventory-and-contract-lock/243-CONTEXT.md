# Phase 243: Boundary Surface Inventory and Contract Lock - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 243 delivers the authoritative v1.35 surface inventory and decision register before any account/provider-proof, owner-debug, alias, sandbox-label, package-policy, or proof-gate behavior changes. It should locate and classify every affected surface, identify current owner and trust boundary, record privacy class and required tests, and lock which surfaces are fix-now, quarantine, deprecate/remove, document-only, or future.

This phase may add characterization tests, inventory scripts, and planning/proof artifacts. It should not yet implement the Phase 244 provider-proof cleanup, Phase 245 authorization changes, Phase 246 label contract, Phase 247 package enforcement, or Phase 248 service-backed proof.

</domain>

<decisions>
## Implementation Decisions

### Inventory Scope
- **D-01:** Inventory must cover every requirement named in `INV-01`: account save, account-owned revision/source reads, owner-debug/private replay, Workshop compatibility aliases, competition entry, Go-owned read/write surfaces, provider-proof surfaces, sandbox-claim surfaces, package/dependency surfaces, TinyGo visibility, and privacy monitors.
- **D-02:** Inventory must include both TypeScript/web/persistence surfaces and Go-owned surfaces. The main known drift is Go TypeScript account save versus runtime-service provider proof, but Phase 243 should not assume that is the only drift.
- **D-03:** Inventory must include current evidence/proof artifacts and boundary monitors, not only product routes. The goal is a route/code/artifact/test matrix that Phase 244-248 can execute against without rediscovering scope.

### Decision Register Shape
- **D-04:** Each surface should be classified as exactly one of: `fix-now`, `quarantine`, `deprecate-remove`, `document-only`, or `future`.
- **D-05:** Each row should record current owner, intended owner, trust boundary, public/private data class, affected requirement IDs, current behavior, desired v1.35 disposition, required tests/proof, privacy risks, and downstream phase.
- **D-06:** Behavior changes are out of scope except safe characterization and inventory checks. If the inventory finds a serious leak or execution-boundary violation, record it as a blocking finding for Phase 244/245/248 rather than silently fixing it inside Phase 243.

### Compatibility and Alias Handling
- **D-07:** Legacy Workshop source/submit/save aliases should be inventoried by route path and caller. Phase 243 should recommend remove, hidden/local-only, migrate, or deprecated-with-tests, but implementation belongs to Phase 245 unless a route is already unused and a characterization test is needed.
- **D-08:** Retained aliases must be treated as potential bypasses until proven otherwise. The inventory should explicitly ask whether each alias bypasses provider proof, account authorization, package policy, TinyGo hiding, or public/default privacy rules.

### Privacy and Claim Calibration
- **D-09:** Every public/default output surface should be scanned against the v1.35 forbidden-marker set: raw diagnostics, Strategy source, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, owner-debug payloads, raw Awareness Grids, quarantine details, operator action details, and recovery payloads.
- **D-10:** Sandbox-readiness claims must stay claim-calibrated in the inventory: TypeScript/Python are provenance-only, Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed, TinyGo is spike-only/hidden, and no current lane is production sandbox certified by default.
- **D-11:** Package/dependency policy must be inventoried as an enforced boundary, not just documentation. Current production policy is package mode `none` with no rich packages or host imports.

### Auto-Selected Discussion Areas
- **D-12:** Auto mode selected all meaningful Phase 243 gray areas: inventory scope, row taxonomy, compatibility alias disposition, privacy/claim calibration, and handoff boundaries. Recommended defaults were selected because they match v1.35 research and the approved roadmap.

### the agent's Discretion
The planner may choose the exact artifact filenames, table format, and inventory script structure, as long as downstream phases get a single authoritative inventory plus a decision register that maps all Phase 243 requirements and v1.35 affected surfaces.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and Milestone Scope
- `.planning/PROJECT.md` - Current milestone intent, hard boundaries, key decisions, and v1.35 active scope.
- `.planning/REQUIREMENTS.md` - v1.35 requirements, hard boundaries, traceability, and out-of-scope list.
- `.planning/ROADMAP.md` - Phase 243 goal, success criteria, dependencies, and downstream phase shape.
- `.planning/STATE.md` - Active milestone state and current Phase 243 pointer.

### Research Baseline
- `.planning/research/SUMMARY.md` - v1.35 research synthesis and suggested Phase 243-248 structure.
- `.planning/research/FEATURES.md` - Implementation-ready requirement candidate groups and inventory targets.
- `.planning/research/ARCHITECTURE.md` - Current Go/runtime-service/web/persistence boundaries and affected components.
- `.planning/research/PITFALLS.md` - Phase-specific risks, warning signs, and phase mapping.
- `.planning/research/STACK.md` - No-new-stack guidance and recommended v1.35 proof/monitor approach.

### Prior Evidence and Contracts
- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - Latest Workshop checker/account/entry/provider-proof inventory baseline.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Public-safe checker envelope and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-proof.md` - Four-language service-backed checker proof baseline.
- `.planning/artifacts/v1.32-language-surface-inventory.md` - Supported language surface baseline.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - Four-language provider and parity evidence.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - Readiness evidence and no-certification posture.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only/defer evidence.

### Canonical Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical terminology, Strategy Revision ownership, replay/debug/privacy, package and sandbox expectations.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Pure engine, runtime boundary, account/persistence, worker/runtime sandbox, validation, and package-boundary architecture.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/go-backend/live_backend.go` - Go routes include account revision list/create/source, exhibition creation, public replay evidence, and public reads. `createStrategyRevision` already runtime-service validates Python/Rust/Zig, while TypeScript defaults to local save behavior.
- `apps/go-backend/runtime_service_client.go` - `validateStrategy` is the key Go runtime-service client and currently only accepts Python/Rust/Zig source formats. It is the main known Phase 244 target, but Phase 243 should inventory it rather than change it.
- `apps/web/lib/account-revision-write-boundary.ts` and `apps/web/app/api/account/revisions/save/route.ts` - Web account save forwards source and `sourceFormat` to selected Go backend and should stay a transport boundary, not proof logic.
- `apps/web/app/api/account/revisions/[revisionId]/source/route.ts` - Account source read uses selected Go backend and private/no-store text response.
- `apps/web/app/api/workshop/source/route.ts` and `apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts` - Legacy Workshop source aliases to classify for Phase 245.
- `apps/web/app/workshop/workshop-client-state.ts` - Defines `LOCAL_WORKSHOP_PLAYER_ID = "player:workshop-local"` and owner replay links for local Workshop tests.
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts` and `apps/web/app/matches/server.test.ts` - Owner-debug request parsing and existing tests for server-side authorization and public fallback behavior.
- `packages/spec/src/runtime.ts` - Canonical language/provider/runtime/package metadata, compatibility keys, isolation promotion state, and package mode.
- `packages/spec/src/workshop-checker.ts` - Public-safe diagnostic categories, provider proof state, cache identity, and privacy excluded fields.
- `scripts/check-boundary-monitors.ts` - Existing drift monitor entry point; Phase 243 should inventory which v1.35 monitors belong in later phases.

### Established Patterns
- Go owns normal backend orchestration and selected account/entry/public evidence surfaces; runtime-service / Runtime Broker / providers own hostile Strategy validation/build/execution.
- Public/default projections use redacted DTOs and private/no-store source responses for account-owned source.
- Boundary monitors already encode ownership, privacy, TinyGo hiding, runtime eligibility, and claim-drift checks; v1.35 should extend this pattern instead of adding a new verification framework.
- v1.34 checker contracts provide the public-safe diagnostic shape for provider proof, package/dependency, runtime-service unavailable, and privacy exclusions.

### Integration Points
- Account save and source read: web API -> selected Go backend -> PostgreSQL.
- Runtime validation/proof: Go runtime-service client -> `apps/runtime-service` `/validate-strategy` -> language providers.
- Entry eligibility: Go exhibition creation and persistence competition/ladder checks.
- Owner-debug replay: replay page query request -> server-side owner/participant authorization -> public or owner projection.
- Public claims: spec runtime labels, web runtime labels, Learn/evidence copy, proof artifacts, and boundary monitors.

</code_context>

<specifics>
## Specific Ideas

- Phase 243 should produce an artifact comparable to prior milestone inventories, likely under `.planning/artifacts/v1.35-*`, with a machine-readable or monitor-friendly companion if useful.
- Preferred phase handoff is explicit: Phase 244 gets account/provider and entry gates; Phase 245 gets owner-debug/local trust/aliases; Phase 246 gets sandbox labels; Phase 247 gets package policy; Phase 248 gets proof and monitors.
- No user-specific additional preferences were introduced during this auto discussion.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 243 scope.

</deferred>

---

*Phase: 243-Boundary Surface Inventory and Contract Lock*
*Context gathered: 2026-06-14*
