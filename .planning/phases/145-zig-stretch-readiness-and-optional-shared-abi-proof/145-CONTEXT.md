# Phase 145: Zig Stretch Readiness and Optional Shared-ABI Proof - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Run fail-loud Zig preflight and, only if evidence passes, prove optional Zig through the same WASI JSON ABI. This phase either records Zig as unavailable/non-promoted with evidence or adds gated optional Zig using the same artifact and UX pattern as Rust.

**Roadmap source:** "Run fail-loud Zig preflight and, only if evidence passes, prove optional Zig through the same WASI JSON ABI."

**Requirements:** ZIG-01, ZIG-02, ZIG-03, ZIG-04, ZIG-05

</domain>

<decisions>
## Implementation Decisions

### Zig Gate
- **D-01:** Zig is a stretch target and must start with a loud preflight covering local Zig version, target availability, compile command, artifact hash, and runtime outcome.
- **D-02:** If Zig compile, target, runtime, ABI, or proof evidence is unavailable, write fail-loud readiness evidence and do not expose Zig as working.
- **D-03:** Zig must never silently substitute Rust, JS/TS, Python, or source execution.

### Shared Pattern If Zig Passes
- **D-04:** If preflight passes, Zig uses the same WASI Preview 1 stdin/stdout JSON ABI, immutable artifact contract, submission compile, revision artifact fields, labels, and Workshop UX pattern selected for Rust.
- **D-05:** Zig remains non-counted exhibition alpha only and must not claim ranked, ladder, counted, gauntlet, production, or broad multi-language support.
- **D-06:** Optional Rust-vs-Zig or Zig-vs-Zig proof is in scope only if Zig readiness passes.

### the agent's Discretion
Planner may decide the exact threshold for "passes" based on executable compile/runtime/ABI evidence, but partial or ambiguous proof should become fail-loud non-promotion rather than optimistic UX exposure.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - Zig stretch target and non-promotion stance.
- `.planning/REQUIREMENTS.md` - Zig readiness requirements.
- `.planning/ROADMAP.md` - Phase boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Fail-loud Zig and no-substitution constraints.
- `.planning/research/SUMMARY.md` - Local Zig feasibility and caveats.

### Runtime And Spec
- `packages/spec/src/runtime.ts` - Gated Zig language/runtime metadata.
- `packages/spec/src/types.ts` - Strategy Revision artifact metadata shared with Rust.
- `packages/spec/src/schemas.ts` - Source format and artifact validation.
- `packages/spec/src/runtime-execution-service.ts` - Shared WASI JSON envelope contract.

### Runtime Service And Go Boundary
- `apps/runtime-service/src/execute-match.ts` - WASM/WASI runtime lane from Phase 142.
- `apps/runtime-service/src/runtime-config.ts` - Wasmtime configuration.
- `apps/go-backend/runtime_service_client.go` - Metadata validation and no execution in Go.

### Workshop And Proof
- `packages/persistence/src/workshop.ts` - Optional Zig source format, samples, and save path if gated on.
- `apps/web/app/workshop/server.ts` - Optional Zig save/validation route behavior.
- `apps/web/app/workshop/workshop-client.tsx` - Optional Zig UX labels.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Proof mechanics to extend only if Zig passes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Rust artifact/compile path from Phase 141 should be reused, not forked into a bespoke Zig-only runtime.
- WASM/WASI execution lane from Phase 142 should remain language-neutral at the artifact/ABI level.
- Workshop Rust UX from Phase 143 should be copied only behind a passing Zig gate.

### Established Patterns
- Unsupported runtime candidates produce explicit readiness artifacts.
- No silent fallback is part of the evidence contract.
- Non-counted labels must remain clear.

### Integration Points
- Add Zig preflight artifact generation.
- If and only if preflight passes, add Zig language/source metadata and optional Workshop/sample path.
- Add monitor/proof coverage for Zig unavailable behavior.

</code_context>

<specifics>
## Specific Ideas

The user approved "same UX gated": Zig should feel like Rust only after evidence passes. If not, the useful product output is a clear readiness record, not a half-hidden feature.

</specifics>

<deferred>
## Deferred Ideas

- Counted Zig play.
- Zig package ecosystem support.
- Zig UX without executable ABI proof.

</deferred>

---

*Phase: 145-Zig Stretch Readiness and Optional Shared-ABI Proof*
*Context gathered: 2026-05-25*
