export type RuntimeConformanceLanguageIdV117 =
  | "typescript"
  | "python"
  | "rust"
  | "zig"

export interface RuntimeConformanceIdentityBindingsV117 {
  languageId: RuntimeConformanceLanguageIdV117
  laneId: string
  corpusRootSha256: string
  caseInventorySha256: string
  fixtureSourceSha256: string
  artifactSha256: string
  adapterBuildSha256: string
  runtimeExecutableSha256: string
  toolchainSha256: string
  sysrootStdlibSha256: string
  runtimeAbiVersion: string
  canonicalJsonProfileId: string
  budgetPolicySha256: string
  containmentPolicySha256: string
  semanticTupleSha256: string
  identityManifestRoot: string
  evidenceGraphRoot: string
  behaviorSettingsSha256: string
}

export interface RuntimeConformanceRunV117 {
  runId: string
  workspaceId: string
  processId: string
  status: "passed" | "system_failure"
  complete: boolean
  freshWorkspace: boolean
  freshProcess: boolean
  skippedCaseCount: number
  unsupportedCaseCount: number
  fallbackUsed: boolean
  syntheticEvidence: boolean
  caseCount: number
  startedAt: string
  completedAt: string
  validUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  resultRootSha256: string
  evidenceRootSha256: string
}

export interface RuntimeConformanceCertificatePayloadV117 {
  schemaVersion: "runtime-conformance-certificate-v1.17"
  certificateId: string
  certificateVersion: "runtime-conformance-certificate-v1.17"
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  registryGeneration: string
  issuedAt: string
  requestedValidUntil: string
  freshUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  runs: RuntimeConformanceRunV117[]
}

export interface RuntimeConformanceCertificateV117
  extends RuntimeConformanceCertificatePayloadV117 {
  signatureBase64: string
}

export interface RuntimeConformanceTrustedProducerV117 {
  producerId: string
  keyId: string
  trustDomain: "production" | "fixture"
  managedIdentity: true
  publicKeyPem: string
}

export interface RuntimeConformanceVerifiedSnapshotV117 {
  schemaVersion: "runtime-conformance-certificate-v1.17"
  certificateId: string
  certificateSha256: string
  certificateVersion: "runtime-conformance-certificate-v1.17"
  producerId: string
  producerKeyId: string
  trustDomain: "production" | "fixture"
  registryGeneration: string
  issuedAt: string
  freshUntil: string
  identity: RuntimeConformanceIdentityBindingsV117
  runIds: string[]
  resultRootSha256: string
  evidenceRootSha256: string
}

const missing = (): never => {
  throw new Error("[EXPECTED_RED:MISSING_RUNTIME_CONFORMANCE_CERTIFICATE_V1_17]")
}

export const RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17 = Object.freeze([])
export const encodeRuntimeConformanceCertificatePayloadV117 = missing
export const verifyRuntimeConformanceCertificateV117 = missing
export const evaluateRuntimeConformanceFreshnessV117 = missing
export const requireAllFourConformanceLanesV117 = missing
