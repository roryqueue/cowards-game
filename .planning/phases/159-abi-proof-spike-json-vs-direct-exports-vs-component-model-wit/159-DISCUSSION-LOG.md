# Phase 159: ABI Proof Spike: JSON vs Direct Exports vs Component Model/WIT - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 159-ABI Proof Spike: JSON vs Direct Exports vs Component Model/WIT
**Areas discussed:** Active ABI, Direct exports, Component model/WIT

---

## Active ABI

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Preview 1 JSON active | Continue current schema-validated stdin/stdout path while researching alternatives. | ✓ |
| Switch during spike | Allow a successful spike to silently become Match execution. | |
| Freeze ABI research | Avoid ABI alternatives this milestone. | |

**User's choice:** Approved by plan.
**Notes:** No hidden execution-path promotion.

---

## Direct Exports

| Option | Description | Selected |
|--------|-------------|----------|
| Proof-or-fail-loud spike | Require memory ownership, allocation, caps, schema validation, Rust/Zig parity, and rollback evidence. | ✓ |
| Prototype only | Show a tiny export works without full product-safety evidence. | |
| Promote if it runs | Treat execution success as enough. | |

**User's choice:** Approved.
**Notes:** Direct exports need a memory ABI before product use.

---

## Component Model/WIT

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence-only spike | Explore WIT/component path and document readiness without product promotion. | ✓ |
| Promote if toolchain works | Move to component model if Wasmtime and one language succeed. | |
| Defer entirely | Do not inspect WIT this milestone. | |

**User's choice:** Approved.
**Notes:** Cross-language parity is mandatory before future promotion.

## the agent's Discretion

- Planner can decide how much code-backed proof is economical per ABI lane.

## Deferred Ideas

- Production ABI migration.
- Component model/WIT execution for JS/TS or Python.
