import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { StrategyRevisionV117Schema } from "@cowards/spec"
import { buildStrategyRevision } from "./revision.js"
import { buildStrategyRevisionV117 } from "./revision-v1-17.js"
import {
  buildTypeScriptRequestSourceIdentityV117,
  buildTypeScriptSourceIdentityV117,
} from "./source-artifact.js"

const sourceLines = [
  "export default {",
  "  selectActivations() {",
  "    return { activationOrders: [], strategyMemory: {} }",
  "  },",
  "  soldierBrain() {",
  '    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }',
  "  },",
  "}",
]

const lfSource = `${sourceLines.join("\n")}\n`
const crlfSourceWithoutFinalNewline = sourceLines.join("\r\n")
const mixedSourceWithFinalNewline = `${sourceLines
  .map((line, index) =>
    index === sourceLines.length - 1
      ? line
      : `${line}${index % 3 === 0 ? "\n" : index % 3 === 1 ? "\r\n" : "\r"}`,
  )
  .join("")}\r`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("TypeScript Strategy Revision v1.17 source identity", () => {
  it.each([
    ["LF with final newline", lfSource, "lf", true],
    [
      "CRLF without final newline",
      crlfSourceWithoutFinalNewline,
      "crlf",
      false,
    ],
    ["mixed with final newline", mixedSourceWithFinalNewline, "mixed", true],
  ] as const)(
    "records exact original and normalized v2 identity for %s",
    (_label, source, kind, hasFinalNewline) => {
      const revision = buildStrategyRevisionV117({ source })
      const identity = revision.metadata.sourceArtifact.sourceIdentity!
      const expected = buildTypeScriptSourceIdentityV117(source)
      const requestIdentity = buildTypeScriptRequestSourceIdentityV117(source)
      const normalized = source.replace(/\r\n?/gu, "\n")

      expect(identity).toEqual(expected)
      expect(identity).toMatchObject({
        identityVersion: "strategy-source-identity-v2",
        normalizationPolicy: "source-line-endings-lf-v1.17",
        originalSourceBytes: new TextEncoder().encode(source).byteLength,
        normalizedSourceBytes: new TextEncoder().encode(normalized).byteLength,
        lineEndings: { kind },
        hasFinalNewline,
      })
      expect(
        identity.lineEndings.lf +
          identity.lineEndings.crlf +
          identity.lineEndings.cr,
      ).toBe(sourceLines.length - 1 + (hasFinalNewline ? 1 : 0))
      expect(requestIdentity).toEqual({
        originalSourceSha256: `sha256:${createHash("sha256")
          .update(source, "utf8")
          .digest("hex")}`,
        normalizedSourceSha256: `sha256:${createHash("sha256")
          .update(normalized, "utf8")
          .digest("hex")}`,
      })
      expect(identity.originalSourceSha256).not.toBe(
        requestIdentity.originalSourceSha256,
      )
      expect(identity.normalizedSourceSha256).not.toBe(
        requestIdentity.normalizedSourceSha256,
      )
      expect(StrategyRevisionV117Schema.safeParse(revision).success).toBe(true)
    },
  )

  it("rejects missing, direct-hash, cross-domain, and line-ending relabels", () => {
    const revision = buildStrategyRevisionV117({
      source: crlfSourceWithoutFinalNewline,
    })
    const requestIdentity = buildTypeScriptRequestSourceIdentityV117(
      revision.source,
    )
    const candidates = [
      (() => {
        const value = clone(revision)
        delete value.metadata.sourceArtifact.sourceIdentity
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.sourceIdentity!.originalSourceSha256 =
          requestIdentity.originalSourceSha256
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.sourceIdentity!.originalSourceSha256 =
          value.metadata.sourceArtifact.sourceIdentity!.normalizedSourceSha256
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.sourceIdentity!.normalizedSourceSha256 =
          value.metadata.sourceArtifact.sourceIdentity!.originalSourceSha256
        return value
      })(),
      (() => {
        const value = clone(revision)
        value.metadata.sourceArtifact.sourceIdentity!.lineEndings = {
          kind: "lf",
          lf: sourceLines.length - 1,
          crlf: 0,
          cr: 0,
        }
        return value
      })(),
    ]

    for (const candidate of candidates) {
      expect(StrategyRevisionV117Schema.safeParse(candidate).success).toBe(
        false,
      )
    }
  })

  it("leaves the pre-v1.17 TypeScript artifact shape unchanged", () => {
    const legacy = buildStrategyRevision({ source: lfSource })

    expect(legacy.metadata.sourceArtifact?.sourceIdentity).toBeUndefined()
    expect(legacy.metadata.sourceArtifact?.abiVersion).not.toBe(
      "strategy-runtime-abi-v1.17",
    )
  })
})
