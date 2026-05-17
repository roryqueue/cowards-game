import type { StrategyRevisionId } from "@cowards/spec"
import { workshopServer } from "../../../../../workshop/server.js"
import type {
  WorkshopErrorResponse,
  WorkshopSourceResponse,
} from "../../../../../workshop/types.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> | { revisionId: string } },
): Promise<Response> {
  const params = await context.params
  const source = await workshopServer.getRevisionSource(
    params.revisionId as StrategyRevisionId,
  )
  if (source === null) {
    return Response.json(
      { error: "Revision source not found" } satisfies WorkshopErrorResponse,
      { status: 404 },
    )
  }

  return Response.json({
    revisionId: params.revisionId,
    source,
  } satisfies WorkshopSourceResponse)
}
