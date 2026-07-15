import { Buffer } from "node:buffer"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
  RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17,
  RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17,
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
  encodeCanonicalJson,
  encodeRuntimeSemanticReceiptClaimsV117,
  hashRuntimeExecutionServiceRequestV117,
  type JsonValue,
  type RuntimeExecutionServiceRequestV117,
  type RuntimeExecutionServiceSuccessResponseV117,
  type RuntimeSemanticReceiptClaimsV117,
  type RuntimeSemanticReceiptV117,
} from "@cowards/spec"

const SHA256_ID = /^sha256:[0-9a-f]{64}$/u
const SIGNATURE = /^hmac-sha256:[0-9a-f]{64}$/u

export class RuntimeSemanticReceiptV117Error extends Error {
  constructor() {
    super("Runtime semantic receipt v1.17 is unavailable.")
    this.name = "RuntimeSemanticReceiptV117Error"
  }
}

const fail = (): never => {
  throw new RuntimeSemanticReceiptV117Error()
}

const u64be = (value: number): Uint8Array => {
  const result = new Uint8Array(8)
  new DataView(result.buffer).setBigUint64(0, BigInt(value), false)
  return result
}

const hashCanonicalValue = (domain: string, value: JsonValue): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) return fail()
  const domainBytes = new TextEncoder().encode(domain)
  return `sha256:${createHash("sha256")
    .update(u64be(domainBytes.byteLength))
    .update(domainBytes)
    .update(u64be(encoded.bytes.byteLength))
    .update(encoded.bytes)
    .digest("hex")}`
}

export const issueRuntimeSemanticReceiptV117 = (input: {
  request: RuntimeExecutionServiceRequestV117
  chronicle: JsonValue
  finalState: JsonValue
  outcome: JsonValue
  ledgerPoststateRoot: `sha256:${string}`
  reconstructedTerminalStateHash: `sha256:${string}`
  runtimeViolationEventCount: number
  secret: string
}): RuntimeSemanticReceiptV117 => {
  if (
    input.secret.trim().length === 0 ||
    !SHA256_ID.test(input.ledgerPoststateRoot) ||
    !SHA256_ID.test(input.reconstructedTerminalStateHash) ||
    !Number.isSafeInteger(input.runtimeViolationEventCount) ||
    input.runtimeViolationEventCount < 0
  ) return fail()
  const request = input.request
  if (
    request.contractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    request.kind !== "executeMatch"
  ) return fail()
  const claims: RuntimeSemanticReceiptClaimsV117 = {
    schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
    profile: RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17,
    serviceContractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    requestSha256: hashRuntimeExecutionServiceRequestV117(request),
    requestId: request.requestId,
    matchId: request.matchId,
    compatibilityTupleId: request.compatibilityTupleId,
    authorityBundleHash: request.authority.bundleHash,
    authoritySourceManifestHash: request.authority.sourceManifestHash,
    registryGeneration: request.authority.registryGeneration,
    bottomIdentityManifestRoot: request.entrants.bottom.identityManifestRoot,
    bottomEvidenceGraphRoot: request.entrants.bottom.evidenceGraphRoot,
    topIdentityManifestRoot: request.entrants.top.identityManifestRoot,
    topEvidenceGraphRoot: request.entrants.top.evidenceGraphRoot,
    budgetProfileSha256: request.accounting.budgetProfileSha256,
    ledgerPrestateRoot: request.accounting.ledgerPrestateRoot,
    ledgerPoststateRoot: input.ledgerPoststateRoot,
    chronicleCanonicalHash: hashCanonicalValue(
      "cowards-game:runtime-semantic-chronicle-canonical-json:v1.17",
      input.chronicle,
    ),
    finalStateCanonicalHash: hashCanonicalValue(
      "cowards-game:runtime-semantic-final-state-canonical-json:v1.17",
      input.finalState,
    ),
    reconstructedTerminalStateHash: input.reconstructedTerminalStateHash,
    outcomeCanonicalHash: hashCanonicalValue(
      "cowards-game:runtime-semantic-outcome-canonical-json:v1.17",
      input.outcome,
    ),
    runtimeViolationEventCount: input.runtimeViolationEventCount,
    algorithm: "hmac-sha256",
    keyId: RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17,
  }
  return Object.freeze({
    ...claims,
    signature: `hmac-sha256:${createHmac("sha256", input.secret)
      .update(encodeRuntimeSemanticReceiptClaimsV117(claims))
      .digest("hex")}`,
  })
}

export const verifyRuntimeSemanticReceiptV117 = (input: {
  request: RuntimeExecutionServiceRequestV117
  response: RuntimeExecutionServiceSuccessResponseV117
  secret: string
}): Readonly<RuntimeSemanticReceiptV117> => {
  const response = input.response
  if (
    response === null ||
    typeof response !== "object" ||
    response.contractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    response.ok !== true ||
    response.kind !== "executionResult" ||
    response.requestId !== input.request.requestId ||
    response.matchId !== input.request.matchId ||
    response.result?.privacy !== "internal_runtime_result"
  ) return fail()
  const receipt = response.result.semanticReceipt
  if (
    receipt?.schemaVersion !== RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17 ||
    receipt.profile !== RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17 ||
    receipt.serviceContractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    receipt.algorithm !== "hmac-sha256" ||
    receipt.keyId !== RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17 ||
    !SIGNATURE.test(receipt.signature)
  ) return fail()
  const expected = issueRuntimeSemanticReceiptV117({
    request: input.request,
    chronicle: response.result.chronicle,
    finalState: response.result.finalState,
    outcome: response.result.outcome,
    ledgerPoststateRoot: response.result.ledgerPoststateRoot,
    reconstructedTerminalStateHash: receipt.reconstructedTerminalStateHash,
    runtimeViolationEventCount: response.result.runtimeViolationEventCount,
    secret: input.secret,
  })
  const actualEncoded = encodeCanonicalJson(receipt as unknown as JsonValue, {
    context: "canonical-manifest",
  })
  const expectedEncoded = encodeCanonicalJson(expected as unknown as JsonValue, {
    context: "canonical-manifest",
  })
  if (!actualEncoded.ok || !expectedEncoded.ok) return fail()
  const actualBytes = Buffer.from(actualEncoded.bytes)
  const expectedBytes = Buffer.from(expectedEncoded.bytes)
  if (
    actualBytes.byteLength !== expectedBytes.byteLength ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) return fail()
  return Object.freeze({ ...receipt })
}
