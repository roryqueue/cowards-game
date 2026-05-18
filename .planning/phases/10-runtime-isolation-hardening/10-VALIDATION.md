---
phase: 10-runtime-isolation-hardening
status: scaffold
requirements: [ISO-01, ISO-02, ISO-03, ISO-04, ISO-05, ISO-06, ISO-07]
---

# Phase 10 Validation Scaffold

Executors update this file after Phase 10 implementation with command results and requirement evidence.

## Required Commands

| Command | Purpose | Result |
| --- | --- | --- |
| `pnpm --filter @cowards/runtime-js test` | Runtime adapter, subprocess IPC, hostile matrix, and boundary tests. | pending |
| `pnpm --filter @cowards/runtime-js typecheck` | Runtime package type contract. | pending |
| `pnpm --filter @cowards/worker test` | Worker adapter selection and strategy/system propagation. | pending |
| `pnpm --filter @cowards/worker typecheck` | Worker package type contract. | pending |
| `pnpm --filter @cowards/spec test` | Runtime violation schema contract remains valid. | pending |
| `pnpm --filter @cowards/spec typecheck` | Spec package type contract. | pending |
| `pnpm --filter @cowards/engine test` | Engine behavior remains unchanged and pure. | pending |
| `pnpm --filter @cowards/engine typecheck` | Engine package type contract remains unchanged. | pending |
| `pnpm exec prettier --check packages/runtime-js/src apps/worker/src .planning/phases/10-runtime-isolation-hardening` | Formatting gate for changed source and planning artifacts. | pending |

## ISO Evidence Checklist

| Requirement | Evidence Required | Result |
| --- | --- | --- |
| ISO-01 | Adapter metadata API and worker startup/config output identify active adapter and isolation boundary. | pending |
| ISO-02 | Automated import boundary test proves web/API do not import executable runtime worker/subprocess entrypoints. | pending |
| ISO-03 | `StrategyExecutionAdapter` contract exists; `createRuntimeFromRevision` accepts adapter/config without engine changes. | pending |
| ISO-04 | Opt-in subprocess adapter accepts schema-valid JSON input and returns schema-validated JSON output. | pending |
| ISO-05 | Tests cover timeout kill, stdout/stderr caps, minimal env, no shell, worker resource limits retained. | pending |
| ISO-06 | Hostile matrix covers forbidden globals, dynamic import, worker/process, fs/network, infinite loop, memory pressure, oversized output, invalid output, thrown exceptions. | pending |
| ISO-07 | Runtime and worker tests prove player-caused violations become gameplay results while malformed IPC, nonzero exit, signal termination, spawn failure, and infrastructure errors become system failures. | pending |

## Docker Note

Do not require Docker for Phase 10 validation. Docker end-to-end runtime/container verification belongs to Phase 12 unless an executor independently uses Docker as a local diagnostic aid and records it as non-required evidence.
