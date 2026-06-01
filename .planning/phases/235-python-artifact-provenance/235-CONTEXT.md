# Phase 235: Python Artifact Provenance - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 235 adds Python artifact provenance. It should produce provider-sealed artifact evidence for constrained Python source, bind source and artifact hashes/bytes with interpreter/version metadata, preserve all existing no-package/no-import/no-host-capability restrictions, and clearly state that Python artifact provenance is not equivalent to WASM isolation or production sandbox certification.

</domain>

<decisions>
## Implementation Decisions

### Artifact Form
- **D-01:** Python artifact form should be a provider-sealed normalized source bundle plus AST/compile validation evidence and interpreter/version metadata.
- **D-02:** Do not make `.pyc` the primary artifact unless planning proves a stable deterministic hash-based bytecode path that remains portable and fail-closed.
- **D-03:** The artifact is provenance evidence for the constrained Python provider, not a new Python isolation boundary.

### Provider Proof
- **D-04:** Provider proof must bind provider id, contract version, source hash, source byte count, artifact hash, artifact byte count, interpreter/version metadata, validation policy, and compatibility metadata.
- **D-05:** Python proof should mirror the TypeScript source/artifact proof posture where applicable, with Python-specific interpreter and policy metadata.

### Runtime Policy
- **D-06:** Preserve the current no-packages, no-host-imports, no-filesystem, no-network, no-clock/random, no-eval/exec, no-dynamic-execution, and no-host-process-capability policy.
- **D-07:** Missing, stale, mismatched, unverifiable, oversized, incompatible, or policy-violating Python artifacts fail closed.
- **D-08:** No silent fallback to mutable source or another language runtime is allowed.

### Claims and Evidence
- **D-09:** Docs and evidence must explicitly say Python artifact provenance is provenance evidence only.
- **D-10:** Do not claim Python artifact provenance is equivalent to WASM/WASI isolation or production sandbox certification.
- **D-11:** Public evidence may show Python as artifact-proven but must not expose source, artifact bytes, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, stack traces, or private runtime internals.

### the agent's Discretion
- Planner may choose the exact normalized bundle format and validation evidence schema, as long as it is deterministic, interpreter-aware, fail-closed, and compatible with the existing constrained Python provider.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PYART-01..PYART-06`.
- `.planning/ROADMAP.md` - Phase 235 success criteria.
- `.planning/STATE.md` - Active v1.33 boundary notes.
- `.planning/research/SUMMARY.md` - v1.33 Python artifact provenance direction.
- `.planning/phases/234-typescript-artifact-provenance/234-CONTEXT.md` - Similar source-language artifact proof decisions to carry forward.

### Prior Decisions
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md` - Boundary and monitor expectations.
- `.planning/phases/232-live-four-language-signed-in-proof/232-CONTEXT.md` - Proof/privacy expectations.
- `.planning/phases/233-audit-archive-commit-and-tag/233-CONTEXT.md` - Closure/audit gates and non-claim discipline.

### Code
- `packages/spec/src/runtime.ts` - Python provider record, source policy, build behavior, artifact policy, and evidence requirements.
- `apps/runtime-service/src/server.ts` - Provider validation proof generation and Python validation routing.
- `packages/runtime-python/src/validation.ts` - Python source validation, source hash/bytes, validation host behavior, revision construction.
- `packages/runtime-python/src/metadata.ts` - Python interpreter/runtime metadata.
- `packages/runtime-python/src/python_validation_host.py` - AST/compile validation host.
- `packages/runtime-python/src/python_runtime_host.py` - Python runtime host behavior.
- `packages/runtime-python/src/python-host-config.ts` - Isolated host args/environment.
- `scripts/check-boundary-monitors.ts` - Boundary, provider, privacy, and label monitor surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Python validation already computes source hash/bytes, runs an isolated validation host, and fails closed on host failure or malformed diagnostics.
- `pythonExperimentalRuntimeMetadata` already records interpreter version and runtime adapter metadata.
- Runtime-service provider proof already supports optional artifact hash/bytes.

### Established Patterns
- Python counted support is constrained provider support, not general Python package support.
- Validation failures are runtime/provider evidence, not public raw diagnostics.
- Source-language artifact claims should be calibrated separately from WASM/WASI claims.

### Integration Points
- Python validation/revision construction.
- Runtime-service provider validation metadata and proof.
- Supported language/provider registry and docs/evidence labels.
- Boundary monitors, privacy scans, and no-fallback tests.

</code_context>

<specifics>
## Specific Ideas

The likely artifact should be a sealed, normalized evidence object rather than CPython bytecode by default. If planning finds a deterministic `.pyc` path, it can use it only if the evidence remains stable, interpreter-bound, and fail-closed.

</specifics>

<deferred>
## Deferred Ideas

Python package ecosystem expansion, Python WASM migration, and production sandbox certification are outside this phase.

</deferred>

---

*Phase: 235-Python Artifact Provenance*
*Context gathered: 2026-05-31*
