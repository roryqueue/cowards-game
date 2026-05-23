# Phase 71: Workshop Test Summary Read Boundary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 71-Workshop Test Summary Read Boundary
**Areas discussed:** External API Response Shape, Service DTO Shape, Source-Free Summary Fields, Error Behavior, Rollback

---

## External API Response Shape

| Option | Description | Selected |
| --- | --- | --- |
| Preserve legacy route response | Route still returns the same raw summary shape, while internally calling service DTO/envelope. Lowest product risk. | yes |
| Return service envelope from the route | Cleaner contract but changes API/client shape. | |
| Dual-mode response | Legacy default and service envelope behind query/header. Flexible but too complex. | |

**User's choice:** Preserve legacy route response.
**Notes:** User accepted the recommended option.

## Service DTO Shape

| Option | Description | Selected |
| --- | --- | --- |
| Envelope + raw-compatible payload | Service returns `{ apiVersion, kind, matchSetId, summary }`; route returns `summary`. | yes |
| DTO equals legacy summary | Minimal adapter work, less consistent with service patterns. | |
| Envelope + normalized renamed fields | Future-proof but higher mapping risk. | |

**User's choice:** Envelope + raw-compatible payload.
**Notes:** User accepted the recommended option.

## Source-Free Summary Fields

| Option | Description | Selected |
| --- | --- | --- |
| Exact current fields only | Preserve `matchSetId`, `status`, `matchCount`, optional `matchIds`, `matches`, and `scoring`. | yes |
| Current fields + provenance | Adds compatibility/runtime/schema metadata but changes semantics. | |
| Reduced public fields | Privacy-tight but changes existing Workshop behavior. | |

**User's choice:** Exact current fields only.
**Notes:** Adjacent DTO-boundary choices were auto-confirmed: preserve existing match row fields; do not add private/source/runtime data; parse service envelope and summary payload through schemas.

## Error Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Preserve current route behavior | Null remains 404; unexpected/storage errors behave as they do today. | yes |
| Normalize storage-unavailable to 503 | More user-friendly, but changes current route behavior. | |
| Full service error envelope internally and externally | Strongest consistency but changes response shape. | |

**User's choice:** Preserve current route behavior.
**Notes:** Service internals may use service-safe errors, but external API behavior must remain compatible.

## Rollback

| Option | Description | Selected |
| --- | --- | --- |
| Route-level rollback note in Phase 71 context/summary | Restore the route to `workshopServer.getTestSummary`, remove strict target, isolate tests. | yes |
| Only in Phase 73 enforcement docs | Centralized but less useful for Phase 71 planners. | |
| No explicit rollback until trouble appears | Less paperwork but weaker audit trail. | |

**User's choice:** Route-level rollback note in Phase 71 context/summary.
**Notes:** User accepted the recommended option.

## the agent's Discretion

- Planner may choose exact DTO/schema/type names.
- Planner may choose exact web helper shape as long as the external route response and strict dependency closure are preserved.

## Deferred Ideas

None.
