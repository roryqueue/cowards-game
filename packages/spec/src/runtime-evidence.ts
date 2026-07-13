import {
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"

/**
 * Exact executable identity is intentionally separate from the semantic tuple.
 * Rebuilding a runtime or changing its toolchain invalidates certificates without
 * pretending that the gameplay contract changed.
 */
export interface ExecutableLaneIdentity {
  providerId: string
  languageId: string
  runtimeId: string
  runtimeVersion: string
  toolchainId: string
  toolchainVersion: string
  adapterId: string
  adapterVersion: string
  policyId: string
  policyVersion: string
  corpusId: string
  corpusVersion: string
  artifactId: string
  artifactSha256: string
  implementationId: string
  buildId: string
  semanticTupleId: string
  semanticTuple: CanonicalCompatibilityTuple
}

export const EXECUTABLE_LANE_CERTIFICATE_KINDS = Object.freeze([
  "containment",
  "conformance",
] as const)
export type ExecutableLaneCertificateKind =
  (typeof EXECUTABLE_LANE_CERTIFICATE_KINDS)[number]

export const EXECUTABLE_LANE_CERTIFICATE_STATUSES = Object.freeze([
  "passed",
  "failed",
  "revoked",
] as const)
export type ExecutableLaneCertificateStatus =
  (typeof EXECUTABLE_LANE_CERTIFICATE_STATUSES)[number]

export interface ExecutableLaneGateResult {
  gateId: string
  passed: boolean
}

export interface ExecutableLaneCertificate {
  kind: ExecutableLaneCertificateKind
  certificateId: string
  certificateVersion: string
  certificateRecordHash: string
  identity: ExecutableLaneIdentity
  registryGeneration: string
  status: ExecutableLaneCertificateStatus
  issuedAt: string
  freshUntil: string
  gateResults: readonly ExecutableLaneGateResult[]
  restrictedProofIds: readonly string[]
  restrictedProofLinks: readonly string[]
}

export interface ExecutableLaneCertificateReference {
  kind: ExecutableLaneCertificateKind
  certificateId: string
  certificateVersion: string
  certificateRecordHash: string
  registryGeneration: string
}

export type ExecutableLaneEvidenceResolution =
  | {
      status: "resolved"
      certificate: Readonly<ExecutableLaneCertificate>
    }
  | {
      status: "unverifiable"
    }

/**
 * The evaluator accepts only resolver instances minted by a verified authority
 * path. A WeakSet brand makes an arbitrary certificate-shaped object fail at
 * runtime as well as at the TypeScript boundary.
 *
 * Production import and signed-bundle constructors are deliberately added by
 * Plans 256-15 and 256-17. This plan exposes only an explicitly named fixture
 * constructor for deterministic unit proof.
 */
export interface VerifiedExecutableLaneEvidenceAuthority {
  readonly registryGeneration: string
  readonly verificationDomain:
    | "non-production-test"
    | "verified-import"
    | "verified-bundle"
  resolve(
    reference: ExecutableLaneCertificateReference,
  ): ExecutableLaneEvidenceResolution
}

const verifiedAuthorityInstances = new WeakSet<object>()

const EXECUTABLE_IDENTITY_STRING_FIELDS = Object.freeze([
  "providerId",
  "languageId",
  "runtimeId",
  "runtimeVersion",
  "toolchainId",
  "toolchainVersion",
  "adapterId",
  "adapterVersion",
  "policyId",
  "policyVersion",
  "corpusId",
  "corpusVersion",
  "artifactId",
  "artifactSha256",
  "implementationId",
  "buildId",
  "semanticTupleId",
] as const satisfies readonly (keyof ExecutableLaneIdentity)[])

const cloneTuple = (
  tuple: CanonicalCompatibilityTuple,
): Readonly<CanonicalCompatibilityTuple> => Object.freeze({ ...tuple })

const cloneIdentity = (
  identity: ExecutableLaneIdentity,
): Readonly<ExecutableLaneIdentity> =>
  Object.freeze({
    ...identity,
    semanticTuple: cloneTuple(identity.semanticTuple),
  })

const cloneCertificate = (
  certificate: ExecutableLaneCertificate,
): Readonly<ExecutableLaneCertificate> =>
  Object.freeze({
    ...certificate,
    identity: cloneIdentity(certificate.identity),
    gateResults: Object.freeze(
      certificate.gateResults.map((result) => Object.freeze({ ...result })),
    ),
    restrictedProofIds: Object.freeze([...certificate.restrictedProofIds]),
    restrictedProofLinks: Object.freeze([
      ...certificate.restrictedProofLinks,
    ]),
  })

const referenceForCertificate = (
  certificate: ExecutableLaneCertificate,
): Readonly<ExecutableLaneCertificateReference> =>
  Object.freeze({
    kind: certificate.kind,
    certificateId: certificate.certificateId,
    certificateVersion: certificate.certificateVersion,
    certificateRecordHash: certificate.certificateRecordHash,
    registryGeneration: certificate.registryGeneration,
  })

const referenceKey = (reference: ExecutableLaneCertificateReference): string =>
  [
    reference.kind,
    reference.certificateId,
    reference.certificateVersion,
    reference.certificateRecordHash,
    reference.registryGeneration,
  ].join("\0")

export const createNonProductionExecutableLaneEvidenceAuthority = (input: {
  registryGeneration: string
  certificates: readonly ExecutableLaneCertificate[]
}): {
  authority: VerifiedExecutableLaneEvidenceAuthority
  references: readonly Readonly<ExecutableLaneCertificateReference>[]
} => {
  const certificates = input.certificates.map(cloneCertificate)
  const byReference = new Map(
    certificates.map((certificate) => [
      referenceKey(referenceForCertificate(certificate)),
      certificate,
    ]),
  )
  const authority: VerifiedExecutableLaneEvidenceAuthority = Object.freeze({
    registryGeneration: input.registryGeneration,
    verificationDomain: "non-production-test" as const,
    resolve(
      reference: ExecutableLaneCertificateReference,
    ): ExecutableLaneEvidenceResolution {
      const certificate = byReference.get(referenceKey(reference))
      return certificate
        ? { status: "resolved", certificate }
        : { status: "unverifiable" }
    },
  })
  verifiedAuthorityInstances.add(authority)
  return Object.freeze({
    authority,
    references: Object.freeze(certificates.map(referenceForCertificate)),
  })
}

export const EXECUTABLE_LANE_EVIDENCE_STATUSES = Object.freeze([
  "disabled",
  "exhibition_only",
  "counted",
] as const)
export type ExecutableLaneEvidenceStatus =
  (typeof EXECUTABLE_LANE_EVIDENCE_STATUSES)[number]

export const EXECUTABLE_LANE_EVIDENCE_REASON_CODES = Object.freeze([
  "EVIDENCE_CURRENT",
  "OPERATOR_DISABLED",
  "CONTAINMENT_MISSING",
  "CONTAINMENT_STALE",
  "CONTAINMENT_REVOKED",
  "CONTAINMENT_FAILED",
  "CONTAINMENT_UNVERIFIABLE",
  "CONFORMANCE_MISSING",
  "CONFORMANCE_STALE",
  "CONFORMANCE_REVOKED",
  "CONFORMANCE_FAILED",
  "CONFORMANCE_UNVERIFIABLE",
  "IDENTITY_MISMATCH",
  "TUPLE_UNKNOWN",
  "TUPLE_UNCERTIFIED",
  "REGISTRY_GENERATION_DRIFT",
  "EVIDENCE_UNVERIFIABLE",
] as const)
export type ExecutableLaneEvidenceReasonCode =
  (typeof EXECUTABLE_LANE_EVIDENCE_REASON_CODES)[number]

export interface ExecutableLaneEligibility {
  status: ExecutableLaneEvidenceStatus
  reasonCode: ExecutableLaneEvidenceReasonCode
  evaluatedAt: string
  registryGeneration: string
  expectedIdentity: Readonly<ExecutableLaneIdentity>
  containmentCertificate?: Readonly<ExecutableLaneCertificate> | undefined
  conformanceCertificate?: Readonly<ExecutableLaneCertificate> | undefined
}

export interface EvaluateExecutableLaneEligibilityInput {
  expectedIdentity: ExecutableLaneIdentity
  evaluationInstant: string
  activeRegistryGeneration: string
  operatorDisabled: boolean
  authority: VerifiedExecutableLaneEvidenceAuthority
  containmentCertificateRef?:
    | ExecutableLaneCertificateReference
    | undefined
  conformanceCertificateRef?:
    | ExecutableLaneCertificateReference
    | undefined
}

const isExactIdentityShape = (
  value: unknown,
): value is ExecutableLaneIdentity => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const identity = value as Record<string, unknown>
  const expectedKeys = [
    ...EXECUTABLE_IDENTITY_STRING_FIELDS,
    "semanticTuple",
  ]
  const keys = Object.keys(identity)
  if (
    keys.length !== expectedKeys.length ||
    expectedKeys.some((key) => !Object.hasOwn(identity, key))
  ) {
    return false
  }
  if (
    EXECUTABLE_IDENTITY_STRING_FIELDS.some(
      (field) =>
        typeof identity[field] !== "string" || identity[field].length === 0,
    )
  ) {
    return false
  }
  const tuple = identity.semanticTuple
  if (!tuple || typeof tuple !== "object" || Array.isArray(tuple)) return false
  const tupleRecord = tuple as Record<string, unknown>
  return (
    Object.keys(tupleRecord).length ===
      CANONICAL_COMPATIBILITY_TUPLE_FIELDS.length &&
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.every(
      (field) =>
        typeof tupleRecord[field] === "string" &&
        tupleRecord[field].length > 0,
    )
  )
}

