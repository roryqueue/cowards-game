# Phase 225: Python Production Support Path - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 225 promotes Python through the shared provider model. It handles Python validation, runtime execution, counted eligibility gates, product labels, public evidence, and signed-in Python proof without changing Rust/Zig behavior.

</domain>

<decisions>
## Implementation Decisions

### Python Promotion
- **D-01:** Python support must be promoted through provider/runtime evidence, not label changes.
- **D-02:** Python execution remains behind runtime-service / Runtime Broker / Python provider boundaries.
- **D-03:** Python counted eligibility may be enabled only after validation, runtime, failure taxonomy, no-fallback, privacy, product, and signed-in tests pass.

### Python Policy
- **D-04:** Python package policy stays constrained to what the provider model explicitly supports. No rich Python package ecosystem should be introduced in this phase unless already supported safely by the provider contract.
- **D-05:** Public output may show provider-derived language labels and evidence status, but not source, memory, objective payloads, diagnostics, env, paths, package internals, or runtime internals.

### The Agent's Discretion
- Choose whether Python's current subprocess lane is sufficient for counted support or whether a stricter runtime candidate must be used, but do not overclaim production sandbox certification without evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PY-01..PY-05`.
- `.planning/ROADMAP.md` - Phase 225 goal and success criteria.
- `.planning/phases/224-strategylanguageprovider-runtime-contract/224-CONTEXT.md` - Provider and ABI decisions.

### Code
- `packages/runtime-python/src/metadata.ts` - Python runtime metadata.
- `packages/runtime-python/src/validation.ts` - Python validation.
- `packages/runtime-python/src/python-subprocess-adapter.ts` - Python subprocess runtime adapter.
- `packages/runtime-python/src/python_runtime_host.py` - Python execution host.
- `packages/runtime-python/src/python_validation_host.py` - Python validation host.
- `packages/spec/src/runtime.ts` - Current Python non-counted semantics and eligibility.
- `packages/persistence/src/workshop.ts` - Python Workshop templates and samples.
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts` - Python exhibition proof baseline.
- `apps/web/e2e/v1-20-reliability-proof.spec.ts` - Python reliability proof baseline.

### Evidence
- `.planning/artifacts/v1.18-exhibition-beta-proof.md` - Python beta proof.
- `.planning/artifacts/v1.19-runtime-isolation-readiness.md` - Python/runtime isolation readiness evidence.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - Python stronger-claim gaps.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Python source validation and runtime metadata already exist.
- Prior signed-in proofs already cover non-counted Python exhibitions and can be adapted for counted proof.

### Established Patterns
- Python currently emits `NON_COUNTED_RUNTIME` warnings; those must become provider-derived current semantics.
- Runtime failures must fail closed and never fall back to JS/TS.

### Integration Points
- Workshop validation/save, Account revision reads, exhibition/competition entry, MatchSet result, replay, public discovery, and monitors.

</code_context>

<specifics>
## Specific Ideas

Python should be the first non-JS production path because its provider lane already has the broadest signed-in beta history.

</specifics>

<deferred>
## Deferred Ideas

Rich Python package/dependency support is deferred to a future runtime/package policy phase unless Phase 225 can satisfy all deterministic and supply-chain requirements within v1.32 scope.

</deferred>

---

*Phase: 225-Python Production Support Path*
*Context gathered: 2026-05-31*
