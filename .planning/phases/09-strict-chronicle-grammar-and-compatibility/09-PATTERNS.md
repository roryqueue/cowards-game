# Phase 9: Strict Chronicle Grammar and Compatibility - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 15
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/spec/src/schemas.ts` | model/schema | transform | `packages/spec/src/schemas.ts` | exact |
| `packages/spec/src/types.ts` | model/types | transform | `packages/spec/src/types.ts` | exact |
| `packages/replay/src/validate.ts` | utility/service | transform | `packages/replay/src/validate.ts` | exact |
| `packages/replay/src/reconstruct.ts` | utility/service | transform | `packages/replay/src/reconstruct.ts` | exact |
| `packages/replay/src/project.ts` | utility/service | transform | `packages/replay/src/project.ts` | exact |
| `packages/replay/src/validate.test.ts` | test | transform | `packages/replay/src/validate.test.ts` | exact |
| `packages/replay/src/reconstruct.test.ts` | test | transform | `packages/replay/src/reconstruct.test.ts` | exact |
| `packages/replay/src/project.test.ts` | test | transform/privacy | `packages/replay/src/project.test.ts` | exact |
| `packages/replay/src/integration.test.ts` | test | transform/privacy | `packages/replay/src/integration.test.ts` | role-match |
| `packages/test-utils/src/replay-scenarios.ts` | fixture utility | batch/transform | `packages/test-utils/src/replay-scenarios.ts` | exact |
| `packages/test-utils/src/replay-scenarios.legality.test.ts` | test | transform | `packages/test-utils/src/replay-scenarios.legality.test.ts` | exact |
| `apps/web/app/matches/replay-ready.ts` | service | transform | `apps/web/app/matches/replay-ready.ts` | exact |
| `apps/web/app/matches/server.ts` | service/facade | request-response | `apps/web/app/matches/server.ts` | exact |
| `apps/web/app/matches/types.ts` | model/types | request-response | `apps/web/app/matches/types.ts` | exact |
| `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` | component | request-response | `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` | exact |

## Pattern Assignments

### `packages/spec/src/schemas.ts` (model/schema, transform)

**Analog:** `packages/spec/src/schemas.ts`

**Imports pattern** (lines 1-8):
```typescript
import { z } from "zod"
import {
  OBJECTIVE_PAYLOAD_BYTES,
  SOLDIER_MEMORY_BYTES,
  STRATEGY_MEMORY_BYTES,
  STRATEGY_SOURCE_BYTES,
} from "./constants.js"
import type { JsonValue } from "./types.js"
```

**Chronicle event schema pattern** (lines 290-354):
```typescript
export const ChronicleEventTypeSchema = z.enum([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MOVE_ADVANCED",
  "MOVE_BLOCKED",
  "TURN_RESOLVED",
  "PUSH_ATTEMPTED",
  "PUSH_RESOLVED",
  "PUSH_BLOCKED",
  "BACKSTAB_RESOLVED",
  "SOLDIER_STONED",
  "SOLDIER_FELL",
  "CONTRACTION_RESOLVED",
  "MATCH_ENDED",
  "RUNTIME_VIOLATION",
])

export const ChronicleSchemaVersionSchema = z.literal("chronicle-v1")
```

**Validation-code extension pattern** (lines 512-530):
```typescript
export const ChronicleValidationErrorCodeSchema = z.enum([
  "SCHEMA_INVALID",
  "VERSION_INCOMPATIBLE",
  "EVENT_ORDER_INVALID",
  "REQUIRED_EVENT_MISSING",
  "SNAPSHOT_MISSING",
  "SNAPSHOT_MISMATCH",
  "HASH_MISMATCH",
  "PRIVATE_ACCESS_DENIED",
  "UNSUPPORTED_MIGRATION",
])

