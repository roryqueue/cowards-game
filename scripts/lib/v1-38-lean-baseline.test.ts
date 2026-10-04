import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { auditLeanTrainingVector, LEAN_INITIAL_TRAINING_VECTOR, type LeanColdTrainingManifest } from "../../packages/strategy-lab/src/league/lean-training.js"
import { deriveFactorySourceStructureRoot } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import { createLeanBaselineEvidence, createLeanCurrentBaselineSchedule, buildLeanBaselineHandoff, verifyLeanCurrentBaseline, type LeanBaselineTerminal } from "./v1-38-lean-baseline.js"

const root = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const training = (arm: string): LeanColdTrainingManifest => {
  const source = "export default {};"
  const candidate = (mechanism: "tactical" | "teacher") => ({ mechanism, source, sourceRoot: root(source), structureRoot: deriveFactorySourceStructureRoot(new TextEncoder().encode(source)), decisionRoot: root(`${arm}:${mechanism}`), disposition: "weak_preserved" as const, trainingMatchRoots: Array.from({ length: 4 }, (_, index) => root(`${arm}:${mechanism}:${index}`)), workRoots: { tacticalInputs: mechanism === "tactical" ? Array.from({ length: 64 }, (_, index) => root(`${arm}:input:${index}`)) : [], teacherNodes: mechanism === "teacher" ? Array.from({ length: 64 }, (_, index) => root(`${arm}:node:${index}`)) : [], distillationExamples: mechanism === "teacher" ? Array.from({ length: 64 }, (_, index) => root(`${arm}:distill:${index}`)) : [], responseNodes: [] } })
  const value = { schemaVersion: "lean-cold-training-manifest-v1" as const, stage: "initial" as const, coldRoot: root(`${arm}:cold`), corpusRoot: root("common-corpus"), armRoot: root(arm), candidates: [candidate("tactical"), candidate("teacher")], vector: LEAN_INITIAL_TRAINING_VECTOR }
  const manifest = { ...value, root: labRoot("lean-cold-training-manifest-v1", value) }
  expect(auditLeanTrainingVector(manifest).valid).toBe(true)
  return manifest
}
const trainings = () => [training("current")]
const unlaunched = (slot: ReturnType<typeof createLeanCurrentBaselineSchedule>["slots"][number]): LeanBaselineTerminal => ({ slotRoot: slot.root, matchRoot: null, status: "unlaunched", safeCode: "NOT_LAUNCHED", cleanupComplete: false, accountingRoot: root(`unused:${slot.id}`), replayRoot: null })
const recordsFor = (schedule: ReturnType<typeof createLeanCurrentBaselineSchedule>, failAt: string | null = null): LeanBaselineTerminal[] => {
  let stopped = false
  return schedule.slots.map((slot) => {
    if (slot.profile !== "current" || !slot.preHoldout || stopped) return unlaunched(slot)
    if (failAt && slot.id === failAt) { stopped = true; return { slotRoot: slot.root, matchRoot: root(`match:${slot.id}`), status: "system_failure", safeCode: "SYSTEM_FAILURE", cleanupComplete: true, accountingRoot: root(`accounting:${slot.id}`), replayRoot: null } }
    return { slotRoot: slot.root, matchRoot: root(`match:${slot.id}`), status: "success", safeCode: "OK", cleanupComplete: true, accountingRoot: root(`accounting:${slot.id}`), replayRoot: null }
  })
}

