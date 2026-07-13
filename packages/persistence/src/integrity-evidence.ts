import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import {
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  EXECUTABLE_LANE_EVIDENCE_REASON_CODES,
  EXECUTABLE_LANE_EVIDENCE_STATUSES,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
  type ExecutableLaneCertificateReference,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionCompatibilityIdentity,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"

export class IntegrityEvidenceInputError extends Error {
  readonly status = 400

  constructor(message: string) {
    super(message)
    this.name = "IntegrityEvidenceInputError"
  }
}

export type EntrantExecutionEvidence = RuntimeEntrantExecutionEvidence

export interface MatchSetIntegrityExpectedEntrant {
  entrantKey: string
  strategyRevisionId: string
}

export interface MatchSetIntegrityIdentityInput {
  compatibility: RuntimeExecutionCompatibilityIdentity
  authorityBundleHash: string
  registryGeneration: string
  expectedEntrants: readonly MatchSetIntegrityExpectedEntrant[]
  entrants: readonly EntrantExecutionEvidence[]
}

export interface MatchSetIntegrityIdentity {
  compatibility: Readonly<RuntimeExecutionCompatibilityIdentity>
  authorityBundleHash: string
  registryGeneration: string
  normalizedEntrants: readonly Readonly<EntrantExecutionEvidence>[]
  entrantsByKey: Readonly<Record<string, Readonly<EntrantExecutionEvidence>>>
  evidenceSetHash: string
}

export interface MatchExecutionEvidencePair {
  bottom: Readonly<EntrantExecutionEvidence>
  top: Readonly<EntrantExecutionEvidence>
  pairHash: string
}

export interface MatchExecutionEvidencePairSelector {
  bottomEntrantKey: string
  topEntrantKey: string
  bottomStrategyRevisionId: string
  topStrategyRevisionId: string
}

export interface HistoricalIntegritySource {
  matchSetId: string
  rulesVersion: string | null
  engineVersion: string | null
  runtimeAbiVersion: string | null
  chronicleVersion: string | null
  arenaCatalogVersion: string | null
  setPolicyVersion: string | null
  originalCounted: boolean
  originalOutcome: unknown
}

export interface ImmutableHistoricalReleaseManifest {
  manifestId: string
  manifestHash: string
  compatibility: RuntimeExecutionCompatibilityIdentity
}

interface HistoricalIntegrityResolutionBase {
  matchSetId: string
  originalCounted: boolean
  originalOutcome: unknown
  rulesVersion: string | null
  chronicleVersion: string | null
  sourceHash: string
  eligibleUnderOriginalSemantics: boolean
}

export type HistoricalIntegrityResolution =
  | (HistoricalIntegrityResolutionBase & {
      kind: "resolved_historical"
      manifestId: string
      manifestHash: string
      historicalCompatibility: Readonly<RuntimeExecutionCompatibilityIdentity>
    })
  | (HistoricalIntegrityResolutionBase & {
      kind: "legacy_incomplete"
      note: string
    })
  | (HistoricalIntegrityResolutionBase & {
      kind: "unresolved"
      note: string
    })

export type CurrentStandingsIntegrityRejectionReason =
  | "missing"
  | "unknown_tuple"
  | "mixed_tuple"
  | "uncertified"

export type CurrentStandingsIntegrityResolution =
  | {
      kind: "current_certified"
      identity: Readonly<MatchSetIntegrityIdentity>
    }
  | {
      kind: "current_rejected"
      reason: CurrentStandingsIntegrityRejectionReason
    }

export type StandingsIntegrityResolution =
  | HistoricalIntegrityResolution
  | CurrentStandingsIntegrityResolution

const validatedIdentityInstances = new WeakSet<object>()
const historicalResolutionInstances = new WeakSet<object>()
const currentStandingsResolutionInstances = new WeakSet<object>()

const assertValidatedIdentity = (
  identity: Readonly<MatchSetIntegrityIdentity>,
): void => {
  if (!validatedIdentityInstances.has(identity as object)) {
    throw new IntegrityEvidenceInputError(
      "MatchSet integrity identity must be created by the exact validator.",
    )
  }
}

const IDENTITY_INPUT_KEYS = [
  "compatibility",
  "authorityBundleHash",
  "registryGeneration",
  "expectedEntrants",
  "entrants",
] as const

const LANE_IDENTITY_STRING_FIELDS = [
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
] as const satisfies readonly (keyof ExecutableLaneIdentity)[]

const CERTIFICATE_REFERENCE_FIELDS = [
  "kind",
  "certificateId",
  "certificateVersion",
  "certificateRecordHash",
  "registryGeneration",
] as const satisfies readonly (keyof ExecutableLaneCertificateReference)[]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const assertExactKeys = (
  value: Record<string, unknown>,
  fields: readonly string[],
  label: string,
): void => {
  const actual = Object.keys(value).sort()
  const expected = [...fields].sort()
  if (
    actual.length !== expected.length ||
    actual.some((field, index) => field !== expected[index])
  ) {
    throw new IntegrityEvidenceInputError(`${label} must use one exact identity shape.`)
  }
}

const requiredString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new IntegrityEvidenceInputError(`${label} must be a non-empty string.`)
  }
  return value
}

