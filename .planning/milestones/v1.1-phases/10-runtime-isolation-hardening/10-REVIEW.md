---
phase: 10-runtime-isolation-hardening
reviewed: 2026-05-18T17:59:12Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - packages/runtime-js/src/adapter.ts
  - packages/runtime-js/src/worker-thread-adapter.ts
  - packages/runtime-js/src/worker-bridge.ts
  - packages/runtime-js/src/executor.ts
  - packages/runtime-js/src/worker.ts
  - packages/runtime-js/src/adapter-contract.test.ts
  - packages/runtime-js/src/executor.test.ts
  - packages/runtime-js/src/subprocess-ipc.ts
  - packages/runtime-js/src/subprocess-harness.ts
  - packages/runtime-js/src/subprocess-adapter.ts
  - packages/runtime-js/src/subprocess-adapter.test.ts
  - packages/runtime-js/src/hostile-matrix.test.ts
  - packages/runtime-js/src/isolation-boundary.test.ts
  - packages/spec/src/types.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/spec.test.ts
  - apps/worker/src/runtime-config.ts
  - apps/worker/src/runner.ts
  - apps/worker/src/runner.test.ts
  - apps/worker/src/index.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: resolved
---

# Phase 10: Code Review Report

**Reviewed:** 2026-05-18T17:59:12Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** resolved

## Summary

Reviewed the scoped runtime-js, spec, and worker changes for runtime isolation, subprocess IPC, failure taxonomy, determinism, privacy, and tests. The requested aggregate `10-PLAN.md` does not exist in the phase directory, so review context used `10-01-PLAN.md` through `10-05-PLAN.md` along with the requested research, patterns, and validation files.

Three blockers remain. The runtime still exposes nondeterministic globals to Strategy code, execution trusts a stored validation flag instead of revalidating the actual source at the runtime boundary, and the default worker-thread adapter still has no effective output byte cap before hostile output crosses back into the host process.

**Resolution update:** All three blockers were fixed on 2026-05-18. Runtime validation now revalidates the actual source and source hash/byte metadata before adapter execution; both worker-thread and subprocess harnesses shadow `crypto`, `performance`, `Buffer`, and `queueMicrotask`; and the worker-thread adapter enforces an output byte cap inside the worker before posting results to the host process.

## Critical Issues

### CR-01: BLOCKER - Unblocked globals allow nondeterministic Strategy results

**Status:** RESOLVED

**File:** `packages/runtime-js/src/subprocess-harness.ts:160`
**Issue:** The subprocess wrapper shadows only a small set of globals (`Function`, `process`, `require`, `fetch`, `WebAssembly`, `Worker`, `Date`, timers, and `console`) before appending Strategy source at line 173. It does not shadow other Node/Web globals such as `crypto`, `performance`, or `Buffer`. A Strategy can call `crypto.randomUUID()` or `performance.now()` and return `ok: true`, creating nondeterministic Match behavior. The same wrapper pattern is used by the worker-thread bridge, so both adapters are affected. The hostile matrix also lacks cases for these globals in `packages/runtime-js/src/hostile-matrix.test.ts:156`.

**Fix:**
```ts
// Add runtime blocks in both harness wrappers and validation/test coverage.
const crypto = forbiddenFunction("crypto")
const performance = forbiddenFunction("performance")
const Buffer = forbiddenFunction("Buffer")
const queueMicrotask = forbiddenFunction("queueMicrotask")
```

Also add hostile matrix cases that assert `crypto.randomUUID()`, `crypto.getRandomValues(...)`, `performance.now()`, and `Buffer.from(...)` fail closed for both adapters.

### CR-02: BLOCKER - Runtime execution trusts stale or forged validation metadata

**Status:** RESOLVED

**File:** `packages/runtime-js/src/executor.ts:91`
**Issue:** `executableSource()` only checks `revision.validation.valid` before transpiling and executing `revision.source`. It does not re-run validation, verify `sourceHash`, or verify `sourceBytes` against the actual source. If a persisted Strategy Revision has stale or tampered validation metadata, forbidden source can execute. I confirmed a forged-valid revision containing `import("node:fs"); return { activationOrders: [], strategyMemory: { ok: true } }` returns `ok: true` instead of failing closed. This also means the dynamic-import hostile test at `packages/runtime-js/src/hostile-matrix.test.ts:169` only proves validation rejects normal submissions, not that the runtime boundary rejects the actual hostile source it executes.

