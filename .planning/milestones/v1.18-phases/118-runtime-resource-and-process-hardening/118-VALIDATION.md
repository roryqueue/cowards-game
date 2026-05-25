# Phase 118 Validation

## Requirement Coverage

- ISO-01: Python launch uses centralized isolated args and empty env.
- ISO-02: Timeout, stdio cap, signal/exit, and malformed IPC classify deterministically.
- ISO-03: Escape probe coverage begins in validation/runtime tests and monitor checks.
- ISO-04: Baseline artifact keeps stronger isolation as evidence-only.
- ISO-05: No fallback remains monitored by broker/topology checks.

## Commands

- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/runtime-python typecheck`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`