const assertSha256 = (value: unknown, label: string): string => {
  const hash = requiredString(value, label)
  if (!/^[0-9a-f]{64}$/u.test(hash)) {
    throw new IntegrityEvidenceInputError(`${label} must be a lowercase SHA-256 hash.`)
  }
  return hash
}

const cloneTuple = (
  tuple: CanonicalCompatibilityTuple,
): Readonly<CanonicalCompatibilityTuple> => Object.freeze({ ...tuple })

const validateCompatibility = (
  value: unknown,
): Readonly<RuntimeExecutionCompatibilityIdentity> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError("Compatibility tuple is required.")
  }
  assertExactKeys(value, ["tupleId", "tuple"], "Compatibility")
  const tupleId = requiredString(value.tupleId, "Compatibility tuple ID")
  const resolved = resolveCanonicalCompatibilityTuple({
    tupleId,
    tuple: value.tuple,
  })
  if (!resolved) {
    throw new IntegrityEvidenceInputError("Compatibility tuple is unknown or uncertified.")
  }
  return Object.freeze({ tupleId, tuple: cloneTuple({ ...resolved.tuple }) })
}

const validateLaneIdentity = (
  value: unknown,
  compatibility: RuntimeExecutionCompatibilityIdentity,
): Readonly<ExecutableLaneIdentity> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError("Entrant lane identity is required.")
  }
  assertExactKeys(
    value,
    [...LANE_IDENTITY_STRING_FIELDS, "semanticTuple"],
    "Entrant lane identity",
  )
  const strings = Object.fromEntries(
    LANE_IDENTITY_STRING_FIELDS.map((field) => [
      field,
      requiredString(value[field], `Lane identity ${field}`),
    ]),
  ) as unknown as Pick<
    ExecutableLaneIdentity,
    (typeof LANE_IDENTITY_STRING_FIELDS)[number]
  >
  if (strings.semanticTupleId !== compatibility.tupleId) {
    throw new IntegrityEvidenceInputError("Entrant lane semantic tuple ID is mixed.")
  }
  const resolved = resolveCanonicalCompatibilityTuple({
    tupleId: strings.semanticTupleId,
    tuple: value.semanticTuple,
  })
  if (
    !resolved ||
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.some(
      (field) => resolved.tuple[field] !== compatibility.tuple[field],
    )
  ) {
    throw new IntegrityEvidenceInputError("Entrant lane semantic tuple is mixed or uncertified.")
  }
  return Object.freeze({
    ...strings,
    semanticTuple: cloneTuple({ ...resolved.tuple }),
  }) as Readonly<ExecutableLaneIdentity>
}

const validateCertificateReference = <K extends "containment" | "conformance">(
  value: unknown,
  kind: K,
  registryGeneration: string,
): Readonly<ExecutableLaneCertificateReference & { kind: K }> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError(`${kind} certificate reference is required.`)
  }
  assertExactKeys(value, CERTIFICATE_REFERENCE_FIELDS, `${kind} certificate reference`)
  if (value.kind !== kind) {
    throw new IntegrityEvidenceInputError(`${kind} certificate reference has the wrong kind.`)
  }
  const reference = {
    kind,
    certificateId: requiredString(value.certificateId, `${kind} certificate ID`),
    certificateVersion: requiredString(
      value.certificateVersion,
      `${kind} certificate version`,
    ),
    certificateRecordHash: assertSha256(
      value.certificateRecordHash,
      `${kind} certificate record hash`,
    ),
    registryGeneration: requiredString(
      value.registryGeneration,
      `${kind} certificate registry generation`,
    ),
  }
  if (reference.registryGeneration !== registryGeneration) {
    throw new IntegrityEvidenceInputError(`${kind} certificate registry generation drifted.`)
  }
  return Object.freeze(reference)
}

