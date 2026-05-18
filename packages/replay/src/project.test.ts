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
const PRIVATE_STRATEGY_SOURCE_MARKER = "PRIVATE_STRATEGY_SOURCE_MARKER"
const PRIVATE_REF_MARKER = "PRIVATE_REF_MARKER"
const PRIVATE_DEBUG_MARKER = "PRIVATE_DEBUG_MARKER"
const PRIVATE_STORAGE_MARKER = "PRIVATE_STORAGE_MARKER"
const PRIVATE_OWNER_DEBUG_MARKER = "PRIVATE_OWNER_DEBUG_MARKER"
const PRIVATE_SOLDIER_INACTIVITY_MARKER = "PRIVATE_SOLDIER_INACTIVITY_MARKER"

const privateMarkerValues = [
  PRIVATE_STRATEGY_MEMORY_MARKER,
  PRIVATE_SOLDIER_MEMORY_MARKER,
  PRIVATE_OBJECTIVE_PAYLOAD_MARKER,
  PRIVATE_AWARENESS_GRID_MARKER,
  PRIVATE_RUNTIME_DETAIL_MARKER,
  PRIVATE_STRATEGY_SOURCE_MARKER,
  PRIVATE_REF_MARKER,
  PRIVATE_DEBUG_MARKER,
  PRIVATE_STORAGE_MARKER,
  PRIVATE_OWNER_DEBUG_MARKER,
  PRIVATE_SOLDIER_INACTIVITY_MARKER,
] as const

const privateKeyNames = [
  "source",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "ownerDebug",
  "awarenessGrid",
  "exactAwarenessGrid",
  "runtimeDetails",
  "rawRuntimeDetails",
  "violation",
  "soldierInactivity",
  "soldierInactivityExplanations",
  "privateRef",
  "private",
  "byPlayerId",
  "debug",
  "storageMetadata",
] as const

const playerMarker = (marker: string, playerId: string): string =>
  `${marker}:${playerId}`

