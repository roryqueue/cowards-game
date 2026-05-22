import type { MatchSetId } from "@cowards/spec"
import { competitiveErrorResponse } from "../../../competitive/http.js"
import { getPublicMatchSetResult } from "../../../../lib/public-service-boundary.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchSetId: string }> | { matchSetId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    const result = await getPublicMatchSetResult(
      params.matchSetId as MatchSetId,
    )
    if (!result) {
      return Response.json({ error: "MatchSet not found." }, { status: 404 })
    }
    return Response.json(result)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
