import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { StrategyRevisionV117Schema } from "@cowards/spec"
import {
  buildPythonRequestSourceIdentityV117,
  buildPythonStrategyRevisionV117,
} from "./validation.js"

const sourceLf = `def select_activations(input):
    return {"activationOrders": [], "strategyMemory": input["strategyMemory"]}

def soldier_brain(input):
    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("Python Strategy Revision v1.17 producer", () => {
  it("keeps direct request hashes separate from domain-framed artifact identity", () => {
    const source = sourceLf.replace(/\n/gu, "\r\n")
    const revision = buildPythonStrategyRevisionV117({ source })
    const requestIdentity = buildPythonRequestSourceIdentityV117(source)
    const artifact = revision.metadata.sourceArtifact
    const normalized = source.replace(/\r\n?/gu, "\n")

    expect(requestIdentity).toEqual({
      originalSourceSha256: `sha256:${createHash("sha256")
        .update(source, "utf8")
        .digest("hex")}`,
      normalizedSourceSha256: `sha256:${createHash("sha256")
        .update(normalized, "utf8")
        .digest("hex")}`,
    })
    expect(artifact.sourceIdentity).toMatchObject({
      originalSourceBytes: Buffer.byteLength(source),
      normalizedSourceBytes: Buffer.byteLength(normalized),
      lineEndings: { kind: "crlf", lf: 0, cr: 0 },
    })
    expect(artifact.sourceIdentity?.originalSourceSha256).not.toBe(
      requestIdentity.originalSourceSha256,
    )
    expect(artifact.sourceIdentity?.normalizedSourceSha256).not.toBe(
      requestIdentity.normalizedSourceSha256,
    )
    expect(Buffer.from(artifact.bytesBase64!, "base64").toString("utf8")).toBe(
      normalized,
    )
    expect(revision.runtime.abiVersion).toBe("strategy-runtime-abi-v1.17")
    expect(revision.runtime.package.entrypoint).toBe("default")
    expect(artifact.abiVersion).toBe("strategy-runtime-abi-v1.17")
    expect(revision.metadata.providerValidation).toMatchObject({
      providerId: "strategy-language-provider-python",
      contractVersion: "runtime-provider-validation-v1.17",
      sourceHash: revision.sourceHash,
      sourceBytes: revision.sourceBytes,
      artifactHash: artifact.hash,
      artifactBytes: artifact.bytes,
      proof: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(StrategyRevisionV117Schema.safeParse(revision).success).toBe(true)
  })

  it("rejects legacy relabels and mixed v1.14/v1.17 authority", () => {
    const revision = buildPythonStrategyRevisionV117({ source: sourceLf })
    const candidates = [
      (() => {
        const value = clone(revision)
        value.metadata.providerValidation.contractVersion =
          "strategy-language-provider-contract-v1.33"
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.runtime.abiVersion = "strategy-runtime-abi-v1.14" as never
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.abiVersion =
          "strategy-runtime-abi-v1.14" as never
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.sourceIdentity!.originalSourceSha256 =
          buildPythonRequestSourceIdentityV117(
            value.source,
          ).originalSourceSha256
        return value
      })(),
    ]

    for (const candidate of candidates) {
      expect(StrategyRevisionV117Schema.safeParse(candidate).success).toBe(
        false,
      )
    }
  })
})
