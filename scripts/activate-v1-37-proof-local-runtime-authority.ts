#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { spawn, type ChildProcess } from "node:child_process"
import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
} from "node:crypto"
import { once } from "node:events"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  createRuntimeEvidenceTrustedContainmentProducersV137,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  RuntimeExecutionServiceRequestV118Schema,
  RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
  STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  StrategyRevisionSchema,
  createRuntimeSemanticTupleV118,
  createSetScenarioV137,
  defaultRuntimeMetadata,
  encodeCanonicalJson,
  encodeRuntimeEvidenceAttestationPayload,
  hashExecutableLaneIdentity,
  hashRuntimeEvidenceGraph,
  runtimeContainmentCommandEvidenceBytesV137,
  runtimeContainmentCorpusEvidenceBytesV137,
  runtimeContainmentManagedProducerIdV137,
  runtimeContainmentPolicyEvidenceBytesV137,
  type ExecutableLaneIdentity,
  type JsonValue,
  type RuntimeCertificateReferenceV118,
  type RuntimeEntrantAuthorityReference,
  type RuntimeEvidenceAttestationPayload,
  type RuntimeEvidenceBytes,
  type RuntimeEvidenceGraph,
  type RuntimeEvidenceTrustedProducer,
  type RuntimeExecutionEvidenceSnapshot,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceRequestV118,
  type StrategyRevision,
} from "@cowards/spec"
import { fourLanguageCurrentSources } from "@cowards/golden"
// eslint-disable-next-line no-restricted-imports -- Proof-local orchestration invokes the exact workspace provider implementation.
import { buildStrategyRevision } from "../packages/runtime-js/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local orchestration invokes the exact workspace provider implementation.
import { buildPythonStrategyRevision } from "../packages/runtime-python/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local orchestration invokes the exact workspace provider implementation.
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
} from "../packages/runtime-wasm-wasi/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local operator flow is the authorized application caller for evidence import/publication/install.
import {
  createDatabasePool,
  importVerifiedRuntimeEvidenceAttestation,
  installRuntimeEvidenceAuthorityPublication,
  migrate,
  prepareRuntimeEvidenceAuthorityPublication,
} from "../packages/persistence/src/index.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local operator orchestration validates the exact production registry parser.
import {
  DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
  createDeploymentLaneIdentityResolver,
  parseDeploymentLaneRegistry,
  type DeploymentLaneProfile,
  type DeploymentLaneRegistry,
} from "../apps/runtime-service/src/deployment-lane-registry.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local operator orchestration binds the production scheduling decision domain.
import {
  hashRuntimeAuthoritySchedulingDecisionReference,
  validateNestedMatchRuntimeRevisionTestSupport,
} from "../apps/runtime-service/src/execute-match.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local preflight constructs the same production runtime adapter selection.
import { createRuntimeServiceConfig } from "../apps/runtime-service/src/runtime-config.js"
// eslint-disable-next-line no-restricted-imports -- Proof-local operator output must use the production loader's exact key descriptor schema.
import { RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION } from "../apps/runtime-service/src/runtime-evidence-authority.js"
import {
  V137_PYTHON_LINUX_IMAGE,
  V137_TYPESCRIPT_LINUX_IMAGE,
  V137_WASMTIME_LINUX_IMAGE,
} from "./v1-37-linux-language-probe.js"
import { stageV137PinnedWasmtime } from "./lib/v1-37-pinned-wasmtime.js"

type LanguageId = "typescript" | "python" | "rust" | "zig"

interface ProbeRun {
  runId: string
  resultRootSha256: `sha256:${string}`
  evidenceRootSha256: `sha256:${string}`
  identityManifestRoot: `sha256:${string}`
  toolchainSha256: `sha256:${string}`
  artifactSha256: `sha256:${string}`
  containmentPolicySha256: `sha256:${string}`
  complete: true
  freshProcess: true
  freshWorkspace: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
}

interface ProbeLane {
  languageId: LanguageId
  laneId: string
  certificateId: string
  runs: readonly ProbeRun[]
}

interface ConformanceIdentity {
  languageId: LanguageId
  laneId: string
  runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  runtimeExecutableSha256: `sha256:${string}`
  toolchainSha256: `sha256:${string}`
  corpusRootSha256: `sha256:${string}`
  containmentPolicySha256: `sha256:${string}`
  identityManifestRoot: `sha256:${string}`
}

interface ActivatedLane {
  languageId: LanguageId
  revision: StrategyRevision
  profile: DeploymentLaneProfile
  laneIdentity: ExecutableLaneIdentity
  laneIdentityHash: `sha256:${string}`
  certificates: Readonly<
    Record<
      "bottom" | "top",
      {
        certificateId: string
        certificateRecordHash: `sha256:${string}`
        attestationHash: `sha256:${string}`
      }
    >
  >
  freshUntil: string
}

export interface ProofLocalServiceExecution {
  languageId: LanguageId
  requestId: string
  matchId: string
  statusCode: 200
  resultClass: "success"
  chronicleCanonicalHash: `sha256:${string}`
  transitionTraceRoot: `sha256:${string}`
  finalStateCanonicalHash: `sha256:${string}`
  outcomeCanonicalHash: `sha256:${string}`
  semanticValidation: "passed"
  reconstructionEquivalent: true
  replayEquivalent: true
  containmentCertificateIds: Readonly<{
    bottom: string
    top: string
  }>
  laneIdentityHash: `sha256:${string}`
}

export interface ProofLocalActivationReport {
  schemaVersion: "v1.37-proof-local-runtime-authority-v1"
  status: "passed"
  authority: {
    publicationId: string
    installReceiptId: string
    generation: string
    payloadSha256: `sha256:${string}`
    envelopeSha256: `sha256:${string}`
    sourceManifestHash: `sha256:${string}`
    publicationCount: 1
    installationCount: 1
  }
  service: {
    healthChecked: true
    contractVersion: "runtime-execution-service-v1.18"
    runtimeAbiVersion: "strategy-runtime-abi-v1.19"
    adapter: "container-subprocess"
    executionCount: 4
    stdoutSha256: `sha256:${string}`
    stderrSha256: `sha256:${string}`
  }
  lanes: readonly {
    languageId: LanguageId
    laneId: string
    containmentCertificates: Readonly<
      Record<"bottom" | "top", { id: string; hash: `sha256:${string}` }>
    >
    laneIdentityHash: `sha256:${string}`
    probeIdentityManifestRoot: `sha256:${string}`
    counted: false
  }[]
  executions: readonly ProofLocalServiceExecution[]
  proofRootSha256: `sha256:${string}`
}

