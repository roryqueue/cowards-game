# Phase 125: Hostile Probe Matrix Expansion - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 125 expands the hostile Strategy probe matrix and no-fallback drills across runtime candidates. It creates a stable shared taxonomy for JS/TS, Python, subprocess, container, and gVisor-style evidence while keeping probes bounded, redacted, and safe for local execution.

</domain>

<decisions>
## Implementation Decisions

### Probe Model
- **D-01:** Build one stable hostile probe taxonomy shared by JS/TS, Python, subprocess, container, and gVisor-style candidates.
- **D-02:** Runtime-specific implementations may differ, but result categories and public artifact vocabulary should be comparable.
- **D-03:** Preserve existing JS/TS hostile matrix behavior while extending Python and candidate coverage.

### Probe Coverage
- **D-04:** Add or confirm probes for filesystem, host paths, network/DNS/socket, process/shell/fork/signal, imports/packages, dynamic execution, environment/secrets, output pressure, memory pressure, timeout, crash, malformed IPC, stderr/stack/path redaction, and schema-invalid output.
- **D-05:** Probes must be controlled and bounded; do not create destructive local stress beyond existing timeout/resource caps.
- **D-06:** Probe failures must map to deterministic runtime/system failure taxonomy where practical.

### Redaction And No-Fallback
- **D-07:** Public diagnostics must be redacted before appearing in artifacts, MatchSet outputs, replay outputs, or browser text.
- **D-08:** No-fallback drills must be named and explicit: stopped runtime-service, stopped Python runtime, skipped/unavailable container/runsc, stale artifacts, and silent substitution.

### the agent's Discretion
The agent may choose exact probe ids, fixture Strategy sources, and helper organization, provided names are stable and monitorable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Probe Harnesses
- `packages/runtime-js/src/sandbox-evaluation.ts` - Existing sandbox candidate and probe evaluation model.
- `packages/runtime-js/src/hostile-matrix.test.ts` - Existing JS/TS hostile Strategy matrix.
- `packages/runtime-python/src/python-subprocess-adapter.ts` - Python runtime failure handling and caps.
- `packages/runtime-python/src/python_runtime_host.py` - Python runtime host execution surface.
- `packages/runtime-python/src/python_validation_host.py` - Python validation probe surface.

### Runtime Service And Monitors
- `apps/runtime-service/src/execute-match.ts` - Broker/runtime execution path and failure handling.
- `apps/runtime-service/src/redaction.ts` - Runtime-service public diagnostic redaction.
- `scripts/check-boundary-monitors.ts` - Aggregate monitor extension point.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SANDBOX_PROBES` already defines stable probe ids and expected outcomes for many JS/TS cases.
- Python validation already blocks imports, dynamic execution, forbidden names, host-path strings, and missing Strategy API functions.
- Runtime-service redaction utilities already provide public-safe system failure messages.

### Established Patterns
- Public probe artifacts must be privacy-safe and checked for forbidden markers.
- Runtime violations and system failures are distinct and should not be blurred.
- Local probes should stay deterministic and capped.

### Integration Points
- Phase 126 runs candidate evidence using this expanded matrix.
- Phase 127 wires probe drift and no-fallback drill results into monitors.
- Phase 130 can reuse safe probe/private marker vocabulary in the signed-in proof.

</code_context>

<specifics>
## Specific Ideas

Use a unified matrix that can report "implemented", "not applicable", "skipped unsupported", or "passed/failed" per runtime/candidate without pretending all runtimes exercise identical mechanisms.

</specifics>

<deferred>
## Deferred Ideas

- Destructive host stress tests.
- Unbounded memory or process-fork pressure.
- External network integration tests.
- Package-install probes that require real third-party package installation.

</deferred>

---

*Phase: 125-hostile-probe-matrix-expansion*
*Context gathered: 2026-05-25*
