# Phase 13: Close Gap: Persisted Owner Replay Debug Authorization - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 20 expected new/modified files
**Analogs found:** 20 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
| --- | --- | --- | --- | --- |
| `apps/web/app/matches/server.ts` | service | request-response + DB read | `apps/web/app/matches/server.ts` | exact |
| `apps/web/app/matches/replay-ready.ts` | service/transform | transform | `apps/web/app/matches/replay-fixture.ts` | exact for trusted owner list |
| `apps/web/app/matches/types.ts` | model/DTO | transform | `apps/web/app/matches/types.ts` | exact |
| `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | route utility | request-response | `apps/web/app/matches/[matchId]/replay/owner-debug.ts` | exact |
| `apps/web/app/matches/[matchId]/replay/page.tsx` | route/component | request-response | `apps/web/app/matches/[matchId]/replay/page.tsx` | exact |
| `apps/web/app/workshop/workshop-client-state.ts` | client utility | transform | `apps/web/app/workshop/workshop-client-state.ts` | exact |
| `apps/web/app/workshop/workshop-client.tsx` | component | event-driven + request-response | `apps/web/app/workshop/workshop-client.tsx` | exact |
| `apps/web/e2e/workshop-to-replay.spec.ts` | test | service-backed E2E | `apps/web/e2e/workshop-to-replay.spec.ts` | exact |
| `apps/web/app/matches/server.test.ts` | test | request-response + transform | `apps/web/app/matches/server.test.ts` | exact |
| `apps/web/app/matches/replay-fixture.test.ts` | test | transform | `apps/web/app/matches/replay-fixture.test.ts` | exact |
| `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` | test | request-response | `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` | exact |
| `apps/web/app/workshop/workshop-client.test.tsx` | test | transform + component assertions | `apps/web/app/workshop/workshop-client.test.tsx` | exact |
| `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` | test | DTO privacy + component source assertions | `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` | exact |
| `apps/web/app/matches/[matchId]/replay/replay-state.test.ts` | test | transform | `apps/web/app/matches/[matchId]/replay/replay-state.test.ts` | exact |
| `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md` | role-match |
| `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-VALIDATION.md` | role-match |
| `.planning/phases/10-runtime-isolation-hardening/10-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/phases/10-runtime-isolation-hardening/10-VALIDATION.md` | role-match |
| `.planning/phases/11-doctrine-debugging-ux/11-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/phases/11-doctrine-debugging-ux/11-VALIDATION.md` | role-match |
| `.planning/phases/12-local-and-ci-reliability/12-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/phases/12-local-and-ci-reliability/12-VALIDATION.md` | role-match |
| `.planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-VERIFICATION.md` | verification artifact | batch/documentation | `.planning/v1.1-INTEGRATION-CHECK.md` | role-match |

## Pattern Assignments

### `apps/web/app/matches/server.ts` (service, request-response + DB read)

**Analog:** `apps/web/app/matches/server.ts`

**Imports/dependency seam pattern** (lines 1-25):
```typescript
import { createDatabasePool } from "@cowards/persistence/db"
import {
  createPostgresChronicleStore,
  type ChronicleStore,
} from "@cowards/persistence/chronicle-store"
import type { Queryable } from "@cowards/persistence/repositories"
import type { MatchId } from "@cowards/spec"
import type { GetMatchReplayOptions, ReplayPageData } from "./types.js"
import { buildReadyReplayFromStoredChronicle } from "./replay-ready.js"

type WithPool = <T>(fn: (pool: Queryable) => Promise<T>) => Promise<T>

export interface MatchReplayServerDeps {
  withPool?: WithPool | undefined
  createChronicleStore?:
    | ((pool: Queryable) => Pick<ChronicleStore, "getByMatchId">)
    | undefined
}
```

**Pool lifecycle pattern** (lines 27-34):
```typescript
const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}
```

**Core persisted replay load pattern** (lines 49-74):
```typescript
const resolvedMatchId = decodeMatchId(matchId)
if (isReplayFixtureMatch(resolvedMatchId)) {
  return createReplayFixtureData({
    ...options,
    scenarioId: getReplayFixtureScenarioId(resolvedMatchId) ?? undefined,
  })
}

const stored = await withPool((pool) =>
  createStore(pool).getByMatchId(resolvedMatchId),
)