**Fix:**
```ts
const executableSource = (revision: StrategyRevision) => {
  const report = validateStrategySource(revision.source, {
    runtimeVersion: revision.runtime.version,
    specVersion: revision.engineCompatibility.spec,
    engineVersion: revision.engineCompatibility.engine,
  })
  if (!report.valid || report.sourceHash !== revision.sourceHash) {
    return {
      ok: false,
      violation: toInvalidOutputViolation("Strategy Revision failed runtime validation"),
    }
  }
  // then transpile
}
```

Add tests that forge `validation.valid: true` around dynamic import, `process`, `require`, filesystem, network, and constructor-recovery sources and assert execution fails before any adapter returns success.

### CR-03: BLOCKER - Default worker-thread adapter ignores output byte caps

**Status:** RESOLVED

**File:** `packages/runtime-js/src/adapter.ts:50`
**Issue:** The default active adapter reports `outputByteLimit: false`, and `packages/runtime-js/src/worker-thread-adapter.ts:8` forwards only `source`, `methodName`, `input`, and `timeoutMs`. `request.outputByteLimit` is ignored, and `packages/runtime-js/src/worker-bridge.ts:87` receives the worker message without any byte cap before returning it for schema normalization. A hostile default-runtime Strategy can allocate and structured-clone a very large output into the host process before the executor rejects it. This leaves ISO-05 only partially enforced for the default adapter, which is still the production default selected by `apps/worker/src/runtime-config.ts:35`.

**Fix:**
```ts
// Pass outputByteLimit through worker-thread-adapter and enforce it
// inside the worker harness before postMessage.
const serialized = JSON.stringify(result)
if (new TextEncoder().encode(serialized).length > outputByteLimit) {
  return {
    ok: false,
    violation: { type: "OVERSIZED_OUTPUT", message: "Strategy output exceeded byte limit" },
  }
}
```

Add adapter contract tests proving `outputByteLimit` is enforced by the worker-thread adapter before the parent accepts the result, not only by later schema parsing.

## Fix Verification

Commands run after fixes:

- `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts executor.test.ts hostile-matrix.test.ts subprocess-adapter.test.ts isolation-boundary.test.ts` - PASS, 9 files / 150 tests.
- `pnpm --filter @cowards/runtime-js typecheck` - PASS.
- `pnpm --filter @cowards/worker test -- runner.test.ts` - PASS, 1 file / 14 tests.
- `pnpm --filter @cowards/worker typecheck` - PASS.
- `pnpm --filter @cowards/spec test -- spec.test.ts` - PASS.
- `pnpm exec prettier --check packages/runtime-js/src apps/worker/src .planning/phases/10-runtime-isolation-hardening` - PASS.

## Verification Notes

Commands run during review:

- `pnpm --filter @cowards/runtime-js test -- hostile-matrix.test.ts adapter-contract.test.ts subprocess-adapter.test.ts isolation-boundary.test.ts` - PASS, 9 files / 129 tests.
- `pnpm --filter @cowards/worker test -- runner.test.ts` - PASS, 1 file / 14 tests.
- `pnpm --filter @cowards/spec test -- spec.test.ts` - PASS, 1 file / 11 tests.
- Targeted probes with forged-valid revisions confirmed both worker-thread and subprocess adapters return `ok: true` for `crypto.randomUUID()` and `performance.now()`.

Passing tests should not be treated as closure for Phase 10 because the current hostile matrix misses the blocker cases above.

---

_Reviewed: 2026-05-18T17:59:12Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_

## Re-Review - 2026-05-18T18:09:13Z

**Status:** issues_found
**Scope:** Phase 10 runtime isolation review fixes only.

### Prior Blocker Closure

- CR-01 nondeterministic globals: closed for the prior named globals. `crypto`, `performance`, `Buffer`, and `queueMicrotask` are now blocked by source validation and shadowed in both worker-thread and subprocess harness wrappers.
- CR-02 forged/stale validation metadata: closed. `createRuntimeFromRevision` now revalidates the actual source and checks source hash and byte count before adapter execution.
- CR-03 worker-thread output byte cap: not fully closed. The new cap catches large JSON string output, but it does not prevent large non-JSON structured-clone payloads from crossing from the worker into the host.

