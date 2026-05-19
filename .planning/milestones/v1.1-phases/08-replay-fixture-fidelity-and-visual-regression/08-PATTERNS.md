# Phase 8: Replay Fixture Fidelity and Visual Regression - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 15
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/test-utils/src/engine-scenarios.ts` | utility | transform | `packages/test-utils/src/engine-scenarios.ts` | exact |
| `packages/test-utils/src/replay-scenarios.ts` (likely new, if builders outgrow `engine-scenarios.ts`) | utility | transform | `packages/test-utils/src/engine-scenarios.ts` | role-match |
| `packages/test-utils/src/index.ts` | config | transform | `packages/test-utils/src/index.ts` | exact |
| `apps/web/app/matches/replay-fixture.ts` | service | transform | `apps/web/app/matches/server.ts` + `packages/replay/src/project.ts` | role-match |
| `apps/web/app/matches/replay-fixture.test.ts` | test | transform | `apps/web/app/matches/replay-fixture.test.ts` + `packages/replay/src/validate.test.ts` | exact |
| `apps/web/e2e/replay.fixture.spec.ts` | test | request-response | `apps/web/e2e/replay.fixture.spec.ts` | exact |
| `apps/web/app/matches/server.ts` | service | request-response | `apps/web/app/matches/server.ts` | exact |
| `apps/web/app/matches/server.test.ts` | test | request-response | `apps/web/app/matches/server.test.ts` | exact |
| `apps/web/app/api/test-support/replay-fixture/route.ts` | route | request-response | `apps/web/app/api/test-support/run-worker-once/route.ts` | role-match |
| `packages/replay/src/build.ts` | service | event-driven | `packages/replay/src/build.ts` | exact |
| `packages/replay/src/project.ts` | service | transform | `packages/replay/src/project.ts` | exact |
| `packages/replay/src/validate.ts` | service | transform | `packages/replay/src/validate.ts` | exact |

## Pattern Assignments

### `packages/test-utils/src/engine-scenarios.ts` or `packages/test-utils/src/replay-scenarios.ts` (utility, transform)

**Analog:** `packages/test-utils/src/engine-scenarios.ts`

**Imports pattern** (lines 1-8):
```typescript
import {
  INITIAL_BOUNDS,
  type ArenaVariant,
  type BoardBounds,
  type PlayerId,
  type Position,
  type Soldier,
} from "@cowards/spec"
```

**Scenario helper pattern** (lines 10-20):
```typescript
export const createScenarioSoldier = (
  overrides: Partial<Soldier> & { id: string },
): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})
```

**Arena/state parts pattern** (lines 22-49):
```typescript
export const createScenarioStateParts = (
  overrides: {
    bounds?: BoardBounds
    bottomPlayerId?: PlayerId
    topPlayerId?: PlayerId
    soldiers?: Soldier[]
    terrainStones?: Position[]
    arenaVariant?: Partial<ArenaVariant>
  } = {},
) => {
  const bounds = overrides.bounds ?? INITIAL_BOUNDS
  const arenaVariant: ArenaVariant = {
    id: "scenario-arena",
    name: "Scenario Arena",
    initialBounds: bounds,
    terrainStones: overrides.terrainStones ?? [],
    ...overrides.arenaVariant,
  }

  return {
    bounds,
    bottomPlayerId: overrides.bottomPlayerId ?? "bottom-player",
    topPlayerId: overrides.topPlayerId ?? "top-player",
    soldiers: overrides.soldiers ?? [],
    terrainStones: overrides.terrainStones ?? [],
    arenaVariant,
  }
}
```

**Apply to Phase 8:** Put legal scenario definitions here or in a sibling test-utils file. Scenario builders should return engine/replay-ready inputs plus expected event types and visual checkpoints. Do not import `apps/web` here. If a new file is created, export it through `packages/test-utils/src/index.ts`.

**Export pattern** from `packages/test-utils/src/index.ts` (lines 1-3):
```typescript
export * from "./engine-scenarios.js"