if (!stored) {
  return {
    status: "unavailable",
    matchId: resolvedMatchId,
    reason: "missing-chronicle",
    message: "Replay unavailable: no Chronicle is stored for this Match.",
  }
}

return buildReadyReplayFromStoredChronicle(stored, options)
```

**Gotchas:**
- Query parameters must stay advisory. Do not convert `requestedOwnerPlayerId` to owner mode in `owner-debug.ts`; perform the trusted participant check in this server path or in the replay-ready helper with server-provided authorized owners.
- Use persisted Chronicle metadata (`bottomPlayerId`, `topPlayerId`) as the current no-auth trusted participant source unless the plan introduces a narrower server-side owner resolver seam.
- Keep fixture handling before DB lookup.

### `apps/web/app/matches/replay-ready.ts` (service/transform)

**Analog:** `apps/web/app/matches/replay-ready.ts` plus authorized-list use in `replay-fixture.ts`

**Trusted owner upgrade helper pattern** (lines 90-122):
```typescript
export const trustedOwnerReplayOptions = (
  metadata: ReplayMetadataDto,
  options: GetMatchReplayOptions = {},
  authorizedRequestedOwners: readonly string[] = [],
): GetMatchReplayOptions => {
  if (options.allowOwnerDebug !== true) {
    return options
  }

  if (options.mode === "owner" && options.ownerPlayerId) {
    return options
  }

  const requestedOwner = options.requestedOwnerPlayerId
  if (
    requestedOwner &&
    authorizedRequestedOwners.includes(requestedOwner) &&
    (requestedOwner === metadata.bottomPlayerId ||
      requestedOwner === metadata.topPlayerId)
  ) {
    return {
      ...options,
      mode: "owner",
      ownerPlayerId: requestedOwner,
    }
  }

  return {
    ...options,
    mode: "public",
    ownerPlayerId: undefined,
  }
}
```

**Owner DTO generation pattern** (lines 148-182):
```typescript
const projection =
  mode === "owner"
    ? projectOwnerChronicle(chronicle, options.ownerPlayerId!)
    : projectPublicChronicle(chronicle)

const ownerDebug =
  mode === "owner" && options.ownerPlayerId
    ? {
        soldierInactivityExplanations: buildSoldierInactivityExplanations({
          chronicle,
          ownerPlayerId: options.ownerPlayerId,
        }),
      }
    : undefined

return {
  status: "ready",
  mode,
  metadata,
  projection,
  timeline: buildTimeline(projection.events, chronicle.events),
  states,
  initialSequence: 0,
  ...(mode === "owner" && options.ownerPlayerId
    ? { ownerPlayerId: options.ownerPlayerId }
    : {}),
  ...(ownerDebug === undefined ? {} : { ownerDebug }),
} satisfies ReplayReadyDto
```

**Fixture authorized owner precedent** (`apps/web/app/matches/replay-fixture.ts` lines 110-117):
```typescript
return buildReadyReplayFromChronicle({
  chronicle: scenario.chronicle,
  metadata,
  options: trustedOwnerReplayOptions(metadata, options, [
    metadata.bottomPlayerId,
  ]),
})
```

**Gotchas:**
- The persisted path currently calls `trustedOwnerReplayOptions(metadata, options)` with no authorized owners (lines 208-212), so requested owners are intentionally downgraded to public.
- Preserve the double check: requested owner must be in the server-authorized list and must match one of the Chronicle participants.
- Do not move Soldier inactivity explanation inference into React. It must keep using `buildSoldierInactivityExplanations`.

### `apps/web/app/matches/types.ts` (model/DTO)

**Analog:** `apps/web/app/matches/types.ts`

**Replay options and DTO conventions** (lines 13-19, 57-70):
```typescript
export type ReplayViewMode = "public" | "owner"

export interface GetMatchReplayOptions {
  mode?: ReplayViewMode | undefined
  ownerPlayerId?: PlayerId | undefined
  requestedOwnerPlayerId?: PlayerId | undefined
  allowOwnerDebug?: boolean | undefined
}

