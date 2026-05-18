import type { ReplayReadyDto } from "../../types.js"
import { describe, expect, it } from "vitest"
import {
  canShowOwnerDebug,
  clampTimelineIndex,
  formatSoldierInactivityCause,
  formatTimelinePosition,
  getEventInspector,
  getInitialReplaySequence,
  getOwnerAwarenessGridInspection,
  getSoldierInactivityExplanation,
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
              details: { roundNumber: 1 },
            },
            {
              soldierId: "soldier:bottom:1",
              playerId: "player:bottom",
              sequence: 2,
              cause: "blocked_movement",
              label: "Movement was blocked",
              remediation: "Choose a different Advance direction.",
              details: { reason: "WALL" },
            },
          ],
        },
      }
    : {}),
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

  it("extracts owner-only Awareness Grid data for the selected Cycle", () => {
    const data = createReplayData(true)
    data.projection.ownerPrivate = {
      playerId: "player:bottom",
      data: {
        "private:event:2": {
          awarenessGrid: {
            cells: Array.from({ length: 25 }, (_, index) => ({
              dx: (index % 5) - 2,
              dy: Math.floor(index / 5) - 2,
              contents: index === 12 ? "FRIENDLY_ACTIVE" : "EMPTY",
              ...(index === 12 ? { facing: "UP" } : {}),
            })),
          },
        },
      },
    }

    const inspection = getOwnerAwarenessGridInspection(data, data.timeline[2]!)

    expect(inspection?.soldierId).toBe("soldier:bottom:2")
    expect(inspection?.cycle).toBe(0)
    expect(inspection?.cells).toHaveLength(25)
    expect(inspection?.cells[12]).toMatchObject({
      dx: 0,
      dy: 0,
      contents: "FRIENDLY_ACTIVE",
      facing: "UP",
    })
    expect(
      getOwnerAwarenessGridInspection(createReplayData(), data.timeline[2]!),
    ).toBeNull()
  })

  it("returns no Soldier inactivity explanation for public replay data", () => {
    expect(
      getSoldierInactivityExplanation(
        createReplayData(),
        "soldier:bottom:1",
        2,
      ),
    ).toBeNull()
  })

  it("returns the selected Soldier explanation nearest to the current sequence", () => {
    const explanation = getSoldierInactivityExplanation(
      createReplayData(true),
      "soldier:bottom:1",
      2,
    )

    expect(explanation).toEqual({
      soldierId: "soldier:bottom:1",
      cause: "blocked_movement",
      causeCode: "BLOCKED_MOVEMENT",
      label: "Movement was blocked",
      remediation: "Choose a different Advance direction.",
      sourceEventSequence: 2,
      details: { reason: "WALL" },
    })
    expect(formatSoldierInactivityCause("not_selected")).toBe("NOT_SELECTED")
  })

  it("keeps Soldier inactivity selectors limited to DTO fields", () => {
    const selectorSource = getSoldierInactivityExplanation.toString()

    expect(selectorSource).not.toContain(".board")
    expect(selectorSource).not.toContain(".bounds")
    expect(selectorSource).not.toContain(".position")
    expect(selectorSource).not.toContain(".facing")
  })
})
