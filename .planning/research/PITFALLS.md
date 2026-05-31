# v1.33 Pitfalls Research

## Watch Outs

- Artifact proof can drift from source if validation/build metadata is not bound and checked at execution time.
- TypeScript may accidentally keep a mutable source transpilation path alive unless runtime execution is forced through the validated artifact.
- Python artifact provenance may be misread as stronger isolation than it provides unless docs/UI/evidence copy is explicit.
- TinyGo and Grain imports may require host capabilities incompatible with the current WASI posture.
- Grain may require JavaScript host glue that does not fit the existing Wasmtime/WASI runtime-service setup.
- Spike artifacts can leak into product labels or supported-language registries if candidate status is not monitored.
- Public evidence must avoid raw compiler diagnostics, host paths, environment values, package paths, source snippets, memory, and objective payloads.

## Prevention Strategy

- Add fail-closed tests for missing, stale, mismatched, and unverifiable artifacts before enabling artifact execution.
- Keep source-language artifact claims separate from sandbox claims in docs and UI.
- Treat TinyGo/Grain as evidence artifacts and recommendations, not product languages.
- Reuse Rust/Zig import audit and WASI evidence patterns for candidate spikes.
- Add monitors for spike-only labels, provider proof completeness, privacy markers, and no Strategy execution in web/API/Go.
