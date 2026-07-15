import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import {
  hashCanonicalIdentity,
} from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  hashRuntimeIdentityManifest,
  serializeRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
  type RuntimeEvidenceExactPinsV117,
  type RuntimeEvidenceGraphV117,
} from "./runtime-evidence-v1-17.js"
import type { JsonValue } from "./types.js"

const ATTESTATION_DOMAIN =
  "cowards-game:runtime-evidence-attestation:v1.17" as const
const GRAPH_DOMAIN = "cowards-game:runtime-evidence-graph:v1.17" as const
const SHA256 = /^[0-9a-f]{64}$/u
const SHA256_ID = /^sha256:[0-9a-f]{64}$/u
const GENERATION = /^(?:0|[1-9][0-9]{0,15})$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const FLOATING = /(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]/iu

export type RuntimeEvidenceVerificationModeV117 = "production" | "fixture"
export type RuntimeEvidenceTrustDomainV117 = "production" | "fixture"
export type RuntimeEvidenceBytesV117 = Readonly<Record<string, Uint8Array>>

export interface RuntimeEvidenceTrustedProducerV117 {
  producerId: string
  keyId: string
  trustDomain: RuntimeEvidenceTrustDomainV117
  managedIdentity: true
  publicKeyPem: string
}

/** Production remains deliberately empty until Phase 259 mints managed evidence. */
export const RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17:
  readonly RuntimeEvidenceTrustedProducerV117[] = Object.freeze([])

export interface RuntimeEvidenceAttestationPayloadV117 {
  schemaVersion: "runtime-evidence-attestation-v1.17"
  producerId: string
  producerKeyId: string
  trustDomain: RuntimeEvidenceTrustDomainV117
  managedIdentity: true
  identityManifest: RuntimeIdentityManifest
  graph: RuntimeEvidenceGraphV117
  issuedAt: string
  validUntil: string
  registryGeneration: string
}

export interface RuntimeEvidenceAttestationV117
  extends RuntimeEvidenceAttestationPayloadV117 {
  signatureBase64: string
}

export interface RuntimeEvidenceVerifiedSnapshotV117 {
  schemaVersion: "runtime-evidence-attestation-v1.17"
  attestationSha256: string
  producerId: string
  producerKeyId: string
  trustDomain: RuntimeEvidenceTrustDomainV117
  graphSchemaVersion: typeof RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17
  graphProfile: typeof RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17
  identityManifestRoot: string
  graphSha256: string
  bindings: readonly Readonly<{
    domain: RuntimeEvidenceGraphV117["nodes"][number]["kind"]
    publicId: string
    sha256: string
  }>[]
  exactPins: RuntimeEvidenceExactPinsV117
  issuedAt: string
  validUntil: string
  registryGeneration: string
}

export interface VerifyRuntimeEvidenceAttestationInputV117 {
  mode: RuntimeEvidenceVerificationModeV117
  attestation: RuntimeEvidenceAttestationV117
  evidenceBytes: RuntimeEvidenceBytesV117
  verificationInstant: string
  trustedProducers?: readonly RuntimeEvidenceTrustedProducerV117[]
}

export class RuntimeEvidenceAttestationV117Error extends Error {
  constructor(readonly code: string) {
    super("Runtime evidence v1.17 is uncertified.")
    this.name = "RuntimeEvidenceAttestationV117Error"
  }
}

const fail = (code: string): never => {
  throw new RuntimeEvidenceAttestationV117Error(code)
}

const exactKeys = (
  value: unknown,
  expected: readonly string[],
  code = "STRICT_SHAPE",
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code)
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length !== expected.length || expected.some((key) => !Object.hasOwn(record, key))) {
    fail(code)
  }
  return record
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!("bytes" in encoded)) return fail("CANONICAL_JSON")
  return encoded.bytes
}

const u64be = (value: number): Uint8Array => {
  const result = new Uint8Array(8)
  new DataView(result.buffer).setBigUint64(0, BigInt(value), false)
  return result
}

const frame = (domain: string, value: Uint8Array): Uint8Array => {
  const domainBytes = new TextEncoder().encode(domain)
  const result = new Uint8Array(16 + domainBytes.byteLength + value.byteLength)
  result.set(u64be(domainBytes.byteLength), 0)
  result.set(domainBytes, 8)
  const valueOffset = 8 + domainBytes.byteLength
  result.set(u64be(value.byteLength), valueOffset)
  result.set(value, valueOffset + 8)
  return result
}

const payloadValue = (
  payload: RuntimeEvidenceAttestationPayloadV117,
): RuntimeEvidenceAttestationPayloadV117 => ({
  schemaVersion: payload.schemaVersion,
  producerId: payload.producerId,
  producerKeyId: payload.producerKeyId,
  trustDomain: payload.trustDomain,
  managedIdentity: payload.managedIdentity,
  identityManifest: payload.identityManifest,
  graph: payload.graph,
  issuedAt: payload.issuedAt,
  validUntil: payload.validUntil,
  registryGeneration: payload.registryGeneration,
})

