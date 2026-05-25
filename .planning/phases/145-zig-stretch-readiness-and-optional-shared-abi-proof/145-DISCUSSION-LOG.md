# Phase 145: Zig Stretch Readiness and Optional Shared-ABI Proof - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 145-Zig Stretch Readiness and Optional Shared-ABI Proof
**Areas discussed:** Zig UX, Zig no-fallback behavior, shared ABI, carry-forward policy

---

## Zig UX

| Option | Description | Selected |
| --- | --- | --- |
| Same UX gated | If preflight passes, Zig gets the same submission compile, artifact fields, labels, and sample pattern as Rust. | yes |
| Readiness only | Record tooling proof without exposing UX. | |
| Skip Zig | Leave Zig out entirely. | |

**User's choice:** Same UX gated.
**Notes:** This is conditional on real compile/runtime/ABI evidence.

---

## Zig No-Fallback Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Fail loudly | Unavailable Zig writes readiness evidence and stays non-promoted. | yes |
| Substitute another language | Use Rust/JS/TS/Python behavior when Zig fails. | |
| Silent skip | Omit Zig evidence when unavailable. | |

**User's choice:** Fail loudly.
**Notes:** Zig unavailable behavior is itself required evidence.

---

## Shared ABI

| Option | Description | Selected |
| --- | --- | --- |
| Same WASI JSON ABI | Zig must use the same Preview 1 stdin/stdout JSON envelope as Rust. | yes |
| Zig-specific ABI | Add a separate bespoke Zig runtime ABI. | |
| Source execution | Execute Zig source or mutable compile output directly. | |

**User's choice:** Same WASI JSON ABI.
**Notes:** Long-term direction is immutable WASM artifacts, not one bespoke runtime per language.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Rust choices apply to Zig if the gate passes. | yes |
| Re-ask | Reopen all Rust-equivalent choices for Zig. | |

**User's choice:** Carry similar decisions forward.
**Notes:** This is exactly the kind of later similar decision the user said to confirm rather than relitigate.

## the agent's Discretion

Planner may keep Zig readiness artifact-only if evidence is incomplete.

## Deferred Ideas

- Counted Zig.
- Zig package support.
- Separate Zig runtime ABI.
