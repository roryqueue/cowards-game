# Phase 236: TinyGo WASM/WASI Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 236-tinygo-wasm-wasi-spike
**Areas discussed:** Spike status, ABI target, Tooling/evidence, Recommendation

---

## Spike Status

| Option | Description | Selected |
|--------|-------------|----------|
| Spike-only | Produce evidence and recommendation without production support or counted eligibility. | Yes |
| Production candidate registration | Add TinyGo to product/provider registries during the spike. | |
| Counted support | Enable TinyGo in counted play if the first proof works. | |

**User's choice:** Approved recommended option.
**Notes:** TinyGo must not appear as a selectable production Strategy language in this phase.

---

## ABI Target

| Option | Description | Selected |
|--------|-------------|----------|
| WASI Preview 1 stdin/stdout JSON first | Attempt the existing Rust/Zig Strategy ABI before alternatives. | Yes |
| Closest deterministic WASM target | Accept only if WASI Preview 1 gap is documented. | |
| New ABI | Design a fresh ABI for TinyGo. | |

**User's choice:** Approved recommended option.
**Notes:** Any adapter, shim, import allowance, or incompatibility must be explicit.

---

## Tooling and Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Use local TinyGo or fail loudly | Use available tooling; if missing/unusable, record actionable evidence. | Yes |
| Substitute another language | Use a different language if TinyGo is unavailable. | |
| Skip measurements | Only record compile success/failure. | |

**User's choice:** Approved recommended option.
**Notes:** Evidence includes import audit, size, latency, determinism, invalid output, timeout/trap, and failure taxonomy.

---

## Recommendation

| Option | Description | Selected |
|--------|-------------|----------|
| Promote/defer/reject recommendation | End with a concrete recommendation for future work. | Yes |
| Auto-promote on success | Turn successful spike proof into production support. | |
| No recommendation | Leave results as raw notes. | |

**User's choice:** Approved recommended option.
**Notes:** "Promote" means worth a future production-support milestone, not immediate production enablement.

## the agent's Discretion

- Choose the minimal TinyGo Strategy and measurement harness during planning.

## Deferred Ideas

- TinyGo production support.
- TinyGo counted eligibility.
- TinyGo Workshop/product UX.
- TinyGo signed-in proof.
