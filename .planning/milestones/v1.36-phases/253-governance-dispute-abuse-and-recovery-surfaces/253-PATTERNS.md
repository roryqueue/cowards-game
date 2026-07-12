# Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces - Code Patterns

**Mapped:** 2026-07-11
**Scope:** Closest existing analogs only; no implementation decisions beyond the locked Phase 253 context.

## Recommended Composition

The closest repository-native shape for Phase 253 is:

1. Define report/dispute request and public governance projection contracts in `@cowards/spec`, including Zod schemas and service-route metadata.
2. Keep the browser-facing Next route thin: obtain the session token/user, parse only the transport envelope, delegate to the selected backend, and map a constrained public response.
3. Perform authorization, duplicate/rate-limit decisions, the governance state mutation, deterministic standings recomputation, and immutable private audit insertion in one database transaction.
4. Build public output from the canonical counted-state classifier and constrained public categories. Never project report rows, private detail, reporter/operator identity, or audit payloads.
5. Prove the split at unit, route, database-backed integration, public DTO/privacy, and browser/service-backed levels.

The existing MatchSet flag/governance code is the closest domain analog, but the Season lifecycle and operator-recovery flows are better atomicity/idempotency analogs.

## 1. Signed-In Mutation Routes

### Selected-normal service route pattern

- `packages/spec/src/service.ts:70-99` defines route method, auth scope, privacy class, request schemas, response schema, public-safe error schema, examples, and fixture references in one contract.
- `packages/spec/src/service.ts:260-284` (`SERVICE_API_ROUTES.createMatchSet`) is the closest owner-authenticated POST contract: typed body, owner auth scope, owner privacy class, stable response DTO, and fixture reference.
- `packages/spec/src/service.ts:626-651` (`SERVICE_API_ROUTES.enterLadderSeason`) is the closest competition-specific signed-in mutation contract.
- `apps/web/app/api/exhibitions/route.ts:1-31` is the selected-backend web proxy shape: read the account session, require the Go client, forward a constrained payload, and map the backend result without executing domain logic.
- `apps/go-backend/live_backend.go:854-890` (`createExhibition`) is the closest selected-normal Go handler: call `requireUser`, decode a typed body, invoke a domain method with the authenticated user id, and return coarse validation/conflict errors.
- `apps/go-backend/live_backend.go:1973-2021` (`authenticatedUser`, `requireUser`) is the reusable session authority. It hashes the bearer token, rejects revoked/expired sessions, updates last-seen state, and emits a public-safe `401`.
- `apps/go-backend/live_backend.go:2449-2471` (`writeServiceError`, `decodeBody`) provides public-safe service errors and rejects unknown JSON fields.

**Reuse:** Add report/dispute mutations to the service contract first, then proxy through web to the selected Go backend. Derive `reporterUserId` exclusively from the authenticated session. A request body must not accept reporter, entrant-owner, operator, or admin identity.

### Existing direct Next/persistence analog

