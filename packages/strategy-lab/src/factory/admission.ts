import { createHash } from "node:crypto"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { runCanonicalLabMatch, type LabMatchExecution, type LabRuntimeEvidence, type LabRuntimeIdentity, type LabSupervisedProvider } from "../runtime-bridge.js"
import { FactoryCandidateSchema, FactoryOraclePacketSchema, FactoryProposalSchema, FactoryValidationEvidenceSchema, type FactoryCandidate, type FactoryDisposition, type FactoryNativeLane, type FactoryOraclePacket, type FactoryProposal, type FactoryValidationEvidence } from "./contracts.js"
import { requireIssuedFactoryIndependenceReceipt, type FactoryIndependenceReceipt } from "./fingerprint.js"
import type { FactoryRepository } from "./repository.js"
import { publishFactoryArtifact } from "./repository.js"

const fail = (): never => { throw new TypeError("FACTORY_ADMISSION") }
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail(); return admitted.canonicalBytes }
const same = (left: unknown, right: unknown) => labRoot("factory-admission-comparison-v1", left) === labRoot("factory-admission-comparison-v1", right)
const sourceAdmissions = new WeakSet<object>()
const supervisionAdmissions = new WeakSet<object>()
const issuedSupervisionReceipts = new WeakSet<object>()
const samePacketProjection = (proposal: FactoryProposal, packet: FactoryOraclePacket) =>
  proposal.packetRoot === packet.root && proposal.oracleFamily === packet.oracleFamily && proposal.doctrineFamily === packet.doctrineFamily &&
  proposal.split === packet.split && same(proposal.source, packet.source) && same(proposal.build, packet.build) &&
  same(proposal.versions, packet.versions) && same(proposal.nativeLane, packet.nativeLane) && same(proposal.lineage, packet.lineage)

export interface FactorySourceAdmission {
  readonly sourceRoot: LabRoot; readonly packetRoot: LabRoot; readonly proposalRoot: LabRoot;
  readonly nativeLane: FactoryNativeLane;
  readonly artifacts: Readonly<{ source: LabRoot; packet: LabRoot; proposal: LabRoot }>;
}
/**
 * This is deliberately not a final candidate root: fingerprints require the
 * supervised traces that this authorization permits. Packet, proposal, source,
 * and validation roots bind the exact pre-trace hostile-source path.
 */
