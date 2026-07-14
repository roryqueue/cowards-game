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
    processes: 1,
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
    processes: 1,
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
    processes: 1,
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
