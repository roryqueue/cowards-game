import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

type RecordValue = Record<string, unknown>
const ROOT = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[a-z][a-z0-9._:-]{0,95}$/u
const fail = (code: string): never => { throw new TypeError(`INTAKE_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const isIdentifier = (value: unknown): value is string => typeof value === "string" && IDENTIFIER.test(value)
const exact = (value: unknown, keys: readonly string[]): value is RecordValue => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(), expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const boundedPositiveInteger = (value: unknown, maximum: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= maximum
const withoutRoot = (value: RecordValue): RecordValue => {
  const { root: _root, ...payload } = value
  return payload
}
const protocolRoot = (value: RecordValue): LabRoot => labRoot("frozen-intake-protocol-v1", withoutRoot(value))
const authorizationRoot = (value: RecordValue): LabRoot => labRoot("intake-authorization-v1", value)

export type IntakeDispositionPolicy = "retain-all-terminal-outcomes"
export type IntakeReviewerDisposition = "accept" | "reject" | "legal_but_weak"

/** A frozen authorization envelope, with no default participant or reviewer. */
export interface FrozenIntakeProtocol {
  readonly schemaVersion: "frozen-intake-protocol-v1"
  readonly privacy: "private_offline"
  readonly root: LabRoot
  readonly authorization: LabRoot
  readonly participantId: string
  readonly reviewerIds: readonly string[]
  readonly participantAuthorizationRoot: LabRoot
  readonly reviewerAuthorizationRoot: LabRoot
  readonly disclosure: "source-and-provenance"
  readonly submissionLimit: number
  readonly timeLimitMinutes: number
  readonly reviewerLimit: number
  readonly reviewerReuseLimit: number
  readonly conflictsDeclared: true
  readonly conflictPolicy: "reject-on-conflict"
  readonly confidentiality: "private_offline"
  readonly provenanceRequired: true
  readonly provenancePolicy: "complete-explicit-deterministic"
  readonly validationRequired: true
  readonly validationPolicy: "common-hostile-admission"
  readonly acceptanceBudget: number
  readonly acceptancePolicy: "accept-only-reviewed-source"
  readonly dispositionPolicy: IntakeDispositionPolicy
}

const protocolKeys = [
  "schemaVersion", "privacy", "root", "authorization", "participantId", "reviewerIds",
  "participantAuthorizationRoot", "reviewerAuthorizationRoot", "disclosure", "submissionLimit",
  "timeLimitMinutes", "reviewerLimit", "reviewerReuseLimit", "conflictsDeclared", "conflictPolicy",
  "confidentiality", "provenanceRequired", "provenancePolicy", "validationRequired", "validationPolicy",
  "acceptanceBudget", "acceptancePolicy", "dispositionPolicy",
] as const

export const deriveFrozenIntakeProtocolRoot = (value: Omit<FrozenIntakeProtocol, "root"> | FrozenIntakeProtocol): LabRoot =>
  protocolRoot(value as RecordValue)

export const deriveIntakeAuthorizationRoot = (value: Pick<FrozenIntakeProtocol, "participantId" | "reviewerIds" | "participantAuthorizationRoot" | "reviewerAuthorizationRoot">): LabRoot =>
  authorizationRoot({ participantId: value.participantId, reviewerIds: value.reviewerIds, participantAuthorizationRoot: value.participantAuthorizationRoot, reviewerAuthorizationRoot: value.reviewerAuthorizationRoot })

export const admitFrozenIntakeProtocol = (value: unknown): Readonly<FrozenIntakeProtocol> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144 || !exact(admitted.value, protocolKeys)) return fail("PROTOCOL")
  const protocol = admitted.value as RecordValue
  if (protocol.schemaVersion !== "frozen-intake-protocol-v1" || protocol.privacy !== "private_offline" ||
      !isRoot(protocol.root) || !isRoot(protocol.authorization) || !isIdentifier(protocol.participantId) ||
      !Array.isArray(protocol.reviewerIds) || protocol.reviewerIds.length < 1 || protocol.reviewerIds.length > 256 ||
      protocol.reviewerIds.some((id) => !isIdentifier(id)) || new Set(protocol.reviewerIds).size !== protocol.reviewerIds.length ||
      !isRoot(protocol.participantAuthorizationRoot) || !isRoot(protocol.reviewerAuthorizationRoot) ||
      protocol.disclosure !== "source-and-provenance" || !boundedPositiveInteger(protocol.submissionLimit, 100000) ||
      !boundedPositiveInteger(protocol.timeLimitMinutes, 1440) || !boundedPositiveInteger(protocol.reviewerLimit, 100000) ||
      !boundedPositiveInteger(protocol.reviewerReuseLimit, 100000) || protocol.reviewerReuseLimit > protocol.reviewerLimit ||
      protocol.conflictsDeclared !== true || protocol.conflictPolicy !== "reject-on-conflict" ||
      protocol.confidentiality !== "private_offline" || protocol.provenanceRequired !== true ||
      protocol.provenancePolicy !== "complete-explicit-deterministic" || protocol.validationRequired !== true ||
      protocol.validationPolicy !== "common-hostile-admission" || !boundedPositiveInteger(protocol.acceptanceBudget, 100000) ||
      protocol.acceptanceBudget > protocol.submissionLimit || protocol.acceptancePolicy !== "accept-only-reviewed-source" ||
      protocol.dispositionPolicy !== "retain-all-terminal-outcomes" ||
      protocol.authorization !== deriveIntakeAuthorizationRoot(protocol as unknown as FrozenIntakeProtocol) || protocol.root !== protocolRoot(protocol)) return fail("PROTOCOL")
  return freezeLabValue(protocol as unknown as FrozenIntakeProtocol)
}

export type IntakeBlockedReason = "incomplete_protocol" | "unauthorized_participant" | "unauthorized_reviewer"
export const blockedIntakeConfiguration = (reason: IntakeBlockedReason) => freezeLabValue({
  schemaVersion: "intake-blocked-v1" as const, privacy: "private_offline" as const, reason,
  root: labRoot("intake-blocked-v1", { reason }),
})

export interface ReviewerIntakeProjection {
  readonly schemaVersion: "intake-reviewer-projection-v1"
  readonly privacy: "private_offline"
  readonly protocolRoot: LabRoot
  readonly participantId: string
  readonly reviewerId: string
  readonly disclosure: "source-and-provenance"
  readonly sourceRoot: LabRoot
  readonly provenanceRoot: LabRoot
  readonly submissionRoot: LabRoot
}
const projectionKeys = ["schemaVersion", "privacy", "protocolRoot", "participantId", "reviewerId", "disclosure", "sourceRoot", "provenanceRoot", "submissionRoot"] as const
export const deriveIntakeSubmissionRoot = (value: Pick<ReviewerIntakeProjection, "protocolRoot" | "participantId" | "reviewerId" | "sourceRoot" | "provenanceRoot">): LabRoot =>
  labRoot("intake-submission-v1", { protocolRoot: value.protocolRoot, participantId: value.participantId, reviewerId: value.reviewerId, sourceRoot: value.sourceRoot, provenanceRoot: value.provenanceRoot })

/** Validate and minimize the reviewer view; arbitrary payloads are refused. */
export const projectIntakeForReviewer = (protocolValue: unknown, value: unknown): Readonly<ReviewerIntakeProjection> => {
  const protocol = admitFrozenIntakeProtocol(protocolValue)
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 65536 || !exact(admitted.value, projectionKeys)) return fail("REVIEWER_PROJECTION")
  const projection = admitted.value as RecordValue
  if (projection.schemaVersion !== "intake-reviewer-projection-v1" || projection.privacy !== "private_offline" ||
      projection.protocolRoot !== protocol.root || projection.participantId !== protocol.participantId ||
      typeof projection.reviewerId !== "string" || !protocol.reviewerIds.includes(projection.reviewerId) ||
      projection.disclosure !== protocol.disclosure || !isRoot(projection.sourceRoot) || !isRoot(projection.provenanceRoot) ||
      !isRoot(projection.submissionRoot) || projection.submissionRoot !== deriveIntakeSubmissionRoot(projection as never)) return fail("REVIEWER_PROJECTION")
  return freezeLabValue(projection as unknown as ReviewerIntakeProjection)
}
