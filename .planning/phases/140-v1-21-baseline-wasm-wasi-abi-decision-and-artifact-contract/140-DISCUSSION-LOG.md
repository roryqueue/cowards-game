# Phase 140: v1.21 Baseline, WASM/WASI ABI Decision, and Artifact Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 140-v1.21 Baseline, WASM/WASI ABI Decision, and Artifact Contract
**Areas discussed:** Artifact compile location, artifact storage, Rust API pattern, Wasmtime runner, signed-in proof cycle count, Zig UX, carry-forward policy

---

## Artifact Compile Location

| Option | Description | Selected |
| --- | --- | --- |
| Submission compile | Workshop/account save invokes a runtime-owned compile/validation path and stores immutable artifact metadata for real end-to-end proof. | yes |
| Local proof only | Keep compile outside product save flow and record readiness evidence only. | |
| Defer compile | Design contracts now and postpone executable compile to a later phase. | |

**User's choice:** Submission compile.
**Notes:** This applies to Rust first, and to Zig only if the gated Zig proof passes.

---

## Artifact Storage

| Option | Description | Selected |
| --- | --- | --- |
| Revision artifact fields | Extend Strategy Revision/artifact metadata with artifact hash/bytes/profile and keep source owner-private. | yes |
| Separate proof artifacts | Store only evidence files outside Strategy Revision contracts. | |
| Source-only metadata | Keep source as the executable basis and attach compile notes. | |

**User's choice:** Revision artifact fields.
**Notes:** Match execution must use immutable WASM artifacts, not mutable source.

---

## Rust API Pattern

| Option | Description | Selected |
| --- | --- | --- |
| Repo SDK sample | Provide repo-owned Rust helper/sample code for JSON envelope types, with no arbitrary external package installs. | yes |
| Free-form Cargo package support | Let authors depend on arbitrary packages. | |
| Bare JSON only | Require authors to hand-roll envelope parsing without helper code. | |

**User's choice:** Repo SDK sample.
**Notes:** Package installs remain out of scope as a product feature.

---

## Wasmtime Runner

| Option | Description | Selected |
| --- | --- | --- |
| CLI subprocess | Runtime-service spawns installed Wasmtime CLI with strict args. | yes |
| Embedded library | Bind directly to a Wasmtime library from the runtime service. | |
| Node `node:wasi` | Use Node's WASI support as the runtime path. | |

**User's choice:** CLI subprocess.
**Notes:** Node `node:wasi` must not become a hostile-code sandbox claim.

---

## Signed-In Proof Cycles

| Option | Description | Selected |
| --- | --- | --- |
| Two cycles | Bounded repeatability without v1.20's full three-cycle cost. | yes |
| One cycle | Fastest proof, less repeatability. | |
| Three cycles | Maximum parity with v1.20, more runtime cost. | |

**User's choice:** Two cycles.
**Notes:** Applies to the Phase 146 proof.

---

## Zig UX

| Option | Description | Selected |
| --- | --- | --- |
| Same UX gated | If preflight passes, Zig gets the same submission compile, revision artifact fields, labels, and repo sample pattern. | yes |
| Readiness only | Record tooling proof but do not expose Zig UX. | |
| Skip Zig | Leave Zig entirely out of the milestone. | |

**User's choice:** Same UX gated.
**Notes:** Zig must fail loudly if preflight or proof does not pass.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | After confirmation, similar later-phase decisions may be assumed when they match the recommendation. | yes |
| Re-ask every phase | Repeat every equivalent decision in each phase. | |

**User's choice:** Carry similar decisions forward.
**Notes:** Later phases should confirm inherited decisions rather than relitigate equivalent choices.

## the agent's Discretion

Exact schema names, helper module names, and evidence artifact filenames may follow existing repo conventions, provided the locked boundaries remain intact.

## Deferred Ideas

- Direct exports and component model promotion.
- Counted/ranked Rust or Zig.
- Production sandbox certification.
- Arbitrary package install support.
