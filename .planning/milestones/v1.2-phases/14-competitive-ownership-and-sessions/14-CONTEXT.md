# Phase 14: Competitive Ownership and Sessions - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase replaces the local Workshop owner shortcut for competitive submissions with stable username/password User ownership and session-backed authorization. It defines only the ownership/session foundation needed for v1.2 competitive flows: account creation, sign in/out, handle/display identity, User-owned Strategy Revisions, owner-only source/debug authorization, and the boundary between anonymous Workshop usage and competitive entry.

</domain>

<decisions>
## Implementation Decisions

### Account Creation
- **D-01:** Competitive Alpha uses open username/password signup. Anyone can create a local alpha account without invite codes.
- **D-02:** Passwords should have a simple strong policy, be hashed at rest, and have no recovery flow in v1.2. The UI should clearly communicate that password reset/account recovery is not available in alpha.
- **D-03:** No email verification, password reset, OAuth, passkeys, organizations, admin moderation, or account recovery belongs in this phase.

### Sessions
- **D-04:** Sessions should use HTTP-only cookies with server-side session storage.
- **D-05:** Sessions should be long-lived for alpha, roughly 30 days, revocable server-side and cleared on sign out.
- **D-06:** Session-backed authorization is required for Strategy Revision submission into account ownership and for competitive entry.

### Ownership Boundary
- **D-07:** Use a competitive-only migration boundary. Anonymous/local Workshop can continue to support drafting, validation, local Workshop revision submission, and Workshop test MatchSets.
- **D-08:** Competitive entry requires a signed-in User and a User-owned Strategy Revision.
- **D-09:** Existing `player:workshop-local` flows may remain for non-competitive Workshop testing, but persisted competitive flows must not rely on `player:workshop-local` as owner identity.
- **D-10:** Local Workshop revisions become competitive-eligible only through an explicit signed-in "save to account" action. Do not auto-claim anonymous/local revisions on sign-in.

### Public Identity
- **D-11:** Public competition identity uses a stable unique handle. Display name is optional/supporting and should not be the durable public reference.

### Private Source and Owner Debug
- **D-12:** Strategy source is owner-only and never public.
- **D-13:** Public competitive results may expose revision id, source hash, label, handle, and provenance, but not Strategy source.
- **D-14:** Owner-only source and replay debug access must remain independently server-authorized at every endpoint.

### the agent's Discretion
The planner may choose exact password minimums, hash/session library, database table names, and session storage shape, provided the choices stay conventional, server-side, and scoped to username/password alpha ownership.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.2 milestone goal, constraints, and ownership/privacy decisions.
- `.planning/REQUIREMENTS.md` — Phase 14 requirements OWN-01 through OWN-07.
- `.planning/ROADMAP.md` — Phase 14 goal, success criteria, and notes.
- `.planning/research/SUMMARY.md` — v1.2 ownership direction and watch-outs.

### Primary Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — canonical game terminology and privacy expectations.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — architecture boundaries and Strategy runtime separation.

### Existing Code
- `packages/persistence/migrations/0001_initial.sql` — existing `users`, `strategies`, `strategy_revisions`, `matches`, and `match_sets` tables.
- `packages/persistence/src/repositories.ts` — current User/Strategy/StrategyRevision persistence helpers and locked revision content guard.
- `packages/persistence/src/workshop.ts` — current Workshop constants including `WORKSHOP_USER_ID`, `WORKSHOP_PLAYER_ID`, local revision construction, and Workshop test MatchSet creation.
- `apps/web/app/workshop/server.ts` — Workshop server facade and source submission/source loading paths.
- `apps/web/app/matches/server.ts` — current persisted replay owner-debug authorization using `player:workshop-local`.
- `apps/web/app/api/workshop/revisions/[revisionId]/source/route.ts` — existing source access API surface to revisit for owner authorization.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `users`, `strategies`, and `strategy_revisions` tables already exist, but `users` currently has only `id`, `display_name`, `metadata`, and `created_at`; Phase 14 likely needs auth-specific migration additions or companion session/password tables.
- `createRepositories().upsertUser`, `upsertStrategy`, `insertStrategyRevision`, and `getStrategyRevision` provide a starting persistence boundary.
- `assertCanUpdateStrategyRevisionContent` and `lockStrategyRevision` already enforce immutability after revision lock.

### Established Patterns
- Workshop persistence currently seeds `user:local`, `strategy:local-workshop`, and `player:workshop-local`.
- Workshop revision metadata already stores `createdBy`, labels, notes, source hash, validation, and source bytes.
- Persisted owner-debug replay authorization is server-side and currently scoped to local Workshop MatchSets.

### Integration Points
- Add sign-in/sign-out/signup routes and session helpers under `apps/web`.
- Extend persistence for password hashes, unique handles/usernames, and server-side sessions.
- Add account-owned Strategy/Revision creation or conversion path from local Workshop draft/revision to User-owned revision.
- Update private source and owner-debug authorization to use current session User where competitive/account-owned resources are involved.

</code_context>

<specifics>
## Specific Ideas

- Explicit "save to account" should be a visible boundary before a local Workshop revision can be used competitively.
- Public competition pages should reference `@handle` as the durable User identity, not display name alone.
- Alpha auth should be intentionally plain: username, password, handle, display name, sign in, sign out.

</specifics>

<deferred>
## Deferred Ideas

- Email verification, password reset, OAuth, passkeys, account recovery, organizations, and admin moderation belong to future account phases.
- Full Workshop migration to require sign-in for all persistence is deferred.
- Invite-code alpha gating is deferred.

</deferred>

---

*Phase: 14-Competitive Ownership and Sessions*
*Context gathered: 2026-05-19*
