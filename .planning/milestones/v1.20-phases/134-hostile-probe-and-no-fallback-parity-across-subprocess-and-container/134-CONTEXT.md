# Phase 134: Hostile Probe and No-Fallback Parity Across Subprocess and Container - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 134 expands v1.19's hostile probe and no-fallback taxonomy across the hardened subprocess baseline and the executable Docker/container candidate where practical. It should prove parity, redaction, and fail-loud behavior without changing ownership boundaries or turning Python into a counted Strategy path.

</domain>

<decisions>
## Implementation Decisions

### Probe Parity
- **D-01:** Run practical hostile probes across subprocess and container lanes where each lane is implemented and available.
- **D-02:** Probe coverage should include filesystem, host-path, network, process, shell, import, package, environment, output, memory, timeout, crash, malformed IPC, stderr, stack, and schema-invalid behavior.
- **D-03:** Compare behavior across lanes without requiring every underlying failure mechanism to be identical; the public-safe classification and no-fallback outcome must be consistent.

### No-Fallback Drills
- **D-04:** Include stopped runtime-service, stopped Python runtime, Docker unavailable, container image unavailable, runsc unavailable, stale artifacts, and candidate substitution drills.
- **D-05:** Failures must not execute Strategy code in web/API/Go and must not silently substitute a weaker runtime candidate.
- **D-06:** JS/TS support must remain intact while Python and container drills run.

### Privacy And Diagnostics
- **D-07:** Diagnostics must redact source, StrategyMemory, SoldierMemory, objectives, raw streams, host/package paths, env values, tokens, DB DSNs, sessions, stack traces, stderr, and private runtime internals.
- **D-08:** Public evidence should use product categories rather than internal private field names.

### the agent's Discretion
The agent may group probes by capability or failure class, but the artifact must be reviewable enough to identify which lanes ran, skipped, failed loudly, or passed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/132-v1-20-baseline-candidate-decision-and-budget-contract/132-CONTEXT.md`
- `.planning/phases/133-executable-container-runtime-candidate-lane/133-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Probe And Monitor Code
- `packages/runtime-js/src/sandbox-evaluation.ts` - Existing probe taxonomy and candidate evaluation.
- `scripts/evaluate-runtime-sandbox.ts` - Artifact generation/check path.
- `scripts/check-boundary-monitors.ts` - Boundary, ownership, evidence, privacy, and proof monitors.
- `packages/runtime-python/src/python-subprocess-adapter.test.ts` - Python subprocess behavior tests.
- `apps/runtime-service/src/execute-match.ts` - Runtime broker execution/failure classification.

### Prior Artifacts
- `.planning/artifacts/v1.19-runtime-isolation-readiness.json`
- `.planning/artifacts/v1.19-runtime-isolation-readiness.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.19 already has a hostile probe taxonomy and no-fallback drill vocabulary in sandbox evaluation and boundary monitors.
- Runtime-service execution already separates runtime violations from source/contract/system failures.
- Boundary monitors already scan for ownership drift and private marker leakage.

### Integration Points
- Phase 135 consumes timeout and latency classifications.
- Phase 137 consumes public-safe failure state language.
- Phase 139 consumes probe/no-fallback evidence for promotion decisions.

</code_context>

<specifics>
## Specific Ideas

Candidate substitution should be treated as a first-class no-fallback drill: if the strict container lane is requested, subprocess evidence cannot satisfy it.

</specifics>

<deferred>
## Deferred Ideas

- Full production adversarial sandbox certification.
- Unbounded stress or fuzz testing.
- Installing or promoting gVisor/runsc.

</deferred>

---

*Phase: 134-hostile-probe-and-no-fallback-parity-across-subprocess-and-container*
*Context gathered: 2026-05-25*