/** A collector-scoped, private-only lease for consumers that must observe the exact proof topology. */
export interface ProofLocalRuntimeAuthorityLease {
  runtimeServiceUrl: string
  environment: Readonly<Record<string, string>>
  report: ProofLocalActivationReport
}

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const PROOF_SCHEMA = "v1.37-proof-local-runtime-authority-v1" as const
const fail = (code: string): never => {
  throw new TypeError(code)
}

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const rawSha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex")

const asPrefixed = (value: string): `sha256:${string}` =>
  (value.startsWith("sha256:")
    ? value
    : `sha256:${value}`) as `sha256:${string}`

const canonicalHash = (value: JsonValue): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) fail("V137_PROOF_LOCAL_CANONICAL_JSON")
  return sha256(encoded.bytes)
}

const currentTuple = () => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]
  if (
    tuple === undefined ||
    tuple.tuple.runtimeAbi !== "strategy-runtime-abi-v1.19"
  ) {
    fail("V137_PROOF_LOCAL_CURRENT_TUPLE")
  }
  return tuple
}

const sourceFor = (languageId: LanguageId): string => {
  const source = fourLanguageCurrentSources.find(
    (candidate) => candidate.languageId === languageId,
  )?.source
  if (source === undefined) fail("V137_PROOF_LOCAL_SOURCE_MISSING")
  return source
}

const providerIdFor = (languageId: LanguageId): string =>
  languageId === "typescript"
    ? "strategy-language-provider-js-ts"
    : languageId === "python"
      ? "strategy-language-provider-python"
      : languageId === "rust"
        ? "strategy-language-provider-rust-wasi"
        : "strategy-language-provider-zig-wasi"

const withProviderValidation = (
  revision: StrategyRevision,
  secret: string,
): StrategyRevision => {
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (artifact === undefined) fail("V137_PROOF_LOCAL_ARTIFACT_MISSING")
  const providerId = providerIdFor(revision.runtime.language.id as LanguageId)
  const payload = [
    providerId,
    STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
    revision.sourceHash,
    String(revision.sourceBytes),
    artifact.hash,
    String(artifact.bytes),
  ].join("\n")
  return StrategyRevisionSchema.parse({
    ...revision,
    metadata: {
      ...revision.metadata,
      providerValidation: {
        providerId,
        contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
        proof: `hmac-sha256:${createHmac("sha256", secret)
          .update(payload)
          .digest("hex")}`,
      },
    },
  })
}

export const buildProofLocalRevision = (
  languageId: LanguageId,
  providerSecret: string,
): StrategyRevision => {
  const source = sourceFor(languageId)
  const strategyId = `strategy:proof-local:v1.37:${languageId}`
  const revision = (() => {
    if (languageId === "typescript") {
      const current = defaultRuntimeMetadata("typescript")
      return buildStrategyRevision({
        source,
        strategyId,
        runtime: {
          ...current,
          adapter: {
            id: "runtime-js-container-subprocess",
            version: current.adapter.version,
          },
          limits: {
            ...current.limits,
            filesystem: "read-only-root",
            network: "disabled",
          },
        },
      })
    }
    if (languageId === "python") {
      return buildPythonStrategyRevision({ source, strategyId })
    }
    if (languageId === "rust") {
      return buildRustStrategyRevision({ source, strategyId })
    }
    return buildZigStrategyRevision({ source, strategyId })
  })()
  return withProviderValidation(revision, providerSecret)
}

export const createProofLocalLaneProfile = (
  revision: StrategyRevision,
  conformance: ConformanceIdentity,
): DeploymentLaneProfile => {
  const tuple = currentTuple()
  const sourceArtifact = revision.metadata.sourceArtifact
  const compiledArtifact = revision.metadata.compiledArtifact
  const source = sourceArtifact !== undefined
  const artifact = sourceArtifact ?? compiledArtifact
  if (artifact === undefined) fail("V137_PROOF_LOCAL_ARTIFACT_MISSING")
  return {
    providerId: providerIdFor(conformance.languageId),
    languageId: revision.runtime.language.id,
    languageVersion: revision.runtime.language.version,
    runtimeId: source ? sourceArtifact.toolchain.runtime : "wasmtime",
    runtimeVersion: source
      ? sourceArtifact.toolchain.runtimeVersion
      : "wasmtime 45.0.0 (377cd917a 2026-05-21)",
    toolchainId: source
      ? sourceArtifact.toolchain.language
      : compiledArtifact!.toolchain.compiler,
    toolchainVersion: source
      ? sourceArtifact.toolchain.runtimeVersion
      : compiledArtifact!.toolchain.compilerVersion,
    adapterId: revision.runtime.adapter.id,
    adapterVersion: revision.runtime.adapter.version,
    policyId: conformance.containmentPolicySha256,
    policyVersion: "v1.37",
    corpusId: conformance.corpusRootSha256,
    corpusVersion: "v3",
    artifactKind: source ? "source" : "compiled",
    artifactIdPrefix: "proof-local:artifact:",
    implementationId: conformance.runtimeExecutableSha256,
    buildId: conformance.toolchainSha256,
    semanticTupleId: tuple.tupleId,
    semanticTuple: { ...tuple.tuple },
  }
}