- `apps/web/app/api/matchsets/[matchSetId]/flags/route.ts:7-27` requires a signed-in competitive user, extracts the path id, delegates with `user`, and centralizes error projection.
- `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts:21-60` has the same thin route shape for governance mutation.
- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts:7-42` shows consistent `POST`/`DELETE` session checks, awaited route params, `201` for creation, and `competitiveErrorResponse` mapping.
- `apps/web/app/competitive/server.ts:616-647` normalizes untrusted route values, injects the authenticated user id, uses scoped database-pool lifetime, and maps persistence errors.
- `apps/web/app/competitive/http.ts:18-36` maps known input errors to public responses, carries `Retry-After`, and collapses unknown failures to a generic `503`.

**Reuse with care:** These routes are useful route-test and error-shaping analogs. They are not the selected-normal ownership model for a new operation unless Phase 253 explicitly records a temporary exception.

## 2. Rate Limiting, Deduplication, and Idempotency

### Event-window rate limiting

- `packages/persistence/src/competition.ts:306-336` defines a domain error carrying retry timing and a simple `{ limit, windowSeconds }` policy.
- `packages/persistence/src/competition.ts:369-429` separates a pure `evaluateRateLimit` decision from the database query that counts recent per-user submission events.
- `packages/persistence/migrations/0003_competitive_alpha.sql:73-84` stores append-only `competition_submission_events` and indexes `(user_id, action, created_at desc)`.
- `packages/persistence/src/competition.test.ts:236-253` pins allowed and retry-after decisions with an injected clock.
- `apps/web/app/competitive/server.ts:171-179` and `apps/web/app/competitive/http.ts:18-30` map rate-limit errors to `429` plus `Retry-After` without exposing the query or event history.

**Reuse:** Use a pure decision helper with an injected time in tests, a per-user/action indexed event table, and a calm `429` response. Report categories should not create separate unbounded rate-limit buckets unless the policy intentionally says so.

### Duplicate-open report behavior

- `packages/persistence/migrations/0004_competition_trust_beta.sql:95-107` gives `result_flags` one row per `(match_set_id, user_id)` with an explicit open/resolved/dismissed lifecycle.
- `packages/persistence/src/governance.ts:50-61` uses `INSERT ... ON CONFLICT (match_set_id, user_id) DO UPDATE` to reopen/update the existing record instead of creating duplicates.
- `packages/persistence/src/competition.ts:338-351` canonicalizes unordered revision ids before deriving a duplicate key.
- `packages/persistence/migrations/0003_competitive_alpha.sql:66-71` enforces active duplicate exclusion at the database layer with a partial unique index.

**Reuse:** Normalize category/target identity before deriving a dedupe key, enforce the invariant in PostgreSQL, and return the existing/open report identity or a stable conflict. Do not rely only on a pre-insert existence check.

### Strong idempotent mutation pattern

- `packages/persistence/migrations/0008_match_execution_operator_actions.sql:1-19` stores a unique non-empty idempotency key plus action, actor, status, result, and timestamps.
- `apps/go-backend/match_execution_recovery.go:46-130` wraps lookup, row lock, mutation, private action insert, derived-state refresh, and commit in one transaction.
- `apps/go-backend/match_execution_recovery.go:61-71` returns the stored action as `duplicate` when the same key is retried.
- `apps/go-backend/match_execution_recovery.go:168-195` uses `FOR UPDATE` on the mutation target.
- `apps/go-backend/match_execution_recovery.go:263-309` persists and reloads the action result by idempotency key.
- `apps/go-backend/job_lifecycle_test.go:317-373` proves the duplicate call does not repeat the state transition or create a second action row.

**Reuse:** Governance mutations should use this transaction/idempotency shape. If report submission uses server-side deduplication rather than a client key, the same database-unique principle still applies. Never return the private persisted action payload from a public/default endpoint.

## 3. Private Audit Persistence and Atomic Governance

- `packages/persistence/migrations/0004_competition_trust_beta.sql:109-124` defines `competition_audit_events` with actor, target, immutable before/after JSON, reason, constrained public explanation, private note, and a target/time index.
- `packages/persistence/src/governance.ts:173-208` centralizes audit insertion and keeps `privateNote` separate from `publicExplanation`.
- `packages/persistence/src/governance.ts:99-170` captures before-state, changes canonical MatchSet governance state, and records after-state with the actor and reason.
- `packages/persistence/src/ladder.ts:571-653` is the stronger atomic pattern: lock the target row, validate the transition, mutate it, insert the audit event on the same client, and commit through `withTransaction`.
- `packages/persistence/src/ladder.test.ts:437-452` proves an illegal transition rolls back and writes no audit event.
- `packages/persistence/src/standings-recompute.ts:89-167` is the canonical pure recomputation reducer. It includes score only for `counted`, keeps excluded evidence visible, preserves stable ordering, and derives evidence links/counts.
- `packages/persistence/src/standings-recompute.test.ts:88-158` proves repeated/permuted input equivalence, exclusion of every non-counted state, stable tie-breaks, and Season scoping.

**Reuse:** Move governance state update, report lifecycle update, audit insertion, and any persisted standings refresh into one transaction/client boundary. Lock the MatchSet (and Season if standings materialization needs it) before reading before-state. Recompute through canonical MatchSet inputs; never edit rank/points directly.

**Current gap to close:** `packages/persistence/src/governance.ts:99-170` currently performs separate pool queries without an encompassing transaction and does not trigger standings recomputation. It is an inventory baseline, not the final atomic pattern.

**Privacy rule:** Reporter detail, operator notes, duplicate/rate-limit metadata, and private evidence belong only in private tables/audit fields. Public projections must be independently constructed rather than serializing and deleting keys from audit rows.

## 4. Public-Safe DTO and Schema Projection

- `packages/spec/src/competition-counted-state.ts:25-48` defines the classifier input and coarse public projection shape.
- `packages/spec/src/competition-counted-state.ts:66-133` locks governance precedence and maps canonical states to constrained public reason categories.
- `packages/spec/src/competition-counted-state.ts:135-158` derives labels/explanations from the policy contract and exposes a dedicated public leak assertion.
- `packages/spec/src/competition.ts:119-132` (`PublicLadderMatchSetSummaryDto`) is the closest list projection: canonical state, public reason/explanation, result link, and evidence-derived replay link.
- `packages/spec/src/competition.ts:339-369` (`PublicMatchSetResultDto`) nests typed competition state separately from result evidence and publication/privacy metadata.
- `packages/spec/src/schemas.ts:1387-1416` mirrors the counted-state projection with closed enums.
- `packages/spec/src/schemas.ts:1465-1504` mirrors the public MatchSet result, including optional typed competition governance state.
- `packages/spec/src/schemas.ts:1708-1750` mirrors the public ladder MatchSet summary and its constrained reasons.
- `packages/spec/src/public-output-privacy.ts:1-110` recursively rejects forbidden private fields and string markers, including Strategy/runtime/auth/database material.
- `packages/spec/src/competition-policy-v1-36.ts:120-136` explicitly excludes dispute internals, recovery payloads, and operator-only governance details.

**Reuse:** Add any Phase 253 public fields to shared TypeScript DTOs and Zod schemas together. Prefer a small typed governance projection such as state, safe reason category, safe explanation, applicable timestamp, standings effect, and replay availability. Build it from canonical stored state plus evidence, then run the public-output guard.

**Avoid:** `apps/web/app/matchsets/[matchSetId]/page.tsx:71-95` reads governance fields from untyped `metadata`. Phase 253 should consume the typed `competition.countedState` projection instead of extending this metadata convention.

**Avoid:** Do not expose report existence/count, reporter identity, report category detail, operator identity, operator notes, audit before/after JSON, raw evidence, or recovery data. Replay availability remains Chronicle-derived and must not be inferred from governance status.

## 5. Admin Authorization

- `packages/persistence/src/governance.ts:86-97` (`assertAdminUser`) is the current authority check: query `users.is_admin` and fail closed unless it is exactly `true`.
- `packages/persistence/src/governance.ts:99-115` calls the admin assertion inside the persistence mutation rather than trusting route naming.
- `packages/persistence/migrations/0004_competition_trust_beta.sql:1-2` adds `users.is_admin` with a false default.
- `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts:27-56` derives actor identity from the session and delegates; it does not accept an admin id from the request body.
- `packages/spec/src/service.ts:70-72` already reserves `admin` as a route auth scope.
- `packages/spec/scripts/generate-service-openapi.ts:244-252` defines the `adminSession` security scheme used by generated service documentation.
- `apps/go-backend/live_backend.go:132-161` is an operator-only authorization analog using `COWARDS_GO_BACKEND_INTERNAL_TOKEN`; it is appropriate for internal recovery controls, not as a substitute for signed-in product admin authorization.

**Reuse:** Enforce admin status again at the selected backend/persistence boundary, in the same transaction as the mutation where practical. Route path and UI visibility are not authorization. Return a generic public-safe `403`; do not reveal whether another user is an admin.

**Needed selected-backend addition:** There is no reusable Go `requireAdmin` helper today. The natural Phase 253 shape is `requireUser` followed by a database `is_admin = true` check, with `authScope: "admin"` and `privacyClass: "internal"` or the existing contract-appropriate private class.

## 6. Policy and Documentation UI

- `packages/spec/src/competition-policy-v1-36.ts:3-13` is the authority for “public beta trial competition,” resettable Season standings, and no durable permanent rating promise.
- `packages/spec/src/competition-policy-v1-36.ts:51-118` is the authority for calm counted/governance labels and public meanings.
- `packages/spec/src/competition-policy-v1-36.ts:138-216` forbids staffed-moderation SLAs, rating refunds, durable ratings, and all-time ranking claims.
- `packages/spec/src/competition-policy-v1-36.ts:218-243` records ownership: spec owns vocabulary, persistence owns canonical evidence, and web renders projections only.
- `apps/web/app/competitions/page.tsx:13-84` is the public competition policy/discovery composition: concise introductory copy, boundary notice, opportunities, active competitions, completed competitions, and calm empty states.
- `apps/web/app/competitions/[competitionId]/page.tsx:37-145` is the detail-page pattern for status strip, evidence coverage, entrants, standings, and constrained public links.
- `apps/web/app/ladder/[seasonId]/page.tsx:34-159` is the closest trust-policy UI: status chips, reset/no-permanent-rating copy, eligibility rules, standings, entries, and per-MatchSet result links.
- `apps/web/app/auth/auth-client.tsx:44-115` is the current account-recovery expectation surface; line 98 honestly states that no password reset/recovery flow exists.
- `apps/web/app/account/page.tsx:48-147` is the signed-in account policy/status surface and keeps owner source links separate from public strategy cards.

**Reuse:** Keep player-facing policy copy short and derived from shared constants where feasible. Place fair-play/reporting expectations near competition/result actions and recovery limitations near sign-in/sign-up/account surfaces. Use ordinary status language, not operator/runtime terminology.

**No existing full analog:** There is no staffed moderation console, report queue UI, appeals page, or account-recovery intake. Phase 253 should not imply one. A policy/support expectation surface is the correct recovery scope.

## 7. Test Patterns

### Contract and privacy unit tests

- `packages/spec/src/competition-counted-state.test.ts:1-76` table-tests every canonical counted/governance state, precedence, evidence downgrade, and deterministic output.
- `packages/spec/src/spec.test.ts:134-188` pins the complete public state vocabulary and forbidden-claim categories.
- `packages/spec/src/spec.test.ts:228-275` checks the v1.36 payload and rejects dispute, recovery, operator, Strategy, runtime, token, path, and database markers.
- `packages/spec/src/public-output-privacy.ts:75-110` is the assertion to call on every new public DTO fixture.

**Phase 253 coverage to mirror:** request/category schema rejection, bounded private detail, projection for each governance state/outcome, no private keys/markers, and exact no-SLA/no-rating-repair recovery copy.

### Route tests

- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts:60-160` mocks the server boundary and proves unauthenticated rejection, authenticated delegation, status mapping, and constrained category-shaped errors.
- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts:162-209` injects private persistence/provider markers and proves the HTTP response replaces them with canonical public copy.
- `apps/web/app/api/exhibitions/route.test.ts:23-81` proves the thin selected-Go proxy forwards only accepted fields and returns a constrained response.

**Phase 253 coverage to mirror:** anonymous `401`, non-entrant dispute `403`, ordinary signed-in report accepted, admin-only mutation rejected for non-admin, unknown/body-only identity fields rejected, duplicate response stable, `429` carries calm retry information, and unexpected errors collapse to a generic public-safe response.

### Persistence and service-backed tests

- `apps/go-backend/job_lifecycle_test.go:317-373` is the strongest idempotency/one-write proof.
- `packages/persistence/src/ladder.test.ts:437-452` is the rollback/no-audit-on-failure proof.
- `packages/persistence/src/standings-recompute.test.ts:88-158` is the deterministic standings and exclusion-state matrix.
- `apps/go-backend/phase244_account_provider_db_test.go:192-249` is a database-backed signed-in mutation/public privacy pattern.
- `apps/go-backend/main_test.go:546-585` is the authorization matrix pattern for missing, unknown, and wrong-owner bearer tokens.

**Phase 253 coverage to mirror:** one open report per normalized reporter/target/category policy, entrant-only dispute check, bounded detail persistence, exactly one audit row per applied mutation, immutable before/after evidence, duplicate idempotency, rollback on recompute/audit failure, and byte-equivalent standings after repeated recompute.

### Browser and end-to-end proof

- `apps/web/e2e/v1-28-operations-recovery-proof.spec.ts:383-503` signs in, performs an idempotent private operator mutation, verifies one action row, visits public pages, scans for private markers, and writes sanitized proof artifacts.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts:3-44` centralizes public forbidden markers and body scanning.
- `apps/web/e2e/v1-29-public-result-replay-proof.spec.ts:54-94` covers multiple result/replay states, checks visible evidence UI, scans public pages, and verifies a nonblank interactive replay canvas.

