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

const record = (
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return fail()
  const candidate = value as Record<string, unknown>
  const actual = Object.keys(candidate)
  if (
    actual.length !== keys.length ||
    keys.some((key) => !Object.hasOwn(candidate, key))
  ) {
    return fail()
  }
  return candidate
}

const boundedString = (value: unknown): string => {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > 512
  )
    return fail()
  return value
}

const sha256Identity = (value: unknown): `sha256:${string}` => {
  const identity = boundedString(value)
  if (!SHA256_ID.test(identity)) return fail()
  return identity as `sha256:${string}`
}

const jsonValue = (value: unknown): JsonValue => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) return fail()
  return value as JsonValue
}

const parseEntrant = (
  value: unknown,
): RuntimeExecutionServiceRequestV117["entrants"]["bottom"] => {
  const candidate = record(value, ["identityManifestRoot", "evidenceGraphRoot"])
  return {
    identityManifestRoot: sha256Identity(candidate.identityManifestRoot),
    evidenceGraphRoot: sha256Identity(candidate.evidenceGraphRoot),
  }
}

const parseRequest = (value: unknown): RuntimeExecutionServiceRequestV117 => {
  const candidate = record(value, [
    "contractVersion",
    "kind",
    "requestId",
    "matchId",
    "compatibilityTupleId",
    "authority",
    "entrants",
    "accounting",
    "match",
  ])
  if (
    candidate.contractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    candidate.kind !== "executeMatch"
  )
    return fail()
  const authority = record(candidate.authority, [
    "bundleHash",
    "sourceManifestHash",
    "registryGeneration",
  ])
  const entrants = record(candidate.entrants, ["bottom", "top"])
  const accounting = record(candidate.accounting, [
    "budgetProfileSha256",
    "ledgerPrestateRoot",
  ])
  const registryGeneration = boundedString(authority.registryGeneration)
  if (!/^(?:0|[1-9][0-9]{0,15})$/u.test(registryGeneration)) return fail()
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    kind: "executeMatch",
    requestId: boundedString(candidate.requestId),
    matchId: boundedString(candidate.matchId),
    compatibilityTupleId: sha256Identity(candidate.compatibilityTupleId),
    authority: {
      bundleHash: sha256Identity(authority.bundleHash),
      sourceManifestHash: sha256Identity(authority.sourceManifestHash),
      registryGeneration,
    },
    entrants: {
      bottom: parseEntrant(entrants.bottom),
      top: parseEntrant(entrants.top),
    },
    accounting: {
      budgetProfileSha256: sha256Identity(accounting.budgetProfileSha256),
      ledgerPrestateRoot: sha256Identity(accounting.ledgerPrestateRoot),
    },
    match: jsonValue(candidate.match),
  }
}

const receiptKeys = [
  "schemaVersion",
  "profile",
  "serviceContractVersion",
  "requestSha256",
  "requestId",
  "matchId",
  "compatibilityTupleId",
  "authorityBundleHash",
  "authoritySourceManifestHash",
  "registryGeneration",
  "bottomIdentityManifestRoot",
  "bottomEvidenceGraphRoot",
  "topIdentityManifestRoot",
  "topEvidenceGraphRoot",
  "budgetProfileSha256",
  "ledgerPrestateRoot",
  "ledgerPoststateRoot",
  "chronicleCanonicalHash",
  "finalStateCanonicalHash",
  "reconstructedTerminalStateHash",
  "outcomeCanonicalHash",
  "runtimeViolationEventCount",
  "algorithm",
  "keyId",
  "signature",
] as const

