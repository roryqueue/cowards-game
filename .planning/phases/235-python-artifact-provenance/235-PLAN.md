# Phase 235 Plan: Python Artifact Provenance

## Tasks

1. Build Python `sourceArtifact` metadata during provider revision creation.
2. Execute Python from the validated source artifact payload.
3. Bind runtime-service provider proof to source and artifact hashes/bytes.
4. Update counted gates for Python provider proof in persistence and Go.
5. Preserve forbidden import/capability, timeout, invalid output, and privacy behavior.
6. Document that Python provenance is not WASM isolation.

## Verification

- `pnpm --filter @cowards/runtime-python test -- --runInBand`
- `pnpm --filter @cowards/persistence test -- --runInBand`
- `go test ./...` in `apps/go-backend`
