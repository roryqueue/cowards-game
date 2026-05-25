---
phase: 125
status: executed
requirements: [PROBE-01, PROBE-02, PROBE-03, PROBE-04, PROBE-05, PROBE-06, PROBE-07]
---

# Phase 125 Plan

## Objective
Make hostile probe evidence easier to compare across runtime candidates without making probes destructive or leaking private diagnostics.

## Tasks
1. Add a unified probe taxonomy to sandbox evaluation results.
2. Map existing bounded probes onto filesystem, network, process, package/import, dynamic execution, environment, pressure, timeout, crash, IPC, redaction, and invalid-output categories.
3. Add guardrails that fail if required taxonomy families disappear.
4. Preserve public-safe diagnostic checks.

## Verification
- `pnpm --filter @cowards/runtime-js test`
- `pnpm sandbox:evaluate:check`

