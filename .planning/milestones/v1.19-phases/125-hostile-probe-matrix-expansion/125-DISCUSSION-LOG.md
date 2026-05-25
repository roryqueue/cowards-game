# Phase 125: Hostile Probe Matrix Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 125-hostile-probe-matrix-expansion
**Areas discussed:** Probe model, Fallback drills

---

## Probe Model

| Option | Description | Selected |
|--------|-------------|----------|
| Unified matrix | Use one stable probe taxonomy across runtimes/candidates, with runtime-specific implementations and results. | ✓ |
| Python-first | Focus new probe work on Python exhibition beta and only run existing JS/TS regression probes. | |
| Separate suites | Keep JS/TS sandbox probes and Python hostile probes independent. | |

**User's choice:** Unified matrix.
**Notes:** This is the cross-phase model for phases 125-127.

---

## Fallback Drills

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit drills | Add named drills for stopped runtime-service, stopped Python runtime, skipped container/runsc, and stale artifacts. | ✓ |
| Monitor-only | Assert no-fallback mostly through static monitors and existing topology checks. | |
| Proof-only | Treat the signed-in proof as the main no-fallback evidence. | |

**User's choice:** Explicit drills.
**Notes:** Drills should be named and visible in artifacts so regressions are loud.

## the agent's Discretion

- Exact probe ids and fixture source snippets are left to the implementer.

## Deferred Ideas

- Destructive stress testing.
- Real package install probes.
