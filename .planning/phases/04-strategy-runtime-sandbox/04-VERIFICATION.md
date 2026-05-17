---
phase: 04-strategy-runtime-sandbox
status: gaps_found
verified_at: 2026-05-17T23:11:09Z
score: "10/11 requirements verified"
requirements:
  RUN-01: verified
  RUN-02: verified
  RUN-03: verified
  RUN-04: verified
  RUN-05: verified
  RUN-06: verified
  RUN-07: verified
  RUN-08: failed
  RUN-09: verified
  RUN-10: verified
  TEST-04: verified
gaps:
  - requirement: RUN-08
    truth: "Runtime prevents forbidden capabilities without using Node vm as the security boundary"
    status: failed
    reason: "The active worker harness imports node:vm and executes user strategy source with vm.createContext and vm.Script, despite Phase 4 roadmap notes and AGENTS.md explicitly saying not to use Node vm as the security boundary."
    artifacts:
      - path: packages/runtime-js/src/worker-harness.ts
        issue: "WORKER_HARNESS_SOURCE imports node:vm, creates the strategy sandbox with vm.createContext, and runs strategy source with vm.Script."
    missing:
      - "Replace the node:vm-based execution boundary with a non-vm worker/subprocess/container/WASM/WASI boundary, or add an explicit accepted override if this prototype deviation is intentional."
---

# Phase 4: Strategy Runtime Sandbox Verification

## Verdict

**Status: gaps_found.** Phase 4 is mostly implemented and the focused automated checks pass, but the phase goal is not fully achieved because the active runtime sandbox relies on `node:vm` to execute user Strategy source. That directly conflicts with the Phase 4 roadmap note and project non-negotiable: do not use Node `vm` as the security boundary.

**Score:** 10/11 assigned requirements verified. RUN-08 is blocked by the `node:vm` execution boundary.

## Goal Check

**Phase goal:** Validate and execute JS/TS Strategy Revisions behind a replaceable worker-only boundary.

| Success Criterion | Status | Evidence |
| --- | --- | --- |
| User-authored JS/TS strategy source can be validated and wrapped into an immutable Strategy Revision artifact. | VERIFIED | `validateStrategySource` checks size, required export/methods, forbidden patterns, async methods, and transpilation in `packages/runtime-js/src/validation.ts`; `buildStrategyRevision` creates schema-parsed frozen artifacts in `packages/runtime-js/src/revision.ts`. |
| Runtime evaluates `selectActivations` and `soldierBrain` through the canonical `StrategyRuntime` interface. | VERIFIED | `createRuntimeFromRevision` returns `selectActivations` and `runSoldierBrain` methods matching `StrategyRuntime` and delegates to the worker bridge in `packages/runtime-js/src/executor.ts`. |
| Runtime enforces schema, source, memory, objective, timeout, and forbidden capability constraints. | FAILED | Schema/source/memory/objective/timeout checks exist, but forbidden capability enforcement is implemented in `packages/runtime-js/src/worker-harness.ts` with `node:vm`, which violates the explicit Phase 4 boundary constraint. |
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
| `packages/runtime-js/src/worker-harness.ts` | Isolated one-shot strategy execution harness. | FAILED | Active execution harness uses `node:vm` and `vm.Script`; this is the blocking boundary gap. |
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
| RUN-08 | FAILED | Forbidden capability checks exist, but the active execution boundary is `node:vm` in `packages/runtime-js/src/worker-harness.ts`, contrary to the explicit Phase 4 and project security rule. |
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
| Forbidden capability boundary | FAILED | The boundary is wired, but it is implemented by `vm.createContext` and `vm.Script` in the harness. |

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter @cowards/spec test -- spec.test.ts` | PASS | 1 test file, 9 tests passed. |
| `pnpm --filter @cowards/runtime-js test -- validation.test.ts revision.test.ts executor.test.ts integration.test.ts` | PASS | 5 test files, 62 tests passed. |
| `pnpm --filter @cowards/runtime-js typecheck` | PASS | `tsc --noEmit` completed successfully. |
| `pnpm lint` | PASS | 9 package lint tasks successful; all cached in this run. |
| Anti-pattern scan over runtime/spec/worker files | WARNING | Only benign worker startup `console.log` calls and test fixture forbidden-pattern strings found. |

## Residual Risk

- The roadmap marks Phase 4 as `mode: mvp`, but the phase goal is not a user story. This verification used the explicit Phase 4 goal, success criteria, and assigned requirements.
- Static forbidden-pattern scanning is intentionally not a full hostile-code proof. Even after the `node:vm` gap is fixed, RUN-08 should be treated as prototype-grade unless a stronger isolation boundary is implemented.
- Live database/queue services were not started. That is not a Phase 4 blocker because focused runtime, worker integration, and API wiring were inspectable without live services.
- `apps/web/package.json` and Next config include the safe `@cowards/runtime-js` package for validation workflows, but executable `@cowards/runtime-js/worker` imports are absent from web/API code.

## Gaps Summary

One blocking gap prevents a passing verdict:

1. **RUN-08: Runtime forbidden capability boundary uses Node vm.** `packages/runtime-js/src/worker-harness.ts` imports `node:vm`, creates a context with `vm.createContext`, and executes user strategy source with `new vm.Script(...).runInContext(...)`. This may be a pragmatic prototype, but it directly violates the Phase 4 contract and project non-negotiable unless explicitly overridden.

Structured gap details are included in the YAML frontmatter for follow-up planning.

---

_Verified: 2026-05-17T23:11:09Z_
_Verifier: the agent (gsd-verifier)_
