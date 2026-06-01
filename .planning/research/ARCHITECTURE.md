# v1.33 Architecture Research

## Provider Proof Direction

```text
Strategy source
  -> provider validation/build
  -> artifact/provenance metadata
  -> runtime-service / Runtime Broker
  -> artifact-compatible execution
  -> pure engine
  -> Chronicle and public-safe projections
```

TypeScript and Python should add artifact proof fields without changing the core engine or moving hostile Strategy execution. Rust/Zig proof should remain valid and become the comparison point for shared evidence docs and monitors.

## Spike Direction

```text
Candidate language sample
  -> local toolchain probe
  -> WASM/WASI artifact if viable
  -> import table audit
  -> ABI compatibility experiment
  -> recommendation artifact
```

The TinyGo spike should be isolated from production provider registration unless a later approved plan promotes it.

## Integration Points

- Provider registry/proof schemas.
- Runtime-service validation/build/execution paths.
- Public/private evidence DTOs and privacy scans.
- Supported-language docs/UI labels.
- Boundary monitors for no web/API/Go Strategy execution and no spike-only production labels.
