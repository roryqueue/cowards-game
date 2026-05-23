# Phase 72: Workshop Analytics Compare Read Boundary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 72-Workshop Analytics Compare Read Boundary
**Areas discussed:** External API Response Shape, Null and Compatibility Behavior, Availability Gate Ownership

---

## External API Response Shape

| Option | Description | Selected |
| --- | --- | --- |
| Preserve legacy comparison response | Keep returning current `profileId`, `baseRunId`, `compareRunId`, `compatibilityEquivalent`, and `delta` shape; adapt internally from service. | yes |
| Return service envelope externally | Cleaner API contract, but changes client/API behavior and diverges from Phase 71. | |
| Add richer comparison response | Include totals/evidence/band metadata now. Useful later, but expands scope. | |

**User's choice:** Preserve legacy comparison response.
**Notes:** Matching Phase 71-style service envelope with raw-compatible payload was auto-confirmed.

## Null and Compatibility Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Preserve null-to-404 behavior | Keep current external behavior for missing/not comparable/compatibility mismatch. | yes |
| Distinguish not found vs not comparable internally only | Better diagnostics without API change. | |
| Return distinct external errors | More accurate feedback, but changes route behavior. | |

**User's choice:** Preserve null-to-404 behavior.
**Notes:** User asked to lock similar answers too. Storage-unavailable 503, local/production availability behavior, no richer fields, no private data, and route-level rollback were auto-confirmed.

## Availability Gate Ownership

| Option | Description | Selected |
| --- | --- | --- |
| Keep gate in route only | Route decides local/production availability before calling service. Service stays a read boundary. | yes |
| Move gate into service | Centralizes access logic but blurs service ownership with web env policy. | |
| Duplicate in route and service | Defense in depth but drift-prone. | |

**User's choice:** Keep gate in route only.
**Notes:** User accepted the recommended option.

## the agent's Discretion

- Planner may choose exact DTO/schema/type names.
- Planner may choose whether to introduce a new web helper or extend an existing Workshop analytics read helper.

## Deferred Ideas

None.
