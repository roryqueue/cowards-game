# Phase 127: Runtime Evidence Monitors and Drift Gates - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 127 wires v1.19 runtime evidence into monitors and topology checks. It keeps the default aggregate monitor command practical, adds explicit stricter candidate lanes, and fails loudly on runtime ABI, candidate evidence, no-fallback, ownership, privacy, topology, and JS/TS regression drift.

</domain>

<decisions>
## Implementation Decisions

### Monitor Commands
- **D-01:** Keep `pnpm boundary:monitors` as the aggregate default monitor command.
- **D-02:** Add explicit strict commands for required container/runsc evidence; do not make Docker/runsc required for normal local monitor runs.
- **D-03:** Split strictness is the locked v1.19 monitor stance.

### Drift Coverage
- **D-04:** Monitors must fail on ABI drift, registry drift, broker selection drift, schema drift, candidate evidence drift, sandbox authority drift, unsupported candidate mislabeling, production overclaiming, backend ownership creep, privacy leaks, and JS/TS regression.
- **D-05:** Monitors must fail on Python execution outside runtime-python/runtime-service boundaries and any Strategy execution in web/API/Go.
- **D-06:** Topology checks must distinguish fixture-mode parity from live signed-in proof data.

### Privacy Markers
- **D-07:** Public-output privacy markers must include source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid, stderr, stacks, host paths, package paths, tokens, DB DSNs, sessions, and private runtime internals.

### the agent's Discretion
The agent may choose exact script/function organization if `pnpm boundary:monitors` remains the default aggregate and strict candidate lanes are discoverable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Monitors And Topology
- `scripts/check-boundary-monitors.ts` - Aggregate monitor and artifact drift checks.
- `scripts/check-local-topology.ts` - Local topology, live service, and page-smoke checks.
- `scripts/check-service-boundary-imports.ts` - Web/service import boundary enforcement.
- `packages/spec/src/public-output-privacy.ts` - Public-output privacy deny-list.
- `packages/spec/src/runtime.ts` - Runtime ABI, registry, and product semantics.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service client boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pnpm boundary:monitors` already composes contracts, import boundaries, Go parity, sandbox artifact checks, topology, and boundary monitor scripts.
- `check-local-topology.ts` already has `--require-runtime-container` and service URL flags.
- Runtime and public-output privacy helpers already expose deny-list behavior.

### Established Patterns
- Aggregate monitors should remain deterministic and useful on a normal local machine.
- Stricter runtime candidate evidence belongs in explicit command lanes.
- Static ownership drift and live topology evidence are complementary.

### Integration Points
- Phase 130 proof should produce evidence that these monitors can reference.
- Phase 131 final verification should run default monitors plus explicit strict lanes where local support exists.

</code_context>

<specifics>
## Specific Ideas

Add monitor output that makes skipped/unavailable stronger candidates visible without breaking default local development; strict commands should be the place where skipped stronger candidates fail.

</specifics>

<deferred>
## Deferred Ideas

- Making Docker/runsc mandatory for every developer.
- Cloud observability or service mesh monitoring.
- External security certification.

</deferred>

---

*Phase: 127-runtime-evidence-monitors-and-drift-gates*
*Context gathered: 2026-05-25*
