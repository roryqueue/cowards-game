# Phase 10: Runtime Isolation Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 10-Runtime Isolation Hardening
**Areas discussed:** Implementation ambition, Default runtime behavior, Subprocess contract, Failure taxonomy, Hostile test posture

---

## Implementation Ambition

| Option | Description | Selected |
|--------|-------------|----------|
| Adapter plus subprocess implementation if feasible | Build adapter boundary and attempt subprocess adapter, with spike fallback if needed. | ✓ |
| Documentation-only spike | Research and document options without implementation. | |
| Switch directly to stronger runtime | Make subprocess/container/WASM the main runtime now. | |

**User's choice:** approve recommended decision sheet.
**Notes:** A spike fallback is acceptable only with adapter contract tests and a clear path forward.

---

## Default Runtime Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep worker-thread default | Preserve the v1.0 loop while adding visibility/configurability. | ✓ |
| Make subprocess default | Use stronger isolation immediately. | |
| Dual-run runtime | Run both adapters for comparison. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Do not destabilize the existing author -> execute -> replay loop.

---

## Subprocess Contract

| Option | Description | Selected |
|--------|-------------|----------|
| JSON-only, no shell, capped I/O | Minimal env, schema-validated IPC, timeout kill, and byte caps. | ✓ |
| Lightweight child process | Spawn child process with minimal extra protocol constraints. | |
| Container-first only | Skip subprocess and only document container runtime. | |

**User's choice:** approve recommended decision sheet.
**Notes:** No inherited app secrets or unnecessary host capabilities.

---

## Failure Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Granular failures | Distinguish runtime violations, IPC failures, exits, signals, and system failures. | ✓ |
| Current taxonomy | Keep v1.0 categories mostly unchanged. | |
| User-facing simplification only | Improve messages without changing internal classification. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Only player-caused violations should become gameplay/runtime violation semantics.

---

## Hostile Test Posture

| Option | Description | Selected |
|--------|-------------|----------|
| Hostile matrix | Broad matrix covering forbidden capabilities, loops, pressure, malformed output, and exceptions. | ✓ |
| One-off examples | Add a few targeted hostile examples. | |
| Planner decides later | Leave matrix design entirely to planning. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Test malformed subprocess responses as well as hostile Strategy source.

## the agent's Discretion

- Exact adapter interface names, config surface, subprocess harness format, and test fixture organization are left to research and planning.

## Deferred Ideas

- Making subprocess/container/WASM the default production runtime.