export interface ReplayReadyDto {
  status: "ready"
  mode: ReplayViewMode
  metadata: ReplayMetadataDto
  projection: ChronicleProjection
  timeline: ReplayTimelineEntryDto[]
  states: ReplayStateDto[]
  initialSequence: 0
  ownerPlayerId?: PlayerId | undefined
  ownerDebug?:
    | {
        soldierInactivityExplanations: SoldierInactivityExplanationDto[]
      }
    | undefined
}
```

**Gotchas:**
- Optional fields use explicit `| undefined`.
- Keep public DTOs structurally clean by omitting `ownerPlayerId` and `ownerDebug`, not by setting them to null.

### `apps/web/app/matches/[matchId]/replay/owner-debug.ts` (route utility)

**Analog:** `apps/web/app/matches/[matchId]/replay/owner-debug.ts`

**Environment gate and query parsing pattern** (lines 11-41):
```typescript
export const isOwnerDebugReplayEnabled = (
  env: ReplayEnv = process.env,
): boolean =>
  env.PLAYWRIGHT_TEST === "1" ||
  env.NODE_ENV === "test" ||
  env.COWARDS_ENABLE_OWNER_DEBUG_REPLAY === "1"

export const resolveOwnerDebugReplayOptions = (
  searchParams: QueryParams | undefined,
  env: ReplayEnv = process.env,
): GetMatchReplayOptions | undefined => {
  if (!isOwnerDebugReplayEnabled(env) || !searchParams) {
    return undefined
  }

  const debugMode =
    firstValue(searchParams.ownerDebug) ?? firstValue(searchParams.debug)
  if (debugMode !== "1" && debugMode !== "owner") {
    return undefined
  }

  const ownerPlayerId = firstValue(searchParams.ownerPlayerId)
  if (!ownerPlayerId) {
    return undefined
  }

  return {
    allowOwnerDebug: true,
    requestedOwnerPlayerId: ownerPlayerId as PlayerId,
  }
}
```

**Tests to copy** (`owner-debug.test.ts` lines 18-28, 30-58):
```typescript
expect(
  resolveOwnerDebugReplayOptions(
    { ownerDebug: "1", ownerPlayerId: "player:bottom" },
    { PLAYWRIGHT_TEST: "1" },
  ),
).toEqual({
  allowOwnerDebug: true,
  requestedOwnerPlayerId: "player:bottom",
})

expect(
  resolveOwnerDebugReplayOptions(
    { ownerDebug: "1" },
    { PLAYWRIGHT_TEST: "1" },
  ),
).toBeUndefined()
expect(
  resolveOwnerDebugReplayOptions(
    { ownerDebug: "0", ownerPlayerId: "player:bottom" },
    { PLAYWRIGHT_TEST: "1" },
  ),
).toBeUndefined()
```

**Gotchas:**
- This file should continue returning `requestedOwnerPlayerId`, not trusted `ownerPlayerId`.
- Query aliases already accepted: `ownerDebug=1` or `debug=owner`; preserve backward compatibility unless explicitly changed.

### `apps/web/app/matches/[matchId]/replay/page.tsx` (route/component)

**Analog:** `apps/web/app/matches/[matchId]/replay/page.tsx`

**Route data flow pattern** (lines 15-31):
```typescript
export default async function ReplayPage({
  params,
  searchParams,
}: ReplayPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await Promise.resolve(searchParams)
  const data = await getMatchReplay(
    resolvedParams.matchId,
    resolveOwnerDebugReplayOptions(resolvedSearchParams),
  )

  if (data.status === "unavailable") {
    return <ReplayUnavailable data={data} />
  }

  return <ReplayClient data={data} />
}
```

**Gotchas:**
- Keep this page thin. It should pass route-derived options to `getMatchReplay` and let the server facade decide authorization.
- `dynamic = "force-dynamic"` is already used; preserve it for persisted replay freshness.

### `apps/web/app/workshop/workshop-client-state.ts` (client utility, transform)

**Analog:** `apps/web/app/workshop/workshop-client-state.ts`

**Current replay link helper pattern** (lines 161-190):
```typescript
export type WorkshopMatchSummary = WorkshopTestSummary["matches"][number]

export const getReplayHref = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`

export const canOpenReplay = (match: WorkshopMatchSummary): boolean =>
  match.status === "complete" && match.hasReplay === true

export const getReplayAvailability = (
  match: WorkshopMatchSummary,
): ReplayAvailability => {
  if (canOpenReplay(match)) {
    return {
      state: "available",
      label: "Open replay",
      href: getReplayHref(match.matchId),
      reason: null,
    }
  }
```

