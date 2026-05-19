import type { StrategyRevisionId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> | { revisionId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const params = await context.params
    const source = await competitiveServer.getAccountRevisionSource(
      user,
      decodeURIComponent(params.revisionId) as StrategyRevisionId,
    )
    if (source === null) {
      return Response.json(
        { error: "StrategyRevision not found." },
        { status: 404 },
      )
    }
    return new Response(source, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
      },
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
