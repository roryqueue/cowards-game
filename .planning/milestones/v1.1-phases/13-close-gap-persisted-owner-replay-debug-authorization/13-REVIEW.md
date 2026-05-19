---
phase: 13-close-gap-persisted-owner-replay-debug-authorization
reviewed: 2026-05-18T21:20:31Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/workshop/server.test.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/app/workshop/workshop-client.test.tsx
  - apps/web/app/workshop/workshop-client.tsx
  - apps/web/e2e/workshop-to-replay.spec.ts
  - packages/persistence/src/matchset-status.ts
  - packages/persistence/src/workshop.test.ts
  - packages/persistence/src/workshop.ts
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-18T21:20:31Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the Phase 13 persisted Workshop-to-replay changes since `6d29554`, with emphasis on owner replay debug authorization, replay privacy, Workshop test summaries, and the new tests. The main issue is that persisted owner-debug authorization proves only that the requested player is a Match participant, not that the caller is authorized to view that player's private replay data.

Targeted tests were run and passed:

```text
pnpm --filter @cowards/web test -- apps/web/app/matches/server.test.ts apps/web/app/workshop/server.test.ts apps/web/app/workshop/workshop-client.test.tsx
pnpm --filter @cowards/persistence test -- packages/persistence/src/workshop.test.ts
```

## Critical Issues

### CR-01: Owner Debug Authorization Trusts Caller-Supplied Player Identity

**File:** `apps/web/app/matches/server.ts:50`

**Issue:** `resolvePersistedMatchOwners` authorizes owner replay by checking only whether the caller-supplied `requestedOwnerPlayerId` is one of the persisted Match participants (`$2 in (bottom_player_id, top_player_id)`). When owner debug replay is enabled, a caller can request either participant id and receive that owner's private replay projection, including owner-only Chronicle events and owner debug material. The public replay metadata exposes `bottomPlayerId` and `topPlayerId`, so this is not a strong secret.

**Fix:**

Require a server-side authenticated subject/current player and verify that subject is allowed to view the requested owner. For Workshop, only authorize the local Workshop player for Workshop-owned MatchSets; do not authorize the opponent merely because it is a Match participant.

```ts
type ResolveAuthorizedReplayOwners = (input: {
  pool: Queryable
  matchId: MatchId
  requestedOwnerPlayerId: PlayerId
  currentPlayerId: PlayerId
}) => Promise<readonly PlayerId[]>

// Example Workshop-local guard; replace with real session ownership once auth exists.
if (requestedOwnerPlayerId !== currentPlayerId) {
  return []
}

const result = await pool.query(
  `
    select 1
    from matches m
    join match_set_matches msm on msm.match_id = m.id
    where m.id = $1
      and msm.match_set_id like 'match-set:workshop:%'
      and $2 in (m.bottom_player_id, m.top_player_id)
    limit 1
  `,
  [matchId, currentPlayerId],
)
```

Add a negative test proving a Workshop caller cannot request the opponent/top player owner debug data even though that player is in the Match.

## Warnings

### WR-01: Explicit Owner Mode Bypasses the Persisted Authorization Resolver

**File:** `apps/web/app/matches/replay-ready.ts:99`

**Issue:** `trustedOwnerReplayOptions` returns `options` immediately when `allowOwnerDebug`, `mode: "owner"`, and `ownerPlayerId` are present. That path does not require `authorizedRequestedOwners`, so any future server route or helper that forwards user-controlled options into `getMatchReplay` can bypass the persisted ownership resolver entirely. The current tests also preserve this bypass in `apps/web/app/matches/server.test.ts:525`.

**Fix:** Make all persisted owner replay paths require an authorized owner list entry, and keep fixture-only bypasses in a separate helper if needed.

```ts
if (
  options.mode === "owner" &&
  options.ownerPlayerId &&
  authorizedRequestedOwners.includes(options.ownerPlayerId) &&
  (options.ownerPlayerId === metadata.bottomPlayerId ||
    options.ownerPlayerId === metadata.topPlayerId)
) {
  return options
}
```

### WR-02: Workshop Test Summary Lookup Is Not Scoped to Workshop MatchSets

**File:** `packages/persistence/src/workshop.ts:735`

**Issue:** `getWorkshopTestSummary` accepts any `matchSetId`, verifies only that the MatchSet exists, then returns match ids, player ids, outcomes, replay availability, and scoring. The Workshop API route that calls this function is a Workshop-specific endpoint, but this service function does not enforce the Workshop prefix or caller ownership. A caller who knows another MatchSet id can retrieve non-Workshop MatchSet details through the Workshop status endpoint.

**Fix:** Reject non-Workshop MatchSet ids in the service before querying, or add a real owner/session predicate.

```ts
if (!matchSetId.startsWith(WORKSHOP_MATCH_SET_PREFIX)) {
  return null
}
```

Add route/service tests proving `/api/workshop/tests/:matchSetId` returns 404 for non-Workshop MatchSet ids.

### WR-03: Runtime Failure Samples Are Not Executed in Tests

**File:** `packages/persistence/src/workshop.ts:514`

**Issue:** The sample catalog declares executable runtime-failure expectations for timeout, invalid output, and thrown exception samples, but the unit test only checks that runtime-failure samples are validation-valid, and the new E2E exercises only `sample:failure-thrown-exception`. A broken timeout or invalid-output sample would still pass this phase's tests while the UI advertises it as a known failure mode.

**Fix:** Add a worker-backed integration test or parameterized service E2E that submits each sample with `expectedRuntimeViolationType`, runs the worker, opens owner debug replay, and asserts the expected runtime violation type appears.

```ts
for (const sample of listWorkshopSamples().filter(
  (sample) => sample.expectedRuntimeViolationType,
)) {
  // submit sample.source, launch smoke test, run worker, assert owner debug
  // contains sample.expectedRuntimeViolationType
}
```

---

_Reviewed: 2026-05-18T21:20:31Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
