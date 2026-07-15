import { createHash } from "node:crypto"
import {
  COMPATIBILITY_VERSIONS,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./versions.js"
import {
  CANONICAL_IDENTITY_DOMAINS,
  hashCanonicalIdentityValue,
} from "./canonical-identity-domains.js"

/**
 * Canonical ownership and semantic identity for v1.37 integrity decisions.
 *
 * D-05 requires the tuple identifier and all six expanded components to travel
 * together. D-07 forbids aliases, ranges, wildcards, and partial acceptance.
 * D-08 deliberately excludes executable/provider/toolchain evidence: those
 * identities can stale independently without inventing a gameplay version.
 */

export const CANONICAL_AUTHORITY_DOMAINS = Object.freeze([
  "rules",
  "transition-semantics",
  "runtime-classification",
  "chronicle-validation",
  "arena-authority",
  "set-scheduling-policy",
] as const)

export type CanonicalAuthorityDomain =
  (typeof CANONICAL_AUTHORITY_DOMAINS)[number]

export interface CanonicalAuthorityRecord {
  domain: CanonicalAuthorityDomain
  packageName: string
  symbol: string
}

const authorityRegistry = [
  {
    domain: "rules",
    packageName: "@cowards/spec",
    symbol: "COMPATIBILITY_VERSIONS",
  },
  {
    domain: "transition-semantics",
    packageName: "@cowards/engine",
    symbol: "runMatch",
  },
  {
    domain: "runtime-classification",
    packageName: "@cowards/spec",
    symbol: "evaluateStrategyRuntimeCountedEligibility",
  },
  {
    domain: "chronicle-validation",
    packageName: "@cowards/replay",
    symbol: "validateCurrentChronicle",
  },
  {
    domain: "arena-authority",
    packageName: "@cowards/spec",
    symbol: "validateCanonicalArena",
  },
  {
    domain: "set-scheduling-policy",
    packageName: "@cowards/persistence",
    symbol: "scheduleTrialLadderSeason",
  },
] as const satisfies readonly CanonicalAuthorityRecord[]

const isAuthorityDomain = (value: unknown): value is CanonicalAuthorityDomain =>
  typeof value === "string" &&
  (CANONICAL_AUTHORITY_DOMAINS as readonly string[]).includes(value)

export const assertCanonicalAuthorityRegistry = (
  records: readonly CanonicalAuthorityRecord[],
): void => {
  const domains = new Set<CanonicalAuthorityDomain>()
  const owners = new Set<string>()

  for (const record of records) {
    if (!isAuthorityDomain(record.domain)) {
      throw new Error(
        `Unknown canonical authority domain: ${String(record.domain)}`,
      )
    }
    if (domains.has(record.domain)) {
      throw new Error(`Duplicate authority domain: ${record.domain}`)
    }
    if (!record.packageName || !record.symbol) {
      throw new Error(`Authority owner is incomplete for ${record.domain}`)
    }
    const owner = `${record.packageName}#${record.symbol}`
    if (owners.has(owner)) {
      throw new Error(`Duplicate authority owner: ${owner}`)
    }
    domains.add(record.domain)
    owners.add(owner)
  }

  const missing = CANONICAL_AUTHORITY_DOMAINS.filter(
    (domain) => !domains.has(domain),
  )
  if (
    missing.length > 0 ||
    records.length !== CANONICAL_AUTHORITY_DOMAINS.length
  ) {
    throw new Error(
      `Canonical authority registry is incomplete: ${missing.join(", ")}`,
    )
  }
}

assertCanonicalAuthorityRegistry(authorityRegistry)

export const CANONICAL_AUTHORITY_REGISTRY: readonly Readonly<CanonicalAuthorityRecord>[] =
  Object.freeze(authorityRegistry.map((record) => Object.freeze({ ...record })))

export const CANONICAL_COMPATIBILITY_TUPLE_FIELDS = Object.freeze([
  "rules",
  "engine",
  "runtimeAbi",
  "chronicle",
  "arenaCatalog",
  "setPolicy",
] as const)

export type CanonicalCompatibilityTupleField =
  (typeof CANONICAL_COMPATIBILITY_TUPLE_FIELDS)[number]

export interface CanonicalCompatibilityTuple {
  rules: string
  engine: string
  runtimeAbi: string
  chronicle: string
  arenaCatalog: string
  setPolicy: string
}

export interface CanonicalCompatibilityTupleRecord {
  tupleId: string
  algorithm: "sha256"
  sha256: string
  tuple: Readonly<CanonicalCompatibilityTuple>
}

export const CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES = Object.freeze({
  legacy: Object.freeze({
    identityProfile: "legacy-compatibility-tuple-v1",
    encodingId: "nul-delimited-decimal-length-utf8-v1",
    kind: "legacy-nul-field-tuple",
    domainTag: "cowards-game:canonical-compatibility-tuple:v1",
  }),
  successor: Object.freeze({
    identityProfile: "runtime-identity-semantic-tuple-v1",
    encodingId: "canonical-json-v1.1-u64be-domain-frame-v1",
    kind: "canonical-json-domain-frame",
    domainTag: CANONICAL_IDENTITY_DOMAINS.semanticTuple,
  }),
} as const)

export type CanonicalCompatibilityTupleIdentityProfile =
  (typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES)[keyof typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES]["identityProfile"]

export type CanonicalCompatibilityTupleEncodingId =
  (typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES)[keyof typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES]["encodingId"]

export interface VersionedCanonicalCompatibilityTupleRecord extends CanonicalCompatibilityTupleRecord {
  identityProfile: CanonicalCompatibilityTupleIdentityProfile
  encodingId: CanonicalCompatibilityTupleEncodingId
}

export const CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG =
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.domainTag

const textEncoder = new TextEncoder()

const assertCanonicalCompatibilityTuple: (
  value: unknown,
) => asserts value is CanonicalCompatibilityTuple = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Canonical compatibility tuple must be an object.")
  }
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== CANONICAL_COMPATIBILITY_TUPLE_FIELDS.length ||
    keys.some(
      (key) =>
        !(CANONICAL_COMPATIBILITY_TUPLE_FIELDS as readonly string[]).includes(
          key,
        ),
    )
  ) {
    throw new Error(
      `Canonical compatibility tuple fields must be exactly ${CANONICAL_COMPATIBILITY_TUPLE_FIELDS.join(", ")}.`,
    )
  }
  for (const field of CANONICAL_COMPATIBILITY_TUPLE_FIELDS) {
    const component = record[field]
    if (
      typeof component !== "string" ||
      component.length === 0 ||
      component.includes("\0")
    ) {
      throw new Error(
        `Canonical compatibility tuple field ${field} is invalid.`,
      )
    }
  }
}

const concatBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  const byteLength = parts.reduce((total, part) => total + part.byteLength, 0)
  const bytes = new Uint8Array(byteLength)
  let offset = 0
  for (const part of parts) {
    bytes.set(part, offset)
    offset += part.byteLength
  }
  return bytes
}

export const encodeCanonicalCompatibilityTuple = (
  tuple: CanonicalCompatibilityTuple,
): Uint8Array => {
  assertCanonicalCompatibilityTuple(tuple)
  const nul = new Uint8Array([0])
  const parts: Uint8Array[] = [
    textEncoder.encode(CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG),
    nul,
  ]

  for (const field of CANONICAL_COMPATIBILITY_TUPLE_FIELDS) {
    const valueBytes = textEncoder.encode(tuple[field])
    parts.push(
      textEncoder.encode(field),
      nul,
      textEncoder.encode(String(valueBytes.byteLength)),
      nul,
      valueBytes,
      nul,
    )
  }
  return concatBytes(parts)
}

export const hashCanonicalCompatibilityTuple = (
  tuple: CanonicalCompatibilityTuple,
): string =>
  createHash("sha256")
    .update(encodeCanonicalCompatibilityTuple(tuple))
    .digest("hex")

const freezeTuple = (
  tuple: CanonicalCompatibilityTuple,
): Readonly<CanonicalCompatibilityTuple> => {
  assertCanonicalCompatibilityTuple(tuple)
  return Object.freeze({
    rules: tuple.rules,
    engine: tuple.engine,
    runtimeAbi: tuple.runtimeAbi,
    chronicle: tuple.chronicle,
    arenaCatalog: tuple.arenaCatalog,
    setPolicy: tuple.setPolicy,
  })
}

