import { createHash, generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"
import { CANONICAL_COMPATIBILITY_TUPLES } from "./integrity-authority.js"
import {
  RUNTIME_EVIDENCE_TRUSTED_PRODUCERS,
  encodeRuntimeEvidenceAttestationPayload,
  getVerifiedRuntimeEvidenceAttestationSnapshot,
  hashExecutableLaneIdentity,
  hashRuntimeEvidenceGraph,
  verifyRuntimeEvidenceAttestation,
  type RuntimeEvidenceAttestation,
  type RuntimeEvidenceBytes,
  type RuntimeEvidenceGraph,
  type RuntimeEvidenceTrustedProducer,
} from "./runtime-evidence-attestation.js"
import {
  createRuntimeEvidenceTrustedContainmentProducersV137,
  RUNTIME_EVIDENCE_TRUSTED_CONTAINMENT_PRODUCERS_V1_37,
} from "./runtime-containment-trusted-producers-v1-37.js"

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex")

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const { privateKey, publicKey } = generateKeyPairSync("ed25519")

const producer: RuntimeEvidenceTrustedProducer = {
  producerId: "fixture:conformance-producer:v1",
  keyId: "fixture:key:v1",
  trustDomain: "fixture",
  kind: "conformance",
  schemaVersion: "runtime-evidence-attestation-v1",
  commandId: "fixture:full-state-conformance:v1",
  commandSha256: sha256("command:full-state-conformance:v1"),
  corpusId: "fixture:four-language-corpus:v1",
  corpusSha256: sha256("corpus:four-language:v1"),
  policyId: "fixture:counted-policy:v1",
  policySha256: sha256("policy:counted:v1"),
  requiredGateIds: ["full-state", "events", "failure-traces"],
  publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
}

const nodeBytes = {
  root: new TextEncoder().encode("root manifest"),
  command: new TextEncoder().encode("command:full-state-conformance:v1"),
  corpus: new TextEncoder().encode("corpus:four-language:v1"),
  policy: new TextEncoder().encode("policy:counted:v1"),
  toolchain: new TextEncoder().encode("toolchain:typescript@5.9.2"),
  adapter: new TextEncoder().encode("adapter:node-json-v1"),
  artifact: new TextEncoder().encode("artifact bytes"),
  result: new TextEncoder().encode("result manifest"),
  trace: new TextEncoder().encode("failure trace"),
  gateState: new TextEncoder().encode("gate:full-state:passed"),
  gateEvents: new TextEncoder().encode("gate:events:passed"),
  gateFailure: new TextEncoder().encode("gate:failure-traces:passed"),
} satisfies RuntimeEvidenceBytes

const makeUnsigned = (): Omit<RuntimeEvidenceAttestation, "signatureBase64"> => {
  const laneIdentity = {
    providerId: "fixture:provider",
    languageId: "typescript",
    runtimeId: "node",
    runtimeVersion: "24.4.1",
    toolchainId: "typescript",
    toolchainVersion: "5.9.2",
    adapterId: "node-json",
    adapterVersion: "1",
    policyId: producer.policyId,
    policyVersion: "1",
    corpusId: producer.corpusId,
    corpusVersion: "1",
    artifactId: "fixture:artifact:v1",
    artifactSha256: sha256(nodeBytes.artifact),
    implementationId: "fixture:implementation:v1",
    buildId: "fixture:build:v1",
    semanticTupleId: tuple.tupleId,
    semanticTuple: { ...tuple.tuple },
  }
  const graph: RuntimeEvidenceGraph = {
    rootNodeId: "root",
    nodes: Object.entries(nodeBytes).map(([nodeId, bytes]) => ({
      nodeId,
      kind:
        nodeId === "root"
          ? "attestation-root"
          : nodeId === "command"
            ? "command"
            : nodeId === "corpus"
              ? "corpus"
              : nodeId === "policy"
                ? "policy"
                : nodeId === "toolchain"
                  ? "toolchain"
                  : nodeId === "adapter"
                    ? "adapter"
                    : nodeId === "artifact"
                      ? "artifact"
                      : nodeId === "result"
                        ? "result-manifest"
                        : nodeId === "trace"
                          ? "result-trace"
                          : "gate-result",
      sha256: sha256(bytes),
    })),
    edges: Object.keys(nodeBytes)
      .filter((nodeId) => nodeId !== "root")
      .map((nodeId) => ({ fromNodeId: "root", toNodeId: nodeId })),
  }
  return {
    kind: "conformance",
    schemaVersion: producer.schemaVersion,
    producerId: producer.producerId,
    producerKeyId: producer.keyId,
    trustDomain: producer.trustDomain,
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
    laneIdentity,
    laneIdentitySha256: hashExecutableLaneIdentity(laneIdentity),
    runtime: { id: laneIdentity.runtimeId, version: laneIdentity.runtimeVersion },
    toolchain: {
      id: laneIdentity.toolchainId,
      version: laneIdentity.toolchainVersion,
      nodeId: "toolchain",
      sha256: sha256(nodeBytes.toolchain),
    },
    adapter: {
      id: laneIdentity.adapterId,
      version: laneIdentity.adapterVersion,
      nodeId: "adapter",
      sha256: sha256(nodeBytes.adapter),
    },
    artifact: {
      id: laneIdentity.artifactId,
      sha256: laneIdentity.artifactSha256,
      nodeId: "artifact",
    },
    result: {
      manifestId: "fixture:result-manifest:v1",
      manifestNodeId: "result",
      manifestSha256: sha256(nodeBytes.result),
      originalEvidenceNodeId: "trace",
      originalEvidenceSha256: sha256(nodeBytes.trace),
      graphSha256: hashRuntimeEvidenceGraph(graph),
      digests: [
        { id: "failure-trace", nodeId: "trace", sha256: sha256(nodeBytes.trace) },
      ],
    },
    gateResults: [
      {
        gateId: "full-state",
        passed: true,
        nodeId: "gateState",
        sha256: sha256(nodeBytes.gateState),
      },
      {
        gateId: "events",
        passed: true,
        nodeId: "gateEvents",
        sha256: sha256(nodeBytes.gateEvents),
      },
      {
        gateId: "failure-traces",
        passed: true,
        nodeId: "gateFailure",
        sha256: sha256(nodeBytes.gateFailure),
      },
    ],
    graph,
    issuedAt: "2026-07-12T12:00:00.000Z",
    validUntil: "2026-08-12T12:00:00.000Z",
    registryGeneration: "fixture:generation:1",
    derivedCertificateVersion: "runtime-certificate-v1",
  }
}

const signedFixture = (): RuntimeEvidenceAttestation => {
  const payload = makeUnsigned()
  return {
    ...payload,
    signatureBase64: sign(
      null,
      encodeRuntimeEvidenceAttestationPayload(payload),
      privateKey,
    ).toString("base64"),
  }
}

const verifyFixture = (
  attestation: RuntimeEvidenceAttestation = signedFixture(),
  bytes: RuntimeEvidenceBytes = nodeBytes,
) =>
  verifyRuntimeEvidenceAttestation({
    mode: "fixture",
    attestation,
    evidenceBytes: bytes,
    verificationInstant: "2026-07-13T12:00:00.000Z",
    trustedProducers: [producer],
  })

describe("runtime evidence attestation", () => {
  it("keeps the default production set frozen empty while retaining an explicit proof-local containment set", () => {
    expect(RUNTIME_EVIDENCE_TRUSTED_PRODUCERS).toEqual([])
    expect(Object.isFrozen(RUNTIME_EVIDENCE_TRUSTED_PRODUCERS)).toBe(true)
    const proofLocal = createRuntimeEvidenceTrustedContainmentProducersV137(
      publicKey.export({ type: "spki", format: "pem" }).toString(),
    )
    expect(RUNTIME_EVIDENCE_TRUSTED_CONTAINMENT_PRODUCERS_V1_37).toEqual([])
    expect(
      proofLocal.map(({ producerId, kind }) => ({
        producerId,
        kind,
      })),
    ).toEqual(
      ["typescript", "python", "rust", "zig"].map((languageId) => ({
        producerId: `proof-local:runtime-containment:${languageId}:v1`,
        kind: "containment",
      })),
    )
    expect(
      proofLocal.every((entry) =>
        Object.isFrozen(entry),
      ),
    ).toBe(true)
    const verified = verifyFixture()
    const snapshot = getVerifiedRuntimeEvidenceAttestationSnapshot(verified)
    expect(snapshot.kind).toBe("conformance")
    expect(snapshot.attestationSha256).toMatch(/^[0-9a-f]{64}$/u)
    expect(snapshot.resultGraphSha256).toBe(signedFixture().result.graphSha256)

    expect(() =>
      getVerifiedRuntimeEvidenceAttestationSnapshot({ ...verified }),
    ).toThrow(/verified attestation/iu)
    expect(() =>
      verifyRuntimeEvidenceAttestation({
        mode: "production",
        attestation: signedFixture(),
        evidenceBytes: nodeBytes,
        verificationInstant: "2026-07-13T12:00:00.000Z",
      }),
    ).toThrow(/trusted producer/iu)
  })

  it.each([
    ["certificate-shaped", (value: RuntimeEvidenceAttestation) => ({ ...value, signatureBase64: "AA==" })],
    ["documentation-only", (value: RuntimeEvidenceAttestation) => ({ ...value, graph: { ...value.graph, nodes: value.graph.nodes.filter((node) => node.nodeId !== "artifact") } })],
    ["renamed gate", (value: RuntimeEvidenceAttestation) => ({ ...value, gateResults: value.gateResults.map((gate) => gate.gateId === "events" ? { ...gate, gateId: "events-approved" } : gate) })],
    ["failed gate", (value: RuntimeEvidenceAttestation) => ({ ...value, gateResults: value.gateResults.map((gate) => gate.gateId === "events" ? { ...gate, passed: false } : gate) })],
    ["wrong kind", (value: RuntimeEvidenceAttestation) => ({ ...value, kind: "containment" as const })],
    ["identity drift", (value: RuntimeEvidenceAttestation) => ({ ...value, runtime: { ...value.runtime, version: "drifted" } })],
    ["digest drift", (value: RuntimeEvidenceAttestation) => ({ ...value, artifact: { ...value.artifact, sha256: "f".repeat(64) } })],
    ["dangling edge", (value: RuntimeEvidenceAttestation) => ({ ...value, graph: { ...value.graph, edges: [...value.graph.edges, { fromNodeId: "root", toNodeId: "missing" }] } })],
    ["unreachable node", (value: RuntimeEvidenceAttestation) => ({ ...value, graph: { ...value.graph, edges: value.graph.edges.filter((edge) => edge.toNodeId !== "trace") } })],
    ["duplicate node", (value: RuntimeEvidenceAttestation) => ({ ...value, graph: { ...value.graph, nodes: [...value.graph.nodes, value.graph.nodes[0]!] } })],
    ["stale", (value: RuntimeEvidenceAttestation) => ({ ...value, validUntil: "2026-07-13T11:59:59.000Z" })],
  ] as const)("rejects %s claims", (_label, mutate) => {
    expect(() => verifyFixture(mutate(signedFixture()) as RuntimeEvidenceAttestation)).toThrow()
  })

  it("rejects missing, extra, and mutated evidence bytes", () => {
    const { artifact: _missing, ...missing } = nodeBytes
    expect(() => verifyFixture(signedFixture(), missing)).toThrow(/bytes|artifact/iu)
    expect(() =>
      verifyFixture(signedFixture(), {
        ...nodeBytes,
        extra: new TextEncoder().encode("not in graph"),
      }),
    ).toThrow(/closed|extra/iu)
    expect(() =>
      verifyFixture(signedFixture(), {
        ...nodeBytes,
        artifact: new TextEncoder().encode("mutated"),
      }),
    ).toThrow(/digest/iu)
  })
})
