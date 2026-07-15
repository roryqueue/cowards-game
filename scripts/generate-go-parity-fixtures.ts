#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  MATCH_KERNEL,
  type StrategyRuntime,
} from "../packages/engine/src/index.ts"
import {
  projectPublicChronicle,
  recordChronicleFromExecution,
  validateCurrentReplayReconstruction,
} from "../packages/replay/src/index.ts"
import { issueRuntimeSemanticReceipt } from "../apps/runtime-service/src/semantic-receipt.ts"
import { issueRuntimeSemanticReceiptV117 } from "../apps/runtime-service/src/semantic-receipt-v1-17.ts"
import { createChronicleMetadata } from "../packages/persistence/src/chronicle-store.ts"
import { createWorkshopAnalyticsDemoSnapshot } from "../packages/persistence/src/workshop-analytics.ts"
import { createCowardsLocalService } from "../packages/service/src/index.ts"
import { createGoldenMatchInput } from "../packages/golden/src/index.ts"
import {
  AnalyticsRunSummaryServiceDtoSchema,
  ChronicleSchema,
  EXHIBITION_SCORING_POLICY_V1,
  PublicLadderPageServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayEvidenceServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  SERVICE_API_ROUTES,
  ServiceErrorDtoSchema,
  ServiceHealthDtoSchema,
  assertAnalyticsPublicSummaryLeakSafe,
  assertPublicServiceDtoLeakSafe,
  createAuthenticatedRuntimeInvocationRequestV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationTraceV117,
  encodeCanonicalJson,
  serviceHealthExample,
  SERVICE_API_VERSION,
  RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  RuntimeExecutionFinalStateSchema,
  encodeRuntimeSemanticReceiptClaims,
  type AnalyticsRunSummaryServiceDto,
  type PublicLadderPageServiceDto,
  type PublicMatchSetResultDto,
  type PublicPlayerPageServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicStrategyCardDto,
  type PublicStrategyPageServiceDto,
  type ServiceErrorDto,
  type SoldierBrainInput,
  type StrategyInput,
  publicLadderPageExample,
  publicPlayerPageExample,
  serializeRuntimeInvocationRequestV117,
  serializeRuntimeInvocationResponseV117,
} from "../packages/spec/src/index.ts"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
  encodeRuntimeSemanticReceiptClaimsV117,
  serializeRuntimeExecutionServiceRequestV117,
  serializeRuntimeExecutionServiceResponseV117,
  type RuntimeExecutionServiceRequestV117,
  type RuntimeExecutionServiceSuccessResponseV117,
} from "../packages/spec/src/runtime-execution-service-v1-17.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const fixtureDir = path.join(
  repoRoot,
  "apps/go-backend/testdata/service-fixtures",
)
const goChecksumSourcePath = path.join(
  repoRoot,
  "apps/go-backend/fixture_checksums_gen.go",
)
const staleMessage = "Go parity fixtures are stale; run pnpm go:parity:generate"

const createRuntimeExecutionWireGolden = (root = repoRoot): string => {
  const request = RuntimeExecutionServiceRequestSchema.parse(
    JSON.parse(
      readFileSync(
        path.join(
          root,
          "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        ),
        "utf8",
      ),
    ),
  )
  const wireValues = () => ({
    zLower: "<>&",
    AUpper: "日本語",
    lineSeparators: "before\u2028middle\u2029after",
    maxSafeInteger: Number.MAX_SAFE_INTEGER,
    minSafeInteger: Number.MIN_SAFE_INTEGER,
    negativeZero: -0,
    tinyDecimal: 1e-7,
    exactDecimal: 1.25,
  })
  const wireRuntime: StrategyRuntime = {
    selectActivations(_input: StrategyInput) {
      return {
        ok: true,
        value: { activationOrders: [], strategyMemory: wireValues() },
      }
    },
    runSoldierBrain(_input: SoldierBrainInput) {
      return {
        ok: true,
        value: {
          action: { type: "TURN_TO_STONE" },
          soldierMemory: wireValues(),
        },
      }
    },
  }
  const execution = MATCH_KERNEL.runMatch({
    ...request.match,
    runtime: wireRuntime,
  })
  if (execution.kind !== "completed") {
    throw new Error("Runtime execution wire golden did not complete")
  }
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: request.evidenceSnapshot.compatibility.tupleId,
      semanticTuple: request.evidenceSnapshot.compatibility.tuple,
    },
  })
  if (!recorded.ok) {
    throw new Error(recorded.failure.code)
  }
  const reconstructed = validateCurrentReplayReconstruction({
    chronicle: recorded.chronicle,
    execution,
  })
  if (!reconstructed.ok) {
    throw new Error("Runtime execution wire golden did not reconstruct")
  }
  const runtimeViolationEventCount = recorded.chronicle.events.filter(
    (event) => event.type === "RUNTIME_VIOLATION",
  ).length
  const responseChronicle = ChronicleSchema.omit({
    integrity: true,
    storageMetadata: true,
  })
    .strict()
    .parse(recorded.chronicle)
  const responseFinalState = RuntimeExecutionFinalStateSchema.parse(
    recorded.finalState,
  )
  const semanticReceipt = issueRuntimeSemanticReceipt({
    request,
    chronicle: responseChronicle,
    finalState: responseFinalState,
    reconstructedTerminalStateHash: reconstructed.terminalStateHash,
    runtimeViolationEventCount,
    secret: "fixture-v1.16-wire-golden-secret",
  })
  const response = RuntimeExecutionServiceResponseSchema.parse({
    contractVersion: request.contractVersion,
    ok: true,
    kind: "executionResult",
    requestId: request.requestId,
    matchId: request.match.matchId,
    runtimeAbiVersion: request.evidenceSnapshot.compatibility.tuple.runtimeAbi,
    result: {
      privacy: "internal_runtime_result",
      chronicle: responseChronicle,
      finalState: responseFinalState,
      runtimeViolationEventCount,
      semanticReceipt,
    },
  })
  return JSON.stringify(response)
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    )
  }
  return value
}

