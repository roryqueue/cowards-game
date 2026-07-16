import { generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  hashRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"
import { RUNTIME_BUDGET_PROFILE_V1_18_SHA256 } from "./runtime-budget-profile-v1-18.js"
import {
  RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17,
  encodeRuntimeConformanceCertificatePayloadV117,
  verifyRuntimeConformanceCertificateV117,
  type RuntimeConformanceCertificateV117,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceTrustedProducerV117,
} from "./runtime-conformance-certificate-v1-17.js"
import { createRuntimeEvidenceAuthorityConformanceSourceV117 } from "./runtime-evidence-authority-bundle.js"
import {
  RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17,
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17,
  RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
  RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
  type RuntimeEvidenceGraphV117,
  type RuntimeEvidenceGraphEdgeV117,
  type RuntimeEvidenceGraphNodeV117,
  type RuntimeEvidenceExactPinNameV117,
  type RuntimeConformanceEvidenceSourceV117,
} from "./runtime-evidence-v1-17.js"
import {
  RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17,
  RuntimeConformanceEvidenceBindingV117Error,
  RuntimeEvidenceAttestationV117Error,
  encodeRuntimeEvidenceAttestationPayloadV117,
  hashRuntimeEvidenceGraphV117,
  verifyRuntimeConformanceEvidenceBindingV117,
  verifyRuntimeEvidenceAttestationV117,
  type RuntimeEvidenceAttestationV117,
  type RuntimeEvidenceTrustedProducerV117,
} from "./runtime-evidence-attestation-v1-17.js"

const bytes: Record<string, Uint8Array> = Object.fromEntries(
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => [
    `node:${kind}`,
    new TextEncoder().encode(`fixture:${kind}:bytes:v1`),
  ]),
)

