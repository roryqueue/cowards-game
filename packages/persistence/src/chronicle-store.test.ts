import { describe, expect, it } from "vitest"
import type { Chronicle } from "@cowards/spec"
import {
  ChronicleValidationSystemFailure,
  createMemoryChronicleStoreForTests,
} from "./chronicle-store.js"

const board = {
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  soldiers: [],
  terrainStones: [],
}

const validChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "match:chronicle:001",
    seed: "seed:chronicle:001",
    arenaVariantId: "arena:smoke:v1",
    arenaVariantVersion: "arena-v1",
    strategyRevisionIds: ["strategy-revision:bottom", "strategy-revision:top"],
    versions: {
      spec: "1.0.0",
      engine: "0.1.0",
      runtimeJs: "0.1.0",
      chronicle: "0.1.0",
      strategyRevision: "0.1.0",
      arenaVariant: "0.1.0",
    },
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "match:chronicle:001", seed: "seed:chronicle:001" },
    },
    {
      type: "ROUND_STARTED",
      sequence: 1,
      context: { roundNumber: 1 },
      privacy: "public",
      payload: { roundNumber: 1 },
    },
    {
      type: "STRATEGY_EVALUATED",
      sequence: 2,
      context: { roundNumber: 1, actingPlayerId: "player:bottom" },
      privacy: "private",
      privateRef: "private:event:2",
      payload: { playerId: "player:bottom" },
    },
    {
      type: "STRATEGY_EVALUATED",
      sequence: 3,
      context: { roundNumber: 1, actingPlayerId: "player:top" },
      privacy: "private",
      privateRef: "private:event:3",
      payload: { playerId: "player:top" },
    },
    {
      type: "ACTIVATION_STARTED",
      sequence: 4,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      privacy: "public",
      payload: { soldierId: "soldier:1" },
    },
    {
      type: "AWARENESS_GRID_OBSERVED",
      sequence: 5,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
        cycleIndex: 0,
      },
      privacy: "owner",
      payload: { soldierId: "soldier:1", cycleIndex: 0 },
    },
    {
      type: "ACTION_EMITTED",
      sequence: 6,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
        cycleIndex: 0,
      },
      privacy: "public",
      payload: {
        soldierId: "soldier:1",
        action: { type: "TURN_TO_STONE" },
      },
    },
    {
      type: "MATCH_ENDED",
      sequence: 7,
      context: {},
      privacy: "public",
      payload: { type: "DRAW" },
    },
  ],
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board },
    { kind: "ROUND_START", sequence: 1, context: { roundNumber: 1 }, board },
    {
      kind: "ACTIVATION_START",
      sequence: 4,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      board,
    },
    {
      kind: "ACTIVATION_END",
      sequence: 6,
      context: {
        roundNumber: 1,
        activationId: "1:1:0",
        activationIndex: 0,
        actingPlayerId: "player:bottom",
        soldierId: "soldier:1",
      },
      board,
    },
    { kind: "ROUND_END", sequence: 6, context: { roundNumber: 1 }, board },
    {
      kind: "MATCH_END",
      sequence: 7,
      context: {},
      board,
      outcome: { type: "DRAW" },
    },
    {
      kind: "TERMINAL",
      sequence: 7,
      context: {},
      board,
      outcome: { type: "DRAW" },
    },
  ],
  private: {
    byPlayerId: {
      "player:bottom": {
        "private:event:2": { plan: "hidden" },
      },
    },
  },
})

describe("Chronicle storage", () => {
  it("stores metadata and preserves unified private artifact sections", async () => {
    const store = createMemoryChronicleStoreForTests()
    const stored = await store.put(validChronicle())

    expect(stored.metadata.schemaVersion).toBe("chronicle-v1")
    expect(stored.metadata.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(stored.metadata.eventCount).toBe(8)
    expect(stored.metadata.snapshotCount).toBe(7)
    expect(stored.metadata.bottomPlayerId).toBe("player:bottom")
    expect(stored.metadata.topPlayerId).toBe("player:top")
    expect(stored.metadata.bottomStrategyRevisionId).toBe(
      "strategy-revision:bottom",
    )
    expect(stored.metadata.arenaVariantId).toBe("arena:smoke:v1")
    expect(stored.artifact.events).toHaveLength(8)
    expect(stored.artifact.private?.byPlayerId["player:bottom"]).toBeDefined()
  })

  it("does not create a duplicate Chronicle for one Match", async () => {
    const store = createMemoryChronicleStoreForTests()
    await store.put(validChronicle())
    await store.put(validChronicle())

    expect(store.size()).toBe(1)
  })

  it("throws a system failure for invalid Chronicle validation", async () => {
    const store = createMemoryChronicleStoreForTests()
    const invalid = {
      ...validChronicle(),
      events: [],
    }

    await expect(store.put(invalid)).rejects.toBeInstanceOf(
      ChronicleValidationSystemFailure,
    )
  })
})
