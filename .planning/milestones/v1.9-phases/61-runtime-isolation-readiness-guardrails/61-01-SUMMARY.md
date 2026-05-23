---
phase: 61
plan: 01
slug: runtime-isolation-readiness-guardrails
status: completed
created: 2026-05-22
---

# Phase 61-01 Summary — Runtime Isolation Readiness Guardrails

## Completed

- Added runtime isolation promotion-readiness criteria and failure taxonomy to the sandbox evaluation report.
- Added `assertRequiredSandboxCandidatesPassed` and `assertRuntimeIsolationReadinessGuardrails`.
- Added `pnpm sandbox:evaluate:container` and `--require-container` fail-loud mode.
- Added spec-owned `isolationPromotionState` and adapter criteria while preserving counted eligibility.
- Added `--require-runtime-container` and a runtime-isolation layer to local topology diagnostics.
- Added boundary-monitor checks for runtime isolation readiness and no-promotion posture.
- Regenerated `.planning/artifacts/runtime-sandbox-evaluation.json`.

## Evidence

- `pnpm --filter @cowards/runtime-js test`
- `pnpm --filter @cowards/spec test`
- `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm sandbox:evaluate:check`
- `pnpm topology:check`
- `pnpm boundary:monitors`
- `pnpm typecheck`

## Changed Files

- `package.json`
- `.planning/artifacts/runtime-sandbox-evaluation.json`
- `packages/runtime-js/src/sandbox-evaluation.ts`
- `packages/runtime-js/src/sandbox-evaluation.test.ts`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/spec.test.ts`
- `scripts/evaluate-runtime-sandbox.ts`
- `scripts/check-local-topology.ts`
- `scripts/check-local-topology.test.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-boundary-monitors.test.ts`
