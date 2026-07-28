import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLE_FIELDS,
  resolveCandidateRuntimeV117SemanticTuple,
  resolveCandidateRuntimeV119SemanticTuple,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import { parseCanonicalJsonInstant } from "./canonical-instant.js"
import {
  EXECUTABLE_LANE_CERTIFICATE_KINDS,
  type ExecutableLaneCertificateKind,
  type ExecutableLaneIdentity,
} from "./runtime-evidence.js"

const SHA256_PATTERN = /^[0-9a-f]{64}$/u
const PAYLOAD_DOMAIN = "cowards-game:runtime-evidence-attestation:v1"
const GRAPH_DOMAIN = "cowards-game:runtime-evidence-graph:v1"
const LANE_DOMAIN = "cowards-game:executable-lane-identity:v1"
const encoder = new TextEncoder()

const LANE_STRING_FIELDS = [
  "providerId",
  "languageId",
  "runtimeId",
  "runtimeVersion",
  "toolchainId",
  "toolchainVersion",
  "adapterId",
  "adapterVersion",
  "policyId",
  "policyVersion",
  "corpusId",
  "corpusVersion",
  "artifactId",
  "artifactSha256",
  "implementationId",
  "buildId",
  "semanticTupleId",
] as const satisfies readonly (keyof ExecutableLaneIdentity)[]

export const RUNTIME_EVIDENCE_GRAPH_NODE_KINDS = Object.freeze([
  "attestation-root",
  "command",
  "corpus",
  "policy",
  "toolchain",
  "adapter",
  "artifact",
  "result-manifest",
  "result-trace",
  "gate-result",
] as const)

export type RuntimeEvidenceGraphNodeKind =
  (typeof RUNTIME_EVIDENCE_GRAPH_NODE_KINDS)[number]
export type RuntimeEvidenceVerificationMode = "production" | "proof-local" | "fixture"
export type RuntimeEvidenceTrustDomain = "production" | "fixture"
export type RuntimeEvidenceBytes = Readonly<Record<string, Uint8Array>>

export interface RuntimeEvidenceTrustedProducer {
  producerId: string
  keyId: string
  trustDomain: RuntimeEvidenceTrustDomain
  kind: ExecutableLaneCertificateKind
  schemaVersion: string
  commandId: string
  commandSha256: string
  corpusId: string
  corpusSha256: string
  policyId: string
  policySha256: string
  requiredGateIds: readonly string[]
  publicKeyPem: string
}

export const RUNTIME_EVIDENCE_TRUSTED_PRODUCERS: readonly RuntimeEvidenceTrustedProducer[] =
  Object.freeze([])

export interface RuntimeEvidenceGraphNode {
  nodeId: string
  kind: RuntimeEvidenceGraphNodeKind
  sha256: string
}

export interface RuntimeEvidenceGraphEdge {
  fromNodeId: string
  toNodeId: string
}

export interface RuntimeEvidenceGraph {
  rootNodeId: string
  nodes: readonly RuntimeEvidenceGraphNode[]
  edges: readonly RuntimeEvidenceGraphEdge[]
}

export interface RuntimeEvidenceBoundNode {
  id: string
  sha256: string
  nodeId: string
}

export interface RuntimeEvidenceVersionedBoundNode extends RuntimeEvidenceBoundNode {
  version: string
}

export interface RuntimeEvidenceResultDigest {
  id: string
  nodeId: string
  sha256: string
}

export interface RuntimeEvidenceGateResult {
  gateId: string
  passed: boolean
  nodeId: string
  sha256: string
}

export interface RuntimeEvidenceAttestationPayload {
  kind: ExecutableLaneCertificateKind
  schemaVersion: string
  producerId: string
  producerKeyId: string
  trustDomain: RuntimeEvidenceTrustDomain
  command: RuntimeEvidenceBoundNode
  corpus: RuntimeEvidenceBoundNode
  policy: RuntimeEvidenceBoundNode
  laneIdentity: ExecutableLaneIdentity
  laneIdentitySha256: string
  runtime: { id: string; version: string }
  toolchain: RuntimeEvidenceVersionedBoundNode
  adapter: RuntimeEvidenceVersionedBoundNode
  artifact: RuntimeEvidenceBoundNode
  result: {
    manifestId: string
    manifestNodeId: string
    manifestSha256: string
    originalEvidenceNodeId: string
    originalEvidenceSha256: string
    graphSha256: string
    digests: readonly RuntimeEvidenceResultDigest[]
  }
  gateResults: readonly RuntimeEvidenceGateResult[]
  graph: RuntimeEvidenceGraph
  issuedAt: string
  validUntil: string
  registryGeneration: string
  derivedCertificateVersion: string
}

