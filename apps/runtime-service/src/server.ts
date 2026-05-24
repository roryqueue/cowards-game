import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import {
  RuntimeExecutionServiceResponseSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  type RuntimeExecutionServiceResponse,
} from "@cowards/spec"
import {
  createRuntimeServiceConfig,
  type RuntimeServiceConfig,
} from "./runtime-config.js"
import { executeRuntimeServiceRequest } from "./execute-match.js"

const DEFAULT_BODY_LIMIT_BYTES = 512 * 1024

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
        runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        adapter: runtimeConfig.metadata.id,
      })
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
            ? error.message
            : "Runtime execution request was malformed.",
        ),
      )
    }
  }
}

export const createRuntimeExecutionHttpServer = (
  options: RuntimeExecutionHttpServerOptions = {},
) => createServer(createRuntimeExecutionHttpHandler(options))
