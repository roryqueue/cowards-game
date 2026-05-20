# Phase 24: Production Runtime Boundary Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 24-Production Runtime Boundary Spike
**Mode:** Abbreviated per user request after Phase 21.

## Recommended Decisions Accepted

- Containerized subprocess is the leading production-boundary recommendation.
- Hardened subprocess is acceptable as an intermediate prototype step.
- Worker-thread remains local/dev fallback only.
- WASM/WASI remains future/prototype direction, not v1.3 production path.
- Runtime work stays behind `StrategyExecutionAdapter`.
- Engine rules and Strategy API contracts do not change.
- JSON IPC remains strict.
- Adapter metadata must expose resource controls and production-readiness.
- Hostile tests expand around the chosen path.
- System failures do not become player losses.

## Alternatives Not Pursued

- Treating worker threads as production sandbox.
- Selecting Node WASI for hostile JS/TS Strategy execution.
- Changing Strategy language/runtime contract.
- Penalizing players for sandbox infrastructure failures.

## Deferred Ideas

- Non-JS Strategy runtimes.
- Full WASM/WASI migration.
- microVM runtime.
- Distributed sandbox service.
