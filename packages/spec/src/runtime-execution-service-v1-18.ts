import { createHash } from "node:crypto"
import { z } from "zod"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES,
  prepareCanonicalCompatibilityTupleRecord,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import { CanonicalJsonValueV117Schema } from "./runtime-payload-v1-17.js"
import type { JsonValue } from "./types.js"

export const RUNTIME_EXECUTION_SERVICE_VERSION_V1_18 =
  "runtime-execution-service-v1.18" as const
export const RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18 =
  "runtime-semantic-receipt-v1.18" as const
export const RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_18 =
  "canonical-semantic-admission-v1" as const
export const RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_18 =
  "cowards-game:runtime-semantic-receipt:v1.18" as const

export type Sha256IdentityV118 = `sha256:${string}`
export type RuntimeMatchSideV118 = "bottom" | "top"

export interface RuntimeSemanticTupleV118 {
  tupleId: Sha256IdentityV118
  components: CanonicalCompatibilityTuple
}

export interface RuntimeCertificateSourceIdentityV118 {
  strategyRevisionId: string
  originalSourceSha256: Sha256IdentityV118
  normalizedSourceSha256: Sha256IdentityV118
  artifactSha256: Sha256IdentityV118
  identityManifestRoot: Sha256IdentityV118
  evidenceGraphRoot: Sha256IdentityV118
  laneIdentityHash: Sha256IdentityV118
}

export interface RuntimeCertificateReferenceV118 {
  side: RuntimeMatchSideV118
  certificateId: string
  certificateRecordHash: Sha256IdentityV118
  registryGeneration: string
  lane: string
  freshUntil: string
  sourceIdentity: RuntimeCertificateSourceIdentityV118
}

export interface RuntimeCertificateReferencesV118 {
  bottom: RuntimeCertificateReferenceV118
  top: RuntimeCertificateReferenceV118
}

export interface RuntimeExecutionAccountingRequestV118 {
  budgetProfileRoot: Sha256IdentityV118
  ledgerPrestateRoot: Sha256IdentityV118
}

export interface RuntimeExecutionAccountingResultV118 extends RuntimeExecutionAccountingRequestV118 {
  ledgerPoststateRoot: Sha256IdentityV118
}

export interface RuntimeExecutionServiceRequestV118 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_18
  kind: "executeMatch"
  requestId: string
  matchId: string
  semanticTuple: RuntimeSemanticTupleV118
  authorityGeneration: string
  evaluationInstant: string
  certificateReferences: RuntimeCertificateReferencesV118
  accounting: RuntimeExecutionAccountingRequestV118
  match: JsonValue
}

export interface RuntimeSemanticAdmissionResultV118 {
  resultClass: "success" | "player_violation" | "system_failure"
  ownership: "gameplay" | "player" | "system"
  retryable: boolean
  mutationStatus: "committed" | "none"
}

export interface RuntimeSemanticAdmissionClaimV118 {
  schemaVersion: typeof RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18
  profile: typeof RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_18
  serviceContractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_18
  requestSha256: Sha256IdentityV118
  requestId: string
  matchId: string
  semanticTuple: RuntimeSemanticTupleV118
  authorityGeneration: string
  evaluationInstant: string
  certificateReferences: RuntimeCertificateReferencesV118
  chronicleCanonicalHash: Sha256IdentityV118
  transitionTraceRoot: Sha256IdentityV118
  finalStateCanonicalHash: Sha256IdentityV118
  outcomeCanonicalHash: Sha256IdentityV118
  terminal: {
    status: string
    reason: string
  }
  accounting: RuntimeExecutionAccountingResultV118
  result: RuntimeSemanticAdmissionResultV118
}

export interface RuntimeSemanticReceiptV118 {
  claim: RuntimeSemanticAdmissionClaimV118
  algorithm: "Ed25519"
  keyId: string
  signatureBase64: string
}

