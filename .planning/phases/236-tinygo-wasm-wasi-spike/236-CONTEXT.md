# Phase 236: TinyGo WASM/WASI Spike - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 236 is a contained TinyGo WASM/WASI spike. It should attempt to build a minimal TinyGo Strategy artifact, test compatibility with the existing WASI Preview 1 stdin/stdout JSON Strategy ABI where feasible, audit imports, measure basic viability and runtime behavior, and produce a promote/defer/reject recommendation. It must not enable TinyGo production support or counted eligibility.

</domain>

<decisions>
## Implementation Decisions

### Spike Status
- **D-01:** TinyGo remains spike-only throughout this phase.
- **D-02:** Do not add TinyGo as a selectable production Strategy language.
- **D-03:** Do not add counted eligibility, public production labels, or durable provider support in this phase.

### ABI and Target
- **D-04:** Try WASI Preview 1 stdin/stdout JSON first because it is the current Rust/Zig WASM/WASI ABI.
- **D-05:** A closest deterministic WebAssembly target is acceptable only if the gap from WASI Preview 1 is documented.
- **D-06:** Any adapter, shim, import allowance, or ABI incompatibility must be recorded explicitly.

### Tooling and Evidence
- **D-07:** Use local TinyGo tooling if available.
- **D-08:** If local TinyGo tooling is missing or unusable, fail loudly with actionable toolchain evidence rather than substituting another language.
- **D-09:** Spike evidence must record import audit, artifact size, startup latency, per-call latency, deterministic behavior, invalid-output behavior, timeout/trap behavior, failure taxonomy, and recommendation.

### Recommendation
- **D-10:** Final recommendation must be one of promote, defer, or reject.
- **D-11:** A promote recommendation means "worth a future production-support milestone", not immediate production enablement.

### the agent's Discretion
- Planner may choose the minimal TinyGo Strategy behavior and measurement harness, as long as it uses the existing Strategy ABI where feasible and records gaps honestly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `TINYGO-01..TINYGO-05`.
- `.planning/ROADMAP.md` - Phase 236 success criteria.
- `.planning/STATE.md` - Active v1.33 boundary notes.
- `.planning/research/SUMMARY.md` - v1.33 TinyGo spike direction.

### Prior Decisions and Evidence
- `.planning/phases/226-rust-production-support-path/226-CONTEXT.md` - Rust WASM/WASI artifact/provider proof pattern.
- `.planning/phases/227-zig-production-support-path/227-CONTEXT.md` - Zig WASM/WASI import/no-std artifact proof pattern.
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md` - Boundary and monitor expectations.
- `.planning/phases/232-live-four-language-signed-in-proof/232-CONTEXT.md` - Proof/privacy expectations.

### Code
- `packages/spec/src/runtime.ts` - WASM/WASI adapter/provider posture, ABI version, Rust/Zig artifact semantics.
- `packages/runtime-wasm-wasi/src/metadata.ts` - WASM/WASI runtime metadata baseline.
- `packages/runtime-wasm-wasi/src/validation.ts` - WASM/WASI import validation.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` - Wasmtime execution path, artifact hash/byte validation, import audit, timeout/trap behavior.
- `apps/runtime-service/src/server.ts` - Runtime-service provider validation boundary.
- `scripts/check-boundary-monitors.ts` - Boundary and spike-only label monitor surface.
- `.planning/artifacts/v1.24-runtime-abuse-lab-evidence.md` - Runtime abuse/evidence artifact pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- WASM/WASI adapter already validates artifact bytes, artifact hash, byte count, target triple, WASI profile, ABI envelope, ABI version, and import table.
- Wasmtime subprocess execution path already records timeout, stdio cap, malformed IPC, invalid output, trap/panic/abort, and forbidden capability behavior.
- Rust/Zig provider proof is a strong template for TinyGo spike evidence, even though TinyGo remains non-production.

### Established Patterns
- New WASM languages must prove import boundaries and no fallback before product consideration.
- Spike artifacts should be public-safe and not become product labels.
- Unsupported or unavailable tooling should fail loudly with evidence.

### Integration Points
- Spike harness and artifacts under `.planning/artifacts/` or a phase-local artifact path.
- Runtime-wasm-wasi validation and Wasmtime probes.
- Boundary monitors for unsupported language product leakage.

</code_context>

<specifics>
## Specific Ideas

The spike should be useful even if TinyGo cannot run cleanly: a fail-loud tooling/import/ABI record is a valid outcome if it produces a concrete recommendation.

</specifics>

<deferred>
## Deferred Ideas

TinyGo production support, counted eligibility, Workshop product UX, signed-in proof, and provider registry promotion are future work unless a later approved milestone takes them on.

</deferred>

---

*Phase: 236-TinyGo WASM/WASI Spike*
*Context gathered: 2026-05-31*
