# Phase 122: Topology, Monitors, Hostile Probes, and Privacy Gate - Discussion Log

**Gathered:** 2026-05-25
**Source:** Materialized from approved v1.18 Plan Mode discussion.

## Decisions Captured

### Monitor Coverage
- Monitors must fail on ABI, registry, broker, sandbox authority, Python boundary, backend ownership, route ownership, persistence, lifecycle, scoring, evidence, and fallback drift.

### Hostile Probes
- Probes must cover filesystem, network, package/import, shell/process, environment, timeout, memory/output, crash, redaction, malformed IPC, and stopped-service drills.

### Privacy
- Public-output checks must fail on source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid, stderr, stack, host/package paths, tokens, DB DSNs, and private runtime internals.
- Page smoke must cover Workshop/Python labels, exhibition creation, MatchSet result, and replay evidence.

## Deferred Ideas

- Production observability platform.
- Kubernetes or service mesh topology checks.
- External security certification.