export interface RuntimeExecutionServiceSuccessResponseV118 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_18
  ok: true
  kind: "executionResult"
  requestId: string
  matchId: string
  result: {
    privacy: "public_receipt"
    chronicleCanonicalHash: Sha256IdentityV118
    transitionTraceRoot: Sha256IdentityV118
    finalStateCanonicalHash: Sha256IdentityV118
    outcomeCanonicalHash: Sha256IdentityV118
    terminal: {
      status: string
      reason: string
    }
    accounting: RuntimeExecutionAccountingResultV118
    resultClass: "success"
    ownership: "gameplay"
    retryable: false
    mutationStatus: "committed"
    semanticReceipt: RuntimeSemanticReceiptV118
  }
}

export interface RuntimeExecutionServiceSystemFailureResponseV118 {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION_V1_18
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
    mutationStatus: "none"
  }
}

export type RuntimeExecutionServiceResponseV118 =
  | RuntimeExecutionServiceSuccessResponseV118
  | RuntimeExecutionServiceSystemFailureResponseV118

const Sha256Schema = z
  .string()
  .regex(/^sha256:[0-9a-f]{64}$/u) as z.ZodType<Sha256IdentityV118>
const BoundedIdentifierSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/u)
const ExactIdentifierSchema = BoundedIdentifierSchema
  .refine(
    (value) =>
      !/(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]/iu.test(
        value,
      ),
    "floating identifiers are not canonical",
  )
const RegistryGenerationSchema = z
  .string()
  .regex(/^(?:0|[1-9][0-9]{0,15})$/u)
const CanonicalInstantSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u)
  .refine(
    (value) =>
      Number.isFinite(Date.parse(value)) &&
      new Date(Date.parse(value)).toISOString() === value,
    "instant must be exact UTC milliseconds",
  )

const RuntimeSemanticTupleComponentsV118Schema = z
  .object({
    rules: BoundedIdentifierSchema,
    engine: BoundedIdentifierSchema,
    runtimeAbi: BoundedIdentifierSchema,
    chronicle: BoundedIdentifierSchema,
    arenaCatalog: BoundedIdentifierSchema,
    setPolicy: BoundedIdentifierSchema,
  })
  .strict()

export const createRuntimeSemanticTupleV118 = (
  components: CanonicalCompatibilityTuple,
): RuntimeSemanticTupleV118 => {
  const parsed = RuntimeSemanticTupleComponentsV118Schema.parse(components)
  const record = prepareCanonicalCompatibilityTupleRecord(
    parsed,
    CANONICAL_COMPATIBILITY_TUPLE_IDENTITY_PROFILES.successor.identityProfile,
  )
  return {
    tupleId: record.tupleId as Sha256IdentityV118,
    components: { ...record.tuple },
  }
}

const RuntimeSemanticTupleV118Schema = z
  .object({
    tupleId: Sha256Schema,
    components: RuntimeSemanticTupleComponentsV118Schema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.tupleId !== createRuntimeSemanticTupleV118(value.components).tupleId
    ) {
      context.addIssue({
        code: "custom",
        path: ["tupleId"],
        message: "semantic tuple ID does not match its six components",
      })
    }
  })

const RuntimeCertificateSourceIdentityV118Schema = z
  .object({
    strategyRevisionId: ExactIdentifierSchema,
    originalSourceSha256: Sha256Schema,
    normalizedSourceSha256: Sha256Schema,
    artifactSha256: Sha256Schema,
    identityManifestRoot: Sha256Schema,
    evidenceGraphRoot: Sha256Schema,
    laneIdentityHash: Sha256Schema,
  })
  .strict()

const RuntimeCertificateReferenceV118Schema = z
  .object({
    side: z.enum(["bottom", "top"]),
    certificateId: ExactIdentifierSchema,
    certificateRecordHash: Sha256Schema,
    registryGeneration: RegistryGenerationSchema,
    lane: ExactIdentifierSchema,
    freshUntil: CanonicalInstantSchema,
    sourceIdentity: RuntimeCertificateSourceIdentityV118Schema,
  })
  .strict()

