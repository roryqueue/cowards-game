import { generateKeyPairSync } from "node:crypto"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import type { Pool } from "pg"
import { runObservationV119CertificateSignerCli } from "./sign-import-v1-37-observation-v1-19-certificates.js"

describe("v1.37 observation v1.19 managed certificate signer/importer", () => {
  it("fails with one safe code and no private configuration", async () => {
    const stdout = vi.fn()
    const stderr = vi.fn()
    expect(
      await runObservationV119CertificateSignerCli(["--write"], {
        stdout,
        stderr,
      }),
    ).toBe(1)
    expect(stdout).not.toHaveBeenCalled()
    expect(stderr).toHaveBeenCalledWith(
      JSON.stringify({
        status: "failed",
        reasonCode: "OBSERVATION_V1_19_SIGN_IMPORT_FAILED",
      }),
    )
    expect(JSON.stringify(stderr.mock.calls)).not.toMatch(
      /private|secret|postgres|path|diagnostic|host/iu,
    )
  })

  it("signs and imports four exact candidates under distinct managed roots", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "observation-v119-signer-"))
    const producer = generateKeyPairSync("ed25519")
    const operator = generateKeyPairSync("ed25519")
    const receiptPath = path.join(root, "receipts.json")
    const importCertificate = vi.fn(async (_pool, input) => ({
      status: "installed_inactive" as const,
      certificateId: input.certificate.candidatePayload.certificateId,
      certificateSha256: `sha256:${"1".repeat(64)}`,
      candidatePayloadSha256: input.certificate.candidatePayloadSha256,
      languageId: input.certificate.candidatePayload.identity.languageId,
      registryGeneration: "candidate-0",
      importEnvelopeHash: "1".repeat(64),
    }))
    try {
      expect(
        await runObservationV119CertificateSignerCli(["--write"], {
          workspaceRoot: path.resolve(import.meta.dirname, ".."),
          receiptPath,
          pool: {} as Pool,
          producerPrivateKey: producer.privateKey,
          importPrivateKey: operator.privateKey,
          trustedImportAuthorities: [
            {
              producerId: "fixture:observation-v1.19-operator",
              keyId: "fixture:observation-v1.19-operator-key",
              trustDomain: "fixture:observation-v1.19-import",
              publicKeyPem: operator.publicKey
                .export({ type: "spki", format: "pem" })
                .toString(),
            },
          ],
          importCertificate,
          stdout: vi.fn(),
          stderr: vi.fn(),
        }),
      ).toBe(0)
      expect(importCertificate).toHaveBeenCalledTimes(4)
      for (const [, input] of importCertificate.mock.calls) {
        expect(input.certificate.trustDomain).toBe("fixture")
        expect(input.certificate.managedIdentity).toBe(true)
        expect(input.certificate.candidatePayload.status).toBe(
          "inactive-candidate",
        )
        expect(input.importEnvelope.payload.producerId).not.toBe(
          input.certificate.candidatePayload.producerId,
        )
        expect(input.importEnvelope.payload.targetCertificateId).toBe(
          input.certificate.candidatePayload.certificateId,
        )
      }

      const manifest = JSON.parse(await readFile(receiptPath, "utf8")) as {
        schemaVersion: string
        receipts: Array<Record<string, unknown>>
      }
      expect(manifest.schemaVersion).toBe(
        "v1.37-observation-v1.19-language-conformance-import-receipts-v1",
      )
      expect(manifest.receipts.map(({ languageId }) => languageId)).toEqual([
        "typescript",
        "python",
        "rust",
        "zig",
      ])
      for (const receipt of manifest.receipts) {
        expect(Object.keys(receipt).sort()).toEqual([
          "candidateAuthority",
          "candidatePayloadSha256",
          "certificateId",
          "certificateSha256",
          "languageId",
          "laneId",
          "ledgerIdentity",
          "runRoots",
          "status",
        ])
        expect(receipt.status).toBe("installed_inactive")
      }
      expect(JSON.stringify(manifest)).not.toMatch(
        /signature|private|source|artifact(?:s)?[":]|memory|objective|diagnostic|host|path|keyMaterial|credential/iu,
      )
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
