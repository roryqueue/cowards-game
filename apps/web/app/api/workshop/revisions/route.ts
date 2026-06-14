import { getSupportedStrategyLanguageBySourceFormat } from "@cowards/spec"
import { workshopServer } from "../../../workshop/server.js"
import { isStorageUnavailableError } from "../../../workshop/server.js"
import type {
  WorkshopErrorResponse,
  WorkshopSubmitRequest,
} from "../../../workshop/types.js"

const runtimeServiceSubmitError = (
  sourceFormat: "typescript" | "python" | "rust" | "zig",
): string => {
  const label =
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.label ??
    "Strategy"
  return `${label} submission could not reach runtime-service provider validation. The Strategy has not been judged invalid.`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const runtimeServiceValidateStrategy = async (
  sourceFormat: "typescript" | "python" | "rust" | "zig",
  source: string,
): Promise<Partial<WorkshopSubmitRequest> | { error: string }> => {
  const endpoint = process.env.COWARDS_RUNTIME_SERVICE_URL?.replace(/\/$/, "")
  if (!endpoint) {
    return {
      error: runtimeServiceSubmitError(sourceFormat),
    }
  }
  let response: globalThis.Response
  try {
    response = await fetch(`${endpoint}/validate-strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceFormat, source }),
    })
  } catch {
    return { error: runtimeServiceSubmitError(sourceFormat) }
  }
  let result: Record<string, unknown>
  try {
    const parsed = await response.json()
    if (!isRecord(parsed)) {
      return {
        error:
          "Strategy submission could not complete because runtime-service returned an unsupported response.",
      }
    }
    result = parsed
  } catch {
    return {
      error:
        "Strategy submission could not complete because runtime-service returned an unsupported response.",
    }
  }
  if (!response.ok || result.ok !== true) {
    return {
      validation: result.validation as WorkshopSubmitRequest["validation"],
    }
  }
  return {
    runtime: result.runtime as WorkshopSubmitRequest["runtime"],
    validation: result.validation as WorkshopSubmitRequest["validation"],
    engineCompatibility:
      result.engineCompatibility as WorkshopSubmitRequest["engineCompatibility"],
    metadata: result.metadata as WorkshopSubmitRequest["metadata"],
    runtimeServiceValidated: true,
  }
}

export async function GET(): Promise<Response> {
  const data = await workshopServer.getInitialData()
  return Response.json({ revisions: data.revisions })
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string" || body.source.length === 0) {
    return Response.json(
      { error: "source is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  if (
    body.sourceFormat !== undefined &&
    body.sourceFormat !== "typescript" &&
    body.sourceFormat !== "python" &&
    body.sourceFormat !== "rust" &&
    body.sourceFormat !== "zig"
  ) {
    return Response.json(
      { error: "unsupported sourceFormat" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  const sourceFormat = body.sourceFormat ?? "typescript"
  const runtimeValidation =
    sourceFormat === "typescript" ||
    sourceFormat === "python" ||
    sourceFormat === "rust" ||
    sourceFormat === "zig"
      ? await runtimeServiceValidateStrategy(sourceFormat, body.source)
      : {}
  if ("error" in runtimeValidation) {
    return Response.json(
      { error: runtimeValidation.error } satisfies WorkshopErrorResponse,
      { status: 503 },
    )
  }

  let response: Awaited<ReturnType<typeof workshopServer.submitSource>>
  try {
    response = await workshopServer.submitSource({
      source: body.source,
      sourceFormat,
      ...runtimeValidation,
      ...(typeof body.label === "string" ? { label: body.label } : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    } satisfies WorkshopSubmitRequest)
  } catch (error) {
    if (!isStorageUnavailableError(error)) {
      return Response.json(
        {
          error: "Strategy Revision could not be saved.",
        } satisfies WorkshopErrorResponse,
        { status: 500 },
      )
    }
    return Response.json(
      {
        error: "Storage is unavailable; start local services and retry.",
      } satisfies WorkshopErrorResponse,
      { status: 503 },
    )
  }

  return Response.json(response, { status: response.ok ? 201 : 422 })
}