export interface FactoryAdmission extends FactorySourceAdmission {
  readonly validationRoot: LabRoot; readonly authorizationRoot: LabRoot;
  readonly artifacts: Readonly<{ source: LabRoot; packet: LabRoot; proposal: LabRoot; validation: LabRoot }>;
}
/** Validates hostile source as bytes and records private evidence; it never evaluates source. */
export const admitFactory = (input: { packet: FactoryOraclePacket; proposal: FactoryProposal; sourceBytes: Uint8Array; repository?: FactoryRepository }): Readonly<FactorySourceAdmission> => {
  const packet = FactoryOraclePacketSchema.parse(input.packet), proposal = FactoryProposalSchema.parse(input.proposal)
  if (!(input.sourceBytes instanceof Uint8Array) || input.sourceBytes.byteLength !== proposal.source.byteLength ||
      bytesRoot(input.sourceBytes) !== proposal.source.root || !samePacketProjection(proposal, packet)) return fail()
  const artifacts = input.repository ? {
    source: publishFactoryArtifact(input.repository, input.sourceBytes), packet: publishFactoryArtifact(input.repository, canonical(packet)),
    proposal: publishFactoryArtifact(input.repository, canonical(proposal)),
  } : { source: bytesRoot(input.sourceBytes), packet: packet.root, proposal: proposal.root }
  const admission = freezeLabValue({ sourceRoot: bytesRoot(input.sourceBytes), packetRoot: packet.root, proposalRoot: proposal.root, nativeLane: proposal.nativeLane, artifacts })
  sourceAdmissions.add(admission)
  return admission
}
export const authorizeFactorySupervision = (input: { sourceAdmission: FactorySourceAdmission; validation: FactoryValidationEvidence; repository?: FactoryRepository }): Readonly<FactoryAdmission> => {
  if (!sourceAdmissions.has(input.sourceAdmission)) return fail()
  const validation = FactoryValidationEvidenceSchema.parse(input.validation), sourceAdmission = input.sourceAdmission
  if (validation.status !== "valid" || validation.proposalRoot !== sourceAdmission.proposalRoot || !same(validation.exactNativeLane, sourceAdmission.nativeLane)) return fail()
  const artifacts = {
    ...sourceAdmission.artifacts,
    validation: input.repository ? publishFactoryArtifact(input.repository, canonical(validation)) : validation.root,
  }
  const authorization = { sourceRoot: sourceAdmission.sourceRoot, packetRoot: sourceAdmission.packetRoot, proposalRoot: sourceAdmission.proposalRoot, validationRoot: validation.root, nativeLane: sourceAdmission.nativeLane }
  const admission = freezeLabValue({ ...authorization, authorizationRoot: labRoot("factory-supervision-authorization-v1", authorization), artifacts })
  supervisionAdmissions.add(admission)
  return admission
}
/** Final candidate publication is only legal after successful trace-derived supervision. */
export const finalizeFactoryCandidate = (input: { receipt: FactorySupervisionReceipt; independenceReceipt: FactoryIndependenceReceipt; candidate: FactoryCandidate; repository?: FactoryRepository }): Readonly<{ candidateRoot: LabRoot; descriptorRoot: LabRoot; artifactRoot: LabRoot; supervisionReceiptRoot: LabRoot; independenceReceiptRoot: LabRoot; independenceStatus: "unresolved" }> => {
  if (!issuedSupervisionReceipts.has(input.receipt) || mapFactorySupervision(input.receipt).disposition !== "accepted") return fail()
  let independence: Readonly<FactoryIndependenceReceipt>
  try { independence = requireIssuedFactoryIndependenceReceipt(input.independenceReceipt) } catch { return fail() }
  const candidate = FactoryCandidateSchema.parse(input.candidate)
  const admission = input.receipt.admission
  if (candidate.proposal.root !== admission.proposalRoot || candidate.validation.root !== admission.validationRoot ||
      candidate.supervisionReceiptRoot !== input.receipt.root || !same(candidate.proposal.nativeLane, admission.nativeLane) ||
      !same(candidate.lineage, candidate.proposal.lineage) || independence.proposalRoot !== candidate.proposal.root ||
      independence.validationRoot !== candidate.validation.root || independence.supervisionReceiptRoot !== input.receipt.root ||
      !same(candidate.fingerprints, independence.fingerprints)) return fail()
  const descriptorValue = { schemaVersion: "factory-candidate-publication-v1" as const, privacy: "private_offline" as const, candidate, independenceReceipt: independence, supervisionReceiptRoot: input.receipt.root, independenceStatus: independence.status }
  const descriptorRoot = labRoot("factory-candidate-publication-v1", descriptorValue)
  const descriptor = { ...descriptorValue, root: descriptorRoot }
  const artifactRoot = input.repository ? publishFactoryArtifact(input.repository, canonical(descriptor)) : descriptorRoot
  return freezeLabValue({ candidateRoot: candidate.root, descriptorRoot, artifactRoot, supervisionReceiptRoot: input.receipt.root, independenceReceiptRoot: independence.root, independenceStatus: independence.status })
}
export interface FactorySupervisionProvider extends LabSupervisedProvider {
  readonly identity: LabRuntimeIdentity & {
    readonly nativeLane: FactoryNativeLane; readonly factoryPacketRoot: LabRoot;
    readonly factoryProposalRoot: LabRoot; readonly factoryValidationRoot: LabRoot;
  };
}
export interface FactorySupervisionReceipt {
  readonly admission: FactoryAdmission; readonly candidatePlayerId: string; readonly candidateIdentity: FactorySupervisionProvider["identity"];
  readonly execution: LabMatchExecution; readonly traces: readonly FactorySupervisionTrace[]; readonly root: LabRoot;
}
export interface FactorySupervisionTrace {
  readonly root: LabRoot; readonly invocationRoot: LabRoot; readonly inputRoot: LabRoot; readonly method: "selectActivations" | "soldierBrain";
  readonly ordinal: number; readonly classification: "success" | "player_violation" | "system_failure";
  readonly requestProjection: Readonly<Record<string, unknown>>; readonly decisionProjection: Readonly<Record<string, unknown>>;
}
export interface FactoryOrderedRecordDescriptor {
  readonly count: number
  readonly root: LabRoot
}
export interface FactoryExecutionCommitment {
  readonly kind: LabMatchExecution["kind"]
  readonly transitions: FactoryOrderedRecordDescriptor
  readonly accounting: FactoryOrderedRecordDescriptor
  readonly resultEvents?: FactoryOrderedRecordDescriptor
  readonly finalStateRoot?: LabRoot
  readonly unchangedStateRoot?: LabRoot
  readonly failure?: Readonly<{ classification: "system_failure"; code: string }>
}
/**
 * Commits to arbitrarily long ordered evidence without ever canonicalizing the
 * aggregate. Each record is admitted independently and then linked by ordinal.
 */
