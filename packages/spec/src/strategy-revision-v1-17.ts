import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { z } from "zod"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE } from "./integrity-authority.js"
import { StrategyRevisionSchema } from "./schemas.js"
import type {
  CompiledStrategyArtifact,
  SourceLanguageStrategyArtifact,
  StrategyRevision,
  StrategyRevisionMetadata,
} from "./types.js"
import type { StrategyRuntimeMetadata } from "./runtime.js"
import { STRATEGY_RUNTIME_ABI_VERSION } from "./versions.js"

export const STRATEGY_RUNTIME_ABI_VERSION_V1_17 =
  "strategy-runtime-abi-v1.17" as const
export const STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17 =
  "runtime-provider-validation-v1.17" as const

export interface StrategyProviderValidationInputV117 {
  providerId: string
  contractVersion: typeof STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17
  sourceHash: string
  sourceBytes: number
  artifactHash: string
  artifactBytes: number
}

export const hashStrategyProviderValidationV117 = (
  input: StrategyProviderValidationInputV117,
): `sha256:${string}` =>
  `sha256:${createHash("sha256")
    .update("cowards-game:strategy-provider-validation:v1.17\0", "utf8")
    .update(JSON.stringify(input), "utf8")
    .digest("hex")}`

export type StrategyRuntimeMetadataV117 = Omit<
  StrategyRuntimeMetadata,
  "abiVersion"
> & {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION_V1_17
}

export type SourceLanguageStrategyArtifactV117 = Omit<
  SourceLanguageStrategyArtifact,
  "abiVersion"
> & {
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION_V1_17
}

export type CompiledStrategyArtifactV117 = Omit<
  CompiledStrategyArtifact,
  "abiEnvelope" | "abiVersion"
> & {
  abiEnvelope: "stdin-canonical-request-stdout-raw-canonical-payload"
  abiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION_V1_17
  sourceIdentity: NonNullable<SourceLanguageStrategyArtifact["sourceIdentity"]>
}

export type StrategyRevisionMetadataV117 = Omit<
  StrategyRevisionMetadata,
  "compiledArtifact" | "providerValidation" | "sourceArtifact"
> & {
  providerValidation: NonNullable<
    StrategyRevisionMetadata["providerValidation"]
  >
  sourceArtifact?: SourceLanguageStrategyArtifactV117 | undefined
  compiledArtifact?: CompiledStrategyArtifactV117 | undefined
}

export type StrategyRevisionV117 = Omit<
  StrategyRevision,
  "runtime" | "metadata"
> & {
  runtime: StrategyRuntimeMetadataV117
  metadata: StrategyRevisionMetadataV117
}

export type SourceLanguageStrategyRevisionV117 = Omit<
  StrategyRevisionV117,
  "metadata"
> & {
  metadata: StrategyRevisionMetadataV117 & {
    sourceArtifact: SourceLanguageStrategyArtifactV117
    compiledArtifact?: undefined
  }
}

export type CompiledStrategyRevisionV117 = Omit<
  StrategyRevisionV117,
  "metadata"
> & {
  metadata: StrategyRevisionMetadataV117 & {
    sourceArtifact?: undefined
    compiledArtifact: CompiledStrategyArtifactV117
  }
}

const toCurrentSchemaShape = (
  revision: StrategyRevisionV117,
): StrategyRevision => {
  const { compiledArtifact, sourceArtifact, ...compatibleMetadata } =
    revision.metadata
  return {
    ...revision,
    runtime: {
      ...revision.runtime,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    },
    metadata: {
      ...compatibleMetadata,
      ...(sourceArtifact === undefined
        ? {}
        : {
            sourceArtifact: {
              ...sourceArtifact,
              abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
            },
          }),
      ...(compiledArtifact === undefined
        ? {}
        : {
            compiledArtifact: {
              ...compiledArtifact,
              sourceHash: revision.sourceHash,
              abiEnvelope: "stdin-stdout-json" as const,
              abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
            },
          }),
    },
  }
}

