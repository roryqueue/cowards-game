import { createHash } from "node:crypto"
import { lstatSync, readFileSync, readdirSync } from "node:fs"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { validateStrategySource } from "@cowards/runtime-js"
import { admitFactory, type FactorySourceAdmission } from "./admission.js"
import { factoryProposalFromPacket, FactoryOraclePacketSchema, type FactoryOraclePacket } from "./contracts.js"
import { admitFrozenIntakeProtocol, blockedIntakeConfiguration, type FrozenIntakeProtocol } from "./intake-protocol.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal, validateFactoryAttemptLedger, validateFactoryAttemptStart, validateFactoryAttemptTerminal, type FactoryAttemptStart, type FactoryAttemptTerminal } from "./ledger.js"
import { publishFactoryArtifact, publishFactoryAttemptTerminal, readFactoryArtifact, recordFactoryAttemptStart, type FactoryRepository } from "./repository.js"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[a-z][a-z0-9._:-]{0,95}$/u
const fail = (code: string): never => { throw new TypeError(`INTAKE_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const isIdentifier = (value: unknown): value is string => typeof value === "string" && IDENTIFIER.test(value)
const exact = (value: unknown, keys: readonly string[]) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(), expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const rawRoot = (value: unknown, domain: string): LabRoot => {
  try {
    const encoded = JSON.stringify(value)
    return labRoot(domain, encoded === undefined ? String(value) : encoded)
  } catch { return labRoot(domain, Object.prototype.toString.call(value)) }
}
const safePacketRoot = (value: unknown): LabRoot => {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>).root : undefined
  return isRoot(candidate) ? candidate : rawRoot(value, "intake-unvalidated-packet-v1")
}
const safeProvenanceRoot = (value: unknown): LabRoot => {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>).root : undefined
  return isRoot(candidate) ? candidate : rawRoot(value, "intake-unvalidated-provenance-v1")
}

export interface IntakeProvenance {
  readonly schemaVersion: "intake-provenance-v1"
  readonly root: LabRoot
  readonly participantId: string
  readonly reviewerId: string
  readonly packetRoot: LabRoot
  readonly sourceRoot: LabRoot
  readonly builderRoot: LabRoot
  readonly toolchainRoot: LabRoot
  readonly dependencyRoot: LabRoot
  readonly runtimeRoot: LabRoot
  readonly sourceKind: "explicit-deterministic"
  readonly execution: "data-only"
  readonly liveAgent: false
  readonly complete: true
}
const provenanceKeys = ["schemaVersion", "root", "participantId", "reviewerId", "packetRoot", "sourceRoot", "builderRoot", "toolchainRoot", "dependencyRoot", "runtimeRoot", "sourceKind", "execution", "liveAgent", "complete"] as const
const withoutRoot = (value: Record<string, unknown>) => { const { root: _root, ...rest } = value; return rest }
export const deriveIntakeProvenanceRoot = (value: Omit<IntakeProvenance, "root"> | IntakeProvenance): LabRoot => labRoot("intake-provenance-v1", withoutRoot(value as unknown as Record<string, unknown>))
const admitProvenance = (value: unknown, protocol: FrozenIntakeProtocol, packetRoot: LabRoot, sourceRoot: LabRoot, reviewerId: string, packet: FactoryOraclePacket): Readonly<IntakeProvenance> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 131072 || !exact(admitted.value, provenanceKeys)) return fail("PROVENANCE")
  const provenance = admitted.value as Record<string, unknown>
  if (provenance.schemaVersion !== "intake-provenance-v1" || !isRoot(provenance.root) ||
      provenance.participantId !== protocol.participantId || provenance.reviewerId !== reviewerId || typeof provenance.reviewerId !== "string" || !protocol.reviewerIds.includes(provenance.reviewerId) ||
      provenance.packetRoot !== packetRoot || provenance.sourceRoot !== sourceRoot ||
      provenance.builderRoot !== packet.build.buildRoot || provenance.toolchainRoot !== packet.build.toolchainRoot || !isRoot(provenance.dependencyRoot) || provenance.runtimeRoot !== packet.nativeLane.runtimeProfileRoot ||
      provenance.sourceKind !== "explicit-deterministic" || provenance.execution !== "data-only" || provenance.liveAgent !== false || provenance.complete !== true ||
      provenance.root !== deriveIntakeProvenanceRoot(provenance as unknown as IntakeProvenance)) return fail("PROVENANCE")
  return freezeLabValue(provenance as unknown as IntakeProvenance)
}

const validateDeterministicSource = (sourceBytes: Uint8Array, packet: FactoryOraclePacket): void => {
  let source: string
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes) } catch { throw new TypeError("source-invalid-encoding") }
  if (source.length === 0 || source.includes("\u0000")) throw new TypeError("source-invalid-kind")
  if (packet.nativeLane.language === "typescript" || packet.nativeLane.language === "javascript") {
    const validation = validateStrategySource(source)
    if (!validation.valid) throw new TypeError("source-invalid-strategy")
  } else throw new TypeError("source-unsupported-language")
}

export interface QuarantinedIntakePacket {
  readonly protocol: FrozenIntakeProtocol
  readonly packet: FactoryOraclePacket
  readonly sourceBytes: Uint8Array
  readonly provenance: IntakeProvenance
  readonly participantId: string
  readonly reviewerId: string
  readonly elapsedMinutes: number
  readonly conflictFree: boolean
  readonly retryParentRoot?: LabRoot | null
  readonly reviewDisposition?: "accept" | "reject" | "legal_but_weak"
}
export interface QuarantinedIntakeAttemptResult {
  readonly disposition: "accepted" | "rejected" | "invalid" | "duplicate" | "legal_but_weak" | "retried"
  readonly attemptRoot: LabRoot
  readonly admission?: FactorySourceAdmission
}
export interface QuarantinedIntakeBlockedResult {
  readonly disposition: "blocked_configuration"
  readonly attemptRoot: null
  readonly artifactRoot: LabRoot
  readonly configurationRoot: LabRoot
  readonly authorized: false
  readonly allocation: "none"
  readonly admission?: never
}
export type QuarantinedIntakeResult = QuarantinedIntakeAttemptResult | QuarantinedIntakeBlockedResult

const requiredInputKeys = ["protocol", "packet", "sourceBytes", "provenance", "participantId", "reviewerId", "elapsedMinutes", "conflictFree"] as const
const optionalInputKeys = ["retryParentRoot", "reviewDisposition"] as const
const readLedger = (repository: FactoryRepository): ReadonlyArray<{ start: FactoryAttemptStart; terminal: FactoryAttemptTerminal }> => {
  const starts = new Map<string, FactoryAttemptStart>(), terminals = new Map<string, FactoryAttemptTerminal>()
  for (const name of readdirSync(repository.directory)) {
    const started = /^factory-attempt-([a-f0-9]{64})\.started\.json$/u.exec(name)
    const terminal = /^factory-attempt-([a-f0-9]{64})\.terminal\.json$/u.exec(name)
    if (!started && !terminal) {
      if (!/^factory-artifact-[a-f0-9]{64}\.bin$/u.test(name)) return fail("UNCERTAIN_LEDGER")
      continue
    }
    const path = `${repository.directory}/${name}`
    const stat = lstatSync(path)
    if (!stat.isFile() || stat.size > 262144) return fail("LEDGER")
    if (started) {
      const parsed = admitCanonicalJsonBytes(readFileSync(path), { profile: "canonical-manifest", operation: "require-canonical" })
      if (!parsed.ok) return fail("LEDGER")
      const value = validateFactoryAttemptStart(parsed.value)
      if (value.root !== `sha256:${started[1]}` || starts.has(value.root)) return fail("LEDGER_BINDING")
      starts.set(value.root, value)
    } else if (terminal) {
      const parsed = admitCanonicalJsonBytes(readFileSync(path), { profile: "canonical-manifest", operation: "require-canonical" })
      if (!parsed.ok) return fail("LEDGER")
      const value = validateFactoryAttemptTerminal(parsed.value)
      if (value.startRoot !== `sha256:${terminal[1]}` || terminals.has(value.startRoot)) return fail("LEDGER_BINDING")
      terminals.set(value.startRoot, value)
    }
  }
  if ([...starts.keys()].some((root) => !terminals.has(root)) || [...terminals.keys()].some((root) => !starts.has(root))) return fail("UNCERTAIN_LEDGER")
  return [...starts.values()].map((start) => ({ start, terminal: validateFactoryAttemptLedger(start, terminals.get(start.root)!) }))
}
const accountingRoot = (repository: FactoryRepository, value: Record<string, unknown>): LabRoot => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) return rawRoot(value, "intake-invalid-accounting-v1")
  return publishFactoryArtifact(repository, admitted.canonicalBytes)
}
const readAccounting = (repository: FactoryRepository, root: LabRoot, expected?: { readonly taskRoot: LabRoot; readonly candidateRoot: LabRoot; readonly budgetRoot: LabRoot; readonly inputRoot: LabRoot }): Record<string, unknown> => {
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, root), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return fail("ACCOUNTING")
  const value = parsed.value as Record<string, unknown>
  if (!exact(value, ["schemaVersion", "protocolRoot", "attemptOrdinal", "participantId", "reviewerId", "packetRoot", "provenanceRoot", "elapsedMinutes"]) ||
      value.schemaVersion !== "intake-accounting-v1" || !isRoot(value.protocolRoot) || typeof value.attemptOrdinal !== "number" || !Number.isSafeInteger(value.attemptOrdinal) || value.attemptOrdinal < 1 ||
      !isIdentifier(value.participantId) || !isIdentifier(value.reviewerId) || !isRoot(value.packetRoot) || !isRoot(value.provenanceRoot) ||
      !(value.elapsedMinutes === null || (typeof value.elapsedMinutes === "number" && Number.isFinite(value.elapsedMinutes) && value.elapsedMinutes >= 0)) ||
      (expected !== undefined && (value.protocolRoot !== expected.taskRoot || value.packetRoot !== expected.candidateRoot ||
        labRoot("intake-budget-attempt-v1", { protocolRoot: value.protocolRoot, attemptOrdinal: value.attemptOrdinal }) !== expected.budgetRoot ||
        labRoot("intake-input-v1", { protocolRoot: value.protocolRoot, packetRoot: value.packetRoot, provenanceRoot: value.provenanceRoot, attemptOrdinal: value.attemptOrdinal }) !== expected.inputRoot))) return fail("ACCOUNTING")
  return value
}
const terminalEvidence = (attemptRoot: LabRoot, protocolRoot: LabRoot, disposition: string, reason: string): LabRoot => labRoot("intake-terminal-evidence-v1", { attemptRoot, protocolRoot, disposition, reason })

/** Admit configuration first; with valid authority, charge before hostile packet validation. */
export const admitQuarantinedIntakePacket = (input: QuarantinedIntakePacket, repository: FactoryRepository): Readonly<QuarantinedIntakeResult> => {
  let protocol: Readonly<FrozenIntakeProtocol>
  try { protocol = admitFrozenIntakeProtocol(input?.protocol) }
  catch {
    // No valid protocol means no budget or participant authority. Retain only
    // the coarse configuration refusal, without reading source or allocating.
    const blocked = blockedIntakeConfiguration("incomplete_protocol")
    const encoded = admitCanonicalJsonValue(blocked, { profile: "canonical-manifest" })
    if (!encoded.ok) return fail("BLOCKED_CONFIGURATION")
    const artifactRoot = publishFactoryArtifact(repository, encoded.canonicalBytes)
    return freezeLabValue({ disposition: "blocked_configuration", attemptRoot: null, artifactRoot, configurationRoot: blocked.root, authorized: false, allocation: "none" })
  }
  const packetRoot = safePacketRoot(input?.packet), prior = readLedger(repository)
  const scopedIntake = prior.filter((record) => record.start.authoringMechanism === "external-submission" && record.start.taskRoot === protocol.root)
  const attemptOrdinal = scopedIntake.length + 1
  const priorAccounting = scopedIntake.map((record) => ({ record, accounting: readAccounting(repository, record.start.resourceAccountingRoot, { taskRoot: record.start.taskRoot, candidateRoot: record.start.candidateRoot, budgetRoot: record.start.budgetRoot, inputRoot: record.start.inputRoot }) }))
  const priorOrdinals = priorAccounting.map(({ accounting }) => accounting.attemptOrdinal as number)
  if (priorAccounting.some(({ accounting }) => accounting.elapsedMinutes === null) || new Set(priorOrdinals).size !== priorOrdinals.length || priorOrdinals.some((ordinal) => ordinal < 1 || ordinal > scopedIntake.length) || new Set(Array.from({ length: scopedIntake.length }, (_, index) => index + 1)).size !== new Set(priorOrdinals).size) return fail("ACCOUNTING_UNCERTAIN")
  const provenanceRoot = safeProvenanceRoot(input?.provenance)
  const participantId = typeof input?.participantId === "string" ? input.participantId : "invalid-participant"
  const reviewerId = typeof input?.reviewerId === "string" ? input.reviewerId : "invalid-reviewer"
  const elapsedMinutes = input?.elapsedMinutes
  const retryParentRoot = input?.retryParentRoot === undefined || input?.retryParentRoot === null
    ? null
    : isRoot(input.retryParentRoot) ? input.retryParentRoot : rawRoot(input.retryParentRoot, "intake-invalid-retry-v1")
  const accounting = accountingRoot(repository, {
    schemaVersion: "intake-accounting-v1", protocolRoot: protocol.root, attemptOrdinal, participantId, reviewerId, packetRoot, provenanceRoot,
    elapsedMinutes: typeof elapsedMinutes === "number" && Number.isFinite(elapsedMinutes) ? elapsedMinutes : null,
  })
  const attempt = createFactoryAttemptStart({
    taskRoot: protocol.root,
    budgetRoot: labRoot("intake-budget-attempt-v1", { protocolRoot: protocol.root, attemptOrdinal }),
    candidateRoot: packetRoot,
    authoringMechanism: "external-submission",
    inputRoot: labRoot("intake-input-v1", { protocolRoot: protocol.root, packetRoot, provenanceRoot, attemptOrdinal }),
    resourceAccountingRoot: accounting,
    retryParentRoot,
  })
  recordFactoryAttemptStart(repository, attempt)
  let disposition: QuarantinedIntakeAttemptResult["disposition"] = "invalid", reason = "invalid-input"
  let admission: FactorySourceAdmission | undefined
  try {
    const inputObject = input as unknown as Record<string, unknown>
    if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(inputObject).some((key) => ![...requiredInputKeys, ...optionalInputKeys].includes(key as never)) ||
        requiredInputKeys.some((key) => !Object.prototype.hasOwnProperty.call(inputObject, key)) || !(input.sourceBytes instanceof Uint8Array) || !isIdentifier(input.participantId) || !isIdentifier(input.reviewerId) ||
        input.participantId !== protocol.participantId || !protocol.reviewerIds.includes(input.reviewerId) || typeof input.elapsedMinutes !== "number" ||
        !Number.isFinite(input.elapsedMinutes) || input.elapsedMinutes < 0 || input.elapsedMinutes > protocol.timeLimitMinutes || typeof input.conflictFree !== "boolean" ||
        (input.retryParentRoot !== undefined && input.retryParentRoot !== null && !isRoot(input.retryParentRoot)) ||
        (input.reviewDisposition !== undefined && !["accept", "reject", "legal_but_weak"].includes(input.reviewDisposition))) throw new TypeError("invalid-input")
    if (input.retryParentRoot !== undefined && input.retryParentRoot !== null) {
      if (!scopedIntake.some((record) => record.start.root === input.retryParentRoot && record.start.candidateRoot === packetRoot)) throw new TypeError("invalid-retry")
      disposition = "retried"; reason = "declared-retry"; throw new TypeError("terminal")
    }
    const packet = FactoryOraclePacketSchema.parse(input.packet)
    admitProvenance(input.provenance, protocol, packet.root, packet.source.root, input.reviewerId, packet)
    if (input.sourceBytes.byteLength !== packet.source.byteLength || byteRoot(input.sourceBytes) !== packet.source.root) throw new TypeError("source-invalid")
    validateDeterministicSource(input.sourceBytes, packet)
    if (scopedIntake.some((record) => record.start.candidateRoot === packet.root)) { disposition = "duplicate"; reason = "packet-already-retained"; throw new TypeError("terminal") }
    const reviewerUses = priorAccounting.filter(({ accounting }) => accounting.reviewerId === input.reviewerId).length
    const accepted = priorAccounting.filter(({ record }) => record.terminal.disposition === "accepted").length
    const elapsedTotal = priorAccounting.reduce((total, { accounting }) => total + (typeof accounting.elapsedMinutes === "number" ? accounting.elapsedMinutes : 0), 0)
    const used = priorAccounting.length
    if (used >= protocol.submissionLimit || used >= protocol.reviewerLimit || reviewerUses >= protocol.reviewerReuseLimit || accepted >= protocol.acceptanceBudget || elapsedTotal + input.elapsedMinutes > protocol.timeLimitMinutes) {
      disposition = "rejected"; reason = "budget-exhausted"; throw new TypeError("terminal")
    }
    if (!input.conflictFree) { disposition = "rejected"; reason = "conflict-declared"; throw new TypeError("terminal") }
    if (input.reviewDisposition === "reject") { disposition = "rejected"; reason = "review-rejected"; throw new TypeError("terminal") }
    if (input.reviewDisposition === "legal_but_weak") { disposition = "legal_but_weak"; reason = "review-weak"; throw new TypeError("terminal") }
    if (input.reviewDisposition !== "accept") { disposition = "rejected"; reason = "review-required"; throw new TypeError("terminal") }
    admission = admitFactory({ packet, proposal: factoryProposalFromPacket(packet), sourceBytes: new Uint8Array(input.sourceBytes), repository })
    disposition = "accepted"; reason = "common-admission"
  } catch (error) {
    if (!(error instanceof TypeError && error.message === "terminal")) {
      if (disposition === "accepted") { disposition = "invalid"; reason = "common-admission-failed" }
      else if (disposition === "invalid") reason = error instanceof Error ? error.message : "invalid-input"
    }
  }
  const evidence = terminalEvidence(attempt.root, protocol.root, disposition, reason)
  const terminal = createFactoryAttemptTerminal({ startRoot: attempt.root, disposition, outputRoot: admission?.proposalRoot ?? evidence, validationRoot: protocol.root, duplicateEvidenceRoot: evidence, finalEvidenceRoot: evidence })
  publishFactoryAttemptTerminal(repository, attempt, terminal)
  return freezeLabValue({ disposition, attemptRoot: attempt.root, ...(admission ? { admission } : {}) })
}

/**
 * Reconstructs a previously accepted intake admission from immutable retained
 * facts. This never allocates, charges, or publishes a second ledger record.
 */
export const reopenAcceptedQuarantinedIntakePacket = (input: QuarantinedIntakePacket, repository: FactoryRepository): Readonly<FactorySourceAdmission> => {
  const protocol = admitFrozenIntakeProtocol(input?.protocol)
  const packet = FactoryOraclePacketSchema.parse(input?.packet)
  if (!(input?.sourceBytes instanceof Uint8Array) || input.sourceBytes.byteLength !== packet.source.byteLength || byteRoot(input.sourceBytes) !== packet.source.root || input.participantId !== protocol.participantId || !protocol.reviewerIds.includes(input.reviewerId) || typeof input.elapsedMinutes !== "number" || !Number.isFinite(input.elapsedMinutes) || input.elapsedMinutes < 0 || input.elapsedMinutes > protocol.timeLimitMinutes || input.conflictFree !== true || input.reviewDisposition !== "accept" || (input.retryParentRoot !== undefined && input.retryParentRoot !== null)) return fail("REOPEN_INPUT")
  const admittedProvenance = admitProvenance(input.provenance, protocol, packet.root, packet.source.root, input.reviewerId, packet)
  validateDeterministicSource(input.sourceBytes, packet)
  const proposal = factoryProposalFromPacket(packet)
  const matches = readLedger(repository).filter(({ start, terminal }) => start.authoringMechanism === "external-submission" && start.taskRoot === protocol.root && start.candidateRoot === packet.root && terminal.disposition === "accepted" && terminal.outputRoot === proposal.root)
  if (matches.length !== 1) return fail("REOPEN_LEDGER")
  const { start } = matches[0]!
  const accounting = readAccounting(repository, start.resourceAccountingRoot, { taskRoot: start.taskRoot, candidateRoot: start.candidateRoot, budgetRoot: start.budgetRoot, inputRoot: start.inputRoot })
  if (accounting.participantId !== input.participantId || accounting.reviewerId !== input.reviewerId || accounting.provenanceRoot !== admittedProvenance.root || accounting.elapsedMinutes !== input.elapsedMinutes) return fail("REOPEN_ACCOUNTING")
  return admitFactory({ packet, proposal, sourceBytes: new Uint8Array(input.sourceBytes), repository })
}
