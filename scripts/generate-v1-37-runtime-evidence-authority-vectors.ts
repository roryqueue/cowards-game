#!/usr/bin/env -S pnpm exec tsx
import { createPrivateKey, createPublicKey, sign } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthorityPayload,
  type RuntimeEvidenceAuthorityPayload,
} from "../packages/spec/src/index.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
export const runtimeEvidenceAuthorityVectorsPath =
  "packages/spec/artifacts/v1.37-runtime-evidence-authority-vectors.json" as const

const fixturePrivateKeyPkcs8Base64 =
  "MC4CAQAwBQYDK2VwBCIEIKsQBufiauOYnlm3Qhiye+3HmBbJ1JzFGuiG0ZKkjez8"
const fixturePrivateKey = createPrivateKey({
  key: Buffer.from(fixturePrivateKeyPkcs8Base64, "base64"),
  format: "der",
  type: "pkcs8",
})
const fixturePublicKeySpkiBase64 = createPublicKey(fixturePrivateKey)
  .export({ format: "der", type: "spki" })
  .toString("base64")

const payload = (
  registryGeneration: string,
): RuntimeEvidenceAuthorityPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  bundleVersion: "v1.37-empty-authority-v1",
  registryGeneration,
  issuedAt: "2026-07-12T00:00:00.000Z",
  validFrom: "2026-07-12T00:00:00.000Z",
  validUntil: "2026-08-12T00:00:00.000Z",
  semanticTupleManifestHash: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
  attestations: [],
  certificates: [],
  revocations: [],
  supersessions: [],
  operatorLaneDisables: [],
})

const envelope = (trustDomain: string, registryGeneration = "7") => {
  const payloadBytes = encodeRuntimeEvidenceAuthorityPayload(
    payload(registryGeneration),
  )
  return buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId: "fixture-only-ed25519-key-v1",
    payloadBytes,
    signature: sign(null, payloadBytes, fixturePrivateKey),
  })
}

const mutate = <T extends object>(value: T, changes: Partial<T>): T => ({
  ...value,
  ...changes,
})

