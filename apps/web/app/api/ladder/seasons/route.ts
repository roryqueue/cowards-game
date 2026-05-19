import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const body = (await request.json()) as Record<string, unknown>
    const result = await competitiveServer.createTrialLadderSeason(user, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      seasonSeed: body.seasonSeed,
    })
    return Response.json(result, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
