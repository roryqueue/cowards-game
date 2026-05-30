# Phase 178: Contract Test Harness and Drift Monitors - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 178-Contract Test Harness and Drift Monitors
**Areas discussed:** Contract test strategy, Drift monitor ownership

---

## Contract Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fixture-first deterministic tests | Validate Go/app/service outputs against schema-valid fixtures and translation cases. | ✓ |
| Live-only proof | Rely on live execution proof to find contract drift. | |

**User's choice:** Confirmed fixture-first tests through milestone defaults.
**Notes:** Live proof remains important but comes after deterministic fixture coverage.

---

## Drift Monitor Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing monitors | Add lifecycle, DTO, fixture, privacy, and ownership checks to existing boundary monitors. | ✓ |
| New isolated monitor | Create a separate one-off monitor unrelated to existing gates. | |

**User's choice:** Confirmed extending existing monitors through milestone defaults.
**Notes:** Focused helpers are acceptable if the aggregate gate remains coherent.

## the agent's Discretion

- Exact test files and helper names.

## Deferred Ideas

- Signed-in live proof is deferred to Phase 181.
