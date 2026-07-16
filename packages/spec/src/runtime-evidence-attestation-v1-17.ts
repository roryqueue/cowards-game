import { Buffer } from "node:buffer"
import { createHash, verify as verifySignature } from "node:crypto"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  hashRuntimeIdentityManifest,
  serializeRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"
import { RUNTIME_BUDGET_PROFILE_V1_18_SHA256 } from "./runtime-budget-profile-v1-18.js"
import {
  evaluateRuntimeConformanceFreshnessV117,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceVerifiedSnapshotV117,
} from "./runtime-conformance-certificate-v1-17.js"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
  isCanonicalSafeRegistryGenerationV117,
  type RuntimeEvidenceExactPinsV117,
  type RuntimeEvidenceGraphV117,
  type RuntimeConformanceEvidenceBindingV117,
  type RuntimeConformanceEvidenceSourceV117,
} from "./runtime-evidence-v1-17.js"
import type { JsonValue } from "./types.js"

const ATTESTATION_DOMAIN =
  "cowards-game:runtime-evidence-attestation:v1.17" as const
const GRAPH_DOMAIN = "cowards-game:runtime-evidence-graph:v1.17" as const
const SHA256 = /^[0-9a-f]{64}$/u
const SHA256_ID = /^sha256:[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const FLOATING =
  /(?:^|[-_.:])(latest|current|default|any|stable|head)(?:$|[-_.:])|[*^~<>]/iu
const textEncoder = new TextEncoder()

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
export const RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17: readonly RuntimeEvidenceTrustedProducerV117[] =
  Object.freeze([])

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

export interface RuntimeEvidenceAttestationV117 extends RuntimeEvidenceAttestationPayloadV117 {
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
  if (value === null || typeof value !== "object" || Array.isArray(value))
    fail(code)
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(record, key))
  ) {
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
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value))
    fail("VALIDITY")
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value)
    fail("VALIDITY")
  return parsed
}