const withTrailingNewline = (value: unknown): string =>
  `${JSON.stringify(stableValue(value), null, 2)}\n`

const V1_16_REQUEST_SHA256 =
  "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5"
const V1_16_RESPONSE_SHA256 =
  "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97"
const V1_16_SIGNATURE_INPUT_SHA256 =
  "cdebdf5892e23604803e1c081cd60388eb312f6d68720c17123c218c17da4fc1"
const V1_16_SOURCE_SHA256 = Object.freeze({
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "apps/runtime-service/src/semantic-receipt.ts":
    "f97482b7824658579fcaf33f310613103da5afd93ccee09f6c0dc49cf82722ec",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "apps/go-backend/runtime_service_client.go":
    "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
  "apps/go-backend/runtime_service_client_test.go":
    "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
})
const runtimeInvocationFixtureSecret =
  "fixture-only:runtime-invocation-v1.17:secret"

const sha256Hex = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex")
const fixtureHash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const versionPaths = (root: string) => ({
  v116Request: path.join(
    root,
    "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
  ),
  v116Response: path.join(
    root,
    "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
  ),
  v117InvocationRequest: path.join(
    root,
    "packages/spec/artifacts/runtime-invocation-request.v1.17.candidate.json",
  ),
  v117InvocationResponse: path.join(
    root,
    "packages/spec/artifacts/runtime-invocation-response.v1.17.candidate.wire.json",
  ),
  v117ServiceRequest: path.join(
    root,
    "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
  ),
  v117ServiceResponse: path.join(
    root,
    "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
  ),
  goContract: path.join(
    root,
    "apps/go-backend/runtime_execution_contract_gen.go",
  ),
})

const createCandidateRequest = () =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:candidate:v1.17:0001",
      invocationId: "invocation:candidate:v1.17:0001",
      kernelRequestId: "kernel-request:candidate:v1.17:0001",
      method: "selectActivations",
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:candidate:v1.17:bottom",
        originalSourceSha256: fixtureHash("b"),
        normalizedSourceSha256: fixtureHash("c"),
        artifactSha256: fixtureHash("d"),
      },
      budget: createRuntimeInvocationBudgetV117("selectActivations"),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
      input: { value: { cycleIndex: 0, phase: "ROUND" } },
      retry: {
        retryId: "retry:candidate:v1.17:0001",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: runtimeInvocationFixtureSecret,
    },
  )