export interface RuntimeEvidenceAttestation extends RuntimeEvidenceAttestationPayload {
  signatureBase64: string
}

export interface RuntimeEvidenceVerifiedSnapshot {
  kind: ExecutableLaneCertificateKind
  attestationSha256: string
  producerId: string
  producerKeyId: string
  trustDomain: RuntimeEvidenceTrustDomain
  schemaVersion: string
  commandId: string
  commandSha256: string
  corpusId: string
  corpusSha256: string
  policyId: string
  policySha256: string
  laneIdentity: Readonly<ExecutableLaneIdentity>
  laneIdentitySha256: string
  resultManifestSha256: string
  resultGraphSha256: string
  originalEvidenceSha256: string
  resultDigests: readonly Readonly<RuntimeEvidenceResultDigest>[]
  gateResults: readonly Readonly<RuntimeEvidenceGateResult>[]
  issuedAt: string
  validUntil: string
  registryGeneration: string
  derivedCertificateVersion: string
}

export interface VerifiedRuntimeEvidenceAttestation extends RuntimeEvidenceVerifiedSnapshot {}

export interface VerifyRuntimeEvidenceAttestationInput {
  mode: RuntimeEvidenceVerificationMode
  attestation: RuntimeEvidenceAttestation
  evidenceBytes: RuntimeEvidenceBytes
  verificationInstant: string
  trustedProducers?: readonly RuntimeEvidenceTrustedProducer[]
}

export class RuntimeEvidenceAttestationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RuntimeEvidenceAttestationError"
  }
}

const verifiedValues = new WeakSet<object>()

const fail = (message: string): never => {
  throw new RuntimeEvidenceAttestationError(message)
}

const requireString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    return fail(`${label} must be a non-empty string without NUL bytes.`)
  }
  return value
}

const requireSha256 = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    return fail(`${label} must be a lowercase SHA-256 digest.`)
  }
  return value
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const assertExactKeys: (
  value: unknown,
  expected: readonly string[],
  label: string,
) => asserts value is Record<string, unknown> = (value, expected, label) => {
  if (!isRecord(value)) {
    throw new RuntimeEvidenceAttestationError(`${label} must be an object.`)
  }
  const keys = Object.keys(value)
  const expectedSet = new Set(expected)
  if (
    keys.length !== expected.length ||
    keys.some((key) => !expectedSet.has(key))
  ) {
    fail(`${label} fields must be exactly: ${expected.join(", ")}.`)
  }
}

const frame = (parts: readonly string[]): Uint8Array => {
  const encoded = parts.map((part) => encoder.encode(part))
  const length = encoded.reduce(
    (total, bytes) =>
      total +
      encoder.encode(String(bytes.byteLength)).byteLength +
      bytes.byteLength +
      2,
    0,
  )
  const output = new Uint8Array(length)
  let offset = 0
  for (const bytes of encoded) {
    const size = encoder.encode(String(bytes.byteLength))
    output.set(size, offset)
    offset += size.byteLength
    output[offset++] = 0
    output.set(bytes, offset)
    offset += bytes.byteLength
    output[offset++] = 0
  }
  return output
}

const digest = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

const graphParts = (graph: RuntimeEvidenceGraph): string[] => [
  GRAPH_DOMAIN,
  graph.rootNodeId,
  String(graph.nodes.length),
  ...graph.nodes.flatMap((node) => [node.nodeId, node.kind, node.sha256]),
  String(graph.edges.length),
  ...graph.edges.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]),
]

export const hashRuntimeEvidenceGraph = (graph: RuntimeEvidenceGraph): string =>
  digest(frame(graphParts(graph)))