export const RuntimeCertificateReferencesV118Schema = z
  .object({
    bottom: RuntimeCertificateReferenceV118Schema,
    top: RuntimeCertificateReferenceV118Schema,
  })
  .strict()

const RuntimeExecutionAccountingRequestV118Schema = z
  .object({
    budgetProfileRoot: Sha256Schema,
    ledgerPrestateRoot: Sha256Schema,
  })
  .strict()

const RuntimeExecutionAccountingResultV118Schema =
  RuntimeExecutionAccountingRequestV118Schema.extend({
    ledgerPoststateRoot: Sha256Schema,
  }).strict()

const validateCertificateReferences = (
  value: {
    authorityGeneration: string
    evaluationInstant: string
    certificateReferences: RuntimeCertificateReferencesV118
  },
  context: z.core.$RefinementCtx<unknown>,
): void => {
  const { bottom, top } = value.certificateReferences
  if (bottom.side !== "bottom" || top.side !== "top") {
    context.addIssue({
      code: "custom",
      path: ["certificateReferences"],
      message: "certificate references are bound to the wrong side",
    })
  }
  if (
    bottom.certificateId === top.certificateId ||
    bottom.certificateRecordHash === top.certificateRecordHash
  ) {
    context.addIssue({
      code: "custom",
      path: ["certificateReferences"],
      message: "bottom and top certificate references must be distinct",
    })
  }
  for (const side of ["bottom", "top"] as const) {
    const reference = value.certificateReferences[side]
    if (reference.registryGeneration !== value.authorityGeneration) {
      context.addIssue({
        code: "custom",
        path: ["certificateReferences", side, "registryGeneration"],
        message: "certificate registry generation does not match authority",
      })
    }
    if (Date.parse(reference.freshUntil) <= Date.parse(value.evaluationInstant)) {
      context.addIssue({
        code: "custom",
        path: ["certificateReferences", side, "freshUntil"],
        message: "certificate is not fresh at the evaluation instant",
      })
    }
  }
}

export const RuntimeExecutionServiceRequestV118Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_18),
    kind: z.literal("executeMatch"),
    requestId: ExactIdentifierSchema,
    matchId: ExactIdentifierSchema,
    semanticTuple: RuntimeSemanticTupleV118Schema,
    authorityGeneration: RegistryGenerationSchema,
    evaluationInstant: CanonicalInstantSchema,
    certificateReferences: RuntimeCertificateReferencesV118Schema,
    accounting: RuntimeExecutionAccountingRequestV118Schema,
    match: CanonicalJsonValueV117Schema,
  })
  .strict()
  .superRefine(validateCertificateReferences) satisfies z.ZodType<RuntimeExecutionServiceRequestV118>

const RuntimeSemanticAdmissionResultV118Schema = z
  .object({
    resultClass: z.enum(["success", "player_violation", "system_failure"]),
    ownership: z.enum(["gameplay", "player", "system"]),
    retryable: z.boolean(),
    mutationStatus: z.enum(["committed", "none"]),
  })
  .strict()
  .superRefine((value, context) => {
    const valid =
      (value.resultClass === "success" &&
        value.ownership === "gameplay" &&
        value.retryable === false &&
        value.mutationStatus === "committed") ||
      (value.resultClass === "player_violation" &&
        value.ownership === "player" &&
        value.retryable === false &&
        value.mutationStatus === "committed") ||
      (value.resultClass === "system_failure" &&
        value.ownership === "system" &&
        value.mutationStatus === "none")
    if (!valid) {
      context.addIssue({
        code: "custom",
        message: "result class, ownership, retryability, and mutation disagree",
      })
    }
  })

