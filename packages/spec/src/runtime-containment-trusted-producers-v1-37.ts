import { createHash } from "node:crypto"
import { RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17 } from "./runtime-conformance-trusted-producers-v1-17.js"
import type { RuntimeEvidenceTrustedProducer } from "./runtime-evidence-attestation.js"

export const RUNTIME_CONTAINMENT_LANGUAGE_IDS_V1_37 = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

export type RuntimeContainmentLanguageIdV137 =
  (typeof RUNTIME_CONTAINMENT_LANGUAGE_IDS_V1_37)[number]

export const RUNTIME_CONTAINMENT_MANAGED_PRODUCER_KEY_ID_V1_37 =
  "cowards-runtime-containment-key-v1.37" as const
export const RUNTIME_CONTAINMENT_COMMAND_ID_V1_37 =
  "run-v1-37-real-language-lane:v1.19" as const
export const RUNTIME_CONTAINMENT_CORPUS_ID_V1_37 =
  "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d" as const

const POLICY_IDS = Object.freeze({
  typescript:
    "sha256:dea63048c35cc3e73f1d0e7524fbd31d13fbdccecd851ec058eebad730192705",
  python:
    "sha256:d1432f255216ae70c99e473d3e83e30d61b2f7be6ca3eca9eeb3a391728d9509",
  rust: "sha256:414b873a04e4f170ba06dacd848eaa45637d7d0c26480df37e4a34e554c4f636",
  zig: "sha256:414b873a04e4f170ba06dacd848eaa45637d7d0c26480df37e4a34e554c4f636",
} as const)

const bytes = (value: unknown): Uint8Array =>
  new TextEncoder().encode(`${JSON.stringify(value)}\n`)

const digest = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

export const runtimeContainmentCommandEvidenceBytesV137 = (): Uint8Array =>
  bytes({
    id: "run-v1-37-real-language-lane",
    processCount: 3,
    freshOnly: true,
  })

export const runtimeContainmentCorpusEvidenceBytesV137 = (
  languageId: RuntimeContainmentLanguageIdV137,
): Uint8Array => bytes({ id: RUNTIME_CONTAINMENT_CORPUS_ID_V1_37, languageId })

export const runtimeContainmentPolicyEvidenceBytesV137 = (
  languageId: RuntimeContainmentLanguageIdV137,
): Uint8Array =>
  bytes({
    id: POLICY_IDS[languageId],
    network: "none",
    filesystem: "read-only",
    cgroupVersion: 2,
    controllers: ["cpu", "memory", "pids"],
  })

export const runtimeContainmentManagedProducerIdV137 = (
  languageId: RuntimeContainmentLanguageIdV137,
): string => `proof-local:runtime-containment:${languageId}:v1`

const managedPublicKeyPem =
  RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17[0]!.publicKeyPem

export const RUNTIME_EVIDENCE_TRUSTED_CONTAINMENT_PRODUCERS_V1_37: readonly RuntimeEvidenceTrustedProducer[] =
  Object.freeze(
    RUNTIME_CONTAINMENT_LANGUAGE_IDS_V1_37.map((languageId) =>
      Object.freeze({
        producerId: runtimeContainmentManagedProducerIdV137(languageId),
        keyId: RUNTIME_CONTAINMENT_MANAGED_PRODUCER_KEY_ID_V1_37,
        trustDomain: "production" as const,
        kind: "containment" as const,
        schemaVersion: "runtime-evidence-attestation-v1",
        commandId: RUNTIME_CONTAINMENT_COMMAND_ID_V1_37,
        commandSha256: digest(runtimeContainmentCommandEvidenceBytesV137()),
        corpusId: RUNTIME_CONTAINMENT_CORPUS_ID_V1_37,
        corpusSha256: digest(
          runtimeContainmentCorpusEvidenceBytesV137(languageId),
        ),
        policyId: POLICY_IDS[languageId],
        policySha256: digest(
          runtimeContainmentPolicyEvidenceBytesV137(languageId),
        ),
        requiredGateIds: Object.freeze(["containment"]),
        publicKeyPem: managedPublicKeyPem,
      }),
    ),
  )
