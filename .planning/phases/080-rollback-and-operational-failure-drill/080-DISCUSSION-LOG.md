# Phase 80: Rollback and Operational Failure Drill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 80-Rollback and Operational Failure Drill
**Areas discussed:** Rollback Lever, Required Drills, Evidence Format, Pass Condition

---

## Rollback Lever

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm recommendation | Rollback must be one explicit route owner/config switch back to TypeScript. | ✓ |
| Discuss individually | Re-open rollback lever choices separately. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed config/owner switch rollback.

---

## Required Drills

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm recommendation | Require forward cutover, stopped-Go, timeout, non-JSON/bad body, schema invalid, privacy violation, divergence/status mismatch, and rollback drills. | ✓ |
| Discuss individually | Re-open drill selection separately. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the full drill set.

---

## Evidence Format

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm recommendation | Produce a single operational evidence artifact plus machine-readable drill JSON if useful; privacy-scan both. | ✓ |
| Discuss individually | Re-open evidence shape separately. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the evidence format.

---

## Pass Condition

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm recommendation | Drills pass only with fail-closed no-fallback behavior, public-safe output, sanitized diagnostics, and rollback restoring TypeScript. | ✓ |
| Discuss individually | Re-open pass condition separately. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the pass condition.

## the agent's Discretion

- Exact drill mechanics and artifact filenames.

## Deferred Ideas

None.
