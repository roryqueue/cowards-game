import { createHash, generateKeyPairSync } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  runRuntimeAuthorityImportTrustRootBootstrapCli,
  type RuntimeAuthorityImportTrustRootBootstrapCliDependencies,
} from "./bootstrap-v1-37-runtime-authority-import-trust-roots.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

const fixture = async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "cowards-import-root-bootstrap-"),
  )
  temporaryDirectories.push(directory)
  const keys = generateKeyPairSync("ed25519")
  const root = {
    producerId: "operator:fixture:v1",
    keyId: "operator:key:fixture:v1",
    trustDomain: "cowards-game:runtime-authority-import:fixture:v1",
    publicKeyPem: keys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  const encoded = encodeCanonicalJson([root] as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new Error("fixture encoding failed")
  const descriptorPath = path.join(directory, "roots.json")
  await writeFile(descriptorPath, encoded.bytes, { mode: 0o600 })
  const descriptorSha256 = `sha256:${createHash("sha256")
    .update(encoded.bytes)
    .digest("hex")}`
  return {
    directory,
    descriptorPath,
    descriptorSha256,
    root,
  }
}

describe("runtime authority import trust-root bootstrap CLI", () => {
  it("requires protected plural configuration and writes only a safe receipt", async () => {
    const prepared = await fixture()
    const receiptPath = path.join(prepared.directory, "receipt.json")
    const stdout = vi.fn()
    const bootstrap = vi.fn(async (_pool, input) => {
      const first = await input.readDescriptorBytes()
      const second = await input.readDescriptorBytes()
      expect(first).toEqual(second)
      return {
        status: "installed" as const,
        descriptorSha256: prepared.descriptorSha256,
        producerId: prepared.root.producerId,
        keyId: prepared.root.keyId,
        trustDomain: prepared.root.trustDomain,
        publicKeyFingerprint: `sha256:${"a".repeat(64)}`,
        generation: "1",
      }
    })
    const dependencies: RuntimeAuthorityImportTrustRootBootstrapCliDependencies =
      {
        env: {
          DATABASE_URL: "postgresql://unused",
          COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH:
            prepared.descriptorPath,
          COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_EXPECTED_SHA256:
            prepared.descriptorSha256,
          COWARDS_RUNTIME_AUTHORITY_IMPORT_PRODUCER_ID: prepared.root.producerId,
          COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID: prepared.root.keyId,
          COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_DOMAIN:
            prepared.root.trustDomain,
        },
        pool: {} as never,
        bootstrap,
        stdout,
      }
    await expect(
      runRuntimeAuthorityImportTrustRootBootstrapCli(
        [`--write-safe-receipt=${receiptPath}`, "--check"],
        dependencies,
      ),
    ).resolves.toBe(0)
    expect(bootstrap).toHaveBeenCalledTimes(1)
    const written = JSON.parse(await readFile(receiptPath, "utf8"))
    expect(written).toMatchObject({
      schemaVersion:
        "v1.37-runtime-authority-import-trust-roots-bootstrap-receipt-v1",
      status: "installed",
      descriptorSha256: prepared.descriptorSha256,
      generation: "1",
    })
    expect(JSON.stringify(written)).not.toMatch(
      /private|path|source|runtimeProducer|diagnostic|host/iu,
    )
    expect(stdout).toHaveBeenCalledWith(JSON.stringify(written))
  })

  it("fails closed for missing pins and unsafe descriptor permissions", async () => {
    const prepared = await fixture()
    const stderr = vi.fn()
    const bootstrap = vi.fn()
    const base = {
      DATABASE_URL: "postgresql://unused",
      COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_PATH:
        prepared.descriptorPath,
      COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_ROOTS_EXPECTED_SHA256:
        prepared.descriptorSha256,
      COWARDS_RUNTIME_AUTHORITY_IMPORT_PRODUCER_ID: prepared.root.producerId,
      COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID: prepared.root.keyId,
      COWARDS_RUNTIME_AUTHORITY_IMPORT_TRUST_DOMAIN: prepared.root.trustDomain,
    }
    await expect(
      runRuntimeAuthorityImportTrustRootBootstrapCli(["--check"], {
        env: { ...base, COWARDS_RUNTIME_AUTHORITY_IMPORT_KEY_ID: undefined },
        pool: {} as never,
        bootstrap,
        stderr,
      }),
    ).resolves.toBe(1)
    await chmod(prepared.descriptorPath, 0o622)
    await expect(
      runRuntimeAuthorityImportTrustRootBootstrapCli(["--check"], {
        env: base,
        pool: {} as never,
        bootstrap,
        stderr,
      }),
    ).resolves.toBe(1)
    expect(bootstrap).not.toHaveBeenCalled()
    expect(stderr).toHaveBeenLastCalledWith(
      JSON.stringify({
        status: "failed",
        code: "IMPORT_TRUST_ROOT_BOOTSTRAP_FAILED",
      }),
    )
  })
})