const createCandidateResponse = (
  request: ReturnType<typeof createCandidateRequest>,
) => {
  const prestate = request.accounting.prestate
  const successValue = { activationOrders: [], strategyMemory: {} }
  const canonicalPayload = encodeCanonicalJson(successValue, {
    context: "authenticated-outer-envelope",
  })
  if (!canonicalPayload.ok) {
    throw new TypeError(canonicalPayload.error.code)
  }
  const observedStdoutFrame = Buffer.concat([
    Buffer.from("S", "utf8"),
    Buffer.from(canonicalPayload.bytes),
  ])
  const observedStderr = Buffer.alloc(0)
  const measuredCounter = (
    name:
      | "wallMilliseconds"
      | "computeFuel"
      | "payloadBytes"
      | "stdoutBytes"
      | "stderrBytes",
    delta = 1,
  ) => ({
    status: "measured" as const,
    delta,
    cumulative: prestate.cumulative[name] + delta,
  })
  const receipt = createRuntimeInvocationExecutionReceiptV117(request, {
    attribution: "proven_strategy",
    counters: {
      wallMilliseconds: measuredCounter("wallMilliseconds"),
      computeFuel: measuredCounter("computeFuel"),
      payloadBytes: measuredCounter(
        "payloadBytes",
        canonicalPayload.bytes.byteLength,
      ),
      stdoutBytes: measuredCounter(
        "stdoutBytes",
        observedStdoutFrame.byteLength,
      ),
      stderrBytes: measuredCounter("stderrBytes", observedStderr.byteLength),
    },
    memory: {
      status: "measured",
      peakBytes: 1,
      cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
    },
    process: {
      status: "verified",
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified",
      filesystem: "none",
      network: "disabled",
      environment: "empty",
      shell: "disabled",
    },
    cancellation: {
      status: "verified",
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
  })
  return createAuthenticatedRuntimeInvocationResponseV117(
    request,
    {
      kind: "success",
      value: successValue,
      trace: createRuntimeInvocationTraceV117(request, [
        "ADAPTER_AUTHENTICATED",
        "PAYLOAD_CANONICAL",
      ]),
    },
    receipt,
    {
      keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
      secret: runtimeInvocationFixtureSecret,
    },
  )
}

const renderRuntimeInvocationContractSource = (
  invocationRequestSha256: string,
  invocationResponseSha256: string,
  serviceRequestSha256: string,
  serviceResponseSha256: string,
  serviceReceiptClaimSha256: string,
  serviceReceiptSignature: string,
): string =>
  `${[
    "// Code generated by scripts/generate-go-parity-fixtures.ts; DO NOT EDIT.",
    "package main",
    "",
    "type runtimeInvocationContractDescriptor struct {",
    "\tContractVersion string",
    "\tRequestSHA256 string",
    "\tResponseSHA256 string",
    "\tHistorical bool",
    "\tCanonicalJSON bool",
    "\tCurrent bool",
    "\tReceiptClaimSHA256 string",
    "\tReceiptSignature string",
    "}",
    "",
    "func runtimeInvocationContractForVersion(version string) (runtimeInvocationContractDescriptor, bool) {",
    "\tswitch version {",
    '\tcase "runtime-execution-service-v1.16":',
    "\t\treturn runtimeInvocationContractDescriptor{",
    '\t\t\tContractVersion: "runtime-execution-service-v1.16",',
    `\t\t\tRequestSHA256: ${JSON.stringify(V1_16_REQUEST_SHA256)},`,
    `\t\t\tResponseSHA256: ${JSON.stringify(V1_16_RESPONSE_SHA256)},`,
    "\t\t\tHistorical: true,",
    "\t\t\tCanonicalJSON: false,",
    "\t\t\tCurrent: true,",
    "\t\t}, true",
    '\tcase "runtime-invocation-v1.17":',
    "\t\treturn runtimeInvocationContractDescriptor{",
    '\t\t\tContractVersion: "runtime-invocation-v1.17",',
    `\t\t\tRequestSHA256: ${JSON.stringify(invocationRequestSha256)},`,
    `\t\t\tResponseSHA256: ${JSON.stringify(invocationResponseSha256)},`,
    "\t\t\tHistorical: false,",
    "\t\t\tCanonicalJSON: true,",
    "\t\t\tCurrent: false,",
    "\t\t}, true",
    '\tcase "runtime-execution-service-v1.17":',
    "\t\treturn runtimeInvocationContractDescriptor{",
    '\t\t\tContractVersion: "runtime-execution-service-v1.17",',
    `\t\t\tRequestSHA256: ${JSON.stringify(serviceRequestSha256)},`,
    `\t\t\tResponseSHA256: ${JSON.stringify(serviceResponseSha256)},`,
    "\t\t\tHistorical: false,",
    "\t\t\tCanonicalJSON: true,",
    "\t\t\tCurrent: false,",
    `\t\t\tReceiptClaimSHA256: ${JSON.stringify(serviceReceiptClaimSha256)},`,
    `\t\t\tReceiptSignature: ${JSON.stringify(serviceReceiptSignature)},`,
    "\t\t}, true",
    "\tdefault:",
    "\t\treturn runtimeInvocationContractDescriptor{}, false",
    "\t}",
    "}",
    "",
    "func runtimeInvocationContractsSnapshot() map[string]runtimeInvocationContractDescriptor {",
    '\thistorical, _ := runtimeInvocationContractForVersion("runtime-execution-service-v1.16")',
    '\tcandidate, _ := runtimeInvocationContractForVersion("runtime-invocation-v1.17")',
    '\tserviceCandidate, _ := runtimeInvocationContractForVersion("runtime-execution-service-v1.17")',
    "\treturn map[string]runtimeInvocationContractDescriptor{",
    "\t\thistorical.ContractVersion: historical,",
    "\t\tcandidate.ContractVersion: candidate,",
    "\t\tserviceCandidate.ContractVersion: serviceCandidate,",
    "\t}",
    "}",
    "",
    "func runtimeServiceContractFailureCodeKnown(code string) bool {",
    "\tswitch code {",
    ...RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES.map(
      (code) => `\tcase ${JSON.stringify(code)}:\n\t\treturn true`,
    ),
    "\tdefault:",
    "\t\treturn false",
    "\t}",
    "}",
    "",
    "func runtimeServiceContractFailureCodesSnapshot() map[string]struct{} {",
    "\treturn map[string]struct{}{",
    ...RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES.map(
      (code) => `\t\t${JSON.stringify(code)}: {},`,
    ),
    "\t}",
    "}",
    "",
    "func runtimeInvocationV117SystemFailureRetryable(code string) (bool, bool) {",
    "\tswitch code {",
    ...RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES.map(
      (code) =>
        `\tcase ${JSON.stringify(code)}:\n\t\treturn ${RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code]}, true`,
    ),
    "\tdefault:",
    "\t\treturn false, false",
    "\t}",
    "}",
    "",
    "func runtimeInvocationV117SystemFailureRetryabilitySnapshot() map[string]bool {",
    "\treturn map[string]bool{",
    ...RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_CODES.map(
      (code) =>
        `\t\t${JSON.stringify(code)}: ${RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY[code]},`,
    ),
    "\t}",
    "}",
  ].join("\n")}\n`

const createV117InvocationArtifacts = () => {
  const request = createCandidateRequest()
  const requestBytes = Buffer.from(
    serializeRuntimeInvocationRequestV117(request),
  )
  const responseBytes = Buffer.from(
    serializeRuntimeInvocationResponseV117(createCandidateResponse(request)),
  )
  return {
    requestBytes,
    responseBytes,
  }
}

