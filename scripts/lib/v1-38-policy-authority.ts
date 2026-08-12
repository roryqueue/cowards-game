export type V138PolicyStatus = "pending" | "blocked" | "ready"
export type V138MatrixAdmissionStatus = "blocked" | "passed"
export type V138CustodyStatus = "unavailable" | "contaminated" | "authorized"
export type V138DownstreamAuthority = "denied" | "granted"

type ClosedStatusSchema<T extends string> = Readonly<{
  values: readonly T[]
  parse(input: unknown): T
  safeParse(input: unknown):
    | Readonly<{ success: true; data: T }>
    | Readonly<{ success: false; error: TypeError }>
}>

const closedStatusSchema = <T extends string>(
  values: readonly T[],
  errorCode: string,
): ClosedStatusSchema<T> => Object.freeze({
  values: Object.freeze([...values]),
  parse(input: unknown): T {
    if (typeof input !== "string" || !values.includes(input as T)) {
      throw new TypeError(errorCode)
    }
    return input as T
  },
  safeParse(input: unknown) {
    try {
      return Object.freeze({ success: true as const, data: this.parse(input) })
    } catch {
      return Object.freeze({ success: false as const, error: new TypeError(errorCode) })
    }
  },
})

export const V138PolicyStatusSchema = closedStatusSchema(
  ["pending", "blocked", "ready"] as const,
  "V138_POLICY_STATUS_INVALID",
)

export const V138MatrixAdmissionStatusSchema = closedStatusSchema(
  ["blocked", "passed"] as const,
  "V138_MATRIX_ADMISSION_STATUS_INVALID",
)

export const V138CustodyStatusSchema = closedStatusSchema(
  ["unavailable", "contaminated", "authorized"] as const,
  "V138_CUSTODY_STATUS_INVALID",
)

export const V138DownstreamAuthoritySchema = closedStatusSchema(
  ["denied", "granted"] as const,
  "V138_DOWNSTREAM_AUTHORITY_INVALID",
)

export const V138_PREDECESSOR_AUTHORITY = Object.freeze({
  archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
  selectedTupleId:
    "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
  admissionRoot:
    "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c",
  joinStatus: "passed_exact",
  failedJoinDisposition: "stopped_integrity_foundation",
} as const)

export const V138_CURRENT_STOPPED_BRANCH = Object.freeze({
  routeOrdinal: 5,
  disposition: "calibration_stopped",
  freshCharged: 0,
  freshAccepted: 0,
  authorityExpired: true,
  noRetry: true,
  admit03: "blocked",
} as const)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
}

export interface V138DownstreamAuthorityInput {
  readonly policyStatus: V138PolicyStatus
  readonly matrixAdmissionStatus: V138MatrixAdmissionStatus
  readonly custodyStatus: V138CustodyStatus
  readonly containmentPassed: boolean
  readonly identitiesJoined: boolean
}

const downstreamAuthorityKeys = Object.freeze([
  "policyStatus",
  "matrixAdmissionStatus",
  "custodyStatus",
  "containmentPassed",
  "identitiesJoined",
] as const)

export const evaluateV138DownstreamAuthority = (
  input: V138DownstreamAuthorityInput,
): V138DownstreamAuthority => {
  if (!isRecord(input) || !hasExactKeys(input, downstreamAuthorityKeys)) {
    throw new TypeError("V138_DOWNSTREAM_AUTHORITY_INPUT_INVALID")
  }
  const policyStatus = V138PolicyStatusSchema.parse(input.policyStatus)
  const matrixAdmissionStatus = V138MatrixAdmissionStatusSchema.parse(
    input.matrixAdmissionStatus,
  )
  const custodyStatus = V138CustodyStatusSchema.parse(input.custodyStatus)
  if (
    typeof input.containmentPassed !== "boolean" ||
    typeof input.identitiesJoined !== "boolean"
  ) throw new TypeError("V138_DOWNSTREAM_AUTHORITY_INPUT_INVALID")

  return policyStatus === "ready" &&
      matrixAdmissionStatus === "passed" &&
      custodyStatus === "authorized" &&
      input.containmentPassed &&
      input.identitiesJoined
    ? "granted"
    : "denied"
}

export interface V138MatrixAdmissionEvidence {
  readonly schemaVersion: "v1.38-matrix-admission-evidence-v1"
  readonly evidenceClass: "fresh_admit_03_reproduction"
  readonly disposition: "reproduction_passed"
  readonly freshCharged: 540
  readonly freshAccepted: 540
  readonly integrityFailureCount: 0
  readonly tupleId: typeof V138_PREDECESSOR_AUTHORITY.selectedTupleId
  readonly admissionRoot: typeof V138_PREDECESSOR_AUTHORITY.admissionRoot
  readonly authorityExpired: false
  readonly noRetry: false
}

const matrixAdmissionEvidenceKeys = Object.freeze([
  "schemaVersion",
  "evidenceClass",
  "disposition",
  "freshCharged",
  "freshAccepted",
  "integrityFailureCount",
  "tupleId",
  "admissionRoot",
  "authorityExpired",
  "noRetry",
] as const)

export const evaluateV138MatrixAdmission = (
  input: unknown,
): V138MatrixAdmissionStatus => {
  if (!isRecord(input) || !hasExactKeys(input, matrixAdmissionEvidenceKeys)) {
    return "blocked"
  }
  return input.schemaVersion === "v1.38-matrix-admission-evidence-v1" &&
      input.evidenceClass === "fresh_admit_03_reproduction" &&
      input.disposition === "reproduction_passed" &&
      input.freshCharged === 540 &&
      input.freshAccepted === 540 &&
      input.integrityFailureCount === 0 &&
      input.tupleId === V138_PREDECESSOR_AUTHORITY.selectedTupleId &&
      input.admissionRoot === V138_PREDECESSOR_AUTHORITY.admissionRoot &&
      input.authorityExpired === false &&
      input.noRetry === false
    ? "passed"
    : "blocked"
}
