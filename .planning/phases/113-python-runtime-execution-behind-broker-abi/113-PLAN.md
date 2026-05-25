---
phase: 113-python-runtime-execution-behind-broker-abi
plan: 1
type: execute
wave: 1
depends_on: [112]
files_modified:
  - packages/runtime-python/src/python-subprocess-adapter.ts
  - packages/runtime-python/src/python_runtime_host.py
  - packages/runtime-python/src/python-subprocess-adapter.test.ts
  - apps/runtime-service/package.json
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/execute-match.test.ts
autonomous: true
requirements: [PYRUN-01, PYRUN-02, PYRUN-03, PYRUN-04, PYRUN-05, PYRUN-06, PYRUN-07]
---

<objective>
Execute Python Strategies only as a registered runtime implementation behind the runtime-service/broker ABI.
</objective>

<tasks>

1. Add synchronous Python method execution suitable for the current synchronous engine runtime interface.
2. Harden the Python host and adapter for source hash checks, stdout/stderr caps, timeout, invalid output, crash, forbidden capability, and schema-validated envelopes.
3. Refactor runtime-service runtime selection to construct JS/TS or Python runtime adapters from registry metadata.
4. Add full Match tests for Python-vs-JS/TS and failure taxonomy tests for unsupported/malformed Python paths.
5. Ensure runtime-service returns internal runtime results only and redacted system failures.

</tasks>

<verification>

- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/runtime-service test`
- `pnpm --filter @cowards/runtime-service typecheck`

</verification>

