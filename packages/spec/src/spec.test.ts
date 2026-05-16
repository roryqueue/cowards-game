import { describe, expect, it } from "vitest"
import { ActionSchema, ChronicleSchema, SoldierSchema } from "./schemas.js"
import { fixtures } from "./fixtures/index.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"

describe("Coward's Game spec contracts", () => {
  it("compatibility versions have exactly the core six keys", () => {
    expect(Object.keys(COMPATIBILITY_VERSIONS)).toEqual([
      "spec",
      "engine",
      "runtimeJs",
      "chronicle",
      "strategyRevision",
      "arenaVariant",
    ])
  })

  it("standard initial Soldiers include 16 Soldiers total", () => {
    expect(fixtures.valid.standardInitialSoldiers).toHaveLength(16)
  })

  it("bottom Soldiers face UP and top Soldiers face DOWN", () => {
    const bottom = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "bottom",
    )
    const top = fixtures.valid.standardInitialSoldiers.filter(
      (soldier) => soldier.ownerPlayerId === "top",
    )

    expect(bottom.every((soldier) => soldier.facing === "UP")).toBe(true)
    expect(top.every((soldier) => soldier.facing === "DOWN")).toBe(true)
  })

  it("ActionSchema accepts MOVE, TURN, and TURN_TO_STONE", () => {
    expect(
      ActionSchema.safeParse({ type: "MOVE", direction: "UP" }).success,
    ).toBe(true)
    expect(
      ActionSchema.safeParse({ type: "TURN", direction: "LEFT" }).success,
    ).toBe(true)
    expect(ActionSchema.safeParse({ type: "TURN_TO_STONE" }).success).toBe(true)
  })

  it("at least one invalid fixture fails schema validation", () => {
    expect(
      ActionSchema.safeParse(fixtures.invalid.invalidDirection).success,
    ).toBe(false)
    expect(
      SoldierSchema.safeParse(fixtures.invalid.illegalSoldierStatus).success,
    ).toBe(false)
  })

  it("ChronicleSchema accepts a minimal replay artifact with private owner data", () => {
    const board = {
      bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      soldiers: [
        {
          id: "bottom-1",
          ownerPlayerId: "bottom",
          status: "ACTIVE",
          position: { x: 5, y: 10 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        {
          id: "top-1",
          ownerPlayerId: "top",
          status: "FALLEN",
          position: null,
          facing: null,
          lastSuccessfulMoveDirection: null,
        },
      ],
      terrainStones: [],
    }

    const chronicle = {
      schemaVersion: "chronicle-v1",
      reproducibility: {
        matchId: "match-1",
        seed: "seed-1",
        arenaVariantId: "arena-standard",
        arenaVariantVersion: "arena-v1",
        strategyRevisionIds: ["strategy-bottom-v1", "strategy-top-v1"],
        versions: COMPATIBILITY_VERSIONS,
      },
      events: [
        {
          type: "MATCH_STARTED",
          sequence: 0,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { matchId: "match-1" },
        },
        {
          type: "ROUND_STARTED",
          sequence: 1,
          context: { phaseNumber: 1, roundNumber: 1 },
          privacy: "public",
          payload: { roundNumber: 1 },
        },
        {
          type: "ACTIVATION_STARTED",
          sequence: 2,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "public",
          payload: { soldierId: "bottom-1" },
        },
        {
          type: "AWARENESS_GRID_OBSERVED",
          sequence: 3,
          context: {
            phaseNumber: 1,
            roundNumber: 1,
            activationId: "activation-1",
            activationIndex: 0,
            cycleIndex: 0,
            actingPlayerId: "bottom",
            soldierId: "bottom-1",
          },
          privacy: "owner",
          payload: { soldierId: "bottom-1", cycleIndex: 0 },
          privateRef: "bottom.awareness.3",
        },
        {
          type: "MATCH_ENDED",
          sequence: 4,
          context: { phaseNumber: 1 },
          privacy: "public",
          payload: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      snapshots: [
        {
          kind: "MATCH_START",
          sequence: 0,
          context: { phaseNumber: 1 },
          board,
        },
        {
          kind: "TERMINAL",
          sequence: 4,
          context: { phaseNumber: 1 },
          board,
          outcome: { type: "WIN", winnerPlayerId: "bottom" },
        },
      ],
      private: {
        byPlayerId: {
          bottom: {
            awareness: {
              "bottom.awareness.3": {
                soldierId: "bottom-1",
                cycleIndex: 0,
                grid: "owner-only-grid",
              },
            },
          },
        },
      },
      integrity: {
        algorithm: "sha256",
        normalizedContentHash: "hash-fixture",
      },
    }

    expect(ChronicleSchema.parse(chronicle)).toEqual(chronicle)
  })
})