const createV117ServiceArtifacts = () => {
  const identity = (character: string) => fixtureHash(character)
  const request: RuntimeExecutionServiceRequestV117 = {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    kind: "executeMatch",
    requestId: "request:full-service:v1.17:0001",
    matchId: "match:full-service:v1.17:0001",
    compatibilityTupleId: identity("1"),
    authority: {
      bundleHash: identity("2"),
      sourceManifestHash: identity("3"),
      registryGeneration: "7",
    },
    entrants: {
      bottom: {
        identityManifestRoot: identity("4"),
        evidenceGraphRoot: identity("5"),
      },
      top: {
        identityManifestRoot: identity("6"),
        evidenceGraphRoot: identity("7"),
      },
    },
    accounting: {
      budgetProfileSha256: identity("8"),
      ledgerPrestateRoot: identity("9"),
    },
    match: { seed: "fixture:v1.17", arenaVariantId: "arena:standard" },
  }
  const chronicle = { events: [], snapshots: [] }
  const finalState = { matchId: request.matchId, status: "complete" }
  const outcome = { kind: "draw", reason: "fixture" }
  const ledgerPoststateRoot = identity("a")
  const semanticReceipt = issueRuntimeSemanticReceiptV117({
    request,
    chronicle,
    finalState,
    outcome,
    ledgerPoststateRoot,
    reconstructedTerminalStateHash: identity("d"),
    runtimeViolationEventCount: 0,
    secret: "fixture-only:runtime-service-v1.17:secret",
  })
  const { signature, ...receiptClaims } = semanticReceipt
  const response: RuntimeExecutionServiceSuccessResponseV117 = {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
    ok: true,
    kind: "executionResult",
    requestId: request.requestId,
    matchId: request.matchId,
    result: {
      privacy: "internal_runtime_result",
      chronicle,
      finalState,
      outcome,
      ledgerPoststateRoot,
      runtimeViolationEventCount: 0,
      semanticReceipt,
    },
  }
  return {
    requestBytes: Buffer.from(
      serializeRuntimeExecutionServiceRequestV117(request),
    ),
    responseBytes: Buffer.from(
      serializeRuntimeExecutionServiceResponseV117(response),
    ),
    receiptClaimSha256: sha256Hex(
      encodeRuntimeSemanticReceiptClaimsV117(receiptClaims),
    ),
    receiptSignature: signature,
  }
}

const createV117GeneratedSource = () => {
  const invocation = createV117InvocationArtifacts()
  const service = createV117ServiceArtifacts()
  return renderRuntimeInvocationContractSource(
    sha256Hex(invocation.requestBytes),
    sha256Hex(invocation.responseBytes),
    sha256Hex(service.requestBytes),
    sha256Hex(service.responseBytes),
    service.receiptClaimSha256,
    service.receiptSignature,
  )
}

const verifyImmutableV116 = (root: string): void => {
  const paths = versionPaths(root)
  const requestBytes = readFileSync(paths.v116Request)
  RuntimeExecutionServiceRequestSchema.parse(
    JSON.parse(requestBytes.toString("utf8")),
  )
  const responseBytes = readFileSync(paths.v116Response)
  const recomputedResponse = Buffer.from(createRuntimeExecutionWireGolden(root))
  const parsedResponse = RuntimeExecutionServiceResponseSchema.parse(
    JSON.parse(responseBytes.toString("utf8")),
  )
  if (!parsedResponse.ok) {
    throw new Error("Immutable v1.16 response is not a success receipt")
  }
  const { signature: _signature, ...receiptClaims } =
    parsedResponse.result.semanticReceipt
  if (
    sha256Hex(requestBytes) !== V1_16_REQUEST_SHA256 ||
    sha256Hex(responseBytes) !== V1_16_RESPONSE_SHA256 ||
    !responseBytes.equals(recomputedResponse) ||
    sha256Hex(encodeRuntimeSemanticReceiptClaims(receiptClaims)) !==
      V1_16_SIGNATURE_INPUT_SHA256
  ) {
    throw new Error("Immutable v1.16 runtime execution fixture bytes changed")
  }
  for (const [relative, expected] of Object.entries(V1_16_SOURCE_SHA256)) {
    if (sha256Hex(readFileSync(path.join(root, relative))) !== expected) {
      throw new Error("Immutable v1.16 runtime execution source changed")
    }
  }
  console.log(
    `[GO_PARITY:v1.16] request=${V1_16_REQUEST_SHA256} response=${V1_16_RESPONSE_SHA256} immutable=true`,
  )
}

const writeV117InvocationArtifacts = (root: string): void => {
  const paths = versionPaths(root)
  const artifacts = createV117InvocationArtifacts()
  for (const target of [
    paths.v117InvocationRequest,
    paths.v117InvocationResponse,
    paths.goContract,
  ]) {
    mkdirSync(path.dirname(target), { recursive: true })
  }
  writeFileSync(paths.v117InvocationRequest, artifacts.requestBytes)
  writeFileSync(paths.v117InvocationResponse, artifacts.responseBytes)
  writeFileSync(paths.goContract, createV117GeneratedSource())
}

