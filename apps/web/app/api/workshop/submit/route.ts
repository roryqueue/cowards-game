import type {
  WorkshopErrorResponse,
  WorkshopSubmitRequest,
} from "../../../workshop/types.js"
import { workshopServer } from "../../../workshop/server.js"

const readSubmitRequest = async (
  request: Request,
): Promise<WorkshopSubmitRequest | WorkshopErrorResponse> => {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string" || body.source.length === 0) {
    return { error: "source is required" }
  }
  return {
    source: body.source,
    ...(typeof body.label === "string" ? { label: body.label } : {}),
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await readSubmitRequest(request)
  if ("error" in body) {
    return Response.json(body, { status: 400 })
  }

  const response = await workshopServer.submitSource(body)
  return Response.json(response, { status: response.ok ? 201 : 422 })
}