export const prepareCanonicalCompatibilityTupleRecord = (
  tuple: CanonicalCompatibilityTuple,
  identityProfile: CanonicalCompatibilityTupleIdentityProfile,
): Readonly<CanonicalCompatibilityTupleRecord> => {
  const frozenTuple = freezeTuple(tuple)
  const sha256 =
    identityProfile ===
    CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.identityProfile
      ? hashCanonicalCompatibilityTuple({ ...frozenTuple })
      : identityProfile ===
          CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor
            .identityProfile
        ? hashCanonicalIdentityValue("semanticTuple", { ...frozenTuple })
        : undefined
  if (sha256 === undefined) {
    throw new Error(
      "Canonical compatibility tuple identity profile is unknown.",
    )
  }
  return Object.freeze({
    tupleId: `sha256:${sha256}`,
    algorithm: "sha256" as const,
    sha256,
    tuple: frozenTuple,
  })
}

const historicalRuntimeV114Tuple: CanonicalCompatibilityTuple = {
  rules: COMPATIBILITY_VERSIONS.spec,
  engine: COMPATIBILITY_VERSIONS.engine,
  runtimeAbi: "strategy-runtime-abi-v1.14",
  chronicle: COMPATIBILITY_VERSIONS.chronicle,
  arenaCatalog: COMPATIBILITY_VERSIONS.arenaVariant,
  setPolicy: "canonical-set-policy-v1.4",
}

const candidateRuntimeV117Tuple: CanonicalCompatibilityTuple = {
  rules: COMPATIBILITY_VERSIONS.spec,
  engine: COMPATIBILITY_VERSIONS.engine,
  runtimeAbi: "strategy-runtime-abi-v1.17",
  chronicle: COMPATIBILITY_VERSIONS.chronicle,
  arenaCatalog: COMPATIBILITY_VERSIONS.arenaVariant,
  setPolicy: "canonical-set-policy-v1.4",
}

export const HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD =
  prepareCanonicalCompatibilityTupleRecord(
    historicalRuntimeV114Tuple,
    CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.identityProfile,
  )

export const HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE =
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD.tuple

export const HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID =
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD.tupleId

export const CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD =
  prepareCanonicalCompatibilityTupleRecord(
    candidateRuntimeV117Tuple,
    CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor.identityProfile,
  )

export const CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE =
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tuple

export const CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID =
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tupleId

const versionTupleRecord = (
  record: Readonly<CanonicalCompatibilityTupleRecord>,
  profile: (typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES)[keyof typeof CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES],
): Readonly<VersionedCanonicalCompatibilityTupleRecord> =>
  Object.freeze({
    identityProfile: profile.identityProfile,
    encodingId: profile.encodingId,
    ...record,
  })

export const VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD = versionTupleRecord(
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy,
)

export const VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD = versionTupleRecord(
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor,
)

const compatibilityTupleRecordsByKey = Object.freeze({
  "runtime-v1.14": VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  "runtime-v1.17": VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
})

if (
  !Object.hasOwn(
    compatibilityTupleRecordsByKey,
    CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY,
  )
) {
  throw new Error("Current canonical compatibility tuple key is unknown.")
}

export const CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD =
  compatibilityTupleRecordsByKey[
    CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY as keyof typeof compatibilityTupleRecordsByKey
  ]

if (
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple.runtimeAbi !==
  STRATEGY_RUNTIME_ABI_VERSION
) {
  throw new Error("Current canonical tuple and runtime ABI pointers are split.")
}

