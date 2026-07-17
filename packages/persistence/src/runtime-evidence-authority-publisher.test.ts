import { Buffer } from "node:buffer"
import {
  createHash,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from "node:crypto"
import {
  mkdtemp,
  open,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeCanonicalJson,
  encodeRuntimeConformanceCertificatePayloadV117,
  encodeRuntimeConformanceCertificatePayloadV119,
  encodeRuntimeEvidenceAuthorityPayload,
  encodeRuntimeEvidenceAuthorityPayloadV117,
  encodeRuntimeEvidenceAuthoritySignatureMessage,
  hashRuntimeEvidenceCertificateRecordV117,
  hashExecutableLaneIdentity,
  inspectRuntimeEvidenceAuthorityBundle,
  type CanonicalCompatibilityTuple,
  type JsonValue,
  type RuntimeEvidenceAuthorityBindingV117,
  type RuntimeEvidenceAuthorityPayloadV117,
  type RuntimeConformanceCertificatePayloadV117,
  type RuntimeConformanceCertificateV117,
  type RuntimeConformanceExpectedRunBindingV117,
  type RuntimeConformanceTrustedProducerV117,
  type RuntimeConformanceCertificateV119,
  type RuntimeConformanceTrustedProducerV119,
} from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { migrate } from "./migrations.js"
import {
  RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_V117_INSTALLED_AUTHORITY_HEAD_LOCK_SQL,
  bootstrapRuntimeEvidenceAuthorityImportTrustRoots,
  encodeRuntimeEvidenceAuthorityImportPayload,
  importAuthenticatedCertificateRevocation,
  importAuthenticatedCertificateSupersession,
  importAuthenticatedRuntimeLaneControl,
  importRuntimeConformanceCertificateV117,
  importRuntimeConformanceCertificateV119Inactive,
  installRuntimeEvidenceAuthorityPublication,
  prepareRuntimeEvidenceAuthorityPublication,
  prepareRuntimeEvidenceAuthorityPublicationV117,
  encodeRuntimeEvidenceAuthorityInstallReceiptV117,
  recordInstalledRuntimeEvidenceAuthorityV117,
  sortRuntimeEvidenceAuthoritySourceIdsV117,
  verifyInstalledRuntimeEvidenceAuthorityV117,
  type RuntimeEvidenceAuthorityInstallFileSystem,
  type RuntimeEvidenceAuthorityImportEnvelope,
  type RuntimeEvidenceAuthorityImportPayload,
  type RuntimeEvidenceAuthorityImportTrustRoot,
} from "./runtime-evidence-authority-publisher.js"

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const keys = generateKeyPairSync("ed25519")
const trustRoot: RuntimeEvidenceAuthorityImportTrustRoot = {
  producerId: "fixture:authority-operator:v1",
  keyId: "fixture:authority-operator-key:v1",
  trustDomain: "fixture:runtime-evidence-authority-import:v1",
  publicKeyPem: keys.publicKey
    .export({ type: "spki", format: "pem" })
    .toString(),
}
const laneIdentityHash = sha256("lane")
const verificationInstant = "2026-07-13T12:00:00.000Z"

const lanePayload = (
  changes: Partial<RuntimeEvidenceAuthorityImportPayload> = {},
): RuntimeEvidenceAuthorityImportPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  domain: "lane-control",
  eventId: "fixture:lane-control:disable:1",
  producerId: trustRoot.producerId,
  producerKeyId: trustRoot.keyId,
  trustDomain: trustRoot.trustDomain,
  issuedAt: "2026-07-13T11:00:00.000Z",
  validUntil: "2026-07-14T11:00:00.000Z",
  action: "disable",
  laneIdentityHash,
  reasonCode: "operator-safety-stop",
  evidenceReferenceHash: sha256("operator-evidence"),
  compensatesEventId: null,
  targetCertificateId: null,
  targetCertificateRecordHash: null,
  replacementCertificateId: null,
  replacementCertificateRecordHash: null,
  ...changes,
})

const statusPayload = (
  domain: "certificate-revocation" | "certificate-supersession",
  changes: Partial<RuntimeEvidenceAuthorityImportPayload> = {},
): RuntimeEvidenceAuthorityImportPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  domain,
  eventId: `fixture:${domain}:1`,
  producerId: trustRoot.producerId,
  producerKeyId: trustRoot.keyId,
  trustDomain: trustRoot.trustDomain,
  issuedAt: "2026-07-13T11:00:00.000Z",
  validUntil: "2026-07-14T11:00:00.000Z",
  action: null,
  laneIdentityHash: null,
  reasonCode:
    domain === "certificate-revocation" ? "evidence-invalid" : "recertified",
  evidenceReferenceHash: sha256(`${domain}:evidence`),
  compensatesEventId: null,
  targetCertificateId: "certificate:fixture:one",
  targetCertificateRecordHash: sha256("certificate:one"),
  replacementCertificateId:
    domain === "certificate-supersession" ? "certificate:fixture:two" : null,
  replacementCertificateRecordHash:
    domain === "certificate-supersession" ? sha256("certificate:two") : null,
  ...changes,
})

const envelope = (
  payload: RuntimeEvidenceAuthorityImportPayload,
  privateKey = keys.privateKey,
): RuntimeEvidenceAuthorityImportEnvelope => ({
  payload,
  signatureBase64: sign(
    null,
    encodeRuntimeEvidenceAuthorityImportPayload(payload),
    privateKey,
  ).toString("base64"),
})

const rejectingPool = () => {
  const calls: string[] = []
  return {
    calls,
    pool: {
      async connect() {
        calls.push("connect")
        throw new Error("SQL must not be reached")
      },
    } as unknown as Pool,
  }
}

