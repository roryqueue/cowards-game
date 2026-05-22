import type { MatchId } from "@cowards/spec"
import { competitiveErrorResponse } from "../../../../competitive/http.js"
import { matchReplayServer } from "../../../../matches/server.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> | { matchId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    const metadata = await matchReplayServer.getPublicReplayMetadata(
      decodeURIComponent(params.matchId) as MatchId,
    )
    if (!metadata) {
      return Response.json(
        { error: "Replay metadata not found." },
        { status: 404 },
      )
    }
    return Response.json(metadata)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
