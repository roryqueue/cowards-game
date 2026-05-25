# Phase 113: Python Runtime Execution Behind Broker ABI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 113 implements Python Strategy execution as a registered runtime implementation behind the Strategy Execution Service / Runtime Broker ABI. It must support the canonical Strategy methods needed for a full Match while preserving schema validation, timeout/failure taxonomy, privacy, hostile-code isolation, and no execution in Go/web/API.

This phase does not promote Python to counted/ranked play, install arbitrary packages, replace JS/TS support, or give Python backend/persistence/scoring/public evidence authority.

</domain>

<decisions>
## Implementation Decisions

### Runtime Host
- **D-01:** Use a hardened subprocess host for the Python pilot.
- **D-02:** Expose only tiny deterministic builtins and no filesystem/network/package/shell/database capabilities.
- **D-03:** Python runtime code must not use Node `vm` and must not execute inside Go or Next.js web/API routes.

### ABI Parity
- **D-04:** Python execution must use the same JSON/schema-validated runtime execution service envelope family as JS/TS.
- **D-05:** Python invalid output, timeout, crash, subprocess exit/signal, malformed IPC, oversized payload, forbidden capability, stderr, and stack behavior must map to the broker/runtime failure taxonomy.
- **D-06:** No JS/TS fallback is allowed if the Python runtime is unavailable or rejects the artifact.

### Match Compatibility
- **D-07:** Mixed JS/TS-vs-Python non-counted matches are allowed in the pilot.
- **D-08:** Successful Python execution returns internal runtime results only; Go remains responsible for orchestration, completion, persistence, scoring, and public replay/evidence.

### the agent's Discretion
The agent may choose exact subprocess invocation and adapter implementation details, provided the runtime remains inside the isolated runtime-service boundary and tests cover failure taxonomy parity.

</decisions>

<specifics>
## Specific Ideas

The user accepted the recommended runtime direction: hardened subprocess host, minimal deterministic builtins, mixed JS/TS versus Python allowed for non-counted proof, and no fallback path.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - PYRUN requirements.
- `.planning/ROADMAP.md` - Phase 113 scope and success criteria.
- `.planning/phases/110-broker-registry-baseline-and-contract-hardening/110-CONTEXT.md` - Broker contract.
- `.planning/phases/111-strategy-artifact-language-metadata-and-eligibility/111-CONTEXT.md` - Artifact metadata.
- `.planning/phases/112-python-submission-validation-and-diagnostics/112-CONTEXT.md` - Validation and diagnostic policy.

### Runtime Baseline
- `.planning/artifacts/v1.16-runtime-service-boundary.json` - Runtime service authority baseline.
- `.planning/artifacts/v1.16-no-typescript-backend-topology.json` - Normal topology baseline.
- `AGENTS.md` - No Node `vm`, hostile Strategy, schema validation, privacy constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/runtime-service/src/execute-match.ts`: Current Match execution surface for isolated runtime service.
- `packages/runtime-js/src/strategy-runtime.ts`: Existing JS/TS runtime behavior and failure handling.
- `packages/runtime-python/src/python_runtime_host.py`: Python host seed to harden/extend.
- `packages/runtime-python/src/python-subprocess-adapter.ts`: Python subprocess adapter seed.
- `packages/engine/src/**`: Runtime interface and deterministic Match runner.
- `packages/spec/src/runtime-execution-service.ts`: ABI schema definitions.

### Established Patterns
- Runtime failures must classify Strategy failures separately from system failures.
- Public outputs must redact runtime internals.
- Engine rules stay deterministic and side-effect free; runtime adapters provide Strategy decisions only.

### Integration Points
- Phase 114 will verify Go invokes this runtime path only through the runtime-service envelope.
- Phase 115 will use this execution path for the Python starter proof.

</code_context>

<deferred>
## Deferred Ideas

- Production-grade sandbox.
- PyPI/package install support.
- Python ranked/ladder counted play.
- Replacing JS/TS Strategy support.

</deferred>

---

*Phase: 113-python-runtime-execution-behind-broker-abi*
*Context gathered: 2026-05-25*