export const testUtilsPackage = "@cowards/test-utils"
```

---

### `packages/replay/src/build.ts` (service, event-driven)

**Analog:** `packages/replay/src/build.ts`

**Imports pattern** (lines 1-28):
```typescript
import {
  advanceRound,
  checkAndApplyMatchEnd,
  createInitialGameState,
  getFullBoardSnapshot,
  getInitiativeForRound,
  getOpponentPlayer,
  getRoundPlayerOrder,
  resolveActivation,
  resolveActivationSelection,
  resolveContraction,
  type GameState,
  type RunMatchInput,
  type TransitionEventSummary,
  type TransitionResult,
} from "@cowards/engine"
import {
  ROUND_ACTIVATION_COUNTS,
  type Chronicle,
  type ChronicleBoundarySnapshot,
  type ChronicleEvent,
  type ChronicleEventContext,
  type ChroniclePrivateSections,
  type ChronicleReproducibilityEnvelope,
  type ChronicleValidationError,
  type JsonValue,
  type PlayerId,
} from "@cowards/spec"
```

**Private payload recording pattern** (lines 76-105):
```typescript
const createPrivateRecorder = () => {
  const byPlayerId: Record<PlayerId, Record<string, JsonValue>> = {}
  const sanitize = (payload: JsonValue): JsonValue =>
    JSON.parse(JSON.stringify(payload)) as JsonValue

  return {
    record(
      ownerPlayerId: PlayerId | undefined,
      ref: string,
      payload: JsonValue | undefined,
    ): void {
      if (!ownerPlayerId || payload === undefined) {
        return
      }
      byPlayerId[ownerPlayerId] = {
        ...(byPlayerId[ownerPlayerId] ?? {}),
        [ref]: sanitize(payload),
      }
    },
    sections(debug?: JsonValue): ChroniclePrivateSections | undefined {
      const hasPrivateSections = Object.keys(byPlayerId).length > 0
      if (!hasPrivateSections && debug === undefined) {
        return undefined
      }
      return {
        byPlayerId,
        ...(debug === undefined ? {} : { debug }),
      }
    },
  }
}
```

**Event append pattern** (lines 108-139):
```typescript
const createEventAppender =
  (
    events: ChronicleEvent[],
    recorder: ReturnType<typeof createPrivateRecorder>,
  ) =>
  (
    summaries: TransitionEventSummary[],
    fallbackContext: ChronicleEventContext = {},
  ): void => {
    for (const summary of summaries) {
      const sequence = events.length
      const context = { ...fallbackContext, ...(summary.context ?? {}) }
      const privateRef =
        summary.privatePayload === undefined
          ? undefined
          : `private:event:${sequence}`
      const ownerPlayerId =
        ownerFromPrivatePayload(summary.privatePayload) ??
        context.actingPlayerId
      if (privateRef) {
        recorder.record(ownerPlayerId, privateRef, summary.privatePayload)
      }
      events.push({
        type: summary.type,
        sequence,
        context,
        privacy: summary.privacy ?? "public",
        payload: summary.payload,
        ...(privateRef === undefined ? {} : { privateRef }),
      })
    }
  }
```

**Core build pattern** (lines 189-207, 208-328, 345-357):
```typescript
export const buildChronicleFromMatch = (
  input: RunMatchInput,
): BuildChronicleFromMatchResult => {
  let state = createInitialGameState(input)
  const events: ChronicleEvent[] = []
  const snapshots: ChronicleBoundarySnapshot[] = [
    snapshot("MATCH_START", state, 0),
  ]
  const recorder = createPrivateRecorder()
  const appendEvents = createEventAppender(events, recorder)

  appendEvents([
    {
      type: "MATCH_STARTED",
      sequence: 0,
      payload: { matchId: state.matchId, seed: state.seed },
    },
  ])
  // Runs rounds, activations, Contraction, terminal outcome, and snapshots.
  snapshots.push(snapshot("MATCH_END", state, currentSequence(events)))
  snapshots.push(snapshot("TERMINAL", state, currentSequence(events)))

  return {
    chronicle: createChronicle(
      input,
      state,
      events,
      snapshots,
      recorder.sections(),
    ),
    finalState: state,
  }
}
```

**Testing pattern** from `packages/replay/src/build.test.ts` (lines 87-111):
```typescript
describe("buildChronicleFromMatch", () => {
  it("constructs required events and terminal snapshots", () => {
    const observedInputs = new Map<string, SoldierBrainInput>()
    const { chronicle } = buildChronicleFromMatch(
      createMatchInput(createRecordingRuntime(observedInputs)),
    )
    const eventTypes = chronicle.events.map((event) => event.type)

    expect(eventTypes).toContain("MATCH_STARTED")
    expect(eventTypes).toContain("ROUND_STARTED")
    expect(eventTypes).toContain("STRATEGY_EVALUATED")
    expect(eventTypes).toContain("ACTIVATION_STARTED")
    expect(eventTypes).toContain("AWARENESS_GRID_OBSERVED")
    expect(eventTypes).toContain("ACTION_EMITTED")
    expect(eventTypes).toContain("SOLDIER_STONED")
    expect(eventTypes.filter((type) => type === "MATCH_ENDED")).toHaveLength(1)
  })
})
```

**Apply to Phase 8:** Engine-generated replay demos should call `buildChronicleFromMatch`; do not adapt `runMatch` final results into replay fixtures because `buildChronicleFromResult` intentionally returns `SNAPSHOT_MISSING` for partial Chronicle data.

---

### `packages/replay/src/project.ts` (service, transform)

**Analog:** `packages/replay/src/project.ts`

**Privacy key pattern** (lines 12-24):
```typescript
const PRIVATE_PAYLOAD_KEYS = new Set([
  "awarenessGrid",
  "exactAwarenessGrid",
  "objective",
  "objectivePayload",
  "rawRuntimeDetails",
  "runtimeDetails",
  "soldierMemory",
  "source",
  "strategyMemory",
  "strategySource",
  "violation",
])
```

**Public projection pattern** (lines 72-95):
```typescript
const projectEvent = (event: ChronicleEvent): ChroniclePublicEvent => ({
  type: event.type,
  sequence: event.sequence,
  context: cloneJson(event.context),
  payload:
    event.type === "RUNTIME_VIOLATION"
      ? projectRuntimeViolationPayload(event)
      : sanitizeJson(event.payload),
})

