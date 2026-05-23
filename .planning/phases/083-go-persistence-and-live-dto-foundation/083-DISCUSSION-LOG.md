# Phase 83: Go Persistence and Live DTO Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 83-Go Persistence and Live DTO Foundation
**Areas discussed:** Live/fixture boundary, Persistence style, DTO/parity gate, Error handling

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Live/fixture boundary | Decide whether promoted routes require explicit live DB-backed mode or can continue claiming ownership from fixtures. | ✓ |
| Persistence style | Decide whether Go uses route-specific providers or introduces broader persistence/ORM ownership. | ✓ |
| DTO/parity gate | Decide what evidence is required before later phases consume Go live DTOs. | ✓ |
| Error handling | Decide how strict sanitized public-safe errors must be before selected-Go routing. | ✓ |

**User's choice:** approved recommended checkpoint.
**Notes:** User previously approved carrying similar recommended decisions forward; this checkpoint confirmed all Phase 83 decisions.

---

## Live/Fixture Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit live mode required | Promoted route ownership requires explicit live PostgreSQL mode; fixture mode stays for tests/parity/dev reference only. | ✓ |
| Fixture promotion allowed | Existing fixture-backed Go responses may claim promoted route ownership. | |

**User's choice:** approved recommended decision.
**Notes:** This directly addresses the v1.12 `promote-none-yet` blocker.

---

## Persistence Style

| Option | Description | Selected |
|--------|-------------|----------|
| Route-specific providers | Small Go query/provider code per selected DTO, using direct PostgreSQL access and existing schema. | ✓ |
| Broad ORM/persistence takeover | Adopt an ORM, generalized repository layer, or Go-owned migration ownership in this phase. | |

**User's choice:** approved recommended decision.
**Notes:** Go DB access is required, but schema/migration ownership remains deferred.

---

## DTO/Parity Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Schema, privacy, and seeded parity required | Go live DTOs must pass canonical contract checks, privacy scans, and TypeScript reference comparisons. | ✓ |
| Schema-only | Rely on DTO shape validation without parity against TypeScript behavior. | |
| Manual spot checks | Capture ad hoc route evidence without a reusable harness. | |

**User's choice:** approved recommended decision.
**Notes:** Evidence should be route-family aware so later phases can promote independently.

---

## Error Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical public-safe service errors | Map failures to canonical service error envelopes and redact private operational details. | ✓ |
| Raw Go/DB errors in development evidence | Allow richer diagnostics in local evidence artifacts. | |

**User's choice:** approved recommended decision.
**Notes:** Sanitization is non-negotiable across public/service/Go/topology/monitor outputs.

## the agent's Discretion

- Exact Go package structure, env names, parity script names, and generated contract mechanism may be chosen during planning.
- Live/fixture distinction, route-specific provider scope, schema/privacy gates, and sanitized diagnostics are locked.

## Deferred Ideas

- Go-owned migrations/schema generation.
- Broad ORM adoption.
- Web route promotion.
- Worker/runtime ownership and Strategy execution.
