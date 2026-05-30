# Phase 169: Direct-Export ABI Proof Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 169-Direct-Export ABI Proof Spike
**Areas discussed:** Spike ambition, Memory and buffer contract, Promotion boundary

---

## Sequential Milestone Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Approve defaults | Use the recommended conservative defaults for this phase and carry similar decisions forward across the milestone. | ✓ |
| Adjust phase-specific decisions | Provide phase-specific edits before writing context. | |

**User's choice:** approve defaults
**Notes:** User asked to discuss phases sequentially and confirmed that once a decision is confirmed, similar recommended decisions can generally be assumed and confirmed rather than repeatedly expanded. These logs capture the approved defaults for downstream planning.

---

## Spike ambition

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | A minimal artifact-only proof is acceptable. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 169-CONTEXT.md.

---

## Memory and buffer contract

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Success means evidence about memory ownership, allocation/free, buffer passing, encoding, caps, schema validation, failure behavior, and Rust/Zig parity. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 169-CONTEXT.md.

---

## Promotion boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Fail-loud non-promotion is acceptable and likely if parity or memory ownership is not strong enough. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 169-CONTEXT.md.


## the agent's Discretion

- Exact implementation factoring, artifact filenames, helper names, and test decomposition are left to downstream planning/execution as long as the approved defaults are preserved.

## Deferred Ideas

None.
