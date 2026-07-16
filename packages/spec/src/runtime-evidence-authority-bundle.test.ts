import { Buffer } from "node:buffer"
import { createHash, generateKeyPairSync, sign, verify } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { CANONICAL_COMPATIBILITY_TUPLES } from "./integrity-authority.js"
import {
  hashRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"
import { RUNTIME_BUDGET_PROFILE_V1_18_SHA256 } from "./runtime-budget-profile-v1-18.js"
import {
  encodeRuntimeConformanceCertificatePayloadV117,
  verifyRuntimeConformanceCertificateV117,
  type RuntimeConformanceCertificateV117,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceTrustedProducerV117,
} from "./runtime-conformance-certificate-v1-17.js"
import { RuntimeExecutionEvidenceSnapshotSchema } from "./schemas.js"
import {
  RUNTIME_EVIDENCE_AUTHORITY_ATOMIC_REFRESH_CONTRACT,
  RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  assertRuntimeEvidenceAuthorityAnchorInstalled,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthoritySignatureMessage,
  encodeRuntimeEvidenceAuthorityPayload,
  evaluateRuntimeEvidenceAuthorityAntiRollback,
  hashRuntimeEvidenceAuthorityPayload,
  inspectRuntimeEvidenceAuthorityBundle,
  parseRuntimeEvidenceAuthorityHighWaterRecord,
  createRuntimeEvidenceAuthorityConformanceSourceV117,
  hashRuntimeEvidenceCertificateRecordV117,
  parseRuntimeEvidenceAuthorityBindingV117,
  parseRuntimeEvidenceAuthorityConformanceSourceV117,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
  encodeRuntimeEvidenceAuthorityPayloadV117,
  inspectRuntimeEvidenceAuthorityBundleV117,
  type RuntimeEvidenceAuthorityBindingV117,
  type RuntimeEvidenceAuthorityConformanceSourceV117,
  type RuntimeEvidenceAuthorityPayload,
  type RuntimeEvidenceAuthorityPayloadV117,
} from "./runtime-evidence-authority-bundle.js"
import { hashExecutableLaneIdentity } from "./runtime-evidence-attestation.js"
import {
  encodeRuntimeEvidenceAttestationPayloadV117,
  hashRuntimeEvidenceGraphV117,
  verifyRuntimeConformanceEvidenceBindingV117,
  verifyRuntimeEvidenceAttestationV117,
  type RuntimeEvidenceAttestationV117,
  type RuntimeEvidenceTrustedProducerV117,
} from "./runtime-evidence-attestation-v1-17.js"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  type RuntimeConformanceEvidenceSourceV117,
  type RuntimeEvidenceGraphV117,
} from "./runtime-evidence-v1-17.js"

const semanticTupleManifestHash = CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId
const laneIdentity = {
  providerId: "fixture-provider",
  languageId: "typescript",
  runtimeId: "node",
  runtimeVersion: "26.0.0",
  toolchainId: "typescript",
  toolchainVersion: "6.0.3",
  adapterId: "worker-thread",
  adapterVersion: "1",
  policyId: "fixture-policy",
  policyVersion: "1",
  corpusId: "fixture-corpus",
  corpusVersion: "1",
  artifactId: "fixture-artifact",
  artifactSha256: "2".repeat(64),
  implementationId: "fixture-runtime-service",
  buildId: "fixture-build",
  semanticTupleId: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
  semanticTuple: CANONICAL_COMPATIBILITY_TUPLES[0]!.tuple,
}
const laneIdentityHash = `sha256:${hashExecutableLaneIdentity(laneIdentity)}`
const attestationHash = `sha256:${"3".repeat(64)}`
const certificateRecordHash = `sha256:${"4".repeat(64)}`

const fixtureBindingV117 = (): RuntimeEvidenceAuthorityBindingV117 => ({
  graphSchemaVersion: "runtime-evidence-graph-v1.17",
  graphProfile: "runtime-identity-evidence-dag-v1",
  identityManifestRoot: `sha256:${"1".repeat(64)}`,
  evidenceGraphRoot: `sha256:${"2".repeat(64)}`,
  exactPins: [
    ["runtimeExecutableDigest", `sha256:${"3".repeat(64)}`],
    ["reportedVersion", "node-v26.0.0"],
    ["targetAbi", "linux-amd64-gnu"],
    ["compilerFlags", `sha256:${"4".repeat(64)}`],
    ["adapterBuildDigest", `sha256:${"5".repeat(64)}`],
    ["standardLibraryOrSysrootDigest", `sha256:${"6".repeat(64)}`],
    ["containmentPolicyId", "policy.containment.v1"],
    ["budgetProfileSha256", `sha256:${"7".repeat(64)}`],
    ["canonicalJsonProfileId", "canonical-json-v1.1"],
    ["behaviorSettingsHash", `sha256:${"8".repeat(64)}`],
  ],
})

const fixtureConformanceSourceV117 =
  (): RuntimeEvidenceAuthorityConformanceSourceV117 => ({
    schemaVersion: "runtime-evidence-authority-conformance-source-v1.17",
    certificateSha256: `sha256:${"9".repeat(64)}`,
    attestationSha256: `sha256:${"a".repeat(64)}`,
    conformanceBindingSha256: `sha256:${"b".repeat(64)}`,
    languageId: "typescript",
    laneId: "lane:typescript:linux-cgroup-v2",
    corpusRootSha256: `sha256:${"c".repeat(64)}`,
    caseInventorySha256: `sha256:${"d".repeat(64)}`,
    identityManifestRoot: `sha256:${"1".repeat(64)}`,
    evidenceGraphRoot: `sha256:${"2".repeat(64)}`,
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    runtimeAbiEnvelopeSha256: `sha256:${"e".repeat(64)}`,
    additiveBudgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    supervisorIdentityRootSha256: `sha256:${"3".repeat(64)}`,
    resultRootSha256: `sha256:${"4".repeat(64)}`,
    evidenceRootSha256: `sha256:${"5".repeat(64)}`,
    runReceiptRootSha256: `sha256:${"6".repeat(64)}`,
    registryGeneration: "7",
    freshUntil: "2026-08-10T00:00:00.000Z",
  })

