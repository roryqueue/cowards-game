import { COMPATIBILITY_VERSIONS, type Chronicle } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { projectChronicle, projectPublicChronicle } from "./project.js"

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
        awarenessGrid: { private: "grid" },
      },
      privateRef: "private:event:1",
    },
    {
      type: "MATCH_ENDED",
      sequence: 2,
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
      sequence: 2,
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
      bottom: {
        "private:event:1": { awarenessGrid: { private: "grid" } },
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
    expect(projection.snapshots.at(-1)?.outcome).toEqual({
      type: "WIN",
      winnerPlayerId: "bottom",
    })
    expect(serialized).not.toContain("private:event:1")
    expect(serialized).not.toContain("awarenessGrid")
    expect(serialized).not.toContain('"private"')
  })

  it("dispatches owner projection through projectChronicle", () => {
    const projection = projectChronicle(createChronicle(), {
      access: "owner",
      playerId: "bottom",
    })

    expect(projection.viewer).toEqual({ access: "owner", playerId: "bottom" })
    expect(projection.ownerPrivate?.data).toEqual({
      "private:event:1": { awarenessGrid: { private: "grid" } },
    })
  })
})
