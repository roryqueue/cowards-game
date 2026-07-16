#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
/* eslint-disable no-restricted-imports -- this repo-root evaluator verifies package-internal authorities directly. */
import {
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  inspectRuntimeEvidenceAuthorityBundleV117,
} from "../packages/spec/src/runtime-evidence-authority-bundle.js"
import {
  encodeCanonicalJson,
  parseCanonicalJson,
} from "../packages/spec/src/canonical-json.js"
import {
  RUNTIME_ABI_V1_17,
  renderRuntimeAbiV117ContractJson,
  validateRuntimeAbiV117Contract,
} from "../packages/spec/src/runtime-abi-v1-17.js"
import {
  RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
  validateRuntimeBudgetCapabilitiesV117,
} from "../packages/spec/src/runtime-budget-capabilities-v1-17.js"
import { RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17 } from "../packages/spec/src/runtime-evidence-attestation-v1-17.js"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
} from "../packages/spec/src/runtime-evidence-v1-17.js"
import {
  RuntimeExecutionServiceRequestV117Schema,
  RuntimeExecutionServiceResponseV117Schema,
  encodeRuntimeSemanticReceiptClaimsV117,
  serializeRuntimeExecutionServiceRequestV117,
  serializeRuntimeExecutionServiceResponseV117,
} from "../packages/spec/src/runtime-execution-service-v1-17.js"
import {
  HistoricalRuntimeExecutionServiceRequestV116Schema,
  HistoricalRuntimeExecutionServiceResponseV116Schema,
} from "../packages/spec/src/runtime-execution-service-v1-16-compat.js"
import {
  classifyRuntimeInvocationV117,
  type RuntimeInvocationTraceV117,
} from "../packages/spec/src/runtime-invocation-v1-17.js"
import { isRuntimeAbiV117InvocationResult } from "../packages/spec/src/runtime-abi-v1-17.js"
import {
  buildTypeScriptRequestSourceIdentityV117,
  buildTypeScriptSourceIdentityV117,
} from "../packages/runtime-js/src/source-artifact.js"
import {
  buildPythonRequestSourceIdentityV117,
  buildPythonSourceIdentityV117,
} from "../packages/runtime-python/src/validation.js"
import {
  buildWasmWasiRequestSourceIdentityV117,
  buildWasmWasiSourceIdentityV117,
} from "../packages/runtime-wasm-wasi/src/validation.js"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.js"
/* eslint-enable no-restricted-imports */
import {
  IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
  verifyImmutableRuntimeServiceV116Digests,
} from "./check-v1-37-runtime-abi-manifest-closure.js"
import {
  RUNTIME_ABI_TEST_MANIFEST_PATH,
  RUNTIME_ABI_TEST_RECEIPT_PATH,
  parseRuntimeAbiTestManifest,
  parseRuntimeAbiTestReceipt,
  type RuntimeAbiTestReceipt,
} from "./run-v1-37-runtime-abi-test-manifest.js"

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const sha256 = (bytes: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const fail = (detail: string): never => {
  throw new TypeError(`runtime ABI v1.17 evaluator: ${detail}`)
}

const frame = (value: Uint8Array): Buffer => {
  const length = Buffer.alloc(8)
  length.writeBigUInt64BE(BigInt(value.byteLength))
  return Buffer.concat([length, Buffer.from(value)])
}

const exactJson = (root: string, relativePath: string): unknown =>
  JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as unknown

interface CanonicalCorpusVector {
  id: string
  context:
    | "decoded-strategy-payload"
    | "authenticated-outer-envelope"
    | "canonical-manifest"
    | "host-api-value"
  operation: "parse-and-canonicalize" | "require-canonical" | "host-encode"
  rawPath: string
  rawByteLength: number
  rawSha256: string
  limits: {
    rawUtf8Bytes: number
    depth: number
    nodes: number
    decodedStringUtf8Bytes: number
    arrayEntries: number
    objectEntries: number
  }
  expectation:
    | {
        kind: "success"
        canonicalPath: string
        canonicalByteLength: number
        canonicalSha256: string
      }
    | {
        kind: "error"
        code: string
        path: readonly (string | number)[]
        byteOffset: number
        owner: "player_violation" | "system_failure"
      }
}

interface CanonicalCorpus {
  schemaVersion: string
  vectorRootDomain: string
  vectorRootSha256: string
  vectorCount: number
  vectors: readonly CanonicalCorpusVector[]
}

export interface V137CanonicalJsonGate {
  id: "canonical-json-corpus"
  status: "passed"
  vectorCount: number
  vectorRootSha256: `sha256:${string}`
  successCount: number
  rejectionCount: number
}

export const evaluateV137CanonicalJsonCorpus = (
  root: string = defaultRepoRoot,
): V137CanonicalJsonGate => {
  const corpus = exactJson(
    root,
    "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json",
  ) as CanonicalCorpus
  if (
    corpus.schemaVersion !== "canonical-json-v1.1-corpus-v1" ||
    !Array.isArray(corpus.vectors) ||
    corpus.vectors.length === 0 ||
    corpus.vectors.length !== corpus.vectorCount ||
    !/^[0-9a-f]{64}$/u.test(corpus.vectorRootSha256)
  ) {
    return fail("canonical JSON corpus index is malformed")
  }
  const rootHash = createHash("sha256")
  rootHash.update(frame(Buffer.from(corpus.vectorRootDomain, "utf8")))
  let previousId = ""
  let successCount = 0
  let rejectionCount = 0
  for (const vector of corpus.vectors) {
    if (vector.id <= previousId) return fail("canonical corpus order drifted")
    previousId = vector.id
    const raw = readFileSync(path.join(root, vector.rawPath))
    if (
      raw.byteLength !== vector.rawByteLength ||
      sha256(raw).slice("sha256:".length) !== vector.rawSha256
    ) {
      return fail(`canonical corpus raw bytes drifted: ${vector.id}`)
    }
    rootHash.update(frame(Buffer.from(vector.id, "utf8")))
    rootHash.update(frame(raw))
    if (vector.expectation.kind === "success") {
      successCount += 1
      if (vector.operation === "host-encode") {
        return fail(`canonical success used host-encode: ${vector.id}`)
      }
      const parsed = parseCanonicalJson(raw, {
        context: vector.context,
        operation: vector.operation,
        limits: vector.limits,
      })
      if (!parsed.ok) return fail(`canonical success rejected: ${vector.id}`)
      const encoded = encodeCanonicalJson(parsed.value, {
        context: vector.context,
        limits: vector.limits,
      })
      const canonical = readFileSync(
        path.join(root, vector.expectation.canonicalPath),
      )
      if (
        !encoded.ok ||
        encoded.bytes.byteLength !== vector.expectation.canonicalByteLength ||
        sha256(encoded.bytes).slice("sha256:".length) !==
          vector.expectation.canonicalSha256 ||
        !Buffer.from(encoded.bytes).equals(canonical)
      ) {
        return fail(`canonical success bytes drifted: ${vector.id}`)
      }
      continue
    }
    rejectionCount += 1
    const { kind: _kind, ...expectedError } = vector.expectation
    const received =
      vector.operation === "host-encode"
        ? encodeCanonicalJson(
            vector.id === "number-host-nan"
              ? Number.NaN
              : vector.id === "number-host-positive-infinity"
                ? Number.POSITIVE_INFINITY
                : Number.NEGATIVE_INFINITY,
            { context: vector.context, limits: vector.limits },
          )
        : parseCanonicalJson(raw, {
            context: vector.context,
            operation: vector.operation,
            limits: vector.limits,
          })
    if (
      received.ok ||
      JSON.stringify(received.error) !== JSON.stringify(expectedError)
    ) {
      return fail(`canonical rejection drifted: ${vector.id}`)
    }
  }
  const observedRoot = rootHash.digest("hex")
  if (observedRoot !== corpus.vectorRootSha256) {
    return fail("canonical corpus root drifted")
  }
  return {
    id: "canonical-json-corpus",
    status: "passed",
    vectorCount: corpus.vectorCount,
    vectorRootSha256: `sha256:${observedRoot}`,
    successCount,
    rejectionCount,
  }
}

export const evaluateV137OutcomeSemantics = () => {
  const digest = `sha256:${"a".repeat(64)}` as const
  const trace: RuntimeInvocationTraceV117 = {
    requestId: "request:evaluator",
    invocationId: "invocation:evaluator",
    kernelRequestId: "kernel-request:evaluator",
    method: "soldierBrain",
    requestSha256: digest,
    budgetProfileSha256: digest,
    inputSha256: digest,
    retryIdentitySha256: digest,
    accountingIdentitySha256: digest,
    idempotencyKeySha256: digest,
    safeCodes: [],
  }
  const proposedValue = { action: { type: "TURN_TO_STONE" }, memory: { n: 2 } }
  const results = [
    classifyRuntimeInvocationV117("success", trace, proposedValue),
    classifyRuntimeInvocationV117(
      "strategy_exception_proven",
      trace,
      proposedValue,
    ),
    classifyRuntimeInvocationV117("adapter_crash", trace, proposedValue),
  ]
  const ambiguous = classifyRuntimeInvocationV117(
    "strategy_exhaustion_ambiguous",
    trace,
    proposedValue,
  )
  if (
    !results.every(isRuntimeAbiV117InvocationResult) ||
    results.map(({ kind }) => kind).join("|") !==
      "success|player_violation|system_failure" ||
    "value" in results[1]! ||
    "value" in results[2]! ||
    ambiguous.kind !== "system_failure"
  ) {
    return fail("exclusive failure ownership drifted")
  }
  return {
    id: "exclusive-outcome-no-mutation" as const,
    status: "passed" as const,
    variants: ["success", "player_violation", "system_failure"] as const,
    playerViolationDiscardsProposedValue: true as const,
    systemFailureCarriesNoProposedValue: true as const,
    ambiguousAttributionIsSystemFailure: true as const,
  }
}

export const evaluateV137RuntimeBudgets = (root: string = defaultRepoRoot) => {
  const contractErrors = validateRuntimeAbiV117Contract()
  if (contractErrors.length > 0) {
    return fail(`runtime contract invalid: ${contractErrors.join("; ")}`)
  }
  const committedContract = readFileSync(
    path.join(root, "packages/spec/artifacts/runtime-abi-v1.17-contract.json"),
    "utf8",
  )
  if (committedContract !== renderRuntimeAbiV117ContractJson()) {
    return fail("runtime contract artifact is stale")
  }
  const capabilityArtifact = exactJson(
    root,
    "packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json",
  )
  const capabilityFindings =
    validateRuntimeBudgetCapabilitiesV117(capabilityArtifact)
  if (capabilityFindings.length > 0) {
    return fail("runtime budget capability artifact is stale or malformed")
  }
  const artifact = capabilityArtifact as {
    dimensions: readonly unknown[]
    identityPins: readonly unknown[]
    lanes: readonly unknown[]
    policy: {
      countedEligibleLaneIds: readonly unknown[]
      productionTrustedProducers: readonly unknown[]
      phase259ConformanceRequired: boolean
    }
  }
  if (
    artifact.dimensions.length !==
      RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17.dimensions.length ||
    artifact.identityPins.length !==
      RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17.identityPins.length ||
    artifact.policy.countedEligibleLaneIds.length !== 0 ||
    artifact.policy.productionTrustedProducers.length !== 0 ||
    artifact.policy.phase259ConformanceRequired !== true
  ) {
    return fail("runtime budget certification posture drifted")
  }
  return {
    id: "runtime-budget-contract" as const,
    status: "passed" as const,
    dimensionCount: artifact.dimensions.length,
    exactPinCount: artifact.identityPins.length,
    laneCount: artifact.lanes.length,
    countedEligibleLaneCount: artifact.policy.countedEligibleLaneIds.length,
    productionTrustedProducerCount:
      artifact.policy.productionTrustedProducers.length,
    phase259ConformanceRequired: true as const,
  }
}

export const evaluateV137SourceIdentity = () => {
  const synthetic = "alpha\r\nbeta\rcharlie\n"
  const typescript = buildTypeScriptSourceIdentityV117(synthetic)
  const python = buildPythonSourceIdentityV117(synthetic)
  const wasm = buildWasmWasiSourceIdentityV117(synthetic)
  const requestIdentities = [
    buildTypeScriptRequestSourceIdentityV117(synthetic),
    buildPythonRequestSourceIdentityV117(synthetic),
    buildWasmWasiRequestSourceIdentityV117(synthetic),
  ]
  const artifactIdentities = [typescript, python, wasm]
  if (
    artifactIdentities.some(
      (identity) =>
        identity.normalizationPolicy !== "source-line-endings-lf-v1.17" ||
        identity.lineEndings.kind !== "mixed" ||
        identity.originalSourceSha256 === identity.normalizedSourceSha256,
    ) ||
    new Set(artifactIdentities.map((identity) => identity.originalSourceSha256))
      .size !== 1 ||
    new Set(
      artifactIdentities.map((identity) => identity.normalizedSourceSha256),
    ).size !== 1 ||
    new Set(
      requestIdentities.map(
        (identity) =>
          `${identity.originalSourceSha256}|${identity.normalizedSourceSha256}`,
      ),
    ).size !== 1
  ) {
    return fail("language-neutral source identity drifted")
  }
  return {
    id: "source-normalization-identity" as const,
    status: "passed" as const,
    languages: ["typescript", "python", "rust", "zig"] as const,
    normalizationPolicy: "source-line-endings-lf-v1.17" as const,
    lineEndingKind: "mixed" as const,
    originalAndNormalizedAreDistinct: true as const,
    languageNeutralRequestIdentity: true as const,
    domainFramedArtifactIdentity: true as const,
  }
}

export const evaluateV137EvidenceDag = (root: string = defaultRepoRoot) => {
  if (
    RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.length !== 15 ||
    new Set(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17).size !== 15 ||
    RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.length !== 26 ||
    new Set(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.map(({ kind }) => kind)).size !==
      26 ||
    RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.length !== 10 ||
    !RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.includes("evidenceBundle") ||
    RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17.length !== 0
  ) {
    return fail("runtime evidence DAG authority drifted")
  }
  const fixture = exactJson(
    root,
    "packages/spec/artifacts/runtime-successor-authority-v1.17.fixture.json",
  ) as {
    schemaVersion: string
    nonProduction: boolean
    installFixture: {
      envelopeBytesBase64: string
      evaluationInstant: string
      publicKeyPem: string
      signerKeyId: string
      trustDomain: string
      expected: {
        authorityBundleHash: string
        envelopeSha256: string
        attestationIds: readonly string[]
        certificateIds: readonly string[]
      }
    }
  }
  if (
    fixture.schemaVersion !== "runtime-successor-authority-fixture-v1.17" ||
    fixture.nonProduction !== true ||
    fixture.installFixture.trustDomain !==
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
  ) {
    return fail("managed successor authority fixture is malformed")
  }
  const envelopeBytes = Buffer.from(
    fixture.installFixture.envelopeBytesBase64,
    "base64",
  )
  const inspected = inspectRuntimeEvidenceAuthorityBundleV117(envelopeBytes, {
    expectedTrustDomain: fixture.installFixture.trustDomain,
    evaluationInstant: fixture.installFixture.evaluationInstant,
    trustedKeyIds: [fixture.installFixture.signerKeyId],
    verifySignature: ({ signedMessageBytes, signature }) =>
      verifySignature(
        null,
        signedMessageBytes,
        fixture.installFixture.publicKeyPem,
        signature,
      ),
  })
  const attestationIds = inspected.payload.attestations
    .map(({ attestationId }) => attestationId)
    .sort()
  const certificateIds = inspected.payload.certificates
    .map(({ certificateId }) => certificateId)
    .sort()
  const evidenceRoots = new Set(
    inspected.payload.attestations.map(
      ({ binding }) => binding.evidenceGraphRoot,
    ),
  )
  if (
    inspected.payloadSha256 !==
      fixture.installFixture.expected.authorityBundleHash ||
    JSON.stringify(attestationIds) !==
      JSON.stringify(fixture.installFixture.expected.attestationIds) ||
    JSON.stringify(certificateIds) !==
      JSON.stringify(fixture.installFixture.expected.certificateIds) ||
    inspected.payload.attestations.some(
      ({ managedIdentity, binding }) =>
        !managedIdentity ||
        binding.graphSchemaVersion !== "runtime-evidence-graph-v1.17" ||
        binding.graphProfile !== "runtime-identity-evidence-dag-v1" ||
        binding.exactPins.length !== 10,
    ) ||
    evidenceRoots.size !== 2
  ) {
    return fail("managed successor authority roots drifted")
  }
  return {
    id: "exact-runtime-evidence-dag" as const,
    status: "passed" as const,
    nodeCount: RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.length,
    edgeCount: RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.length,
    exactPinCount: RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.length,
    rootKind: "evidenceBundle" as const,
    productionTrustedProducerCount:
      RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17.length,
    verifiedManagedAttestationCount: inspected.payload.attestations.length,
    verifiedCertificateCount: inspected.payload.certificates.length,
    verifiedEvidenceRootCount: evidenceRoots.size,
  }
}

export const evaluateV137HistoricalV116 = (root: string = defaultRepoRoot) => {
  verifyImmutableRuntimeServiceV116Digests((relativePath) =>
    readFileSync(path.join(root, relativePath)),
  )
  const request = HistoricalRuntimeExecutionServiceRequestV116Schema.parse(
    exactJson(
      root,
      "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
    ),
  )
  const response = HistoricalRuntimeExecutionServiceResponseV116Schema.parse(
    exactJson(
      root,
      "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
    ),
  )
  if (
    request.contractVersion !== "runtime-execution-service-v1.16" ||
    !response.ok ||
    response.result.semanticReceipt.schemaVersion !==
      "runtime-semantic-receipt-v1"
  ) {
    return fail("historical v1.16 dispatch drifted")
  }
  return {
    id: "historical-v1.16-dispatch" as const,
    status: "passed" as const,
    runtimeService: "runtime-execution-service-v1.16" as const,
    semanticReceipt: "runtime-semantic-receipt-v1" as const,
    protectedDigestCount: Object.keys(IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS)
      .length,
  }
}

const goDescriptor = (source: string) => {
  const start = source.indexOf('case "runtime-execution-service-v1.17":')
  if (start < 0) return fail("Go v1.17 descriptor is missing")
  const block = source.slice(start, start + 1_500)
  const value = (field: string): string => {
    const match = new RegExp(`${field}:\\s+"([^"]+)"`, "u").exec(block)
    return match?.[1] ?? fail(`Go v1.17 descriptor omitted ${field}`)
  }
  return {
    contractVersion: value("ContractVersion"),
    requestSha256: value("RequestSHA256"),
    responseSha256: value("ResponseSHA256"),
    receiptClaimSha256: value("ReceiptClaimSHA256"),
    current:
      /Current:\s+selectedRuntimeServiceContractVersion\(\)\s+==\s+runtimeExecutionServiceVersionV117/u.test(
        block,
      ),
  }
}

export const evaluateV137TypescriptGoParity = (
  root: string = defaultRepoRoot,
) => {
  const requestPath =
    "packages/spec/artifacts/runtime-execution-service-request.v1.17.json"
  const responsePath =
    "packages/spec/artifacts/runtime-execution-service-response.v1.17.wire.json"
  const requestBytes = readFileSync(path.join(root, requestPath))
  const responseBytes = readFileSync(path.join(root, responsePath))
  const candidateRequest = readFileSync(
    path.join(
      root,
      "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
    ),
  )
  const candidateResponse = readFileSync(
    path.join(
      root,
      "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
    ),
  )
  const request = RuntimeExecutionServiceRequestV117Schema.parse(
    JSON.parse(requestBytes.toString("utf8")) as unknown,
  )
  const response = RuntimeExecutionServiceResponseV117Schema.parse(
    JSON.parse(responseBytes.toString("utf8")) as unknown,
  )
  if (!response.ok) return fail("v1.17 parity response is not success")
  const { signature: _signature, ...claims } = response.result.semanticReceipt
  const requestDigest = sha256(requestBytes)
  const responseDigest = sha256(responseBytes)
  const claimDigest = sha256(encodeRuntimeSemanticReceiptClaimsV117(claims))
  const descriptor = goDescriptor(
    readFileSync(
      path.join(root, "apps/go-backend/runtime_execution_contract_gen.go"),
      "utf8",
    ),
  )
  if (
    !requestBytes.equals(candidateRequest) ||
    !responseBytes.equals(candidateResponse) ||
    !Buffer.from(serializeRuntimeExecutionServiceRequestV117(request)).equals(
      requestBytes,
    ) ||
    !Buffer.from(serializeRuntimeExecutionServiceResponseV117(response)).equals(
      responseBytes,
    ) ||
    descriptor.contractVersion !== "runtime-execution-service-v1.17" ||
    descriptor.requestSha256 !== requestDigest.slice("sha256:".length) ||
    descriptor.responseSha256 !== responseDigest.slice("sha256:".length) ||
    descriptor.receiptClaimSha256 !== claimDigest.slice("sha256:".length) ||
    !descriptor.current
  ) {
    return fail("TypeScript and Go v1.17 wire parity drifted")
  }
  return {
    id: "typescript-go-v1.17-wire-parity" as const,
    status: "passed" as const,
    runtimeService: "runtime-execution-service-v1.17" as const,
    requestSha256: requestDigest,
    responseSha256: responseDigest,
    receiptClaimSha256: claimDigest,
    currentDescriptor: true as const,
  }
}

export type V137RuntimeAbiGate =
  | ReturnType<typeof evaluateV137CanonicalJsonCorpus>
  | ReturnType<typeof evaluateV137OutcomeSemantics>
  | ReturnType<typeof evaluateV137RuntimeBudgets>
  | ReturnType<typeof evaluateV137SourceIdentity>
  | ReturnType<typeof evaluateV137EvidenceDag>
  | ReturnType<typeof evaluateV137HistoricalV116>
  | ReturnType<typeof evaluateV137TypescriptGoParity>

export const V137_RUNTIME_ABI_NO_MUTATION_EVIDENCE_COMMAND_IDS = Object.freeze([
  "phase258.service-and-engine",
  "phase258.database",
  "phase258.go.mixed-fails-closed",
  "phase258.full-engine-compatibility",
] as const)

export interface V137RuntimeAbiTestReceiptSummary {
  stage: "postactivation"
  testManifestSha256: `sha256:${string}`
  selectedCommandCount: number
  passedCount: number
  skippedCount: 0
  databaseCommandCount: number
  passedCommandIds: readonly string[]
}

export const summarizeV137RuntimeAbiTestReceipt = (
  receipt: RuntimeAbiTestReceipt,
): V137RuntimeAbiTestReceiptSummary => {
  if (
    receipt.stage !== "postactivation" ||
    receipt.selectedCommandCount !== receipt.results.length ||
    receipt.results.some(
      ({ status, skippedCount, databaseRequired, databaseObserved }) =>
        status !== "PASS" ||
        skippedCount !== 0 ||
        databaseRequired !== databaseObserved,
    )
  ) {
    return fail("postactivation test receipt is incomplete")
  }
  return {
    stage: "postactivation",
    testManifestSha256: receipt.testManifestSha256,
    selectedCommandCount: receipt.selectedCommandCount,
    passedCount: receipt.results.reduce(
      (total, result) => total + result.passedCount,
      0,
    ),
    skippedCount: 0,
    databaseCommandCount: receipt.results.filter(
      ({ databaseRequired }) => databaseRequired,
    ).length,
    passedCommandIds: receipt.results.map(({ id }) => id),
  }
}

export const evaluateV137RuntimeAbiTestReceipt = (
  root: string = defaultRepoRoot,
): V137RuntimeAbiTestReceiptSummary => {
  const manifestBytes = readFileSync(
    path.join(root, RUNTIME_ABI_TEST_MANIFEST_PATH),
  )
  const manifest = parseRuntimeAbiTestManifest(
    JSON.parse(manifestBytes.toString("utf8")) as unknown,
  )
  const receipt = parseRuntimeAbiTestReceipt(
    exactJson(root, RUNTIME_ABI_TEST_RECEIPT_PATH),
    {
      manifestBytes,
      manifest,
      requiredStage: "postactivation",
    },
  )
  return summarizeV137RuntimeAbiTestReceipt(receipt)
}

export interface V137RuntimeAbiValidation {
  schemaVersion: "runtime-abi-v1.17-validation-v1"
  milestone: "v1.37"
  phase: 258
  status: "passed"
  posture: "activated-uncertified-pending-phase-259-conformance"
  activation: {
    activationCommit: string
    activationPathCount: number
    manifestStatus: "verified"
  }
  current: {
    runtimeAbi: "strategy-runtime-abi-v1.17"
    runtimeService: "runtime-execution-service-v1.17"
    semanticReceipt: "runtime-semantic-receipt-v1.17"
    canonicalJson: "canonical-json-v1.1"
    productionTrustedProducerCount: 0
    countedEligibleLaneCount: 0
  }
  testReceipt: {
    stage: "postactivation"
    testManifestSha256: `sha256:${string}`
    selectedCommandCount: number
    passedCount: number
    skippedCount: 0
    databaseCommandCount: number
  }
  noMutationEvidenceCommandIds: readonly string[]
  requirements: readonly {
    id:
      | "RABI-01"
      | "RABI-02"
      | "RABI-03"
      | "RABI-04"
      | "RABI-05"
      | "RABI-06"
      | "RABI-07"
      | "RABI-08"
    status: "proved"
  }[]
  gates: readonly V137RuntimeAbiGate[]
  limitations: readonly string[]
}

const expectedGateIds = [
  "canonical-json-corpus",
  "exclusive-outcome-no-mutation",
  "runtime-budget-contract",
  "source-normalization-identity",
  "exact-runtime-evidence-dag",
  "historical-v1.16-dispatch",
  "typescript-go-v1.17-wire-parity",
] as const

export const createV137RuntimeAbiValidation = (input: {
  activation: {
    activationCommit: string
    activationPathCount: number
  }
  testReceipt: {
    stage: string
    testManifestSha256: string
    selectedCommandCount: number
    passedCount: number
    skippedCount: number
    databaseCommandCount: number
    passedCommandIds: readonly string[]
  }
  gates: readonly V137RuntimeAbiGate[]
}): V137RuntimeAbiValidation => {
  const gateIds = input.gates.map(({ id }) => id)
  const budgetGate = input.gates.find(
    (gate): gate is ReturnType<typeof evaluateV137RuntimeBudgets> =>
      gate.id === "runtime-budget-contract",
  )
  if (
    !/^[0-9a-f]{40}$/u.test(input.activation.activationCommit) ||
    !Number.isSafeInteger(input.activation.activationPathCount) ||
    input.activation.activationPathCount <= 0 ||
    input.testReceipt.stage !== "postactivation" ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.testReceipt.testManifestSha256) ||
    !Number.isSafeInteger(input.testReceipt.selectedCommandCount) ||
    input.testReceipt.selectedCommandCount <= 0 ||
    !Number.isSafeInteger(input.testReceipt.passedCount) ||
    input.testReceipt.passedCount < input.testReceipt.selectedCommandCount ||
    input.testReceipt.skippedCount !== 0 ||
    !Number.isSafeInteger(input.testReceipt.databaseCommandCount) ||
    input.testReceipt.databaseCommandCount <= 0 ||
    gateIds.join("|") !== expectedGateIds.join("|") ||
    new Set(gateIds).size !== expectedGateIds.length ||
    input.gates.some(({ status }) => status !== "passed") ||
    budgetGate === undefined ||
    budgetGate.countedEligibleLaneCount !== 0 ||
    budgetGate.productionTrustedProducerCount !== 0 ||
    V137_RUNTIME_ABI_NO_MUTATION_EVIDENCE_COMMAND_IDS.some(
      (id) => !input.testReceipt.passedCommandIds.includes(id),
    )
  ) {
    return fail("integrated validation evidence is incomplete")
  }
  if (
    RUNTIME_ABI_V1_17.lifecycle.active !== true ||
    RUNTIME_ABI_V1_17.versions.runtimeAbi !== "strategy-runtime-abi-v1.17" ||
    RUNTIME_ABI_V1_17.versions.runtimeService !==
      "runtime-execution-service-v1.17" ||
    RUNTIME_ABI_V1_17.versions.semanticReceipt !==
      "runtime-semantic-receipt-v1.17" ||
    RUNTIME_ABI_V1_17.versions.canonicalJson !== "canonical-json-v1.1"
  ) {
    return fail("current runtime tuple is not atomically activated")
  }
  const validation: V137RuntimeAbiValidation = {
    schemaVersion: "runtime-abi-v1.17-validation-v1",
    milestone: "v1.37",
    phase: 258,
    status: "passed",
    posture: "activated-uncertified-pending-phase-259-conformance",
    activation: {
      ...input.activation,
      manifestStatus: "verified",
    },
    current: {
      runtimeAbi: "strategy-runtime-abi-v1.17",
      runtimeService: "runtime-execution-service-v1.17",
      semanticReceipt: "runtime-semantic-receipt-v1.17",
      canonicalJson: "canonical-json-v1.1",
      productionTrustedProducerCount: 0,
      countedEligibleLaneCount: 0,
    },
    testReceipt: {
      stage: "postactivation",
      testManifestSha256: input.testReceipt
        .testManifestSha256 as `sha256:${string}`,
      selectedCommandCount: input.testReceipt.selectedCommandCount,
      passedCount: input.testReceipt.passedCount,
      skippedCount: 0,
      databaseCommandCount: input.testReceipt.databaseCommandCount,
    },
    noMutationEvidenceCommandIds: [
      ...V137_RUNTIME_ABI_NO_MUTATION_EVIDENCE_COMMAND_IDS,
    ],
    requirements: Array.from({ length: 8 }, (_, index) => ({
      id: `RABI-${String(index + 1).padStart(2, "0")}` as V137RuntimeAbiValidation["requirements"][number]["id"],
      status: "proved" as const,
    })),
    gates: [...input.gates],
    limitations: [
      "phase259-four-language-full-state-event-memory-objective-and-failure-trace-conformance-required",
      "production-trusted-producers-empty",
      "counted-runtime-lanes-empty",
    ],
  }
  assertPublicOutputLeakSafe(validation, "Runtime ABI validation")
  return validation
}

