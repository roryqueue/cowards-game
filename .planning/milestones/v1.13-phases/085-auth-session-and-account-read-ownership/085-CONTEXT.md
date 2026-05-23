# Phase 85: Auth, Session, and Account Read Ownership - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 85 moves auth/session reads and mutations plus account Strategy Revision metadata listing toward Go ownership. It covers sign up, sign in, sign out/revoke, session refresh/read, and account Strategy Revision list metadata. It does not retrieve Strategy source, save/create/fork Strategy Revisions, create exhibitions, move worker/runtime ownership, execute Strategy code, change password policy semantics unless explicitly required for parity, own migrations, or expose private session/token details.

</domain>

<decisions>
## Implementation Decisions

### Auth Slice

- **D-01:** Move sign up, sign in, sign out/revoke, session refresh/read, and account Strategy Revision metadata list to Go ownership together after Phase 83 live DB/schema/privacy/parity gates are available.
- **D-02:** Go auth/session routes must preserve existing TypeScript behavior for username normalization, handle normalization, display name handling, password policy, password hashing compatibility, uniqueness behavior, invalid credential behavior, and account/session DTO shapes.
- **D-03:** TypeScript service and competitive server behavior remain the parity oracle and explicit rollback/reference, not silent fallback in selected-Go evidence paths.

### Cookie Contract

- **D-04:** Preserve the existing `cowards_session` cookie contract: HttpOnly, SameSite=Lax, path `/`, and browser-managed session handoff through `Set-Cookie`.
- **D-05:** Session tokens must be returned only through `Set-Cookie`, never in JSON response bodies, service DTOs, diagnostics, topology files, monitor output, logs, or test artifacts by default.
- **D-06:** Sign-out must preserve clear-cookie behavior while keeping revoke idempotent and token-safe.

### Session Behavior

- **D-07:** Preserve current session token hashing semantics, 30-day expiry, revoked/expired invalidation, missing-session behavior, malformed-session behavior, and idempotent sign-out.
- **D-08:** Preserve `last_seen_at` update on session read unless the implementation documents a deliberate compatibility exception and the user approves it before execution.
- **D-09:** Session read responses return only public account fields: id, username, handle, and display name, plus existing public-safe fields if already part of the canonical service contract.

### Account Read Privacy

- **D-10:** Account Strategy Revision list remains source-free metadata only.
- **D-11:** Owner-private Strategy Revision source retrieval, save/create, Starter fork, and Advanced fork are deferred to Phase 86.
- **D-12:** Account revision list responses must exclude Strategy source, session identifiers, token hashes, password hashes, private runtime internals, and owner debug fields.

### Failure Behavior

- **D-13:** Duplicate signup, invalid credentials, missing/malformed/expired/revoked session, unauthorized revision list, storage unavailable, invalid JSON/body, schema failure, privacy failure, and Go unavailable must fail closed.
- **D-14:** Failures must map to token-safe public service errors or existing auth HTTP behavior without stack traces, SQL details, DB DSNs, host paths, stderr, sessions, tokens, cookies, password hashes, Strategy source, StrategyMemory, SoldierMemory, objective payloads, or private runtime internals.
- **D-15:** Stopped-Go and bad-response drills must prove no silent TypeScript fallback when Go auth/session/account-list ownership is selected.

### the agent's Discretion

Downstream agents may choose exact Go handler/package structure, auth route switch names, parity fixture shape, and whether auth routes are exposed through existing Next routes or direct Go routes first, but cookie semantics, token safety, source-free account lists, and no-fallback selected-Go behavior are locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 goal and hard boundaries.
- `.planning/REQUIREMENTS.md` - AUTH-01 through AUTH-06 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 85 goal, success criteria, and dependencies.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership states, registry, no-fallback, and evidence decisions.
- `.planning/phases/083-go-persistence-and-live-dto-foundation/083-CONTEXT.md` - Live DB, schema/privacy, parity, and sanitized error decisions.
- `.planning/phases/084-public-read-ownership-cutover/084-CONTEXT.md` - Multi-route selected-Go and fail-closed routing pattern.

### Auth and Session Reference

- `packages/spec/src/service.ts` - `getAuthSession`, `createSession`, `revokeSession`, and `listStrategyRevisions` contracts.
- `packages/service/src/index.ts` - TypeScript auth session DTO and account revision metadata DTO assembly.
- `packages/persistence/src/auth.ts` - Username/handle normalization, password policy/hash, session token/hash/expiry/revoke, and `last_seen_at` semantics.
- `apps/web/app/competitive/server.ts` - Current sign up, sign in, sign out, session snapshot, and account revision list behavior.
- `apps/web/app/competitive/http.ts` - Current `cowards_session` cookie and clear-cookie headers.
- `apps/web/lib/competitive-session.ts` - Session cookie name.
- `apps/web/app/api/auth/sign-up/route.ts` - Current sign-up API route and cookie handoff.
- `apps/web/app/api/auth/sign-in/route.ts` - Current sign-in API route and cookie handoff.
- `apps/web/app/api/auth/sign-out/route.ts` - Current sign-out route and clear-cookie behavior.

### Account Revision List Reference

- `apps/web/lib/account-service-adapter.ts` - Current TypeScript-backed account read adapter.
- `apps/web/lib/account-service-boundary.ts` - Current account read boundary.
- `packages/persistence/src/account-revisions.ts` - Revision list storage/reference behavior.
- `packages/service/src/service.test.ts` - Existing owner-safe session and source-free revision list tests.

### Monitors and Evidence

- `scripts/check-boundary-monitors.ts` - Boundary monitor and privacy-safe artifact checks.
- `scripts/check-local-topology.ts` - Topology evidence pattern to extend for auth/session/account routes.
- `scripts/check-service-boundary-imports.ts` - Strict/report-only import baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/persistence/src/auth.ts` already defines the canonical TypeScript auth semantics for password hashing, session token hashing, expiry, revoke, and `last_seen_at`.
- Current web auth routes write cookies with `sessionCookie(result.sessionId)` and clear them with `clearSessionCookie()`.
- `packages/service/src/index.ts` already exposes source-free `getAuthSession` and `listStrategyRevisions` DTOs through canonical schemas and privacy checks.
- `apps/web/lib/account-service-adapter.ts` currently routes account revision list reads through the local TypeScript service only.

### Established Patterns

- Session tokens, cookies, token hashes, and password hashes must never appear in public/service/Go/topology/monitor outputs.
- Selected-Go paths fail closed instead of silently falling back to TypeScript.
- TypeScript remains the parity oracle and explicit rollback reference.
- Strategy Revision source retrieval and writes are deferred to Phase 86.

### Integration Points

- Phase 85 should update the Phase 82 ownership manifest for auth/session and account revision list statuses.
- Phase 85 should consume Phase 83 live DB provider and sanitized error foundation.
- Phase 86 depends on Phase 85 authenticated owner behavior for private source/write/fork routes.

</code_context>

<specifics>
## Specific Ideas

Keep the cookie boundary boring and exact: `cowards_session` is an HttpOnly SameSite=Lax path `/` cookie, token handoff happens through `Set-Cookie`, and evidence never records the token. Treat account revision lists as metadata-only; source belongs to Phase 86.

</specifics>

<deferred>
## Deferred Ideas

- Owner-private Strategy Revision source retrieval.
- Strategy Revision save/create and Starter/Advanced fork flows.
- Exhibition creation and worker handoff.
- Worker/runtime ownership, Strategy execution, migrations, and engine changes.

</deferred>

---

*Phase: 85-Auth Session and Account Read Ownership*
*Context gathered: 2026-05-23*
