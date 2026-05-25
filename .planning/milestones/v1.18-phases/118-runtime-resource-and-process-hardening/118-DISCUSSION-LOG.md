# Phase 118: Runtime Resource and Process Hardening - Discussion Log

**Gathered:** 2026-05-25
**Source:** Materialized from approved v1.18 Plan Mode discussion.

## Decisions Captured

### Isolation Candidate
- Selected hardened subprocess plus container/gVisor-style readiness evidence.
- Rejected production sandbox claims for v1.18.

### Process Controls
- Python launch should use no shell, empty environment, isolated/safe-path flags where practical, and deterministic metadata.
- Runtime failures must classify deterministically and fail closed without fallback.

### Hostile Probes
- Probe coverage must include filesystem, network, import/package, shell/process, environment, output floods, timeout, crash, and malformed IPC.

## Deferred Ideas

- Cloud sandbox deployment.
- Long-running runtime pools.
- Arbitrary packages or dependency installs.