const canonicalSourceBytes = (
  source: RuntimeConformanceEvidenceSourceV117,
): Uint8Array => {
  const encoded = encodeCanonicalJson(source as never, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  return encoded.bytes
}

const buildVerifiedAuthoritySourceV117 = () => {
  const hash = (character: string): `sha256:${string}` =>
    `sha256:${character.repeat(64)}`
  const nodeBytes = Object.fromEntries(
    RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => [
      `node:${kind}`,
      new TextEncoder().encode(`fixture:${kind}:bytes:v1`),
    ]),
  ) as Record<string, Uint8Array>
  const fixedNodeHash = (
    kind: (typeof RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17)[number],
  ): `sha256:${string}` =>
    `sha256:${hashCanonicalIdentity(kind, [nodeBytes[`node:${kind}`]!] as const)}`
  const source: RuntimeConformanceEvidenceSourceV117 = {
    schemaVersion: "runtime-conformance-evidence-source-v1.17",
    runtimeAbiVersion: "strategy-runtime-abi-v1.18",
    runtimeAbiEnvelopeSha256: hash("6"),
    additiveBudgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    supervisorOperatingSystemSha256: hash("7"),
    supervisorSettingsSha256: hash("8"),
    aggregateReceiptSchemaSha256: hash("9"),
    supervisorIdentity: {
      supervisorBinarySha256: hash("a"),
      supervisorToolchainSha256: hash("b"),
      linuxKernelSha256: hash("c"),
      dockerEngineSha256: hash("d"),
      dockerImageDigest: hash("e"),
      cgroupDelegationSha256: hash("f"),
      adapterBuildSha256: fixedNodeHash("adapterBuild"),
      runtimeCompilerSha256: fixedNodeHash("compilerExecutable"),
      artifactSha256: fixedNodeHash("artifact"),
    },
    caseInventorySha256: hash("4"),
    resultRootSha256: hash("5"),
    evidenceRootSha256: hash("6"),
    runReceipts: [1, 2, 3].map((index) => ({
      runId: `run:typescript:${index}`,
      receiptSha256: hash(String(index)),
    })),
  }
  nodeBytes["node:evidenceBundle"] = canonicalSourceBytes(source)
  const bindings = RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => ({
    domain: kind,
    publicId: `fixture.${kind}.v1`,
    sha256: hashCanonicalIdentity(kind, [nodeBytes[`node:${kind}`]!]),
  }))
  const manifest: RuntimeIdentityManifest = {
    schemaVersion: "runtime-identity-manifest-v1",
    profile: "runtime-identity-v1",
    bindings,
  }
  const graphWithoutHash = {
    schemaVersion: RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
    profile: RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
    rootNodeId: "node:evidenceBundle",
    identityManifestRoot: hashRuntimeIdentityManifest(manifest),
    nodes: bindings.map((binding) => ({
      nodeId: `node:${binding.domain}`,
      kind: binding.domain,
      publicId: binding.publicId,
      sha256: binding.sha256,
    })),
    edges: RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.map((edge) => ({
      fromNodeId: `node:${edge.from}`,
      toNodeId: `node:${edge.to}`,
      kind: edge.kind,
    })),
    exactPins: {
      runtimeExecutableDigest: fixedNodeHash("runtimeExecutable"),
      reportedVersion: "node-v26.0.0",
      targetAbi: "linux-amd64-gnu",
      compilerFlags: hash("1"),
      adapterBuildDigest: fixedNodeHash("adapterBuild"),
      standardLibraryOrSysrootDigest: fixedNodeHash("sysrootStdlib"),
      containmentPolicyId: "fixture.containmentPolicy.v1",
      budgetProfileSha256: fixedNodeHash("budgetProfile"),
      canonicalJsonProfileId: "fixture.canonicalJsonProfile.v1",
      behaviorSettingsHash: hash("2"),
    },
  }
  const graph: RuntimeEvidenceGraphV117 = {
    ...graphWithoutHash,
    graphSha256: hashRuntimeEvidenceGraphV117(graphWithoutHash),
  }
  const evidenceKeys = generateKeyPairSync("ed25519")
  const evidencePayload = {
    schemaVersion: "runtime-evidence-attestation-v1.17" as const,
    producerId: "fixture-managed-builder",
    producerKeyId: "fixture-managed-builder-key",
    trustDomain: "fixture" as const,
    managedIdentity: true as const,
    identityManifest: manifest,
    graph,
    issuedAt: "2026-07-14T00:00:00.000Z",
    validUntil: "2026-08-10T00:00:00.000Z",
    registryGeneration: "7",
  }
  const attestation: RuntimeEvidenceAttestationV117 = {
    ...evidencePayload,
    signatureBase64: sign(
      null,
      encodeRuntimeEvidenceAttestationPayloadV117(evidencePayload),
      evidenceKeys.privateKey,
    ).toString("base64"),
  }
  const evidenceProducer: RuntimeEvidenceTrustedProducerV117 = {
    producerId: evidencePayload.producerId,
    keyId: evidencePayload.producerKeyId,
    trustDomain: "fixture",
    managedIdentity: true,
    publicKeyPem: evidenceKeys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  const byKind = (kind: (typeof bindings)[number]["domain"]) =>
    graph.nodes.find((node) => node.kind === kind)!
  const identity: RuntimeConformanceIdentityBindingsV117 = {
    languageId: "typescript",
    laneId: "lane:typescript:linux-cgroup-v2",
    corpusRootSha256: `sha256:${byKind("conformanceCorpus").sha256}`,
    caseInventorySha256: source.caseInventorySha256,
    fixtureSourceSha256: `sha256:${byKind("originalSource").sha256}`,
    artifactSha256: `sha256:${byKind("artifact").sha256}`,
    adapterBuildSha256: `sha256:${byKind("adapterBuild").sha256}`,
    runtimeExecutableSha256: `sha256:${byKind("runtimeExecutable").sha256}`,
    toolchainSha256: `sha256:${byKind("compilerExecutable").sha256}`,
    sysrootStdlibSha256: `sha256:${byKind("sysrootStdlib").sha256}`,
    runtimeAbiVersion: source.runtimeAbiVersion,
    canonicalJsonProfileId: byKind("canonicalJsonProfile").publicId,
    budgetPolicySha256: `sha256:${byKind("budgetProfile").sha256}`,
    containmentPolicySha256: `sha256:${byKind("containmentPolicy").sha256}`,
    semanticTupleSha256: `sha256:${byKind("semanticTuple").sha256}`,
    identityManifestRoot: `sha256:${graph.identityManifestRoot}`,
    evidenceGraphRoot: `sha256:${graph.graphSha256}`,
    behaviorSettingsSha256: graph.exactPins.behaviorSettingsHash,
  }
  const certificateKeys = generateKeyPairSync("ed25519")
  const certificatePayload = {
    schemaVersion: "runtime-conformance-certificate-v1.17" as const,
    certificateId: "certificate:typescript:generation-7",
    certificateVersion: "runtime-conformance-certificate-v1.17" as const,
    producerId: "fixture-managed-conformance-builder",
    producerKeyId: "fixture-managed-conformance-key",
    trustDomain: "fixture" as const,
    managedIdentity: true as const,
    registryGeneration: "7",
    issuedAt: "2026-07-16T00:00:00.000Z",
    requestedValidUntil: "2026-09-01T00:00:00.000Z",
    freshUntil: "2026-08-10T00:00:00.000Z",
    identity,
    runs: source.runReceipts.map((receipt, index) => ({
      runId: receipt.runId,
      workspaceId: `workspace:typescript:${index + 1}`,
      processId: `process:typescript:${index + 1}`,
      status: "passed" as const,
      complete: true,
      freshWorkspace: true,
      freshProcess: true,
      skippedCaseCount: 0,
      unsupportedCaseCount: 0,
      fallbackUsed: false,
      syntheticEvidence: false,
      caseCount: 64,
      startedAt: `2026-07-15T0${index}:00:00.000Z`,
      completedAt: `2026-07-15T0${index}:10:00.000Z`,
      validUntil: "2026-08-10T00:00:00.000Z",
      identity: globalThis.structuredClone(identity),
      resultRootSha256: source.resultRootSha256,
      evidenceRootSha256: source.evidenceRootSha256,
    })),
  }
  const certificate: RuntimeConformanceCertificateV117 = {
    ...certificatePayload,
    signatureBase64: sign(
      null,
      encodeRuntimeConformanceCertificatePayloadV117(certificatePayload),
      certificateKeys.privateKey,
    ).toString("base64"),
  }
  const certificateProducer: RuntimeConformanceTrustedProducerV117 = {
    producerId: certificate.producerId,
    keyId: certificate.producerKeyId,
    trustDomain: "fixture",
    managedIdentity: true,
    publicKeyPem: certificateKeys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  const evidence = verifyRuntimeEvidenceAttestationV117({
    mode: "fixture",
    attestation,
    evidenceBytes: nodeBytes,
    verificationInstant: "2026-07-20T00:00:00.000Z",
    trustedProducers: [evidenceProducer],
  })
  const conformance = verifyRuntimeConformanceCertificateV117({
    mode: "fixture",
    certificate,
    currentIdentity: identity,
    expectedRunBinding: {
      caseInventorySha256: source.caseInventorySha256,
      requiredCaseCount: 64,
      resultRootSha256: source.resultRootSha256,
    },
    verificationInstant: "2026-07-20T00:00:00.000Z",
    trustedProducers: [certificateProducer],
  })
  const verifiedBinding = verifyRuntimeConformanceEvidenceBindingV117({
    evidence,
    certificate: conformance,
    currentIdentity: identity,
    source,
    verificationInstant: "2026-07-20T00:00:00.000Z",
  })
  return createRuntimeEvidenceAuthorityConformanceSourceV117(verifiedBinding)
}

const fixturePayload = (
  overrides: Partial<RuntimeEvidenceAuthorityPayload> = {},
): RuntimeEvidenceAuthorityPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  bundleVersion: "v1.37-fixture-bundle-v1",
  registryGeneration: "7",
  issuedAt: "2026-07-12T00:00:00.000Z",
  validFrom: "2026-07-12T00:00:00.000Z",
  validUntil: "2026-07-13T00:00:00.000Z",
  semanticTupleManifestHash,
  attestations: [],
  certificates: [],
  revocations: [],
  supersessions: [],
  operatorLaneDisables: [],
  ...overrides,
})

