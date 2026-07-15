#!/usr/bin/env -S pnpm exec tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_AUTHORITY_REGISTRY,
  CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  encodeCanonicalCompatibilityTuple,
  hashCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "../packages/spec/src/integrity-authority.js"
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"
import { frameCanonicalIdentity } from "../packages/spec/src/canonical-identity-domains.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const authorityArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority.json" as const
export const hashVectorsArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-hash-vectors.json" as const
export const successorAuthorityArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-v1.17.json" as const
export const successorHashVectorsArtifactPath =
  "packages/spec/artifacts/v1.37-integrity-authority-v1.17-hash-vectors.json" as const

export const schemaVersion = "v1.37-integrity-authority-v1" as const
export const hashVectorSchemaVersion =
  "v1.37-integrity-authority-hash-vectors-v1" as const
export const generatorVersion = "generate-v1-37-integrity-authority-v1" as const
export const generatedBy =
  "scripts/generate-v1-37-integrity-authority.ts" as const
export const successorSchemaVersion = "v1.37-integrity-authority-v2" as const
export const successorHashVectorSchemaVersion =
  "v1.37-integrity-authority-hash-vectors-v2" as const
export const successorGeneratorVersion =
  "generate-v1-37-integrity-authority-v2" as const

export const buildV137IntegrityAuthorityArtifact = () => ({
  schemaVersion,
  generatorVersion,
  generatedBy,
  tupleEncoding: {
    domainTag: CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
    fieldOrder: CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
    separator: "NUL",
    lengthUnit: "UTF-8 bytes",
    hashAlgorithm: "sha256",
    tupleIdFormat: "sha256:<lowercase-hex>",
  },
  authorityRegistry: CANONICAL_AUTHORITY_REGISTRY,
  compatibilityTuples: [HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD],
})

const makeVector = (name: string, tuple: CanonicalCompatibilityTuple) => {
  const encoded = encodeCanonicalCompatibilityTuple(tuple)
  const sha256 = hashCanonicalCompatibilityTuple(tuple)
  return {
    name,
    tuple,
    encodedBytesHex: Buffer.from(encoded).toString("hex"),
    encodedBytesBase64: Buffer.from(encoded).toString("base64"),
    sha256,
    tupleId: `sha256:${sha256}`,
  }
}

export const buildV137IntegrityAuthorityHashVectorsArtifact = () => {
  const registered = HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD
  const baseTuple: CanonicalCompatibilityTuple = { ...registered.tuple }
  const vectors = [makeVector("registered-v1.4", baseTuple)]

  for (const field of CANONICAL_COMPATIBILITY_TUPLE_FIELDS) {
    vectors.push(
      makeVector(`${field}-mutated`, {
        ...baseTuple,
        [field]: `${baseTuple[field]}-mutation-vector`,
      }),
    )
  }

  return {
    schemaVersion: hashVectorSchemaVersion,
    generatorVersion,
    generatedBy,
    domainTag: CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
    fieldOrder: CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
    vectors,
  }
}

const successorIdentityProfiles = Object.freeze([
  {
    ...CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy,
    fieldOrder: CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
    separator: "NUL",
    lengthUnit: "UTF-8 bytes",
    lengthEncoding: "decimal",
    hashAlgorithm: "sha256",
    tupleIdFormat: "sha256:<lowercase-hex>",
  },
  {
    ...CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor,
    canonicalJsonProfile: "canonical-json-v1.1",
    canonicalJsonContext: "canonical-manifest",
    framing: "u64be-length-prefixed-segments",
    segments: ["domainTag", "canonicalJsonTuple"],
    hashAlgorithm: "sha256",
    tupleIdFormat: "sha256:<lowercase-hex>",
  },
] as const)

export const buildV137SuccessorIntegrityAuthorityArtifact = () => ({
  schemaVersion: successorSchemaVersion,
  generatorVersion: successorGeneratorVersion,
  generatedBy,
  identityProfiles: successorIdentityProfiles,
  authorityRegistry: CANONICAL_AUTHORITY_REGISTRY,
  compatibilityTuples: [
    VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
    VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  ],
})

