# Phase 158: Rust/Zig Beta Readiness Hardening Gates - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Rerun and strengthen Rust/Zig WASM/WASI compile, artifact, runtime, and hostile-result evidence needed for non-counted exhibition beta readiness. This phase should harden evidence and failure classification; it should not run the full signed-in proof, change UX labels, change ABI strategy, or make promotion decisions.

</domain>

<decisions>
## Implementation Decisions

### Evidence Categories
- **D-01:** Hardening evidence must cover both languages independently: Rust `wasm32-wasip1` and Zig `wasm32-wasi`.
- **D-02:** Required categories are compile/preflight, immutable artifact metadata, artifact hash/byte verification, Wasmtime execution, timeout/fuel, memory cap/growth, stdio/result caps, malformed JSON, invalid schema/action, trap/panic/abort, missing artifact, stale hash, forbidden imports/capabilities, and no inherited env/preopens/network.
- **D-03:** Evidence should be machine-readable JSON with a public-safe Markdown companion when useful, following v1.22 artifact patterns.

### Failure Taxonomy
- **D-04:** Preserve the runtime distinction between Strategy failure/runtime violation and system failure. Do not collapse compiler/toolchain/runtime-service failure into Strategy failure.
- **D-05:** Missing, stale, invalid, mismatched, or unregistered artifacts must fail closed and must never execute source as fallback.
- **D-06:** Public diagnostics must stay category-level and redacted; private details may exist only where owner/internal artifacts are intended and safe.

### Carry-Forward Defaults
- **D-07:** Evidence language must say beta/candidate readiness only, not production sandbox certification.
- **D-08:** Zig hardening can fail independently from Rust; a Zig failure blocks Zig beta but does not automatically block Rust beta.

### the agent's Discretion
- The planner may extend `scripts/evaluate-wasm-wasi-runtime.ts`, package tests, or both.
- The planner may choose exact probe IDs, but probe names should be stable enough for later monitor checks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Beta criteria and regression floor.
- `.planning/phases/157-zig-ergonomics-and-safe-helper-starter-layer/157-CONTEXT.md` — Zig helper/capability policy.

### Evidence Baseline
- `.planning/artifacts/v1.22-wasm-wasi-hardening-evidence.json` — Existing 19-probe baseline.
- `.planning/artifacts/v1.22-wasm-wasi-hardening-evidence.md` — Human-readable v1.22 hardening summary.
- `.planning/artifacts/v1.22-zig-readiness-evidence.json` — Zig readiness baseline.
- `.planning/artifacts/v1.21-wasm-wasi-hostile-probe-evidence.json` — Earlier Rust-focused hostile probe baseline.
- `.planning/artifacts/v1.21-code-review-remediation.md` — Prior runtime-service/source fallback remediations.

### Code
- `scripts/evaluate-wasm-wasi-runtime.ts` — Existing WASM/WASI evaluator and artifact writer.
- `packages/runtime-wasm-wasi/src/validation.ts` — Compile validation, forbidden patterns, import inspection, artifact metadata.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` — Wasmtime execution, caps, artifact validation, and failure envelopes.
- `apps/runtime-service/src/execute-match.ts` — Runtime-service artifact validation and runtime selection.
- `apps/runtime-service/src/redaction.ts` — Public-safe diagnostic redaction.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runWasmWasiStrategyMethodSync` already enforces artifact hash/byte count, target triple, WASI profile, ABI envelope, import validation, Wasmtime timeout/fuel/memory controls, and stdio caps.
- `executeRuntimeServiceRequest` already validates compiled artifacts before Match execution and distinguishes runtime registry mismatches.
- `redactedDiagnostics` already filters diagnostics before public/runtime-service responses.

### Established Patterns
- Wasmtime runs with `env: {}` and no shell, with explicit `fuel`, timeout, memory, and stack options.
- Runtime-service HTTP failures are classified by Go with retryability and max response caps.
- v1.20/v1.21/v1.22 evidence artifacts use explicit promotion-language disclaimers.

### Integration Points
- Phase 159 consumes the active ABI hardening result.
- Phase 160 uses hardening evidence as a signed-in proof precondition.
- Phase 162 turns repeated evidence into boundary/no-fallback monitor checks.

</code_context>

<specifics>
## Specific Ideas

The hardening gate should be boring and repeatable: one command should regenerate/check v1.23 Rust/Zig readiness evidence and fail loudly when local toolchain/runtime assumptions are not met.

</specifics>

<deferred>
## Deferred Ideas

- Production sandbox certification remains future scope.
- Unbounded stress or fuzzing belongs outside this beta-readiness milestone unless a narrow probe is needed to close a concrete evidence gap.

</deferred>

---

*Phase: 158-Rust/Zig Beta Readiness Hardening Gates*
*Context gathered: 2026-05-25*
