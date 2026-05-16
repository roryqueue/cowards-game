---
phase: 2
plan: 02-05
status: complete
commit: 7646578
---

# Summary: Full Match Runner, Golden Tests, and Purity Gate

## Completed

- Added `runMatch` for deterministic full-match execution across Rounds, Contraction, completion, and guarded max-phase failure.
- Exported the engine API from `packages/engine/src/index.ts`.
- Added golden full-match tests with fake strategies and event summary checks.
- Added a purity test that scans production engine source for forbidden filesystem, network, clock, randomness, process, and infrastructure access.
- Added reusable engine scenario helpers to `packages/test-utils`.
- Updated README engine documentation and package scripts so Phase 2 can be verified with `pnpm --filter @cowards/engine test`, engine typecheck, and `pnpm verify`.

## Verification

- `pnpm --filter @cowards/engine test`
- `pnpm verify`
- `git diff --check`

## Deviations

- Full Chronicle construction is intentionally deferred to Phase 3; Phase 2 emits deterministic event summaries sufficient for tests and future replay integration.

## Self-Check

PASSED
