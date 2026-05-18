---
phase: 10-runtime-isolation-hardening
status: planned
requirements: [ISO-01, ISO-02, ISO-03, ISO-04, ISO-05, ISO-06, ISO-07]
plans: [10-01-PLAN.md, 10-02-PLAN.md, 10-03-PLAN.md, 10-04-PLAN.md, 10-05-PLAN.md]
---

# Phase 10 Manifest: Runtime Isolation Hardening

## Wave Structure

| Wave | Plans | Purpose |
| --- | --- | --- |
| 1 | `10-01-PLAN.md` | Define `StrategyExecutionAdapter`, keep worker-thread as default, expose adapter metadata. |
| 2 | `10-02-PLAN.md` | Add opt-in subprocess adapter with no-shell JSON IPC, minimal env, timeout kill, and byte caps. |
| 3 | `10-03-PLAN.md` | Expand hostile Strategy matrix and runtime/system failure taxonomy coverage. |
| 4 | `10-04-PLAN.md` | Wire worker-side adapter selection, visibility, and propagation tests. |
| 5 | `10-05-PLAN.md` | Add boundary audit tests and complete ISO validation evidence scaffold. |

## Source Audit

| Source | ID | Feature / Requirement | Plan | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| GOAL | Phase 10 | Make the Strategy runtime boundary explicit, test hostile code, and spike stronger process/container/WASM isolation. | 10-01..10-05 | COVERED | Adapter boundary, subprocess implementation, hostile tests, worker propagation, and validation gates are planned. |
| REQ | ISO-01 | Developer can identify active Strategy execution adapter and isolation boundary. | 10-01, 10-04, 10-05 | COVERED | Metadata API, worker log/config visibility, validation evidence. |
| REQ | ISO-02 | Strategy source stays out of web/API execution and runs only through worker/runtime boundaries. | 10-01, 10-04, 10-05 | COVERED | Package subpath preservation plus import boundary tests. |
| REQ | ISO-03 | Replaceable execution adapter boundary without engine rule changes. | 10-01 | COVERED | `StrategyExecutionAdapter` wraps existing `StrategyRuntime` without engine edits. |
| REQ | ISO-04 | Subprocess/container/WASM/WASI spike or implementation with schema-valid JSON input/output. | 10-02, 10-05 | COVERED | Opt-in subprocess adapter uses schema-validated one-shot JSON IPC. |
| REQ | ISO-05 | Timeout, output caps, resource bounds where available, minimal env, no inherited host capabilities. | 10-01, 10-02, 10-03 | COVERED | Worker resource limits retained; subprocess timeout kill, byte caps, minimal env, no shell. |
| REQ | ISO-06 | Hostile tests cover forbidden globals, dynamic import, worker/process, fs/network, loops, memory, oversized/invalid output, exceptions. | 10-03 | COVERED | Matrix tests run through runtime adapter boundary. |
| REQ | ISO-07 | Worker/runtime tests distinguish strategy violations from system failures. | 10-02, 10-03, 10-04 | COVERED | System error class/codes and worker propagation tests. |
| CONTEXT | D-01 | Real `StrategyExecutionAdapter` boundary and attempted subprocess adapter. | 10-01, 10-02 | COVERED | Boundary first, subprocess second. |
| CONTEXT | D-02 | If platform friction occurs, leave contract tests and clear stronger-isolation path. | 10-02, 10-05 | COVERED | Plan requires implementation attempt and documentation only as fallback with tests. |
| CONTEXT | D-03 | Worker-thread adapter remains default. | 10-01, 10-04 | COVERED | Default config remains `worker-thread`. |
| CONTEXT | D-04 | Add configurability and visibility; do not make stronger adapter default. | 10-01, 10-04 | COVERED | Runtime config and logs expose active adapter. |
| CONTEXT | D-05 | Subprocess uses no shell. | 10-02 | COVERED | `spawn`/`execFile` with `shell: false`; no shell commands. |
| CONTEXT | D-06 | IPC one-shot JSON or JSON-lines with schema-valid input/output. | 10-02 | COVERED | One-shot stdin/stdout JSON contract. |
| CONTEXT | D-07 | Minimal env, no app secrets, stdout/stderr caps, timeout kill, no unnecessary host capabilities. | 10-02 | COVERED | Adapter options and tests cover this. |
| CONTEXT | D-08 | Runtime/system failures more granular than the existing prototype. | 10-03, 10-04 | COVERED | Granular codes in runtime system errors and strategy violations. |
| CONTEXT | D-09 | Distinguish timeout, forbidden capability, invalid output, oversized output, malformed IPC, nonzero exit, signal termination, system failure. | 10-02, 10-03, 10-04 | COVERED | Player-caused vs infrastructure categories explicitly tested. |
| CONTEXT | D-10 | Only player-caused violations enter gameplay semantics. | 10-03, 10-04, 10-05 | COVERED | Worker propagation tests and validation scan. |
| CONTEXT | D-11 | Prefer hostile test matrix over isolated examples. | 10-03 | COVERED | Table-driven hostile matrix required. |
| CONTEXT | D-12 | Cover forbidden globals, dynamic import, worker/process, fs/network, loop, memory, oversized output, invalid output, thrown exceptions, malformed subprocess responses. | 10-02, 10-03 | COVERED | Matrix plus subprocess malformed IPC cases. |
| RESEARCH | Adapter metadata/config in runtime and worker logs/status. | 10-01, 10-04 | COVERED | Metadata API and worker startup log. |
| RESEARCH | Preserve `@cowards/runtime-js` safe entrypoint and `@cowards/runtime-js/worker` executable split. | 10-01, 10-05 | COVERED | Package boundary and import audit tests. |
| RESEARCH | Introduce adapter behind existing `StrategyRuntime`; engine unchanged. | 10-01 | COVERED | No `packages/engine` writes planned. |
| RESEARCH | Prefer subprocess implementation now; keep Docker/container/WASM as documented later direction. | 10-02, 10-05 | COVERED | Docker end-to-end remains Phase 12; Phase 10 includes note only. |
| RESEARCH | Worker threads are prototype containment, not final hostile-code sandbox. | 10-01, 10-05 | COVERED | Metadata description and validation notes state this. |
| RESEARCH | Malformed IPC/nonzero exit/signal/spawn failure are system outcomes, not public runtime violations. | 10-02, 10-04 | COVERED | Dedicated system failure propagation tests. |

## Deferred Ideas Not Planned

- Making subprocess, container, or WASM/WASI the default runtime is intentionally deferred by Phase 10 context.
- Docker end-to-end isolation is not a Phase 10 default; Phase 12 owns Docker-backed local/CI reliability.
