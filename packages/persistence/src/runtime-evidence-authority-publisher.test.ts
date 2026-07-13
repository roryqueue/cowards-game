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
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  encodeRuntimeEvidenceAuthorityPayload,
  inspectRuntimeEvidenceAuthorityBundle,
} from "@cowards/spec"
import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { migrate } from "./migrations.js"
import {
  RUNTIME_EVIDENCE_AUTHORITY_IMPORT_SCHEMA_VERSION,
  encodeRuntimeEvidenceAuthorityImportPayload,
  importAuthenticatedCertificateRevocation,
  importAuthenticatedCertificateSupersession,
  importAuthenticatedRuntimeLaneControl,
  installRuntimeEvidenceAuthorityPublication,
  prepareRuntimeEvidenceAuthorityPublication,
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
})

const databaseUrl = process.env.DATABASE_URL
const describePostgres = databaseUrl ? describe : describe.skip

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

    const seedCertificate = async (
      id: string,
      recordHash: string,
      suffix: string,
    ): Promise<void> => {
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
        semanticTupleId: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
        semanticTuple: CANONICAL_COMPATIBILITY_TUPLES[0]!.tuple,
      }
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
        laneIdentityHash,
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
         'typescript','6',$6,$5,$7,$8,$5,'fixture:generation:1',
         '2026-07-12T00:00:00.000Z','2026-08-12T00:00:00.000Z')`,
        [
          id,
          rawHash,
          attestationId,
          trustRoot.producerId,
          rawHash,
          lane.artifactId,
          laneIdentityHash,
          lane,
        ],
      )
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
      await seedCertificate(
        certificateId,
        sha256("certificate:snapshot"),
        "snapshot",
      )
      const disablePayload = lanePayload({
        eventId: "fixture:lane-control:disable:snapshot",
      })
      await importAuthenticatedRuntimeLaneControl(pool, {
        envelope: envelope(disablePayload),
        verificationInstant,
        expectedLaneIdentityHash: laneIdentityHash,
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
        signPayload: (payloadBytes) =>
          sign(null, payloadBytes, keys.privateKey),
      })
      const inspected = inspectRuntimeEvidenceAuthorityBundle(
        prepared.envelopeBytes,
        {
          expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
          evaluationInstant: "2026-07-13T12:00:00.000Z",
          trustedKeyIds: [trustRoot.keyId],
          verifySignature: ({ payloadBytes, signature }) =>
            verify(null, payloadBytes, keys.publicKey, signature),
        },
      )
      expect(inspected.payload.registryGeneration).toBe(prepared.generation)
      expect(
        inspected.payload.certificates.some(
          (certificate) => certificate.certificateId === certificateId,
        ),
      ).toBe(true)
      expect(inspected.payload.operatorLaneDisables).toEqual([
        expect.objectContaining({ laneIdentityHash }),
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
          signPayload: () => {
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
          signPayload: (bytes) => sign(null, bytes, keys.privateKey),
        }),
        prepareRuntimeEvidenceAuthorityPublication(pool, {
          ...common,
          signPayload: (bytes) => sign(null, bytes, keys.privateKey),
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
        signPayload: (bytes) => sign(null, bytes, keys.privateKey),
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
  },
)
