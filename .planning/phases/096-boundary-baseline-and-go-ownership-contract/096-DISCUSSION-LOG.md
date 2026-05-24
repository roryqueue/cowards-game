# Phase 96: Boundary Baseline and Go Ownership Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 96-Boundary Baseline and Go Ownership Contract
**Areas discussed:** Ownership manifest shape, TypeScript role labels, No-fallback and rollback language, Baseline evidence package

---

## Ownership Manifest Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Extend v1.14 route manifest | Keep the existing route manifest as the main ownership artifact and add fields for lifecycle surfaces. | |
| New lifecycle manifest | Create a new v1.15 manifest that covers routes plus job/Chronicle/scoring/runtime/public-evidence lifecycle surfaces. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Phase 96 should create a broader lifecycle ownership contract because v1.15 crosses non-route backend ownership surfaces.

---

## TypeScript Role Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Loose labels | Use broad TypeScript owner/reference labels and clarify in prose where needed. | |
| Strict labels | Use `parity_only`, `rollback_only`, `test_only`, `runtime_only`, `deferred`, and `frontend`. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** `runtime_only` is reserved for the JS/TS Strategy execution boundary and must not imply DB job/completion ownership.

---

## No-Fallback And Rollback Language

| Option | Description | Selected |
|--------|-------------|----------|
| Manifest-level policy | State no-fallback and rollback principles once for the whole manifest. | |
| Per-surface policy | Require fallback policy, rollback owner, stopped-Go behavior, stopped-runtime behavior, and mixed-owner prohibition per selected surface. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** No silent TypeScript backend fallback when Go is selected. No mixed DB-completing owners for normal product queues.

---

## Baseline Evidence Package

| Option | Description | Selected |
|--------|-------------|----------|
| Manifest only | Use the machine-readable manifest as the only Phase 96 ownership artifact. | |
| Baseline plus manifest | Write a human-readable baseline artifact and a machine-readable lifecycle manifest. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Baseline should include report-only offense count, route ownership, TypeScript lifecycle code refs, topology gaps, monitor gaps, v1.14 artifact links, and deferred scopes.

---

## the agent's Discretion

- The agent may choose exact manifest schema names and Markdown artifact layout as long as outputs are machine-readable/human-auditable and preserve the decisions above.

## Deferred Ideas

None.
