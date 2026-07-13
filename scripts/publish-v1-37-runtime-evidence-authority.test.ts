import { Buffer } from "node:buffer"
import {
  createHash,
  generateKeyPairSync,
  type KeyObject,
} from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthorityPayload,
  hashRuntimeEvidenceAuthorityPayload,
  type RuntimeEvidenceAuthorityPayload,
} from "../packages/spec/src/index.js"
import { describe, expect, it, vi } from "vitest"
import { runRuntimeEvidenceAuthorityPublisherCli } from "./publish-v1-37-runtime-evidence-authority.js"

const envelopeHash = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256")
    .update("cowards-game:runtime-evidence-authority-publication-envelope:v1")
    .update("\0")
    .update(bytes)
    .digest("hex")}`

const emptyPayload = (): RuntimeEvidenceAuthorityPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  bundleVersion: "v1.37-runtime-evidence-authority-v1",
  registryGeneration: "1",
  issuedAt: "2026-07-13T12:00:00.000Z",
  validFrom: "2026-07-13T12:00:00.000Z",
  validUntil: "2026-07-14T12:00:00.000Z",
  semanticTupleManifestHash: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
  attestations: [],
  certificates: [],
  revocations: [],
  supersessions: [],
  operatorLaneDisables: [],
})

const privateKeyPem = (key: KeyObject): string =>
  key.export({ type: "pkcs8", format: "pem" }).toString()
const publicKeyPem = (key: KeyObject): string =>
  key.export({ type: "spki", format: "pem" }).toString()

describe("v1.37 runtime evidence authority publisher CLI", () => {
  it("uses protected external key configuration and emits only a public-safe receipt", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "cowards-cli-authority-"),
    )
    const keys = generateKeyPairSync("ed25519")
    const privatePath = path.join(directory, "private.pem")
    const publicPath = path.join(directory, "public.pem")
    const targetPath = path.join(directory, "authority.json")
    await writeFile(privatePath, privateKeyPem(keys.privateKey), {
      mode: 0o600,
    })
    await writeFile(publicPath, publicKeyPem(keys.publicKey), { mode: 0o644 })
    const stdout: string[] = []
    const stderr: string[] = []
    const install = vi.fn(async () => ({
      publicationId: "runtime-evidence-authority:1:fixture",
      generation: "1",
      envelopeSha256: `sha256:${"b".repeat(64)}`,
      reconciled: false,
    }))
    try {
      const code = await runRuntimeEvidenceAuthorityPublisherCli({
        env: {
          DATABASE_URL:
            "postgresql://cowards:cowards@localhost:5432/cowards_game",
          COWARDS_RUNTIME_AUTHORITY_PRIVATE_KEY_PATH: privatePath,
          COWARDS_RUNTIME_AUTHORITY_PUBLIC_KEY_PATH: publicPath,
          COWARDS_RUNTIME_AUTHORITY_TARGET_PATH: targetPath,
          COWARDS_RUNTIME_AUTHORITY_SIGNER_KEY_ID: "operator-key:v1",
          COWARDS_RUNTIME_AUTHORITY_ISSUED_AT: "2026-07-13T12:00:00.000Z",
          COWARDS_RUNTIME_AUTHORITY_VALID_FROM: "2026-07-13T12:00:00.000Z",
          COWARDS_RUNTIME_AUTHORITY_VALID_UNTIL: "2026-07-14T12:00:00.000Z",
        },
        stdout: (line) => stdout.push(line),
        stderr: (line) => stderr.push(line),
        preparePublication: async (_pool, input) => {
          const payloadBytes =
            encodeRuntimeEvidenceAuthorityPayload(emptyPayload())
          const signature = await input.signPayload(payloadBytes)
          const envelope = buildRuntimeEvidenceAuthorityEnvelope({
            trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
            keyId: "operator-key:v1",
            payloadBytes,
            signature,
          })
          const envelopeBytes = Buffer.from(JSON.stringify(envelope), "utf8")
          return {
            publicationId: "runtime-evidence-authority:1:fixture",
            generation: "1",
            payloadSha256: hashRuntimeEvidenceAuthorityPayload(payloadBytes),
            envelopeSha256: envelopeHash(envelopeBytes),
            sourceManifestHash: `sha256:${"a".repeat(64)}`,
            envelopeBytes,
            sourceIds: {
              attestationIds: [],
              certificateIds: [],
              revocationIds: [],
              supersessionIds: [],
              laneControlIds: [],
            },
          }
        },
        installPublication: install,
      })
      expect(code).toBe(0)
      expect(install).toHaveBeenCalledOnce()
      expect(stderr).toEqual([])
      const output = stdout.join("\n")
      expect(output).toContain('"status":"installed"')
      expect(output).not.toContain(privatePath)
      expect(output).not.toContain(publicPath)
      expect(output).not.toContain(targetPath)
      expect(output).not.toContain(privateKeyPem(keys.privateKey))
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("fails safely on signer/public-key mismatch before install", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "cowards-cli-authority-"),
    )
    const keys = generateKeyPairSync("ed25519")
    const wrongKeys = generateKeyPairSync("ed25519")
    const privatePath = path.join(directory, "private.pem")
    const publicPath = path.join(directory, "public.pem")
    await writeFile(privatePath, privateKeyPem(keys.privateKey), {
      mode: 0o600,
    })
    await writeFile(publicPath, publicKeyPem(wrongKeys.publicKey), {
      mode: 0o644,
    })
    const install = vi.fn()
    const stderr: string[] = []
    try {
      const code = await runRuntimeEvidenceAuthorityPublisherCli({
        env: {
          DATABASE_URL:
            "postgresql://cowards:cowards@localhost:5432/cowards_game",
          COWARDS_RUNTIME_AUTHORITY_PRIVATE_KEY_PATH: privatePath,
          COWARDS_RUNTIME_AUTHORITY_PUBLIC_KEY_PATH: publicPath,
          COWARDS_RUNTIME_AUTHORITY_TARGET_PATH: path.join(
            directory,
            "authority.json",
          ),
          COWARDS_RUNTIME_AUTHORITY_SIGNER_KEY_ID: "operator-key:v1",
          COWARDS_RUNTIME_AUTHORITY_ISSUED_AT: "2026-07-13T12:00:00.000Z",
          COWARDS_RUNTIME_AUTHORITY_VALID_FROM: "2026-07-13T12:00:00.000Z",
          COWARDS_RUNTIME_AUTHORITY_VALID_UNTIL: "2026-07-14T12:00:00.000Z",
        },
        stdout: () => undefined,
        stderr: (line) => stderr.push(line),
        preparePublication: async (_pool, input) => {
          const payloadBytes =
            encodeRuntimeEvidenceAuthorityPayload(emptyPayload())
          const signature = await input.signPayload(payloadBytes)
          const envelope = buildRuntimeEvidenceAuthorityEnvelope({
            trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
            keyId: "operator-key:v1",
            payloadBytes,
            signature,
          })
          const envelopeBytes = Buffer.from(JSON.stringify(envelope), "utf8")
          return {
            publicationId: "runtime-evidence-authority:1:fixture",
            generation: "1",
            payloadSha256: hashRuntimeEvidenceAuthorityPayload(payloadBytes),
            envelopeSha256: envelopeHash(envelopeBytes),
            sourceManifestHash: `sha256:${"a".repeat(64)}`,
            envelopeBytes,
            sourceIds: {
              attestationIds: [],
              certificateIds: [],
              revocationIds: [],
              supersessionIds: [],
              laneControlIds: [],
            },
          }
        },
        installPublication: install,
      })
      expect(code).toBe(1)
      expect(install).not.toHaveBeenCalled()
      expect(stderr).toEqual([
        JSON.stringify({
          status: "failed",
          code: "AUTHORITY_PUBLICATION_FAILED",
        }),
      ])
      expect(stderr.join("\n")).not.toContain(privatePath)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
