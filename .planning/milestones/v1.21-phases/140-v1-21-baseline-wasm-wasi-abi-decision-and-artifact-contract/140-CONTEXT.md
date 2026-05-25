# Phase 140: v1.21 Baseline, WASM/WASI ABI Decision, and Artifact Contract - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock v1.20 as the floor, define WASI Preview 1 stdin/stdout JSON envelopes as the first executable WASM/WASI ABI, and specify immutable artifact and promotion gates. This phase establishes contracts and registry metadata only; it does not prove full Rust Match execution or promote Rust, Zig, or WASM/WASI to counted or production support.

**Roadmap source:** "Lock v1.20 as the floor, define the WASI Preview 1 JSON ABI decision, and specify immutable artifact and promotion gates."

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, WASM-01, WASM-02, WASM-03

</domain>

<decisions>
## Implementation Decisions

### ABI And Baseline
- **D-01:** v1.20 is the non-negotiable floor: Docker/container evidence remains executable readiness evidence, Python stays non-counted exhibition beta, and JS/TS stays the counted Strategy path.
- **D-02:** The first executable WASM/WASI ABI is WASI Preview 1 stdin/stdout JSON envelopes using existing `selectActivations` and `soldierBrain` method names.
- **D-03:** Direct exported functions and the component model are documented as future ABI candidates only. They are not v1.21 product claims.
- **D-04:** Runtime registry work must add a `runtime-wasm-wasi` target or equivalent broker entry with exact language, adapter, ABI, package policy, artifact, limit, and eligibility metadata.

### Artifact Contract
- **D-05:** Immutable WASM artifact data belongs on Strategy Revision/artifact metadata, with owner-private source remaining separate from public evidence.
- **D-06:** Artifact metadata should cover artifact hash, artifact bytes or persisted artifact reference, WASI profile, target triple, compile/toolchain evidence, ABI envelope version, validation status, source hash/source bytes, and non-counted eligibility.

### Promotion And Safety
- **D-07:** Rust/WASM can at most become non-counted exhibition alpha/beta in v1.21. Zig can at most become a gated stretch alpha if proof passes.
- **D-08:** No Rust/Zig backend ownership, Go/web/API Strategy execution, Node `node:wasi` sandbox promotion, arbitrary package installs, silent fallback, broad production multi-language claim, ranked/counted promotion, or production sandbox certification is in scope.

### the agent's Discretion
Planners may choose exact naming and schema placement where it follows existing spec patterns, but must keep the above artifact fields, runtime target semantics, public-safe summaries, and conservative promotion language intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Current milestone goals, baseline, non-goals, and promotion stance.
- `.planning/REQUIREMENTS.md` - Active v1.21 requirements and traceability.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Current status and active constraints.
- `.planning/research/SUMMARY.md` - WASI/Rust/Zig feasibility and watch-outs.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Strategy language ids, runtime adapter ids, runtime targets, registry metadata, and eligibility policy.
- `packages/spec/src/types.ts` - Strategy Revision and artifact type model.
- `packages/spec/src/schemas.ts` - Runtime and Strategy Revision validation schemas.
- `packages/spec/src/runtime-execution-service.ts` - Strategy Execution Service request/response contracts.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - Runtime selection and Match execution handoff.
- `apps/runtime-service/src/runtime-config.ts` - Runtime adapter configuration.
- `apps/go-backend/runtime_service_client.go` - Go-side runtime-service request metadata validation.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Workshop revision construction and language/source validation.
- `apps/web/app/workshop/server.ts` - Workshop save/validation server path.
- `apps/web/app/workshop/workshop-client.tsx` - Workshop language UI and diagnostics.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Signed-in proof pattern to reuse later.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Runtime registry patterns already exist for JavaScript, TypeScript, and Python in `packages/spec/src/runtime.ts`.
- Strategy Revision metadata already carries source, source hash, source bytes, runtime, engine compatibility, validation, and metadata.
- v1.20 proof artifacts and runtime evidence provide the baseline for no-fallback and promotion language.

### Established Patterns
- Go orchestrates and validates runtime metadata, but hostile Strategy execution remains in runtime-service.
- Public summaries must avoid source, private memories, objective payloads, stderr, stacks, host paths, environment values, tokens, DB DSNs, and private runtime internals.
- Runtime targets and adapter ids must fail closed on mismatch.

### Integration Points
- Add new spec ids/source formats for Rust and gated Zig later, but Phase 140 should first lock the WASM/WASI target and artifact contract.
- Boundary monitors should be planned for registry drift, ABI drift, Node `node:wasi` promotion, production-claim drift, backend ownership creep, and JS/TS regression.

</code_context>

<specifics>
## Specific Ideas

The user selected the simplest honest executable path: WASI Preview 1 stdin/stdout JSON envelopes through Wasmtime later in the milestone, with immutable artifact metadata represented on Strategy Revisions and no overclaiming beyond candidate/exhibition status.

</specifics>

<deferred>
## Deferred Ideas

- Direct exported-function ABI promotion.
- Component model / WIT Strategy ABI promotion.
- Rust, Zig, or WASM/WASI counted/ranked/production promotion.
- Arbitrary package install support.

</deferred>

---

*Phase: 140-v1.21 Baseline, WASM/WASI ABI Decision, and Artifact Contract*
*Context gathered: 2026-05-25*