export const projectPublicChronicle = (
  chronicle: Chronicle,
): ChronicleProjection => {
  const canonical = canonicalChronicle(chronicle)
  return {
    schemaVersion: canonical.schemaVersion,
    viewer: { access: "public" },
    reproducibility: cloneJson(canonical.reproducibility),
    events: canonical.events.map(projectEvent),
    snapshots: cloneJson(canonical.snapshots),
  }
}
```

**Owner projection pattern** (lines 98-118):
```typescript
export const projectOwnerChronicle = (
  chronicle: Chronicle,
  playerId: PlayerId,
): ChronicleProjection => {
  const canonical = canonicalChronicle(chronicle)
  const publicProjection = projectPublicChronicle(canonical)
  const ownerData = canonical.private?.byPlayerId[playerId]

  return {
    ...publicProjection,
    viewer: { access: "owner", playerId },
    ...(ownerData === undefined
      ? {}
      : {
          ownerPrivate: {
            playerId,
            data: cloneJson(ownerData),
          },
        }),
  }
}
```

**Testing pattern** from `packages/replay/src/project.test.ts` (lines 161-200):
```typescript
it("projects a public Chronicle without private sections or private refs", () => {
  const projection = projectPublicChronicle(createChronicle())
  const serialized = JSON.stringify(projection)

  expect(projection.viewer).toEqual({ access: "public" })
  expect(serialized).not.toContain("private:event:1")
  expect(serialized).not.toContain("awarenessGrid")
  expect(serialized).not.toContain("objectivePayload")
  expect(serialized).not.toContain("strategyMemory")
  expect(serialized).not.toContain("soldierMemory")
  expect(serialized).not.toContain("strategySource")
  expect(serialized).not.toContain("rawRuntimeDetails")
})
```

**Apply to Phase 8:** Web fixture DTOs should be built from `projectPublicChronicle` / `projectOwnerChronicle` outputs, not by manually assembling public/private projection fields. Visual fixtures must preserve the privacy tests.

---

### `packages/replay/src/validate.ts` (service, transform)

**Analog:** `packages/replay/src/validate.ts`

**Error helper pattern** (lines 31-39):
```typescript
const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})
```

**Validation layering pattern** (lines 312-323, 326-369):
```typescript
const validateParsedChronicle = (
  chronicle: Chronicle,
): ChronicleValidationResult => {
  const errors = [
    ...validateVersion(chronicle),
    ...validateEventOrder(chronicle),
    ...validateRequiredEvents(chronicle),
    ...validateSnapshots(chronicle),
    ...validateHash(chronicle),
  ]

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

export const validateChronicle = (
  chronicle: unknown,
): ChronicleValidationResult => {
  const parsed = ChronicleSchema.safeParse(chronicle)
  if (!parsed.success) {
    return {
      ok: false,
      errors: [
        error(
          "SCHEMA_INVALID",
          "Chronicle does not match the canonical schema.",
          {
            actual: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })) as JsonValue,
          },
        ),
      ],
    }
  }

  const parsedChronicle = parsed.data as Chronicle
  return validateParsedChronicle(parsedChronicle)
}
```

**Negative test pattern** from `packages/replay/src/validate.test.ts` (lines 51-64, 169-215):
```typescript
const errorCodes = (value: unknown) => {
  const result = validateChronicle(value)
  return result.ok ? [] : result.errors.map((error) => error.code)
}

