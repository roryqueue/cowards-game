import { describe, expect, it } from "vitest"
import {
  SourceLanguageStrategyArtifactPublicSchema,
  SourceLanguageStrategyArtifactSchema,
} from "./schemas.js"

const artifact = {
  format: "python-source-bundle",
  hash: "a".repeat(64),
  bytes: 12,
  bytesBase64: "cHJpdmF0ZS1ieXRlcw==",
  sourceHash: "b".repeat(64),
  sourceBytes: 13,
  abiVersion: "strategy-runtime-abi-v1.14",
  validationStatus: "valid",
  sourceIdentity: {
    identityVersion: "strategy-source-identity-v2",
    normalizationPolicy: "source-line-endings-lf-v1.17",
    originalSourceSha256: `sha256:${"c".repeat(64)}`,
    originalSourceBytes: 13,
    normalizedSourceSha256: `sha256:${"d".repeat(64)}`,
    normalizedSourceBytes: 12,
    lineEndings: { kind: "crlf", lf: 0, crlf: 1, cr: 0 },
    hasFinalNewline: true,
  },
  createdAt: "deterministic-python-source-bundle-v1.33",
  toolchain: {
    language: "python",
    runtime: "python3",
    runtimeVersion: "3.13",
    commandSummary: "isolated",
    validationPolicy: "python-source-validation-v1.33",
  },
  publicEvidence: {
    label: "Python artifact",
    nonCounted: false,
    sandboxClaim: "provenance-only",
  },
} as const

describe("source-language artifact private source identity", () => {
  it("validates the immutable two-domain record and removes it publicly", () => {
    expect(SourceLanguageStrategyArtifactSchema.parse(artifact)).toMatchObject({
      sourceIdentity: artifact.sourceIdentity,
    })
    const publicArtifact =
      SourceLanguageStrategyArtifactPublicSchema.parse(artifact)
    expect(publicArtifact).not.toHaveProperty("bytesBase64")
    expect(publicArtifact).not.toHaveProperty("sourceIdentity")
  })

  it("rejects incomplete or negative line-ending facts", () => {
    expect(
      SourceLanguageStrategyArtifactSchema.safeParse({
        ...artifact,
        sourceIdentity: {
          ...artifact.sourceIdentity,
          lineEndings: { kind: "crlf", crlf: -1 },
        },
      }).success,
    ).toBe(false)
  })
})
