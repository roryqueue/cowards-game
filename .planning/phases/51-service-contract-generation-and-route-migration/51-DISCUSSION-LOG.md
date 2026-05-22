# Phase 51: Service Contract Generation and Route Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 51-Service Contract Generation and Route Migration
**Areas discussed:** Contract artifact policy, First route slice, Route registry shape, Import guard strictness

---

## Contract Artifact Policy

| Option | Description | Selected |
| --- | --- | --- |
| Commit generated artifact | Commit generated `service-api-v1.8.openapi.json` or equivalent for reviewable diffs and stable Go/parity input. | ✓ |
| Generate in CI only | Avoid generated-file churn, but rely on hash/diff checks rather than reviewing the artifact directly. |  |
| Defer artifact output | Keep schemas generation-ready only; lower immediate churn but weaker Phase 52 handoff. |  |

**User's choice:** Approved recommended default.
**Notes:** Reviewability and downstream parity input matter more than avoiding generated-file diffs for v1.8.

---

## First Route Slice

| Option | Description | Selected |
| --- | --- | --- |
| Tight public-read slice | Service health, public MatchSet summary, public replay metadata, plus one public read close to service shape. | ✓ |
| Broader public route family | Include profile, Strategy card, ladder, and analytics reads immediately. |  |
| Analytics-heavy slice | Prioritize analytics summaries for Go parity and evidence tooling. |  |

**User's choice:** Approved recommended default.
**Notes:** Keep Phase 51 focused on proving the migration ratchet; avoid auth/write/runtime paths.

---

## Route Registry Shape

| Option | Description | Selected |
| --- | --- | --- |
| Enrich existing registry | Convert/extend `SERVICE_API_ROUTES` into canonical metadata objects in `@cowards/spec`. | ✓ |
| Parallel generation registry | Keep current route strings and add a separate OpenAPI generation registry. |  |
| Hand-authored artifact | Maintain OpenAPI directly as the contract surface. |  |

**User's choice:** Approved recommended default.
**Notes:** Avoid parallel registries and keep `@cowards/spec` authoritative.

---

## Import Guard Strictness

| Option | Description | Selected |
| --- | --- | --- |
| Strict migrated routes plus report-only app scan | Fail on bypasses in named migrated routes; report wider direct imports without blocking. | ✓ |
| Strict all web server modules now | Faster cleanup, but likely too disruptive for Phase 51. |  |
| Report-only only | Low friction, but weakens the migration claim. |  |

**User's choice:** Approved recommended default.
**Notes:** Fail closed where Phase 51 claims migration, and expose broader debt for later phases.

---

## the agent's Discretion

- Planner may pick the extra public read after code inspection, constrained to low-risk public read-only service shape.
- Planner may choose artifact directory/name, constrained to versioned deterministic output suitable for Phase 52 Go parity.

## Deferred Ideas

- Broad strict import enforcement across all web server modules.
- Analytics route migration unless a public summary route is already schema-ready.
- Generated TS clients, public API docs portal, GraphQL/gRPC/TypeSpec, and OpenAPI-first rewrite.