**Tests to extend** (`workshop-client.test.tsx` lines 210-259):
```typescript
expect(getReplayHref("match:alpha/beta")).toBe(
  "/matches/match%3Aalpha%2Fbeta/replay",
)
expect(
  canOpenReplay({
    matchId: "match:complete",
    status: "complete",
    hasReplay: true,
  }),
).toBe(true)
expect(
  getReplayAvailability({
    matchId: "match:complete",
    status: "complete",
    hasReplay: true,
  }),
).toEqual({
  state: "available",
  label: "Open replay",
  href: "/matches/match%3Acomplete/replay",
  reason: null,
})
```

**Gotchas:**
- Add owner-debug link construction here, not inline in JSX, so URL encoding and query shape are unit-tested.
- The Workshop local player id is `WORKSHOP_PLAYER_ID` in persistence (`packages/persistence/src/workshop.ts` lines 706-707 show it as `bottomPlayerId` when launching tests). If the client needs an owner id, prefer adding it to a typed Workshop DTO rather than hard-coding in JSX.

### `apps/web/app/workshop/workshop-client.tsx` (component, event-driven)

**Analog:** `apps/web/app/workshop/workshop-client.tsx`

**Result row and link render pattern** (lines 631-659):
```tsx
{testResult.matches.length ? (
  <div className="workshop-match-list" aria-label="Matches">
    {testResult.matches.map((match) => {
      const replay = getReplayAvailability(match)
      return (
        <div className="workshop-match-row" key={match.matchId}>
          <div className="workshop-match-main">
            <span
              className="workshop-match-id"
              title={match.matchId}
            >
              {match.matchId}
            </span>
            <span className="workshop-muted">
              {match.status} · {formatMatchOutcome(match)}
            </span>
          </div>
          <span
            className="workshop-muted"
            data-replay-state={replay.state}
            data-testid="workshop-replay-availability"
          >
            {canOpenReplay(match) ? (
              <a
                className="workshop-replay-link"
                href={getReplayHref(match.matchId)}
              >
                {replay.label}
              </a>
            ) : (
              replay.reason
            )}
          </span>
        </div>
      )
    })}
  </div>
) : null}
```

**Gotchas:**
- Keep link availability based on `canOpenReplay(match)`.
- If adding a second owner-debug link, make the accessible name distinct from public `Open replay` so Playwright can target the owner link reliably.
- Do not render owner explanations here. Workshop only generates replay URLs; ReplayClient owns the opt-in overlay.

### `apps/web/e2e/workshop-to-replay.spec.ts` (service-backed E2E)

**Analog:** `apps/web/e2e/workshop-to-replay.spec.ts`

**Service-backed skip and worker execution pattern** (lines 1-36):
```typescript
import { expect, test } from "@playwright/test"

test.skip(
  process.env.RUN_SERVICE_E2E !== "1",
  "Service-backed Workshop-to-replay smoke requires local Postgres/Redis; set RUN_SERVICE_E2E=1 when services are available.",
)

await page.getByRole("button", { name: "Launch test" }).click()
const workerResponse = await page.request.post(
  "/api/test-support/run-worker-once",
)
const workerPayload = await workerResponse.json()
expect(
  workerResponse.status(),
  `[worker_execution] ${JSON.stringify(workerPayload)}`,
).toBe(200)
expect(
  workerPayload,
  "[worker_execution] worker did not complete queued Match",
).toMatchObject({
  status: "ok",
})
```

**Layer-labelled replay assertions pattern** (lines 38-57):
```typescript
await expect(
  page.getByText(/Test complete|Some Matches failed/),
  "[chronicle_validation] Match did not reach a replayable terminal state",
).toBeVisible()
await page.getByRole("link", { name: "Open replay" }).first().click()
await expect(page, "[replay_projection] Replay route did not open").toHaveURL(
  /\/matches\/.*\/replay/,
)
await expect(
  page.getByRole("heading", { name: "Replay" }),
  "[ui_rendering] Replay heading did not render",
).toBeVisible()
```