const writeV117ServiceArtifacts = (root: string): void => {
  const paths = versionPaths(root)
  const artifacts = createV117ServiceArtifacts()
  for (const target of [
    paths.v117ServiceRequest,
    paths.v117ServiceResponse,
    paths.goContract,
  ]) {
    mkdirSync(path.dirname(target), { recursive: true })
  }
  writeFileSync(paths.v117ServiceRequest, artifacts.requestBytes)
  writeFileSync(paths.v117ServiceResponse, artifacts.responseBytes)
  writeFileSync(paths.goContract, createV117GeneratedSource())
}

const verifyV117Artifacts = (
  root: string,
  families: readonly ("invocation" | "service")[],
): void => {
  const paths = versionPaths(root)
  const invocation = createV117InvocationArtifacts()
  const service = createV117ServiceArtifacts()
  const expected = new Map<string, Uint8Array | string>()
  if (families.includes("invocation")) {
    expected.set(paths.v117InvocationRequest, invocation.requestBytes)
    expected.set(paths.v117InvocationResponse, invocation.responseBytes)
  }
  if (families.includes("service")) {
    expected.set(paths.v117ServiceRequest, service.requestBytes)
    expected.set(paths.v117ServiceResponse, service.responseBytes)
  }
  if (families.length > 0)
    expected.set(paths.goContract, createV117GeneratedSource())
  for (const [target, bytes] of expected) {
    if (
      !existsSync(target) ||
      !readFileSync(target).equals(Buffer.from(bytes))
    ) {
      throw new Error(`${path.basename(target)} is stale`)
    }
  }
}

const runtime = {
  abiVersion: "strategy-runtime-abi-v1.14",
  language: { id: "typescript", version: "runtime-js-v1" },
  adapter: {
    id: "runtime-js-worker-thread",
    version: "runtime-js-v1",
  },
  package: { mode: "none", entrypoint: "default" },
  requiredCapabilities: [],
} as const

const runtimeSemantics = {
  languageId: "typescript",
  adapterId: "runtime-js-worker-thread",
  languageLabel: "TypeScript",
  adapterLabel: "runtime-js worker thread",
  readiness: "local-dev-fallback",
  readinessLabel: "Local/dev fallback",
  experimental: false,
  countedPlayEligible: true,
  countedPlayLabel: "Counted eligible",
  countedPlayReason: null,
  sourcePolicyLabel: "Self-contained Strategy source",
  packagePolicyLabel: "No packages",
  docsReference: "runtime/languages",
  examplesReference: "samples/minimal-strategy",
  warnings: [],
  validationIssueCodes: [],
} as const

const PUBLIC_STRATEGY_ID = "strategy:go-parity:sentinel"

const recordGoldenChronicle = () => {
  const execution = MATCH_KERNEL.runMatch(createGoldenMatchInput())
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: MATCH_KERNEL.tupleId,
      semanticTuple: MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return recorded.chronicle
}

const createPublicStrategyCard = (): PublicStrategyCardDto => ({
  strategyId: PUBLIC_STRATEGY_ID,
  strategyRevisionId: "strategy-revision:go-parity:sentinel",
  name: "Go Parity Sentinel",
  description:
    "Public Strategy page fixture generated through @cowards/service.",
  tags: ["parity", "read-only"],
  authorHandle: "go-parity",
  sourceHash: "sha256:go-parity-sentinel",
  sourceBytes: 192,
  runtime,
  runtimeSemantics,
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
  validationStatus: "valid",
  record: {
    wins: 4,
    losses: 2,
    draws: 1,
    points: 13,
  },
  resultLinks: ["/matchsets/match-set:go-parity:golden"],
  replayLinks: ["/matches/golden%3Av1-7%3Amatch/replay"],
})

const createGoldenMatchSetResult = (): PublicMatchSetResultDto => {
  const chronicle = recordGoldenChronicle()
  const metadata = createChronicleMetadata(chronicle)
  return {
    matchSetId: "match-set:go-parity:golden",
    preset: {
      id: "smoke-exhibition-v1",
      version: "v1",
      label: "Smoke exhibition",
    },
    status: "complete",
    visibility: "public",
    scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
    entrants: [
      {
        entrantId: "entrant:bottom",
        entrantIndex: 0,
        strategyRevisionId: "strategy-revision:golden-bottom",
        ownerUserId: "user:bottom",
        ownerHandle: "bottom",
        displayLabel: "@bottom / golden fixture",
        sourceHash: "sourcehash-bottom",
        sourceBytes: 128,
        runtime,
        runtimeSemantics,
        engineCompatibility: {
          spec: "cowards-rules-v1.4",
          engine: "engine-v1",
        },
        lockedAt: "2026-05-22T00:00:00.000Z",
      },
      {
        entrantId: "entrant:top",
        entrantIndex: 1,
        strategyRevisionId: "strategy-revision:golden-top",
        ownerUserId: "user:top",
        ownerHandle: "top",
        displayLabel: "@top / golden fixture",
        sourceHash: "sourcehash-top",
        sourceBytes: 128,
        runtime,
        runtimeSemantics,
        engineCompatibility: {
          spec: "cowards-rules-v1.4",
          engine: "engine-v1",
        },
        lockedAt: "2026-05-22T00:00:00.000Z",
      },
    ],
    standings: [],
    matches: [
      {
        matchId: metadata.matchId,
        entrants: { bottom: "entrant:bottom", top: "entrant:top" },
        status: "complete",
        replayAvailable: true,
        chronicleHash: metadata.hash,
        arenaVariantId: metadata.arenaVariantId,
      },
    ],
    provenance: {
      matchSetId: "match-set:go-parity:golden",
      presetId: "smoke-exhibition-v1",
      scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
      entrantSnapshotIds: ["entrant:bottom", "entrant:top"],
      chronicleHashes: [metadata.hash],
    },
    publication: {
      publicResults: true,
      publicReplayEvidence: true,
      privateFieldsExcluded: [
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
      ],
    },
  }
}

