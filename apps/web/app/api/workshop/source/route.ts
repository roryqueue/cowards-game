import type { StrategyRevisionId } from "@cowards/spec"
import type {
  WorkshopErrorResponse,
  WorkshopSourceResponse,
} from "../../../workshop/types.js"
import { workshopServer } from "../../../workshop/server.js"

export async function GET(request: Request): Promise<Response> {
  const revisionId = new URL(request.url).searchParams.get("revisionId")
  if (!revisionId) {
    return Response.json(
      { error: "revisionId is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  const source = await workshopServer.getRevisionSource(
    revisionId as StrategyRevisionId,
  )
  if (source === null) {
    return Response.json(
      { error: "Revision source not found" } satisfies WorkshopErrorResponse,
      { status: 404 },
    )
  }

  return Response.json({
    revisionId,
    source,
  } satisfies WorkshopSourceResponse)
}
