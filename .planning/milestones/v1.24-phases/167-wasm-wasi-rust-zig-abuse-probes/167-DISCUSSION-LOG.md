# Phase 167: WASM/WASI Rust/Zig Abuse Probes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 167-WASM/WASI Rust/Zig Abuse Probes
**Areas discussed:** WASM probe scope, Artifact mismatch behavior, No alternate ABI fallback

---

## Sequential Milestone Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Approve defaults | Use the recommended conservative defaults for this phase and carry similar decisions forward across the milestone. | ✓ |
| Adjust phase-specific decisions | Provide phase-specific edits before writing context. | |

**User's choice:** approve defaults
**Notes:** User asked to discuss phases sequentially and confirmed that once a decision is confirmed, similar recommended decisions can generally be assumed and confirmed rather than repeatedly expanded. These logs capture the approved defaults for downstream planning.

---

## WASM probe scope

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Extend existing WASM/WASI evaluation and v1.23 beta-evaluation patterns. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 167-CONTEXT.md.

---

## Artifact mismatch behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Probe artifact mismatch, ABI mismatch, stale or missing bytes, forbidden imports, timeout/fuel, memory caps, stdout/result caps, malformed JSON, invalid schema/action, trap/panic/abort, and runtime unavailability. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 167-CONTEXT.md.

---

## No alternate ABI fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Rust/Zig failures must fail closed without fallback to JS/TS, Python, mutable source execution, stale artifacts, or alternate ABI execution. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 167-CONTEXT.md.


## the agent's Discretion

- Exact implementation factoring, artifact filenames, helper names, and test decomposition are left to downstream planning/execution as long as the approved defaults are preserved.

## Deferred Ideas

None.
