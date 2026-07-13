import { createHash, generateKeyPairSync, randomUUID, sign } from "node:crypto"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  encodeRuntimeEvidenceAttestationPayload,
  hashExecutableLaneIdentity,
  hashRuntimeEvidenceGraph,
  type RuntimeEvidenceAttestation,
  type RuntimeEvidenceAttestationPayload,
  type RuntimeEvidenceBytes,
  type RuntimeEvidenceGraph,
  type RuntimeEvidenceTrustedProducer,
} from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { migrate } from "./migrations.js"
import { importVerifiedRuntimeEvidenceAttestation } from "./runtime-evidence-import.js"

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex")
const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const keys = generateKeyPairSync("ed25519")
const producer: RuntimeEvidenceTrustedProducer = {
  producerId: "fixture:import-producer:v1",
  keyId: "fixture:import-key:v1",
  trustDomain: "fixture",
  kind: "conformance",
  schemaVersion: "runtime-evidence-attestation-v1",
  commandId: "fixture:command:v1",
  commandSha256: sha256("command"),
  corpusId: "fixture:corpus:v1",
  corpusSha256: sha256("corpus"),
  policyId: "fixture:policy:v1",
  policySha256: sha256("policy"),
  requiredGateIds: ["full-state"],
  publicKeyPem: keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
}

const evidenceBytes: RuntimeEvidenceBytes = Object.fromEntries(
  ["root", "command", "corpus", "policy", "toolchain", "adapter", "artifact", "result", "trace", "gate"].map(
    (id) => [id, new TextEncoder().encode(id)],
  ),
)

const makePayload = (suffix = "success"): RuntimeEvidenceAttestationPayload => {
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
      sha256: sha256(evidenceBytes[nodeId]!),
    })),
    edges: Object.keys(nodeKinds)
      .filter((nodeId) => nodeId !== "root")
      .map((nodeId) => ({ fromNodeId: "root", toNodeId: nodeId })),
  }
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
    artifactSha256: sha256(evidenceBytes.artifact!),
    implementationId: "fixture:implementation:v1",
    buildId: `fixture:build:${suffix}`,
    semanticTupleId: tuple.tupleId,
    semanticTuple: { ...tuple.tuple },
  }
  return {
    kind: "conformance",
    schemaVersion: producer.schemaVersion,
    producerId: producer.producerId,
    producerKeyId: producer.keyId,
    trustDomain: "fixture",
    command: { id: producer.commandId, sha256: producer.commandSha256, nodeId: "command" },
    corpus: { id: producer.corpusId, sha256: producer.corpusSha256, nodeId: "corpus" },
    policy: { id: producer.policyId, sha256: producer.policySha256, nodeId: "policy" },
    laneIdentity,
    laneIdentitySha256: hashExecutableLaneIdentity(laneIdentity),
    runtime: { id: laneIdentity.runtimeId, version: laneIdentity.runtimeVersion },
    toolchain: { id: laneIdentity.toolchainId, version: laneIdentity.toolchainVersion, nodeId: "toolchain", sha256: sha256(evidenceBytes.toolchain!) },
    adapter: { id: laneIdentity.adapterId, version: laneIdentity.adapterVersion, nodeId: "adapter", sha256: sha256(evidenceBytes.adapter!) },
    artifact: { id: laneIdentity.artifactId, sha256: laneIdentity.artifactSha256, nodeId: "artifact" },
    result: {
      manifestId: `fixture:manifest:${suffix}`,
      manifestNodeId: "result",
      manifestSha256: sha256(evidenceBytes.result!),
      originalEvidenceNodeId: "trace",
      originalEvidenceSha256: sha256(evidenceBytes.trace!),
      graphSha256: hashRuntimeEvidenceGraph(graph),
      digests: [{ id: "failure-trace", nodeId: "trace", sha256: sha256(evidenceBytes.trace!) }],
    },
    gateResults: [{ gateId: "full-state", passed: true, nodeId: "gate", sha256: sha256(evidenceBytes.gate!) }],
    graph,
    issuedAt: "2026-07-12T12:00:00.000Z",
    validUntil: "2026-08-12T12:00:00.000Z",
    registryGeneration: "fixture:generation:1",
    derivedCertificateVersion: "runtime-certificate-v1",
  }
}

const signPayload = (payload: RuntimeEvidenceAttestationPayload): RuntimeEvidenceAttestation => ({
  ...payload,
  signatureBase64: sign(
    null,
    encodeRuntimeEvidenceAttestationPayload(payload),
    keys.privateKey,
  ).toString("base64"),
})

const input = (suffix = "success") => ({
  mode: "fixture" as const,
  attestation: signPayload(makePayload(suffix)),
  evidenceBytes,
  verificationInstant: "2026-07-13T12:00:00.000Z",
  trustedProducers: [producer],
})

const productionInput = (suffix = "success") => {
  const fixture = input(suffix)
  const { trustedProducers: _fixtureTrust, ...withoutFixtureTrust } = fixture
  return { ...withoutFixtureTrust, mode: "production" as const }
}

const fakePool = (failCertificate = false) => {
  const calls: string[] = []
  const rows = new Map<string, Record<string, unknown>>()
  const client = {
    async query(sql: string, values: readonly unknown[] = []) {
      const normalized = sql.replace(/\s+/gu, " ").trim()
      calls.push(normalized)
      const insert = normalized.match(/^insert into (runtime_evidence_(?:verified_attestations|certificates)) \(([^)]+)\)/u)
      if (insert) {
        if (failCertificate && insert[1] === "runtime_evidence_certificates") {
          throw new Error("late certificate failure")
        }
        const columns = insert[2]!.split(",").map((column) => column.trim())
        rows.set(insert[1]!, Object.fromEntries(columns.map((column, index) => [column, values[index]])))
      }
      const selected = normalized.match(/from (runtime_evidence_(?:verified_attestations|certificates)) where/u)
      return { rows: selected ? [rows.get(selected[1]!)].filter(Boolean) : [] }
    },
    release() {},
  }
  return {
    pool: { connect: async () => client } as unknown as Pool,
    calls,
  }
}