const laneParts = (identity: ExecutableLaneIdentity): string[] => [
  LANE_DOMAIN,
  ...LANE_STRING_FIELDS.flatMap((field) => [field, String(identity[field])]),
  ...CANONICAL_COMPATIBILITY_TUPLE_FIELDS.flatMap((field) => [
    field,
    identity.semanticTuple[field],
  ]),
]

export const hashExecutableLaneIdentity = (
  identity: ExecutableLaneIdentity,
): string => digest(frame(laneParts(identity)))

const payloadParts = (payload: RuntimeEvidenceAttestationPayload): string[] => [
  PAYLOAD_DOMAIN,
  payload.kind,
  payload.schemaVersion,
  payload.producerId,
  payload.producerKeyId,
  payload.trustDomain,
  payload.command.id,
  payload.command.sha256,
  payload.command.nodeId,
  payload.corpus.id,
  payload.corpus.sha256,
  payload.corpus.nodeId,
  payload.policy.id,
  payload.policy.sha256,
  payload.policy.nodeId,
  ...laneParts(payload.laneIdentity),
  payload.laneIdentitySha256,
  payload.runtime.id,
  payload.runtime.version,
  payload.toolchain.id,
  payload.toolchain.version,
  payload.toolchain.nodeId,
  payload.toolchain.sha256,
  payload.adapter.id,
  payload.adapter.version,
  payload.adapter.nodeId,
  payload.adapter.sha256,
  payload.artifact.id,
  payload.artifact.sha256,
  payload.artifact.nodeId,
  payload.result.manifestId,
  payload.result.manifestNodeId,
  payload.result.manifestSha256,
  payload.result.originalEvidenceNodeId,
  payload.result.originalEvidenceSha256,
  payload.result.graphSha256,
  String(payload.result.digests.length),
  ...payload.result.digests.flatMap((entry) => [
    entry.id,
    entry.nodeId,
    entry.sha256,
  ]),
  String(payload.gateResults.length),
  ...payload.gateResults.flatMap((entry) => [
    entry.gateId,
    entry.passed ? "true" : "false",
    entry.nodeId,
    entry.sha256,
  ]),
  ...graphParts(payload.graph),
  payload.issuedAt,
  payload.validUntil,
  payload.registryGeneration,
  payload.derivedCertificateVersion,
]

export const encodeRuntimeEvidenceAttestationPayload = (
  payload: RuntimeEvidenceAttestationPayload,
): Uint8Array => frame(payloadParts(payload))

const cloneTuple = (
  tuple: CanonicalCompatibilityTuple,
): Readonly<CanonicalCompatibilityTuple> => Object.freeze({ ...tuple })

export const parseExecutableLaneIdentity = (
  value: ExecutableLaneIdentity,
): Readonly<ExecutableLaneIdentity> => {
  assertExactKeys(
    value,
    [...LANE_STRING_FIELDS, "semanticTuple"],
    "Lane identity",
  )
  for (const field of LANE_STRING_FIELDS) {
    requireString(value[field], `Lane identity ${field}`)
  }
  requireSha256(value.artifactSha256, "Lane artifact digest")
  const selector = {
    tupleId: value.semanticTupleId,
    tuple: value.semanticTuple,
  }
  const resolved =
    resolveCanonicalCompatibilityTuple(selector) ??
    resolveCandidateRuntimeV117SemanticTuple(selector) ??
    resolveCandidateRuntimeV119SemanticTuple(selector)
  if (!resolved) {
    fail("Lane identity uses an unknown or mismatched semantic tuple.")
  }
  return Object.freeze({
    ...Object.fromEntries(
      LANE_STRING_FIELDS.map((field) => [field, value[field]]),
    ),
    semanticTuple: cloneTuple({ ...resolved!.tuple }),
  }) as Readonly<ExecutableLaneIdentity>
}

const parseInstant = (value: string, label: string): number => {
  const parsed = parseCanonicalJsonInstant(value)
  if (parsed === undefined) {
    return fail(`${label} must be a canonical ISO-8601 instant.`)
  }
  return parsed
}

