# Phase 105: Web/API Go-Only Cutover and Fallback Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 105-Web/API Go-Only Cutover and Fallback Removal
**Areas discussed:** Selected normal routes, fallback policy, Next.js API role, current-user/session reads, replay evidence split, error/privacy behavior

---

## Selected Normal Routes

| Option | Description | Selected |
|--------|-------------|----------|
| Documentation only | Label selected routes but leave fallback behavior mostly intact. | |
| Cut over v1.15-promoted normal routes | Make selected account/session, account revision/fork, exhibition, public read, and replay evidence routes Go-only. | ✓ |
| Migrate every TypeScript-backed web route | Include Workshop, broader ladder, governance, owner-debug, and test-support migrations now. | |

**User's choice:** Confirmed cutover for selected v1.15-promoted normal routes.
**Notes:** The user asked what may be left off; the agreed nuance is that non-selected surfaces remain explicitly deferred or non-normal, not silently backend-owned.

---

## Fallback Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed when Go selected | Require Go backend configuration and do not fall back to TypeScript service/persistence. | ✓ |
| Local fallback | Use local `@cowards/service` or direct persistence when Go is unavailable. | |
| Route-by-route ambiguity | Let each selected route decide independently. | |

**User's choice:** Confirmed fail-closed policy.
**Notes:** Stopped-Go must be visible, not masked by retired TypeScript backend paths.

---

## Next.js API Role

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend adapters to Go | Selected routes call Go-backed boundary clients. | ✓ |
| Backend route ownership | Selected routes directly import persistence/service modules. | |
| Mixed ownership | Keep both Go and TypeScript behavior in normal runtime. | |

**User's choice:** Confirmed frontend-adapter role.
**Notes:** This follows Phase 103's no normal TypeScript backend role.

---

## Current User And Session Reads

| Option | Description | Selected |
|--------|-------------|----------|
| Go-owned session boundary | Use Go account/session boundary when Go ownership is selected. | ✓ |
| Hidden DB reads | Allow direct DB session lookups inside selected adapters. | |
| Defer all session cleanup | Leave session lookup behavior unchanged for selected routes. | |

**User's choice:** Confirmed Go-owned session/current-user boundary for selected routes.
**Notes:** Avoid tiny persistence leaks that preserve TypeScript backend behavior by accident.

---

## Replay Evidence Split

| Option | Description | Selected |
|--------|-------------|----------|
| Public Go evidence, private owner-debug deferred | Public replay uses Go; owner-debug remains explicit/private/deferred. | ✓ |
| TypeScript public fallback | Use direct Chronicle reads when Go public evidence is unavailable. | |
| Migrate full owner-debug now | Include full private replay projection migration. | |

**User's choice:** Confirmed public/private split.
**Notes:** Owner-debug must not become public evidence fallback.

---

## Error And Privacy Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Redacted classified errors | Schema/auth-classified failures with public-safe diagnostics. | ✓ |
| Raw internal errors | Return stack/database/session details for debugging. | |
| Generic unclassified errors | Hide details but lose route/failure classification. | |

**User's choice:** Confirmed redacted classified errors.
**Notes:** Public responses must not leak source, memory, objective, owner-debug, stack, DB, host, token, session, or runtime internals.

---

## the agent's Discretion

- The agent may choose cutover order, adapter refactor shape, flag cleanup, and test grouping.

## Deferred Ideas

- Workshop flows.
- Broader ladder mutations and governance/admin.
- Owner-debug replay migration.
- Test-support and fixtures outside explicit test-only gates.
- Migration/schema ownership.
