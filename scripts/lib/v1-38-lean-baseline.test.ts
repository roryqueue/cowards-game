import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { auditLeanTrainingVector, LEAN_TRAINING_VECTOR, type LeanColdTrainingManifest } from "../../packages/strategy-lab/src/league/lean-training.js"
import { deriveFactorySourceStructureRoot } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import { createLeanBaselineEvidence, createLeanCurrentBaselineSchedule, buildLeanBaselineHandoff, verifyLeanCurrentBaseline, type LeanBaselineTerminal } from "./v1-38-lean-baseline.js"

const root = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
const training = (arm: string): LeanColdTrainingManifest => {
  const source = "export default {};"
  const candidate = (mechanism: "tactical" | "teacher") => ({ mechanism, source, sourceRoot: root(source), structureRoot: deriveFactorySourceStructureRoot(new TextEncoder().encode(source)), decisionRoot: root(`${arm}:${mechanism}`), disposition: "weak_preserved" as const, trainingMatchRoots: [root(`${arm}:${mechanism}`)] })
  const value = { schemaVersion: "lean-cold-training-manifest-v1" as const, coldRoot: root(`${arm}:cold`), corpusRoot: root("common-corpus"), armRoot: root(arm), candidates: [candidate("tactical"), candidate("teacher")], vector: LEAN_TRAINING_VECTOR }
  const manifest = { ...value, root: labRoot("lean-cold-training-manifest-v1", value) }
  expect(auditLeanTrainingVector(manifest).valid).toBe(true)
  return manifest
}
const trainings = () => ["current", "inward", "bracket"].map(training)
const recordsFor = (schedule: ReturnType<typeof createLeanCurrentBaselineSchedule>, failAt: string | null = null): LeanBaselineTerminal[] => schedule.slots.map((slot) => slot.kind === "reserved_holdout"
  ? { slotRoot: slot.root, matchRoot: null, status: "unlaunched", safeCode: "NOT_LAUNCHED", cleanupComplete: false, accountingRoot: root(`reserved:${slot.id}`), replayRoot: null }
  : { slotRoot: slot.root, matchRoot: root(`match:${slot.id}`), status: slot.id === failAt ? "system_failure" : "success", safeCode: slot.id === failAt ? "SYSTEM_FAILURE" : "OK", cleanupComplete: true, accountingRoot: root(`accounting:${slot.id}`), replayRoot: null })

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
    expect(verification).toMatchObject({ complete: false, successfulPreHoldout: 107, failedOrMissing: 1, holdoutUntouched: true })
    const opened = recordsFor(schedule)
    const holdoutIndex = schedule.slots.findIndex((slot) => slot.kind === "reserved_holdout")
    opened[holdoutIndex] = { ...opened[holdoutIndex]!, slotRoot: schedule.slots[holdoutIndex]!.root, matchRoot: root("opened"), status: "success", safeCode: "OK", cleanupComplete: true, accountingRoot: root("opened-accounting"), replayRoot: null }
    expect(() => createLeanBaselineEvidence({ schedule, sourceRoot: root("frozen-current-source"), training, terminals: opened })).toThrow("LEAN_BASELINE_HOLDOUT_OPENED")
  })

  it("keeps handoff explicitly non-freezing and does not carry private payloads", () => {
    const handoff = buildLeanBaselineHandoff({ evidence: null, currentSourceRoot: root("current-source"), currentPopulationRoot: root("current-population") })
    expect(handoff).toMatchObject({ freezeEligible: false, limitation: "source_only_no_empirical_evidence" })
    expect(JSON.stringify(handoff)).not.toContain("export default")
    expect(JSON.stringify(handoff)).not.toContain("hiddenCanonicalState")
  })
})
