# Phase 146: Signed-In Rust Exhibition Proof and JS/TS Regression Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 146-Signed-In Rust Exhibition Proof and JS/TS Regression Gate
**Areas discussed:** Signed-in proof cycles, proof coverage, optional Zig proof, no-fallback/public safety, carry-forward policy

---

## Signed-In Proof Cycles

| Option | Description | Selected |
| --- | --- | --- |
| Two cycles | Bounded repeatability without v1.20's full three-cycle heaviness. | yes |
| One cycle | Fastest but weaker repeatability. | |
| Three cycles | Stronger parity with v1.20 but heavier. | |

**User's choice:** Two cycles.
**Notes:** This is the explicit proof target.

---

## Proof Coverage

| Option | Description | Selected |
| --- | --- | --- |
| Real signed-in product flow | Account, JS/TS revision, Rust compiled revision, JS/TS-vs-Rust, Rust-vs-Rust, result/replay evidence. | yes |
| Runtime-only proof | Exercise runtime-service without the browser/product flow. | |
| Local compile proof only | Compile Rust without running exhibitions. | |

**User's choice:** Real signed-in product flow.
**Notes:** Runtime-only evidence is not enough for Phase 146.

---

## Optional Zig Proof

| Option | Description | Selected |
| --- | --- | --- |
| Gate on Phase 145 | Include Rust-vs-Zig only if Zig proof passed. | yes |
| Always attempt | Try Zig even when preflight failed. | |
| Never include | Exclude Zig even if available. | |

**User's choice:** Gate on Phase 145.
**Notes:** No silent skip or substitution.

---

## Public Safety And No Fallback

| Option | Description | Selected |
| --- | --- | --- |
| Explicit checks | Verify no fallback, no private leaks, non-counted labels, artifact evidence, timeout/fuel evidence, JS/TS intact. | yes |
| Result-only | Only verify MatchSets complete. | |
| Raw diagnostics | Include internal runtime/compiler details in public output. | |

**User's choice:** Explicit checks.
**Notes:** Public proof must be safe to inspect.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Proof inherits no-promotion, no-fallback, and redaction decisions. | yes |
| Re-ask | Reopen equivalent proof decisions. | |

**User's choice:** Carry similar decisions forward.
**Notes:** This keeps the final proof aligned with earlier phase gates.

## the agent's Discretion

Planner may tune proof helper code and timeouts to be bounded and reliable.

## Deferred Ideas

- Three-cycle proof.
- Counted/ranked proof.
- Long stress/soak testing.