const createDegradedMatchSetResult = (): PublicMatchSetResultDto => ({
  ...createGoldenMatchSetResult(),
  matchSetId: "match-set:go-parity:degraded",
  status: "degraded",
  matches: [
    {
      matchId: "match:go-parity:system-failed",
      entrants: { bottom: "entrant:bottom", top: "entrant:top" },
      status: "failed_system",
      replayAvailable: false,
      publicReason: "system_failure",
      arenaVariantId: "arena:standard",
    },
  ],
  provenance: {
    matchSetId: "match-set:go-parity:degraded",
    presetId: "smoke-exhibition-v1",
    scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
    entrantSnapshotIds: ["entrant:bottom", "entrant:top"],
    chronicleHashes: [],
  },
  metadata: {
    counted: false,
    publicReason: "system_failure",
  },
})

const createParityService = () => {
  const chronicle = recordGoldenChronicle()
  const stored = {
    artifact: chronicle,
    metadata: createChronicleMetadata(chronicle),
  }
  const analyticsSnapshot = createWorkshopAnalyticsDemoSnapshot()

  return {
    service: createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicMatchSetResult: async (_pool, matchSetId) => {
        if (matchSetId === "match-set:go-parity:golden") {
          return createGoldenMatchSetResult()
        }
        if (matchSetId === "match-set:go-parity:degraded") {
          return createDegradedMatchSetResult()
        }
        return null
      },
      createChronicleStore: () => ({
        getByMatchId: async (matchId) =>
          matchId === stored.metadata.matchId ? stored : null,
        put: async () => stored,
      }),
      buildPublicStrategyCard: async (_pool, strategyId) =>
        strategyId === PUBLIC_STRATEGY_ID ? createPublicStrategyCard() : null,
      getAnalyticsSnapshot: async () => analyticsSnapshot,
    }),
    analyticsSnapshot,
    replayMatchId: stored.metadata.matchId,
    stored,
  }
}

const createServiceFixtures = async () => {
  const { service, analyticsSnapshot, replayMatchId, stored } =
    createParityService()
  const analyticsRun =
    analyticsSnapshot.runs.find(
      (candidate) => candidate.id === analyticsSnapshot.selectedRunId,
    ) ?? analyticsSnapshot.runs.at(-1)
  if (!analyticsRun) {
    throw new Error("Workshop analytics demo snapshot did not produce a run")
  }

  const publicMatchSetSummary = await service.getPublicMatchSetSummary(
    "match-set:go-parity:golden",
  )
  const degradedMatchSetSummary = await service.getPublicMatchSetSummary(
    "match-set:go-parity:degraded",
  )
  const publicReplayMetadata =
    await service.getPublicReplayMetadata(replayMatchId)
  const publicReplayEvidence: PublicReplayEvidenceServiceDto = {
    apiVersion: SERVICE_API_VERSION,
    kind: "publicReplayEvidence",
    matchId: stored.metadata.matchId,
    metadata: {
      matchId: stored.metadata.matchId,
      chronicleId: stored.metadata.id,
      hash: stored.metadata.hash,
      schemaVersion: stored.metadata.schemaVersion,
      eventCount: stored.metadata.eventCount,
      snapshotCount: stored.metadata.snapshotCount,
      outcome: stored.metadata.outcome,
      bottomPlayerId: stored.metadata.bottomPlayerId,
      topPlayerId: stored.metadata.topPlayerId,
      arenaVariantId: stored.metadata.arenaVariantId,
    },
    projection: projectPublicChronicle(stored.artifact),
  }
  const publicStrategyPage =
    await service.getPublicStrategyPage(PUBLIC_STRATEGY_ID)
  const analyticsRunSummary = await service.getAnalyticsRunSummary(
    analyticsRun.ownerUserId,
    analyticsRun.id,
  )
  const publicPlayerPage: PublicPlayerPageServiceDto = {
    ...(publicPlayerPageExample as PublicPlayerPageServiceDto),
    canonicalHref: "/players/go-parity",
    payload: {
      ...(publicPlayerPageExample as PublicPlayerPageServiceDto).payload,
      handle: "go-parity",
      displayName: "Go Parity Player",
      strategies: [publicStrategyPage.payload.strategy],
      ladderHistory: [],
      results: [],
    },
  }
  const publicLadderPage: PublicLadderPageServiceDto = {
    ...(publicLadderPageExample as PublicLadderPageServiceDto),
    canonicalHref: "/ladder/ladder-season%3Ademo",
  }

  if (
    !publicMatchSetSummary ||
    !degradedMatchSetSummary ||
    !publicReplayMetadata ||
    !publicReplayEvidence ||
    !publicStrategyPage ||
    !analyticsRunSummary ||
    !publicPlayerPage ||
    !publicLadderPage
  ) {
    throw new Error("TypeScript service did not produce all parity fixtures")
  }
  assertAnalyticsPublicSummaryLeakSafe(analyticsRunSummary.summary)
  return {
    publicPlayerPage: PublicPlayerPageServiceDtoSchema.parse(
      publicPlayerPage,
    ) as PublicPlayerPageServiceDto,
    publicLadderPage: PublicLadderPageServiceDtoSchema.parse(
      publicLadderPage,
    ) as PublicLadderPageServiceDto,
    publicMatchSetSummary,
    degradedMatchSetSummary,
    publicReplayMetadata,
    publicReplayEvidence: PublicReplayEvidenceServiceDtoSchema.parse(
      publicReplayEvidence,
    ) as PublicReplayEvidenceServiceDto,
    publicStrategyPage: PublicStrategyPageServiceDtoSchema.parse(
      publicStrategyPage,
    ) as PublicStrategyPageServiceDto,
    analyticsRunSummary: AnalyticsRunSummaryServiceDtoSchema.parse(
      analyticsRunSummary,
    ) as AnalyticsRunSummaryServiceDto,
  }
}

