import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { auditLeanTrainingVector, type LeanColdTrainingManifest } from "../../packages/strategy-lab/src/league/lean-training.js"

export type LeanBaselineCellKind = "initial_training" | "initial_matrix" | "response_training" | "response_pairing" | "probe" | "repeat" | "reserved_holdout"
export interface LeanBaselineSlot {
  readonly id: string
  readonly profile: "current" | "inward" | "bracket"
  readonly kind: LeanBaselineCellKind
  readonly ordinal: number
  readonly preHoldout: boolean
  readonly root: LabRoot
}
export interface LeanBaselineSchedule {
  readonly schemaVersion: "lean-current-baseline-schedule-v1"
  readonly tier: "reduced"
  readonly perProfile: Readonly<{ preHoldout: 36; reservedHoldout: 4; total: 40 }>
  readonly slots: readonly LeanBaselineSlot[]
  readonly root: LabRoot
}
export interface LeanBaselineTerminal {
  readonly slotRoot: LabRoot
  readonly matchRoot: LabRoot | null
  readonly status: "success" | "player_violation" | "system_failure" | "unlaunched"
  readonly safeCode: "OK" | "PLAYER_VIOLATION" | "SYSTEM_FAILURE" | "NOT_LAUNCHED"
  readonly cleanupComplete: boolean
  readonly accountingRoot: LabRoot
  readonly replayRoot: LabRoot | null
}
export interface LeanCurrentBaselineEvidence {
  readonly schemaVersion: "lean-current-baseline-evidence-v1"
  readonly scheduleRoot: LabRoot
  readonly sourceRoot: LabRoot
  readonly trainingRoots: readonly LabRoot[]
  readonly trainingStage: "initial" | "response_complete"
  readonly responseDisposition: LeanColdTrainingManifest["candidates"][number]["disposition"] | null
  readonly terminals: readonly LeanBaselineTerminal[]
  readonly launchedHoldoutSlots: 0
  readonly root: LabRoot
}
export interface LeanBaselineHandoff {
  readonly schemaVersion: "lean-current-baseline-handoff-v1"
  readonly evidenceRoot: LabRoot
  readonly currentSourceRoot: LabRoot
  readonly currentPopulationRoot: LabRoot
  readonly reducedScheduleRoot: LabRoot
  readonly freezeEligible: false
  readonly limitation: "source_only_no_empirical_evidence" | "empirical_evidence_requires_retained_verification" | "partial_or_failed_baseline"
  readonly root: LabRoot
}

const PROFILES = ["current", "inward", "bracket"] as const
const COUNTS: ReadonlyArray<readonly [LeanBaselineCellKind, number]> = [
  ["initial_training", 8], ["initial_matrix", 4], ["response_training", 8],
  ["response_pairing", 8], ["probe", 4], ["repeat", 4], ["reserved_holdout", 4],
]
const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const exactKeys = (value: unknown, keys: readonly string[]): boolean => value !== null && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child)
    Object.freeze(value)
  }
  return value
}

/** The pilot froze reduced before comparative outcomes: this constructor has no full-tier override. */
export const createLeanCurrentBaselineSchedule = (): LeanBaselineSchedule => {
  const slots: LeanBaselineSlot[] = []
  for (const profile of PROFILES) {
    for (const [kind, count] of COUNTS) for (let ordinal = 0; ordinal < count; ordinal++) {
      const id = `${profile}:${kind}:${ordinal.toString().padStart(2, "0")}`
      const preHoldout = kind !== "reserved_holdout"
      const body = { id, profile, kind, ordinal, preHoldout }
      slots.push(Object.freeze({ ...body, root: labRoot("lean-current-baseline-slot-v1", body) }))
    }
  }
  const value = { schemaVersion: "lean-current-baseline-schedule-v1" as const, tier: "reduced" as const, perProfile: Object.freeze({ preHoldout: 36 as const, reservedHoldout: 4 as const, total: 40 as const }), slots: Object.freeze(slots) }
  return freeze({ ...value, root: labRoot("lean-current-baseline-schedule-v1", value) })
}

const isCanonicalSchedule = (value: unknown): value is LeanBaselineSchedule => {
  if (!exactKeys(value, ["schemaVersion", "tier", "perProfile", "slots", "root"])) return false
  const expected = createLeanCurrentBaselineSchedule()
  if (value.schemaVersion !== expected.schemaVersion || value.tier !== expected.tier || value.root !== expected.root ||
      JSON.stringify(value.perProfile) !== JSON.stringify(expected.perProfile) || !Array.isArray(value.slots) || value.slots.length !== expected.slots.length) return false
  return value.slots.every((slot: unknown, index: number) => exactKeys(slot, ["id", "profile", "kind", "ordinal", "preHoldout", "root"]) &&
    JSON.stringify(slot) === JSON.stringify(expected.slots[index]))
}

