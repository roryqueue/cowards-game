# Phase 162: Boundary Monitors, No-Fallback Drills, and Artifact Compatibility Evidence - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the v1.23 Rust/Zig beta-readiness boundaries into repeatable monitor, no-fallback, and artifact compatibility evidence. This phase should make regressions fail loud; it should not add new Strategy language features, change promotion status, or run the final milestone audit.

</domain>

<decisions>
## Implementation Decisions

### Boundary Monitors
- **D-01:** Monitors must fail if Rust, Zig, Python, or TypeScript attempts normal backend ownership creep.
- **D-02:** Monitors must fail if Strategy code can execute in web/API/Go or if Go/web performs Rust/Zig compile/runtime execution rather than delegating to runtime-service.
- **D-03:** Monitor language should preserve Go ownership of orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.

### No-Fallback Drills
- **D-04:** No-fallback evidence must cover stopped runtime-service, missing Wasmtime/toolchain where relevant, stale artifact hash, missing artifact bytes, runtime registry mismatch, target triple mismatch, ABI envelope mismatch, and unavailable Zig helper/runtime.
- **D-05:** Expected behavior is fail loud with classified public-safe diagnostics; never silently substitute JS/TS, Rust, source execution, stale artifact execution, or in-process execution.

### Artifact Compatibility
- **D-06:** Artifact compatibility evidence must record target triple, WASI profile, ABI envelope, runtime adapter id/version, language/toolchain version, artifact hash, byte count, source hash link, validation status, retention expectation, stale/missing behavior, and rollback note.
- **D-07:** Compatibility evidence must explain whether v1.21/v1.22 artifacts remain executable, need regeneration, or are evidence-only historical artifacts.

### Carry-Forward Defaults
- **D-08:** Monitor artifacts must be public-safe and must not expose Strategy source, host/runtime secrets, raw diagnostics, or private runtime internals.

### the agent's Discretion
- The planner may extend `scripts/check-boundary-monitors.ts`, `scripts/evaluate-wasm-wasi-runtime.ts`, or targeted package tests.
- The planner may choose whether no-fallback drills are command-level, test-level, or both.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Promotion boundaries.
- `.planning/phases/158-rust-zig-beta-readiness-hardening-gates/158-CONTEXT.md` — Hardening failure categories.
- `.planning/phases/159-abi-proof-spike-json-vs-direct-exports-vs-component-model-wit/159-CONTEXT.md` — ABI compatibility boundaries.
- `.planning/phases/161-workshop-exhibition-result-replay-beta-ux-labels-and-privacy-review/161-CONTEXT.md` — Public-safe evidence expectations.

### Monitor Baseline
- `scripts/check-boundary-monitors.ts` — Existing boundary monitor aggregator.
- `scripts/evaluate-wasm-wasi-runtime.ts` — Existing WASM/WASI evidence generator/checker.
- `.planning/artifacts/v1.17-runtime-broker-registry.json` — Runtime Broker registry baseline including Rust/Zig entries.
- `.planning/artifacts/v1.22-wasm-wasi-hardening-evidence.json` — Current hardening probes including stale artifact behavior.
- `.planning/artifacts/v1.22-promotion-decision.md` — Non-promotion baseline.

### Code
- `packages/spec/src/runtime.ts` — Runtime registry, language ids, product semantics, counted eligibility.
- `packages/spec/src/public-output-privacy.ts` — Public-safe evidence constraints.
- `apps/runtime-service/src/execute-match.ts` — Runtime-service registry/artifact validation.
- `apps/go-backend/runtime_service_client.go` — Go runtime-service no-fallback behavior and response validation.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts` — Artifact compatibility enforcement at execution.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `check-boundary-monitors.ts` already aggregates contract drift, privacy, runtime adapter, non-JS runtime, topology, Go promotion, and surface label checks.
- Go runtime-service client already validates response contracts, caps response bytes, and classifies stopped/unavailable runtime-service.
- Runtime WASM/WASI adapter already rejects missing bytes, hash mismatch, target mismatch, ABI mismatch, and forbidden imports.

### Established Patterns
- Monitor artifacts should be versioned and explicit about what they prove and do not prove.
- Strict lanes should fail loud when host support is unavailable or unimplemented.
- No-fallback drills are more valuable when paired with public-safe diagnostic assertions.

### Integration Points
- Phase 163 consumes these monitors as final audit gates.
- Future milestones consume compatibility evidence when deciding whether to migrate ABI or promote counted eligibility.

</code_context>

<specifics>
## Specific Ideas

The most important monitor outcome is boring confidence: a future accidental Rust/Zig counted eligibility change or Go/web execution shortcut should fail before anyone reads a product page.

</specifics>

<deferred>
## Deferred Ideas

- Production sandbox monitor suite.
- Durable compatibility migration tooling for future ABI changes.

</deferred>

---

*Phase: 162-Boundary Monitors, No-Fallback Drills, and Artifact Compatibility Evidence*
*Context gathered: 2026-05-25*
