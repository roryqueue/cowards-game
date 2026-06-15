---
phase: 247
status: complete
date: 2026-06-15
---

# Phase 247 Validation

## Acceptance Mapping

- PKG-01: satisfied by the versioned spec package policy contract and per-lane claims.
- PKG-02: satisfied by spec validation, Go readiness/entry gates, runtime-service compatibility checks, public semantics, and proof source scans.
- PKG-03: satisfied by package-safe diagnostics and proof artifact private marker rejection.
- PKG-04: satisfied by documented future package-lane requirements without enabling any package lane.

## Commands Run

- `pnpm v1.35:package-policy-proof:check`
- `pnpm exec vitest run scripts/evaluate-v1-35-package-policy-proof.test.ts`
- `pnpm --filter @cowards/spec exec vitest run src/spec.test.ts`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Package|TestTypeScriptRuntimeMetadataRequiresProviderProofForCountedPlay|Test.*Provider.*Readiness|Test.*PublicStrategy' -count=1`
- `pnpm --filter @cowards/runtime-js exec vitest run src/validation.test.ts`
- `pnpm --filter @cowards/runtime-python exec vitest run src/python-subprocess-adapter.test.ts`
- `pnpm --filter @cowards/runtime-wasm-wasi exec vitest run src/wasm-wasi-subprocess-adapter.test.ts`
- `pnpm --filter @cowards/web exec vitest run lib/public-discovery-service.test.ts app/workshop/workshop-client.test.tsx`

## Result

PASSED.
