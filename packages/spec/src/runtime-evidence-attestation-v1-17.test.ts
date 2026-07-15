import { generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import {
  hashRuntimeIdentityManifest,
  type RuntimeIdentityManifest,
} from "./runtime-identity-manifest.js"
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
} from "./runtime-evidence-v1-17.js"
import {
  RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17,
  RuntimeEvidenceAttestationV117Error,
  encodeRuntimeEvidenceAttestationPayloadV117,
  hashRuntimeEvidenceGraphV117,
  verifyRuntimeEvidenceAttestationV117,
  type RuntimeEvidenceAttestationV117,
  type RuntimeEvidenceTrustedProducerV117,
} from "./runtime-evidence-attestation-v1-17.js"

const bytes = Object.fromEntries(
  RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => [
    `node:${kind}`,
    new TextEncoder().encode(`fixture:${kind}:bytes:v1`),
  ]),
)

const buildFixture = () => {
  const keys = generateKeyPairSync("ed25519")
  const bindings = RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17.map((kind) => ({
    domain: kind,
    publicId: `fixture.${kind}.v1`,
    sha256: hashCanonicalIdentity(kind, [bytes[`node:${kind}`]!]),
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
    validUntil: "2026-07-15T00:00:00.000Z",
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
  return { attestation, producer, evidenceBytes: bytes }
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

  it("keeps the production managed-producer registry empty and rejects caller trust", () => {
    const fixture = buildFixture()
    expect(RUNTIME_EVIDENCE_TRUSTED_PRODUCERS_V1_17).toEqual([])
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