describe("authenticated runtime evidence authority controls", () => {
  it("rejects impossible calendar instants before persistence", () => {
    const fake = rejectingPool()
    expect(() =>
      envelope(lanePayload({ issuedAt: "2026-02-30T00:00:00.000Z" })),
    ).toThrow(/exact UTC millisecond instant/i)
    expect(fake.calls).toEqual([])
  })

  it("rejects forged, unknown-key, wrong-domain, stale, partial, and lane-mismatched controls with zero rows", async () => {
    const otherKeys = generateKeyPairSync("ed25519")
    const candidates = [
      envelope(lanePayload(), otherKeys.privateKey),
      envelope(lanePayload({ producerKeyId: "unknown-key" })),
      {
        ...envelope(lanePayload()),
        payload: { ...lanePayload(), domain: "certificate-revocation" },
      } as RuntimeEvidenceAuthorityImportEnvelope,
      envelope(lanePayload({ validUntil: "2026-07-13T11:30:00.000Z" })),
      {
        ...envelope(lanePayload()),
        payload: { ...lanePayload(), reasonCode: undefined },
      } as unknown as RuntimeEvidenceAuthorityImportEnvelope,
      envelope(lanePayload({ laneIdentityHash: sha256("other-lane") })),
    ]
    for (const candidate of candidates) {
      const fake = rejectingPool()
      await expect(
        importAuthenticatedRuntimeLaneControl(fake.pool, {
          envelope: candidate,
          verificationInstant,
          expectedLaneIdentityHash: laneIdentityHash,
          trustedOperators: [trustRoot],
        }),
      ).rejects.toThrow()
      expect(fake.calls).toEqual([])
    }
  })

  it("keeps certificate revocation and supersession in signed domains distinct from lane controls", async () => {
    const fake = rejectingPool()
    await expect(
      importAuthenticatedCertificateRevocation(fake.pool, {
        envelope: envelope(statusPayload("certificate-supersession")),
        verificationInstant,
        trustedAuthorities: [trustRoot],
      }),
    ).rejects.toThrow(/domain/iu)
    await expect(
      importAuthenticatedCertificateSupersession(fake.pool, {
        envelope: envelope(statusPayload("certificate-revocation")),
        verificationInstant,
        trustedAuthorities: [trustRoot],
      }),
    ).rejects.toThrow(/domain/iu)
    expect(fake.calls).toEqual([])
  })

  it("fails closed on a missing publication before any filesystem operation", async () => {
    const fileSystemCalls: string[] = []
    const sqlCalls: string[] = []
    const client = {
      async query(sql: string) {
        sqlCalls.push(sql.replace(/\s+/gu, " ").trim())
        return { rows: [] }
      },
      release() {},
    }
    const missingPool = {
      connect: async () => client,
    } as unknown as Pool
    const fileSystem: RuntimeEvidenceAuthorityInstallFileSystem = {
      async readFile() {
        fileSystemCalls.push("readFile")
        throw new Error("filesystem must not be reached")
      },
      async open() {
        fileSystemCalls.push("open")
        throw new Error("filesystem must not be reached")
      },
      async rename() {
        fileSystemCalls.push("rename")
        throw new Error("filesystem must not be reached")
      },
      async unlink() {
        fileSystemCalls.push("unlink")
        throw new Error("filesystem must not be reached")
      },
    }

    await expect(
      installRuntimeEvidenceAuthorityPublication(missingPool, {
        publicationId: "runtime-evidence-authority:missing",
        targetPath: "/authority-must-not-be-touched.json",
        attemptId: "install:missing-publication",
        evaluationInstant: verificationInstant,
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        signerKeyId: trustRoot.keyId,
        publicKeyPem: trustRoot.publicKeyPem,
        fileSystem,
      }),
    ).rejects.toMatchObject({
      code: "UNKNOWN_PUBLICATION",
      message: "Authority publication does not exist.",
    })
    expect(fileSystemCalls).toEqual([])
    expect(sqlCalls.some((sql) => sql.includes("pg_advisory_unlock"))).toBe(
      true,
    )
  })
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

const installedAuthorityFixtureV117 = (
  semanticTupleManifestHash = CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
) => {
  const binding: RuntimeEvidenceAuthorityBindingV117 = {
    graphSchemaVersion: "runtime-evidence-graph-v1.17",
    graphProfile: "runtime-identity-evidence-dag-v1",
    identityManifestRoot: sha256("v1.17-identity"),
    evidenceGraphRoot: sha256("v1.17-evidence"),
    exactPins: [
      ["runtimeExecutableDigest", sha256("runtime")],
      ["reportedVersion", "node-v26.0.0"],
      ["targetAbi", "darwin-arm64"],
      ["compilerFlags", sha256("flags")],
      ["adapterBuildDigest", sha256("adapter")],
      ["standardLibraryOrSysrootDigest", sha256("stdlib")],
      ["containmentPolicyId", "containment-policy:v1.17"],
      ["budgetProfileSha256", sha256("budget")],
      ["canonicalJsonProfileId", "canonical-json-v1.1"],
      ["behaviorSettingsHash", sha256("settings")],
    ],
  }
  const attestationId = "attestation:installed:v1.17"
  const certificateId = "certificate:installed:v1.17"
  const certificateVersion = "certificate:v1.17"
  const payload: RuntimeEvidenceAuthorityPayloadV117 = {
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
    bundleVersion: "bundle:installed:v1.17",
    registryGeneration: "7",
    issuedAt: "2026-07-14T00:00:00.000Z",
    validFrom: "2026-07-14T00:00:00.000Z",
    validUntil: "2026-07-15T00:00:00.000Z",
    semanticTupleManifestHash,
    sourceManifestHash: sha256("v1.17-source-manifest"),
    attestations: [
      {
        attestationId,
        attestationHash: sha256("v1.17-attestation"),
        producerId: "fixture:managed:v1.17",
        producerKeyId: trustRoot.keyId,
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
        certificateRecordHash: hashRuntimeEvidenceCertificateRecordV117({
          certificateKind: "containment",
          certificateId,
          certificateVersion,
          attestationId,
          binding,
        }),
        certificateKind: "containment",
        attestationId,
        binding,
      },
    ],
  }
  const payloadBytes = encodeRuntimeEvidenceAuthorityPayloadV117(payload)
  const trustDomain = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId: trustRoot.keyId,
    payloadBytes,
    signature: sign(
      null,
      encodeRuntimeEvidenceAuthoritySignatureMessage({
        trustDomain,
        keyId: trustRoot.keyId,
        payloadBytes,
      }),
      keys.privateKey,
    ),
  })
  return {
    envelopeBytes: new TextEncoder().encode(JSON.stringify(envelope)),
    trustDomain,
  }
}

