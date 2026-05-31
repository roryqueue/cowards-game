# Phase 225: Python Production Support Path - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 225-Python Production Support Path
**Areas discussed:** Python promotion gate, package policy

---

## Python Promotion Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence-gated provider promotion | Enable counted Python only after runtime, tests, product, proof, and monitors pass. | X |
| Label flip first | Fast but unacceptable because it creates label-only support. | |

**User's choice:** Evidence-gated provider promotion.
**Notes:** Matches approved milestone defaults.

---

## Package Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Constrained provider policy | Keep packages limited to what deterministic provider policy supports. | X |
| Expand Python package ecosystem now | New supply-chain and determinism scope; defer unless required and proven. | |

**User's choice:** Constrained provider policy.
**Notes:** The planner may document future package ecosystem work separately.

## The Agent's Discretion

- Determine if the existing Python subprocess lane can satisfy counted support evidence or needs stricter isolation work.

## Deferred Ideas

- Rich Python dependency ecosystem.
