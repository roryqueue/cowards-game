import { buildStrategyRevision } from "@cowards/runtime-js"
import type { ArenaVariant, StrategyRevision } from "@cowards/spec"

const cautiousSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const recklessSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "MOVE", direction: input.self.facing ?? "UP" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

export interface DevelopmentSeedData {
  users: Array<{ id: string; displayName: string }>
  strategies: Array<{ id: string; ownerUserId: string; name: string }>
  revisions: StrategyRevision[]
  arenas: ArenaVariant[]
  matchSets: Array<{
    id: string
    presetId: string
    presetVersion: string
    matrix: Array<{
      id: string
      seed: string
      arenaVariantId: string
      bottomStrategyRevisionId: string
      topStrategyRevisionId: string
      bottomPlayerId: string
      topPlayerId: string
    }>
  }>
}

export const createDevelopmentSeedData = (): DevelopmentSeedData => {
  const cautiousRevision = buildStrategyRevision({
    source: cautiousSource,
    strategyId: "strategy:cautious",
    metadata: { createdBy: "user:local", label: "Cautious" },
  })
  const recklessRevision = buildStrategyRevision({
    source: recklessSource,
    strategyId: "strategy:reckless",
    metadata: { createdBy: "user:local", label: "Reckless" },
  })

  return {
    users: [{ id: "user:local", displayName: "Local Player" }],
    strategies: [
      {
        id: "strategy:cautious",
        ownerUserId: "user:local",
        name: "Cautious",
      },
      {
        id: "strategy:reckless",
        ownerUserId: "user:local",
        name: "Reckless",
      },
    ],
    revisions: [cautiousRevision, recklessRevision],
    arenas: [
      {
        id: "arena:smoke:v1",
        name: "Smoke",
        initialBounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
        terrainStones: [],
      },
      {
        id: "arena:standard-cross:v1",
        name: "Standard Cross",
        initialBounds: { minX: 0, maxX: 6, minY: 0, maxY: 6 },
        terrainStones: [
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 3, y: 4 },
        ],
      },
    ],
    matchSets: [
      {
        id: "match-set:smoke:v1",
        presetId: "smoke-v1",
        presetVersion: "v1",
        matrix: [
          {
            id: "match:smoke:001",
            seed: "seed:smoke:001",
            arenaVariantId: "arena:smoke:v1",
            bottomStrategyRevisionId: cautiousRevision.id,
            topStrategyRevisionId: recklessRevision.id,
            bottomPlayerId: "player:bottom",
            topPlayerId: "player:top",
          },
        ],
      },
    ],
  }
}
