import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import * as ts from "typescript"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION_V1_17,
  hashCanonicalIdentity,
  type SourceLanguageStrategyArtifact,
  type SourceLanguageStrategyArtifactV117,
  type StrategyRevisionValidationReport,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"
import { transpileStrategySource } from "./transpile.js"

const hashBytes = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const utf8Bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const prefixedByteSha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${hashBytes(bytes)}`

export const TYPESCRIPT_SOURCE_NORMALIZATION_POLICY_V1_17 =
  "source-line-endings-lf-v1.17" as const

const normalizeTypeScriptSourceV117 = (source: string): string =>
  source.replace(/\r\n?/gu, "\n")

const lineEndingsFor = (source: string) => {
  let lf = 0
  let crlf = 0
  let cr = 0
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r") {
      if (source[index + 1] === "\n") {
        crlf += 1
        index += 1
      } else cr += 1
    } else if (source[index] === "\n") lf += 1
  }
  const present = [lf > 0, crlf > 0, cr > 0].filter(Boolean).length
  const kind: "none" | "lf" | "crlf" | "cr" | "mixed" =
    present === 0
      ? "none"
      : present > 1
        ? "mixed"
        : lf > 0
          ? "lf"
          : crlf > 0
            ? "crlf"
            : "cr"
  return { kind, lf, crlf, cr }
}

/** Domain-framed identity persisted with the private v1.17 source artifact. */
export const buildTypeScriptSourceIdentityV117 = (source: string) => {
  const normalizedSource = normalizeTypeScriptSourceV117(source)
  const originalBytes = utf8Bytes(source)
  const normalizedBytes = utf8Bytes(normalizedSource)
  return Object.freeze({
    identityVersion: "strategy-source-identity-v2" as const,
    normalizationPolicy: TYPESCRIPT_SOURCE_NORMALIZATION_POLICY_V1_17,
    originalSourceSha256: `sha256:${hashCanonicalIdentity("originalSource", [
      originalBytes,
    ])}`,
    originalSourceBytes: originalBytes.byteLength,
    normalizedSourceSha256: `sha256:${hashCanonicalIdentity(
      "normalizedSource",
      [normalizedBytes],
    )}`,
    normalizedSourceBytes: normalizedBytes.byteLength,
    lineEndings: Object.freeze(lineEndingsFor(source)),
    hasFinalNewline: source.endsWith("\n") || source.endsWith("\r"),
  })
}

/** Direct byte hashes carried by the language-neutral invocation envelope. */
export const buildTypeScriptRequestSourceIdentityV117 = (source: string) =>
  Object.freeze({
    originalSourceSha256: prefixedByteSha256(utf8Bytes(source)),
    normalizedSourceSha256: prefixedByteSha256(
      utf8Bytes(normalizeTypeScriptSourceV117(source)),
    ),
  })

export const buildTypeScriptSourceArtifact = (input: {
  source: string
  validation: StrategyRevisionValidationReport
  runtime: StrategyRuntimeMetadata
}): SourceLanguageStrategyArtifact | null => {
  const transpiled = transpileStrategySource(input.source)
  if (!transpiled.ok) {
    return null
  }
  const bytes = utf8Bytes(transpiled.code)
  return {
    format: "transpiled-javascript",
    hash: hashBytes(bytes),
    bytes: bytes.byteLength,
    bytesBase64: Buffer.from(bytes).toString("base64"),
    sourceHash: input.validation.sourceHash,
    sourceBytes: input.validation.sourceBytes,
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    validationStatus: input.validation.valid ? "valid" : "invalid",
    createdAt: "deterministic-typescript-transpile-v1.33",
    toolchain: {
      language: "typescript",
      runtime: "typescript-transpileModule",
      runtimeVersion: ts.version,
      commandSummary: "ts.transpileModule isolatedModules CommonJS ES2022",
      validationPolicy: "runtime-js-validation-v1.33",
    },
    publicEvidence: {
      label: "Transpiled JavaScript artifact provenance",
      nonCounted: false,
      sandboxClaim: "provenance-only",
    },
  }
}

export const buildTypeScriptSourceArtifactV117 = (input: {
  source: string
  validation: StrategyRevisionValidationReport
  runtime: StrategyRuntimeMetadata
}): SourceLanguageStrategyArtifactV117 | null => {
  const current = buildTypeScriptSourceArtifact(input)
  if (current === null) return null
  return {
    ...current,
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION_V1_17,
    sourceIdentity: buildTypeScriptSourceIdentityV117(input.source),
    createdAt: "deterministic-typescript-transpile-v1.17",
    toolchain: {
      ...current.toolchain,
      validationPolicy: "runtime-js-validation-v1.17",
    },
  }
}
