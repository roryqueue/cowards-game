# Phase 253 Research

## Scope and Locked Direction

Phase 253 should add a deliberately small governance product, not a moderation platform. The implementation needs four connected pieces:

1. A signed-in, private report intake for public trial-competition MatchSets.
2. Entrant-owner disputes that place canonical counted evidence on a public-safe hold.
3. Admin-only, atomic governance mutations with immutable before/after audit records.
4. Policy-backed fair-play and account-recovery expectation surfaces that make current limitations explicit without collecting recovery evidence.

The Phase 252 counted-state classifier remains the authority for standings inclusion. Phase 253 may write governance inputs (`review_status`, canonical exclusion states, and safe reason categories), but it must not edit ranks, scoring, Match outcomes, or deterministic game evidence.

## Existing Implementation Inventory

### Canonical result and standings state

- `packages/spec/src/competition-counted-state.ts` owns the ten-state public vocabulary and derives public labels, explanations, standings effect, evidence availability, and safe reasons.
- `packages/spec/src/competition.ts` exposes `countedState` on ladder MatchSet summaries and public MatchSet results.
- `packages/persistence/src/standings-recompute.ts` is a pure reducer. It includes only canonical `counted` MatchSets and tracks excluded MatchSets independently.
- `packages/persistence/src/ladder.ts` and `packages/persistence/src/competition.ts` classify stored evidence during public reads. There is no persisted standings table or manually editable rank row. A governance mutation therefore triggers recomputation by changing canonical MatchSet inputs; the next read deterministically recomputes standings.
- `apps/go-backend/live_backend.go` independently projects the same counted-state and standings vocabulary for selected Go-owned public reads. New public governance fields must be implemented in both TypeScript and Go.

### Existing governance storage and mutations

- Migration `packages/persistence/migrations/0004_competition_trust_beta.sql` added:
  - `match_sets.counted_status`, `public_counted_reason`, `public_counted_explanation`, and `review_status`;
  - `result_flags`, with one mutable row per MatchSet/user;
  - `competition_audit_events`, with actor, before/after JSON, private reason/note, public explanation, and timestamp.
- Migration `packages/persistence/migrations/0010_competition_counted_states.sql` expands counted states and public reasons, but `review_status` still permits only `none`, `under_review`, and `resolved`.
- `packages/persistence/src/governance.ts` currently conflates intake and governance:
  - `flagMatchSetResult` is limited to entrants/admins, so it cannot satisfy general signed-in reporting;
  - it upserts and overwrites the prior private note, losing submission history;
  - it marks the MatchSet under review for every flag, which would let a general reporter remove evidence from standings;
  - the report write, MatchSet update, and audit insert are separate pool calls without a transaction;
  - `markMatchSetGovernanceStatus` updates before writing its audit event, also without a transaction;
  - governance accepts arbitrary `publicExplanation`, which creates a direct operator-to-public text path.
- `competition_audit_events` is append-oriented in application code but has no database protection against update/delete.

### Existing routes and UI

