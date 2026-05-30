# Phase 187: Runtime-Service Failure Envelope Translation Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 187-Runtime-Service Failure Envelope Translation Hardening
**Areas discussed:** Envelope strictness, redaction boundary, ownership boundary

---

## Envelope Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict schema and registered codes | Runtime-service emits only schema-valid registered failure envelopes; Go rejects drift. | ✓ |
| Lenient translation | Accept unknown codes/fields and map them opportunistically. | |

**User's choice:** Confirmed strict schema and registered codes.
**Notes:** Drift should fail closed.

## Redaction Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Redact before persistence/public evidence | Remove private diagnostics before Go job details, artifacts, or public output. | ✓ |
| Redact only at UI | Store richer raw diagnostics and hide them later. | |

**User's choice:** Confirmed redaction before persistence/public evidence.
**Notes:** Raw diagnostics remain private and should not leak through artifacts.

## Ownership Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime-service executes only | Runtime-service owns hostile execution and ABI envelopes only. | ✓ |
| Runtime-service owns reliability policy | Move retry/public evidence behavior into runtime-service. | |

**User's choice:** Confirmed runtime-service executes only.
**Notes:** Go remains retry/public evidence owner.

## the agent's Discretion

- Decide whether hardening is implemented with tests, code changes, monitors, or a combination.

## Deferred Ideas

None.
