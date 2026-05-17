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

  const response = await workshopServer.submitSource({
    source: body.source,
    ...(typeof body.label === "string" ? { label: body.label } : {}),
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
  } satisfies WorkshopSubmitRequest)

  return Response.json(response, { status: response.ok ? 201 : 422 })
}