const validatePins = (
  pins: RuntimeEvidenceExactPinsV117,
  nodes: ReadonlyMap<string, RuntimeEvidenceGraphV117["nodes"][number]>,
): void => {
  const record = exactKeys(
    pins,
    RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
    "EXACT_PIN",
  )
  for (const name of RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17) {
    const value = record[name]
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      textEncoder.encode(value).byteLength > 512 ||
      FLOATING.test(value)
    ) {
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
  )
    fail("GRAPH_SCHEMA")
  try {
    serializeRuntimeIdentityManifest(manifest)
  } catch {
    fail("IDENTITY_MANIFEST")
  }
  if (hashRuntimeIdentityManifest(manifest) !== graph.identityManifestRoot)
    fail("IDENTITY_MANIFEST")
  if (graph.nodes.length !== RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.length)
    fail("GRAPH_SCHEMA")
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
    )
      fail("GRAPH_SCHEMA")
    const nodeBytes = evidenceBytes[node.nodeId]
    if (!(nodeBytes instanceof Uint8Array)) return fail("DOMAIN_DIGEST")
    if (hashCanonicalIdentity(node.kind, [nodeBytes]) !== node.sha256)
      fail("DOMAIN_DIGEST")
    const binding = manifest.bindings.find(
      (candidate) => candidate.domain === node.kind,
    )
    if (
      !binding ||
      binding.publicId !== node.publicId ||
      binding.sha256 !== node.sha256
    ) {
      fail("IDENTITY_MANIFEST")
    }
    ids.add(node.nodeId)
    publicIds.add(node.publicId)
    byKind.set(node.kind, node)
  }
  if (
    Object.keys(evidenceBytes).length !== graph.nodes.length ||
    Object.keys(evidenceBytes).some((nodeId) => !ids.has(nodeId))
  )
    fail("DOMAIN_DIGEST")
  if (graph.edges.length !== RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.length)
    fail("GRAPH_SCHEMA")
  const indegree = new Map(graph.nodes.map((node) => [node.nodeId, 0]))
  for (const [index, candidate] of graph.edges.entries()) {
    exactKeys(candidate, ["fromNodeId", "toNodeId", "kind"])
    const expected = RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17[index]!
    if (
      candidate.fromNodeId !== `node:${expected.from}` ||
      candidate.toNodeId !== `node:${expected.to}` ||
      candidate.kind !== expected.kind
    )
      fail("GRAPH_SCHEMA")
    indegree.set(
      candidate.toNodeId,
      (indegree.get(candidate.toNodeId) ?? -1) + 1,
    )
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
  if (hashRuntimeEvidenceGraphV117(unsignedGraph) !== graph.graphSha256)
    fail("GRAPH_HASH")
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
    !isCanonicalSafeRegistryGenerationV117(attestation.registryGeneration)
  )
    fail("ATTESTATION")
  const issued = requireInstant(attestation.issuedAt)
  const validUntil = requireInstant(attestation.validUntil)
  const instant = requireInstant(input.verificationInstant)
  if (issued > instant || instant > validUntil || issued > validUntil)
    fail("VALIDITY")
  const producers =
    input.mode === "production"
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
  validateGraph(
    attestation.graph,
    attestation.identityManifest,
    input.evidenceBytes,
  )
  let valid = false
  try {
    const signature = Buffer.from(attestation.signatureBase64, "base64")
    if (
      signature.byteLength !== 64 ||
      signature.toString("base64") !== attestation.signatureBase64
    ) {
      fail("SIGNATURE")
    }
    valid = verifySignature(
      null,
      encodeRuntimeEvidenceAttestationPayloadV117(attestation),
      producer.publicKeyPem,
      signature,
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

export interface VerifyRuntimeConformanceEvidenceBindingInputV117 {
  evidence: Readonly<RuntimeEvidenceVerifiedSnapshotV117>
  certificate: Readonly<RuntimeConformanceVerifiedSnapshotV117>
  currentIdentity: RuntimeConformanceIdentityBindingsV117
  source: RuntimeConformanceEvidenceSourceV117
  verificationInstant: string
}

export class RuntimeConformanceEvidenceBindingV117Error extends Error {
  constructor(readonly code: string) {
    super("Runtime conformance evidence binding is stale or uncertified.")
    this.name = "RuntimeConformanceEvidenceBindingV117Error"
  }
}

const bindingFail = (code: string): never => {
  throw new RuntimeConformanceEvidenceBindingV117Error(code)
}

const CONFORMANCE_SOURCE_KEYS = [
  "schemaVersion",
  "runtimeAbiVersion",
  "runtimeAbiEnvelopeSha256",
  "additiveBudgetProfileSha256",
  "supervisorOperatingSystemSha256",
  "supervisorSettingsSha256",
  "aggregateReceiptSchemaSha256",
  "supervisorIdentity",
  "caseInventorySha256",
  "resultRootSha256",
  "evidenceRootSha256",
  "runReceipts",
] as const

const SUPERVISOR_IDENTITY_KEYS = [
  "supervisorBinarySha256",
  "supervisorToolchainSha256",
  "linuxKernelSha256",
  "dockerEngineSha256",
  "dockerImageDigest",
  "cgroupDelegationSha256",
  "adapterBuildSha256",
  "runtimeCompilerSha256",
  "artifactSha256",
] as const

const RUN_RECEIPT_KEYS = ["runId", "receiptSha256"] as const

const requireSha256Id = (value: unknown, code: string): string => {
  if (typeof value !== "string" || !SHA256_ID.test(value)) bindingFail(code)
  return value as string
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const parseConformanceSource = (
  value: RuntimeConformanceEvidenceSourceV117,
): Readonly<RuntimeConformanceEvidenceSourceV117> => {
  const source = exactKeys(value, CONFORMANCE_SOURCE_KEYS, "SOURCE_SHAPE")
  if (
    source.schemaVersion !== "runtime-conformance-evidence-source-v1.17" ||
    source.runtimeAbiVersion !== "strategy-runtime-abi-v1.18" ||
    source.additiveBudgetProfileSha256 !== RUNTIME_BUDGET_PROFILE_V1_18_SHA256
  ) {
    bindingFail("SOURCE_IDENTITY")
  }
  for (const key of [
    "runtimeAbiEnvelopeSha256",
    "additiveBudgetProfileSha256",
    "supervisorOperatingSystemSha256",
    "supervisorSettingsSha256",
    "aggregateReceiptSchemaSha256",
    "caseInventorySha256",
    "resultRootSha256",
    "evidenceRootSha256",
  ] as const) {
    requireSha256Id(source[key], "SOURCE_IDENTITY")
  }
  const supervisor = exactKeys(
    source.supervisorIdentity,
    SUPERVISOR_IDENTITY_KEYS,
    "SUPERVISOR_IDENTITY",
  )
  for (const key of SUPERVISOR_IDENTITY_KEYS) {
    requireSha256Id(supervisor[key], "SUPERVISOR_IDENTITY")
  }
  if (!Array.isArray(source.runReceipts)) {
    bindingFail("RUN_RECEIPTS")
  }
  const runReceipts = source.runReceipts as unknown[]
  if (runReceipts.length !== 3) {
    bindingFail("RUN_RECEIPTS")
  }
  const seenRunIds = new Set<string>()
  const seenReceipts = new Set<string>()
  let previousRunId = ""
  for (const candidate of runReceipts) {
    const receipt = exactKeys(candidate, RUN_RECEIPT_KEYS, "RUN_RECEIPTS")
    const runId = receipt.runId
    if (
      typeof runId !== "string" ||
      !PUBLIC_ID.test(runId) ||
      runId <= previousRunId ||
      seenRunIds.has(runId)
    ) {
      bindingFail("RUN_RECEIPTS")
    }
    const receiptSha256 = requireSha256Id(receipt.receiptSha256, "RUN_RECEIPTS")
    if (seenReceipts.has(receiptSha256)) bindingFail("RUN_RECEIPTS")
    previousRunId = runId as string
    seenRunIds.add(runId as string)
    seenReceipts.add(receiptSha256)
  }
  return deepFreeze(globalThis.structuredClone(value))
}

const prefixedBindingHash = (
  evidence: RuntimeEvidenceVerifiedSnapshotV117,
  domain: RuntimeEvidenceGraphV117["nodes"][number]["kind"],
): `sha256:${string}` => {
  const binding = evidence.bindings.find(
    (candidate) => candidate.domain === domain,
  )
  if (binding === undefined) bindingFail("EVIDENCE_GRAPH")
  return `sha256:${binding!.sha256}`
}

const publicBindingId = (
  evidence: RuntimeEvidenceVerifiedSnapshotV117,
  domain: RuntimeEvidenceGraphV117["nodes"][number]["kind"],
): string => {
  const binding = evidence.bindings.find(
    (candidate) => candidate.domain === domain,
  )
  if (binding === undefined) bindingFail("EVIDENCE_GRAPH")
  return binding!.publicId
}

export const verifyRuntimeConformanceEvidenceBindingV117 = (
  input: VerifyRuntimeConformanceEvidenceBindingInputV117,
): Readonly<RuntimeConformanceEvidenceBindingV117> => {
  const evidence = getVerifiedRuntimeEvidenceAttestationSnapshotV117(
    input.evidence,
  )
  let certificateFreshness
  try {
    certificateFreshness = evaluateRuntimeConformanceFreshnessV117({
      certificate: input.certificate,
      currentIdentity: input.currentIdentity,
      verificationInstant: input.verificationInstant,
    })
  } catch {
    return bindingFail("UNVERIFIED_CERTIFICATE")
  }
  if (certificateFreshness.status !== "current") {
    bindingFail("CERTIFICATE_STALE")
  }
  const certificate = input.certificate
  const source = parseConformanceSource(input.source)
  const instant = requireInstant(input.verificationInstant)
  if (
    instant < requireInstant(evidence.issuedAt) ||
    instant > requireInstant(evidence.validUntil) ||
    evidence.trustDomain !== certificate.trustDomain ||
    evidence.registryGeneration !== certificate.registryGeneration
  ) {
    bindingFail("ATTESTATION_STALE")
  }
  const sourceHash = hashCanonicalIdentity("evidenceBundle", [
    canonicalBytes(source as unknown as JsonValue),
  ])
  const evidenceBundle = evidence.bindings.find(
    ({ domain }) => domain === "evidenceBundle",
  )
  if (evidenceBundle?.sha256 !== sourceHash) bindingFail("SOURCE_ROOT")

  const identity = certificate.identity
  const expectedIdentity = {
    corpusRootSha256: prefixedBindingHash(evidence, "conformanceCorpus"),
    fixtureSourceSha256: prefixedBindingHash(evidence, "originalSource"),
    artifactSha256: prefixedBindingHash(evidence, "artifact"),
    adapterBuildSha256: prefixedBindingHash(evidence, "adapterBuild"),
    runtimeExecutableSha256: prefixedBindingHash(evidence, "runtimeExecutable"),
    toolchainSha256: prefixedBindingHash(evidence, "compilerExecutable"),
    sysrootStdlibSha256: prefixedBindingHash(evidence, "sysrootStdlib"),
    canonicalJsonProfileId: publicBindingId(evidence, "canonicalJsonProfile"),
    budgetPolicySha256: prefixedBindingHash(evidence, "budgetProfile"),
    containmentPolicySha256: prefixedBindingHash(evidence, "containmentPolicy"),
    semanticTupleSha256: prefixedBindingHash(evidence, "semanticTuple"),
    identityManifestRoot: `sha256:${evidence.identityManifestRoot}`,
    evidenceGraphRoot: `sha256:${evidence.graphSha256}`,
    behaviorSettingsSha256: evidence.exactPins.behaviorSettingsHash,
  }
  if (
    Object.entries(expectedIdentity).some(
      ([key, value]) =>
        identity[key as keyof typeof expectedIdentity] !== value,
    ) ||
    identity.caseInventorySha256 !== source.caseInventorySha256 ||
    identity.runtimeAbiVersion !== source.runtimeAbiVersion ||
    source.supervisorIdentity.adapterBuildSha256 !==
      identity.adapterBuildSha256 ||
    source.supervisorIdentity.runtimeCompilerSha256 !==
      identity.toolchainSha256 ||
    source.supervisorIdentity.artifactSha256 !== identity.artifactSha256 ||
    source.resultRootSha256 !== certificate.resultRootSha256 ||
    source.evidenceRootSha256 !== certificate.evidenceRootSha256 ||
    source.runReceipts.some(
      ({ runId }, index) => runId !== certificate.runIds[index],
    )
  ) {
    bindingFail("BINDING_MISMATCH")
  }

  const freshUntil = new Date(
    Math.min(
      requireInstant(evidence.validUntil),
      requireInstant(certificate.freshUntil),
    ),
  ).toISOString()
  return deepFreeze<RuntimeConformanceEvidenceBindingV117>({
    schemaVersion: "runtime-conformance-evidence-binding-v1.17",
    certificateId: certificate.certificateId,
    certificateSha256: certificate.certificateSha256 as `sha256:${string}`,
    certificateVersion: certificate.certificateVersion,
    attestationSha256: evidence.attestationSha256,
    trustDomain: certificate.trustDomain,
    registryGeneration: certificate.registryGeneration,
    issuedAt: certificate.issuedAt,
    freshUntil,
    languageId: identity.languageId,
    laneId: identity.laneId,
    corpusRootSha256: identity.corpusRootSha256 as `sha256:${string}`,
    caseInventorySha256: identity.caseInventorySha256 as `sha256:${string}`,
    fixtureSourceSha256: identity.fixtureSourceSha256 as `sha256:${string}`,
    artifactSha256: identity.artifactSha256 as `sha256:${string}`,
    adapterBuildSha256: identity.adapterBuildSha256 as `sha256:${string}`,
    runtimeExecutableSha256:
      identity.runtimeExecutableSha256 as `sha256:${string}`,
    toolchainSha256: identity.toolchainSha256 as `sha256:${string}`,
    sysrootStdlibSha256: identity.sysrootStdlibSha256 as `sha256:${string}`,
    runtimeAbiVersion: source.runtimeAbiVersion,
    runtimeAbiEnvelopeSha256: source.runtimeAbiEnvelopeSha256,
    canonicalJsonProfileId: identity.canonicalJsonProfileId,
    budgetPolicySha256: identity.budgetPolicySha256 as `sha256:${string}`,
    additiveBudgetProfileSha256: source.additiveBudgetProfileSha256,
    containmentPolicySha256:
      identity.containmentPolicySha256 as `sha256:${string}`,
    semanticTupleSha256: identity.semanticTupleSha256 as `sha256:${string}`,
    identityManifestRoot: identity.identityManifestRoot as `sha256:${string}`,
    evidenceGraphRoot: identity.evidenceGraphRoot as `sha256:${string}`,
    behaviorSettingsSha256:
      identity.behaviorSettingsSha256 as `sha256:${string}`,
    supervisorOperatingSystemSha256: source.supervisorOperatingSystemSha256,
    supervisorSettingsSha256: source.supervisorSettingsSha256,
    aggregateReceiptSchemaSha256: source.aggregateReceiptSchemaSha256,
    supervisorIdentity: globalThis.structuredClone(source.supervisorIdentity),
    resultRootSha256: source.resultRootSha256,
    evidenceRootSha256: source.evidenceRootSha256,
    runIds: source.runReceipts.map(({ runId }) => runId),
    runReceiptSha256s: source.runReceipts.map(
      ({ receiptSha256 }) => receiptSha256,
    ),
  })
}
