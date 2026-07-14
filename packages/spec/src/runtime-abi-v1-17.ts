import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"

const KiB = 1024
const MiB = 1024 * KiB

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const invocationVector = deepFreeze({
  wall: {
    value: 50,
    unit: "milliseconds",
    boundary: "guest-method-entry-to-adapter-observed-return-excludes-startup",
    overflow: "terminate-and-classify-by-proven-cause",
  },
  compute: {
    value: 10_000_000,
    unit: "instruction-fuel",
    boundary: "guest-instructions-only",
    granularity: "runtime-reported-monotonic-counter",
    overflow: "terminate-before-next-guest-instruction",
  },
  memory: {
    value: 64 * MiB,
    unit: "bytes",
    boundary: "maximum-guest-plus-containing-process-working-set",
    overflow: "terminate-and-require-attribution-evidence",
  },
  payload: {
    value: 256 * KiB,
    unit: "canonical-payload-bytes",
    boundary: "decoded-strategy-payload-before-schema-materialization",
  },
  stdout: {
    value: 256 * KiB,
    unit: "transport-frame-bytes",
    boundary: "adapter-captured-stdout-including-payload-framing",
  },
  stderr: {
    value: 64 * KiB,
    unit: "raw-utf8-bytes",
    boundary: "adapter-captured-private-stderr-never-public",
  },
  process: {
    processes: 1,
    threads: 1,
    children: 0,
    boundary: "guest-containing-process-tree",
  },
  capabilities: {
    filesystem: "none",
    network: "disabled",
    environment: "empty",
    shell: "disabled",
  },
  cancellation: {
    terminationGraceMilliseconds: 100,
    evidence: "adapter-termination-receipt-required",
  },
  accounting: {
    report: "signed-monotonic-delta",
    missingOrDecreasing: "system_failure",
    overLimit: "player_violation-only-with-proven-strategy-cause",
  },
} as const)

const preflightProfiles = deepFreeze({
  sourceValidation: {
    wallMilliseconds: 500,
    computeFuel: 100_000_000,
    memoryBytes: 64 * MiB,
    inputBytes: 64 * KiB,
    outputBytes: 32 * KiB,
    stderrBytes: 0,
    processes: 1,
    threads: 1,
    children: 0,
    network: "disabled",
    filesystem: "none",
    failureOwnership: {
      invalidInput: "submission_violation",
      unavailableInfrastructure: "system_failure",
    },
  },
  compilation: {
    wallMilliseconds: 90_000,
    computeFuel: 2_000_000_000,
    memoryBytes: 512 * MiB,
    inputBytes: 256 * KiB,
    outputBytes: 4 * MiB,
    stderrBytes: 64 * KiB,
    processes: 1,
    threads: 8,
    children: 0,
    network: "disabled",
    filesystem: "isolated-read-write-build-root-only",
    failureOwnership: {
      invalidInput: "submission_violation",
      unavailableInfrastructure: "system_failure",
    },
  },
  artifactValidation: {
    wallMilliseconds: 5_000,
    computeFuel: 100_000_000,
    memoryBytes: 128 * MiB,
    inputBytes: 4 * MiB,
    outputBytes: 256 * KiB,
    stderrBytes: 0,
    processes: 1,
    threads: 1,
    children: 0,
    network: "disabled",
    filesystem: "artifact-read-only",
    failureOwnership: {
      invalidInput: "submission_violation",
      unavailableInfrastructure: "system_failure",
    },
  },
  conformance: {
    wallMilliseconds: 120_000,
    computeFuel: 5_000_000_000,
    memoryBytes: 512 * MiB,
    inputBytes: 8 * MiB,
    outputBytes: 8 * MiB,
    stderrBytes: 0,
    processes: 1,
    threads: 1,
    children: 0,
    network: "disabled",
    filesystem: "closed-corpus-read-only",
    failureOwnership: {
      invalidInput: "submission_violation",
      unavailableInfrastructure: "system_failure",
    },
  },
} as const)

const identityDomains = deepFreeze({
  originalSource: "cowards-game:runtime-identity:v1:original-source",
  normalizedSource: "cowards-game:runtime-identity:v1:normalized-source",
  normalizationPolicy: "cowards-game:runtime-identity:v1:normalization-policy",
  artifact: "cowards-game:runtime-identity:v1:artifact",
  artifactManifest: "cowards-game:runtime-identity:v1:artifact-manifest",
  runtimeExecutable: "cowards-game:runtime-identity:v1:runtime-executable",
  compilerExecutable: "cowards-game:runtime-identity:v1:compiler-executable",
  sysrootStdlib: "cowards-game:runtime-identity:v1:sysroot-stdlib",
  adapterBuild: "cowards-game:runtime-identity:v1:adapter-build",
  semanticTuple: "cowards-game:runtime-identity:v1:semantic-tuple",
  containmentPolicy: "cowards-game:runtime-identity:v1:containment-policy",
  conformanceCorpus: "cowards-game:runtime-identity:v1:conformance-corpus",
  budgetProfile: "cowards-game:runtime-identity:v1:budget-profile",
  canonicalJsonProfile:
    "cowards-game:runtime-identity:v1:canonical-json-profile",
  evidenceBundle: "cowards-game:runtime-identity:v1:evidence-bundle",
} as const)

const requiredEquivalentMeters = [
  "wall",
  "compute",
  "memory",
  "payload",
  "stdout",
  "stderr",
  "process",
  "capabilities",
  "cancellation",
  "accountingEvidence",
] as const

const requiredExecutablePins = [
  "runtimeExecutableDigest",
  "reportedVersion",
  "targetAbi",
  "compilerFlags",
  "adapterBuildDigest",
  "standardLibraryOrSysrootDigest",
  "containmentPolicyId",
  "budgetProfileSha256",
  "canonicalJsonProfileId",
  "behaviorSettingsHash",
] as const

const decisionMap = deepFreeze([
  {
    id: "D-01",
    owner: "canonical-json-raw-admission",
    rule: "Reject duplicate object keys, including escaped-equivalent keys, before host object conversion.",
  },
  {
    id: "D-02",
    owner: "canonical-json-number-codec",
    rule: "Accept finite binary64, bound integers to the safe range, normalize negative zero, and emit shortest round-trip decimal.",
  },
  {
    id: "D-03",
    owner: "canonical-json-unicode-codec",
    rule: "Require UTF-8 scalar values, preserve normalization form, and order keys by unsigned UTF-8 bytes.",
  },
  {
    id: "D-04",
    owner: "canonical-json-limit-profile",
    rule: "Apply exact global parser ceilings and explicit lower field caps with named byte units.",
  },
  {
    id: "D-05",
    owner: "runtime-budget-profile",
    rule: "Counted lanes require equivalent wall, compute, memory, output, process, capability, cancellation, and accounting meters.",
  },
  {
    id: "D-06",
    owner: "signed-runtime-request-and-match-ledger",
    rule: "Bind per-method and cumulative Match budgets into the signed request and monotonic usage ledger.",
  },
  {
    id: "D-07",
    owner: "runtime-attribution-boundary",
    rule: "Only proven Strategy exhaustion is a player violation; ambiguous or host accounting failure is a no-mutation system failure.",
  },
  {
    id: "D-08",
    owner: "preflight-service",
    rule: "Use separate source, compilation, artifact, and conformance budgets that never consume Match budget.",
  },
  {
    id: "D-09",
    owner: "adapter-exception-boundary",
    rule: "A proven Strategy exception is a player violation; adapter, runtime, transport, or host crashes are system failures.",
  },
  {
    id: "D-10",
    owner: "adapter-outer-envelope-and-strategy-payload",
    rule: "The adapter authenticates the outer envelope; the Strategy owns only the decoded canonical payload.",
  },
  {
    id: "D-11",
    owner: "match-kernel",
    rule: "A player violation discards all proposed values, preserves prior memory, and applies only the canonical gameplay consequence.",
  },
  {
    id: "D-12",
    owner: "go-retry-policy",
    rule: "Retry only system failures from identical prestate, request identity, and budgets; never retry player violations.",
  },
  {
    id: "D-13",
    owner: "source-and-artifact-identity",
    rule: "Hash immutable original source separately from policy-versioned normalized source and bind both into the artifact manifest.",
  },
  {
    id: "D-14",
    owner: "identity-domain-registry",
    rule: "Use fixed domain tags, unsigned 64-bit big-endian length frames, and SHA-256 for every identity domain.",
  },
  {
    id: "D-15",
    owner: "executable-lane-identity",
    rule: "Bind exact executable, target, flags, adapter, stdlib/sysroot, policy, budget, and behavior settings while exposing safe IDs only.",
  },
  {
    id: "D-16",
    owner: "managed-evidence-pipeline",
    rule: "Require a closed acyclic validated hash graph with exact links, cardinality, and managed pipeline attestation.",
  },
] as const)

