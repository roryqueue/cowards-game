# Phase 104: Isolated Runtime Service Boundary Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 104-Isolated Runtime Service Boundary Hardening
**Areas discussed:** Contract naming, transport scope, runtime ABI, revision artifacts, service authority, sandbox path, failure/privacy semantics

---

## Contract Naming

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript runtime service | Name the current implementation as the future abstraction. | |
| Strategy Execution Service / Runtime Broker | Name the future abstraction while labeling the current implementation as JS/TS runtime service. | ✓ |
| Generic runtime | Use neutral wording without an explicit future abstraction. | |

**User's choice:** Confirmed Strategy Execution Service / Runtime Broker naming.
**Notes:** The contract should be broker-ready even though v1.16 does not build the broker.

---

## Transport Scope

| Option | Description | Selected |
|--------|-------------|----------|
| HTTP-specific contract | Treat HTTP+JSON as the whole abstraction. | |
| Transport-neutral contract with HTTP+JSON implementation | Keep current implementation, but define boundary so it can be fronted or replaced. | ✓ |
| Implement new broker transport now | Introduce gRPC, IPC, or broker service in v1.16. | |

**User's choice:** Confirmed transport-neutral contract with current HTTP+JSON implementation.
**Notes:** No new broker implementation in v1.16.

---

## Runtime ABI

| Option | Description | Selected |
|--------|-------------|----------|
| Language-specific contracts | Allow each language to define unique execution envelopes. | |
| Shared JSON/runtime ABI | Require every language runtime to implement the same schema-validated envelopes. | ✓ |
| Decide per language later | Defer the ABI rule until non-JS languages are introduced. | |

**User's choice:** Confirmed shared JSON/runtime ABI.
**Notes:** No shortcut contracts for counted Match execution.

---

## Revision Artifact Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Validate at Match execution only | Defer source validation and packaging until runtime invocation. | |
| Validate/package at submission where practical | Compile/transpile, hash, size-check, and package immutable revisions before Matches. | ✓ |
| Execute mutable source from web/API | Allow direct evaluation from web/API source paths. | |

**User's choice:** Confirmed submission-time validation/package policy where practical.
**Notes:** Matches execute immutable artifacts or revisions.

---

## Service Authority

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime-only authority | Execute Strategy code and return internal runtime results to Go only. | ✓ |
| Partial backend | Allow runtime service to claim jobs or persist results. | |
| Public evidence service | Allow runtime service to serve replay/public DTOs. | |

**User's choice:** Confirmed runtime-only authority.
**Notes:** No DB, job, scoring, public API, public evidence, session, or fallback ownership.

---

## Sandbox Path

| Option | Description | Selected |
|--------|-------------|----------|
| Promote WASM/WASI now | Treat WASM/WASI/component-model as v1.16 production path. | |
| Explicit readiness labels | Keep candidates labeled and defer promotion. | ✓ |
| Treat Node WASI as sandbox | Accept Node `node:wasi` for hostile code. | |

**User's choice:** Confirmed explicit readiness labels and deferred promotion.
**Notes:** WASM/WASI/component-model is a strong long-term candidate, not a silver bullet; Node `node:wasi` is rejected for untrusted Strategy sandboxing.

---

## Failure And Privacy Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed with redacted schemas | Schema-validate and redact all runtime failures, with no fallback. | ✓ |
| Rich internal diagnostics in responses | Expose deeper diagnostics directly for debugging. | |
| Retry through TypeScript backend | Use retired TypeScript backend paths when runtime service fails. | |

**User's choice:** Confirmed fail-closed redacted semantics.
**Notes:** Failure must not leak private runtime/source/session/host/database material or trigger backend fallback.

---

## the agent's Discretion

- The agent may choose the exact combination of spec exports, JSON schema artifacts, runtime-service tests, monitor metadata, and documentation needed to make the contract enforceable.

## Deferred Ideas

- Actual language-neutral Runtime Broker implementation.
- JS/TS runtime replacement.
- Counted non-JS Strategy play.
- WASM/WASI/component-model promotion.
- Production sandbox replacement.