it("detects event order, required event, snapshot, and hash failures", () => {
  const chronicle = createChronicle()
  const withIntegrity = {
    ...chronicle,
    integrity: createChronicleContentHash(chronicle),
  }

  expect(
    errorCodes({
      ...chronicle,
      events: chronicle.events.map((event, index) =>
        index === 1 ? { ...event, sequence: 3 } : event,
      ),
    }),
  ).toContain("EVENT_ORDER_INVALID")
})
```

**Apply to Phase 8:** Fixture legality tests can call `validateChronicle` for the Chronicle layer and then add fixture-specific assertions for expected mechanics. Keep semantic replay grammar expansion in Phase 9 unless needed to reject Phase 8 fixture impossibilities.

---

### `apps/web/app/matches/replay-fixture.ts` (service, transform)

**Analog:** `apps/web/app/matches/replay-fixture.ts`, but replace hand-authored board/timeline data with engine-generated data where possible.

**Environment gate pattern** (lines 14-19):
```typescript
export const replayFixtureMatchId = "match:e2e-replay-fixture"

export const isReplayFixtureEnabled = (): boolean =>
  process.env.PLAYWRIGHT_TEST === "1" ||
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development"
```

**Encoded Match id safety pattern** (lines 21-32):
```typescript
const safeDecodeURIComponent = (value: string): string | null => {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export const isReplayFixtureMatch = (matchId: string): boolean =>
  isReplayFixtureEnabled() &&
  (matchId === replayFixtureMatchId ||
    safeDecodeURIComponent(matchId) === replayFixtureMatchId)
```

**Current DTO shape pattern** (lines 337-405):
```typescript
export const createReplayFixtureData = (
  options: GetMatchReplayOptions = {},
): ReplayReadyDto => {
  const mode: ReplayViewMode =
    options.allowOwnerDebug === true &&
    options.mode === "owner" &&
    options.ownerPlayerId
      ? "owner"
      : "public"

  return {
    status: "ready",
    mode,
    metadata: {
      matchId: replayFixtureMatchId,
      chronicleId: "chronicle:e2e-replay-fixture",
      hash: "fixture-hash",
      schemaVersion: "chronicle-v1",
      eventCount: timeline.length,
      snapshotCount: states.length,
      outcome: { type: "DRAW" },
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      arenaVariantId: "arena:e2e-replay-fixture",
    },
    projection: {
      schemaVersion: "chronicle-v1",
      viewer:
        mode === "owner" && options.ownerPlayerId
          ? { access: "owner", playerId: options.ownerPlayerId }
          : { access: "public" },
      reproducibility: {
        matchId: replayFixtureMatchId,
        seed: "seed:e2e-replay-fixture",
        arenaVariantId: "arena:e2e-replay-fixture",
        arenaVariantVersion: "arena-variant-v1",
        strategyRevisionIds: ["revision:bottom", "revision:top"],
        versions: {
          spec: "spec-v1",
          engine: "engine-v1",
          runtimeJs: "runtime-js-v1",
          chronicle: "chronicle-v1",
          strategyRevision: "strategy-revision-v1",
          arenaVariant: "arena-variant-v1",
        },
      },
      events: [],
      snapshots: [],
    },
    timeline,
    states,
    initialSequence: 0,
  }
}
```

**Better source pattern:** use `apps/web/app/matches/server.ts` `buildReadyReplay` logic (lines 123-169) as the target shape:
```typescript
const projection =
  mode === "owner"
    ? projectOwnerChronicle(stored.artifact, options.ownerPlayerId!)
    : projectPublicChronicle(stored.artifact)
const replayResult = createReplay(stored.artifact)

const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
  sequence: entry.sequence,
  board: entry.state.board,
  ...(entry.state.outcome === undefined
    ? {}
    : { outcome: entry.state.outcome }),
}))

return {
  status: "ready",
  mode,
  metadata: {
    matchId: stored.metadata.matchId,
    chronicleId: stored.metadata.id,
    hash: stored.metadata.hash,
    schemaVersion: stored.metadata.schemaVersion,
    eventCount: stored.metadata.eventCount,
    snapshotCount: stored.metadata.snapshotCount,
    outcome: stored.metadata.outcome,
    bottomPlayerId: stored.metadata.bottomPlayerId,
    topPlayerId: stored.metadata.topPlayerId,
    arenaVariantId: stored.metadata.arenaVariantId,
  },
  projection,
  timeline: buildTimeline(projection.events, stored.artifact.events),
  states,
  initialSequence: 0,
} satisfies ReplayReadyDto
```

**Apply to Phase 8:** Preserve the environment and encoded-id gates, but feed fixture data through the same Chronicle projection and replay iteration path as persisted Matches. Any remaining hand-authored data must be explicit legacy/test-only data and guarded by tests.

---

### `apps/web/app/matches/server.ts` (service, request-response)

**Analog:** `apps/web/app/matches/server.ts`

**Dependency injection and pool pattern** (lines 31-53):
```typescript
type WithPool = <T>(fn: (pool: Queryable) => Promise<T>) => Promise<T>

export interface MatchReplayServerDeps {
  withPool?: WithPool | undefined
  createChronicleStore?:
    | ((pool: Queryable) => Pick<ChronicleStore, "getByMatchId">)
    | undefined
}