const validTerminal = (terminal: LeanBaselineTerminal, slot: LeanBaselineSlot): boolean => exactKeys(terminal, ["slotRoot", "matchRoot", "status", "safeCode", "cleanupComplete", "accountingRoot", "replayRoot"]) &&
  terminal.slotRoot === slot.root && isRoot(terminal.accountingRoot) && typeof terminal.cleanupComplete === "boolean" &&
  (terminal.matchRoot === null || isRoot(terminal.matchRoot)) && (terminal.replayRoot === null || isRoot(terminal.replayRoot)) &&
  ((terminal.status === "success" && terminal.safeCode === "OK" && terminal.matchRoot !== null && terminal.cleanupComplete) ||
   (terminal.status === "player_violation" && terminal.safeCode === "PLAYER_VIOLATION" && terminal.matchRoot !== null && terminal.cleanupComplete) ||
   (terminal.status === "system_failure" && terminal.safeCode === "SYSTEM_FAILURE") ||
   (terminal.status === "unlaunched" && terminal.safeCode === "NOT_LAUNCHED" && terminal.matchRoot === null && !terminal.cleanupComplete))
const validCurrentLaunchPrefix = (terminals: readonly LeanBaselineTerminal[], schedule: LeanBaselineSchedule): boolean => {
  let stopped = false
  for (const [index, slot] of schedule.slots.entries()) {
    if (slot.profile !== "current" || !slot.preHoldout) continue
    const terminal = terminals[index]!
    if (stopped && terminal.status !== "unlaunched") return false
    if (terminal.status !== "success") stopped = true
  }
  return true
}

/** Builds the authenticated compact terminal ledger; never accepts invocation/source/memory/error payloads. */
export const createLeanBaselineEvidence = (input: { schedule: LeanBaselineSchedule; sourceRoot: LabRoot; training: readonly LeanColdTrainingManifest[]; terminals: readonly LeanBaselineTerminal[] }): LeanCurrentBaselineEvidence => {
  if (!exactKeys(input, ["schedule", "sourceRoot", "training", "terminals"]) || !isCanonicalSchedule(input.schedule) || !isRoot(input.sourceRoot) || !Array.isArray(input.training) || input.training.length !== 1 || input.training.some((manifest) => !auditLeanTrainingVector(manifest).valid)) return fail("EVIDENCE_INPUT")
  const slots = input.schedule.slots
  if (input.terminals.length !== slots.length || input.terminals.some((terminal, index) => !validTerminal(terminal, slots[index]!)) || input.terminals.some((terminal, index) => terminal.slotRoot !== slots[index]!.root)) return fail("TERMINAL_BIJECTION")
  if (input.terminals.some((terminal, index) => slots[index]!.kind === "reserved_holdout" && terminal.status !== "unlaunched")) return fail("HOLDOUT_OPENED")
  if (!validCurrentLaunchPrefix(input.terminals, input.schedule)) return fail("TERMINAL_STOP_ORDER")
  if (input.terminals.some((terminal, index) => (slots[index]!.profile !== "current" || !slots[index]!.preHoldout) && terminal.status !== "unlaunched")) return fail("NONCURRENT_LAUNCHED")
  const value = { schemaVersion: "lean-current-baseline-evidence-v1" as const, scheduleRoot: input.schedule.root, sourceRoot: input.sourceRoot, trainingRoots: input.training.map((manifest) => manifest.root).sort(), terminals: Object.freeze([...input.terminals]), launchedHoldoutSlots: 0 as const }
  const manifest = input.training[0]!
  const responseDisposition = manifest.stage === "response_complete" ? manifest.candidates.find((candidate) => candidate.mechanism === "response")?.disposition ?? null : null
  if (manifest.stage === "response_complete" && responseDisposition === null) return fail("RESPONSE_MANIFEST")
  const rooted = { ...value, trainingStage: manifest.stage, responseDisposition }
  return freeze({ ...rooted, root: labRoot("lean-current-baseline-evidence-v1", rooted) })
}