describe("lean baseline schedule and compact retained surface", () => {
  it("freezes the reduced matched schedule at 36 pre-holdout plus 4 reserved per profile", () => {
    const schedule = createLeanCurrentBaselineSchedule()
    expect(schedule.tier).toBe("reduced")
    expect(schedule.slots).toHaveLength(120)
    for (const profile of ["current", "inward", "bracket"]) {
      const slots = schedule.slots.filter((slot) => slot.profile === profile)
      expect(slots.filter((slot) => slot.preHoldout)).toHaveLength(36)
      expect(slots.filter((slot) => !slot.preHoldout)).toHaveLength(4)
    }
    expect(new Set(schedule.slots.map((slot) => slot.root)).size).toBe(120)
  })

  it("authenticates compact per-slot records, retains failures and denies holdout opening", () => {
    const schedule = createLeanCurrentBaselineSchedule(), training = trainings()
    const evidence = createLeanBaselineEvidence({ schedule, sourceRoot: root("frozen-current-source"), training, terminals: recordsFor(schedule, "current:response_pairing:00") })
    const verification = verifyLeanCurrentBaseline(evidence, schedule)
    expect(verification).toMatchObject({ complete: false, successfulPreHoldout: 20, failedOrMissing: 16, unusedSlots: 99, holdoutUntouched: true })
    const opened = recordsFor(schedule)
    const holdoutIndex = schedule.slots.findIndex((slot) => slot.kind === "reserved_holdout")
    opened[holdoutIndex] = { ...opened[holdoutIndex]!, slotRoot: schedule.slots[holdoutIndex]!.root, matchRoot: root("opened"), status: "success", safeCode: "OK", cleanupComplete: true, accountingRoot: root("opened-accounting"), replayRoot: null }
    expect(() => createLeanBaselineEvidence({ schedule, sourceRoot: root("frozen-current-source"), training, terminals: opened })).toThrow("LEAN_BASELINE_HOLDOUT_OPENED")
  })

  it("does not mark a 36-Match current-only run complete without a response-complete manifest", () => {
    const schedule = createLeanCurrentBaselineSchedule()
    const evidence = createLeanBaselineEvidence({ schedule, sourceRoot: root("frozen-current-source"), training: trainings(), terminals: recordsFor(schedule) })
    expect(verifyLeanCurrentBaseline(evidence, schedule)).toMatchObject({ complete: false, successfulPreHoldout: 36, failedOrMissing: 0, unusedSlots: 84, holdoutUntouched: true })
  })

  it("keeps handoff explicitly non-freezing and does not carry private payloads", () => {
    const handoff = buildLeanBaselineHandoff({ evidence: null, currentSourceRoot: root("current-source"), currentPopulationRoot: root("current-population") })
    expect(handoff).toMatchObject({ freezeEligible: false, limitation: "source_only_no_empirical_evidence" })
    expect(JSON.stringify(handoff)).not.toContain("export default")
    expect(JSON.stringify(handoff)).not.toContain("hiddenCanonicalState")
  })

  it("rejects forged schedules and caller-carried terminal payloads", () => {
    const schedule = createLeanCurrentBaselineSchedule(), training = trainings()
    expect(() => createLeanBaselineEvidence({ schedule: { ...schedule, slots: schedule.slots.slice(1) } as typeof schedule, sourceRoot: root("s"), training, terminals: recordsFor(schedule) })).toThrow("LEAN_BASELINE_EVIDENCE_INPUT")
    const records = recordsFor(schedule)
    records[0] = { ...records[0]!, error: "private payload" } as LeanBaselineTerminal
    expect(() => createLeanBaselineEvidence({ schedule, sourceRoot: root("s"), training, terminals: records })).toThrow("LEAN_BASELINE_TERMINAL_BIJECTION")
    expect(() => createLeanBaselineEvidence({ schedule, sourceRoot: root("s"), training: [training[0]!, training[0]!], terminals: recordsFor(schedule) })).toThrow("LEAN_BASELINE_EVIDENCE_INPUT")
  })

  it("rejects any inward or bracket pre-holdout terminal", () => {
    const schedule = createLeanCurrentBaselineSchedule(), terminals = recordsFor(schedule), slotIndex = schedule.slots.findIndex((slot) => slot.profile === "inward" && slot.preHoldout), slot = schedule.slots[slotIndex]!
    terminals[slotIndex] = { slotRoot: slot.root, matchRoot: root("inward-match"), status: "success", safeCode: "OK", cleanupComplete: true, accountingRoot: root("inward-accounting"), replayRoot: null }
    expect(() => createLeanBaselineEvidence({ schedule, sourceRoot: root("frozen-current-source"), training: trainings(), terminals })).toThrow("LEAN_BASELINE_NONCURRENT_LAUNCHED")
  })

  it("launches only the current arm, stops at any failure, and returns exact canonical slot order", async () => {
    const { runLeanCurrentBaseline } = await import("./v1-38-lean-baseline.js")
    const schedule = createLeanCurrentBaselineSchedule(), launched: string[] = []
    const terminals = await runLeanCurrentBaseline({ schedule, capacityBeforeCharge: async () => true, dispatchHostIssuedMatch: async (slot) => {
      launched.push(slot.id)
      const failed = launched.length === 3
      return { slotRoot: slot.root, matchRoot: root(`match:${slot.id}`), status: failed ? "player_violation" : "success", safeCode: failed ? "PLAYER_VIOLATION" : "OK", cleanupComplete: true, accountingRoot: root(`accounting:${slot.id}`), replayRoot: null }
    } })
    expect(launched).toEqual(["current:initial_training:00", "current:initial_training:01", "current:initial_training:02"])
    expect(terminals).toHaveLength(120)
    expect(terminals.map((record) => record.slotRoot)).toEqual(schedule.slots.map((slot) => slot.root))
    expect(terminals.slice(3).every((record) => record.status === "unlaunched")).toBe(true)
    expect(terminals.filter((record) => record.status === "success")).toHaveLength(2)
  })

  it("capacity refusal preserves every slot in canonical order and does not launch reserved profiles", async () => {
    const { runLeanCurrentBaseline } = await import("./v1-38-lean-baseline.js")
    const schedule = createLeanCurrentBaselineSchedule(), launched: string[] = []
    const terminals = await runLeanCurrentBaseline({ schedule, capacityBeforeCharge: async () => false, dispatchHostIssuedMatch: async (slot) => { launched.push(slot.id); return recordsFor(schedule)[0]! } })
    expect(launched).toEqual([])
    expect(terminals.map((record) => record.slotRoot)).toEqual(schedule.slots.map((slot) => slot.root))
    expect(terminals.every((record) => record.status === "unlaunched")).toBe(true)
  })
})