export const ChronicleValidationErrorSchema = z.object({
  code: ChronicleValidationErrorCodeSchema,
  sequence: z.number().int().nonnegative().optional(),
  message: z.string().min(1),
  expected: JsonValueSchema.optional(),
  actual: JsonValueSchema.optional(),
})
```

**Guidance:** Add grammar-specific codes here first, then mirror them in `types.ts`. Keep Zod responsible for canonical shape only; semantic grammar should stay in `packages/replay/src/validate.ts`.

---

### `packages/spec/src/types.ts` (model/types, transform)

**Analog:** `packages/spec/src/types.ts`

**Chronicle type contract pattern** (lines 215-266):
```typescript
export type ChronicleEventType =
  | "MATCH_STARTED"
  | "ROUND_STARTED"
  | "STRATEGY_EVALUATED"
  | "ACTIVATION_STARTED"
  | "AWARENESS_GRID_OBSERVED"
  | "ACTION_EMITTED"
  | "MOVE_ADVANCED"
  | "MOVE_BLOCKED"
  | "TURN_RESOLVED"
  | "PUSH_ATTEMPTED"
  | "PUSH_RESOLVED"
  | "PUSH_BLOCKED"
  | "BACKSTAB_RESOLVED"
  | "SOLDIER_STONED"
  | "SOLDIER_FELL"
  | "CONTRACTION_RESOLVED"
  | "MATCH_ENDED"
  | "RUNTIME_VIOLATION"

export interface ChronicleEvent {
  type: ChronicleEventType
  sequence: number
  context: ChronicleEventContext
  privacy: ChroniclePrivacy
  payload: JsonValue
  privateRef?: string | undefined
}
```

**Error type parity pattern** (lines 319-336):
```typescript
export type ChronicleValidationErrorCode =
  | "SCHEMA_INVALID"
  | "VERSION_INCOMPATIBLE"
  | "EVENT_ORDER_INVALID"
  | "REQUIRED_EVENT_MISSING"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_MISMATCH"
  | "HASH_MISMATCH"
  | "PRIVATE_ACCESS_DENIED"
  | "UNSUPPORTED_MIGRATION"

export interface ChronicleValidationError {
  code: ChronicleValidationErrorCode
  sequence?: number | undefined
  message: string
  expected?: JsonValue | undefined
  actual?: JsonValue | undefined
}
```

**Guidance:** Any new stable validation code must be added to both schema and type unions in the same plan.

---

### `packages/replay/src/validate.ts` (utility/service, transform)

**Analog:** `packages/replay/src/validate.ts`

**Imports and local error factory pattern** (lines 1-39):
```typescript
import {
  ChronicleSchema,
  COMPATIBILITY_VERSIONS,
  type Chronicle,
  type ChronicleEventType,
  type ChronicleSnapshotKind,
  type ChronicleValidationError,
  type ChronicleValidationResult,
  type JsonValue,
} from "@cowards/spec"
import { createChronicleContentHash } from "./hash.js"

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

**Version compatibility pattern** (lines 90-115):
```typescript
const validateVersion = (chronicle: Chronicle): ChronicleValidationError[] => {
  const errors: ChronicleValidationError[] = []
  if (chronicle.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(
      error("VERSION_INCOMPATIBLE", "Unsupported Chronicle schema version.", {
        expected: SUPPORTED_SCHEMA_VERSION,
        actual: chronicle.schemaVersion,
      }),
    )
  }

  const versions = chronicle.reproducibility.versions
  const unsupported = Object.entries(COMPATIBILITY_VERSIONS).find(
    ([key, expected]) =>
      versions[key as keyof typeof COMPATIBILITY_VERSIONS] !== expected,
  )
  if (unsupported) {
    const [key, expected] = unsupported
    errors.push(
      error("VERSION_INCOMPATIBLE", `Unsupported ${key} version.`, {
        expected,
        actual: versions[key as keyof typeof COMPATIBILITY_VERSIONS],
      }),
    )
  }
  return errors
}
```

**Semantic validation pipeline pattern** (lines 312-369):
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

**Guidance:** Insert strict grammar as one or more named validators in `validateParsedChronicle` after event order and before snapshots/hash. Prefer a small explicit state-machine helper over scattered checks. Return stable codes and clear messages; do not throw.

---

### `packages/replay/src/reconstruct.ts` (utility/service, transform)

**Analog:** `packages/replay/src/reconstruct.ts`

**Typed result and replay dependency pattern** (lines 1-24):
```typescript
import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationError,
  Direction,
  FullBoardSnapshot,
  JsonValue,
  MatchOutcome,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"
import { MatchOutcomeSchema } from "@cowards/spec"
import { stableStringify } from "./hash.js"
import { validateChronicle } from "./validate.js"

export type ReplayStateResult =
  | { ok: true; state: ReplayState }
  | { ok: false; errors: ChronicleValidationError[] }
```

