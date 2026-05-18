---
phase: 10-runtime-isolation-hardening
status: validated
requirements: [ISO-01, ISO-02, ISO-03, ISO-04, ISO-05, ISO-06, ISO-07]
---

# Phase 10 Validation

**Updated:** 2026-05-18  
**Scope:** Plan 10-05 final validation evidence for runtime isolation hardening.

All Phase 10 behavioral tests, typechecks, formatting checks, and final boundary grep gates pass.

## Required Commands

| Command | Purpose | Result |
| --- | --- | --- |
| `pnpm --filter @cowards/runtime-js test -- isolation-boundary.test.ts` | Targeted boundary audit test. | PASS - Vitest reported 9 files passed, 129 tests passed. |
| `pnpm --filter @cowards/runtime-js test` | Runtime adapter, subprocess IPC, hostile matrix, and boundary tests. | PASS - 9 files passed, 129 tests passed. |
| `pnpm --filter @cowards/runtime-js typecheck` | Runtime package type contract. | PASS - `tsc --noEmit` completed. |
| `pnpm --filter @cowards/worker test` | Worker adapter selection and strategy/system propagation. | PASS - 1 file passed, 14 tests passed. |
| `pnpm --filter @cowards/worker typecheck` | Worker package type contract. | PASS - `tsc -b` completed. |
| `pnpm --filter @cowards/spec test` | Runtime violation schema contract remains valid. | PASS - 1 file passed, 11 tests passed. |
| `pnpm --filter @cowards/spec typecheck` | Spec package type contract. | PASS - `tsc --noEmit` completed. |
| `pnpm --filter @cowards/engine test` | Engine behavior remains unchanged and pure. | PASS - 8 files passed, 38 tests passed. |
| `pnpm --filter @cowards/engine typecheck` | Engine package type contract remains unchanged. | PASS - `tsc -b` completed. |
| `pnpm exec prettier --check packages/runtime-js/src apps/worker/src .planning/phases/10-runtime-isolation-hardening` | Formatting gate for changed source and planning artifacts. | PASS - previous Phase 10 formatting drift was corrected after Plan 10-05. |

## ISO Evidence Checklist

| Requirement | Evidence Required | Result |
| --- | --- | --- |
| ISO-01 | Adapter metadata API and worker startup/config output identify active adapter and isolation boundary. | PASS - `apps/worker/src/runtime-config.ts` exposes adapter metadata and `apps/worker/src/index.ts` logs id, label, and isolation boundary; worker tests and typecheck passed. |
| ISO-02 | Automated import boundary test proves web/API do not import executable runtime worker/subprocess entrypoints. | PASS - `packages/runtime-js/src/isolation-boundary.test.ts` scans `apps/web` for executable runtime imports and `createRuntimeFromRevision` calls; targeted boundary test passed. |
| ISO-03 | `StrategyExecutionAdapter` contract exists; `createRuntimeFromRevision` accepts adapter/config without engine changes. | PASS - runtime-js tests cover adapter contract and injected adapter behavior; engine tests/typecheck passed without Phase 10 engine source changes. |
| ISO-04 | Opt-in subprocess adapter accepts schema-valid JSON input and returns schema-validated JSON output. | PASS - runtime-js subprocess IPC and adapter tests passed inside `pnpm --filter @cowards/runtime-js test`. |
| ISO-05 | Tests cover timeout kill, stdout/stderr caps, minimal env, no shell, worker resource limits retained. | PASS - runtime-js subprocess tests cover no shell, explicit minimal env, timeout, and byte caps; worker-thread adapter tests retain timeout/resource-boundary behavior. |
| ISO-06 | Hostile matrix covers forbidden globals, dynamic import, worker/process, fs/network, infinite loop, memory pressure, oversized output, invalid output, thrown exceptions. | PASS - hostile matrix tests passed inside the runtime-js suite. |
| ISO-07 | Runtime and worker tests prove player-caused violations become gameplay results while malformed IPC, nonzero exit, signal termination, spawn failure, and infrastructure errors become system failures. | PASS - runtime-js subprocess failure taxonomy tests and worker runner strategy/system propagation tests passed. |

## Final Grep Gates

| Gate | Command | Result |
| --- | --- | --- |
| No executable runtime imports or calls in web/API and non-runtime packages | `rg -n '@cowards/runtime-js/worker\|createRuntimeFromRevision' apps/web packages --glob '*.{ts,tsx}' --glob '!**/*.test.ts' --glob '!packages/runtime-js/**' --glob '!apps/worker/**' \| wc -l \| tr -d ' ' \| grep '^0$'` | PASS - output `0`. |
| No same-process security-boundary module usage in runtime/worker source | `rg -n 'node:vm\|[^A-Za-z0-9_]vm\\.' packages/runtime-js apps/worker --glob '*.{ts,tsx}' \| wc -l \| tr -d ' ' \| grep '^0$'` | PASS - output `0`. |
| No accidental `process.env` inheritance into subprocess adapter | `rg -n 'env:\\s*process\\.env\|\\.env\\s*=\\s*process\\.env\|Object\\.assign\\([^)]*process\\.env' packages/runtime-js/src/subprocess-adapter.ts packages/runtime-js/src/subprocess-adapter.test.ts \| wc -l \| tr -d ' ' \| grep '^0$'` | PASS - output `0`. |

## Docker Note

Docker is not required for Phase 10 validation. Docker/container end-to-end runtime verification belongs to Phase 12; Phase 10 validates the adapter boundary, subprocess spike, hostile matrix, and source import gates without claiming container isolation evidence.

## Post-Validation Formatting Closure

After the first validation pass found formatting drift in four Phase 10 files, the following closure commands passed:

| Command | Result |
| --- | --- |
| `pnpm exec prettier --write packages/runtime-js/src/subprocess-adapter.test.ts packages/runtime-js/src/subprocess-adapter.ts packages/runtime-js/src/subprocess-ipc.ts apps/worker/src/runner.test.ts` | PASS - files rewritten by Prettier. |
| `pnpm --filter @cowards/runtime-js test -- subprocess-adapter.test.ts adapter-contract.test.ts hostile-matrix.test.ts isolation-boundary.test.ts` | PASS - 9 files passed, 129 tests passed. |
| `pnpm --filter @cowards/worker test -- runner.test.ts` | PASS - 1 file passed, 14 tests passed. |
| `pnpm --filter @cowards/runtime-js typecheck` | PASS - `tsc --noEmit` completed. |
| `pnpm --filter @cowards/worker typecheck` | PASS - `tsc -b` completed. |
