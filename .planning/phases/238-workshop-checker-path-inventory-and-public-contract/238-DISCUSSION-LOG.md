# Phase 238: Workshop Checker Path Inventory and Public Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 238-workshop-checker-path-inventory-and-public-contract
**Areas discussed:** Contract depth, inventory proof depth, public-safe diagnostics, parity matrix

---

## Contract Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full contract | Define response schema, statuses, categories, provider metadata, availability, privacy exclusions, and parity matrix before coding. | ✓ |
| Inventory first | Document current paths and semantic gaps only, leaving contract details to Phase 239 planning. | |
| Thin contract | Define only common status/category fields now and let later phases add language-specific details. | |

**User's choice:** Full contract.
**Notes:** Phase 238 should produce the complete shared checker contract before implementation planning.

---

## Inventory Proof Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Static map plus focused route/probe checks | Use code mapping plus targeted checks where ambiguity remains. | ✓ |
| Static map only | Use code reading and route inventory without executing probes. | |
| Deep live trace | Trace all services live before contract work. | |

**User's choice:** Static map plus focused route/probe checks.
**Notes:** Deep live tracing is not required unless the inventory cannot resolve a boundary or semantic gap without it.

---

## Public-Safe Diagnostics

| Option | Description | Selected |
|--------|-------------|----------|
| Normalized public-safe diagnostics only by default | Raw diagnostics are allowed only behind an already-existing private/test-only gate. | ✓ |
| Store raw diagnostics internally but redact at UI/API boundaries | Keep raw diagnostics in private storage and redact before output. | |
| Defer raw/private diagnostics | Do not address raw/private diagnostics until implementation phases. | |

**User's choice:** Normalized public-safe diagnostics only by default.
**Notes:** Phase 238 should document whether any private/test-only raw diagnostic gate exists, but must not require one.

---

## Parity Matrix

| Option | Description | Selected |
|--------|-------------|----------|
| Full four-flow matrix | Compare Validate source, submit, save, and entry per language, with fix-now/defer calls. | ✓ |
| Python/Rust/Zig gaps only | Compare only the primary parity-target languages. | |
| Narrative inventory | Use prose rather than a matrix. | |

**User's choice:** Full four-flow matrix.
**Notes:** TypeScript remains the practical baseline, while Python/Rust/Zig are the main parity targets.

---

## the agent's Discretion

- Planner may choose exact inventory and matrix artifact format.
- Planner may choose targeted route/probe checks after reading the code.

## Deferred Ideas

- Provider-grade parity implementation, diagnostic UX, caching/debounce, service-backed E2E proof, and audit are deferred to Phases 239-242.
