# Phase 45: Service Boundary Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 45-Service Boundary Contract
**Areas discussed:** Contract Source Of Truth, Service Layer Depth, First Boundary Slice, Error And Privacy Contract Shape

---

## Contract Source Of Truth

| Option | Description | Selected |
| --- | --- | --- |
| Schema-first in `@cowards/spec`, optional OpenAPI export | `@cowards/spec` remains the source of truth for DTO types, zod schemas, compatibility versions, privacy checks, and golden fixtures. | ✓ |
| OpenAPI-first, TypeScript follows | Write the API contract as OpenAPI first, then make TypeScript and Go conform to it. | |
| Dual source with parity tests | Keep `@cowards/spec` and OpenAPI side by side, with tests proving they match. | |

**User's choice:** Schema-first in `@cowards/spec`, optional OpenAPI export.
**Notes:** The user accepted the recommendation to preserve the existing contract spine and avoid introducing a second canonical system.

| Option | Description | Selected |
| --- | --- | --- |
| No OpenAPI artifact yet | Define zod/type contracts only and defer OpenAPI until after implementation reveals the HTTP shape. | |
| Minimal OpenAPI stub | Create a small non-authoritative OpenAPI skeleton for health plus representative read endpoints. | ✓ |
| Complete OpenAPI draft | Write a broad OpenAPI draft for all service areas. | |

**User's choice:** Minimal OpenAPI stub.
**Notes:** OpenAPI is documentation/export surface only, not a competing source of truth.

---

## Service Layer Depth

| Option | Description | Selected |
| --- | --- | --- |
| Thin facade over existing web server modules | Keep web server modules mostly intact and wrap key methods. | |
| Shared service package with local implementation | Create a package shaped like a future backend client, with local TypeScript implementation using persistence. | ✓ |
| Remote-client abstraction now | Build local and HTTP client implementations immediately. | |

**User's choice:** Shared service package with local implementation.
**Notes:** The user accepted the recommendation that this is enough structure to prevent a later rewrite without pretending the backend has already moved.

| Option | Description | Selected |
| --- | --- | --- |
| New shared package | Put interfaces, client-facing types, and local implementation outside `apps/web`. | ✓ |
| Inside `apps/web/app/services` first | Faster and web-owned, but easier to couple to Next APIs. | |
| Split contracts in spec, implementation in web | Least new structure, but may blur whether the service is shared. | |

**User's choice:** New shared package.
**Notes:** Contracts remain canonical in `@cowards/spec`; the package hosts the service boundary and local implementation.

| Option | Description | Selected |
| --- | --- | --- |
| Read services first | Move public/owner-safe read paths first. | |
| Workshop services first | Move Workshop validation, submission, source retrieval, test launch, and analytics actions first. | |
| Interface skeleton for all, implementation for reads | Define broad service interface across all areas, implement selected read paths first. | ✓ |

**User's choice:** Interface skeleton for all, implementation for reads.
**Notes:** Captured as the reusable pattern for similar v1.7 service decisions: broad contract, narrow safe implementation.

---

## First Boundary Slice

| Option | Description | Selected |
| --- | --- | --- |
| MatchSet + replay first | Move public MatchSet result DTO and replay metadata/page data behind the new service package. | ✓ |
| Analytics first | Move Workshop analytics summaries/exports first. | |
| Public profiles/ladders first | Move player profiles, public Strategy cards, and ladder pages first. | |
| Health + skeletal no-op read contracts only | Implement almost no real product read path. | |

**User's choice:** MatchSet + replay first.
**Notes:** This path is public, privacy-sensitive, replay-backed, central to product trust, and useful for the Go backend spike.

| Option | Description | Selected |
| --- | --- | --- |
| One vertical path end to end | Move MatchSet page and replay page server data loading through the new service package. | ✓ |
| Multiple read paths shallowly | Touch many read paths just enough to import wrappers. | |
| Contract only, no page migration | Define contracts/tests but leave pages using existing modules. | |

**User's choice:** One vertical path end to end.
**Notes:** This makes the boundary real while keeping blast radius sane.

---

## Error And Privacy Contract Shape

| Option | Description | Selected |
| --- | --- | --- |
| Strict structured errors and DTO classes from day one | Define stable service error codes/status classes, public vs owner DTO schemas, and leak checks. | ✓ |
| Privacy strict, errors lightweight | Enforce DTO privacy but leave errors mostly existing message/status mappings. | |
| Document privacy, enforce later | Write rules but defer enforcement. | |

**User's choice:** Strict structured errors and DTO classes from day one.
**Notes:** The user accepted that privacy and Go/client parity are worth the early test/setup cost.

| Option | Description | Selected |
| --- | --- | --- |
| Separate public and owner DTO schemas | Public and owner-authorized DTOs are distinct schema families. | ✓ |
| Public DTOs with optional owner fields | One DTO represents both public and owner views. | |
| Envelope with public data plus owner extension | Public DTO nested separately with optional owner extension object. | |

**User's choice:** Separate public and owner DTO schemas.
**Notes:** Public schemas should be impossible to accidentally fill with private fields.

## the agent's Discretion

- Exact package name for the service boundary.
- Exact implementation style for service methods, provided dependencies remain injectable and future remote clients are feasible.
- Exact location/format of the minimal OpenAPI stub, provided it is non-authoritative and points back to `@cowards/spec`.

## Deferred Ideas

- Full OpenAPI coverage.
- Remote HTTP client implementation.
- Workshop write/auth/analytics write migration.
- Backend migration of orchestration, writes, jobs, or Strategy execution.