**Owner-debug browser assertion analog** (`apps/web/e2e/replay.fixture.spec.ts` lines 180-204):
```typescript
await page.goto(`${replayHref}?ownerDebug=1`)
await expect(page.getByText("Public view")).toBeVisible()
await expect(page.getByText("Owner debug")).toHaveCount(0)
await expect(page.getByText("Why this Soldier did nothing")).toHaveCount(0)

await page.goto(`${replayHref}?ownerDebug=1&ownerPlayerId=bottom`)
await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
const ownerToggle = page.getByTestId("replay-owner-debug-toggle")
await expect(ownerToggle).toBeVisible()
await expect(ownerToggle).not.toBeChecked()
await expect(page.getByText("Why this Soldier did nothing")).toHaveCount(0)

await page
  .getByRole("button", { name: /Timeline event \d+: RUNTIME_VIOLATION/ })
  .click()
await ownerToggle.check()

const explanation = page.getByTestId("replay-soldier-inactivity-explanation")
await expect(explanation).toBeVisible()
await expect(explanation).toHaveAttribute("data-cause-code", "TIMEOUT")
```

**Failure sample selector pattern** (`packages/persistence/src/workshop.ts` lines 514-520):
```typescript
sample({
  id: "sample:failure-runtime-timeout",
  label: "Failure: runtime timeout",
  sampleKind: "failure-mode",
  description: "Demonstrates a Strategy that exceeds the runtime limit.",
  categories: ["Runtime violation"],
  source: runtimeTimeoutSampleSource,
  expectedRuntimeViolationType: "TIMEOUT",
})
```

**Gotchas:**
- Use a runtime-valid failure-mode sample (`sample:failure-runtime-timeout`, `sample:failure-invalid-output`, or `sample:failure-thrown-exception`), not `sample:failure-forbidden-clock`, which is validation-invalid and cannot be submitted.
- Keep public privacy assertions beside owner success: first open public replay and assert no owner debug text/toggle, then open owner-debug link and assert opt-in behavior.
- Service-backed Strategy execution must keep going through `/api/test-support/run-worker-once`; do not execute Strategy source in the web test or API process.

### `apps/web/app/matches/server.test.ts` (unit/integration test)

**Analog:** `apps/web/app/matches/server.test.ts`

**Store seam test pattern** (lines 199-212):
```typescript
const server = createMatchReplayServer({
  withPool: async (fn) => fn({} as never),
  createChronicleStore: () => ({
    getByMatchId: async () => null,
  }),
})

await expect(server.getMatchReplay("match:missing")).resolves.toEqual({
  status: "unavailable",
  matchId: "match:missing",
  reason: "missing-chronicle",
  message: "Replay unavailable: no Chronicle is stored for this Match.",
})
```

**Public privacy assertion pattern** (lines 296-329):
```typescript
const response = await server.getMatchReplay("match:replay-test")

expect(response.status).toBe("ready")
if (response.status !== "ready") {
  return
}
expect(response.projection.viewer).toEqual({ access: "public" })

const serialized = JSON.stringify(response)
expect(serialized).not.toContain("strategyMemory")
expect(serialized).not.toContain("soldierMemory")
expect(serialized).not.toContain("objectivePayload")
expect(serialized).not.toContain("awarenessGrid")
expect(serialized).not.toContain("strategySource")
expect(serialized).not.toContain("rawRuntimeDetails")
expect(serialized).not.toContain("ownerDebug")
expect(serialized).not.toContain("soldierInactivity")
expect(serialized).not.toContain("PRIVATE_OWNER_DEBUG_EXPLANATION")
```

**Current failing-gap test to replace/adjust** (lines 360-384):
```typescript
const response = await server.getMatchReplay("match:replay-test", {
  allowOwnerDebug: true,
  requestedOwnerPlayerId: "player:top",
})

expect(response.status).toBe("ready")
if (response.status !== "ready") {
  return
}
expect(response.mode).toBe("public")
expect(response.projection.viewer).toEqual({ access: "public" })
expect(response).not.toHaveProperty("ownerDebug")
expect(JSON.stringify(response)).not.toContain(
  "PRIVATE_TOP_OWNER_DEBUG_EXPLANATION",
)
```

