import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> | { seasonId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const { seasonId } = await params
    const result = await competitiveServer.scheduleTrialLadderSeason(
      user,
      decodeURIComponent(seasonId),
    )
    return Response.json(result)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