const routeManifest = [
  {
    id: SERVICE_API_ROUTES.health.id,
    method: SERVICE_API_ROUTES.health.method,
    path: SERVICE_API_ROUTES.health.path,
    authScope: SERVICE_API_ROUTES.health.authScope,
    privacyClass: SERVICE_API_ROUTES.health.privacyClass,
    samplePath: "/health",
  },
  {
    id: SERVICE_API_ROUTES.getPublicPlayerPage.id,
    method: SERVICE_API_ROUTES.getPublicPlayerPage.method,
    path: SERVICE_API_ROUTES.getPublicPlayerPage.path,
    authScope: SERVICE_API_ROUTES.getPublicPlayerPage.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicPlayerPage.privacyClass,
    samplePath: "/public/players/go-parity",
  },
  {
    id: SERVICE_API_ROUTES.getPublicLadderSeason.id,
    method: SERVICE_API_ROUTES.getPublicLadderSeason.method,
    path: SERVICE_API_ROUTES.getPublicLadderSeason.path,
    authScope: SERVICE_API_ROUTES.getPublicLadderSeason.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicLadderSeason.privacyClass,
    samplePath: "/public/ladders/ladder-season%3Ademo",
  },
  {
    id: SERVICE_API_ROUTES.getPublicMatchSetSummary.id,
    method: SERVICE_API_ROUTES.getPublicMatchSetSummary.method,
    path: SERVICE_API_ROUTES.getPublicMatchSetSummary.path,
    authScope: SERVICE_API_ROUTES.getPublicMatchSetSummary.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicMatchSetSummary.privacyClass,
    samplePath: "/public/matchsets/match-set%3Ago-parity%3Agolden/summary",
  },
  {
    id: SERVICE_API_ROUTES.getPublicReplayMetadata.id,
    method: SERVICE_API_ROUTES.getPublicReplayMetadata.method,
    path: SERVICE_API_ROUTES.getPublicReplayMetadata.path,
    authScope: SERVICE_API_ROUTES.getPublicReplayMetadata.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicReplayMetadata.privacyClass,
    samplePath: "/public/replays/golden%3Av1-7%3Amatch/metadata",
  },
  {
    id: SERVICE_API_ROUTES.getPublicReplayEvidence.id,
    method: SERVICE_API_ROUTES.getPublicReplayEvidence.method,
    path: SERVICE_API_ROUTES.getPublicReplayEvidence.path,
    authScope: SERVICE_API_ROUTES.getPublicReplayEvidence.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicReplayEvidence.privacyClass,
    samplePath: "/public/replays/golden%3Av1-7%3Amatch/evidence",
  },
  {
    id: SERVICE_API_ROUTES.getPublicStrategyPage.id,
    method: SERVICE_API_ROUTES.getPublicStrategyPage.method,
    path: SERVICE_API_ROUTES.getPublicStrategyPage.path,
    authScope: SERVICE_API_ROUTES.getPublicStrategyPage.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicStrategyPage.privacyClass,
    samplePath: "/public/strategies/strategy%3Ago-parity%3Asentinel",
  },
  {
    id: SERVICE_API_ROUTES.getAnalyticsRunSummary.id,
    method: SERVICE_API_ROUTES.getAnalyticsRunSummary.method,
    path: SERVICE_API_ROUTES.getAnalyticsRunSummary.path,
    authScope: SERVICE_API_ROUTES.getAnalyticsRunSummary.authScope,
    privacyClass: SERVICE_API_ROUTES.getAnalyticsRunSummary.privacyClass,
    samplePath:
      "/analytics/runs/analytics-run%3Aworkshop-v1.6-demo%3A2/summary",
    requiresBearerToken: true,
  },
] as const

const notFoundError: ServiceErrorDto = {
  code: "NOT_FOUND",
  message: "Resource not found.",
  status: 404,
  publicSafe: true,
}

const forbiddenError: ServiceErrorDto = {
  code: "FORBIDDEN",
  message: "Owner authorization required.",
  status: 403,
  publicSafe: true,
}