const laneIdentityFor = (
  revision: StrategyRevision,
  profile: DeploymentLaneProfile,
): ExecutableLaneIdentity => {
  const artifact =
    profile.artifactKind === "source"
      ? revision.metadata.sourceArtifact
      : revision.metadata.compiledArtifact
  if (artifact === undefined) fail("V137_PROOF_LOCAL_ARTIFACT_MISSING")
  return {
    providerId: profile.providerId,
    languageId: profile.languageId,
    runtimeId: profile.runtimeId,
    runtimeVersion: profile.runtimeVersion,
    toolchainId: profile.toolchainId,
    toolchainVersion: profile.toolchainVersion,
    adapterId: profile.adapterId,
    adapterVersion: profile.adapterVersion,
    policyId: profile.policyId,
    policyVersion: profile.policyVersion,
    corpusId: profile.corpusId,
    corpusVersion: profile.corpusVersion,
    artifactId: `${profile.artifactIdPrefix}${revision.id}`,
    artifactSha256: artifact.hash,
    implementationId: profile.implementationId,
    buildId: profile.buildId,
    semanticTupleId: profile.semanticTupleId,
    semanticTuple: { ...profile.semanticTuple },
  }
}

export const validateProbeLaneAgainstConformance = (
  lane: ProbeLane,
  identity: ConformanceIdentity,
): void => {
  if (
    lane.languageId !== identity.languageId ||
    lane.laneId !== identity.laneId ||
    identity.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
    lane.runs.length !== 3 ||
    lane.runs.some(
      (run) =>
        !run.complete ||
        !run.freshProcess ||
        !run.freshWorkspace ||
        run.skippedCaseCount !== 0 ||
        run.unsupportedCaseCount !== 0 ||
        run.fallbackUsed ||
        run.syntheticEvidence ||
        run.toolchainSha256 !== identity.toolchainSha256 ||
        run.containmentPolicySha256 !== identity.containmentPolicySha256,
    )
  ) {
    fail("V137_PROOF_LOCAL_CONFORMANCE_JOIN")
  }
}

const evidenceBytesFor = (
  lane: ProbeLane,
  conformance: ConformanceIdentity,
  revision: StrategyRevision,
  laneIdentity: ExecutableLaneIdentity,
): RuntimeEvidenceBytes => {
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (artifact?.bytesBase64 === undefined) {
    fail("V137_PROOF_LOCAL_ARTIFACT_BYTES_MISSING")
  }
  const json = (value: unknown) =>
    Buffer.from(`${JSON.stringify(value)}\n`, "utf8")
  return Object.freeze({
    root: json({
      schemaVersion: PROOF_SCHEMA,
      laneIdentity,
      probeRuns: lane.runs,
    }),
    command: runtimeContainmentCommandEvidenceBytesV137(),
    corpus: runtimeContainmentCorpusEvidenceBytesV137(lane.languageId),
    policy: runtimeContainmentPolicyEvidenceBytesV137(lane.languageId),
    toolchain: json({
      runtimeExecutableSha256: conformance.runtimeExecutableSha256,
      toolchainSha256: conformance.toolchainSha256,
    }),
    adapter: json({
      adapterId: laneIdentity.adapterId,
      adapterVersion: laneIdentity.adapterVersion,
    }),
    artifact: Buffer.from(artifact.bytesBase64, "base64"),
    result: json({
      status: "passed",
      resultRoots: lane.runs.map(({ resultRootSha256 }) => resultRootSha256),
    }),
    trace: json({
      evidenceRoots: lane.runs.map(
        ({ evidenceRootSha256 }) => evidenceRootSha256,
      ),
      runIds: lane.runs.map(({ runId }) => runId),
    }),
    gate: json({ gateId: "containment", passed: true, counted: false }),
  })
}

const containmentFixture = (input: {
  lane: ProbeLane
  conformance: ConformanceIdentity
  revision: StrategyRevision
  laneIdentity: ExecutableLaneIdentity
  issuedAt: string
  validUntil: string
  producerPrivateKey: ReturnType<typeof createPrivateKey>
  trustedProducers: readonly RuntimeEvidenceTrustedProducer[]
  side: "bottom" | "top"
}): {
  producer: RuntimeEvidenceTrustedProducer
  producerPrivateKey: ReturnType<typeof createPrivateKey>
  payload: RuntimeEvidenceAttestationPayload
  evidenceBytes: RuntimeEvidenceBytes
} => {
  const evidenceBytes = evidenceBytesFor(
    input.lane,
    input.conformance,
    input.revision,
    input.laneIdentity,
  )
  const hashNode = (nodeId: string): string => rawSha256(evidenceBytes[nodeId]!)
  const nodeKinds = {
    root: "attestation-root",
    command: "command",
    corpus: "corpus",
    policy: "policy",
    toolchain: "toolchain",
    adapter: "adapter",
    artifact: "artifact",
    result: "result-manifest",
    trace: "result-trace",
    gate: "gate-result",
  } as const
  const graph: RuntimeEvidenceGraph = {
    rootNodeId: "root",
    nodes: Object.entries(nodeKinds).map(([nodeId, kind]) => ({
      nodeId,
      kind,
      sha256: hashNode(nodeId),
    })),
    edges: Object.keys(nodeKinds)
      .filter((nodeId) => nodeId !== "root")
      .map((nodeId) => ({ fromNodeId: "root", toNodeId: nodeId })),
  }
  const producerId = runtimeContainmentManagedProducerIdV137(
    input.lane.languageId,
  )
  const producer = input.trustedProducers.find(
    (candidate) => candidate.producerId === producerId,
  )
  if (
    producer === undefined ||
    producer.commandSha256 !== hashNode("command") ||
    producer.corpusSha256 !== hashNode("corpus") ||
    producer.policySha256 !== hashNode("policy") ||
    producer.corpusId !== input.laneIdentity.corpusId ||
    producer.policyId !== input.laneIdentity.policyId
  ) {
    fail("V137_PROOF_LOCAL_MANAGED_PRODUCER_DRIFT")
  }
  const keyId = producer.keyId
  return {
    producer,
    producerPrivateKey: input.producerPrivateKey,
    evidenceBytes,
    payload: {
      kind: "containment",
      schemaVersion: producer.schemaVersion,
      producerId,
      producerKeyId: keyId,
      trustDomain: "production",
      command: {
        id: producer.commandId,
        sha256: producer.commandSha256,
        nodeId: "command",
      },
      corpus: {
        id: producer.corpusId,
        sha256: producer.corpusSha256,
        nodeId: "corpus",
      },
      policy: {
        id: producer.policyId,
        sha256: producer.policySha256,
        nodeId: "policy",
      },
      laneIdentity: input.laneIdentity,
      laneIdentitySha256: hashExecutableLaneIdentity(input.laneIdentity),
      runtime: {
        id: input.laneIdentity.runtimeId,
        version: input.laneIdentity.runtimeVersion,
      },
      toolchain: {
        id: input.laneIdentity.toolchainId,
        version: input.laneIdentity.toolchainVersion,
        nodeId: "toolchain",
        sha256: hashNode("toolchain"),
      },
      adapter: {
        id: input.laneIdentity.adapterId,
        version: input.laneIdentity.adapterVersion,
        nodeId: "adapter",
        sha256: hashNode("adapter"),
      },
      artifact: {
        id: input.laneIdentity.artifactId,
        sha256: input.laneIdentity.artifactSha256,
        nodeId: "artifact",
      },
      result: {
        manifestId: `proof-local:containment-result:${input.lane.languageId}:${input.side}`,
        manifestNodeId: "result",
        manifestSha256: hashNode("result"),
        originalEvidenceNodeId: "trace",
        originalEvidenceSha256: hashNode("trace"),
        graphSha256: hashRuntimeEvidenceGraph(graph),
        digests: [
          {
            id: "containment-trace",
            nodeId: "trace",
            sha256: hashNode("trace"),
          },
        ],
      },
      gateResults: [
        {
          gateId: "containment",
          passed: true,
          nodeId: "gate",
          sha256: hashNode("gate"),
        },
      ],
      graph,
      issuedAt: input.issuedAt,
      validUntil: input.validUntil,
      registryGeneration: `proof-local-${input.lane.languageId}-${input.side}-v1`,
      derivedCertificateVersion: "v1.37-proof-local-containment-v1",
    },
  }
}