const signedBundle = (
  payload = fixturePayload(),
  trustDomain: string = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
) => {
  const keys = generateKeyPairSync("ed25519")
  const payloadBytes = encodeRuntimeEvidenceAuthorityPayload(payload)
  const signatureMessage = encodeRuntimeEvidenceAuthoritySignatureMessage({
    trustDomain,
    keyId: "fixture-ed25519-key",
    payloadBytes,
  })
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId: "fixture-ed25519-key",
    payloadBytes,
    signature: sign(null, signatureMessage, keys.privateKey),
  })
  return {
    keys,
    payloadBytes,
    serialized: `${JSON.stringify(envelope)}\n`,
  }
}

const signRawV117Payload = (payload: RuntimeEvidenceAuthorityPayloadV117) => {
  const keys = generateKeyPairSync("ed25519")
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
  const trustDomain = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
  const keyId = "fixture-v1.17-adversarial-key"
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId,
    payloadBytes,
    signature: sign(
      null,
      encodeRuntimeEvidenceAuthoritySignatureMessage({
        trustDomain,
        keyId,
        payloadBytes,
      }),
      keys.privateKey,
    ),
  })
  return { keys, keyId, serialized: JSON.stringify(envelope) }
}

const hashRawConformanceRecordV117 = (input: {
  certificateId: string
  certificateVersion: string
  attestationId: string
  binding: RuntimeEvidenceAuthorityBindingV117
  conformanceSource: RuntimeEvidenceAuthorityConformanceSourceV117
}): string => {
  const parts = [
    "cowards-game:runtime-evidence-certificate-record:v1.17",
    "conformance",
    input.certificateId,
    input.certificateVersion,
    input.attestationId,
    input.binding.graphSchemaVersion,
    input.binding.graphProfile,
    input.binding.identityManifestRoot,
    input.binding.evidenceGraphRoot,
    ...input.binding.exactPins.flatMap(([name, value]) => [name, value]),
    ...[
      "schemaVersion",
      "certificateSha256",
      "attestationSha256",
      "conformanceBindingSha256",
      "languageId",
      "laneId",
      "corpusRootSha256",
      "caseInventorySha256",
      "identityManifestRoot",
      "evidenceGraphRoot",
      "runtimeAbiVersion",
      "runtimeAbiEnvelopeSha256",
      "additiveBudgetProfileSha256",
      "supervisorIdentityRootSha256",
      "resultRootSha256",
      "evidenceRootSha256",
      "runReceiptRootSha256",
      "registryGeneration",
      "freshUntil",
    ].map((key) =>
      String(
        input.conformanceSource[
          key as keyof RuntimeEvidenceAuthorityConformanceSourceV117
        ],
      ),
    ),
  ]
  const encoded = parts.map((part) => new TextEncoder().encode(part))
  const framed = Buffer.alloc(
    encoded.reduce((total, part) => total + 8 + part.byteLength, 0),
  )
  let offset = 0
  for (const part of encoded) {
    framed.writeBigUInt64BE(BigInt(part.byteLength), offset)
    offset += 8
    framed.set(part, offset)
    offset += part.byteLength
  }
  return `sha256:${createHash("sha256").update(framed).digest("hex")}`
}

