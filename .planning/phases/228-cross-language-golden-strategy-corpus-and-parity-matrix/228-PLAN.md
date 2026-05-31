# Phase 228 Plan: Cross-Language Golden Strategy Corpus and Parity Matrix

## Objective

Create a durable four-language parity wall covering equivalent Strategy sources, pairwise execution, conformance gates, result/replay shape parity, and public privacy parity for TypeScript, Python, Rust, and Zig.

## Tasks

1. Add a reusable v1.32 golden corpus.
   - Store equivalent TypeScript, Python, Rust, and Zig Strategy sources in `@cowards/golden`.
   - Encode provider ids, runtime targets, behavior label, private marker values, and every pairwise combination.

2. Add conformance requirements manifest.
   - Declare required gates: valid behavior, invalid output, timeout, oversized output, forbidden capability, memory-heavy output, deterministic repeat, runtime unavailable, malformed runtime result, missing/stale artifact, no silent fallback, result/replay shape, and privacy parity.
   - Ensure every required gate names all four supported languages without claiming all gate implementations are complete in this phase.

3. Execute the pairwise matrix through runtime-service.
   - Build real Strategy Revisions through JS/TS, Python, Rust, and Zig builders.
   - Execute every locally available language pair through runtime-service / Runtime Broker.
   - Assert no runtime violations, shared outcome parity, stable public Chronicle shape, and public private-marker redaction.

4. Verify artifact and no-fallback edges.
   - Keep WASM artifact-missing checks fail-closed for Rust/Zig corpus revisions.
   - Do not add Strategy execution to web/API/Go.

5. Review and document.
   - Run focused review.
   - Capture validation, UAT, verification, and proof artifacts.

## Non-Goals

- Do not tune language performance or Strategy strength.
- Do not redesign product UI.
- Do not claim identical low-level Chronicle event signatures across language runtimes when the public shape, outcome, and privacy gates pass.