export const RUNTIME_ABI_V1_17 = deepFreeze({
  schemaVersion: "runtime-abi-v1.17-contract-v1",
  versions: {
    runtimeAbi: "strategy-runtime-abi-v1.17",
    runtimeService: "runtime-execution-service-v1.17",
    semanticReceipt: "runtime-semantic-receipt-v1.17",
    canonicalJson: "canonical-json-v1",
    budget: "runtime-budget-v1",
    identity: "runtime-identity-v1",
  },
  lifecycle: {
    status: "candidate-only",
    active: false,
    currentRuntimeAbi: "strategy-runtime-abi-v1.14",
    currentRuntimeService: "runtime-execution-service-v1.16",
    currentSemanticReceipt: "runtime-semantic-receipt-v1",
    activationOwner: "Phase-258-Plan-14",
  },
  calibration: {
    receipt: ".planning/artifacts/v1.37-runtime-abi-calibration.json",
    inputManifest:
      "packages/spec/artifacts/runtime-abi-v1.17-calibration-inputs.json",
    inputManifestSha256:
      "d2219b06b215b1cfd9dc01d7710a54fb0af68e3d25bbcd2cb22c4bc73c02c13c",
    onlyCurrentValidClassesEstablishMaxima: true,
    localToolVersionsAreCountedPins: false,
  },
  canonicalJson: {
    admission: "raw-bytes-before-host-conversion",
    duplicateKeys: "reject-escaped-equivalent-before-object-conversion",
    grammar: "rfc8259-subset-with-finite-binary64-and-no-extensions",
    whitespace: "none-in-canonical-encoding",
    literals: ["null", "true", "false"],
    numbers: {
      model: "finite-ieee-754-binary64",
      nonFinite: "reject",
      safeIntegerMinimum: -9_007_199_254_740_991,
      safeIntegerMaximum: 9_007_199_254_740_991,
      unsafeIntegers: "reject",
      negativeZero: "encode-as-0",
      encoding: "shortest-round-trip-decimal",
      exponent: "lowercase-e-no-plus-no-leading-zero",
    },
    unicode: {
      input: "valid-utf8-and-unicode-scalars",
      loneSurrogates: "reject",
      normalization: "preserve-no-nfc-or-nfd",
      objectKeyOrder: "lexicographic-unsigned-utf8-bytes",
    },
    ceilings: {
      rawUtf8Bytes: 8 * MiB,
      depth: 64,
      nodes: 262_144,
      decodedStringUtf8Bytes: 6 * MiB,
      arrayEntries: 65_536,
      objectEntries: 65_536,
    },
    errorCodes: [
      "INVALID_UTF8",
      "INVALID_UNICODE_SCALAR",
      "INVALID_GRAMMAR",
      "DUPLICATE_KEY",
      "NON_CANONICAL_KEY_ORDER",
      "NON_CANONICAL_ENCODING",
      "NON_CANONICAL_NUMBER",
      "NUMBER_OUT_OF_RANGE",
      "MAX_RAW_UTF8_BYTES_EXCEEDED",
      "MAX_DEPTH_EXCEEDED",
      "MAX_NODES_EXCEEDED",
      "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED",
      "MAX_ARRAY_ENTRIES_EXCEEDED",
      "MAX_OBJECT_ENTRIES_EXCEEDED",
      "FIELD_CAP_EXCEEDED",
    ],
  },
  fieldCaps: {
    strategySource: { value: 64 * KiB, unit: "raw-utf8-bytes" },
    sourceArtifact: { value: 256 * KiB, unit: "raw-utf8-bytes" },
    wasmArtifact: { value: 4 * MiB, unit: "raw-utf8-bytes" },
    strategyMemory: { value: 32 * KiB, unit: "canonical-payload-bytes" },
    soldierMemory: { value: 2 * KiB, unit: "canonical-payload-bytes" },
    objectivePayload: { value: KiB, unit: "canonical-payload-bytes" },
    invocationOutput: { value: 256 * KiB, unit: "canonical-payload-bytes" },
    stdout: { value: 256 * KiB, unit: "transport-frame-bytes" },
    stderr: { value: 64 * KiB, unit: "raw-utf8-bytes" },
    httpRequest: { value: 8 * MiB, unit: "transport-frame-bytes" },
    goResponse: { value: 8 * MiB, unit: "transport-frame-bytes" },
  },
  outcomes: {
    discriminant: "kind",
    variants: {
      success: {
        required: ["kind", "value", "trace"],
        forbidden: ["violation", "failure"],
      },
      player_violation: {
        required: ["kind", "violation", "trace"],
        forbidden: ["value", "failure"],
      },
      system_failure: {
        required: ["kind", "failure", "trace"],
        forbidden: ["value", "violation"],
      },
    },
    outerEnvelopeOwner: "adapter",
    decodedPayloadOwner: "strategy",
    playerViolationCommitPolicy:
      "discard-all-proposed-values-and-preserve-prior-memory",
    systemFailureMutationPolicy: "no-gameplay-mutation",
    retryOwner: "go",
  },
  budgets: {
    requiredEquivalentMeters,
    signedRequestBindings: [
      "selectActivations",
      "soldierBrain",
      "matchCumulative",
      "preflightProfile",
      "budgetProfileSha256",
    ],
    selectActivations: {
      invocationCountMaximum: 20,
      vector: invocationVector,
    },
    soldierBrain: {
      invocationCountMaximum: 240,
      vector: invocationVector,
    },
    matchCumulative: {
      invocationCountMaximum: 260,
      wallMilliseconds: 13_000,
      computeFuel: 2_600_000_000,
      payloadBytes: 68_157_440,
      stdoutBytes: 68_157_440,
      stderrBytes: 17_039_360,
      memoryBytes: 64 * MiB,
      accounting:
        "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
      overflow: "stop-before-next-invocation-and-classify-by-proven-cause",
    },
    preflight: {
      consumesMatchBudget: false,
      profiles: preflightProfiles,
    },
  },
  identity: {
    domains: identityDomains,
    framing: {
      algorithm: "sha256",
      prefix: "cowards-game:runtime-identity:v1",
      segmentLength: "unsigned-64-bit-big-endian",
      order: "domain-tag-then-ordered-segments",
    },
    source: {
      original: "immutable-exact-utf8-bytes",
      normalized: "separate-policy-versioned-derivative",
      lineEndings: ["none", "lf", "crlf", "cr", "mixed"],
      artifactBindsBoth: true,
    },
    requiredExecutablePins,
    publicSafeFields: [
      "sourceRevisionId",
      "normalizedSourceId",
      "artifactId",
      "manifestId",
      "runtimeLaneId",
      "semanticTupleId",
      "policyId",
      "corpusId",
      "evidenceBundleId",
    ],
    privateFields: [
      "originalSourceBytes",
      "normalizedSourceBytes",
      "artifactBytes",
      "compilerFlags",
      "toolchainPaths",
      "hostPaths",
      "environment",
      "stderr",
      "memory",
      "objectivePayload",
      "privateRuntimeDiagnostics",
      "signingMaterial",
    ],
    evidenceGraph: {
      closed: true,
      acyclic: true,
      deterministicNodeAndEdgeOrder: true,
      rejectMissingOrOrphanedNodes: true,
      exactRequiredCardinalities: true,
      managedPipelineAttestationRequired: true,
      productionTrustedProducers: [],
    },
  },
  lanePosture: {
    javascript: {
      countedCertification: "uncertified",
      reason:
        "equivalent compute, containing-memory, process, and accounting evidence not yet proven",
    },
    typescript: {
      countedCertification: "uncertified",
      reason:
        "equivalent compute, containing-memory, process, and accounting evidence not yet proven",
    },
    python: {
      countedCertification: "uncertified",
      reason: "equivalent compute and memory meters are unavailable",
    },
    rust: {
      countedCertification: "uncertified",
      reason:
        "WASM meters exist but equivalent complete v1.17 evidence is not yet proven",
    },
    zig: {
      countedCertification: "uncertified",
      reason:
        "WASM meters exist but equivalent complete v1.17 evidence is not yet proven",
    },
  },
  migration: {
    strategy: "atomic-successor-activation",
    activationPlan: "258-14",
    v116ReadDispatchRetained: true,
    v116InsertionOrderedWireBytesRetained: true,
    v116ReceiptVerificationRetained: true,
    migration0017RewriteAllowed: false,
    newWritesBeforeActivation: false,
    packageOrGameplayChangesInThisPlan: false,
  },
  historicalV116: {
    serializer: "typescript-json-stringify-insertion-order",
    canonicalJsonV1Applied: false,
    protectedFiles: {
      "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
        "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
      "packages/spec/src/runtime-execution-service.ts":
        "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
      "apps/go-backend/runtime_semantic_receipt.go":
        "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
      "apps/go-backend/runtime_service_client.go":
        "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
      "apps/go-backend/runtime_service_client_test.go":
        "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
      "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
        "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
    },
  },
  decisionMap,
} as const)

