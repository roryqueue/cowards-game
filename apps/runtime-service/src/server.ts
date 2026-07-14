import { Buffer } from "node:buffer"
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import { createHmac, timingSafeEqual } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
  RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME,
  RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RuntimeExecutionServiceResponseSchema,
  SoldierBrainResultSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyResultSchema,
  admitCanonicalJsonBytes,
  getStrategyLanguageProviderRecord,
  verifyRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationMethodV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeExecutionServiceResponse,
} from "@cowards/spec"
import {
  buildZigStrategyRevision,
  buildRustStrategyRevision,
  validateZigStrategySource,
  validateRustStrategySource,
} from "@cowards/runtime-wasm-wasi/validation"
import {
  buildPythonStrategyRevision,
  validatePythonStrategySource,
} from "@cowards/runtime-python/validation"
import {
  buildStrategyRevision,
  validateStrategySource,
} from "@cowards/runtime-js"
import type { RuntimeServiceConfig } from "./runtime-config.js"
import { runtimeServiceConfigFromEnvironment } from "./production-runtime-config.js"
import { executeRuntimeServiceRequest } from "./execute-match.js"
import { redactedErrorMessage } from "./redaction.js"
import type { RuntimeEvidenceAuthorityLoader } from "./runtime-evidence-authority.js"

const DEFAULT_BODY_LIMIT_BYTES = 8 * 1024 * 1024
const PRIVATE_ARTIFACT_TOKEN_HEADER = "x-cowards-private-artifact-token"

export interface RuntimeExecutionHttpServerOptions {
  runtimeConfig?: RuntimeServiceConfig | undefined
  bodyLimitBytes?: number | undefined
  privateArtifactToken?: string | undefined
  authorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
}

const writeJson = (
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void => {
  response.statusCode = statusCode
  response.setHeader("content-type", "application/json; charset=utf-8")
  response.end(JSON.stringify(payload))
}

export const readBodyBytes = async (
  request: IncomingMessage,
  limitBytes: number,
): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = []
  let receivedBytes = 0
  for await (const chunk of request) {
    const bytes = Buffer.from(chunk)
    receivedBytes += bytes.byteLength
    if (receivedBytes > limitBytes) {
      throw new Error("Runtime execution request body exceeds service limit.")
    }
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, receivedBytes)
}

export const readBody = async (
  request: IncomingMessage,
  limitBytes: number,
): Promise<string> => {
  const bytes = await readBodyBytes(request, limitBytes)
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    throw new Error("Runtime execution request body is not valid UTF-8.")
  }
}

export const admitRuntimeInvocationRequestBytesV117 = (
  bytes: Uint8Array,
  identity: RuntimeInvocationSigningIdentityV117,
) => verifyRuntimeInvocationRequestV117(bytes, identity)

export type RuntimeStrategyPayloadAdmissionV117 =
  | Readonly<{
      kind: "success"
      value: JsonValue
      canonicalSha256: `sha256:${string}`
      canonicalByteLength: number
    }>
  | Readonly<{
      kind: "player_violation"
      violation: typeof RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT
      canonicalError?: Readonly<{
        code: string
        byteOffset: number
        owner: "player_violation"
      }>
    }>

export const admitStrategyPayloadBytesV117 = (
  bytes: Uint8Array,
  method: RuntimeInvocationMethodV117,
): RuntimeStrategyPayloadAdmissionV117 => {
  const admitted = admitCanonicalJsonBytes(bytes, {
    profile: "strategy-payload",
  })
  if (!admitted.ok) {
    return {
      kind: "player_violation",
      violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
      canonicalError: {
        code: admitted.error.code,
        byteOffset: admitted.error.byteOffset,
        owner: "player_violation",
      },
    }
  }
  const schema = method === "selectActivations"
    ? StrategyResultSchema
    : SoldierBrainResultSchema
  const parsed = schema.safeParse(admitted.value)
  if (!parsed.success) {
    return {
      kind: "player_violation",
      violation: RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
    }
  }
  return {
    kind: "success",
    value: parsed.data as JsonValue,
    canonicalSha256: admitted.canonicalSha256,
    canonicalByteLength: admitted.canonicalByteLength,
  }
}

const malformedRequestResponse = (
  message: string,
): RuntimeExecutionServiceResponse =>
  RuntimeExecutionServiceResponseSchema.parse({
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
    ok: false,
    kind: "systemFailure",
    requestId: "runtime-request:unknown",
    runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    systemFailure: {
      code: "MALFORMED_REQUEST",
      message,
      publicMessage: "Runtime execution failed before completion.",
      retryable: false,
      diagnostics: {
        reason: "http-request-invalid",
      },
    },
  }) as RuntimeExecutionServiceResponse

