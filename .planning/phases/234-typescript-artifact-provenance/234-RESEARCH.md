# Phase 234 Research: TypeScript Artifact Provenance

## Findings

- TypeScript validation already transpiled with `ts.transpileModule`, but runtime execution re-transpiled `revision.source` on every Strategy call.
- `StrategyRevisionMetadata` only modeled WASM `compiledArtifact`, so source-language executable artifacts needed a separate private/public projection.
- Runtime-service validation did not accept TypeScript, and Workshop submission did not obtain provider proof for TypeScript.
- Workshop revision summaries exposed metadata directly, so any source-language artifact payload needed redaction before returning to clients.

## Decision

Add `sourceArtifact` metadata for source-language providers. For TypeScript this is deterministic transpiled JavaScript with hash, byte count, source binding, toolchain metadata, and public `provenance-only` evidence. Execution fails closed if the artifact is missing, stale, malformed, or hash-mismatched.