type IdentityDomain = keyof typeof identityDomains
type Meter = (typeof requiredEquivalentMeters)[number]
type IdentityPin = (typeof requiredExecutablePins)[number]

export interface RuntimeAbiV117InvocationTrace {
  requestId: string
  invocationId?: string
  budgetProfileSha256?: string
}

export type RuntimeAbiV117InvocationResult<
  TValue,
  TViolation = Readonly<{ code: string }>,
  TFailure = Readonly<{ code: string }>,
> =
  | Readonly<{
      kind: "success"
      value: TValue
      trace: RuntimeAbiV117InvocationTrace
      violation?: never
      failure?: never
    }>
  | Readonly<{
      kind: "player_violation"
      violation: TViolation
      trace: RuntimeAbiV117InvocationTrace
      value?: never
      failure?: never
    }>
  | Readonly<{
      kind: "system_failure"
      failure: TFailure
      trace: RuntimeAbiV117InvocationTrace
      value?: never
      violation?: never
    }>

const frame = (bytes: Uint8Array): Buffer => {
  const length = Buffer.alloc(8)
  length.writeBigUInt64BE(BigInt(bytes.byteLength))
  return Buffer.concat([length, Buffer.from(bytes)])
}

export const hashRuntimeAbiV117Identity = (
  domain: IdentityDomain,
  segments: readonly Uint8Array[],
): `sha256:${string}` => {
  const domainBytes = new TextEncoder().encode(identityDomains[domain])
  const hash = createHash("sha256")
  hash.update(frame(domainBytes))
  for (const segment of segments) hash.update(frame(segment))
  return `sha256:${hash.digest("hex")}`
}

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  return (
    actual.length === keys.length &&
    actual.every((key, index) => key === [...keys].sort()[index])
  )
}

export const isRuntimeAbiV117InvocationResult = (value: unknown): boolean => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return false
  const result = value as Record<string, unknown>
  const trace = result.trace
  if (
    trace === null ||
    typeof trace !== "object" ||
    Array.isArray(trace) ||
    typeof (trace as Record<string, unknown>).requestId !== "string"
  ) {
    return false
  }
  if (result.kind === "success") {
    return exactKeys(result, ["kind", "value", "trace"])
  }
  if (result.kind === "player_violation") {
    return exactKeys(result, ["kind", "violation", "trace"])
  }
  if (result.kind === "system_failure") {
    return exactKeys(result, ["kind", "failure", "trace"])
  }
  return false
}

export const assessRuntimeAbiV117Certification = (
  meters: Partial<Record<Meter, boolean>>,
  identityPins: Partial<Record<IdentityPin, string>>,
) => {
  const missingMeters = requiredEquivalentMeters.filter(
    (meter) => meters[meter] !== true,
  )
  const missingIdentityPins = requiredExecutablePins.filter(
    (pin) =>
      typeof identityPins[pin] !== "string" || identityPins[pin]!.length === 0,
  )
  return missingMeters.length === 0 && missingIdentityPins.length === 0
    ? { status: "certifiable" as const, missingMeters, missingIdentityPins }
    : { status: "uncertified" as const, missingMeters, missingIdentityPins }
}

export const RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION =
  "runtime-budget-ledger-v1" as const

export type RuntimeAbiV117ExecutionMethod = "selectActivations" | "soldierBrain"
export type RuntimeAbiV117PreflightProfile = keyof typeof preflightProfiles
export type RuntimeAbiV117LedgerAttribution =
  | "proven_strategy"
  | "host"
  | "ambiguous"

export type RuntimeAbiV117UnavailableEvidence = Readonly<{
  status: "unavailable" | "ambiguous"
}>