const validateProducer = (producer: RuntimeEvidenceTrustedProducer): void => {
  for (const [label, value] of [
    ["producer ID", producer.producerId],
    ["producer key ID", producer.keyId],
    ["schema version", producer.schemaVersion],
    ["command ID", producer.commandId],
    ["corpus ID", producer.corpusId],
    ["policy ID", producer.policyId],
    ["public key", producer.publicKeyPem],
  ] as const) {
    requireString(value, `Trusted ${label}`)
  }
  requireSha256(producer.commandSha256, "Trusted command digest")
  requireSha256(producer.corpusSha256, "Trusted corpus digest")
  requireSha256(producer.policySha256, "Trusted policy digest")
  if (
    !(EXECUTABLE_LANE_CERTIFICATE_KINDS as readonly string[]).includes(
      producer.kind,
    )
  ) {
    fail("Trusted producer kind is invalid.")
  }
  if (producer.requiredGateIds.length === 0) {
    fail("Trusted producer must require executable gates.")
  }
  const gates = new Set<string>()
  for (const gate of producer.requiredGateIds) {
    requireString(gate, "Trusted gate ID")
    if (gates.has(gate)) fail("Trusted producer gate IDs must be unique.")
    gates.add(gate)
  }
}

const selectTrustedProducer = (
  input: VerifyRuntimeEvidenceAttestationInput,
): RuntimeEvidenceTrustedProducer => {
  if (input.mode === "production" && input.trustedProducers !== undefined) {
    fail(
      "Production verification cannot accept caller-supplied trusted producers.",
    )
  }
  const producers =
    input.mode === "production"
      ? RUNTIME_EVIDENCE_TRUSTED_PRODUCERS
      : (input.trustedProducers ?? [])
  for (const producer of producers) validateProducer(producer)
  const attestation = input.attestation
  const matches = producers.filter(
    (producer) =>
      producer.producerId === attestation.producerId &&
      producer.keyId === attestation.producerKeyId &&
      producer.trustDomain === attestation.trustDomain &&
      producer.kind === attestation.kind,
  )
  if (matches.length !== 1) {
    return fail("Attestation has no single exact trusted producer.")
  }
  const producer = matches[0]!
  if (
    (input.mode === "production" && producer.trustDomain !== "production") ||
    (input.mode === "fixture" && producer.trustDomain !== "fixture")
  ) {
    fail("Trusted producer belongs to the wrong trust domain.")
  }
  return producer
}

const validateGraph = (
  graph: RuntimeEvidenceGraph,
  bytes: RuntimeEvidenceBytes,
): Map<string, RuntimeEvidenceGraphNode> => {
  assertExactKeys(graph, ["rootNodeId", "nodes", "edges"], "Evidence graph")
  requireString(graph.rootNodeId, "Evidence graph root node ID")
  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    fail("Evidence graph nodes must be a non-empty array.")
  }
  if (!Array.isArray(graph.edges))
    fail("Evidence graph edges must be an array.")

  const byId = new Map<string, RuntimeEvidenceGraphNode>()
  for (const node of graph.nodes) {
    assertExactKeys(node, ["nodeId", "kind", "sha256"], "Evidence graph node")
    requireString(node.nodeId, "Evidence node ID")
    requireSha256(node.sha256, `Evidence node ${node.nodeId} digest`)
    if (
      !(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS as readonly string[]).includes(
        node.kind,
      )
    ) {
      fail(`Evidence node ${node.nodeId} has an unknown kind.`)
    }
    if (byId.has(node.nodeId))
      fail(`Evidence graph duplicates node ${node.nodeId}.`)
    byId.set(node.nodeId, node)
  }
  const root = byId.get(graph.rootNodeId)
  if (!root || root.kind !== "attestation-root") {
    fail("Evidence graph root is missing or has the wrong kind.")
  }

  const byteIds = Object.keys(bytes)
  if (
    byteIds.length !== byId.size ||
    byteIds.some((nodeId) => !byId.has(nodeId))
  ) {
    fail(
      "Evidence bytes must form the exact closed graph with no missing or extra bytes.",
    )
  }
  for (const [nodeId, node] of byId) {
    const value = bytes[nodeId]
    if (!(value instanceof Uint8Array))
      fail(`Evidence bytes are missing for ${nodeId}.`)
    if (digest(value!) !== node.sha256) {
      fail(`Evidence node ${nodeId} digest does not match supplied bytes.`)
    }
  }

  const adjacency = new Map<string, string[]>()
  const edgeKeys = new Set<string>()
  for (const edge of graph.edges) {
    assertExactKeys(edge, ["fromNodeId", "toNodeId"], "Evidence graph edge")
    if (!byId.has(edge.fromNodeId) || !byId.has(edge.toNodeId)) {
      fail("Evidence graph has a dangling edge.")
    }
    if (edge.fromNodeId === edge.toNodeId)
      fail("Evidence graph has a self edge.")
    const key = `${edge.fromNodeId}\0${edge.toNodeId}`
    if (edgeKeys.has(key)) fail("Evidence graph has a duplicate edge.")
    edgeKeys.add(key)
    adjacency.set(edge.fromNodeId, [
      ...(adjacency.get(edge.fromNodeId) ?? []),
      edge.toNodeId,
    ])
  }
  const reachable = new Set<string>()
  const pending = [graph.rootNodeId]
  while (pending.length > 0) {
    const nodeId = pending.pop()!
    if (reachable.has(nodeId)) continue
    reachable.add(nodeId)
    pending.push(...(adjacency.get(nodeId) ?? []))
  }
  if (reachable.size !== byId.size) {
    fail(
      "Evidence graph is open: at least one node is unreachable from the signed root.",
    )
  }
  return byId
}

