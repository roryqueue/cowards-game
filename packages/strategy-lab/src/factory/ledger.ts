import { admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, type LabRoot } from "../contracts.js"
import { deriveFactoryAttemptRoot } from "./identity.js"
import type { FactoryDisposition } from "./contracts.js"

type RecordValue = Record<string, unknown>
const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const mechanism = (value: unknown) => value === "automated-oracle" || value === "human-submission" || value === "external-submission"
const fail = (): never => { throw new TypeError("FACTORY_ATTEMPT_LEDGER") }
const canonical = <T>(value: unknown, check: (value: RecordValue) => T): Readonly<T> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144 || admitted.value === null || typeof admitted.value !== "object" || Array.isArray(admitted.value)) return fail()
  return freezeLabValue(check(admitted.value as RecordValue))
}
export interface FactoryAttemptStart { schemaVersion: "factory-attempt-start-v1"; privacy: "private_offline"; root: LabRoot; taskRoot: LabRoot; budgetRoot: LabRoot; candidateRoot: LabRoot; authoringMechanism: "automated-oracle" | "human-submission" | "external-submission"; inputRoot: LabRoot; resourceAccountingRoot: LabRoot; retryParentRoot: LabRoot | null }
export interface FactoryAttemptTerminal { schemaVersion: "factory-attempt-terminal-v1"; privacy: "private_offline"; root: LabRoot; startRoot: LabRoot; disposition: FactoryDisposition; outputRoot: LabRoot | null; validationRoot: LabRoot; duplicateEvidenceRoot: LabRoot; finalEvidenceRoot: LabRoot }
const startKeys = ["schemaVersion", "privacy", "root", "taskRoot", "budgetRoot", "candidateRoot", "authoringMechanism", "inputRoot", "resourceAccountingRoot", "retryParentRoot"] as const
const terminalKeys = ["schemaVersion", "privacy", "root", "startRoot", "disposition", "outputRoot", "validationRoot", "duplicateEvidenceRoot", "finalEvidenceRoot"] as const
const exact = (value: RecordValue, keys: readonly string[]) => exactLabKeys(value, keys)
export const validateFactoryAttemptStart = (value: unknown): Readonly<FactoryAttemptStart> => canonical(value, (entry) => {
  if (!exact(entry, startKeys) || entry.schemaVersion !== "factory-attempt-start-v1" || entry.privacy !== "private_offline" || ![entry.root, entry.taskRoot, entry.budgetRoot, entry.candidateRoot, entry.inputRoot, entry.resourceAccountingRoot].every(root) || !mechanism(entry.authoringMechanism) || !(entry.retryParentRoot === null || root(entry.retryParentRoot)) || entry.root !== deriveFactoryAttemptRoot(entry)) return fail()
  return entry as unknown as FactoryAttemptStart
})
export const validateFactoryAttemptTerminal = (value: unknown): Readonly<FactoryAttemptTerminal> => canonical(value, (entry) => {
  const dispositions: readonly FactoryDisposition[] = ["accepted", "rejected", "invalid", "duplicate", "legal_but_weak", "retried", "player_violation", "system_failure"]
  if (!exact(entry, terminalKeys) || entry.schemaVersion !== "factory-attempt-terminal-v1" || entry.privacy !== "private_offline" || ![entry.root, entry.startRoot, entry.validationRoot, entry.duplicateEvidenceRoot, entry.finalEvidenceRoot].every(root) || !dispositions.includes(entry.disposition as FactoryDisposition) || !(entry.outputRoot === null || root(entry.outputRoot)) || (entry.disposition === "system_failure" && entry.outputRoot !== null) || (entry.disposition !== "system_failure" && entry.outputRoot === null) || entry.root !== deriveFactoryAttemptRoot(entry)) return fail()
  return entry as unknown as FactoryAttemptTerminal
})
export const createFactoryAttemptStart = (value: Omit<FactoryAttemptStart, "schemaVersion" | "privacy" | "root">): Readonly<FactoryAttemptStart> => {
  const draft = { schemaVersion: "factory-attempt-start-v1" as const, privacy: "private_offline" as const, root: "sha256:" as LabRoot, ...value }
  return validateFactoryAttemptStart({ ...draft, root: deriveFactoryAttemptRoot(draft) })
}
export const createFactoryAttemptTerminal = (value: Omit<FactoryAttemptTerminal, "schemaVersion" | "privacy" | "root">): Readonly<FactoryAttemptTerminal> => {
  const draft = { schemaVersion: "factory-attempt-terminal-v1" as const, privacy: "private_offline" as const, root: "sha256:" as LabRoot, ...value }
  return validateFactoryAttemptTerminal({ ...draft, root: deriveFactoryAttemptRoot(draft) })
}
/** A terminal is comparable only to its exact, immutable charge record. */
export const validateFactoryAttemptLedger = (start: unknown, terminal: unknown): Readonly<FactoryAttemptTerminal> => {
  const charged = validateFactoryAttemptStart(start), final = validateFactoryAttemptTerminal(terminal)
  if (final.startRoot !== charged.root) return fail()
  return final
}