const withDatabasePool: WithPool = async (fn) => {
  const pool = createDatabasePool()
  try {
    return await fn(pool)
  } finally {
    await pool.end()
  }
}
```

**Timeline label pattern** (lines 63-82, 94-111):
```typescript
const eventLabels = {
  MATCH_STARTED: "Match start",
  ROUND_STARTED: "Round",
  STRATEGY_EVALUATED: "Strategy evaluated",
  ACTIVATION_STARTED: "Activation",
  AWARENESS_GRID_OBSERVED: "Awareness",
  ACTION_EMITTED: "Action",
  MOVE_ADVANCED: "Move",
  MOVE_BLOCKED: "Blocked",
  TURN_RESOLVED: "Turn",
  PUSH_ATTEMPTED: "Push",
  PUSH_RESOLVED: "Push",
  PUSH_BLOCKED: "Blocked",
  BACKSTAB_RESOLVED: "Backstab",
  SOLDIER_STONED: "Stone",
  SOLDIER_FELL: "Fall",
  CONTRACTION_RESOLVED: "Contraction",
  MATCH_ENDED: "Outcome",
  RUNTIME_VIOLATION: "Runtime violation",
} satisfies Record<ChronicleEventType, string>

const buildTimeline = (
  projectedEvents: ChroniclePublicEvent[],
  originalEvents: ChronicleEvent[],
): ReplayTimelineEntryDto[] =>
  projectedEvents.map((event) => {
    const original = originalEvents[event.sequence]
    return {
      sequence: event.sequence,
      type: event.type,
      round: event.context.roundNumber,
      activation: event.context.activationIndex,
      cycle: event.context.cycleIndex,
      label: eventLabel(event),
      privacy: original?.privacy === "owner" ? "owner" : "public",
      context: event.context,
      payload: event.payload,
    }
  })
