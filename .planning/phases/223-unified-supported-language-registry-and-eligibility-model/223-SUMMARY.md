# Phase 223 Summary: Unified Supported Language Registry and Eligibility Model

## Accomplished

- Added `SUPPORTED_STRATEGY_LANGUAGES` in `packages/spec/src/runtime.ts` as the richer supported-language source of truth for JS/TS, Python, Rust, and Zig.
- Added registry fields for provider id, source format, runtime target, default adapter, support status, promotion status, counted/entry eligibility, public labels, policy labels, docs/examples refs, validation/build behavior, restrictions, and privacy rules.
- Derived `STRATEGY_LANGUAGE_REGISTRY` from the new model so existing runtime and broker callers continue to use the same lightweight shape.
- Added lookup helpers:
  - `getSupportedStrategyLanguageRecord`
  - `getSupportedStrategyLanguageBySourceFormat`
- Routed `apps/web/lib/runtime-labels.ts` through the shared registry instead of hardcoded Python/Rust/Zig label switches.
- Added direct tests for the registry and runtime label helper.

## Behavior Changes

- Product label helper implementation is now registry-derived.
- Public label output remains intentionally unchanged: JS/TS counted, Python/Rust/Zig non-counted exhibition beta until later evidence-gated phases complete.

## Review

- Code review found no blockers.
- Residual direct-test risk was fixed by adding `apps/web/lib/runtime-labels.test.ts`.

## Verification

- `pnpm --filter @cowards/spec test` passed: 4 files, 54 tests.
- `pnpm --filter @cowards/spec typecheck` passed.
- `pnpm --filter @cowards/spec build` passed.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm --filter @cowards/web test -- runtime-labels` passed: 25 files, 170 tests.