**Event-application error pattern** (lines 168-206):
```typescript
const applyEvent = (
  state: ReplayState,
  event: ChronicleEvent,
): ReplayStateResult => {
  switch (event.type) {
    case "MOVE_ADVANCED": {
      const soldierId = readString(event.payload, "soldierId")
      const direction = readDirection(event.payload, "direction")
      const soldier =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      if (
        !soldierId ||
        !direction ||
        soldier?.position === null ||
        soldier === undefined
      ) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "MOVE_ADVANCED payload cannot be applied.",
              {
                sequence: event.sequence,
              },
            ),
          ],
        }
      }
```

**Snapshot comparison pattern** (lines 441-459):
```typescript
const compareSnapshot = (
  state: ReplayState,
  snapshot: ChronicleBoundarySnapshot,
): ChronicleValidationError[] => {
  const expected = cloneState(snapshot)
  return stableStringify(state) === stableStringify(expected)
    ? []
    : [
        error(
          "SNAPSHOT_MISMATCH",
          "Reconstructed state did not match boundary snapshot.",
          {
            sequence: snapshot.sequence,
            expected: expected as unknown as JsonValue,
            actual: state as unknown as JsonValue,
          },
        ),
      ]
}
```

**Guidance:** Use this as the analog for "impossible board transitions where evidence exists." Either reuse reconstruction to prove snapshot mismatch or copy the typed `ReplayStateResult`/`SNAPSHOT_MISMATCH` structure into validator helpers. Do not re-run Strategy source.

---

### `packages/replay/src/project.ts` (utility/service, transform/privacy)

**Analog:** `packages/replay/src/project.ts`

**Privacy deny-list and recursive sanitizer pattern** (lines 12-50):
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

const sanitizeJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) {
    return value.map(sanitizeJson)
  }
  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_PAYLOAD_KEYS.has(key))
      .map(([key, nested]) => [key, sanitizeJson(nested)]),
  )
}
```

**Public vs owner projection pattern** (lines 85-118):
```typescript
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

**Guidance:** Add privacy constraints and tests at projection level. Public projection must omit source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, private runtime details, `privateRef`, and integrity commitments unless intentionally exposed.

---

### `packages/replay/src/validate.test.ts` (test, transform)

**Analog:** `packages/replay/src/validate.test.ts`

**Test fixture and helper pattern** (lines 1-54):
```typescript
import type { JsonValue, SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { COMPATIBILITY_VERSIONS } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createChronicleContentHash } from "./hash.js"
import { migrateChronicle, validateChronicle } from "./validate.js"

const asJson = (value: unknown): JsonValue => value as JsonValue

const errorCodes = (value: unknown) => {
  const result = validateChronicle(value)
  return result.ok ? [] : result.errors.map((error) => error.code)
}
```

**Negative validation pattern** (lines 169-215):
```typescript
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

  expect(
    errorCodes({
      ...chronicle,
      snapshots: chronicle.snapshots.filter(
        (snapshot) => snapshot.kind !== "TERMINAL",
      ),
    }),
  ).toContain("SNAPSHOT_MISSING")
})
```

**Guidance:** Add grammar tests here for invalid windows, duplicate terminal events, context/payload mismatch, unsupported versions, and snapshot boundary rules. Keep tests asserting stable error codes.

---

### `packages/replay/src/project.test.ts` (test, transform/privacy)

**Analog:** `packages/replay/src/project.test.ts`

**Hostile private marker fixture pattern** (lines 9-31):
```typescript
const PRIVATE_STRATEGY_MEMORY_MARKER = "PRIVATE_STRATEGY_MEMORY_MARKER"
const PRIVATE_SOLDIER_MEMORY_MARKER = "PRIVATE_SOLDIER_MEMORY_MARKER"
const PRIVATE_OBJECTIVE_PAYLOAD_MARKER = "PRIVATE_OBJECTIVE_PAYLOAD_MARKER"
const PRIVATE_AWARENESS_GRID_MARKER = "PRIVATE_AWARENESS_GRID_MARKER"
const PRIVATE_RUNTIME_DETAIL_MARKER = "PRIVATE_RUNTIME_DETAIL_MARKER"

const privatePayloadsFor = (playerId: "bottom" | "top") => ({
  "private:strategy": {
    strategyMemory: playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, playerId),
  },
  "private:event:1": {
    awarenessGrid: playerMarker(PRIVATE_AWARENESS_GRID_MARKER, playerId),
    objectivePayload: playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, playerId),
  },
  "private:event:2": {
    soldierMemory: playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, playerId),
    rawRuntimeDetails: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, playerId),
    strategySource: `export default ${playerId}`,
  },
})
```

