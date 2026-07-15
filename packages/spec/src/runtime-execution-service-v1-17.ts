import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 =
  "runtime-execution-service-v1.17" as const
export const RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17 =
  "runtime-semantic-receipt-v1.17" as const
export const RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17 =
  "cowards-game:runtime-semantic-receipt:v1.17" as const
export const RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17 =
  "canonical-full-service-v1" as const
export const RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17 =
  "runtime-service-semantic-receipt:v1.17" as const

type Sha256Identity = `sha256:${string}`

export interface RuntimeSemanticReceiptClaimsV117 {
  schemaVersion: typeof RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17
  profile: typeof RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17
  serviceContractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
  requestSha256: Sha256Identity
  requestId: string
  matchId: string
  compatibilityTupleId: Sha256Identity
  authorityBundleHash: Sha256Identity
  authoritySourceManifestHash: Sha256Identity
  registryGeneration: string
  bottomIdentityManifestRoot: Sha256Identity
  bottomEvidenceGraphRoot: Sha256Identity
  topIdentityManifestRoot: Sha256Identity
  topEvidenceGraphRoot: Sha256Identity
  budgetProfileSha256: Sha256Identity
  ledgerPrestateRoot: Sha256Identity
  ledgerPoststateRoot: Sha256Identity
  chronicleCanonicalHash: Sha256Identity
  finalStateCanonicalHash: Sha256Identity
  reconstructedTerminalStateHash: Sha256Identity
  outcomeCanonicalHash: Sha256Identity
  runtimeViolationEventCount: number
  algorithm: "hmac-sha256"
  keyId: typeof RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17
}

export interface RuntimeSemanticReceiptV117
  extends RuntimeSemanticReceiptClaimsV117 {
  signature: `hmac-sha256:${string}`
}

export interface RuntimeExecutionServiceRequestV117 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
  kind: "executeMatch"
  requestId: string
  matchId: string
  compatibilityTupleId: Sha256Identity
  authority: {
    bundleHash: Sha256Identity
    sourceManifestHash: Sha256Identity
    registryGeneration: string
  }
  entrants: {
    bottom: {
      identityManifestRoot: Sha256Identity
      evidenceGraphRoot: Sha256Identity
    }
    top: {
      identityManifestRoot: Sha256Identity
      evidenceGraphRoot: Sha256Identity
    }
  }
  accounting: {
    budgetProfileSha256: Sha256Identity
    ledgerPrestateRoot: Sha256Identity
  }
  match: JsonValue
}

export interface RuntimeExecutionServiceSuccessResponseV117 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
  ok: true
  kind: "executionResult"
  requestId: string
  matchId: string
  result: {
    privacy: "internal_runtime_result"
    chronicle: JsonValue
    finalState: JsonValue
    outcome: JsonValue
    ledgerPoststateRoot: Sha256Identity
    runtimeViolationEventCount: number
    semanticReceipt: RuntimeSemanticReceiptV117
  }
}

const u64be = (value: number): Uint8Array => {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false)
  return bytes
}

const frame = (segments: readonly Uint8Array[]): Uint8Array => {
  const size = segments.reduce((total, value) => total + 8 + value.byteLength, 0)
  const output = new Uint8Array(size)
  let offset = 0
  for (const value of segments) {
    output.set(u64be(value.byteLength), offset)
    offset += 8
    output.set(value, offset)
    offset += value.byteLength
  }
  return output
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("Runtime v1.17 value is not canonical JSON.")
  return encoded.bytes
}

export const encodeRuntimeSemanticReceiptClaimsV117 = (
  claims: RuntimeSemanticReceiptClaimsV117,
): Uint8Array =>
  frame([
    new TextEncoder().encode(RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17),
    canonicalBytes(claims as unknown as JsonValue),
  ])

export const serializeRuntimeExecutionServiceRequestV117 = (
  request: RuntimeExecutionServiceRequestV117,
): Uint8Array => canonicalBytes(request as unknown as JsonValue)

export const serializeRuntimeExecutionServiceResponseV117 = (
  response: RuntimeExecutionServiceSuccessResponseV117,
): Uint8Array => canonicalBytes(response as unknown as JsonValue)

export const hashRuntimeExecutionServiceRequestV117 = (
  request: RuntimeExecutionServiceRequestV117,
): Sha256Identity =>
  `sha256:${createHash("sha256")
    .update(serializeRuntimeExecutionServiceRequestV117(request))
    .digest("hex")}`
