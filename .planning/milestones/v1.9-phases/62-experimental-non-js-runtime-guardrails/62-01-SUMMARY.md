---
phase: 62
plan: 01
slug: experimental-non-js-runtime-guardrails
status: completed
created: 2026-05-22
---

# Phase 62-01 Summary — Experimental Non-JS Runtime Guardrails

## Completed

- Added `NON_JS_RUNTIME_SUPPORT_POLICY`.
- Added `NON_JS_RUNTIME_PROMOTION_CRITERIA`.
- Added `assertNonJsRuntimeGuardrails`.
- Added `.planning/artifacts/v1.9-non-js-promotion-criteria.md`.
- Extended spec tests for Python experimental/non-counted behavior and complete promotion criteria.
- Extended boundary monitors with a dedicated non-JS runtime guardrail layer.
- Confirmed existing persistence counted gates still reject Python/non-counted runtime metadata.

## Evidence

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/persistence test`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`
- `pnpm boundary:monitors`
- `pnpm typecheck`

## Changed Files

- `packages/spec/src/runtime.ts`
- `packages/spec/src/spec.test.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-boundary-monitors.test.ts`
- `.planning/artifacts/v1.9-non-js-promotion-criteria.md`
