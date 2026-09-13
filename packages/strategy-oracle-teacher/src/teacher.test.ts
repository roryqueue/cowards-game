import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import {
  assertTeacherSourceClosure,
  chooseDistilledStudentAction,
  distillLegalStudent,
  emitTeacherFactoryPacket,
  emitTeacherSource,
  searchCanonicalCounterfactual,
} from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const legalInput = () => ({ observation: { self: { facing: "UP", status: "ACTIVE" }, cells: ["EMPTY", "ENEMY_ACTIVE"] }, objective: { kind: "screen" }, memory: { prior: "none" } })
const training = (action: "TURN_TO_STONE" | "TURN") => [{ legalInput: legalInput(), action: action === "TURN" ? { type: "TURN" as const, direction: "UP" as const } : { type: "TURN_TO_STONE" as const } }]
const packetRequest = () => ({
  split: "development" as const,
  doctrineFamily: "teacher-response",
  provider: { providerId: "teacher-local", modelId: "offline-search-teacher", modelVersion: "teacher-v1", settingsRoot: root("settings"), promptRoot: root("no-prompt"), contextRoot: root("legal-observation-only") },
  build: { buildRoot: root("teacher-build"), toolchainRoot: root("typescript-es2022") },
  lineage: { predecessorRoot: root("teacher-origin"), correctionRoot: null, retryParentRoot: null },
})
const canonicalMatch = () => ({
  matchId: "teacher-counterfactual-match", seed: "teacher-counterfactual-seed",
  arenaVariant: { id: "teacher-arena", name: "Teacher arena", initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, terrainStones: [] },
  bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision",
})

describe("teacher oracle", () => {
  it("exports the exact rooted packet emitter as data without source execution", () => {
    expect(typeof emitTeacherFactoryPacket).toBe("function")
    const packet = emitTeacherFactoryPacket(distillLegalStudent(training("TURN")), packetRequest())
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toBe(packet.source.sha256)
    expect(packet.source.byteLength).toBeGreaterThan(200)
    expect(packet.provider.modelVersion).toBe("teacher-v1")
    const source = emitTeacherSource(distillLegalStudent(training("TURN")))
    expect(() => assertTeacherSourceClosure(source)).not.toThrow()
    expect(source).not.toMatch(/\b(?:import|eval|vm|Function|require)\b/u)
  })

  it("rejects malformed input, source roots, and missing leaf provenance", () => {
    expect(() => emitTeacherFactoryPacket(distillLegalStudent(training("TURN")), { ...packetRequest(), provider: { ...packetRequest().provider, modelVersion: "" } })).toThrow("TEACHER_PROVENANCE")
    const packet = emitTeacherFactoryPacket(distillLegalStudent(training("TURN")), packetRequest())
    expect(FactoryOraclePacketSchema.safeParse({ ...packet, source: { ...packet.source, root: root("wrong-source") } }).success).toBe(false)
  })

  it("uses teacher counterfactuals offline but never in identical deployed legal choices", () => {
    const student = distillLegalStudent(training("TURN"))
    const first = searchCanonicalCounterfactual({ canonicalMatch: canonicalMatch(), counterfactual: { opponentHypothesis: "cautious", hiddenBranchBias: 0 } })
    const second = searchCanonicalCounterfactual({ canonicalMatch: canonicalMatch(), counterfactual: { opponentHypothesis: "cautious", hiddenBranchBias: 1 } })
    expect(first.selectedTemplate).not.toBe(second.selectedTemplate)
    const alteredTeacherOnlyData = { ...legalInput(), teacherCounterfactual: second } as ReturnType<typeof legalInput>
    expect(chooseDistilledStudentAction(student, legalInput())).toEqual(chooseDistilledStudentAction(student, alteredTeacherOnlyData))
    expect(emitTeacherSource(distillLegalStudent(training("TURN")))).not.toBe(emitTeacherSource(distillLegalStudent(training("TURN_TO_STONE"))))
  })
})
