# Phase 127: Runtime Evidence Monitors and Drift Gates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 127-runtime-evidence-monitors-and-drift-gates
**Areas discussed:** Monitor strictness, Fallback drills, Probe model

---

## Monitor Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Split strictness | Keep `pnpm boundary:monitors` runnable without Docker/runsc, and add explicit required candidate commands for stricter evidence. | ✓ |
| Strict default | Make aggregate monitors require container evidence by default. | |
| Artifact only | Record candidate evidence in artifacts, but avoid strict command lanes. | |

**User's choice:** Split strictness.
**Notes:** This directly governs Phase 127 monitor behavior.

---

## Fallback Drills

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit drills | Add named drills for stopped runtime-service, stopped Python runtime, skipped container/runsc, and stale artifacts. | ✓ |
| Monitor-only | Assert no-fallback mostly through static monitors and existing topology checks. | |
| Proof-only | Treat the signed-in proof as the main no-fallback evidence. | |

**User's choice:** Explicit drills.
**Notes:** No-fallback must be visible and named.

---

## Probe Model

| Option | Description | Selected |
|--------|-------------|----------|
| Unified matrix | Use one stable probe taxonomy across runtimes/candidates, with runtime-specific implementations and results. | ✓ |
| Python-first | Focus new probe work on Python exhibition beta and only run existing JS/TS regression probes. | |
| Separate suites | Keep JS/TS sandbox probes and Python hostile probes independent. | |

**User's choice:** Unified matrix.
**Notes:** Monitors should understand the shared taxonomy.

## the agent's Discretion

- Exact monitor grouping is left to the implementer.

## Deferred Ideas

- Mandatory Docker/runsc default monitors.
