# Phase 75: Milestone Verification and Regression Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 75-Milestone Verification and Regression Gate
**Areas discussed:** Verification Command Breadth, Failure Handling, Required Live Go at Final Verification, Final Evidence Shape

---

## Verification Command Breadth

| Option | Description | Selected |
| --- | --- | --- |
| Full explicit v1.11 gate | Contracts, OpenAPI lint, boundary imports, focused tests, typecheck, Go parity, required live Go topology, monitors, replay smoke privacy, format, and whitespace. | yes |
| `pnpm verify` plus boundary/Go commands | Simpler, but may miss named contract/OpenAPI or v1.11 evidence categories. | |
| Changed-surface tests plus boundary/Go checks | Faster, but too narrow for milestone close. | |

**User's choice:** Full explicit v1.11 gate.

## Failure Handling

| Option | Description | Selected |
| --- | --- | --- |
| Fix v1.11-caused failures and blockers; document unrelated pre-existing failures | Honest and scoped. | yes |
| Fix every failure discovered | Clean if feasible, but may explode scope. | |
| Stop immediately on unrelated failure | Safe but can stall on minor drift. | |

**User's choice:** Scoped fixes plus clear documentation.

## Required Live Go at Final Verification

| Option | Description | Selected |
| --- | --- | --- |
| Block unless live Go passes again or Phase 74 evidence is fresh/current | Strong evidence without pointless reruns. | yes |
| Always rerun live Go in Phase 75 | Cleanest audit trail but can duplicate setup. | |
| Allow waiver if Go is not installed/running | Convenient but conflicts with required evidence. | |

**User's choice:** Block unless fresh/current required live Go evidence exists.

## Final Evidence Shape

| Option | Description | Selected |
| --- | --- | --- |
| Durable final verification artifact plus Phase 75 summary | Best for audit and milestone close. | yes |
| Put everything only in Phase 75 summary/verification files | Less artifact spread but harder to reuse. | |
| Update only REQUIREMENTS status checkboxes | Minimal but loses evidence story. | |

**User's choice:** Durable final verification artifact plus summary.

## the agent's Discretion

- Planner may choose the exact final evidence artifact path.
- Planner may choose focused service/web/package test subset as long as named v1.11 categories are covered.
- Planner may rerun live Go or reference Phase 74 evidence if it proves same-state freshness.

## Deferred Ideas

None.