**Trusted server owner pattern** (lines 395-419):
```typescript
const response = await server.getMatchReplay("match:replay-test", {
  mode: "owner",
  ownerPlayerId: "player:bottom",
  allowOwnerDebug: true,
})

expect(response.status).toBe("ready")
if (response.status !== "ready") {
  return
}
expect(response.projection.viewer).toEqual({
  access: "owner",
  playerId: "player:bottom",
})
expect(response.ownerPlayerId).toBe("player:bottom")
expect(JSON.stringify(response.projection.ownerPrivate)).not.toContain(
  "PRIVATE_TOP_OWNER_DEBUG_EXPLANATION",
)
expect(
  response.ownerDebug?.soldierInactivityExplanations.length,
).toBeGreaterThan(0)
```

**Gotchas:**
- Add tests for authorized requested owner -> owner mode and non-participant requested owner -> public mode.
- Preserve the existing direct trusted server call test if the code still supports `mode: "owner"` for internal callers.

### `apps/web/app/matches/replay-fixture.test.ts` (projection test)

**Analog:** `apps/web/app/matches/replay-fixture.test.ts`

**Trusted owner-list behavior test** (lines 212-256):
```typescript
const requestedOwner = expectReady(
  createReplayFixtureData({
    scenarioId: "push",
    mode: "owner",
    ownerPlayerId: "bottom",
  }),
)
const owner = expectReady(
  createReplayFixtureData({
    scenarioId: "push",
    mode: "owner",
    ownerPlayerId: "bottom",
    allowOwnerDebug: true,
  }),
)
const untrustedRequestedOwner = expectReady(
  createReplayFixtureData({
    scenarioId: "push",
    allowOwnerDebug: true,
    requestedOwnerPlayerId: "top",
  }),
)

expect(requestedOwner.mode).toBe("public")
expect(untrustedRequestedOwner.mode).toBe("public")
expect(owner.mode).toBe("owner")
expect(owner.ownerPlayerId).toBe("bottom")
expect(owner.projection).toHaveProperty("ownerPrivate")
```

**Gotchas:**
- This is the cleanest analog for the persisted change: pass an authorized list into `trustedOwnerReplayOptions`, then assert unlisted requested owners stay public.

### `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` (DTO/component tests)

**Analog:** `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx`

**Owner DTO privacy and helper source assertions** (lines 43-76, 78-97):
```typescript
const data = createReplayFixtureData({ scenarioId: "runtime-failure" })
expect(data.status).toBe("ready")
if (data.status !== "ready") {
  return
}
expect(data.mode).toBe("public")
expect(data).not.toHaveProperty("ownerDebug")

const owner = createReplayFixtureData({
  scenarioId: "runtime-failure",
  mode: "owner",
  ownerPlayerId: "bottom",
  allowOwnerDebug: true,
})
expect(
  owner.ownerDebug?.soldierInactivityExplanations.length,
).toBeGreaterThan(0)

expect(owner.ownerDebug?.soldierInactivityExplanations).toEqual(
  buildSoldierInactivityExplanations({
    chronicle: scenario.chronicle,
    ownerPlayerId: "bottom",
  }),
)
```

**Gotchas:**
- These tests intentionally verify DTO source, not browser behavior. Do not duplicate Playwright assertions here.

### `apps/web/app/matches/[matchId]/replay/replay-state.test.ts` (view-model tests)

**Analog:** `apps/web/app/matches/[matchId]/replay/replay-state.test.ts`

**Owner-ready test DTO pattern** (lines 18-63, 160-185):
```typescript
const createReplayData = (owner = false): ReplayReadyDto => ({
  status: "ready",
  mode: owner ? "owner" : "public",
  metadata: {
    matchId: "match:fixture",
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
  },
  projection: {
    viewer: owner
      ? { access: "owner", playerId: "player:bottom" }
      : { access: "public" },
    ...(owner
      ? {
          ownerPrivate: {
            playerId: "player:bottom",
            data: { awarenessGrid: "debug" },
          },
        }
      : {}),
  },
  ...(owner
    ? {
        ownerPlayerId: "player:bottom",
        ownerDebug: {
          soldierInactivityExplanations: [
            {
              soldierId: "soldier:bottom:1",
              playerId: "player:bottom",
              sequence: 1,
              cause: "not_selected",
              label: "Soldier was not selected",
              remediation: "Select this Soldier for a future Activation.",
            },
          ],
        },
      }
    : {}),
})
```

