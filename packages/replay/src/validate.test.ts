import type { SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { COMPATIBILITY_VERSIONS } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createChronicleContentHash } from "./hash.js"
import { migrateChronicle, validateChronicle } from "./validate.js"

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

describe("validateChronicle", () => {
  it("accepts a valid Chronicle with matching integrity", () => {
    const chronicle = createChronicle()
    const withIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }

    expect(validateChronicle(withIntegrity)).toEqual({ ok: true })
  })

  it("returns typed schema and version errors", () => {
    expect(errorCodes({ schemaVersion: "chronicle-v1" })).toContain(
      "SCHEMA_INVALID",
    )
    expect(migrateChronicle({ schemaVersion: "chronicle-v1" })).toMatchObject({
      code: "SCHEMA_INVALID",
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

  it("detects incompatible component versions", () => {
    const chronicle = createChronicle()

    expect(
      errorCodes({
        ...chronicle,
        reproducibility: {
          ...chronicle.reproducibility,
          versions: { ...COMPATIBILITY_VERSIONS, engine: "999.0.0" },
        },
      }),
    ).toContain("VERSION_INCOMPATIBLE")
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
})
