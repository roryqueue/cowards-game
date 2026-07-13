import { Buffer } from "node:buffer"
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto"
import {
  encodeRuntimeEvidenceAttestationPayload,
  hashExecutableLaneIdentity,
  hashRuntimeEvidenceGraph,
  type MatchSetId,
  type RuntimeEvidenceAttestationPayload,
  type RuntimeEvidenceBytes,
  type RuntimeEvidenceGraph,
  type RuntimeEvidenceTrustedProducer,
} from "@cowards/spec"
import type { Pool } from "pg"
import { migrate } from "./migrations.js"
import { createDevelopmentSeedData } from "./seed.js"
import { createRepositories } from "./repositories.js"
import {
  createMatchSetService,
  resolveMatchSetExecutionEvidence,
  type IntegritySchedulingIdentity,
  type MatchSetExecutionEvidenceResolver,
} from "./matchset-service.js"
import { refreshMatchSetStatus } from "./matchset-status.js"
import type { MatchSetStatus } from "./schema.js"
import { importVerifiedRuntimeEvidenceAttestation } from "./runtime-evidence-import.js"

export interface DevelopmentMatchSetSmokeResult {
  matchSetId: MatchSetId
  matchIds: string[]
  matchCount: number
  status: MatchSetStatus
  chronicleCount: number
  degraded: boolean
}

const developmentEvidenceHash = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

const developmentEvidenceEncoder = new TextEncoder()
const developmentEvidencePrivateKey = createPrivateKey({
  key: Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    createHash("sha256")
      .update("cowards-game:development-smoke-evidence-key:v1", "utf8")
      .digest(),
  ]),
  format: "der",
  type: "pkcs8",
})
const developmentEvidencePublicKey = createPublicKey(
  developmentEvidencePrivateKey,
)

const developmentEvidenceBytes = (
  evidence: IntegritySchedulingIdentity["executionEntrants"][string],
): RuntimeEvidenceBytes => {
  const encode = (label: string): Uint8Array =>
    developmentEvidenceEncoder.encode(
      `cowards-game:development-smoke-evidence:v1:${evidence.strategyRevisionId}:${label}`,
    )
  const artifactLabel = evidence.laneIdentity.artifactId.startsWith("fixture:")
    ? evidence.laneIdentity.artifactId.slice("fixture:".length)
    : evidence.laneIdentity.artifactId
  const artifact = developmentEvidenceEncoder.encode(
    `fixture:v1.37:${artifactLabel}`,
  )
  if (
    developmentEvidenceHash(artifact) !==
    evidence.laneIdentity.artifactSha256
  ) {
    throw new Error(
      "Development smoke fixture artifact bytes do not match the resolved lane identity.",
    )
  }
  return Object.freeze({
    root: encode("root"),
    command: encode("command"),
    corpus: encode("corpus"),
    policy: encode("policy"),
    toolchain: encode("toolchain"),
    adapter: encode("adapter"),
    artifact,
    result: encode("result"),
    trace: encode("trace"),
    gate: encode("gate:containment"),
  })
}

