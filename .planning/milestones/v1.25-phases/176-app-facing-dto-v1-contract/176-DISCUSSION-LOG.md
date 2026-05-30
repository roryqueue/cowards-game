# Phase 176: App-Facing DTO v1 Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 176-App-Facing DTO v1 Contract
**Areas discussed:** DTO layers, Public evidence boundary, Fail-closed behavior

---

## DTO Layers

| Option | Description | Selected |
|--------|-------------|----------|
| Three layers | Public app DTOs, owner/test-only DTOs, and execution-internal envelopes. | ✓ |
| Single shared shape | Let app and execution internals share one broad shape. | |

**User's choice:** Confirmed three DTO layers.
**Notes:** App pages consume public DTOs by default. Owner/test-only and execution-internal surfaces are separate.

---

## Public Evidence Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Redacted by construction | Public DTOs expose categories, ids, labels, lifecycle, availability, and trustworthy public result/replay evidence only. | ✓ |
| Redact late in the UI | Allow broader payloads into app pages and hide fields at render time. | |

**User's choice:** Confirmed public DTOs redacted by construction.
**Notes:** Public DTOs must not carry source, memory, objective payloads, raw diagnostics, paths, env values, tokens, DB details, package paths, private internals, or raw runtime envelopes.

---

## Fail-Closed Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed | Unknown, stale, malformed, or unversioned payloads fail closed in adapters and contract tests. | ✓ |
| Best-effort parsing | Try to render partial payloads even when version/schema is not trusted. | |

**User's choice:** Confirmed fail-closed behavior.
**Notes:** The UI may show public-safe unavailable/failed/degraded copy, but must not parse private or execution-shaped data.

## the agent's Discretion

- Exact schema artifact format and validation helper factoring.

## Deferred Ideas

- Fixture creation and page migration are deferred to later phases.
