import { createHash } from "node:crypto"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./versions.js"

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
      throw new Error(`Unknown canonical authority domain: ${String(record.domain)}`)
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
  if (missing.length > 0 || records.length !== CANONICAL_AUTHORITY_DOMAINS.length) {
    throw new Error(`Canonical authority registry is incomplete: ${missing.join(", ")}`)
  }
}

assertCanonicalAuthorityRegistry(authorityRegistry)

export const CANONICAL_AUTHORITY_REGISTRY: readonly Readonly<CanonicalAuthorityRecord>[] =
  Object.freeze(
    authorityRegistry.map((record) => Object.freeze({ ...record })),
  )

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

export const CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG =
  "cowards-game:canonical-compatibility-tuple:v1" as const

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
      (key, index) => key !== CANONICAL_COMPATIBILITY_TUPLE_FIELDS[index],
    )
  ) {
    throw new Error(
      `Canonical compatibility tuple fields must be exactly ${CANONICAL_COMPATIBILITY_TUPLE_FIELDS.join(", ")} in fixed order.`,
    )
  }
  for (const field of CANONICAL_COMPATIBILITY_TUPLE_FIELDS) {
    const component = record[field]
    if (
      typeof component !== "string" ||
      component.length === 0 ||
      component.includes("\0")
    ) {
      throw new Error(`Canonical compatibility tuple field ${field} is invalid.`)
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
): Readonly<CanonicalCompatibilityTuple> => Object.freeze({ ...tuple })

const makeTupleRecord = (
  tuple: CanonicalCompatibilityTuple,
): Readonly<CanonicalCompatibilityTupleRecord> => {
  const frozenTuple = freezeTuple(tuple)
  const sha256 = hashCanonicalCompatibilityTuple({ ...frozenTuple })
  return Object.freeze({
    tupleId: `sha256:${sha256}`,
    algorithm: "sha256" as const,
    sha256,
    tuple: frozenTuple,
  })
}

const canonicalV14Tuple: CanonicalCompatibilityTuple = {
  rules: COMPATIBILITY_VERSIONS.spec,
  engine: COMPATIBILITY_VERSIONS.engine,
  runtimeAbi: STRATEGY_RUNTIME_ABI_VERSION,
  chronicle: COMPATIBILITY_VERSIONS.chronicle,
  arenaCatalog: COMPATIBILITY_VERSIONS.arenaVariant,
  setPolicy: "canonical-set-policy-v1.4",
}

export const CANONICAL_COMPATIBILITY_TUPLES: readonly Readonly<CanonicalCompatibilityTupleRecord>[] =
  Object.freeze([makeTupleRecord(canonicalV14Tuple)])

const cloneFrozenTupleRecord = (
  record: CanonicalCompatibilityTupleRecord,
): Readonly<CanonicalCompatibilityTupleRecord> =>
  Object.freeze({
    tupleId: record.tupleId,
    algorithm: record.algorithm,
    sha256: record.sha256,
    tuple: freezeTuple({ ...record.tuple }),
  })

export const resolveCanonicalCompatibilityTuple = (
  selector: unknown,
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
  const sha256 = hashCanonicalCompatibilityTuple(tuple)
  if (record.tupleId !== `sha256:${sha256}`) return undefined

  const registered = CANONICAL_COMPATIBILITY_TUPLES.find(
    (entry) => entry.tupleId === record.tupleId && entry.sha256 === sha256,
  )
  if (!registered) return undefined
  if (
    CANONICAL_COMPATIBILITY_TUPLE_FIELDS.some(
      (field) => registered.tuple[field] !== tuple[field],
    )
  ) {
    return undefined
  }
  return cloneFrozenTupleRecord(registered)
}