const buildFixture = (
  evidenceBundleBytes: Uint8Array = bytes["node:evidenceBundle"]!,
) => {
  const evidenceBytes: Record<string, Uint8Array> = {
    ...bytes,
    "node:evidenceBundle": evidenceBundleBytes,
  }
  const keys = generateKeyPairSync("ed25519")
  const bindings = RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => ({
    domain: kind,
    publicId: `fixture.${kind}.v1`,
    sha256: hashCanonicalIdentity(kind, [evidenceBytes[`node:${kind}`]!]),
  }))
  const manifest: RuntimeIdentityManifest = {
    schemaVersion: "runtime-identity-manifest-v1",
    profile: "runtime-identity-v1",
    bindings,
  }
  const nodes = bindings.map((binding) => ({
    nodeId: `node:${binding.domain}`,
    kind: binding.domain,
    publicId: binding.publicId,
    sha256: binding.sha256,
  }))
  const edges = RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.map((candidate) => ({
    fromNodeId: `node:${candidate.from}`,
    toNodeId: `node:${candidate.to}`,
    kind: candidate.kind,
  }))
  const graphWithoutHash = {
    schemaVersion: RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17,
    profile: RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17,
    rootNodeId: "node:evidenceBundle",
    identityManifestRoot: hashRuntimeIdentityManifest(manifest),
    nodes,
    edges,
    exactPins: {
      runtimeExecutableDigest: `sha256:${bindings.find((v) => v.domain === "runtimeExecutable")!.sha256}`,
      reportedVersion: "node-v26.0.0",
      targetAbi: "linux-amd64-gnu",
      compilerFlags: `sha256:${"1".repeat(64)}`,
      adapterBuildDigest: `sha256:${bindings.find((v) => v.domain === "adapterBuild")!.sha256}`,
      standardLibraryOrSysrootDigest: `sha256:${bindings.find((v) => v.domain === "sysrootStdlib")!.sha256}`,
      containmentPolicyId: bindings.find(
        (v) => v.domain === "containmentPolicy",
      )!.publicId,
      budgetProfileSha256: `sha256:${bindings.find((v) => v.domain === "budgetProfile")!.sha256}`,
      canonicalJsonProfileId: bindings.find(
        (v) => v.domain === "canonicalJsonProfile",
      )!.publicId,
      behaviorSettingsHash: `sha256:${"2".repeat(64)}`,
    },
  }
  const graph: RuntimeEvidenceGraphV117 = {
    ...graphWithoutHash,
    graphSha256: hashRuntimeEvidenceGraphV117(graphWithoutHash),
  }
  const payload = {
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
    ...payload,
    signatureBase64: sign(
      null,
      encodeRuntimeEvidenceAttestationPayloadV117(payload),
      keys.privateKey,
    ).toString("base64"),
  }
  const producer: RuntimeEvidenceTrustedProducerV117 = {
    producerId: payload.producerId,
    keyId: payload.producerKeyId,
    trustDomain: "fixture",
    managedIdentity: true,
    publicKeyPem: keys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  return { attestation, producer, evidenceBytes }
}

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const canonicalSourceBytes = (
  source: RuntimeConformanceEvidenceSourceV117,
): Uint8Array => {
  const encoded = encodeCanonicalJson(source as never, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  return encoded.bytes
}

const fixedNodeHash = (
  kind: RuntimeEvidenceGraphNodeV117["kind"],
): `sha256:${string}` =>
  `sha256:${hashCanonicalIdentity(kind, [bytes[`node:${kind}`]!] as const)}`

const buildConformanceBindingFixture = () => {
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
  const evidenceFixture = buildFixture(canonicalSourceBytes(source))
  const binding = (kind: RuntimeEvidenceGraphNodeV117["kind"]) =>
    evidenceFixture.attestation.graph.nodes.find((node) => node.kind === kind)!
  const identity: RuntimeConformanceIdentityBindingsV117 = {
    languageId: "typescript",
    laneId: "lane:typescript:linux-cgroup-v2",
    corpusRootSha256: `sha256:${binding("conformanceCorpus").sha256}`,
    caseInventorySha256: source.caseInventorySha256,
    fixtureSourceSha256: `sha256:${binding("originalSource").sha256}`,
    artifactSha256: `sha256:${binding("artifact").sha256}`,
    adapterBuildSha256: `sha256:${binding("adapterBuild").sha256}`,
    runtimeExecutableSha256: `sha256:${binding("runtimeExecutable").sha256}`,
    toolchainSha256: `sha256:${binding("compilerExecutable").sha256}`,
    sysrootStdlibSha256: `sha256:${binding("sysrootStdlib").sha256}`,
    runtimeAbiVersion: source.runtimeAbiVersion,
    canonicalJsonProfileId: binding("canonicalJsonProfile").publicId,
    budgetPolicySha256: `sha256:${binding("budgetProfile").sha256}`,
    containmentPolicySha256: `sha256:${binding("containmentPolicy").sha256}`,
    semanticTupleSha256: `sha256:${binding("semanticTuple").sha256}`,
    identityManifestRoot: `sha256:${evidenceFixture.attestation.graph.identityManifestRoot}`,
    evidenceGraphRoot: `sha256:${evidenceFixture.attestation.graph.graphSha256}`,
    behaviorSettingsSha256:
      evidenceFixture.attestation.graph.exactPins.behaviorSettingsHash,
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
    ...evidenceFixture,
    verificationInstant: "2026-07-20T00:00:00.000Z",
    trustedProducers: [evidenceFixture.producer],
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
  return { source, currentIdentity: identity, evidence, conformance }
}

const resign = (
  source: ReturnType<typeof buildFixture>,
  mutate: (attestation: RuntimeEvidenceAttestationV117) => void,
) => {
  const cloned = globalThis.structuredClone(source.attestation)
  mutate(cloned)
  const keys = generateKeyPairSync("ed25519")
  cloned.producerKeyId = "mutation-key"
  cloned.signatureBase64 = sign(
    null,
    encodeRuntimeEvidenceAttestationPayloadV117(cloned),
    keys.privateKey,
  ).toString("base64")
  return {
    ...source,
    attestation: cloned,
    producer: {
      ...source.producer,
      keyId: "mutation-key",
      publicKeyPem: keys.publicKey
        .export({ type: "spki", format: "pem" })
        .toString(),
    },
  }
}

type MutableGraphV117 = Omit<
  RuntimeEvidenceGraphV117,
  "edges" | "nodes" | "exactPins"
> & {
  edges: RuntimeEvidenceGraphEdgeV117[]
  nodes: RuntimeEvidenceGraphNodeV117[]
  exactPins: Record<RuntimeEvidenceExactPinNameV117, string>
}

describe("runtime evidence v1.17 frozen contract", () => {
  it("freezes fifteen identity domains and the complete twenty-six-edge schema", () => {
    expect(RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17).toBe(
      "runtime-evidence-graph-v1.17",
    )
    expect(RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17).toBe(
      "runtime-identity-evidence-dag-v1",
    )
    expect(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17).toHaveLength(15)
    expect(new Set(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17).size).toBe(15)
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toHaveLength(26)
    expect(
      new Set(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.map((edge) => edge.kind)).size,
    ).toBe(26)
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toContainEqual({
      from: "evidenceBundle",
      to: "artifactManifest",
      kind: "evidence-binds-manifest",
    })
    expect(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17).toContainEqual({
      from: "artifactManifest",
      to: "originalSource",
      kind: "manifest-binds-original",
    })
  })

  it("freezes the ten exact executable pins in ABI order", () => {
    expect(RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17).toEqual([
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
    ])
  })

  it("exports deeply immutable schema constants", () => {
    expect(Object.isFrozen(RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17)).toBe(true)
    expect(Object.isFrozen(RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17)).toBe(true)
    expect(
      RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17.every((edge) => Object.isFrozen(edge)),
    ).toBe(true)
  })

  it("verifies only the complete managed fixture DAG and recomputed domain bytes", () => {
    const fixture = buildFixture()
    const verified = verifyRuntimeEvidenceAttestationV117({
      mode: "fixture",
      ...fixture,
      verificationInstant: "2026-07-14T12:00:00.000Z",
      trustedProducers: [fixture.producer],
    })
    expect(verified.graphSha256).toBe(fixture.attestation.graph.graphSha256)
    expect(verified.identityManifestRoot).toBe(
      fixture.attestation.graph.identityManifestRoot,
    )
    expect(verified.exactPins).toEqual(fixture.attestation.graph.exactPins)
  })

  it("rejects alternate Base64 spellings of the same Ed25519 signature", () => {
    const fixture = buildFixture()
    const attestation = {
      ...fixture.attestation,
      signatureBase64: `${fixture.attestation.signatureBase64}\n`,
    }
    expect(() =>
      verifyRuntimeEvidenceAttestationV117({
        mode: "fixture",
        attestation,
        evidenceBytes: fixture.evidenceBytes,
        verificationInstant: "2026-07-14T12:00:00.000Z",
        trustedProducers: [fixture.producer],
      }),
    ).toThrowError(RuntimeEvidenceAttestationV117Error)
  })

  it.each([
    [
      "unsafe generation",
      (attestation: RuntimeEvidenceAttestationV117) => {
        attestation.registryGeneration = "9999999999999999"
      },
    ],
    [
      "multibyte pin overflow",
      (attestation: RuntimeEvidenceAttestationV117) => {
        const mutableGraph = attestation.graph as MutableGraphV117
        mutableGraph.exactPins.reportedVersion = "é".repeat(512)
        const { graphSha256: _old, ...graph } = mutableGraph
        attestation.graph.graphSha256 = hashRuntimeEvidenceGraphV117(graph)
      },
    ],
  ] as const)("rejects %s before import", (_name, mutate) => {
    const source = buildFixture()
    const attacked = resign(source, mutate)
    expect(() =>
      verifyRuntimeEvidenceAttestationV117({
        mode: "fixture",
        ...attacked,
        verificationInstant: "2026-07-14T12:00:00.000Z",
        trustedProducers: [attacked.producer],
      }),
    ).toThrowError(RuntimeEvidenceAttestationV117Error)
  })

  it.each([
    [
      "cycle",
      "GRAPH_SCHEMA",
      (graph: MutableGraphV117) =>
        graph.edges.push({
          fromNodeId: "node:originalSource",
          toNodeId: "node:evidenceBundle",
          kind: "normalized-from",
        }),
    ],
    [
      "missing edge",
      "GRAPH_SCHEMA",
      (graph: MutableGraphV117) => graph.edges.pop(),
    ],
    [
      "reversed edge",
      "GRAPH_SCHEMA",
      (graph: MutableGraphV117) => {
        const candidate = graph.edges[0]!
        graph.edges[0] = {
          ...candidate,
          fromNodeId: candidate.toNodeId,
          toNodeId: candidate.fromNodeId,
        }
      },
    ],
    [
      "swapped digest",
      "DOMAIN_DIGEST",
      (graph: MutableGraphV117) => {
        const left = graph.nodes[0]!
        const right = graph.nodes[1]!
        const digest = left.sha256
        left.sha256 = right.sha256
        right.sha256 = digest
      },
    ],
    [
      "floating pin",
      "EXACT_PIN",
      (graph: MutableGraphV117) => {
        graph.exactPins.reportedVersion = "latest"
      },
    ],
  ] as const)(
    "rejects %s after attacker recomputation and resigning",
    (_name, code, attack) => {
      const source = buildFixture()
      const attacked = resign(source, (attestation) => {
        attack(attestation.graph as MutableGraphV117)
        const { graphSha256: _old, ...graph } = attestation.graph
        attestation.graph.graphSha256 = hashRuntimeEvidenceGraphV117(graph)
      })
      try {
        verifyRuntimeEvidenceAttestationV117({
          mode: "fixture",
          ...attacked,
          verificationInstant: "2026-07-14T12:00:00.000Z",
          trustedProducers: [attacked.producer],
        })
        throw new Error("attack accepted")
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeEvidenceAttestationV117Error)
        expect((error as RuntimeEvidenceAttestationV117Error).code).toBe(code)
        expect((error as Error).message).not.toContain("fixture.")
      }
    },
  )

  it("joins one verified certificate to the exact evidence DAG and additive supervisor source", () => {
    const fixture = buildConformanceBindingFixture()
    const verified = verifyRuntimeConformanceEvidenceBindingV117({
      evidence: fixture.evidence,
      certificate: fixture.conformance,
      currentIdentity: fixture.currentIdentity,
      source: fixture.source,
      verificationInstant: "2026-07-20T00:00:00.000Z",
    })

    expect(verified).toMatchObject({
      schemaVersion: "runtime-conformance-evidence-binding-v1.17",
      certificateId: fixture.conformance.certificateId,
      certificateSha256: fixture.conformance.certificateSha256,
      attestationSha256: fixture.evidence.attestationSha256,
      languageId: "typescript",
      laneId: "lane:typescript:linux-cgroup-v2",
      corpusRootSha256: fixture.currentIdentity.corpusRootSha256,
      caseInventorySha256: fixture.source.caseInventorySha256,
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      additiveBudgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      runReceiptSha256s: fixture.source.runReceipts.map(
        ({ receiptSha256 }) => receiptSha256,
      ),
    })
    expect(Object.isFrozen(verified)).toBe(true)
    expect(Object.isFrozen(verified.supervisorIdentity)).toBe(true)
    expect(Object.isFrozen(verified.runReceiptSha256s)).toBe(true)
    expect(
      createRuntimeEvidenceAuthorityConformanceSourceV117(verified),
    ).toMatchObject({
      schemaVersion: "runtime-evidence-authority-conformance-source-v1.17",
      certificateId: verified.certificateId,
      certificateVersion: verified.certificateVersion,
      certificateSha256: verified.certificateSha256,
      languageId: verified.languageId,
      corpusRootSha256: verified.corpusRootSha256,
      caseInventorySha256: verified.caseInventorySha256,
      identityManifestRoot: verified.identityManifestRoot,
      evidenceGraphRoot: verified.evidenceGraphRoot,
      registryGeneration: verified.registryGeneration,
      freshUntil: verified.freshUntil,
    })
    expect(() =>
      createRuntimeEvidenceAuthorityConformanceSourceV117(
        globalThis.structuredClone(verified),
      ),
    ).toThrowError(RuntimeConformanceEvidenceBindingV117Error)
  })

  it.each([
    [
      "runtime ABI envelope",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.runtimeAbiEnvelopeSha256 = hash("0")
      },
    ],
    [
      "additive budget profile",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.additiveBudgetProfileSha256 = hash("0")
      },
    ],
    [
      "common supervisor binary",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.supervisorIdentity.supervisorBinarySha256 = hash("0")
      },
    ],
    [
      "Docker image",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.supervisorIdentity.dockerImageDigest = hash("0")
      },
    ],
    [
      "cgroup settings",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.supervisorSettingsSha256 = hash("0")
      },
    ],
    [
      "run receipt",
      (source: RuntimeConformanceEvidenceSourceV117) => {
        source.runReceipts[1]!.receiptSha256 = hash("0")
      },
    ],
  ] as const)("rejects %s substitution immediately", (_name, mutate) => {
    const fixture = buildConformanceBindingFixture()
    const source = globalThis.structuredClone(fixture.source)
    mutate(source)
    expect(() =>
      verifyRuntimeConformanceEvidenceBindingV117({
        evidence: fixture.evidence,
        certificate: fixture.conformance,
        currentIdentity: fixture.currentIdentity,
        source,
        verificationInstant: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrowError(RuntimeConformanceEvidenceBindingV117Error)
  })

  it("rejects stale identity, unverified snapshots, and incomplete three-run receipt bindings", () => {
    const fixture = buildConformanceBindingFixture()
    const changed = globalThis.structuredClone(fixture.currentIdentity)
    changed.artifactSha256 = hash("0")
    for (const input of [
      {
        evidence: fixture.evidence,
        certificate: fixture.conformance,
        currentIdentity: changed,
        source: fixture.source,
      },
      {
        evidence: globalThis.structuredClone(fixture.evidence),
        certificate: fixture.conformance,
        currentIdentity: fixture.currentIdentity,
        source: fixture.source,
      },
      {
        evidence: fixture.evidence,
        certificate: globalThis.structuredClone(fixture.conformance),
        currentIdentity: fixture.currentIdentity,
        source: fixture.source,
      },
      {
        evidence: fixture.evidence,
        certificate: fixture.conformance,
        currentIdentity: fixture.currentIdentity,
        source: {
          ...fixture.source,
          runReceipts: fixture.source.runReceipts.slice(0, 2),
        },
      },
    ]) {
      expect(() =>
        verifyRuntimeConformanceEvidenceBindingV117({
          ...input,
          verificationInstant: "2026-07-20T00:00:00.000Z",
        }),
      ).toThrowError()
    }
  })

  it("keeps the production managed-producer registry empty and rejects caller trust", () => {
    const fixture = buildFixture()
    expect(RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17).toEqual([])
    expect(RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17).toEqual([])
    expect(() =>
      verifyRuntimeEvidenceAttestationV117({
        mode: "production",
        ...fixture,
        verificationInstant: "2026-07-14T12:00:00.000Z",
        trustedProducers: [fixture.producer],
      }),
    ).toThrowError(RuntimeEvidenceAttestationV117Error)
  })
})
