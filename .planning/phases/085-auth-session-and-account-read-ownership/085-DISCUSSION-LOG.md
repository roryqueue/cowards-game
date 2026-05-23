# Phase 85: Auth, Session, and Account Read Ownership - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 85-Auth Session and Account Read Ownership
**Areas discussed:** Auth slice, Cookie contract, Session behavior, Account read privacy, Failure behavior

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Auth slice | Decide whether auth/session read/mutation and account revision list move together. | ✓ |
| Cookie contract | Decide how closely Go preserves current cookie semantics. | ✓ |
| Session behavior | Decide whether hashing, expiry, revocation, sign-out, and `last_seen_at` parity are required. | ✓ |
| Account read privacy | Decide whether account revision list includes source or metadata only. | ✓ |
| Failure behavior | Decide how selected-Go auth/session/account-read failures behave. | ✓ |

**User's choice:** approved recommended checkpoint.
**Notes:** User approved all recommended Phase 85 decisions.

---

## Auth Slice

| Option | Description | Selected |
|--------|-------------|----------|
| Move auth/session/account-list together | Sign up, sign in, sign out, session read, and account revision metadata list move to Go ownership together after Phase 83 gates. | ✓ |
| Session read only first | Only move session read and defer auth mutations/account list. | |

**User's choice:** approved recommended decision.
**Notes:** This matches the aggressive v1.13 cutover direction.

---

## Cookie Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve current cookie semantics | Keep `cowards_session` HttpOnly SameSite=Lax path `/`; token only via `Set-Cookie`. | ✓ |
| Redesign session transport | Change cookie name/shape or return tokens in JSON for Go routes. | |

**User's choice:** approved recommended decision.
**Notes:** Token-in-JSON is explicitly rejected for public/evidence safety.

---

## Session Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Require current parity | Preserve token hashing, 30-day expiry, revoked/expired invalidation, idempotent sign-out, and `last_seen_at` update. | ✓ |
| Allow compatibility drift | Permit session behavior differences if Go is simpler. | |

**User's choice:** approved recommended decision.
**Notes:** Any `last_seen_at` exception would require explicit documentation and user approval.

---

## Account Read Privacy

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only list | Account Strategy Revision list remains source-free; source retrieval waits for Phase 86. | ✓ |
| Include source in list | Bundle source into account list responses. | |

**User's choice:** approved recommended decision.
**Notes:** Source-free list behavior preserves public/service output safety.

---

## Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed, token-safe | Duplicate, invalid, missing/expired/revoked, storage, schema/privacy, and Go-unavailable failures use token-safe errors without fallback. | ✓ |
| Best-effort fallback | Use TypeScript fallback for selected-Go auth/session/account-list failures. | |

**User's choice:** approved recommended decision.
**Notes:** Stopped-Go and bad-response drills must prove no silent fallback.

## the agent's Discretion

- Exact Go package structure, auth route switch names, parity artifacts, and handoff path may be chosen during planning.
- Cookie semantics, token safety, metadata-only account lists, and no-fallback selected-Go behavior are locked.

## Deferred Ideas

- Owner-private source retrieval.
- Strategy Revision save/create and fork flows.
- Exhibition creation.
- Worker/runtime ownership, Strategy execution, migrations, and engine changes.