export const encodeRuntimeEvidenceAttestationPayloadV117 = (
  payload: RuntimeEvidenceAttestationPayloadV117,
): Uint8Array =>
  frame(
    ATTESTATION_DOMAIN,
    canonicalBytes(payloadValue(payload) as unknown as JsonValue),
  )

export const hashRuntimeEvidenceGraphV117 = (
  graph: Omit<RuntimeEvidenceGraphV117, "graphSha256">,
): string =>
  createHash("sha256")
    .update(frame(GRAPH_DOMAIN, canonicalBytes(graph as unknown as JsonValue)))
    .digest("hex")

const requireInstant = (value: string): number => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) fail("VALIDITY")
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) fail("VALIDITY")
  return parsed
}

const validatePins = (
  pins: RuntimeEvidenceExactPinsV117,
  nodes: ReadonlyMap<string, RuntimeEvidenceGraphV117["nodes"][number]>,
): void => {
  const record = exactKeys(pins, RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17, "EXACT_PIN")
  for (const name of RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17) {
    const value = record[name]
    if (typeof value !== "string" || value.length === 0 || value.length > 512 || FLOATING.test(value)) {
      fail("EXACT_PIN")
    }
  }
  for (const name of [
    "runtimeExecutableDigest",
    "compilerFlags",
    "adapterBuildDigest",
    "standardLibraryOrSysrootDigest",
    "budgetProfileSha256",
    "behaviorSettingsHash",
  ] as const) {
    if (!SHA256_ID.test(record[name] as string)) fail("EXACT_PIN")
  }
  const expected = {
    runtimeExecutableDigest: `sha256:${nodes.get("runtimeExecutable")?.sha256 ?? ""}`,
    adapterBuildDigest: `sha256:${nodes.get("adapterBuild")?.sha256 ?? ""}`,
    standardLibraryOrSysrootDigest: `sha256:${nodes.get("sysrootStdlib")?.sha256 ?? ""}`,
    containmentPolicyId: nodes.get("containmentPolicy")?.publicId,
    budgetProfileSha256: `sha256:${nodes.get("budgetProfile")?.sha256 ?? ""}`,
    canonicalJsonProfileId: nodes.get("canonicalJsonProfile")?.publicId,
  }
  for (const [name, value] of Object.entries(expected)) {
    if (record[name] !== value) fail("EXACT_PIN")
  }
}

const validateGraph = (
  graph: RuntimeEvidenceGraphV117,
  manifest: RuntimeIdentityManifest,
  evidenceBytes: RuntimeEvidenceBytesV117,
): void => {
  exactKeys(graph, [
    "schemaVersion",
    "profile",
    "rootNodeId",
    "identityManifestRoot",
    "nodes",
    "edges",
    "exactPins",
    "graphSha256",
  ])
  if (
    graph.schemaVersion !== RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17 ||
    graph.profile !== RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17 ||
    graph.rootNodeId !== "node:evidenceBundle" ||
    !SHA256.test(graph.identityManifestRoot) ||
    !SHA256.test(graph.graphSha256) ||
    !Array.isArray(graph.nodes) ||
    !Array.isArray(graph.edges)
  ) fail("GRAPH_SCHEMA")
  try {
    serializeRuntimeIdentityManifest(manifest)
  } catch {
    fail("IDENTITY_MANIFEST")
  }
  if (hashRuntimeIdentityManifest(manifest) !== graph.identityManifestRoot) fail("IDENTITY_MANIFEST")
  if (graph.nodes.length !== RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.length) fail("GRAPH_SCHEMA")
  const byKind = new Map<string, RuntimeEvidenceGraphV117["nodes"][number]>()
  const ids = new Set<string>()
  const publicIds = new Set<string>()
  for (const [index, node] of graph.nodes.entries()) {
    exactKeys(node, ["nodeId", "kind", "publicId", "sha256"])
    const expectedKind = RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17[index]
    if (
      node.kind !== expectedKind ||
      node.nodeId !== `node:${expectedKind}` ||
      !PUBLIC_ID.test(node.publicId) ||
      !SHA256.test(node.sha256) ||
      ids.has(node.nodeId) ||
      publicIds.has(node.publicId)
    ) fail("GRAPH_SCHEMA")
    const nodeBytes = evidenceBytes[node.nodeId]
    if (!(nodeBytes instanceof Uint8Array)) return fail("DOMAIN_DIGEST")
    if (hashCanonicalIdentity(node.kind, [nodeBytes]) !== node.sha256) fail("DOMAIN_DIGEST")
    const binding = manifest.bindings.find((candidate) => candidate.domain === node.kind)
    if (!binding || binding.publicId !== node.publicId || binding.sha256 !== node.sha256) {
      fail("IDENTITY_MANIFEST")
    }
    ids.add(node.nodeId)
    publicIds.add(node.publicId)
    byKind.set(node.kind, node)
  }
  if (
    Object.keys(evidenceBytes).length !== graph.nodes.length ||
    Object.keys(evidenceBytes).some((nodeId) => !ids.has(nodeId))
  ) fail("DOMAIN_DIGEST")
  if (graph.edges.length !== RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.length) fail("GRAPH_SCHEMA")
  const indegree = new Map(graph.nodes.map((node) => [node.nodeId, 0]))
  for (const [index, candidate] of graph.edges.entries()) {
    exactKeys(candidate, ["fromNodeId", "toNodeId", "kind"])
    const expected = RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17[index]!
    if (
      candidate.fromNodeId !== `node:${expected.from}` ||
      candidate.toNodeId !== `node:${expected.to}` ||
      candidate.kind !== expected.kind
    ) fail("GRAPH_SCHEMA")
    indegree.set(candidate.toNodeId, (indegree.get(candidate.toNodeId) ?? -1) + 1)
  }
  if (indegree.get(graph.rootNodeId) !== 0) fail("GRAPH_SCHEMA")
  const children = new Map<string, string[]>()
  for (const candidate of graph.edges) {
    const values = children.get(candidate.fromNodeId) ?? []
    values.push(candidate.toNodeId)
    children.set(candidate.fromNodeId, values)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) fail("GRAPH_SCHEMA")
    if (visited.has(id)) return
    visiting.add(id)
    for (const child of children.get(id) ?? []) visit(child)
    visiting.delete(id)
    visited.add(id)
  }
  visit(graph.rootNodeId)
  if (visited.size !== graph.nodes.length) fail("GRAPH_SCHEMA")
  validatePins(graph.exactPins, byKind)
  const { graphSha256: _hash, ...unsignedGraph } = graph
  if (hashRuntimeEvidenceGraphV117(unsignedGraph) !== graph.graphSha256) fail("GRAPH_HASH")
}

