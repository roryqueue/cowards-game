---
phase: 04-strategy-runtime-sandbox
status: passed
verified_at: 2026-05-17T23:27:40Z
score: "11/11 requirements verified"
requirements:
  RUN-01: verified
  RUN-02: verified
  RUN-03: verified
  RUN-04: verified
  RUN-05: verified
  RUN-06: verified
  RUN-07: verified
  RUN-08: verified
  RUN-09: verified
  RUN-10: verified
  TEST-04: verified
gaps: []
---

# Phase 4: Strategy Runtime Sandbox Verification

## Verdict

**Status: passed.** Phase 4 is implemented to the planned prototype level, and RUN-08 is resolved: the active runtime harness no longer imports `node:vm` or uses `vm.Script`/`vm.createContext`. Strategy source is loaded only inside the one-shot worker boundary as a generated data-URL module with runtime forbidden-capability shadows and typed violation mapping preserved.

**Score:** 11/11 assigned requirements verified.

## Goal Check

**Phase goal:** Validate and execute JS/TS Strategy Revisions behind a replaceable worker-only boundary.

| Success Criterion | Status | Evidence |
| --- | --- | --- |
| User-authored JS/TS strategy source can be validated and wrapped into an immutable Strategy Revision artifact. | VERIFIED | `validateStrategySource` checks size, required export/methods, forbidden patterns, async methods, and transpilation in `packages/runtime-js/src/validation.ts`; `buildStrategyRevision` creates schema-parsed frozen artifacts in `packages/runtime-js/src/revision.ts`. |
| Runtime evaluates `selectActivations` and `soldierBrain` through the canonical `StrategyRuntime` interface. | VERIFIED | `createRuntimeFromRevision` returns `selectActivations` and `runSoldierBrain` methods matching `StrategyRuntime` and delegates to the worker bridge in `packages/runtime-js/src/executor.ts`. |
| Runtime enforces schema, source, memory, objective, timeout, and forbidden capability constraints. | VERIFIED | Schema/source/memory/objective/timeout checks pass; forbidden capability enforcement now runs inside `packages/runtime-js/src/worker-harness.ts` without `node:vm`, using the one-shot worker module boundary and runtime shadows for blocked capabilities. |
| Runtime tests demonstrate invalid output, timeout, thrown exception, and forbidden access behavior. | VERIFIED | `packages/runtime-js/src/executor.test.ts` covers invalid outputs, oversized memory/objective outputs, thrown exceptions, timeouts, forbidden access, constructor recovery, Promise outputs, and schema-atomic success. |

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/spec/src/types.ts` | Canonical Strategy Revision, runtime result, input/output contracts. | VERIFIED | Strategy Revision, validation report, StrategyInput, SoldierBrainInput, StrategyResult, SoldierBrainResult, and RuntimeViolation types exist. |
| `packages/spec/src/schemas.ts` | Zod schemas for runtime inputs/outputs and Strategy Revision artifacts. | VERIFIED | StrategyRevisionSchema, StrategyResultSchema, SoldierBrainResultSchema, memory/objective/source size refinements exist. |
| `packages/runtime-js/src/index.ts` | Safe default API only. | VERIFIED | Exports validation, transpilation, hashing, revision builder, and types; does not export `createRuntimeFromRevision`. |
| `packages/runtime-js/src/validation.ts` | JS/TS source validation and forbidden pattern catalog. | VERIFIED | Covers imports, dynamic imports, eval, Function, constructor recovery, process/env, require, fs/http/fetch, Date, Math.random, workers, child_process, WebAssembly, and package install tokens. |
| `packages/runtime-js/src/revision.ts` | Immutable Strategy Revision builder. | VERIFIED | Calls validation, computes deterministic id/hash/version metadata, parses with StrategyRevisionSchema, and deep-freezes the artifact. |
| `packages/runtime-js/src/worker.ts` | Worker-only executable export. | VERIFIED | Exports `createRuntimeFromRevision` only through `@cowards/runtime-js/worker`. |
| `packages/runtime-js/src/worker-bridge.ts` | Replaceable synchronous worker bridge. | VERIFIED | Uses `node:worker_threads`, `SharedArrayBuffer`, `Atomics.wait`, resource limits, empty env, and typed timeout/worker-message failure mapping. |
| `packages/runtime-js/src/worker-harness.ts` | Isolated one-shot strategy execution harness. | VERIFIED | Active execution harness imports only `node:worker_threads`, builds a generated strategy module inside the worker, and preserves typed `INVALID_OUTPUT`, `THROWN_EXCEPTION`, `FORBIDDEN_CAPABILITY`, and timeout behavior without `node:vm`. |
| `packages/runtime-js/src/executor.ts` | StrategyRuntime adapter and schema/failure normalization. | VERIFIED | Validates revision, runs each method in worker, parses outputs atomically, maps oversized/invalid outputs, preserves worker violations. |
| `packages/runtime-js/README.md` | Prototype boundary and API split documentation. | VERIFIED | Documents safe API, worker-only API, forbidden capabilities, failure semantics, prototype boundary, and future replacement path. |

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| RUN-01 | VERIFIED | `validateStrategySource` validates source before submission; web Workshop validation routes call safe validation through `validateWorkshopSource`. |
| RUN-02 | VERIFIED | `buildStrategyRevision` stores source, source hash/bytes, runtime version, engine compatibility, validation result, metadata, and returns a frozen artifact. |
| RUN-03 | VERIFIED | `createRuntimeFromRevision(...).selectActivations` evaluates StrategyInput and returns activation orders plus StrategyMemory; direct and integration tests cover this. |
| RUN-04 | VERIFIED | `runSoldierBrain` evaluates SoldierBrainInput and returns one Action plus SoldierMemory after `SoldierBrainResultSchema` parsing. |
| RUN-05 | VERIFIED | Source, StrategyMemory, SoldierMemory, objective payload, and output schema limits are enforced by validation/schemas/executor normalization. |
| RUN-06 | VERIFIED | Engine converts runtime violations into `RUNTIME_VIOLATION` events and interrupts activation; integration tests prove invalid output stones a Soldier that did not Advance. |
| RUN-07 | VERIFIED | Executor and tests map thrown exceptions to `THROWN_EXCEPTION` and infinite loops to `TIMEOUT`; engine handles violations without uncaught runtime exceptions. |
| RUN-08 | VERIFIED | `packages/runtime-js/src/worker-harness.ts` no longer imports `node:vm` or uses `vm.*`; `rg -n "node:vm|vm\\." packages/runtime-js/src` returns no matches, and runtime tests include a harness source regression check. |
| RUN-09 | VERIFIED | No `@cowards/runtime-js/worker` imports were found in `apps/web`, `packages/engine`, `packages/replay`, or `packages/persistence`; worker execution is imported by `apps/worker/src/runner.ts`. |
| RUN-10 | VERIFIED | Engine depends on the `StrategyRuntime` interface; runtime-js is an adapter behind `createRuntimeFromRevision`, and the README states the boundary is replaceable. |
| TEST-04 | VERIFIED | Runtime tests cover invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and output schema validation. |

## Integration/Data Flow

| Flow | Status | Evidence |
| --- | --- | --- |
| Web/API validation | VERIFIED | `apps/web/app/api/workshop/validate/route.ts` calls `workshopServer.validateSource`; `packages/persistence/src/workshop.ts` uses safe `validateStrategySource` from `@cowards/runtime-js`, not the worker export. |
| Submission artifact creation | VERIFIED | Workshop submit path validates source, builds a Strategy Revision, persists only valid revisions, and stores source/validation metadata through persistence. |
| Worker match execution | VERIFIED | `apps/worker/src/runner.ts` loads persisted Strategy Revisions and wraps bottom/top revisions with `createRuntimeFromRevision` from `@cowards/runtime-js/worker`. |
| Runtime to engine | VERIFIED | `createSideDispatchRuntime` dispatches engine calls to the correct player runtime; engine consumes only `StrategyRuntime`. |
| Runtime violation to Chronicle | VERIFIED | `packages/engine/src/activation.ts` emits `RUNTIME_VIOLATION` with private violation payload; `packages/replay/src/project.ts` strips raw details from public projections. |
| Forbidden capability boundary | VERIFIED | The boundary is wired through a worker-only generated module harness, forbidden globals are shadowed or blocked at method execution, and the bridge remains replaceable behind `runStrategyMethodInWorker`. |

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @cowards/spec test -- spec.test.ts` | PASS | 1 test file, 9 tests passed. |
| `pnpm --filter @cowards/runtime-js test` | PASS | 5 test files, 64 tests passed. |
| `pnpm --filter @cowards/runtime-js typecheck` | PASS | `tsc --noEmit` completed successfully. |
| `rg -n "node:vm|vm\\." packages/runtime-js/src` | PASS | No matches in runtime-js source, including production files and tests. |
| `pnpm --filter @cowards/runtime-js lint` | PASS | `eslint .` completed successfully for the runtime package. |
| Anti-pattern scan over runtime/spec/worker files | WARNING | Only benign worker startup `console.log` calls and test fixture forbidden-pattern strings found. |

## Residual Risk

- The roadmap marks Phase 4 as `mode: mvp`, but the phase goal is not a user story. This verification used the explicit Phase 4 goal, success criteria, and assigned requirements.
- Static forbidden-pattern scanning and worker-global shadowing are intentionally not a full hostile-code proof. RUN-08 is verified for the Phase 4 prototype contract, but production hostile-code isolation still requires a stronger subprocess/container/WASM/WASI-style boundary.
- Live database/queue services were not started. That is not a Phase 4 blocker because focused runtime, worker integration, and API wiring were inspectable without live services.
- `apps/web/package.json` and Next config include the safe `@cowards/runtime-js` package for validation workflows, but executable `@cowards/runtime-js/worker` imports are absent from web/API code.

## Gaps Summary

No blocking gaps remain for Phase 4 verification. RUN-08 was rechecked after replacing the Node vm execution path with the worker-only generated module harness.

---

_Verified: 2026-05-17T23:27:40Z_
_Verifier: the agent (gsd-verifier)_
