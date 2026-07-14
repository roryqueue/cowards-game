import { Buffer } from "node:buffer"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { z } from "zod"
import { frameCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { admitCanonicalJsonBytes } from "./canonical-json.js"
import {
  RUNTIME_ABI_V1_17,
  RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION,
  debitRuntimeAbiV117Ledger,
  type RuntimeAbiV117AccountingEvidence,
  type RuntimeAbiV117CounterEvidence,
  type RuntimeAbiV117LedgerAttribution,
  type RuntimeAbiV117LedgerDebitResult,
  type RuntimeAbiV117MemoryEvidence,
  type RuntimeAbiV117PreflightCapabilityEvidence,
  type RuntimeAbiV117PreflightCounterName,
  type RuntimeAbiV117PreflightLedger,
  type RuntimeAbiV117PreflightLedgerReceipt,
  type RuntimeAbiV117PreflightProfile,
  type RuntimeAbiV117ProcessEvidence,
} from "./runtime-abi-v1-17.js"
import type { JsonValue } from "./types.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const RUNTIME_PREFLIGHT_V1_17_CANDIDATE = deepFreeze({
  contractVersion: "runtime-preflight-v1.17",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  lifecycle: "inactive-candidate",
  activationPlan: "258-14",
  current: false,
} as const)

export const RUNTIME_PREFLIGHT_V1_17_AUTH_ALGORITHM = "hmac-sha256" as const