### Commands / Evidence

- `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts executor.test.ts hostile-matrix.test.ts` - PASS, 9 files / 150 tests.
- `pnpm --filter @cowards/runtime-js typecheck` - PASS.
- `pnpm --filter @cowards/worker test -- runner.test.ts` - PASS, 1 file / 14 tests.
- `pnpm --filter @cowards/worker typecheck` - PASS.
- Targeted worker-thread adapter probe with `outputByteLimit: 128` and `strategyMemory: new ArrayBuffer(1024 * 1024)` returned `{"ok":true,"type":"[object ArrayBuffer]","byteLength":1048576}`. This proves the payload crossed into the host despite the cap.

## Re-Review Critical Issues

### RR-CR-01: BLOCKER - Worker output cap is bypassed by non-JSON structured-clone payloads

**File:** `packages/runtime-js/src/worker-harness.ts:71`
**Issue:** `capRuntimeResult` uses `JSON.stringify(result)` to measure output size, but then returns the original `result` at `packages/runtime-js/src/worker-harness.ts:96` and posts it to the parent at `packages/runtime-js/src/worker-harness.ts:174`. Cloneable non-JSON objects such as `ArrayBuffer`, `Map`, and `Set` can serialize as tiny JSON (`{}`) while carrying large backing data through the worker message channel. I verified the worker-thread adapter returns `ok: true` with a 1 MiB `ArrayBuffer` result under a 128-byte `outputByteLimit`, so the host receives hostile output before executor normalization can reject it. This leaves the prior default-adapter byte-cap blocker partially open.
**Fix:** Enforce JSON-only output inside the worker before `postMessage`, reject non-plain/non-JSON values, and only post the capped sanitized payload. Mirror the subprocess harness' `isJsonValue` validation before byte measurement, then post the parsed JSON form or a runtime violation:

```ts
if (result.ok && !isJsonValue(result.value)) {
  return {
    ok: false,
    violation: {
      type: "INVALID_OUTPUT",
      message: "Strategy method must return JSON-only data",
    },
  }
}

const serialized = JSON.stringify(result)
if (byteLength(serialized) > outputByteLimit()) {
  return {
    ok: false,
    violation: {
      type: "OVERSIZED_OUTPUT",
      message: `Strategy output exceeded ${outputByteLimit()} bytes`,
    },
  }
}

return JSON.parse(serialized)
```

Add an adapter-contract regression test that returns `new ArrayBuffer(1024 * 1024)` or a large `Map` under a small `outputByteLimit` and asserts the worker-thread adapter returns a failure before the parent receives cloneable backing data.

### Residual Risk

The current tests cover oversized strings and the prior forbidden globals, but they do not exercise cloneable non-JSON payloads whose JSON representation is small. Until the worker harness rejects those before `postMessage`, the default adapter still has a host-memory exposure at the runtime boundary.

## Re-Review Fix Closure - 2026-05-18T18:14:00Z

**Status:** resolved

RR-CR-01 was fixed by making the worker-thread harness validate JSON-only success payloads before byte measurement and by posting only the serialized-and-parsed JSON result after the cap check. Cloneable non-JSON objects such as `ArrayBuffer` now fail inside the worker with `INVALID_OUTPUT` instead of crossing into the host process.

Regression coverage added:

- `packages/runtime-js/src/adapter-contract.test.ts` now exercises `new ArrayBuffer(1024 * 1024)` under `outputByteLimit: 128` and expects `INVALID_OUTPUT`.

Verification after the fix:

- `pnpm --filter @cowards/runtime-js test -- adapter-contract.test.ts executor.test.ts hostile-matrix.test.ts subprocess-adapter.test.ts isolation-boundary.test.ts` - PASS, 9 files / 151 tests.
- `pnpm --filter @cowards/runtime-js typecheck` - PASS.
- `pnpm --filter @cowards/worker test -- runner.test.ts` - PASS, 1 file / 14 tests.
- `pnpm --filter @cowards/worker typecheck` - PASS.
- `pnpm exec prettier --check packages/runtime-js/src apps/worker/src .planning/phases/10-runtime-isolation-hardening` - PASS.