const requireBoundNode = (
  nodes: ReadonlyMap<string, RuntimeEvidenceGraphNode>,
  binding: { nodeId: string; sha256: string },
  kind: RuntimeEvidenceGraphNodeKind,
  label: string,
): void => {
  const node = nodes.get(binding.nodeId)
  if (!node || node.kind !== kind || node.sha256 !== binding.sha256) {
    fail(
      `${label} is missing from the exact evidence graph or has a digest mismatch.`,
    )
  }
}

const unsignedAttestation = (
  attestation: RuntimeEvidenceAttestation,
): RuntimeEvidenceAttestationPayload => {
  const { signatureBase64: _signature, ...payload } = attestation
  return payload
}

const validateAttestationShape = (
  attestation: RuntimeEvidenceAttestation,
): void => {
  assertExactKeys(
    attestation.command,
    ["id", "sha256", "nodeId"],
    "Command binding",
  )
  assertExactKeys(
    attestation.corpus,
    ["id", "sha256", "nodeId"],
    "Corpus binding",
  )
  assertExactKeys(
    attestation.policy,
    ["id", "sha256", "nodeId"],
    "Policy binding",
  )
  assertExactKeys(attestation.runtime, ["id", "version"], "Runtime identity")
  assertExactKeys(
    attestation.toolchain,
    ["id", "version", "nodeId", "sha256"],
    "Toolchain binding",
  )
  assertExactKeys(
    attestation.adapter,
    ["id", "version", "nodeId", "sha256"],
    "Adapter binding",
  )
  assertExactKeys(
    attestation.artifact,
    ["id", "sha256", "nodeId"],
    "Artifact binding",
  )
  assertExactKeys(
    attestation.result,
    [
      "manifestId",
      "manifestNodeId",
      "manifestSha256",
      "originalEvidenceNodeId",
      "originalEvidenceSha256",
      "graphSha256",
      "digests",
    ],
    "Result binding",
  )
  if (!Array.isArray(attestation.result.digests)) {
    fail("Result digests must be an array.")
  }
  for (const resultDigest of attestation.result.digests) {
    assertExactKeys(resultDigest, ["id", "nodeId", "sha256"], "Result digest")
  }
  if (!Array.isArray(attestation.gateResults)) {
    fail("Gate results must be an array.")
  }
  for (const gate of attestation.gateResults) {
    assertExactKeys(
      gate,
      ["gateId", "passed", "nodeId", "sha256"],
      "Gate result",
    )
  }
  requireString(attestation.signatureBase64, "Attestation signature")
}

const cloneIdentity = (
  identity: Readonly<ExecutableLaneIdentity>,
): Readonly<ExecutableLaneIdentity> =>
  Object.freeze({
    ...identity,
    semanticTuple: cloneTuple({ ...identity.semanticTuple }),
  })