- `apps/web/app/api/matchsets/[matchSetId]/flags/route.ts` accepts only `{ note }`, returns a flag id, and relies on persistence for authorization.
- `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts` has route-local string sets, silently defaults invalid status/reason input, supports only four terminal states, and forwards arbitrary public copy.
- `apps/web/app/competitive/server.ts` maps governance errors to generic HTTP 400 and exposes the two persistence methods to routes.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` still reads legacy governance fields from untyped `metadata`; Phase 252 now provides typed `result.competition.countedState` instead.
- There is no report/dispute component and no route test for either governance endpoint.
- `apps/web/app/auth/auth-client.tsx` is the only recovery expectation surface and still says “Alpha accounts.” There is no self-service reset, ownership transfer, recovery-evidence intake, or dedicated recovery policy surface.

### Privacy and contract protection

- `packages/spec/src/public-output-privacy.ts` rejects established private runtime/source/token/DB fields and markers.
- `packages/spec/src/competition-policy-v1-36.ts` additionally names dispute internals, account-recovery payloads, and operator-only governance details as forbidden public material, and forbids staffed-moderation, rating-repair, and permanent-rating claims.
- The generic service DTO guard does not specifically reject plausible governance keys such as `reporterUserId`, `privateDetail`, `operatorUserId`, `operatorNote`, `reportCount`, or `recoveryEvidence`. Phase 253 needs a governance-specific leak guard and artifact tests.
- The generated service OpenAPI and fixtures reflect public MatchSet/ladder DTOs. Any public governance projection change requires fixture and artifact regeneration.

## Recommended Contract

Add `packages/spec/src/competition-governance.ts` as the sole vocabulary and copy authority.

### Private submission input

- `submissionType`: `report | dispute`.
- `category`: `result_integrity | entry_eligibility | identity_or_coordination | abusive_conduct | other`.
- `privateDetail`: optional, trimmed, at most 500 characters; reject NUL/control payloads. Do not require detail, and never return it from default/public reads.
- Target: one existing public MatchSet with `ladder_season_id` set. A dispute additionally requires the reporter to own an entrant snapshot in that MatchSet.
- Eligible result lifecycle: `complete`, `degraded`, `failed_system`, or `blocked`. Pending/running MatchSets do not yet have a result to dispute; calm public feedback should direct the Player to wait for a result.

General reports must record private intake only. They must not change counted state. An entrant-owner dispute may atomically set `review_status = 'disputed'`, set the canonical stored state/reason needed by the Phase 252 classifier, stamp the public governance timestamp, and write an audit event. This prevents any signed-in non-entrant from suppressing standings evidence.

### Deduplication and bounded intake

- Treat an identical open `(match_set_id, reporter_user_id, submission_type, category)` submission as idempotent and return the existing id with an `already_open` disposition.
- Enforce the race in PostgreSQL with a partial unique index over open rows, not with a check-then-insert alone.
- Bound cross-target intake to five accepted submissions per reporter in ten minutes. Serialize this check by locking the reporter’s user row inside the transaction. Return HTTP 429 with a coarse `Retry-After`; do not expose counts, timestamps, or rate-limit metadata in public/default DTOs.
- Response shape should be limited to `{ submissionId, disposition: "created" | "already_open", publicMessage }`. Do not echo private detail, reporter identity, dedupe keys, or workflow status.

### Governance action input

Admin actions should support exactly:

- `under_review`
- `counted`
- `non_counted`
- `non_competitive`
- `invalid`
- `invalidated`

The route should accept a constrained safe reason category and a required private operator reason. Public copy must be derived from `@cowards/spec`; it must never accept arbitrary `publicExplanation` from HTTP input. Suggested safe categories are:

- `integrity_review`
- `entrant_dispute`
- `evidence_incomplete`
- `competition_policy`
- `result_invalid`
- `result_invalidated`
- `review_resolved_counted`

Each category should map to a valid `CompetitionCountedPublicReason`, fixed public explanation, and allowed target states. Reject invalid combinations instead of defaulting them.

For `counted`, re-read canonical execution/scoring/Chronicle evidence under lock and reject the mutation unless the Phase 252 classifier can produce `counted`. Governance must not override missing evidence. Replay availability remains Chronicle-derived and must not be changed by governance.

### Public projection

Add a shared `PublicCompetitionGovernanceProjection` under existing competition metadata rather than publishing audit/report records. Recommended shape:

```ts
interface PublicCompetitionGovernanceProjection {
  status:
    | "clear"
    | "under_review"
    | "disputed"
    | "resolved"
    | "non_counted"
    | "non_competitive"
    | "invalid"
    | "invalidated"
  publicReason?: CompetitionCountedPublicReason
  publicExplanation: string
  changedAt?: string
  standingsEffect: string
  replayAvailable: boolean
}
```

`countedState` remains the result/standings authority. The governance projection is explanatory metadata and should be derived from the same safe-copy table. `changedAt` should come from a dedicated public-safe `match_sets.governance_changed_at`, not from selecting private audit rows in a public read. `replayAvailable` must be computed from Chronicle presence independently of governance state.

Public reads should stop preferring arbitrary legacy `public_counted_explanation` over canonical spec copy. Existing stored text may remain private/legacy, but all new public output should be derived from constrained categories.

## Persistence Design

Use migration `packages/persistence/migrations/0011_competition_governance_surfaces.sql`.

Recommended additive changes:

1. Add `match_sets.governance_changed_at timestamptz`.
2. Replace the `review_status` constraint with `none | under_review | disputed | resolved`.
3. Create `competition_reports` rather than extending the lossy `result_flags` model:
   - id, MatchSet FK, reporter user FK, submission type, category, private detail, status, dedupe key/metadata, created/resolved timestamps;
   - status vocabulary `open | resolved | dismissed`;
   - partial unique index for identical open submissions;
   - reporter/time index for the bounded intake check.
4. Leave `result_flags` as legacy/read-only for this milestone or perform a deterministic one-time backfill; do not continue upserting it.
5. Add database triggers rejecting update/delete on `competition_audit_events`. Audit corrections should be new compensating events, never edits.

Every report/dispute or governance action should use `withTransaction` and a `PoolClient`-compatible query interface. Lock rows in stable order:

1. reporter/admin user row;
2. sorted target MatchSet rows `FOR UPDATE`;
3. existing open report rows as needed.

For a group action, accept a bounded, de-duplicated array of MatchSet ids (recommended maximum 100), sort before locking, require all targets to exist and belong to trial competition, and apply all updates/audit inserts in one transaction. Write one immutable audit event per MatchSet so each public state has an exact before/after record. Any invalid target rolls back the entire group.

Because standings are read-time derived, no standings write is required or permitted. Tests should prove that the same Season read immediately excludes or restores the affected MatchSet after the transaction.

## Concrete File Map

### Spec and generated contracts

- **Add** `packages/spec/src/competition-governance.ts` — submission categories, safe governance reason/copy table, public projection, fair-play copy, recovery copy, and specialized privacy assertion.
- **Add** `packages/spec/src/competition-governance.test.ts` — category/state matrix, fixed-copy tests, forbidden-claim tests, and privacy leak matrix.
- **Modify** `packages/spec/src/index.ts` — export the contract.
- **Modify** `packages/spec/src/competition.ts` — nest the public governance projection in MatchSet result and ladder summary competition metadata.
- **Modify** `packages/spec/src/schemas.ts` — schemas for public governance projection and public result/ladder fields. Private report request schemas may live here only if routes consume them directly.
- **Modify** `packages/spec/src/service-fixtures.ts` and `packages/spec/artifacts/service-api-v1.8.openapi.json` — representative clear, disputed, invalidated, and replay-unavailable public examples.
- **Modify** `packages/spec/src/service-contract.test.ts` — forbid governance-private property names in public schemas/artifacts.

### Persistence

- **Add** `packages/persistence/migrations/0011_competition_governance_surfaces.sql` — report table, review-state expansion, public timestamp, indexes, and immutable-audit triggers.
- **Rewrite** `packages/persistence/src/governance.ts` — transaction-owned submit/report/dispute and single/group admin mutations; canonical category validation; evidence guard for `counted`; no arbitrary public copy.
- **Add** `packages/persistence/src/governance.test.ts` — focused fake-client transaction tests plus optional PostgreSQL integration coverage.
- **Modify** `packages/persistence/src/migrations.test.ts` — assert the new migration is ordered and contains report/audit protections.
- **Modify** `packages/persistence/src/competition.ts`, `packages/persistence/src/ladder.ts`, and `packages/persistence/src/profiles.ts` — derive the coarse public projection without reading report/audit private fields; remove legacy arbitrary-copy preference.

### Web/API

- **Replace or retain as compatibility wrapper** `apps/web/app/api/matchsets/[matchSetId]/flags/route.ts` — route to the typed submission path; do not keep legacy note-only semantics.
- **Prefer new canonical route** `apps/web/app/api/matchsets/[matchSetId]/reports/route.ts` — validate signed-in request and return only the safe receipt.
- **Add** corresponding `route.test.ts` — anonymous rejection, general report, entrant dispute, non-entrant dispute, duplicate disposition, rate-limit response, and no private echo.
- **Modify** `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts` and add a route test — strict status/category parsing, no defaults, no arbitrary public explanation, admin error behavior.
- **Add if group mutation is exposed separately** `apps/web/app/api/admin/matchsets/governance/route.ts` with the same strict contract and bounded id list.
- **Modify** `apps/web/app/competitive/server.ts` and `apps/web/app/competitive/http.ts` — typed methods and stable 403/404/409/422/429 mappings without leaking persistence errors.
- **Add** `apps/web/app/matchsets/[matchSetId]/competition-report-client.tsx` and test — category selector, report/dispute mode, optional bounded detail, calm success/error states, and warning not to submit credentials, source, tokens, private runtime details, or recovery evidence.
- **Modify** `apps/web/app/matchsets/[matchSetId]/page.tsx` — consume typed `competition.countedState/governance`; show report to signed-in Players and dispute only to an entrant owner. Phase 254 can refine composition, but Phase 253 must deliver a usable minimal surface.
- **Add** `apps/web/app/competitions/fair-play/page.tsx` — current fair-play/reporting behavior and explicit non-promises from the spec contract.
- **Add** `apps/web/app/account/recovery/page.tsx` — policy-only recovery expectations with no evidence form.
- **Modify** `apps/web/app/auth/auth-client.tsx` and `apps/web/app/account/page.tsx` — replace alpha copy and link to the policy-only recovery surface.

### Go parity and monitors

- **Modify** `apps/go-backend/live_backend.go` — selected public MatchSet, ladder, player, and Strategy reads must include the same coarse governance projection while never querying report detail or operator audit fields.
- **Add** `apps/go-backend/governance_policy_test.go` — TypeScript/Go public matrix parity and leak scan.
- **Modify** `scripts/evaluate-v1-36-competition-policy.ts` and its test — inventory new policy/API/page surfaces and scan forbidden moderation/recovery claims.
- **Modify** `scripts/check-boundary-monitors.ts` and its test — reject reporter/operator/recovery-private fields in public fixtures, API snapshots, and artifacts. Phase 255 should provide the service-backed proof artifact.

## Recommended Test Strategy

### Spec/unit

- Table-test every submission type/category and every governance state/reason combination.
- Prove safe copy is deterministic and rejects arbitrary public explanation input.
- Scan public projections for reporter identity, detail, counts, operator identity/notes, raw diagnostics, recovery evidence, credentials, source/memory/objective payloads, and private runtime data.
- Assert fair-play/recovery copy contains the required limitations and none of the forbidden claims: automatic punishment, continuous monitoring, public sanction history, staffed response/appeal SLA, ownership transfer, permanent rating repair, or durable rating.

### Persistence

- General signed-in report creates private intake and leaves MatchSet counted/review state unchanged.
- Entrant-owner dispute creates private intake, sets `disputed`, writes one before/after audit event, and causes the pure standings reducer to exclude the MatchSet.
- Non-entrant dispute is rejected; admin status does not grant the public dispute capability implicitly.
- Duplicate open submission returns the original id without updating its detail or creating another row.
- Rate-limit race is serialized; retry metadata stays private.
- Governance single/group actions lock and update atomically, emit one immutable audit event per target, and roll back all targets if one fails.
- `counted` is rejected without complete scoring and Chronicle coverage.
- Governance never changes Match/Chronicle rows or replay availability.
- Audit update/delete attempts fail in a PostgreSQL-backed test when `DATABASE_URL` is explicitly configured.

### Route/component

- Direct route tests should follow the existing hoisted mock pattern used by the ladder entry route.
- Verify 401, 403, 404, 409/422, and 429 projections and assert serialized bodies do not contain submitted detail or persistence error text.
- Component tests should cover mode/category selection, 500-character boundary, disabled submitting state, idempotent receipt, and policy links.
- Result-page tests should prove anonymous users see policy/report sign-in guidance, signed-in non-entrants cannot select dispute, and entrant owners can.

### Public parity and integration

- Parse TypeScript and Go public result/ladder outputs with the same Zod service schemas.
- Use a parity matrix for clear, under-review, disputed, resolved-counted, non-counted, non-competitive, invalid, and invalidated states with replay both available and unavailable.
- Assert standings change only through canonical classification and return deterministically when a review resolves to valid counted evidence.
- Regenerate/check OpenAPI and fixtures, then run privacy and boundary monitors.
- Defer the full service-backed entry-to-replay governance scenario to Phase 255, but leave deterministic test helpers and fixtures ready for it.

Recommended focused verification commands:

```sh
pnpm exec vitest run packages/spec/src/competition-governance.test.ts packages/persistence/src/governance.test.ts apps/web/app/api/matchsets/[matchSetId]/reports/route.test.ts apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.test.ts
pnpm --filter @cowards/spec typecheck
pnpm --filter @cowards/persistence typecheck
pnpm --filter @cowards/web typecheck
pnpm --filter @cowards/spec contract:generate
pnpm --filter @cowards/spec contract:check
pnpm go:parity
pnpm v1.36:competition-policy:check
pnpm exec tsx scripts/check-boundary-monitors.ts
```

Quote bracketed route paths when running them from zsh.

## Privacy Boundaries

The following may be stored privately but must never appear in public/default DTOs, public pages, generated OpenAPI examples, logs returned to clients, proof snapshots, or public Go responses:

- reporter user id/handle/session and report counts;
- private report/dispute detail, dedupe keys, rate-limit counters/windows, and workflow metadata;
- operator user id, private reason/note, audit before/after payloads, and internal resolution workflow;
- recovery evidence, credentials, ownership assertions, password/session/token material, or support correspondence;
- Strategy source, artifact bytes, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, provider/runtime internals, host/env/package paths, tokens, or DB details.

Public output is limited to canonical coarse status, safe reason, fixed safe explanation, applicable public timestamp, standings effect, and Chronicle-derived replay availability. A report receipt is a private authenticated response, not a public result projection, and should still avoid echoing private detail.

Do not log request bodies in the route or persistence layer. Do not place report/recovery data in generic MatchSet `metadata`, entrant snapshots, audit public explanation, proof artifacts, or client-side analytics.

## Main Risks and Mitigations

- **Standings griefing:** A general reporter could suppress a counted result if reports and disputes share state behavior. Keep general reports intake-only; only an entrant-owner dispute creates the automatic hold.
- **Partial writes:** Current mutations can update state without an audit row. Use one transaction and row locks for intake, state, timestamp, and audit.
- **Public text leakage:** Current admin input can become public verbatim. Replace it with spec-owned fixed copy and retain operator reasoning only in private columns.
- **Lost history:** Current upsert overwrites notes. Insert immutable submissions and return the existing open id for duplicates.
- **Group inconsistency/deadlock:** Sort and bound ids, lock in stable order, validate every target before any update, and commit all-or-none.
- **False counted restoration:** A stored `counted` value cannot make incomplete evidence count. Validate through the canonical classifier before accepting a counted governance action.
- **Replay coupling:** Invalidated/disputed results may still have valid public Chronicle evidence. Compute replay availability independently and never delete evidence as a governance side effect.
- **TypeScript/Go drift:** Selected public reads can come from either backend. Share schema fixtures and run a state/replay parity matrix.
- **Policy overclaim:** UI copy can accidentally imply staffed review, sanctions, recovery, appeals, or rating repair. Keep copy in the spec contract and scan pages/artifacts for forbidden claims.
- **Sensitive recovery intake:** A tempting “contact recovery” form would create an unplanned high-risk data flow. Phase 253 must remain policy-only for recovery.

## Suggested Plan Split

1. **253-01 — Contract, storage, and private intake:** spec vocabulary/copy, migration, transactional report/dispute persistence, route, and focused tests.
2. **253-02 — Atomic governance and public projection:** single/group admin actions, immutable audit, evidence-gated counted resolution, TypeScript/Go public projection parity, and standings-effect tests.
3. **253-03 — Fair-play/recovery surfaces and privacy proof:** minimal report UI, fair-play and recovery policy pages, contract/OpenAPI refresh, privacy scans, and boundary monitor updates.

This split keeps private intake and public governance projection reviewable independently and leaves Phase 254 free to improve trust-surface composition without inventing policy or persistence behavior.
