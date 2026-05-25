import { workshopServer } from "../../../workshop/server.js"
import { isStorageUnavailableError } from "../../../workshop/server.js"
import type {
  WorkshopErrorResponse,
  WorkshopSubmitRequest,
} from "../../../workshop/types.js"

const runtimeServiceValidateRust = async (
  source: string,
): Promise<Partial<WorkshopSubmitRequest> | { error: string }> => {
  const endpoint = process.env.COWARDS_RUNTIME_SERVICE_URL?.replace(/\/$/, "")
  if (!endpoint) {
    return {
      error: "Rust WASM/WASI submission requires runtime-service validation.",
    }
  }
  const response = await fetch(`${endpoint}/validate-strategy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceFormat: "rust", source }),
  })
  const result = (await response.json()) as Record<string, unknown>
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
    body.sourceFormat !== "rust"
  ) {
    return Response.json(
      { error: "unsupported sourceFormat" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  const sourceFormat = body.sourceFormat ?? "typescript"
  const runtimeValidation =
    sourceFormat === "rust" ? await runtimeServiceValidateRust(body.source) : {}
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
