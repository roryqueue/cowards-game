# Phase 53 Research: Runtime Sandbox Hardening Prototype

**Date:** 2026-05-22
**Status:** Complete

## Recommendation

Build a sandbox evaluation harness that runs hostile Strategy probes through the existing `StrategyExecutionAdapter` boundary and emits public-safe evidence. Treat worker-thread, host subprocess, and container subprocess as executable candidates. Treat Python subprocess as experimental ABI evidence. Treat Deno-style permissions, WASM/WASI, gVisor, and microVM as tradeoff-only rows unless later phases add dedicated adapters.

## Candidate Matrix

| Candidate | Phase 53 Status | Main Value | Main Gap |
|---|---|---|---|
| Worker-thread baseline | Execute locally | Baseline behavior and regression guard for current default | Not a production hostile-code boundary; shares host process |
| Host subprocess | Execute locally | Process boundary, JSON IPC, timeout/stdout/stderr taxonomy | Host filesystem/network still inherited unless harness blocks capabilities; not sufficient alone |
| Container subprocess | Execute when Docker/image available; otherwise record skipped preflight | Best current production-candidate shape: no network, read-only root, tmpfs, memory/CPU/PID limits, dropped caps | Docker/image/deployment dependency; still needs production abuse and kernel hardening review |
| Python subprocess | Execute only as experimental ABI evidence if included | Demonstrates non-JS ABI semantics | Not counted, not production, limited product semantics |
| Deno-style permissions | Tradeoff-only | Deny-by-default permissions and permission broker ideas | No repo adapter/binary; Deno docs recommend extra OS/VM layers for untrusted code |
| WASM/WASI | Tradeoff-only | Capability-oriented runtime and host-controlled resources | No adapter/toolchain; host must still implement fuel/epoch/resource limits and package semantics |
| gVisor/runsc | Tradeoff-only | Stronger container runtime layer via `runsc`/containerd | No local `runsc`; operational/deployment prerequisite |
| microVM/Firecracker | Tradeoff-only | VM-level isolation and jailer/cgroup controls | No local toolchain; high operations cost for v1.8 |

## Existing Coverage

- `packages/runtime-js/src/hostile-matrix.test.ts` already exercises forbidden randomness, time, process/env, filesystem, network, Worker, dynamic import, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions across worker-thread and host subprocess.
- `packages/runtime-js/src/subprocess-ipc.ts` validates request/response JSON IPC and classifies malformed IPC, spawn failure, stdio caps, subprocess exit, and signals as system failures.
- `packages/runtime-js/src/container-subprocess-adapter.test.ts` verifies Docker argv controls with fake spawn.
- `apps/worker/src/runner.test.ts` verifies runtime violations differ from retryable system failures.

## Primary Source Notes

- Deno security docs state untrusted code needs layered defenses including OS sandboxing or VM/microVM isolation, not permissions alone.
- gVisor docs show `runsc` integration through containerd runtime configuration, which is a deployment-level prerequisite.
- Firecracker jailer docs show cgroup/resource-limit and chroot/jailer controls, but with significant host setup.
- Wasmtime `ResourceLimiter` limits WebAssembly instance resources but notes CPU and some memory require additional host mechanisms.

Sources:
- [Deno Security and Permissions](https://docs.deno.com/runtime/fundamentals/security/)
- [gVisor containerd quick start](https://gvisor.dev/docs/user_guide/containerd/quick_start/)
- [Firecracker jailer docs](https://github.com/firecracker-microvm/firecracker/blob/main/docs/jailer.md)
- [Wasmtime ResourceLimiter](https://docs.wasmtime.dev/api/wasmtime/trait.ResourceLimiter.html)

## Implementation Risks

- Evaluation output can accidentally expose source snippets, stderr, stack traces, host paths, or private runtime internals.
- Harness code can drift into worker/runtime defaults if placed near config without guard tests.
- Container candidate can become flaky if it requires an image pull in regular tests.
- Candidate scoring can imply production readiness unless no-promotion wording is explicit.

## Decision

Proceed with one Phase 53 plan: implement a public-safe sandbox evaluation harness, generated/checked report artifact, focused tests, and documentation that explicitly keeps all candidates unpromoted for v1.8.
