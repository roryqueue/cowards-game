import { readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { runLanguageConformanceSignerCli } from "./sign-v1-37-language-conformance-certificate.js"

const args = [
  "--all-reviewed-lanes",
  "--require-bootstrap=.planning/artifacts/v1.37-runtime-authority-import-trust-roots-bootstrap.json",
  "--write-safe-receipts=.planning/artifacts/v1.37-language-conformance-import-receipts.json",
  "--check",
] as const

const requiredEnv = (): Record<string, string> => ({
  DATABASE_URL: "postgresql://not-used",
  COWARDS_RUNTIME_CONFORMANCE_PRODUCER_ID:
    "cowards-runtime-conformance-producer-v1.37",
  COWARDS_RUNTIME_CONFORMANCE_PRODUCER_KEY_ID:
    "cowards-runtime-conformance-key-v1.37",
  COWARDS_RUNTIME_CONFORMANCE_PRODUCER_PRIVATE_KEY_PATH:
    "/private/producer-key-do-not-render",
  COWARDS_RUNTIME_AUTHORITY_IMPORT_SIGNER_PRIVATE_KEY_PATH:
    "/private/import-key-do-not-render",
  COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH:
    "/private/import-roots-do-not-render",
  COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_EXPECTED_SHA256:
    `sha256:${"1".repeat(64)}`,
  COWARDS_RUNTIME_AUTHORITY_IMPORT_PRODUCER_ID:
    "cowards-game:operator-import:v1.37",
  COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID:
    "cowards-game:operator-import-key:v1.37",
  COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_DOMAIN:
    "cowards-game:runtime-authority-import:production:v1",
})

describe("v1.37 reviewed language conformance signer", () => {
  it("fails closed with one stable safe error and no protected value", async () => {
    const stdout = vi.fn()
    const stderr = vi.fn()
    expect(
      await runLanguageConformanceSignerCli(args, {
        env: {
          COWARDS_RUNTIME_CONFORMANCE_PRODUCER_PRIVATE_KEY_PATH:
            "/private/poison-secret-key-path",
        },
        stdout,
        stderr,
      }),
    ).toBe(1)
    expect(stdout).not.toHaveBeenCalled()
    expect(stderr).toHaveBeenCalledWith(
      JSON.stringify({
        status: "failed",
        reasonCode: "CONFORMANCE_SIGN_VERIFY_IMPORT_FAILED",
      }),
    )
    expect(JSON.stringify(stderr.mock.calls)).not.toMatch(
      /poison|secret|private\/|postgres/iu,
    )
  })

  it("rejects singular roots and producer/import key substitution before import", async () => {
    for (const env of [
      {
        ...requiredEnv(),
        COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOT_PATH: "/singular/root",
      },
      {
        ...requiredEnv(),
        COWARDS_RUNTIME_AUTHORITY_IMPORT_SIGNER_PRIVATE_KEY_PATH:
          "/private/producer-key-do-not-render",
      },
    ]) {
      const importCertificate = vi.fn()
      expect(
        await runLanguageConformanceSignerCli(args, {
          env,
          importCertificate,
          stdout: vi.fn(),
          stderr: vi.fn(),
        }),
      ).toBe(1)
      expect(importCertificate).not.toHaveBeenCalled()
    }
  })

  it("persists exactly four public-safe installed receipts", async () => {
    const manifest = JSON.parse(
      await readFile(
        path.resolve(
          ".planning/artifacts/v1.37-language-conformance-import-receipts.json",
        ),
        "utf8",
      ),
    ) as {
      schemaVersion: string
      receipts: Array<Record<string, unknown>>
    }
    expect(manifest.schemaVersion).toBe(
      "v1.37-language-conformance-import-receipts-v1",
    )
    expect(manifest.receipts.map((receipt) => receipt.languageId)).toEqual([
      "typescript",
      "python",
      "rust",
      "zig",
    ])
    for (const receipt of manifest.receipts) {
      expect(Object.keys(receipt).sort()).toEqual([
        "authorityGeneration",
        "candidatePayloadSha256",
        "certificateId",
        "certificateSha256",
        "laneId",
        "languageId",
        "reasonCode",
        "status",
      ])
      expect(receipt).toMatchObject({
        authorityGeneration: "2",
        status: "installed",
        reasonCode: "SIGNED_VERIFIED_IMPORTED",
      })
    }
    expect(JSON.stringify(manifest)).not.toMatch(
      /signature|private|source|artifact(?:s)?[":]|memory|objective|diagnostic|host|path/iu,
    )
  })
})
