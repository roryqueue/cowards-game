import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationErrorCode,
  JsonValue,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import {
  ChronicleValidationErrorCodeSchema,
  COMPATIBILITY_VERSIONS,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createChronicleContentHash } from "./hash.js"
import { migrateChronicle, validateChronicle } from "./validate.js"

const asJson = (value: unknown): JsonValue => value as JsonValue

const runtime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {},
      },
    }
  },
}

const createChronicle = () =>
  buildChronicleFromMatch({
    matchId: "validation-match",
    seed: "validation-seed",
    arenaVariant: {
      id: "arena",
      name: "Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-rev",
    topStrategyRevisionId: "top-rev",
    runtime,
  }).chronicle

const errorCodes = (value: unknown) => {
  const result = validateChronicle(value)
  return result.ok ? [] : result.errors.map((error) => error.code)
}

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

const mutateFirstEvent = (
  chronicle: Chronicle,
  predicate: (event: ChronicleEvent) => boolean,
  mutate: (event: ChronicleEvent) => ChronicleEvent,
): Chronicle => {
  let mutated = false
  return {
    ...chronicle,
    events: chronicle.events.map((event) => {
      if (mutated || !predicate(event)) {
        return event
      }
      mutated = true
      return mutate(event)
    }),
  }
}

const mutateFirstSnapshot = (
  chronicle: Chronicle,
  predicate: (snapshot: ChronicleBoundarySnapshot) => boolean,
  mutate: (snapshot: ChronicleBoundarySnapshot) => ChronicleBoundarySnapshot,
): Chronicle => {
  let mutated = false
  return {
    ...chronicle,
    snapshots: chronicle.snapshots.map((snapshot) => {
      if (mutated || !predicate(snapshot)) {
        return snapshot
      }
      mutated = true
      return mutate(snapshot)
    }),
  }
}

const grammarErrorCodes = [
  "EVENT_WINDOW_INVALID",
  "CONTEXT_MISSING",
  "CONTEXT_MISMATCH",
  "PAYLOAD_INCONSISTENT",
  "SNAPSHOT_BOUNDARY_INVALID",
] as const satisfies readonly ChronicleValidationErrorCode[]

describe("validateChronicle", () => {
  it("accepts a valid Chronicle with matching integrity", () => {
    const chronicle = createChronicle()
    const withIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }

    expect(validateChronicle(withIntegrity)).toEqual({ ok: true })
  })

  it("accepts grammar-specific validation codes in the schema contract", () => {
    for (const code of grammarErrorCodes) {
      expect(ChronicleValidationErrorCodeSchema.parse(code)).toBe(code)
    }
  })

  it("returns typed schema and version errors", () => {
    expect(errorCodes({ schemaVersion: "chronicle-v1" })).toContain(
      "VERSION_INCOMPATIBLE",
    )
    expect(migrateChronicle({ schemaVersion: "chronicle-v1" })).toMatchObject({
      code: "UNSUPPORTED_MIGRATION",
    })
    expect(
      errorCodes({ ...createChronicle(), schemaVersion: "chronicle-v0" }),
    ).toContain("VERSION_INCOMPATIBLE")
    expect(
      migrateChronicle({
        schemaVersion: "chronicle-v0",
        events: [],
      }),
    ).toMatchObject({ code: "UNSUPPORTED_MIGRATION" })
  })

  it("keeps malformed shape diagnostics under SCHEMA_INVALID issue details", () => {
    const result = validateChronicle({ schemaVersion: "chronicle-v1.4" })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatchObject({
      code: "SCHEMA_INVALID",
      message: "Chronicle does not match the canonical schema.",
    })
    expect(result.errors[0]?.actual).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "reproducibility",
          message: expect.any(String),
        }),
      ]),
    )
  })

  it("returns semantic validation errors during current-version migration", () => {
    const chronicle = createChronicle()

    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          events: chronicle.events.map((event, index) =>
            index === 1 ? { ...event, sequence: 3 } : event,
          ),
        }),
      ),
    ).toMatchObject({ code: "EVENT_ORDER_INVALID" })
    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          snapshots: chronicle.snapshots.filter(
            (snapshot) => snapshot.kind !== "TERMINAL",
          ),
        }),
      ),
    ).toMatchObject({ code: "SNAPSHOT_MISSING" })
    expect(
      migrateChronicle(
        asJson({
          ...chronicle,
          integrity: { algorithm: "sha256", normalizedContentHash: "stale" },
        }),
      ),
    ).toMatchObject({ code: "HASH_MISMATCH" })
  })

  it("uses stable validation codes for current-version semantic failures", () => {
    const chronicle = createChronicle()
    const result = validateChronicle({
      ...chronicle,
      events: chronicle.events.map((event, index) =>
        index === 1 ? { ...event, sequence: 3 } : event,
      ),
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatchObject({
      code: "EVENT_ORDER_INVALID",
      message: expect.any(String),
    })
    expect(result.errors[0]?.code).not.toContain("Expected")
  })

  it("rejects corrupted replay-driving event payloads during validation", () => {
    const chronicle = createChronicle()
    const corruptedPayloadCases = [
      {
        type: "MOVE_ADVANCED",
        payload: { soldierId: "bottom-soldier-1" },
      },
      {
        type: "PUSH_RESOLVED",
        payload: { soldierId: "bottom-soldier-1", pushedOffBoard: false },
      },
      {
        type: "SOLDIER_FELL",
        payload: { reason: "MOVED_OFF_BOARD" },
      },
      {
        type: "MATCH_ENDED",
        payload: { type: "WIN" },
      },
    ]

    for (const corrupted of corruptedPayloadCases) {
      expect(
        errorCodes({
          ...chronicle,
          events: [
            {
              ...chronicle.events[0],
              ...corrupted,
            },
            ...chronicle.events.slice(1),
          ],
        }),
      ).toContain("SCHEMA_INVALID")
    }
  })

  it.each(
    Object.keys(COMPATIBILITY_VERSIONS) as Array<
      keyof typeof COMPATIBILITY_VERSIONS
    >,
  )("detects incompatible %s versions", (versionKey) => {
    const chronicle = createChronicle()
    const actual = `${COMPATIBILITY_VERSIONS[versionKey]}-unsupported`

    const result = validateChronicle({
      ...chronicle,
      reproducibility: {
        ...chronicle.reproducibility,
        versions: { ...COMPATIBILITY_VERSIONS, [versionKey]: actual },
      },
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "VERSION_INCOMPATIBLE",
        message: `Unsupported ${versionKey} version.`,
        expected: COMPATIBILITY_VERSIONS[versionKey],
        actual,
      }),
    )
  })

  it("keeps current compatibility versions accepted", () => {
    const chronicle = createChronicle()

    expect(
      validateChronicle({
        ...chronicle,
        reproducibility: {
          ...chronicle.reproducibility,
          versions: COMPATIBILITY_VERSIONS,
        },
      }),
    ).toEqual({ ok: true })
  })

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
        events: chronicle.events.filter(
          (event) => event.type !== "ACTION_EMITTED",
        ),
      }),
    ).toContain("REQUIRED_EVENT_MISSING")

    expect(
      errorCodes({
        ...chronicle,
        snapshots: chronicle.snapshots.filter(
          (snapshot) => snapshot.kind !== "TERMINAL",
        ),
      }),
    ).toContain("SNAPSHOT_MISSING")

    expect(
      errorCodes({
        ...withIntegrity,
        events: [
          {
            ...withIntegrity.events[0],
            payload: { matchId: "tampered", seed: "validation-seed" },
          },
          ...withIntegrity.events.slice(1),
        ],
      }),
    ).toContain("HASH_MISMATCH")
  })

  it("requires every Round boundary snapshot instance", () => {
    const chronicle = createChronicle()
    const firstRoundEnd = chronicle.snapshots.findIndex(
      (snapshot) => snapshot.kind === "ROUND_END",
    )

    expect(firstRoundEnd).toBeGreaterThanOrEqual(0)
    expect(
      errorCodes({
        ...chronicle,
        snapshots: chronicle.snapshots.filter(
          (snapshot, index) =>
            snapshot.kind !== "ROUND_END" || index === firstRoundEnd,
        ),
      }),
    ).toContain("SNAPSHOT_MISSING")
  })

  it.each([
    {
      name: "corrupted event order",
      mutate(chronicle: Chronicle): Chronicle {
        return {
          ...chronicle,
          events: chronicle.events.map((event, index) =>
            index === 1 ? { ...event, sequence: 3 } : event,
          ),
        }
      },
      code: "EVENT_ORDER_INVALID",
    },
    {
      name: "event grammar failure",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstEvent(
          cloneChronicle(chronicle),
          (event) => event.type === "ACTION_EMITTED",
          (event) => ({
            ...event,
            context: { ...event.context, cycleIndex: 1 },
          }),
        )
      },
      code: "CONTEXT_MISMATCH",
    },
    {
      name: "snapshot boundary failure",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstSnapshot(
          cloneChronicle(chronicle),
          (snapshot) => snapshot.kind === "ROUND_START",
          (snapshot) => ({ ...snapshot, sequence: 0 }),
        )
      },
      code: "SNAPSHOT_BOUNDARY_INVALID",
    },
    {
      name: "impossible snapshot transition",
      mutate(chronicle: Chronicle): Chronicle {
        return mutateFirstSnapshot(
          cloneChronicle(chronicle),
          (snapshot) => snapshot.kind === "TERMINAL",
          (snapshot) => ({
            ...snapshot,
            board: {
              ...snapshot.board,
              soldiers: snapshot.board.soldiers.map((soldier, index) =>
                index === 0 ? { ...soldier, status: "ACTIVE" } : soldier,
              ),
            },
          }),
        )
      },
      code: "SNAPSHOT_MISMATCH",
    },
    {
      name: "version-incompatible Chronicle",
      mutate(chronicle: Chronicle): Chronicle {
        return {
          ...chronicle,
          reproducibility: {
            ...chronicle.reproducibility,
            versions: {
              ...chronicle.reproducibility.versions,
              engine: `${chronicle.reproducibility.versions.engine}-future`,
            },
          },
        }
      },
      code: "VERSION_INCOMPATIBLE",
    },
  ] as const)(
    "rejects $name through the integrated gate",
    ({ mutate, code }) => {
      expect(errorCodes(mutate(createChronicle()))).toContain(code)
    },
  )
})
