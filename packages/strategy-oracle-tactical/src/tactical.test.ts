import { createHash } from "node:crypto"
import { SoldierBrainInputV119Schema, type SoldierBrainInputV119 } from "@cowards/spec"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { describe, expect, it } from "vitest"
import {
  emitTacticalFactoryPacket,
  expandTacticalSearch,
  runTacticalSoldierBrain,
  scoreTacticalMission,
  selectTacticalActivations,
} from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const soldier = (id: string, ownerPlayerId: string, x: number, y: number) => ({ id, ownerPlayerId, status: "ACTIVE" as const, position: { x, y }, facing: "RIGHT" as const, lastSuccessfulMoveDirection: null, soldierMemory: {} })
const legalInput = () => ({
  phaseNumber: 2,
  roundNumber: 2 as const,
  activationCount: 2 as const,
  board: { bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 }, soldiers: [soldier("self:a", "self", 1, 1), soldier("self:b", "self", 3, 3), soldier("enemy:a", "enemy", 4, 1)], terrainStones: [] },
  mySoldiers: [soldier("self:a", "self", 1, 1), soldier("self:b", "self", 3, 3)],
  enemySoldiers: [soldier("enemy:a", "enemy", 4, 1)],
  strategyMemory: {},
  initialInitiativePlayerId: "self",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "self",
  hasRoundInitiative: true,
})

const packetRequest = () => ({
  split: "development" as const,
  doctrineFamily: "tactical-response",
  provider: {
    providerId: "tactical-local",
    modelId: "structured-tactical-optimizer",
    modelVersion: "tactical-v1",
    settingsRoot: root("settings"),
    promptRoot: root("no-prompt"),
    contextRoot: root("legal-observation-only"),
  },
  build: { buildRoot: root("tactical-build"), toolchainRoot: root("typescript-es2022") },
  lineage: { predecessorRoot: root("tactical-origin"), correctionRoot: null, retryParentRoot: null },
})

describe("tactical oracle", () => {
  it("exports the exact data-only packet emitter with source and provenance roots", () => {
    expect(typeof emitTacticalFactoryPacket).toBe("function")
    const packet = emitTacticalFactoryPacket(packetRequest())
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toBe(packet.source.sha256)
    expect(packet.source.byteLength).toBeGreaterThan(200)
    expect(packet.provider.modelVersion).toBe("tactical-v1")
  })

  it("rejects malformed source provenance and a missing local-model provenance field", () => {
    expect(() => emitTacticalFactoryPacket({ ...packetRequest(), provider: { ...packetRequest().provider, modelVersion: "" } })).toThrow("TACTICAL_PROVENANCE")
    const packet = emitTacticalFactoryPacket(packetRequest())
    expect(FactoryOraclePacketSchema.safeParse({ ...packet, source: { ...packet.source, root: root("wrong-source") } }).success).toBe(false)
  })

  it("varies tactical missions with legal board observations while ignoring counterfactual fields", () => {
    const original = legalInput()
    const changed = { ...original, enemySoldiers: [soldier("enemy:b", "enemy", 0, 4)] }
    const originalResult = selectTacticalActivations(original)
    expect(selectTacticalActivations({ ...original, hiddenCounterfactual: "ignored" } as typeof original)).toEqual(originalResult)
    expect(selectTacticalActivations(changed)).not.toEqual(originalResult)
    expect(scoreTacticalMission(original, "self:a").mission.targetId).toBe("enemy:a")
    expect(expandTacticalSearch(original)).toHaveLength(2)
  })

  it("is deterministic and picks a local response from only the tactical objective and awareness", () => {
    const result = selectTacticalActivations(legalInput())
    const objective = result.activationOrders[0]!.objective
    const brainInput = SoldierBrainInputV119Schema.parse({
      self: soldier("self:a", "self", 1, 1),
      awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => ({ dx: index % 5 - 2, dy: Math.floor(index / 5) - 2, absoluteX: index % 5 - 1, absoluteY: Math.floor(index / 5) - 1, contents: index === 13 ? "ENEMY_ACTIVE" as const : "EMPTY" as const, ...(index === 13 ? { facing: "LEFT" as const } : {}) })) },
      cycleIndex: 1,
      maxCycles: 12 as const,
      objective,
      soldierMemory: {},
      hasAdvancedThisActivation: false,
    })
    const typedBrainInput = brainInput as unknown as SoldierBrainInputV119
    expect(runTacticalSoldierBrain(typedBrainInput)).toEqual(runTacticalSoldierBrain(typedBrainInput))
  })
})