const verified = new WeakSet<object>()

export const verifyRuntimeEvidenceAttestationV117 = (
  input: VerifyRuntimeEvidenceAttestationInputV117,
): Readonly<RuntimeEvidenceVerifiedSnapshotV117> => {
  const attestation = input.attestation
  exactKeys(attestation, [
    "schemaVersion",
    "producerId",
    "producerKeyId",
    "trustDomain",
    "managedIdentity",
    "identityManifest",
    "graph",
    "issuedAt",
    "validUntil",
    "registryGeneration",
    "signatureBase64",
  ])
  if (
    attestation.schemaVersion !== "runtime-evidence-attestation-v1.17" ||
    attestation.trustDomain !== input.mode ||
    attestation.managedIdentity !== true ||
    typeof attestation.producerId !== "string" ||
    typeof attestation.producerKeyId !== "string" ||
    !GENERATION.test(attestation.registryGeneration)
  ) fail("ATTESTATION")
  const issued = requireInstant(attestation.issuedAt)
  const validUntil = requireInstant(attestation.validUntil)
  const instant = requireInstant(input.verificationInstant)
  if (issued > instant || instant > validUntil || issued > validUntil) fail("VALIDITY")
  const producers = input.mode === "production"
    ? RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17
    : (input.trustedProducers ?? [])
  const producer = producers.find(
    (candidate) =>
      candidate.producerId === attestation.producerId &&
      candidate.keyId === attestation.producerKeyId &&
      candidate.trustDomain === attestation.trustDomain &&
      candidate.managedIdentity === true,
  )
  if (!producer) return fail("UNTRUSTED_PRODUCER")
  validateGraph(attestation.graph, attestation.identityManifest, input.evidenceBytes)
  let valid = false
  try {
    valid = verifySignature(
      null,
      encodeRuntimeEvidenceAttestationPayloadV117(attestation),
      producer.publicKeyPem,
      Buffer.from(attestation.signatureBase64, "base64"),
    )
  } catch {
    fail("SIGNATURE")
  }
  if (!valid) fail("SIGNATURE")
  const snapshot: RuntimeEvidenceVerifiedSnapshotV117 = Object.freeze({
    schemaVersion: attestation.schemaVersion,
    attestationSha256: createHash("sha256")
      .update(canonicalBytes(attestation as unknown as JsonValue))
      .digest("hex"),
    producerId: attestation.producerId,
    producerKeyId: attestation.producerKeyId,
    trustDomain: attestation.trustDomain,
    graphSchemaVersion: attestation.graph.schemaVersion,
    graphProfile: attestation.graph.profile,
    identityManifestRoot: attestation.graph.identityManifestRoot,
    graphSha256: attestation.graph.graphSha256,
    bindings: Object.freeze(
      attestation.graph.nodes.map((node) =>
        Object.freeze({
          domain: node.kind,
          publicId: node.publicId,
          sha256: node.sha256,
        }),
      ),
    ),
    exactPins: Object.freeze({ ...attestation.graph.exactPins }),
    issuedAt: attestation.issuedAt,
    validUntil: attestation.validUntil,
    registryGeneration: attestation.registryGeneration,
  })
  verified.add(snapshot)
  return snapshot
}

export const getVerifiedRuntimeEvidenceAttestationSnapshotV117 = (
  value: Readonly<RuntimeEvidenceVerifiedSnapshotV117>,
): Readonly<RuntimeEvidenceVerifiedSnapshotV117> => {
  if (!verified.has(value as object)) fail("UNVERIFIED_SNAPSHOT")
  return value
}
