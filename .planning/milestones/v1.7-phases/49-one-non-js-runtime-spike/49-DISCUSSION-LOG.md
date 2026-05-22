# Phase 49: One Non-JS Runtime Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 49-One Non-JS Runtime Spike
**Areas discussed:** Spike Language

---

## Spike Language

| Option | Description | Selected |
| --- | --- | --- |
| Python | Best for player reach and approachable Strategy authoring; proves ABI can support a different language ecosystem. | ✓ |
| Go | Best for backend/runtime symmetry, but less approachable and compiled workflow is awkward for quick Strategy iteration. | |
| Rust | Strong long-run deterministic/sandbox story, but too much setup for a small spike. | |

**User's choice:** Python.
**Notes:** User selected Python. Surrounding assumptions follow prior Phase 46/48 policies: subprocess/dev-test execution, simple Python function API, tests/dev visibility only, no package execution, no public counted results.

## the agent's Discretion

- Exact Python harness file layout and adapter package location.
- Whether source is passed inline or via controlled source file path, as long as ABI metadata and no-shell/no-env rules hold.

## Deferred Ideas

- Go/Rust runtime spikes.
- Production-supported Python.
- Workshop language selector.
- Python package/dependency support.
- Production sandboxing.
