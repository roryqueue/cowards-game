# Phase 134: Hostile Probe and No-Fallback Parity Across Subprocess and Container - Research

**Status:** Complete
**Date:** 2026-05-25

## Findings

- The v1.20 sandbox evaluator runs the same probe taxonomy against worker, host subprocess, and container subprocess when available.
- Existing probes cover deterministic API denial, filesystem imports, host paths, network fetch, process/env/shell, dynamic execution, package imports, memory/output pressure, timeout, crash, malformed IPC, source-size preflight, stderr/console capability denial, and schema-invalid output.
- Some failure-mode probes are intentionally synthetic or preflight; Phase 132 now labels them so they are not mistaken for live adapter evidence.
- Boundary monitors already enforce artifact freshness, public-safety markers, and no-promotion guardrails.

## Planning Implications

- Phase 134 should add an explicit v1.20 hostile probe/no-fallback evidence artifact derived from the evaluator.
- The artifact should list lane parity, live/preflight/synthetic counts, redaction rules, and no-fallback drills.
- Monitor checks should validate the artifact and reject missing drills or private-marker leaks.
