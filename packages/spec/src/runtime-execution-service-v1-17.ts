import { createHash } from "node:crypto"
import { z } from "zod"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { CanonicalJsonValueV117Schema } from "./runtime-payload-v1-17.js"
import { RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17 } from "./runtime-evidence-v1-17.js"
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
  legacyAuthorityBundleHash: Sha256Identity
  legacyAuthoritySourceManifestHash: Sha256Identity
  legacyRegistryGeneration: string
  bottomIdentityManifestRoot: Sha256Identity
  bottomEvidenceGraphRoot: Sha256Identity
  bottomStrategyRevisionId: string
  bottomLaneIdentityHash: Sha256Identity
  bottomOriginalSourceSha256: Sha256Identity
  bottomNormalizedSourceSha256: Sha256Identity
  bottomArtifactSha256: Sha256Identity
  bottomExactPinsSha256: Sha256Identity
  topIdentityManifestRoot: Sha256Identity
  topEvidenceGraphRoot: Sha256Identity
  topStrategyRevisionId: string
  topLaneIdentityHash: Sha256Identity
  topOriginalSourceSha256: Sha256Identity
  topNormalizedSourceSha256: Sha256Identity
  topArtifactSha256: Sha256Identity
  topExactPinsSha256: Sha256Identity
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

export interface RuntimeSemanticReceiptV117 extends RuntimeSemanticReceiptClaimsV117 {
  signature: `hmac-sha256:${string}`
}

export interface RuntimeExecutionEntrantV117 {
  strategyRevisionId: string
  laneIdentityHash: Sha256Identity
  sourceIdentity: {
    originalSourceSha256: Sha256Identity
    normalizedSourceSha256: Sha256Identity
    artifactSha256: Sha256Identity
  }
  identityManifestRoot: Sha256Identity
  evidenceGraphRoot: Sha256Identity
  exactPins: readonly (readonly [string, string])[]
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
  legacyAuthority: {
    bundleHash: Sha256Identity
    sourceManifestHash: Sha256Identity
    registryGeneration: string
  }
  entrants: {
    bottom: RuntimeExecutionEntrantV117
    top: RuntimeExecutionEntrantV117
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

export interface RuntimeExecutionServiceSystemFailureResponseV117 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
  ok: false
  kind: "systemFailure"
  requestId: string
  matchId?: string | undefined
  systemFailure: {
    classification: "system_failure"
    ownership: "runtime_system" | "system_integrity" | "system_operation"
    code: string
    publicMessage: string
    retryable: boolean
    playerPenalty: false
  }
}

export type RuntimeExecutionServiceResponseV117 =
  | RuntimeExecutionServiceSuccessResponseV117
  | RuntimeExecutionServiceSystemFailureResponseV117

const BoundedIdentityV117Schema = z.string().min(1).max(512)
const Sha256IdentityV117Schema = z
  .string()
  .regex(/^sha256:[0-9a-f]{64}$/u) as z.ZodType<Sha256Identity>
const HmacSha256IdentityV117Schema = z
  .string()
  .regex(/^hmac-sha256:[0-9a-f]{64}$/u) as z.ZodType<`hmac-sha256:${string}`>
const RegistryGenerationV117Schema = z
  .string()
  .regex(/^(?:0|[1-9][0-9]{0,15})$/u)

const RuntimeEvidenceExactPinsV117Schema = z
  .array(z.tuple([z.string(), BoundedIdentityV117Schema]))
  .length(RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.length)
  .superRefine((pins, context) => {
    for (const [index, expected] of
      RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.entries()) {
      if (pins[index]?.[0] !== expected) {
        context.addIssue({
          code: "custom",
          path: [index, 0],
          message: "Runtime evidence exact pins are out of order.",
        })
      }
    }
  })

const RuntimeExecutionEntrantV117Schema = z
  .object({
    strategyRevisionId: BoundedIdentityV117Schema,
    laneIdentityHash: Sha256IdentityV117Schema,
    sourceIdentity: z
      .object({
        originalSourceSha256: Sha256IdentityV117Schema,
        normalizedSourceSha256: Sha256IdentityV117Schema,
        artifactSha256: Sha256IdentityV117Schema,
      })
      .strict(),
    identityManifestRoot: Sha256IdentityV117Schema,
    evidenceGraphRoot: Sha256IdentityV117Schema,
    exactPins: RuntimeEvidenceExactPinsV117Schema,
  })
  .strict()

export const RuntimeExecutionServiceRequestV117Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_17),
    kind: z.literal("executeMatch"),
    requestId: BoundedIdentityV117Schema,
    matchId: BoundedIdentityV117Schema,
    compatibilityTupleId: Sha256IdentityV117Schema,
    authority: z
      .object({
        bundleHash: Sha256IdentityV117Schema,
        sourceManifestHash: Sha256IdentityV117Schema,
        registryGeneration: RegistryGenerationV117Schema,
      })
      .strict(),
    legacyAuthority: z
      .object({
        bundleHash: Sha256IdentityV117Schema,
        sourceManifestHash: Sha256IdentityV117Schema,
        registryGeneration: RegistryGenerationV117Schema,
      })
      .strict(),
    entrants: z
      .object({
        bottom: RuntimeExecutionEntrantV117Schema,
        top: RuntimeExecutionEntrantV117Schema,
      })
      .strict(),
    accounting: z
      .object({
        budgetProfileSha256: Sha256IdentityV117Schema,
        ledgerPrestateRoot: Sha256IdentityV117Schema,
      })
      .strict(),
    match: CanonicalJsonValueV117Schema,
  })
  .strict() satisfies z.ZodType<RuntimeExecutionServiceRequestV117>

