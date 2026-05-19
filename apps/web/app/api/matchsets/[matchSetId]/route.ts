import type { MatchSetId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchSetId: string }> | { matchSetId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    const result = await competitiveServer.getMatchSetResult(
      decodeURIComponent(params.matchSetId) as MatchSetId,
      await getCurrentCompetitiveUser(),
    )
    if (!result) {
      return Response.json({ error: "MatchSet not found." }, { status: 404 })
    }
    return Response.json(result)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
