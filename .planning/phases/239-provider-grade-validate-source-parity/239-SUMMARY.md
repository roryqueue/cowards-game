---
phase: 239
slug: provider-grade-validate-source-parity
status: complete
completed: 2026-06-14
requirements:
  - CHECKVAL-01
  - CHECKVAL-02
  - CHECKVAL-03
  - CHECKVAL-04
  - CHECKVAL-05
key_files:
  created:
    - packages/spec/src/workshop-checker.ts
    - packages/spec/src/workshop-checker.test.ts
    - apps/web/app/api/workshop/validate/route.test.ts
  modified:
    - packages/spec/src/index.ts
    - packages/spec/package.json
    - packages/runtime-wasm-wasi/src/validation.ts
    - apps/web/app/api/workshop/validate/route.ts
    - apps/web/app/api/workshop/revisions/route.ts
---

# Phase 239 Summary

Workshop Validate source now returns the shared `workshop-checker-v1.34` envelope for TypeScript, Python, Rust, and Zig. The API route validates all four production checker formats through runtime-service/provider semantics and no longer keeps Python on a local-only validation path.

The checker contract records language/provider identity, source identity, artifact state, provenance state, runtime-service availability, toolchain availability, diagnostics, cache identity, and public privacy exclusions. Runtime-service responses are schema-guarded and must match the submitted source hash/bytes before they can be cached or shown as current.

Submit-path unavailable-service handling was also made calm and public-safe, so configured-but-stopped runtime-service failures no longer escape as generic 500s.

## Verification

- `pnpm --filter @cowards/spec test -- workshop-checker`
- `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client`
- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/web typecheck`

## Surprises

The first service proof exposed that privacy scanning must allow contract vocabulary but still redact private runtime field names in diagnostic text. A later code review found that source hash/bytes identity needed to be enforced at the web route before accepting runtime-service results.