describe("verified runtime evidence import", () => {
  it("appends one derived certificate transactionally and idempotently", async () => {
    const fake = fakePool()
    const first = await importVerifiedRuntimeEvidenceAttestation(fake.pool, input())
    const second = await importVerifiedRuntimeEvidenceAttestation(fake.pool, input())
    expect(second).toEqual(first)
    expect(first.certificate.kind).toBe("conformance")
    expect(first.certificate.certificateRecordHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(fake.calls.filter((call) => call === "begin")).toHaveLength(2)
    expect(fake.calls.filter((call) => call === "commit")).toHaveLength(2)
  })

  it("writes zero rows for production fixtures, forged signatures, and late SQL failure", async () => {
    const production = fakePool()
    await expect(
      importVerifiedRuntimeEvidenceAttestation(production.pool, productionInput()),
    ).rejects.toThrow(/trusted producer/iu)
    expect(production.calls).toEqual([])

    const forged = fakePool()
    await expect(
      importVerifiedRuntimeEvidenceAttestation(forged.pool, {
        ...input(),
        attestation: { ...input().attestation, signatureBase64: "AA==" },
      }),
    ).rejects.toThrow(/signature/iu)
    expect(forged.calls).toEqual([])

    const late = fakePool(true)
    await expect(
      importVerifiedRuntimeEvidenceAttestation(late.pool, input("late")),
    ).rejects.toThrow("late certificate failure")
    expect(late.calls.at(-1)).toBe("rollback")
  })

  it("rejects documentation, renamed gates, and missing artifact bytes before SQL", async () => {
    const cases = [
      { ...input(), attestation: signPayload({ ...makePayload(), gateResults: [{ ...makePayload().gateResults[0]!, gateId: "documented-pass" }] }) },
      { ...input(), attestation: signPayload({ ...makePayload(), artifact: { ...makePayload().artifact, nodeId: "root" } }) },
      { ...input(), evidenceBytes: Object.fromEntries(Object.entries(evidenceBytes).filter(([id]) => id !== "artifact")) },
    ]
    for (const candidate of cases) {
      const fake = fakePool()
      await expect(importVerifiedRuntimeEvidenceAttestation(fake.pool, candidate)).rejects.toThrow()
      expect(fake.calls).toEqual([])
    }
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

describePostgres("PostgreSQL verified runtime evidence import", () => {
  const schema = `runtime_evidence_${randomUUID().replaceAll("-", "")}`
  let admin: Pool
  let pool: Pool

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 1,
    })
    await migrate(pool)
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("starts with empty production inventory and imports one exact fixture idempotently", async () => {
    const before = await pool.query("select count(*)::integer as count from runtime_evidence_certificates")
    expect(before.rows[0]?.count).toBe(0)

    await expect(
      importVerifiedRuntimeEvidenceAttestation(pool, productionInput()),
    ).rejects.toThrow(/trusted producer/iu)
    const first = await importVerifiedRuntimeEvidenceAttestation(pool, input())
    const second = await importVerifiedRuntimeEvidenceAttestation(pool, input())
    expect(second).toEqual(first)

    const inventory = await pool.query(
      `select count(*)::integer as count,
              count(*) filter (where a.trust_domain = 'production')::integer as production_count
         from runtime_evidence_certificates c
         join runtime_evidence_verified_attestations a on a.id = c.verified_attestation_id`,
    )
    expect(inventory.rows[0]).toMatchObject({ count: 1, production_count: 0 })
  })

  it("rejects a forged direct certificate and rolls back a late certificate failure", async () => {
    await expect(
      pool.query(
        `insert into runtime_evidence_certificates
          (id, certificate_kind, certificate_version, certificate_record_hash,
           certificate_status, verified_attestation_id, verified_attestation_status,
           producer_id, schema_version, command_id, command_digest, corpus_id,
           corpus_hash, policy_id, policy_hash, toolchain_id, toolchain_version,
           artifact_id, artifact_hash, lane_identity_hash, lane_identity,
           result_graph_hash, registry_generation, issued_at, fresh_until)
         values ('forged', 'conformance', 'v1', $1, 'passed', 'missing', 'passed',
           'producer', 'schema', 'command', $2, 'corpus', $2, 'policy', $2,
           'toolchain', 'version', 'artifact', $2, $2, '{}'::jsonb, $2,
           'generation', now(), now())`,
        ["a".repeat(64), "b".repeat(64)],
      ),
    ).rejects.toThrow()

    await pool.query(`
      create function reject_test_certificate() returns trigger language plpgsql as $$
      begin raise exception 'late certificate failure'; end; $$;
      create trigger reject_test_certificate before insert on runtime_evidence_certificates
      for each row execute function reject_test_certificate();
    `)
    const candidate = input("postgres-rollback")
    await expect(
      importVerifiedRuntimeEvidenceAttestation(pool, candidate),
    ).rejects.toThrow(/late certificate failure/iu)
    await pool.query("drop trigger reject_test_certificate on runtime_evidence_certificates")
    await pool.query("drop function reject_test_certificate()")
    const hash = sha256(encodeRuntimeEvidenceAttestationPayload(makePayload("postgres-rollback")))
    const rows = await pool.query(
      "select count(*)::integer as count from runtime_evidence_verified_attestations where attestation_sha256 = $1",
      [hash],
    )
    expect(rows.rows[0]?.count).toBe(0)
  })
})
