# Phase 180: Execution/App Parallelization Adapter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 180-Execution/App Parallelization Adapter
**Areas discussed:** Adapter shape, Fixture gating

---

## Adapter Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Same DTOs as live reads | Fixture adapter returns the same versioned DTOs as Go/service-backed reads. | ✓ |
| Fixture-only shape | Let app tests use a separate shape from live backend reads. | |

**User's choice:** Confirmed same DTOs as live reads through milestone defaults.
**Notes:** This enables app and execution work to proceed in parallel without divergent contracts.

---

## Fixture Gating

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit test/dev-only gate | Fixture mode is opt-in and fail-closed in production. | ✓ |
| Silent fallback | Fall back to fixtures when live execution is unavailable. | |

**User's choice:** Confirmed explicit test/dev-only gate through milestone defaults.
**Notes:** Production must never silently substitute fixtures for live Match execution results.

## the agent's Discretion

- Exact env flag names and adapter module factoring.

## Deferred Ideas

- Final proof and freeze decision are deferred to Phase 181.
