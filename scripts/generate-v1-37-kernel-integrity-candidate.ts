#!/usr/bin/env -S pnpm exec tsx
/* eslint-disable no-restricted-imports -- The candidate is intentionally absent from the public spec barrel. */
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  INACTIVE_V1_37_KERNEL_CANDIDATE_SCHEMA_VERSION,
  INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION,
  INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE,
} from "../packages/spec/src/integrity-authority-candidate-v1-37.js"
import {
  CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  CANONICAL_COMPATIBILITY_TUPLES,
  encodeCanonicalCompatibilityTuple,
  hashCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "../packages/spec/src/integrity-authority.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const candidateArtifactPath =
  "packages/spec/artifacts/v1.37-kernel-integrity-candidate.json" as const
export const candidateHashVectorsArtifactPath =
  "packages/spec/artifacts/v1.37-kernel-integrity-candidate-hash-vectors.json" as const
export const candidateHashVectorSchemaVersion =
  "v1.37-kernel-integrity-candidate-hash-vectors-v1" as const
export const generatedBy =
  "scripts/generate-v1-37-kernel-integrity-candidate.ts" as const
export const RETAINED_V1_37_CANDIDATE_HASHES = Object.freeze({
  [candidateArtifactPath]:
    "4234567bc758b6fcc27085b523d642ad765803ce5e97a301e272ab351a208d11",
  [candidateHashVectorsArtifactPath]:
    "6af19cb7adb123fbd4eff74ebc66d184847153444b046565eeba870519ff2f60",
} as const)

export const buildV137KernelIntegrityCandidateArtifact = () => ({
  schemaVersion: INACTIVE_V1_37_KERNEL_CANDIDATE_SCHEMA_VERSION,
  generatorVersion: INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION,
  generatedBy,
  status: "inactive-candidate" as const,
  trustState: "untrusted-non-publishable" as const,
  publicationAllowed: false as const,
  countedExecutionAllowed: false as const,
  activationPlan: "257-19-atomic-current-authority-flip" as const,
  tupleEncoding: {
    domainTag: CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
    fieldOrder: CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
    separator: "NUL" as const,
    lengthUnit: "UTF-8 bytes" as const,
    hashAlgorithm: "sha256" as const,
  },
  candidate: INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE,
})

type CandidateAcceptance =
  | "accept-inactive-only"
  | "reject-mixed"
  | "reject-partial"
  | "reject-current"
type CurrentAcceptance = "reject" | "accept-current-only"

interface CandidateHashVector {
  name: string
  selector: {
    tupleId: string
    // The partial negative vector intentionally violates this declared shape at
    // runtime; keeping one transport shape makes downstream vector consumers
    // exercise their own strict validation.
    tuple: CanonicalCompatibilityTuple
  }
  encodedBytesHex: string | null
  encodedBytesBase64: string | null
  sha256: string | null
  candidateAcceptance: CandidateAcceptance
  currentAcceptance: CurrentAcceptance
}

const completeVector = (
  name: string,
  tuple: CanonicalCompatibilityTuple,
  candidateAcceptance: CandidateAcceptance,
  currentAcceptance: CurrentAcceptance,
): CandidateHashVector => {
  const encoded = encodeCanonicalCompatibilityTuple(tuple)
  const sha256 = hashCanonicalCompatibilityTuple(tuple)
  return {
    name,
    selector: { tupleId: `sha256:${sha256}`, tuple },
    encodedBytesHex: Buffer.from(encoded).toString("hex"),
    encodedBytesBase64: Buffer.from(encoded).toString("base64"),
    sha256,
    candidateAcceptance,
    currentAcceptance,
  }
}

export const buildV137KernelIntegrityCandidateHashVectors = (): {
  schemaVersion: typeof candidateHashVectorSchemaVersion
  generatorVersion: typeof INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION
  generatedBy: typeof generatedBy
  domainTag: typeof CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG
  fieldOrder: typeof CANONICAL_COMPATIBILITY_TUPLE_FIELDS
  vectors: CandidateHashVector[]
} => {
  const candidate = INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE
  const current = CANONICAL_COMPATIBILITY_TUPLES[0]!
  const partialTuple = {
    rules: candidate.candidateTuple.rules,
    engine: candidate.candidateTuple.engine,
    runtimeAbi: candidate.candidateTuple.runtimeAbi,
    chronicle: candidate.candidateTuple.chronicle,
    setPolicy: candidate.candidateTuple.setPolicy,
  } as unknown as CanonicalCompatibilityTuple

  return {
    schemaVersion: candidateHashVectorSchemaVersion,
    generatorVersion: INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION,
    generatedBy,
    domainTag: CANONICAL_COMPATIBILITY_TUPLE_DOMAIN_TAG,
    fieldOrder: CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
    vectors: [
      completeVector(
        "valid-inactive-candidate",
        { ...candidate.candidateTuple },
        "accept-inactive-only",
        "reject",
      ),
      completeVector(
        "mixed-candidate-current-chronicle",
        {
          ...candidate.candidateTuple,
          chronicle: current.tuple.chronicle,
        },
        "reject-mixed",
        "reject",
      ),
      {
        name: "partial-candidate-missing-arena",
        selector: {
          tupleId: "sha256:partial-candidate-has-no-canonical-hash",
          tuple: partialTuple,
        },
        encodedBytesHex: null,
        encodedBytesBase64: null,
        sha256: null,
        candidateAcceptance: "reject-partial",
        currentAcceptance: "reject",
      },
      completeVector(
        "old-current-registered",
        { ...current.tuple },
        "reject-current",
        "accept-current-only",
      ),
    ],
  }
}

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

export const renderV137KernelIntegrityCandidateArtifact = (
  artifact = buildV137KernelIntegrityCandidateArtifact(),
): string => renderJson(artifact)

export const renderV137KernelIntegrityCandidateHashVectors = (
  artifact = buildV137KernelIntegrityCandidateHashVectors(),
): string => renderJson(artifact)

export const checkV137KernelIntegrityCandidateArtifacts = (): string[] => {
  const stale: string[] = []
  for (const [relativePath, expected] of Object.entries(
    RETAINED_V1_37_CANDIDATE_HASHES,
  )) {
    try {
      const actual = createHash("sha256")
        .update(readFileSync(path.join(repoRoot, relativePath)))
        .digest("hex")
      if (actual !== expected) stale.push(relativePath)
    } catch {
      stale.push(relativePath)
    }
  }
  return stale
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    console.error(
      "Retained v1.37 preactivation candidate evidence is immutable and cannot be regenerated.",
    )
    process.exitCode = 1
    return
  }
  if (args.has("--check")) {
    const stale = checkV137KernelIntegrityCandidateArtifacts()
    if (stale.length > 0) {
      console.error(
        `v1.37 inactive kernel integrity candidate artifacts are stale: ${stale.join(", ")}`,
      )
      process.exitCode = 1
      return
    }
    console.log(
      "v1.37 retained preactivation candidate artifacts are byte-exact",
    )
    return
  }
  console.error(
    "Usage: generate-v1-37-kernel-integrity-candidate.ts --write | --check",
  )
  process.exitCode = 1
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
