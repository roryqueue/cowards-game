# Phase 215: Contract Compatibility Monitors - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 215-contract-compatibility-monitors
**Areas discussed:** No-drift proof, boundary coverage, monitor style

---

## No-Drift Proof

| Option | Description | Selected |
|--------|-------------|----------|
| Exact frozen contract proof | Prove no DTO fields or contract version drifted | yes |
| Backward-compatible additions allowed | Permit optional public fields if convenient | |

**User's choice:** Carry forward hard constraint: no public DTO additions.
**Notes:** This is stricter than v1.28's "if necessary" escape hatch.

---

## Boundary Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Full boundary monitor coverage | Ownership, privacy, fixture gate, runtime eligibility, no internal public state | yes |
| Contract-only monitor | Only validate schema version and DTO shape | |

**User's choice:** Agent recommendation accepted.
**Notes:** v1.29 proof must remain public-safe and non-promotional.

---

## Monitor Style

| Option | Description | Selected |
|--------|-------------|----------|
| JSON plus Markdown proof | Monitor-readable artifact plus human-readable summary | yes |
| Markdown only | Human-readable proof without structured monitor input | |

**User's choice:** Carry forward v1.26/v1.28 proof pattern.
**Notes:** Exact schema is left to the implementing agent.

## the agent's Discretion

- Exact v1.29 proof schema fields.
- How to snapshot DTO shape.

## Deferred Ideas

None.
