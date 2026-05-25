# Phase 113: Python Runtime Execution Behind Broker ABI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 113-Python Runtime Execution Behind Broker ABI
**Areas discussed:** Runtime host, ABI parity, Match compatibility

---

## Runtime Host

| Option | Description | Selected |
| --- | --- | --- |
| Hardened subprocess host | Run Python in a constrained subprocess with minimal deterministic builtins. | yes |
| In-process execution | Execute Python through embedded/in-process mechanisms. | |
| Future sandbox only | Defer all Python execution until production sandbox work. | |

**User's choice:** Hardened subprocess host.
**Notes:** This is a pilot runtime implementation, not production sandbox promotion.

---

## ABI Parity

| Option | Description | Selected |
| --- | --- | --- |
| Same envelope family | Python uses the same schema-validated runtime ABI family as JS/TS. | yes |
| Python-specific protocol | Add custom Python request/response shapes. | |
| Best-effort fallback | Fall back to JS/TS or local execution on runtime failure. | |

**User's choice:** Same envelope family.
**Notes:** No fallback; classify invalid output, timeout, crash, malformed IPC, oversized payload, stderr/stack redaction, and capability failures.

---

## Match Compatibility

| Option | Description | Selected |
| --- | --- | --- |
| Mixed non-counted matches | Allow Python against existing JS/TS opponents in non-counted proof paths. | yes |
| Python-only matches | Avoid mixed language pairings. | |
| Fixture-only opponent | Do not allow real JS/TS revisions as opponents. | |

**User's choice:** Mixed non-counted matches.
**Notes:** Python still cannot enter counted/ranked paths.

---

## the agent's Discretion

- The agent may choose exact subprocess invocation mechanics and adapter boundaries.
- Failure taxonomy parity and no-fallback behavior are not discretionary.