export type RuntimeAbiV117CounterEvidence =
  | Readonly<{
      status: "measured"
      delta: number
      cumulative: number
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117MemoryEvidence =
  | Readonly<{
      status: "measured"
      peakBytes: number
      cumulativePeakBytes: number
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117ProcessEvidence =
  | Readonly<{
      status: "verified"
      processes: number
      threads: number
      children: number
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117ExecutionCapabilityEvidence =
  | Readonly<{
      status: "verified"
      filesystem: string
      network: string
      environment: string
      shell: string
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117PreflightCapabilityEvidence =
  | Readonly<{
      status: "verified"
      filesystem: string
      network: string
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117CancellationEvidence =
  | Readonly<{
      status: "verified"
      terminationRequired: boolean
      receiptPresent: boolean
      graceMilliseconds: number
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117AccountingEvidence =
  | Readonly<{
      status: "verified"
      signatureVerified: boolean
      monotonic: boolean
    }>
  | RuntimeAbiV117UnavailableEvidence

export type RuntimeAbiV117ExecutionCounterName =
  | "wallMilliseconds"
  | "computeFuel"
  | "payloadBytes"
  | "stdoutBytes"
  | "stderrBytes"

export type RuntimeAbiV117PreflightCounterName =
  | "wallMilliseconds"
  | "computeFuel"
  | "inputBytes"
  | "outputBytes"
  | "stderrBytes"

export interface RuntimeAbiV117ExecutionLedgerReceipt {
  readonly domain: "execution"
  readonly prestateRevision: number
  readonly invocationId: string
  readonly requestIdentity: string
  readonly evidenceIdentity: string
  readonly method: RuntimeAbiV117ExecutionMethod
  readonly attribution: RuntimeAbiV117LedgerAttribution
  readonly counters: Partial<
    Record<RuntimeAbiV117ExecutionCounterName, RuntimeAbiV117CounterEvidence>
  >
  readonly memory?: RuntimeAbiV117MemoryEvidence | undefined
  readonly process?: RuntimeAbiV117ProcessEvidence | undefined
  readonly capabilities?: RuntimeAbiV117ExecutionCapabilityEvidence | undefined
  readonly cancellation?: RuntimeAbiV117CancellationEvidence | undefined
  readonly accountingEvidence?: RuntimeAbiV117AccountingEvidence | undefined
}

export interface RuntimeAbiV117PreflightLedgerReceipt {
  readonly domain: "preflight"
  readonly profile: RuntimeAbiV117PreflightProfile
  readonly prestateRevision: number
  readonly operationId: string
  readonly requestIdentity: string
  readonly evidenceIdentity: string
  readonly attribution: RuntimeAbiV117LedgerAttribution
  readonly counters: Partial<
    Record<RuntimeAbiV117PreflightCounterName, RuntimeAbiV117CounterEvidence>
  >
  readonly memory?: RuntimeAbiV117MemoryEvidence | undefined
  readonly process?: RuntimeAbiV117ProcessEvidence | undefined
  readonly capabilities?: RuntimeAbiV117PreflightCapabilityEvidence | undefined
  readonly accountingEvidence?: RuntimeAbiV117AccountingEvidence | undefined
}

export type RuntimeAbiV117LedgerReceipt =
  | RuntimeAbiV117ExecutionLedgerReceipt
  | RuntimeAbiV117PreflightLedgerReceipt

export interface RuntimeAbiV117LedgerCommitment {
  readonly identity: string
  readonly requestIdentity: string
  readonly evidenceIdentity: string
  readonly prestateRevision: number
  readonly scope: string
  readonly outcome: "success" | "player_violation"
  readonly dimensions: readonly string[]
}

export interface RuntimeAbiV117ExecutionLedger {
  readonly schemaVersion: typeof RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION
  readonly domain: "execution"
  readonly revision: number
  readonly methodInvocations: Readonly<
    Record<RuntimeAbiV117ExecutionMethod, number>
  >
  readonly cumulative: Readonly<{
    invocationCount: number
    wallMilliseconds: number
    computeFuel: number
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
    memoryBytes: number
  }>
  readonly commitments: readonly RuntimeAbiV117LedgerCommitment[]
}

export interface RuntimeAbiV117PreflightLedger<
  TProfile extends RuntimeAbiV117PreflightProfile =
    RuntimeAbiV117PreflightProfile,
> {
  readonly schemaVersion: typeof RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION
  readonly domain: "preflight"
  readonly profile: TProfile
  readonly revision: number
  readonly cumulative: Readonly<{
    operationCount: number
    wallMilliseconds: number
    computeFuel: number
    inputBytes: number
    outputBytes: number
    stderrBytes: number
    memoryBytes: number
  }>
  readonly commitments: readonly RuntimeAbiV117LedgerCommitment[]
}

export type RuntimeAbiV117Ledger =
  | RuntimeAbiV117ExecutionLedger
  | RuntimeAbiV117PreflightLedger

export type RuntimeAbiV117LedgerFailureCode =
  | "LEDGER_SCHEMA_INVALID"
  | "RECEIPT_SCHEMA_INVALID"
  | "LEDGER_CAPACITY_EXHAUSTED"
  | "LEDGER_DOMAIN_MISMATCH"
  | "LEDGER_PRESTATE_MISMATCH"
  | "LEDGER_IDENTITY_CONFLICT"
  | "METER_EVIDENCE_MISSING"
  | "METER_EVIDENCE_UNAVAILABLE"
  | "METER_EVIDENCE_AMBIGUOUS"
  | "METER_ACCOUNTING_DECREASING"
  | "METER_ACCOUNTING_INCONSISTENT"
  | "HOST_RESOURCE_EXCESS"
  | "HOST_RESOURCE_ACCOUNTING"
  | "ENFORCEMENT_EVIDENCE_INVALID"

export type RuntimeAbiV117LedgerDebitResult<
  TLedger extends RuntimeAbiV117Ledger = RuntimeAbiV117Ledger,
> =
  | Readonly<{
      kind: "success"
      ledger: TLedger
      committed: boolean
      replayed: boolean
    }>
  | Readonly<{
      kind: "player_violation"
      violation: Readonly<{
        code: "RUNTIME_BUDGET_EXCEEDED"
        dimensions: readonly string[]
      }>
      ledger: TLedger
      committed: boolean
      replayed: boolean
    }>
  | Readonly<{
      kind: "system_failure"
      failure: Readonly<{
        code: RuntimeAbiV117LedgerFailureCode
        dimension?: string | undefined
      }>
      ledger: TLedger
      committed: false
      replayed: false
    }>

const identityPattern = /^sha256:[0-9a-f]{64}$/u

const isNonnegativeSafeInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const hasOnlyKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean => Object.keys(value).every((key) => allowed.includes(key))

const hasRequiredKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
): boolean => required.every((key) => Object.hasOwn(value, key))

const isKnownExecutionMethod = (
  value: unknown,
): value is RuntimeAbiV117ExecutionMethod =>
  value === "selectActivations" || value === "soldierBrain"

const isKnownAttribution = (
  value: unknown,
): value is RuntimeAbiV117LedgerAttribution =>
  value === "proven_strategy" || value === "host" || value === "ambiguous"

const isKnownPreflightProfile = (
  value: unknown,
): value is RuntimeAbiV117PreflightProfile =>
  typeof value === "string" && Object.hasOwn(preflightProfiles, value)

const isUnavailableEvidenceShape = (value: unknown): boolean =>
  isRecord(value) &&
  exactKeys(value, ["status"]) &&
  (value.status === "unavailable" || value.status === "ambiguous")

const isCounterEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, ["status", "delta", "cumulative"]) &&
    value.status === "measured" &&
    typeof value.delta === "number" &&
    isNonnegativeSafeInteger(value.delta) &&
    typeof value.cumulative === "number" &&
    isNonnegativeSafeInteger(value.cumulative))

const isMemoryEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, ["status", "peakBytes", "cumulativePeakBytes"]) &&
    value.status === "measured" &&
    typeof value.peakBytes === "number" &&
    isNonnegativeSafeInteger(value.peakBytes) &&
    typeof value.cumulativePeakBytes === "number" &&
    isNonnegativeSafeInteger(value.cumulativePeakBytes))

const isProcessEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, ["status", "processes", "threads", "children"]) &&
    value.status === "verified" &&
    typeof value.processes === "number" &&
    isNonnegativeSafeInteger(value.processes) &&
    typeof value.threads === "number" &&
    isNonnegativeSafeInteger(value.threads) &&
    typeof value.children === "number" &&
    isNonnegativeSafeInteger(value.children))

const isExecutionCapabilityEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, [
      "status",
      "filesystem",
      "network",
      "environment",
      "shell",
    ]) &&
    value.status === "verified" &&
    typeof value.filesystem === "string" &&
    typeof value.network === "string" &&
    typeof value.environment === "string" &&
    typeof value.shell === "string")

const isPreflightCapabilityEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, ["status", "filesystem", "network"]) &&
    value.status === "verified" &&
    typeof value.filesystem === "string" &&
    typeof value.network === "string")

const isCancellationEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, [
      "status",
      "terminationRequired",
      "receiptPresent",
      "graceMilliseconds",
    ]) &&
    value.status === "verified" &&
    typeof value.terminationRequired === "boolean" &&
    typeof value.receiptPresent === "boolean" &&
    typeof value.graceMilliseconds === "number" &&
    isNonnegativeSafeInteger(value.graceMilliseconds))

const isAccountingEvidenceShape = (value: unknown): boolean =>
  isUnavailableEvidenceShape(value) ||
  (isRecord(value) &&
    exactKeys(value, ["status", "signatureVerified", "monotonic"]) &&
    value.status === "verified" &&
    typeof value.signatureVerified === "boolean" &&
    typeof value.monotonic === "boolean")

const hasClosedCounterEvidence = (
  value: unknown,
  allowedCounters: readonly string[],
): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, allowedCounters) &&
  Object.values(value).every(isCounterEvidenceShape)

const EXECUTION_RECEIPT_KEYS = [
  "domain",
  "prestateRevision",
  "invocationId",
  "requestIdentity",
  "evidenceIdentity",
  "method",
  "attribution",
  "counters",
  "memory",
  "process",
  "capabilities",
  "cancellation",
  "accountingEvidence",
] as const

const PREFLIGHT_RECEIPT_KEYS = [
  "domain",
  "profile",
  "prestateRevision",
  "operationId",
  "requestIdentity",
  "evidenceIdentity",
  "attribution",
  "counters",
  "memory",
  "process",
  "capabilities",
  "accountingEvidence",
] as const

const REQUIRED_EXECUTION_RECEIPT_KEYS = EXECUTION_RECEIPT_KEYS.slice(0, 8)
const REQUIRED_PREFLIGHT_RECEIPT_KEYS = PREFLIGHT_RECEIPT_KEYS.slice(0, 8)

const optionalEvidenceShape = (
  value: Record<string, unknown>,
  key: string,
  validate: (candidate: unknown) => boolean,
): boolean => !Object.hasOwn(value, key) || validate(value[key])

const isExecutionReceiptShape = (
  value: unknown,
): value is RuntimeAbiV117ExecutionLedgerReceipt =>
  isRecord(value) &&
  hasOnlyKeys(value, EXECUTION_RECEIPT_KEYS) &&
  hasRequiredKeys(value, REQUIRED_EXECUTION_RECEIPT_KEYS) &&
  value.domain === "execution" &&
  typeof value.prestateRevision === "number" &&
  isNonnegativeSafeInteger(value.prestateRevision) &&
  typeof value.invocationId === "string" &&
  typeof value.requestIdentity === "string" &&
  typeof value.evidenceIdentity === "string" &&
  isKnownExecutionMethod(value.method) &&
  isKnownAttribution(value.attribution) &&
  hasClosedCounterEvidence(
    value.counters,
    Object.keys(executionCounterContract),
  ) &&
  optionalEvidenceShape(value, "memory", isMemoryEvidenceShape) &&
  optionalEvidenceShape(value, "process", isProcessEvidenceShape) &&
  optionalEvidenceShape(
    value,
    "capabilities",
    isExecutionCapabilityEvidenceShape,
  ) &&
  optionalEvidenceShape(value, "cancellation", isCancellationEvidenceShape) &&
  optionalEvidenceShape(value, "accountingEvidence", isAccountingEvidenceShape)

