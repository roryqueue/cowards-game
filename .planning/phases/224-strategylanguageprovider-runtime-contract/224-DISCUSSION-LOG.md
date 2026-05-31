# Phase 224: StrategyLanguageProvider Runtime Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 224-StrategyLanguageProvider Runtime Contract
**Areas discussed:** Provider boundary, ABI posture

---

## Provider Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime-service / Runtime Broker providers | Preserve hostile-code boundary and expose provider operations through schemas. | X |
| Product-process provider execution | Violates project non-negotiables. | |

**User's choice:** Runtime-service / Runtime Broker providers.
**Notes:** Matches approved defaults and AGENTS.md.

---

## ABI Posture

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Preview 1 unless migration is proven | Recommended default; safe and consistent with v1.24 evidence. | X |
| Force a new ABI now | Higher risk; needs migration proof before adoption. | |

**User's choice:** Keep Preview 1 unless migration is proven.
**Notes:** Planner may design migration only if Phase 224 evidence justifies it.

## The Agent's Discretion

- Choose exact provider interface shape during planning.

## Deferred Ideas

- Direct exports and Component Model/WIT replacement unless proven necessary.