export const RuntimeSemanticAdmissionClaimV118Schema = z
  .object({
    schemaVersion: z.literal(
      RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18,
    ),
    profile: z.literal(RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_18),
    serviceContractVersion: z.literal(
      RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
    ),
    requestSha256: Sha256Schema,
    requestId: ExactIdentifierSchema,
    matchId: ExactIdentifierSchema,
    semanticTuple: RuntimeSemanticTupleV118Schema,
    authorityGeneration: RegistryGenerationSchema,
    evaluationInstant: CanonicalInstantSchema,
    certificateReferences: RuntimeCertificateReferencesV118Schema,
    chronicleCanonicalHash: Sha256Schema,
    transitionTraceRoot: Sha256Schema,
    finalStateCanonicalHash: Sha256Schema,
    outcomeCanonicalHash: Sha256Schema,
    terminal: z
      .object({
        status: ExactIdentifierSchema,
        reason: ExactIdentifierSchema,
      })
      .strict(),
    accounting: RuntimeExecutionAccountingResultV118Schema,
    result: RuntimeSemanticAdmissionResultV118Schema,
  })
  .strict()
  .superRefine(validateCertificateReferences) satisfies z.ZodType<RuntimeSemanticAdmissionClaimV118>

const Ed25519SignatureBase64Schema = z.string().refine((value) => {
  if (!/^[A-Za-z0-9+/]{86}==$/u.test(value)) return false
  return Buffer.from(value, "base64").byteLength === 64
}, "signature must be canonical base64 for exactly 64 Ed25519 bytes")

export const RuntimeSemanticReceiptV118Schema = z
  .object({
    claim: RuntimeSemanticAdmissionClaimV118Schema,
    algorithm: z.literal("Ed25519"),
    keyId: ExactIdentifierSchema,
    signatureBase64: Ed25519SignatureBase64Schema,
  })
  .strict() satisfies z.ZodType<RuntimeSemanticReceiptV118>

const RuntimeExecutionServiceSuccessResponseV118Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_18),
    ok: z.literal(true),
    kind: z.literal("executionResult"),
    requestId: ExactIdentifierSchema,
    matchId: ExactIdentifierSchema,
    result: z
      .object({
        privacy: z.literal("public_receipt"),
        chronicleCanonicalHash: Sha256Schema,
        transitionTraceRoot: Sha256Schema,
        finalStateCanonicalHash: Sha256Schema,
        outcomeCanonicalHash: Sha256Schema,
        terminal: z
          .object({
            status: ExactIdentifierSchema,
            reason: ExactIdentifierSchema,
          })
          .strict(),
        accounting: RuntimeExecutionAccountingResultV118Schema,
        resultClass: z.literal("success"),
        ownership: z.literal("gameplay"),
        retryable: z.literal(false),
        mutationStatus: z.literal("committed"),
        semanticReceipt: RuntimeSemanticReceiptV118Schema,
      })
      .strict(),
  })
  .strict()
  .superRefine((response, context) => {
    const claim = response.result.semanticReceipt.claim
    const mirrored = [
      ["requestId", response.requestId, claim.requestId],
      ["matchId", response.matchId, claim.matchId],
      [
        "chronicleCanonicalHash",
        response.result.chronicleCanonicalHash,
        claim.chronicleCanonicalHash,
      ],
      [
        "transitionTraceRoot",
        response.result.transitionTraceRoot,
        claim.transitionTraceRoot,
      ],
      [
        "finalStateCanonicalHash",
        response.result.finalStateCanonicalHash,
        claim.finalStateCanonicalHash,
      ],
      [
        "outcomeCanonicalHash",
        response.result.outcomeCanonicalHash,
        claim.outcomeCanonicalHash,
      ],
    ] as const
    for (const [field, actual, expected] of mirrored) {
      if (actual !== expected) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "response field does not match authenticated claim",
        })
      }
    }
    if (
      canonicalSha256(response.result.terminal) !==
        canonicalSha256(claim.terminal) ||
      canonicalSha256(response.result.accounting) !==
        canonicalSha256(claim.accounting)
    ) {
      context.addIssue({
        code: "custom",
        path: ["result"],
        message: "response anchors do not match authenticated claim",
      })
    }
  }) satisfies z.ZodType<RuntimeExecutionServiceSuccessResponseV118>