const exactConformanceIdentity = async (
  pool: ReturnType<typeof createDatabasePool>,
  lane: ProbeLane,
): Promise<ConformanceIdentity> => {
  const result = await pool.query<{ lane_identity: unknown }>(
    `select lane_identity from runtime_evidence_certificates
      where id = $1 and certificate_kind = 'conformance'
        and certificate_status = 'passed'`,
    [lane.certificateId],
  )
  const identity = result.rows[0]?.lane_identity as
    | ConformanceIdentity
    | undefined
  if (
    identity === undefined ||
    !SHA256.test(identity.runtimeExecutableSha256) ||
    !SHA256.test(identity.toolchainSha256) ||
    !SHA256.test(identity.corpusRootSha256) ||
    !SHA256.test(identity.containmentPolicySha256) ||
    !SHA256.test(identity.identityManifestRoot)
  ) {
    fail("V137_PROOF_LOCAL_CONFORMANCE_CERTIFICATE")
  }
  validateProbeLaneAgainstConformance(lane, identity)
  return identity
}

const reservePort = async (): Promise<number> => {
  const server = createServer()
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address()
  if (address === null || typeof address === "string") {
    fail("V137_PROOF_LOCAL_PORT")
  }
  const port = address.port
  server.close()
  await once(server, "close")
  return port
}

const waitForHealth = async (
  port: number,
): Promise<Record<string, unknown>> => {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await globalThis.fetch(`http://127.0.0.1:${port}/health`)
      const value = (await response.json()) as Record<string, unknown>
      if (response.ok && value.ok === true) return value
    } catch {
      // The owned service is still starting.
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 100))
  }
  fail("V137_PROOF_LOCAL_SERVICE_HEALTH")
}

const stopOwnedService = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill("SIGTERM")
  await Promise.race([
    once(child, "close"),
    new Promise((resolve) => globalThis.setTimeout(resolve, 5_000)),
  ])
  if (child.exitCode === null && child.signalCode === null)
    child.kill("SIGKILL")
}

const entrantReference = (input: {
  side: "bottom" | "top"
  entrantKey: string
  lane: ActivatedLane
  generation: string
  evaluatedAt: string
  publication: RuntimeExecutionEvidenceSnapshot["publication"]
  authorityBundleHash: `sha256:${string}`
}): RuntimeEntrantAuthorityReference => {
  const certificate = input.lane.certificates[input.side]
  const entrant: RuntimeEntrantAuthorityReference = {
    entrantKey: input.entrantKey,
    strategyRevisionId: input.lane.revision.id,
    laneIdentityHash: input.lane.laneIdentityHash,
    effectiveStatus: "exhibition_only",
    schedulingDecisionId: `proof-local:scheduling:${input.side}:${input.lane.languageId}`,
    schedulingDecisionHash: sha256("pending"),
    schedulingDecision: {
      status: "exhibition_only",
      reasonCode: "CONFORMANCE_MISSING",
      evaluatedAt: input.evaluatedAt,
      freshUntil: input.lane.freshUntil,
      registryGeneration: input.generation,
    },
    containmentCertificateId: certificate.certificateId,
    containmentCertificateHash: certificate.certificateRecordHash,
  }
  return {
    ...entrant,
    schedulingDecisionHash: hashRuntimeAuthoritySchedulingDecisionReference({
      compatibilityTupleId: currentTuple().tupleId,
      authorityBundleHash: input.authorityBundleHash,
      registryGeneration: input.generation,
      publication: input.publication,
      entrant,
    }) as `sha256:${string}`,
  }
}