```

**Fixture branch pattern** (lines 177-199):
```typescript
async getMatchReplay(
  matchId: MatchId,
  options: GetMatchReplayOptions = {},
): Promise<ReplayPageData> {
  const resolvedMatchId = decodeMatchId(matchId)
  if (isReplayFixtureMatch(resolvedMatchId)) {
    return createReplayFixtureData(options)
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

  return buildReadyReplay(stored, options)
}
```

**Apply to Phase 8:** Keep fixture routing here if it remains a special Match id, but make `createReplayFixtureData` internally use Chronicle artifacts so persisted and fixture paths share projection/replay semantics. If fixture failures need layer classification, return or throw messages that name `engine legality`, `Chronicle validation`, `projection`, or `UI rendering`.

---

### `apps/web/app/matches/replay-fixture.test.ts` (test, transform)

**Analog:** `apps/web/app/matches/replay-fixture.test.ts`

**Local helper pattern** (lines 10-34, 84-103):
```typescript
const samePosition = (left: Position | null, right: Position | null): boolean =>
  left === right ||
  (left !== null && right !== null && left.x === right.x && left.y === right.y)

const movePosition = (position: Position, direction: Direction): Position => {
  switch (direction) {
    case "UP":
      return { x: position.x, y: position.y - 1 }
    case "DOWN":
      return { x: position.x, y: position.y + 1 }
    case "LEFT":
      return { x: position.x - 1, y: position.y }
    case "RIGHT":
      return { x: position.x + 1, y: position.y }
  }
}

const boardAt = (sequence: number): FullBoardSnapshot => {
  const data = createReplayFixtureData()
  const state = data.states.find((candidate) => candidate.sequence === sequence)
  expect(state).toBeDefined()
  return state!.board
}
```

**Legality assertion pattern** (lines 151-180):
```typescript
it("uses a legal push with an empty destination square", () => {
  const data = createReplayFixtureData()
  const entry = data.timeline.find(
    (candidate) => candidate.type === "PUSH_RESOLVED",
  )
  expect(entry).toBeDefined()
  const payload = payloadRecord(entry!.payload)
  const before = boardAt(entry!.sequence - 1)
  const after = boardAt(entry!.sequence)
  const mover = soldier(before, payload.soldierId as string)
  const target = soldier(before, payload.targetSoldierId as string)

  expect(mover.status).toBe("ACTIVE")
  expect(target.status).toBe("ACTIVE")
  expect(mover.position).not.toBeNull()
  expect(target.position).not.toBeNull()
  const direction = directionBetween(mover.position!, target.position!)
  expect(direction).toBe("RIGHT")
  expect(target.facing).not.toBe(direction)
  expect(target.facing).not.toBe(oppositeDirection(direction!))

  const pushedDestination = movePosition(target.position!, direction!)
  expect(activeSoldierAt(before, pushedDestination)).toBeUndefined()
  expect(soldier(after, target.id).position).toEqual(pushedDestination)
})
```

**Backstab guard pattern** (lines 226-254):
```typescript
it("only allows backstab callouts for directly-behind attackers", () => {
  const data = createReplayFixtureData()
  const illegalBackstabs = data.timeline
    .filter((candidate) => candidate.type === "BACKSTAB_RESOLVED")
    .flatMap((entry) => {
      const previousBoard = boardAt(entry.sequence - 1)
      const pairs = payloadRecord(entry.payload).pairs
      if (!Array.isArray(pairs)) {
        return [`sequence:${entry.sequence}:missing-pairs`]
      }
      return pairs.flatMap((pair) => {
        const record = payloadRecord(pair)
        const attacker = soldier(previousBoard, record.attackerId as string)
        const victim = soldier(previousBoard, record.victimId as string)
        const directlyBehind = samePosition(
          attacker.position,
          behindSquare(victim),
        )
        return attacker.ownerPlayerId !== victim.ownerPlayerId &&
          attacker.status === "ACTIVE" &&
          victim.status === "ACTIVE" &&
          directlyBehind
          ? []
          : [`sequence:${entry.sequence}:illegal-pair`]
      })
    })

  expect(illegalBackstabs).toEqual([])
})
```

**Apply to Phase 8:** Expand this style into mechanic-specific tests with test names or assertion messages that identify the failure layer. Prefer checking generated Chronicle validity, expected event sequence, and visual checkpoints over duplicating engine rules in web tests. Rule-heavy legality helpers belong in `packages/test-utils` or `packages/replay` tests.

---

### `apps/web/app/api/test-support/replay-fixture/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/test-support/replay-fixture/route.ts`; stronger injectable route pattern from `apps/web/app/api/test-support/run-worker-once/route.ts`.

**Current route pattern** (lines 1-15):
```typescript
import {
  isReplayFixtureEnabled,
  replayFixtureMatchId,
} from "../../../matches/replay-fixture.js"

export async function GET(): Promise<Response> {
  if (!isReplayFixtureEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({
    matchId: replayFixtureMatchId,
    replayHref: `/matches/${encodeURIComponent(replayFixtureMatchId)}/replay`,
  })
}
```

**Injectable test-support pattern** from `run-worker-once/route.ts` (lines 23-26, 112-142):
```typescript
export const isWorkerTestSupportEnabled = (
  env: RouteEnv = process.env,
): boolean => env.PLAYWRIGHT_TEST === "1" || env.NODE_ENV === "test"

export const createRunWorkerOnceHandler =
  (deps: RunWorkerOnceRouteDeps = {}) =>
  async (): Promise<Response> => {
    const env = deps.env ?? process.env
    if (!isWorkerTestSupportEnabled(env)) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    try {
      const result = await (deps.runWorkerProcess ?? runWorkerOnceProcess)(env)
      const payload = parseWorkerPayload(result.stdout) ?? {
        status: "ok",
        executed: [],
      }
      return Response.json({
        ...payload,
        stderr: result.stderr.trim() || undefined,
      })
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Worker test-support execution failed.",
          status: "service_unavailable",
        },
        { status: 503 },
      )
    }
  }
```

**Route test pattern** from `run-worker-once/route.test.ts` (lines 7-20, 40-53):
```typescript
it("is unavailable outside explicit test support environments", async () => {
  expect(isWorkerTestSupportEnabled({})).toBe(false)

  const response = await createRunWorkerOnceHandler({
    env: {},
    runWorkerProcess: async () => {
      throw new Error("should not run")
    },
  })()

  expect(response.status).toBe(404)
  await expect(response.json()).resolves.toEqual({ error: "Not found" })
})

it("fails loudly when the service-backed worker process cannot run", async () => {
  const response = await createRunWorkerOnceHandler({
    env: { PLAYWRIGHT_TEST: "1" },
    runWorkerProcess: async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5432")
    },
  })()

  expect(response.status).toBe(503)
  await expect(response.json()).resolves.toMatchObject({
    status: "service_unavailable",
    error: "connect ECONNREFUSED 127.0.0.1:5432",
  })
})
```

**Apply to Phase 8:** Keep the fixture endpoint hidden outside test/development. If the route grows to support mechanic-specific fixture selection, prefer a small injectable handler and a route test rather than embedding untestable request logic.

---

### `apps/web/e2e/replay.fixture.spec.ts` (test, request-response)

**Analog:** `apps/web/e2e/replay.fixture.spec.ts`

**Fixture fetch and replay navigation pattern** (lines 20-34):
```typescript
test("replay fixture renders board, timeline, inspector, callouts, and public privacy", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const fixture = (await (
    await page.request.get("/api/test-support/replay-fixture")
  ).json()) as { matchId: string; replayHref: string }

  await page.goto(fixture.replayHref)

  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByText("Public view")).toBeVisible()
  await expect(page.getByText("Match start").first()).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
  await expectNonblankCanvasPixels(page.locator("canvas"))
})
```

**Canvas nonblank pattern** (lines 12-18):
```typescript
const expectNonblankCanvasPixels = async (canvas: Locator) => {
  await expect(canvas).toBeVisible()
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
}
```

**Stable timeline/control interaction pattern** (lines 45-66):
```typescript
await page
  .getByRole("slider", { name: "Replay timeline" })
  .evaluate((node) => {
    const input = node as HTMLInputElement
    input.value = "3"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new Event("change", { bubbles: true }))
  })