export const renderV137RuntimeAbiValidationJson = (
  validation: V137RuntimeAbiValidation,
): string => `${JSON.stringify(validation, null, 2)}\n`

export const renderV137RuntimeAbiValidationMarkdown = (
  validation: V137RuntimeAbiValidation,
): string =>
  `${[
    "# v1.37 Runtime ABI Validation",
    "",
    `**Status:** ${validation.status.toUpperCase()}`,
    `**Posture:** ${validation.posture}`,
    "",
    "## Activated tuple",
    "",
    `- Runtime ABI: \`${validation.current.runtimeAbi}\``,
    `- Runtime service: \`${validation.current.runtimeService}\``,
    `- Semantic receipt: \`${validation.current.semanticReceipt}\``,
    `- Canonical JSON: \`${validation.current.canonicalJson}\``,
    `- Activation: ${validation.activation.activationPathCount} exact paths in commit \`${validation.activation.activationCommit}\``,
    "",
    "## Exact executable evidence",
    "",
    `The post-activation receipt records ${validation.testReceipt.selectedCommandCount} exact commands, ${validation.testReceipt.passedCount} passed tests, ${validation.testReceipt.skippedCount} skipped tests, and ${validation.testReceipt.databaseCommandCount} database-required commands.`,
    "",
    "No-mutation ownership is backed by these exact PASS command IDs:",
    "",
    ...validation.noMutationEvidenceCommandIds.map((id) => `- \`${id}\``),
    "",
    "## Integrated gates",
    "",
    "| Gate | Status |",
    "|---|---|",
    ...validation.gates.map(({ id, status }) => `| ${id} | ${status} |`),
    "",
    "## Honest residual posture",
    "",
    ...validation.limitations.map((limitation) => `- ${limitation}`),
    "",
    "No production evidence producer is trusted and no runtime lane is counted until Phase 259 supplies executable four-language conformance.",
    "",
  ].join("\n")}\n`

export const parseV137RuntimeAbiEvaluatorArgs = (
  args: readonly string[],
): { write: boolean; check: true } => {
  if (args.length === 1 && args[0] === "--check") {
    return { write: false, check: true }
  }
  if (args.length === 2 && args[0] === "--write" && args[1] === "--check") {
    return { write: true, check: true }
  }
  return fail("usage: --check | --write --check")
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  parseV137RuntimeAbiEvaluatorArgs(process.argv.slice(2))
  throw new TypeError(
    "runtime ABI v1.17 evaluator output is unavailable until final activation-manifest integration",
  )
}
