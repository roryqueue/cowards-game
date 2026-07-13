import { generateKeyPairSync, sign } from "node:crypto"
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthorityPayload,
  hashRuntimeEvidenceAuthorityPayload,
  type RuntimeEvidenceAuthorityPayload,
} from "@cowards/spec"
import {
  RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
  RuntimeEvidenceAuthorityLoadError,
  createNodeRuntimeEvidenceAuthorityFileSystem,
  createRuntimeEvidenceAuthorityLoader,
  runtimeEvidenceAuthorityConfigFromEnvironment,
  type RuntimeEvidenceAuthorityFileSystem,
} from "./runtime-evidence-authority.js"

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

const hash = (digit: string): string => `sha256:${digit.repeat(64)}`

const payloadFor = (
  generation: string,
  overrides: Partial<RuntimeEvidenceAuthorityPayload> = {},
): RuntimeEvidenceAuthorityPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  bundleVersion: "v1.37-runtime-service-fixture-v1",
  registryGeneration: generation,
  issuedAt: "2026-07-12T00:00:00.000Z",
  validFrom: "2026-07-12T00:00:00.000Z",
  validUntil: "2026-07-14T00:00:00.000Z",
  semanticTupleManifestHash: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
  attestations: [],
  certificates: [],
  revocations: [],
  supersessions: [],
  operatorLaneDisables: [],
  ...overrides,
})

const createFixture = (input: {
  generation?: string
  trustDomain?: string
  payload?: RuntimeEvidenceAuthorityPayload
  bootstrap?: boolean
  withAnchor?: boolean
}) => {
  const root = mkdtempSync(join(tmpdir(), "cowards-runtime-authority-"))
  roots.push(root)
  const bundlePath = join(root, "authority.json")
  const publicKeyPath = join(root, "authority-public-key.json")
  const highWaterPath = join(root, "authority-high-water.json")
  const keys = generateKeyPairSync("ed25519")
  const keyId = "fixture-runtime-authority-ed25519-v1"
  const payload =
    input.payload ?? payloadFor(input.generation ?? "7")
  const payloadBytes = encodeRuntimeEvidenceAuthorityPayload(payload)
  const payloadSha256 = hashRuntimeEvidenceAuthorityPayload(payloadBytes)
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain:
      input.trustDomain ?? RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    keyId,
    payloadBytes,
    signature: sign(null, payloadBytes, keys.privateKey),
  })
  writeFileSync(bundlePath, `${JSON.stringify(envelope)}\n`, { mode: 0o600 })
  writeFileSync(
    publicKeyPath,
    `${JSON.stringify({
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
      keyId,
      algorithm: "Ed25519",
      publicKeyPem: keys.publicKey.export({ type: "spki", format: "pem" }),
    })}\n`,
    { mode: 0o600 },
  )
  if (input.withAnchor !== false) {
    writeFileSync(
      highWaterPath,
      `${JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
        registryGeneration: payload.registryGeneration,
        payloadSha256,
      })}\n`,
      { mode: 0o600 },
    )
  }
  const config = {
    bundlePath,
    publicKeyPath,
    highWaterPath,
    minimumRegistryGeneration: payload.registryGeneration,
    minimumBundleHash: payloadSha256,
    bootstrap: input.bootstrap ?? false,
    expectedTrustDomain:
      input.trustDomain ?? RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    evaluationInstant: () => "2026-07-13T00:00:00.000Z",
  } as const
  return {
    root,
    bundlePath,
    publicKeyPath,
    highWaterPath,
    keys,
    keyId,
    payload,
    payloadBytes,
    payloadSha256,
    envelope,
    config,
  }
}

const expectLoadCode = (run: () => unknown, code: string): void => {
  try {
    run()
    throw new Error(`Expected ${code}.`)
  } catch (error) {
    expect(error).toBeInstanceOf(RuntimeEvidenceAuthorityLoadError)
    expect((error as RuntimeEvidenceAuthorityLoadError).code).toBe(code)
    expect((error as Error).message).not.toContain("/Users/")
  }
}

