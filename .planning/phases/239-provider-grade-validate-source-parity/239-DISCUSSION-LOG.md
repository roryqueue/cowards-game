# Phase 239: Provider-Grade Validate Source Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 239-Provider-Grade Validate Source Parity
**Areas discussed:** Checker Envelope Ownership, Parity Breadth Across Paths, Unavailable vs Invalid Semantics, TypeScript / Go Account-Save Gap

---

## Checker Envelope Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| App API owns | `/api/workshop/validate` wraps provider validation into the public checker contract; runtime-service stays provider-focused. | ✓ |
| Runtime emits | Runtime-service returns a Workshop-specific envelope directly, coupling service output to Workshop UX. | |
| Hybrid | Runtime-service adds structured provider hints, while App API still owns the final public envelope. | |

**User's choice:** App API owns.
**Notes:** User selected the recommended option.

---

## Parity Breadth Across Paths

| Option | Description | Selected |
|--------|-------------|----------|
| Validate plus thin submit/save normalization | Implement checker parity in `/api/workshop/validate`, and align submit/save public failure categories only where Phase 239 needs consistency. | ✓ |
| Validate only | Smallest surface, but users may still see different public failure language when they submit/save. | |
| Full submit/save/entry rewrite | Broadest consistency, but likely scope creep for this phase and risks pulling in Go/account/entry policy work. | |

**User's choice:** Validate plus thin submit/save normalization.
**Notes:** User selected the recommended option.

---

## Unavailable vs Invalid Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Unavailable is separate | Missing runtime-service, unreachable runtime-service, malformed service envelope, and missing toolchains map to unavailable/system states. | ✓ |
| Mostly invalid | Keep current behavior where many service/toolchain failures appear as validation errors. | |
| Mixed by language | TypeScript/Python remain closer to invalid/source checks; Rust/Zig get unavailable states. | |

**User's choice:** Unavailable is separate.
**Notes:** User selected the recommended option.

---

## TypeScript / Go Account-Save Gap

| Option | Description | Selected |
|--------|-------------|----------|
| Defer unless blocking | Keep Phase 239 focused on Workshop Validate source and thin public consistency around submit/save. | ✓ |
| Close now | Make Go account save require TypeScript provider proof too. | |
| Document only | Do not touch code, only record the mismatch for a later milestone. | |

**User's choice:** Defer unless blocking.
**Notes:** User added: make sure to document the mismatch if it is not cleaned up.

---

## the agent's Discretion

- Planner may choose exact implementation locations for shared checker schema/utilities.
- Planner may choose minimal runtime-service structured metadata additions if needed, provided runtime-service does not own the Workshop envelope.

## Deferred Ideas

- Broad Go TypeScript account-save/provider-proof cleanup, unless it blocks Workshop checker parity.