const sha256Hex = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const sourceIdentityFor = (source: string) => {
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
  const kind =
    present === 0
      ? "none"
      : present > 1
        ? "mixed"
        : lf > 0
          ? "lf"
          : crlf > 0
            ? "crlf"
            : "cr"
  const normalized = source.replace(/\r\n?/gu, "\n")
  const originalBytes = Buffer.from(source, "utf8")
  const normalizedBytes = Buffer.from(normalized, "utf8")
  return {
    identityVersion: "strategy-source-identity-v2" as const,
    normalizationPolicy: "source-line-endings-lf-v1.17" as const,
    originalSourceSha256: `sha256:${hashCanonicalIdentity("originalSource", [
      originalBytes,
    ])}`,
    originalSourceBytes: originalBytes.byteLength,
    normalizedSourceSha256: `sha256:${hashCanonicalIdentity(
      "normalizedSource",
      [normalizedBytes],
    )}`,
    normalizedSourceBytes: normalizedBytes.byteLength,
    lineEndings: { kind, lf, crlf, cr },
    hasFinalNewline: source.endsWith("\n") || source.endsWith("\r"),
  }
}

const exactSourceIdentityMatches = (
  actual: NonNullable<SourceLanguageStrategyArtifact["sourceIdentity"]>,
  expected: ReturnType<typeof sourceIdentityFor>,
): boolean =>
  Object.keys(actual).length === 8 &&
  Object.keys(actual.lineEndings).length === 4 &&
  actual.identityVersion === expected.identityVersion &&
  actual.normalizationPolicy === expected.normalizationPolicy &&
  actual.originalSourceSha256 === expected.originalSourceSha256 &&
  actual.originalSourceBytes === expected.originalSourceBytes &&
  actual.normalizedSourceSha256 === expected.normalizedSourceSha256 &&
  actual.normalizedSourceBytes === expected.normalizedSourceBytes &&
  actual.lineEndings.kind === expected.lineEndings.kind &&
  actual.lineEndings.lf === expected.lineEndings.lf &&
  actual.lineEndings.crlf === expected.lineEndings.crlf &&
  actual.lineEndings.cr === expected.lineEndings.cr &&
  actual.hasFinalNewline === expected.hasFinalNewline

const artifactBytes = (
  artifact: SourceLanguageStrategyArtifactV117 | CompiledStrategyArtifactV117,
): Buffer | undefined => {
  if (artifact.bytesBase64 === undefined) return undefined
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  return bytes.toString("base64") === artifact.bytesBase64 &&
    bytes.byteLength === artifact.bytes &&
    sha256Hex(bytes) === artifact.hash
    ? bytes
    : undefined
}

const expectedProvider = (language: string): string | undefined =>
  language === "typescript"
    ? "strategy-language-provider-js-ts"
    : language === "python"
      ? "strategy-language-provider-python"
      : language === "rust"
        ? "strategy-language-provider-rust-wasi"
        : language === "zig"
          ? "strategy-language-provider-zig-wasi"
          : undefined

/**
 * Candidate-only revision admission. This is intentionally separate from the
 * public StrategyRevisionSchema so preparing v1.17 evidence cannot activate
 * v1.17 submissions or defaults before the atomic pointer changes.
 */
