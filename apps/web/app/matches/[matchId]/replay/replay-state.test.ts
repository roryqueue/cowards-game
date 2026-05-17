import type { ReplayReadyDto } from "../../types.js"
import { describe, expect, it } from "vitest"
import {
  canShowOwnerDebug,
  clampTimelineIndex,
  formatTimelinePosition,
  getEventInspector,
  getInitialReplaySequence,
  getSoldierInspector,
  getTimelineEntryAt,
  groupTimelineEntries,
  stepReplayIndex,
} from "./replay-state.js"

const createReplayData = (owner = false): ReplayReadyDto => ({
  status: "ready",
  mode: owner ? "owner" : "public",
  metadata: {
    matchId: "match:fixture",
    chronicleId: "chronicle:fixture",
    hash: "hash",
    schemaVersion: "chronicle-v1",
    eventCount: 3,
    snapshotCount: 1,
    outcome: { type: "DRAW" },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    arenaVariantId: "arena:fixture",
  },
  projection: {
    schemaVersion: "chronicle-v1",
    viewer: owner
      ? { access: "owner", playerId: "player:bottom" }
      : { access: "public" },
    reproducibility: {
      matchId: "match:fixture",
      seed: "seed",
      arenaVariantId: "arena:fixture",
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
    ...(owner
      ? {
          ownerPrivate: {
            playerId: "player:bottom",
            data: { awarenessGrid: "debug" },
          },
        }
      : {}),
  },
  timeline: [
    {
      sequence: 0,
      type: "MATCH_STARTED",
      label: "Match start",
      privacy: "public",
      context: {},
      payload: {},
    },
    {
      sequence: 1,
      type: "ACTIVATION_STARTED",
      round: 1,
      activation: 0,
      label: "Activation",
      privacy: "public",
      context: {
        roundNumber: 1,
        activationIndex: 0,
        soldierId: "soldier:bottom:1",
        actingPlayerId: "player:bottom",
      },
      payload: { soldierId: "soldier:bottom:1" },
    },
    {
      sequence: 2,
      type: "AWARENESS_GRID_OBSERVED",
      round: 1,
      activation: 0,
      cycle: 0,
      label: "Awareness",
      privacy: "owner",
      context: {
        roundNumber: 1,
        activationIndex: 0,
        cycleIndex: 0,
        soldierId: "soldier:bottom:2",
        actingPlayerId: "player:bottom",
      },
      payload: { soldierId: "soldier:bottom:2" },
    },
  ],
  states: [
    {
      sequence: 0,
      board: {
        bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
        soldiers: [
          {
            id: "soldier:bottom:1",
            ownerPlayerId: "player:bottom",
            status: "ACTIVE",
            position: { x: 1, y: 10 },
            facing: "UP",
            lastSuccessfulMoveDirection: "UP",
          },
          {
            id: "soldier:bottom:2",
            ownerPlayerId: "player:bottom",
            status: "FALLEN",
            position: null,
            facing: null,
            lastSuccessfulMoveDirection: null,
          },
        ],
      },
    },
    {
      sequence: 2,
      outcome: { type: "DRAW" },
      board: {
        bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
        terrainStones: [],
        soldiers: [
          {
            id: "soldier:bottom:1",
            ownerPlayerId: "player:bottom",
            status: "ACTIVE",
            position: { x: 1, y: 10 },
            facing: "UP",
            lastSuccessfulMoveDirection: "UP",
          },
          {
            id: "soldier:bottom:2",
            ownerPlayerId: "player:bottom",
            status: "FALLEN",
            position: null,
            facing: null,
            lastSuccessfulMoveDirection: null,
          },
        ],
      },
    },
  ],
  initialSequence: 0,
  ...(owner ? { ownerPlayerId: "player:bottom" } : {}),
})

describe("replay state helpers", () => {
  it("starts at sequence 0 and clamps step navigation", () => {
    const data = createReplayData()

    expect(getInitialReplaySequence(data)).toBe(0)
    expect(clampTimelineIndex(-5, data.timeline.length)).toBe(0)
    expect(stepReplayIndex(0, -1, data.timeline.length)).toBe(0)
    expect(stepReplayIndex(0, 1, data.timeline.length)).toBe(1)
    expect(stepReplayIndex(2, 1, data.timeline.length)).toBe(2)
  })

  it("maps scrubber index to timeline entries", () => {
    const data = createReplayData()

    expect(getTimelineEntryAt(data, 2).sequence).toBe(2)
    expect(formatTimelinePosition(getTimelineEntryAt(data, 2))).toBe(
      "Round 1 -> Activation 1 -> Awareness -> Cycle 0",
    )
  })

  it("groups Round -> Activation -> Event and keeps Cycle conditional", () => {
    const groups = groupTimelineEntries(createReplayData().timeline)
    const activation = groups
      .find((group) => group.round === 1)
      ?.activations.find((group) => group.activation === 0)

    expect(activation?.events[0]).not.toHaveProperty("cycle")
    expect(activation?.events[1]).toMatchObject({ cycle: 0 })
  })

  it("returns FALLEN for null Soldier positions", () => {
    const inspector = getSoldierInspector(
      createReplayData(),
      "soldier:bottom:2",
      2,
    )

    expect(inspector?.position).toBe("FALLEN")
    expect(inspector?.status).toBe("FALLEN")
  })

  it("labels public and owner event inspector privacy", () => {
    const data = createReplayData()

    expect(getEventInspector(data.timeline[0]!).privacyLabel).toBe(
      "Public event",
    )
    expect(getEventInspector(data.timeline[2]!).privacyLabel).toBe(
      "Owner-only debug available",
    )
    expect(canShowOwnerDebug(data)).toBe(false)
    expect(canShowOwnerDebug(createReplayData(true))).toBe(true)
  })
})