export const verifyRuntimeEvidenceAttestation = (
  input: VerifyRuntimeEvidenceAttestationInput,
): Readonly<VerifiedRuntimeEvidenceAttestation> => {
  if (
    input.mode !== "production" &&
    input.mode !== "proof-local" &&
    input.mode !== "fixture"
  ) {
    fail("Runtime evidence verification mode is invalid.")
  }
  const attestation = input.attestation
  assertExactKeys(
    attestation,
    [
      "kind",
      "schemaVersion",
      "producerId",
      "producerKeyId",
      "trustDomain",
      "command",
      "corpus",
      "policy",
      "laneIdentity",
      "laneIdentitySha256",
      "runtime",
      "toolchain",
      "adapter",
      "artifact",
      "result",
      "gateResults",
      "graph",
      "issuedAt",
      "validUntil",
      "registryGeneration",
      "derivedCertificateVersion",
      "signatureBase64",
    ],
    "Runtime evidence attestation",
  )
  if (
    !(EXECUTABLE_LANE_CERTIFICATE_KINDS as readonly string[]).includes(
      attestation.kind,
    )
  ) {
    fail("Attestation certificate kind is invalid.")
  }
  validateAttestationShape(attestation)
  const producer = selectTrustedProducer(input)
  const exactProducerFields = [
    [attestation.schemaVersion, producer.schemaVersion, "schema version"],
    [attestation.command.id, producer.commandId, "command ID"],
    [attestation.command.sha256, producer.commandSha256, "command digest"],
    [attestation.corpus.id, producer.corpusId, "corpus ID"],
    [attestation.corpus.sha256, producer.corpusSha256, "corpus digest"],
    [attestation.policy.id, producer.policyId, "policy ID"],
    [attestation.policy.sha256, producer.policySha256, "policy digest"],
  ] as const
  for (const [actual, expected, label] of exactProducerFields) {
    if (actual !== expected)
      fail(`Attestation ${label} does not match its trusted producer.`)
  }

  const laneIdentity = parseExecutableLaneIdentity(attestation.laneIdentity)
  requireSha256(attestation.laneIdentitySha256, "Lane identity digest")
  if (
    hashExecutableLaneIdentity({
      ...laneIdentity,
      semanticTuple: { ...laneIdentity.semanticTuple },
    }) !== attestation.laneIdentitySha256
  ) {
    fail("Lane identity digest mismatch.")
  }
  if (
    attestation.runtime.id !== laneIdentity.runtimeId ||
    attestation.runtime.version !== laneIdentity.runtimeVersion ||
    attestation.toolchain.id !== laneIdentity.toolchainId ||
    attestation.toolchain.version !== laneIdentity.toolchainVersion ||
    attestation.adapter.id !== laneIdentity.adapterId ||
    attestation.adapter.version !== laneIdentity.adapterVersion ||
    attestation.artifact.id !== laneIdentity.artifactId ||
    attestation.artifact.sha256 !== laneIdentity.artifactSha256 ||
    attestation.policy.id !== laneIdentity.policyId ||
    attestation.corpus.id !== laneIdentity.corpusId
  ) {
    fail(
      "Attestation executable identity drifted from its exact lane identity.",
    )
  }

  const nodes = validateGraph(attestation.graph, input.evidenceBytes)
  if (
    hashRuntimeEvidenceGraph(attestation.graph) !==
    attestation.result.graphSha256
  ) {
    fail("Attestation graph digest mismatch.")
  }
  requireBoundNode(nodes, attestation.command, "command", "Command evidence")
  requireBoundNode(nodes, attestation.corpus, "corpus", "Corpus evidence")
  requireBoundNode(nodes, attestation.policy, "policy", "Policy evidence")
  requireBoundNode(
    nodes,
    attestation.toolchain,
    "toolchain",
    "Toolchain evidence",
  )
  requireBoundNode(nodes, attestation.adapter, "adapter", "Adapter evidence")
  requireBoundNode(nodes, attestation.artifact, "artifact", "Artifact evidence")
  requireBoundNode(
    nodes,
    {
      nodeId: attestation.result.manifestNodeId,
      sha256: attestation.result.manifestSha256,
    },
    "result-manifest",
    "Result manifest",
  )
  requireBoundNode(
    nodes,
    {
      nodeId: attestation.result.originalEvidenceNodeId,
      sha256: attestation.result.originalEvidenceSha256,
    },
    "result-trace",
    "Original evidence",
  )

  if (
    attestation.gateResults.length !== producer.requiredGateIds.length ||
    attestation.gateResults.some(
      (gate, index) => gate.gateId !== producer.requiredGateIds[index],
    )
  ) {
    fail(
      "Attestation gate IDs must exactly match the executable producer gates.",
    )
  }
  const boundIds = new Set<string>()
  for (const gate of attestation.gateResults) {
    if (!gate.passed) fail(`Executable gate ${gate.gateId} did not pass.`)
    if (boundIds.has(gate.nodeId)) fail("Gate evidence nodes must be unique.")
    boundIds.add(gate.nodeId)
    requireBoundNode(nodes, gate, "gate-result", `Gate ${gate.gateId}`)
  }
  for (const resultDigest of attestation.result.digests) {
    if (boundIds.has(resultDigest.nodeId))
      fail("Result digest nodes must be independently bound.")
    boundIds.add(resultDigest.nodeId)
    requireBoundNode(
      nodes,
      resultDigest,
      "result-trace",
      `Result ${resultDigest.id}`,
    )
  }
  if (attestation.result.digests.length === 0) {
    fail("Attestation must bind executable result digests.")
  }

  const issuedAt = parseInstant(attestation.issuedAt, "Attestation issuedAt")
  const validUntil = parseInstant(
    attestation.validUntil,
    "Attestation validUntil",
  )
  const verificationInstant = parseInstant(
    input.verificationInstant,
    "Verification instant",
  )
  if (
    validUntil < issuedAt ||
    verificationInstant < issuedAt ||
    verificationInstant > validUntil
  ) {
    fail("Attestation is stale or not yet valid.")
  }
  requireString(
    attestation.registryGeneration,
    "Attestation registry generation",
  )
  requireString(
    attestation.derivedCertificateVersion,
    "Derived certificate version",
  )

  const payloadBytes = encodeRuntimeEvidenceAttestationPayload(
    unsignedAttestation(attestation),
  )
  const signature = Buffer.from(attestation.signatureBase64, "base64")
  if (
    signature.length === 0 ||
    signature.toString("base64") !== attestation.signatureBase64 ||
    !verifySignature(null, payloadBytes, producer.publicKeyPem, signature)
  ) {
    fail("Attestation signature is invalid.")
  }

  const result = Object.freeze({
    kind: attestation.kind,
    attestationSha256: digest(payloadBytes),
    producerId: attestation.producerId,
    producerKeyId: attestation.producerKeyId,
    trustDomain: attestation.trustDomain,
    schemaVersion: attestation.schemaVersion,
    commandId: attestation.command.id,
    commandSha256: attestation.command.sha256,
    corpusId: attestation.corpus.id,
    corpusSha256: attestation.corpus.sha256,
    policyId: attestation.policy.id,
    policySha256: attestation.policy.sha256,
    laneIdentity: cloneIdentity(laneIdentity),
    laneIdentitySha256: attestation.laneIdentitySha256,
    resultManifestSha256: attestation.result.manifestSha256,
    resultGraphSha256: attestation.result.graphSha256,
    originalEvidenceSha256: attestation.result.originalEvidenceSha256,
    resultDigests: Object.freeze(
      attestation.result.digests.map((entry) => Object.freeze({ ...entry })),
    ),
    gateResults: Object.freeze(
      attestation.gateResults.map((entry) => Object.freeze({ ...entry })),
    ),
    issuedAt: attestation.issuedAt,
    validUntil: attestation.validUntil,
    registryGeneration: attestation.registryGeneration,
    derivedCertificateVersion: attestation.derivedCertificateVersion,
  })
  verifiedValues.add(result)
  return result
}

export const getVerifiedRuntimeEvidenceAttestationSnapshot = (
  value: VerifiedRuntimeEvidenceAttestation,
): Readonly<RuntimeEvidenceVerifiedSnapshot> => {
  if (!verifiedValues.has(value)) {
    return fail(
      "Value was not minted by the runtime evidence verified attestation verifier.",
    )
  }
  return value
}