const validateEntrant = (
  value: unknown,
  compatibility: RuntimeExecutionCompatibilityIdentity,
  registryGeneration: string,
): Readonly<EntrantExecutionEvidence> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError("Entrant execution evidence is required.")
  }
  const requiredEntrantFields = [
    "entrantKey",
    "strategyRevisionId",
    "laneIdentity",
    "containmentCertificateRef",
    "schedulingDecision",
  ] as const
  const entrantFields = new Set([
    ...requiredEntrantFields,
    "conformanceCertificateRef",
  ])
  if (
    requiredEntrantFields.some((field) => !Object.hasOwn(value, field)) ||
    Object.keys(value).some((field) => !entrantFields.has(field))
  ) {
    throw new IntegrityEvidenceInputError(
      "Entrant execution evidence must use one exact identity shape.",
    )
  }
  const entrantKey = requiredString(value.entrantKey, "Entrant key")
  const strategyRevisionId = requiredString(
    value.strategyRevisionId,
    "Strategy Revision ID",
  )
  const laneIdentity = validateLaneIdentity(value.laneIdentity, compatibility)
  const containmentCertificateRef = validateCertificateReference(
    value.containmentCertificateRef,
    "containment",
    registryGeneration,
  )
  const conformanceCertificateRef =
    value.conformanceCertificateRef === undefined
      ? undefined
      : validateCertificateReference(
          value.conformanceCertificateRef,
          "conformance",
          registryGeneration,
        )
  if (
    conformanceCertificateRef &&
    containmentCertificateRef.certificateId ===
    conformanceCertificateRef.certificateId
  ) {
    throw new IntegrityEvidenceInputError("Containment and conformance certificates must be distinct.")
  }
  if (!isRecord(value.schedulingDecision)) {
    throw new IntegrityEvidenceInputError("Scheduling decision is required.")
  }
  assertExactKeys(
    value.schedulingDecision,
    ["status", "reasonCode", "evaluatedAt", "freshUntil", "registryGeneration"],
    "Scheduling decision",
  )
  if (
    typeof value.schedulingDecision.status !== "string" ||
    !(EXECUTABLE_LANE_EVIDENCE_STATUSES as readonly string[]).includes(
      value.schedulingDecision.status,
    ) ||
    typeof value.schedulingDecision.reasonCode !== "string" ||
    !(EXECUTABLE_LANE_EVIDENCE_REASON_CODES as readonly string[]).includes(
      value.schedulingDecision.reasonCode,
    )
  ) {
    throw new IntegrityEvidenceInputError("Scheduling decision status or reason is invalid.")
  }
  if (
    value.schedulingDecision.status === "counted"
      ? !conformanceCertificateRef
      : conformanceCertificateRef !== undefined
  ) {
    throw new IntegrityEvidenceInputError(
      value.schedulingDecision.status === "counted"
        ? "Counted execution evidence requires conformance."
        : "Non-counted execution evidence must omit conformance.",
    )
  }
  const evaluatedAt = requiredString(
    value.schedulingDecision.evaluatedAt,
    "Scheduling evaluation instant",
  )
  const freshUntil = requiredString(
    value.schedulingDecision.freshUntil,
    "Scheduling freshness bound",
  )
  const evaluatedTime = Date.parse(evaluatedAt)
  const freshTime = Date.parse(freshUntil)
  if (
    !Number.isFinite(evaluatedTime) ||
    !Number.isFinite(freshTime) ||
    freshTime < evaluatedTime ||
    value.schedulingDecision.registryGeneration !== registryGeneration
  ) {
    throw new IntegrityEvidenceInputError("Scheduling decision freshness or generation is invalid.")
  }
  return Object.freeze({
    entrantKey,
    strategyRevisionId,
    laneIdentity,
    containmentCertificateRef,
    ...(conformanceCertificateRef ? { conformanceCertificateRef } : {}),
    schedulingDecision: Object.freeze({
      status: value.schedulingDecision.status,
      reasonCode: value.schedulingDecision.reasonCode,
      evaluatedAt,
      freshUntil,
      registryGeneration,
    }),
  }) as Readonly<EntrantExecutionEvidence>
}

const framedHash = (domain: string, values: readonly string[]): string => {
  const hash = createHash("sha256")
  hash.update(domain, "utf8")
  hash.update("\0", "utf8")
  for (const value of values) {
    const bytes = Buffer.from(value, "utf8")
    hash.update(String(bytes.byteLength), "utf8")
    hash.update("\0", "utf8")
    hash.update(bytes)
    hash.update("\0", "utf8")
  }
  return hash.digest("hex")
}

const HISTORICAL_TUPLE_FIELDS = [
  ["rulesVersion", "rules"],
  ["engineVersion", "engine"],
  ["runtimeAbiVersion", "runtimeAbi"],
  ["chronicleVersion", "chronicle"],
  ["arenaCatalogVersion", "arenaCatalog"],
  ["setPolicyVersion", "setPolicy"],
] as const satisfies readonly (readonly [
  keyof HistoricalIntegritySource,
  keyof CanonicalCompatibilityTuple,
])[]