const isPreflightReceiptShape = (
  value: unknown,
): value is RuntimeAbiV117PreflightLedgerReceipt =>
  isRecord(value) &&
  hasOnlyKeys(value, PREFLIGHT_RECEIPT_KEYS) &&
  hasRequiredKeys(value, REQUIRED_PREFLIGHT_RECEIPT_KEYS) &&
  value.domain === "preflight" &&
  isKnownPreflightProfile(value.profile) &&
  typeof value.prestateRevision === "number" &&
  isNonnegativeSafeInteger(value.prestateRevision) &&
  typeof value.operationId === "string" &&
  typeof value.requestIdentity === "string" &&
  typeof value.evidenceIdentity === "string" &&
  isKnownAttribution(value.attribution) &&
  hasClosedCounterEvidence(value.counters, [
    "wallMilliseconds",
    "computeFuel",
    "inputBytes",
    "outputBytes",
    "stderrBytes",
  ]) &&
  optionalEvidenceShape(value, "memory", isMemoryEvidenceShape) &&
  optionalEvidenceShape(value, "process", isProcessEvidenceShape) &&
  optionalEvidenceShape(
    value,
    "capabilities",
    isPreflightCapabilityEvidenceShape,
  ) &&
  optionalEvidenceShape(value, "accountingEvidence", isAccountingEvidenceShape)

const isCommitmentShape = (
  value: unknown,
  domain: "execution" | "preflight",
  profile?: RuntimeAbiV117PreflightProfile,
): value is RuntimeAbiV117LedgerCommitment => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "identity",
      "requestIdentity",
      "evidenceIdentity",
      "prestateRevision",
      "scope",
      "outcome",
      "dimensions",
    ]) ||
    typeof value.identity !== "string" ||
    value.identity.length === 0 ||
    value.identity.includes("\0") ||
    typeof value.requestIdentity !== "string" ||
    !identityPattern.test(value.requestIdentity) ||
    typeof value.evidenceIdentity !== "string" ||
    !identityPattern.test(value.evidenceIdentity) ||
    typeof value.prestateRevision !== "number" ||
    !isNonnegativeSafeInteger(value.prestateRevision) ||
    typeof value.scope !== "string" ||
    (value.outcome !== "success" && value.outcome !== "player_violation") ||
    !Array.isArray(value.dimensions) ||
    value.dimensions.some(
      (dimension) => typeof dimension !== "string" || dimension.length === 0,
    ) ||
    new Set(value.dimensions).size !== value.dimensions.length ||
    (value.outcome === "success" && value.dimensions.length !== 0) ||
    (value.outcome === "player_violation" && value.dimensions.length === 0)
  ) {
    return false
  }
  return domain === "execution"
    ? isKnownExecutionMethod(value.scope)
    : value.scope === profile
}

const hasValidCommitments = (
  value: unknown,
  domain: "execution" | "preflight",
  profile?: RuntimeAbiV117PreflightProfile,
): value is readonly RuntimeAbiV117LedgerCommitment[] =>
  Array.isArray(value) &&
  value.every(
    (commitment, index) =>
      isCommitmentShape(commitment, domain, profile) &&
      commitment.prestateRevision === index,
  ) &&
  new Set(value.map((commitment) => commitment.identity)).size === value.length

const EXECUTION_LEDGER_COUNTER_KEYS = [
  "invocationCount",
  "wallMilliseconds",
  "computeFuel",
  "payloadBytes",
  "stdoutBytes",
  "stderrBytes",
  "memoryBytes",
] as const

const PREFLIGHT_LEDGER_COUNTER_KEYS = [
  "operationCount",
  "wallMilliseconds",
  "computeFuel",
  "inputBytes",
  "outputBytes",
  "stderrBytes",
  "memoryBytes",
] as const

const isSafeCounterRecord = (
  value: unknown,
  keys: readonly string[],
): value is Record<string, number> =>
  isRecord(value) &&
  exactKeys(value, keys) &&
  Object.values(value).every(
    (counter) =>
      typeof counter === "number" && isNonnegativeSafeInteger(counter),
  )

const isExecutionLedgerShape = (
  value: unknown,
): value is RuntimeAbiV117ExecutionLedger => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "schemaVersion",
      "domain",
      "revision",
      "methodInvocations",
      "cumulative",
      "commitments",
    ]) ||
    value.schemaVersion !== RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION ||
    value.domain !== "execution" ||
    typeof value.revision !== "number" ||
    !isNonnegativeSafeInteger(value.revision) ||
    !isSafeCounterRecord(value.methodInvocations, [
      "selectActivations",
      "soldierBrain",
    ]) ||
    !isSafeCounterRecord(value.cumulative, EXECUTION_LEDGER_COUNTER_KEYS) ||
    !hasValidCommitments(value.commitments, "execution")
  ) {
    return false
  }
  const methodCount =
    value.methodInvocations.selectActivations! +
    value.methodInvocations.soldierBrain!
  return (
    Number.isSafeInteger(methodCount) &&
    value.revision === value.commitments.length &&
    value.cumulative.invocationCount === value.commitments.length &&
    methodCount === value.cumulative.invocationCount &&
    value.commitments.filter(({ scope }) => scope === "selectActivations")
      .length === value.methodInvocations.selectActivations &&
    value.commitments.filter(({ scope }) => scope === "soldierBrain").length ===
      value.methodInvocations.soldierBrain
  )
}

const isPreflightLedgerShape = (
  value: unknown,
): value is RuntimeAbiV117PreflightLedger => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "schemaVersion",
      "domain",
      "profile",
      "revision",
      "cumulative",
      "commitments",
    ]) ||
    value.schemaVersion !== RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION ||
    value.domain !== "preflight" ||
    !isKnownPreflightProfile(value.profile) ||
    typeof value.revision !== "number" ||
    !isNonnegativeSafeInteger(value.revision) ||
    !isSafeCounterRecord(value.cumulative, PREFLIGHT_LEDGER_COUNTER_KEYS) ||
    !hasValidCommitments(value.commitments, "preflight", value.profile)
  ) {
    return false
  }
  return (
    value.revision === value.commitments.length &&
    value.cumulative.operationCount === value.commitments.length
  )
}

const isLedgerShape = (value: unknown): value is RuntimeAbiV117Ledger =>
  isExecutionLedgerShape(value) || isPreflightLedgerShape(value)

const ledgerSystemFailure = <TLedger extends RuntimeAbiV117Ledger>(
  ledger: TLedger,
  code: RuntimeAbiV117LedgerFailureCode,
  dimension?: string,
): RuntimeAbiV117LedgerDebitResult<TLedger> =>
  Object.freeze({
    kind: "system_failure" as const,
    failure: Object.freeze({
      code,
      ...(dimension === undefined ? {} : { dimension }),
    }),
    ledger,
    committed: false as const,
    replayed: false as const,
  })

const unavailableEvidenceFailure = (
  evidence: { status: string } | undefined,
): RuntimeAbiV117LedgerFailureCode | undefined => {
  if (evidence === undefined) return "METER_EVIDENCE_MISSING"
  if (evidence.status === "unavailable") return "METER_EVIDENCE_UNAVAILABLE"
  if (evidence.status === "ambiguous") return "METER_EVIDENCE_AMBIGUOUS"
  return undefined
}

type CounterValidation =
  | Readonly<{ ok: true; value: number }>
  | Readonly<{
      ok: false
      code: RuntimeAbiV117LedgerFailureCode
    }>

const validateCounterEvidence = (
  previous: number,
  evidence: RuntimeAbiV117CounterEvidence | undefined,
): CounterValidation => {
  const unavailable = unavailableEvidenceFailure(evidence)
  if (unavailable !== undefined) return { ok: false, code: unavailable }
  if (evidence?.status !== "measured") {
    return { ok: false, code: "ENFORCEMENT_EVIDENCE_INVALID" }
  }
  if (
    !isNonnegativeSafeInteger(evidence.delta) ||
    !isNonnegativeSafeInteger(evidence.cumulative) ||
    evidence.cumulative < previous
  ) {
    return { ok: false, code: "METER_ACCOUNTING_DECREASING" }
  }
  const expected = previous + evidence.delta
  if (!Number.isSafeInteger(expected) || evidence.cumulative !== expected) {
    return { ok: false, code: "METER_ACCOUNTING_INCONSISTENT" }
  }
  return { ok: true, value: evidence.cumulative }
}

