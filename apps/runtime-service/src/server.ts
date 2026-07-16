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
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_VERSION_V1_16,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  RuntimeExecutionServiceResponseSchema,
  SoldierBrainResultV117Schema,
  STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION_V1_17,
  StrategyResultV117Schema,
  admitCanonicalJsonBytes,
  encodeCanonicalJson,
  getStrategyLanguageProviderRecord,
  hashStrategyProviderValidationV117,
  verifyRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationMethodV117,
  type RuntimeInvocationSigningIdentityV117,
  type RuntimeExecutionServiceResponse,
} from "@cowards/spec"
import {
  buildZigStrategyRevision,
  buildZigStrategyRevisionV117,
  buildRustStrategyRevision,
  buildRustStrategyRevisionV117,
  validateZigStrategySource,
  validateRustStrategySource,
} from "@cowards/runtime-wasm-wasi/validation"
import {
  buildPythonStrategyRevision,
  buildPythonStrategyRevisionV117,
  validatePythonStrategySource,
} from "@cowards/runtime-python/validation"
import {
  buildStrategyRevision,
  buildStrategyRevisionV117,
  validateStrategySource,
} from "@cowards/runtime-js"
import type { RuntimeServiceConfig } from "./runtime-config.js"
import { runtimeServiceConfigFromEnvironment } from "./production-runtime-config.js"
import {
  createPreparedRuntimeServiceDependenciesV117,
  executePreparedRuntimeServiceRequestV117,
  executeRuntimeServiceRequest,
  failPreparedRuntimeServiceRequestV117,
  type PreparedRuntimeInvocationAdapterV117,
} from "./execute-match.js"
import { redactedErrorMessage } from "./redaction.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  RuntimeEvidenceAuthorityLoaderV117,
} from "./runtime-evidence-authority.js"

const DEFAULT_BODY_LIMIT_BYTES = 8 * 1024 * 1024
const PRIVATE_ARTIFACT_TOKEN_HEADER = "x-cowards-private-artifact-token"

export interface RuntimeExecutionHttpServerOptions {
  runtimeConfig?: RuntimeServiceConfig | undefined
  bodyLimitBytes?: number | undefined
  privateArtifactToken?: string | undefined
  authorityLoader?: RuntimeEvidenceAuthorityLoader | undefined
  authorityLoaderV117?: RuntimeEvidenceAuthorityLoaderV117 | undefined
  signingIdentityV117?: RuntimeInvocationSigningIdentityV117 | undefined
  candidateInvocationAdapterV117?:
    | PreparedRuntimeInvocationAdapterV117
    | undefined
}

export interface RuntimeStrategyValidationHttpHandlerOptions {
  bodyLimitBytes?: number | undefined
  privateArtifactToken?: string | undefined
  selectedRuntimeAbiVersion?: string | undefined
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

const writeCanonicalJsonV117 = (
  response: ServerResponse,
  statusCode: number,
  payload: JsonValue,
): void => {
  const encoded = encodeCanonicalJson(payload, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new Error(
      "Runtime service v1.17 response could not be canonicalized.",
    )
  }
  response.statusCode = statusCode
  response.setHeader("content-type", "application/json; charset=utf-8")
  response.end(Buffer.from(encoded.bytes))
}

const quotedStringEnd = (text: string, start: number): number | undefined => {
  let escaped = false
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index]!
    if (escaped) {
      escaped = false
    } else if (character === "\\") {
      escaped = true
    } else if (character === '"') {
      return index
    }
  }
  return undefined
}

const skipWhitespace = (text: string, start: number): number => {
  let index = start
  while (index < text.length) {
    const code = text.charCodeAt(index)
    if (code !== 0x09 && code !== 0x0a && code !== 0x0d && code !== 0x20) {
      break
    }
    index += 1
  }
  return index
}

/**
 * Detect the top-level successor contract without parsing or normalizing the
 * body. This deliberately notices either occurrence of a duplicated contract
 * key, so duplicate-key attacks enter canonical admission and fail there.
 */
