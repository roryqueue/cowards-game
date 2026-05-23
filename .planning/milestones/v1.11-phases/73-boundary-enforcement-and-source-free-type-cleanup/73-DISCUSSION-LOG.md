# Phase 73: Boundary Enforcement and Source-Free Type Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 73-Boundary Enforcement and Source-Free Type Cleanup
**Areas discussed:** Strict Enforcement Granularity, Source-Free Type Cleanup Scope, Baseline Proof Standard

---

## Strict Enforcement Granularity

| Option | Description | Selected |
| --- | --- | --- |
| Only strict-gate the migrated route files | Leanest explicit strict entries, but can be less clear about helper ownership. | |
| Strict-gate migrated routes plus safe local dependency closure | Proves the service boundary honestly while avoiding a broad Workshop-folder sweep. | yes |
| Strict-gate the whole Workshop app/API area | Broadest enforcement, but likely drags deferred source/runtime/write surfaces into v1.11. | |

**User's choice:** Accepted recommended option.
**Notes:** The context allows the planner to rely on analyzer closure and/or add explicit safe helper entries where that improves clarity.

## Source-Free Type Cleanup Scope

| Option | Description | Selected |
| --- | --- | --- |
| Cleanup only types tied to Phase 71/72 DTO ownership | Removes real fingerprints without spec-promoting source-bearing Workshop types. | yes |
| Cleanup all source-free Workshop display types opportunistically | More debt burn-down but higher scope risk. | |
| Replace the whole Workshop types module now | Larger payoff if successful but conflicts with deferred source/save/template/sample/runtime surfaces. | |

**User's choice:** Accepted recommended option.
**Notes:** User explicitly agreed to lock the recommended answers.

## Baseline Proof Standard

| Option | Description | Selected |
| --- | --- | --- |
| Require strict zero, report-only below 30, and exact migrated fingerprint removal | Hard proof that Phase 73 actually burns down report-only debt. | yes |
| Allow strict enforcement success even if report-only count remains 30 | Guardrail progress without debt reduction. | |
| Allow an evidence artifact explaining why the count did not drop | Honest documentation but turns the phase into non-burn-down evidence. | |

**User's choice:** Accepted recommended option.
**Notes:** If count does not drop, the phase must classify the miss and replan or perform tied cleanup; it cannot claim success via documentation alone.

## the agent's Discretion

- Planner may choose exact strict file entries after confirming Phase 71/72 migrated route and helper paths.
- Planner may choose durable final evidence location and link it into Phase 75 verification.
- Planner may decide whether source-free type cleanup is implemented in Phase 73 or earlier migration execution, as long as Phase 73 records final enforcement proof.

## Deferred Ideas

None.