export const buildV137RuntimeEvidenceAuthorityVectors = () => {
  const fixtureEnvelope = envelope(
    RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
  )
  const productionEnvelope = envelope(
    RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
  )
  const badSignature = `${fixtureEnvelope.signatureBase64[0] === "A" ? "B" : "A"}${fixtureEnvelope.signatureBase64.slice(1)}`
  const hash7 = productionEnvelope.payloadSha256
  const hash8 = envelope(
    RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
    "8",
  ).payloadSha256

  return {
    schemaVersion: "v1.37-runtime-evidence-authority-vectors-v1",
    generatedBy: "scripts/generate-v1-37-runtime-evidence-authority-vectors.ts",
    nonProduction: true,
    notice:
      "The committed Ed25519 key is fixture-only and is rejected by every production trust store.",
    fixtureKey: {
      keyId: "fixture-only-ed25519-key-v1",
      algorithm: "Ed25519",
      trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      publicKeySpkiBase64: fixturePublicKeySpkiBase64,
      privateKeyClassification: "committed-non-production-test-fixture",
    },
    valid: {
      emptyProduction: {
        envelope: productionEnvelope,
        expected: {
          structural: "accept",
          fixtureKeyAsProductionTrust: "reject-unknown-key",
          grantsProductionConformance: false,
        },
      },
      fixtureDomain: {
        envelope: fixtureEnvelope,
        evaluationInstant: "2026-07-13T00:00:00.000Z",
        expected: { node: "accept", go: "accept", production: "reject" },
      },
    },
    invalidEnvelopeVectors: [
      {
        name: "bad-signature",
        envelope: mutate(fixtureEnvelope, { signatureBase64: badSignature }),
        expected: { node: "reject-signature", go: "reject-signature" },
      },
      {
        name: "bad-payload-hash",
        envelope: mutate(fixtureEnvelope, {
          payloadSha256: `sha256:${"f".repeat(64)}`,
        }),
        expected: { node: "reject-hash", go: "reject-hash" },
      },
      {
        name: "unknown-key",
        envelope: mutate(fixtureEnvelope, { keyId: "unknown-key" }),
        expected: { node: "reject-key", go: "reject-key" },
      },
      {
        name: "stale",
        envelope: fixtureEnvelope,
        evaluationInstant: "2026-08-13T00:00:00.000Z",
        expected: { node: "reject-validity", go: "reject-validity" },
      },
      {
        name: "future",
        envelope: fixtureEnvelope,
        evaluationInstant: "2026-07-11T00:00:00.000Z",
        expected: { node: "reject-validity", go: "reject-validity" },
      },
    ],
    graphAndReferenceVectors: [
      "revoked-certificate",
      "dangling-attestation-import",
      "unverified-import",
      "duplicate-id",
      "unknown-request-certificate-reference",
      "operator-kill-switch",
    ].map((name) => ({
      name,
      expected: { node: "reject", go: "reject" },
    })),
    antiRollbackVectors: [
      {
        name: "exact-bootstrap",
        bootstrap: true,
        pin: { generation: "7", hash: hash7 },
        candidate: { generation: "7", hash: hash7 },
        expected: "require-durable-install",
      },
      {
        name: "restart-rollback",
        bootstrap: false,
        highWater: { generation: "8", hash: hash8 },
        candidate: { generation: "7", hash: hash7 },
        expected: "reject-rollback",
      },
      {
        name: "same-generation-fork",
        bootstrap: false,
        highWater: { generation: "7", hash: hash7 },
        candidate: { generation: "7", hash: `sha256:${"a".repeat(64)}` },
        expected: "reject-fork",
      },
      {
        name: "corrupt-anchor",
        anchorBytesBase64: Buffer.from("{broken", "utf8").toString("base64"),
        expected: "reject-anchor",
      },
      {
        name: "newer-generation",
        highWater: { generation: "7", hash: hash7 },
        candidate: { generation: "8", hash: hash8 },
        expected: "require-durable-install-before-executable",
      },
    ],
    replacementVectors: [
      {
        name: "complete-atomic-replacement",
        observed: ["old-complete-envelope", "new-complete-envelope"],
        expected: "accept-only-complete-files",
      },
      {
        name: "half-written-temporary-file",
        observed: ["old-complete-envelope"],
        expected: "old-remains-authoritative",
      },
    ],
  }
}

export const renderV137RuntimeEvidenceAuthorityVectors = (): string =>
  `${JSON.stringify(buildV137RuntimeEvidenceAuthorityVectors(), null, 2)}\n`

export const writeV137RuntimeEvidenceAuthorityVectors = (): void => {
  const absolute = path.join(repoRoot, runtimeEvidenceAuthorityVectorsPath)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, renderV137RuntimeEvidenceAuthorityVectors(), "utf8")
}

export const checkV137RuntimeEvidenceAuthorityVectors =
  (): readonly string[] => {
    const absolute = path.join(repoRoot, runtimeEvidenceAuthorityVectorsPath)
    try {
      return readFileSync(absolute, "utf8") ===
        renderV137RuntimeEvidenceAuthorityVectors()
        ? []
        : [runtimeEvidenceAuthorityVectorsPath]
    } catch {
      return [runtimeEvidenceAuthorityVectorsPath]
    }
  }

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV137RuntimeEvidenceAuthorityVectors()
    console.log("v1.37 runtime evidence authority vectors written")
    return
  }
  if (args.has("--check")) {
    const stale = checkV137RuntimeEvidenceAuthorityVectors()
    if (stale.length > 0) {
      console.error(
        `v1.37 runtime evidence authority vectors are stale: ${stale.join(", ")}`,
      )
      process.exitCode = 1
      return
    }
    console.log("v1.37 runtime evidence authority vectors are current")
    return
  }
  console.error(
    "Usage: generate-v1-37-runtime-evidence-authority-vectors.ts --write | --check",
  )
  process.exitCode = 1
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
