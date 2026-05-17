import type { WorkshopErrorResponse } from "../../../workshop/types.js"
import { workshopServer } from "../../../workshop/server.js"

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string") {
    return Response.json(
      { error: "source is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  return Response.json({
    validation: workshopServer.validateSource(body.source),
  })
}