export const StrategyRevisionV117Schema = z.custom<StrategyRevisionV117>(
  (input) => {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      return false
    }
    const revision = input as StrategyRevisionV117
    const sourceArtifact = revision.metadata?.sourceArtifact
    const compiledArtifact = revision.metadata?.compiledArtifact
    const language = revision.runtime?.language?.id
    const isWasmWasi =
      revision.runtime?.adapter?.id === "runtime-wasm-wasi-wasmtime-preview1"
    const artifact = isWasmWasi ? compiledArtifact : sourceArtifact
    const validation = revision.metadata?.providerValidation
    const expectedIdentity = sourceIdentityFor(revision.source ?? "")
    const expectedProviderId = expectedProvider(language)
    const bytes = artifact === undefined ? undefined : artifactBytes(artifact)
    const expectedAdapter =
      language === "typescript"
        ? "runtime-js-worker-thread"
        : language === "python"
          ? "runtime-python-subprocess-experimental"
          : language === "rust" || language === "zig"
            ? "runtime-wasm-wasi-wasmtime-preview1"
            : undefined
    const expectedEntrypoint = isWasmWasi ? "_start" : "default"
    if (
      typeof revision.source !== "string" ||
      revision.source.length === 0 ||
      revision.sourceHash !== sha256Hex(Buffer.from(revision.source, "utf8")) ||
      revision.sourceBytes !== Buffer.byteLength(revision.source, "utf8") ||
      revision.validation?.valid !== true ||
      revision.validation.sourceHash !== revision.sourceHash ||
      revision.validation.sourceBytes !== revision.sourceBytes ||
      revision.engineCompatibility?.spec !==
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules ||
      revision.engineCompatibility.engine !==
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine ||
      revision.validation.engineCompatibility.spec !==
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules ||
      revision.validation.engineCompatibility.engine !==
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine ||
      revision.runtime?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17 ||
      revision.runtime.adapter?.id !== expectedAdapter ||
      revision.runtime.package?.mode !== "none" ||
      revision.runtime.package.entrypoint !== expectedEntrypoint ||
      revision.runtime.requiredCapabilities?.length !== 0 ||
      revision.runtime.limits?.environment !== "empty" ||
      revision.runtime.limits.filesystem !== "none" ||
      revision.runtime.limits.network !== "disabled" ||
      revision.runtime.limits.shell !== "disabled" ||
      revision.runtime.limits.packagePolicy !== "none" ||
      expectedProviderId === undefined ||
      artifact === undefined ||
      bytes === undefined ||
      artifact?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17 ||
      artifact.validationStatus !== "valid" ||
      (isWasmWasi
        ? sourceArtifact !== undefined ||
          compiledArtifact?.abiEnvelope !==
            "stdin-canonical-request-stdout-raw-canonical-payload" ||
          compiledArtifact.sourceIdentity === undefined
        : compiledArtifact !== undefined || sourceArtifact === undefined) ||
      validation === undefined ||
      validation.contractVersion !==
        STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17 ||
      validation.providerId !== expectedProviderId ||
      validation.sourceHash !== revision.sourceHash ||
      validation.sourceBytes !== revision.sourceBytes ||
      validation.artifactHash !== artifact.hash ||
      validation.artifactBytes !== artifact.bytes ||
      validation.proof !==
        hashStrategyProviderValidationV117({
          providerId: validation.providerId,
          contractVersion: validation.contractVersion,
          sourceHash: validation.sourceHash,
          sourceBytes: validation.sourceBytes,
          artifactHash: validation.artifactHash,
          artifactBytes: validation.artifactBytes,
        }) ||
      revision.validation.runtimeVersion !== revision.runtime.adapter.version ||
      revision.validation.engineCompatibility.spec !==
        revision.engineCompatibility.spec ||
      revision.validation.engineCompatibility.engine !==
        revision.engineCompatibility.engine
    ) {
      return false
    }
    if (isWasmWasi) {
      const expectedTarget =
        language === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
      if (
        (language !== "rust" && language !== "zig") ||
        compiledArtifact === undefined ||
        compiledArtifact.targetTriple !== expectedTarget ||
        compiledArtifact.wasiProfile !== "preview1" ||
        compiledArtifact.toolchain.language !== language ||
        compiledArtifact.toolchain.targetTriple !== expectedTarget ||
        compiledArtifact.sourceHash !==
          expectedIdentity.normalizedSourceSha256 ||
        !exactSourceIdentityMatches(
          compiledArtifact.sourceIdentity,
          expectedIdentity,
        )
      ) {
        return false
      }
    } else {
      if (
        (language !== "typescript" && language !== "python") ||
        sourceArtifact === undefined ||
        sourceArtifact.format !==
          (language === "python"
            ? "python-source-bundle"
            : "transpiled-javascript") ||
        sourceArtifact.sourceHash !== revision.sourceHash ||
        sourceArtifact.sourceBytes !== revision.sourceBytes ||
        sourceArtifact.toolchain.language !== language ||
        (language === "python" &&
          !bytes.equals(
            Buffer.from(revision.source.replace(/\r\n?/gu, "\n"), "utf8"),
          )) ||
        sourceArtifact.sourceIdentity === undefined ||
        !exactSourceIdentityMatches(
          sourceArtifact.sourceIdentity,
          expectedIdentity,
        )
      ) {
        return false
      }
    }
    // The current schema is used only as a secondary structural check after
    // every successor-only identity and artifact invariant above is proved.
    return StrategyRevisionSchema.safeParse(toCurrentSchemaShape(revision))
      .success
  },
  { error: "v1.17 candidate Strategy Revision is invalid" },
)