const identitiesEqual = (
  left: ExecutableLaneIdentity,
  right: ExecutableLaneIdentity,
): boolean =>
  isExactIdentityShape(left) &&
  isExactIdentityShape(right) &&
  EXECUTABLE_IDENTITY_STRING_FIELDS.every(
    (field) => left[field] === right[field],
  ) &&
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS.every(
    (field) => left.semanticTuple[field] === right.semanticTuple[field],
  )

const tupleReason = (
  identity: ExecutableLaneIdentity,
): Extract<
  ExecutableLaneEvidenceReasonCode,
  "TUPLE_UNKNOWN" | "TUPLE_UNCERTIFIED"
> | null => {
  if (!isExactIdentityShape(identity)) return "TUPLE_UNKNOWN"
  if (!/^sha256:[0-9a-f]{64}$/u.test(identity.semanticTupleId)) {
    return "TUPLE_UNKNOWN"
  }
  try {
    return resolveCanonicalCompatibilityTuple({
      tupleId: identity.semanticTupleId,
      tuple: identity.semanticTuple,
    })
      ? null
      : "TUPLE_UNCERTIFIED"
  } catch {
    return "TUPLE_UNKNOWN"
  }
}

const dateValue = (value: string): number | null => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

type CertificateCheck =
  | { ok: true; certificate: Readonly<ExecutableLaneCertificate> }
  | { ok: false; reasonCode: ExecutableLaneEvidenceReasonCode }

