# Phase 118: Runtime Resource and Process Hardening - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 118 hardens runtime process behavior and isolation candidate evidence. It improves timeout, caps, lifecycle, redaction, escape probes, and no-fallback behavior for Python while preserving JS/TS behavior.

</domain>

<decisions>
## Implementation Decisions

### Isolation Candidate
- **D-01:** Use hardened subprocess plus container/gVisor-style evidence as the v1.18 stance.
- **D-02:** Do not claim production sandbox promotion.
- **D-03:** Container evidence may be required for readiness evidence, but not as a counted-play promotion.

### Process Controls
- **D-04:** Python launch should use no shell, empty environment, isolated/safe-path Python flags where practical, and deterministic runtime metadata.
- **D-05:** Timeouts, output caps, stderr caps, malformed IPC, crash, signal, and process cleanup must classify deterministically.
- **D-06:** Stopped Python runtime and stopped runtime service must fail closed without JS/TS, Go, or TypeScript backend fallback.

### Hostile Probes
- **D-07:** Add or extend probes for filesystem, network, import/package, shell/process, env, host path, output flood, stderr flood, timeout loop, crash, and malformed JSON.
- **D-08:** Public diagnostics must be redacted before they reach public evidence.

### the agent's Discretion
The agent may choose whether to implement hardening in runtime-python, runtime-service, or shared spec helpers, as long as Go/web/API never execute Strategy code.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Runtime And Isolation
- `.planning/REQUIREMENTS.md` - ISO requirements.
- `.planning/ROADMAP.md` - Phase 118 scope and success criteria.
- `.planning/artifacts/v1.17-runtime-broker-registry.json` - Current broker registry.
- `.planning/artifacts/runtime-sandbox-evaluation.json` - Existing sandbox candidate evidence.
- `packages/runtime-python/src/python-subprocess-adapter.ts` - Python subprocess adapter behavior.
- `packages/runtime-python/src/python_runtime_host.py` - Python runtime host.
- `packages/runtime-js/src/sandbox-evaluation.ts` - Existing sandbox evaluation and hostile probes.
- `apps/runtime-service/src/redaction.ts` - Runtime-service redaction behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Python runtime adapter already captures timeout, stdout, stderr, and malformed IPC cases.
- Runtime-service redaction utilities already normalize public system failure diagnostics.
- Sandbox evaluation already models runtime candidates and hostile probes for JS/TS adapters.

### Established Patterns
- Python isolated mode can remove current directory and user site-packages from `sys.path`, but it is hardening, not sandboxing.
- Docker/gVisor evidence should be treated as candidate evidence, not product deployment scope.

### Integration Points
- Phase 119 should reuse hardening diagnostics and redaction vocabulary.
- Phase 122 should monitor the probes and no-fallback drills added here.

</code_context>

<specifics>
## Specific Ideas

Plans should avoid widening the risk from synchronous child-process execution. Container/gVisor evidence should be framed as readiness evidence only.

</specifics>

<deferred>
## Deferred Ideas

- Cloud sandbox deployment.
- Long-running runtime pools.
- Arbitrary packages or dependency installs.

</deferred>

---

*Phase: 118-runtime-resource-and-process-hardening*
*Context gathered: 2026-05-25*