export const RuntimeSemanticReceiptV117Schema = z
  .object({
    schemaVersion: z.literal(RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17),
    profile: z.literal(RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_17),
    serviceContractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_17),
    requestSha256: Sha256IdentityV117Schema,
    requestId: BoundedIdentityV117Schema,
    matchId: BoundedIdentityV117Schema,
    compatibilityTupleId: Sha256IdentityV117Schema,
    authorityBundleHash: Sha256IdentityV117Schema,
    authoritySourceManifestHash: Sha256IdentityV117Schema,
    registryGeneration: RegistryGenerationV117Schema,
    legacyAuthorityBundleHash: Sha256IdentityV117Schema,
    legacyAuthoritySourceManifestHash: Sha256IdentityV117Schema,
    legacyRegistryGeneration: RegistryGenerationV117Schema,
    bottomIdentityManifestRoot: Sha256IdentityV117Schema,
    bottomEvidenceGraphRoot: Sha256IdentityV117Schema,
    bottomStrategyRevisionId: BoundedIdentityV117Schema,
    bottomLaneIdentityHash: Sha256IdentityV117Schema,
    bottomOriginalSourceSha256: Sha256IdentityV117Schema,
    bottomNormalizedSourceSha256: Sha256IdentityV117Schema,
    bottomArtifactSha256: Sha256IdentityV117Schema,
    bottomExactPinsSha256: Sha256IdentityV117Schema,
    topIdentityManifestRoot: Sha256IdentityV117Schema,
    topEvidenceGraphRoot: Sha256IdentityV117Schema,
    topStrategyRevisionId: BoundedIdentityV117Schema,
    topLaneIdentityHash: Sha256IdentityV117Schema,
    topOriginalSourceSha256: Sha256IdentityV117Schema,
    topNormalizedSourceSha256: Sha256IdentityV117Schema,
    topArtifactSha256: Sha256IdentityV117Schema,
    topExactPinsSha256: Sha256IdentityV117Schema,
    budgetProfileSha256: Sha256IdentityV117Schema,
    ledgerPrestateRoot: Sha256IdentityV117Schema,
    ledgerPoststateRoot: Sha256IdentityV117Schema,
    chronicleCanonicalHash: Sha256IdentityV117Schema,
    finalStateCanonicalHash: Sha256IdentityV117Schema,
    reconstructedTerminalStateHash: Sha256IdentityV117Schema,
    outcomeCanonicalHash: Sha256IdentityV117Schema,
    runtimeViolationEventCount: z.number().int().nonnegative(),
    algorithm: z.literal("hmac-sha256"),
    keyId: z.literal(RUNTIME_SEMANTIC_RECEIPT_KEY_ID_V1_17),
    signature: HmacSha256IdentityV117Schema,
  })
  .strict() satisfies z.ZodType<RuntimeSemanticReceiptV117>

export const RuntimeExecutionServiceSuccessResponseV117Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_17),
    ok: z.literal(true),
    kind: z.literal("executionResult"),
    requestId: BoundedIdentityV117Schema,
    matchId: BoundedIdentityV117Schema,
    result: z
      .object({
        privacy: z.literal("internal_runtime_result"),
        chronicle: CanonicalJsonValueV117Schema,
        finalState: CanonicalJsonValueV117Schema,
        outcome: CanonicalJsonValueV117Schema,
        ledgerPoststateRoot: Sha256IdentityV117Schema,
        runtimeViolationEventCount: z.number().int().nonnegative(),
        semanticReceipt: RuntimeSemanticReceiptV117Schema,
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<RuntimeExecutionServiceSuccessResponseV117>

export const RuntimeExecutionServiceSystemFailureResponseV117Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_17),
    ok: z.literal(false),
    kind: z.literal("systemFailure"),
    requestId: BoundedIdentityV117Schema,
    matchId: BoundedIdentityV117Schema.optional(),
    systemFailure: z
      .object({
        classification: z.literal("system_failure"),
        ownership: z.enum([
          "runtime_system",
          "system_integrity",
          "system_operation",
        ]),
        code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/u),
        publicMessage: z.string().min(1).max(256),
        retryable: z.boolean(),
        playerPenalty: z.literal(false),
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<RuntimeExecutionServiceSystemFailureResponseV117>

export const RuntimeExecutionServiceResponseV117Schema = z.discriminatedUnion(
  "ok",
  [
    RuntimeExecutionServiceSuccessResponseV117Schema,
    RuntimeExecutionServiceSystemFailureResponseV117Schema,
  ],
) satisfies z.ZodType<RuntimeExecutionServiceResponseV117>

const u64be = (value: number): Uint8Array => {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), false)
  return bytes
}

const frame = (segments: readonly Uint8Array[]): Uint8Array => {
  const size = segments.reduce(
    (total, value) => total + 8 + value.byteLength,
    0,
  )
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
  if (!encoded.ok)
    throw new TypeError("Runtime v1.17 value is not canonical JSON.")
  return encoded.bytes
}

export const hashRuntimeExecutionExactPinsV117 = (
  exactPins: RuntimeExecutionEntrantV117["exactPins"],
): Sha256Identity =>
  `sha256:${createHash("sha256")
    .update(canonicalBytes(exactPins as unknown as JsonValue))
    .digest("hex")}`

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