**Access gate assertion pattern** (lines 230-240, 277-285):
```typescript
expect(getEventInspector(data.timeline[0]!).privacyLabel).toBe(
  "Public event",
)
expect(getEventInspector(data.timeline[2]!).privacyLabel).toBe(
  "Owner-only debug available",
)
expect(canShowOwnerDebug(data)).toBe(false)
expect(canShowOwnerDebug(createReplayData(true))).toBe(true)

expect(
  getSoldierInactivityExplanation(
    createReplayData(),
    "soldier:bottom:1",
    2,
  ),
).toBeNull()
```

**Gotchas:**
- `canShowOwnerDebug` requires owner projection data, not just `ownerDebug`.
- View models find the nearest explanation at or before the selected sequence.

### Verification Artifacts (batch/documentation)

**Analogs:** `11-VALIDATION.md`, `12-VALIDATION.md`, `.planning/v1.1-INTEGRATION-CHECK.md`

**Requirement evidence table pattern** (`11-VALIDATION.md` lines 7-16):
```markdown
## Requirement Evidence

| Requirement | Plan(s) | Evidence files | Command-backed result |
| --- | --- | --- | --- |
| DEBUG-04: owner can inspect why a Soldier did nothing across required causes | 11-04, 11-05, 11-06 | `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/replay/src/debug-explanations.ts`, `packages/replay/src/debug-explanations.test.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.test.ts`, `apps/web/app/matches/[matchId]/replay/replay-client.tsx`, `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx`, `apps/web/e2e/replay.fixture.spec.ts` | `pnpm --filter @cowards/replay test -- project.test.ts debug-explanations.test.ts` - passed, 11 files / 130 tests. |
```

**Phase gates table pattern** (`12-VALIDATION.md` lines 18-31):
```markdown
## Phase Gates

| Command | Result |
| --- | --- |
| `pnpm preflight:docker -- --skip-web` | Passed. Last run used Docker Compose Postgres/Redis with healthchecks and produced a completed preflight MatchSet. |
| `pnpm e2e:service` | Passed after isolating the service-backed test to desktop/one worker. |
| `pnpm --filter @cowards/web test -- run-worker-once/route.test.ts` | Passed, included worker diagnostic payload coverage. |
```

**Gap closure source pattern** (`.planning/v1.1-INTEGRATION-CHECK.md`):
- Use the blocker text for Phase 13 verification scope: persisted owner replay debug must become reachable for stored Chronicles.
- Include public privacy and owner availability together, matching the audit requirement that DEBUG-04 and DEBUG-05 close without regressing DEBUG-06.
- Formal `*-VERIFICATION.md` files should cite existing validation evidence and commands; do not invent new command results.

**Gotchas:**
- There are no existing `*-VERIFICATION.md` files for phases 8-12; use `*-VALIDATION.md` and `*-SUMMARY.md` as evidence analogs.
- For phases 8-12, verification files should be retrospective evidence summaries. Phase 13's verification should include commands actually run in Phase 13.

## Shared Patterns

### Owner Authorization Boundary

**Source:** `apps/web/app/matches/replay-ready.ts` lines 90-122 and `apps/web/app/matches/server.ts` lines 61-74

**Apply to:** `server.ts`, `replay-ready.ts`, `server.test.ts`, service E2E

```typescript
const requestedOwner = options.requestedOwnerPlayerId
if (
  requestedOwner &&
  authorizedRequestedOwners.includes(requestedOwner) &&
  (requestedOwner === metadata.bottomPlayerId ||
    requestedOwner === metadata.topPlayerId)
) {
  return {
    ...options,
    mode: "owner",
    ownerPlayerId: requestedOwner,
  }
}
```

### Public Privacy Assertions

**Source:** `apps/web/app/matches/server.test.ts` lines 318-329

**Apply to:** server tests, replay fixture tests, service E2E

```typescript
const serialized = JSON.stringify(response)
expect(serialized).not.toContain("strategyMemory")
expect(serialized).not.toContain("soldierMemory")
expect(serialized).not.toContain("objectivePayload")
expect(serialized).not.toContain("awarenessGrid")
expect(serialized).not.toContain("strategySource")
expect(serialized).not.toContain("rawRuntimeDetails")
expect(serialized).not.toContain("ownerDebug")
expect(serialized).not.toContain("soldierInactivity")
```

### Owner Debug UI Gate