const cloneFrozenJsonValue = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => cloneFrozenJsonValue(entry)))
  }
  const clone = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      cloneFrozenJsonValue(entry),
    ]),
  )
  return Object.freeze(clone)
}

const historicalSourceValues = (
  source: Readonly<HistoricalIntegritySource>,
): string[] => [
  source.matchSetId,
  ...HISTORICAL_TUPLE_FIELDS.map(([sourceField]) =>
    source[sourceField] === null ? "<null>" : String(source[sourceField]),
  ),
  source.originalCounted ? "counted" : "not-counted",
  JSON.stringify(source.originalOutcome),
]

export const hashHistoricalIntegritySource = (
  source: Readonly<HistoricalIntegritySource>,
): string =>
  framedHash(
    "cowards-game:historical-integrity-source:v1",
    historicalSourceValues(source),
  )

const validateHistoricalSource = (
  value: Readonly<HistoricalIntegritySource>,
): Readonly<HistoricalIntegritySource> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError("Historical integrity source is required.")
  }
  assertExactKeys(
    value,
    [
      "matchSetId",
      "rulesVersion",
      "engineVersion",
      "runtimeAbiVersion",
      "chronicleVersion",
      "arenaCatalogVersion",
      "setPolicyVersion",
      "originalCounted",
      "originalOutcome",
    ],
    "Historical integrity source",
  )
  const versions = Object.fromEntries(
    HISTORICAL_TUPLE_FIELDS.map(([sourceField]) => {
      const field = value[sourceField]
      if (field !== null && (typeof field !== "string" || field.length === 0)) {
        throw new IntegrityEvidenceInputError(
          `Historical ${sourceField} must be a non-empty string or null.`,
        )
      }
      return [sourceField, field]
    }),
  ) as Pick<HistoricalIntegritySource, (typeof HISTORICAL_TUPLE_FIELDS)[number][0]>
  if (typeof value.originalCounted !== "boolean") {
    throw new IntegrityEvidenceInputError(
      "Historical original counted meaning must be explicit.",
    )
  }
  return Object.freeze({
    matchSetId: requiredString(value.matchSetId, "Historical MatchSet ID"),
    ...versions,
    originalCounted: value.originalCounted,
    originalOutcome: cloneFrozenJsonValue(value.originalOutcome),
  })
}

const validateHistoricalManifest = (
  value: Readonly<ImmutableHistoricalReleaseManifest>,
): Readonly<ImmutableHistoricalReleaseManifest> => {
  if (!isRecord(value)) {
    throw new IntegrityEvidenceInputError("Historical release manifest is required.")
  }
  assertExactKeys(
    value,
    ["manifestId", "manifestHash", "compatibility"],
    "Historical release manifest",
  )
  return Object.freeze({
    manifestId: requiredString(value.manifestId, "Historical manifest ID"),
    manifestHash: assertSha256(value.manifestHash, "Historical manifest hash"),
    compatibility: validateCompatibility(value.compatibility),
  })
}

export const resolveHistoricalIntegrityEvidence = (input: {
  source: Readonly<HistoricalIntegritySource>
  releaseManifests: readonly Readonly<ImmutableHistoricalReleaseManifest>[]
}): Readonly<HistoricalIntegrityResolution> => {
  const source = validateHistoricalSource(input.source)
  if (!Array.isArray(input.releaseManifests)) {
    throw new IntegrityEvidenceInputError(
      "Historical release manifests must be an immutable list.",
    )
  }
  const manifests = input.releaseManifests.map(validateHistoricalManifest)
  const matching = manifests.filter((manifest) =>
    HISTORICAL_TUPLE_FIELDS.every(([sourceField, tupleField]) => {
      const persisted = source[sourceField]
      return persisted === null || persisted === manifest.compatibility.tuple[tupleField]
    }),
  )
  const base: HistoricalIntegrityResolutionBase = {
    matchSetId: source.matchSetId,
    originalCounted: source.originalCounted,
    originalOutcome: source.originalOutcome,
    rulesVersion: source.rulesVersion,
    chronicleVersion: source.chronicleVersion,
    sourceHash: hashHistoricalIntegritySource(source),
    eligibleUnderOriginalSemantics: false,
  }
  const hasRequiredV14Anchors =
    source.rulesVersion === "cowards-rules-v1.4" &&
    source.chronicleVersion === "chronicle-v1.4"

  if (hasRequiredV14Anchors && matching.length === 1) {
    const manifest = matching[0]!
    const resolution = Object.freeze({
      ...base,
      kind: "resolved_historical" as const,
      manifestId: manifest.manifestId,
      manifestHash: manifest.manifestHash,
      historicalCompatibility: manifest.compatibility,
      eligibleUnderOriginalSemantics: source.originalCounted,
    })
    historicalResolutionInstances.add(resolution)
    return resolution
  }

  if (matching.length > 0 && (source.rulesVersion === null || source.chronicleVersion === null)) {
    const resolution = Object.freeze({
      ...base,
      kind: "legacy_incomplete" as const,
      note: "This historical result does not contain enough immutable version evidence for standings recomputation.",
    })
    historicalResolutionInstances.add(resolution)
    return resolution
  }

  const resolution = Object.freeze({
    ...base,
    kind: "unresolved" as const,
    note: "This historical result remains readable under its recorded labels but its integrity identity is unresolved.",
  })
  historicalResolutionInstances.add(resolution)
  return resolution
}