export const verifyLeanCurrentBaseline = (evidence: LeanCurrentBaselineEvidence, schedule: LeanBaselineSchedule): Readonly<{ complete: boolean; successfulPreHoldout: number; failedOrMissing: number; unusedSlots: number; holdoutUntouched: true; root: LabRoot }> => {
  if (!exactKeys(evidence, ["schemaVersion", "scheduleRoot", "sourceRoot", "trainingRoots", "trainingStage", "responseDisposition", "terminals", "launchedHoldoutSlots", "root"]) || !isCanonicalSchedule(schedule) || evidence.schemaVersion !== "lean-current-baseline-evidence-v1" || evidence.scheduleRoot !== schedule.root || !isRoot(evidence.sourceRoot) || !Array.isArray(evidence.trainingRoots) || evidence.trainingRoots.length !== 1 || !evidence.trainingRoots.every(isRoot) || !["initial", "response_complete"].includes(evidence.trainingStage) || (evidence.trainingStage === "initial" ? evidence.responseDisposition !== null : !["accepted_for_evaluation", "clone_rejected", "invalid_rejected", "weak_preserved"].includes(String(evidence.responseDisposition))) || evidence.launchedHoldoutSlots !== 0 || !Array.isArray(evidence.terminals) || evidence.terminals.length !== schedule.slots.length) return fail("VERIFY_JOIN")
  const { root: _discard, ...body } = evidence
  if (labRoot("lean-current-baseline-evidence-v1", body) !== evidence.root) return fail("VERIFY_ROOT")
  const terminals = evidence.terminals
  if (terminals.some((terminal, index) => !validTerminal(terminal, schedule.slots[index]!))) return fail("VERIFY_TERMINAL")
  if (terminals.some((terminal, index) => schedule.slots[index]!.kind === "reserved_holdout" && terminal.status !== "unlaunched")) return fail("VERIFY_HOLDOUT_OPENED")
  if (terminals.some((terminal, index) => (schedule.slots[index]!.profile !== "current" || !schedule.slots[index]!.preHoldout) && terminal.status !== "unlaunched")) return fail("VERIFY_NONCURRENT_LAUNCHED")
  if (!validCurrentLaunchPrefix(terminals, schedule)) return fail("VERIFY_STOP_ORDER")
  const currentSlots = schedule.slots.filter((slot) => slot.profile === "current" && slot.preHoldout)
  const currentSucceeded = terminals.filter((terminal, index) => schedule.slots[index]!.profile === "current" && schedule.slots[index]!.preHoldout && terminal.status === "success" && terminal.cleanupComplete).length
  const complete = currentSucceeded === 36 && evidence.trainingStage === "response_complete" && evidence.responseDisposition === "accepted_for_evaluation" && terminals.every((terminal, index) => {
    const slot = schedule.slots[index]!
    return slot.profile === "current" && slot.preHoldout ? terminal.status === "success" && terminal.cleanupComplete : terminal.status === "unlaunched"
  })
  const successfulPreHoldout = currentSucceeded
  const failedOrMissing = currentSlots.length - currentSucceeded
  const unusedSlots = terminals.filter((terminal) => terminal.status === "unlaunched").length
  return Object.freeze({ complete, successfulPreHoldout, failedOrMissing, unusedSlots, holdoutUntouched: true, root: labRoot("lean-current-baseline-verification-v1", { evidenceRoot: evidence.root, complete, successfulPreHoldout, failedOrMissing, unusedSlots, holdoutUntouched: true }) })
}

export const buildLeanBaselineHandoff = (input: { evidence: LeanCurrentBaselineEvidence | null; currentSourceRoot: LabRoot; currentPopulationRoot: LabRoot }): LeanBaselineHandoff => {
  if (!exactKeys(input, ["evidence", "currentSourceRoot", "currentPopulationRoot"]) || !isRoot(input.currentSourceRoot) || !isRoot(input.currentPopulationRoot)) return fail("HANDOFF_ROOT")
  const schedule = createLeanCurrentBaselineSchedule()
  const verification = input.evidence ? verifyLeanCurrentBaseline(input.evidence, schedule) : null
  const limitation = input.evidence === null ? "source_only_no_empirical_evidence" as const : verification?.complete ? "empirical_evidence_requires_retained_verification" as const : "partial_or_failed_baseline" as const
  const body = { schemaVersion: "lean-current-baseline-handoff-v1" as const, evidenceRoot: input.evidence?.root ?? labRoot("lean-baseline-no-evidence-v1", input.currentSourceRoot), currentSourceRoot: input.currentSourceRoot, currentPopulationRoot: input.currentPopulationRoot, reducedScheduleRoot: schedule.root, freezeEligible: false as const, limitation }
  return freeze({ ...body, root: labRoot("lean-current-baseline-handoff-v1", body) })
}

/** Callback seam for the trusted main entry only. This function itself performs no Match work unless invoked. */
export const runLeanCurrentBaseline = async (input: {
  schedule: LeanBaselineSchedule
  capacityBeforeCharge: (slot: LeanBaselineSlot) => Promise<boolean>
  dispatchHostIssuedMatch: (slot: LeanBaselineSlot) => Promise<LeanBaselineTerminal>
}): Promise<readonly LeanBaselineTerminal[]> => {
  if (!exactKeys(input, ["schedule", "capacityBeforeCharge", "dispatchHostIssuedMatch"]) || !isCanonicalSchedule(input.schedule) || typeof input.capacityBeforeCharge !== "function" || typeof input.dispatchHostIssuedMatch !== "function") return fail("RUN_INPUT")
  const records: LeanBaselineTerminal[] = []
  let stopped = false
  const appendUnlaunched = (slot: LeanBaselineSlot) => records.push(Object.freeze({ slotRoot: slot.root, matchRoot: null, status: "unlaunched" as const, safeCode: "NOT_LAUNCHED" as const, cleanupComplete: false, accountingRoot: labRoot("lean-baseline-unlaunched-accounting-v1", slot.root), replayRoot: null }))
  for (const slot of input.schedule.slots) {
    if (slot.profile !== "current" || !slot.preHoldout || stopped) { appendUnlaunched(slot); continue }
    if (!(await input.capacityBeforeCharge(slot))) { appendUnlaunched(slot); stopped = true; continue }
    const terminal = await input.dispatchHostIssuedMatch(slot)
    if (!validTerminal(terminal, slot)) return fail("DISPATCH_TERMINAL")
    records.push(terminal)
    if (terminal.status !== "success") stopped = true
  }
  return Object.freeze(records)
}
