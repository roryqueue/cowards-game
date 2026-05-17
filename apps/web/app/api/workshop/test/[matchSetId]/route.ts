import type { MatchSetId } from "@cowards/spec"
import type { WorkshopErrorResponse } from "../../../../workshop/types.js"
import { workshopServer } from "../../../../workshop/server.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchSetId: string }> | { matchSetId: string } },
): Promise<Response> {
  const params = await context.params
  const summary = await workshopServer.getTestSummary(
    params.matchSetId as MatchSetId,
  )
  if (summary === null) {
    return Response.json(
      { error: "Match set not found" } satisfies WorkshopErrorResponse,
      { status: 404 },
    )
  }

  return Response.json(summary)
}