const validateMemoryEvidence = (
  previous: number,
  evidence: RuntimeAbiV117MemoryEvidence | undefined,
): CounterValidation => {
  const unavailable = unavailableEvidenceFailure(evidence)
  if (unavailable !== undefined) return { ok: false, code: unavailable }
  if (evidence?.status !== "measured") {
    return { ok: false, code: "ENFORCEMENT_EVIDENCE_INVALID" }
  }
  if (
    !isNonnegativeSafeInteger(evidence.peakBytes) ||
    !isNonnegativeSafeInteger(evidence.cumulativePeakBytes) ||
    evidence.cumulativePeakBytes < previous
  ) {
    return { ok: false, code: "METER_ACCOUNTING_DECREASING" }
  }
  if (evidence.cumulativePeakBytes !== Math.max(previous, evidence.peakBytes)) {
    return { ok: false, code: "METER_ACCOUNTING_INCONSISTENT" }
  }
  return { ok: true, value: evidence.cumulativePeakBytes }
}

const validateIdentity = (
  identity: string,
  requestIdentity: string,
  evidenceIdentity: string,
): boolean =>
  identity.length > 0 &&
  !identity.includes("\0") &&
  identityPattern.test(requestIdentity) &&
  identityPattern.test(evidenceIdentity)

const uniqueDimensions = (dimensions: readonly string[]): readonly string[] =>
  Object.freeze([...new Set(dimensions)])

const replayCommittedResult = <TLedger extends RuntimeAbiV117Ledger>(
  ledger: TLedger,
  commitment: RuntimeAbiV117LedgerCommitment,
): RuntimeAbiV117LedgerDebitResult<TLedger> =>
  commitment.outcome === "success"
    ? deepFreeze({
        kind: "success" as const,
        ledger,
        committed: false,
        replayed: true,
      })
    : deepFreeze({
        kind: "player_violation" as const,
        violation: {
          code: "RUNTIME_BUDGET_EXCEEDED" as const,
          dimensions: commitment.dimensions,
        },
        ledger,
        committed: false,
        replayed: true,
      })

const existingCommitmentResult = <TLedger extends RuntimeAbiV117Ledger>(
  ledger: TLedger,
  input: Readonly<{
    identity: string
    requestIdentity: string
    evidenceIdentity: string
    prestateRevision: number
    scope: string
  }>,
): RuntimeAbiV117LedgerDebitResult<TLedger> | undefined => {
  const existing = ledger.commitments.find(
    (commitment) => commitment.identity === input.identity,
  )
  if (existing === undefined) return undefined
  if (
    existing.requestIdentity !== input.requestIdentity ||
    existing.evidenceIdentity !== input.evidenceIdentity ||
    existing.prestateRevision !== input.prestateRevision ||
    existing.scope !== input.scope
  ) {
    return ledgerSystemFailure(ledger, "LEDGER_IDENTITY_CONFLICT")
  }
  return replayCommittedResult(ledger, existing)
}

export const createRuntimeAbiV117ExecutionLedger =
  (): RuntimeAbiV117ExecutionLedger =>
    deepFreeze({
      schemaVersion: RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION,
      domain: "execution" as const,
      revision: 0,
      methodInvocations: {
        selectActivations: 0,
        soldierBrain: 0,
      },
      cumulative: {
        invocationCount: 0,
        wallMilliseconds: 0,
        computeFuel: 0,
        payloadBytes: 0,
        stdoutBytes: 0,
        stderrBytes: 0,
        memoryBytes: 0,
      },
      commitments: [] as RuntimeAbiV117LedgerCommitment[],
    })

export const createRuntimeAbiV117PreflightLedger = <
  TProfile extends RuntimeAbiV117PreflightProfile,
>(
  profile: TProfile,
): RuntimeAbiV117PreflightLedger<TProfile> =>
  deepFreeze({
    schemaVersion: RUNTIME_ABI_V1_17_LEDGER_SCHEMA_VERSION,
    domain: "preflight" as const,
    profile,
    revision: 0,
    cumulative: {
      operationCount: 0,
      wallMilliseconds: 0,
      computeFuel: 0,
      inputBytes: 0,
      outputBytes: 0,
      stderrBytes: 0,
      memoryBytes: 0,
    },
    commitments: [] as RuntimeAbiV117LedgerCommitment[],
  })

const executionCounterContract = {
  wallMilliseconds: {
    invocationMaximum: invocationVector.wall.value,
    matchMaximum: RUNTIME_ABI_V1_17.budgets.matchCumulative.wallMilliseconds,
    invocationDimension: "invocation.wall",
    matchDimension: "match.wall",
  },
  computeFuel: {
    invocationMaximum: invocationVector.compute.value,
    matchMaximum: RUNTIME_ABI_V1_17.budgets.matchCumulative.computeFuel,
    invocationDimension: "invocation.compute",
    matchDimension: "match.compute",
  },
  payloadBytes: {
    invocationMaximum: invocationVector.payload.value,
    matchMaximum: RUNTIME_ABI_V1_17.budgets.matchCumulative.payloadBytes,
    invocationDimension: "invocation.payload",
    matchDimension: "match.payload",
  },
  stdoutBytes: {
    invocationMaximum: invocationVector.stdout.value,
    matchMaximum: RUNTIME_ABI_V1_17.budgets.matchCumulative.stdoutBytes,
    invocationDimension: "invocation.stdout",
    matchDimension: "match.stdout",
  },
  stderrBytes: {
    invocationMaximum: invocationVector.stderr.value,
    matchMaximum: RUNTIME_ABI_V1_17.budgets.matchCumulative.stderrBytes,
    invocationDimension: "invocation.stderr",
    matchDimension: "match.stderr",
  },
} as const satisfies Record<
  RuntimeAbiV117ExecutionCounterName,
  {
    invocationMaximum: number
    matchMaximum: number
    invocationDimension: string
    matchDimension: string
  }
>

const evidenceShapeFailure = (
  evidence:
    | RuntimeAbiV117ProcessEvidence
    | RuntimeAbiV117ExecutionCapabilityEvidence
    | RuntimeAbiV117PreflightCapabilityEvidence
    | RuntimeAbiV117CancellationEvidence
    | RuntimeAbiV117AccountingEvidence
    | undefined,
): RuntimeAbiV117LedgerFailureCode | undefined =>
  unavailableEvidenceFailure(evidence)