**Public projection hard gate pattern** (lines 161-200):
```typescript
it("projects a public Chronicle without private sections or private refs", () => {
  const projection = projectPublicChronicle(createChronicle())
  const serialized = JSON.stringify(projection)

  expect(projection.viewer).toEqual({ access: "public" })
  expect(serialized).not.toContain("private:event:1")
  expect(serialized).not.toContain("private:event:2")
  expect(serialized).not.toContain("awarenessGrid")
  expect(serialized).not.toContain("objectivePayload")
  expect(serialized).not.toContain("strategyMemory")
  expect(serialized).not.toContain("soldierMemory")
  expect(serialized).not.toContain("strategySource")
  expect(serialized).not.toContain("rawRuntimeDetails")
  expect(serialized).not.toContain(PRIVATE_STRATEGY_MEMORY_MARKER)
  expect(serialized).not.toContain(PRIVATE_SOLDIER_MEMORY_MARKER)
  expect(serialized).not.toContain(PRIVATE_OBJECTIVE_PAYLOAD_MARKER)
  expect(serialized).not.toContain(PRIVATE_AWARENESS_GRID_MARKER)
  expect(serialized).not.toContain(PRIVATE_RUNTIME_DETAIL_MARKER)

  expect(
    projection.events.find((event) => event.type === "RUNTIME_VIOLATION")
      ?.payload,
  ).toEqual({
    type: "TIMEOUT",
    category: "strategy",
    ownerPlayerId: "bottom",
    soldierId: "bottom-1",
  })
})
```

**Guidance:** Expand these tests with negative fixtures that intentionally leak private fields in nested payloads, private sections, storage metadata, runtime violation details, and unexpected debug fields.

---

### `packages/test-utils/src/replay-scenarios.ts` (fixture utility, batch/transform)

**Analog:** `packages/test-utils/src/replay-scenarios.ts`

**Scenario manifest pattern** (lines 15-41):
```typescript
export const canonicalReplayScenarioIds = [
  "push",
  "fall",
  "contraction",
  "legal-backstab",
  "runtime-failure",
  "endgame",
  "compound-tour",
] as const

export type CanonicalReplayScenarioId =
  (typeof canonicalReplayScenarioIds)[number]

export interface CanonicalReplayScenario {
  id: CanonicalReplayScenarioId
  title: string
  chronicle: Chronicle
  expectedEventTypes: ChronicleEventType[]
  visualCheckpoints: CanonicalReplayVisualCheckpoint[]
}
```

**Engine-generated builder pattern** (lines 198-221):
```typescript
const buildScenario = (
  id: CanonicalReplayScenarioId,
  title: string,
  input: RunMatchInput,
  expectedEventTypes: ChronicleEventType[],
  checkpoints: Array<{
    name: string
    eventType: ChronicleEventType
    assertions: string[]
  }>,
): CanonicalReplayScenario => {
  const { chronicle } = buildChronicleFromMatch(input)

  return {
    id,
    title,
    chronicle,
    expectedEventTypes,
    visualCheckpoints: checkpoints.map((checkpoint) => ({
      ...checkpoint,
      sequence: sequenceOf(chronicle, checkpoint.eventType),
    })),
  }
}
```

**Guidance:** Put negative grammar fixtures near this package if they should be reusable outside `packages/replay`. Keep any legal canonical scenario engine-generated; corrupted/impossible scenarios should clone and mutate legal scenarios in tests or a clearly named negative fixture module.

---

### `packages/test-utils/src/replay-scenarios.legality.test.ts` (test, transform)

**Analog:** `packages/test-utils/src/replay-scenarios.legality.test.ts`

