import { COMPATIBILITY_VERSIONS, type Chronicle } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  projectChronicle,
  projectOwnerChronicle,
  projectPublicChronicle,
} from "./project.js"

const PRIVATE_STRATEGY_MEMORY_MARKER = "PRIVATE_STRATEGY_MEMORY_MARKER"
const PRIVATE_SOLDIER_MEMORY_MARKER = "PRIVATE_SOLDIER_MEMORY_MARKER"
const PRIVATE_OBJECTIVE_PAYLOAD_MARKER = "PRIVATE_OBJECTIVE_PAYLOAD_MARKER"
const PRIVATE_AWARENESS_GRID_MARKER = "PRIVATE_AWARENESS_GRID_MARKER"
const PRIVATE_RUNTIME_DETAIL_MARKER = "PRIVATE_RUNTIME_DETAIL_MARKER"

const playerMarker = (marker: string, playerId: string): string =>
  `${marker}:${playerId}`

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

const createChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "projection-match",
    seed: "projection-seed",
    arenaVariantId: "projection-arena",
    arenaVariantVersion: COMPATIBILITY_VERSIONS.arenaVariant,
    strategyRevisionIds: ["bottom-rev", "top-rev"],
    versions: COMPATIBILITY_VERSIONS,
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "projection-match" },
    },
    {
      type: "AWARENESS_GRID_OBSERVED",
      sequence: 1,
      context: {
        phaseNumber: 1,
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "bottom",
        soldierId: "bottom-1",
        cycleIndex: 0,
      },
      privacy: "owner",
      payload: {
        soldierId: "bottom-1",
        cycleIndex: 0,
        awarenessGrid: {
          marker: playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "bottom"),
        },
        objectivePayload: playerMarker(
          PRIVATE_OBJECTIVE_PAYLOAD_MARKER,
          "bottom",
        ),
      },
      privateRef: "private:event:1",
    },
    {
      type: "RUNTIME_VIOLATION",
      sequence: 2,
      context: {
        phaseNumber: 1,
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "bottom",
        soldierId: "bottom-1",
      },
      privacy: "owner",
      payload: {
        type: "TIMEOUT",
        category: "strategy",
        ownerPlayerId: "bottom",
        soldierId: "bottom-1",
        violation: {
          message: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "bottom"),
        },
        rawRuntimeDetails: playerMarker(
          PRIVATE_RUNTIME_DETAIL_MARKER,
          "bottom",
        ),
      },
      privateRef: "private:event:2",
    },
    {
      type: "MATCH_ENDED",
      sequence: 3,
      context: {},
      privacy: "public",
      payload: { type: "WIN", winnerPlayerId: "bottom" },
    },
  ],
  snapshots: [
    {
      kind: "MATCH_START",
      sequence: 0,
      context: {},
      board: {
        bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        soldiers: [
          {
            id: "bottom-1",
            ownerPlayerId: "bottom",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "RIGHT",
            lastSuccessfulMoveDirection: null,
          },
        ],
        terrainStones: [],
      },
    },
    {
      kind: "TERMINAL",
      sequence: 3,
      context: {},
      board: {
        bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        soldiers: [
          {
            id: "bottom-1",
            ownerPlayerId: "bottom",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "RIGHT",
            lastSuccessfulMoveDirection: null,
          },
        ],
        terrainStones: [],
      },
      outcome: { type: "WIN", winnerPlayerId: "bottom" },
    },
  ],
  private: {
    byPlayerId: {
      bottom: privatePayloadsFor("bottom"),
      top: privatePayloadsFor("top"),
    },
  },
})

describe("Chronicle projections", () => {
  it("projects a public Chronicle without private sections or private refs", () => {
    const projection = projectPublicChronicle(createChronicle())
    const serialized = JSON.stringify(projection)

    expect(projection.viewer).toEqual({ access: "public" })
    expect(projection.events.map((event) => event.type)).toContain(
      "AWARENESS_GRID_OBSERVED",
    )
    expect(projection.events.map((event) => event.type)).toContain(
      "RUNTIME_VIOLATION",
    )
    expect(projection.snapshots.at(-1)?.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })
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

  it("dispatches owner projection through projectChronicle", () => {
    const projection = projectChronicle(createChronicle(), {
      access: "owner",
      playerId: "bottom",
    })

    expect(projection.viewer).toEqual({ access: "owner", playerId: "bottom" })
    expect(projection.ownerPrivate?.data).toEqual(privatePayloadsFor("bottom"))
  })

  it("projects only the requested player's private owner section", () => {
    const chronicle = createChronicle()
    const bottomProjection = projectOwnerChronicle(chronicle, "bottom")
    const topProjection = projectOwnerChronicle(chronicle, "top")
    const bottomSerialized = JSON.stringify(bottomProjection.ownerPrivate)
    const topSerialized = JSON.stringify(topProjection.ownerPrivate)

    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "bottom"),
    )
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, "bottom"),
    )
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, "bottom"),
    )
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "bottom"),
    )
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "bottom"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "top"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, "top"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, "top"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "top"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "top"),
    )

    expect(topSerialized).toContain(
      playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "top"),
    )
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, "top"),
    )
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, "top"),
    )
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "top"),
    )
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "top"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "bottom"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, "bottom"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, "bottom"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "bottom"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "bottom"),
    )
  })
})
