---
phase: 62
slug: experimental-non-js-runtime-guardrails
status: complete
nyquist_compliant: true
created: 2026-05-22
last_verified: 2026-05-22
---

# Phase 62 — Validation Strategy

## Commands

- [x] `pnpm --filter @cowards/spec test`
- [x] `pnpm --filter @cowards/persistence test`
- [x] `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`
- [x] `pnpm boundary:monitors`
- [x] `pnpm exec prettier --check packages/spec/src/runtime.ts packages/spec/src/spec.test.ts scripts/check-boundary-monitors.ts scripts/check-boundary-monitors.test.ts .planning/artifacts/v1.9-non-js-promotion-criteria.md`
- [x] `pnpm typecheck`

## Results

- Spec tests: 30 passed.
- Persistence tests: 12 files passed; 52 passed, 1 skipped.
- Boundary-monitor tests: 4 passed.
- `pnpm boundary:monitors`: passed with the dedicated non-JS guardrail check reporting 9 promotion criteria and experimental languages as Python.
- Root typecheck: 12 packages successful.
- Prettier check passed for touched files.

## Verification Targets

- NJS-01: non-JS promotion criteria are inspectable in spec and `.planning/artifacts/v1.9-non-js-promotion-criteria.md`.
- NJS-02: Python remains experimental, disabled for normal play, and not counted-play eligible.
- NJS-03: user-facing runtime labels may show experimental/non-counted semantics without adding a public language picker.
- NJS-04: compatibility and boundary monitors fail on accidental non-JS counted eligibility or unsupported promotion.

## Result

Passed. Phase 62 makes the non-JS promotion path explicit while keeping Python and other non-JS runtimes experimental and non-counted.