describe("v1.17 installed authority persistence boundary", () => {
  it("trusts only the exact v1.17 successor tuple, never the preactivation current tuple", () => {
    const inputFor = (
      fixture: ReturnType<typeof installedAuthorityFixtureV117>,
    ) => ({
      envelopeBytes: fixture.envelopeBytes,
      evaluationInstant: "2026-07-14T12:00:00.000Z",
      installedAt: "2026-07-14T12:00:00.000Z",
      expectedTrustDomain: fixture.trustDomain,
      signerKeyId: trustRoot.keyId,
      publicKeyPem: keys.publicKey
        .export({ type: "spki", format: "pem" })
        .toString(),
    })
    expect(
      verifyInstalledRuntimeEvidenceAuthorityV117(
        inputFor(installedAuthorityFixtureV117()),
      ).semanticTupleManifestHash,
    ).toBe(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID)
    expect(() =>
      verifyInstalledRuntimeEvidenceAuthorityV117(
        inputFor(
          installedAuthorityFixtureV117(
            HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_ID,
          ),
        ),
      ),
    ).toThrow(/identity is unavailable/iu)
  })

  it("uses canonical-json-v1.1 bytes independent of insertion and non-ASCII host ordering", () => {
    const first = {
      z: "last ASCII",
      "\uE000": "private-use",
      "💩": "astral",
      a: "first ASCII",
    }
    const second = {
      a: "first ASCII",
      "💩": "astral",
      "\uE000": "private-use",
      z: "last ASCII",
    }
    expect(
      Buffer.from(
        encodeRuntimeEvidenceAuthorityInstallReceiptV117(first),
      ).equals(
        Buffer.from(encodeRuntimeEvidenceAuthorityInstallReceiptV117(second)),
      ),
    ).toBe(true)
    const ordered = sortRuntimeEvidenceAuthoritySourceIdsV117([
      "source:💩",
      "source:\uE000",
      "source:a",
    ])
    expect(ordered).toEqual(["source:a", "source:\uE000", "source:💩"])
    expect(
      createHash("sha256")
        .update(
          encodeRuntimeEvidenceAuthorityInstallReceiptV117({
            sourceIds: [...ordered],
          }),
        )
        .digest("hex"),
    ).toBe("3483db81bfeee0f491ace709fb08a2ab08105c91e18068653ba7e17ab3af0366")
  })

  it("requires an independently verified signed bundle and derived install identity", async () => {
    const source = await readFile(
      new URL("runtime-evidence-authority-publisher.ts", import.meta.url),
      "utf8",
    )
    for (const required of [
      "recordInstalledRuntimeEvidenceAuthorityV117",
      "inspectRuntimeEvidenceAuthorityBundleV117",
      "installReceiptId",
      "installReceiptHash",
      "runtime_evidence_v1_17_installed_authorities",
    ])
      expect(source).toContain(required)
  })

  it("accepts the sole-writer successor fixture bytes and persists their exact derived row", async () => {
    const fixture = JSON.parse(
      await readFile(
        new URL(
          "../../spec/artifacts/runtime-successor-authority-v1.17.fixture.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      installFixture: {
        trustDomain: string
        signerKeyId: string
        publicKeyPem: string
        evaluationInstant: string
        installedAt: string
        payloadBytesBase64: string
        envelopeBytesBase64: string
        expected: {
          installReceiptId: string
          installReceiptHash: string
          authorityBundleHash: string
          sourceManifestHash: string
          registryGeneration: string
          semanticTupleManifestHash: string
          envelopeSha256: string
          attestationIds: string[]
          certificateIds: string[]
          installReceipt: unknown
        }
      }
    }
    const { installFixture } = fixture
    const queries: string[] = []
    let inserted: readonly unknown[] | undefined
    const fixtureClient = {
      async query(sql: string, values?: readonly unknown[]) {
        const normalized = sql.replace(/\s+/gu, " ").trim()
        queries.push(normalized)
        if (
          normalized === "begin isolation level serializable" ||
          normalized ===
            RUNTIME_EVIDENCE_V117_INSTALLED_AUTHORITY_HEAD_LOCK_SQL ||
          normalized === "commit" ||
          normalized === "rollback"
        ) {
          return { rows: [], rowCount: 0 }
        }
        if (
          /insert into runtime_evidence_v1_17_installed_authorities/iu.test(sql)
        ) {
          inserted = values
          return { rows: [], rowCount: 1 }
        }
        if (/select authority_bundle_hash/iu.test(sql)) {
          if (inserted === undefined)
            throw new Error("fixture select occurred before insert")
          return {
            rows: [
              {
                authority_bundle_hash: inserted[1],
                source_manifest_hash: inserted[2],
                registry_generation: inserted[3],
                semantic_tuple_manifest_hash: inserted[4],
                envelope_sha256: inserted[5],
                trust_domain: inserted[6],
                signer_key_id: inserted[7],
                install_receipt_hash: inserted[8],
                payload_bytes: inserted[13],
                envelope_bytes: inserted[14],
                attestation_ids: JSON.parse(inserted[15] as string),
                certificate_ids: JSON.parse(inserted[16] as string),
                install_receipt: JSON.parse(inserted[17] as string),
              },
            ],
            rowCount: 1,
          }
        }
        throw new Error(`unexpected fixture query: ${sql}`)
      },
      release() {
        queries.push("release")
      },
    }
    const fixturePool = {
      async connect() {
        return fixtureClient
      },
    } as unknown as Pool

    const installed = await recordInstalledRuntimeEvidenceAuthorityV117(
      fixturePool,
      {
        envelopeBytes: Buffer.from(
          installFixture.envelopeBytesBase64,
          "base64",
        ),
        evaluationInstant: installFixture.evaluationInstant,
        installedAt: installFixture.installedAt,
        expectedTrustDomain: installFixture.trustDomain,
        signerKeyId: installFixture.signerKeyId,
        publicKeyPem: installFixture.publicKeyPem,
      },
    )
    const {
      attestationIds,
      certificateIds,
      installReceipt,
      ...expectedInstalled
    } = installFixture.expected
    expect(installed).toEqual(expectedInstalled)
    expect(inserted).toBeDefined()
    expect(Buffer.from(inserted![13] as Uint8Array).toString("base64")).toBe(
      installFixture.payloadBytesBase64,
    )
    expect(Buffer.from(inserted![14] as Uint8Array).toString("base64")).toBe(
      installFixture.envelopeBytesBase64,
    )
    expect(JSON.parse(inserted![15] as string)).toEqual(attestationIds)
    expect(JSON.parse(inserted![16] as string)).toEqual(certificateIds)
    expect(JSON.parse(inserted![17] as string)).toEqual(installReceipt)
    expect(queries[0]).toBe("begin isolation level serializable")
    expect(queries[1]).toBe(
      RUNTIME_EVIDENCE_V117_INSTALLED_AUTHORITY_HEAD_LOCK_SQL,
    )
    expect(queries[2]).toMatch(
      /^insert into runtime_evidence_v1_17_installed_authorities/iu,
    )
    expect(queries[3]).toMatch(/^select authority_bundle_hash/iu)
    expect(queries.slice(4)).toEqual(["commit", "release"])
  })
})

describePostgres(
  "PostgreSQL append-only runtime evidence authority schema",
  () => {
    const schema = `runtime_authority_${randomUUID().replaceAll("-", "")}`
    let admin: Pool
    let pool: Pool

    beforeAll(async () => {
      admin = new Pool({ connectionString: databaseUrl! })
      await admin.query(`create schema ${schema}`)
      pool = new Pool({
        connectionString: databaseUrl!,
        options: `-c search_path=${schema}`,
        max: 4,
      })
      await migrate(pool)
    }, 30_000)

    afterAll(async () => {
      await pool.end()
      await admin.query(`drop schema ${schema} cascade`)
      await admin.end()
    })

    it("keeps production v1.17 candidate publication empty before Phase 259", async () => {
      const prepared = await prepareRuntimeEvidenceAuthorityPublicationV117(
        pool,
        {
          mode: "production",
          bundleVersion: "candidate:v1.17",
          registryGeneration: "1",
          issuedAt: "2026-07-14T00:00:00.000Z",
          validFrom: "2026-07-14T00:00:00.000Z",
          validUntil: "2026-07-15T00:00:00.000Z",
          semanticTupleManifestHash: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
          sourceManifestHash: sha256("candidate-source-manifest"),
        },
      )
      expect(prepared.payload.attestations).toEqual([])
      expect(prepared.payload.certificates).toEqual([])
      expect(prepared.payloadSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    })

    it("records one distinct signed fixture install and keeps production installs empty", async () => {
      const fixture = installedAuthorityFixtureV117()
      const input = {
        envelopeBytes: fixture.envelopeBytes,
        evaluationInstant: "2026-07-14T12:00:00.000Z",
        installedAt: "2026-07-14T12:00:00.000Z",
        expectedTrustDomain: fixture.trustDomain,
        signerKeyId: trustRoot.keyId,
        publicKeyPem: trustRoot.publicKeyPem,
      }
      const [installed, concurrentDuplicate] = await Promise.all([
        recordInstalledRuntimeEvidenceAuthorityV117(pool, input),
        recordInstalledRuntimeEvidenceAuthorityV117(pool, input),
      ])
      expect(concurrentDuplicate).toEqual(installed)
      const rows = await pool.query<{
        authority_bundle_hash: string
        install_receipt_hash: string
        production_count: number
      }>(
        `select authority_bundle_hash, install_receipt_hash,
                (select count(*)::integer
                   from runtime_evidence_v1_17_installed_authorities
                  where trust_domain = $2) as production_count
           from runtime_evidence_v1_17_installed_authorities
          where install_receipt_id = $1`,
        [
          installed.installReceiptId,
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        ],
      )
      expect(rows.rows).toEqual([
        expect.objectContaining({
          authority_bundle_hash: installed.authorityBundleHash,
          install_receipt_hash: installed.installReceiptHash,
          production_count: 0,
        }),
      ])
      const forged = new Uint8Array(fixture.envelopeBytes)
      forged[forged.byteLength - 2] = forged[forged.byteLength - 2]! ^ 1
      await expect(
        recordInstalledRuntimeEvidenceAuthorityV117(pool, {
          ...input,
          envelopeBytes: forged,
        }),
      ).rejects.toThrow()
      await expect(
        recordInstalledRuntimeEvidenceAuthorityV117(pool, {
          ...input,
          expectedTrustDomain:
            RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        }),
      ).rejects.toThrow(/Phase 259/u)
      await expect(
        recordInstalledRuntimeEvidenceAuthorityV117(pool, {
          ...input,
          installedAt: "2026-07-14T12:00:00.001Z",
        }),
      ).rejects.toThrow(/identity/iu)
      await expect(
        pool.query(
          `update runtime_evidence_v1_17_installed_authorities
              set source_manifest_hash = $1
            where install_receipt_id = $2`,
          [sha256("mutated"), installed.installReceiptId],
        ),
      ).rejects.toThrow(/append-only/iu)
    })

    const seedCertificate = async (
      id: string,
      recordHash: string,
      suffix: string,
      validity: {
        issuedAt?: string
        freshUntil?: string
      } = {},
      semanticIdentity: {
        tupleId: string
        tuple: CanonicalCompatibilityTuple
      } = {
        tupleId: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
        tuple: CANONICAL_COMPATIBILITY_TUPLES[0]!.tuple,
      },
    ): Promise<string> => {
      const attestationId = `attestation:${suffix}`
      const rawHash = recordHash.slice("sha256:".length)
      const lane = {
        providerId: "fixture",
        languageId: "typescript",
        runtimeId: "node",
        runtimeVersion: "24",
        toolchainId: "typescript",
        toolchainVersion: "6",
        adapterId: "json",
        adapterVersion: "1",
        policyId: "fixture-policy",
        policyVersion: "1",
        corpusId: "fixture-corpus",
        corpusVersion: "1",
        artifactId: `fixture-artifact:${suffix}`,
        artifactSha256: rawHash,
        implementationId: "fixture-implementation",
        buildId: `fixture-build:${suffix}`,
        semanticTupleId: semanticIdentity.tupleId,
        semanticTuple: semanticIdentity.tuple,
      }
      const certificateLaneIdentityHash = `sha256:${hashExecutableLaneIdentity(lane)}`
      const common = [
        "passed",
        "containment",
        trustRoot.producerId,
        trustRoot.keyId,
        trustRoot.trustDomain,
        "runtime-evidence-attestation-v1",
        "command",
        rawHash,
        "corpus",
        rawHash,
        "policy",
        rawHash,
        "node",
        "24",
        "typescript",
        "6",
        "json",
        "1",
        lane.artifactId,
        rawHash,
        certificateLaneIdentityHash,
        lane.semanticTupleId,
        rawHash,
        rawHash,
        rawHash,
        "runtime-certificate-v1",
        rawHash,
        "fixture:generation:1",
        lane,
        "2026-07-12T00:00:00.000Z",
        "2026-08-12T00:00:00.000Z",
      ]
      await pool.query(
        `insert into runtime_evidence_verified_attestations
        (id, attestation_sha256, verification_status, certificate_kind,
         producer_id, producer_key_id, trust_domain, schema_version, command_id,
         command_digest, corpus_id, corpus_hash, policy_id, policy_hash,
         runtime_id, runtime_version, toolchain_id, toolchain_version, adapter_id,
         adapter_version, artifact_id, artifact_hash, lane_identity_hash,
         semantic_tuple_id, result_manifest_hash, result_graph_hash,
         original_evidence_hash, derived_certificate_version,
         derived_certificate_record_hash, registry_generation, lane_identity,
         issued_at, valid_until)
       values ($1,$2,${common.map((_, index) => `$${index + 3}`).join(",")})`,
        [attestationId, rawHash, ...common],
      )
      await pool.query(
        `insert into runtime_evidence_certificates
        (id, certificate_kind, certificate_version, certificate_record_hash,
         certificate_status, verified_attestation_id, verified_attestation_status,
         producer_id, schema_version, command_id, command_digest, corpus_id,
         corpus_hash, policy_id, policy_hash, toolchain_id, toolchain_version,
         artifact_id, artifact_hash, lane_identity_hash, lane_identity,
         result_graph_hash, registry_generation, issued_at, fresh_until)
       values ($1,'containment','runtime-certificate-v1',$2,'passed',$3,'passed',
         $4,'runtime-evidence-attestation-v1','command',$5,'corpus',$5,'policy',$5,
         'typescript','6',$6,$5,$7,$8,$5,'fixture:generation:1',$9,$10)`,
        [
          id,
          rawHash,
          attestationId,
          trustRoot.producerId,
          rawHash,
          lane.artifactId,
          certificateLaneIdentityHash,
          lane,
          validity.issuedAt ?? "2026-07-12T00:00:00.000Z",
          validity.freshUntil ?? "2026-08-12T00:00:00.000Z",
        ],
      )
      return certificateLaneIdentityHash
    }

    it("appends authenticated disable and compensating enable controls and rejects mutation", async () => {
      const disable = await importAuthenticatedRuntimeLaneControl(pool, {
        envelope: envelope(lanePayload()),
        verificationInstant,
        expectedLaneIdentityHash: laneIdentityHash,
        trustedOperators: [trustRoot],
      })
      const enablePayload = lanePayload({
        eventId: "fixture:lane-control:enable:1",
        action: "enable",
        compensatesEventId: disable.controlId,
      })
      const enable = await importAuthenticatedRuntimeLaneControl(pool, {
        envelope: envelope(enablePayload),
        verificationInstant,
        expectedLaneIdentityHash: laneIdentityHash,
        trustedOperators: [trustRoot],
      })
      expect(enable.effectiveDisabled).toBe(false)
      await expect(
        pool.query(
          "update runtime_evidence_lane_controls set reason_code = 'changed'",
        ),
      ).rejects.toThrow(/append-only/iu)
      await expect(
        pool.query("delete from runtime_evidence_lane_controls"),
      ).rejects.toThrow(/append-only/iu)
    })

    it("appends exact revocation and cycle-free supersession and rejects replay, conflict, self, and cycle cases with zero rows", async () => {
      await seedCertificate(
        "certificate:fixture:one",
        sha256("certificate:one"),
        "one",
      )
      await seedCertificate(
        "certificate:fixture:two",
        sha256("certificate:two"),
        "two",
      )
      for (const invalid of [
        envelope(
          statusPayload("certificate-revocation"),
          generateKeyPairSync("ed25519").privateKey,
        ),
        envelope(
          statusPayload("certificate-revocation", {
            eventId: "fixture:revocation:wrong-target",
            targetCertificateRecordHash: sha256("wrong-target"),
          }),
        ),
        envelope(
          statusPayload("certificate-revocation", {
            eventId: "fixture:revocation:unknown",
            targetCertificateId: "certificate:fixture:missing",
            targetCertificateRecordHash: sha256("certificate:missing"),
          }),
        ),
      ]) {
        await expect(
          importAuthenticatedCertificateRevocation(pool, {
            envelope: invalid,
            verificationInstant,
            trustedAuthorities: [trustRoot],
          }),
        ).rejects.toThrow()
      }
      const rejected = await pool.query(
        "select count(*)::integer as count from runtime_evidence_certificate_revocations",
      )
      expect(rejected.rows[0]?.count).toBe(0)

      const revocationEnvelope = envelope(
        statusPayload("certificate-revocation"),
      )
      const first = await importAuthenticatedCertificateRevocation(pool, {
        envelope: revocationEnvelope,
        verificationInstant,
        trustedAuthorities: [trustRoot],
      })
      const again = await importAuthenticatedCertificateRevocation(pool, {
        envelope: revocationEnvelope,
        verificationInstant,
        trustedAuthorities: [trustRoot],
      })
      expect(again).toEqual(first)
      await expect(
        importAuthenticatedCertificateRevocation(pool, {
          envelope: envelope(
            statusPayload("certificate-revocation", {
              eventId: "fixture:revocation:conflict",
              reasonCode: "different-reason",
            }),
          ),
          verificationInstant,
          trustedAuthorities: [trustRoot],
        }),
      ).rejects.toThrow()
      const revocations = await pool.query(
        "select count(*)::integer as count from runtime_evidence_certificate_revocations",
      )
      expect(revocations.rows[0]?.count).toBe(1)

      await importAuthenticatedCertificateSupersession(pool, {
        envelope: envelope(statusPayload("certificate-supersession")),
        verificationInstant,
        trustedAuthorities: [trustRoot],
      })
      const before = await pool.query(
        "select count(*)::integer as count from runtime_evidence_certificate_supersessions",
      )
      for (const invalid of [
        statusPayload("certificate-supersession", {
          eventId: "fixture:supersession:self",
          replacementCertificateId: "certificate:fixture:one",
          replacementCertificateRecordHash: sha256("certificate:one"),
        }),
        statusPayload("certificate-supersession", {
          eventId: "fixture:supersession:cycle",
          targetCertificateId: "certificate:fixture:two",
          targetCertificateRecordHash: sha256("certificate:two"),
          replacementCertificateId: "certificate:fixture:one",
          replacementCertificateRecordHash: sha256("certificate:one"),
        }),
        statusPayload("certificate-supersession", {
          eventId: "fixture:supersession:unknown",
          replacementCertificateId: "certificate:fixture:missing",
          replacementCertificateRecordHash: sha256("certificate:missing"),
        }),
      ]) {
        await expect(
          importAuthenticatedCertificateSupersession(pool, {
            envelope: envelope(invalid),
            verificationInstant,
            trustedAuthorities: [trustRoot],
          }),
        ).rejects.toThrow()
      }
      const after = await pool.query(
        "select count(*)::integer as count from runtime_evidence_certificate_supersessions",
      )
      expect(after.rows[0]?.count).toBe(before.rows[0]?.count)
      await expect(
        pool.query("delete from runtime_evidence_certificate_supersessions"),
      ).rejects.toThrow(/append-only/iu)
      await expect(
        pool.query(
          "update runtime_evidence_certificate_revocations set reason_code = 'changed'",
        ),
      ).rejects.toThrow(/append-only/iu)
    })

    it("builds and signs a deterministic locked snapshot with exact source provenance", async () => {
      const certificateId = "certificate:fixture:snapshot"
      const selectedLaneIdentityHash = await seedCertificate(
        certificateId,
        sha256("certificate:snapshot"),
        "snapshot",
      )
      const disablePayload = lanePayload({
        eventId: "fixture:lane-control:disable:snapshot",
        laneIdentityHash: selectedLaneIdentityHash,
      })
      await importAuthenticatedRuntimeLaneControl(pool, {
        envelope: envelope(disablePayload),
        verificationInstant,
        expectedLaneIdentityHash: selectedLaneIdentityHash,
        trustedOperators: [trustRoot],
      })
      const unrelatedDisablePayload = lanePayload({
        eventId: "fixture:lane-control:disable:unrelated",
        laneIdentityHash: sha256("unrelated-lane"),
      })
      await importAuthenticatedRuntimeLaneControl(pool, {
        envelope: envelope(unrelatedDisablePayload),
        verificationInstant,
        expectedLaneIdentityHash: unrelatedDisablePayload.laneIdentityHash!,
        trustedOperators: [trustRoot],
      })

      const prepared = await prepareRuntimeEvidenceAuthorityPublication(pool, {
        bundleVersion: "v1.37-fixture-publication-v1",
        issuedAt: "2026-07-13T12:00:00.000Z",
        validFrom: "2026-07-13T12:00:00.000Z",
        validUntil: "2026-07-14T12:00:00.000Z",
        trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        signerKeyId: trustRoot.keyId,
        trustedImportAuthorities: [trustRoot],
        signMessage: (messageBytes) =>
          sign(null, messageBytes, keys.privateKey),
      })
      const inspected = inspectRuntimeEvidenceAuthorityBundle(
        prepared.envelopeBytes,
        {
          expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
          evaluationInstant: "2026-07-13T12:00:00.000Z",
          trustedKeyIds: [trustRoot.keyId],
          verifySignature: ({ signedMessageBytes, signature }) =>
            verify(null, signedMessageBytes, keys.publicKey, signature),
        },
      )
      expect(inspected.payload.registryGeneration).toBe(prepared.generation)
      expect(
        inspected.payload.certificates.some(
          (certificate) => certificate.certificateId === certificateId,
        ),
      ).toBe(true)
      expect(inspected.payload.operatorLaneDisables).toEqual([
        expect.objectContaining({ laneIdentityHash: selectedLaneIdentityHash }),
      ])
      expect(inspected.payload.certificates).not.toContainEqual(
        expect.objectContaining({ kind: "conformance" }),
      )

      const persisted = await pool.query(
        `select payload_bytes, attestation_ids, certificate_ids,
                revocation_ids, supersession_ids, lane_control_ids
           from runtime_evidence_authority_publications where id = $1`,
        [prepared.publicationId],
      )
      expect(Buffer.from(persisted.rows[0]!.payload_bytes)).toEqual(
        Buffer.from(encodeRuntimeEvidenceAuthorityPayload(inspected.payload)),
      )
      expect(persisted.rows[0]!.certificate_ids).toContain(certificateId)
      expect(persisted.rows[0]!.lane_control_ids).toContain(
        disablePayload.eventId,
      )
      expect(persisted.rows[0]!.lane_control_ids).not.toContain(
        unrelatedDisablePayload.eventId,
      )
      const sourceRows = await pool.query(
        `select source_type, source_id from runtime_evidence_authority_publication_sources
          where publication_id = $1 order by source_type, source_id`,
        [prepared.publicationId],
      )
      expect(sourceRows.rows).toEqual(
        expect.arrayContaining([
          { source_type: "certificate", source_id: certificateId },
          { source_type: "lane-control", source_id: disablePayload.eventId },
        ]),
      )
    })

    it("rejects the inactive candidate schema and trust state with zero publication or receipt rows", async () => {
      const candidateArtifact = JSON.parse(
        await readFile(
          path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            "../../spec/artifacts/v1.37-kernel-integrity-candidate.json",
          ),
          "utf8",
        ),
      ) as {
        schemaVersion: string
        status: string
        trustState: string
        publicationAllowed: boolean
        countedExecutionAllowed: boolean
        candidate: {
          candidateTupleId: string
          candidateTuple: CanonicalCompatibilityTuple
        }
      }
      expect(candidateArtifact).toMatchObject({
        schemaVersion: "v1.37-kernel-integrity-candidate-v1",
        status: "inactive-candidate",
        trustState: "untrusted-non-publishable",
        publicationAllowed: false,
        countedExecutionAllowed: false,
      })

      await seedCertificate(
        "certificate:fixture:inactive-kernel-candidate",
        sha256("certificate:inactive-kernel-candidate"),
        "inactive-kernel-candidate",
        {},
        {
          tupleId: candidateArtifact.candidate.candidateTupleId,
          tuple: candidateArtifact.candidate.candidateTuple,
        },
      )

      const before = await pool.query(
        `select
          (select count(*)::integer from runtime_evidence_authority_publications) as publications,
          (select count(*)::integer from runtime_evidence_authority_publication_sources) as sources,
          (select count(*)::integer from runtime_evidence_authority_publication_events) as events,
          (select count(*)::integer from strategy_revisions) as revisions,
          (select next_generation::text from runtime_evidence_authority_publication_head where singleton = true) as next_generation`,
      )

      await expect(
        prepareRuntimeEvidenceAuthorityPublication(pool, {
          bundleVersion: candidateArtifact.schemaVersion,
          issuedAt: "2026-07-13T12:00:00.000Z",
          validFrom: "2026-07-13T12:00:00.000Z",
          validUntil: "2026-07-14T12:00:00.000Z",
          trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
          signerKeyId: trustRoot.keyId,
          trustedImportAuthorities: [trustRoot],
          signMessage: (bytes) => sign(null, bytes, keys.privateKey),
        }),
      ).rejects.toMatchObject({ code: "CLOSED_GRAPH" })

      const after = await pool.query(
        `select
          (select count(*)::integer from runtime_evidence_authority_publications) as publications,
          (select count(*)::integer from runtime_evidence_authority_publication_sources) as sources,
          (select count(*)::integer from runtime_evidence_authority_publication_events) as events,
          (select count(*)::integer from strategy_revisions) as revisions,
          (select next_generation::text from runtime_evidence_authority_publication_head where singleton = true) as next_generation`,
      )
      expect(after.rows[0]).toEqual(before.rows[0])

      const conformance = await pool.query(
        "select count(*)::integer as count from runtime_evidence_certificates where certificate_kind = 'conformance'",
      )
      expect(conformance.rows[0]?.count).toBe(0)
    })

    it("publishes only certificates covering the complete authority interval", async () => {
      const candidates = [
        {
          id: "certificate:fixture:expired",
          suffix: "expired",
          validity: { freshUntil: "2026-07-13T11:59:59.999Z" },
        },
        {
          id: "certificate:fixture:future",
          suffix: "future",
          validity: { issuedAt: "2026-07-13T12:00:00.001Z" },
        },
        {
          id: "certificate:fixture:mid-window",
          suffix: "mid-window",
          validity: { freshUntil: "2026-07-14T00:00:00.000Z" },
        },
        {
          id: "certificate:fixture:covering",
          suffix: "covering",
          validity: {},
        },
      ] as const
      for (const candidate of candidates) {
        await seedCertificate(
          candidate.id,
          sha256(`certificate:${candidate.suffix}`),
          candidate.suffix,
          candidate.validity,
        )
      }

      const prepared = await prepareRuntimeEvidenceAuthorityPublication(pool, {
        issuedAt: "2026-07-13T12:00:00.000Z",
        validFrom: "2026-07-13T12:00:00.000Z",
        validUntil: "2026-07-14T12:00:00.000Z",
        trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        signerKeyId: trustRoot.keyId,
        trustedImportAuthorities: [trustRoot],
        signMessage: (bytes) => sign(null, bytes, keys.privateKey),
      })
      const inspected = inspectRuntimeEvidenceAuthorityBundle(
        prepared.envelopeBytes,
        {
          expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
          evaluationInstant: "2026-07-13T12:00:00.000Z",
          trustedKeyIds: [trustRoot.keyId],
          verifySignature: ({ signedMessageBytes, signature }) =>
            verify(null, signedMessageBytes, keys.publicKey, signature),
        },
      )
      const ids = inspected.payload.certificates.map(
        (certificate) => certificate.certificateId,
      )
      expect(ids).toContain("certificate:fixture:covering")
      expect(ids).not.toContain("certificate:fixture:expired")
      expect(ids).not.toContain("certificate:fixture:future")
      expect(ids).not.toContain("certificate:fixture:mid-window")
    })

    it("rolls back signer failure and serializes concurrent snapshot generations", async () => {
      const common = {
        bundleVersion: "v1.37-fixture-publication-v1",
        issuedAt: "2026-07-13T12:00:00.000Z",
        validFrom: "2026-07-13T12:00:00.000Z",
        validUntil: "2026-07-14T12:00:00.000Z",
        trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        signerKeyId: trustRoot.keyId,
        trustedImportAuthorities: [trustRoot],
      } as const
      const before = await pool.query(
        "select next_generation from runtime_evidence_authority_publication_head where singleton = true",
      )
      await expect(
        prepareRuntimeEvidenceAuthorityPublication(pool, {
          ...common,
          signMessage: () => {
            throw new Error("signer unavailable")
          },
        }),
      ).rejects.toThrow(/signer/iu)
      const afterFailure = await pool.query(
        "select next_generation from runtime_evidence_authority_publication_head where singleton = true",
      )
      expect(afterFailure.rows[0]).toEqual(before.rows[0])

      const [left, right] = await Promise.all([
        prepareRuntimeEvidenceAuthorityPublication(pool, {
          ...common,
          signMessage: (bytes) => sign(null, bytes, keys.privateKey),
        }),
        prepareRuntimeEvidenceAuthorityPublication(pool, {
          ...common,
          signMessage: (bytes) => sign(null, bytes, keys.privateKey),
        }),
      ])
      expect(new Set([left.generation, right.generation]).size).toBe(2)
      expect(Math.abs(Number(left.generation) - Number(right.generation))).toBe(
        1,
      )
      expect(left.payloadSha256).not.toBe(right.payloadSha256)
    })

    const prepareInstallFixture = () =>
      prepareRuntimeEvidenceAuthorityPublication(pool, {
        bundleVersion: "v1.37-fixture-install-v1",
        issuedAt: "2026-07-13T12:00:00.000Z",
        validFrom: "2026-07-13T12:00:00.000Z",
        validUntil: "2026-07-14T12:00:00.000Z",
        trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        signerKeyId: trustRoot.keyId,
        trustedImportAuthorities: [trustRoot],
        signMessage: (bytes) => sign(null, bytes, keys.privateKey),
      })

    const installInput = (
      publicationId: string,
      targetPath: string,
      attemptId: string,
      fileSystem?: RuntimeEvidenceAuthorityInstallFileSystem,
    ) => ({
      publicationId,
      targetPath,
      attemptId,
      evaluationInstant: "2026-07-13T12:00:00.000Z",
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      signerKeyId: trustRoot.keyId,
      publicKeyPem: trustRoot.publicKeyPem,
      ...(fileSystem ? { fileSystem } : {}),
    })

    it("installs restrictive complete bytes and reconciles an exact last-good target idempotently", async () => {
      const directory = await mkdtemp(path.join(tmpdir(), "cowards-authority-"))
      const targetPath = path.join(directory, "authority.json")
      try {
        const prepared = await prepareInstallFixture()
        await writeFile(targetPath, "last-good", { mode: 0o600 })
        const installed = await installRuntimeEvidenceAuthorityPublication(
          pool,
          installInput(prepared.publicationId, targetPath, "install:first"),
        )
        expect(installed.reconciled).toBe(false)
        expect(await readFile(targetPath)).toEqual(
          Buffer.from(prepared.envelopeBytes),
        )
        expect((await stat(targetPath)).mode & 0o777).toBe(0o600)

        const reconciled = await installRuntimeEvidenceAuthorityPublication(
          pool,
          installInput(prepared.publicationId, targetPath, "install:retry"),
        )
        expect(reconciled.reconciled).toBe(true)
        const receipts = await pool.query(
          `select event_kind, attempt_id, receipt
             from runtime_evidence_authority_publication_events
            where publication_id = $1 and event_kind = 'installed'
            order by attempt_id`,
          [prepared.publicationId],
        )
        expect(receipts.rows).toHaveLength(2)
        expect(
          receipts.rows.every((row) => row.receipt.targetPath === undefined),
        ).toBe(true)
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })

    it.each(["temp-write", "file-fsync", "close", "rename"] as const)(
      "preserves last-good bytes and removes temporary files on %s failure",
      async (failureStage) => {
        const directory = await mkdtemp(
          path.join(tmpdir(), "cowards-authority-"),
        )
        const targetPath = path.join(directory, "authority.json")
        const lastGood = Buffer.from("last-good-authority", "utf8")
        const prepared = await prepareInstallFixture()
        await writeFile(targetPath, lastGood, { mode: 0o600 })
        const fileSystem: RuntimeEvidenceAuthorityInstallFileSystem = {
          readFile,
          unlink: (filePath) => rm(filePath, { force: true }),
          rename: async (from, to) => {
            if (failureStage === "rename") throw new Error("rename failure")
            await import("node:fs/promises").then((fs) => fs.rename(from, to))
          },
          async open(filePath, flags, mode) {
            const handle = await open(filePath, flags, mode)
            const temporary = flags === "wx"
            return {
              writeFile: async (bytes) => {
                if (temporary && failureStage === "temp-write") {
                  throw new Error("temp write failure")
                }
                await handle.writeFile(bytes)
              },
              sync: async () => {
                if (temporary && failureStage === "file-fsync") {
                  throw new Error("file fsync failure")
                }
                await handle.sync()
              },
              close: async () => {
                await handle.close()
                if (temporary && failureStage === "close") {
                  throw new Error("close failure")
                }
              },
            }
          },
        }
        try {
          await expect(
            installRuntimeEvidenceAuthorityPublication(
              pool,
              installInput(
                prepared.publicationId,
                targetPath,
                `install:${failureStage}`,
                fileSystem,
              ),
            ),
          ).rejects.toThrow()
          expect(await readFile(targetPath)).toEqual(lastGood)
          expect((await readdir(directory)).sort()).toEqual(["authority.json"])
        } finally {
          await rm(directory, { recursive: true, force: true })
        }
      },
    )

    it("reports directory-fsync uncertainty and reconciles only verified new bytes", async () => {
      const directory = await mkdtemp(path.join(tmpdir(), "cowards-authority-"))
      const targetPath = path.join(directory, "authority.json")
      const prepared = await prepareInstallFixture()
      let directoryFsyncs = 0
      const fileSystem: RuntimeEvidenceAuthorityInstallFileSystem = {
        readFile,
        unlink: (filePath) => rm(filePath, { force: true }),
        rename: (from, to) =>
          import("node:fs/promises").then((fs) => fs.rename(from, to)),
        async open(filePath, flags, mode) {
          const handle = await open(filePath, flags, mode)
          const directoryHandle = flags === "r"
          return {
            writeFile: (bytes) => handle.writeFile(bytes),
            sync: async () => {
              if (directoryHandle && directoryFsyncs++ === 0) {
                throw new Error("directory fsync uncertain")
              }
              await handle.sync()
            },
            close: () => handle.close(),
          }
        },
      }
      try {
        await expect(
          installRuntimeEvidenceAuthorityPublication(
            pool,
            installInput(
              prepared.publicationId,
              targetPath,
              "install:uncertain",
              fileSystem,
            ),
          ),
        ).rejects.toThrow(/uncertain/iu)
        expect(await readFile(targetPath)).toEqual(
          Buffer.from(prepared.envelopeBytes),
        )
        const uncertain = await pool.query(
          `select event_kind from runtime_evidence_authority_publication_events
            where publication_id = $1 and event_kind = 'uncertain'`,
          [prepared.publicationId],
        )
        expect(uncertain.rows).toHaveLength(1)
        const retry = await installRuntimeEvidenceAuthorityPublication(
          pool,
          installInput(
            prepared.publicationId,
            targetPath,
            "install:uncertain-retry",
            fileSystem,
          ),
        )
        expect(retry.reconciled).toBe(true)
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })

    it("reconciles a durable install after database receipt failure and serializes concurrent installers", async () => {
      const directory = await mkdtemp(path.join(tmpdir(), "cowards-authority-"))
      const targetPath = path.join(directory, "authority.json")
      const prepared = await prepareInstallFixture()
      let rejectedReceipt = false
      const receiptFailingPool = {
        async connect() {
          const client = await pool.connect()
          return {
            async query(sql: string, values?: readonly unknown[]) {
              if (
                !rejectedReceipt &&
                /insert into runtime_evidence_authority_publication_events/iu.test(
                  sql,
                ) &&
                values?.[2] === "installed"
              ) {
                rejectedReceipt = true
                throw new Error("receipt database unavailable")
              }
              return client.query(sql, values ? [...values] : [])
            },
            release: () => client.release(),
          }
        },
      } as unknown as Pool
      try {
        await expect(
          installRuntimeEvidenceAuthorityPublication(
            receiptFailingPool,
            installInput(
              prepared.publicationId,
              targetPath,
              "install:receipt-failure",
            ),
          ),
        ).rejects.toThrow(/receipt reconciliation/iu)
        expect(await readFile(targetPath)).toEqual(
          Buffer.from(prepared.envelopeBytes),
        )
        const retry = await installRuntimeEvidenceAuthorityPublication(
          pool,
          installInput(
            prepared.publicationId,
            targetPath,
            "install:receipt-retry",
          ),
        )
        expect(retry.reconciled).toBe(true)

        await rm(targetPath)
        const [left, right] = await Promise.all([
          installRuntimeEvidenceAuthorityPublication(
            pool,
            installInput(
              prepared.publicationId,
              targetPath,
              "install:concurrent:left",
            ),
          ),
          installRuntimeEvidenceAuthorityPublication(
            pool,
            installInput(
              prepared.publicationId,
              targetPath,
              "install:concurrent:right",
            ),
          ),
        ])
        expect([left.reconciled, right.reconciled].sort()).toEqual([
          false,
          true,
        ])
        expect(await readFile(targetPath)).toEqual(
          Buffer.from(prepared.envelopeBytes),
        )
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })
  },
)

describePostgres("Phase-259 reviewed conformance certificate import", () => {
  const schema = `runtime_conformance_${randomUUID().replaceAll("-", "")}`
  const conformanceKeys = generateKeyPairSync("ed25519")
  let admin: Pool
  let pool: Pool

  const fixture = async () => {
    const reviewed = JSON.parse(
      await readFile(
        path.resolve(
          import.meta.dirname,
          "../../..",
          ".planning/artifacts/v1.37-language-conformance-typescript.json",
        ),
        "utf8",
      ),
    ) as {
      candidatePayload: RuntimeConformanceCertificatePayloadV117
      expectedRunBinding: RuntimeConformanceExpectedRunBindingV117
    }
    const payload: RuntimeConformanceCertificatePayloadV117 = {
      ...globalThis.structuredClone(reviewed.candidatePayload),
      producerId: "fixture:runtime-conformance-producer:v1.37",
      producerKeyId: "fixture:runtime-conformance-key:v1.37",
      trustDomain: "fixture",
    }
    const certificate: RuntimeConformanceCertificateV117 = {
      ...payload,
      signatureBase64: sign(
        null,
        encodeRuntimeConformanceCertificatePayloadV117(payload),
        conformanceKeys.privateKey,
      ).toString("base64"),
    }
    const encoded = encodeCanonicalJson(certificate as unknown as JsonValue, {
      context: "canonical-manifest",
    })
    if (!encoded.ok) throw new Error("fixture certificate is not canonical")
    const certificateSha256 = `sha256:${createHash("sha256")
      .update(encoded.bytes)
      .digest("hex")}`
    const importPayload: RuntimeEvidenceAuthorityImportPayload = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
      domain: "conformance-certificate",
      eventId: `fixture:conformance-import:${certificateSha256.slice(-16)}`,
      producerId: trustRoot.producerId,
      producerKeyId: trustRoot.keyId,
      trustDomain: trustRoot.trustDomain,
      issuedAt: payload.issuedAt,
      validUntil: payload.freshUntil,
      action: null,
      laneIdentityHash: null,
      reasonCode: "REVIEWED_CONFORMANCE_CERTIFICATE",
      evidenceReferenceHash: payload.identity.evidenceGraphRoot,
      compensatesEventId: null,
      targetCertificateId: payload.certificateId,
      targetCertificateRecordHash: certificateSha256,
      replacementCertificateId: null,
      replacementCertificateRecordHash: null,
    }
    const trustedProducer: RuntimeConformanceTrustedProducerV117 = {
      producerId: payload.producerId,
      keyId: payload.producerKeyId,
      trustDomain: "fixture",
      managedIdentity: true,
      publicKeyPem: conformanceKeys.publicKey
        .export({ type: "spki", format: "pem" })
        .toString(),
    }
    return {
      input: {
        mode: "fixture" as const,
        certificate,
        currentIdentity: payload.identity,
        expectedRunBinding: reviewed.expectedRunBinding,
        verificationInstant: payload.issuedAt,
        trustedProducers: [trustedProducer],
        importEnvelope: envelope(importPayload),
        trustedImportAuthorities: [trustRoot],
      },
      certificateSha256,
    }
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 4,
    })
    await migrate(pool)
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("imports one exact certificate idempotently with three immutable runs", async () => {
    const prepared = await fixture()
    const [left, right] = await Promise.all([
      importRuntimeConformanceCertificateV117(pool, prepared.input),
      importRuntimeConformanceCertificateV117(pool, prepared.input),
    ])
    expect(left).toEqual(right)
    expect(left).toMatchObject({
      status: "installed",
      certificateSha256: prepared.certificateSha256,
      languageId: "typescript",
      registryGeneration: "0",
    })
    expect(JSON.stringify(left)).not.toMatch(
      /source|memory|objective|diagnostics|stderr|private|path|host/iu,
    )
    const counts = await pool.query<{
      certificates: number
      runs: number
    }>(`select
      (select count(*)::integer from runtime_evidence_certificates
        where exact_certificate_sha256 is not null) as certificates,
      (select count(*)::integer
         from runtime_evidence_conformance_certificate_runs) as runs`)
    expect(counts.rows[0]).toEqual({ certificates: 1, runs: 3 })
    await expect(
      pool.query(
        "update runtime_evidence_conformance_certificate_runs set case_count = 17",
      ),
    ).rejects.toThrow(/append-only/iu)
    await expect(
      pool.query("delete from runtime_evidence_certificates"),
    ).rejects.toThrow(/append-only/iu)
  })

  it("rejects operator substitution before durable mutation", async () => {
    const prepared = await fixture()
    const changed = globalThis.structuredClone(prepared.input)
    changed.importEnvelope.payload.targetCertificateRecordHash = sha256(
      "substituted-certificate",
    )
    changed.importEnvelope = envelope(changed.importEnvelope.payload)
    await expect(
      importRuntimeConformanceCertificateV117(pool, changed),
    ).rejects.toMatchObject({ code: "CERTIFICATE_IMPORT_BINDING" })
    const count = await pool.query<{ count: number }>(
      "select count(*)::integer as count from runtime_evidence_certificates where exact_certificate_sha256 = $1",
      [sha256("substituted-certificate")],
    )
    expect(count.rows[0]?.count).toBe(0)
  })
})

describePostgres("Phase-260 inactive observation certificate import", () => {
  const schema = `runtime_conformance_v119_${randomUUID().replaceAll("-", "")}`
  const producerKeys = generateKeyPairSync("ed25519")
  let admin: Pool
  let pool: Pool

  const fixture = async () => {
    const reviewed = JSON.parse(
      await readFile(
        path.resolve(
          import.meta.dirname,
          "../../..",
          ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
        ),
        "utf8",
      ),
    ) as {
      candidatePayload: RuntimeConformanceCertificateV119["candidatePayload"]
      candidatePayloadSha256: string
      expectedRunBinding: {
        caseInventorySha256: string
        requiredCaseCount: number
        resultRootSha256: string
        evidenceRootSha256: string
      }
    }
    const certificate: RuntimeConformanceCertificateV119 = {
      schemaVersion: "runtime-conformance-certificate-envelope-v1.19",
      trustDomain: "fixture",
      managedIdentity: true,
      candidatePayload: globalThis.structuredClone(reviewed.candidatePayload),
      candidatePayloadSha256: reviewed.candidatePayloadSha256,
      signatureBase64: sign(
        null,
        encodeRuntimeConformanceCertificatePayloadV119(
          reviewed.candidatePayload,
        ),
        producerKeys.privateKey,
      ).toString("base64"),
    }
    const encoded = encodeCanonicalJson(certificate as unknown as JsonValue, {
      context: "canonical-manifest",
    })
    if (!encoded.ok) throw new Error("fixture certificate is not canonical")
    const certificateSha256 = `sha256:${createHash("sha256")
      .update(encoded.bytes)
      .digest("hex")}`
    const importPayload: RuntimeEvidenceAuthorityImportPayload = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
      domain: "conformance-certificate",
      eventId: `fixture:observation-v1.19-import:${certificateSha256.slice(-16)}`,
      producerId: trustRoot.producerId,
      producerKeyId: trustRoot.keyId,
      trustDomain: trustRoot.trustDomain,
      issuedAt: reviewed.candidatePayload.issuedAt,
      validUntil: reviewed.candidatePayload.freshUntil,
      action: null,
      laneIdentityHash: null,
      reasonCode: "REVIEWED_INACTIVE_OBSERVATION_CERTIFICATE",
      evidenceReferenceHash:
        reviewed.candidatePayload.identity.evidenceGraphRoot,
      compensatesEventId: null,
      targetCertificateId: reviewed.candidatePayload.certificateId,
      targetCertificateRecordHash: certificateSha256,
      replacementCertificateId: null,
      replacementCertificateRecordHash: null,
    }
    const trustedProducer: RuntimeConformanceTrustedProducerV119 = {
      producerId: reviewed.candidatePayload.producerId,
      keyId: reviewed.candidatePayload.producerKeyId,
      trustDomain: "fixture",
      managedIdentity: true,
      publicKeyPem: producerKeys.publicKey
        .export({ type: "spki", format: "pem" })
        .toString(),
    }
    return {
      input: {
        mode: "fixture" as const,
        certificate,
        expectedIdentity: reviewed.candidatePayload.identity,
        expectedRunBinding: reviewed.expectedRunBinding,
        verificationInstant: reviewed.candidatePayload.issuedAt,
        trustedProducers: [trustedProducer],
        importEnvelope: envelope(importPayload),
        trustedImportAuthorities: [trustRoot],
      },
      certificateSha256,
    }
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 4,
    })
    await migrate(pool)
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("imports exact evidence idempotently but leaves it absent from every current registry", async () => {
    const prepared = await fixture()
    const [left, right] = await Promise.all([
      importRuntimeConformanceCertificateV119Inactive(pool, prepared.input),
      importRuntimeConformanceCertificateV119Inactive(pool, prepared.input),
    ])
    expect(left).toEqual(right)
    expect(left).toMatchObject({
      status: "installed_inactive",
      certificateSha256: prepared.certificateSha256,
      languageId: "typescript",
      candidatePayloadSha256:
        prepared.input.certificate.candidatePayloadSha256,
    })
    expect(JSON.stringify(left)).not.toMatch(
      /source|artifact(?:s)?[":]|memory|objective|diagnostics|stderr|private|path|host/iu,
    )
    const counts = await pool.query<{
      certificates: number
      runs: number
      current_candidates: number
    }>(`select
      (select count(*)::integer from runtime_evidence_certificates
        where certificate_version = 'runtime-conformance-certificate-v1.19') as certificates,
      (select count(*)::integer from runtime_evidence_conformance_certificate_runs) as runs,
      (select count(*)::integer from runtime_evidence_v1_17_candidates) as current_candidates`)
    expect(counts.rows[0]).toEqual({
      certificates: 1,
      runs: 3,
      current_candidates: 0,
    })
  })

  it("rejects substitution, stale evidence, producer/operator collision, and revocation", async () => {
    const prepared = await fixture()

    const substituted = globalThis.structuredClone(prepared.input)
    substituted.importEnvelope.payload.targetCertificateRecordHash = sha256(
      "substituted-observation-certificate",
    )
    substituted.importEnvelope = envelope(substituted.importEnvelope.payload)
    await expect(
      importRuntimeConformanceCertificateV119Inactive(pool, substituted),
    ).rejects.toMatchObject({ code: "CERTIFICATE_IMPORT_BINDING" })

    await expect(
      importRuntimeConformanceCertificateV119Inactive(pool, {
        ...prepared.input,
        verificationInstant: "2026-09-01T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "CERTIFICATE_INVALID" })

    const collision = globalThis.structuredClone(prepared.input)
    collision.importEnvelope.payload.producerId =
      collision.certificate.candidatePayload.producerId
    collision.importEnvelope.payload.producerKeyId =
      collision.certificate.candidatePayload.producerKeyId
    collision.importEnvelope = envelope(collision.importEnvelope.payload)
    await expect(
      importRuntimeConformanceCertificateV119Inactive(pool, collision),
    ).rejects.toMatchObject({ code: "PRODUCER_OPERATOR_COLLISION" })

    const installed = await importRuntimeConformanceCertificateV119Inactive(
      pool,
      prepared.input,
    )
    const revocationPayload = statusPayload("certificate-revocation", {
      eventId: `fixture:revoke:${installed.certificateSha256.slice(-16)}`,
      targetCertificateId: installed.certificateId,
      targetCertificateRecordHash: installed.certificateSha256,
      evidenceReferenceHash:
        prepared.input.certificate.candidatePayload.identity.evidenceGraphRoot,
    })
    await importAuthenticatedCertificateRevocation(pool, {
      envelope: envelope(revocationPayload),
      verificationInstant,
      trustedAuthorities: [trustRoot],
    })
    await expect(
      importRuntimeConformanceCertificateV119Inactive(pool, prepared.input),
    ).rejects.toMatchObject({ code: "CERTIFICATE_REVOKED" })
  })
})

describePostgres("Phase-259 import trust-root bootstrap", () => {
  const schema = `runtime_import_roots_${randomUUID().replaceAll("-", "")}`
  let admin: Pool
  let pool: Pool

  const descriptorBytes = (roots: readonly unknown[]): Uint8Array => {
    const encoded = encodeCanonicalJson(roots as JsonValue, {
      context: "canonical-manifest",
    })
    if (!encoded.ok) throw new Error("fixture descriptor is not canonical")
    return encoded.bytes
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: databaseUrl! })
    await admin.query(`create schema ${schema}`)
    pool = new Pool({
      connectionString: databaseUrl!,
      options: `-c search_path=${schema}`,
      max: 4,
    })
    await migrate(pool)
  }, 30_000)

  afterAll(async () => {
    await pool.end()
    await admin.query(`drop schema ${schema} cascade`)
    await admin.end()
  })

  it("installs an exact plural descriptor idempotently", async () => {
    const bytes = descriptorBytes([trustRoot])
    const expectedDescriptorSha256 = `sha256:${createHash("sha256")
      .update(bytes)
      .digest("hex")}`
    const input = {
      expectedDescriptorSha256,
      producerId: trustRoot.producerId,
      keyId: trustRoot.keyId,
      trustDomain: trustRoot.trustDomain,
      readDescriptorBytes: async () => new Uint8Array(bytes),
    }
    const first = await bootstrapRuntimeEvidenceAuthorityImportTrustRoots(
      pool,
      input,
    )
    const second = await bootstrapRuntimeEvidenceAuthorityImportTrustRoots(
      pool,
      input,
    )
    expect(first).toMatchObject({
      status: "installed",
      descriptorSha256: expectedDescriptorSha256,
      producerId: trustRoot.producerId,
      keyId: trustRoot.keyId,
      trustDomain: trustRoot.trustDomain,
      generation: "1",
    })
    expect(second).toEqual({ ...first, status: "idempotent" })
    expect(JSON.stringify(first)).not.toMatch(
      /private|path|source|runtimeProducer|diagnostic|host/iu,
    )
  })

  it("rejects changed bytes, identity conflict, and mutation", async () => {
    const other = {
      ...trustRoot,
      publicKeyPem: generateKeyPairSync("ed25519")
        .publicKey.export({ type: "spki", format: "pem" })
        .toString(),
    }
    const bytes = descriptorBytes([other])
    await expect(
      bootstrapRuntimeEvidenceAuthorityImportTrustRoots(pool, {
        expectedDescriptorSha256: `sha256:${createHash("sha256")
          .update(bytes)
          .digest("hex")}`,
        producerId: other.producerId,
        keyId: other.keyId,
        trustDomain: other.trustDomain,
        readDescriptorBytes: async () => bytes,
      }),
    ).rejects.toMatchObject({ code: "IMPORT_ROOT_CONFLICT" })

    const original = descriptorBytes([trustRoot])
    let reads = 0
    await expect(
      bootstrapRuntimeEvidenceAuthorityImportTrustRoots(pool, {
        expectedDescriptorSha256: `sha256:${createHash("sha256")
          .update(original)
          .digest("hex")}`,
        producerId: trustRoot.producerId,
        keyId: trustRoot.keyId,
        trustDomain: trustRoot.trustDomain,
        readDescriptorBytes: async () => {
          reads += 1
          return reads === 1 ? original : descriptorBytes([other])
        },
      }),
    ).rejects.toMatchObject({ code: "IMPORT_ROOT_DESCRIPTOR_CHANGED" })

    await expect(
      pool.query(
        "update runtime_evidence_authority_import_trust_root_deployments set generation = generation + 1",
      ),
    ).rejects.toThrow(/append-only/iu)
    await expect(
      pool.query(
        "update runtime_evidence_authority_import_trust_root_head set next_generation = 1",
      ),
    ).rejects.toThrow(/advance exactly once/iu)
    await expect(
      pool.query(
        "update runtime_evidence_authority_import_trust_root_head set next_generation = next_generation + 2",
      ),
    ).rejects.toThrow(/advance exactly once/iu)
  })

  it("rejects noncanonical, duplicate, poisoned, mismatched, and invalid roots without writes", async () => {
    const attempt = (
      bytes: Uint8Array,
      changes: Partial<{
        expectedDescriptorSha256: string
        producerId: string
        keyId: string
        trustDomain: string
      }> = {},
    ) =>
      bootstrapRuntimeEvidenceAuthorityImportTrustRoots(pool, {
        expectedDescriptorSha256: `sha256:${createHash("sha256")
          .update(bytes)
          .digest("hex")}`,
        producerId: trustRoot.producerId,
        keyId: trustRoot.keyId,
        trustDomain: trustRoot.trustDomain,
        readDescriptorBytes: async () => bytes,
        ...changes,
      })

    const duplicate = descriptorBytes([trustRoot, trustRoot])
    await expect(attempt(duplicate)).rejects.toMatchObject({
      code: "IMPORT_ROOT_DUPLICATE",
    })
    const poisoned = descriptorBytes([
      { ...trustRoot, runtimeProducerTrust: true, privateKeyPem: "poison" },
    ])
    await expect(attempt(poisoned)).rejects.toMatchObject({
      code: "IMPORT_ROOT_DESCRIPTOR_SCHEMA",
    })
    const canonical = descriptorBytes([trustRoot])
    const noncanonical = Buffer.from(
      JSON.stringify([trustRoot], undefined, 2),
      "utf8",
    )
    await expect(attempt(noncanonical)).rejects.toMatchObject({
      code: "IMPORT_ROOT_DESCRIPTOR_CANONICAL",
    })
    await expect(
      attempt(canonical, { expectedDescriptorSha256: sha256("wrong") }),
    ).rejects.toMatchObject({ code: "IMPORT_ROOT_DESCRIPTOR_HASH" })
    await expect(
      attempt(canonical, { producerId: "runtime-producer:substitution" }),
    ).rejects.toMatchObject({ code: "IMPORT_ROOT_PIN" })
    const invalidKey = descriptorBytes([
      { ...trustRoot, publicKeyPem: "not a public key" },
    ])
    await expect(attempt(invalidKey)).rejects.toMatchObject({
      code: "IMPORT_ROOT_PUBLIC_KEY",
    })
    const count = await pool.query<{ count: number }>(
      "select count(*)::integer as count from runtime_evidence_authority_import_trust_root_deployments",
    )
    expect(count.rows[0]?.count).toBe(1)
  })
})
