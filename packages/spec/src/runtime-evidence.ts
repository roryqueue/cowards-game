import {
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

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

export const PUBLIC_LANE_EVIDENCE_REASON_CATEGORIES = Object.freeze([
  "ready",
  "operator_disabled",
  "safety_evidence_unavailable",
  "competitive_evidence_pending",
] as const)
export type PublicLaneEvidenceReasonCategory =
  (typeof PUBLIC_LANE_EVIDENCE_REASON_CATEGORIES)[number]

export interface PublicLaneEvidenceRecordProjection {
  kind: ExecutableLaneCertificateKind
  version: string
  hash: string
  freshUntil: string
}

export interface PublicLaneEvidenceProjection {
  status: ExecutableLaneEvidenceStatus
  reasonCategory: PublicLaneEvidenceReasonCategory
  publicMessage: string
  semanticTupleId: string
  evidence: readonly Readonly<PublicLaneEvidenceRecordProjection>[]
  freshnessDate?: string | undefined
}

const PUBLIC_REASON_POLICY: Record<
  ExecutableLaneEvidenceReasonCode,
  {
    reasonCategory: PublicLaneEvidenceReasonCategory
    publicMessage: string
  }
> = {
  EVIDENCE_CURRENT: {
    reasonCategory: "ready",
    publicMessage:
      "Current safety and competitive evidence is available.",
  },
  OPERATOR_DISABLED: {
    reasonCategory: "operator_disabled",
    publicMessage: "This Strategy lane is temporarily unavailable.",
  },
  CONTAINMENT_MISSING: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while current safety evidence is checked.",
  },
  CONTAINMENT_STALE: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while current safety evidence is refreshed.",
  },
  CONTAINMENT_REVOKED: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while safety evidence is reviewed.",
  },
  CONTAINMENT_FAILED: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is unavailable because current safety checks did not pass.",
  },
  CONTAINMENT_UNVERIFIABLE: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while safety evidence is verified.",
  },
  CONFORMANCE_MISSING: {
    reasonCategory: "competitive_evidence_pending",
    publicMessage:
      "This Strategy lane is available for exhibitions while current competitive evidence is checked.",
  },
  CONFORMANCE_STALE: {
    reasonCategory: "competitive_evidence_pending",
    publicMessage:
      "This Strategy lane is available for exhibitions while competitive evidence is refreshed.",
  },
  CONFORMANCE_REVOKED: {
    reasonCategory: "competitive_evidence_pending",
    publicMessage:
      "This Strategy lane is available for exhibitions while competitive evidence is reviewed.",
  },
  CONFORMANCE_FAILED: {
    reasonCategory: "competitive_evidence_pending",
    publicMessage:
      "This Strategy lane remains exhibition-only because current competitive checks did not pass.",
  },
  CONFORMANCE_UNVERIFIABLE: {
    reasonCategory: "competitive_evidence_pending",
    publicMessage:
      "This Strategy lane is available for exhibitions while competitive evidence is verified.",
  },
  IDENTITY_MISMATCH: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while its current identity is verified.",
  },
  TUPLE_UNKNOWN: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is unavailable for the requested compatibility profile.",
  },
  TUPLE_UNCERTIFIED: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is unavailable for the requested compatibility profile.",
  },
  REGISTRY_GENERATION_DRIFT: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while current evidence is refreshed.",
  },
  EVIDENCE_UNVERIFIABLE: {
    reasonCategory: "safety_evidence_unavailable",
    publicMessage:
      "This Strategy lane is temporarily unavailable while current evidence is verified.",
  },
}

const publicCertificate = (
  certificate: Readonly<ExecutableLaneCertificate>,
): Readonly<PublicLaneEvidenceRecordProjection> =>
  Object.freeze({
    kind: certificate.kind,
    version: certificate.certificateVersion,
    hash: certificate.certificateRecordHash,
    freshUntil: certificate.freshUntil,
  })

export const projectPublicLaneEvidence = (
  laneEligibility: ExecutableLaneEligibility,
): Readonly<PublicLaneEvidenceProjection> => {
  const policy = PUBLIC_REASON_POLICY[laneEligibility.reasonCode]
  const evidence = Object.freeze(
    [
      laneEligibility.containmentCertificate,
      laneEligibility.conformanceCertificate,
    ]
      .filter(
        (
          certificate,
        ): certificate is Readonly<ExecutableLaneCertificate> =>
          certificate !== undefined,
      )
      .map(publicCertificate),
  )
  const freshnessDate = evidence
    .map((certificate) => certificate.freshUntil)
    .sort()[0]
    ?.slice(0, 10)
  const projection = Object.freeze({
    status: laneEligibility.status,
    reasonCategory: policy.reasonCategory,
    publicMessage: policy.publicMessage,
    semanticTupleId: laneEligibility.expectedIdentity.semanticTupleId,
    evidence,
    ...(freshnessDate ? { freshnessDate } : {}),
  })
  assertPublicLaneEvidenceProjectionLeakSafe(projection)
  return projection
}

export interface OperatorLaneCertificateProjection {
  certificateId: string
  certificateVersion: string
  certificateRecordHash: string
  issuedAt: string
  freshUntil: string
  status: ExecutableLaneCertificateStatus
  gateResults: readonly Readonly<ExecutableLaneGateResult>[]
  restrictedProofIds: readonly string[]
  restrictedProofLinks: readonly string[]
}

