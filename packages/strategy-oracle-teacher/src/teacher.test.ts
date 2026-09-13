import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { assertTeacherSourceClosure, distillLegalStudent, emitTeacherFactoryPacket, emitTeacherSource, runDistilledActivations, runDistilledSoldierBrain, searchCanonicalCounterfactual } from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}` as const
const soldier = (id: string, ownerPlayerId: string, x: number, y: number) => ({ id, ownerPlayerId, status: "ACTIVE" as const, position: { x, y }, facing: "RIGHT" as const, lastSuccessfulMoveDirection: null, soldierMemory: {} })
const activationInput = (enemyX = 4) => ({ phaseNumber: 2, roundNumber: 2 as const, activationCount: 2 as const, board: { bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 }, soldiers: [soldier("a", "self", 1, 1), soldier("b", "self", 3, 3), soldier("e", "enemy", enemyX, 1)], terrainStones: [] }, mySoldiers: [soldier("a", "self", 1, 1), soldier("b", "self", 3, 3)], enemySoldiers: [soldier("e", "enemy", enemyX, 1)], strategyMemory: {}, initialInitiativePlayerId: "self", hasInitialInitiative: true, roundInitiativePlayerId: "self", hasRoundInitiative: true })
const brainInput = (enemyDx = 1) => ({ self: soldier("a", "self", 1, 1), awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => ({ dx: index % 5 - 2, dy: Math.floor(index / 5) - 2, absoluteX: index % 5 - 1, absoluteY: Math.floor(index / 5) - 1, contents: index === 12 + enemyDx ? "ENEMY_ACTIVE" as const : "EMPTY" as const })) }, cycleIndex: 1, maxCycles: 12 as const, objective: null, soldierMemory: {}, hasAdvancedThisActivation: false })
const training = () => [{ kind: "activation" as const, input: activationInput(), target: "press" as const }, { kind: "brain" as const, input: brainInput(), target: { type: "MOVE" as const, direction: "RIGHT" as const } }]
const request = () => ({ split: "development" as const, doctrineFamily: "teacher-response", provider: { providerId: "teacher-local", modelId: "offline-search-teacher", modelVersion: "teacher-v2", settingsRoot: root("settings"), promptRoot: root("none"), contextRoot: root("legal") }, build: { buildRoot: root("build"), toolchainRoot: root("ts") }, lineage: { predecessorRoot: root("origin"), correctionRoot: null, retryParentRoot: null } })
const match = () => ({ matchId: "teacher-match", seed: "teacher-seed", arenaVariant: { id: "teacher-arena", name: "Teacher arena", initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, terrainStones: [] }, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision", runtime: {} as never })

describe("teacher oracle", () => {
  it("evaluates multiple canonical alternatives over bounded depth and node caps", () => {
    const receipt = searchCanonicalCounterfactual({ canonicalMatch: match(), counterfactual: { opponentHypothesis: "cautious", hiddenBranchBias: 0 }, maxDepth: 2, maxNodes: 12 })
    expect(receipt.depthReached).toBeGreaterThanOrEqual(2)
    expect(receipt.alternativesEvaluated).toBeGreaterThanOrEqual(2)
    expect(receipt.nodesVisited).toBeLessThanOrEqual(12)
    expect(receipt.outcomeRoots.length).toBeGreaterThanOrEqual(3)
  })
  it("uses only schema-admitted legal features for useful non-constant activation and Action responses", () => {
    const student = distillLegalStudent(training())
    expect(runDistilledActivations(student, activationInput()).activationOrders).toHaveLength(2)
    expect(() => runDistilledActivations(student, { ...activationInput(), ignoredTeacherState: { secret: true } })).toThrow()
    expect(runDistilledSoldierBrain(student, brainInput(1)).action).toEqual({ type: "TURN", direction: "RIGHT" })
    expect(runDistilledSoldierBrain(student, brainInput(-1)).action).toEqual({ type: "TURN", direction: "LEFT" })
    expect(runDistilledActivations(student, activationInput()).strategyMemory).toEqual(runDistilledActivations(student, activationInput()).strategyMemory)
  })
  it("emits the exact rooted packet as unexecuted data and enforces source closure", () => {
    const student = distillLegalStudent(training()), packet = emitTeacherFactoryPacket(student, request()), source = emitTeacherSource(student)
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(source).toContain(student.controllerRoot)
    expect(source).toContain("selectActivations")
    expect(source).toContain("soldierBrain")
    expect(source).not.toMatch(/counterfactual|opponentHypothesis|eval|import/u)
    expect(() => assertTeacherSourceClosure("const x = missing; export default {}; ")).toThrow("TEACHER_SOURCE_FREE_IDENTIFIER")
    expect(() => assertTeacherSourceClosure("import x from 'unsafe'; export default x;")).toThrow("TEACHER_SOURCE_CAPABILITY")
  })
})
