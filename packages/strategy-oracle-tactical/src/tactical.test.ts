import { createHash } from "node:crypto"
import { SoldierBrainInputV119Schema, SoldierBrainResultSchema, type SoldierBrainInputV119 } from "@cowards/spec"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { labRoot } from "../../strategy-lab/src/contracts.js"
import { createSubprocessStrategyExecutionAdapter } from "../../runtime-js/src/subprocess-adapter.js"
import { transpileStrategySource } from "../../runtime-js/src/transpile.js"
import { describe, expect, it, vi } from "vitest"
import * as tacticalSearch from "./search.js"
import {
  assertTacticalSourceClosure,
  admitTacticalAdaptationCorpus,
  compileTacticalSourceModules,
  createTacticalAdaptationCorpus,
  emitTacticalFactoryPacket,
  emitProfiledTacticalFactoryPacket,
  emitProfiledTacticalSource,
  deriveTacticalAdaptationProfile,
  TACTICAL_ADAPTATION_PROFILES,
  emitTacticalSource,
  expandTacticalSearch,
  loadTacticalSourceModules,
  runTacticalSoldierBrain,
  scoreTacticalMission,
  selectTacticalActivations,
  tacticalSourceManifest,
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
  it("derives an exact 25 by 4 target-conditioned profile and keeps profiled bytes separate", () => {
    const brain = SoldierBrainInputV119Schema.parse({
      self: soldier("self:a", "self", 1, 1),
      awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => ({ dx: index % 5 - 2, dy: Math.floor(index / 5) - 2, absoluteX: index % 5 - 1, absoluteY: Math.floor(index / 5) - 1, contents: "EMPTY" as const })) },
      cycleIndex: 1, maxCycles: 12 as const, objective: null, soldierMemory: {}, hasAdvancedThisActivation: false,
    }) as unknown as SoldierBrainInputV119
    const observation = (suffix: string, index: number) => ({
      cellResultRoot: root(`cell:${suffix}`), matchRoot: root(`match:${suffix}`), executionRoot: root(`execution:${suffix}`), roundRoot: root("round"), targetCandidateRoot: root(`target:${suffix}`),
      roles: suffix === "a" ? ["strongest_pure" as const] : suffix === "b" ? ["vulnerable_pure" as const] : ["mixture" as const], mixtureWeight: suffix === "c" || suffix === "d" ? { numerator: "1", denominator: "2" } : null,
      selectAccountingOrdinal: index, invocationRoot: root(`invocation:${suffix}`), selectRequestRoot: root(`select-request:${suffix}`), selectInputRoot: root(`select-input:${suffix}`), selectedSoldierId: `soldier-${index}` as const,
      brainAccountingOrdinal: index, soldierBrainRequestRoot: root(`brain-request:${suffix}`), soldierBrainInputRoot: labRoot("runtime-input", brain), soldierBrainInvocationRoot: root(`brain-invocation:${suffix}`), soldierBrainOutputRoot: root(`brain-output:${suffix}`), targetAction: suffix === "a" ? { type: "MOVE" as const, direction: "RIGHT" as const } : suffix === "b" ? { type: "TURN" as const, direction: "LEFT" as const } : { type: "TURN_TO_STONE" as const },
    })
    const observations = [observation("a", 0), observation("b", 1), observation("c", 2), observation("d", 3)].sort((left, right) => `${left.cellResultRoot}:${left.targetCandidateRoot}:${left.invocationRoot}:${left.selectRequestRoot}`.localeCompare(`${right.cellResultRoot}:${right.targetCandidateRoot}:${right.invocationRoot}:${right.selectRequestRoot}`))
    const corpus = { schemaVersion: "tactical-adaptation-corpus-v1" as const, privacy: "private_offline" as const, roundRoot: root("round"), observations }
    const derived = deriveTacticalAdaptationProfile(corpus, [brain, brain, brain, brain])
    expect(derived.rows).toHaveLength(100)
    expect(new Set(derived.rows.map((row) => row.profileId))).toHaveLength(25)
    expect(derived.rows.every((row) => row.targetActionSummary.MOVE === 1 && row.targetActionSummary.TURN === 1 && row.targetActionSummary.TURN_TO_STONE === 2)).toBe(true)
    const targetActions = [{ type: "MOVE" as const, direction: "RIGHT" as const }, { type: "TURN" as const, direction: "LEFT" as const }, { type: "TURN_TO_STONE" as const }]
    const targetConditionedProfiles = targetActions.map((targetAction) => deriveTacticalAdaptationProfile({ ...corpus, observations: corpus.observations.map((entry) => ({ ...entry, targetAction })) }, [brain, brain, brain, brain]).profile.id)
    expect(new Set(targetConditionedProfiles)).toHaveProperty("size", 2)
    const lowPressure = derived.rows.find((row) => row.profileId === "-2:2")!.selectedAction
    const highPressure = derived.rows.find((row) => row.profileId === "2:-2")!.selectedAction
    expect(lowPressure).not.toEqual(highPressure)
    const adapter = createSubprocessStrategyExecutionAdapter()
    const executed = (id: string) => {
      const profile = TACTICAL_ADAPTATION_PROFILES.find((entry) => entry.id === id)!
      const transpiled = transpileStrategySource(emitProfiledTacticalSource(profile))
      if (!transpiled.ok) throw new Error(transpiled.message)
      return adapter.execute({ source: transpiled.code, methodName: "soldierBrain", input: brain, timeoutMs: 5_000 })
    }
    const emittedLow = executed("-2:2"), emittedHigh = executed("2:-2")
    expect(emittedLow.ok).toBe(true)
    expect(emittedHigh.ok).toBe(true)
    if (!emittedLow.ok || !emittedHigh.ok) throw new Error("PROFILED_RUNTIME_FAILURE")
    expect(SoldierBrainResultSchema.parse(emittedLow.value).action).toEqual(lowPressure)
    expect(SoldierBrainResultSchema.parse(emittedHigh.value).action).toEqual(highPressure)
    expect(derived.profile.id).toMatch(/^-?[0-2]:-?[0-2]$/u)
    expect(() => deriveTacticalAdaptationProfile({ ...corpus, observations: corpus.observations.slice(0, 3) }, [brain, brain, brain])).toThrow("TACTICAL_ADAPTATION")
    expect(() => deriveTacticalAdaptationProfile({ ...corpus, observations: [...corpus.observations, corpus.observations[0]!] }, [brain, brain, brain, brain, brain])).toThrow("TACTICAL_ADAPTATION")
    const profiled = emitProfiledTacticalFactoryPacket({ request: packetRequest(), profile: derived.profile })
    expect(profiled.source.root).not.toBe(emitTacticalFactoryPacket(packetRequest()).source.root)
    expect(emitProfiledTacticalSource(derived.profile)).toContain("tacticalProfileRank")
    const retained = createTacticalAdaptationCorpus({ roundRoot: corpus.roundRoot, observations: corpus.observations })
    expect(admitTacticalAdaptationCorpus(retained)).toEqual(retained)
    expect(() => admitTacticalAdaptationCorpus({ ...retained, unexpected: true })).toThrow("TACTICAL_ADAPTATION_CORPUS")
    expect(() => admitTacticalAdaptationCorpus({ ...retained, root: root("wrong") })).toThrow("TACTICAL_ADAPTATION_CORPUS_ROOT")
    expect(() => createTacticalAdaptationCorpus({ roundRoot: corpus.roundRoot, observations: corpus.observations.map((entry) => entry.roles.some((role) => role === "mixture") ? { ...entry, mixtureWeight: { numerator: "1".repeat(262_145), denominator: "1" } } : entry) })).toThrow("TACTICAL_ADAPTATION_SIZE")
    const spy = vi.spyOn(tacticalSearch, "expandTacticalSearch").mockImplementation(() => { throw new Error("nested search") })
    expect(() => deriveTacticalAdaptationProfile(corpus, [brain, brain, brain, brain])).not.toThrow()
    spy.mockRestore()
  })
  it("exports the exact data-only packet emitter with source and provenance roots", () => {
    expect(typeof emitTacticalFactoryPacket).toBe("function")
    const packet = emitTacticalFactoryPacket(packetRequest())
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toBe(packet.source.sha256)
    expect(packet.source.byteLength).toBeGreaterThan(200)
    expect(packet.provider.modelVersion).toBe("tactical-v1")
    expect(packet.source.root).toBe(tacticalSourceManifest().sourceRoot)
  })

  it("bundles the exact selector, scoring, and bounded-search source rather than a surrogate", () => {
    const source = emitTacticalSource()
    expect(source).toContain("expandTacticalSearch")
    expect(source).toContain("scoreTacticalMission")
    expect(source).toContain("scoreTacticalAction")
    expect(source).not.toMatch(/\bimport\b|\beval\b|\bFunction\b|\brequire\b/u)
    const modules = loadTacticalSourceModules()
    const changed = modules.map((module) => module.name === "search.ts" ? { ...module, source: `${module.source}\nconst tacticalSourceCorrespondenceProbe = 1\n` } : module)
    expect(tacticalSourceManifest(changed).sourceRoot).not.toBe(tacticalSourceManifest(modules).sourceRoot)
    expect(compileTacticalSourceModules(changed)).not.toBe(source)
  })

  it("rejects free identifiers and capability recovery in source closure checks", () => {
    expect(() => assertTacticalSourceClosure("const value = leaked; export default { selectActivations(input) { return value; }, soldierBrain(input) { return value; } };"))
      .toThrow("TACTICAL_SOURCE_FREE_IDENTIFIER")
    expect(() => assertTacticalSourceClosure("const value = Object[\"constructor\"]; export default { selectActivations(input) { return value; }, soldierBrain(input) { return value; } };"))
      .toThrow("TACTICAL_SOURCE_CAPABILITY")
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
