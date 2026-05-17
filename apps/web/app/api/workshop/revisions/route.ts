import { workshopServer } from "../../../workshop/server.js"
import type {
  WorkshopErrorResponse,
  WorkshopSubmitRequest,
} from "../../../workshop/types.js"

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

  let response: Awaited<ReturnType<typeof workshopServer.submitSource>>
  try {
    response = await workshopServer.submitSource({
      source: body.source,
      ...(typeof body.label === "string" ? { label: body.label } : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    } satisfies WorkshopSubmitRequest)
  } catch {
    return Response.json(
      {
        error: "Storage is unavailable; start local services and retry.",
      } satisfies WorkshopErrorResponse,
      { status: 503 },
    )
  }

  return Response.json(response, { status: response.ok ? 201 : 422 })
}
