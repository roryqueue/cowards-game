# Phase 174: Match/App Boundary Baseline and Contract Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 174-Match/App Boundary Baseline and Contract Inventory
**Areas discussed:** Baseline scope, Surface classification, Carry-forward decisions

---

## Baseline Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative v1.24 floor | Preserve JS/TS counted, non-JS non-counted beta, Preview 1 JSON ABI, no sandbox certification, no runtime promotion. | ✓ |
| Reopen runtime promotion scope | Reconsider language, sandbox, or ABI promotion during inventory. | |

**User's choice:** Confirmed conservative v1.24 floor.
**Notes:** User confirmed all recommended lifecycle and DTO/evidence decisions for the milestone.

---

## Surface Classification

| Option | Description | Selected |
|--------|-------------|----------|
| Five-class inventory | Classify app-facing contract, owner/test-only contract, execution-internal, persistence-internal, and intentionally unstable surfaces. | ✓ |
| Flat list only | Record surfaces without classifying downstream contract impact. | |

**User's choice:** Confirmed five-class inventory.
**Notes:** Classification should drive phases 176-180.

## the agent's Discretion

- Exact inventory artifact format, tables, and cross-reference style.

## Deferred Ideas

- Refactoring app dependencies and freezing schemas are deferred to later phases.
