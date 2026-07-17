import { createHash } from "node:crypto"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"
import type {
  WorkshopContractV119Candidate,
  WorkshopContractV119Language,
} from "./workshop-contract-v1-19-candidate.js"

interface WorkshopContractV119CandidatePinExample {
  language: WorkshopContractV119Language
  sourceFormat: WorkshopContractV119Language
  sourceSha256: `sha256:${string}`
}

export interface WorkshopContractV119CandidatePin {
  schemaVersion: "workshop-contract-v1.19-candidate-pin-v1"
  status: "inactive-candidate"
  workshopContractVersion: "workshop-contract-v1.19"
  runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  activationOwner: "Phase-260-Plan-14"
  exampleSetRootSha256: `sha256:${string}`
  observationSemanticsSha256: `sha256:${string}`
  examples: WorkshopContractV119CandidatePinExample[]
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalSha256 = (value: JsonValue): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    throw new TypeError(
      `Workshop candidate pin material is not canonical JSON: ${encoded.error.code}`,
    )
  }
  return sha256(encoded.bytes)
}

export const WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN =
  deepFreeze<WorkshopContractV119CandidatePin>({
    schemaVersion: "workshop-contract-v1.19-candidate-pin-v1",
    status: "inactive-candidate",
    workshopContractVersion: "workshop-contract-v1.19",
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    activationOwner: "Phase-260-Plan-14",
    exampleSetRootSha256:
      "sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d",
    observationSemanticsSha256:
      "sha256:9848ba17da56661e0192373c2e655fb0d7c0644815a4c377a2f427249389790c",
    examples: [
      {
        language: "typescript",
        sourceFormat: "typescript",
        sourceSha256:
          "sha256:2a7dce39e082abd84787a1812b97f829a272e42e65c534de6143b2c40fc3c4b2",
      },
      {
        language: "python",
        sourceFormat: "python",
        sourceSha256:
          "sha256:cfbeeb637e1c86e92dba408d8152dea6cafd041fb63ddb145f3990a3e7fbd6f1",
      },
      {
        language: "rust",
        sourceFormat: "rust",
        sourceSha256:
          "sha256:786f1d7f53e7b7b465366b726ae6117395fa6555f9c109471e86450aefba85a7",
      },
      {
        language: "zig",
        sourceFormat: "zig",
        sourceSha256:
          "sha256:9d948f95151031a3f0fbe90a6a1f691a35d9ce6bc0afa52a422453e4164a60ee",
      },
    ],
  })

export type WorkshopContractV119CandidatePinVerification =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      code:
        | "CANDIDATE_IDENTITY_MISMATCH"
        | "CANDIDATE_LIFECYCLE_MISMATCH"
        | "CANDIDATE_EXAMPLES_MISMATCH"
        | "CANDIDATE_SEMANTICS_MISMATCH"
        | "CANDIDATE_ROOT_MISMATCH"
        | "PIN_MISMATCH"
    }>

const failure = (
  code: Exclude<WorkshopContractV119CandidatePinVerification, { ok: true }>["code"],
): WorkshopContractV119CandidatePinVerification => ({ ok: false, code })

export const verifyWorkshopContractV119CandidatePin = (
  candidate: WorkshopContractV119Candidate,
  pin: unknown,
): WorkshopContractV119CandidatePinVerification => {
  if (
    candidate.schemaVersion !== "workshop-contract-v1.19-candidate-v1" ||
    candidate.workshopContractVersion !== "workshop-contract-v1.19" ||
    candidate.runtimeAbiVersion !== "strategy-runtime-abi-v1.19"
  ) {
    return failure("CANDIDATE_IDENTITY_MISMATCH")
  }
  if (
    candidate.lifecycle.status !== "inactive-candidate" ||
    candidate.lifecycle.active ||
    candidate.lifecycle.current ||
    candidate.lifecycle.activationOwner !== "Phase-260-Plan-14"
  ) {
    return failure("CANDIDATE_LIFECYCLE_MISMATCH")
  }

  const examples = candidate.examples.map((example) => ({
    language: example.language,
    sourceFormat: example.sourceFormat,
    sourceSha256: sha256(example.source),
  }))
  if (
    JSON.stringify(examples) !==
    JSON.stringify(WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.examples)
  ) {
    return failure("CANDIDATE_EXAMPLES_MISMATCH")
  }

  const observationSemanticsSha256 = canonicalSha256(
    candidate.semantics as unknown as JsonValue,
  )
  if (
    observationSemanticsSha256 !==
    WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.observationSemanticsSha256
  ) {
    return failure("CANDIDATE_SEMANTICS_MISMATCH")
  }

  const exampleSetRootSha256 = canonicalSha256({
    workshopContractVersion: candidate.workshopContractVersion,
    runtimeAbiVersion: candidate.runtimeAbiVersion,
    examples,
  })
  if (
    exampleSetRootSha256 !==
    WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN.exampleSetRootSha256
  ) {
    return failure("CANDIDATE_ROOT_MISMATCH")
  }

  if (JSON.stringify(pin) !== JSON.stringify(WORKSHOP_CONTRACT_V1_19_CANDIDATE_PIN)) {
    return failure("PIN_MISMATCH")
  }
  return { ok: true }
}