export const CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID =
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId

export const REGISTERED_CANONICAL_COMPATIBILITY_TUPLES: readonly Readonly<VersionedCanonicalCompatibilityTupleRecord>[] =
  Object.freeze([
    VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
    VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  ])

export const CANONICAL_COMPATIBILITY_TUPLES: readonly Readonly<CanonicalCompatibilityTupleRecord>[] =
  Object.freeze([CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD])

const cloneFrozenTupleRecord = (
  record: VersionedCanonicalCompatibilityTupleRecord,
): Readonly<VersionedCanonicalCompatibilityTupleRecord> =>
  Object.freeze({
    identityProfile: record.identityProfile,
    encodingId: record.encodingId,
    tupleId: record.tupleId,
    algorithm: record.algorithm,
    sha256: record.sha256,
    tuple: freezeTuple({ ...record.tuple }),
  })

const resolveCompatibilityTupleFrom = (
  selector: unknown,
  allowed: readonly Readonly<VersionedCanonicalCompatibilityTupleRecord>[],
): Readonly<CanonicalCompatibilityTupleRecord> | undefined => {
  if (!selector || typeof selector !== "object" || Array.isArray(selector)) {
    return undefined
  }
  const record = selector as Record<string, unknown>
  if (
    Object.keys(record).length !== 2 ||
    Object.keys(record)[0] !== "tupleId" ||
    Object.keys(record)[1] !== "tuple" ||
    typeof record.tupleId !== "string"
  ) {
    return undefined
  }

  try {
    assertCanonicalCompatibilityTuple(record.tuple)
  } catch {
    return undefined
  }
  const tuple = record.tuple
  const registered = allowed.find((entry) => entry.tupleId === record.tupleId)
  if (!registered) return undefined
  const recomputed = prepareCanonicalCompatibilityTupleRecord(
    { ...tuple },
    registered.identityProfile,
  )
  if (
    recomputed.tupleId !== record.tupleId ||
    recomputed.sha256 !== registered.sha256
  ) {
    return undefined
  }
  if (
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.some(
      (field) => registered.tuple[field] !== tuple[field],
    )
  ) {
    return undefined
  }
  return cloneFrozenTupleRecord(registered)
}

export const resolveCanonicalCompatibilityTuple = (
  selector: unknown,
): Readonly<CanonicalCompatibilityTupleRecord> | undefined =>
  resolveCompatibilityTupleFrom(selector, [
    CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  ])

export const resolveCandidateRuntimeV117SemanticTuple = (
  selector: unknown,
): Readonly<CanonicalCompatibilityTupleRecord> | undefined =>
  resolveCompatibilityTupleFrom(selector, [
    VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  ])

export const resolveHistoricalRuntimeV114SemanticTuple = (
  selector: unknown,
): Readonly<CanonicalCompatibilityTupleRecord> | undefined =>
  resolveCompatibilityTupleFrom(selector, [
    VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  ])

export const resolveRegisteredCanonicalCompatibilityTuple = (
  selector: unknown,
): Readonly<CanonicalCompatibilityTupleRecord> | undefined =>
  resolveCompatibilityTupleFrom(
    selector,
    REGISTERED_CANONICAL_COMPATIBILITY_TUPLES,
  )

export type CanonicalCompatibilityTupleLifecycle =
  | "current-exact"
  | "historical-v1.16-exact"
  | "historical-or-unknown"

export const classifyCanonicalCompatibilityTupleIdAgainstCurrent = (
  tupleId: string,
  currentTupleId: string,
): CanonicalCompatibilityTupleLifecycle =>
  tupleId === currentTupleId
    ? "current-exact"
    : tupleId === HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID
      ? "historical-v1.16-exact"
      : "historical-or-unknown"

export const classifyCanonicalCompatibilityTupleId = (
  tupleId: string,
): CanonicalCompatibilityTupleLifecycle =>
  classifyCanonicalCompatibilityTupleIdAgainstCurrent(
    tupleId,
    CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
  )
