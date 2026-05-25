# Phase 122: Topology, Monitors, Hostile Probes, and Privacy Gate - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 122 extends topology, monitor, hostile probe, privacy, and JS/TS regression gates so runtime isolation regressions fail loudly before v1.18 can close.

</domain>

<decisions>
## Implementation Decisions

### Monitor Coverage
- **D-01:** Monitors must fail on runtime ABI drift, runtime registry drift, broker contract drift, and stale generated artifacts.
- **D-02:** Monitors must fail on Python execution outside runtime-python/runtime-service boundaries.
- **D-03:** Monitors must fail on backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, Match completion, scoring, public evidence ownership, and silent fallback.

### Hostile Probes
- **D-04:** Probes must cover filesystem, network, package/import, shell/process, environment, timeout, memory/output, crash, stderr/stack/path redaction, malformed IPC, and stopped-service drills.
- **D-05:** Python claiming counted/ranked eligibility must fail tests.
- **D-06:** JS/TS Strategy regression must fail tests.

### Privacy
- **D-07:** Public-output checks must fail on source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid, stderr, stack, host paths, package paths, tokens, DB DSNs, and private runtime internals.
- **D-08:** Page smoke must cover Workshop/Python labels, exhibition creation, MatchSet result, and replay evidence.

### the agent's Discretion
The agent may choose exact monitor organization if `pnpm boundary:monitors` remains the main aggregate command.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Monitors And Topology
- `.planning/REQUIREMENTS.md` - MON requirements.
- `.planning/ROADMAP.md` - Phase 122 scope and success criteria.
- `scripts/check-boundary-monitors.ts` - Aggregate boundary monitor.
- `scripts/check-local-topology.ts` - Topology and page-smoke checks.
- `packages/spec/src/public-output-privacy.ts` - Public-output deny-list.
- `packages/runtime-js/src/sandbox-evaluation.ts` - Existing hostile probe harness.
- `.planning/artifacts/v1.17-runtime-broker-registry.json` - Broker registry baseline.
- `.planning/artifacts/v1.16-no-typescript-backend-topology.json` - No-TypeScript-backend topology baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing monitors already know about v1.17 registry drift and Python execution markers.
- Existing topology checks support runtime-service, Go, web, page-smoke, and no-fallback evidence.
- Existing privacy helpers scan public DTOs and artifacts for private markers.

### Established Patterns
- Monitor failures should be loud and deterministic.
- `pnpm boundary:monitors` should remain the main aggregate command.

### Integration Points
- Phase 123 consumes this phase's monitor output as final evidence.
- Phase 121 proof should be covered by page-smoke/topology evidence.

</code_context>

<specifics>
## Specific Ideas

v1.18 should add stronger probe evidence and signed-in proof checks rather than replacing the monitor system.

</specifics>

<deferred>
## Deferred Ideas

- Production observability platform.
- Kubernetes or service mesh topology checks.
- External security certification.

</deferred>

---

*Phase: 122-topology-monitors-hostile-probes-and-privacy-gate*
*Context gathered: 2026-05-25*