export const deriveFactoryOrderedRecordDescriptor = (domain: string, records: readonly unknown[]): Readonly<FactoryOrderedRecordDescriptor> => {
  let chainRoot = labRoot(`${domain}-empty-v1`, { count: 0 })
  for (let ordinal = 0; ordinal < records.length; ordinal += 1) {
    const recordRoot = labRoot(`${domain}-record-v1`, records[ordinal])
    chainRoot = labRoot(`${domain}-link-v1`, { ordinal, previousRoot: chainRoot, recordRoot })
  }
  return freezeLabValue({ count: records.length, root: labRoot(`${domain}-complete-v1`, { count: records.length, chainRoot }) })
}
export const deriveFactoryExecutionCommitment = (execution: LabMatchExecution): Readonly<FactoryExecutionCommitment> => {
  const transitions = deriveFactoryOrderedRecordDescriptor("factory-supervision-transition", execution.transitions)
  const accounting = deriveFactoryOrderedRecordDescriptor("factory-supervision-accounting", execution.accounting)
  if (execution.kind === "failure") return freezeLabValue({
    kind: execution.kind,
    transitions,
    accounting,
    unchangedStateRoot: labRoot("factory-supervision-unchanged-state-v1", execution.unchangedState),
    failure: execution.failure,
  })
  return freezeLabValue({
    kind: execution.kind,
    transitions,
    accounting,
    resultEvents: deriveFactoryOrderedRecordDescriptor("factory-supervision-result-event", execution.result.events ?? []),
    finalStateRoot: labRoot("factory-supervision-final-state-v1", execution.result.state ?? null),
  })
}
const boundIdentity = (identity: FactorySupervisionProvider["identity"], admission: FactoryAdmission) =>
  identity.sourceRoot === admission.sourceRoot && identity.runtimeLimitsRoot === admission.nativeLane.runtimeProfileRoot &&
  identity.factoryPacketRoot === admission.packetRoot && identity.factoryProposalRoot === admission.proposalRoot &&
  identity.factoryValidationRoot === admission.validationRoot && same(identity.nativeLane, admission.nativeLane)
const requireBoundIdentity = (identity: FactorySupervisionProvider["identity"], admission: FactoryAdmission) => {
  if (!boundIdentity(identity, admission)) return fail()
}
const receiptRoot = (admission: FactoryAdmission, candidatePlayerId: string, candidateIdentity: FactorySupervisionProvider["identity"], execution: LabMatchExecution, traces: readonly FactorySupervisionTrace[]) =>
  labRoot("factory-supervision-receipt-v1", {
    authorizationRoot: admission.authorizationRoot,
    candidatePlayerId,
    candidateIdentity,
    execution: deriveFactoryExecutionCommitment(execution),
    traces: deriveFactoryOrderedRecordDescriptor("factory-supervision-trace", traces),
  })