const providerValidationSecret = (): string =>
  process.env.COWARDS_PROVIDER_VALIDATION_SECRET?.trim() ?? ""

const privateArtifactToken = (configured?: string | undefined): string =>
  configured?.trim() ??
  process.env.COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN?.trim() ??
  ""

const privateArtifactRequestAuthorized = (
  request: IncomingMessage,
  token: string,
): boolean => {
  if (!token) {
    return false
  }
  const rawHeader = request.headers[PRIVATE_ARTIFACT_TOKEN_HEADER]
  const presented = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
  if (!presented) {
    return false
  }
  const expectedBytes = Buffer.from(token)
  const presentedBytes = Buffer.from(presented)
  return (
    expectedBytes.byteLength === presentedBytes.byteLength &&
    timingSafeEqual(expectedBytes, presentedBytes)
  )
}

const providerValidationProof = (input: {
  providerId: string
  contractVersion: string
  sourceHash: string
  sourceBytes: number
  artifactHash?: string | undefined
  artifactBytes?: number | undefined
}): string => {
  const secret = providerValidationSecret()
  if (!secret) {
    throw new Error("Provider validation signing secret is not configured.")
  }
  const payload = [
    input.providerId,
    input.contractVersion,
    input.sourceHash,
    String(input.sourceBytes),
    input.artifactHash ?? "",
    input.artifactBytes === undefined ? "" : String(input.artifactBytes),
  ].join("\n")
  return `hmac-sha256:${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`
}

const publicValidationMetadata = (
  metadata: Record<string, unknown>,
): Record<string, unknown> => {
  const redactArtifactBytes = (artifact: unknown): unknown => {
    if (artifact === null || typeof artifact !== "object") {
      return artifact
    }
    const { bytesBase64: _bytesBase64, ...publicArtifact } = artifact as Record<
      string,
      unknown
    >
    return publicArtifact
  }

  return {
    ...metadata,
    ...(metadata.sourceArtifact === undefined
      ? {}
      : { sourceArtifact: redactArtifactBytes(metadata.sourceArtifact) }),
    ...(metadata.compiledArtifact === undefined
      ? {}
      : { compiledArtifact: redactArtifactBytes(metadata.compiledArtifact) }),
  }
}

const validateStrategyRequest = (
  rawRequest: unknown,
  options: { includePrivateArtifact?: boolean } = {},
) => {
  const body =
    rawRequest !== null && typeof rawRequest === "object"
      ? (rawRequest as Record<string, unknown>)
      : {}
  if (
    (body.sourceFormat !== "typescript" &&
      body.sourceFormat !== "python" &&
      body.sourceFormat !== "rust" &&
      body.sourceFormat !== "zig") ||
    typeof body.source !== "string"
  ) {
    return {
      ok: false,
      kind: "strategyValidation",
      sourceFormat: body.sourceFormat,
      error:
        "TypeScript, Python, Rust, or Zig source is required for runtime-service provider validation.",
    }
  }
  const sourceFormat = body.sourceFormat
  const provider = getStrategyLanguageProviderRecord(sourceFormat)
  const validation =
    sourceFormat === "typescript"
      ? validateStrategySource(body.source)
      : sourceFormat === "python"
        ? validatePythonStrategySource(body.source)
        : sourceFormat === "zig"
          ? validateZigStrategySource(body.source)
          : validateRustStrategySource(body.source)
  if (!validation.valid) {
    return {
      ok: false,
      kind: "strategyValidation",
      sourceFormat,
      validation,
    }
  }
  const revisionBuilder =
    sourceFormat === "typescript"
      ? buildStrategyRevision
      : sourceFormat === "python"
        ? buildPythonStrategyRevision
        : sourceFormat === "zig"
          ? buildZigStrategyRevision
          : buildRustStrategyRevision
  const revision = revisionBuilder({
    source: body.source,
    ...(typeof body.strategyId === "string" && body.strategyId.trim().length > 0
      ? { strategyId: body.strategyId }
      : {}),
    metadata: {
      tags:
        sourceFormat === "typescript"
          ? ["typescript", "artifact-proven", "counted", "provider"]
          : sourceFormat === "python"
            ? ["python", "counted", "provider"]
            : [sourceFormat, "wasm-wasi", "counted", "provider"],
    },
  })
  const contractVersion =
    provider?.contractVersion ?? "strategy-language-provider-contract-v1.33"
  const artifact =
    sourceFormat === "rust" || sourceFormat === "zig"
      ? revision.metadata.compiledArtifact
      : revision.metadata.sourceArtifact
  const providerId =
    sourceFormat === "typescript"
      ? "strategy-language-provider-js-ts"
      : sourceFormat === "python"
        ? "strategy-language-provider-python"
        : sourceFormat === "rust"
          ? "strategy-language-provider-rust-wasi"
          : sourceFormat === "zig"
            ? "strategy-language-provider-zig-wasi"
            : null
  const metadata =
    providerId === null
      ? revision.metadata
      : {
          ...revision.metadata,
          tags:
            sourceFormat === "typescript"
              ? ["typescript", "artifact-proven", "counted", "provider"]
              : sourceFormat === "python"
                ? ["python", "counted", "provider"]
                : [sourceFormat, "wasm-wasi", "counted", "provider"],
          providerValidation: {
            providerId,
            contractVersion,
            sourceHash: validation.sourceHash,
            sourceBytes: validation.sourceBytes,
            ...(artifact === undefined
              ? {}
              : {
                  artifactHash: artifact.hash,
                  artifactBytes: artifact.bytes,
                }),
            proof: providerValidationProof({
              providerId,
              contractVersion,
              sourceHash: validation.sourceHash,
              sourceBytes: validation.sourceBytes,
              artifactHash: artifact?.hash,
              artifactBytes: artifact?.bytes,
            }),
          },
        }
  const responseMetadata =
    options.includePrivateArtifact === true
      ? metadata
      : publicValidationMetadata(metadata as Record<string, unknown>)
  return {
    ok: true,
    kind: "strategyValidation",
    sourceFormat,
    provider: provider
      ? {
          id: provider.id,
          contractVersion: provider.contractVersion,
          runtimeAbiVersion: provider.runtimeAbiVersion,
          abiPosture: provider.abiPosture,
        }
      : null,
    runtime: revision.runtime,
    validation: revision.validation,
    engineCompatibility: revision.engineCompatibility,
    metadata: responseMetadata,
    sourceHash: revision.sourceHash,
    sourceBytes: revision.sourceBytes,
  }
}