const parseReceipt = (value: unknown): RuntimeSemanticReceiptV117 => {
  const candidate = record(value, receiptKeys)
  if (
    candidate.schemaVersion !== RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17 ||
    candidate.profile !== RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17 ||
    candidate.serviceContractVersion !==
      RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    candidate.algorithm !== "hmac-sha256" ||
    candidate.keyId !== RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17 ||
    typeof candidate.runtimeViolationEventCount !== "number" ||
    !Number.isSafeInteger(candidate.runtimeViolationEventCount) ||
    candidate.runtimeViolationEventCount < 0 ||
    typeof candidate.signature !== "string" ||
    !SIGNATURE.test(candidate.signature)
  )
    return fail()
  return {
    schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
    profile: RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17,
    serviceContractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    requestSha256: sha256Identity(candidate.requestSha256),
    requestId: boundedString(candidate.requestId),
    matchId: boundedString(candidate.matchId),
    compatibilityTupleId: sha256Identity(candidate.compatibilityTupleId),
    authorityBundleHash: sha256Identity(candidate.authorityBundleHash),
    authoritySourceManifestHash: sha256Identity(
      candidate.authoritySourceManifestHash,
    ),
    registryGeneration: (() => {
      const value = boundedString(candidate.registryGeneration)
      if (!/^(?:0|[1-9][0-9]{0,15})$/u.test(value)) return fail()
      return value
    })(),
    bottomIdentityManifestRoot: sha256Identity(
      candidate.bottomIdentityManifestRoot,
    ),
    bottomEvidenceGraphRoot: sha256Identity(candidate.bottomEvidenceGraphRoot),
    topIdentityManifestRoot: sha256Identity(candidate.topIdentityManifestRoot),
    topEvidenceGraphRoot: sha256Identity(candidate.topEvidenceGraphRoot),
    budgetProfileSha256: sha256Identity(candidate.budgetProfileSha256),
    ledgerPrestateRoot: sha256Identity(candidate.ledgerPrestateRoot),
    ledgerPoststateRoot: sha256Identity(candidate.ledgerPoststateRoot),
    chronicleCanonicalHash: sha256Identity(candidate.chronicleCanonicalHash),
    finalStateCanonicalHash: sha256Identity(candidate.finalStateCanonicalHash),
    reconstructedTerminalStateHash: sha256Identity(
      candidate.reconstructedTerminalStateHash,
    ),
    outcomeCanonicalHash: sha256Identity(candidate.outcomeCanonicalHash),
    runtimeViolationEventCount: candidate.runtimeViolationEventCount,
    algorithm: "hmac-sha256",
    keyId: RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17,
    signature: candidate.signature as `hmac-sha256:${string}`,
  }
}

const parseResponse = (
  value: unknown,
): RuntimeExecutionServiceSuccessResponseV117 => {
  const candidate = record(value, [
    "contractVersion",
    "ok",
    "kind",
    "requestId",
    "matchId",
    "result",
  ])
  if (
    candidate.contractVersion !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_17 ||
    candidate.ok !== true ||
    candidate.kind !== "executionResult"
  )
    return fail()
  const result = record(candidate.result, [
    "privacy",
    "chronicle",
    "finalState",
    "outcome",
    "ledgerPoststateRoot",
    "runtimeViolationEventCount",
    "semanticReceipt",
  ])
  if (
    result.privacy !== "internal_runtime_result" ||
    typeof result.runtimeViolationEventCount !== "number" ||
    !Number.isSafeInteger(result.runtimeViolationEventCount) ||
    result.runtimeViolationEventCount < 0
  )
    return fail()
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    ok: true,
    kind: "executionResult",
    requestId: boundedString(candidate.requestId),
    matchId: boundedString(candidate.matchId),
    result: {
      privacy: "internal_runtime_result",
      chronicle: jsonValue(result.chronicle),
      finalState: jsonValue(result.finalState),
      outcome: jsonValue(result.outcome),
      ledgerPoststateRoot: sha256Identity(result.ledgerPoststateRoot),
      runtimeViolationEventCount: result.runtimeViolationEventCount,
      semanticReceipt: parseReceipt(result.semanticReceipt),
    },
  }
}

const u64be = (value: number): Uint8Array => {
  const result = new Uint8Array(8)
  new DataView(result.buffer).setBigUint64(0, BigInt(value), false)
  return result
}

const hashCanonicalValue = (
  domain: string,
  value: JsonValue,
): `sha256:${string}` => {
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
    typeof input.secret !== "string" ||
    input.secret.trim().length === 0 ||
    !SHA256_ID.test(input.ledgerPoststateRoot) ||
    !SHA256_ID.test(input.reconstructedTerminalStateHash) ||
    !Number.isSafeInteger(input.runtimeViolationEventCount) ||
    input.runtimeViolationEventCount < 0
  )
    return fail()
  const request = parseRequest(input.request)
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
  request: unknown
  response: unknown
  secret: string
}): Readonly<RuntimeSemanticReceiptV117> => {
  const request = parseRequest(input.request)
  const response = parseResponse(input.response)
  if (
    response.requestId !== request.requestId ||
    response.matchId !== request.matchId
  )
    return fail()
  const receipt = response.result.semanticReceipt
  const expected = issueRuntimeSemanticReceiptV117({
    request,
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
  const expectedEncoded = encodeCanonicalJson(
    expected as unknown as JsonValue,
    {
      context: "canonical-manifest",
    },
  )
  if (!actualEncoded.ok || !expectedEncoded.ok) return fail()
  const actualBytes = Buffer.from(actualEncoded.bytes)
  const expectedBytes = Buffer.from(expectedEncoded.bytes)
  if (
    actualBytes.byteLength !== expectedBytes.byteLength ||
    !timingSafeEqual(actualBytes, expectedBytes)
  )
    return fail()
  return Object.freeze({ ...receipt })
}