const checkCertificate = (input: {
  kind: ExecutableLaneCertificateKind
  reference?: ExecutableLaneCertificateReference | undefined
  authority: VerifiedExecutableLaneEvidenceAuthority
  expectedIdentity: ExecutableLaneIdentity
  activeRegistryGeneration: string
  evaluationInstant: string
}): CertificateCheck => {
  const prefix = input.kind === "containment" ? "CONTAINMENT" : "CONFORMANCE"
  if (!input.reference) {
    return {
      ok: false,
      reasonCode: `${prefix}_MISSING` as ExecutableLaneEvidenceReasonCode,
    }
  }
  if (!verifiedAuthorityInstances.has(input.authority as object)) {
    return { ok: false, reasonCode: "EVIDENCE_UNVERIFIABLE" }
  }
  if (
    input.authority.registryGeneration !== input.activeRegistryGeneration ||
    input.reference.registryGeneration !== input.activeRegistryGeneration
  ) {
    return { ok: false, reasonCode: "REGISTRY_GENERATION_DRIFT" }
  }
  let resolution: ExecutableLaneEvidenceResolution
  try {
    resolution = input.authority.resolve(input.reference)
  } catch {
    return {
      ok: false,
      reasonCode: `${prefix}_UNVERIFIABLE` as ExecutableLaneEvidenceReasonCode,
    }
  }
  if (resolution.status !== "resolved") {
    return {
      ok: false,
      reasonCode: `${prefix}_UNVERIFIABLE` as ExecutableLaneEvidenceReasonCode,
    }
  }
  const certificate = resolution.certificate
  if (
    certificate.kind !== input.kind ||
    certificate.registryGeneration !== input.activeRegistryGeneration ||
    certificate.certificateId !== input.reference.certificateId ||
    certificate.certificateVersion !== input.reference.certificateVersion ||
    certificate.certificateRecordHash !==
      input.reference.certificateRecordHash
  ) {
    return {
      ok: false,
      reasonCode: `${prefix}_UNVERIFIABLE` as ExecutableLaneEvidenceReasonCode,
    }
  }
  if (!identitiesEqual(certificate.identity, input.expectedIdentity)) {
    return { ok: false, reasonCode: "IDENTITY_MISMATCH" }
  }
  if (certificate.status === "revoked") {
    return {
      ok: false,
      reasonCode: `${prefix}_REVOKED` as ExecutableLaneEvidenceReasonCode,
    }
  }
  if (
    certificate.status === "failed" ||
    certificate.gateResults.length === 0 ||
    certificate.gateResults.some((gate) => !gate.passed)
  ) {
    return {
      ok: false,
      reasonCode: `${prefix}_FAILED` as ExecutableLaneEvidenceReasonCode,
    }
  }
  const evaluatedAt = dateValue(input.evaluationInstant)
  const issuedAt = dateValue(certificate.issuedAt)
  const freshUntil = dateValue(certificate.freshUntil)
  if (evaluatedAt === null || issuedAt === null || freshUntil === null) {
    return {
      ok: false,
      reasonCode: `${prefix}_UNVERIFIABLE` as ExecutableLaneEvidenceReasonCode,
    }
  }
  if (evaluatedAt < issuedAt || evaluatedAt > freshUntil) {
    return {
      ok: false,
      reasonCode: `${prefix}_STALE` as ExecutableLaneEvidenceReasonCode,
    }
  }
  return { ok: true, certificate }
}