export const createRuntimeExecutionHttpHandler = (
  options: RuntimeExecutionHttpServerOptions = {},
) => {
  const runtimeConfig =
    options.runtimeConfig ?? runtimeServiceConfigFromEnvironment()
  const bodyLimitBytes = options.bodyLimitBytes ?? DEFAULT_BODY_LIMIT_BYTES
  const configuredPrivateArtifactToken = privateArtifactToken(
    options.privateArtifactToken,
  )

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, {
        ok: true,
        service: RUNTIME_EXECUTION_SERVICE_VERSION,
        boundaryName: RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME,
        implementationLabel: RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
        transportBinding: RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING.current,
        backendAuthority: false,
        runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        adapter: runtimeConfig.metadata.id,
      })
      return
    }

    if (request.method === "POST" && request.url === "/validate-strategy") {
      try {
        const body = await readBody(request, bodyLimitBytes)
        const rawRequest = JSON.parse(body) as unknown
        const requestBody =
          rawRequest !== null && typeof rawRequest === "object"
            ? (rawRequest as Record<string, unknown>)
            : {}
        const includePrivateArtifact =
          requestBody.includePrivateArtifact === true
        if (
          includePrivateArtifact &&
          !privateArtifactRequestAuthorized(
            request,
            configuredPrivateArtifactToken,
          )
        ) {
          writeJson(response, 403, {
            ok: false,
            kind: "strategyValidation",
            ...(typeof requestBody.sourceFormat === "string"
              ? { sourceFormat: requestBody.sourceFormat }
              : {}),
            error: "Private artifact validation evidence is not available.",
          })
          return
        }
        const result = validateStrategyRequest(rawRequest, {
          includePrivateArtifact,
        })
        writeJson(response, result.ok ? 200 : 422, result)
      } catch (error) {
        writeJson(response, 400, {
          ok: false,
          kind: "strategyValidation",
          error:
            error instanceof Error
              ? redactedErrorMessage(error)
              : "Strategy validation request was malformed.",
        })
      }
      return
    }

    if (request.method !== "POST" || request.url !== "/execute-match") {
      writeJson(response, 404, { ok: false, error: "not_found" })
      return
    }

    try {
      const body = await readBody(request, bodyLimitBytes)
      const rawRequest = JSON.parse(body) as unknown
      const result = executeRuntimeServiceRequest(rawRequest, runtimeConfig, {
        authorityLoader: options.authorityLoader,
      })
      writeJson(response, result.ok ? 200 : 422, result)
    } catch (error) {
      writeJson(
        response,
        400,
        malformedRequestResponse(
          error instanceof Error
            ? redactedErrorMessage(error)
            : "Runtime execution request was malformed.",
        ),
      )
    }
  }
}

export const createRuntimeExecutionHttpServer = (
  options: RuntimeExecutionHttpServerOptions = {},
) => createServer(createRuntimeExecutionHttpHandler(options))