const RuntimeExecutionServiceSystemFailureResponseV118Schema = z
  .object({
    contractVersion: z.literal(RUNTIME_EXECUTION_SERVICE_VERSION_V1_18),
    ok: z.literal(false),
    kind: z.literal("systemFailure"),
    requestId: ExactIdentifierSchema,
    matchId: ExactIdentifierSchema.optional(),
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
        mutationStatus: z.literal("none"),
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<RuntimeExecutionServiceSystemFailureResponseV118>

export const RuntimeExecutionServiceResponseV118Schema = z.discriminatedUnion(
  "ok",
  [
    RuntimeExecutionServiceSuccessResponseV118Schema,
    RuntimeExecutionServiceSystemFailureResponseV118Schema,
  ],
) satisfies z.ZodType<RuntimeExecutionServiceResponseV118>

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new TypeError(
      `Runtime execution service v1.18 value is not canonical: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const canonicalSha256 = (value: unknown): Sha256IdentityV118 =>
  `sha256:${createHash("sha256")
    .update(canonicalBytes(value as JsonValue))
    .digest("hex")}`

export const serializeRuntimeExecutionServiceRequestV118 = (
  request: RuntimeExecutionServiceRequestV118,
): Uint8Array =>
  canonicalBytes(RuntimeExecutionServiceRequestV118Schema.parse(request))

export const serializeRuntimeExecutionServiceResponseV118 = (
  response: RuntimeExecutionServiceResponseV118,
): Uint8Array =>
  canonicalBytes(
    RuntimeExecutionServiceResponseV118Schema.parse(
      response,
    ) as unknown as JsonValue,
  )

export const hashRuntimeExecutionServiceRequestV118 = (
  request: RuntimeExecutionServiceRequestV118,
): Sha256IdentityV118 =>
  `sha256:${createHash("sha256")
    .update(serializeRuntimeExecutionServiceRequestV118(request))
    .digest("hex")}`

export interface CreateRuntimeSemanticAdmissionClaimInputV118 {
  request: RuntimeExecutionServiceRequestV118
  chronicleCanonicalHash: Sha256IdentityV118
  transitionTraceRoot: Sha256IdentityV118
  finalStateCanonicalHash: Sha256IdentityV118
  outcomeCanonicalHash: Sha256IdentityV118
  terminal: RuntimeSemanticAdmissionClaimV118["terminal"]
  accounting: RuntimeExecutionAccountingResultV118
  result?: RuntimeSemanticAdmissionResultV118
}

export const createRuntimeSemanticAdmissionClaimV118 = (
  input: CreateRuntimeSemanticAdmissionClaimInputV118,
): RuntimeSemanticAdmissionClaimV118 => {
  const request = RuntimeExecutionServiceRequestV118Schema.parse(input.request)
  if (
    input.accounting.budgetProfileRoot !==
      request.accounting.budgetProfileRoot ||
    input.accounting.ledgerPrestateRoot !==
      request.accounting.ledgerPrestateRoot
  ) {
    throw new TypeError(
      "Runtime semantic admission accounting does not match the request.",
    )
  }
  return RuntimeSemanticAdmissionClaimV118Schema.parse({
    schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_18,
    profile: RUNTIME_SEMANTIC_RECEIPT_PROFILE_V1_18,
    serviceContractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
    requestSha256: hashRuntimeExecutionServiceRequestV118(request),
    requestId: request.requestId,
    matchId: request.matchId,
    semanticTuple: request.semanticTuple,
    authorityGeneration: request.authorityGeneration,
    evaluationInstant: request.evaluationInstant,
    certificateReferences: request.certificateReferences,
    chronicleCanonicalHash: input.chronicleCanonicalHash,
    transitionTraceRoot: input.transitionTraceRoot,
    finalStateCanonicalHash: input.finalStateCanonicalHash,
    outcomeCanonicalHash: input.outcomeCanonicalHash,
    terminal: input.terminal,
    accounting: input.accounting,
    result: input.result ?? {
      resultClass: "success",
      ownership: "gameplay",
      retryable: false,
      mutationStatus: "committed",
    },
  })
}