const currentStandingsRejection = (
  reason: CurrentStandingsIntegrityRejectionReason,
): Readonly<CurrentStandingsIntegrityResolution> => {
  const resolution = Object.freeze({ kind: "current_rejected" as const, reason })
  currentStandingsResolutionInstances.add(resolution)
  return resolution
}

export const resolveCurrentStandingsIntegrityEvidence = (
  input: MatchSetIntegrityIdentityInput | unknown,
): Readonly<CurrentStandingsIntegrityResolution> => {
  if (input === null || input === undefined) {
    return currentStandingsRejection("missing")
  }
  let identity: Readonly<MatchSetIntegrityIdentity>
  try {
    identity = createMatchSetIntegrityIdentity(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (/compatibility tuple is unknown/iu.test(message)) {
      return currentStandingsRejection("unknown_tuple")
    }
    if (/mixed/iu.test(message)) {
      return currentStandingsRejection("mixed_tuple")
    }
    return currentStandingsRejection("uncertified")
  }
  if (
    identity.normalizedEntrants.some(
      (entrant) =>
        entrant.schedulingDecision.status !== "counted" ||
        entrant.schedulingDecision.reasonCode !== "EVIDENCE_CURRENT" ||
        entrant.containmentCertificateRef.registryGeneration !==
          identity.registryGeneration ||
        entrant.conformanceCertificateRef?.registryGeneration !==
          identity.registryGeneration,
    )
  ) {
    return currentStandingsRejection("uncertified")
  }
  const resolution = Object.freeze({
    kind: "current_certified" as const,
    identity,
  })
  currentStandingsResolutionInstances.add(resolution)
  return resolution
}

export const isStandingsIntegrityEligible = (
  resolution: Readonly<StandingsIntegrityResolution> | undefined,
  strategyRevisionIds: readonly string[],
): boolean => {
  if (!resolution || typeof resolution !== "object") return false
  if (resolution.kind === "current_certified") {
    if (!currentStandingsResolutionInstances.has(resolution as object)) return false
    const expected = [...new Set(strategyRevisionIds)].sort()
    const certified = [
      ...new Set(
        resolution.identity.normalizedEntrants.map(
          (entrant) => entrant.strategyRevisionId,
        ),
      ),
    ].sort()
    return (
      expected.length === certified.length &&
      expected.every((revision, index) => revision === certified[index])
    )
  }
  if (!historicalResolutionInstances.has(resolution as object)) return false
  return (
    resolution.kind === "resolved_historical" &&
    resolution.originalCounted &&
    resolution.eligibleUnderOriginalSemantics
  )
}

const entrantHashValues = (
  entrant: Readonly<EntrantExecutionEvidence>,
): string[] => [
  entrant.entrantKey,
  entrant.strategyRevisionId,
  ...LANE_IDENTITY_STRING_FIELDS.map((field) => entrant.laneIdentity[field]),
  ...CANONICAL_COMPATIBILITY_TUPLE_FIELDS.map(
    (field) => entrant.laneIdentity.semanticTuple[field],
  ),
  ...CERTIFICATE_REFERENCE_FIELDS.map((field) =>
    String(entrant.containmentCertificateRef[field]),
  ),
  ...CERTIFICATE_REFERENCE_FIELDS.map((field) =>
    entrant.conformanceCertificateRef
      ? String(entrant.conformanceCertificateRef[field])
      : "",
  ),
  entrant.schedulingDecision.status,
  entrant.schedulingDecision.reasonCode,
  entrant.schedulingDecision.evaluatedAt,
  entrant.schedulingDecision.freshUntil,
  entrant.schedulingDecision.registryGeneration,
]

export const hashEntrantLaneIdentity = (
  identity: Readonly<ExecutableLaneIdentity>,
): string =>
  framedHash("cowards-game:executable-lane-identity:v1", [
    ...LANE_IDENTITY_STRING_FIELDS.map((field) => identity[field]),
    ...CANONICAL_COMPATIBILITY_TUPLE_FIELDS.map(
      (field) => identity.semanticTuple[field],
    ),
  ])

export const createMatchSetIntegrityIdentity = (
  input: MatchSetIntegrityIdentityInput | unknown,
): Readonly<MatchSetIntegrityIdentity> => {
  if (!isRecord(input)) {
    throw new IntegrityEvidenceInputError("MatchSet integrity identity is required.")
  }
  assertExactKeys(input, IDENTITY_INPUT_KEYS, "MatchSet integrity identity")
  const compatibility = validateCompatibility(input.compatibility)
  const authorityBundleHash = assertSha256(
    input.authorityBundleHash,
    "Authority bundle hash",
  )
  const registryGeneration = requiredString(
    input.registryGeneration,
    "Authority registry generation",
  )
  if (!Array.isArray(input.expectedEntrants) || !Array.isArray(input.entrants)) {
    throw new IntegrityEvidenceInputError("Expected and actual entrant coverage are required.")
  }
  if (input.expectedEntrants.length < 2 || input.expectedEntrants.length > 8) {
    throw new IntegrityEvidenceInputError("MatchSet entrant coverage must contain two through eight entrants.")
  }
  const expectedByKey = new Map<string, string>()
  for (const expected of input.expectedEntrants) {
    if (!isRecord(expected)) {
      throw new IntegrityEvidenceInputError("Expected entrant binding is invalid.")
    }
    assertExactKeys(expected, ["entrantKey", "strategyRevisionId"], "Expected entrant")
    const key = requiredString(expected.entrantKey, "Expected entrant key")
    const revision = requiredString(
      expected.strategyRevisionId,
      "Expected Strategy Revision ID",
    )
    if (expectedByKey.has(key)) {
      throw new IntegrityEvidenceInputError(`Duplicate expected entrant key: ${key}`)
    }
    expectedByKey.set(key, revision)
  }
  if (input.entrants.length !== expectedByKey.size) {
    throw new IntegrityEvidenceInputError("Entrant evidence coverage is incomplete or contains extras.")
  }
  const actualByKey = new Map<string, Readonly<EntrantExecutionEvidence>>()
  for (const rawEntrant of input.entrants) {
    const entry = validateEntrant(rawEntrant, compatibility, registryGeneration)
    if (actualByKey.has(entry.entrantKey)) {
      throw new IntegrityEvidenceInputError(`Duplicate entrant key: ${entry.entrantKey}`)
    }
    const expectedRevision = expectedByKey.get(entry.entrantKey)
    if (!expectedRevision) {
      throw new IntegrityEvidenceInputError(`Entrant coverage contains an extra key: ${entry.entrantKey}`)
    }
    if (expectedRevision !== entry.strategyRevisionId) {
      throw new IntegrityEvidenceInputError(
        `Entrant ${entry.entrantKey} has the wrong Strategy Revision binding.`,
      )
    }
    actualByKey.set(entry.entrantKey, entry)
  }
  for (const key of expectedByKey.keys()) {
    if (!actualByKey.has(key)) {
      throw new IntegrityEvidenceInputError(`Entrant evidence coverage is missing ${key}.`)
    }
  }
  const normalizedEntrants = Object.freeze(
    [...actualByKey.values()].sort((left, right) =>
      Buffer.compare(
        Buffer.from(left.entrantKey, "utf8"),
        Buffer.from(right.entrantKey, "utf8"),
      ),
    ),
  )
  const evidenceSetHash = framedHash(
    "cowards-game:match-set-execution-evidence-set:v1",
    [
      compatibility.tupleId,
      ...CANONICAL_COMPATIBILITY_TUPLE_FIELDS.map(
        (field) => compatibility.tuple[field],
      ),
      authorityBundleHash,
      registryGeneration,
      ...normalizedEntrants.flatMap(entrantHashValues),
    ],
  )
  const entrantsByKey = Object.create(null) as Record<
    string,
    Readonly<EntrantExecutionEvidence>
  >
  for (const entry of normalizedEntrants) entrantsByKey[entry.entrantKey] = entry
  const identity = Object.freeze({
    compatibility,
    authorityBundleHash,
    registryGeneration,
    normalizedEntrants,
    entrantsByKey: Object.freeze(entrantsByKey),
    evidenceSetHash,
  })
  validatedIdentityInstances.add(identity)
  return identity
}

export const createMatchExecutionEvidencePair = (
  identity: Readonly<MatchSetIntegrityIdentity>,
  selector: MatchExecutionEvidencePairSelector,
): Readonly<MatchExecutionEvidencePair> => {
  assertValidatedIdentity(identity)
  if (selector.bottomEntrantKey === selector.topEntrantKey) {
    throw new IntegrityEvidenceInputError("Match side entrant keys must be distinct.")
  }
  const bottom = identity.entrantsByKey[selector.bottomEntrantKey]
  const top = identity.entrantsByKey[selector.topEntrantKey]
  if (!bottom || !top) {
    throw new IntegrityEvidenceInputError("Match side selector contains an unknown entrant key.")
  }
  if (
    bottom.strategyRevisionId !== selector.bottomStrategyRevisionId ||
    top.strategyRevisionId !== selector.topStrategyRevisionId
  ) {
    throw new IntegrityEvidenceInputError("Match side Strategy Revision binding is swapped or invalid.")
  }
  return Object.freeze({
    bottom,
    top,
    pairHash: framedHash("cowards-game:match-execution-evidence-pair:v1", [
      identity.evidenceSetHash,
      bottom.entrantKey,
      bottom.strategyRevisionId,
      top.entrantKey,
      top.strategyRevisionId,
    ]),
  })
}

export const MATCH_SET_INTEGRITY_SQL_COLUMNS = Object.freeze([
  "compatibility_tuple_id",
  "compatibility_rules_version",
  "compatibility_engine_version",
  "compatibility_runtime_abi_version",
  "compatibility_chronicle_version",
  "compatibility_arena_catalog_version",
  "compatibility_set_policy_version",
  "authority_bundle_hash",
  "authority_registry_generation",
  "execution_evidence_set",
  "execution_evidence_set_hash",
] as const)

export const matchSetIntegritySqlValues = (
  identity: Readonly<MatchSetIntegrityIdentity>,
): readonly unknown[] => {
  assertValidatedIdentity(identity)
  return Object.freeze([
    identity.compatibility.tupleId,
    identity.compatibility.tuple.rules,
    identity.compatibility.tuple.engine,
    identity.compatibility.tuple.runtimeAbi,
    identity.compatibility.tuple.chronicle,
    identity.compatibility.tuple.arenaCatalog,
    identity.compatibility.tuple.setPolicy,
    identity.authorityBundleHash,
    identity.registryGeneration,
    identity.normalizedEntrants,
    identity.evidenceSetHash,
  ])
}

export const matchSetExecutionEntrantSqlValues = (
  matchSetId: string,
  entrant: Readonly<EntrantExecutionEvidence>,
): readonly unknown[] => Object.freeze([
  matchSetId,
  entrant.entrantKey,
  entrant.strategyRevisionId,
  entrant.laneIdentity,
  hashEntrantLaneIdentity(entrant.laneIdentity),
  entrant.containmentCertificateRef.kind,
  entrant.containmentCertificateRef.certificateId,
  entrant.containmentCertificateRef.certificateVersion,
  entrant.containmentCertificateRef.certificateRecordHash,
  entrant.conformanceCertificateRef?.kind ?? null,
  entrant.conformanceCertificateRef?.certificateId ?? null,
  entrant.conformanceCertificateRef?.certificateVersion ?? null,
  entrant.conformanceCertificateRef?.certificateRecordHash ?? null,
  entrant.schedulingDecision.status,
  entrant.schedulingDecision.reasonCode,
  entrant.schedulingDecision.evaluatedAt,
  entrant.schedulingDecision.freshUntil,
  entrant.containmentCertificateRef.registryGeneration,
  entrant,
])

export const matchExecutionEvidencePairSqlValues = (
  matchSetId: string,
  pair: Readonly<MatchExecutionEvidencePair>,
): readonly unknown[] => Object.freeze([
  matchSetId,
  pair.bottom.entrantKey,
  pair.top.entrantKey,
  pair.bottom,
  pair.top,
  pair.pairHash,
])

export interface MatchSetIntegrityRow {
  compatibility_tuple_id: string
  compatibility_rules_version: string
  compatibility_engine_version: string
  compatibility_runtime_abi_version: string
  compatibility_chronicle_version: string
  compatibility_arena_catalog_version: string
  compatibility_set_policy_version: string
  authority_bundle_hash: string
  authority_registry_generation: string
  execution_evidence_set: unknown
  execution_evidence_set_hash: string
}

export interface MatchSetExecutionEntrantRow {
  match_set_id: string
  entrant_key: string
  strategy_revision_id: string
  execution_snapshot: unknown
}

const canonicalizePersistedEntrantSnapshot = (
  value: unknown,
): EntrantExecutionEvidence => {
  if (!isRecord(value) || !isRecord(value.laneIdentity)) {
    throw new IntegrityEvidenceInputError(
      "Persisted execution evidence snapshot is malformed.",
    )
  }
  const laneIdentity = value.laneIdentity
  const persistedTuple = laneIdentity.semanticTuple
  if (!isRecord(persistedTuple)) {
    throw new IntegrityEvidenceInputError(
      "Persisted lane semantic tuple is malformed.",
    )
  }
  const semanticTuple = Object.fromEntries(
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.map((field) => [
      field,
      persistedTuple[field],
    ]),
  ) as unknown as CanonicalCompatibilityTuple
  return {
    ...(value as unknown as EntrantExecutionEvidence),
    laneIdentity: {
      ...(laneIdentity as unknown as ExecutableLaneIdentity),
      semanticTuple,
    },
  }
}

export const parseMatchSetIntegrityIdentityRows = (
  matchSet: MatchSetIntegrityRow,
  entrantRows: readonly MatchSetExecutionEntrantRow[],
): Readonly<MatchSetIntegrityIdentity> => {
  if (!Array.isArray(matchSet.execution_evidence_set)) {
    throw new IntegrityEvidenceInputError("Persisted execution evidence set is missing.")
  }
  const identity = createMatchSetIntegrityIdentity({
    compatibility: {
      tupleId: matchSet.compatibility_tuple_id,
      tuple: {
        rules: matchSet.compatibility_rules_version,
        engine: matchSet.compatibility_engine_version,
        runtimeAbi: matchSet.compatibility_runtime_abi_version,
        chronicle: matchSet.compatibility_chronicle_version,
        arenaCatalog: matchSet.compatibility_arena_catalog_version,
        setPolicy: matchSet.compatibility_set_policy_version,
      },
    },
    authorityBundleHash: matchSet.authority_bundle_hash,
    registryGeneration: matchSet.authority_registry_generation,
    expectedEntrants: entrantRows.map((row) => ({
      entrantKey: row.entrant_key,
      strategyRevisionId: row.strategy_revision_id,
    })),
    entrants: entrantRows.map((row) =>
      canonicalizePersistedEntrantSnapshot(row.execution_snapshot),
    ),
  })
  if (identity.evidenceSetHash !== matchSet.execution_evidence_set_hash) {
    throw new IntegrityEvidenceInputError("Persisted execution evidence set hash mismatches its rows.")
  }
  if (!isDeepStrictEqual(identity.normalizedEntrants, matchSet.execution_evidence_set)) {
    throw new IntegrityEvidenceInputError("Persisted normalized evidence set mismatches entrant rows.")
  }
  return identity
}

export const persistMatchSetIntegrityIdentity = async (
  pool: Pool,
  input: {
    matchSetId: string
    identity: Readonly<MatchSetIntegrityIdentity>
  },
): Promise<void> => {
  assertValidatedIdentity(input.identity)
  const matchSetId = requiredString(input.matchSetId, "MatchSet ID")
  const values = matchSetIntegritySqlValues(input.identity)
  await withTransaction(pool, async (client) => {
    const updated = await client.query<{ id: string }>(
      `update match_sets set
         compatibility_tuple_id = $1,
         compatibility_rules_version = $2,
         compatibility_engine_version = $3,
         compatibility_runtime_abi_version = $4,
         compatibility_chronicle_version = $5,
         compatibility_arena_catalog_version = $6,
         compatibility_set_policy_version = $7,
         authority_bundle_hash = $8,
         authority_registry_generation = $9,
         execution_evidence_set = $10,
         execution_evidence_set_hash = $11
       where id = $12
         and compatibility_tuple_id is null
         and execution_evidence_set_hash is null
       returning id`,
      [...values, matchSetId],
    )
    if (updated.rows.length !== 1) {
      throw new IntegrityEvidenceInputError(
        "MatchSet does not exist or already has immutable integrity identity.",
      )
    }
    for (const entrant of input.identity.normalizedEntrants) {
      await client.query(
        `insert into match_set_execution_entrants (
           match_set_id, entrant_key, strategy_revision_id, lane_identity,
           lane_identity_hash, containment_certificate_kind,
           containment_certificate_id,
           containment_certificate_version, containment_certificate_hash,
           conformance_certificate_kind, conformance_certificate_id,
           conformance_certificate_version,
           conformance_certificate_hash, scheduling_status,
           scheduling_reason_code, scheduling_evaluated_at,
           scheduling_fresh_until, authority_registry_generation,
           execution_snapshot, authority_bundle_hash
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
           $14, $15, $16, $17, $18, $19, $20
         )`,
        [
          ...matchSetExecutionEntrantSqlValues(matchSetId, entrant),
          input.identity.authorityBundleHash,
        ],
      )
    }
  })
}