**Phase 253 coverage to mirror:** signed-in report/dispute submission, admin governance transition, visible coarse public state and explanation, standings recomputation, replay independence, duplicate/rate-limit behavior, and public scans that include reporter/operator identities, private detail, audit payloads, recovery payloads, Strategy source/memory/objectives, diagnostics, tokens, paths, and database markers.

## 8. Implementation Traps to Avoid

- Do not add governance logic only to React or parse it from untyped `metadata`.
- Do not trust route naming, a submitted actor id, or an internal token as signed-in admin authorization.
- Do not perform MatchSet mutation, audit insertion, and standings recomputation as separate autocommit queries.
- Do not use a read-then-insert duplicate check without a database uniqueness invariant.
- Do not let report submission expose whether another Player reported the result or how many reports exist.
- Do not make `under_review`, `disputed`, `invalid`, or `invalidated` contribute score; the canonical reducer includes only `counted`.
- Do not couple replay availability to governance state; it remains Chronicle/evidence-derived.
- Do not add password reset, ownership transfer, appeals, staffed-response SLAs, automated sanctions, permanent rating repair, or public enforcement history under this phase.
- Do not move Strategy execution or runtime diagnostics into web, API, Go, governance, report, or recovery code.

---

*Phase: 253-governance-dispute-abuse-and-recovery-surfaces*
*Artifact: code-pattern map for planning*