const developmentContainmentImport = (
  evidence: IntegritySchedulingIdentity["executionEntrants"][string],
): {
  producer: RuntimeEvidenceTrustedProducer
  payload: RuntimeEvidenceAttestationPayload
  evidenceBytes: RuntimeEvidenceBytes
} => {
  const evidenceBytes = developmentEvidenceBytes(evidence)
  const hashNode = (nodeId: string): string =>
    developmentEvidenceHash(evidenceBytes[nodeId]!)
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
  const producer: RuntimeEvidenceTrustedProducer = {
    producerId: "fixture:development-smoke-producer:v1",
    keyId: "fixture:development-smoke-ed25519-key:v1",
    trustDomain: "fixture",
    kind: "containment",
    schemaVersion: "runtime-evidence-attestation-v1",
    commandId: "fixture:development-smoke-command:v1",
    commandSha256: hashNode("command"),
    corpusId: evidence.laneIdentity.corpusId,
    corpusSha256: hashNode("corpus"),
    policyId: evidence.laneIdentity.policyId,
    policySha256: hashNode("policy"),
    requiredGateIds: ["containment"],
    publicKeyPem: developmentEvidencePublicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  return {
    producer,
    evidenceBytes,
    payload: {
      kind: "containment",
      schemaVersion: producer.schemaVersion,
      producerId: producer.producerId,
      producerKeyId: producer.keyId,
      trustDomain: "fixture",
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
      laneIdentity: evidence.laneIdentity,
      laneIdentitySha256: hashExecutableLaneIdentity(evidence.laneIdentity),
      runtime: {
        id: evidence.laneIdentity.runtimeId,
        version: evidence.laneIdentity.runtimeVersion,
      },
      toolchain: {
        id: evidence.laneIdentity.toolchainId,
        version: evidence.laneIdentity.toolchainVersion,
        nodeId: "toolchain",
        sha256: hashNode("toolchain"),
      },
      adapter: {
        id: evidence.laneIdentity.adapterId,
        version: evidence.laneIdentity.adapterVersion,
        nodeId: "adapter",
        sha256: hashNode("adapter"),
      },
      artifact: {
        id: evidence.laneIdentity.artifactId,
        sha256: evidence.laneIdentity.artifactSha256,
        nodeId: "artifact",
      },
      result: {
        manifestId: `fixture:development-smoke-result:${evidence.strategyRevisionId}`,
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
      issuedAt: "2026-01-01T00:00:00.000Z",
      validUntil: "2099-12-31T23:59:59.999Z",
      registryGeneration:
        evidence.containmentCertificateRef.registryGeneration,
      derivedCertificateVersion: "fixture-runtime-certificate-v1",
    },
  }
}

const seedDevelopmentFixtureEvidence = async (
  pool: Pool,
  identity: IntegritySchedulingIdentity,
): Promise<IntegritySchedulingIdentity> => {
  const importedEntrants: Record<
    string,
    IntegritySchedulingIdentity["executionEntrants"][string]
  > = {}
  for (const [entrantKey, evidence] of Object.entries(
    identity.executionEntrants,
  )) {
    const fixture = developmentContainmentImport(evidence)
    const payloadBytes = encodeRuntimeEvidenceAttestationPayload(
      fixture.payload,
    )
    const imported = await importVerifiedRuntimeEvidenceAttestation(pool, {
      mode: "fixture",
      attestation: {
        ...fixture.payload,
        signatureBase64: sign(
          null,
          payloadBytes,
          developmentEvidencePrivateKey,
        ).toString("base64"),
      },
      evidenceBytes: fixture.evidenceBytes,
      verificationInstant: "2026-05-20T00:00:00.000Z",
      trustedProducers: [fixture.producer],
    })
    if (imported.certificate.kind !== "containment") {
      throw new Error(
        "Development smoke fixture import returned the wrong certificate kind.",
      )
    }
    importedEntrants[entrantKey] = Object.freeze({
      ...evidence,
      containmentCertificateRef: Object.freeze({
        ...imported.certificate,
        kind: "containment" as const,
      }),
    })
  }
  return Object.freeze({
    compatibility: identity.compatibility,
    authorityBundleHash: identity.authorityBundleHash,
    registryGeneration: identity.registryGeneration,
    executionEntrants: Object.freeze(importedEntrants),
  })
}

export const runDevelopmentMatchSetSmoke = async (
  pool: Pool,
  options: {
    matchSetId?: MatchSetId | undefined
    runQueuedMatch?: (matchIds: readonly string[]) => Promise<unknown>
    evidenceResolver?: MatchSetExecutionEvidenceResolver | undefined
  } = {},
): Promise<DevelopmentMatchSetSmokeResult> => {
  const seed = createDevelopmentSeedData()
  const [bottomRevision, topRevision] = seed.revisions
  if (!bottomRevision || !topRevision) {
    throw new Error("Development seed revisions missing")
  }
  if (options.evidenceResolver?.trustDomain !== "fixture") {
    throw new Error(
      "Development smoke requires explicit fixture-domain evidence authority.",
    )
  }
  const resolvedIntegrityIdentity = await resolveMatchSetExecutionEvidence({
    resolver: options.evidenceResolver,
    purpose: "development",
    evaluationInstant: "2026-05-20T00:00:00.000Z",
    entrants: [bottomRevision, topRevision].map((revision) => ({
      entrantKey: revision.id,
      strategyRevisionId: revision.id,
    })),
  })

  await migrate(pool)

  const integrityIdentity = await seedDevelopmentFixtureEvidence(
    pool,
    resolvedIntegrityIdentity,
  )
  const repositories = createRepositories(pool)
  for (const user of seed.users) {
    await repositories.upsertUser(user)
  }
  for (const strategy of seed.strategies) {
    await repositories.upsertStrategy(strategy)
  }
  for (const revision of seed.revisions) {
    await repositories.insertStrategyRevision(revision)
  }
  for (const arena of seed.arenas) {
    await repositories.upsertArenaVariant(arena)
  }

  const matchSetId =
    options.matchSetId ?? ("match-set:dev-smoke:v1" as MatchSetId)
  const created = await createMatchSetService(pool).createFromPreset({
    id: matchSetId,
    presetId: "smoke-v1",
    bottomStrategyRevisionId: bottomRevision.id,
    topStrategyRevisionId: topRevision.id,
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    integrityIdentity,
  })

  await options.runQueuedMatch?.(created.matchIds)
  const refreshed = await refreshMatchSetStatus(pool, matchSetId)
  const chronicles = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from match_set_matches msm
      join chronicles c on c.match_id = msm.match_id
      where msm.match_set_id = $1
    `,
    [matchSetId],
  )
  return {
    matchSetId,
    matchIds: created.matchIds,
    matchCount: created.matchIds.length,
    status: refreshed.status,
    chronicleCount: Number(chronicles.rows[0]?.count ?? 0),
    degraded: refreshed.scoring.degraded,
  }
}