**Layer-classified diagnostic helpers** (lines 31-44):
```typescript
const firstError = (errors: readonly ChronicleValidationError[]): string => {
  const error = errors[0]
  return error ? `${error.code}: ${error.message}` : "unknown error"
}

const chronicleError = (
  scenarioId: string,
  errors: readonly ChronicleValidationError[],
): Error =>
  new Error(`[Chronicle validation] ${scenarioId}: ${firstError(errors)}`)
```

**Reconstruction gate pattern** (lines 189-227):
```typescript
const validateScenario = (scenario: CanonicalReplayScenario): void => {
  const validation = validateChronicle(scenario.chronicle)
  if (!validation.ok) {
    throw chronicleError(scenario.id, validation.errors)
  }
}

const reconstructScenario = (
  scenario: CanonicalReplayScenario,
): ReconstructedEntry[] => {
  validateScenario(scenario)

  const replayResult = createReplay(scenario.chronicle)
  if (!replayResult.ok) {
    throw chronicleError(scenario.id, replayResult.errors)
  }
```

**Impossible beat pattern** (lines 476-515):
```typescript
describe("[Chronicle validation] impossible canonical replay beats", () => {
  it("[Chronicle validation] rejects a push event whose Soldiers are not adjacent", () => {
    const scenario = getCanonicalReplayScenario("push")
    const chronicle = cloneChronicle(scenario.chronicle)
    const pushEvent = chronicle.events.find(
      (event) => event.type === "PUSH_RESOLVED",
    )
    if (!pushEvent || !isRecord(pushEvent.payload)) {
      throw new Error(
        `[Chronicle validation] ${scenario.id}: missing push event`,
      )
    }

    pushEvent.payload = {
      ...pushEvent.payload,
      targetSoldierId: "top-soldier-1",
    }

    expectChronicleLayerFailure(`${scenario.id}:impossible-push`, chronicle)
  })
})
```

**Guidance:** Copy this style for corrupted/impossible negative grammar fixtures. Include `[Chronicle validation]`, `[engine legality]`, `[projection]`, or `[ui rendering]` in test names/errors to preserve Phase 8 diagnostics.

---

### `apps/web/app/matches/replay-ready.ts` (service, transform)

**Analog:** `apps/web/app/matches/replay-ready.ts`

**Projection failure DTO pattern** (lines 72-80):
```typescript
const projectionFailure = (
  matchId: ReplayMetadataDto["matchId"],
  message: string,
): ReplayPageData => ({
  status: "unavailable",
  matchId,
  reason: "invalid-chronicle",
  message: `[projection] ${message}`,
})
```

**Replay validation before projection pattern** (lines 88-139):
```typescript
export const buildReadyReplayFromChronicle = ({
  chronicle,
  metadata,
  options = {},
}: BuildReadyReplayFromChronicleInput): ReplayPageData => {
  const replayResult = createReplay(chronicle)

  if (!replayResult.ok) {
    return projectionFailure(
      metadata.matchId,
      replayResult.errors[0]?.message ?? "Chronicle could not be replayed.",
    )
  }

  try {
    const projection =
      mode === "owner"
        ? projectOwnerChronicle(chronicle, options.ownerPlayerId!)
        : projectPublicChronicle(chronicle)
    const states = [...replayResult.replay.iterateReplay()].map((entry) => ({
      sequence: entry.sequence,
      board: entry.state.board,
      ...(entry.state.outcome === undefined
        ? {}
        : { outcome: entry.state.outcome }),
    }))
```

**Guidance:** If Phase 9 adds failure categories, preserve this fail-closed shape and enrich `ReplayUnavailableDto` rather than letting invalid Chronicles reach React. User-facing messages should come from stable validation errors, not raw Zod issues.

---

### `apps/web/app/matches/server.ts` (service/facade, request-response)

**Analog:** `apps/web/app/matches/server.ts`

**Dependency-injected server facade pattern** (lines 20-34):
```typescript
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

**Missing vs invalid replay pattern** (lines 61-75):
```typescript
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

**Guidance:** Keep persistence and fixture loading as facades only. Do not add grammar logic here; consume `buildReadyReplayFromStoredChronicle` unavailable DTOs.

---