export const claimsRuntimeExecutionServiceV117 = (
  bytes: Uint8Array,
): boolean => {
  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return false
  }
  let objectDepth = 0
  let arrayDepth = 0
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!
    if (character === '"') {
      const end = quotedStringEnd(text, index)
      if (end === undefined) return false
      if (objectDepth === 1 && arrayDepth === 0) {
        const afterKey = skipWhitespace(text, end + 1)
        if (text[afterKey] === ":") {
          let key: unknown
          try {
            key = JSON.parse(text.slice(index, end + 1))
          } catch {
            return false
          }
          const valueStart = skipWhitespace(text, afterKey + 1)
          if (key === "contractVersion" && text[valueStart] === '"') {
            const valueEnd = quotedStringEnd(text, valueStart)
            if (valueEnd === undefined) return false
            let value: unknown
            try {
              value = JSON.parse(text.slice(valueStart, valueEnd + 1))
            } catch {
              return false
            }
            if (value === RUNTIME_EXECUTION_SERVICE_VERSION_V1_17) return true
          }
        }
      }
      index = end
      continue
    }
    if (character === "{") objectDepth += 1
    else if (character === "}") objectDepth -= 1
    else if (character === "[") arrayDepth += 1
    else if (character === "]") arrayDepth -= 1
  }
  return false
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
  const schema =
    method === "selectActivations"
      ? StrategyResultV117Schema
      : SoldierBrainResultV117Schema
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
    contractVersion: HISTORICAL_RUNTIME_EXECUTION_SERVICE_VERSION_V1_16,
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
  if (input.contractVersion === STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17) {
    if (input.artifactHash === undefined || input.artifactBytes === undefined) {
      throw new Error(
        "Runtime provider validation v1.17 requires exact artifact identity.",
      )
    }
    return hashStrategyProviderValidationV117({
      providerId: input.providerId,
      contractVersion: STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17,
      sourceHash: input.sourceHash,
      sourceBytes: input.sourceBytes,
      artifactHash: input.artifactHash,
      artifactBytes: input.artifactBytes,
    })
  }
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
    const {
      bytesBase64: _bytesBase64,
      sourceIdentity: _sourceIdentity,
      ...publicArtifact
    } = artifact as Record<string, unknown>
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
  options: {
    includePrivateArtifact?: boolean
    selectedRuntimeAbiVersion?: string
  } = {},
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
  const revisionInput = {
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
  }
  const useV117Provider =
    (options.selectedRuntimeAbiVersion ??
      String(STRATEGY_RUNTIME_ABI_VERSION)) ===
    STRATEGY_RUNTIME_ABI_VERSION_V1_17
  const revision = useV117Provider
    ? sourceFormat === "typescript"
      ? buildStrategyRevisionV117(revisionInput)
      : sourceFormat === "python"
        ? buildPythonStrategyRevisionV117(revisionInput)
        : sourceFormat === "zig"
          ? buildZigStrategyRevisionV117(revisionInput)
          : buildRustStrategyRevisionV117(revisionInput)
    : sourceFormat === "typescript"
      ? buildStrategyRevision(revisionInput)
      : sourceFormat === "python"
        ? buildPythonStrategyRevision(revisionInput)
        : sourceFormat === "zig"
          ? buildZigStrategyRevision(revisionInput)
          : buildRustStrategyRevision(revisionInput)
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
  if (
    provider === null ||
    providerId === null ||
    provider.id !== providerId ||
    String(provider.runtimeAbiVersion) !==
      String(revision.runtime.abiVersion) ||
    (useV117Provider
      ? String(provider.contractVersion) !==
          STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17 ||
        revision.runtime.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION_V1_17
      : String(provider.contractVersion) ===
        STRATEGY_PROVIDER_VALIDATION_CONTRACT_V1_17)
  ) {
    throw new Error(
      "Runtime provider validation v1.17 authority is not selected atomically.",
    )
  }
  const metadata = useV117Provider
    ? revision.metadata
    : providerId === null
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

const handleRuntimeStrategyValidationRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
  options: {
    bodyLimitBytes: number
    privateArtifactToken: string | undefined
    selectedRuntimeAbiVersion: string | undefined
  },
): Promise<void> => {
  try {
    const body = await readBody(request, options.bodyLimitBytes)
    const rawRequest = JSON.parse(body) as unknown
    const requestBody =
      rawRequest !== null && typeof rawRequest === "object"
        ? (rawRequest as Record<string, unknown>)
        : {}
    const includePrivateArtifact = requestBody.includePrivateArtifact === true
    if (
      includePrivateArtifact &&
      !privateArtifactRequestAuthorized(
        request,
        privateArtifactToken(options.privateArtifactToken),
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
      ...(options.selectedRuntimeAbiVersion === undefined
        ? {}
        : { selectedRuntimeAbiVersion: options.selectedRuntimeAbiVersion }),
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
}

export const createRuntimeStrategyValidationHttpHandler = (
  options: RuntimeStrategyValidationHttpHandlerOptions = {},
) =>
  async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (request.method !== "POST" || request.url !== "/validate-strategy") {
      writeJson(response, 404, { ok: false, error: "not_found" })
      return
    }
    await handleRuntimeStrategyValidationRequest(request, response, {
      bodyLimitBytes: options.bodyLimitBytes ?? DEFAULT_BODY_LIMIT_BYTES,
      privateArtifactToken: options.privateArtifactToken,
      selectedRuntimeAbiVersion: options.selectedRuntimeAbiVersion,
    })
  }

export const createRuntimeExecutionHttpHandler = (
  options: RuntimeExecutionHttpServerOptions = {},
) => {
  const runtimeConfig =
    options.runtimeConfig ?? runtimeServiceConfigFromEnvironment()
  const bodyLimitBytes = options.bodyLimitBytes ?? DEFAULT_BODY_LIMIT_BYTES
  const preparedV117Dependencies =
    options.authorityLoaderV117 === undefined
      ? undefined
      : createPreparedRuntimeServiceDependenciesV117({
          runtimeConfig,
          authorityLoader: options.authorityLoaderV117,
          currentAuthorityLoader: options.authorityLoader,
          signingIdentity: options.signingIdentityV117,
          candidateInvocationAdapter: options.candidateInvocationAdapterV117,
        })

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, {
        ok: true,
        service: runtimeConfig.contractSelection.runtimeServiceVersion,
        boundaryName: RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME,
        implementationLabel: RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
        transportBinding: RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING.current,
        backendAuthority: false,
        runtimeAbiVersion: runtimeConfig.contractSelection.runtimeAbiVersion,
        adapter: runtimeConfig.metadata.id,
      })
      return
    }

    if (request.method === "POST" && request.url === "/validate-strategy") {
      await handleRuntimeStrategyValidationRequest(request, response, {
        bodyLimitBytes,
        privateArtifactToken: options.privateArtifactToken,
        selectedRuntimeAbiVersion:
          runtimeConfig.contractSelection.runtimeAbiVersion,
      })
      return
    }

    if (request.method !== "POST" || request.url !== "/execute-match") {
      writeJson(response, 404, { ok: false, error: "not_found" })
      return
    }

    try {
      const bodyBytes = await readBodyBytes(request, bodyLimitBytes)
      if (claimsRuntimeExecutionServiceV117(bodyBytes)) {
        const admitted = admitCanonicalJsonBytes(bodyBytes, {
          profile: "authenticated-envelope",
        })
        if (!admitted.ok) {
          writeCanonicalJsonV117(
            response,
            400,
            failPreparedRuntimeServiceRequestV117({
              rawRequest: undefined,
              code: "MALFORMED_REQUEST",
              ownership: "system_integrity",
              retryable: false,
            }) as unknown as JsonValue,
          )
          return
        }
        if (
          runtimeConfig.contractSelection.runtimeServiceVersion !==
          RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
        ) {
          writeCanonicalJsonV117(
            response,
            422,
            failPreparedRuntimeServiceRequestV117({
              rawRequest: admitted.value,
              code: "CONTRACT_INACTIVE",
              ownership: "system_integrity",
              retryable: false,
            }) as unknown as JsonValue,
          )
          return
        }
        const dependencies = preparedV117Dependencies
        const result =
          dependencies === undefined
            ? failPreparedRuntimeServiceRequestV117({
                rawRequest: admitted.value,
                code: "V117_ROUTE_UNAVAILABLE",
                ownership: "system_operation",
                retryable: true,
              })
            : executePreparedRuntimeServiceRequestV117(
                admitted.value,
                runtimeConfig,
                dependencies,
              )
        writeCanonicalJsonV117(
          response,
          result.ok ? 200 : 422,
          result as unknown as JsonValue,
        )
        return
      }
      const body = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes)
      const rawRequest = JSON.parse(body) as unknown
      if (
        runtimeConfig.contractSelection.runtimeServiceVersion !==
        HISTORICAL_RUNTIME_EXECUTION_SERVICE_VERSION_V1_16
      ) {
        writeCanonicalJsonV117(
          response,
          422,
          failPreparedRuntimeServiceRequestV117({
            rawRequest,
            code: "CONTRACT_INACTIVE",
            ownership: "system_integrity",
            retryable: false,
          }) as unknown as JsonValue,
        )
        return
      }
      const result = executeRuntimeServiceRequest(rawRequest, runtimeConfig, {
        authorityLoader: options.authorityLoader,
      })
      writeJson(response, result.ok ? 200 : 422, result)
    } catch (error) {
      if (
        runtimeConfig.contractSelection.runtimeServiceVersion ===
        RUNTIME_EXECUTION_SERVICE_VERSION_V1_17
      ) {
        writeCanonicalJsonV117(
          response,
          400,
          failPreparedRuntimeServiceRequestV117({
            rawRequest: undefined,
            code: "MALFORMED_REQUEST",
            ownership: "system_integrity",
            retryable: false,
          }) as unknown as JsonValue,
        )
      } else {
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
}

export const createRuntimeExecutionHttpServer = (
  options: RuntimeExecutionHttpServerOptions = {},
) => createServer(createRuntimeExecutionHttpHandler(options))
