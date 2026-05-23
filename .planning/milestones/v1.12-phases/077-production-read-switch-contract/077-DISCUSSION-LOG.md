# Phase 77: Production Read Switch Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 77-Production Read Switch Contract
**Areas discussed:** Switch Shape, Failure Mapping, Go Client Boundary, Diagnostics Contract

---

## Switch Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Route-specific switch | Explicitly enable only the selected public Strategy read route; default to TypeScript. | ✓ |
| Global backend mode plus route allowlist | Add a broader backend owner mode with an allowlist. | |
| Existing Go URL as implicit switch | Treat Go URL presence as enough to route reads to Go. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the route-specific switch recommendation.

---

## Failure Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Internal classes + public-safe collapse | Preserve specific internal failure classes, but map user-facing errors to canonical public-safe responses. | ✓ |
| Single public and internal failure class | Use one failure class everywhere. | |
| Expose more specific public errors | Let public responses distinguish detailed Go failure causes. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed specific internal classes with public-safe collapsed behavior.

---

## Go Client Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Beside web adapter | Put a typed Go read client next to `public-service-adapter`, keeping `@cowards/service` canonical. | ✓ |
| Inline in public-service-adapter | Put fetch/schema/error logic directly in the adapter. | |
| Move into `@cowards/service` | Make the service package route between TypeScript and Go. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed the separate web-adjacent Go client boundary.

---

## Diagnostics Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Both with privacy split | Provide internal evidence artifacts plus minimal public/operator-visible status. | ✓ |
| Internal evidence only | Keep diagnostics entirely private to evidence artifacts. | |
| Public/operator status only | Expose route status without internal evidence artifacts. | |
| Adjust | Modify the recommendation. | |

**User's choice:** 1
**Notes:** User confirmed both diagnostic layers, with a hard privacy split.

## the agent's Discretion

- Exact env var names and module filenames, as long as the switch remains route-specific and reversible.

## Deferred Ideas

None.