const requestForLane = (input: {
  lane: ActivatedLane
  generation: string
  evaluatedAt: string
  publication: RuntimeExecutionEvidenceSnapshot["publication"]
  authorityBundleHash: `sha256:${string}`
}): RuntimeExecutionServiceRequestV118 => {
  const tuple = currentTuple()
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ status }) => status === "active",
  )
  if (arena === undefined) fail("V137_PROOF_LOCAL_ARENA")
  const matchId = `match:proof-local:v1.37:${input.lane.languageId}`
  const requestId = `request:proof-local:v1.37:${input.lane.languageId}`
  const bottomEntrantKey = `entrant:proof-local:${input.lane.languageId}:bottom`
  const topEntrantKey = `entrant:proof-local:${input.lane.languageId}:top`
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: { entrantKey: bottomEntrantKey, playerId: "player:bottom" },
    entrantB: { entrantKey: topEntrantKey, playerId: "player:top" },
    baseSeed: `seed:proof-local:${input.lane.languageId}`,
  })
  const condition = scenario.conditions[0]!
  const evidenceSnapshot: RuntimeExecutionEvidenceSnapshot = {
    compatibility: { tupleId: tuple.tupleId, tuple: { ...tuple.tuple } },
    authorityBundleHash: input.authorityBundleHash,
    registryGeneration: input.generation,
    publication: input.publication,
    entrants: {
      bottom: entrantReference({
        side: "bottom",
        entrantKey: bottomEntrantKey,
        ...input,
      }),
      top: entrantReference({
        side: "top",
        entrantKey: topEntrantKey,
        ...input,
      }),
    },
  }
  const nested: RuntimeExecutionServiceRequest = {
    contractVersion: "runtime-execution-service-v1.16",
    kind: "executeMatch",
    requestId: `${requestId}:nested`,
    match: {
      matchId,
      seed: scenario.baseSeed,
      arenaVariant: {
        id: arena.id,
        name: arena.name,
        initialBounds: { ...arena.initialBounds },
        terrainStones: arena.terrainStones.map((position) => ({ ...position })),
      },
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      bottomStrategyRevisionId: input.lane.revision.id,
      topStrategyRevisionId: input.lane.revision.id,
      initialInitiativePlayerId: condition.initialInitiativePlayerId,
      maxPhases: 8,
      candidateMatch: {
        semanticAuthorityKey: "runtime-v1.19",
        matchId,
        seed: scenario.baseSeed,
        arenaVariantId: arena.id,
        bottomStrategyRevisionId: input.lane.revision.id,
        topStrategyRevisionId: input.lane.revision.id,
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        bottomEntrantKey: condition.bottomEntrantKey,
        topEntrantKey: condition.topEntrantKey,
        setPolicyVersion: scenario.setPolicyVersion,
        scenarioId: scenario.scenarioId,
        conditionId: condition.conditionId,
        conditionOrdinal: condition.ordinal,
        conditionSuffix: condition.suffix,
        requestIdentity: condition.requestIdentity,
        arenaCatalogVersion: scenario.arenaCatalogVersion,
        arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
        initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
        initialInitiativePlayerId: condition.initialInitiativePlayerId,
      },
    },
    strategies: {
      bottom: input.lane.revision,
      top: input.lane.revision,
    },
    limits: { ...DEFAULT_RUNTIME_LIMITS },
    evidenceSnapshot,
  }
  const reference = (
    side: "bottom" | "top",
  ): RuntimeCertificateReferenceV118 => {
    const certificate = input.lane.certificates[side]
    const artifact =
      input.lane.revision.metadata.sourceArtifact ??
      input.lane.revision.metadata.compiledArtifact
    if (artifact === undefined) fail("V137_PROOF_LOCAL_ARTIFACT_MISSING")
    return {
      side,
      certificateId: certificate.certificateId,
      certificateRecordHash: certificate.certificateRecordHash,
      registryGeneration: input.generation,
      lane: input.lane.laneIdentity.languageId,
      freshUntil: input.lane.freshUntil,
      sourceIdentity: {
        side,
        strategyRevisionId: input.lane.revision.id,
        originalSourceSha256: sha256(input.lane.revision.source),
        normalizedSourceSha256: sha256(
          input.lane.revision.source
            .replaceAll("\r\n", "\n")
            .replaceAll("\r", "\n"),
        ),
        artifactSha256: asPrefixed(artifact.hash),
        identityManifestRoot: input.lane.laneIdentityHash,
        evidenceGraphRoot: certificate.attestationHash,
        laneIdentityHash: input.lane.laneIdentityHash,
      },
    }
  }
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
    kind: "executeMatch",
    requestId,
    matchId,
    semanticTuple: createRuntimeSemanticTupleV118(tuple.tuple),
    authorityGeneration: input.generation,
    evaluationInstant: input.evaluatedAt,
    certificateReferences: {
      bottom: reference("bottom"),
      top: reference("top"),
    },
    accounting: {
      budgetProfileRoot: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      ledgerPrestateRoot:
        RUNTIME_INVOCATION_V1_17_INITIAL_EXECUTION_LEDGER_ROOT,
    },
    match: nested as unknown as JsonValue,
  }
}