await page
  .getByRole("button", { name: /Turn/ })
  .evaluate((node) => (node as HTMLButtonElement).click())
await expect(page.getByText(/Sequence 4/).first()).toBeVisible()
await expect(page.getByText("Selected event")).toBeVisible()
```

**Privacy assertion pattern** (lines 67-84):
```typescript
for (const label of [
  "Move",
  "Turn",
  "Push",
  "Fall",
  "Stone",
  "Blocked",
  "Contraction",
  "Runtime violation",
  "Outcome",
]) {
  await expect(page.getByText(label).first()).toBeVisible()
}

const body = await page.locator("body").innerText()
for (const marker of privateMarkers) {
  expect(body).not.toContain(marker)
}
```

**Owner debug gate pattern** (lines 87-107):
```typescript
await page.goto(fixture.replayHref)
await expect(page.getByText("Public view")).toBeVisible()
await expect(page.getByText("Owner debug")).toHaveCount(0)
await expect(page.getByText("Awareness Grid")).toHaveCount(0)

await page.goto(
  `${fixture.replayHref}?ownerDebug=1&ownerPlayerId=player%3Abottom`,
)
await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
await page.getByRole("button", { name: "Awareness" }).click()
const awarenessGrid = page.getByLabel("Awareness Grid")
await expect(awarenessGrid).toBeVisible()
await expect(awarenessGrid.getByText("FRIENDLY_ACTIVE")).toBeVisible()
```

**Apply to Phase 8:** Add focused visual assertions around stable selectors and fixed viewport sizes. Prefer mechanic-specific screenshots for board area, event callout, and contraction bounds rather than full-page snapshots. Keep `expectNonblankCanvasPixels` as the baseline render guard before screenshots.

---

### `apps/web/app/matches/server.test.ts` (test, request-response)

**Analog:** `apps/web/app/matches/server.test.ts`

**Dependency-injected server test pattern** (lines 186-200):
```typescript
it("returns unavailable when no Chronicle is stored", async () => {
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
})
```

**Public privacy test pattern** (lines 223-254):
```typescript
it("returns public replay data by default without private markers", async () => {
  const stored = createStoredChronicle()
  const server = createMatchReplayServer({
    withPool: async (fn) => fn({} as never),
    createChronicleStore: () => ({
      getByMatchId: async () => stored,
    }),
  })

  const response = await server.getMatchReplay("match:replay-test")

  expect(response.status).toBe("ready")
  if (response.status !== "ready") {
    return
  }
  expect(response.projection.viewer).toEqual({ access: "public" })
  expect(response.initialSequence).toBe(0)

  const serialized = JSON.stringify(response)
  expect(serialized).not.toContain("strategyMemory")
  expect(serialized).not.toContain("soldierMemory")
  expect(serialized).not.toContain("objectivePayload")
  expect(serialized).not.toContain("awarenessGrid")
  expect(serialized).not.toContain("strategySource")
  expect(serialized).not.toContain("rawRuntimeDetails")
})
```

**Owner debug gate test pattern** (lines 256-305):
```typescript
it("returns explicit owner replay data only when trusted server code allows it", async () => {
  const stored = createStoredChronicle()
  const server = createMatchReplayServer({
    withPool: async (fn) => fn({} as never),
    createChronicleStore: () => ({
      getByMatchId: async () => stored,
    }),
  })

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
  expect(JSON.stringify(response)).toContain("PRIVATE_AWARENESS_GRID")
})
```

**Apply to Phase 8:** Add server tests if fixture projection moves into shared ready-replay helpers or returns mechanic-specific metadata. Preserve public-by-default behavior and explicit `allowOwnerDebug` gating.

## Shared Patterns

### Package Boundaries

**Source:** `AGENTS.md`, `.planning/research/ARCHITECTURE.md`, package manifests.

**Apply to:** all Phase 8 work.

- `packages/test-utils` may define deterministic scenario builders and expected checkpoints. Current dependency is only `@cowards/spec` (`packages/test-utils/package.json` lines 17-19); adding `@cowards/engine` or `@cowards/replay` here is a deliberate boundary decision, not incidental churn.
- `packages/replay` may call `@cowards/engine` and `@cowards/spec` (`packages/replay/package.json` lines 17-20) and already owns Chronicle build, validate, reconstruct, project, and hash exports (`packages/replay/src/index.ts` lines 1-7).
- `apps/web` may consume `@cowards/replay`, persistence, runtime-js, and spec (`apps/web/package.json` lines 13-18), but must not contain game rules or execute Strategy source.
- React/Pixi replay UI should consume DTOs; mechanic legality belongs in engine/replay/test-utils tests.

### Replay Projection Parity

**Source:** `apps/web/app/matches/server.ts` lines 123-169.

**Apply to:** `apps/web/app/matches/replay-fixture.ts`, server tests, E2E fixture route.

Use `projectPublicChronicle` / `projectOwnerChronicle`, `createReplay`, and timeline construction from projected events. Avoid manual `projection.events: []` / `snapshots: []` placeholders for new canonical fixtures.

### Public Privacy

**Source:** `packages/replay/src/project.ts` lines 12-24, `packages/replay/src/project.test.ts` lines 161-200, `apps/web/e2e/replay.fixture.spec.ts` lines 81-84.

**Apply to:** generated fixture projection, server tests, E2E tests.

Public fixture responses and screenshots must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, raw runtime details, private refs, or owner-only sections. Owner mode requires explicit server-side allowance.

### Test-Support Route Gating

**Source:** `apps/web/app/api/test-support/replay-fixture/route.ts` lines 6-15 and `apps/web/app/api/test-support/run-worker-once/route.ts` lines 23-26.

**Apply to:** replay fixture endpoint and any mechanic selector endpoint.

Return `404` outside test/development gates. Keep endpoints deterministic and side-effect-light unless explicitly service-backed.

### Failure Layer Diagnostics

**Source:** Phase context decisions D-08/D-09 (`08-CONTEXT.md` lines 29-31), route failure pattern in `run-worker-once/route.ts` lines 130-140, validation error code pattern in `packages/replay/src/validate.ts` lines 31-39.

**Apply to:** fixture legality tests, visual tests, route responses.

Name the failing layer in test names, helper errors, or response payloads:

- `engine legality`
- `Chronicle validation`
- `projection/DTO shaping`
- `UI rendering`

### Focused Visual Checks

**Source:** `apps/web/e2e/replay.fixture.spec.ts` lines 12-18 and 45-66; Phase context D-05/D-07 (`08-CONTEXT.md` lines 24-28).

**Apply to:** Playwright visual regression specs.

Use deterministic fixture data, stable roles/labels/selectors, fixed desktop/mobile viewports, a nonblank canvas guard, then focused screenshots/assertions for board scale, Soldier positions, contraction bounds, and event callouts. Avoid broad full-page snapshots.

## Likely File Ownership

| File / Area | Owner Boundary | Notes |
|-------------|----------------|-------|
| `packages/test-utils/src/engine-scenarios.ts` | shared test utilities | Best place for deterministic scenario parts and mechanic builders if they only need spec types. |
| `packages/test-utils/src/replay-scenarios.ts` | shared test utilities | Use if Phase 8 needs a clearer corpus API; update `packages/test-utils/src/index.ts`. |
| `packages/replay/src/build.ts` | replay package | Owns legal Chronicle construction from engine-run Matches. Do not duplicate builder logic in web. |
| `packages/replay/src/validate.ts` | replay package | Owns Chronicle compatibility/shape validation; deep semantic grammar mostly belongs to Phase 9. |
| `packages/replay/src/project.ts` | replay package | Owns public/owner projection and privacy filtering. |
| `apps/web/app/matches/replay-fixture.ts` | web replay facade | Owns test fixture DTO assembly and environment-gated fixture id, not game legality. |
| `apps/web/app/matches/server.ts` | web replay facade | Owns persisted Chronicle lookup and ready replay DTO shaping. |
| `apps/web/app/api/test-support/replay-fixture/route.ts` | web test support | Owns Playwright-discoverable fixture hrefs, gated outside tests/dev. |
| `apps/web/e2e/replay.fixture.spec.ts` | web E2E | Owns public/owner replay smoke and focused visual checks. |

## No Analog Found

None. All likely Phase 8 work has close existing analogs. The only missing mature pattern is snapshot thresholding for Playwright visual regression; use Playwright-native screenshot assertions and keep them focused because no existing `toHaveScreenshot` usage was found in `apps` or `packages`.

## Metadata

**Analog search scope:** `apps/web/app/matches`, `apps/web/app/api/test-support`, `apps/web/e2e`, `packages/test-utils/src`, `packages/replay/src`, adjacent replay/server/route tests.

**Files scanned:** 27

**Pattern extraction date:** 2026-05-18
