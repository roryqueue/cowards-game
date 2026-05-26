# Phase 157: Zig Ergonomics and Safe Helper/Starter Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 157-Zig Ergonomics and Safe Helper/Starter Layer
**Areas discussed:** Helper policy, Capability evidence, Alpha fallback

---

## Helper Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Small safe project-owned helper | Improve ergonomics while preserving audited Preview 1 import boundaries. | ✓ |
| Zig std-backed helper by default | Prefer comfort even if std imports need later cleanup. | |
| No ergonomics work | Leave v1.22 tiny proof as-is. | |

**User's choice:** Carry-forward recommended decision from the approved sequential plan.
**Notes:** Safety and honest claims dominate ergonomics.

---

## Capability Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Compile/import audit before exposure | Helper must produce inspectable import/capability evidence and fail loud on forbidden imports. | ✓ |
| Source-pattern checks only | Trust source scanning without compiled import evidence. | |
| Manual review only | Let reviewers inspect helper source without a repeatable proof. | |

**User's choice:** Approved by plan.
**Notes:** v1.22 proved compiled import evidence matters for Zig.

---

## the agent's Discretion

- Planner can choose helper shape.
- Planner can decide whether to implement helper evidence by extending current validation tests or the WASM/WASI evaluator.

## Deferred Ideas

- Arbitrary Zig packages.
- Broad std-backed Zig helper claims if capability evidence does not pass.
