# Phase 106: TypeScript Worker and Persistence Quarantine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 106-TypeScript Worker and Persistence Quarantine
**Areas discussed:** Worker entrypoint, lifecycle ownership, persistence lifecycle exports, `@cowards/service`, rollback clarity, test policy

---

## Worker Entrypoint

| Option | Description | Selected |
|--------|-------------|----------|
| Non-normal by default | Worker refuses to run unless explicitly rollback/test/parity. | ✓ |
| Normal when configured | Permit TypeScript worker as normal lifecycle owner through env flags. | |
| Delete immediately | Remove the worker entirely in this phase. | |

**User's choice:** Confirmed non-normal by default.
**Notes:** Full deletion can happen only if no rollback/parity/test need remains.

---

## Lifecycle Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Retire normal TypeScript owner | Remove/quarantine `typescript` as normal lifecycle owner. | ✓ |
| Keep TypeScript owner mode | Preserve `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` as normal owner. | |
| Decide at runtime | Allow Go and TypeScript to arbitrate through env state. | |

**User's choice:** Confirmed retiring normal TypeScript owner.
**Notes:** Any retained TypeScript lifecycle path is rollback-only with no concurrent Go owner.

---

## Persistence Lifecycle Exports

| Option | Description | Selected |
|--------|-------------|----------|
| Remove/quarantine normal exports | Block normal imports of job/completion/scoring/MatchSet creation lifecycle modules. | ✓ |
| Leave exports broadly available | Trust callers and monitors to avoid normal use. | |
| Delete all persistence lifecycle code | Remove even test/deferred/rollback support now. | |

**User's choice:** Confirmed remove/quarantine normal exports.
**Notes:** Selected normal runtime must not import quarantined lifecycle modules.

---

## `@cowards/service`

| Option | Description | Selected |
|--------|-------------|----------|
| Parity/fixture/rollback/deferred only | Preserve service as non-normal support surface. | ✓ |
| Normal backend fallback | Use service when Go is missing or stopped. | |
| Delete package now | Remove `@cowards/service` entirely in this phase. | |

**User's choice:** Confirmed non-normal support role.
**Notes:** It must not back Phase 105 selected routes.

---

## Rollback Clarity

| Option | Description | Selected |
|--------|-------------|----------|
| Single-owner rollback docs | Document queued/running/expired/retry/incomplete/scoring/public evidence procedure. | ✓ |
| Best-effort notes | Keep rollback guidance informal. | |
| No rollback retained | Delete rollback path and docs entirely. | |

**User's choice:** Confirmed single-owner rollback docs.
**Notes:** Avoid mixed Go and TypeScript claim/completion owners.

---

## Test Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Guard tests retained | Tests prove normal TS ownership blocked and explicit rollback/test/parity allowed. | ✓ |
| Remove tests with quarantine | Drop worker/persistence tests as paths become non-normal. | |
| Keep behavior tests only | Test lifecycle behavior without ownership guard assertions. | |

**User's choice:** Confirmed guard tests retained.
**Notes:** Quarantined code still needs evidence that it cannot run as normal backend.

---

## the agent's Discretion

- The agent may choose exact quarantine naming, export boundaries, guard env vars, and rollback artifact format.

## Deferred Ideas

- Full deletion of all TypeScript persistence.
- Go migration/schema ownership.
- Migration of deferred Workshop, ladder, and governance persistence paths.