const eligibility = (
  input: EvaluateExecutableLaneEligibilityInput,
  status: ExecutableLaneEvidenceStatus,
  reasonCode: ExecutableLaneEvidenceReasonCode,
  certificates: {
    containmentCertificate?: Readonly<ExecutableLaneCertificate> | undefined
    conformanceCertificate?: Readonly<ExecutableLaneCertificate> | undefined
  } = {},
): Readonly<ExecutableLaneEligibility> =>
  Object.freeze({
    status,
    reasonCode,
    evaluatedAt: input.evaluationInstant,
    registryGeneration: input.activeRegistryGeneration,
    expectedIdentity: cloneIdentity(input.expectedIdentity),
    ...certificates,
  })

export const evaluateExecutableLaneEligibility = (
  input: EvaluateExecutableLaneEligibilityInput,
): Readonly<ExecutableLaneEligibility> => {
  if (input.operatorDisabled) {
    return eligibility(input, "disabled", "OPERATOR_DISABLED")
  }
  const semanticTupleReason = tupleReason(input.expectedIdentity)
  if (semanticTupleReason) {
    return eligibility(input, "disabled", semanticTupleReason)
  }
  if (!verifiedAuthorityInstances.has(input.authority as object)) {
    return eligibility(input, "disabled", "EVIDENCE_UNVERIFIABLE")
  }
  if (input.authority.registryGeneration !== input.activeRegistryGeneration) {
    return eligibility(input, "disabled", "REGISTRY_GENERATION_DRIFT")
  }
  const containment = checkCertificate({
    kind: "containment",
    reference: input.containmentCertificateRef,
    authority: input.authority,
    expectedIdentity: input.expectedIdentity,
    activeRegistryGeneration: input.activeRegistryGeneration,
    evaluationInstant: input.evaluationInstant,
  })
  if (!containment.ok) {
    return eligibility(input, "disabled", containment.reasonCode)
  }
  const conformance = checkCertificate({
    kind: "conformance",
    reference: input.conformanceCertificateRef,
    authority: input.authority,
    expectedIdentity: input.expectedIdentity,
    activeRegistryGeneration: input.activeRegistryGeneration,
    evaluationInstant: input.evaluationInstant,
  })
  if (!conformance.ok) {
    return eligibility(input, "exhibition_only", conformance.reasonCode, {
      containmentCertificate: containment.certificate,
    })
  }
  return eligibility(input, "counted", "EVIDENCE_CURRENT", {
    containmentCertificate: containment.certificate,
    conformanceCertificate: conformance.certificate,
  })
}
