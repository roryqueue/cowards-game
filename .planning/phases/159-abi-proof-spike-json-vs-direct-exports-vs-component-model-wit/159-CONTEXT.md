# Phase 159: ABI Proof Spike: JSON vs Direct Exports vs Component Model/WIT - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Compare ABI options for future WASM/WASI Strategy execution while keeping Preview 1 stdin/stdout JSON as the active Match execution path unless a later explicit promotion decision changes it. This phase may create proof artifacts, tiny isolated prototypes, and decision records; it must not silently route product Match execution through direct exports or component model/WIT.

</domain>

<decisions>
## Implementation Decisions

### Active ABI
- **D-01:** Preview 1 stdin/stdout JSON remains the only active execution ABI for v1.23 planning unless a future milestone explicitly promotes another ABI.
- **D-02:** The active ABI evidence must confirm schema validation, stdio caps, malformed JSON handling, artifact compatibility, and Rust/Zig parity using the current runtime-service boundary.

### Direct Export Spike
- **D-03:** A direct-export proof must cover memory ownership, allocation/free rules, buffer/string encoding, input/output caps, schema validation, Rust and Zig glue shape, deterministic failure behavior, and rollback.
- **D-04:** If any of those are missing, direct exports get a fail-loud non-promotion decision, not a partial hidden path.

### Component Model/WIT Spike
- **D-05:** A component model/WIT proof must cover WIT world shape, language/toolchain support for Rust and Zig, Wasmtime host integration, caps, schema/typed validation, artifact metadata compatibility, and rollback.
- **D-06:** Component model/WIT is strategically promising but cannot become a user-facing or Match execution path from this phase alone.

### Carry-Forward Defaults
- **D-07:** ABI work must preserve runtime-service ownership, Go orchestration ownership, public privacy, immutable artifacts, and no Strategy execution in web/API/Go.

### the agent's Discretion
- The planner may choose whether the spike is code-backed, artifact-backed, or decision-only for a lane, as long as fail-loud evidence is explicit.
- The planner may use current official docs during research/planning to refresh toolchain status.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Beta and non-promotion boundaries.
- `.planning/phases/158-rust-zig-beta-readiness-hardening-gates/158-CONTEXT.md` — Active hardening expectations.

### ABI Baseline
- `.planning/artifacts/v1.22-abi-evolution-decision.md` — Existing JSON/direct-export/component-model tradeoff decision.
- `.planning/research/v1.23-SUMMARY.md` — Current research on WASI Preview 1, direct exports, and component model/WIT.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture source spec for runtime boundary claims.

### Code
- `packages/spec/src/runtime-execution-service.ts` — Runtime execution service envelope contract.
- `packages/spec/src/runtime.ts` — Runtime ABI/version/registry metadata.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` — Current stdin/stdout JSON runner.
- `apps/runtime-service/src/execute-match.ts` — Runtime-service execution boundary and broker registry selection.
- `scripts/evaluate-wasm-wasi-runtime.ts` — Existing ABI and promotion decision artifact writer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Current runtime envelopes already use `StrategyRuntimeResponseEnvelopeSchema` and `STRATEGY_RUNTIME_ABI_VERSION`.
- Runtime-service validates request/response contract versions and rejects malformed service responses.
- Existing artifact metadata already records ABI envelope as `stdin-stdout-json`.

### Established Patterns
- ABI changes are decision artifacts first, execution paths later.
- New runtime lanes must be registered and selected by exact language/runtime/adapter/ABI/package match.
- Public evidence should state why a candidate is not promoted.

### Integration Points
- Phase 158 provides current Preview 1 JSON evidence.
- Phase 162 records artifact compatibility and monitor implications.
- Phase 163 cites this phase when deciding whether ABI migration remains deferred.

</code_context>

<specifics>
## Specific Ideas

Treat direct exports and component model/WIT as contenders to study, not prizes to force. A clear fail-loud non-promotion decision is a valid successful outcome.

</specifics>

<deferred>
## Deferred Ideas

- Production direct-export execution path.
- Production component model/WIT execution path.
- ABI migration for JS/TS or Python.

</deferred>

---

*Phase: 159-ABI Proof Spike: JSON vs Direct Exports vs Component Model/WIT*
*Context gathered: 2026-05-25*
