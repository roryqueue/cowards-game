# Phase 228: Cross-Language Golden Strategy Corpus and Parity Matrix - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 228 creates the conformance wall: a golden Strategy corpus in JS/TS, Python, Rust, and Zig; pairwise Match/MatchSet matrix; invalid/failure behavior tests; result/replay shape parity; and privacy parity. It does not redesign product UI.

</domain>

<decisions>
## Implementation Decisions

### Golden Corpus
- **D-01:** Golden Strategies must be equivalent across all four languages and should cover ordinary tactical behavior rather than toy no-ops only.
- **D-02:** Include both same-language mirrors and cross-language pairwise Match/MatchSet combinations.
- **D-03:** The corpus should be easy to extend when later languages or ABI variants are added.

### Parity Gates
- **D-04:** Conformance must cover valid behavior plus invalid output, timeout, oversized output, forbidden capability, memory-heavy output, deterministic behavior, runtime unavailable, malformed runtime result, and no silent fallback.
- **D-05:** Public result/replay shape parity and privacy parity are required gates, not nice-to-have proof.

### The Agent's Discretion
- Choose whether the runner lives under `scripts`, `packages/spec`, a runtime package, or test-utils. Favor the location that makes CI and monitors straightforward.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PAR-01..PAR-05`.
- `.planning/ROADMAP.md` - Phase 228 success criteria.
- `.planning/phases/225-python-production-support-path/225-CONTEXT.md`
- `.planning/phases/226-rust-production-support-path/226-CONTEXT.md`
- `.planning/phases/227-zig-production-support-path/227-CONTEXT.md`

### Code
- `packages/test-utils/src/replay-scenarios.ts` - Existing scenario/fixture style.
- `packages/runtime-js/src/*` - JS/TS runtime behavior and failure tests.
- `packages/runtime-python/src/*` - Python runtime behavior and tests.
- `packages/runtime-wasm-wasi/src/*` - Rust/Zig runtime behavior and tests.
- `packages/spec/src/match-execution-contract.ts` - Result/replay app-facing contract.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Public fixture adapter pattern.
- `scripts/evaluate-v1-24-runtime-abuse-lab.ts` - Existing multi-runtime abuse evaluator.

### Evidence
- `.planning/artifacts/v1.24-runtime-abuse-lab-evidence.md` - Abuse probe baseline.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` - Public result/replay trust proof baseline.
- `.planning/artifacts/v1.30-match-intelligence-workbench-proof.md` - Result/replay derived-evidence proof baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Runtime packages already contain failure tests that can be generalized into conformance.
- Existing proof scripts already produce markdown/json artifacts for milestone evidence.

### Established Patterns
- Public result and replay proof should be fixture-backed where live services are expensive, then complemented by signed-in proof later.
- Board realism checks are required for replay or Match creation changes.

### Integration Points
- Runtime packages, runtime-service, Go execution path, match-execution app contract, replay projection, and privacy scanners.

</code_context>

<specifics>
## Specific Ideas

The parity matrix should become the durable "no drift" wall. It should make it hard to support one language in product but forget its invalid-output, replay, or privacy proof.

</specifics>

<deferred>
## Deferred Ideas

Balancing language performance or strategic strength is deferred. This phase proves semantics and evidence parity, not game balance.

</deferred>

---

*Phase: 228-Cross-Language Golden Strategy Corpus and Parity Matrix*
*Context gathered: 2026-05-31*
