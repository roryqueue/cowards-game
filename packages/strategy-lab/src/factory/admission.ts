import { createHash } from "node:crypto"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { runCanonicalLabMatch, type LabMatchExecution, type LabSupervisedProvider } from "../runtime-bridge.js"
import { FactoryCandidateSchema, FactoryOraclePacketSchema, type FactoryCandidate, type FactoryDisposition, type FactoryOraclePacket } from "./contracts.js"
import type { FactoryRepository } from "./repository.js"
import { publishFactoryArtifact } from "./repository.js"

const fail = (): never => { throw new TypeError("FACTORY_ADMISSION") }
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail(); return admitted.canonicalBytes }
export interface FactoryAdmission { readonly sourceRoot: LabRoot; readonly packetRoot: LabRoot; readonly candidateRoot: LabRoot; readonly validationRoot: LabRoot; readonly artifacts: Readonly<{ source: LabRoot; packet: LabRoot; candidate: LabRoot; validation: LabRoot }> }
/** Validates hostile source as bytes and records private evidence; it never evaluates source. */
export const admitFactory = (input: { packet: FactoryOraclePacket; candidate: FactoryCandidate; sourceBytes: Uint8Array; repository?: FactoryRepository }): Readonly<FactoryAdmission> => {
  const packet = FactoryOraclePacketSchema.parse(input.packet), candidate = FactoryCandidateSchema.parse(input.candidate)
  if (!(input.sourceBytes instanceof Uint8Array) || input.sourceBytes.byteLength !== candidate.proposal.source.byteLength || bytesRoot(input.sourceBytes) !== candidate.proposal.source.root || candidate.proposal.packetRoot !== packet.root || candidate.proposal.nativeLane.language !== packet.nativeLane.language || candidate.proposal.nativeLane.providerId !== packet.nativeLane.providerId) return fail()
  const artifacts = input.repository ? { source: publishFactoryArtifact(input.repository, input.sourceBytes), packet: publishFactoryArtifact(input.repository, canonical(packet)), candidate: publishFactoryArtifact(input.repository, canonical(candidate)), validation: publishFactoryArtifact(input.repository, canonical(candidate.validation)) } : { source: bytesRoot(input.sourceBytes), packet: packet.root, candidate: candidate.root, validation: candidate.validation.root }
  return freezeLabValue({ sourceRoot: bytesRoot(input.sourceBytes), packetRoot: packet.root, candidateRoot: candidate.root, validationRoot: candidate.validation.root, artifacts })
}
export const mapFactorySupervision = (execution: LabMatchExecution): Readonly<{ disposition: Extract<FactoryDisposition, "accepted" | "player_violation" | "system_failure">; scoredAsGameplay: false; evidenceRoot: LabRoot }> => {
  const disposition = execution.kind === "failure" ? "system_failure" as const : execution.accounting.some((entry) => !entry.result.ok && !("systemFailure" in entry.result)) ? "player_violation" as const : "accepted" as const
  return freezeLabValue({ disposition, scoredAsGameplay: false as const, evidenceRoot: labRoot("factory-supervision-evidence-v1", execution) })
}
/** The only execution seam is an injected call to the existing supervised lab bridge. */
export const superviseFactory = (input: Parameters<typeof runCanonicalLabMatch>[0], run: typeof runCanonicalLabMatch = runCanonicalLabMatch): ReturnType<typeof runCanonicalLabMatch> => run(input)
export type { LabSupervisedProvider }
