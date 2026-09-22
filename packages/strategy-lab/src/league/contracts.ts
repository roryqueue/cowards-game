import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { FactoryCandidateSchema, type FactoryCandidate } from "../factory/contracts.js"
import { validateFactoryAttemptLedger, type FactoryAttemptStart, type FactoryAttemptTerminal } from "../factory/ledger.js"
import type { LabMatchExecution } from "../runtime-bridge.js"
import { readFactoryArtifact, type FactoryRepository } from "../factory/repository.js"
import { readFactorySupervisionArtifactRecords } from "../factory/supervision-artifacts.js"
import { deriveFactoryOrderedRecordDescriptor } from "../factory/admission.js"
import { classifyNumericComparison, freezeNumericCalibrationThreshold, type NumericComparison, type NumericControlTable } from "../factory/numeric-calibration.js"

type RecordValue = Record<string, unknown>
const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code = "ENVELOPE_INVALID"): never => { throw new TypeError(`LEAGUE_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is RecordValue => exactLabKeys(value, keys)
const text = (value: unknown, max = 128): value is string => typeof value === "string" && value.length > 0 && value.length <= max
const nonNegative = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
/** Keep the historical root for admissible arrays. Only oversized private
 * aggregates use an ordinal-bound, domain-separated commitment. */
export const deriveLeagueResultEventRoot = (events: readonly unknown[]): LabRoot => {
  const admitted = admitCanonicalJsonValue(["cowards:strategy-lab:v1", "league-result-events-v1", events], { profile: "canonical-manifest" })
  if (admitted.ok) return labRoot("league-result-events-v1", events)
  if (!["MAX_NODES_EXCEEDED", "MAX_RAW_UTF8_BYTES_EXCEEDED"].includes(admitted.error.code)) return fail("RESULT_EVENTS")
  return deriveFactoryOrderedRecordDescriptor("league-result-events-v2", events).root
}
const withoutRoot = (value: unknown): unknown => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !("root" in value)) fail("ROOTED_VALUE")
  const { root: _root, ...rest } = value as RecordValue
  return rest
}
const selfRoot = (domain: string, value: unknown): LabRoot => labRoot(domain, withoutRoot(value))
const canonical = <T>(value: unknown, validate: (value: RecordValue) => T): Readonly<T> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (admitted.ok) {
    const admittedValue = admitted.value
    if (admitted.canonicalByteLength > 262144 || admittedValue === null || typeof admittedValue !== "object" || Array.isArray(admittedValue)) fail("CANONICAL_VALUE")
    return freezeLabValue(validate(admittedValue as RecordValue))
  }
  return fail("CANONICAL_VALUE")
}
const rootedSchema = <T>(domain: string, keys: readonly string[], validate: (value: RecordValue) => T) => Object.freeze({
  parse(value: unknown): Readonly<T> {
    return canonical(value, (entry) => {
      if (!exact(entry, keys) || !root(entry.root) || entry.root !== selfRoot(domain, entry)) fail("ROOT")
      return validate(entry)
    })
  },
  safeParse(value: unknown) { try { return { success: true as const, data: this.parse(value) } } catch { return { success: false as const, error: new TypeError("LEAGUE_ENVELOPE_INVALID") } } },
})
const sortedUniqueRoots = (value: unknown, minimum = 1): readonly LabRoot[] => {
  if (!Array.isArray(value) || value.length < minimum || !value.every(root)) fail("ROOT_LIST")
  const roots = value as readonly LabRoot[], ordered = [...roots].sort()
  if (!ordered.every((entry, index) => entry === roots[index]) || new Set(ordered).size !== ordered.length) fail("ROOT_LIST")
  return roots
}

export type LeagueTerminalDisposition = "success" | "player_violation" | "system_failure" | "rejected" | "duplicate" | "legal_but_weak" | "invalid" | "retried" | "unresolved" | "unfilled" | "unused"
export type LeagueProcessValidity = "process_valid" | "process_invalid"
const TERMINALS: readonly LeagueTerminalDisposition[] = ["success", "player_violation", "system_failure", "rejected", "duplicate", "legal_but_weak", "invalid", "retried", "unresolved", "unfilled", "unused"]
export interface LeagueCandidateIssuer { /** Host-owned issuance/repository validation, never a serialized `issued` claim. */ verifyCandidate(candidate: FactoryCandidate): boolean }
export interface LeagueImportEvidence { sourcePhase: 264; publicationArtifactRoot: LabRoot; supervisionArtifactRoot: LabRoot; assessmentArtifactRoot: LabRoot; assessmentRoot: LabRoot; thresholdArtifactRoot: LabRoot; sourceSlot: string; qualification: "base_distinct" | "control_or_unresolved" }
export interface LeagueProductionEvidence { allocationRoot: LabRoot; redTeamStartRoot: LabRoot; authoringArtifactRoot: LabRoot }
export interface LeagueCandidateAdmission { schemaVersion: "league-candidate-admission-v1" | "league-candidate-import-v1" | "league-candidate-production-v1"; privacy: "private_offline"; root: LabRoot; candidate: FactoryCandidate; supervisionReceiptRoot: LabRoot; fingerprintRoot: LabRoot; lineageRoot: LabRoot; tupleRoot: LabRoot; runtimeRoot: LabRoot; provenanceRoot: LabRoot; attemptStart: FactoryAttemptStart; attemptTerminal: FactoryAttemptTerminal; importEvidence?: LeagueImportEvidence; productionEvidence?: LeagueProductionEvidence }
const candidateKeys = ["schemaVersion", "privacy", "root", "candidate", "supervisionReceiptRoot", "fingerprintRoot", "lineageRoot", "tupleRoot", "runtimeRoot", "provenanceRoot", "attemptStart", "attemptTerminal"] as const
const LegacyLeagueCandidateAdmissionSchema = rootedSchema<LeagueCandidateAdmission>("league-candidate-admission-v1", candidateKeys, (v) => {
  if (v.schemaVersion !== "league-candidate-admission-v1" || v.privacy !== "private_offline" || ![v.supervisionReceiptRoot, v.fingerprintRoot, v.lineageRoot, v.tupleRoot, v.runtimeRoot, v.provenanceRoot].every(root)) fail("CANDIDATE_EVIDENCE")
  const candidate = FactoryCandidateSchema.parse(v.candidate), start = v.attemptStart as FactoryAttemptStart, terminal = validateFactoryAttemptLedger(start, v.attemptTerminal)
  if (terminal.disposition !== "accepted" || start.candidateRoot !== candidate.root || candidate.supervisionReceiptRoot !== v.supervisionReceiptRoot || v.fingerprintRoot !== labRoot("factory-fingerprint-roots-v1", candidate.fingerprints) || v.lineageRoot !== labRoot("factory-lineage-v1", candidate.lineage) || v.tupleRoot !== candidate.proposal.build.compatibilityTupleRoot || v.runtimeRoot !== candidate.proposal.nativeLane.runtimeProfileRoot) fail("CANDIDATE_EVIDENCE")
  return v as unknown as LeagueCandidateAdmission
})
const ImportedLeagueCandidateAdmissionSchema = rootedSchema<LeagueCandidateAdmission>("league-candidate-import-v1", [...candidateKeys, "importEvidence"], (v) => {
  const candidate = FactoryCandidateSchema.parse(v.candidate), start = v.attemptStart as FactoryAttemptStart, terminal = validateFactoryAttemptLedger(start, v.attemptTerminal), evidence = v.importEvidence as LeagueImportEvidence
  if (v.schemaVersion !== "league-candidate-import-v1" || v.privacy !== "private_offline" || !exact(evidence, ["sourcePhase", "publicationArtifactRoot", "supervisionArtifactRoot", "assessmentArtifactRoot", "assessmentRoot", "thresholdArtifactRoot", "sourceSlot", "qualification"]) || evidence.sourcePhase !== 264 || ![evidence.publicationArtifactRoot, evidence.supervisionArtifactRoot, evidence.assessmentArtifactRoot, evidence.assessmentRoot, evidence.thresholdArtifactRoot, v.provenanceRoot].every(root) || !/^S(?:0[1-9]|1[0-2])$/u.test(evidence.sourceSlot) || !["base_distinct", "control_or_unresolved"].includes(evidence.qualification) || !["accepted", "unresolved"].includes(terminal.disposition) || terminal.outputRoot !== evidence.supervisionArtifactRoot || start.candidateRoot !== candidate.proposal.packetRoot || candidate.supervisionReceiptRoot !== v.supervisionReceiptRoot || v.fingerprintRoot !== labRoot("factory-fingerprint-roots-v1", candidate.fingerprints) || v.lineageRoot !== labRoot("factory-lineage-v1", candidate.lineage) || v.tupleRoot !== candidate.proposal.build.compatibilityTupleRoot || v.runtimeRoot !== candidate.proposal.nativeLane.runtimeProfileRoot) fail("IMPORT_EVIDENCE")
  return v as unknown as LeagueCandidateAdmission
})
const ProducedLeagueCandidateAdmissionSchema = rootedSchema<LeagueCandidateAdmission>("league-candidate-production-v1", [...candidateKeys, "productionEvidence"], (v) => {
  const candidate = FactoryCandidateSchema.parse(v.candidate), start = v.attemptStart as FactoryAttemptStart, terminal = validateFactoryAttemptLedger(start, v.attemptTerminal), evidence = v.productionEvidence as LeagueProductionEvidence
  if (v.schemaVersion !== "league-candidate-production-v1" || v.privacy !== "private_offline" || !exact(evidence, ["allocationRoot", "redTeamStartRoot", "authoringArtifactRoot"]) || !Object.values(evidence).every(root) || start.taskRoot !== evidence.allocationRoot || start.budgetRoot !== evidence.allocationRoot || start.resourceAccountingRoot !== evidence.redTeamStartRoot || start.candidateRoot !== start.inputRoot || terminal.disposition !== "accepted" || terminal.outputRoot !== candidate.root || terminal.validationRoot !== candidate.validation.root || terminal.finalEvidenceRoot !== evidence.authoringArtifactRoot || candidate.supervisionReceiptRoot !== v.supervisionReceiptRoot || v.fingerprintRoot !== labRoot("factory-fingerprint-roots-v1", candidate.fingerprints) || v.lineageRoot !== labRoot("factory-lineage-v1", candidate.lineage) || v.tupleRoot !== candidate.proposal.build.compatibilityTupleRoot || v.runtimeRoot !== candidate.proposal.nativeLane.runtimeProfileRoot || !root(v.provenanceRoot)) fail("PRODUCTION_EVIDENCE")
  return v as unknown as LeagueCandidateAdmission
})
export const LeagueCandidateAdmissionSchema = Object.freeze({
  parse(value: unknown): Readonly<LeagueCandidateAdmission> { if (value && typeof value === "object" && "schemaVersion" in value) { if (value.schemaVersion === "league-candidate-import-v1") return ImportedLeagueCandidateAdmissionSchema.parse(value); if (value.schemaVersion === "league-candidate-production-v1") return ProducedLeagueCandidateAdmissionSchema.parse(value) }; return LegacyLeagueCandidateAdmissionSchema.parse(value) },
  safeParse(value: unknown) { try { return { success: true as const, data: this.parse(value) } } catch { return { success: false as const, error: new TypeError("LEAGUE_CANDIDATE_EVIDENCE") } } },
})

/** Historical evidence import is deliberately separate from Phase 265 execution authority.
 * The host verifier must replay the complete retained assessment without writes or dispatch. */
export const importAssessedFactoryCandidate = (input: { repository: FactoryRepository; publicationArtifactRoot: LabRoot; supervisionArtifactRoot: LabRoot; assessmentArtifactRoot: LabRoot; attemptStart: FactoryAttemptStart; attemptTerminal: FactoryAttemptTerminal; maxBytes: number; maxRecords: number; verifyRetainedAssessment: (repository: FactoryRepository, artifactRoot: LabRoot) => { status: string; assessmentRoot: LabRoot; thresholdArtifactRoot: LabRoot | null } }): Readonly<LeagueCandidateAdmission> => {
  const read = (artifact: LabRoot): RecordValue => { const parsed = admitCanonicalJsonBytes(readFactoryArtifact(input.repository, artifact), { profile: "canonical-manifest", operation: "require-canonical" }); if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return fail("IMPORT_BYTES"); return parsed.value as RecordValue }
  const verified = input.verifyRetainedAssessment(input.repository, input.assessmentArtifactRoot), assessment = read(input.assessmentArtifactRoot)
  if (verified.status !== "affirmed" || !verified.thresholdArtifactRoot || verified.assessmentRoot !== assessment.root || assessment.root !== labRoot(String(assessment.schemaVersion), withoutRoot(assessment)) || assessment.status !== "affirmed" || assessment.thresholdArtifactRoot !== verified.thresholdArtifactRoot || !Array.isArray(assessment.reasons) || assessment.reasons.length) return fail("IMPORT_ASSESSMENT")
  const assessmentInput = assessment.input as { candidateArtifactRoots?: unknown; supervisionArtifactRoots?: unknown; terminalRoots?: unknown }
  if (!Array.isArray(assessmentInput?.candidateArtifactRoots) || !assessmentInput.candidateArtifactRoots.includes(input.publicationArtifactRoot) || !Array.isArray(assessmentInput.supervisionArtifactRoots) || !assessmentInput.supervisionArtifactRoots.includes(input.supervisionArtifactRoot) || !Array.isArray(assessmentInput.terminalRoots) || !assessmentInput.terminalRoots.includes(input.attemptTerminal.root)) return fail("IMPORT_MEMBERSHIP")
  const publication = read(input.publicationArtifactRoot), candidate = FactoryCandidateSchema.parse(publication.candidate)
  if (publication.schemaVersion !== "factory-candidate-publication-v1" || publication.root !== labRoot("factory-candidate-publication-v1", withoutRoot(publication)) || publication.supervisionReceiptRoot !== candidate.supervisionReceiptRoot) return fail("IMPORT_PUBLICATION")
  const retained = readFactorySupervisionArtifactRecords(input.repository, input.supervisionArtifactRoot, { maxBytes: input.maxBytes, maxRecords: input.maxRecords }), metadata = retained.records.find((entry) => entry.kind === "receipt")!.value as RecordValue, identity = metadata.candidateIdentity as RecordValue, admission = metadata.admission as RecordValue
  if (retained.descriptor.receiptRoot !== candidate.supervisionReceiptRoot || identity.sourceRoot !== candidate.proposal.source.root || identity.attemptRoot !== input.attemptStart.root || identity.budgetRoot !== input.attemptStart.budgetRoot || admission.sourceRoot !== candidate.proposal.source.root || admission.proposalRoot !== candidate.proposal.root || admission.validationRoot !== candidate.validation.root || admission.packetRoot !== candidate.proposal.packetRoot || retained.records.find((entry) => entry.kind === "execution")?.value && (retained.records.find((entry) => entry.kind === "execution")!.value as RecordValue).kind !== "completed") return fail("IMPORT_SUPERVISION")
  const threshold = read(verified.thresholdArtifactRoot), sources = threshold.sourceRoots
  if (threshold.root !== labRoot(String(threshold.schemaVersion), withoutRoot(threshold)) || threshold.manifestRoot !== assessment.manifestRoot || threshold.allocationRoot !== assessment.allocationRoot || !Array.isArray(sources) || sources.length !== 12) return fail("IMPORT_THRESHOLD")
  const sourceIndex = sources.indexOf(candidate.proposal.source.root)
  if (sourceIndex < 0 || sources.lastIndexOf(candidate.proposal.source.root) !== sourceIndex) return fail("IMPORT_SOURCE")
  const sourceSlot = `S${String(sourceIndex + 1).padStart(2, "0")}`, fit = freezeNumericCalibrationThreshold(threshold.controls as NumericControlTable)
  if (fit.status !== "frozen" || labRoot("league-threshold-compare-v1", fit.threshold) !== labRoot("league-threshold-compare-v1", threshold.threshold)) return fail("IMPORT_THRESHOLD")
  const edges = assessment.baseEdges as Record<string, NumericComparison>, required = ["S01/S03", "S01/S05", "S03/S05"].filter((edge) => edge.split("/").includes(sourceSlot))
  const qualification = required.length === 2 && required.every((edge) => edges[edge] && classifyNumericComparison(edges[edge]!, fit.threshold) === "distinct") ? "base_distinct" as const : "control_or_unresolved" as const
  const importEvidence: LeagueImportEvidence = { sourcePhase: 264, publicationArtifactRoot: input.publicationArtifactRoot, supervisionArtifactRoot: input.supervisionArtifactRoot, assessmentArtifactRoot: input.assessmentArtifactRoot, assessmentRoot: verified.assessmentRoot, thresholdArtifactRoot: verified.thresholdArtifactRoot, sourceSlot, qualification }
  const value = { schemaVersion: "league-candidate-import-v1" as const, privacy: "private_offline" as const, candidate, supervisionReceiptRoot: candidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: candidate.proposal.build.compatibilityTupleRoot, runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot, provenanceRoot: labRoot("league-import-provenance-v1", importEvidence), attemptStart: input.attemptStart, attemptTerminal: input.attemptTerminal, importEvidence }
  return ImportedLeagueCandidateAdmissionSchema.parse({ ...value, root: labRoot("league-candidate-import-v1", value) })
}
export const admitLeagueCandidate = (issuer: LeagueCandidateIssuer, value: unknown): Readonly<LeagueCandidateAdmission> => {
  if (!issuer || typeof issuer.verifyCandidate !== "function") fail("CANDIDATE_ISSUER")
  const admitted = LeagueCandidateAdmissionSchema.parse(value)
  if (!issuer.verifyCandidate(admitted.candidate)) fail("CANDIDATE_UNISSUED")
  return admitted
}
export const createLeagueCandidateAdmission = (v: Omit<LeagueCandidateAdmission, "schemaVersion" | "privacy" | "root">): Readonly<LeagueCandidateAdmission> => create(LeagueCandidateAdmissionSchema, "league-candidate-admission-v1", "league-candidate-admission-v1", v)
export const createLeagueProducedCandidateAdmission = (v: Omit<LeagueCandidateAdmission, "schemaVersion" | "privacy" | "root" | "importEvidence"> & { productionEvidence: LeagueProductionEvidence }): Readonly<LeagueCandidateAdmission> => create(ProducedLeagueCandidateAdmissionSchema, "league-candidate-production-v1", "league-candidate-production-v1", v)

export interface LeaguePopulation { schemaVersion: "league-population-v1"; privacy: "private_offline"; root: LabRoot; candidateAdmissionRoots: readonly LabRoot[]; studyPolicyRoot: LabRoot; measurementPolicyRoot: LabRoot }
export const LeaguePopulationSchema = rootedSchema<LeaguePopulation>("league-population-v1", ["schemaVersion", "privacy", "root", "candidateAdmissionRoots", "studyPolicyRoot", "measurementPolicyRoot"], (v) => { if (v.schemaVersion !== "league-population-v1" || v.privacy !== "private_offline" || !root(v.studyPolicyRoot) || !root(v.measurementPolicyRoot)) fail("POPULATION"); sortedUniqueRoots(v.candidateAdmissionRoots, 2); return v as unknown as LeaguePopulation })
export const createLeaguePopulation = (v: Omit<LeaguePopulation, "schemaVersion" | "privacy" | "root">): Readonly<LeaguePopulation> => create(LeaguePopulationSchema, "league-population-v1", "league-population-v1", v)

export interface LeagueCell { schemaVersion: "league-cell-v1"; privacy: "private_offline"; root: LabRoot; populationRoot: LabRoot; pairRoot: LabRoot; entrantCandidateRoot: LabRoot; opponentCandidateRoot: LabRoot; conditionRoot: LabRoot; semanticGeometryHash: LabRoot; tupleRoot: LabRoot; runtimeRoot: LabRoot; requestRoot: LabRoot }
export const LeagueCellSchema = rootedSchema<LeagueCell>("league-cell-v1", ["schemaVersion", "privacy", "root", "populationRoot", "pairRoot", "entrantCandidateRoot", "opponentCandidateRoot", "conditionRoot", "semanticGeometryHash", "tupleRoot", "runtimeRoot", "requestRoot"], (v) => { if (v.schemaVersion !== "league-cell-v1" || v.privacy !== "private_offline" || ![v.populationRoot, v.pairRoot, v.entrantCandidateRoot, v.opponentCandidateRoot, v.conditionRoot, v.semanticGeometryHash, v.tupleRoot, v.runtimeRoot, v.requestRoot].every(root) || v.entrantCandidateRoot === v.opponentCandidateRoot) fail("CELL"); return v as unknown as LeagueCell })
export const createLeagueCell = (v: Omit<LeagueCell, "schemaVersion" | "privacy" | "root">): Readonly<LeagueCell> => create(LeagueCellSchema, "league-cell-v1", "league-cell-v1", v)

export interface LeaguePayoffProjection { schemaVersion: "league-payoff-projection-v1"; privacy: "private_offline"; root: LabRoot; cellRoot: LabRoot; outcomeRoot: LabRoot; resultEventRoot: LabRoot; entrantCandidateRoot: LabRoot; conditionRoot: LabRoot; semanticGeometryHash: LabRoot; halfPoints: 0 | 1 | 2 }
export const LeaguePayoffProjectionSchema = rootedSchema<LeaguePayoffProjection>("league-payoff-projection-v1", ["schemaVersion", "privacy", "root", "cellRoot", "outcomeRoot", "resultEventRoot", "entrantCandidateRoot", "conditionRoot", "semanticGeometryHash", "halfPoints"], (v) => { if (v.schemaVersion !== "league-payoff-projection-v1" || v.privacy !== "private_offline" || ![v.cellRoot, v.outcomeRoot, v.resultEventRoot, v.entrantCandidateRoot, v.conditionRoot, v.semanticGeometryHash].every(root) || ![0, 1, 2].includes(v.halfPoints as number)) fail("PAYOFF"); return v as unknown as LeaguePayoffProjection })
const outcomeFromExecution = (execution: LabMatchExecution, bottomPlayerId: string, topPlayerId: string) => {
  if (!execution || execution.kind !== "completed" || execution.privacy !== "private_offline") fail("OUTCOME_NOT_COMPLETED")
  const completed = execution as Extract<LabMatchExecution, { kind: "completed" }>
  const events = completed.result.events
  if (!Array.isArray(events) || !events.length) fail("OUTCOME_EVENTS")
  const terminal = events.filter((event: unknown) => event && typeof event === "object" && (event as RecordValue).type === "MATCH_ENDED")
  if (terminal.length !== 1 || terminal[0] !== events[events.length - 1]) fail("OUTCOME_EVENTS")
  const payload = (terminal[0] as unknown as RecordValue).payload
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !exact(payload, (payload as RecordValue).type === "DRAW" ? ["type"] : ["type", "winnerPlayerId"])) fail("OUTCOME_PAYLOAD")
  const state = completed.result.state as unknown as RecordValue | undefined
  const outcome = state?.outcome
  if (!outcome || typeof outcome !== "object" || Array.isArray(outcome) || labRoot("league-canonical-outcome-v1", outcome) !== labRoot("league-canonical-outcome-v1", payload)) fail("OUTCOME_STATE")
  const value = outcome as RecordValue
  if (value.type === "DRAW" && exact(value, ["type"])) return { outcomeRoot: labRoot("league-canonical-outcome-v1", value), resultEventRoot: deriveLeagueResultEventRoot(events), winner: null as string | null }
  if (value.type === "WIN" && exact(value, ["type", "winnerPlayerId"]) && typeof value.winnerPlayerId === "string" && (value.winnerPlayerId === bottomPlayerId || value.winnerPlayerId === topPlayerId)) return { outcomeRoot: labRoot("league-canonical-outcome-v1", value), resultEventRoot: deriveLeagueResultEventRoot(events), winner: value.winnerPlayerId }
  return fail("OUTCOME_PAYLOAD")
}
export const projectCanonicalKernelOutcomeToEntrantHalfPoints = (v: { execution: LabMatchExecution; entrantCandidateRoot: LabRoot; bottomCandidateRoot: LabRoot; topCandidateRoot: LabRoot; bottomPlayerId: string; topPlayerId: string; cellRoot: LabRoot; conditionRoot: LabRoot; semanticGeometryHash: LabRoot; resultEventRoot: LabRoot }): Readonly<LeaguePayoffProjection> => {
  if (!exact(v, ["execution", "entrantCandidateRoot", "bottomCandidateRoot", "topCandidateRoot", "bottomPlayerId", "topPlayerId", "cellRoot", "conditionRoot", "semanticGeometryHash", "resultEventRoot"]) || ![v.entrantCandidateRoot, v.bottomCandidateRoot, v.topCandidateRoot, v.cellRoot, v.conditionRoot, v.semanticGeometryHash, v.resultEventRoot].every(root) || !text(v.bottomPlayerId) || !text(v.topPlayerId) || v.bottomPlayerId === v.topPlayerId || (v.entrantCandidateRoot !== v.bottomCandidateRoot && v.entrantCandidateRoot !== v.topCandidateRoot)) fail("PAYOFF_BINDING")
  const outcome = outcomeFromExecution(v.execution, v.bottomPlayerId, v.topPlayerId)
  if (outcome.resultEventRoot !== v.resultEventRoot) fail("RESULT_EVENT_ROOT")
  const entrant = v.entrantCandidateRoot === v.bottomCandidateRoot ? v.bottomPlayerId : v.topPlayerId
  const halfPoints: 0 | 1 | 2 = outcome.winner === null ? 1 : outcome.winner === entrant ? 2 : 0
  return create(LeaguePayoffProjectionSchema, "league-payoff-projection-v1", "league-payoff-projection-v1", { cellRoot: v.cellRoot, outcomeRoot: outcome.outcomeRoot, resultEventRoot: v.resultEventRoot, entrantCandidateRoot: v.entrantCandidateRoot, conditionRoot: v.conditionRoot, semanticGeometryHash: v.semanticGeometryHash, halfPoints })
}

export interface LeagueCellTerminal { schemaVersion: "league-cell-terminal-v1"; privacy: "private_offline"; root: LabRoot; cellRoot: LabRoot; disposition: LeagueTerminalDisposition; processValidity: LeagueProcessValidity; evidenceRoot: LabRoot; projection: LeaguePayoffProjection | null }
export const LeagueCellTerminalSchema = rootedSchema<LeagueCellTerminal>("league-cell-terminal-v1", ["schemaVersion", "privacy", "root", "cellRoot", "disposition", "processValidity", "evidenceRoot", "projection"], (v) => { const success = v.disposition === "success"; if (v.schemaVersion !== "league-cell-terminal-v1" || v.privacy !== "private_offline" || !root(v.cellRoot) || !root(v.evidenceRoot) || !TERMINALS.includes(v.disposition as LeagueTerminalDisposition) || !["process_valid", "process_invalid"].includes(String(v.processValidity)) || success !== (v.processValidity === "process_valid") || success !== (v.projection !== null) || (success && LeaguePayoffProjectionSchema.parse(v.projection).cellRoot !== v.cellRoot)) fail("TERMINAL"); return v as unknown as LeagueCellTerminal })
export const createLeagueCellTerminal = (v: Omit<LeagueCellTerminal, "schemaVersion" | "privacy" | "root">): Readonly<LeagueCellTerminal> => create(LeagueCellTerminalSchema, "league-cell-terminal-v1", "league-cell-terminal-v1", v)

export interface CompletePayoffSnapshot { schemaVersion: "league-payoff-snapshot-v1"; privacy: "private_offline"; root: LabRoot; populationRoot: LabRoot; cellChunkRoots: readonly LabRoot[]; solverPayoffRoot: LabRoot; expectedCellCount: number; completedCellCount: number }
export const CompletePayoffSnapshotSchema = rootedSchema<CompletePayoffSnapshot>("league-payoff-snapshot-v1", ["schemaVersion", "privacy", "root", "populationRoot", "cellChunkRoots", "solverPayoffRoot", "expectedCellCount", "completedCellCount"], (v) => { if (v.schemaVersion !== "league-payoff-snapshot-v1" || v.privacy !== "private_offline" || !root(v.populationRoot) || !root(v.solverPayoffRoot) || !nonNegative(v.expectedCellCount) || v.expectedCellCount < 1 || v.completedCellCount !== v.expectedCellCount) fail("SNAPSHOT"); sortedUniqueRoots(v.cellChunkRoots); return v as unknown as CompletePayoffSnapshot })
export const createCompletePayoffSnapshot = (v: Omit<CompletePayoffSnapshot, "schemaVersion" | "privacy" | "root">): Readonly<CompletePayoffSnapshot> => create(CompletePayoffSnapshotSchema, "league-payoff-snapshot-v1", "league-payoff-snapshot-v1", v)

export interface LeagueSolverManifest { schemaVersion: "league-solver-manifest-v1"; privacy: "private_offline"; root: LabRoot; snapshotRoot: LabRoot; algorithmRoot: LabRoot; numericPolicyRoot: LabRoot; resourcePolicyRoot: LabRoot }
export interface LeagueSolverOutput { schemaVersion: "league-solver-output-v1"; privacy: "private_offline"; root: LabRoot; manifestRoot: LabRoot; snapshotRoot: LabRoot; distributionRoot: LabRoot; diagnosticsRoot: LabRoot }
export interface LeagueRound { schemaVersion: "league-round-v1"; privacy: "private_offline"; root: LabRoot; priorSnapshotRoot: LabRoot; solverOutputRoot: LabRoot; targetRoot: LabRoot; responseAllocationRoot: LabRoot }
export interface LeagueResponseAdmission { schemaVersion: "league-response-admission-v1"; privacy: "private_offline"; root: LabRoot; roundRoot: LabRoot; candidateAdmissionRoot: LabRoot; noveltyRoot: LabRoot; validationRoot: LabRoot; disposition: LeagueTerminalDisposition }
export interface LeagueResourceBounds { maxMatches: number; maxAttempts: number; maxRuntimeMilliseconds: number; maxModelTokens: number; maxHumanSubmissions: number; maxExternalSubmissions: number; retryBurnPolicyRoot: LabRoot; materialDependenceRoot: LabRoot }
export interface LeagueAllocation { schemaVersion: "league-allocation-v1"; privacy: "private_offline"; root: LabRoot; allocationKind: "matrix" | "response" | "red_team"; policyRoot: LabRoot; bounds: LeagueResourceBounds; channelRoot: LabRoot }
export interface LeagueAttempt { schemaVersion: "league-attempt-v1"; privacy: "private_offline"; root: LabRoot; allocationRoot: LabRoot; ordinal: number; disposition: LeagueTerminalDisposition; evidenceRoot: LabRoot; retryParentRoot: LabRoot | null }
export interface LeagueMixture { schemaVersion: "league-mixture-v1"; privacy: "private_offline"; root: LabRoot; solverOutputRoot: LabRoot; weightRoot: LabRoot; snapshotRoot: LabRoot }
export interface LeaguePortfolio { schemaVersion: "league-portfolio-v1"; privacy: "private_offline"; root: LabRoot; candidateAdmissionRoots: readonly LabRoot[]; diversityReceiptRoot: LabRoot; mixtureRoot: LabRoot }
export interface RobustPureDisposition { schemaVersion: "league-robust-pure-disposition-v1"; privacy: "private_offline"; root: LabRoot; portfolioRoot: LabRoot; kind: "robust_pure_finalist" | "no_robust_pure_finalist_found"; candidateAdmissionRoot: LabRoot | null; gateReceiptRoots: readonly LabRoot[] }
export interface LeagueReportDescriptor { schemaVersion: "league-report-descriptor-v1"; privacy: "private_offline"; root: LabRoot; snapshotRoot: LabRoot; solverOutputRoot: LabRoot; redTeamRoot: LabRoot; portfolioRoot: LabRoot; finalistDispositionRoot: LabRoot; reportChunkRoots: readonly LabRoot[] }

const onlyRoots = (v: RecordValue, keys: readonly string[]) => { if (!keys.every((key) => root(v[key]))) fail("DEPENDENCY_ROOT") }
const simple = <T>(domain: string, keys: readonly string[], validate: (v: RecordValue) => void) => rootedSchema<T>(domain, keys, (v) => { validate(v); return v as T })
export const LeagueSolverManifestSchema = simple<LeagueSolverManifest>("league-solver-manifest-v1", ["schemaVersion", "privacy", "root", "snapshotRoot", "algorithmRoot", "numericPolicyRoot", "resourcePolicyRoot"], (v) => { if (v.schemaVersion !== "league-solver-manifest-v1" || v.privacy !== "private_offline") fail("SOLVER_MANIFEST"); onlyRoots(v, ["snapshotRoot", "algorithmRoot", "numericPolicyRoot", "resourcePolicyRoot"]) })
export const LeagueSolverOutputSchema = simple<LeagueSolverOutput>("league-solver-output-v1", ["schemaVersion", "privacy", "root", "manifestRoot", "snapshotRoot", "distributionRoot", "diagnosticsRoot"], (v) => { if (v.schemaVersion !== "league-solver-output-v1" || v.privacy !== "private_offline") fail("SOLVER_OUTPUT"); onlyRoots(v, ["manifestRoot", "snapshotRoot", "distributionRoot", "diagnosticsRoot"]) })
export const LeagueRoundSchema = simple<LeagueRound>("league-round-v1", ["schemaVersion", "privacy", "root", "priorSnapshotRoot", "solverOutputRoot", "targetRoot", "responseAllocationRoot"], (v) => { if (v.schemaVersion !== "league-round-v1" || v.privacy !== "private_offline") fail("ROUND"); onlyRoots(v, ["priorSnapshotRoot", "solverOutputRoot", "targetRoot", "responseAllocationRoot"]) })
export const LeagueResponseAdmissionSchema = simple<LeagueResponseAdmission>("league-response-admission-v1", ["schemaVersion", "privacy", "root", "roundRoot", "candidateAdmissionRoot", "noveltyRoot", "validationRoot", "disposition"], (v) => { if (v.schemaVersion !== "league-response-admission-v1" || v.privacy !== "private_offline" || !TERMINALS.includes(v.disposition as LeagueTerminalDisposition)) fail("RESPONSE"); onlyRoots(v, ["roundRoot", "candidateAdmissionRoot", "noveltyRoot", "validationRoot"]) })
const bounds = (v: unknown): LeagueResourceBounds => { if (!exact(v, ["maxMatches", "maxAttempts", "maxRuntimeMilliseconds", "maxModelTokens", "maxHumanSubmissions", "maxExternalSubmissions", "retryBurnPolicyRoot", "materialDependenceRoot"]) || !["maxMatches", "maxAttempts", "maxRuntimeMilliseconds", "maxModelTokens", "maxHumanSubmissions", "maxExternalSubmissions"].every((key) => nonNegative((v as RecordValue)[key])) || !root((v as RecordValue).retryBurnPolicyRoot) || !root((v as RecordValue).materialDependenceRoot)) fail("RESOURCE_BOUNDS"); return v as LeagueResourceBounds }
export const LeagueAllocationSchema = simple<LeagueAllocation>("league-allocation-v1", ["schemaVersion", "privacy", "root", "allocationKind", "policyRoot", "bounds", "channelRoot"], (v) => { if (v.schemaVersion !== "league-allocation-v1" || v.privacy !== "private_offline" || !["matrix", "response", "red_team"].includes(String(v.allocationKind))) fail("ALLOCATION"); onlyRoots(v, ["policyRoot", "channelRoot"]); bounds(v.bounds) })
export const LeagueAttemptSchema = simple<LeagueAttempt>("league-attempt-v1", ["schemaVersion", "privacy", "root", "allocationRoot", "ordinal", "disposition", "evidenceRoot", "retryParentRoot"], (v) => { if (v.schemaVersion !== "league-attempt-v1" || v.privacy !== "private_offline" || !root(v.allocationRoot) || !root(v.evidenceRoot) || !nonNegative(v.ordinal) || !(v.retryParentRoot === null || root(v.retryParentRoot)) || !TERMINALS.includes(v.disposition as LeagueTerminalDisposition)) fail("ATTEMPT") })
export const LeagueMixtureSchema = simple<LeagueMixture>("league-mixture-v1", ["schemaVersion", "privacy", "root", "solverOutputRoot", "weightRoot", "snapshotRoot"], (v) => { if (v.schemaVersion !== "league-mixture-v1" || v.privacy !== "private_offline") fail("MIXTURE"); onlyRoots(v, ["solverOutputRoot", "weightRoot", "snapshotRoot"]) })
export const LeaguePortfolioSchema = simple<LeaguePortfolio>("league-portfolio-v1", ["schemaVersion", "privacy", "root", "candidateAdmissionRoots", "diversityReceiptRoot", "mixtureRoot"], (v) => { if (v.schemaVersion !== "league-portfolio-v1" || v.privacy !== "private_offline" || !root(v.diversityReceiptRoot) || !root(v.mixtureRoot)) fail("PORTFOLIO"); sortedUniqueRoots(v.candidateAdmissionRoots) })
export const RobustPureDispositionSchema = simple<RobustPureDisposition>("league-robust-pure-disposition-v1", ["schemaVersion", "privacy", "root", "portfolioRoot", "kind", "candidateAdmissionRoot", "gateReceiptRoots"], (v) => { if (v.schemaVersion !== "league-robust-pure-disposition-v1" || v.privacy !== "private_offline" || !root(v.portfolioRoot) || !["robust_pure_finalist", "no_robust_pure_finalist_found"].includes(String(v.kind)) || !(v.candidateAdmissionRoot === null || root(v.candidateAdmissionRoot)) || (v.kind === "robust_pure_finalist") !== (v.candidateAdmissionRoot !== null)) fail("FINALIST"); sortedUniqueRoots(v.gateReceiptRoots) })
export const LeagueReportDescriptorSchema = simple<LeagueReportDescriptor>("league-report-descriptor-v1", ["schemaVersion", "privacy", "root", "snapshotRoot", "solverOutputRoot", "redTeamRoot", "portfolioRoot", "finalistDispositionRoot", "reportChunkRoots"], (v) => { if (v.schemaVersion !== "league-report-descriptor-v1" || v.privacy !== "private_offline") fail("REPORT"); onlyRoots(v, ["snapshotRoot", "solverOutputRoot", "redTeamRoot", "portfolioRoot", "finalistDispositionRoot"]); sortedUniqueRoots(v.reportChunkRoots) })
const create = <T>(schema: { parse(value: unknown): Readonly<T> }, domain: string, schemaVersion: string, value: Record<string, unknown>): Readonly<T> => { const draft = { schemaVersion, privacy: "private_offline", root: "sha256:" as LabRoot, ...value }; return schema.parse({ ...draft, root: selfRoot(domain, draft) }) }
export const createLeagueSolverManifest = (v: Omit<LeagueSolverManifest, "schemaVersion" | "privacy" | "root">) => create(LeagueSolverManifestSchema, "league-solver-manifest-v1", "league-solver-manifest-v1", v)
export const createLeagueSolverOutput = (v: Omit<LeagueSolverOutput, "schemaVersion" | "privacy" | "root">) => create(LeagueSolverOutputSchema, "league-solver-output-v1", "league-solver-output-v1", v)
export const createLeagueRound = (v: Omit<LeagueRound, "schemaVersion" | "privacy" | "root">) => create(LeagueRoundSchema, "league-round-v1", "league-round-v1", v)
export const createLeagueResponseAdmission = (v: Omit<LeagueResponseAdmission, "schemaVersion" | "privacy" | "root">) => create(LeagueResponseAdmissionSchema, "league-response-admission-v1", "league-response-admission-v1", v)
export const createLeagueAllocation = (v: Omit<LeagueAllocation, "schemaVersion" | "privacy" | "root">) => create(LeagueAllocationSchema, "league-allocation-v1", "league-allocation-v1", v)
export const createLeagueAttempt = (v: Omit<LeagueAttempt, "schemaVersion" | "privacy" | "root">) => create(LeagueAttemptSchema, "league-attempt-v1", "league-attempt-v1", v)
export const createLeagueMixture = (v: Omit<LeagueMixture, "schemaVersion" | "privacy" | "root">) => create(LeagueMixtureSchema, "league-mixture-v1", "league-mixture-v1", v)
export const createLeaguePortfolio = (v: Omit<LeaguePortfolio, "schemaVersion" | "privacy" | "root">) => create(LeaguePortfolioSchema, "league-portfolio-v1", "league-portfolio-v1", v)
export const createRobustPureDisposition = (v: Omit<RobustPureDisposition, "schemaVersion" | "privacy" | "root">) => create(RobustPureDispositionSchema, "league-robust-pure-disposition-v1", "league-robust-pure-disposition-v1", v)
export const createLeagueReportDescriptor = (v: Omit<LeagueReportDescriptor, "schemaVersion" | "privacy" | "root">) => create(LeagueReportDescriptorSchema, "league-report-descriptor-v1", "league-report-descriptor-v1", v)