**Source:** `apps/web/app/matches/[matchId]/replay/replay-state.ts` lines 300-343 and `replay-client.tsx` lines 263-305

**Apply to:** replay client tests, E2E assertions

```typescript
export const canShowOwnerDebug = (data: ReplayPageData): boolean =>
  data.status === "ready" &&
  data.projection.viewer.access === "owner" &&
  data.projection.ownerPrivate !== undefined

if (!canShowOwnerDebug(data) || !soldierId) {
  return null
}
```

```tsx
{ownerDebugAvailable ? (
  <section>
    <label className="replay-debug-toggle">
      <input
        data-testid="replay-owner-debug-toggle"
        type="checkbox"
        checked={ownerDebugVisible}
        onChange={(event) =>
          setOwnerDebugVisible(event.currentTarget.checked)
        }
      />
      Owner debug
    </label>
    {ownerDebugVisible ? (
      <div
        className="replay-explanation-panel"
        data-cause-code={
          soldierInactivityExplanation?.causeCode ?? "NONE"
        }
        data-testid="replay-soldier-inactivity-explanation"
      >
```

### Workshop Failure-Mode Samples

**Source:** `packages/persistence/src/workshop.ts` lines 432-550 and `packages/persistence/src/workshop.test.ts` lines 126-160

**Apply to:** service-backed E2E setup

```typescript
const runtimeTimeoutSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain() {
    while (true) {}
  }
}
`.trim()
```

```typescript
expect(failureModes.map((sample) => sample.id)).toEqual([
  "sample:failure-forbidden-clock",
  "sample:failure-runtime-timeout",
  "sample:failure-invalid-output",
  "sample:failure-thrown-exception",
  "sample:failure-do-nothing",
])
expect(
  failureModes.find(
    (sample) => sample.id === "sample:failure-runtime-timeout",
  )?.expectedRuntimeViolationType,
).toBe("TIMEOUT")
```

### Service-Backed Worker Execution

**Source:** `apps/web/app/api/test-support/run-worker-once/route.ts` lines 24-31, 75-89 and route test lines 40-53

**Apply to:** `workshop-to-replay.spec.ts`

```typescript
export const isWorkerTestSupportEnabled = (
  env: RouteEnv = process.env,
): boolean => env.PLAYWRIGHT_TEST === "1" || env.NODE_ENV === "test"

export const runWorkerOnceProcess = async (
  env: RouteEnv = process.env,
): Promise<WorkerProcessResult> => {
  const { command, args } = createPnpmCommand(env)
  return execFileAsync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      COWARDS_TEST_WORKER_ID:
        env.COWARDS_TEST_WORKER_ID ?? "worker:test-support",
    },
    maxBuffer: 1024 * 1024,
    timeout: 60_000,
  })
}
```

```typescript
expect(response.status).toBe(503)
await expect(response.json()).resolves.toMatchObject({
  status: "service_unavailable",
  layer: "worker_execution",
  error: "connect ECONNREFUSED 127.0.0.1:5432",
})
```

### Persisted Chronicle Metadata as Participant Source

**Source:** `packages/persistence/src/chronicle-store.ts` lines 13-25, 78-105, 182-189

**Apply to:** owner authorization in persisted replay server path

```typescript
export interface ChronicleMetadata {
  id: string
  matchId: MatchId
  schemaVersion: string
  hash: string
  outcome: JsonValue
  eventCount: number
  snapshotCount: number
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  arenaVariantId: ArenaVariantId
}
```

```typescript
async getByMatchId(matchId) {
  const result = await pool.query(
    "select * from chronicles where match_id = $1",
    [matchId],
  )
  const row = result.rows[0]
  return row ? rowToStored(row) : null
}
```

## No Analog Found

No expected Phase 13 file lacks an analog. The only missing exact precedent is the `*-VERIFICATION.md` artifact name itself; use existing `*-VALIDATION.md`, `*-SUMMARY.md`, and `.planning/v1.1-INTEGRATION-CHECK.md` as role-match analogs.

## Metadata

**Analog search scope:** `apps/web/app`, `apps/web/e2e`, `packages/persistence`, `packages/replay`, `.planning/phases`, `.planning/v1.1-INTEGRATION-CHECK.md`
**Files scanned:** 201
**Pattern extraction date:** 2026-05-18
