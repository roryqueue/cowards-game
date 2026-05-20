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
    const revision = await competitiveServer.forkAdvancedStrategy(user, {
      advancedId: body.advancedId,
    })
    return Response.json({ ok: true, revision }, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
