import { Buffer } from "node:buffer"
import { createPublicKey, verify } from "node:crypto"
import { admitCanonicalJsonBytes } from "./canonical-json.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_18,
  RuntimeSemanticAdmissionClaimV118Schema,
  RuntimeSemanticReceiptV118Schema,
  type RuntimeSemanticAdmissionClaimV118,
  type RuntimeSemanticReceiptV118,
} from "./runtime-execution-service-v1-18.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18 = Object.freeze({
  classification: "system_failure" as const,
  ownership: "system_integrity" as const,
  code: "SEMANTIC_RECEIPT_INVALID" as const,
  publicMessage: "Runtime result could not be authenticated." as const,
  retryable: false as const,
  playerPenalty: false as const,
  mutationStatus: "none" as const,
})

export type RuntimeSemanticReceiptFailureV118 =
  typeof RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18

export interface RuntimeSemanticReceiptTrustedKeyV118 {
  keyId: string
  publicKeyPem: string
}

export interface PublicRuntimeCertificateReferenceV118 {
  certificateId: string
  certificateRecordHash: string
  registryGeneration: string
  lane: string
  freshUntil: string
}

export interface PublicRuntimeSemanticReceiptV118 {
  schemaVersion: "runtime-semantic-receipt-public-v1.18"
  serviceContractVersion: "runtime-execution-service-v1.18"
  requestSha256: string
  requestId: string
  matchId: string
  semanticTupleId: string
  authorityGeneration: string
  certificateReferences: {
    bottom: PublicRuntimeCertificateReferenceV118
    top: PublicRuntimeCertificateReferenceV118
  }
  chronicleCanonicalHash: string
  transitionTraceRoot: string
  finalStateCanonicalHash: string
  outcomeCanonicalHash: string
  terminal: {
    status: string
    reason: string
  }
  accounting: {
    budgetProfileRoot: string
    ledgerPrestateRoot: string
    ledgerPoststateRoot: string
  }
  result: {
    resultClass: "success" | "player_violation" | "system_failure"
    ownership: "gameplay" | "player" | "system"
    retryable: boolean
    mutationStatus: "committed" | "none"
  }
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new TypeError(
      `Runtime semantic receipt v1.18 is not canonical: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const u64be = (value: number): Uint8Array => {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false)
  return bytes
}

const frame = (segments: readonly Uint8Array[]): Uint8Array => {
  const byteLength = segments.reduce(
    (total, segment) => total + 8 + segment.byteLength,
    0,
  )
  const output = new Uint8Array(byteLength)
  let offset = 0
  for (const segment of segments) {
    output.set(u64be(segment.byteLength), offset)
    offset += 8
    output.set(segment, offset)
    offset += segment.byteLength
  }
  return output
}

export const encodeRuntimeSemanticAdmissionClaimV118 = (
  claim: RuntimeSemanticAdmissionClaimV118,
): Uint8Array => {
  const parsed = RuntimeSemanticAdmissionClaimV118Schema.parse(claim)
  return frame([
    new TextEncoder().encode(RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_18),
    canonicalBytes(parsed as unknown as JsonValue),
  ])
}

export const serializeRuntimeSemanticReceiptV118 = (
  receipt: RuntimeSemanticReceiptV118,
): Uint8Array =>
  canonicalBytes(
    RuntimeSemanticReceiptV118Schema.parse(receipt) as unknown as JsonValue,
  )

export type ParseRuntimeSemanticReceiptResultV118 =
  | {
      ok: true
      receipt: RuntimeSemanticReceiptV118
    }
  | {
      ok: false
      failure: RuntimeSemanticReceiptFailureV118
    }

export const parseRuntimeSemanticReceiptV118 = (
  bytes: Uint8Array,
): ParseRuntimeSemanticReceiptResultV118 => {
  try {
    const admitted = admitCanonicalJsonBytes(bytes, {
      profile: "canonical-manifest",
      operation: "require-canonical",
    })
    if (!admitted.ok) {
      return {
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      }
    }
    const parsed = RuntimeSemanticReceiptV118Schema.safeParse(admitted.value)
    if (!parsed.success) {
      return {
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      }
    }
    return { ok: true, receipt: parsed.data }
  } catch {
    return {
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    }
  }
}

const canonicalEqual = (left: unknown, right: unknown): boolean => {
  try {
    const leftBytes = canonicalBytes(left as JsonValue)
    const rightBytes = canonicalBytes(right as JsonValue)
    return Buffer.from(leftBytes).equals(Buffer.from(rightBytes))
  } catch {
    return false
  }
}

const publicCertificateReference = (
  reference: RuntimeSemanticAdmissionClaimV118["certificateReferences"]["bottom"],
): PublicRuntimeCertificateReferenceV118 => ({
  certificateId: reference.certificateId,
  certificateRecordHash: reference.certificateRecordHash,
  registryGeneration: reference.registryGeneration,
  lane: reference.lane,
  freshUntil: reference.freshUntil,
})

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const projectPublicRuntimeSemanticReceiptV118 = (
  receiptInput: RuntimeSemanticReceiptV118,
): Readonly<PublicRuntimeSemanticReceiptV118> => {
  const receipt = RuntimeSemanticReceiptV118Schema.parse(receiptInput)
  const claim = receipt.claim
  return deepFreeze({
    schemaVersion: "runtime-semantic-receipt-public-v1.18",
    serviceContractVersion: claim.serviceContractVersion,
    requestSha256: claim.requestSha256,
    requestId: claim.requestId,
    matchId: claim.matchId,
    semanticTupleId: claim.semanticTuple.tupleId,
    authorityGeneration: claim.authorityGeneration,
    certificateReferences: {
      bottom: publicCertificateReference(claim.certificateReferences.bottom),
      top: publicCertificateReference(claim.certificateReferences.top),
    },
    chronicleCanonicalHash: claim.chronicleCanonicalHash,
    transitionTraceRoot: claim.transitionTraceRoot,
    finalStateCanonicalHash: claim.finalStateCanonicalHash,
    outcomeCanonicalHash: claim.outcomeCanonicalHash,
    terminal: { ...claim.terminal },
    accounting: { ...claim.accounting },
    result: { ...claim.result },
  })
}

export type VerifyRuntimeSemanticReceiptResultV118 =
  | {
      ok: true
      receipt: RuntimeSemanticReceiptV118
      publicProjection: Readonly<PublicRuntimeSemanticReceiptV118>
    }
  | {
      ok: false
      failure: RuntimeSemanticReceiptFailureV118
    }

export const verifyRuntimeSemanticReceiptV118 = (input: {
  receiptBytes: Uint8Array
  trustedKey: RuntimeSemanticReceiptTrustedKeyV118
  expectedClaim: RuntimeSemanticAdmissionClaimV118
}): VerifyRuntimeSemanticReceiptResultV118 => {
  try {
    const parsed = parseRuntimeSemanticReceiptV118(input.receiptBytes)
    if (!parsed.ok) return parsed
    const expected = RuntimeSemanticAdmissionClaimV118Schema.safeParse(
      input.expectedClaim,
    )
    if (
      !expected.success ||
      parsed.receipt.keyId !== input.trustedKey.keyId ||
      !canonicalEqual(parsed.receipt.claim, expected.data)
    ) {
      return {
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      }
    }
    const key = createPublicKey(input.trustedKey.publicKeyPem)
    if (
      key.asymmetricKeyType !== "ed25519" ||
      !verify(
        null,
        encodeRuntimeSemanticAdmissionClaimV118(parsed.receipt.claim),
        key,
        Buffer.from(parsed.receipt.signatureBase64, "base64"),
      )
    ) {
      return {
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      }
    }
    return {
      ok: true,
      receipt: parsed.receipt,
      publicProjection: projectPublicRuntimeSemanticReceiptV118(
        parsed.receipt,
      ),
    }
  } catch {
    return {
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    }
  }
}
