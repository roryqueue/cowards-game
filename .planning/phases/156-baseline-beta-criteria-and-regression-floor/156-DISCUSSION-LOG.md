# Phase 156: Baseline, Beta Criteria, and Regression Floor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 156-Baseline, Beta Criteria, and Regression Floor
**Areas discussed:** Beta criteria contract, Regression floor, Carry-forward defaults

---

## Beta Criteria Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Non-counted exhibition beta only | Rust/Zig can only improve exhibition label after proof; no counted/ranked/ladder/sandbox claim. | ✓ |
| Broad beta | Treat Rust/Zig beta as a broader runtime/platform readiness claim. | |
| Defer all beta language | Keep both alpha until a future milestone. | |

**User's choice:** Approved curated sequential plan with recommended carry-forward decisions.
**Notes:** User specifically calibrated that beta means non-counted exhibition beta only.

---

## Regression Floor

| Option | Description | Selected |
|--------|-------------|----------|
| v1.22 as floor plus signed-in caveat | Use v1.22 compile/runtime/hardening evidence, but require the missing full signed-in JS/TS/Rust/Zig proof in v1.23. | ✓ |
| Reopen v1.21/v1.22 design | Re-litigate previous WASM/WASI and Zig decisions. | |
| Treat v1.22 as fully sufficient | Promote from existing evidence without rerunning signed-in proof. | |

**User's choice:** Approved.
**Notes:** The missing v1.22 signed-in proof is a mandatory v1.23 gate.

---

## the agent's Discretion

- The planner may decide artifact file names and the exact criteria document shape.
- The planner may add machine-readable criteria checks if they remain planning/evidence-only for this phase.

## Deferred Ideas

None.