const debitExecutionLedger = (
  ledger: RuntimeAbiV117ExecutionLedger,
  receipt: RuntimeAbiV117ExecutionLedgerReceipt,
): RuntimeAbiV117LedgerDebitResult<RuntimeAbiV117ExecutionLedger> => {
  const identity = receipt.invocationId
  const scope = receipt.method
  if (
    !validateIdentity(
      identity,
      receipt.requestIdentity,
      receipt.evidenceIdentity,
    )
  ) {
    return ledgerSystemFailure(ledger, "LEDGER_IDENTITY_CONFLICT")
  }
  const replay = existingCommitmentResult(ledger, {
    identity,
    requestIdentity: receipt.requestIdentity,
    evidenceIdentity: receipt.evidenceIdentity,
    prestateRevision: receipt.prestateRevision,
    scope,
  })
  if (replay !== undefined) return replay
  if (receipt.prestateRevision !== ledger.revision) {
    return ledgerSystemFailure(ledger, "LEDGER_PRESTATE_MISMATCH")
  }
  if (receipt.attribution === "ambiguous") {
    return ledgerSystemFailure(ledger, "METER_EVIDENCE_AMBIGUOUS")
  }
  const methodMaximum =
    RUNTIME_ABI_V1_17.budgets[receipt.method].invocationCountMaximum
  if (ledger.methodInvocations[receipt.method] >= methodMaximum) {
    return ledgerSystemFailure(
      ledger,
      "LEDGER_CAPACITY_EXHAUSTED",
      `method.${receipt.method}.invocationCount`,
    )
  }
  if (
    ledger.cumulative.invocationCount >=
    RUNTIME_ABI_V1_17.budgets.matchCumulative.invocationCountMaximum
  ) {
    return ledgerSystemFailure(
      ledger,
      "LEDGER_CAPACITY_EXHAUSTED",
      "match.invocationCount",
    )
  }
  if (
    !Number.isSafeInteger(ledger.revision + 1) ||
    !Number.isSafeInteger(ledger.methodInvocations[receipt.method] + 1) ||
    !Number.isSafeInteger(ledger.cumulative.invocationCount + 1)
  ) {
    return ledgerSystemFailure(
      ledger,
      "LEDGER_CAPACITY_EXHAUSTED",
      "ledger.safeIncrement",
    )
  }

  const nextCounters = {} as Record<RuntimeAbiV117ExecutionCounterName, number>
  const dimensions: string[] = []
  for (const counter of Object.keys(
    executionCounterContract,
  ) as RuntimeAbiV117ExecutionCounterName[]) {
    const evidence = receipt.counters[counter]
    const validation = validateCounterEvidence(
      ledger.cumulative[counter],
      evidence,
    )
    if (!validation.ok) {
      return ledgerSystemFailure(ledger, validation.code, counter)
    }
    nextCounters[counter] = validation.value
    const contract = executionCounterContract[counter]
    if (evidence?.status === "measured") {
      if (evidence.delta > contract.invocationMaximum) {
        dimensions.push(contract.invocationDimension)
      }
      if (validation.value > contract.matchMaximum) {
        dimensions.push(contract.matchDimension)
      }
    }
  }

  const memoryValidation = validateMemoryEvidence(
    ledger.cumulative.memoryBytes,
    receipt.memory,
  )
  if (!memoryValidation.ok) {
    return ledgerSystemFailure(ledger, memoryValidation.code, "memory")
  }
  if (receipt.memory?.status === "measured") {
    if (receipt.memory.peakBytes > invocationVector.memory.value) {
      dimensions.push("invocation.memory")
    }
    if (
      memoryValidation.value >
      RUNTIME_ABI_V1_17.budgets.matchCumulative.memoryBytes
    ) {
      dimensions.push("match.memory")
    }
  }

  const processFailure = evidenceShapeFailure(receipt.process)
  if (processFailure !== undefined) {
    return ledgerSystemFailure(ledger, processFailure, "process")
  }
  if (
    receipt.process?.status !== "verified" ||
    !isNonnegativeSafeInteger(receipt.process.processes) ||
    !isNonnegativeSafeInteger(receipt.process.threads) ||
    !isNonnegativeSafeInteger(receipt.process.children) ||
    receipt.process.processes === 0 ||
    receipt.process.threads === 0
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "process",
    )
  }
  if (
    receipt.process.processes > invocationVector.process.processes ||
    receipt.process.threads > invocationVector.process.threads ||
    receipt.process.children > invocationVector.process.children
  ) {
    dimensions.push("invocation.process")
  }

  const capabilityFailure = evidenceShapeFailure(receipt.capabilities)
  if (capabilityFailure !== undefined) {
    return ledgerSystemFailure(ledger, capabilityFailure, "capabilities")
  }
  if (receipt.capabilities?.status !== "verified") {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "capabilities",
    )
  }
  if (
    receipt.capabilities.filesystem !==
      invocationVector.capabilities.filesystem ||
    receipt.capabilities.network !== invocationVector.capabilities.network ||
    receipt.capabilities.environment !==
      invocationVector.capabilities.environment ||
    receipt.capabilities.shell !== invocationVector.capabilities.shell
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "invocation.capabilities",
    )
  }

  const cancellationFailure = evidenceShapeFailure(receipt.cancellation)
  if (cancellationFailure !== undefined) {
    return ledgerSystemFailure(ledger, cancellationFailure, "cancellation")
  }
  if (
    receipt.cancellation?.status !== "verified" ||
    !isNonnegativeSafeInteger(receipt.cancellation.graceMilliseconds) ||
    (receipt.cancellation.terminationRequired &&
      (!receipt.cancellation.receiptPresent ||
        receipt.cancellation.graceMilliseconds >
          invocationVector.cancellation.terminationGraceMilliseconds))
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "cancellation",
    )
  }

  const accountingFailure = evidenceShapeFailure(receipt.accountingEvidence)
  if (accountingFailure !== undefined) {
    return ledgerSystemFailure(ledger, accountingFailure, "accountingEvidence")
  }
  if (
    receipt.accountingEvidence?.status !== "verified" ||
    !receipt.accountingEvidence.signatureVerified
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "accountingEvidence",
    )
  }
  if (!receipt.accountingEvidence.monotonic) {
    return ledgerSystemFailure(
      ledger,
      "METER_ACCOUNTING_DECREASING",
      "accountingEvidence",
    )
  }

  const nextMethodCount = ledger.methodInvocations[receipt.method] + 1
  const nextInvocationCount = ledger.cumulative.invocationCount + 1
  const finalDimensions = uniqueDimensions(dimensions)
  if (receipt.attribution === "host") {
    return ledgerSystemFailure(
      ledger,
      finalDimensions.length > 0
        ? "HOST_RESOURCE_EXCESS"
        : "HOST_RESOURCE_ACCOUNTING",
      finalDimensions.length === 1 ? finalDimensions[0] : undefined,
    )
  }

  const outcome = finalDimensions.length === 0 ? "success" : "player_violation"
  const commitment = deepFreeze({
    identity,
    requestIdentity: receipt.requestIdentity,
    evidenceIdentity: receipt.evidenceIdentity,
    prestateRevision: receipt.prestateRevision,
    scope,
    outcome,
    dimensions: finalDimensions,
  } satisfies RuntimeAbiV117LedgerCommitment)
  const nextLedger = deepFreeze({
    ...ledger,
    revision: ledger.revision + 1,
    methodInvocations: {
      ...ledger.methodInvocations,
      [receipt.method]: nextMethodCount,
    },
    cumulative: {
      invocationCount: nextInvocationCount,
      ...nextCounters,
      memoryBytes: memoryValidation.value,
    },
    commitments: [...ledger.commitments, commitment],
  } satisfies RuntimeAbiV117ExecutionLedger)
  return outcome === "success"
    ? deepFreeze({
        kind: "success" as const,
        ledger: nextLedger,
        committed: true,
        replayed: false,
      })
    : deepFreeze({
        kind: "player_violation" as const,
        violation: {
          code: "RUNTIME_BUDGET_EXCEEDED" as const,
          dimensions: finalDimensions,
        },
        ledger: nextLedger,
        committed: true,
        replayed: false,
      })
}

const preflightLimits = (profile: RuntimeAbiV117PreflightProfile) => {
  const frozen = preflightProfiles[profile]
  return {
    counters: {
      wallMilliseconds: frozen.wallMilliseconds,
      computeFuel: frozen.computeFuel,
      inputBytes: frozen.inputBytes,
      outputBytes: frozen.outputBytes,
      stderrBytes: frozen.stderrBytes,
    },
    memoryBytes: frozen.memoryBytes,
    process: {
      processes: frozen.processes,
      threads: frozen.threads,
      children: frozen.children,
    },
    capabilities: {
      network: frozen.network,
      filesystem: frozen.filesystem,
    },
  } as const
}

const preflightDimension = (
  profile: RuntimeAbiV117PreflightProfile,
  counter: RuntimeAbiV117PreflightCounterName,
): string => {
  const suffix =
    counter === "wallMilliseconds"
      ? "wall"
      : counter === "computeFuel"
        ? "compute"
        : counter === "inputBytes"
          ? "input"
          : counter === "outputBytes"
            ? "output"
            : "stderr"
  return `preflight.${profile}.${suffix}`
}

