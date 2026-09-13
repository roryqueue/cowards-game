import { createHash } from "node:crypto"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { runCanonicalLabMatch, type LabMatchExecution, type LabRuntimeIdentity, type LabSupervisedProvider } from "../runtime-bridge.js"
import { FactoryCandidateSchema, FactoryOraclePacketSchema, FactoryProposalSchema, FactoryValidationEvidenceSchema, type FactoryCandidate, type FactoryDisposition, type FactoryNativeLane, type FactoryOraclePacket, type FactoryProposal, type FactoryValidationEvidence } from "./contracts.js"
import type { FactoryRepository } from "./repository.js"
import { publishFactoryArtifact } from "./repository.js"

const fail = (): never => { throw new TypeError("FACTORY_ADMISSION") }
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail(); return admitted.canonicalBytes }
const same = (left: unknown, right: unknown) => labRoot("factory-admission-comparison-v1", left) === labRoot("factory-admission-comparison-v1", right)
const sourceAdmissions = new WeakSet<object>()
const supervisionAdmissions = new WeakSet<object>()
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
/** Final candidate publication is only legal after trace-derived fingerprints have been attached. */
export const finalizeFactoryCandidate = (input: { admission: FactoryAdmission; candidate: FactoryCandidate; repository?: FactoryRepository }): Readonly<{ candidateRoot: LabRoot; artifactRoot: LabRoot }> => {
  if (!supervisionAdmissions.has(input.admission)) return fail()
  const candidate = FactoryCandidateSchema.parse(input.candidate)
  if (candidate.proposal.root !== input.admission.proposalRoot || candidate.validation.root !== input.admission.validationRoot ||
      !same(candidate.proposal.nativeLane, input.admission.nativeLane) || !same(candidate.lineage, candidate.proposal.lineage)) return fail()
  const artifactRoot = input.repository ? publishFactoryArtifact(input.repository, canonical(candidate)) : candidate.root
  return freezeLabValue({ candidateRoot: candidate.root, artifactRoot })
}
export interface FactorySupervisionProvider extends LabSupervisedProvider {
  readonly identity: LabRuntimeIdentity & {
    readonly nativeLane: FactoryNativeLane; readonly factoryPacketRoot: LabRoot;
    readonly factoryProposalRoot: LabRoot; readonly factoryValidationRoot: LabRoot;
  };
}
export interface FactorySupervisionReceipt {
  readonly admission: FactoryAdmission; readonly execution: LabMatchExecution; readonly root: LabRoot;
}
const boundIdentity = (identity: FactorySupervisionProvider["identity"], admission: FactoryAdmission) =>
  identity.sourceRoot === admission.sourceRoot && identity.runtimeLimitsRoot === admission.nativeLane.runtimeProfileRoot &&
  identity.factoryPacketRoot === admission.packetRoot && identity.factoryProposalRoot === admission.proposalRoot &&
  identity.factoryValidationRoot === admission.validationRoot && same(identity.nativeLane, admission.nativeLane)
const requireBoundIdentity = (identity: FactorySupervisionProvider["identity"], admission: FactoryAdmission) => {
  if (!boundIdentity(identity, admission)) return fail()
}
const receiptRoot = (admission: FactoryAdmission, execution: LabMatchExecution) =>
  labRoot("factory-supervision-receipt-v1", { authorizationRoot: admission.authorizationRoot, execution })
export const mapFactorySupervision = (receipt: FactorySupervisionReceipt): Readonly<{ disposition: Extract<FactoryDisposition, "accepted" | "player_violation" | "system_failure">; scoredAsGameplay: false; evidenceRoot: LabRoot }> => {
  if (receipt.root !== receiptRoot(receipt.admission, receipt.execution)) return fail()
  const execution = receipt.execution
  const disposition = execution.kind === "failure" ? "system_failure" as const : execution.accounting.some((entry) => !entry.result.ok && !("systemFailure" in entry.result)) ? "player_violation" as const : "accepted" as const
  return freezeLabValue({ disposition, scoredAsGameplay: false as const, evidenceRoot: labRoot("factory-supervision-evidence-v1", execution) })
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
  const provider = input.providers[candidatePlayerId] as FactorySupervisionProvider | undefined
  if (!provider) return fail()
  requireBoundIdentity(provider.identity, admission)
  const boundProvider: FactorySupervisionProvider = {
    ...provider,
    async invoke(request, admittedRuntimeIdentity) {
      requireBoundIdentity(provider.identity, admission)
      const evidence = await provider.invoke(request, admittedRuntimeIdentity)
      requireBoundIdentity(evidence.identity as FactorySupervisionProvider["identity"], admission)
      return evidence
    },
  }
  const execution = await run({ ...input, providers: { ...input.providers, [candidatePlayerId]: boundProvider } })
  return freezeLabValue({ admission, execution, root: receiptRoot(admission, execution) })
}
export type { LabSupervisedProvider }
