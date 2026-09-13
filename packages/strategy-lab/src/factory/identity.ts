import { labRoot, type LabRoot } from "../contracts.js"

type Rooted = { root?: unknown }
const withoutRoot = <T extends Rooted>(value: T) => {
  const { root: _root, ...payload } = value
  return payload
}

/** Factory roots are intentionally disjoint from production Strategy identities. */
export const deriveFactoryOraclePacketRoot = (value: unknown): LabRoot =>
  labRoot("factory-oracle-packet-v1", withoutRoot(value as Rooted))
export const deriveFactoryProposalRoot = (value: unknown): LabRoot =>
  labRoot("factory-proposal-v1", withoutRoot(value as Rooted))
export const deriveFactoryValidationRoot = (value: unknown): LabRoot =>
  labRoot("factory-validation-evidence-v1", withoutRoot(value as Rooted))
export const deriveFactoryCandidateRoot = (value: unknown): LabRoot =>
  labRoot("factory-candidate-v1", withoutRoot(value as Rooted))
export const deriveFactoryAttemptRoot = (value: unknown): LabRoot =>
  labRoot("factory-attempt-v1", withoutRoot(value as Rooted))
export const deriveFactoryArtifactRoot = (kind: string, bytes: Uint8Array): LabRoot => {
  if (!/^[a-z][a-z0-9-]{0,63}$/u.test(kind) || !(bytes instanceof Uint8Array) || bytes.byteLength > 262144) throw new TypeError("FACTORY_ARTIFACT_INPUT")
  return labRoot("factory-artifact-bytes-v1", { kind, bytes: Buffer.from(bytes).toString("base64") })
}