const executeOverHttp = async (input: {
  port: number
  token: string
  lane: ActivatedLane
  request: RuntimeExecutionServiceRequestV118
  serviceStderr: readonly Buffer[]
}): Promise<ProofLocalServiceExecution> => {
  const parsedRequest = RuntimeExecutionServiceRequestV118Schema.safeParse(
    input.request,
  )
  if (!parsedRequest.success) {
    if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
      process.stderr.write(`${JSON.stringify(parsedRequest.error.issues)}\n`)
    }
    fail("V137_PROOF_LOCAL_REQUEST_SCHEMA")
  }
  const encoded = encodeCanonicalJson(input.request as unknown as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) fail("V137_PROOF_LOCAL_REQUEST_CANONICAL")
  const response = await globalThis.fetch(
    `http://127.0.0.1:${input.port}/execute-match`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cowards-private-artifact-token": input.token,
      },
      body: Buffer.from(encoded.bytes),
    },
  )
  const body = (await response.json()) as Record<string, unknown>
  const publicResponse = body.publicResponse as
    | {
        ok?: unknown
        result?: {
          resultClass?: unknown
          chronicleCanonicalHash?: unknown
          transitionTraceRoot?: unknown
          finalStateCanonicalHash?: unknown
          outcomeCanonicalHash?: unknown
        }
      }
    | undefined
  const chronicle = body.chronicle as JsonValue | undefined
  const finalState = body.finalState as Record<string, JsonValue> | undefined
  if (
    response.status !== 200 ||
    body.schemaVersion !== "runtime-service-completion-envelope-v1.18" ||
    publicResponse?.ok !== true ||
    publicResponse.result?.resultClass !== "success" ||
    chronicle === undefined ||
    finalState === undefined ||
    !SHA256.test(String(publicResponse.result.chronicleCanonicalHash)) ||
    !SHA256.test(String(publicResponse.result.transitionTraceRoot)) ||
    !SHA256.test(String(publicResponse.result.finalStateCanonicalHash)) ||
    !SHA256.test(String(publicResponse.result.outcomeCanonicalHash)) ||
    canonicalHash(chronicle) !== publicResponse.result.chronicleCanonicalHash ||
    canonicalHash(finalState as JsonValue) !==
      publicResponse.result.finalStateCanonicalHash ||
    canonicalHash(finalState.outcome!) !==
      publicResponse.result.outcomeCanonicalHash
  ) {
    if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
      process.stderr.write(
        `${JSON.stringify({
          statusCode: response.status,
          schemaVersion: body.schemaVersion,
          publicResponse: body.publicResponse,
          systemFailure: body.systemFailure,
          nestedFailures: Buffer.concat(input.serviceStderr)
            .toString("utf8")
            .split("\n")
            .filter((line) => line.includes('"nestedCode"')),
          responseKeys: Object.keys(body).sort(),
        })}\n`,
      )
    }
    fail("V137_PROOF_LOCAL_HTTP_EXECUTION")
  }
  return {
    languageId: input.lane.languageId,
    requestId: input.request.requestId,
    matchId: input.request.matchId,
    statusCode: 200,
    resultClass: "success",
    chronicleCanonicalHash: publicResponse.result
      .chronicleCanonicalHash as `sha256:${string}`,
    transitionTraceRoot: publicResponse.result
      .transitionTraceRoot as `sha256:${string}`,
    finalStateCanonicalHash: publicResponse.result
      .finalStateCanonicalHash as `sha256:${string}`,
    outcomeCanonicalHash: publicResponse.result
      .outcomeCanonicalHash as `sha256:${string}`,
    semanticValidation: "passed",
    reconstructionEquivalent: true,
    replayEquivalent: true,
    containmentCertificateIds: {
      bottom: input.lane.certificates.bottom.certificateId,
      top: input.lane.certificates.top.certificateId,
    },
    laneIdentityHash: input.lane.laneIdentityHash,
  }
}

const parseProbeLanes = (encoded: string): ProbeLane[] => {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))
  } catch {
    fail("V137_PROOF_LOCAL_PROBE_INPUT")
  }
  if (!Array.isArray(parsed) || parsed.length !== 4) {
    fail("V137_PROOF_LOCAL_PROBE_INPUT")
  }
  const lanes = parsed as ProbeLane[]
  if (
    JSON.stringify(lanes.map(({ languageId }) => languageId)) !==
    JSON.stringify(["typescript", "python", "rust", "zig"])
  ) {
    fail("V137_PROOF_LOCAL_PROBE_INPUT")
  }
  return lanes
}

