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

const validTerminal = (terminal: LeanBaselineTerminal, slot: LeanBaselineSlot): boolean => terminal.slotRoot === slot.root && isRoot(terminal.accountingRoot) &&
  (terminal.matchRoot === null || isRoot(terminal.matchRoot)) && (terminal.replayRoot === null || isRoot(terminal.replayRoot)) &&
  ((terminal.status === "success" && terminal.safeCode === "OK" && terminal.matchRoot !== null && terminal.cleanupComplete) ||
   (terminal.status === "player_violation" && terminal.safeCode === "PLAYER_VIOLATION" && terminal.matchRoot !== null && terminal.cleanupComplete) ||
   (terminal.status === "system_failure" && terminal.safeCode === "SYSTEM_FAILURE" && terminal.cleanupComplete) ||
   (terminal.status === "unlaunched" && terminal.safeCode === "NOT_LAUNCHED" && terminal.matchRoot === null && !terminal.cleanupComplete))

/** Builds the authenticated compact terminal ledger; never accepts invocation/source/memory/error payloads. */
export const createLeanBaselineEvidence = (input: { schedule: LeanBaselineSchedule; sourceRoot: LabRoot; training: readonly LeanColdTrainingManifest[]; terminals: readonly LeanBaselineTerminal[] }): LeanCurrentBaselineEvidence => {
  if (input.schedule.tier !== "reduced" || !isRoot(input.sourceRoot) || input.training.length !== 3 || new Set(input.training.map((manifest) => manifest.armRoot)).size !== 3 || input.training.some((manifest) => !auditLeanTrainingVector(manifest).valid)) return fail("EVIDENCE_INPUT")
  const slots = input.schedule.slots
  if (input.terminals.length !== slots.length || input.terminals.some((terminal, index) => !validTerminal(terminal, slots[index]!)) || input.terminals.some((terminal, index) => terminal.slotRoot !== slots[index]!.root)) return fail("TERMINAL_BIJECTION")
  if (input.terminals.some((terminal, index) => slots[index]!.kind === "reserved_holdout" && terminal.status !== "unlaunched")) return fail("HOLDOUT_OPENED")
  const value = { schemaVersion: "lean-current-baseline-evidence-v1" as const, scheduleRoot: input.schedule.root, sourceRoot: input.sourceRoot, trainingRoots: input.training.map((manifest) => manifest.root).sort(), terminals: Object.freeze([...input.terminals]), launchedHoldoutSlots: 0 as const }
  return freeze({ ...value, root: labRoot("lean-current-baseline-evidence-v1", value) })
}

export const verifyLeanCurrentBaseline = (evidence: LeanCurrentBaselineEvidence, schedule: LeanBaselineSchedule): Readonly<{ complete: boolean; successfulPreHoldout: number; failedOrMissing: number; holdoutUntouched: true; root: LabRoot }> => {
  if (!evidence || evidence.schemaVersion !== "lean-current-baseline-evidence-v1" || evidence.scheduleRoot !== schedule.root || evidence.launchedHoldoutSlots !== 0 || evidence.terminals.length !== schedule.slots.length) return fail("VERIFY_JOIN")
  const { root: _discard, ...body } = evidence
  if (labRoot("lean-current-baseline-evidence-v1", body) !== evidence.root) return fail("VERIFY_ROOT")
  const terminals = evidence.terminals
  if (terminals.some((terminal, index) => !validTerminal(terminal, schedule.slots[index]!)) || terminals.some((terminal, index) => schedule.slots[index]!.kind === "reserved_holdout" && terminal.status !== "unlaunched")) return fail("VERIFY_TERMINAL")
  const complete = terminals.every((terminal, index) => schedule.slots[index]!.kind === "reserved_holdout" ? terminal.status === "unlaunched" : terminal.status === "success" && terminal.cleanupComplete)
  const successfulPreHoldout = terminals.filter((terminal, index) => schedule.slots[index]!.preHoldout && terminal.status === "success" && terminal.cleanupComplete).length
  const failedOrMissing = terminals.filter((terminal, index) => schedule.slots[index]!.preHoldout && terminal.status !== "success").length
  return Object.freeze({ complete, successfulPreHoldout, failedOrMissing, holdoutUntouched: true, root: labRoot("lean-current-baseline-verification-v1", { evidenceRoot: evidence.root, complete, successfulPreHoldout, failedOrMissing, holdoutUntouched: true }) })
}

export const buildLeanBaselineHandoff = (input: { evidence: LeanCurrentBaselineEvidence | null; currentSourceRoot: LabRoot; currentPopulationRoot: LabRoot }): LeanBaselineHandoff => {
  if (!isRoot(input.currentSourceRoot) || !isRoot(input.currentPopulationRoot)) return fail("HANDOFF_ROOT")
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
  const records: LeanBaselineTerminal[] = []
  for (const slot of input.schedule.slots.filter((entry) => entry.preHoldout)) {
    if (!(await input.capacityBeforeCharge(slot))) {
      for (const remaining of input.schedule.slots.slice(records.length, input.schedule.slots.filter((entry) => entry.preHoldout).length)) records.push(Object.freeze({ slotRoot: remaining.root, matchRoot: null, status: "unlaunched", safeCode: "NOT_LAUNCHED", cleanupComplete: false, accountingRoot: labRoot("lean-baseline-unlaunched-accounting-v1", remaining.root), replayRoot: null }))
      break
    }
    const terminal = await input.dispatchHostIssuedMatch(slot)
    if (terminal.slotRoot !== slot.root || terminal.status === "unlaunched") return fail("DISPATCH_TERMINAL")
    records.push(terminal)
  }
  for (const slot of input.schedule.slots.filter((entry) => !entry.preHoldout)) records.push(Object.freeze({ slotRoot: slot.root, matchRoot: null, status: "unlaunched", safeCode: "NOT_LAUNCHED", cleanupComplete: false, accountingRoot: labRoot("lean-baseline-reserved-accounting-v1", slot.root), replayRoot: null }))
  return Object.freeze(records)
}
