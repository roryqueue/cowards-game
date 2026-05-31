# Phase 212: Discovery Read Requirements and Boundary Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-05-31
**Phase:** 212-discovery-read-requirements-and-boundary-design
**Areas discussed:** discovery namespace, delivery shape, privacy boundary

## Discovery Namespace

| Option | Description | Selected |
| --- | --- | --- |
| New discovery namespace | Separate `public-discovery` style DTOs and schemas outside `match-execution-app-v1`. | yes |
| Extend execution DTOs | Add fields to existing public execution DTOs. | no |

**User's choice:** Confirmed new discovery namespace.
**Notes:** Discovery reads must remain separate APIs.

## Delivery Shape

| Option | Description | Selected |
| --- | --- | --- |
| Server-first reads | Typed server helpers first; route handlers only when needed. | yes |
| Client API first | Build fetchable API routes for every read up front. | no |

**User's choice:** Confirmed server-first reads.
**Notes:** Public pages should prefer Server Components consuming typed helpers.

## Privacy Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Public-safe aggregation | Aggregate public projections and canonical links only. | yes |
| Internal inspection | Use internal/runtime/operator/private payloads to enrich discovery. | no |

**User's choice:** Confirmed public-safe aggregation.
**Notes:** No Strategy source, private Chronicle/debug data, runtime internals, quarantine/recovery/operator data, or Strategy execution.

## the agent's Discretion

- Exact file/module names may follow local conventions as long as boundary names are explicit.

## Deferred Ideas

- Search, filters, pagination, alerts, and recommendations.
