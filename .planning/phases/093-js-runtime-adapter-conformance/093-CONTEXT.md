# Phase 93: JS Runtime Adapter Conformance - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 93 proves existing JS runtime adapters conform to the v1.14 ABI boundary, or to one explicit conformance bridge, while keeping Strategy execution worker-owned and runtime-js-owned.

This phase should not move hostile Strategy execution into web/API/Go backend processes. It should not promote container or non-JS runtimes to counted production play. Its job is conformance evidence, limit alignment, and failure classification integrity.

## Approved Decisions

### D-01 No Runtime Architecture Rewrite

Do not rewrite the runtime architecture in Phase 93.

Strategy execution remains owned by the worker and `runtime-js`. The TypeScript worker/runtime may remain the execution owner until a later runtime migration is justified.

### D-02 Single Conformance Bridge Allowed

Prefer a single explicit v1.14 ABI conformance bridge around the existing adapter interface if directly converting every adapter is too invasive for this phase.

The bridge must be named, tested, and monitored. It must not become an implicit adapter drift layer.

### D-03 Adapter Coverage

Worker-thread, subprocess, and container-subprocess adapters must prove conformance through the same bridge or envelope tests.

Coverage must include method names, inputs, outputs, timeout, output caps, metadata, and failure classification.

### D-04 Limit Alignment

Align effective limits across:

- Spec runtime metadata.
- `runtime-js` guards.
- Worker runtime config.
- Subprocess IPC.
- Container adapter metadata.
- Sandbox probes.
- Boundary monitors.

Limits include timeout, stdout bytes, stderr bytes, source bytes, StrategyMemory bytes, SoldierMemory bytes, objective payload bytes, filesystem, network, shell, package policy, environment, and resource limits.

### D-05 Failure Classification

Preserve classification:

- Player-caused runtime violations complete the Match/Chronicle path as Strategy failures.
- Subprocess/container infrastructure failures remain system failures and retry/system-classified.

System failures must not become player losses.

### D-06 Hostile And Determinism Probes

Run hostile/determinism probes for:

- Time.
- Randomness.
- Filesystem.
- Network.
- Environment.
- Shell/dynamic code.
- Stdout/stderr caps.
- Memory limits.
- Source limits.
- Objective payload limits.
- Malformed output.
- Timeout.

### D-07 Container Runtime Status

Keep container-subprocess evidence-only and non-counted in v1.14 unless a later promotion gate explicitly says otherwise.

### D-08 Executable API Absence

Add or keep monitors proving executable runtime APIs remain absent from web/API and Go backend packages.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/092-runtime-abi-v1-14-contract/092-CONTEXT.md`
- `packages/runtime-js/src/adapter.ts`
- `packages/runtime-js/src/executor.ts`
- `packages/runtime-js/src/worker-thread-adapter.ts`
- `packages/runtime-js/src/subprocess-adapter.ts`
- `packages/runtime-js/src/container-subprocess-adapter.ts`
- `packages/runtime-js/src/subprocess-ipc.ts`
- `packages/runtime-js/src/subprocess-harness.ts`
- `packages/runtime-js/src/adapter-contract.test.ts`
- `packages/runtime-js/src/hostile-matrix.test.ts`
- `packages/runtime-js/src/sandbox-evaluation.ts`
- `apps/worker/src/runtime-config.ts`
- `apps/worker/src/runner.ts`
- `apps/worker/src/runner.test.ts`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/schemas.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-service-boundary-imports.ts`

## Codebase Context

Current adapter shape:

- Runtime-js exposes a `StrategyExecutionAdapter` interface with `execute({ source, methodName, input, timeoutMs, outputByteLimit })`.
- Worker-thread adapter delegates to the worker bridge.
- Subprocess adapter uses one-shot JSON IPC with capped stdout/stderr and system-failure classification for infrastructure errors.
- Container-subprocess adapter uses the subprocess harness inside Docker with no network, read-only root, tmpfs scratch, dropped capabilities, and resource limits.

Current execution path:

- Worker loads revisions, creates runtime-js runtimes from revisions, and dispatches by player side.
- Runtime-js validates/transpiles revision source before adapter execution.
- Runtime-js normalizes method outputs through `StrategyResultSchema` and `SoldierBrainResultSchema`.
- Worker records subprocess system failures separately from runtime violations.

Design pressure:

- Phase 92 makes the ABI public and strict.
- Phase 93 must prove existing adapters satisfy that ABI without pretending worker-thread or subprocess boundaries are production hostile-code isolation.
- Boundary monitors already compare runtime adapter metadata with spec adapter records; Phase 93 should turn that into explicit conformance coverage.

## Planning Notes

Planning should cover:

- Whether the ABI bridge wraps `createRuntimeFromRevision`, `StrategyExecutionAdapter.execute`, or subprocess IPC.
- How method-specific envelopes are built and validated without duplicating engine logic.
- How private diagnostics are redacted before any public evidence.
- How adapter metadata maps to spec adapter IDs.
- How worker config and boundary monitors assert adapter absence from web/API/Go.
- Which tests run by default versus Docker/container-gated tests.

## Deferred To Later Phases

- Phase 94 owns Go artifact consumption and fork parity.
- Phase 95 owns final topology, privacy, board realism, no-fallback, and promotion/defer evidence.
- Future runtime promotion work owns production hostile-code sandbox promotion and non-JS counted play.