const textEncoder = new TextEncoder()
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)
const PublicIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u)
const NonnegativeSafeIntegerSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER)
const PreflightProfileSchema = z.enum([
  "sourceValidation",
  "compilation",
  "artifactValidation",
  "conformance",
])
const PreflightInputKindSchema = z.enum([
  "source-bytes",
  "artifact-bytes",
  "manifest-bytes",
  "corpus-bytes",
])

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new TypeError(
      `Preflight envelope is not canonical JSON: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const sha256Bytes = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const framedValueHash = (label: string, value: JsonValue): `sha256:${string}` =>
  sha256Bytes(
    frameCanonicalIdentity("evidenceBundle", [
      textEncoder.encode(label),
      canonicalBytes(value),
    ]),
  )

const sameCanonicalValue = (left: JsonValue, right: JsonValue): boolean =>
  Buffer.from(canonicalBytes(left)).equals(Buffer.from(canonicalBytes(right)))

export interface RuntimePreflightAuthenticationV117 {
  readonly algorithm: typeof RUNTIME_PREFLIGHT_V1_17_AUTH_ALGORITHM
  readonly keyId: string
  readonly signatureInputSha256: `sha256:${string}`
  readonly signature: `hmac-sha256:${string}`
}

export interface RuntimePreflightSigningIdentityV117 {
  readonly keyId: string
  readonly secret: string
}

export type RuntimePreflightLimitsV117 = Readonly<{
  wallMilliseconds: number
  computeFuel: number
  memoryBytes: number
  inputBytes: number
  outputBytes: number
  stderrBytes: number
  processes: number
  threads: number
  children: number
  network: string
  filesystem: string
  failureOwnership: Readonly<{
    invalidInput: "submission_violation"
    unavailableInfrastructure: "system_failure"
  }>
}>

export interface RuntimePreflightBudgetV117 {
  readonly profile: RuntimeAbiV117PreflightProfile
  readonly profileSha256: `sha256:${string}`
  readonly limits: RuntimePreflightLimitsV117
}

export interface RuntimePreflightProducerIdentityV117 {
  readonly producerId: string
  readonly buildSha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightToolchainIdentityV117 {
  readonly toolchainId: string
  readonly runtimeExecutableSha256: `sha256:${string}`
  readonly compilerExecutableSha256: `sha256:${string}`
  readonly sysrootStdlibSha256: `sha256:${string}`
  readonly adapterBuildSha256: `sha256:${string}`
  readonly reportedVersion: string
  readonly targetAbi: string
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightContainmentIdentityV117 {
  readonly policyId: string
  readonly policySha256: `sha256:${string}`
  readonly evidenceBundleSha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightEvidenceContextV117 {
  readonly producer: RuntimePreflightProducerIdentityV117
  readonly toolchain: RuntimePreflightToolchainIdentityV117
  readonly containment: RuntimePreflightContainmentIdentityV117
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightInputV117 {
  readonly inputId: string
  readonly kind: z.infer<typeof PreflightInputKindSchema>
  readonly sha256: `sha256:${string}`
  readonly byteLength: number
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightRetryV117 {
  readonly retryId: string
  readonly attempt: number
  readonly previousRequestSha256: `sha256:${string}` | null
  readonly originalRequestSha256: `sha256:${string}` | null
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightRequestAccountingV117 {
  readonly schemaVersion: "runtime-preflight-accounting-v1.17"
  readonly domain: "preflight"
  readonly prestate: RuntimeAbiV117PreflightLedger
  readonly prestateRevision: number
  readonly prestateCanonicalByteLength: number
  readonly prestateSha256: `sha256:${string}`
  readonly requestIdentity: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface AuthenticatedRuntimePreflightRequestV117 {
  readonly contractVersion: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion
  readonly runtimeAbiVersion: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion
  readonly candidateStatus: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle
  readonly current: false
  readonly envelopeKind: "runtime-preflight-request"
  readonly requestId: string
  readonly operationId: string
  readonly profile: RuntimeAbiV117PreflightProfile
  readonly budget: RuntimePreflightBudgetV117
  readonly accounting: RuntimePreflightRequestAccountingV117
  readonly input: RuntimePreflightInputV117
  readonly retry: RuntimePreflightRetryV117
  readonly evidenceContext: RuntimePreflightEvidenceContextV117
  readonly authentication: RuntimePreflightAuthenticationV117
}

export interface CreateRuntimePreflightRequestV117Input {
  readonly requestId: string
  readonly operationId: string
  readonly profile: RuntimeAbiV117PreflightProfile
  readonly accounting: Readonly<{ prestate: RuntimeAbiV117PreflightLedger }>
  readonly input: Readonly<{
    inputId: string
    kind: z.infer<typeof PreflightInputKindSchema>
    bytes: Uint8Array
  }>
  readonly retryId: string
  readonly evidenceContext: Readonly<{
    producer: Omit<RuntimePreflightProducerIdentityV117, "identitySha256">
    toolchain: Omit<RuntimePreflightToolchainIdentityV117, "identitySha256">
    containment: Omit<RuntimePreflightContainmentIdentityV117, "identitySha256">
  }>
}

const FailureOwnershipSchema = z
  .object({
    invalidInput: z.literal("submission_violation"),
    unavailableInfrastructure: z.literal("system_failure"),
  })
  .strict()

const RuntimePreflightLimitsV117Schema = z
  .object({
    wallMilliseconds: NonnegativeSafeIntegerSchema,
    computeFuel: NonnegativeSafeIntegerSchema,
    memoryBytes: NonnegativeSafeIntegerSchema,
    inputBytes: NonnegativeSafeIntegerSchema,
    outputBytes: NonnegativeSafeIntegerSchema,
    stderrBytes: NonnegativeSafeIntegerSchema,
    processes: NonnegativeSafeIntegerSchema,
    threads: NonnegativeSafeIntegerSchema,
    children: NonnegativeSafeIntegerSchema,
    network: PublicIdSchema,
    filesystem: PublicIdSchema,
    failureOwnership: FailureOwnershipSchema,
  })
  .strict()

const RuntimePreflightBudgetV117Schema = z
  .object({
    profile: PreflightProfileSchema,
    profileSha256: Sha256Schema,
    limits: RuntimePreflightLimitsV117Schema,
  })
  .strict()

const RuntimePreflightProducerIdentityV117Schema = z
  .object({
    producerId: PublicIdSchema,
    buildSha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightToolchainIdentityV117Schema = z
  .object({
    toolchainId: PublicIdSchema,
    runtimeExecutableSha256: Sha256Schema,
    compilerExecutableSha256: Sha256Schema,
    sysrootStdlibSha256: Sha256Schema,
    adapterBuildSha256: Sha256Schema,
    reportedVersion: PublicIdSchema,
    targetAbi: PublicIdSchema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightContainmentIdentityV117Schema = z
  .object({
    policyId: PublicIdSchema,
    policySha256: Sha256Schema,
    evidenceBundleSha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightEvidenceContextV117Schema = z
  .object({
    producer: RuntimePreflightProducerIdentityV117Schema,
    toolchain: RuntimePreflightToolchainIdentityV117Schema,
    containment: RuntimePreflightContainmentIdentityV117Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightInputV117Schema = z
  .object({
    inputId: PublicIdSchema,
    kind: PreflightInputKindSchema,
    sha256: Sha256Schema,
    byteLength: NonnegativeSafeIntegerSchema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightRetryV117Schema = z
  .object({
    retryId: PublicIdSchema,
    attempt: NonnegativeSafeIntegerSchema,
    previousRequestSha256: Sha256Schema.nullable(),
    originalRequestSha256: Sha256Schema.nullable(),
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightAuthenticationV117Schema = z
  .object({
    algorithm: z.literal(RUNTIME_PREFLIGHT_V1_17_AUTH_ALGORITHM),
    keyId: PublicIdSchema,
    signatureInputSha256: Sha256Schema,
    signature: z.string().regex(/^hmac-sha256:[0-9a-f]{64}$/u),
  })
  .strict()

const RuntimeAbiV117LedgerCommitmentSchema = z
  .object({
    identity: PublicIdSchema,
    requestIdentity: Sha256Schema,
    evidenceIdentity: Sha256Schema,
    prestateRevision: NonnegativeSafeIntegerSchema,
    scope: PreflightProfileSchema,
    outcome: z.enum(["success", "player_violation"]),
    dimensions: z.array(z.string().min(1)),
  })
  .strict()

const RuntimeAbiV117PreflightLedgerSchema = z
  .object({
    schemaVersion: z.literal(RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION),
    domain: z.literal("preflight"),
    profile: PreflightProfileSchema,
    revision: NonnegativeSafeIntegerSchema,
    cumulative: z
      .object({
        operationCount: NonnegativeSafeIntegerSchema,
        wallMilliseconds: NonnegativeSafeIntegerSchema,
        computeFuel: NonnegativeSafeIntegerSchema,
        inputBytes: NonnegativeSafeIntegerSchema,
        outputBytes: NonnegativeSafeIntegerSchema,
        stderrBytes: NonnegativeSafeIntegerSchema,
        memoryBytes: NonnegativeSafeIntegerSchema,
      })
      .strict(),
    commitments: z.array(RuntimeAbiV117LedgerCommitmentSchema),
  })
  .strict()

const RuntimePreflightRequestAccountingV117Schema = z
  .object({
    schemaVersion: z.literal("runtime-preflight-accounting-v1.17"),
    domain: z.literal("preflight"),
    prestate: RuntimeAbiV117PreflightLedgerSchema,
    prestateRevision: NonnegativeSafeIntegerSchema,
    prestateCanonicalByteLength: NonnegativeSafeIntegerSchema,
    prestateSha256: Sha256Schema,
    requestIdentity: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

export const AuthenticatedRuntimePreflightRequestV117Schema = z
  .object({
    contractVersion: z.literal(
      RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion,
    ),
    runtimeAbiVersion: z.literal(
      RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion,
    ),
    candidateStatus: z.literal(RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle),
    current: z.literal(false),
    envelopeKind: z.literal("runtime-preflight-request"),
    requestId: PublicIdSchema,
    operationId: PublicIdSchema,
    profile: PreflightProfileSchema,
    budget: RuntimePreflightBudgetV117Schema,
    accounting: RuntimePreflightRequestAccountingV117Schema,
    input: RuntimePreflightInputV117Schema,
    retry: RuntimePreflightRetryV117Schema,
    evidenceContext: RuntimePreflightEvidenceContextV117Schema,
    authentication: RuntimePreflightAuthenticationV117Schema,
  })
  .strict()

const CounterEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("measured"),
      delta: NonnegativeSafeIntegerSchema,
      cumulative: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  z.object({ status: z.enum(["unavailable", "ambiguous"]) }).strict(),
])
const MemoryEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("measured"),
      peakBytes: NonnegativeSafeIntegerSchema,
      cumulativePeakBytes: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  z.object({ status: z.enum(["unavailable", "ambiguous"]) }).strict(),
])
const ProcessEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      processes: NonnegativeSafeIntegerSchema,
      threads: NonnegativeSafeIntegerSchema,
      children: NonnegativeSafeIntegerSchema,
    })
    .strict(),
  z.object({ status: z.enum(["unavailable", "ambiguous"]) }).strict(),
])
const CapabilityEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      filesystem: PublicIdSchema,
      network: PublicIdSchema,
    })
    .strict(),
  z.object({ status: z.enum(["unavailable", "ambiguous"]) }).strict(),
])
const AccountingEvidenceSchema = z.union([
  z
    .object({
      status: z.literal("verified"),
      signatureVerified: z.boolean(),
      monotonic: z.boolean(),
    })
    .strict(),
  z.object({ status: z.enum(["unavailable", "ambiguous"]) }).strict(),
])
const CountersSchema = z
  .object({
    wallMilliseconds: CounterEvidenceSchema,
    computeFuel: CounterEvidenceSchema,
    inputBytes: CounterEvidenceSchema,
    outputBytes: CounterEvidenceSchema,
    stderrBytes: CounterEvidenceSchema,
  })
  .strict()

const RuntimePreflightAccountingReceiptV117Schema = z
  .object({
    domain: z.literal("preflight"),
    profile: PreflightProfileSchema,
    prestateRevision: NonnegativeSafeIntegerSchema,
    operationId: PublicIdSchema,
    requestIdentity: Sha256Schema,
    evidenceIdentity: Sha256Schema,
    attribution: z.enum(["proven_strategy", "host", "ambiguous"]),
    counters: CountersSchema,
    memory: MemoryEvidenceSchema,
    process: ProcessEvidenceSchema,
    capabilities: CapabilityEvidenceSchema,
    accountingEvidence: AccountingEvidenceSchema,
  })
  .strict()

export interface RuntimePreflightObservedEvidenceInputV117 {
  readonly attribution: RuntimeAbiV117LedgerAttribution
  readonly counters: Readonly<
    Record<RuntimeAbiV117PreflightCounterName, RuntimeAbiV117CounterEvidence>
  >
  readonly memory: RuntimeAbiV117MemoryEvidence
  readonly process: RuntimeAbiV117ProcessEvidence
  readonly capabilities: RuntimeAbiV117PreflightCapabilityEvidence
  readonly accountingEvidence: RuntimeAbiV117AccountingEvidence
}

export interface RuntimePreflightReceiptEvidenceV117 extends RuntimePreflightObservedEvidenceInputV117 {
  readonly profileSha256: `sha256:${string}`
  readonly inputSha256: `sha256:${string}`
  readonly inputIdentitySha256: `sha256:${string}`
  readonly producerIdentitySha256: `sha256:${string}`
  readonly toolchainIdentitySha256: `sha256:${string}`
  readonly containmentIdentitySha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface RuntimePreflightObservedEvidenceV117 extends RuntimePreflightReceiptEvidenceV117 {
  readonly accountingReceipt: RuntimeAbiV117PreflightLedgerReceipt
}

const RuntimePreflightReceiptEvidenceV117Schema = z
  .object({
    profileSha256: Sha256Schema,
    inputSha256: Sha256Schema,
    inputIdentitySha256: Sha256Schema,
    producerIdentitySha256: Sha256Schema,
    toolchainIdentitySha256: Sha256Schema,
    containmentIdentitySha256: Sha256Schema,
    attribution: z.enum(["proven_strategy", "host", "ambiguous"]),
    counters: CountersSchema,
    memory: MemoryEvidenceSchema,
    process: ProcessEvidenceSchema,
    capabilities: CapabilityEvidenceSchema,
    accountingEvidence: AccountingEvidenceSchema,
    identitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightObservedEvidenceV117Schema =
  RuntimePreflightReceiptEvidenceV117Schema.extend({
    accountingReceipt: RuntimePreflightAccountingReceiptV117Schema,
  }).strict()

export interface RuntimePreflightRequestBindingV117 {
  readonly requestId: string
  readonly operationId: string
  readonly requestSha256: `sha256:${string}`
  readonly profile: RuntimeAbiV117PreflightProfile
  readonly profileSha256: `sha256:${string}`
  readonly prestateRevision: number
  readonly prestateSha256: `sha256:${string}`
  readonly inputSha256: `sha256:${string}`
  readonly inputIdentitySha256: `sha256:${string}`
  readonly retryIdentitySha256: `sha256:${string}`
  readonly requestIdentity: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly producerIdentitySha256: `sha256:${string}`
  readonly toolchainIdentitySha256: `sha256:${string}`
  readonly containmentIdentitySha256: `sha256:${string}`
}

export type RuntimePreflightOutcomeV117 =
  | Readonly<{ kind: "success" }>
  | Readonly<{
      kind: "submission_violation"
      code: "PREFLIGHT_BUDGET_EXCEEDED"
      dimensions: readonly string[]
    }>
  | Readonly<{
      kind: "system_failure"
      code: Extract<
        RuntimeAbiV117LedgerDebitResult,
        { kind: "system_failure" }
      >["failure"]["code"]
    }>

export interface RuntimePreflightResponseAccountingV117 {
  readonly schemaVersion: "runtime-preflight-accounting-v1.17"
  readonly domain: "preflight"
  readonly prestateSha256: `sha256:${string}`
  readonly idempotencyKeySha256: `sha256:${string}`
  readonly disposition: "commit" | "no_commit"
  readonly receipt: RuntimeAbiV117PreflightLedgerReceipt
  readonly poststate: RuntimeAbiV117PreflightLedger
  readonly poststateSha256: `sha256:${string}`
  readonly identitySha256: `sha256:${string}`
}

export interface AuthenticatedRuntimePreflightReceiptV117 {
  readonly contractVersion: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion
  readonly runtimeAbiVersion: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion
  readonly candidateStatus: typeof RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle
  readonly current: false
  readonly envelopeKind: "runtime-preflight-receipt"
  readonly requestBinding: RuntimePreflightRequestBindingV117
  readonly evidence: RuntimePreflightReceiptEvidenceV117
  readonly outcome: RuntimePreflightOutcomeV117
  readonly accounting: RuntimePreflightResponseAccountingV117
  readonly authentication: RuntimePreflightAuthenticationV117
}

export type AuthenticatedRuntimePreflightResponseV117 =
  AuthenticatedRuntimePreflightReceiptV117

const RuntimePreflightRequestBindingV117Schema = z
  .object({
    requestId: PublicIdSchema,
    operationId: PublicIdSchema,
    requestSha256: Sha256Schema,
    profile: PreflightProfileSchema,
    profileSha256: Sha256Schema,
    prestateRevision: NonnegativeSafeIntegerSchema,
    prestateSha256: Sha256Schema,
    inputSha256: Sha256Schema,
    inputIdentitySha256: Sha256Schema,
    retryIdentitySha256: Sha256Schema,
    requestIdentity: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
    producerIdentitySha256: Sha256Schema,
    toolchainIdentitySha256: Sha256Schema,
    containmentIdentitySha256: Sha256Schema,
  })
  .strict()

const RuntimePreflightOutcomeV117Schema = z.union([
  z.object({ kind: z.literal("success") }).strict(),
  z
    .object({
      kind: z.literal("submission_violation"),
      code: z.literal("PREFLIGHT_BUDGET_EXCEEDED"),
      dimensions: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal("system_failure"),
      code: z.enum([
        "LEDGER_SCHEMA_INVALID",
        "RECEIPT_SCHEMA_INVALID",
        "LEDGER_CAPACITY_EXHAUSTED",
        "LEDGER_DOMAIN_MISMATCH",
        "LEDGER_PRESTATE_MISMATCH",
        "LEDGER_IDENTITY_CONFLICT",
        "METER_EVIDENCE_MISSING",
        "METER_EVIDENCE_UNAVAILABLE",
        "METER_EVIDENCE_AMBIGUOUS",
        "METER_ACCOUNTING_DECREASING",
        "METER_ACCOUNTING_INCONSISTENT",
        "HOST_RESOURCE_EXCESS",
        "HOST_RESOURCE_ACCOUNTING",
        "ENFORCEMENT_EVIDENCE_INVALID",
      ]),
    })
    .strict(),
])

const RuntimePreflightResponseAccountingV117Schema = z
  .object({
    schemaVersion: z.literal("runtime-preflight-accounting-v1.17"),
    domain: z.literal("preflight"),
    prestateSha256: Sha256Schema,
    idempotencyKeySha256: Sha256Schema,
    disposition: z.enum(["commit", "no_commit"]),
    receipt: RuntimePreflightAccountingReceiptV117Schema,
    poststate: RuntimeAbiV117PreflightLedgerSchema,
    poststateSha256: Sha256Schema,
    identitySha256: Sha256Schema,
  })
  .strict()

export const AuthenticatedRuntimePreflightReceiptV117Schema = z
  .object({
    contractVersion: z.literal(
      RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion,
    ),
    runtimeAbiVersion: z.literal(
      RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion,
    ),
    candidateStatus: z.literal(RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle),
    current: z.literal(false),
    envelopeKind: z.literal("runtime-preflight-receipt"),
    requestBinding: RuntimePreflightRequestBindingV117Schema,
    evidence: RuntimePreflightReceiptEvidenceV117Schema,
    outcome: RuntimePreflightOutcomeV117Schema,
    accounting: RuntimePreflightResponseAccountingV117Schema,
    authentication: RuntimePreflightAuthenticationV117Schema,
  })
  .strict()

export const AuthenticatedRuntimePreflightResponseV117Schema =
  AuthenticatedRuntimePreflightReceiptV117Schema

const withoutAuthentication = <T extends { authentication: unknown }>(
  envelope: T,
): Omit<T, "authentication"> => {
  const { authentication: _authentication, ...unsigned } = envelope
  return unsigned
}

const signatureInput = (
  label: "request" | "receipt",
  unsigned: JsonValue,
): Uint8Array =>
  frameCanonicalIdentity("evidenceBundle", [
    textEncoder.encode(`runtime-preflight-v1.17:${label}`),
    canonicalBytes(unsigned),
  ])

const authenticate = (
  label: "request" | "receipt",
  unsigned: JsonValue,
  identity: RuntimePreflightSigningIdentityV117,
): RuntimePreflightAuthenticationV117 => {
  if (
    !PublicIdSchema.safeParse(identity.keyId).success ||
    identity.secret.length === 0
  ) {
    throw new TypeError(
      "A non-empty managed preflight signing identity is required",
    )
  }
  const input = signatureInput(label, unsigned)
  return {
    algorithm: RUNTIME_PREFLIGHT_V1_17_AUTH_ALGORITHM,
    keyId: identity.keyId,
    signatureInputSha256: sha256Bytes(input),
    signature: `hmac-sha256:${createHmac("sha256", identity.secret)
      .update(input)
      .digest("hex")}`,
  }
}

const authenticationMatches = (
  label: "request" | "receipt",
  envelope: { authentication: RuntimePreflightAuthenticationV117 },
  identity: RuntimePreflightSigningIdentityV117,
): boolean => {
  if (
    envelope.authentication.keyId !== identity.keyId ||
    identity.secret.length === 0
  ) {
    return false
  }
  const expected = authenticate(
    label,
    withoutAuthentication(envelope) as unknown as JsonValue,
    identity,
  )
  if (
    expected.signatureInputSha256 !==
    envelope.authentication.signatureInputSha256
  ) {
    return false
  }
  const actualBytes = Buffer.from(
    envelope.authentication.signature.slice("hmac-sha256:".length),
    "hex",
  )
  const expectedBytes = Buffer.from(
    expected.signature.slice("hmac-sha256:".length),
    "hex",
  )
  return (
    actualBytes.byteLength === expectedBytes.byteLength &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

const preflightLedgerIsValid = (
  ledger: RuntimeAbiV117PreflightLedger,
  profile: RuntimeAbiV117PreflightProfile,
): boolean => {
  if (
    ledger.profile !== profile ||
    ledger.revision !== ledger.commitments.length ||
    ledger.cumulative.operationCount !== ledger.commitments.length
  ) {
    return false
  }
  const identities = new Set<string>()
  return ledger.commitments.every((commitment, index) => {
    if (identities.has(commitment.identity)) return false
    identities.add(commitment.identity)
    return (
      commitment.prestateRevision === index &&
      commitment.scope === profile &&
      ((commitment.outcome === "success" &&
        commitment.dimensions.length === 0) ||
        (commitment.outcome === "player_violation" &&
          commitment.dimensions.length > 0))
    )
  })
}

export const createRuntimePreflightBudgetV117 = (
  profile: RuntimeAbiV117PreflightProfile,
): RuntimePreflightBudgetV117 => {
  const parsedProfile = PreflightProfileSchema.parse(profile)
  const limits = RuntimePreflightLimitsV117Schema.parse(
    RUNTIME_ABI_V1_17.budgets.preflight.profiles[parsedProfile],
  ) as RuntimePreflightLimitsV117
  const profileSha256 = framedValueHash("runtime-preflight-v1.17:profile", {
    profile: parsedProfile,
    limits,
  } as unknown as JsonValue)
  return deepFreeze({ profile: parsedProfile, profileSha256, limits })
}

const evidenceContextFrom = (
  input: CreateRuntimePreflightRequestV117Input["evidenceContext"],
): RuntimePreflightEvidenceContextV117 => {
  const producerWithoutIdentity =
    RuntimePreflightProducerIdentityV117Schema.omit({
      identitySha256: true,
    }).parse(input.producer) as Omit<
      RuntimePreflightProducerIdentityV117,
      "identitySha256"
    >
  const producer = {
    ...producerWithoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:producer",
      producerWithoutIdentity as unknown as JsonValue,
    ),
  }
  const toolchainWithoutIdentity =
    RuntimePreflightToolchainIdentityV117Schema.omit({
      identitySha256: true,
    }).parse(input.toolchain) as Omit<
      RuntimePreflightToolchainIdentityV117,
      "identitySha256"
    >
  const toolchain = {
    ...toolchainWithoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:toolchain",
      toolchainWithoutIdentity as unknown as JsonValue,
    ),
  }
  const containmentWithoutIdentity =
    RuntimePreflightContainmentIdentityV117Schema.omit({
      identitySha256: true,
    }).parse(input.containment) as Omit<
      RuntimePreflightContainmentIdentityV117,
      "identitySha256"
    >
  const containment = {
    ...containmentWithoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:containment",
      containmentWithoutIdentity as unknown as JsonValue,
    ),
  }
  const withoutIdentity = { producer, toolchain, containment }
  return deepFreeze({
    ...withoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:evidence-context",
      withoutIdentity as unknown as JsonValue,
    ),
  })
}

const inputFrom = (
  input: CreateRuntimePreflightRequestV117Input["input"],
): RuntimePreflightInputV117 => {
  const inputId = PublicIdSchema.parse(input.inputId)
  const kind = PreflightInputKindSchema.parse(input.kind)
  if (!(input.bytes instanceof Uint8Array)) {
    throw new TypeError("Preflight input must be exact bytes")
  }
  const withoutIdentity = {
    inputId,
    kind,
    sha256: sha256Bytes(input.bytes),
    byteLength: input.bytes.byteLength,
  }
  return deepFreeze({
    ...withoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:input",
      withoutIdentity as unknown as JsonValue,
    ),
  })
}

const retryWithIdentity = (
  retry: Omit<RuntimePreflightRetryV117, "identitySha256">,
): RuntimePreflightRetryV117 =>
  deepFreeze({
    ...retry,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:retry",
      retry as unknown as JsonValue,
    ),
  })

const deriveRequestAccounting = (
  operationId: string,
  profile: RuntimeAbiV117PreflightProfile,
  budget: RuntimePreflightBudgetV117,
  prestate: RuntimeAbiV117PreflightLedger,
  input: RuntimePreflightInputV117,
  evidenceContext: RuntimePreflightEvidenceContextV117,
): RuntimePreflightRequestAccountingV117 => {
  const prestateBytes = canonicalBytes(prestate as unknown as JsonValue)
  const prestateSha256 = framedValueHash(
    "runtime-preflight-v1.17:ledger-prestate",
    prestate as unknown as JsonValue,
  )
  const requestIdentity = framedValueHash(
    "runtime-preflight-v1.17:request-identity",
    {
      operationId,
      profile,
      profileSha256: budget.profileSha256,
      prestateSha256,
      inputIdentitySha256: input.identitySha256,
      evidenceContextIdentitySha256: evidenceContext.identitySha256,
    } as unknown as JsonValue,
  )
  const idempotencyKeySha256 = framedValueHash(
    "runtime-preflight-v1.17:idempotency",
    {
      operationId,
      prestateRevision: prestate.revision,
      requestIdentity,
    } as JsonValue,
  )
  const withoutIdentity = {
    schemaVersion: "runtime-preflight-accounting-v1.17" as const,
    domain: "preflight" as const,
    prestate,
    prestateRevision: prestate.revision,
    prestateCanonicalByteLength: prestateBytes.byteLength,
    prestateSha256,
    requestIdentity,
    idempotencyKeySha256,
  }
  return deepFreeze({
    ...withoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:request-accounting",
      withoutIdentity as unknown as JsonValue,
    ),
  })
}

const createRequestEnvelope = (
  fields: Omit<AuthenticatedRuntimePreflightRequestV117, "authentication">,
  identity: RuntimePreflightSigningIdentityV117,
): AuthenticatedRuntimePreflightRequestV117 => {
  const request = {
    ...fields,
    authentication: authenticate(
      "request",
      fields as unknown as JsonValue,
      identity,
    ),
  }
  const parsed = AuthenticatedRuntimePreflightRequestV117Schema.parse(
    request,
  ) as AuthenticatedRuntimePreflightRequestV117
  return deepFreeze(parsed) as AuthenticatedRuntimePreflightRequestV117
}

export const createAuthenticatedRuntimePreflightRequestV117 = (
  input: CreateRuntimePreflightRequestV117Input,
  identity: RuntimePreflightSigningIdentityV117,
): AuthenticatedRuntimePreflightRequestV117 => {
  const requestId = PublicIdSchema.parse(input.requestId)
  const operationId = PublicIdSchema.parse(input.operationId)
  const profile = PreflightProfileSchema.parse(input.profile)
  const retryId = PublicIdSchema.parse(input.retryId)
  const prestate = RuntimeAbiV117PreflightLedgerSchema.parse(
    input.accounting.prestate,
  ) as RuntimeAbiV117PreflightLedger
  if (!preflightLedgerIsValid(prestate, profile)) {
    throw new TypeError("Candidate preflight ledger prestate is invalid")
  }
  const budget = createRuntimePreflightBudgetV117(profile)
  const requestInput = inputFrom(input.input)
  const evidenceContext = evidenceContextFrom(input.evidenceContext)
  const retry = retryWithIdentity({
    retryId,
    attempt: 0,
    previousRequestSha256: null,
    originalRequestSha256: null,
  })
  const accounting = deriveRequestAccounting(
    operationId,
    profile,
    budget,
    prestate,
    requestInput,
    evidenceContext,
  )
  return createRequestEnvelope(
    {
      contractVersion: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion,
      runtimeAbiVersion: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion,
      candidateStatus: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle,
      current: false,
      envelopeKind: "runtime-preflight-request",
      requestId,
      operationId,
      profile,
      budget,
      accounting,
      input: requestInput,
      retry,
      evidenceContext,
    },
    identity,
  )
}

export const serializeRuntimePreflightRequestV117 = (
  request: AuthenticatedRuntimePreflightRequestV117,
): Uint8Array =>
  canonicalBytes(
    AuthenticatedRuntimePreflightRequestV117Schema.parse(
      request,
    ) as unknown as JsonValue,
  )

export const createAuthenticatedRuntimePreflightRetryRequestV117 = (
  previousRequestInput: AuthenticatedRuntimePreflightRequestV117,
  input: Readonly<{ requestId: string }>,
  identity: RuntimePreflightSigningIdentityV117,
): AuthenticatedRuntimePreflightRequestV117 => {
  const previousRequest = AuthenticatedRuntimePreflightRequestV117Schema.parse(
    previousRequestInput,
  ) as AuthenticatedRuntimePreflightRequestV117
  if (
    !authenticationMatches("request", previousRequest, identity) ||
    !requestDerivedBindingsMatch(previousRequest)
  ) {
    throw new TypeError(
      "Cannot retry an invalid authenticated preflight request",
    )
  }
  const previousRequestSha256 = sha256Bytes(
    serializeRuntimePreflightRequestV117(previousRequest),
  )
  const originalRequestSha256 =
    previousRequest.retry.attempt === 0
      ? previousRequestSha256
      : previousRequest.retry.originalRequestSha256
  if (originalRequestSha256 === null) {
    throw new TypeError("Retry chain is missing its original request")
  }
  return createRequestEnvelope(
    {
      ...withoutAuthentication(previousRequest),
      requestId: PublicIdSchema.parse(input.requestId),
      retry: retryWithIdentity({
        retryId: previousRequest.retry.retryId,
        attempt: previousRequest.retry.attempt + 1,
        previousRequestSha256,
        originalRequestSha256,
      }),
    },
    identity,
  )
}

const requestDerivedBindingsMatch = (
  request: AuthenticatedRuntimePreflightRequestV117,
): boolean => {
  const expectedBudget = createRuntimePreflightBudgetV117(request.profile)
  const expectedContext = evidenceContextFrom({
    producer: {
      producerId: request.evidenceContext.producer.producerId,
      buildSha256: request.evidenceContext.producer.buildSha256,
    },
    toolchain: {
      toolchainId: request.evidenceContext.toolchain.toolchainId,
      runtimeExecutableSha256:
        request.evidenceContext.toolchain.runtimeExecutableSha256,
      compilerExecutableSha256:
        request.evidenceContext.toolchain.compilerExecutableSha256,
      sysrootStdlibSha256:
        request.evidenceContext.toolchain.sysrootStdlibSha256,
      adapterBuildSha256: request.evidenceContext.toolchain.adapterBuildSha256,
      reportedVersion: request.evidenceContext.toolchain.reportedVersion,
      targetAbi: request.evidenceContext.toolchain.targetAbi,
    },
    containment: {
      policyId: request.evidenceContext.containment.policyId,
      policySha256: request.evidenceContext.containment.policySha256,
      evidenceBundleSha256:
        request.evidenceContext.containment.evidenceBundleSha256,
    },
  })
  const expectedInputIdentity = framedValueHash(
    "runtime-preflight-v1.17:input",
    {
      inputId: request.input.inputId,
      kind: request.input.kind,
      sha256: request.input.sha256,
      byteLength: request.input.byteLength,
    } as JsonValue,
  )
  const expectedRetry = retryWithIdentity({
    retryId: request.retry.retryId,
    attempt: request.retry.attempt,
    previousRequestSha256: request.retry.previousRequestSha256,
    originalRequestSha256: request.retry.originalRequestSha256,
  })
  const expectedAccounting = deriveRequestAccounting(
    request.operationId,
    request.profile,
    request.budget,
    request.accounting.prestate,
    request.input,
    request.evidenceContext,
  )
  const retryShapeValid =
    request.retry.attempt === 0
      ? request.retry.previousRequestSha256 === null &&
        request.retry.originalRequestSha256 === null
      : request.retry.previousRequestSha256 !== null &&
        request.retry.originalRequestSha256 !== null
  return (
    request.runtimeAbiVersion ===
      RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion &&
    request.profile === request.budget.profile &&
    preflightLedgerIsValid(request.accounting.prestate, request.profile) &&
    sameCanonicalValue(
      request.budget as unknown as JsonValue,
      expectedBudget as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      request.evidenceContext as unknown as JsonValue,
      expectedContext as unknown as JsonValue,
    ) &&
    request.input.identitySha256 === expectedInputIdentity &&
    sameCanonicalValue(
      request.retry as unknown as JsonValue,
      expectedRetry as unknown as JsonValue,
    ) &&
    retryShapeValid &&
    sameCanonicalValue(
      request.accounting as unknown as JsonValue,
      expectedAccounting as unknown as JsonValue,
    )
  )
}

const retryMatchesPrevious = (
  request: AuthenticatedRuntimePreflightRequestV117,
  previous: AuthenticatedRuntimePreflightRequestV117 | undefined,
  identity: RuntimePreflightSigningIdentityV117,
): boolean => {
  if (request.retry.attempt === 0) return previous === undefined
  if (previous === undefined) return false
  const parsed =
    AuthenticatedRuntimePreflightRequestV117Schema.safeParse(previous)
  if (!parsed.success) return false
  const strictPrevious = parsed.data as AuthenticatedRuntimePreflightRequestV117
  if (
    !authenticationMatches("request", strictPrevious, identity) ||
    !requestDerivedBindingsMatch(strictPrevious)
  ) {
    return false
  }
  const previousSha256 = sha256Bytes(
    serializeRuntimePreflightRequestV117(strictPrevious),
  )
  const originalSha256 =
    strictPrevious.retry.attempt === 0
      ? previousSha256
      : strictPrevious.retry.originalRequestSha256
  return (
    request.retry.attempt === strictPrevious.retry.attempt + 1 &&
    request.retry.retryId === strictPrevious.retry.retryId &&
    request.retry.previousRequestSha256 === previousSha256 &&
    request.retry.originalRequestSha256 === originalSha256 &&
    request.operationId === strictPrevious.operationId &&
    request.profile === strictPrevious.profile &&
    request.accounting.requestIdentity ===
      strictPrevious.accounting.requestIdentity &&
    request.accounting.idempotencyKeySha256 ===
      strictPrevious.accounting.idempotencyKeySha256 &&
    sameCanonicalValue(
      request.budget as unknown as JsonValue,
      strictPrevious.budget as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      request.accounting.prestate as unknown as JsonValue,
      strictPrevious.accounting.prestate as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      request.input as unknown as JsonValue,
      strictPrevious.input as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      request.evidenceContext as unknown as JsonValue,
      strictPrevious.evidenceContext as unknown as JsonValue,
    )
  )
}

export type RuntimePreflightVerificationFailureCodeV117 =
  | "NON_CANONICAL"
  | "SCHEMA_INVALID"
  | "AUTHENTICATION_FAILED"
  | "BINDING_MISMATCH"
  | "RETRY_BINDING_MISMATCH"

export type RuntimePreflightVerificationResultV117<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{
      ok: false
      disposition: "no_commit"
      failure: Readonly<{ code: RuntimePreflightVerificationFailureCodeV117 }>
    }>

const verificationFailure = (
  code: RuntimePreflightVerificationFailureCodeV117,
): RuntimePreflightVerificationResultV117<never> =>
  deepFreeze({ ok: false, disposition: "no_commit", failure: { code } })

const parseCanonicalEnvelope = <T>(
  bytes: Uint8Array,
  schema: z.ZodType<T>,
): RuntimePreflightVerificationResultV117<T> => {
  const admitted = admitCanonicalJsonBytes(bytes, {
    profile: "authenticated-envelope",
    operation: "require-canonical",
  })
  if (!admitted.ok) return verificationFailure("NON_CANONICAL")
  const parsed = schema.safeParse(admitted.value)
  return parsed.success
    ? deepFreeze({ ok: true as const, value: parsed.data })
    : verificationFailure("SCHEMA_INVALID")
}

export const verifyRuntimePreflightRequestV117 = (
  bytes: Uint8Array,
  identity: RuntimePreflightSigningIdentityV117,
  previousRequest?: AuthenticatedRuntimePreflightRequestV117,
): RuntimePreflightVerificationResultV117<AuthenticatedRuntimePreflightRequestV117> => {
  const parsed = parseCanonicalEnvelope(
    bytes,
    AuthenticatedRuntimePreflightRequestV117Schema,
  )
  if (!parsed.ok) return parsed
  const request = parsed.value as AuthenticatedRuntimePreflightRequestV117
  if (!authenticationMatches("request", request, identity)) {
    return verificationFailure("AUTHENTICATION_FAILED")
  }
  if (!requestDerivedBindingsMatch(request)) {
    return verificationFailure("BINDING_MISMATCH")
  }
  if (!retryMatchesPrevious(request, previousRequest, identity)) {
    return verificationFailure("RETRY_BINDING_MISMATCH")
  }
  return deepFreeze({ ok: true, value: request })
}

export const createRuntimePreflightObservedEvidenceV117 = (
  requestInput: AuthenticatedRuntimePreflightRequestV117,
  input: RuntimePreflightObservedEvidenceInputV117,
): RuntimePreflightObservedEvidenceV117 => {
  const request = AuthenticatedRuntimePreflightRequestV117Schema.parse(
    requestInput,
  ) as AuthenticatedRuntimePreflightRequestV117
  if (!requestDerivedBindingsMatch(request)) {
    throw new TypeError("Cannot bind evidence to an invalid preflight request")
  }
  const parsedInput = z
    .object({
      attribution: z.enum(["proven_strategy", "host", "ambiguous"]),
      counters: CountersSchema,
      memory: MemoryEvidenceSchema,
      process: ProcessEvidenceSchema,
      capabilities: CapabilityEvidenceSchema,
      accountingEvidence: AccountingEvidenceSchema,
    })
    .strict()
    .parse(input) as RuntimePreflightObservedEvidenceInputV117
  const withoutIdentity = {
    profileSha256: request.budget.profileSha256,
    inputSha256: request.input.sha256,
    inputIdentitySha256: request.input.identitySha256,
    producerIdentitySha256: request.evidenceContext.producer.identitySha256,
    toolchainIdentitySha256: request.evidenceContext.toolchain.identitySha256,
    containmentIdentitySha256:
      request.evidenceContext.containment.identitySha256,
    ...parsedInput,
  }
  const evidence = {
    ...withoutIdentity,
    identitySha256: framedValueHash(
      "runtime-preflight-v1.17:observed-evidence",
      withoutIdentity as unknown as JsonValue,
    ),
  }
  const accountingReceipt: RuntimeAbiV117PreflightLedgerReceipt = {
    domain: "preflight",
    profile: request.profile,
    prestateRevision: request.accounting.prestateRevision,
    operationId: request.operationId,
    requestIdentity: request.accounting.requestIdentity,
    evidenceIdentity: evidence.identitySha256,
    attribution: evidence.attribution,
    counters: evidence.counters,
    memory: evidence.memory,
    process: evidence.process,
    capabilities: evidence.capabilities,
    accountingEvidence: evidence.accountingEvidence,
  }
  const observed = RuntimePreflightObservedEvidenceV117Schema.parse({
    ...evidence,
    accountingReceipt,
  }) as RuntimePreflightObservedEvidenceV117
  return deepFreeze(observed) as RuntimePreflightObservedEvidenceV117
}

const requestBinding = (
  request: AuthenticatedRuntimePreflightRequestV117,
): RuntimePreflightRequestBindingV117 => ({
  requestId: request.requestId,
  operationId: request.operationId,
  requestSha256: sha256Bytes(serializeRuntimePreflightRequestV117(request)),
  profile: request.profile,
  profileSha256: request.budget.profileSha256,
  prestateRevision: request.accounting.prestateRevision,
  prestateSha256: request.accounting.prestateSha256,
  inputSha256: request.input.sha256,
  inputIdentitySha256: request.input.identitySha256,
  retryIdentitySha256: request.retry.identitySha256,
  requestIdentity: request.accounting.requestIdentity,
  idempotencyKeySha256: request.accounting.idempotencyKeySha256,
  producerIdentitySha256: request.evidenceContext.producer.identitySha256,
  toolchainIdentitySha256: request.evidenceContext.toolchain.identitySha256,
  containmentIdentitySha256: request.evidenceContext.containment.identitySha256,
})

const receiptEvidenceWithoutAccounting = (
  evidence: RuntimePreflightObservedEvidenceV117,
): RuntimePreflightReceiptEvidenceV117 => {
  const { accountingReceipt: _accountingReceipt, ...receiptEvidence } = evidence
  return receiptEvidence
}

const evidenceDerivedBindingsMatch = (
  request: AuthenticatedRuntimePreflightRequestV117,
  evidence: RuntimePreflightObservedEvidenceV117,
): boolean => {
  const receiptEvidence = receiptEvidenceWithoutAccounting(evidence)
  const { identitySha256: _identitySha256, ...withoutIdentity } =
    receiptEvidence
  const expectedIdentity = framedValueHash(
    "runtime-preflight-v1.17:observed-evidence",
    withoutIdentity as unknown as JsonValue,
  )
  const expectedReceipt: RuntimeAbiV117PreflightLedgerReceipt = {
    domain: "preflight",
    profile: request.profile,
    prestateRevision: request.accounting.prestateRevision,
    operationId: request.operationId,
    requestIdentity: request.accounting.requestIdentity,
    evidenceIdentity: expectedIdentity,
    attribution: evidence.attribution,
    counters: evidence.counters,
    memory: evidence.memory,
    process: evidence.process,
    capabilities: evidence.capabilities,
    accountingEvidence: evidence.accountingEvidence,
  }
  return (
    evidence.profileSha256 === request.budget.profileSha256 &&
    evidence.inputSha256 === request.input.sha256 &&
    evidence.inputIdentitySha256 === request.input.identitySha256 &&
    evidence.producerIdentitySha256 ===
      request.evidenceContext.producer.identitySha256 &&
    evidence.toolchainIdentitySha256 ===
      request.evidenceContext.toolchain.identitySha256 &&
    evidence.containmentIdentitySha256 ===
      request.evidenceContext.containment.identitySha256 &&
    evidence.identitySha256 === expectedIdentity &&
    sameCanonicalValue(
      evidence.accountingReceipt as unknown as JsonValue,
      expectedReceipt as unknown as JsonValue,
    )
  )
}

const outcomeForDebit = (
  debit: RuntimeAbiV117LedgerDebitResult<RuntimeAbiV117PreflightLedger>,
): RuntimePreflightOutcomeV117 =>
  debit.kind === "success"
    ? { kind: "success" }
    : debit.kind === "player_violation"
      ? {
          kind: "submission_violation",
          code: "PREFLIGHT_BUDGET_EXCEEDED",
          dimensions: debit.violation.dimensions,
        }
      : { kind: "system_failure", code: debit.failure.code }

const deriveResponseAccounting = (
  request: AuthenticatedRuntimePreflightRequestV117,
  receipt: RuntimeAbiV117PreflightLedgerReceipt,
): Readonly<{
  outcome: RuntimePreflightOutcomeV117
  accounting: RuntimePreflightResponseAccountingV117
}> => {
  const debit = debitRuntimeAbiV117Ledger(request.accounting.prestate, receipt)
  const outcome = outcomeForDebit(debit)
  const disposition =
    debit.kind === "system_failure"
      ? ("no_commit" as const)
      : ("commit" as const)
  const poststate = debit.ledger
  const withoutIdentity = {
    schemaVersion: "runtime-preflight-accounting-v1.17" as const,
    domain: "preflight" as const,
    prestateSha256: request.accounting.prestateSha256,
    idempotencyKeySha256: request.accounting.idempotencyKeySha256,
    disposition,
    receipt,
    poststate,
    poststateSha256: framedValueHash(
      "runtime-preflight-v1.17:ledger-poststate",
      poststate as unknown as JsonValue,
    ),
  }
  return deepFreeze({
    outcome,
    accounting: {
      ...withoutIdentity,
      identitySha256: framedValueHash(
        "runtime-preflight-v1.17:response-accounting",
        withoutIdentity as unknown as JsonValue,
      ),
    },
  })
}

export const createAuthenticatedRuntimePreflightReceiptV117 = (
  requestInput: AuthenticatedRuntimePreflightRequestV117,
  evidenceInput: RuntimePreflightObservedEvidenceV117,
  identity: RuntimePreflightSigningIdentityV117,
): AuthenticatedRuntimePreflightReceiptV117 => {
  const request = AuthenticatedRuntimePreflightRequestV117Schema.parse(
    requestInput,
  ) as AuthenticatedRuntimePreflightRequestV117
  if (
    !authenticationMatches("request", request, identity) ||
    !requestDerivedBindingsMatch(request)
  ) {
    throw new TypeError(
      "Cannot issue a receipt for an invalid preflight request",
    )
  }
  const evidence = RuntimePreflightObservedEvidenceV117Schema.parse(
    evidenceInput,
  ) as RuntimePreflightObservedEvidenceV117
  if (!evidenceDerivedBindingsMatch(request, evidence)) {
    throw new TypeError(
      "Cannot issue a receipt with unbound preflight evidence",
    )
  }
  const derived = deriveResponseAccounting(request, evidence.accountingReceipt)
  const unsigned = {
    contractVersion: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.contractVersion,
    runtimeAbiVersion: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.runtimeAbiVersion,
    candidateStatus: RUNTIME_PREFLIGHT_V1_17_CANDIDATE.lifecycle,
    current: false as const,
    envelopeKind: "runtime-preflight-receipt" as const,
    requestBinding: requestBinding(request),
    evidence: receiptEvidenceWithoutAccounting(evidence),
    outcome: derived.outcome,
    accounting: derived.accounting,
  }
  const receipt = AuthenticatedRuntimePreflightReceiptV117Schema.parse({
    ...unsigned,
    authentication: authenticate(
      "receipt",
      unsigned as unknown as JsonValue,
      identity,
    ),
  }) as AuthenticatedRuntimePreflightReceiptV117
  return deepFreeze(receipt) as AuthenticatedRuntimePreflightReceiptV117
}

export const createAuthenticatedRuntimePreflightResponseV117 =
  createAuthenticatedRuntimePreflightReceiptV117

export const serializeRuntimePreflightReceiptV117 = (
  receipt: AuthenticatedRuntimePreflightReceiptV117,
): Uint8Array =>
  canonicalBytes(
    AuthenticatedRuntimePreflightReceiptV117Schema.parse(
      receipt,
    ) as unknown as JsonValue,
  )

export const serializeRuntimePreflightResponseV117 =
  serializeRuntimePreflightReceiptV117

const responseDerivedBindingsMatch = (
  response: AuthenticatedRuntimePreflightReceiptV117,
  request: AuthenticatedRuntimePreflightRequestV117,
): boolean => {
  const evidence = {
    ...response.evidence,
    accountingReceipt: response.accounting.receipt,
  } as RuntimePreflightObservedEvidenceV117
  if (!evidenceDerivedBindingsMatch(request, evidence)) return false
  const derived = deriveResponseAccounting(request, response.accounting.receipt)
  return (
    sameCanonicalValue(
      response.requestBinding as unknown as JsonValue,
      requestBinding(request) as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      response.outcome as unknown as JsonValue,
      derived.outcome as unknown as JsonValue,
    ) &&
    sameCanonicalValue(
      response.accounting as unknown as JsonValue,
      derived.accounting as unknown as JsonValue,
    )
  )
}

export const verifyRuntimePreflightReceiptV117 = (
  bytes: Uint8Array,
  expectedRequestInput: AuthenticatedRuntimePreflightRequestV117,
  identity: RuntimePreflightSigningIdentityV117,
): RuntimePreflightVerificationResultV117<AuthenticatedRuntimePreflightReceiptV117> => {
  const expectedRequest =
    AuthenticatedRuntimePreflightRequestV117Schema.safeParse(
      expectedRequestInput,
    )
  if (!expectedRequest.success) {
    return verificationFailure("BINDING_MISMATCH")
  }
  const strictExpectedRequest =
    expectedRequest.data as AuthenticatedRuntimePreflightRequestV117
  if (!authenticationMatches("request", strictExpectedRequest, identity)) {
    return verificationFailure("AUTHENTICATION_FAILED")
  }
  if (!requestDerivedBindingsMatch(strictExpectedRequest)) {
    return verificationFailure("BINDING_MISMATCH")
  }
  const parsed = parseCanonicalEnvelope(
    bytes,
    AuthenticatedRuntimePreflightReceiptV117Schema,
  )
  if (!parsed.ok) return parsed
  const response = parsed.value as AuthenticatedRuntimePreflightReceiptV117
  if (!authenticationMatches("receipt", response, identity)) {
    return verificationFailure("AUTHENTICATION_FAILED")
  }
  if (!responseDerivedBindingsMatch(response, strictExpectedRequest)) {
    return verificationFailure("BINDING_MISMATCH")
  }
  return deepFreeze({ ok: true, value: response })
}

export const verifyRuntimePreflightResponseV117 =
  verifyRuntimePreflightReceiptV117