const requestProjection = (request: Parameters<LabSupervisedProvider["invoke"]>[0]): Readonly<Record<string, unknown>> => {
  const input = request?.input && typeof request.input === "object" ? request.input as unknown as Record<string, unknown> : null
  if (!input) return freezeLabValue({ unavailable: true })
  if (request.kind === "selectActivations") {
    const board = input.board && typeof input.board === "object" ? input.board as Record<string, unknown> : {}
    return freezeLabValue({ phaseNumber: input.phaseNumber, roundNumber: input.roundNumber, activationCount: input.activationCount, board: { bounds: board.bounds, soldiers: board.soldiers, terrainStones: board.terrainStones }, mySoldiers: input.mySoldiers, enemySoldiers: input.enemySoldiers, initialInitiativePlayerId: input.initialInitiativePlayerId, hasInitialInitiative: input.hasInitialInitiative, roundInitiativePlayerId: input.roundInitiativePlayerId, hasRoundInitiative: input.hasRoundInitiative })
  }
  return freezeLabValue({ self: input.self, awarenessGrid: input.awarenessGrid, cycleIndex: input.cycleIndex, maxCycles: input.maxCycles, hasAdvancedThisActivation: input.hasAdvancedThisActivation })
}
const resultProjection = (method: "selectActivations" | "soldierBrain", result: LabRuntimeEvidence["result"]): { classification: FactorySupervisionTrace["classification"]; decisionProjection: Readonly<Record<string, unknown>> } => {
  if (!result.ok) return { classification: "systemFailure" in result ? "system_failure" : "player_violation", decisionProjection: freezeLabValue({}) }
  const value = result.value && typeof result.value === "object" ? result.value as Record<string, unknown> : {}
  if (method === "selectActivations") {
    const orders = Array.isArray(value.activationOrders) ? value.activationOrders.map((order) => order && typeof order === "object" ? { soldierId: (order as Record<string, unknown>).soldierId } : {}) : []
    return { classification: "success", decisionProjection: freezeLabValue({ activationOrders: orders }) }
  }
  return { classification: "success", decisionProjection: freezeLabValue({ action: value.action ?? null }) }
}
const traceFor = (request: Parameters<LabSupervisedProvider["invoke"]>[0], evidence: LabRuntimeEvidence): FactorySupervisionTrace => {
  const method: FactorySupervisionTrace["method"] = request?.kind === "selectActivations" ? "selectActivations" : "soldierBrain"
  const result = resultProjection(method, evidence.result)
  const value = { invocationRoot: evidence.invocationRoot, inputRoot: evidence.inputRoot, method, ordinal: evidence.ordinal, classification: result.classification, requestProjection: requestProjection(request), decisionProjection: result.decisionProjection }
  return freezeLabValue({ ...value, root: labRoot("factory-supervision-trace-v1", value) })
}
export const isIssuedFactorySupervisionReceipt = (receipt: FactorySupervisionReceipt): boolean => issuedSupervisionReceipts.has(receipt) && receipt.root === receiptRoot(receipt.admission, receipt.candidatePlayerId, receipt.candidateIdentity, receipt.execution, receipt.traces)
export const mapFactorySupervision = (receipt: FactorySupervisionReceipt): Readonly<{
  disposition: Extract<FactoryDisposition, "accepted" | "player_violation" | "system_failure">;
  candidateDisposition: Extract<FactoryDisposition, "accepted" | "player_violation" | "system_failure">;
  scoredAsGameplay: false; evidenceRoot: LabRoot;
}> => {
  if (!isIssuedFactorySupervisionReceipt(receipt)) return fail()
  const execution = receipt.execution
  const candidateAccounting = execution.accounting.filter((entry) => same(entry.identity, receipt.candidateIdentity))
  if (!candidateAccounting.length) return fail()
  const anySystemFailure = execution.kind === "failure" || execution.accounting.some((entry) => !entry.result.ok && "systemFailure" in entry.result)
  const anyPlayerViolation = execution.accounting.some((entry) => !entry.result.ok && !("systemFailure" in entry.result))
  const candidateViolation = candidateAccounting.some((entry) => !entry.result.ok && !("systemFailure" in entry.result))
  const disposition = anySystemFailure ? "system_failure" as const : anyPlayerViolation ? "player_violation" as const : "accepted" as const
  const candidateDisposition = anySystemFailure ? "system_failure" as const : candidateViolation ? "player_violation" as const : "accepted" as const
  return freezeLabValue({ disposition, candidateDisposition, scoredAsGameplay: false as const, evidenceRoot: labRoot("factory-supervision-evidence-v1", { receiptRoot: receipt.root, candidatePlayerId: receipt.candidatePlayerId, execution: deriveFactoryExecutionCommitment(execution) }) })
}
/**
 * The only execution seam binds the admitted source to the selected trusted
 * provider before the bridge starts and after every provider invocation.
 */
export const superviseFactory = async (
  admission: FactoryAdmission,
  candidatePlayerId: string,
  input: Parameters<typeof runCanonicalLabMatch>[0],
  run: typeof runCanonicalLabMatch = runCanonicalLabMatch,
): Promise<FactorySupervisionReceipt> => {
  if (!supervisionAdmissions.has(admission)) return fail()
  if (candidatePlayerId !== input.match.bottomPlayerId && candidatePlayerId !== input.match.topPlayerId) return fail()
  const provider = input.providers[candidatePlayerId] as FactorySupervisionProvider | undefined
  if (!provider) return fail()
  requireBoundIdentity(provider.identity, admission)
  const candidateIdentity = freezeLabValue(structuredClone(provider.identity)) as FactorySupervisionProvider["identity"]
  const candidateInvocationRoots = new Set<LabRoot>()
  const traces: FactorySupervisionTrace[] = []
  const boundProvider: FactorySupervisionProvider = {
    ...provider,
    async invoke(request, admittedRuntimeIdentity) {
      requireBoundIdentity(provider.identity, admission)
      const evidence = await provider.invoke(request, admittedRuntimeIdentity)
      requireBoundIdentity(evidence.identity as FactorySupervisionProvider["identity"], admission)
      if (!same(evidence.identity, candidateIdentity)) return fail()
      candidateInvocationRoots.add(evidence.invocationRoot)
      traces.push(traceFor(request, evidence))
      return evidence
    },
  }
  const execution = await run({ ...input, providers: { ...input.providers, [candidatePlayerId]: boundProvider } })
  const candidateAccounting = execution.accounting.filter((entry) => same(entry.identity, candidateIdentity))
  if (!candidateInvocationRoots.size || candidateAccounting.length !== candidateInvocationRoots.size ||
      candidateAccounting.some((entry) => !candidateInvocationRoots.has(entry.invocationRoot))) return fail()
  const receiptValue = { admission, candidatePlayerId, candidateIdentity, execution, traces }
  const receipt = freezeLabValue({ ...receiptValue, root: receiptRoot(admission, candidatePlayerId, candidateIdentity, execution, traces) })
  issuedSupervisionReceipts.add(receipt)
  return receipt
}
export type { LabSupervisedProvider }