const privatePayloadsFor = (playerId: "bottom" | "top") => ({
  "private:strategy": {
    source: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, playerId),
    strategySource: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, playerId),
    strategyMemory: {
      marker: playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, playerId),
      nested: [
        {
          soldierMemory: playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, playerId),
        },
      ],
    },
  },
  "private:event:1": {
    awarenessGrid: {
      marker: playerMarker(PRIVATE_AWARENESS_GRID_MARKER, playerId),
    },
    exactAwarenessGrid: playerMarker(PRIVATE_AWARENESS_GRID_MARKER, playerId),
    objective: playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, playerId),
    objectivePayload: playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, playerId),
  },
  "private:event:2": {
    soldierMemory: playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, playerId),
    runtimeDetails: {
      marker: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, playerId),
    },
    rawRuntimeDetails: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, playerId),
    strategySource: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, playerId),
    violation: {
      payload: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, playerId),
    },
  },
  "owner-debug:soldier-inactivity": {
    ownerDebug: {
      marker: playerMarker(PRIVATE_OWNER_DEBUG_MARKER, playerId),
      soldierInactivity: playerMarker(
        PRIVATE_SOLDIER_INACTIVITY_MARKER,
        playerId,
      ),
      soldierInactivityExplanations: [
        {
          soldierId: `${playerId}-1`,
          cause: "timeout",
          label: playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, playerId),
        },
      ],
    },
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
        source: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"),
        strategySource: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"),
        strategyMemory: [
          {
            marker: playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "bottom"),
          },
        ],
        soldierMemory: playerMarker(PRIVATE_SOLDIER_MEMORY_MARKER, "bottom"),
        awarenessGrid: {
          marker: playerMarker(PRIVATE_AWARENESS_GRID_MARKER, "bottom"),
          nested: [
            {
              exactAwarenessGrid: playerMarker(
                PRIVATE_AWARENESS_GRID_MARKER,
                "bottom",
              ),
            },
          ],
        },
        exactAwarenessGrid: playerMarker(
          PRIVATE_AWARENESS_GRID_MARKER,
          "bottom",
        ),
        objective: {
          marker: playerMarker(PRIVATE_OBJECTIVE_PAYLOAD_MARKER, "bottom"),
        },
        objectivePayload: playerMarker(
          PRIVATE_OBJECTIVE_PAYLOAD_MARKER,
          "bottom",
        ),
        private: {
          byPlayerId: {
            bottom: playerMarker(PRIVATE_STRATEGY_MEMORY_MARKER, "bottom"),
          },
          debug: playerMarker(PRIVATE_DEBUG_MARKER, "bottom"),
        },
        storageMetadata: playerMarker(PRIVATE_STORAGE_MARKER, "bottom"),
        ownerDebug: {
          marker: playerMarker(PRIVATE_OWNER_DEBUG_MARKER, "bottom"),
          soldierInactivityExplanations: [
            {
              marker: playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "bottom"),
            },
          ],
        },
      },
      privateRef: playerMarker(PRIVATE_REF_MARKER, "bottom"),
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
        runtimeDetails: {
          nested: [
            playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "bottom"),
            {
              source: playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"),
            },
          ],
        },
        violation: {
          message: playerMarker(PRIVATE_RUNTIME_DETAIL_MARKER, "bottom"),
          objectivePayload: playerMarker(
            PRIVATE_OBJECTIVE_PAYLOAD_MARKER,
            "bottom",
          ),
        },
        rawRuntimeDetails: playerMarker(
          PRIVATE_RUNTIME_DETAIL_MARKER,
          "bottom",
        ),
        soldierInactivity: {
          marker: playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "bottom"),
        },
      },
      privateRef: playerMarker(PRIVATE_REF_MARKER, "top"),
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
    debug: {
      marker: PRIVATE_DEBUG_MARKER,
      nested: [
        {
          storageMetadata: PRIVATE_STORAGE_MARKER,
        },
      ],
    },
  },
  storageMetadata: {
    private: {
      debug: PRIVATE_DEBUG_MARKER,
      byPlayerId: {
        bottom: PRIVATE_STORAGE_MARKER,
      },
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
    for (const key of privateKeyNames) {
      expect(serialized).not.toContain(`"${key}"`)
    }
    for (const marker of privateMarkerValues) {
      expect(serialized).not.toContain(marker)
    }

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

  it.each(privateMarkerValues)(
    "omits hostile nested private marker %s from public serialization",
    (marker) => {
      const projection = projectPublicChronicle(createChronicle())

      expect(JSON.stringify(projection)).not.toContain(marker)
    },
  )

  it.each(privateKeyNames)(
    "omits hostile private key %s from public serialization",
    (key) => {
      const projection = projectPublicChronicle(createChronicle())

      expect(JSON.stringify(projection)).not.toContain(`"${key}"`)
    },
  )

  it("omits full Chronicle integrity from public projection", () => {
    const projection = projectPublicChronicle({
      ...createChronicle(),
      integrity: {
        algorithm: "sha256",
        normalizedContentHash: "PRIVATE_HASH_COMMITMENT",
      },
    })
    const serialized = JSON.stringify(projection)

    expect(projection.integrity).toBeUndefined()
    expect(serialized).not.toContain("PRIVATE_HASH_COMMITMENT")
  })

  it("projects from canonical parsed Chronicle data and strips schema-unknown payload fields", () => {
    const chronicle = createChronicle() as Chronicle & {
      events: Array<
        Chronicle["events"][number] & { payload: Record<string, unknown> }
      >
    }
    chronicle.events[1]!.payload.debugLeak = {
      unrecognizedPrivateMarker: PRIVATE_AWARENESS_GRID_MARKER,
    }

    const projection = projectPublicChronicle(chronicle)
    const serialized = JSON.stringify(projection)

    expect(serialized).not.toContain("debugLeak")
    expect(serialized).not.toContain(PRIVATE_AWARENESS_GRID_MARKER)
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
      playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"),
    )
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
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_OWNER_DEBUG_MARKER, "bottom"),
    )
    expect(bottomSerialized).toContain(
      playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "bottom"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "top"),
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
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_OWNER_DEBUG_MARKER, "top"),
    )
    expect(bottomSerialized).not.toContain(
      playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "top"),
    )

    expect(topSerialized).toContain(
      playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "top"),
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
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_OWNER_DEBUG_MARKER, "top"),
    )
    expect(topSerialized).toContain(
      playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "top"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_STRATEGY_SOURCE_MARKER, "bottom"),
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
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_OWNER_DEBUG_MARKER, "bottom"),
    )
    expect(topSerialized).not.toContain(
      playerMarker(PRIVATE_SOLDIER_INACTIVITY_MARKER, "bottom"),
    )
  })
})
