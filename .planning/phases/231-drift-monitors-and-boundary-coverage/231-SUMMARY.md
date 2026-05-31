# Phase 231 Summary: Drift Monitors and Boundary Coverage

## Accomplished

- Converted stale Python non-counted monitor assertions into provider-gated counted eligibility checks for all supported languages.
- Updated the runtime broker registry artifact so Python, Rust, and Zig are counted through their v1.32 provider paths.
- Added a supported language/provider completeness monitor for contract version, runtime adapter mapping, docs/examples, privacy, counted eligibility, and provider proof requirements.
- Added a direct language special-case monitor with a narrow approved boundary list for Workshop/API/editor/provider helper files.
- Added WASM/WASI runtime implementation markers to service import and public discovery boundary denylists.
- Added monitor tests for unapproved product language branching and direct WASM/WASI runtime imports.

## Verification

- `pnpm --filter @cowards/spec test -- runtime` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/check-service-boundary-imports.test.ts` passed: 23 tests.
- `pnpm exec tsx scripts/check-public-discovery-boundary.ts` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm boundary:imports` passed with 0 strict offenses.
- `pnpm boundary:monitors` passed after generated proof artifacts were refreshed.

## Surprise

The biggest drift was not in product UI. It was the monitor suite itself still enforcing beta-era Python and public picker assumptions after the provider promotion phases had already changed the source of truth.
