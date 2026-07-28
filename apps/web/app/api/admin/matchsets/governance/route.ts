import { CompetitionGovernanceGroupRequestBodySchema } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../competitive/http.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const parsed = CompetitionGovernanceGroupRequestBodySchema.safeParse(
      await request.json(),
    )
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid governance action." },
        { status: 422 },
      )
    }
    await competitiveServer.applyCompetitionGovernanceAction(user, parsed.data)
    return Response.json({ ok: true, matchSetIds: parsed.data.matchSetIds })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
