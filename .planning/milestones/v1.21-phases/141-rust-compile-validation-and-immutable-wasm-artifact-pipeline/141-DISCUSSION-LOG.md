# Phase 141: Rust Compile Validation and Immutable WASM Artifact Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 141-Rust Compile Validation and Immutable WASM Artifact Pipeline
**Areas discussed:** Artifact compile location, artifact storage, Rust API pattern, carry-forward policy

---

## Artifact Compile Location

| Option | Description | Selected |
| --- | --- | --- |
| Submission compile | Workshop/account save invokes runtime-owned compile/validation and stores immutable artifact metadata. | yes |
| Local proof only | Compile outside save flow as readiness evidence only. | |
| Defer compile | Contract-only phase without real artifact generation. | |

**User's choice:** Submission compile.
**Notes:** The Rust path should be real end to end enough for later signed-in proof.

---

## Artifact Storage

| Option | Description | Selected |
| --- | --- | --- |
| Revision artifact fields | Store artifact hash/bytes/profile/toolchain metadata with the Strategy Revision/artifact model. | yes |
| Separate proof artifacts | Store evidence files only, not revision metadata. | |
| Source-only | Continue to execute from source. | |

**User's choice:** Revision artifact fields.
**Notes:** Immutable artifact metadata is required for Match eligibility.

---

## Rust API Pattern

| Option | Description | Selected |
| --- | --- | --- |
| Repo SDK sample | Use repo-owned helper/sample code with no arbitrary package installs. | yes |
| Arbitrary Cargo | Allow third-party packages during product compile. | |
| Bare JSON | Require hand-written envelope code. | |

**User's choice:** Repo SDK sample.
**Notes:** This keeps v1.21 focused on the runtime lane instead of package supply-chain policy.

---

## Carry-Forward Policy

| Option | Description | Selected |
| --- | --- | --- |
| Carry similar decisions forward | Equivalent later-phase decisions can be assumed and confirmed. | yes |
| Re-ask every time | Re-discuss equivalent decisions phase by phase. | |

**User's choice:** Carry similar decisions forward.
**Notes:** Applies here to compile, artifact, and package-policy choices.

## the agent's Discretion

Planner may select exact artifact persistence mechanics after reading existing persistence/schema patterns.

## Deferred Ideas

- Arbitrary package support.
- Counted Rust.
- Direct exports/component model.
