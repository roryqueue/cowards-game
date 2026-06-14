---
phase: 242
slug: four-language-checker-proof-privacy-and-audit
status: complete
completed: 2026-06-14
requirements:
  - CHECKTEST-01
  - CHECKTEST-02
  - CHECKTEST-03
  - CHECKTEST-04
  - CHECKTEST-05
key_files:
  created:
    - scripts/evaluate-v1-34-workshop-checker.ts
    - scripts/evaluate-v1-34-workshop-checker.test.ts
    - .planning/artifacts/v1.34-workshop-checker-proof.md
    - apps/web/app/api/workshop/revisions/route.test.ts
  modified:
    - package.json
    - apps/web/app/api/workshop/validate/route.test.ts
    - apps/web/app/workshop/workshop-client.test.tsx
    - packages/spec/src/workshop-checker.test.ts
    - scripts/check-boundary-monitors.test.ts
---

# Phase 242 Summary

Phase 242 added a service-backed proof script and regression tests covering the four Workshop checker paths. The proof starts a real runtime execution HTTP server, points the Workshop validate route at it, validates TypeScript, Python, Rust, and Zig sources through `/api/workshop/validate`, runs an unavailable runtime-service probe, and scans public checker envelopes for private/source/artifact/host/token markers.

The saved proof artifact shows all four checker paths returned `ready` on this machine:

- TypeScript: `ready`
- Python: `ready`
- Rust: `ready`
- Zig: `ready`

The code review found five issues: stale runtime-service identity acceptance, provenance proof mismatch reporting, submit-route runtime-service failure handling, incomplete diagnostic redaction variants, and proof-test/toolchain expectation mismatch. All were fixed and covered by regression tests.

## Verification

- `pnpm --filter @cowards/spec test -- workshop-checker`
- `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client`
- `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts --reporter=dot`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts --reporter=dot`
- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/spec build`

## Surprises

Rust and Zig toolchains were available locally, so the service proof produced `ready` rather than the calm `toolchain_unavailable` fallback. The test still allows Rust/Zig toolchain-unavailable in environments where those toolchains are missing.