const debitPreflightLedger = <TProfile extends RuntimeAbiV117PreflightProfile>(
  ledger: RuntimeAbiV117PreflightLedger<TProfile>,
  receipt: RuntimeAbiV117PreflightLedgerReceipt,
): RuntimeAbiV117LedgerDebitResult<RuntimeAbiV117PreflightLedger<TProfile>> => {
  if (receipt.profile !== ledger.profile) {
    return ledgerSystemFailure(ledger, "LEDGER_DOMAIN_MISMATCH")
  }
  const identity = receipt.operationId
  const scope = receipt.profile
  if (
    !validateIdentity(
      identity,
      receipt.requestIdentity,
      receipt.evidenceIdentity,
    )
  ) {
    return ledgerSystemFailure(ledger, "LEDGER_IDENTITY_CONFLICT")
  }
  const replay = existingCommitmentResult(ledger, {
    identity,
    requestIdentity: receipt.requestIdentity,
    evidenceIdentity: receipt.evidenceIdentity,
    prestateRevision: receipt.prestateRevision,
    scope,
  })
  if (replay !== undefined) return replay
  if (receipt.prestateRevision !== ledger.revision) {
    return ledgerSystemFailure(ledger, "LEDGER_PRESTATE_MISMATCH")
  }
  if (receipt.attribution === "ambiguous") {
    return ledgerSystemFailure(ledger, "METER_EVIDENCE_AMBIGUOUS")
  }
  if (
    !Number.isSafeInteger(ledger.revision + 1) ||
    !Number.isSafeInteger(ledger.cumulative.operationCount + 1)
  ) {
    return ledgerSystemFailure(
      ledger,
      "LEDGER_CAPACITY_EXHAUSTED",
      "preflight.operationCount",
    )
  }

  const limits = preflightLimits(ledger.profile)
  const nextCounters = {} as Record<RuntimeAbiV117PreflightCounterName, number>
  const dimensions: string[] = []
  for (const counter of Object.keys(
    limits.counters,
  ) as RuntimeAbiV117PreflightCounterName[]) {
    const validation = validateCounterEvidence(
      ledger.cumulative[counter],
      receipt.counters[counter],
    )
    if (!validation.ok) {
      return ledgerSystemFailure(ledger, validation.code, counter)
    }
    nextCounters[counter] = validation.value
    if (validation.value > limits.counters[counter]) {
      dimensions.push(preflightDimension(ledger.profile, counter))
    }
  }

  const memoryValidation = validateMemoryEvidence(
    ledger.cumulative.memoryBytes,
    receipt.memory,
  )
  if (!memoryValidation.ok) {
    return ledgerSystemFailure(ledger, memoryValidation.code, "memory")
  }
  if (memoryValidation.value > limits.memoryBytes) {
    dimensions.push(`preflight.${ledger.profile}.memory`)
  }

  const processFailure = evidenceShapeFailure(receipt.process)
  if (processFailure !== undefined) {
    return ledgerSystemFailure(ledger, processFailure, "process")
  }
  if (
    receipt.process?.status !== "verified" ||
    !isNonnegativeSafeInteger(receipt.process.processes) ||
    !isNonnegativeSafeInteger(receipt.process.threads) ||
    !isNonnegativeSafeInteger(receipt.process.children) ||
    receipt.process.processes === 0 ||
    receipt.process.threads === 0
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "process",
    )
  }
  if (
    receipt.process.processes > limits.process.processes ||
    receipt.process.threads > limits.process.threads ||
    receipt.process.children > limits.process.children
  ) {
    dimensions.push(`preflight.${ledger.profile}.process`)
  }

  const capabilityFailure = evidenceShapeFailure(receipt.capabilities)
  if (capabilityFailure !== undefined) {
    return ledgerSystemFailure(ledger, capabilityFailure, "capabilities")
  }
  if (receipt.capabilities?.status !== "verified") {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "capabilities",
    )
  }
  if (
    receipt.capabilities.network !== limits.capabilities.network ||
    receipt.capabilities.filesystem !== limits.capabilities.filesystem
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      `preflight.${ledger.profile}.capabilities`,
    )
  }

  const accountingFailure = evidenceShapeFailure(receipt.accountingEvidence)
  if (accountingFailure !== undefined) {
    return ledgerSystemFailure(ledger, accountingFailure, "accountingEvidence")
  }
  if (
    receipt.accountingEvidence?.status !== "verified" ||
    !receipt.accountingEvidence.signatureVerified
  ) {
    return ledgerSystemFailure(
      ledger,
      "ENFORCEMENT_EVIDENCE_INVALID",
      "accountingEvidence",
    )
  }
  if (!receipt.accountingEvidence.monotonic) {
    return ledgerSystemFailure(
      ledger,
      "METER_ACCOUNTING_DECREASING",
      "accountingEvidence",
    )
  }

  const finalDimensions = uniqueDimensions(dimensions)
  if (receipt.attribution === "host") {
    return ledgerSystemFailure(
      ledger,
      finalDimensions.length > 0
        ? "HOST_RESOURCE_EXCESS"
        : "HOST_RESOURCE_ACCOUNTING",
      finalDimensions.length === 1 ? finalDimensions[0] : undefined,
    )
  }
  const outcome = finalDimensions.length === 0 ? "success" : "player_violation"
  const commitment = deepFreeze({
    identity,
    requestIdentity: receipt.requestIdentity,
    evidenceIdentity: receipt.evidenceIdentity,
    prestateRevision: receipt.prestateRevision,
    scope,
    outcome,
    dimensions: finalDimensions,
  } satisfies RuntimeAbiV117LedgerCommitment)
  const nextLedger = deepFreeze({
    ...ledger,
    revision: ledger.revision + 1,
    cumulative: {
      operationCount: ledger.cumulative.operationCount + 1,
      ...nextCounters,
      memoryBytes: memoryValidation.value,
    },
    commitments: [...ledger.commitments, commitment],
  } satisfies RuntimeAbiV117PreflightLedger<TProfile>)
  return outcome === "success"
    ? deepFreeze({
        kind: "success" as const,
        ledger: nextLedger,
        committed: true,
        replayed: false,
      })
    : deepFreeze({
        kind: "player_violation" as const,
        violation: {
          code: "RUNTIME_BUDGET_EXCEEDED" as const,
          dimensions: finalDimensions,
        },
        ledger: nextLedger,
        committed: true,
        replayed: false,
      })
}

/* eslint-disable no-redeclare -- TypeScript overload signatures share one implementation. */
export function debitRuntimeAbiV117Ledger(
  ledger: RuntimeAbiV117ExecutionLedger,
  receipt: RuntimeAbiV117ExecutionLedgerReceipt,
): RuntimeAbiV117LedgerDebitResult<RuntimeAbiV117ExecutionLedger>
export function debitRuntimeAbiV117Ledger<
  TProfile extends RuntimeAbiV117PreflightProfile,
>(
  ledger: RuntimeAbiV117PreflightLedger<TProfile>,
  receipt: RuntimeAbiV117PreflightLedgerReceipt,
): RuntimeAbiV117LedgerDebitResult<RuntimeAbiV117PreflightLedger<TProfile>>
export function debitRuntimeAbiV117Ledger(
  ledger: RuntimeAbiV117Ledger,
  receipt: RuntimeAbiV117LedgerReceipt,
): RuntimeAbiV117LedgerDebitResult
export function debitRuntimeAbiV117Ledger(
  ledger: RuntimeAbiV117Ledger,
  receipt: RuntimeAbiV117LedgerReceipt,
): RuntimeAbiV117LedgerDebitResult {
  if (!isLedgerShape(ledger)) {
    return ledgerSystemFailure(ledger, "LEDGER_SCHEMA_INVALID")
  }
  if (!isExecutionReceiptShape(receipt) && !isPreflightReceiptShape(receipt)) {
    return ledgerSystemFailure(ledger, "RECEIPT_SCHEMA_INVALID")
  }
  if (ledger.domain !== receipt.domain) {
    return ledgerSystemFailure(ledger, "LEDGER_DOMAIN_MISMATCH")
  }
  return ledger.domain === "execution" && receipt.domain === "execution"
    ? debitExecutionLedger(ledger, receipt)
    : ledger.domain === "preflight" && receipt.domain === "preflight"
      ? debitPreflightLedger(ledger, receipt)
      : ledgerSystemFailure(ledger, "LEDGER_DOMAIN_MISMATCH")
}
/* eslint-enable no-redeclare */

export const validateRuntimeAbiV117Contract = (): string[] => {
  const errors: string[] = []
  const expectedDecisions = Array.from(
    { length: 16 },
    (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
  )
  if (
    decisionMap.map(({ id }) => id).join("|") !== expectedDecisions.join("|")
  ) {
    errors.push("decision map must cover D-01 through D-16 exactly")
  }
  if (RUNTIME_ABI_V1_17.lifecycle.active)
    errors.push("candidate must not be active")
  if (RUNTIME_ABI_V1_17.migration.migration0017RewriteAllowed) {
    errors.push("migration 0017 rewrite must remain forbidden")
  }
  if (
    Object.values(RUNTIME_ABI_V1_17.lanePosture).some(
      ({ countedCertification }) => countedCertification !== "uncertified",
    )
  ) {
    errors.push("Plan 01 may not certify a counted lane")
  }
  if (
    RUNTIME_ABI_V1_17.identity.evidenceGraph.productionTrustedProducers.length >
    0
  ) {
    errors.push(
      "production trusted producers must remain empty until Phase 259",
    )
  }
  return errors
}

export const renderRuntimeAbiV117ContractJson = (): string => {
  const errors = validateRuntimeAbiV117Contract()
  if (errors.length > 0) {
    throw new Error(`Invalid runtime ABI v1.17 contract:\n${errors.join("\n")}`)
  }
  return `${JSON.stringify(RUNTIME_ABI_V1_17, null, 2)}\n`
}
