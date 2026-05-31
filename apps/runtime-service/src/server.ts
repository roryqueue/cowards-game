import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import { createHmac } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
  RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME,
  RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING,
  RuntimeExecutionServiceResponseSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  getStrategyLanguageProviderRecord,
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
  createRuntimeServiceConfig,
  type RuntimeServiceConfig,
} from "./runtime-config.js"
import { executeRuntimeServiceRequest } from "./execute-match.js"
import { redactedErrorMessage } from "./redaction.js"

const DEFAULT_BODY_LIMIT_BYTES = 8 * 1024 * 1024

export interface RuntimeExecutionHttpServerOptions {
  runtimeConfig?: RuntimeServiceConfig | undefined
  bodyLimitBytes?: number | undefined
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

const readBody = async (
  request: IncomingMessage,
  limitBytes: number,
): Promise<string> => {
  let body = ""
  for await (const chunk of request) {
    body += chunk
    if (new TextEncoder().encode(body).length > limitBytes) {
      throw new Error("Runtime execution request body exceeds service limit.")
    }
  }
  return body
}

const malformedRequestResponse = (
  message: string,
): RuntimeExecutionServiceResponse =>
  RuntimeExecutionServiceResponseSchema.parse({
    contractVersion: "runtime-execution-service-v1.15",
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

const validateStrategyRequest = (rawRequest: unknown) => {
  const body =
    rawRequest !== null && typeof rawRequest === "object"
      ? (rawRequest as Record<string, unknown>)
      : {}
  if (
    (body.sourceFormat !== "python" &&
      body.sourceFormat !== "rust" &&
      body.sourceFormat !== "zig") ||
    typeof body.source !== "string"
  ) {
    return {
      ok: false,
      kind: "strategyValidation",
      sourceFormat: body.sourceFormat,
      error:
        "Python, Rust, or Zig source is required for runtime-service provider validation.",
    }
  }
  const sourceFormat = body.sourceFormat
  const provider = getStrategyLanguageProviderRecord(sourceFormat)
  const validation =
    sourceFormat === "python"
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
    sourceFormat === "python"
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
        sourceFormat === "python"
          ? ["python", "counted", "provider"]
          : [sourceFormat, "wasm-wasi", "counted", "provider"],
    },
  })
  const contractVersion =
    provider?.contractVersion ?? "strategy-language-provider-contract-v1.32"
  const artifact =
    sourceFormat === "rust" || sourceFormat === "zig"
      ? revision.metadata.compiledArtifact
      : undefined
  const providerId =
    sourceFormat === "python"
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
            sourceFormat === "python"
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
    metadata,
    sourceHash: revision.sourceHash,
    sourceBytes: revision.sourceBytes,
  }
}

export const createRuntimeExecutionHttpHandler = (
  options: RuntimeExecutionHttpServerOptions = {},
) => {
  const runtimeConfig =
    options.runtimeConfig ??
    createRuntimeServiceConfig({
      strategyExecutionAdapter: process.env.STRATEGY_EXECUTION_ADAPTER,
      allowLocalWorkerThreadFallback:
        process.env.COWARDS_RUNTIME_SERVICE_ALLOW_LOCAL_WORKER_THREAD === "1",
    })
  const bodyLimitBytes = options.bodyLimitBytes ?? DEFAULT_BODY_LIMIT_BYTES

  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, {
        ok: true,
        service: "runtime-execution-service-v1.15",
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
        const result = validateStrategyRequest(rawRequest)
        writeJson(response, result.ok ? 200 : 422, result)
      } catch (error) {
        writeJson(response, 400, {
          ok: false,
          kind: "strategyValidation",
          error:
            error instanceof Error
              ? error.message
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
      const result = executeRuntimeServiceRequest(rawRequest, runtimeConfig)
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