describe("runtime evidence authority bundle", () => {
  it("recomputes the complete public-safe v1.17 binding instead of trusting a shallow reference", () => {
    const binding = fixtureBindingV117()
    expect(parseRuntimeEvidenceAuthorityBindingV117(binding)).toEqual(binding)
    const first = hashRuntimeEvidenceCertificateRecordV117({
      certificateKind: "containment",
      certificateId: "certificate:v1.17:fixture",
      certificateVersion: "runtime-certificate-v1.17",
      attestationId: "attestation:v1.17:fixture",
      binding,
    })
    expect(first).toMatch(/^sha256:[0-9a-f]{64}$/u)
    const tampered = {
      ...binding,
      exactPins: binding.exactPins.map(
        ([name, value]) => [name, value] as [typeof name, string],
      ),
    }
    tampered.exactPins[0]![1] = `sha256:${"f".repeat(64)}`
    expect(
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "containment",
        certificateId: "certificate:v1.17:fixture",
        certificateVersion: "runtime-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding: tampered,
      }),
    ).not.toBe(first)
    expect(
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "conformance",
        certificateId: "certificate:v1.17:fixture",
        certificateVersion: "runtime-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding,
      }),
    ).not.toBe(first)
  })

  it("hashes the exact Phase-259 conformance source into the existing certificate record", () => {
    const binding = fixtureBindingV117()
    const source = fixtureConformanceSourceV117()
    expect(parseRuntimeEvidenceAuthorityConformanceSourceV117(source)).toEqual(
      source,
    )
    const first = hashRuntimeEvidenceCertificateRecordV117({
      certificateKind: "conformance",
      certificateId: "certificate:typescript:generation-7",
      certificateVersion: "runtime-conformance-certificate-v1.17",
      attestationId: "attestation:v1.17:fixture",
      binding,
      conformanceSource: source,
    })
    for (const key of [
      "certificateSha256",
      "attestationSha256",
      "conformanceBindingSha256",
      "corpusRootSha256",
      "caseInventorySha256",
      "runtimeAbiEnvelopeSha256",
      "supervisorIdentityRootSha256",
      "resultRootSha256",
      "evidenceRootSha256",
      "runReceiptRootSha256",
    ] as const) {
      const changed = {
        ...source,
        [key]: `sha256:${"0".repeat(64)}`,
      }
      expect(
        hashRuntimeEvidenceCertificateRecordV117({
          certificateKind: "conformance",
          certificateId: "certificate:typescript:generation-7",
          certificateVersion: "runtime-conformance-certificate-v1.17",
          attestationId: "attestation:v1.17:fixture",
          binding,
          conformanceSource: changed,
        }),
        key,
      ).not.toBe(first)
    }
    expect(() =>
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "conformance",
        certificateId: "certificate:typescript:generation-7",
        certificateVersion: "runtime-conformance-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding,
        conformanceSource: {
          ...source,
          additiveBudgetProfileSha256: `sha256:${"0".repeat(64)}`,
        },
      }),
    ).toThrow(/source/iu)
    expect(() =>
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "conformance",
        certificateId: "certificate:typescript:generation-7",
        certificateVersion: "runtime-conformance-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding,
      }),
    ).toThrow(/certificate/iu)
  })

  it.each([
    ["runtimeExecutableDigest", "not-a-hash"],
    ["reportedVersion", "latest"],
    ["targetAbi", "*"],
    ["compilerFlags", "x"],
    ["containmentPolicyId", "default"],
    ["canonicalJsonProfileId", "current"],
  ] as const)(
    "rejects floating or malformed %s authority pins",
    (name, value) => {
      const binding = fixtureBindingV117()
      const exactPins = binding.exactPins.map(
        ([pinName, pinValue]) =>
          [pinName, pinName === name ? value : pinValue] as const,
      )
      expect(() =>
        parseRuntimeEvidenceAuthorityBindingV117({ ...binding, exactPins }),
      ).toThrow(/binding/iu)
    },
  )

  it("signs and revalidates the exact v1.17 binding through the mounted envelope", () => {
    const binding = fixtureBindingV117()
    const attestationId = "attestation:v1.17:fixture"
    const certificateId = "certificate:v1.17:fixture"
    const certificateVersion = "runtime-certificate-v1.17"
    const payload = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
      bundleVersion: "bundle:v1.17:fixture",
      registryGeneration: "7",
      issuedAt: "2026-07-14T00:00:00.000Z",
      validFrom: "2026-07-14T00:00:00.000Z",
      validUntil: "2026-07-15T00:00:00.000Z",
      semanticTupleManifestHash,
      sourceManifestHash: `sha256:${"9".repeat(64)}`,
      attestations: [
        {
          attestationId,
          attestationHash: `sha256:${"a".repeat(64)}`,
          producerId: "fixture-managed",
          producerKeyId: "fixture-key",
          trustDomain: "fixture" as const,
          managedIdentity: true as const,
          imports: [],
          binding,
        },
      ],
      certificates: [
        {
          certificateId,
          certificateVersion,
          certificateRecordHash: hashRuntimeEvidenceCertificateRecordV117({
            certificateKind: "containment",
            certificateId,
            certificateVersion,
            attestationId,
            binding,
          }),
          certificateKind: "containment" as const,
          attestationId,
          binding,
        },
      ],
    }
    const keys = generateKeyPairSync("ed25519")
    const payloadBytes = encodeRuntimeEvidenceAuthorityPayloadV117(payload)
    const trustDomain = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
    const keyId = "fixture-v1.17-key"
    const envelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain,
      keyId,
      payloadBytes,
      signature: sign(
        null,
        encodeRuntimeEvidenceAuthoritySignatureMessage({
          trustDomain,
          keyId,
          payloadBytes,
        }),
        keys.privateKey,
      ),
    })
    const inspected = inspectRuntimeEvidenceAuthorityBundleV117(
      JSON.stringify(envelope),
      {
        expectedTrustDomain: trustDomain,
        evaluationInstant: "2026-07-14T12:00:00.000Z",
        trustedKeyIds: [keyId],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, keys.publicKey, signature),
      },
    )
    expect(inspected.payload.certificates[0]?.binding).toEqual(binding)
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayloadV117({
        ...payload,
        registryGeneration: "9999999999999999",
      }),
    ).toThrow(/generation/iu)
    const confusedPayload: RuntimeEvidenceAuthorityPayloadV117 =
      globalThis.structuredClone(payload)
    confusedPayload.attestations[0]!.trustDomain = "production"
    const confusedBytes =
      encodeRuntimeEvidenceAuthorityPayloadV117(confusedPayload)
    const confusedEnvelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain,
      keyId,
      payloadBytes: confusedBytes,
      signature: sign(
        null,
        encodeRuntimeEvidenceAuthoritySignatureMessage({
          trustDomain,
          keyId,
          payloadBytes: confusedBytes,
        }),
        keys.privateKey,
      ),
    })
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundleV117(
        JSON.stringify(confusedEnvelope),
        {
          expectedTrustDomain: trustDomain,
          evaluationInstant: "2026-07-14T12:00:00.000Z",
          trustedKeyIds: [keyId],
          verifySignature: ({ signedMessageBytes, signature }) =>
            verify(null, signedMessageBytes, keys.publicKey, signature),
        },
      ),
    ).toThrow(/trust domain/iu)
    const tampered = globalThis.structuredClone(payload)
    tampered.certificates[0]!.binding = {
      ...tampered.certificates[0]!.binding,
      exactPins: tampered.certificates[0]!.binding.exactPins.map(
        ([name, value], index) =>
          [name, index === 9 ? `sha256:${"f".repeat(64)}` : value] as const,
      ),
    }
    expect(() => encodeRuntimeEvidenceAuthorityPayloadV117(tampered)).toThrow(
      /authority graph|certificate/iu,
    )
  })

  it("signs the exact conformance source without trusting caller-shaped request status", () => {
    const binding = fixtureBindingV117()
    const conformanceSource = buildVerifiedAuthoritySourceV117()
    binding.identityManifestRoot = conformanceSource.identityManifestRoot
    binding.evidenceGraphRoot = conformanceSource.evidenceGraphRoot
    const attestationId = "attestation:v1.17:conformance"
    const certificateId = "certificate:typescript:generation-7"
    const certificateVersion = "runtime-conformance-certificate-v1.17"
    const certificateRecordHash = hashRuntimeEvidenceCertificateRecordV117({
      certificateKind: "conformance",
      certificateId,
      certificateVersion,
      attestationId,
      binding,
      conformanceSource,
    })
    const payload: RuntimeEvidenceAuthorityPayloadV117 = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
      bundleVersion: "bundle:v1.17:conformance:fixture",
      registryGeneration: "7",
      issuedAt: "2026-07-16T00:00:00.000Z",
      validFrom: "2026-07-16T00:00:00.000Z",
      validUntil: "2026-07-17T00:00:00.000Z",
      semanticTupleManifestHash,
      sourceManifestHash: `sha256:${"7".repeat(64)}`,
      attestations: [
        {
          attestationId,
          attestationHash: conformanceSource.attestationSha256,
          producerId: "fixture-managed",
          producerKeyId: "fixture-key",
          trustDomain: "fixture",
          managedIdentity: true,
          imports: [],
          binding,
        },
      ],
      certificates: [
        {
          certificateId,
          certificateVersion,
          certificateRecordHash,
          certificateKind: "conformance",
          attestationId,
          binding,
          conformanceSource,
        },
      ],
    }
    const keys = generateKeyPairSync("ed25519")
    const payloadBytes = encodeRuntimeEvidenceAuthorityPayloadV117(payload)
    const trustDomain = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
    const keyId = "fixture-v1.17-conformance-key"
    const envelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain,
      keyId,
      payloadBytes,
      signature: sign(
        null,
        encodeRuntimeEvidenceAuthoritySignatureMessage({
          trustDomain,
          keyId,
          payloadBytes,
        }),
        keys.privateKey,
      ),
    })
    const inspected = inspectRuntimeEvidenceAuthorityBundleV117(
      JSON.stringify(envelope),
      {
        expectedTrustDomain: trustDomain,
        evaluationInstant: "2026-07-16T12:00:00.000Z",
        trustedKeyIds: [keyId],
        resolveConformanceSource: () => conformanceSource,
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, keys.publicKey, signature),
      },
    )
    expect(inspected.payload.certificates[0]).toMatchObject({
      certificateId,
      certificateRecordHash,
      conformanceSource,
    })

    const aliased = globalThis.structuredClone(payload)
    const aliasedCertificateId = "certificate:typescript:aliased-generation-7"
    aliased.certificates[0]!.certificateId = aliasedCertificateId
    aliased.certificates[0]!.certificateRecordHash =
      hashRawConformanceRecordV117({
        certificateId: aliasedCertificateId,
        certificateVersion,
        attestationId,
        binding,
        conformanceSource: aliased.certificates[0]!.conformanceSource!,
      })
    const signedAlias = signRawV117Payload(aliased)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundleV117(signedAlias.serialized, {
        expectedTrustDomain: trustDomain,
        evaluationInstant: "2026-07-16T12:00:00.000Z",
        trustedKeyIds: [signedAlias.keyId],
        resolveConformanceSource: () => conformanceSource,
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(
            null,
            signedMessageBytes,
            signedAlias.keys.publicKey,
            signature,
          ),
      }),
    ).toThrow(/source|certificate/iu)

    for (const mutate of [
      (value: RuntimeEvidenceAuthorityPayloadV117) => {
        delete value.certificates[0]!.conformanceSource
      },
      (value: RuntimeEvidenceAuthorityPayloadV117) => {
        value.certificates[0]!.conformanceSource!.registryGeneration = "6"
      },
      (value: RuntimeEvidenceAuthorityPayloadV117) => {
        value.certificates[0]!.conformanceSource!.evidenceGraphRoot = `sha256:${"0".repeat(64)}`
      },
      (value: RuntimeEvidenceAuthorityPayloadV117) => {
        value.certificates[0]!.conformanceSource!.freshUntil =
          "2026-07-16T11:59:59.999Z"
      },
    ]) {
      const changed = globalThis.structuredClone(payload)
      mutate(changed)
      expect(() => encodeRuntimeEvidenceAuthorityPayloadV117(changed)).toThrow()
    }
  })

  it.each([
    [
      "language/lane confusion",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.laneId = "lane:python:linux-cgroup-v2"
      },
    ],
    [
      "noncanonical additive budget",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.additiveBudgetProfileSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "mismatched attestation reference",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.attestationSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "self-certified certificate root",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.certificateSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "shallow conformance binding root",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.conformanceBindingSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "shallow supervisor root",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.supervisorIdentityRootSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "shallow run receipt root",
      (source: RuntimeEvidenceAuthorityConformanceSourceV117) => {
        source.runReceiptRootSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
  ] as const)("rejects fully rehashed and resigned %s", (_name, mutate) => {
    const expectedSource = buildVerifiedAuthoritySourceV117()
    const conformanceSource = globalThis.structuredClone(expectedSource)
    mutate(conformanceSource)
    const binding = fixtureBindingV117()
    binding.identityManifestRoot = conformanceSource.identityManifestRoot
    binding.evidenceGraphRoot = conformanceSource.evidenceGraphRoot
    const attestationId = "attestation:v1.17:conformance"
    const certificateId = "certificate:typescript:generation-7"
    const certificateVersion = "runtime-conformance-certificate-v1.17"
    const payload: RuntimeEvidenceAuthorityPayloadV117 = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
      bundleVersion: "bundle:v1.17:adversarial",
      registryGeneration: "7",
      issuedAt: "2026-07-16T00:00:00.000Z",
      validFrom: "2026-07-16T00:00:00.000Z",
      validUntil: "2026-07-17T00:00:00.000Z",
      semanticTupleManifestHash,
      sourceManifestHash: `sha256:${"7".repeat(64)}`,
      attestations: [
        {
          attestationId,
          attestationHash: expectedSource.attestationSha256,
          producerId: "fixture-managed",
          producerKeyId: "fixture-key",
          trustDomain: "fixture",
          managedIdentity: true,
          imports: [],
          binding,
        },
      ],
      certificates: [
        {
          certificateId,
          certificateVersion,
          certificateRecordHash: hashRawConformanceRecordV117({
            certificateId,
            certificateVersion,
            attestationId,
            binding,
            conformanceSource,
          }),
          certificateKind: "conformance",
          attestationId,
          binding,
          conformanceSource,
        },
      ],
    }
    const signed = signRawV117Payload(payload)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundleV117(signed.serialized, {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-16T12:00:00.000Z",
        trustedKeyIds: [signed.keyId],
        resolveConformanceSource: () => expectedSource,
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, signed.keys.publicKey, signature),
      }),
    ).toThrow(/source|authority|certificate/iu)
  })

  it("rejects unbranded construction and unresolved or clone-resolved signed sources", () => {
    const expectedSource = buildVerifiedAuthoritySourceV117()
    const binding = fixtureBindingV117()
    binding.identityManifestRoot = expectedSource.identityManifestRoot
    binding.evidenceGraphRoot = expectedSource.evidenceGraphRoot
    const attestationId = "attestation:v1.17:conformance"
    const certificateId = "certificate:typescript:generation-7"
    const certificateVersion = "runtime-conformance-certificate-v1.17"
    const certificateRecordHash = hashRuntimeEvidenceCertificateRecordV117({
      certificateKind: "conformance",
      certificateId,
      certificateVersion,
      attestationId,
      binding,
      conformanceSource: expectedSource,
    })
    const payload: RuntimeEvidenceAuthorityPayloadV117 = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
      bundleVersion: "bundle:v1.17:source-resolution",
      registryGeneration: "7",
      issuedAt: "2026-07-16T00:00:00.000Z",
      validFrom: "2026-07-16T00:00:00.000Z",
      validUntil: "2026-07-17T00:00:00.000Z",
      semanticTupleManifestHash,
      sourceManifestHash: `sha256:${"7".repeat(64)}`,
      attestations: [
        {
          attestationId,
          attestationHash: expectedSource.attestationSha256,
          producerId: "fixture-managed",
          producerKeyId: "fixture-key",
          trustDomain: "fixture",
          managedIdentity: true,
          imports: [],
          binding,
        },
      ],
      certificates: [
        {
          certificateId,
          certificateVersion,
          certificateRecordHash,
          certificateKind: "conformance",
          attestationId,
          binding,
          conformanceSource: expectedSource,
        },
      ],
    }
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayloadV117({
        ...payload,
        certificates: [
          {
            ...payload.certificates[0]!,
            conformanceSource: globalThis.structuredClone(expectedSource),
          },
        ],
      }),
    ).toThrow(/source/iu)

    const signed = signRawV117Payload(payload)
    const inspect = (
      resolveConformanceSource?:
        | (() => RuntimeEvidenceAuthorityConformanceSourceV117)
        | undefined,
    ) =>
      inspectRuntimeEvidenceAuthorityBundleV117(signed.serialized, {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-16T12:00:00.000Z",
        trustedKeyIds: [signed.keyId],
        ...(resolveConformanceSource === undefined
          ? {}
          : { resolveConformanceSource }),
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, signed.keys.publicKey, signature),
      })
    expect(() => inspect()).toThrow(/source/iu)
    expect(() =>
      inspect(() => globalThis.structuredClone(expectedSource)),
    ).toThrow(/source/iu)
    expect(inspect(() => expectedSource).payload.certificates).toHaveLength(1)
  })

  it("rejects impossible canonical instants and accepts real leap days", () => {
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayload(
        fixturePayload({ issuedAt: "2026-02-30T00:00:00.000Z" }),
      ),
    ).toThrow(/valid instant/i)
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayload(
        fixturePayload({
          issuedAt: "2024-02-29T00:00:00.000Z",
          validFrom: "2024-02-29T00:00:00.000Z",
          validUntil: "2024-03-01T00:00:00.000Z",
        }),
      ),
    ).not.toThrow()
  })

  it("binds one bounded signed envelope to the exact payload bytes and hash", () => {
    const fixture = signedBundle()
    const inspected = inspectRuntimeEvidenceAuthorityBundle(
      fixture.serialized,
      {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, fixture.keys.publicKey, signature),
      },
    )

    expect(inspected.envelope.schemaVersion).toBe(
      RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
    )
    expect(inspected.payload.registryGeneration).toBe("7")
    expect(inspected.payloadSha256).toBe(
      hashRuntimeEvidenceAuthorityPayload(fixture.payloadBytes),
    )
    expect(inspected.payloadBytes).toEqual(fixture.payloadBytes)
  })

  it("fails closed on trust, key, signature, freshness, and payload-hash drift", () => {
    const fixture = signedBundle()
    const base = {
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      evaluationInstant: "2026-07-12T12:00:00.000Z",
      trustedKeyIds: ["fixture-ed25519-key"] as const,
      verifySignature: ({
        signedMessageBytes,
        signature,
      }: {
        signedMessageBytes: Uint8Array
        signature: Uint8Array
      }) => verify(null, signedMessageBytes, fixture.keys.publicKey, signature),
    }

    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      }),
    ).toThrow(/trust domain/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        trustedKeyIds: [],
      }),
    ).toThrow(/unknown key/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        verifySignature: () => false,
      }),
    ).toThrow(/signature/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        evaluationInstant: "2026-07-14T00:00:00.000Z",
      }),
    ).toThrow(/validity/i)

    const parsed = JSON.parse(fixture.serialized) as Record<string, unknown>
    parsed.payloadSha256 = `sha256:${"f".repeat(64)}`
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(parsed), base),
    ).toThrow(/payload hash/i)
  })

  it("cryptographically binds envelope trust and key labels", () => {
    const fixture = signedBundle()
    const verifyWithSameKey = ({
      signedMessageBytes,
      signature,
    }: {
      signedMessageBytes: Uint8Array
      signature: Uint8Array
    }) => verify(null, signedMessageBytes, fixture.keys.publicKey, signature)

    const relabeledDomain = JSON.parse(fixture.serialized) as Record<
      string,
      unknown
    >
    relabeledDomain.trustDomain =
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(relabeledDomain), {
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: verifyWithSameKey,
      }),
    ).toThrow(/signature/i)

    const relabeledKey = JSON.parse(fixture.serialized) as Record<
      string,
      unknown
    >
    relabeledKey.keyId = "same-public-key-alias"
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(relabeledKey), {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["same-public-key-alias"],
        verifySignature: verifyWithSameKey,
      }),
    ).toThrow(/signature/i)
  })

  it("rejects dangling, duplicate, unverified, revoked, and production-conformance graphs", () => {
    const attestation = {
      attestationId: "attestation-1",
      attestationHash,
      verified: true,
      imports: [] as string[],
    }
    const certificate = {
      kind: "containment" as const,
      certificateId: "certificate-1",
      certificateVersion: "containment-v1",
      certificateRecordHash,
      laneIdentityHash,
      laneIdentity,
      issuedAt: "2026-07-12T00:00:00.000Z",
      freshUntil: "2026-07-13T00:00:00.000Z",
      attestationIds: [attestation.attestationId],
    }

    for (const payload of [
      fixturePayload({
        attestations: [{ ...attestation, imports: ["missing"] }],
      }),
      fixturePayload({ attestations: [attestation, { ...attestation }] }),
      fixturePayload({
        attestations: [{ ...attestation, verified: false }],
        certificates: [certificate],
      }),
      fixturePayload({
        attestations: [attestation],
        certificates: [certificate],
        revocations: [
          {
            certificateId: "missing",
            certificateRecordHash,
            revokedAt: "2026-07-12T06:00:00.000Z",
            reasonCode: "TEST_REVOCATION",
          },
        ],
      }),
    ]) {
      expect(() => signedBundle(payload)).toThrow(
        /dangling|duplicate|verified/i,
      )
    }

    const productionConformance = fixturePayload({
      attestations: [attestation],
      certificates: [{ ...certificate, kind: "conformance" }],
    })
    const bundle = signedBundle(
      productionConformance,
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
    )
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(bundle.serialized, {
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, bundle.keys.publicKey, signature),
      }),
    ).toThrow(/conformance.*phase 259/i)
  })

  it("requires every signed certificate to cover the bundle interval", () => {
    const attestation = {
      attestationId: "attestation-validity",
      attestationHash,
      verified: true,
      imports: [] as string[],
    }
    const certificate = {
      kind: "containment" as const,
      certificateId: "certificate-validity",
      certificateVersion: "containment-v1",
      certificateRecordHash,
      laneIdentityHash,
      laneIdentity,
      issuedAt: "2026-07-12T00:00:00.000Z",
      freshUntil: "2026-07-13T00:00:00.000Z",
      attestationIds: [attestation.attestationId],
    }
    for (const invalid of [
      { ...certificate, issuedAt: "2026-07-12T00:00:00.001Z" },
      { ...certificate, freshUntil: "2026-07-12T23:59:59.999Z" },
    ]) {
      expect(() =>
        encodeRuntimeEvidenceAuthorityPayload(
          fixturePayload({
            attestations: [attestation],
            certificates: [invalid],
          }),
        ),
      ).toThrow(/cover the authority validity interval/i)
    }
  })

  it("requires exact bootstrap pins and durable monotonic high-water anchors", () => {
    const hash7 = `sha256:${"7".repeat(64)}`
    const hash8 = `sha256:${"8".repeat(64)}`
    const pin = {
      schemaVersion: "v1.37-runtime-evidence-authority-bootstrap-v1" as const,
      minimumRegistryGeneration: "7",
      minimumPayloadSha256: hash7,
    }

    const bootstrap = evaluateRuntimeEvidenceAuthorityAntiRollback({
      candidate: { registryGeneration: "7", payloadSha256: hash7 },
      bootstrapMode: true,
      deploymentPin: pin,
    })
    expect(bootstrap).toMatchObject({
      executable: false,
      durableInstallRequired: true,
    })
    expect(() =>
      assertRuntimeEvidenceAuthorityAnchorInstalled(bootstrap),
    ).toThrow(/durably installed/i)

    const anchor = parseRuntimeEvidenceAuthorityHighWaterRecord(
      JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
        registryGeneration: "7",
        payloadSha256: hash7,
      }),
    )
    expect(
      evaluateRuntimeEvidenceAuthorityAntiRollback({
        candidate: { registryGeneration: "7", payloadSha256: hash7 },
        bootstrapMode: false,
        deploymentPin: pin,
        durableHighWater: anchor,
      }),
    ).toMatchObject({ executable: true, durableInstallRequired: false })

    for (const candidate of [
      { registryGeneration: "6", payloadSha256: hash7 },
      { registryGeneration: "7", payloadSha256: hash8 },
    ]) {
      expect(() =>
        evaluateRuntimeEvidenceAuthorityAntiRollback({
          candidate,
          bootstrapMode: false,
          deploymentPin: pin,
          durableHighWater: anchor,
        }),
      ).toThrow(/rollback|fork|pin/i)
    }

    const next = evaluateRuntimeEvidenceAuthorityAntiRollback({
      candidate: { registryGeneration: "8", payloadSha256: hash8 },
      bootstrapMode: false,
      deploymentPin: pin,
      durableHighWater: anchor,
    })
    expect(next).toMatchObject({
      executable: false,
      durableInstallRequired: true,
      nextHighWater: {
        registryGeneration: "8",
        payloadSha256: hash8,
      },
    })
    expect(() =>
      parseRuntimeEvidenceAuthorityHighWaterRecord("{broken"),
    ).toThrow(/high-water/i)
  })

  it("specifies complete-file atomic replacement and one-descriptor reads", () => {
    expect(RUNTIME_EVIDENCE_AUTHORITY_ATOMIC_REFRESH_CONTRACT).toEqual({
      schemaVersion: "v1.37-runtime-evidence-authority-refresh-v1",
      writerSteps: [
        "write-complete-envelope-to-same-filesystem-temporary-file",
        "fsync-temporary-file",
        "close-temporary-file",
        "atomic-rename-over-authority-file",
        "fsync-parent-directory",
      ],
      readerSteps: [
        "open-authority-file-once-per-check",
        "read-to-eof-from-one-file-descriptor",
        "close-file-descriptor",
      ],
    })
  })

  it("allows execution requests to carry authority references but no trusted bodies", () => {
    const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const entrant = (side: "bottom" | "top") => ({
      entrantKey: `entrant:${side}`,
      strategyRevisionId: `revision:${side}`,
      laneIdentityHash: `sha256:${side === "bottom" ? "5" : "6"}`.padEnd(
        71,
        side === "bottom" ? "5" : "6",
      ),
      effectiveStatus: "exhibition_only" as const,
      schedulingDecisionId: `scheduling-decision:${side}`,
      schedulingDecisionHash: `sha256:${"a".repeat(64)}`,
      schedulingDecision: {
        status: "exhibition_only" as const,
        reasonCode: "CONFORMANCE_MISSING" as const,
        evaluatedAt: "2026-07-13T00:00:00.000Z",
        freshUntil: "2026-08-13T00:00:00.000Z",
        registryGeneration: "7",
      },
      containmentCertificateId: `containment:${side}`,
      containmentCertificateHash: `sha256:${"7".repeat(64)}`,
    })
    const snapshot = {
      compatibility: {
        tupleId: tuple.tupleId,
        tuple: { ...tuple.tuple },
      },
      authorityBundleHash: `sha256:${"9".repeat(64)}`,
      registryGeneration: "7",
      publication: {
        publicationId: "publication:authority-bundle-test",
        installReceiptId: "install-receipt:authority-bundle-test",
        payloadSha256: `sha256:${"9".repeat(64)}`,
        envelopeSha256: `sha256:${"b".repeat(64)}`,
        sourceManifestHash: `sha256:${"c".repeat(64)}`,
      },
      entrants: {
        bottom: entrant("bottom"),
        top: entrant("top"),
      },
    }

    expect(RuntimeExecutionEvidenceSnapshotSchema.parse(snapshot)).toEqual(
      snapshot,
    )
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            ...snapshot.entrants.bottom,
            effectiveStatus: "counted",
          },
        },
      }).success,
    ).toBe(false)
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            ...snapshot.entrants.bottom,
            effectiveStatus: "counted",
            schedulingDecision: {
              ...snapshot.entrants.bottom.schedulingDecision,
              status: "counted",
              reasonCode: "EVIDENCE_CURRENT",
            },
            conformanceCertificateId: "conformance:bottom",
            conformanceCertificateHash: `sha256:${"8".repeat(64)}`,
          },
        },
      }).success,
    ).toBe(true)
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            entrantKey: snapshot.entrants.bottom.entrantKey,
            strategyRevisionId: snapshot.entrants.bottom.strategyRevisionId,
            laneIdentityHash: snapshot.entrants.bottom.laneIdentityHash,
            effectiveStatus: "disabled",
            schedulingDecisionId: snapshot.entrants.bottom.schedulingDecisionId,
            schedulingDecisionHash:
              snapshot.entrants.bottom.schedulingDecisionHash,
            schedulingDecision: {
              ...snapshot.entrants.bottom.schedulingDecision,
              status: "disabled",
              reasonCode: "OPERATOR_DISABLED",
            },
          },
        },
      }).success,
    ).toBe(true)
    for (const forbidden of [
      { laneIdentity: { providerId: "request-echo" } },
      { containmentCertificateRef: { certificateId: "request-echo" } },
      { certificateBodies: [] },
      { graphNodes: [] },
      { signature: "request-echo" },
      { gateResults: [] },
      { purpose: "exhibition" },
    ]) {
      expect(
        RuntimeExecutionEvidenceSnapshotSchema.safeParse({
          ...snapshot,
          entrants: {
            ...snapshot.entrants,
            bottom: { ...snapshot.entrants.bottom, ...forbidden },
          },
        }).success,
      ).toBe(false)
    }
  })

  it("publishes byte-stable cross-language negative and anti-rollback vectors", () => {
    const vectors = JSON.parse(
      readFileSync(
        new URL(
          "../artifacts/v1.37-runtime-evidence-authority-vectors.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      invalidEnvelopeVectors: {
        name: string
        envelope: { signatureBase64: string }
      }[]
      antiRollbackVectors: { name: string }[]
      authorityDecisionVectors: { name: string; expected: string }[]
      notice: string
      valid: {
        emptyProduction: {
          expected: {
            fixtureKeyAsProductionTrust: string
            grantsProductionConformance: boolean
          }
        }
      }
    }
    expect(vectors.invalidEnvelopeVectors.map((vector) => vector.name)).toEqual(
      ["bad-signature", "bad-payload-hash", "unknown-key", "stale", "future"],
    )
    expect(
      Buffer.from(
        vectors.invalidEnvelopeVectors[0]!.envelope.signatureBase64,
        "base64",
      ),
    ).toHaveLength(64)
    expect(vectors.antiRollbackVectors.map((vector) => vector.name)).toEqual([
      "exact-bootstrap",
      "restart-rollback",
      "same-generation-fork",
      "corrupt-anchor",
      "newer-generation",
    ])
    expect(
      vectors.authorityDecisionVectors.map(({ name, expected }) => ({
        name,
        expected,
      })),
    ).toEqual([
      { name: "disabled-runtime-request", expected: "reject-execution" },
      {
        name: "containment-only-exhibition",
        expected: "accept-reference",
      },
      {
        name: "counted-missing-conformance",
        expected: "reject-reference",
      },
      { name: "counted-complete", expected: "accept-reference" },
    ])
    expect(vectors.notice).toMatch(/fixture-only/i)
    expect(vectors.valid.emptyProduction.expected).toMatchObject({
      fixtureKeyAsProductionTrust: "reject-unknown-key",
      grantsProductionConformance: false,
    })
  })
})