describe("mounted runtime evidence authority", () => {
  it("independently verifies one bounded descriptor read, Ed25519 key, exact bytes, graph, and freshness", () => {
    const fixture = createFixture({})
    const operations: string[] = []
    const nodeFs = createNodeRuntimeEvidenceAuthorityFileSystem()
    const fileSystem: RuntimeEvidenceAuthorityFileSystem = {
      ...nodeFs,
      openFile(path, flags, mode) {
        operations.push(`open:${path}`)
        return nodeFs.openFile(path, flags, mode)
      },
      readFileDescriptor(descriptor) {
        operations.push(`read:${descriptor}`)
        return nodeFs.readFileDescriptor(descriptor)
      },
      closeFileDescriptor(descriptor) {
        operations.push(`close:${descriptor}`)
        nodeFs.closeFileDescriptor(descriptor)
      },
    }
    const authority = createRuntimeEvidenceAuthorityLoader({
      ...fixture.config,
      fileSystem,
    }).load()

    expect(authority).toMatchObject({
      authorityBundleHash: fixture.payloadSha256,
      registryGeneration: "7",
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      keyId: fixture.keyId,
      semanticTupleManifestHash:
        CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
    })
    expect(Object.isFrozen(authority)).toBe(true)
    expect(Object.isFrozen(authority.payload)).toBe(true)
    expect(
      operations.filter((entry) => entry === `open:${fixture.bundlePath}`),
    ).toHaveLength(1)
    expect(operations.filter((entry) => entry.startsWith("read:"))).toHaveLength(
      3,
    )
    expect(operations.filter((entry) => entry.startsWith("close:"))).toHaveLength(
      3,
    )
  })

  it("fails closed for missing, oversized, malformed, wrong-key, wrong-signature, stale, and open-graph authority", () => {
    const missing = createFixture({})
    rmSync(missing.bundlePath)
    expectLoadCode(
      () => createRuntimeEvidenceAuthorityLoader(missing.config).load(),
      "AUTHORITY_IO",
    )

    const oversized = createFixture({})
    writeFileSync(oversized.bundlePath, "x".repeat(1_500_001))
    expectLoadCode(
      () => createRuntimeEvidenceAuthorityLoader(oversized.config).load(),
      "ENVELOPE_LIMIT",
    )

    const malformed = createFixture({})
    writeFileSync(malformed.bundlePath, "{broken")
    expectLoadCode(
      () => createRuntimeEvidenceAuthorityLoader(malformed.config).load(),
      "ENVELOPE_JSON",
    )

    const wrongKey = createFixture({})
    const otherKeys = generateKeyPairSync("ed25519")
    writeFileSync(
      wrongKey.publicKeyPath,
      JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PUBLIC_KEY_SCHEMA_VERSION,
        keyId: wrongKey.keyId,
        algorithm: "Ed25519",
        publicKeyPem: otherKeys.publicKey.export({
          type: "spki",
          format: "pem",
        }),
      }),
    )
    expectLoadCode(
      () => createRuntimeEvidenceAuthorityLoader(wrongKey.config).load(),
      "SIGNATURE",
    )

    const wrongKeyId = createFixture({})
    const descriptor = JSON.parse(
      readFileSync(wrongKeyId.publicKeyPath, "utf8"),
    ) as Record<string, unknown>
    descriptor.keyId = "different-key-id"
    writeFileSync(wrongKeyId.publicKeyPath, JSON.stringify(descriptor))
    expectLoadCode(
      () => createRuntimeEvidenceAuthorityLoader(wrongKeyId.config).load(),
      "UNKNOWN_KEY",
    )

    const stale = createFixture({})
    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...stale.config,
          evaluationInstant: () => "2026-07-15T00:00:00.000Z",
        }).load(),
      "VALIDITY",
    )

    expect(() =>
      createFixture({
        payload: payloadFor("7", {
          attestations: [
            {
              attestationId: "attestation:dangling",
              attestationHash: hash("a"),
              verified: true,
              imports: ["attestation:missing"],
            },
          ],
        }),
      }),
    ).toThrow(/dangling/i)
  })

  it("rejects fixture trust in production and requires every configured path and pin", () => {
    const fixture = createFixture({})
    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...fixture.config,
          expectedTrustDomain:
            RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        }).load(),
      "TRUST_DOMAIN",
    )
    expect(() =>
      runtimeEvidenceAuthorityConfigFromEnvironment({
        COWARDS_RUNTIME_EVIDENCE_AUTHORITY_BUNDLE_PATH: fixture.bundlePath,
      }),
    ).toThrow(RuntimeEvidenceAuthorityLoadError)
  })

  it("bootstraps only the exact deployment pin through temp-write, fsync, rename, and directory fsync", () => {
    const fixture = createFixture({ bootstrap: true, withAnchor: false })
    const operations: string[] = []
    const nodeFs = createNodeRuntimeEvidenceAuthorityFileSystem()
    const fileSystem: RuntimeEvidenceAuthorityFileSystem = {
      ...nodeFs,
      writeFileDescriptor(descriptor, bytes) {
        operations.push("write")
        nodeFs.writeFileDescriptor(descriptor, bytes)
      },
      syncFileDescriptor(descriptor) {
        operations.push("fsync-file")
        nodeFs.syncFileDescriptor(descriptor)
      },
      renameFile(from, to) {
        operations.push("rename")
        nodeFs.renameFile(from, to)
      },
      syncDirectory(descriptor) {
        operations.push("fsync-directory")
        nodeFs.syncDirectory(descriptor)
      },
    }
    const loaded = createRuntimeEvidenceAuthorityLoader({
      ...fixture.config,
      fileSystem,
    }).load()

    expect(loaded.registryGeneration).toBe("7")
    expect(operations).toEqual([
      "write",
      "fsync-file",
      "rename",
      "fsync-directory",
    ])
    expect(JSON.parse(readFileSync(fixture.highWaterPath, "utf8"))).toEqual({
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
      registryGeneration: "7",
      payloadSha256: fixture.payloadSha256,
    })

    rmSync(fixture.highWaterPath)
    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...fixture.config,
          bootstrap: false,
        }).load(),
      "HIGH_WATER_MISSING",
    )
  })

  it("durably advances newer generations and rejects rollback, fork, corrupt, and unwritable anchors across restart", () => {
    const fixture = createFixture({})
    const generation8 = payloadFor("8")
    const generation8Bytes = encodeRuntimeEvidenceAuthorityPayload(generation8)
    const generation8Hash = hashRuntimeEvidenceAuthorityPayload(generation8Bytes)
    const envelope8 = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      keyId: fixture.keyId,
      payloadBytes: generation8Bytes,
      signature: sign(null, generation8Bytes, fixture.keys.privateKey),
    })
    writeFileSync(fixture.bundlePath, JSON.stringify(envelope8))
    const loader = createRuntimeEvidenceAuthorityLoader({
      ...fixture.config,
      minimumRegistryGeneration: "7",
      minimumBundleHash: fixture.payloadSha256,
    })
    expect(loader.load().registryGeneration).toBe("8")
    expect(
      createRuntimeEvidenceAuthorityLoader({
        ...fixture.config,
        minimumRegistryGeneration: "7",
        minimumBundleHash: fixture.payloadSha256,
      }).load().authorityBundleHash,
    ).toBe(generation8Hash)

    writeFileSync(fixture.bundlePath, JSON.stringify(fixture.envelope))
    expectLoadCode(() => loader.load(), "ROLLBACK")

    writeFileSync(
      fixture.highWaterPath,
      JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
        registryGeneration: "8",
        payloadSha256: hash("f"),
      }),
    )
    writeFileSync(fixture.bundlePath, JSON.stringify(envelope8))
    expectLoadCode(() => loader.load(), "GENERATION_FORK")

    writeFileSync(fixture.highWaterPath, "{corrupt")
    expectLoadCode(() => loader.load(), "HIGH_WATER")

    writeFileSync(
      fixture.highWaterPath,
      JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
        registryGeneration: "7",
        payloadSha256: fixture.payloadSha256,
      }),
    )
    const before = readFileSync(fixture.highWaterPath, "utf8")
    const nodeFs = createNodeRuntimeEvidenceAuthorityFileSystem()
    expectLoadCode(
      () =>
        createRuntimeEvidenceAuthorityLoader({
          ...fixture.config,
          minimumRegistryGeneration: "7",
          minimumBundleHash: fixture.payloadSha256,
          fileSystem: {
            ...nodeFs,
            renameFile() {
              throw new Error("private host path must not escape")
            },
          },
        }).load(),
      "ANCHOR_IO",
    )
    expect(readFileSync(fixture.highWaterPath, "utf8")).toBe(before)
  })
})
