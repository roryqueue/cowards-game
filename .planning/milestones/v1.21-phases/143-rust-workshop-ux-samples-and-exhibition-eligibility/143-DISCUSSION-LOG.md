# Phase 143: Rust Workshop UX, Samples, and Exhibition Eligibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 143-Rust Workshop UX, Samples, and Exhibition Eligibility
**Areas discussed:** Rust API pattern, artifact compile location, labels, JS/TS regression, carry-forward policy

---

## Rust API Pattern

| Option | Description | Selected |
| --- | --- | --- |
| Repo SDK sample | Provide repo-owned helper/sample code for the JSON envelope. | yes |
| Arbitrary Cargo | Allow user-selected package installs. | |
| Bare JSON | No helper code. | |

**User's choice:** Repo SDK sample.
**Notes:** Samples should make Rust authoring approachable without widening package policy.

---

## Artifact Compile Location

| Option | Description | Selected |
| --- | --- | --- |
| Submission compile | Workshop save validates and compiles Rust to immutable artifact metadata. | yes |
| Local proof only | Save source only and record compile proof elsewhere. | |
| Defer compile | UI shell without executable compile. | |

**User's choice:** Submission compile.
**Notes:** Rust Workshop save must support the later signed-in proof.

---

## Labels

| Option | Description | Selected |
| --- | --- | --- |
| Non-counted exhibition alpha/beta | Conservative language matching evidence. | yes |
| Counted/ranked | Promote Rust to competitive paths. | |
| Production multi-language | Present Rust as broad production support. | |

**User's choice:** Non-counted exhibition alpha/beta.
**Notes:** No counted/ranked/production implication.

---

## JS/TS Regression

| Option | Description | Selected |
| --- | --- | --- |
| Explicit regression gate | Verify JS/TS validation, save, counted eligibility, execution, evidence, and replay still work. | yes |
| Smoke only | Minimal check that the page loads. | |
| Defer | Push regression checks to final proof only. | |

**User's choice:** Explicit regression gate, inherited from milestone constraints.
**Notes:** JS/TS remains the counted Strategy path.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Equivalent UX decisions later may be confirmed without relitigation. | yes |
| Re-ask | Reopen equivalent decisions. | |

**User's choice:** Carry similar decisions forward.
**Notes:** Applies to Zig UX if Phase 145 passes.

## the agent's Discretion

Exact UI copy and component placement can follow existing Workshop design patterns.

## Deferred Ideas

- Zig UI unless preflight passes.
- Rich package documentation.
- Counted Rust.
