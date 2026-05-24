# Phase 103: TypeScript Backend Inventory and Retirement Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 103-TypeScript Backend Inventory and Retirement Contract
**Areas discussed:** Inventory format, allowed TypeScript roles, retirement action policy, monitor coupling

---

## Inventory Format

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown only | Human-readable matrix only, with monitors added later. | |
| JSON only | Machine-readable manifest only, with less review-friendly context. | |
| JSON manifest plus markdown matrix | JSON becomes the monitor source; markdown becomes the audit surface. | ✓ |

**User's choice:** Confirmed JSON manifest plus markdown matrix.
**Notes:** This matches the v1.15 artifact pattern while giving Phase 108 a stable input.

---

## Allowed TypeScript Roles

| Option | Description | Selected |
|--------|-------------|----------|
| Loose labels | Allow descriptive labels like legacy or service. | |
| Strict taxonomy | Permit only explicit frontend/runtime/parity/fixture/test/rollback/deferred/quarantined/deleted roles. | ✓ |
| Decide during deletion | Let later phases classify paths as they touch them. | |

**User's choice:** Confirmed strict taxonomy.
**Notes:** No normal TypeScript backend role is allowed after v1.15.

---

## Retirement Action Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve broadly | Keep most paths until the end of v1.16. | |
| Delete/quarantine/relabel defaults | Delete unused paths, quarantine rollback/parity/test paths, relabel intentional deferred surfaces. | ✓ |
| Enforcement-only | Keep code but rely on monitors to block runtime use. | |

**User's choice:** Confirmed delete/quarantine/relabel defaults.
**Notes:** Avoid a generic keep-for-maybe bucket.

---

## Monitor Coupling

| Option | Description | Selected |
|--------|-------------|----------|
| Plan-only artifact | Produce inventory for human planning only. | |
| Monitor-ready artifact | Shape fields so topology and boundary monitors can consume them directly later. | ✓ |
| Immediate strict monitor | Make every Phase 103 classification fully strict immediately. | |

**User's choice:** Confirmed monitor-ready artifact.
**Notes:** Full strict enforcement can land in later phases, but Phase 103 should define the fields now.

---

## the agent's Discretion

- The agent may choose exact schema field names, scanner details, markdown grouping, and artifact filenames.
- Similar future decisions can be assumed when they follow this confirmed policy and are also the agent's recommendation.

## Deferred Ideas

- Building the future language-neutral Strategy Execution Service / Runtime Broker remains future work. Phase 103 should keep terminology and fields broker-ready without implementing it.
