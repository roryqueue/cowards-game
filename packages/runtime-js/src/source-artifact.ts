import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import * as ts from "typescript"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  type SourceLanguageStrategyArtifact,
  type StrategyRevisionValidationReport,
  type StrategyRuntimeMetadata,
} from "@cowards/spec"
import { transpileStrategySource } from "./transpile.js"

const hashBytes = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const utf8Bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

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