### `apps/web/app/matches/types.ts` and replay unavailable component (model/component, request-response)

**Analogs:** `apps/web/app/matches/types.ts`, `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx`

**DTO pattern** (`types.ts` lines 20-72):
```typescript
export type ReplayUnavailableReason = "missing-chronicle" | "invalid-chronicle"
export type ReplayStatus = "ready" | "unavailable"

export interface ReplayUnavailableDto {
  status: "unavailable"
  matchId: MatchId
  reason: ReplayUnavailableReason
  message: string
}

export type ReplayPageData = ReplayReadyDto | ReplayUnavailableDto
```

**Unavailable render pattern** (`replay-unavailable.tsx` lines 3-20):
```tsx
export function ReplayUnavailable({ data }: { data: ReplayUnavailableDto }) {
  return (
    <main className="replay-page replay-page--unavailable">
      <header className="replay-header">
        <div>
          <p className="replay-product-label">Coward&apos;s Game</p>
          <h1>Replay unavailable</h1>
        </div>
        <span className="replay-status-chip">Replay unavailable</span>
      </header>

      <section className="replay-empty-state" aria-live="polite">
        <p className="replay-muted">Match {data.matchId}</p>
        <p>{data.message}</p>
      </section>
    </main>
  )
}
```

**Guidance:** If adding unsupported-version or privacy-leak reasons, extend the DTO union and keep the component data-driven. Do not parse Chronicle details in React.

## Shared Patterns

### Validation Layering
**Source:** `packages/replay/src/validate.ts`
**Apply to:** `validate.ts`, replay loading, tests
```typescript
const errors = [
  ...validateVersion(chronicle),
  ...validateEventOrder(chronicle),
  ...validateRequiredEvents(chronicle),
  ...validateSnapshots(chronicle),
  ...validateHash(chronicle),
]

return errors.length === 0 ? { ok: true } : { ok: false, errors }
```

Keep this parse -> version -> semantic grammar -> snapshot -> integrity order. Add grammar validators as pure functions returning `ChronicleValidationError[]`.

### Privacy
**Source:** `packages/replay/src/project.ts`
**Apply to:** public projection, fixture projection, web replay data
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

Projection is the public privacy boundary. Tests should search serialized public DTOs for both field names and marker values.

### Snapshot And Impossible Transition Checks
**Source:** `packages/replay/src/reconstruct.ts`
**Apply to:** `validate.ts`, `reconstruct.ts`, negative fixtures
```typescript
return stableStringify(state) === stableStringify(expected)
  ? []
  : [
      error(
        "SNAPSHOT_MISMATCH",
        "Reconstructed state did not match boundary snapshot.",
        {
          sequence: snapshot.sequence,
          expected: expected as unknown as JsonValue,
          actual: state as unknown as JsonValue,
        },
      ),
    ]
```

Use Chronicle data and snapshots only. Do not execute Strategy source or build a second rules engine.

### Engine-Generated Fixtures
**Source:** `packages/test-utils/src/replay-scenarios.ts`
**Apply to:** legal canonical scenarios and derived negative fixtures
```typescript
const { chronicle } = buildChronicleFromMatch(input)
```

Legal fixtures should originate from engine execution. Negative fixtures should be named as corrupted/impossible and should clone legal Chronicles before mutation.

### Failure Diagnostics
**Source:** `packages/test-utils/src/replay-scenarios.legality.test.ts`
**Apply to:** replay grammar tests, fixture tests, web tests
```typescript
new Error(`[Chronicle validation] ${scenarioId}: ${firstError(errors)}`)
```

Preserve layer prefixes: `[Chronicle validation]`, `[engine legality]`, `[projection]`, `[ui rendering]`.

## No Analog Found

None. The requested Phase 9 surfaces have direct analogs in current replay/spec/web code.

## Metadata

**Analog search scope:** `packages/spec/src`, `packages/replay/src`, `packages/test-utils/src`, `apps/web/app/matches`, `apps/web/e2e`
**Files scanned:** 39 targeted files
**Phase context:** `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md`
**Phase research:** no phase-local `RESEARCH.md` found; used `.planning/research/SUMMARY.md`, `STACK.md`, `ARCHITECTURE.md`, and `PITFALLS.md`
**Pattern extraction date:** 2026-05-18