export const runProofLocalRuntimeAuthority = async (input: {
  repoRoot: string
  databaseUrl: string
  probeLanes: ProbeLane[]
  providerValidationSecret?: string
  whileActive?: (lease: ProofLocalRuntimeAuthorityLease) => Promise<void>
}): Promise<ProofLocalActivationReport> => {
  const sourcePool = createDatabasePool({ connectionString: input.databaseUrl })
  const proofSchema = "proof_local_runtime_authority"
  await sourcePool.query(`create schema if not exists ${proofSchema}`)
  const proofDatabaseUrl = new URL(input.databaseUrl)
  proofDatabaseUrl.searchParams.set("options", `-c search_path=${proofSchema}`)
  const pool = createDatabasePool({
    connectionString: proofDatabaseUrl.toString(),
  })
  const now = new Date()
  const issuedAt = new Date(now.valueOf() - 60_000).toISOString()
  const validUntil = new Date(now.valueOf() + 30 * 86_400_000).toISOString()
  const providerSecret = randomUUID()
  const proofRoot = path.join(
    "/private/tmp/cowards-v1-37-proof-local",
    `run-${Date.now()}-${process.pid}`,
  )
  await mkdir(proofRoot, { recursive: true, mode: 0o700 })
  const wasmtimeExecutablePath = stageV137PinnedWasmtime({
    stageDirectory: proofRoot,
  })
  const authorityKeys = generateKeyPairSync("ed25519")
  const receiptKeys = generateKeyPairSync("ed25519")
  const containmentKeys = generateKeyPairSync("ed25519")
  const containmentPrivateKey = containmentKeys.privateKey
  const containmentPublicKeyPem = createPublicKey(containmentPrivateKey)
    .export({ type: "spki", format: "pem" })
    .toString()
  const containmentTrustedProducers =
    createRuntimeEvidenceTrustedContainmentProducersV137(containmentPublicKeyPem)
  const authorityKeyId = `proof-local:authority-key:${randomUUID()}`
  const receiptKeyId = `proof-local:semantic-receipt-key:${randomUUID()}`
  const authorityPath = path.join(proofRoot, "authority.json")
  const authorityPublicPath = path.join(proofRoot, "authority-public.json")
  const authorityHighWaterPath = path.join(
    proofRoot,
    "authority-high-water.json",
  )
  const receiptPrivatePath = path.join(
    proofRoot,
    "semantic-receipt-private.pem",
  )
  const registryPath = path.join(proofRoot, "deployment-lanes.json")
  const serviceToken = randomUUID()
  const serviceLogs = { stdout: [] as Buffer[], stderr: [] as Buffer[] }
  let child: ChildProcess | undefined
  try {
    await migrate(pool)
    const lanes: ActivatedLane[] = []
    const profiles: DeploymentLaneProfile[] = []
    for (const probeLane of input.probeLanes) {
      const conformance = await exactConformanceIdentity(sourcePool, probeLane)
      const revision = buildProofLocalRevision(
        probeLane.languageId,
        providerSecret,
      )
      const profile = createProofLocalLaneProfile(revision, conformance)
      const laneIdentity = laneIdentityFor(revision, profile)
      const laneIdentityHash = asPrefixed(
        hashExecutableLaneIdentity(laneIdentity),
      )
      const certificates = {} as Record<
        "bottom" | "top",
        ActivatedLane["certificates"]["bottom"]
      >
      for (const side of ["bottom", "top"] as const) {
        const fixture = containmentFixture({
          lane: probeLane,
          conformance,
          revision,
          laneIdentity,
          issuedAt,
          validUntil,
          producerPrivateKey: containmentPrivateKey,
          trustedProducers: containmentTrustedProducers,
          side,
        })
        const imported = await importVerifiedRuntimeEvidenceAttestation(pool, {
          mode: "proof-local",
          attestation: {
            ...fixture.payload,
            signatureBase64: sign(
              null,
              encodeRuntimeEvidenceAttestationPayload(fixture.payload),
              fixture.producerPrivateKey,
            ).toString("base64"),
          },
          evidenceBytes: fixture.evidenceBytes,
          verificationInstant: now.toISOString(),
          trustedProducers: containmentTrustedProducers,
        })
        certificates[side] = {
          certificateId: imported.certificate.certificateId,
          certificateRecordHash: asPrefixed(
            imported.certificate.certificateRecordHash,
          ),
          attestationHash: asPrefixed(imported.attestationSha256),
        }
      }
      profiles.push(profile)
      lanes.push({
        languageId: probeLane.languageId,
        revision,
        profile,
        laneIdentity,
        laneIdentityHash,
        certificates: Object.freeze(certificates),
        freshUntil: validUntil,
      })
    }
    const registry: DeploymentLaneRegistry = parseDeploymentLaneRegistry({
      schemaVersion: DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
      registryId: `proof-local:deployment-lanes:${randomUUID()}`,
      lanes: profiles,
    })
    const proofRuntimeConfig = createRuntimeServiceConfig({
      strategyExecutionAdapter: "container-subprocess",
      containerImage: V137_TYPESCRIPT_LINUX_IMAGE,
      pythonContainerImage: V137_PYTHON_LINUX_IMAGE,
      wasmtimeContainerImage: V137_WASMTIME_LINUX_IMAGE,
      wasmtimeExecutablePath,
      semanticReceiptSecret: randomUUID(),
      deploymentLaneRegistryId: registry.registryId,
      resolveDeploymentLaneIdentity:
        createDeploymentLaneIdentityResolver(registry),
    })
    for (const lane of lanes) {
      const admitted = validateNestedMatchRuntimeRevisionTestSupport(
        lane.revision,
        proofRuntimeConfig,
        DEFAULT_RUNTIME_LIMITS,
        "strategy-runtime-abi-v1.19",
      )
      if (!admitted.ok) {
        if (process.env.COWARDS_CERTIFICATION_DEBUG === "1") {
          process.stderr.write(`${JSON.stringify(admitted.diagnostics)}\n`)
        }
        fail("V137_PROOF_LOCAL_RUNTIME_PREFLIGHT")
      }
    }
    await writeFile(registryPath, `${JSON.stringify(registry)}\n`, {
      mode: 0o600,
    })
    const publicKeyPem = authorityKeys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString()
    const prepared = await prepareRuntimeEvidenceAuthorityPublication(pool, {
      bundleVersion: "v1.37-proof-local-runtime-authority-v1",
      issuedAt,
      validFrom: now.toISOString(),
      validUntil,
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      signerKeyId: authorityKeyId,
      trustedImportAuthorities: [],
      signMessage: (bytes) => sign(null, bytes, authorityKeys.privateKey),
    })
    const attemptId = `proof-local:install:${randomUUID()}`
    const installed = await installRuntimeEvidenceAuthorityPublication(pool, {
      publicationId: prepared.publicationId,
      targetPath: authorityPath,
      attemptId,
      evaluationInstant: now.toISOString(),
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      signerKeyId: authorityKeyId,
      publicKeyPem,
    })
    const installEvent = await pool.query<{ id: string }>(
      `select id from runtime_evidence_authority_publication_events
        where publication_id = $1 and event_kind = 'installed' and attempt_id = $2`,
      [prepared.publicationId, attemptId],
    )
    const installReceiptId = installEvent.rows[0]?.id
    if (installReceiptId === undefined) {
      fail("V137_PROOF_LOCAL_INSTALL_RECEIPT")
    }
    await writeFile(
      authorityPublicPath,
      `${JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
        keyId: authorityKeyId,
        algorithm: "Ed25519",
        publicKeyPem,
      })}\n`,
      { mode: 0o600 },
    )
    await writeFile(
      receiptPrivatePath,
      receiptKeys.privateKey.export({ type: "pkcs8", format: "pem" }),
      { mode: 0o600 },
    )
    const port = await reservePort()
    child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        path.join(input.repoRoot, "apps", "runtime-service", "src", "index.ts"),
      ],
      {
        cwd: input.repoRoot,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          PATH: `${path.dirname(wasmtimeExecutablePath)}:/usr/local/go/bin:${process.env.PATH ?? ""}`,
          RUNTIME_SERVICE_HOST: "127.0.0.1",
          RUNTIME_SERVICE_PORT: String(port),
          STRATEGY_EXECUTION_ADAPTER: "container-subprocess",
          COWARDS_RUNTIME_TYPESCRIPT_CONTAINER_IMAGE:
            V137_TYPESCRIPT_LINUX_IMAGE,
          COWARDS_RUNTIME_PYTHON_CONTAINER_IMAGE: V137_PYTHON_LINUX_IMAGE,
          COWARDS_RUNTIME_WASMTIME_CONTAINER_IMAGE: V137_WASMTIME_LINUX_IMAGE,
          COWARDS_RUNTIME_WASMTIME_EXECUTABLE_PATH: wasmtimeExecutablePath,
          COWARDS_RUNTIME_SERVICE_SEMANTIC_RECEIPT_SECRET: randomUUID(),
          COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY: registryPath,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BUNDLE_PATH: authorityPath,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_PATH:
            authorityPublicPath,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_PATH:
            authorityHighWaterPath,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_GENERATION:
            prepared.generation,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_BUNDLE_HASH:
            prepared.payloadSha256,
          COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP: "1",
          COWARDS_RUNTIME_V118_RECEIPT_KEY_ID: receiptKeyId,
          COWARDS_RUNTIME_V118_RECEIPT_PRIVATE_KEY_PATH: receiptPrivatePath,
          COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN: serviceToken,
          ...(input.providerValidationSecret
            ? {
                COWARDS_PROVIDER_VALIDATION_SECRET:
                  input.providerValidationSecret,
              }
            : {}),
        },
      },
    )
    child.stdout?.on("data", (chunk: Buffer) =>
      serviceLogs.stdout.push(Buffer.from(chunk)),
    )
    child.stderr?.on("data", (chunk: Buffer) =>
      serviceLogs.stderr.push(Buffer.from(chunk)),
    )
    const health = await waitForHealth(port)
    if (
      health.service !== RUNTIME_EXECUTION_SERVICE_VERSION_V1_18 ||
      health.runtimeAbiVersion !== "strategy-runtime-abi-v1.19" ||
      health.adapter !== "container-subprocess"
    ) {
      fail("V137_PROOF_LOCAL_SERVICE_IDENTITY")
    }
    const publication: RuntimeExecutionEvidenceSnapshot["publication"] = {
      publicationId: prepared.publicationId,
      installReceiptId,
      payloadSha256: asPrefixed(prepared.payloadSha256),
      envelopeSha256: asPrefixed(prepared.envelopeSha256),
      sourceManifestHash: asPrefixed(prepared.sourceManifestHash),
    }
    const executions: ProofLocalServiceExecution[] = []
    for (const lane of lanes) {
      const request = requestForLane({
        lane,
        generation: prepared.generation,
        evaluatedAt: now.toISOString(),
        publication,
        authorityBundleHash: asPrefixed(prepared.payloadSha256),
      })
      executions.push(
        await executeOverHttp({
          port,
          token: serviceToken,
          lane,
          request,
          serviceStderr: serviceLogs.stderr,
        }),
      )
    }
    const reportSeed = {
      authority: {
        publicationId: prepared.publicationId,
        generation: prepared.generation,
        payloadSha256: asPrefixed(prepared.payloadSha256),
      },
      lanes: lanes.map(({ languageId, laneIdentityHash, certificates }) => ({
        languageId,
        laneIdentityHash,
        certificateIds: {
          bottom: certificates.bottom.certificateId,
          top: certificates.top.certificateId,
        },
      })),
      executions,
    }
    const report: ProofLocalActivationReport = {
      schemaVersion: PROOF_SCHEMA,
      status: "passed",
      authority: {
        publicationId: prepared.publicationId,
        installReceiptId,
        generation: prepared.generation,
        payloadSha256: asPrefixed(prepared.payloadSha256),
        envelopeSha256: asPrefixed(installed.envelopeSha256),
        sourceManifestHash: asPrefixed(prepared.sourceManifestHash),
        publicationCount: 1,
        installationCount: 1,
      },
      service: {
        healthChecked: true,
        contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
        runtimeAbiVersion: "strategy-runtime-abi-v1.19",
        adapter: "container-subprocess",
        executionCount: executions.length as 4,
        stdoutSha256: sha256(Buffer.concat(serviceLogs.stdout)),
        stderrSha256: sha256(Buffer.concat(serviceLogs.stderr)),
      },
      lanes: lanes.map((lane) => {
        const conformance = input.probeLanes.find(
          ({ languageId }) => languageId === lane.languageId,
        )!.runs[0]!
        return {
          languageId: lane.languageId,
          laneId: input.probeLanes.find(
            ({ languageId }) => languageId === lane.languageId,
          )!.laneId,
          containmentCertificates: {
            bottom: {
              id: lane.certificates.bottom.certificateId,
              hash: lane.certificates.bottom.certificateRecordHash,
            },
            top: {
              id: lane.certificates.top.certificateId,
              hash: lane.certificates.top.certificateRecordHash,
            },
          },
          laneIdentityHash: lane.laneIdentityHash,
          probeIdentityManifestRoot: conformance.identityManifestRoot,
          counted: false,
        }
      }),
      executions,
      proofRootSha256: canonicalHash(reportSeed as unknown as JsonValue),
    }
    await input.whileActive?.({
      runtimeServiceUrl: `http://127.0.0.1:${port}`,
      environment: Object.freeze({
        DATABASE_URL: proofDatabaseUrl.toString(),
        COWARDS_RUNTIME_SERVICE_URL: `http://127.0.0.1:${port}`,
        COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY: registryPath,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BUNDLE_PATH: authorityPath,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_PATH: authorityPublicPath,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_PATH: authorityHighWaterPath,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_GENERATION: prepared.generation,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_MIN_BUNDLE_HASH: prepared.payloadSha256,
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BOOTSTRAP: "1",
      }),
      report,
    })
    return report
  } finally {
    if (child !== undefined) await stopOwnedService(child)
    await pool.end()
    await sourcePool.end()
    await rm(proofRoot, { recursive: true, force: true })
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  const main = async (): Promise<void> => {
    const index = process.argv.indexOf("--probe-lanes-base64")
    const encoded = index < 0 ? undefined : process.argv[index + 1]
    const databaseUrl = process.env.DATABASE_URL?.trim()
    if (!encoded || !databaseUrl) fail("V137_PROOF_LOCAL_INPUT_REQUIRED")
    const report = await runProofLocalRuntimeAuthority({
      repoRoot: path.resolve(import.meta.dirname, ".."),
      databaseUrl,
      probeLanes: parseProbeLanes(encoded),
    })
    process.stdout.write(`${JSON.stringify(report)}\n`)
  }
  void main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V137_PROOF_LOCAL_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
