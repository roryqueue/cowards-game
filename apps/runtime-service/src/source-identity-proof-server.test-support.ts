import { createServer, type Server, type ServerResponse } from "node:http"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { STRATEGY_RUNTIME_ABI_VERSION } from "@cowards/spec"
import { createRuntimeStrategyValidationHttpHandler } from "./server.js"

export const PHASE258_SOURCE_IDENTITY_PROOF_HOST = "127.0.0.1" as const
export const PHASE258_SOURCE_IDENTITY_PROOF_PORT = 3107 as const

const proofEnvironmentValue = (
  environment: Record<string, string | undefined>,
  key: string,
): string => {
  const value = environment[key]?.trim()
  if (!value) throw new Error(`Phase 258 proof configuration missing ${key}.`)
  return value
}

const writeProofJson = (
  response: ServerResponse,
  statusCode: number,
  value: unknown,
): void => {
  response.statusCode = statusCode
  response.setHeader("content-type", "application/json; charset=utf-8")
  response.setHeader("x-cowards-proof-only", "phase258-source-identity")
  response.end(JSON.stringify(value))
}

export const createPhase258SourceIdentityProofRuntimeService = (
  environment: Record<string, string | undefined> = process.env,
): Server => {
  if (environment.COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER !== "1") {
    throw new Error("Phase 258 proof-only runtime service guard is disabled.")
  }
  proofEnvironmentValue(environment, "COWARDS_PROVIDER_VALIDATION_SECRET")
  const privateArtifactToken = proofEnvironmentValue(
    environment,
    "COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN",
  )
  const validationHandler = createRuntimeStrategyValidationHttpHandler({
    privateArtifactToken,
    selectedRuntimeAbiVersion: String(STRATEGY_RUNTIME_ABI_VERSION),
  })

  return createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      writeProofJson(response, 200, {
        ok: true,
        service: "phase258-source-identity-validation-proof",
        proofOnly: true,
        executionAvailable: false,
      })
      return
    }
    if (request.method === "POST" && request.url === "/validate-strategy") {
      response.setHeader("x-cowards-proof-only", "phase258-source-identity")
      void validationHandler(request, response)
      return
    }
    writeProofJson(response, 404, {
      ok: false,
      error: "proof_route_unavailable",
    })
  })
}

export const startPhase258SourceIdentityProofRuntimeService = (
  environment: Record<string, string | undefined> = process.env,
): Server => {
  const server = createPhase258SourceIdentityProofRuntimeService(environment)
  server.listen(
    PHASE258_SOURCE_IDENTITY_PROOF_PORT,
    PHASE258_SOURCE_IDENTITY_PROOF_HOST,
    () => {
      console.log(
        `Phase 258 proof-only validation service listening on ${PHASE258_SOURCE_IDENTITY_PROOF_HOST}:${PHASE258_SOURCE_IDENTITY_PROOF_PORT}; execution unavailable`,
      )
    },
  )
  return server
}

const directEntrypoint =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (directEntrypoint) {
  try {
    const server = startPhase258SourceIdentityProofRuntimeService()
    const shutdown = () => server.close(() => process.exit(0))
    process.once("SIGINT", shutdown)
    process.once("SIGTERM", shutdown)
  } catch {
    console.error("Phase 258 proof-only validation service unavailable.")
    process.exitCode = 1
  }
}
