import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import {
  assertTeacherSourceClosure,
  compileLegalStudentPolicy,
  deriveTeacherControllerManifest,
  distillLegalStudent,
  emitTeacherFactoryPacket,
  emitTeacherSource,
  getTeacherControllerManifest,
  projectTeacherSearchToLegalTraining,
  runDistilledActivations,
  runDistilledSoldierBrain,
  searchCanonicalCounterfactual,
} from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}` as const
const snapshot = (id: string, ownerPlayerId: string, x: number, y: number) => ({ id, ownerPlayerId, status: "ACTIVE" as const, position: { x, y }, facing: "RIGHT" as const, lastSuccessfulMoveDirection: null })
const activationInput = (enemyX = 4, hasRoundInitiative = true) => ({ phaseNumber: 2, roundNumber: 2 as const, activationCount: 2 as const, board: { bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 }, soldiers: [snapshot("a", "self", 1, 1), snapshot("b", "self", 3, 3), snapshot("e", "enemy", enemyX, 1)], terrainStones: [] }, mySoldiers: [snapshot("a", "self", 1, 1), snapshot("b", "self", 3, 3)], enemySoldiers: [snapshot("e", "enemy", enemyX, 1)], strategyMemory: {}, initialInitiativePlayerId: "self", hasInitialInitiative: true, roundInitiativePlayerId: hasRoundInitiative ? "self" : "enemy", hasRoundInitiative })
const brainInput = (enemyDx = 1, contents: "EMPTY" | "TERRAIN_STONE" = "EMPTY") => ({ self: snapshot("a", "self", 1, 1), awarenessGrid: { cells: Array.from({ length: 25 }, (_, index) => { const dx = index % 5 - 2; const dy = Math.floor(index / 5) - 2; return { dx, dy, absoluteX: dx + 1, absoluteY: dy + 1, contents: dx === enemyDx && dy === 0 ? "ENEMY_ACTIVE" as const : dx === Math.sign(enemyDx) && dy === 0 ? contents : "EMPTY" as const } }) }, cycleIndex: 1, maxCycles: 12 as const, objective: null, soldierMemory: {}, hasAdvancedThisActivation: false })
const match = (maxPhases?: number) => ({ matchId: "teacher-match", seed: "teacher-seed", arenaVariant: { id: "teacher-arena", name: "Teacher arena", initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, terrainStones: [] }, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision", initialInitiativePlayerId: "bottom", ...(maxPhases === undefined ? {} : { maxPhases }) })
const search = (opponentHypothesis: "cautious" | "aggressive" = "cautious") => searchCanonicalCounterfactual({ canonicalMatch: match(), studentPlayerId: "bottom", counterfactual: { opponentHypothesis }, maxDepth: 3, maxNodes: 128 })
const request = () => ({ split: "development" as const, doctrineFamily: "teacher-response", provider: { providerId: "teacher-local", modelId: "offline-search-teacher", modelVersion: "teacher-v3", settingsRoot: root("settings"), promptRoot: root("none"), contextRoot: root("legal") }, build: { buildRoot: root("build"), toolchainRoot: root("ts") }, lineage: { predecessorRoot: root("origin"), correctionRoot: null, retryParentRoot: null } })

describe("teacher oracle", () => {
  it("compares legal mission and Action policies from one canonical decision and models the opponent separately", () => {
    const cautious = search("cautious")
    const aggressive = search("aggressive")
    expect(cautious.alternativesEvaluated).toBe(3)
    expect(new Set(cautious.outcomeRoots).size).toBe(3)
    expect(cautious.depthReached).toBe(3)
    expect(cautious.selectedLegalTargets.map((record) => record.kind)).toEqual(["activation", "brain", "brain"])
    expect(cautious.selectedLegalTargets[0]).toMatchObject({ kind: "activation", target: "press" })
    expect(cautious.selectedLegalTargets[1]).toMatchObject({ kind: "brain", target: { type: "MOVE" } })
    expect(cautious.outcomes.find((outcome) => outcome.template === "press-advance")?.score).toEqual([2, 1, 0, 1])
    expect(cautious.outcomes.find((outcome) => outcome.template === "screen-anchor")?.score).toEqual([2, 0, 0, 0])
    expect(cautious.outcomes.map((outcome) => outcome.stateRoot)).not.toEqual(aggressive.outcomes.map((outcome) => outcome.stateRoot))
    expect(cautious.selectedOutcomeRoot).not.toBe(aggressive.selectedOutcomeRoot)
    expect(cautious.nodesVisited).not.toBe(aggressive.nodesVisited)
    expect(cautious.nodesVisited).toBeLessThanOrEqual(128)
    expect(aggressive.nodesVisited).toBeLessThanOrEqual(128)
  })

  it("honors one global node cap and reports actual low-budget and terminal work", () => {
    const low = searchCanonicalCounterfactual({ canonicalMatch: match(), studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 6, maxNodes: 2 })
    expect(low).toMatchObject({ nodesVisited: 2, depthReached: 0, alternativesEvaluated: 0, selectedTemplate: null, selectedLegalTargets: [] })
    const terminal = searchCanonicalCounterfactual({ canonicalMatch: match(0), studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "aggressive" }, maxDepth: 6, maxNodes: 64 })
    expect(terminal).toMatchObject({ nodesVisited: 3, depthReached: 0, alternativesEvaluated: 0, selectedTemplate: null, selectedLegalTargets: [] })
  })

  it("projects selected search targets into a deterministic conditional legal-input student", () => {
    const receipt = search()
    const records = projectTeacherSearchToLegalTraining(receipt)
    expect(records.length).toBeGreaterThan(1)
    expect(records.every((record) => Object.keys(record).sort().join(",") === "input,kind,target")).toBe(true)
    const student = distillLegalStudent(records)
    expect(Object.isFrozen(student)).toBe(true)
    expect(Object.isFrozen(student.featurePolicy.brain)).toBe(true)
    expect(runDistilledActivations(student, activationInput()).activationOrders).toHaveLength(2)
    expect(runDistilledSoldierBrain(student, brainInput(2)).action).toEqual({ type: "MOVE", direction: "RIGHT" })
    expect(runDistilledSoldierBrain(student, brainInput(-2)).action).toEqual({ type: "MOVE", direction: "LEFT" })
    expect(runDistilledSoldierBrain(student, brainInput(-2)).action).toEqual(runDistilledSoldierBrain(student, brainInput(-2)).action)
    expect(() => runDistilledActivations(student, { ...activationInput(), teacherScore: 99 })).toThrow("TEACHER_STUDENT_ACTIVATION_INPUT")
  })

  it("rejects unknown records, extra legal-input data, malformed Actions, policy extras, and forged roots", () => {
    const receipt = search()
    const records = projectTeacherSearchToLegalTraining(receipt)
    expect(() => projectTeacherSearchToLegalTraining({ ...receipt, hostPath: "/tmp/private" })).toThrow("TEACHER_SEARCH_RECEIPT")
    expect(() => distillLegalStudent([{ kind: "teacher_state", input: activationInput(), target: "press" }])).toThrow("TEACHER_TRAINING_KIND")
    expect(() => distillLegalStudent([{ kind: "activation", input: { ...activationInput(), evaluator: true }, target: "press" }])).toThrow("TEACHER_TRAINING_ACTIVATION")
    expect(() => distillLegalStudent([{ kind: "brain", input: brainInput(), target: { type: "FLY" } }])).toThrow()
    expect(() => distillLegalStudent([{ kind: "brain", input: brainInput(), target: { type: "TURN_TO_STONE", secret: true } }])).toThrow("TEACHER_TRAINING_ACTION")
    const student = distillLegalStudent(records)
    expect(() => compileLegalStudentPolicy({ ...student, teacherState: true })).toThrow("TEACHER_STUDENT")
    expect(() => compileLegalStudentPolicy({ ...student, controllerRoot: root("forged") })).toThrow("TEACHER_STUDENT_ROOT")
    expect(() => compileLegalStudentPolicy({ ...student, featurePolicy: { ...student.featurePolicy, brain: [...student.featurePolicy.brain, { feature: "bad", target: "move" }] } })).toThrow("TEACHER_FEATURE_POLICY")
  })

  it("bundles both tested owned entrypoints and binds any controller-byte change into the manifest", () => {
    const records = projectTeacherSearchToLegalTraining(search())
    const student = distillLegalStudent(records)
    const source = emitTeacherSource(student)
    const manifest = getTeacherControllerManifest()
    const owned = readFileSync(new URL("./controller.ts", import.meta.url), "utf8")
    expect(deriveTeacherControllerManifest(owned)).toEqual(manifest)
    expect(source).toContain(manifest.sourceRoot)
    expect(source).toContain("controllerSelectActivations(student.featurePolicy, input)")
    expect(source).toContain("controllerSoldierBrain(student.featurePolicy, input)")
    expect(deriveTeacherControllerManifest(owned.replace("const mode = controllerActivationMode", "const mode =  controllerActivationMode")).sourceRoot).not.toBe(manifest.sourceRoot)
    expect(deriveTeacherControllerManifest(owned.replace("const mode = controllerBrainMode", "const mode =  controllerBrainMode")).sourceRoot).not.toBe(manifest.sourceRoot)
    expect(() => deriveTeacherControllerManifest(owned.replace("export const controllerSoldierBrain", "const controllerSoldierBrain"))).toThrow("TEACHER_CONTROLLER_ENTRYPOINT")
  })

  it("requires two callable default exports and blocks computed capability recovery", () => {
    expect(() => assertTeacherSourceClosure("const selectActivations = () => Object[\"constructor\"][\"constructor\"](\"return process\")(); const soldierBrain = () => ({}); export default { selectActivations, soldierBrain }; ")).toThrow("TEACHER_SOURCE_COMPUTED_ACCESS")
    expect(() => assertTeacherSourceClosure("const selectActivations = () => ({}); export default { selectActivations }; ")).toThrow("TEACHER_SOURCE_EXPORT_SHAPE")
    expect(() => assertTeacherSourceClosure("const selectActivations = {}; const soldierBrain = () => ({}); export default { selectActivations, soldierBrain }; ")).toThrow("TEACHER_SOURCE_EXPORT_SHAPE")
    expect(() => assertTeacherSourceClosure("const selectActivations = (input) => input[0]; const soldierBrain = (input) => input[1]; export default { selectActivations, soldierBrain }; ")).not.toThrow()
  })

  it("emits a strict rooted packet as unexecuted data without private search state", () => {
    const student = distillLegalStudent(projectTeacherSearchToLegalTraining(search()))
    const packet = emitTeacherFactoryPacket(student, request())
    const source = emitTeacherSource(student)
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(source).toContain(student.controllerRoot)
    expect(source).not.toMatch(/counterfactual|opponentHypothesis|selectedOutcomeRoot|hostPath|evaluator/u)
  })
})