export interface OperatorLaneEvidenceProjection {
  status: ExecutableLaneEvidenceStatus
  reasonCode: ExecutableLaneEvidenceReasonCode
  evaluatedAt: string
  registryGeneration: string
  identity: Readonly<ExecutableLaneIdentity>
  gates: {
    containment?: Readonly<OperatorLaneCertificateProjection> | undefined
    conformance?: Readonly<OperatorLaneCertificateProjection> | undefined
  }
  remediation: string
  cohortImpact: string
}

const OPERATOR_REMEDIATION: Record<
  ExecutableLaneEvidenceReasonCode,
  string
> = {
  EVIDENCE_CURRENT:
    "Keep the exact authority generation and both certificate references current.",
  OPERATOR_DISABLED:
    "Remove the operator disable only after the incident is resolved; evidence will then be re-evaluated.",
  CONTAINMENT_MISSING:
    "Import a current containment certificate for the exact executable identity.",
  CONTAINMENT_STALE:
    "Refresh containment evidence and publish a current certificate reference.",
  CONTAINMENT_REVOKED:
    "Resolve the revocation and import a new exact containment certificate.",
  CONTAINMENT_FAILED:
    "Repair the failed containment gates and recertify the exact lane identity.",
  CONTAINMENT_UNVERIFIABLE:
    "Repair the trusted containment evidence path and publish a verifiable reference.",
  CONFORMANCE_MISSING:
    "Run the required executable conformance corpus and import its exact certificate.",
  CONFORMANCE_STALE:
    "Re-run the executable conformance corpus and refresh the certificate.",
  CONFORMANCE_REVOKED:
    "Resolve the revocation and publish new exact conformance evidence.",
  CONFORMANCE_FAILED:
    "Repair the failed conformance gates and rerun the complete corpus.",
  CONFORMANCE_UNVERIFIABLE:
    "Repair the trusted conformance evidence path and publish a verifiable reference.",
  IDENTITY_MISMATCH:
    "Rebuild the evidence bundle for the exact active provider, toolchain, adapter, artifact, build, and tuple identity.",
  TUPLE_UNKNOWN:
    "Use an exact registered semantic tuple identifier and complete expansion.",
  TUPLE_UNCERTIFIED:
    "Register and certify the exact semantic tuple before requesting execution.",
  REGISTRY_GENERATION_DRIFT:
    "Reload the active authority generation and obtain matching certificate references.",
  EVIDENCE_UNVERIFIABLE:
    "Restore the verified authority import or signed-bundle path before retrying.",
}

const operatorCertificate = (
  certificate: Readonly<ExecutableLaneCertificate>,
): Readonly<OperatorLaneCertificateProjection> =>
  Object.freeze({
    certificateId: certificate.certificateId,
    certificateVersion: certificate.certificateVersion,
    certificateRecordHash: certificate.certificateRecordHash,
    issuedAt: certificate.issuedAt,
    freshUntil: certificate.freshUntil,
    status: certificate.status,
    gateResults: Object.freeze(
      certificate.gateResults.map((gate) => Object.freeze({ ...gate })),
    ),
    restrictedProofIds: Object.freeze([...certificate.restrictedProofIds]),
    restrictedProofLinks: Object.freeze([
      ...certificate.restrictedProofLinks,
    ]),
  })

export const projectOperatorLaneEvidence = (
  laneEligibility: ExecutableLaneEligibility,
): Readonly<OperatorLaneEvidenceProjection> => {
  const gates = Object.freeze({
    ...(laneEligibility.containmentCertificate
      ? {
          containment: operatorCertificate(
            laneEligibility.containmentCertificate,
          ),
        }
      : {}),
    ...(laneEligibility.conformanceCertificate
      ? {
          conformance: operatorCertificate(
            laneEligibility.conformanceCertificate,
          ),
        }
      : {}),
  })
  const cohortImpact =
    laneEligibility.status === "counted"
      ? "New execution may produce counted results while evidence remains current."
      : laneEligibility.status === "exhibition_only"
        ? "New execution may produce exhibition evidence only; counted results are blocked."
        : "New execution is disabled; no counted or exhibition result may be produced."
  const projection = Object.freeze({
    status: laneEligibility.status,
    reasonCode: laneEligibility.reasonCode,
    evaluatedAt: laneEligibility.evaluatedAt,
    registryGeneration: laneEligibility.registryGeneration,
    identity: cloneIdentity(laneEligibility.expectedIdentity),
    gates,
    remediation: OPERATOR_REMEDIATION[laneEligibility.reasonCode],
    cohortImpact,
  })
  assertOperatorLaneEvidenceProjectionLeakSafe(projection)
  return projection
}

export const assertPublicLaneEvidenceProjectionLeakSafe = (
  value: unknown,
): void =>
  assertPublicOutputLeakSafe(value, "public lane evidence projection")

export const assertOperatorLaneEvidenceProjectionLeakSafe = (
  value: unknown,
): void =>
  assertPublicOutputLeakSafe(value, "restricted operator lane evidence")