const makeSuccessorVector = (
  name: string,
  record:
    | typeof VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD
    | typeof VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
) => {
  let encoded: Uint8Array
  if (
    record.identityProfile ===
    CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.legacy.identityProfile
  ) {
    encoded = encodeCanonicalCompatibilityTuple({ ...record.tuple })
  } else {
    const canonical = encodeCanonicalJson(
      { ...record.tuple },
      { context: "canonical-manifest" },
    )
    if (!canonical.ok) {
      throw new Error(
        `Successor tuple vector is not canonical: ${canonical.error.code}`,
      )
    }
    encoded = frameCanonicalIdentity("semanticTuple", [canonical.bytes])
  }
  return {
    name,
    identityProfile: record.identityProfile,
    encodingId: record.encodingId,
    tuple: record.tuple,
    encodedBytesHex: Buffer.from(encoded).toString("hex"),
    encodedBytesBase64: Buffer.from(encoded).toString("base64"),
    sha256: record.sha256,
    tupleId: record.tupleId,
  }
}

export const buildV137SuccessorIntegrityAuthorityHashVectorsArtifact = () => ({
  schemaVersion: successorHashVectorSchemaVersion,
  generatorVersion: successorGeneratorVersion,
  generatedBy,
  vectors: [
    makeSuccessorVector(
      "registered-v1.14-legacy",
      VERSIONED_RUNTIME_V114_SEMANTIC_TUPLE_RECORD,
    ),
    makeSuccessorVector(
      "candidate-v1.17-canonical",
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
    ),
  ],
})

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

export const renderV137IntegrityAuthorityArtifact = (
  artifact = buildV137IntegrityAuthorityArtifact(),
): string => renderJson(artifact)

export const renderV137IntegrityAuthorityHashVectorsArtifact = (
  artifact = buildV137IntegrityAuthorityHashVectorsArtifact(),
): string => renderJson(artifact)

export const renderV137SuccessorIntegrityAuthorityArtifact = (
  artifact = buildV137SuccessorIntegrityAuthorityArtifact(),
): string => renderJson(artifact)

export const renderV137SuccessorIntegrityAuthorityHashVectorsArtifact = (
  artifact = buildV137SuccessorIntegrityAuthorityHashVectorsArtifact(),
): string => renderJson(artifact)

const outputs = () => [
  {
    relativePath: authorityArtifactPath,
    content: renderV137IntegrityAuthorityArtifact(),
  },
  {
    relativePath: hashVectorsArtifactPath,
    content: renderV137IntegrityAuthorityHashVectorsArtifact(),
  },
  {
    relativePath: successorAuthorityArtifactPath,
    content: renderV137SuccessorIntegrityAuthorityArtifact(),
  },
  {
    relativePath: successorHashVectorsArtifactPath,
    content: renderV137SuccessorIntegrityAuthorityHashVectorsArtifact(),
  },
]

export const writeV137IntegrityAuthorityArtifacts = (): void => {
  for (const output of outputs()) {
    const absolutePath = path.join(repoRoot, output.relativePath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, output.content, "utf8")
  }
}

export const checkV137IntegrityAuthorityArtifacts = (): readonly string[] => {
  const stale: string[] = []
  for (const output of outputs()) {
    const absolutePath = path.join(repoRoot, output.relativePath)
    let actual: string | undefined
    try {
      actual = readFileSync(absolutePath, "utf8")
    } catch {
      stale.push(output.relativePath)
      continue
    }
    if (actual !== output.content) stale.push(output.relativePath)
  }
  return stale
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV137IntegrityAuthorityArtifacts()
    console.log("v1.37 integrity authority artifacts written")
    return
  }
  if (args.has("--check")) {
    const stale = checkV137IntegrityAuthorityArtifacts()
    if (stale.length > 0) {
      console.error(
        `v1.37 integrity authority artifacts are stale: ${stale.join(", ")}`,
      )
      process.exitCode = 1
      return
    }
    console.log("v1.37 integrity authority artifacts are current")
    return
  }
  console.error(
    "Usage: generate-v1-37-integrity-authority.ts --write | --check",
  )
  process.exitCode = 1
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
