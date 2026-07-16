import { Buffer } from "node:buffer"
import {
  RuntimeSemanticReceiptV118Schema,
  createRuntimeSemanticAdmissionClaimV118,
  encodeRuntimeSemanticAdmissionClaimV118,
  serializeRuntimeSemanticReceiptV118,
  verifyRuntimeSemanticReceiptV118,
  type CreateRuntimeSemanticAdmissionClaimInputV118,
  type RuntimeSemanticReceiptV118,
} from "@cowards/spec"

export interface RuntimeSemanticReceiptSignerV118 {
  readonly keyId: string
  readonly publicKeyPem: string
  sign(canonicalClaimBytes: Uint8Array): Uint8Array
}

export interface IssuedRuntimeSemanticReceiptV118 {
  readonly receipt: RuntimeSemanticReceiptV118
  readonly receiptBytes: Uint8Array
}

export const issueRuntimeSemanticReceiptV118 = (input: {
  readonly admission: CreateRuntimeSemanticAdmissionClaimInputV118
  readonly signer: RuntimeSemanticReceiptSignerV118
}): IssuedRuntimeSemanticReceiptV118 => {
  const claim = createRuntimeSemanticAdmissionClaimV118(input.admission)
  const claimBytes = encodeRuntimeSemanticAdmissionClaimV118(claim)
  const signature = Uint8Array.from(input.signer.sign(claimBytes))
  if (signature.byteLength !== 64) {
    throw new TypeError("Runtime semantic receipt signature is invalid")
  }
  const receipt = RuntimeSemanticReceiptV118Schema.parse({
    claim,
    algorithm: "Ed25519",
    keyId: input.signer.keyId,
    signatureBase64: Buffer.from(signature).toString("base64"),
  })
  const receiptBytes = serializeRuntimeSemanticReceiptV118(receipt)
  const verified = verifyRuntimeSemanticReceiptV118({
    receiptBytes,
    trustedKey: {
      keyId: input.signer.keyId,
      publicKeyPem: input.signer.publicKeyPem,
    },
    expectedClaim: claim,
  })
  if (!verified.ok) {
    throw new TypeError("Runtime semantic receipt self-verification failed")
  }
  return Object.freeze({
    receipt: verified.receipt,
    receiptBytes: Uint8Array.from(receiptBytes),
  })
}
