import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  WORKSHOP_CHECKER_VALIDATION_POLICY,
  createWorkshopCheckerResponse,
  createWorkshopCheckerUnavailableResponse,
  getSupportedStrategyLanguageBySourceFormat,
  isWorkshopCheckerSourceFormat,
  type StrategyRevisionMetadata,
  type StrategyRevisionValidationReport,
  type WorkshopCheckerResponse,
  type WorkshopCheckerSourceFormat,
} from "@cowards/spec"
import type { WorkshopErrorResponse } from "../../../workshop/types.js"

interface RuntimeServiceValidationResponse {
  ok?: unknown
  kind?: unknown
  sourceFormat?: unknown
  provider?: {
    id?: string | undefined
    contractVersion?: string | undefined
    runtimeAbiVersion?: string | undefined
    abiPosture?: string | undefined
  } | null
  validation?: unknown
  metadata?: unknown
  error?: unknown
}

interface WorkshopValidateResponse {
  checker: WorkshopCheckerResponse
  validation: StrategyRevisionValidationReport
}

const CHECKER_CACHE_TTL_MS = 15_000
const checkerCache = new Map<
  string,
  { expiresAt: number; response: WorkshopValidateResponse }
>()
const inFlightChecks = new Map<string, Promise<WorkshopValidateResponse>>()

const hashSource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

const sourceBytes = (source: string): number => Buffer.byteLength(source)

const checkerCacheKey = (
  sourceFormat: WorkshopCheckerSourceFormat,
  source: string,
): string => {
  const language =
    getSupportedStrategyLanguageBySourceFormat(sourceFormat) ?? null
  return [
    "workshop-checker-v1.34",
    sourceFormat,
    language?.providerId ?? sourceFormat,
    hashSource(source),
    String(sourceBytes(source)),
    language?.providerId ?? sourceFormat,
    WORKSHOP_CHECKER_VALIDATION_POLICY,
  ].join(":")
}

const isValidationReport = (
  value: unknown,
): value is StrategyRevisionValidationReport => {
  if (value === null || typeof value !== "object") {
    return false
  }
  const candidate = value as Partial<StrategyRevisionValidationReport>
  return (
    typeof candidate.valid === "boolean" &&
    Array.isArray(candidate.errors) &&
    Array.isArray(candidate.warnings) &&
    typeof candidate.sourceBytes === "number" &&
    Array.isArray(candidate.forbiddenPatterns) &&
    typeof candidate.sourceHash === "string" &&
    typeof candidate.runtimeVersion === "string" &&
    candidate.engineCompatibility !== undefined
  )
}

const publicReasonFor = (
  sourceFormat: WorkshopCheckerSourceFormat,
  status: "runtime_service_unavailable" | "system_unavailable",
): string => {
  const label =
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.label ??
    sourceFormat
  if (status === "runtime_service_unavailable") {
    return `${label} checker could not reach runtime-service. The Strategy has not been judged invalid.`
  }
  return `${label} checker could not complete because runtime-service returned an unsupported response.`
}

const unavailableResponse = (
  sourceFormat: WorkshopCheckerSourceFormat,
  source: string,
  status: "runtime_service_unavailable" | "system_unavailable",
  reason = publicReasonFor(sourceFormat, status),
): WorkshopValidateResponse => {
  const checker = createWorkshopCheckerUnavailableResponse({
    sourceFormat,
    sourceHash: hashSource(source),
    sourceBytes: sourceBytes(source),
    status,
    reason,
  })
  return {
    checker,
    validation: {
      valid: false,
      errors: checker.diagnostics.map((diagnostic) => ({
        code:
          status === "runtime_service_unavailable"
            ? "TRANSPILE_FAILED"
            : "ENGINE_INCOMPATIBLE",
        severity: "error",
        message: diagnostic.message,
        constraint: diagnostic.constraint ?? undefined,
        remediation: diagnostic.remediation ?? undefined,
        reference: diagnostic.reference ?? undefined,
      })),
      warnings: [],
      sourceBytes: checker.source.bytes,
      forbiddenPatterns: [],
      sourceHash: checker.source.hash,
      runtimeVersion: "runtime-service-unavailable",
      engineCompatibility: {
        spec: "cowards-rules-v1.4",
        engine: "engine-v1",
      },
    },
  }
}

const normalizeRuntimeServiceResponse = (
  sourceFormat: WorkshopCheckerSourceFormat,
  source: string,
  result: RuntimeServiceValidationResponse,
): WorkshopValidateResponse => {
  if (
    result.kind !== "strategyValidation" ||
    result.sourceFormat !== sourceFormat
  ) {
    return unavailableResponse(sourceFormat, source, "system_unavailable")
  }
  if (!isValidationReport(result.validation)) {
    return unavailableResponse(sourceFormat, source, "system_unavailable")
  }
  if (
    result.validation.sourceHash !== hashSource(source) ||
    result.validation.sourceBytes !== sourceBytes(source)
  ) {
    return unavailableResponse(sourceFormat, source, "system_unavailable")
  }
  const checker = createWorkshopCheckerResponse({
    sourceFormat,
    validation: result.validation,
    metadata:
      result.metadata && typeof result.metadata === "object"
        ? (result.metadata as StrategyRevisionMetadata)
        : null,
    provider: result.provider ?? null,
    runtimeServiceAvailability: "available",
  })
  return {
    checker,
    validation: result.validation,
  }
}

const runtimeServiceValidateStrategy = async (
  sourceFormat: WorkshopCheckerSourceFormat,
  source: string,
): Promise<WorkshopValidateResponse> => {
  const endpoint = process.env.COWARDS_RUNTIME_SERVICE_URL?.replace(/\/$/, "")
  if (!endpoint) {
    return unavailableResponse(
      sourceFormat,
      source,
      "runtime_service_unavailable",
    )
  }
  let response: globalThis.Response
  try {
    response = await fetch(`${endpoint}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceFormat, source }),
    })
  } catch {
    return unavailableResponse(
      sourceFormat,
      source,
      "runtime_service_unavailable",
    )
  }
  let result: RuntimeServiceValidationResponse
  try {
    result = (await response.json()) as RuntimeServiceValidationResponse
  } catch {
    return unavailableResponse(sourceFormat, source, "system_unavailable")
  }
  return normalizeRuntimeServiceResponse(sourceFormat, source, result)
}

const validateWithCache = (
  sourceFormat: WorkshopCheckerSourceFormat,
  source: string,
): Promise<WorkshopValidateResponse> => {
  const key = checkerCacheKey(sourceFormat, source)
  const now = Date.now()
  const cached = checkerCache.get(key)
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response)
  }
  const inFlight = inFlightChecks.get(key)
  if (inFlight) {
    return inFlight
  }
  const promise = runtimeServiceValidateStrategy(sourceFormat, source)
    .then((response) => {
      checkerCache.set(key, {
        expiresAt: Date.now() + CHECKER_CACHE_TTL_MS,
        response,
      })
      return response
    })
    .finally(() => {
      inFlightChecks.delete(key)
    })
  inFlightChecks.set(key, promise)
  return promise
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string") {
    return Response.json(
      { error: "source is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  if (
    body.sourceFormat !== undefined &&
    !isWorkshopCheckerSourceFormat(body.sourceFormat)
  ) {
    return Response.json(
      { error: "unsupported sourceFormat" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  const sourceFormat = body.sourceFormat ?? "typescript"
  const response = await validateWithCache(sourceFormat, body.source)
  return Response.json(response)
}