const runServiceFixtureGenerator = async (
  checkMode: boolean,
): Promise<void> => {
  const serviceFixtures = await createServiceFixtures()
  const serviceFixturePayloads = {
    "health.json": ServiceHealthDtoSchema.parse(serviceHealthExample),
    "public-player-page.json": serviceFixtures.publicPlayerPage,
    "public-ladder-page.json": serviceFixtures.publicLadderPage,
    "public-match-set-summary.json":
      PublicMatchSetSummaryServiceDtoSchema.parse(
        serviceFixtures.publicMatchSetSummary,
      ),
    "degraded-match-set-summary.json":
      PublicMatchSetSummaryServiceDtoSchema.parse(
        serviceFixtures.degradedMatchSetSummary,
      ),
    "public-replay-metadata.json": PublicReplayMetadataServiceDtoSchema.parse(
      serviceFixtures.publicReplayMetadata,
    ),
    "public-replay-evidence.json": PublicReplayEvidenceServiceDtoSchema.parse(
      serviceFixtures.publicReplayEvidence,
    ),
    "public-strategy-page.json": serviceFixtures.publicStrategyPage,
    "analytics-run-summary.json": serviceFixtures.analyticsRunSummary,
    "not-found-error.json": ServiceErrorDtoSchema.parse(notFoundError),
    "forbidden-error.json": ServiceErrorDtoSchema.parse(forbiddenError),
    "route-manifest.json": routeManifest,
  } as const

  const hashFixture = (value: unknown): string =>
    `sha256:${createHash("sha256").update(withTrailingNewline(value)).digest("hex")}`

  const fixtureManifest = {
    schemaVersion: "go-parity-fixtures-v1.8",
    files: Object.fromEntries(
      Object.entries(serviceFixturePayloads)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([fileName, value]) => [fileName, hashFixture(value)]),
    ),
  } as const

  const goChecksumEntries = Object.entries(fixtureManifest.files)
  const goChecksumKeyWidth = Math.max(
    ...goChecksumEntries.map(([fileName]) => JSON.stringify(fileName).length),
  )
  const goChecksumSource = `${[
    "// Code generated by scripts/generate-go-parity-fixtures.ts; DO NOT EDIT.",
    "package main",
    "",
    "var expectedFixtureChecksumManifest = fixtureChecksumManifest{",
    `\tSchemaVersion: ${JSON.stringify(fixtureManifest.schemaVersion)},`,
    "\tFiles: map[string]string{",
    ...goChecksumEntries.map(
      ([fileName, checksum]) =>
        `\t\t${JSON.stringify(fileName).padEnd(goChecksumKeyWidth)}: ${JSON.stringify(checksum)},`,
    ),
    "\t},",
    "}",
  ].join("\n")}\n`

  const fixtures = {
    ...serviceFixturePayloads,
    "fixture-manifest.json": fixtureManifest,
  } as const

  for (const [fileName, value] of Object.entries(fixtures)) {
    if (
      fileName === "route-manifest.json" ||
      fileName === "fixture-manifest.json"
    ) {
      continue
    }
    assertPublicServiceDtoLeakSafe(value)
  }

  mkdirSync(fixtureDir, { recursive: true })

  let stale = false
  for (const [fileName, value] of Object.entries(fixtures)) {
    const target = path.join(fixtureDir, fileName)
    const next = withTrailingNewline(value)
    if (checkMode) {
      let current = ""
      try {
        current = readFileSync(target, "utf8")
      } catch {
        stale = true
        continue
      }
      if (current !== next) {
        stale = true
      }
      continue
    }
    writeFileSync(target, next)
  }

  if (checkMode) {
    let current = ""
    try {
      current = readFileSync(goChecksumSourcePath, "utf8")
    } catch {
      stale = true
    }
    if (current !== goChecksumSource) {
      stale = true
    }
  } else {
    writeFileSync(goChecksumSourcePath, goChecksumSource)
  }

  if (stale) {
    throw new Error(staleMessage)
  }
}

export const main = async (args = process.argv.slice(2)): Promise<void> => {
  if (args.includes("--write-v1.16")) {
    throw new Error("Refusing to rewrite immutable v1.16 artifacts")
  }
  const hasRoot = args.includes("--root")
  const rootIndex = args.indexOf("--root")
  if (hasRoot && (rootIndex < 0 || !args[rootIndex + 1])) {
    throw new Error("--root requires a path")
  }
  const root = hasRoot ? path.resolve(args[rootIndex + 1]!) : repoRoot
  const versionsOnly = args.includes("--versions-only")
  const writeV117Invocation = args.includes("--write-v1.17-invocation")
  const writeV117Service = args.includes("--write-v1.17-service")
  const checkMode = args.includes("--check")
  const historicalV116Only = args.includes("--historical-v1.16-only")

  verifyImmutableV116(root)
  if (writeV117Invocation) writeV117InvocationArtifacts(root)
  if (writeV117Service) writeV117ServiceArtifacts(root)
  const requireAllV117 =
    checkMode &&
    !historicalV116Only &&
    !writeV117Invocation &&
    !writeV117Service
  const families = [
    ...(requireAllV117 ||
    writeV117Invocation ||
    existsSync(versionPaths(root).v117InvocationRequest)
      ? (["invocation"] as const)
      : []),
    ...(requireAllV117 ||
    writeV117Service ||
    existsSync(versionPaths(root).v117ServiceRequest)
      ? (["service"] as const)
      : []),
  ]
  verifyV117Artifacts(root, families)
  if (!versionsOnly) await runServiceFixtureGenerator(checkMode)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
